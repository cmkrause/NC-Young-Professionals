let savedTheme;
try { savedTheme = localStorage.getItem('gather-theme'); } catch {}
let dark = savedTheme ? savedTheme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
function setTheme() {
  document.body.classList.toggle('dark', dark);
  document.getElementById('theme-light').setAttribute('aria-pressed', String(!dark));
  document.getElementById('theme-dark').setAttribute('aria-pressed', String(dark));
  document.querySelector('meta[name=theme-color]').content = dark ? '#1c1c1c' : '#fafafa';
}
setTheme();
for (const mode of ['light', 'dark']) {
  document.getElementById('theme-' + mode).onclick = () => {
    dark = mode === 'dark';
    setTheme();
    try { localStorage.setItem('gather-theme', mode); } catch {}
  };
}
const settings = document.getElementById('reading-settings');
const settingsOpen = document.getElementById('settings-open');
settingsOpen.onclick = () => settings.showModal();
document.getElementById('settings-close').onclick = () => settings.close();
settings.addEventListener('click', event => {
  const bounds = settings.getBoundingClientRect();
  if (event.target === settings && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) settings.close();
});
settings.addEventListener('close', () => {
  document.getElementById('translation-options').hidden = true;
  document.getElementById('translation').setAttribute('aria-expanded', 'false');
  document.getElementById('font-picker').open = false;
  document.getElementById('translation-help').hidden = true;
  document.getElementById('translation-info').setAttribute('aria-expanded', 'false');
  settingsOpen.focus();
});
const fontPicker = document.getElementById('reading-font');
const readingFonts = {
  atkinson: "'Atkinson Hyperlegible Next', system-ui, sans-serif",
  opendyslexic: "'OpenDyslexic', system-ui, sans-serif",
  lexend: "'Lexend', system-ui, sans-serif",
  andika: "'Andika', system-ui, sans-serif"
};
try {
  const storedFont = localStorage.getItem('gather-reading-font');
  if (Object.hasOwn(readingFonts, storedFont)) fontPicker.value = storedFont;
} catch {}
function applyReadingFont() {
  document.body.style.setProperty('--reading-font', readingFonts[fontPicker.value]);
  const selected = document.querySelector(`[name="font-choice"][value="${fontPicker.value}"]`);
  selected.checked = true;
  const label = document.getElementById('selected-font');
  label.textContent = selected.nextElementSibling.textContent;
  label.style.fontFamily = readingFonts[fontPicker.value];
}
applyReadingFont();
document.querySelectorAll('[name="font-choice"]').forEach(input => {
  input.closest('label').style.fontFamily = readingFonts[input.value];
  input.addEventListener('change', () => {
    fontPicker.value = input.value;
    applyReadingFont();
    try { localStorage.setItem('gather-reading-font', input.value); } catch {}
    document.getElementById('font-picker').open = false;
    document.querySelector('#font-picker summary').focus();
  });
});
const translationInfo = document.getElementById('translation-info');
translationInfo.onclick = () => {
  const help = document.getElementById('translation-help');
  help.hidden = !help.hidden;
  translationInfo.setAttribute('aria-expanded', String(!help.hidden));
};

const smaller = document.getElementById('smaller');
const larger = document.getElementById('larger');
const baseReadingSize = () => matchMedia('(max-width:500px)').matches ? 17 : 18;
let readingPercent = 100;
try {
  const storedPercent = Number(localStorage.getItem('gather-reading-percent'));
  const legacySize = Number(localStorage.getItem('gather-reading-size'));
  if (storedPercent >= 80 && storedPercent <= 160) readingPercent = Math.round(storedPercent / 10) * 10;
  else if (legacySize >= 15 && legacySize <= 28) readingPercent = Math.max(80, Math.min(160, Math.round(legacySize / baseReadingSize() * 10) * 10));
} catch {}
function setReadingSize() {
  document.body.style.setProperty('--reading-size', baseReadingSize() * readingPercent / 100 + 'px');
  document.getElementById('reading-size-value').textContent = readingPercent + '%';
  smaller.disabled = readingPercent <= 80;
  larger.disabled = readingPercent >= 160;
}
function resizeText(delta) {
  readingPercent = Math.max(80, Math.min(160, readingPercent + delta));
  setReadingSize();
  try { localStorage.setItem('gather-reading-percent', String(readingPercent)); } catch {}
}
setReadingSize();
smaller.onclick = () => resizeText(-10);
larger.onclick = () => resizeText(10);
matchMedia('(max-width:500px)').addEventListener('change', setReadingSize);

const escapedCharacters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = value => String(value).replace(/[&<>"']/g, character => escapedCharacters[character]);
let selectedTranslation;
const formattedText=value=>esc(value).replace(/_([^_]+)_/g,'<em>$1</em>');
function bibleUrl(passage){
  if(!selectedTranslation)return '';
  const {id,abbreviation}=selectedTranslation;
  return 'https://www.bible.com/bible/'+id+'/'+encodeURIComponent(passage)+'.'+encodeURIComponent(abbreviation.toUpperCase());
}
async function setupTranslations(){
  const catalog=await readJson('../translations.json');
  const versions=catalog.translations.slice().sort((a,b)=>a.abbreviation.localeCompare(b.abbreviation,'en'));
  const toggle=document.getElementById('translation');
  const picker=toggle.closest('.translation-picker');
  const badge=toggle.querySelector('.translation-abbreviation');
  const options=document.getElementById('translation-options');
  let preferred;
  try{preferred=localStorage.getItem('gather-bible-translation')}catch{}
  options.innerHTML = versions.map(({ abbreviation, name }) => `
    <button type="button" class="translation-option" data-translation="${esc(abbreviation)}">
      <b>${esc(abbreviation)}</b> — ${esc(name)}
    </button>`).join('');
  const buttons=[...options.querySelectorAll('button')];
  function applyTranslation(version){
    selectedTranslation=version;
    badge.textContent=version.abbreviation;
    toggle.setAttribute('aria-label','Bible link translation: '+version.abbreviation);
    for(const button of buttons){
      button.setAttribute('aria-pressed',String(button.dataset.translation===version.abbreviation));
    }
    document.querySelectorAll('a[data-passage]').forEach(link=>{link.href=bibleUrl(link.dataset.passage)});
  }
  function setOpen(open){
    options.hidden=!open;
    toggle.setAttribute('aria-expanded',String(open));
    if(open)buttons.find(button=>button.dataset.translation===selectedTranslation.abbreviation)?.focus();
  }
  toggle.addEventListener('click',()=>setOpen(options.hidden));
  options.addEventListener('click',event=>{
    const button=event.target.closest('[data-translation]');
    if(!button)return;
    const version=versions.find(item=>item.abbreviation===button.dataset.translation);
    applyTranslation(version);
    try{localStorage.setItem('gather-bible-translation',version.abbreviation)}catch{}
    toggle.focus();
    setOpen(false);
  });
  picker.addEventListener('keydown',event=>{
    if(options.hidden||event.key!=='Escape')return;
    event.preventDefault();
    event.stopPropagation();
    toggle.focus();
    setOpen(false);
  });
  picker.addEventListener('focusout',event=>{
    if(!picker.contains(event.relatedTarget))setOpen(false);
  });
  document.addEventListener('click',event=>{
    if(!picker.contains(event.target))setOpen(false);
  });
  applyTranslation(versions.find(version=>version.abbreviation===preferred)
    ??versions.find(version=>version.abbreviation===catalog.default));
  picker.hidden=false;
}

async function readJson(path){const response=await fetch(path);if(!response.ok)throw Error('Could not load '+path);return response.json()}
const root=document.getElementById('article');
const params=new URLSearchParams(location.search);
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const humanDate=s=>new Date(s+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
const shortDate=s=>new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const href=(r,d)=>'./?plan='+encodeURIComponent(r.id)+(d?'&day='+encodeURIComponent(d.date):'');
const get=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}};
let config,storageFailed=false;
const key=r=>'gather-season:'+config.id+':'+r.id;
const completed=r=>{const saved=get(key(r));return new Set(Array.isArray(saved)?saved.filter(x=>r.days.some(d=>d.date===x)):[])};
const memory=new Map();
const done=r=>memory.get(r.id)||completed(r);
function toggle(r,d){const set=new Set(done(r));if(set.has(d.date))set.delete(d.date);else set.add(d.date);memory.set(r.id,set);try{localStorage.setItem(key(r),JSON.stringify([...set]))}catch{storageFailed=true}}
function candle(lit,rose=false){return '<svg class="'+(lit?'lit':'unlit')+(rose?' rose':'')+'" viewBox="0 0 40 64" aria-hidden="true"><rect class="candle-body" x="9" y="30" width="22" height="32" rx="3"/><path class="wick" d="M20 25v5"/>'+(lit?'<path class="flame" d="M20 1 C17 10 7 13 10 21 C12 30 29 30 30 20 C32 12 24 10 20 1Z"/><path class="inner-flame" d="M20 14 Q11 25 20 26 Q29 25 20 14Z"/>':'')+'</svg>'}
function star(){return '<svg viewBox="0 0 40 40" aria-hidden="true"><path class="star" d="M20 2 24.5 14.5 38 15.5 27.5 24 31 38 20 30 9 38 12.5 24 2 15.5 15.5 14.5Z"/></svg>'}
const credit=()=>'<p class="notice">BibleProject is the author and owner of this content. To find more BibleProject resources, visit <a href="https://bibleproject.com/">bibleproject.com</a>.</p>';
function progress(r){const n=done(r).size;return '<div class="progress"><span>'+n+' of '+r.days.length+' completed</span><span>'+Math.round(n/r.days.length*100)+'%</span></div><progress aria-label="'+esc(r.title)+' progress" value="'+n+'" max="'+r.days.length+'"></progress>'}
function pick(r){return r.days.find(d=>d.date===localDate())|| (localDate()<r.days[0].date?r.days[0]:r.days.find(d=>!done(r).has(d.date))||r.days.at(-1))}
function tile(r,d,selected){const complete=done(r).has(d.date),today=d.date===localDate();const label=shortDate(d.date)+(complete?', completed':', not completed')+(today?', today':'');return '<a class="tile '+(complete?'complete ':'')+(d.date===selected?.date?'selected ':'')+(d.date>localDate()?'future':'')+'" href="'+href(r,d)+'" aria-label="'+esc(label)+'" '+(today?'aria-current="date"':'')+'>'+ (r.symbol==='candle'?candle(complete,config.themes[d.theme]?.color==='rose'):star())+'<span>'+Number(d.date.slice(-2))+(complete?'<span aria-hidden="true"> ✓</span>':'')+'</span></a>'}
function calendar(r,selected,preview=false){if(r.symbol==='candle'){const groups=preview?[Math.max(0,config.themes.findLastIndex(t=>t.start<=localDate()))]:config.themes.map((_,i)=>i);return groups.map(i=>'<div class="week-label">'+esc(config.themes[i].title)+' · Week '+(i+1)+'</div><div class="calendar-grid">'+['S','M','T','W','T','F','S'].map(x=>'<span class="weekday">'+x+'</span>').join('')+r.days.filter(d=>d.theme===i).map(d=>tile(r,d,selected)).join('')+'</div>').join('')}return '<div class="calendar-grid star-grid">'+r.days.map(d=>tile(r,d,selected)).join('')+'</div>'}
function foot(){return '<footer class="foot">'+credit()+'<p>'+(storageFailed?'Browser storage is unavailable. Progress is temporary.':'Progress is saved in this browser, not shared across devices.')+'</p><p><a href="../">Return to sermons</a></p></footer>'}
function landing(){const today=localDate(),theme=config.themes.findLastIndex(t=>t.start<=today);root.innerHTML='<div class="hero"><div class="hero-art">'+config.themes.map((t,i)=>'<div class="hero-candle">'+candle(i<=theme,t.color==='rose')+'<span>'+esc(t.title)+'</span></div>').join('')+'</div><h1>'+esc(config.title)+'</h1><p class="muted">'+(theme<0?'Begins November 29':today>config.resources[0].days.at(-1).date?'Christmas season':'Week '+(theme+1)+' · '+esc(config.themes[theme].title))+'</p><p>'+esc(humanDate(today))+'</p></div>'+config.resources.map(r=>{const d=pick(r),label=today<r.days[0].date?'Begins '+shortDate(r.days[0].date):today>r.days.at(-1).date?'Explore the plan':'Today’s '+(r.symbol==='candle'?'reading':'devotional');return '<section class="card"><h2>'+esc(r.title)+'</h2><p class="muted">'+esc(r.description)+'</p>'+progress(r)+'<div class="small-preview">'+calendar(r,d,true)+'</div><p class="muted">'+esc(label)+'</p><h3>'+esc(d.title)+'</h3><p><a class="action" href="'+href(r,d)+'">Open '+(r.symbol==='candle'?'reading':'devotional')+' →</a></p></section>'}).join('')+foot()}
function section(title,content,open=false){return '<details class="section" '+(open?'open':'')+'><summary>'+esc(title)+'</summary><div class="section-content">'+content+'</div></details>'}
function video(v){if(!v)return '';return section(v.title+' · Video','<div class="video">'+(v.youtube?'<iframe loading="lazy" title="'+esc(v.title)+'" src="https://www.youtube-nocookie.com/embed/'+esc(v.youtube)+'" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>':'')+'<a class="source-link" href="'+esc(v.url)+'">Watch on BibleProject ↗</a></div>'+credit())}
function reading(r,d){const index=r.days.indexOf(d),isCalendar=r.symbol==='candle',theme=config.themes[d.theme],source='<a class="source-link" href="'+esc(d.source)+'">'+(isCalendar?'Open the original weekly calendar (PDF) ↗':'Read the original Day '+(index+1)+' devotional and reflection ↗')+'</a>';const isDone=done(r).has(d.date);root.innerHTML='<nav class="breadcrumb" aria-label="Advent navigation"><a href="./">‹ '+esc(config.title)+'</a><span>·</span><a href="'+href(r)+'">'+esc(r.title)+'</a></nav><h1>'+esc(r.title)+'</h1>'+progress(r)+'<details class="calendar-toggle"><summary>All '+r.days.length+' days</summary>'+calendar(r,d)+'</details><div class="day-nav">'+(index>0?'<a href="'+href(r,r.days[index-1])+'" aria-label="Previous day">‹</a>':'<span class="edge"></span>')+'<div><div class="muted">'+esc(humanDate(d.date))+(d.date===localDate()?' · Today':'')+'</div><h2>'+esc(isCalendar?theme.title+' · '+d.title:'Day '+(index+1)+' · '+d.title)+'</h2></div>'+(index<r.days.length-1?'<a href="'+href(r,r.days[index+1])+'" aria-label="Next day">›</a>':'<span class="edge"></span>')+'</div>'+
(!isCalendar?section('Devotional Reading',source,true)+video(d.video):'')+
section('Scripture Reading','<div class="scriptures">'+d.scriptures.map(s=>'<a data-passage="'+esc(s.passage)+'"'+(selectedTranslation?' href="'+esc(bibleUrl(s.passage))+'"':'')+'>'+esc(s.label)+' ↗</a>').join('')+'</div>',true)+
section(isCalendar?'Reflection':'Reflection Exercises',source,true)+(isCalendar?video(theme.video):'')+
'<button class="action complete-button" id="complete" type="button" aria-pressed="'+isDone+'">'+(isDone?'✓ Completed · mark incomplete':(isCalendar?'Light this candle · mark complete':'Light this star · mark complete'))+'</button><div class="small-preview">'+calendar(r,d,true)+'</div><p><a href="'+esc(r.source)+'">Original reading plan ↗</a></p>'+foot();
document.getElementById('complete').onclick=()=>{const open=root.querySelector('.calendar-toggle').open;toggle(r,d);reading(r,d);root.querySelector('.calendar-toggle').open=open;document.getElementById('complete').focus({preventScroll:true})}}
(async()=>{try{config=await readJson('./advent-2026.json');await setupTranslations().catch(()=>{});const r=config.resources.find(x=>x.id===params.get('plan'));if(!r)landing();else reading(r,r.days.find(x=>x.date===params.get('day'))||pick(r));}catch(e){root.innerHTML='<p>Advent resources could not load. Please refresh.</p>';console.error(e)}})();
