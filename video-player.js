/* Shared on-demand YouTube player for NC Young Professionals. No dependencies. */
(() => {
  'use strict';
  const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = url => typeof url === 'string' && /^https:\/\/[^\s]+$/i.test(url);
  function render({id, title='Video', youtubeLabel='Watch on YouTube', sourceUrl, sourceLabel='Original video'} = {}) {
    const valid = validId(id), name=escape(title);
    const facade = valid ? '<div class="nc-video-player" data-nc-video="'+id+'" data-nc-video-title="'+name+'">'+
      '<button type="button" class="nc-video-play" aria-label="Play '+name+'">'+
      '<img class="nc-video-thumbnail" src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async">'+
      '<span class="nc-video-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M8 5v14l12-7z" fill="currentColor"/></svg></span>'+
      '<span class="nc-video-play-caption">Play video</span></button></div>' : '';
    const links=[];
    if(valid)links.push('<a href="https://www.youtube.com/watch?v='+id+'" target="_blank" rel="noopener">'+escape(youtubeLabel)+'</a>');
    if(safeUrl(sourceUrl))links.push('<a href="'+escape(sourceUrl)+'" target="_blank" rel="noopener">'+escape(sourceLabel)+'</a>');
    return facade||links.length ? '<div class="nc-video">'+facade+(links.length?'<div class="nc-video-links">'+links.join('<span aria-hidden="true"> · </span>')+'</div>':'')+'</div>' : '';
  }
  function activate(button) {
    const player=button.closest('.nc-video-player'),id=player?.dataset.ncVideo;
    if(!player||!validId(id)||player.querySelector('iframe'))return;
    const iframe=document.createElement('iframe');
    iframe.title=player.dataset.ncVideoTitle||'YouTube video';
    iframe.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&playsinline=1';
    iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen=true;
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    player.replaceChildren(iframe);
    // Keep keyboard focus in the player after the activating button is removed.
    iframe.focus({preventScroll:true});
  }
  // One delegated handler works for initial and dynamically rendered guides.
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.nc-video-play');
    if(button)activate(button);
  });
  // Image loading is optional; a failed thumbnail leaves an actionable play control.
  document.addEventListener('error',event=>{
    if(event.target.matches?.('.nc-video-thumbnail'))event.target.hidden=true;
  },true);
  window.NCVideoPlayer=Object.freeze({render,validId});
})();
