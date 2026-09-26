(function(){
  'use strict';

  var TTS_MODEL = 'gpt-4o-mini-tts-2025-12-15';
  var TTS_PROFILE = 'teacher-v1';
  var MASTER_PACE = 'natural';
  var LANGUAGE = 'vi-VN';
  var VOICE = 'coral';
  var CLOUD_AUDIO_PUBLIC_BASE = 'https://npkekrjzebsjfaizfcyb.supabase.co/storage/v1/object/public/language-studio-audio/tts/';
  var CLOUD_TTS_ENDPOINT = 'https://npkekrjzebsjfaizfcyb.supabase.co/functions/v1/language-studio-tts';
  var activeAudio = null;

  function cloudDirectAudioUrl(hash){
    return CLOUD_AUDIO_PUBLIC_BASE+hash+'.mp3';
  }

  function cloudVirtualAudioUrl(hash){
    return new URL('../audio-cloud/'+hash+'.mp3',document.baseURI).toString();
  }

  function cloudAudioUrl(hash){
    if('serviceWorker' in navigator && navigator.serviceWorker.controller){
      return cloudVirtualAudioUrl(hash);
    }
    return cloudDirectAudioUrl(hash);
  }

  function bytesToHex(buffer){
    return Array.from(new Uint8Array(buffer)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }

  async function hashFor(text){
    var raw=[TTS_MODEL,TTS_PROFILE,VOICE,LANGUAGE,MASTER_PACE,String(text)].join('|');
    var digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
    return bytesToHex(digest);
  }

  function stop(){
    if(activeAudio){
      try{ activeAudio.pause(); activeAudio.src=''; }catch(e){}
      activeAudio=null;
    }
    if('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function browserFallback(text,rate){
    if(!('speechSynthesis' in window)) return Promise.reject(new Error('Không có giọng đọc trên thiết bị này.'));
    return new Promise(function(resolve){
      window.speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance(text);
      u.lang='vi-VN';
      u.rate=Math.max(.72,Math.min(1.05,Number(rate)||.92));
      var voices=window.speechSynthesis.getVoices();
      var vi=voices.find(function(v){return /^vi(-|_)/i.test(v.lang||'');});
      if(vi) u.voice=vi;
      u.onend=resolve;
      u.onerror=resolve;
      window.speechSynthesis.speak(u);
    });
  }

  async function ensureCloud(hash){
    var r=await fetch(CLOUD_TTS_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({hash:hash}),
      cache:'no-store'
    });
    if(!r.ok){
      var data={};
      try{data=await r.json();}catch(e){}
      throw new Error(data.message||data.error||'Không tạo được giọng AI.');
    }
  }

  function playUrl(url,rate){
    stop();
    return new Promise(function(resolve,reject){
      var a=new Audio(url);
      activeAudio=a;
      a.preload='auto';
      a.playbackRate=Math.max(.72,Math.min(1.02,Number(rate)||.92));
      try{a.preservesPitch=true;}catch(e){}
      a.onended=function(){ if(activeAudio===a)activeAudio=null; resolve(); };
      a.onerror=function(){ if(activeAudio===a)activeAudio=null; reject(new Error('Không phát được âm thanh.')); };
      var p=a.play();
      if(p&&p.catch) p.catch(reject);
    });
  }

  async function speak(text,options){
    options=options||{};
    var rate=options.rate||.92;
    try{
      var hash=await hashFor(text);
      var source=cloudAudioUrl(hash);
      try{
        await playUrl(source,rate);
        return;
      }catch(first){}
      await ensureCloud(hash);
      source=cloudAudioUrl(hash);
      await playUrl(source+(source.includes('?')?'&':'?')+'ready='+Date.now(),rate);
    }catch(error){
      await browserFallback(text,rate);
    }
  }

  window.TV1Audio={speak:speak,stop:stop,hashFor:hashFor,language:LANGUAGE,voice:VOICE};
}());
