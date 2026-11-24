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
  function create(step,options){
    options=options||{};
    var text=passage(step);
    if(!text||typeof global.ReadingBackgroundAudio?.create!=="function")return null;
    return global.ReadingBackgroundAudio.create({
      text:text,
      title:"STEP "+step.id+" · "+step.entries.length+" câu tiếng Anh",
      artist:"Sách 2100 · Nghe câu liên tục",
      loop:true,
      rate:0.75,
      onState:options.onState,
      onError:options.onError,
      onEnded:options.onEnded
    });
  }
  global.Book2100BackgroundAudio={passage:passage,create:create};
})(window);
