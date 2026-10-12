(() => {
  const STORAGE_KEY='jack-language';
  const SUPPORTED=['pt-BR','en','es','fr','zh-CN','ko','ja'];
  const lang=()=>{
    try {
      const value=localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.includes(value)?value:'pt-BR';
    } catch (_) { return 'pt-BR'; }
  };
  const packs=window.JACK_LOCALE_PACKS=window.JACK_LOCALE_PACKS||{};
  // Game logic fields are never translated. Translate only presentation text.
  const DISPLAY_FIELDS=new Set([
    'text','speaker','title','subtitle','theme','name','description',
    'label','hint','message','objective','objectives','beforeMeeting',
    'findMemories','goRuins','goArena','defeatBoss','completed'
  ]);
  const localized=new WeakMap();

  function translateEnglish(text,code=lang()){
    if(code==='pt-BR'||code==='en'||typeof text!=='string')return text;
    const map=packs[code]||{};
    const t=text.trim();
    if(Object.prototype.hasOwnProperty.call(map,t) && typeof map[t]==='string')
      return text.replace(t,map[t]);
    return text;
  }

  // Do not recursively translate IDs, state keys, sprite paths, dialogue
  // references or other gameplay values: they must remain language-neutral.
  function deepTranslate(value,code=lang()){
    if(code==='pt-BR'||code==='en')return value;
    const seen=new WeakMap();
    const walk=(v,key,display)=>{
      if(typeof v==='string')return display?translateEnglish(v,code):v;
      if(!v||typeof v!=='object')return v;
      if(seen.has(v))return seen.get(v);
      const out=Array.isArray(v)?[]:{};
      seen.set(v,out);
      for(const [k,item] of Object.entries(v)){
        const nextDisplay=display||DISPLAY_FIELDS.has(k);
        out[k]=walk(item,k,nextDisplay);
      }
      return out;
    };
    return walk(value,'',false);
  }

  const stories=['PHASE1_STORY','PHASE1_DIALOGUES','PHASE3_STORY','PHASE4_STORY','PHASE5_STORY'];
  function localizeStories(code=lang()){
    if(code==='pt-BR'||code==='en')return;
    for(const key of stories){
      const source=window[key];
      if(!source||typeof source!=='object')continue;
      const memo=localized.get(source);
      if(memo?.code===code)continue;
      // An already-localized object must not be processed a second time.
      const translated=deepTranslate(source,code);
      localized.set(source,{code,translated});
      localized.set(translated,{code,translated});
      window[key]=translated;
    }
  }

  window.JackLocale={
    supported:SUPPORTED,
    getLanguage:lang,
    register(code,map){
      if(SUPPORTED.includes(code)&&map&&typeof map==='object')
        packs[code]=Object.assign(packs[code]||{},map);
    },
    translateEnglish,
    deepTranslate,
    localizeStories
  };
})();