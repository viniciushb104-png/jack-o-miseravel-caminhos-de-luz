(() => {
  const STORAGE_KEY='jack-language';
  const SUPPORTED=['pt-BR','en','es','fr','zh-CN','ko','ja'];
  const lang=()=>SUPPORTED.includes(localStorage.getItem(STORAGE_KEY))?localStorage.getItem(STORAGE_KEY):'pt-BR';
  const packs=window.JACK_LOCALE_PACKS=window.JACK_LOCALE_PACKS||{};
  window.JackLocale={
    supported:SUPPORTED,
    getLanguage:lang,
    register(code,map){packs[code]=Object.assign(packs[code]||{},map||{});},
    translateEnglish(text,code=lang()){
      if(code==='pt-BR'||code==='en'||typeof text!=='string')return text;
      const map=packs[code]||{};
      const t=text.trim();
      if(map[t])return text.replace(t,map[t]);
      return text;
    },
    deepTranslate(value,code=lang()){
      if(code==='pt-BR'||code==='en')return value;
      const tr=this.translateEnglish.bind(this);
      const walk=v=>{
        if(typeof v==='string')return tr(v,code);
        if(Array.isArray(v))return v.map(walk);
        if(v&&typeof v==='object'){
          const out={};
          for(const [k,val] of Object.entries(v))out[k]=walk(val);
          return out;
        }
        return v;
      };
      return walk(value);
    },
    localizeStories(code=lang()){
      if(code==='pt-BR'||code==='en')return;
      ['PHASE1_STORY','PHASE1_DIALOGUES','PHASE3_STORY','PHASE4_STORY','PHASE5_STORY'].forEach(key=>{
        if(window[key])window[key]=this.deepTranslate(window[key],code);
      });
    }
  };
})();