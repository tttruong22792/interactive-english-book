const APP_CACHE='language-studio-v26-pattern009-commercial';
const AUDIO_CACHE='language-studio-audio-v1';
const CLOUD_AUDIO_PUBLIC_BASE='https://npkekrjzebsjfaizfcyb.supabase.co/storage/v1/object/public/language-studio-audio/tts/';
const CLOUD_TTS_ENDPOINT='https://npkekrjzebsjfaizfcyb.supabase.co/functions/v1/language-studio-tts';

const ASSETS=[
  './',
  './index.html',
  './styles.css',
  './runtime.js',
  './runtime-20260926-pattern009-commercial-v1.js',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(APP_CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys
        .filter(key=>key.startsWith('language-studio-v') && key!==APP_CACHE)
        .map(key=>caches.delete(key))
    ))
  );
  self.clients.claim();
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

async function serveAudio(request,file){
  const cache=await caches.open(AUDIO_CACHE);
  const scopeUrl=new URL('./audio-cloud/'+file,self.registration.scope).toString();
  const key=new Request(scopeUrl);
  const cached=await cache.match(key);
  if(cached) return cached;

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
    return response;
  }catch(error){
    const retry=await cache.match(key);
    return retry || Response.error();
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;

  const audioFile=audioFileFromRequest(event.request);
  if(audioFile){
    event.respondWith(serveAudio(event.request,audioFile));
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
