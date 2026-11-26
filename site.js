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

const descriptionHtml = paragraph => esc(paragraph).replace(/\*([^*]+)\*/g, '<em>$1</em>');

function teaser(paragraphs) {
  if (!paragraphs.length) return '';
  const format = descriptionHtml;
  const rest = paragraphs.slice(1).map(paragraph => '<p>' + format(paragraph) + '</p>').join('');
  return `
    <details class="teaser" open>
      <summary><span class="teaser-label">Description</span><span class="teaser-opening">${format(paragraphs[0])}</span></summary>
      <div class="teaser-rest">${rest}</div>
    </details>`;
}

let seriesById=new Map();
const slideParts = parts => parts.map(part =>
  part.emphasis ? `<strong><em>${esc(part.text)}</em></strong>` : esc(part.text)
).join('');

function renderSlide(slide) {
  let content;
  let layout = '';
  if (slide.kind === 'quote') {
    layout = ' is-quote';
    const quote = slide.parts ? slideParts(slide.parts) : esc(slide.quote);
    content = `
      <div class="slide-quote-frame">
        <div class="slide-quote-scroll" tabindex="0">
          <blockquote class="slide-quote">${quote}</blockquote>
        </div>
        <div class="slide-quote-bar" aria-hidden="true" hidden>
          <span class="slide-quote-thumb"></span>
        </div>
      </div>
      <p class="slide-attribution"><strong>${esc(slide.name)}</strong><em>${esc(slide.role)}</em></p>`;
  } else if (slide.kind === 'statement') {
    layout = ' is-statement';
    content = `<p>${slideParts(slide.parts)}</p>`;
  } else if (slide.text) {
    content = `<h2>${esc(slide.title)}</h2>${slide.text.map(p => '<p>' + esc(p) + '</p>').join('')}`;
  } else {
    return `
      <figure>
        <img src="${esc(slide.src)}" alt="${esc(slide.alt)}" width="1280" height="720" draggable="false">
      </figure>`;
  }

  const tabStop = slide.kind === 'quote' ? '' : ' tabindex="0"';
  return `
    <figure class="text-slide">
      <div class="text-slide-copy${layout}"${tabStop} role="region" aria-label="${esc(slide.title)}">
        ${content}
      </div>
    </figure>`;
}

function slideDeck(slides) {
  return `
    <div class="slide-deck">
      <div class="slide-track" id="slide-track" role="region" aria-label="Slide Deck" tabindex="0">
        ${slides.map(renderSlide).join('')}
      </div>
      <div class="slide-controls">
        <button id="slide-prev" aria-label="Previous slide">‹</button>
        <span id="slide-count" class="slide-count" aria-live="polite">1 / ${slides.length}</span>
        <button id="slide-next" aria-label="Next slide">›</button>
      </div>
    </div>`;
}

let slideBackgroundObserver;
function setupSlideBackground(deck,background){
  if(!deck||!background)return;
  const variants=Array.isArray(background)?[...background].sort((a,b)=>a.width-b.width):null;
  const track=deck.querySelector('.slide-track');
  let current;
  let queued=false;
  function preload(){
    queued=false;
    if(!deck.isConnected||deck.open)return;
    const image=new Image();
    image.fetchPriority='low';
    image.src=current.src;
  }
  function update(){
    const pixels=deck.clientWidth*(window.devicePixelRatio||1);
    const next=variants
      ?variants.find(variant=>variant.width>=pixels)??variants.at(-1)
      :{src:background,width:Infinity};
    // Keep a larger image already requested when the viewport shrinks.
    if(!next||(current&&current.width>=next.width))return;
    current=next;
    track.style.setProperty('--slide-background','url('+JSON.stringify(next.src)+')');
    if(deck.open||queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      if('requestIdleCallback' in window){
        window.requestIdleCallback(preload,{timeout:1500});
      }else{
        setTimeout(preload,0);
      }
    });
  }
  update();
  if(variants&&'ResizeObserver' in window){
    slideBackgroundObserver=new ResizeObserver(update);
    slideBackgroundObserver.observe(deck);
  }
}
let quoteResizeObserver;
function setupQuoteScrollbars(track){
  quoteResizeObserver?.disconnect();
  if(!track)return;
  const updates=new Map();
  quoteResizeObserver=new ResizeObserver(entries=>{
    for(const entry of entries)updates.get(entry.target)();
  });
  for(const scroller of track.querySelectorAll('.slide-quote-scroll')){
    const quote=scroller.firstElementChild;
    const bar=scroller.nextElementSibling;
    const thumb=bar.firstElementChild;
    const update=()=>{
      const viewport=scroller.clientHeight;
      const overflow=scroller.scrollHeight-viewport;
      bar.hidden=viewport===0||overflow<=1;
      if(bar.hidden)return;
      const height=bar.clientHeight;
      const thumbHeight=Math.min(height,Math.max(16,height*viewport/scroller.scrollHeight));
      const progress=Math.max(0,Math.min(1,scroller.scrollTop/overflow));
      thumb.style.height=thumbHeight+'px';
      thumb.style.transform='translateY('+progress*(height-thumbHeight)+'px)';
    };
    scroller.addEventListener('scroll',update,{passive:true});
    for(const element of [scroller,quote]){
      updates.set(element,update);
      quoteResizeObserver.observe(element);
    }
    update();
  }
}
function setupSlides() {
  slideBackgroundObserver?.disconnect();
  const track = document.getElementById('slide-track');
  setupQuoteScrollbars(track);
  if (!track) return;

  const prev = document.getElementById('slide-prev');
  const next = document.getElementById('slide-next');
  const count = document.getElementById('slide-count');
  const total = track.children.length;
  const index = () => track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0;

  function update() {
    const current = index();
    prev.disabled = current === 0;
    next.disabled = current >= total - 1;
    count.textContent = (current + 1) + ' / ' + total;
  }

  function go(delta) {
    const target = Math.max(0, Math.min(total - 1, index() + delta));
    track.scrollTo({
      left: target * track.clientWidth,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  }

  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  track.closest('details').addEventListener('toggle', update);
  update();
}

function fold(title, body, open = false, className = '') {
  return `
    <details${className ? ` class="${className}"` : ''}${open ? ' open' : ''}>
      <summary>${title}</summary>
      <div class="section-body">${body}</div>
    </details>`;
}

const escapedCharacters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = value => String(value).replace(/[&<>"']/g, character => escapedCharacters[character]);
let selectedTranslation;
const formattedText=value=>esc(value).replace(/_([^_]+)_/g,'<em>$1</em>');
function bibleUrl(passage){
  if(!selectedTranslation)return '';
  const {id,abbreviation}=selectedTranslation;
  return 'https://www.bible.com/bible/'+id+'/'+encodeURIComponent(passage)+'.'+encodeURIComponent(abbreviation.toUpperCase());
}
function textHtml(value){
  if(!Array.isArray(value))return formattedText(value);
  return value.map(({text,passage,slide}, index)=>{
    if (Number.isInteger(slide) && slide > 0) {
      const previousText = value[index - 1]?.text || '';
      const nextText = value[index + 1]?.text || '';
      const before = /\S$/u.test(previousText) ? ' ' : '';
      const after = /^\p{L}/u.test(nextText) ? ' ' : '';
      const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2"/>
        <path d="M6.5 9h8 M6.5 13h11 M6.5 16h7"/>
      </svg>`;
      return `${before}<sup><a class="slide-reference" href="#slide-${slide}" data-slide="${slide}" aria-label="Go to slide ${slide}">${icon}${slide}</a></sup>${after}`;
    }
    const label=formattedText(text);
    if(!passage)return label;
    const url=bibleUrl(passage);
    return `<a data-passage="${esc(passage)}"${url?` href="${esc(url)}"`:''}>${label}</a>`;
  }).join('');
}
async function setupTranslations(){
  const catalog=await readJson('translations.json');
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
function list(items, tag = 'ul', type = '') {
  const listType = type ? ` type="${type}"` : '';
  const entries = items.map(item => '<li>' + textHtml(item) + '</li>').join('');
  return `<${tag}${listType}>${entries}</${tag}>`;
}
const date = value => new Date(value + 'T12:00:00').toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});
let weeks = [];
let listedWeeks=[];
const guideRequests=new Map();
let navigation=0;
async function readJson(path){
  const response=await fetch(path);
  if(!response.ok)throw Error('Could not load '+path);
  return response.json();
}
function loadGuide(path){
  if(!guideRequests.has(path)){
    guideRequests.set(path,readJson(path).catch(error=>{
      guideRequests.delete(path);
      throw error;
    }));
  }
  return guideRequests.get(path);
}
function setDraftIndexing(isDraft){
  const robots=document.head.querySelector('meta[name="robots"]');
  if(isDraft&&!robots){
    const tag=document.createElement('meta');
    tag.name='robots';
    tag.content='noindex';
    document.head.append(tag);
  }else if(!isDraft){
    robots?.remove();
  }
}
async function show(id){
  const request=++navigation;
  const article=document.getElementById('article');
  const entry=id
    ?weeks.find(week=>week.id===id)??weeks.find(week=>week.aliases?.includes(id))
    :listedWeeks[0];
  const isDraft=entry?.published===false;
  setDraftIndexing(isDraft);
  if(!entry){
    article.innerHTML='<h1>Week not found</h1><p>Please choose a sermon from All Sermons.</p>';
    setupSlides();
    return;
  }
  article.innerHTML='<p role="status">Loading guide…</p>';
  setupSlides();
  let guide;
  try{
    guide=await loadGuide(entry.file);
  }catch{
    if(request===navigation)article.innerHTML='<p>The guide could not load. Please refresh.</p>';
    return;
  }
  if(request!==navigation)return;
  renderGuide({...guide,...entry},isDraft);
}
// Compact metadata for series badges; other dates keep their full formatting.
function seriesPartDate(value, currentYear = new Date().getFullYear()) {
  const date = new Date(value + 'T12:00:00');
  const options = { month: 'short', day: 'numeric' };
  if (date.getFullYear() !== currentYear) options.year = 'numeric';
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

let activeSeriesTooltip;
let seriesTooltipCloseTimer;
function closeSeriesTooltip() {
  clearTimeout(seriesTooltipCloseTimer);
  activeSeriesTooltip?.classList.remove('show-tooltip');
  activeSeriesTooltip = undefined;
}
function showSeriesTooltip(wrapper) {
  closeSeriesTooltip();
  if (!wrapper) return;
  const tooltip = wrapper.querySelector('.series-part-tooltip');
  const badge = wrapper.querySelector('.series-part');
  wrapper.classList.add('show-tooltip');
  const bounds = badge.getBoundingClientRect();
  const width = tooltip.getBoundingClientRect().width;
  const height = tooltip.getBoundingClientRect().height;
  const left = Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8));
  const below = bounds.bottom + 8;
  const top = below + height <= window.innerHeight - 8
    ? below : Math.max(8, bounds.top - height - 8);
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  activeSeriesTooltip = wrapper;
}
document.addEventListener('pointerover', event => {
  if (event.pointerType === 'touch') return;
  const wrapper = event.target.closest('.series-part-wrap');
  if (wrapper) clearTimeout(seriesTooltipCloseTimer);
  if (wrapper && !wrapper.contains(event.relatedTarget) && wrapper !== activeSeriesTooltip) showSeriesTooltip(wrapper);
});
document.addEventListener('pointerout', event => {
  const wrapper = event.target.closest('.series-part-wrap');
  if (wrapper && !wrapper.contains(event.relatedTarget)) seriesTooltipCloseTimer = setTimeout(closeSeriesTooltip, 150);
});
document.addEventListener('focusin', event => {
  const wrapper = event.target.closest('.series-part-wrap');
  if (wrapper) showSeriesTooltip(wrapper);
  else closeSeriesTooltip();
});
document.addEventListener('focusout', event => {
  const wrapper = event.target.closest('.series-part-wrap');
  if (wrapper && !wrapper.contains(event.relatedTarget)) closeSeriesTooltip();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSeriesTooltip();
});
window.addEventListener('scroll', closeSeriesTooltip, { passive: true });
window.addEventListener('resize', closeSeriesTooltip);

function sermonHeading(guide) {
  const seriesName = seriesById.get(guide.series)?.name;
  if (!seriesName || !guide.partLabel || !guide.sermonTitle) {
    return `<h1>${esc(guide.title)}</h1>`;
  }

  const parts = listedWeeks.filter(week => week.series === guide.series && week.partLabel && week.sermonTitle);
  if (!guide.published) parts.push(guide);
  parts.sort((a, b) => a.date.localeCompare(b.date));

  const badges = parts.map((part, index) => {
    const label = esc(part.partLabel);
    const tooltipId = 'series-part-info-' + index;
    const info = esc(seriesPartDate(part.date)) + (part.speaker ? ' • ' + esc(part.speaker) : '');
    const attributes = `aria-describedby="${tooltipId}" aria-label="${label}: ${esc(part.sermonTitle)}"`;
    const badge = part.id === guide.id
      ? `<span class="series-part" aria-current="page" tabindex="0" ${attributes}>${label}</span>`
      : `<a class="series-part" href="?week=${encodeURIComponent(part.id)}" ${attributes}>${label}</a>`;
    return `<span class="series-part-wrap">${badge}<span class="series-part-tooltip" id="${tooltipId}" role="tooltip"><strong>${esc(part.sermonTitle)}</strong><span>${info}</span></span></span>`;
  }).join('');
  return `
    <nav class="series-nav" aria-label="${esc(seriesName)} series">
      <a class="series-name" href="?series=${encodeURIComponent(guide.series)}">${esc(seriesName)}</a>
      ${badges}
    </nav>
    <h1>${esc(guide.sermonTitle)}</h1>`;
}

function headerDate(value, currentYear = new Date().getFullYear()) {
  const day = new Date(value + 'T12:00:00');
  const options = { month: 'long', day: 'numeric' };
  if (day.getFullYear() !== currentYear) options.year = 'numeric';
  return day.toLocaleDateString('en-US', options);
}

function guideHeader(guide, isDraft) {
  return `
    ${isDraft ? '<p class="draft-status">Unlisted draft</p>' : ''}
    ${sermonHeading(guide)}
    <div class="date-share">
      <p class="subtitle">${guide.speaker ? '<a class="speaker-link" href="?speaker=' + encodeURIComponent(guide.speaker) + '">' + esc(guide.speaker) + '</a> • ' : ''}${esc(headerDate(guide.date))}</p>
      <span class="permalink-separator" aria-hidden="true">•</span>
      <button class="copy-link" id="copy-link" aria-label="Copy link to this week" title="Copy link to this week">
        <span aria-hidden="true">🔗</span>
      </button>
      <span class="share-status" id="share-status" role="status"></span>
      <input class="permalink-field" id="permalink-field" aria-label="Link to this week" readonly hidden>
    </div>`;
}

function sermonRecording(guide, isDraft) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(guide.videoId || '')) {
    return isDraft ? '<p>Recording to be added.</p>' : '';
  }

  const videoId = esc(guide.videoId);
  return `
    <div class="video">
      <iframe src="https://www.youtube-nocookie.com/embed/${videoId}"
        title="Sermon for ${esc(date(guide.date))}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
    <p class="video-link">
      <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">Open sermon on YouTube</a>
    </p>`;
}

function scriptureLine(line) {
  const spans = Array.isArray(line) ? line : [line];
  return spans.map(span => {
    if (typeof span === 'string') return esc(span);
    const text = esc(span.text);
    return span.redLetter === true ? `<span class="red-letter">${text}</span>` : text;
  }).join('');
}

function scriptureReading(guide) {
  const groups = guide.scriptureGroups;
  const paragraphs = groups
    ? groups.map(group => '<p>' + group.map(scriptureLine).join('<br>') + '</p>')
    : (guide.scripture || []).map(paragraph => '<p>' + scriptureLine(paragraph) + '</p>');
  return `
    <blockquote${groups ? ' class="scripture-poetry"' : ''}>${paragraphs.join('')}</blockquote>
    <p class="credit">${textHtml(guide.scriptureCredit)}</p>`;
}

function openLinkedSlide(fragment) {
  const match = /^#slide-([1-9]\d*)$/.exec(fragment);
  const track = document.getElementById('slide-track');
  const index = match ? Number(match[1]) - 1 : -1;
  if (!track || index < 0 || index >= track.children.length) return false;

  const deck = track.closest('details');
  deck.open = true;
  track.scrollTo({ left: index * track.clientWidth, behavior: 'instant' });
  track.focus({ preventScroll: true });
  deck.scrollIntoView({ block: 'start' });
  return true;
}

function groupQuestionList(guide, questions) {
  if (!guide.extraFollowUps) return list(questions, 'ol', 'A');
  const entries = questions.map((question, index) => {
    const reading = guide.extraReadings?.[index];
    const followUp = guide.extraFollowUps[index];
    return `<li><p>${reading ? `${textHtml(reading)} ` : ''}${textHtml(question)}</p>${followUp ? `<ul id="group-follow-up-${index}" class="group-follow-up" hidden><li>${textHtml(followUp)}</li></ul>` : ''}</li>`;
  }).join('');
  const controls = guide.extraFollowUps.map((text, index) => text ? `group-follow-up-${index}` : '').filter(Boolean).join(' ');
  return `<button type="button" class="follow-ups-toggle" id="follow-ups-toggle" aria-expanded="false" aria-controls="${controls}">Show Follow-Ups</button><ol type="A">${entries}</ol>`;
}

function renderGuide(guide, isDraft) {
  history.replaceState(null, '', '?week=' + encodeURIComponent(guide.id) + location.hash);
  document.querySelectorAll('.week').forEach(link => {
    link.setAttribute('aria-current', String(link.dataset.id === guide.id));
  });
  document.title = guide.title + ' · NC Young Professionals';

  const slideBackground = seriesById.get(guide.series)?.slideBackground;
  const extraQuestions = (guide.extra || []).filter(question => {
    const text = Array.isArray(question) ? question.map(part => part.text).join('') : question;
    return text.trim().length > 0;
  });
  const slides = guide.slides?.length
    ? fold('Slide Deck', slideDeck(guide.slides), false, 'slide-deck-section')
    : '';
  const groupQuestions = extraQuestions.length
    ? fold('NC Young Professionals Discussion Questions', groupQuestionList(guide, extraQuestions))
    : '';

  document.getElementById('article').innerHTML = `
    ${guideHeader(guide, isDraft)}
    ${teaser(guide.description || [])}
    ${fold('Recording', sermonRecording(guide, isDraft), true, 'recording')}
    ${slides}
    ${fold('Scripture Reading', scriptureReading(guide))}
    ${fold('Big Ideas', list(guide.ideas))}
    ${fold('NC Discussion Questions', list(guide.questions, 'ol'))}
    ${groupQuestions}`;

  setupSlides();
  setupPermalink(guide.id);
  const followUpsToggle = document.getElementById('follow-ups-toggle');
  if (followUpsToggle) followUpsToggle.addEventListener('click', () => {
    const show = followUpsToggle.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('.group-follow-up').forEach(item => { item.hidden = !show; });
    followUpsToggle.setAttribute('aria-expanded', String(show));
    followUpsToggle.textContent = show ? 'Hide Follow-Ups' : 'Show Follow-Ups';
  });
  setupSlideBackground(document.querySelector('.slide-deck-section'), slideBackground);
  document.getElementById('article').onclick = event => {
    const link = event.target.closest('a[data-slide]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!openLinkedSlide(link.hash)) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  };
  openLinkedSlide(location.hash);
}

function setupPermalink(id){
  document.getElementById('copy-link').onclick=async()=>{
    const url=new URL(location.href);
    url.search='?week='+encodeURIComponent(id);
    url.hash='';
    const status=document.getElementById('share-status');
    try{
      await navigator.clipboard.writeText(url.href);
      status.textContent='Link copied';
    }catch{
      const field=document.getElementById('permalink-field');
      field.hidden=false;
      field.value=url.href;
      field.focus();
      field.select();
      status.textContent='Select and copy this link';
    }
  };
}

const archive = document.getElementById('archive');
const archiveDialog = document.getElementById('sermon-archive');
const archiveToggle = document.getElementById('archive-toggle');
function setArchive(open) {
  if (open && !archiveDialog.open) {
    closeSeriesTooltip();
    archiveDialog.showModal();
    archiveToggle.setAttribute('aria-expanded', 'true');
    const current = archive.querySelector('[aria-current="true"]');
    if (current) {
      current.focus({ preventScroll: true });
      current.scrollIntoView({ block: 'nearest' });
    }
  } else if (!open && archiveDialog.open) {
    archiveDialog.close();
  }
}
archiveToggle.onclick = () => setArchive(!archiveDialog.open);
document.getElementById('archive-close').onclick = () => setArchive(false);
archiveDialog.addEventListener('click', event => {
  const bounds = archiveDialog.getBoundingClientRect();
  if (event.target === archiveDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) setArchive(false);
});
archiveDialog.addEventListener('close', () => {
  archiveToggle.setAttribute('aria-expanded', 'false');
  archiveToggle.focus();
});

function sermonArchiveEntry(guide) {
  const title = guide.sermonTitle || guide.title;
  const part = guide.partLabel ? '<span class="archive-part">' + esc(guide.partLabel) + ' · </span>' : '';
  const metadata = seriesPartDate(guide.date) + (guide.speaker ? ' • ' + guide.speaker : '');
  return `<a class="week" href="?week=${encodeURIComponent(guide.id)}" data-id="${esc(guide.id)}" aria-current="false"><strong class="archive-sermon-title">${part}${esc(title)}</strong><span class="archive-metadata">${esc(metadata)}</span></a>`;
}
function groupedSermonArchive(entries) {
  const groups = [];
  for (const entry of entries) {
    const series = seriesById.has(entry.series) ? entry.series : null;
    let group = groups.at(-1);
    if (!group || group.series !== series) {
      group = { series, entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups.map((group, index) => {
    const heading = group.series
      ? `<a href="?series=${encodeURIComponent(group.series)}">${esc(seriesById.get(group.series).name)}</a>`
      : 'Standalone Sermons';
    return `<section class="archive-group" aria-labelledby="archive-group-${index}"><h3 id="archive-group-${index}">${heading}</h3><div class="archive-group-entries">${group.entries.map(sermonArchiveEntry).join('')}</div></section>`;
  }).join('');
}
function setupArchive() {
  archive.innerHTML = groupedSermonArchive(listedWeeks);
  archive.querySelectorAll('.week').forEach(link => {
    link.onclick = async event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      history.pushState(null, '', link.getAttribute('href'));
      setArchive(false);
      await show(link.dataset.id);
      const heading = document.querySelector('#article h1');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start' });
      }
    };
  });
}


let speakerObserver;
function collectionSermonEntry(entry, kind) {
  const series = seriesById.get(entry.series)?.name;
  return `<section class="speaker-sermon" data-guide-id="${esc(entry.id)}">
    <h2><a href="?week=${encodeURIComponent(entry.id)}">${esc(entry.sermonTitle || entry.title)}</a></h2>
    ${kind === 'series'
      ? (entry.partLabel ? `<p class="speaker-series">${esc(entry.partLabel)}</p>` : '')
      : (series ? `<p class="speaker-series"><em><a href="?series=${encodeURIComponent(entry.series)}">${esc(series)}</a>${entry.partLabel ? ', ' + esc(entry.partLabel) : ''}</em></p>` : '')}
    <p class="speaker-date">${entry.speaker ? `<a class="speaker-link" href="?speaker=${encodeURIComponent(entry.speaker)}">${esc(entry.speaker)}</a> • ` : ''}${esc(date(entry.date))}</p>
    <div class="speaker-sermon-body"><div class="speaker-description"><p role="status">Loading description…</p></div></div>
  </section>`;
}
function showSpeaker(name) {
  return showSermonCollection('Sermons by ' + name, entry => entry.speaker === name, 'speaker', `Sermons by <strong>${esc(name)}</strong>`);
}
function showSeries(id) {
  const name = seriesById.get(id)?.name;
  return showSermonCollection(name ? 'Sermons in ' + name + ' Series' : 'Series not found', entry => Boolean(name) && entry.series === id, 'series', name ? `Sermons in <strong>${esc(name)}</strong> Series` : 'Series not found');
}
async function showSermonCollection(title, matches, kind, heading = esc(title)) {
  const request = ++navigation;
  speakerObserver?.disconnect();
  closeSeriesTooltip();
  setDraftIndexing(false);
  const article = document.getElementById('article');
  article.onclick = null;
  document.title = title + ' · NC Young Professionals';
  document.querySelectorAll('.week').forEach(link => link.setAttribute('aria-current', 'false'));
  const entries = listedWeeks.filter(matches);
  article.innerHTML = `<h1 class="speaker-heading">${heading}</h1>
    ${entries.length ? entries.map(entry => collectionSermonEntry(entry, kind)).join('') : '<p>No published sermons found for this ' + kind + '.</p>'}`;
  setupSlides();
  // Fetch only nearby cards, with bounded concurrency even for a large archive.
  const queue = [];
  let active = 0;
  async function loadCard(card) {
    const entry = entries.find(entry => entry.id === card.dataset.guideId);
    try {
      const guide = await loadGuide(entry.file);
      if (request !== navigation) return;
      card.querySelector('.speaker-description').innerHTML = (guide.description || []).map(
        paragraph => '<p>' + descriptionHtml(paragraph) + '</p>'
      ).join('');
      if (/^[A-Za-z0-9_-]{11}$/.test(guide.videoId || '')) {
        const thumbnail = document.createElement('a');
        thumbnail.className = 'speaker-thumbnail';
        thumbnail.href = '?week=' + encodeURIComponent(entry.id);
        thumbnail.setAttribute('aria-label', 'Open ' + (entry.sermonTitle || entry.title));
        // The small-screen source is empty: phones never download a video thumbnail.
        thumbnail.innerHTML = `<picture><source media="(min-width: 701px)" srcset="https://i.ytimg.com/vi/${guide.videoId}/mqdefault.jpg"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" width="320" height="180" loading="lazy" decoding="async"></picture>`;
        card.querySelector('.speaker-sermon-body').prepend(thumbnail);
      }
    } catch {
      if (request === navigation) card.querySelector('.speaker-description').innerHTML =
        '<p>Description could not load. <a href="?week=' + encodeURIComponent(entry.id) + '">Open the sermon guide</a>.</p>';
    }
  }
  function drain() {
    if (request !== navigation) return;
    while (active < 4 && queue.length) {
      active++;
      loadCard(queue.shift()).finally(() => { active--; drain(); });
    }
  }
  const cards = article.querySelectorAll('.speaker-sermon');
  if ('IntersectionObserver' in window) {
    speakerObserver = new IntersectionObserver(items => {
      for (const item of items) {
        if (!item.isIntersecting) continue;
        speakerObserver.unobserve(item.target);
        queue.push(item.target);
      }
      drain();
    }, { rootMargin: '400px' });
    cards.forEach(card => speakerObserver.observe(card));
  } else {
    queue.push(...cards);
    drain();
  }
}

function showRequestedGuide(){
  const params = new URLSearchParams(location.search);
  if (params.has('speaker')) return showSpeaker(params.get('speaker'));
  if (params.has('series')) return showSeries(params.get('series'));
  speakerObserver?.disconnect();
  return show(params.get('week'));
}

async function start(){
  setupTranslations().catch(error=>console.error('Could not load Bible translations',error));
  try{
    const data=await readJson('guides.json');
    seriesById=new Map(Object.entries(data.series));
    weeks=data.guides;
    listedWeeks=weeks.filter(w=>w.published===true).sort((a,b)=>b.date.localeCompare(a.date));
    setupArchive();
    addEventListener('popstate',showRequestedGuide);
    await showRequestedGuide();
  }catch{
    document.getElementById('article').innerHTML='<p>The guide could not load. Please refresh.</p>';
  }
}
start();

// Adapt anchor clearance when the header wraps or reading preferences change.
const stickyHeader = document.querySelector('header');
if (stickyHeader) {
  const updateHeaderHeight = () => {
    document.documentElement.style.setProperty('--header-height', `${stickyHeader.getBoundingClientRect().height}px`);
  };
  updateHeaderHeight();
  new ResizeObserver(updateHeaderHeight).observe(stickyHeader);
}
