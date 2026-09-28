(function(){
  const SUPABASE_URL='https://npkekrjzebsjfaizfcyb.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_q7AqCGH0aa17PqDGsWafXA_0fIppITC';
  const SUPABASE_MODULE='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.0/+esm';
  const TABLE='language_studio_saved_vocab';
  const META_KEY='languageStudio:accountVocabSync:v2';

  const listeners=new Set();
  let client=null;
  let session=null;
  let channel=null;
  let initPromise=null;
  let ready=false;
  let realtimeState='idle';
  let syncPromise=null;
  let realtimeRefreshTimer=null;

  let meta=loadMeta();

  function loadMeta(){
    try{
      const raw=JSON.parse(localStorage.getItem(META_KEY)||'{}');
      return {
        lastUserId:String(raw?.lastUserId||''),
        lastError:String(raw?.lastError||''),
        lastSyncAt:raw?.lastSyncAt&&typeof raw.lastSyncAt==='object'?raw.lastSyncAt:{},
        pending:raw?.pending&&typeof raw.pending==='object'?raw.pending:{}
      };
    }catch{
      return {lastUserId:'',lastError:'',lastSyncAt:{},pending:{}};
    }
  }

  function saveMeta(){
    localStorage.setItem(META_KEY,JSON.stringify(meta));
  }

  function currentUser(){
    return session?.user||null;
  }

  function userPending(userId=currentUser()?.id||''){
    if(!userId) return {};
    if(!meta.pending[userId]||typeof meta.pending[userId]!=='object') meta.pending[userId]={};
    return meta.pending[userId];
  }

  function status(){
    const user=currentUser();
    const pending=user?Object.keys(userPending(user.id)).length:0;
    return {
      ready,
      signedIn:!!user,
      userId:user?.id||'',
      email:user?.email||'',
      lastSyncAt:user?Number(meta.lastSyncAt[user.id]||0):0,
      pendingCount:pending,
      lastError:meta.lastError||'',
      realtimeState
    };
  }

  function emit(detail){
    const payload={...detail,status:status()};
    listeners.forEach(listener=>{
      try{listener(payload);}catch(error){console.error(error);}
    });
  }

  function onChange(listener){
    if(typeof listener!=='function') return ()=>{};
    listeners.add(listener);
    return ()=>listeners.delete(listener);
  }

  function cleanPayload(item){
    const savedAt=Number(item?.savedAt);
    return {
      key:String(item?.key||'').slice(0,240),
      term:String(item?.term||'').slice(0,180),
      speechText:String(item?.speechText||'').slice(0,180),
      ipa:String(item?.ipa||'').slice(0,180),
      meaning:String(item?.meaning||'').slice(0,1200),
      example:String(item?.example||'').slice(0,1600),
      type:String(item?.type||'word').slice(0,32),
      savedAt:Number.isFinite(savedAt)&&savedAt>0?Math.floor(savedAt):Date.now()
    };
  }

  function queuePending(userId,key,op,item){
    if(!userId||!key) return;
    const pending=userPending(userId);
    pending[key]={
      op,
      item:op==='upsert'?cleanPayload(item):null,
      queuedAt:Date.now()
    };
    saveMeta();
  }

  function clearPending(userId,key){
    const pending=userPending(userId);
    if(Object.prototype.hasOwnProperty.call(pending,key)){
      delete pending[key];
      saveMeta();
    }
  }

  async function getClient(){
    if(client) return client;
    const mod=await import(SUPABASE_MODULE);
    client=mod.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true
      },
      realtime:{
        params:{eventsPerSecond:10}
      }
    });
    return client;
  }

  async function pullRaw(){
    const user=currentUser();
    if(!user) return {};
    const sb=await getClient();
    const {data,error}=await sb
      .from(TABLE)
      .select('vocab_key,payload,updated_at')
      .eq('user_id',user.id)
      .order('updated_at',{ascending:false});

    if(error) throw error;

    const saved={};
    (data||[]).forEach(row=>{
      if(!row?.vocab_key||!row?.payload||typeof row.payload!=='object'||Array.isArray(row.payload)) return;
      saved[row.vocab_key]={...row.payload,key:row.vocab_key};
    });
    meta.lastSyncAt[user.id]=Date.now();
    meta.lastError='';
    saveMeta();
    return saved;
  }

  async function flushPending(){
    const user=currentUser();
    if(!user) return;
    const pending={...userPending(user.id)};
    const entries=Object.entries(pending);
    if(!entries.length) return;

    const sb=await getClient();
    for(const [key,task] of entries){
      try{
        if(task?.op==='delete'){
          const {error}=await sb.from(TABLE)
            .delete()
            .eq('user_id',user.id)
            .eq('vocab_key',key);
          if(error) throw error;
        }else{
          const payload=cleanPayload(task?.item||{key});
          const {error}=await sb.from(TABLE).upsert({
            user_id:user.id,
            vocab_key:key,
            payload,
            updated_at:new Date().toISOString()
          },{onConflict:'user_id,vocab_key'});
          if(error) throw error;
        }
        clearPending(user.id,key);
      }catch(error){
        meta.lastError=String(error?.message||error||'Sync failed');
        saveMeta();
        throw error;
      }
    }
  }

  async function directUpsert(item){
    const user=currentUser();
    if(!user||!item?.key) return {cloud:false};
    const payload=cleanPayload(item);
    const sb=await getClient();

    try{
      const {error}=await sb.from(TABLE).upsert({
        user_id:user.id,
        vocab_key:payload.key,
        payload,
        updated_at:new Date().toISOString()
      },{onConflict:'user_id,vocab_key'});
      if(error) throw error;
      clearPending(user.id,payload.key);
      meta.lastSyncAt[user.id]=Date.now();
      meta.lastError='';
      saveMeta();
      return {cloud:true};
    }catch(error){
      queuePending(user.id,payload.key,'upsert',payload);
      meta.lastError=String(error?.message||error||'Sync failed');
      saveMeta();
      return {cloud:false,error};
    }
  }

  async function directDelete(key){
    const user=currentUser();
    key=String(key||'');
    if(!user||!key) return {cloud:false};
    const sb=await getClient();

    try{
      const {error}=await sb.from(TABLE)
        .delete()
        .eq('user_id',user.id)
        .eq('vocab_key',key);
      if(error) throw error;
      clearPending(user.id,key);
      meta.lastSyncAt[user.id]=Date.now();
      meta.lastError='';
      saveMeta();
      return {cloud:true};
    }catch(error){
      queuePending(user.id,key,'delete');
      meta.lastError=String(error?.message||error||'Sync failed');
      saveMeta();
      return {cloud:false,error};
    }
  }

  async function syncAccount(localSaved={}){
    const user=currentUser();
    if(!user) return null;
    if(syncPromise) return syncPromise;

    syncPromise=(async()=>{
      await flushPending().catch(()=>{});
      let remote=await pullRaw();
      const firstLink=meta.lastUserId!==user.id;

      if(firstLink){
        const local=localSaved&&typeof localSaved==='object'?localSaved:{};
        const uploads=[];

        Object.entries(local).forEach(([key,item])=>{
          if(!item||typeof item!=='object') return;
          const localItem=cleanPayload({...item,key});
          const remoteItem=remote[key];
          const remoteSavedAt=Number(remoteItem?.savedAt||0);
          if(!remoteItem||localItem.savedAt>=remoteSavedAt) uploads.push(localItem);
        });

        if(uploads.length){
          const sb=await getClient();
          const rows=uploads.map(item=>({
            user_id:user.id,
            vocab_key:item.key,
            payload:item,
            updated_at:new Date().toISOString()
          }));
          const {error}=await sb.from(TABLE).upsert(rows,{onConflict:'user_id,vocab_key'});
          if(error) throw error;
          remote=await pullRaw();
        }
      }

      meta.lastUserId=user.id;
      meta.lastError='';
      saveMeta();
      return remote;
    })();

    try{
      return await syncPromise;
    }catch(error){
      meta.lastError=String(error?.message||error||'Sync failed');
      saveMeta();
      throw error;
    }finally{
      syncPromise=null;
    }
  }

  async function refreshAndEmit(){
    if(!currentUser()) return;
    try{
      const saved=await pullRaw();
      emit({type:'remote-vocab',saved});
    }catch(error){
      meta.lastError=String(error?.message||error||'Realtime refresh failed');
      saveMeta();
      emit({type:'sync-error',error:meta.lastError});
    }
  }

  function scheduleRealtimeRefresh(){
    clearTimeout(realtimeRefreshTimer);
    realtimeRefreshTimer=setTimeout(refreshAndEmit,120);
  }

  async function stopRealtime(){
    if(!channel||!client){
      channel=null;
      realtimeState='idle';
      return;
    }
    try{await client.removeChannel(channel);}catch{}
    channel=null;
    realtimeState='idle';
  }

  async function startRealtime(){
    const user=currentUser();
    if(!user) return;
    const sb=await getClient();
    await stopRealtime();
    try{await sb.realtime.setAuth();}catch{}

    realtimeState='connecting';
    channel=sb
      .channel('language-studio:vocab:'+user.id,{config:{private:true}})
      .on('broadcast',{event:'INSERT'},scheduleRealtimeRefresh)
      .on('broadcast',{event:'UPDATE'},scheduleRealtimeRefresh)
      .on('broadcast',{event:'DELETE'},scheduleRealtimeRefresh)
      .subscribe((state)=>{
        realtimeState=String(state||'').toLowerCase();
        emit({type:'realtime-status'});
      });
  }

  async function applySession(nextSession,event='SESSION'){
    const before=currentUser()?.id||'';
    session=nextSession||null;
    const after=currentUser()?.id||'';

    if(after){
      await startRealtime();
      emit({type:'auth',event,signedIn:true,user:currentUser()});
    }else{
      await stopRealtime();
      if(before) meta.lastUserId='';
      saveMeta();
      emit({type:'auth',event,signedIn:false,previousUserId:before});
    }
  }

  async function init(){
    if(initPromise) return initPromise;
    initPromise=(async()=>{
      try{
        const sb=await getClient();
        const {data,error}=await sb.auth.getSession();
        if(error) throw error;
        session=data?.session||null;

        sb.auth.onAuthStateChange((event,nextSession)=>{
          setTimeout(()=>applySession(nextSession,event).catch(error=>{
            meta.lastError=String(error?.message||error||'Auth state error');
            saveMeta();
            emit({type:'sync-error',error:meta.lastError});
          }),0);
        });

        ready=true;
        if(session) await startRealtime();
        emit({type:'ready',signedIn:!!currentUser()});
        return status();
      }catch(error){
        ready=true;
        meta.lastError=String(error?.message||error||'Supabase client unavailable');
        saveMeta();
        emit({type:'ready',signedIn:false,error:meta.lastError});
        return status();
      }
    })();
    return initPromise;
  }

  async function signIn(email,password){
    const sb=await getClient();
    const {data,error}=await sb.auth.signInWithPassword({
      email:String(email||'').trim(),
      password:String(password||'')
    });
    if(error) throw error;
    return data;
  }

  async function signUp(email,password){
    const sb=await getClient();
    const {data,error}=await sb.auth.signUp({
      email:String(email||'').trim(),
      password:String(password||'')
    });
    if(error) throw error;
    return {
      ...data,
      needsConfirmation:!data?.session
    };
  }

  async function signOut(){
    const sb=await getClient();
    const {error}=await sb.auth.signOut({scope:'local'});
    if(error) throw error;
    meta.lastUserId='';
    saveMeta();
  }

  let authNotice='';
  let uiTimer=null;

  function escapeHtml(value=''){
    return String(value).replace(/[&<>\"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  }

  function authErrorMessage(error){
    const raw=String(error?.message||error||'').toLowerCase();
    if(raw.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng.';
    if(raw.includes('email not confirmed')) return 'Email chưa được xác nhận. Hãy mở email xác nhận rồi đăng nhập lại.';
    if(raw.includes('user already registered')) return 'Email này đã được đăng ký.';
    if(raw.includes('password')) return 'Mật khẩu chưa đáp ứng yêu cầu bảo mật.';
    if(raw.includes('rate limit')) return 'Có quá nhiều yêu cầu. Hãy thử lại sau một chút.';
    return String(error?.message||'Không thể thực hiện yêu cầu lúc này.');
  }

  function scheduleUiEnhance(){
    clearTimeout(uiTimer);
    uiTimer=setTimeout(enhanceAccountUi,0);
  }

  function accountPanelMarkup(){
    const s=status();
    if(!s.ready){
      return `<div class='account-loading'><span></span><strong>Đang kiểm tra phiên đăng nhập…</strong></div>`;
    }
    if(s.signedIn){
      const synced=s.lastSyncAt?new Date(s.lastSyncAt).toLocaleString('vi-VN'):'Đang đồng bộ lần đầu';
      const live=/subscribed/i.test(s.realtimeState);
      return `
        <div class='account-panel-head'>
          <div class='account-panel-icon'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' aria-hidden='true'><path d='M20 21a8 8 0 0 0-16 0'/><circle cx='12' cy='7' r='4'/></svg></div>
          <div><span class='eyebrow'>ACCOUNT SYNC</span><h2>${escapeHtml(s.email||'Language Studio')}</h2><p>Đã đăng nhập. Mỗi lần Lưu/Xóa từ được ghi trực tiếp lên Supabase.</p></div>
          <span class='account-live-pill ${live?'is-live':'is-connecting'}'>${live?'Realtime đang hoạt động':'Realtime đang kết nối'}</span>
        </div>
        <div class='account-sync-facts'>
          <div><small>Chế độ</small><strong>Tự động</strong></div>
          <div><small>Lần cập nhật</small><strong>${escapeHtml(synced)}</strong></div>
          <div><small>Đang chờ gửi</small><strong>${s.pendingCount}</strong></div>
        </div>
        ${authNotice?`<div class='account-notice'>${escapeHtml(authNotice)}</div>`:''}
        <div class='account-actions'><button id='accountSignOutBtn' class='secondary-button' type='button'>Đăng xuất thiết bị này</button></div>
        <div class='data-note'><b>Đa thiết bị:</b> đăng nhập cùng email và mật khẩu trên PC, điện thoại hoặc tablet. Không cần mã đồng bộ và không cần bấm Đồng bộ.</div>
      `;
    }
    return `
      <div class='section-title-row'><div><span class='eyebrow'>ACCOUNT SYNC</span><h2>Đăng nhập để đồng bộ tự động</h2><p>Không dùng mã đồng bộ. Cùng một tài khoản sẽ dùng chung danh sách Từ đã lưu trên mọi thiết bị.</p></div></div>
      ${authNotice?`<div class='account-notice'>${escapeHtml(authNotice)}</div>`:''}
      <div class='auth-grid'>
        <form id='languageStudioLoginForm' class='auth-card'>
          <div><span class='eyebrow'>WELCOME BACK</span><h3>Đăng nhập</h3><p>Dùng tài khoản đã đăng ký trên thiết bị khác.</p></div>
          <label><span>Email</span><input id='accountLoginEmail' type='email' autocomplete='email' required placeholder='name@example.com'></label>
          <label><span>Mật khẩu</span><input id='accountLoginPassword' type='password' autocomplete='current-password' required minlength='8' placeholder='Ít nhất 8 ký tự'></label>
          <button class='primary-button auth-submit' type='submit'>Đăng nhập</button>
        </form>
        <form id='languageStudioRegisterForm' class='auth-card auth-card-accent'>
          <div><span class='eyebrow'>NEW ACCOUNT</span><h3>Đăng ký</h3><p>Tạo tài khoản một lần để dùng chung dữ liệu trên nhiều thiết bị.</p></div>
          <label><span>Email</span><input id='accountRegisterEmail' type='email' autocomplete='email' required placeholder='name@example.com'></label>
          <label><span>Mật khẩu</span><input id='accountRegisterPassword' type='password' autocomplete='new-password' required minlength='8' placeholder='Ít nhất 8 ký tự'></label>
          <label><span>Nhập lại mật khẩu</span><input id='accountRegisterPassword2' type='password' autocomplete='new-password' required minlength='8' placeholder='Nhập lại mật khẩu'></label>
          <button class='primary-button auth-submit' type='submit'>Đăng ký</button>
          <small class='auth-footnote'>Nếu Supabase yêu cầu xác nhận email, hãy mở email xác nhận rồi quay lại Language Studio để đăng nhập.</small>
        </form>
      </div>
      <div class='data-note'><b>Bảo mật:</b> website chỉ dùng Supabase publishable key. Dữ liệu được khóa bằng Row Level Security theo ID tài khoản; service-role key không nằm trong frontend.</div>
    `;
  }

  function bindAccountPanel(panel){
    const s=status();
    const signOutButton=panel.querySelector('#accountSignOutBtn');
    if(signOutButton){
      signOutButton.onclick=async()=>{
        signOutButton.disabled=true;
        try{
          await signOut();
          authNotice='Đã đăng xuất khỏi thiết bị này.';
          scheduleUiEnhance();
        }catch(error){
          signOutButton.disabled=false;
          authNotice=authErrorMessage(error);
          scheduleUiEnhance();
        }
      };
    }

    const login=panel.querySelector('#languageStudioLoginForm');
    if(login){
      login.onsubmit=async(event)=>{
        event.preventDefault();
        const button=login.querySelector('.auth-submit');
        button.disabled=true;
        button.textContent='Đang đăng nhập…';
        authNotice='';
        try{
          await signIn(panel.querySelector('#accountLoginEmail').value,panel.querySelector('#accountLoginPassword').value);
        }catch(error){
          authNotice=authErrorMessage(error);
          scheduleUiEnhance();
        }
      };
    }

    const register=panel.querySelector('#languageStudioRegisterForm');
    if(register){
      register.onsubmit=async(event)=>{
        event.preventDefault();
        const password=panel.querySelector('#accountRegisterPassword').value;
        const password2=panel.querySelector('#accountRegisterPassword2').value;
        if(password.length<8){authNotice='Mật khẩu cần ít nhất 8 ký tự.';scheduleUiEnhance();return;}
        if(password!==password2){authNotice='Hai lần nhập mật khẩu chưa giống nhau.';scheduleUiEnhance();return;}
        const button=register.querySelector('.auth-submit');
        button.disabled=true;
        button.textContent='Đang tạo tài khoản…';
        authNotice='';
        try{
          const result=await signUp(panel.querySelector('#accountRegisterEmail').value,password);
          authNotice=result?.needsConfirmation
            ? 'Tài khoản đã được tạo. Hãy kiểm tra email xác nhận, sau đó quay lại đăng nhập.'
            : 'Tài khoản đã được tạo và đăng nhập.';
          scheduleUiEnhance();
        }catch(error){
          authNotice=authErrorMessage(error);
          scheduleUiEnhance();
        }
      };
    }
  }

  function enhanceSettings(){
    if((location.hash||'#home').slice(1)!=='settings') return;
    const main=document.querySelector('#mainView');
    if(!main) return;
    const panel=main.querySelector('.vocab-sync-panel, .account-sync-panel');
    if(!panel) return;
    const s=status();
    const signature=['settings',s.ready,s.signedIn,s.email,s.lastSyncAt,s.pendingCount,s.realtimeState,authNotice].join('|');
    if(panel.dataset.accountSignature===signature) return;
    panel.className='book-section account-sync-panel';
    panel.dataset.accountSignature=signature;
    panel.innerHTML=accountPanelMarkup();
    bindAccountPanel(panel);

    const heroText=main.querySelector('.settings-hero p');
    if(heroText) heroText.textContent='Tiến độ học vẫn có local cache để phản hồi nhanh. Từ đã lưu được ghi trực tiếp lên tài khoản Supabase khi bạn đăng nhập.';
    const summaryText=main.querySelector('.data-summary .section-title-row p');
    if(summaryText) summaryText.textContent=s.signedIn?'My Vocabulary: cloud theo tài khoản + local cache. Các phần tiến độ khác vẫn lưu cục bộ.':'My Vocabulary đang lưu cục bộ. Đăng nhập để tự động đồng bộ giữa các thiết bị.';
  }

  function enhanceVocab(){
    if((location.hash||'#home').slice(1)!=='vocab') return;
    const main=document.querySelector('#mainView');
    const strip=main?.querySelector('.vocab-sync-strip');
    if(!strip) return;
    const s=status();
    const live=/subscribed/i.test(s.realtimeState);
    const signature=['vocab',s.ready,s.signedIn,s.email,s.pendingCount,s.realtimeState].join('|');
    if(strip.dataset.accountSignature===signature) return;
    strip.dataset.accountSignature=signature;
    strip.className='vocab-sync-strip '+(s.signedIn?'is-on':'is-off');
    strip.innerHTML=s.signedIn
      ? `<div><strong>Đồng bộ tự động · ${escapeHtml(s.email||'Tài khoản')}</strong><span>${live?'Thiết bị khác đang mở sẽ nhận thay đổi gần như ngay lập tức.':'Cloud đã bật; Realtime đang kết nối lại.'}</span></div><button id='vocabAccountSettings' class='secondary-button' type='button'>Tài khoản</button>`
      : `<div><strong>Từ đang lưu cục bộ trên thiết bị</strong><span>Đăng nhập cùng một tài khoản trên PC và điện thoại để dùng chung danh sách.</span></div><button id='vocabAccountSettings' class='primary-button' type='button'>Đăng nhập / Đăng ký</button>`;
    const button=strip.querySelector('#vocabAccountSettings');
    if(button) button.onclick=()=>{location.hash='#settings';};

    const heroText=main.querySelector('.page-hero p');
    if(heroText) heroText.textContent=s.signedIn?'Chạm một từ trong bài học rồi bấm “Lưu”. Mỗi thay đổi được ghi thẳng lên tài khoản cloud.':'Chạm một từ trong bài học rồi bấm “Lưu”. Bạn có thể lưu cục bộ và đăng nhập để đồng bộ đa thiết bị.';
  }

  function enhanceSidebar(){
    const note=document.querySelector('.side-bottom small');
    if(!note) return;
    const s=status();
    note.textContent=s.signedIn?'Từ vựng đang đồng bộ theo tài khoản.':'Đăng nhập để đồng bộ Từ đã lưu.';
  }

  function enhanceAccountUi(){
    enhanceSettings();
    enhanceVocab();
    enhanceSidebar();
  }

  function installUiBridge(){
    const main=document.querySelector('#mainView');
    if(main){
      new MutationObserver(scheduleUiEnhance).observe(main,{childList:true,subtree:true});
    }
    window.addEventListener('hashchange',scheduleUiEnhance);
    scheduleUiEnhance();
  }

  window.addEventListener('online',()=>{
    if(!currentUser()) return;
    flushPending()
      .then(refreshAndEmit)
      .catch(()=>{});
  });

  window.VocabCloudSync={
    init,
    status,
    onChange,
    signIn,
    signUp,
    signOut,
    syncAccount,
    pull:pullRaw,
    saveWord:directUpsert,
    deleteWord:directDelete,
    flushPending
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installUiBridge,{once:true});
  else installUiBridge();
})();
