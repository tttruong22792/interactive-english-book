const APP_CACHE='language-studio-v124-content-error-fix-v81';
const AUDIO_CACHE='language-studio-audio-v1';
const CLOUD_AUDIO_PUBLIC_BASE='https://npkekrjzebsjfaizfcyb.supabase.co/storage/v1/object/public/language-studio-audio/tts/';
const CLOUD_TTS_ENDPOINT='https://npkekrjzebsjfaizfcyb.supabase.co/functions/v1/language-studio-tts';

const ASSETS=[
  './',
  './index.html',
  './styles.css',
  './runtime.js',
  './runtime-20261107-content-error-fix-v81.js',
  './app-shell-v53.css',
  './reading-studio.css',
  './easy-play-theme-v58.css',
  './study-plan-60.css',
  './daily-80-v60.css',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(APP_CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys
        .filter(key=>key.startsWith('language-studio-v') && key!==APP_CACHE)
        .map(key=>caches.delete(key))
    );
    await self.clients.claim();
    const openClients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    await Promise.all(openClients.map(client=>{
      try{return client.navigate(client.url);}catch(error){return Promise.resolve();}
    }));
  })());
});

function audioFileFromRequest(request){
  const url=new URL(request.url);
  const marker='/audio-cloud/';
  const index=url.pathname.indexOf(marker);
  if(index<0) return null;
  const file=url.pathname.slice(index+marker.length);
  return /^[a-f0-9]{64}\.mp3$/i.test(file) ? file.toLowerCase() : null;
}

async function requestCloudAudioGeneration(hash){
  try{
    const response=await fetch(CLOUD_TTS_ENDPOINT,{
      method:'POST',
      mode:'cors',
      cache:'no-store',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({hash})
    });
    return response.ok;
  }catch(error){
    return false;
  }
}

// iOS media playback frequently requests byte ranges even for a small MP3.
// Cache the full response but satisfy Range requests with 206 Partial Content.
async function mediaRange(request,response){
 const wanted=request.headers.get("range");
 if(!wanted||response.status!==200)return response;
 const match=/^bytes=(\\d*)-(\\d*)$/.exec(wanted.trim());
 if(!match)return response;
 const bytes=await response.arrayBuffer(),size=bytes.byteLength;
 let start=match[1]?Number(match[1]):null;
 let end=match[2]?Number(match[2]):null;
 if(start===null){
  const suffix=end;
  if(!Number.isSafeInteger(suffix)||suffix<=0)return response;
  start=Math.max(0,size-suffix);end=size-1;
 }else{
  if(!Number.isSafeInteger(start)||start<0)return response;
  if(end===null)end=size-1;
  if(!Number.isSafeInteger(end)||end<start)return response;
  end=Math.min(size-1,end);
 }
 if(start>=size)return new Response(null,{status:416,headers:{"Content-Range":"bytes */"+size}});
 const headers=new Headers(response.headers);
 headers.set("Content-Type","audio/mpeg");
 headers.set("Accept-Ranges","bytes");
 headers.set("Content-Range","bytes "+start+"-"+end+"/"+size);
 headers.set("Content-Length",String(end-start+1));
 return new Response(bytes.slice(start,end+1),{status:206,headers});
}

async function serveAudio(request,file){
  const cache=await caches.open(AUDIO_CACHE);
  const scopeUrl=new URL('./audio-cloud/'+file,self.registration.scope).toString();
  const key=new Request(scopeUrl);
  const cached=await cache.match(key);
  if(cached) return mediaRange(request,cached);

  try{
    // Keep the original media play request alive on mobile. If the MP3 does not
    // exist yet, generate it through the allow-listed TTS endpoint and then
    // return the new file to the same request. This avoids iOS autoplay blocking
    // a second play() call after an asynchronous generation step.
    let response=await fetch(CLOUD_AUDIO_PUBLIC_BASE+file,{
      method:'GET',
      mode:'cors',
      cache:'no-store',
      headers:{'Accept':'audio/mpeg'}
    });

    if(!response.ok && response.status===404){
      const hash=file.replace(/\.mp3$/i,'');
      const generated=await requestCloudAudioGeneration(hash);
      if(generated){
        response=await fetch(CLOUD_AUDIO_PUBLIC_BASE+file+'?ready='+Date.now(),{
          method:'GET',
          mode:'cors',
          cache:'no-store',
          headers:{'Accept':'audio/mpeg'}
        });
      }
    }

    if(!response.ok) return response;

    await cache.put(key,response.clone());
    return mediaRange(request,response);
  }catch(error){
    const retry=await cache.match(key);
    return retry ? mediaRange(request,retry) : Response.error();
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;

  const requestUrl=new URL(event.request.url);
  if(requestUrl.pathname.includes('/tieng-viet-lop-1/')){
    event.respondWith(
      fetch(new Request(event.request,{cache:'no-store'}))
        .catch(()=>caches.match(event.request).then(hit=>hit||Response.error()))
    );
    return;
  }

  const audioFile=audioFileFromRequest(event.request);
  if(audioFile){
    event.respondWith(serveAudio(event.request,audioFile));
    return;
  }

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(new Request(event.request,{cache:'no-store'}))
        .then(response=>{
          if(response && response.ok){
            const copy=response.clone();
            caches.open(APP_CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
          }
          return response;
        })
        .catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(response && response.ok){
          const copy=response.clone();
          caches.open(APP_CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        }
        return response;
      })
      .catch(()=>caches.match(event.request).then(hit=>{
        if(hit) return hit;
        if(event.request.mode==='navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});
