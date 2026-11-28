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

async function readJson(path,options){const response=await fetch(path,options);if(!response.ok)throw Error('Could not load '+path);return response.json()}
function validateSeason(data){
  if(!data||data.id!=='advent-2026'||!Array.isArray(data.resources)||!data.resources.length)return false;
  const hasText=a=>Array.isArray(a)&&a.length>0&&a.every(p=>typeof p==='string'&&p.trim().length>0);
  return data.resources.every(r=>Array.isArray(r.days)&&r.days.length>0&&r.days.every(d=>hasText(d.reflection)&&(r.symbol!=='star'||hasText(d.reading))));
}
async function loadSeason(){
  const path='./advent-2026.json?v=20261128-video-ids';
  let result;
  try{result=await readJson(path,{cache:'no-store'});if(validateSeason(result))return result;}catch(e){console.warn('Advent data load failed; retrying',e)}
  result=await readJson(path+'&retry='+Date.now(),{cache:'reload'});
  if(!validateSeason(result))throw Error('The reading-plan data is out of date or incomplete.');
  return result;
}
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
function foot(){return '<footer class="foot">'+credit()+'<p class="storage-note">'+(storageFailed?'Browser storage is unavailable. Progress is temporary.':'Progress is saved in this browser, not shared across devices.')+'</p><p><a href="../">Return to sermons</a></p></footer>'}
function activeWeek(today=localDate()){
  let i=0;config.themes.forEach((t,j)=>{if(t.start<=today)i=j});return i;
}
function weekDays(r,i){return r.days.filter(d=>d.theme===i)}
function weekHref(i,d){return './?plan=calendar&week='+(i+1)+(d?'#day-'+d.date:'')}
function requestedWeek(r,p=params){
  const n=Number(p.get('week'));
  if(p.has('week')&&Number.isInteger(n)&&n>=1&&n<=config.themes.length)return n-1;
  return r.days.find(d=>d.date===p.get('day'))?.theme??activeWeek();
}
function weekCount(r,i){const days=weekDays(r,i);return days.filter(d=>done(r).has(d.date)).length+' of '+days.length+' readings completed'}
function weekdayShort(s){return new Date(s+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'})}
function dateRange(days){
  const first=days[0].date,last=days.at(-1).date;
  const month=s=>new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'long'});
  return month(first)+' '+Number(first.slice(-2))+' – '+(first.slice(0,7)===last.slice(0,7)?'':month(last)+' ')+Number(last.slice(-2));
}
function weeklyCandles(r,i,onLanding=false){
  const days=weekDays(r,i),rose=config.themes[i].color==='rose';
  return '<div class="week-candles" aria-label="Daily reading shortcuts">'+days.map(d=>{
    const lit=done(r).has(d.date),today=d.date===localDate();
    const label=humanDate(d.date)+(lit?', completed':', not completed')+(today?', today':'');
    return '<a class="week-candle'+(lit?' is-complete':'')+'" data-candle-date="'+d.date+'" href="'+(onLanding?weekHref(i,d):'#day-'+d.date)+'" aria-label="'+esc(label)+'"'+(today?' aria-current="date"':'')+'><span class="weekday">'+esc(weekdayShort(d.date))+'</span><span class="candle-art">'+candle(lit,rose)+'</span><span class="candle-date">'+Number(d.date.slice(-2))+'</span></a>';
  }).join('')+'</div>';
}
function landing(){
  const today=localDate(),i=activeWeek(today),before=today<config.themes[0].start;
  const rCal=config.resources.find(r=>r.id==='calendar'),rRoad=config.resources.find(r=>r.id==='road');
  const after=today>rCal.days.at(-1).date,d=pick(rRoad),n=done(rRoad).size;
  const roadLabel=today<rRoad.days[0].date?'Begins '+shortDate(rRoad.days[0].date):today>rRoad.days.at(-1).date?'Explore the plan':'Today’s devotional';
  root.innerHTML='<div class="hero compact-hero"><div class="hero-art">'+config.themes.map((t,j)=>'<div class="hero-candle">'+candle(!before&&j<=i,t.color==='rose')+'<span>'+esc(t.title)+'</span></div>').join('')+'</div><h1>'+esc(config.title)+'</h1><p class="muted">'+(before?'Begins '+shortDate(config.themes[0].start):after?'Christmas season':'Week '+(i+1)+' · '+esc(config.themes[i].title))+'</p></div>'+
  '<section class="card compact-card"><h2>'+esc(rCal.title)+'</h2><p class="muted">'+esc(rCal.description)+'</p><a class="resource-link" href="'+weekHref(i)+'"><span><strong>Week '+(i+1)+' · '+esc(config.themes[i].title)+'</strong><span class="muted resource-count">'+weekCount(rCal,i)+'</span></span><span class="resource-chevron" aria-hidden="true">›</span></a>'+weeklyCandles(rCal,i,true)+'</section>'+
  '<section class="card compact-card"><h2>'+esc(rRoad.title)+'</h2><p class="muted">'+esc(rRoad.description)+'</p><a class="resource-link" href="'+href(rRoad,d)+'"><span><span class="muted resource-count">'+esc(roadLabel)+'</span><strong>Day '+(rRoad.days.indexOf(d)+1)+' · '+esc(d.title)+'</strong><span class="muted resource-count">'+n+' of '+rRoad.days.length+' devotionals completed</span></span><span class="resource-chevron" aria-hidden="true">›</span></a><progress aria-label="'+esc(rRoad.title)+' progress" value="'+n+'" max="'+rRoad.days.length+'"></progress></section>'+
  '<details class="section plan-introductions"><summary>About these reading plans</summary><div class="section-content">'+config.resources.map(r=>'<h3>'+esc(r.title)+'</h3>'+(r.subtitle?'<p class="muted">'+esc(r.subtitle)+'</p>':'')+paragraphs(r.introduction)).join('')+'</div></details>'+foot();
}
function completionIcon(lit){
  return '<svg viewBox="0 0 28 28" aria-hidden="true" focusable="false"><circle cx="14" cy="14" r="11.2" fill="'+(lit?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.7"/>'+(lit?'<path d="M8.6 14.1l3.5 3.6 7.3-7.6" fill="none" stroke="var(--bg)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>':'')+'</svg>';
}
function updateWeekCompletion(r,i,d){
  const lit=done(r).has(d.date),today=d.date===localDate(),label=humanDate(d.date);
  const btn=root.querySelector('[data-complete-date="'+d.date+'"]');
  btn.setAttribute('aria-pressed',String(lit));
  btn.setAttribute('aria-label',(lit?'Mark incomplete: ':'Mark complete: ')+label);
  btn.innerHTML=completionIcon(lit);
  const tile=root.querySelector('[data-candle-date="'+d.date+'"]');
  tile.classList.toggle('is-complete',lit);
  tile.setAttribute('aria-label',label+(lit?', completed':', not completed')+(today?', today':''));
  tile.querySelector('.candle-art').innerHTML=candle(lit,config.themes[i].color==='rose');
  root.querySelector('#weekly-count').textContent=weekCount(r,i);
  if(storageFailed){const note=root.querySelector('.foot .storage-note');if(note)note.textContent='Browser storage is unavailable. Progress is temporary.'}
}
function renderWeek(r,i){
  const t=config.themes[i],days=weekDays(r,i),today=localDate();
  root.innerHTML='<nav class="breadcrumb" aria-label="Advent navigation"><a href="./">‹ '+esc(config.title)+'</a></nav><h1 class="weekly-title">'+esc(r.title)+'</h1>'+
  '<nav class="week-tabs" aria-label="Advent weeks">'+config.themes.map((w,j)=>'<a href="'+weekHref(j)+'"'+(j===i?' aria-current="page"':'')+'><span>Week '+(j+1)+'</span><strong>'+esc(w.title)+'</strong></a>').join('')+'</nav>'+
  '<div class="weekly-hero">'+candle(t.start<=today,t.color==='rose')+'<h2>'+esc(t.title)+'</h2><p class="muted">'+esc(dateRange(days))+'</p></div>'+
  video(t.video,t.title+' · BibleProject',true)+
  '<div class="weekly-progress"><span id="weekly-count" role="status">'+weekCount(r,i)+'</span>'+weeklyCandles(r,i)+'</div>'+
  '<div class="weekly-readings">'+days.map(d=>{
    const lit=done(r).has(d.date),isToday=d.date===today;
    return '<section class="weekly-reading'+(isToday?' is-today':'')+'" id="day-'+d.date+'" aria-labelledby="date-'+d.date+'"><div class="reading-heading"><h3 id="date-'+d.date+'">'+esc(humanDate(d.date))+(isToday?' <span class="today-label">· Today</span>':'')+'</h3><button type="button" class="reading-complete" data-complete-date="'+d.date+'" aria-pressed="'+lit+'" aria-label="'+esc((lit?'Mark incomplete: ':'Mark complete: ')+humanDate(d.date))+'">'+completionIcon(lit)+'</button></div><div class="weekly-scripture">'+scriptureMarkup(d)+'</div><div class="weekly-reflection">'+paragraphs(d.reflection)+'</div></section>';
  }).join('')+'</div>'+
  '<nav class="week-bottom-nav" aria-label="Adjacent weeks">'+(i>0?'<a href="'+weekHref(i-1)+'">‹ '+esc(config.themes[i-1].title)+'</a>':'<span></span>')+(i<config.themes.length-1?'<a href="'+weekHref(i+1)+'">'+esc(config.themes[i+1].title)+' ›</a>':'<a href="./">Advent overview ›</a>')+'</nav><p class="original-week"><a href="'+esc(t.source)+'">Original weekly calendar (PDF) ↗</a></p>'+foot();
  root.querySelectorAll('[data-complete-date]').forEach(btn=>btn.addEventListener('click',()=>{
    const d=days.find(d=>d.date===btn.dataset.completeDate);
    if(d){toggle(r,d);updateWeekCompletion(r,i,d);}
  }));
  const oldDay=params.get('day');
  const target=location.hash.startsWith('#day-')?location.hash.slice(1):oldDay?'day-'+oldDay:'';
  if(target&&days.some(d=>'day-'+d.date===target))requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({block:'start'}));
}
function paragraphs(items){return (items||[]).map(p=>'<p class="devotional-paragraph">'+esc(p).replace(/\n/g,'<br>')+'</p>').join('')}
function scriptureAnchor(s){return '<a data-passage="'+esc(s.passage)+'"'+(selectedTranslation?' href="'+esc(bibleUrl(s.passage))+'"':'')+'>'+esc(s.label)+'</a>'}
function scriptureMarkup(d){return '<div class="scriptures">'+(d.scriptureGroups?d.scriptureGroups.map(g=>'<div>'+g.links.map(scriptureAnchor).join(', ')+' ↗</div>').join(''):d.scriptures.map(s=>'<div>'+scriptureAnchor(s)+' ↗</div>').join(''))+'</div>'}
function aboutPlan(r){return r.introduction?.length?section('About this reading plan',(r.subtitle?'<p class="muted">'+esc(r.subtitle)+'</p>':'')+paragraphs(r.introduction)):''}
function section(title,content,open=false){return '<details class="section" '+(open?'open':'')+'><summary>'+esc(title)+'</summary><div class="section-content">'+content+'</div></details>'}
function video(v,label,weekly=false){
  if(!v)return '';
  return section(label||v.title+' · Video',NCVideoPlayer.render({
    id:v.youtube,title:v.title,
    sourceUrl:v.url,sourceLabel:'Watch on BibleProject ↗',
    youtubeLabel:'Watch on YouTube ↗'
  })+(weekly?'':credit()));
}
// Deterministic, hand-drawn river-stone silhouettes; the same day has the same shape in both views.
const stonePaths=[
 'M5 21 C3 14 9 8 19 7 C30 5 39 10 39 19 C39 27 30 31 20 31 C10 32 5 28 5 21Z',
 'M4 23 C4 16 13 13 22 12 C32 11 41 15 40 23 C39 29 30 32 19 31 C10 31 3 29 4 23Z',
 'M8 26 C3 21 5 13 13 8 C20 4 30 6 35 12 C42 19 38 27 30 31 C21 35 13 31 8 26Z',
 'M4 19 C6 10 14 11 20 8 C28 4 37 10 39 18 C42 25 33 30 24 31 C14 32 2 28 4 19Z',
 'M8 15 C12 7 21 5 29 8 C35 10 40 19 36 26 C32 34 21 34 12 30 C6 26 4 21 8 15Z',
 'M4 22 C3 15 12 9 21 10 C29 10 34 8 39 14 C44 23 36 29 26 31 C15 34 5 29 4 22Z'
];
const stoneOrder=[0,3,1,4,2,5,1,3,0,5,2,4,0,2,5,1,4,3,2,0,4,1,5];
function roadSymbol(index,total){
  if(index===total-1)return '<svg class="bethlehem-art" viewBox="0 0 44 44" aria-hidden="true" focusable="false"><path class="bethlehem-ray" d="M7 7l6 6m18 18 6 6M37 7l-6 6M13 31l-6 6"/><path class="bethlehem-shape" d="M22 1 25.5 15.5 39 22 25.5 26 22 43 18.5 26 5 22 18.5 15.5Z"/></svg>';
  const shape=stonePaths[stoneOrder[index%stoneOrder.length]];
  return '<svg class="stone-art" viewBox="0 0 44 40" aria-hidden="true" focusable="false"><path class="stone-shape" d="'+shape+'"/><path class="stone-check" d="M16 20l4 4 8-8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function roadLabel(r,d,i){
  return 'Day '+(i+1)+' · '+shortDate(d.date)+(i===r.days.length-1?' · Christmas Eve':'')+(done(r).has(d.date)?', completed':', not completed')+(d.date===localDate()?', today':'');
}
function roadMarker(r,d,i,selected,map=false){
  const lit=done(r).has(d.date),current=d===selected,today=d.date===localDate(),last=i===r.days.length-1;
  const row=Math.floor(i/6),col=row%2===0?i%6:5-i%6;
  return '<a class="road-marker'+(lit?' is-complete':'')+(today?' is-today':'')+(last?' is-destination':'')+'" href="'+href(r,d)+'" data-road-date="'+d.date+'" aria-label="'+esc(roadLabel(r,d,i))+'"'+(current?' aria-current="page"':'')+(map?' style="grid-column:'+(col+1)+';grid-row:'+(row+1)+'"':'')+'>'+roadSymbol(i,r.days.length)+'<span class="road-number">'+(i+1)+'</span></a>';
}
function roadMap(r,d){
  return '<div class="journey-endpoints"><span>December 1</span><span>Christmas Eve</span></div><nav class="journey-map" aria-label="All devotional days, winding journey"><svg class="journey-path" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M50 50 H550 Q585 50 585 85 V115 Q585 150 550 150 H50 Q15 150 15 185 V215 Q15 250 50 250 H550 Q585 250 585 285 V315 Q585 350 550 350 H50" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 5" vector-effect="non-scaling-stroke" stroke-linecap="round"/></svg>'+r.days.map((x,i)=>roadMarker(r,x,i,d,true)).join('')+'</nav>';
}
function fitJourneyPath(){
  const map=root.querySelector('.journey-map'),svg=map?.querySelector('.journey-path'),path=svg?.querySelector('path');
  if(!map||!svg||!path||!map.clientWidth||!map.clientHeight)return;
  if(!matchMedia('(max-width: 540px)').matches){
    svg.setAttribute('viewBox','0 0 600 400');
    path.setAttribute('d','M50 50 H550 Q585 50 585 85 V115 Q585 150 550 150 H50 Q15 150 15 185 V215 Q15 250 50 250 H550 Q585 250 585 285 V315 Q585 350 550 350 H50');
    return;
  }
  const bounds=map.getBoundingClientRect();
  const markers=[...map.querySelectorAll('.road-marker')].map(el=>{
    const b=el.getBoundingClientRect();
    return {x:b.left-bounds.left+b.width/2,y:b.top-bounds.top+b.height/2};
  });
  if(markers.length!==24)return;
  const w=bounds.width,h=bounds.height;
  const rows=Array.from({length:4},(_,i)=>({start:markers[i*6],end:markers[i*6+5]}));
  const f=n=>Math.round(n*100)/100;
  let d='M'+f(rows[0].start.x)+' '+f(rows[0].start.y);
  for(let i=0;i<rows.length;i++){
    const a=rows[i],next=rows[i+1];
    if(!next){d+=' H'+f(a.end.x);break;}
    const right=i%2===0,edge=right?w-3:3,sign=right?1:-1;
    const radius=Math.min(10,Math.abs(edge-a.end.x)/2,(next.start.y-a.end.y)/2);
    const corner=edge-sign*radius;
    d+=' H'+f(corner)+' Q'+f(edge)+' '+f(a.end.y)+' '+f(edge)+' '+f(a.end.y+radius)+' V'+f(next.start.y-radius)+' Q'+f(edge)+' '+f(next.start.y)+' '+f(corner)+' '+f(next.start.y)+' H'+f(next.start.x);
  }
  svg.setAttribute('viewBox','0 0 '+w+' '+h);
  path.setAttribute('d',d);
}
function roadCount(r){return done(r).size+' of '+r.days.length+' devotionals completed'}
function roadNav(r,d){
  const i=r.days.indexOf(d);
  return '<div class="road-navigation"><div class="road-nav-heading"><span id="road-count" role="status">'+roadCount(r)+'</span><button type="button" class="journey-toggle" aria-expanded="false" aria-controls="journey-panel"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h10a4 4 0 0 1 0 8H7a3 3 0 0 0 0 6h10"/></svg><span>Show journey</span></button></div><div class="road-strip-row">'+(i>0?'<a class="road-arrow" href="'+href(r,r.days[i-1])+'" aria-label="Previous day">‹</a>':'<span class="road-arrow" aria-hidden="true"></span>')+'<nav id="road-strip" class="road-strip" aria-label="Devotional days">'+r.days.map((x,j)=>roadMarker(r,x,j,d)).join('')+'</nav>'+(i<r.days.length-1?'<a class="road-arrow" href="'+href(r,r.days[i+1])+'" aria-label="Next day">›</a>':'<span class="road-arrow" aria-hidden="true"></span>')+'</div><div id="journey-panel" hidden>'+roadMap(r,d)+'</div></div>';
}
function updateRoadCompletion(r,d){
  const i=r.days.indexOf(d),lit=done(r).has(d.date);
  root.querySelectorAll('[data-road-date="'+d.date+'"]').forEach(a=>{
    a.classList.toggle('is-complete',lit);
    a.setAttribute('aria-label',roadLabel(r,d,i));
  });
  const top=root.querySelector('#road-complete-top'),bottom=root.querySelector('#complete');
  top.setAttribute('aria-pressed',String(lit));
  top.setAttribute('aria-label',(lit?'Mark incomplete: ':'Mark complete: ')+'Day '+(i+1));
  top.innerHTML=completionIcon(lit);
  bottom.setAttribute('aria-pressed',String(lit));
  bottom.textContent=lit?'✓ Completed · Mark incomplete':'Mark day as complete';
  root.querySelector('#road-count').textContent=roadCount(r);
  if(storageFailed){const note=root.querySelector('.foot .storage-note');if(note)note.textContent='Browser storage is unavailable. Progress is temporary.'}
}
function centerRoadStrip(){
  const strip=root.querySelector('#road-strip'),selected=strip?.querySelector('[aria-current="page"]');
  if(!selected)return;
  const a=strip.getBoundingClientRect(),b=selected.getBoundingClientRect();
  strip.scrollLeft+=b.left-a.left+(b.width-a.width)/2;
}
function reading(r,d){
  const index=r.days.indexOf(d),isDone=done(r).has(d.date);
  root.innerHTML='<nav class="breadcrumb" aria-label="Advent navigation"><a href="./">‹ '+esc(config.title)+'</a></nav><h1 class="weekly-title">'+esc(r.title)+'</h1>'+roadNav(r,d)+
  '<div class="road-heading"><div class="road-heading-copy"><p class="muted">Day '+(index+1)+' · '+esc(humanDate(d.date))+(d.date===localDate()?' <span class="today-label">· Today</span>':'')+'</p><h2>'+esc(d.title)+'</h2></div><button type="button" id="road-complete-top" class="reading-complete" aria-pressed="'+isDone+'" aria-label="'+(isDone?'Mark incomplete: ':'Mark complete: ')+'Day '+(index+1)+'">'+completionIcon(isDone)+'</button></div>'+
  section('Devotional Reading',paragraphs(d.reading),true)+video(d.video)+
  section('Scripture Reading',scriptureMarkup(d),true)+
  section('Reflection Exercises',paragraphs(d.reflection),true)+(d.closing?'<div class="section">'+paragraphs(d.closing)+'</div>':'')+
  '<button class="action complete-button" id="complete" type="button" aria-pressed="'+isDone+'">'+(isDone?'✓ Completed · Mark incomplete':'Mark day as complete')+'</button>'+
  '<nav class="week-bottom-nav road-bottom-nav" aria-label="Adjacent devotional days">'+(index>0?'<a href="'+href(r,r.days[index-1])+'">‹ Previous day</a>':'<span></span>')+(index<r.days.length-1?'<a href="'+href(r,r.days[index+1])+'">Next day ›</a>':'<a href="./">Advent overview ›</a>')+'</nav><p class="original-week"><a href="'+esc(r.source)+'">Original reading plan ↗</a></p>'+foot();
  const change=()=>{toggle(r,d);updateRoadCompletion(r,d)};
  root.querySelector('#complete').addEventListener('click',change);
  root.querySelector('#road-complete-top').addEventListener('click',change);
  const journey=root.querySelector('.journey-toggle'),panel=root.querySelector('#journey-panel');
  journey.addEventListener('click',()=>{
    panel.hidden=!panel.hidden;
    journey.setAttribute('aria-expanded',String(!panel.hidden));
    journey.querySelector('span').textContent=panel.hidden?'Show journey':'Hide journey';
    if(!panel.hidden)requestAnimationFrame(fitJourneyPath);
  });
  requestAnimationFrame(centerRoadStrip);
  if('ResizeObserver' in window)new ResizeObserver(fitJourneyPath).observe(root.querySelector('.journey-map'));
  else window.addEventListener('resize',fitJourneyPath);
}
(async()=>{try{config=await loadSeason();await setupTranslations().catch(()=>{});const r=config.resources.find(x=>x.id===params.get('plan'));if(!r)landing();else if(r.id==='calendar')renderWeek(r,requestedWeek(r));else reading(r,r.days.find(x=>x.date===params.get('day'))||pick(r));}catch(e){root.innerHTML='<p>Advent readings could not load. Please refresh to retrieve the latest reading-plan data.</p><p><a href="./">Return to Advent</a> · <a href="https://bibleproject.com/guides/advent/">Original BibleProject resources</a></p>';console.error(e)}})();

const seasonalHeader=document.querySelector('header');
if(seasonalHeader){const resizeHeader=()=>document.documentElement.style.setProperty('--season-header-height',seasonalHeader.getBoundingClientRect().height+'px');resizeHeader();if('ResizeObserver' in window)new ResizeObserver(resizeHeader).observe(seasonalHeader);}
