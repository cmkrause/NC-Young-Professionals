/* Shared on-demand video player for NC Young Professionals. No dependencies. */
(() => {
  'use strict';
  const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);
  const validMuxId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{20,128}$/.test(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = url => typeof url === 'string' && /^https:\/\/[^\s]+$/i.test(url);
  // Provider adapters share the same facade, activation handler, and fallback links.
  const providers = Object.freeze({
    youtube: {
      valid: validId,
      thumbnail: id => 'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',
      embed: id => 'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&playsinline=1',
      width:480,height:360
    },
    mux: {
      valid: validMuxId,
      thumbnail: id => 'https://image.mux.com/'+id+'/thumbnail.jpg?width=640',
      embed: id => 'https://player.mux.com/'+id+'?player=mux-player&autoplay=true&playsinline=true',
      width:640,height:360
    }
  });
  const adapter = provider => Object.hasOwn(providers,provider) ? providers[provider] : null;
  function render({provider='youtube',id,youtubeId,title='Video',youtubeLabel='Watch on YouTube',sourceUrl,sourceLabel='Original video'} = {}) {
    const chosen=adapter(provider), fallbackId=validId(youtubeId)?youtubeId:provider==='youtube'&&validId(id)?id:null;
    // An invalid or unknown preferred provider must never produce an empty player.
    if(!chosen?.valid(id)){
      provider='youtube';id=fallbackId;
    }
    const active=adapter(provider),valid=active?.valid(id),name=escape(title);
    const facade=valid?'<div class="nc-video-player" data-nc-provider="'+provider+'" data-nc-video="'+id+'" data-nc-video-title="'+name+'">'+
      '<button type="button" class="nc-video-play" aria-label="Play '+name+'">'+
      '<img class="nc-video-thumbnail" src="'+escape(active.thumbnail(id))+'" alt="" width="'+active.width+'" height="'+active.height+'" loading="lazy" decoding="async">'+
      '<span class="nc-video-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M8 5v14l12-7z" fill="currentColor"/></svg></span>'+
      '<span class="nc-video-play-caption">Play video</span></button></div>':'';
    const links=[];
    if(fallbackId)links.push('<a href="https://www.youtube.com/watch?v='+fallbackId+'" target="_blank" rel="noopener">'+escape(youtubeLabel)+'</a>');
    if(safeUrl(sourceUrl))links.push('<a href="'+escape(sourceUrl)+'" target="_blank" rel="noopener">'+escape(sourceLabel)+'</a>');
    return facade||links.length?'<div class="nc-video">'+facade+(links.length?'<div class="nc-video-links">'+links.join('<span aria-hidden="true"> · </span>')+'</div>':'')+'</div>':'';
  }
  function activate(button) {
    const player=button.closest('.nc-video-player'),id=player?.dataset.ncVideo;
    const provider=player?.dataset.ncProvider||'youtube',chosen=adapter(provider);
    if(!player||!chosen?.valid(id)||player.querySelector('iframe'))return;
    const iframe=document.createElement('iframe');
    iframe.title=player.dataset.ncVideoTitle||'Video';
    iframe.src=chosen.embed(id);
    iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen=true;
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    player.replaceChildren(iframe);
    iframe.focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.nc-video-play');
    if(button)activate(button);
  });
  document.addEventListener('error',event=>{
    if(event.target.matches?.('.nc-video-thumbnail'))event.target.hidden=true;
  },true);
  window.NCVideoPlayer=Object.freeze({render,validId,validMuxId});
})();
