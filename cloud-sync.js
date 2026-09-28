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
    const redirectTo=location.origin+location.pathname+'?auth=confirmed';
    const {data,error}=await sb.auth.signUp({
      email:String(email||'').trim(),
      password:String(password||''),
      options:{emailRedirectTo:redirectTo}
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
})();
