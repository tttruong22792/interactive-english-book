(()=>{
  'use strict';

  const ENDPOINT='https://npkekrjzebsjfaizfcyb.supabase.co/functions/v1/language-studio-ai-coach';

  function status(){
    const auth=window.VocabCloudSync?.status?.()||{};
    return {
      signedIn:!!auth.signedIn,
      email:auth.email||'',
      available:typeof window.VocabCloudSync?.getAccessToken==='function'
    };
  }

  async function analyze(payload){
    const token=await window.VocabCloudSync?.getAccessToken?.();
    if(!token){
      const error=new Error('AUTH_REQUIRED');
      error.code='AUTH_REQUIRED';
      throw error;
    }

    const response=await fetch(ENDPOINT,{
      method:'POST',
      headers:{
        'Authorization':'Bearer '+token,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        sentence:String(payload?.sentence||'').trim(),
        targetPattern:String(payload?.targetPattern||'').trim(),
        patternMeaning:String(payload?.patternMeaning||'').trim(),
        lessonTitle:String(payload?.lessonTitle||'').trim(),
        lessonId:String(payload?.lessonId||'').trim()
      })
    });

    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      const error=new Error(data?.message||data?.error||('AI Coach failed ('+response.status+')'));
      error.code=data?.error||'AI_COACH_ERROR';
      error.status=response.status;
      throw error;
    }
    return data;
  }

  window.LanguageStudioAICoach={status,analyze};
})();