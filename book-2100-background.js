/* Book 2100 · continuous, lock-screen-friendly STEP sentence listening.
   A single native HTMLMediaElement loops the entire English STEP. Unlike
   a per-sentence Promise/timeout queue, it keeps playing when iOS suspends
   page JavaScript after backgrounding or locking the screen. */
(function(global){
  "use strict";
  function passage(step){
    if(!step || !Array.isArray(step.entries))return "";
    return step.entries.map(function(entry){
      return typeof entry.sentence==="string"?entry.sentence.trim():"";
    }).filter(Boolean).join(" ");
  }
  // First-time full-STEP MP3s are generated on demand. A media src pointed
  // at an as-yet missing Supabase object returns 400/404 and never recovers.
  // Make the file ready before creating the looping Audio element.
  const preparation=new Map();
  const readyUrls=new Map();
  function prepare(step){
    const text=passage(step);
    if(!text||!global.AITTS?.prepareAudioUrl)
      return Promise.reject(new Error("Không có dịch vụ chuẩn bị giọng đọc."));
    if(readyUrls.has(text))return Promise.resolve(readyUrls.get(text));
    if(preparation.has(text))return preparation.get(text);
    const job=Promise.resolve().then(function(){
      return global.AITTS.prepareAudioUrl(text,{language:"en-US",voice:"marin"});
    }).then(function(url){
      if(!url || !/^https:\/\//.test(url) && !/^(?:\.\/?|\/)/.test(url))
        throw new Error("Không tìm thấy tệp âm thanh STEP.");
      readyUrls.set(text,url);
      return url;
    }).catch(function(error){preparation.delete(text);throw error;});
    preparation.set(text,job);
    return job;
  }
  function create(step,options){
    options=options||{};
    var text=passage(step);
    if(!text||typeof global.ReadingBackgroundAudio?.create!=="function")return null;
    const audioUrl=readyUrls.get(text);
    // Never hit an unprepared virtual MP3 endpoint: on iPhone the first
    // 400 response permanently errors the Audio element.
    if(!audioUrl)return null;
    return global.ReadingBackgroundAudio.create({
      text:text,
      title:options.title || ("STEP "+step.id+" · "+step.entries.length+" câu tiếng Anh"),
      artist:options.artist || "Sách 2100 · Nghe câu liên tục",
      audioUrl:audioUrl,
      loop:true,
      rate:options.rate??0.75,
      onState:options.onState,
      onError:options.onError,
      onEnded:options.onEnded
    });
  }
  global.Book2100BackgroundAudio={passage:passage,prepare:prepare,create:create,ready:function(step){return readyUrls.has(passage(step));}};
})(window);
