/* Seasonal resource promotion, independent of the sermon guide loader. */
(() => {
  'use strict';
  const root=document.getElementById('seasonal-resources');
  if(!root)return;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const datePattern=/^\d{4}-\d{2}-\d{2}$/;
  function localDate(d=new Date()){
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  }
  function safeLink(value){
    if(typeof value!=='string'||!value.trim())return false;
    try{
      const url=new URL(value,document.baseURI);
      return url.protocol==='https:'||url.protocol==='http:'&&url.origin===location.origin;
    }catch{return false}
  }
  function active(resource,today){
    return resource&&resource.published===true&&typeof resource.title==='string'&&safeLink(resource.url)&&
      (!resource.visibleFrom||(datePattern.test(resource.visibleFrom)&&resource.visibleFrom<=today))&&
      (!resource.visibleUntil||(datePattern.test(resource.visibleUntil)&&today<=resource.visibleUntil));
  }
  function artwork(resource,today){
    if(resource.icon==='advent-candles'&&Array.isArray(resource.candles)&&resource.candles.length===4){
      return '<span class="seasonal-candles" aria-hidden="true">'+resource.candles.map(c=>{
        const lit=datePattern.test(c.start)&&c.start<=today;
        return '<svg class="'+(lit?'is-lit':'is-unlit')+(c.color==='rose'?' is-rose':'')+'" viewBox="0 0 40 64" focusable="false"><rect class="seasonal-candle-body" x="9" y="30" width="22" height="32" rx="3"/><path class="seasonal-wick" d="M20 25v5"/>'+(lit?'<path class="seasonal-flame" d="M20 1 C17 10 7 13 10 21 C12 30 29 30 30 20 C32 12 24 10 20 1Z"/><path class="seasonal-inner-flame" d="M20 14 Q11 25 20 26 Q29 25 20 14Z"/>':'')+'</svg>';
      }).join('')+'</span>';
    }
    return '<svg class="seasonal-generic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1zM12 5v15"/></svg>';
  }
  function banner(resource,today){
    return '<a class="seasonal-banner'+(resource.icon==='advent-candles'?' seasonal-advent':'')+'" href="'+escape(resource.url)+'">'+artwork(resource,today)+'<span class="seasonal-banner-copy"><strong>'+escape(resource.title)+'</strong>'+(resource.description?'<span class="seasonal-banner-description">'+escape(resource.description)+'</span>':'')+'</span><svg class="seasonal-banner-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7"/></svg></a>';
  }
  let resources=[];
  function render(today=localDate()){
    const visible=resources.filter(r=>active(r,today));
    root.innerHTML=visible.map(r=>banner(r,today)).join('');
    root.hidden=!visible.length;
  }
  async function start(){
    try{
      const response=await fetch('./resources.json',{cache:'no-cache'});
      if(!response.ok)throw Error('Resource index unavailable');
      const data=await response.json();
      if(data.schemaVersion!==1||!Array.isArray(data.resources))throw Error('Invalid resource index');
      resources=data.resources;
      render();
    }catch(error){
      // The optional banner must never prevent the sermon guide from loading.
      root.hidden=true;
      console.warn('Seasonal resources could not load',error);
    }
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
  start();
})();
