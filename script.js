// Время предварительное: 19:00 GMT+2; после согласования укажите точное время.
const OPENING_DATE = '2027-01-22T17:00:00Z';
// URL: YouTube, TikTok, Instagram или прямая ссылка на MP4/WebM/OGV. Пустая строка скрывает плеер.
const VIDEO_URL = 'https://www.youtube.com/shorts/Ay8lynMZ4mE';
// auto распознаёт платформы и расширения; direct — прямая ссылка без расширения.
const VIDEO_TYPE = 'auto';
const target = new Date(OPENING_DATE).getTime();
const fields = ['days', 'hours', 'minutes', 'seconds'].map(id => document.getElementById(id));
function updateCountdown() {
  const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const values = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  fields.forEach((field, index) => { field.textContent = String(values[index]).padStart(2, '0'); });
}
updateCountdown();
setInterval(updateCountdown, 1000);

function videoEmbedUrl(input, mode = 'auto') {
  try {
    if (!input.trim()) return null;
    const url = new URL(input, window.location.href);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (mode === 'direct' || (mode === 'auto' && /\.(mp4|webm|ogv)$/i.test(url.pathname))) {
      return { src: url.href, kind: 'direct', vertical: true };
    }
    if (mode !== 'auto') return null;
    let id;
    if (host === 'youtu.be') id = url.pathname.split('/')[1];
    else if (host === 'youtube.com' || host === 'm.youtube.com') {
      id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    }
    if (id && /^[\w-]{11}$/.test(id)) return { src: `https://www.youtube-nocookie.com/embed/${id}`, vertical: true };
    if (host === 'tiktok.com' || host === 'm.tiktok.com') {
      id = url.pathname.match(/\/video\/(\d+)/)?.[1];
      if (id) return { src: `https://www.tiktok.com/player/v1/${id}?autoplay=0`, vertical: true };
    }
    if (host === 'instagram.com') {
      const match = url.pathname.match(/^\/(p|reel|reels)\/([\w-]+)/);
      if (match) return { src: `https://www.instagram.com/${match[1]}/${match[2]}/embed/`, vertical: true };
    }
  } catch (_) { /* Неподдерживаемая или пустая ссылка оставляет раздел скрытым. */ }
  return null;
}
const video = videoEmbedUrl(VIDEO_URL, VIDEO_TYPE);
if (video) {
  const frame = document.createElement(video.kind === 'direct' ? 'video' : 'iframe');
  frame.src = video.src;
  if (video.kind === 'direct') {
    frame.controls = true;
    frame.preload = 'metadata';
    frame.playsInline = true;
    frame.setAttribute('aria-label', 'Видео Frantz');
    frame.addEventListener('error', () => {
      frame.hidden = true;
      const fallback = document.createElement('a');
      fallback.href = video.src;
      fallback.textContent = 'Не удалось воспроизвести видео. Открыть файл';
      fallback.className = 'video-error';
      frame.parentElement.append(fallback);
    }, { once: true });
  } else {
    frame.title = 'Видео Frantz';
    frame.loading = 'lazy';
    frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
  }
  const videoFrame = document.getElementById('video-frame');
  videoFrame.append(frame);
  videoFrame.classList.toggle('vertical', video.vertical);
  document.getElementById('video-section').hidden = false;

  // На телефоне превью открывает плеер в увеличенном окне.
  const mobileVideo = matchMedia('(max-width: 640px)');
  const openVideo = document.createElement('button');
  openVideo.type = 'button';
  openVideo.className = 'video-open';
  openVideo.setAttribute('aria-label', 'Открыть видео в увеличенном окне');
  openVideo.innerHTML = '<span class="video-open-icon" aria-hidden="true"></span><span class="video-open-label">Смотреть видео</span>';
  videoFrame.append(openVideo);

  const dialog = document.createElement('dialog');
  dialog.className = 'video-dialog';
  dialog.setAttribute('aria-label', 'Видео Frantz');
  dialog.innerHTML = '<div class="video-dialog-content"><button type="button" class="video-close" aria-label="Закрыть видео">×</button><div class="video-dialog-screen"></div></div>';
  document.body.append(dialog);
  const screen = dialog.querySelector('.video-dialog-screen');
  const closeVideo = dialog.querySelector('.video-close');
  let previousOverflow = '';
  function setPreviewAccessibility() {
    const isPreview = mobileVideo.matches && !dialog.open;
    if (isPreview) {
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
    } else {
      frame.removeAttribute('aria-hidden');
      frame.removeAttribute('tabindex');
    }
  }
  openVideo.addEventListener('click', () => {
    previousOverflow = document.body.style.overflow;
    screen.append(frame);
    const fallback = videoFrame.querySelector('.video-error');
    if (fallback) screen.append(fallback);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    setPreviewAccessibility();
    closeVideo.focus();
  });
  closeVideo.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    if (video.kind === 'direct') frame.pause();
    else frame.src = 'about:blank';
    videoFrame.insertBefore(frame, openVideo);
    const fallback = screen.querySelector('.video-error');
    if (fallback) videoFrame.insertBefore(fallback, openVideo);
    if (video.kind !== 'direct') frame.src = video.src;
    document.body.style.overflow = previousOverflow;
    setPreviewAccessibility();
    if (mobileVideo.matches) openVideo.focus();
  });
  mobileVideo.addEventListener('change', () => {
    if (!mobileVideo.matches && dialog.open) dialog.close();
    setPreviewAccessibility();
  });
  setPreviewAccessibility();
}

// Год берётся из локальной даты устройства посетителя.
document.getElementById('footer-year').textContent = new Date().getFullYear();

// Фоны хроник загружаются только при первом выборе; непрозрачность меняется плавно.
const chronicleButtons = [...document.querySelectorAll('.chronicle-button')];
const timeline = document.querySelector('.timeline');
const backdropLayers = new Map([...document.querySelectorAll('.journey-backdrop')].map(layer => [layer.dataset.background, layer]));
let chronicleRequest = 0;
function showChronicle(key) {
  const layer = backdropLayers.get(key);
  if (!layer) return;
  const request = ++chronicleRequest;
  chronicleButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.chronicle === key)));
  const activate = () => {
    if (request !== chronicleRequest) return;
    backdropLayers.forEach(item => item.classList.toggle('is-active', item === layer));
  };
  if (layer.dataset.loaded === 'true') { activate(); return; }
  const image = new Image();
  image.onload = () => { layer.style.backgroundImage = `url("${image.src}")`; layer.dataset.loaded = 'true'; activate(); };
  image.onerror = () => { if (request === chronicleRequest) resetChronicle(); };
  const filenames = { c3: "c3-v3.webp", c4: "c4.webp", c5: "c5-v3.webp", interlude: "interlude-v3.webp" };
  image.src = `../assets/chronicles/${filenames[key]}`;
}
function resetChronicle() {
  chronicleRequest++;
  backdropLayers.forEach(layer => layer.classList.remove('is-active'));
  chronicleButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));
}
chronicleButtons.forEach(button => {
  button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') showChronicle(button.dataset.chronicle); });
  button.addEventListener('focus', () => showChronicle(button.dataset.chronicle));
  button.addEventListener('click', () => showChronicle(button.dataset.chronicle));
});
timeline.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch' && !timeline.contains(document.activeElement)) resetChronicle(); });
timeline.addEventListener('focusout', event => { if (!timeline.contains(event.relatedTarget)) resetChronicle(); });

// Навигация по мобильной карусели с поддержкой пролистывания и клавиатуры.
const carousel = document.getElementById('highlight-carousel');
const carouselCards = [...carousel.querySelectorAll('.highlight-card')];
const carouselDots = [...document.querySelectorAll('.carousel-dots button')];
function setCarouselDot(index) {
  carouselDots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
}
carouselDots.forEach((dot, index) => dot.addEventListener('click', () => {
  const card = carouselCards[index];
  const left = carousel.scrollLeft + card.getBoundingClientRect().left - carousel.getBoundingClientRect().left - 2;
  carousel.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  setCarouselDot(index);
}));
carousel.addEventListener('scroll', () => {
  const left = carousel.getBoundingClientRect().left;
  let index = 0;
  carouselCards.forEach((card, i) => { if (Math.abs(card.getBoundingClientRect().left - left) < Math.abs(carouselCards[index].getBoundingClientRect().left - left)) index = i; });
  setCarouselDot(index);
}, { passive:true });
