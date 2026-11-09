'use strict';
(() => {
  const KEY = 'dropfishSoundsEnabled';
  let enabled = localStorage.getItem(KEY) !== 'false';
  const originalPlay = HTMLMediaElement.prototype.play;
  if (!HTMLMediaElement.prototype.__dropfishSoundGuard) {
    Object.defineProperty(HTMLMediaElement.prototype, '__dropfishSoundGuard', { value: true });
    HTMLMediaElement.prototype.play = function(...args) {
      const src = String(this.currentSrc || this.src || '');
      if (!enabled && /\.ogg(?:$|\?)/i.test(src)) return Promise.resolve();
      return originalPlay.apply(this, args);
    };
  }
  const render = () => {
    const button = document.getElementById('soundToggleBtn');
    if (!button) return;
    const iconHost = button.querySelector('[data-sound-icon]');
    const label = button.querySelector('[data-sound-label]');
    const iconMarkup = `<span class="ui-icon"><img src="./assets/icons/ui/${enabled?'sound-on.webp':'sound-off.webp'}" alt="" aria-hidden="true" decoding="async"></span>`;
    if (iconHost) iconHost.innerHTML = iconMarkup;
    else button.innerHTML = iconMarkup;
    if (label) label.textContent = enabled ? 'Звуки включены' : 'Звуки выключены';
    button.title = enabled ? 'Отключить звуки' : 'Включить звуки';
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', String(!enabled));
    button.classList.toggle('is-muted', !enabled);
  };
  const init = () => {
    const button = document.getElementById('soundToggleBtn');
    if (!button) return;
    render();
    button.addEventListener('click', () => {
      enabled = !enabled;
      localStorage.setItem(KEY, String(enabled));
      if (!enabled) document.querySelectorAll('audio').forEach(audio => { try { audio.pause(); audio.currentTime = 0; } catch (_) {} });
      window.dispatchEvent(new CustomEvent('dropfishsoundchange', { detail: { enabled } }));
      render();
    });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init, { once: true }) : init();
})();
