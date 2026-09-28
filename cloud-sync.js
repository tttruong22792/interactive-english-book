(function(){
  const STORAGE_KEY='languageStudio:vocabSync:v1';
  const ENDPOINT='https://npkekrjzebsjfaizfcyb.supabase.co/functions/v1/language-studio-vocab-sync';
  const EMPTY={syncKey:'',pending:{},lastSyncAt:0,lastError:''};
  let meta=load();
  let flushPromise=null;

  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return {
        ...EMPTY,
        ...raw,
        pending:raw?.pending&&typeof raw.pending==='object'&&!Array.isArray(raw.pending)?raw.pending:{}
      };
    }catch{
      return {...EMPTY,pending:{}};
    }
  }

  function save(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(meta));
  }

  function normalizeKey(value=''){
    return String(value||'').toLowerCase().replace(/[^a-f0-9]/g,'');
  }

  function formatKey(value=''){
    const key=normalizeKey(value);
    return (key.match(/.{1,8}/g)||[]).join('-');
  }

  function generateKey(){
    const bytes=new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  }

  function isValidKey(value=''){
    return /^[a-f0-9]{40}$/.test(normalizeKey(value));
  }

  function status(){
    return {
      connected:isValidKey(meta.syncKey),
      syncKey:formatKey(meta.syncKey),
      lastSyncAt:Number(meta.lastSyncAt||0),
      pendingCount:Object.keys(meta.pending||{}).length,
      lastError:String(meta.lastError||'')
    };
  }

  async function request(action,payload={}){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(ENDPOINT,{
        method:'POST',
        mode:'cors',
        cache:'no-store',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({action,syncKey:meta.syncKey,...payload}),
        signal:controller.signal
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body?.error||('Sync failed ('+response.status+')'));
      meta.lastError='';
      save();
      return body;
    }catch(error){
      meta.lastError=String(error?.message||error||'Không thể đồng bộ');
      save();
      throw error;
    }finally{
      clearTimeout(timer);
    }
  }

  function enqueue(key,payload,deleted){
    if(!isValidKey(meta.syncKey)||!key) return false;
    const seq=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
    meta.pending[key]={key,payload:deleted?undefined:payload,deleted:!!deleted,seq};
    save();
    return true;
  }

  function queueUpsert(item){
    if(!item?.key) return false;
    const queued=enqueue(String(item.key),{...item,breakdown:undefined},false);
    if(queued) void flush().catch(()=>{});
    return queued;
  }

  function queueDelete(key){
    const queued=enqueue(String(key||''),undefined,true);
    if(queued) void flush().catch(()=>{});
    return queued;
  }

  async function flush(){
    if(!isValidKey(meta.syncKey)) return {ok:false,pushed:0};
    if(flushPromise) return flushPromise;

    flushPromise=(async()=>{
      const snapshot=Object.values(meta.pending||{});
      if(!snapshot.length) return {ok:true,pushed:0};
      const result=await request('push',{
        items:snapshot.map(item=>({
          key:item.key,
          payload:item.payload,
          deleted:item.deleted===true
        }))
      });
      snapshot.forEach(item=>{
        if(meta.pending?.[item.key]?.seq===item.seq) delete meta.pending[item.key];
      });
      meta.lastSyncAt=Date.now();
      save();
      return result;
    })();

    try{
      return await flushPromise;
    }finally{
      flushPromise=null;
    }
  }

  async function pull(){
    if(!isValidKey(meta.syncKey)) return null;
    await flush();
    const result=await request('pull');
    const saved={};
    (result.items||[]).forEach(row=>{
      const payload=row?.payload;
      const key=String(row?.key||payload?.key||'');
      if(!key||!payload||typeof payload!=='object'||Array.isArray(payload)) return;
      saved[key]={...payload,key};
    });
    meta.lastSyncAt=Date.now();
    save();
    return saved;
  }

  async function connect(value='',localSaved={}){
    const key=normalizeKey(value)||generateKey();
    if(!isValidKey(key)) throw new Error('Mã đồng bộ không hợp lệ.');
    meta.syncKey=key;
    meta.lastError='';
    meta.pending=meta.pending&&typeof meta.pending==='object'?meta.pending:{};
    save();

    Object.values(localSaved||{}).forEach(item=>{
      if(item?.key) enqueue(String(item.key),{...item,breakdown:undefined},false);
    });

    await flush();
    const saved=await pull();
    return {syncKey:formatKey(key),saved:saved||{}};
  }

  function disconnect(){
    meta={...EMPTY,pending:{}};
    localStorage.removeItem(STORAGE_KEY);
  }

  window.VocabCloudSync={
    status,
    connect,
    disconnect,
    pull,
    flush,
    queueUpsert,
    queueDelete,
    normalizeKey,
    formatKey,
    isValidKey
  };
})();
