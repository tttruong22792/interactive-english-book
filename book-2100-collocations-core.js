/* Original workbook expansions: useful daily English collocations with Vietnamese meanings.
   These are editorial additions, not quotations from the photographed textbook. */
(function(){
  "use strict";
  window.book2100AddChunks=function(start,raw){
    const book=window.BOOK_2100_DATA;
    if(!book||!Array.isArray(book.steps))throw Error("Book 2100 must load before practical chunks");
    const all=book.steps.flatMap(s=>s.entries);
    const lines=raw.trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    lines.forEach(function(line,i){
      const fields=line.split("|");
      const word=fields.shift().trim();
      const current=all[start+i-1];
      if(!current || current.en.toLowerCase()!==word.toLowerCase()){
        throw Error("Wrong book expansion at #"+(start+i)+": expected "+(current?.en||"missing")+", received "+word);
      }
      if(fields.length!==3)throw Error("Expected exactly 3 new chunks for "+current.en);
      const seen=new Set((current.extra||[]).map(a=>a[0].trim().toLowerCase()));
      for(const field of fields){
        const at=field.indexOf("~");
        if(at<1||at>=field.length-1)throw Error("Incomplete EN/VI chunk for "+word);
        const en=field.slice(0,at).trim(),vi=field.slice(at+1).trim();
        if(en.length<3||vi.length<3)throw Error("Empty chunk for "+word);
        if(seen.has(en.toLowerCase()))continue;
        seen.add(en.toLowerCase());
        current.extra.push([en,vi]);
      }
      current.extraSource="editorial-daily-chunks";
    });
  };
})();
