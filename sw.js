const APP_CACHE='language-studio-v15-phraseaudio-dict';
const AUDIO_CACHE='language-studio-audio-v1';
const CLOUD_AUDIO_PUBLIC_BASE='https://npkekrjzebsjfaizfcyb.supabase.co/storage/v1/object/public/language-studio-audio/tts/';

const ASSETS=[
  './',
  './index.html',
  './styles.css',
  './runtime.js',
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

async function serveAudio(request,file){
  const cache=await caches.open(AUDIO_CACHE);
  const scopeUrl=new URL('./audio-cloud/'+file,self.registration.scope).toString();
  const key=new Request(scopeUrl);
  const cached=await cache.match(key);
  if(cached) return cached;

  try{
    // Fetch the complete MP3 instead of forwarding Range headers.
    // This gives Cache Storage one reusable full object for later playback.
    const response=await fetch(CLOUD_AUDIO_PUBLIC_BASE+file,{
      method:'GET',
      mode:'cors',
      cache:'no-store',
      headers:{'Accept':'audio/mpeg'}
    });

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
