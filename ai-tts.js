(function () {
  "use strict";

  var TTS_MODEL = "gpt-4o-mini-tts-2025-12-15";
  var TTS_PROFILE = "teacher-v1";
  var MASTER_PACE = "natural";

  var LOCAL_AUDIO_BASE = "./audio/tts/";
  var CLOUD_VIRTUAL_AUDIO_BASE = "./audio-cloud/";
  var CLOUD_AUDIO_PUBLIC_BASE = "https://npkekrjzebsjfaizfcyb.supabase.co/storage/v1/object/public/language-studio-audio/tts/";
  var CLOUD_TTS_ENDPOINT = "https://npkekrjzebsjfaizfcyb.supabase.co/functions/v1/language-studio-tts";

  var statusCache = null;
  var statusAt = 0;
  var STATUS_TTL = 30000;
  var activeAudio = null;
  var activeObjectUrl = null;
  var activeTimer = null;

  var K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];

  function rotr(x,n){ return (x >>> n) | (x << (32-n)); }

  function sha256Sync(text) {
    var bytes = Array.prototype.slice.call(new TextEncoder().encode(String(text)));
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    for (var i=7;i>=0;i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i*8)) & 255);

    var h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a;
    var h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
    var w = new Array(64);

    for (var offset=0; offset<bytes.length; offset+=64) {
      for (i=0;i<16;i++) {
        var j=offset+i*4;
        w[i]=((bytes[j]<<24)|(bytes[j+1]<<16)|(bytes[j+2]<<8)|bytes[j+3])>>>0;
      }
      for (i=16;i<64;i++) {
        var s0=(rotr(w[i-15],7)^rotr(w[i-15],18)^(w[i-15]>>>3))>>>0;
        var s1=(rotr(w[i-2],17)^rotr(w[i-2],19)^(w[i-2]>>>10))>>>0;
        w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
      }

      var a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
      for (i=0;i<64;i++) {
        var S1=(rotr(e,6)^rotr(e,11)^rotr(e,25))>>>0;
        var ch=((e&f)^((~e)&g))>>>0;
        var temp1=(h+S1+ch+K[i]+w[i])>>>0;
        var S0=(rotr(a,2)^rotr(a,13)^rotr(a,22))>>>0;
        var maj=((a&b)^(a&c)^(b&c))>>>0;
        var temp2=(S0+maj)>>>0;
        h=g; g=f; f=e; e=(d+temp1)>>>0; d=c; c=b; b=a; a=(temp1+temp2)>>>0;
      }
      h0=(h0+a)>>>0; h1=(h1+b)>>>0; h2=(h2+c)>>>0; h3=(h3+d)>>>0;
      h4=(h4+e)>>>0; h5=(h5+f)>>>0; h6=(h6+g)>>>0; h7=(h7+h)>>>0;
    }

    return [h0,h1,h2,h3,h4,h5,h6,h7].map(function(x){
      return x.toString(16).padStart(8,"0");
    }).join("");
  }

  function isLocalHost(){
    var host=String(location.hostname||"").toLowerCase();
    if(host==="127.0.0.1" || host==="localhost") return true;
    if(/^192\.168\./.test(host) || /^10\./.test(host)) return true;
    var m=host.match(/^172\.(\d+)\./);
    return !!(m && Number(m[1])>=16 && Number(m[1])<=31);
  }

  function endpoint(){
    if(window.LANGUAGE_STUDIO_TTS_ENDPOINT) return window.LANGUAGE_STUDIO_TTS_ENDPOINT;
    return isLocalHost() ? "/api/tts" : CLOUD_TTS_ENDPOINT;
  }

  function statusEndpoint(){
    if(window.LANGUAGE_STUDIO_TTS_STATUS_ENDPOINT) return window.LANGUAGE_STUDIO_TTS_STATUS_ENDPOINT;
    return isLocalHost() ? endpoint()+"/status" : CLOUD_TTS_ENDPOINT;
  }

  function detectLanguage(text){
    return /[\u3040-\u30ff\u3400-\u9fff]/.test(String(text||"")) ? "ja-JP" : "en-US";
  }

  function voiceFor(language){ return /^ja/i.test(language||"") ? "cedar" : "marin"; }

  function playbackRate(rate){
    var r=Number(rate)||0.88;
    return Math.max(0.65,Math.min(1.05,r));
  }

  function cacheHash(text,language,voice){
    return sha256Sync([TTS_MODEL,TTS_PROFILE,voice,language,MASTER_PACE,String(text)].join("|"));
  }

  function localAudioUrl(hash){
    return new URL(LOCAL_AUDIO_BASE+hash+".mp3",document.baseURI).toString();
  }

  function cloudDirectAudioUrl(hash){
    return CLOUD_AUDIO_PUBLIC_BASE+hash+".mp3";
  }

  function cloudVirtualAudioUrl(hash){
    return new URL(CLOUD_VIRTUAL_AUDIO_BASE+hash+".mp3",document.baseURI).toString();
  }

  function cloudAudioUrl(hash){
    if("serviceWorker" in navigator && navigator.serviceWorker.controller){
      return cloudVirtualAudioUrl(hash);
    }
    return cloudDirectAudioUrl(hash);
  }

  function staticAudioUrl(text,language,voice){
    var hash=cacheHash(text,language,voice);
    return isLocalHost() ? localAudioUrl(hash) : cloudAudioUrl(hash);
  }

  function knownLocal(hash){
    var registry=window.LS_AUDIO_CACHE;
    if(!registry) return null;
    if(typeof registry.has==="function") return registry.has(hash);
    return !!registry[hash];
  }

  function clearHighlight(el){
    if(!el) return;
    Array.prototype.forEach.call(el.querySelectorAll(".word-token"),function(node){node.classList.remove("speaking");});
  }

  function updateHighlight(el,text,currentTime,duration){
    if(!el || !duration || !isFinite(duration)) return;
    var tokens=Array.prototype.slice.call(el.querySelectorAll(".word-token"));
    if(!tokens.length) return;
    var ratio=Math.max(0,Math.min(0.999,currentTime/duration));
    var charIndex=Math.floor(ratio*Math.max(1,String(text).length));
    var active=null;
    for(var i=0;i<tokens.length;i++){
      var start=Number(tokens[i].dataset.start||0);
      var end=Number(tokens[i].dataset.end||(start+tokens[i].textContent.length));
      if(charIndex>=start && charIndex<end){active=tokens[i];break;}
    }
    if(!active) active=tokens[Math.min(tokens.length-1,Math.floor(ratio*tokens.length))];
    tokens.forEach(function(token){token.classList.toggle("speaking",token===active);});
  }

  function cleanupAudio(){
    if(activeTimer){clearInterval(activeTimer);activeTimer=null;}
    if(activeAudio){try{activeAudio.pause();activeAudio.src="";}catch(e){}activeAudio=null;}
    if(activeObjectUrl){URL.revokeObjectURL(activeObjectUrl);activeObjectUrl=null;}
  }

  function playAudioSource(src,text,options,isObjectUrl){
    options=options||{};
    cleanupAudio();
    var audio=new Audio(src);
    activeAudio=audio;
    if(isObjectUrl) activeObjectUrl=src;
    audio.preload="auto";
    audio.playbackRate=playbackRate(options.rate);
    try{audio.preservesPitch=true;}catch(e){}
    try{audio.webkitPreservesPitch=true;}catch(e){}
    var highlightEl=options.highlightEl||null;

    return new Promise(function(resolve,reject){
      var settled=false;
      function cleanup(){
        clearHighlight(highlightEl);
        if(activeTimer){clearInterval(activeTimer);activeTimer=null;}
        if(activeAudio===audio) activeAudio=null;
        if(isObjectUrl && activeObjectUrl===src){
          URL.revokeObjectURL(src);
          activeObjectUrl=null;
        }
      }
      function finish(){if(settled)return;settled=true;cleanup();resolve();}
      function fail(){if(settled)return;settled=true;cleanup();reject(new Error("Could not play AI audio"));}

      audio.addEventListener("loadedmetadata",function(){
        if(highlightEl && isFinite(audio.duration) && audio.duration>0){
          activeTimer=setInterval(function(){
            if(activeAudio===audio) updateHighlight(highlightEl,text,audio.currentTime,audio.duration);
          },70);
        }
      },{once:true});
      audio.addEventListener("ended",finish,{once:true});
      audio.addEventListener("error",fail,{once:true});
      var p=audio.play();
      if(p && typeof p.catch==="function") p.catch(fail);
    });
  }

  async function status(force){
    var now=Date.now();
    if(!force && statusCache && (now-statusAt)<STATUS_TTL) return statusCache;
    try{
      var response=await fetch(statusEndpoint(),{
        method:"GET",
        headers:{"Accept":"application/json"},
        cache:"no-store"
      });
      if(!response.ok) throw new Error("AI TTS status unavailable");
      statusCache=await response.json();
    }catch(e){
      statusCache={enabled:false,provider:"browser",reason:"endpoint-unavailable"};
    }
    statusAt=now;
    return statusCache;
  }

  async function fetchLocalBlob(text,language,voice){
    var response=await fetch(endpoint(),{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"audio/mpeg"},
      body:JSON.stringify({
        input:String(text),
        language:language,
        voice:voice,
        pace:MASTER_PACE,
        model:TTS_MODEL,
        profile:TTS_PROFILE
      })
    });
    if(!response.ok){
      var message="AI voice request failed";
      try{var data=await response.json();if(data&&data.error)message=data.error;}catch(e){}
      throw new Error(message);
    }
    var blob=await response.blob();
    if(!blob.size) throw new Error("AI voice returned empty audio");
    return blob;
  }

  async function ensureCloudAudio(hash){
    var response=await fetch(CLOUD_TTS_ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify({hash:hash}),
      cache:"no-store"
    });

    var data=null;
    try{data=await response.json();}catch(e){}

    if(!response.ok){
      var message=(data&&data.message)||(data&&data.error)||"Cloud AI voice request failed";
      throw new Error(message);
    }
    return data||{ok:true};
  }

  async function speakLocal(text,language,voice,hash,options){
    var known=knownLocal(hash);

    if(known===true){
      return playAudioSource(localAudioUrl(hash),text,options,false);
    }

    if(known===null){
      try{
        return await playAudioSource(localAudioUrl(hash),text,options,false);
      }catch(e){}
    }

    var blob=await fetchLocalBlob(text,language,voice);
    return playAudioSource(URL.createObjectURL(blob),text,options,true);
  }

  async function speakCloud(text,language,voice,hash,options){
    try{
      return await playAudioSource(cloudAudioUrl(hash),text,options,false);
    }catch(firstError){}

    await ensureCloudAudio(hash);

    // Avoid any short-lived negative HTTP cache after the initial 404.
    var readyUrl=cloudAudioUrl(hash)+(cloudAudioUrl(hash).includes("?")?"&":"?")+"ready="+Date.now();
    return playAudioSource(readyUrl,text,options,false);
  }

  async function speak(text,options){
    options=options||{};
    var language=options.language||detectLanguage(text);
    var voice=options.voice||voiceFor(language);
    var hash=cacheHash(text,language,voice);

    if(isLocalHost() && !window.LANGUAGE_STUDIO_TTS_ENDPOINT){
      return speakLocal(text,language,voice,hash,options);
    }

    return speakCloud(text,language,voice,hash,options);
  }

  function stop(){
    cleanupAudio();
    Array.prototype.forEach.call(document.querySelectorAll(".word-token.speaking"),function(el){el.classList.remove("speaking");});
  }

  window.AITTS={
    status:status,
    speak:speak,
    stop:stop,
    detectLanguage:detectLanguage,
    voiceFor:voiceFor,
    dynamicAllowed:function(){return true;},
    model:TTS_MODEL,
    profile:TTS_PROFILE,
    masterPace:MASTER_PACE,
    cacheHash:cacheHash,
    staticAudioUrl:staticAudioUrl,
    cloudAudioUrl:cloudAudioUrl,
    cloudEndpoint:CLOUD_TTS_ENDPOINT,
    clearStatusCache:function(){statusCache=null;statusAt=0;}
  };
}());
