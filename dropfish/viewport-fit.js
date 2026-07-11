'use strict';
/*
 * viewport-fit.js — единый надёжный контроллер видимой области.
 *
 * Задачи:
 *  1) Интерфейс точно вписывается в реально видимую высоту на любом
 *     устройстве и в любом контексте (браузер, Safari, Telegram Mini App
 *     на телефоне и планшете).
 *  2) В Telegram мини-апп раскрывается на весь экран (как это делают другие
 *     игры) — через requestFullscreen(), с корректным учётом «безопасных зон»
 *     Telegram, чтобы шапка не залезала под плавающие кнопки (закрыть/⋯).
 *
 * Скрипт НЕ трогает игровую механику, математику, анимации и тестовую панель.
 * Он лишь: определяет контекст, ставит классы is-telegram/is-browser/
 * tg-fullscreen, держит --fit-height равным видимой высоте, прокидывает
 * безопасные зоны Telegram в CSS-переменные и просит клиент раскрыться.
 */
(() => {
  const root = document.documentElement;
  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  const launchText = `${location.search} ${location.hash}`;
  const isTelegram = Boolean(
    tg && (
      (tg.initData && tg.initData.length > 0) ||
      (tg.platform && tg.platform !== 'unknown') ||
      /tgWebApp(?:Data|Version|Platform|ThemeParams)/i.test(launchText)
    )
  );

  const setBodyClasses = () => {
    const body = document.body;
    if (!body) return;
    body.classList.toggle('is-telegram', isTelegram);
    body.classList.toggle('is-browser', !isTelegram);
    body.classList.toggle('tg-fullscreen', Boolean(isTelegram && tg && tg.isFullscreen));
  };

  // Видимая высота: на планшете/десктопе Telegram открывает окно фиксированного
  // размера, поэтому единственный корректный источник — стабильная высота окна.
  const measureHeight = () => {
    let h = 0;
    if (isTelegram && tg) {
      h = Number(tg.viewportStableHeight) || Number(tg.viewportHeight) || 0;
    }
    if (!(h > 0) && window.visualViewport && Number.isFinite(window.visualViewport.height)) {
      h = window.visualViewport.height;
    }
    if (!(h > 0)) h = window.innerHeight;
    return (h > 0) ? Math.round(h) : 0;
  };

  // Безопасные зоны Telegram. В полноэкранном режиме env(safe-area-inset-*)
  // внутри вебвью Telegram работает ненадёжно, поэтому берём значения из API:
  // на каждую сторону — максимум из системной и контентной зоны.
  const px = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
  const applyInsets = () => {
    if (!(isTelegram && tg)) return;
    const sa = tg.safeAreaInset || {};
    const ca = tg.contentSafeAreaInset || {};
    const top = Math.max(px(sa.top), px(ca.top));
    const bottom = Math.max(px(sa.bottom), px(ca.bottom));
    const left = Math.max(px(sa.left), px(ca.left));
    const right = Math.max(px(sa.right), px(ca.right));
    root.style.setProperty('--tg-inset-top', `${top}px`);
    root.style.setProperty('--tg-inset-bottom', `${bottom}px`);
    root.style.setProperty('--tg-inset-left', `${left}px`);
    root.style.setProperty('--tg-inset-right', `${right}px`);
  };

  let frame = 0;
  const apply = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const h = measureHeight();
      if (h > 0) root.style.setProperty('--fit-height', `${h}px`);
      applyInsets();
      setBodyClasses();
    });
  };

  apply();
  [60, 200, 500, 1000, 1800].forEach(t => setTimeout(apply, t));

  window.addEventListener('resize', apply, { passive: true });
  window.addEventListener('orientationchange', () => { apply(); setTimeout(apply, 250); setTimeout(apply, 600); }, { passive: true });
  window.addEventListener('pageshow', apply, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', apply, { passive: true });
    window.visualViewport.addEventListener('scroll', apply, { passive: true });
  }

  if (isTelegram && tg) {
    try { tg.ready(); } catch (_) {}
    try { tg.expand(); } catch (_) {}
    try { tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (_) {}

    // Полноэкранный режим (Bot API 8.0+). На старых клиентах метода нет или он
    // отклоняется (fullscreenFailed) — тогда остаёмся в развёрнутом окне, а
    // интерфейс всё равно корректен за счёт прокрутки и закреплённых кнопок.
    const wantFullscreen = () => {
      try {
        const supported = typeof tg.isVersionAtLeast !== 'function' || tg.isVersionAtLeast('8.0');
        if (supported && typeof tg.requestFullscreen === 'function' && !tg.isFullscreen) {
          tg.requestFullscreen();
        }
      } catch (_) {}
    };
    wantFullscreen();
    setTimeout(wantFullscreen, 300);

    const onEvt = (name, fn) => { try { tg.onEvent && tg.onEvent(name, fn); } catch (_) {} };
    onEvt('viewportChanged', apply);
    onEvt('safeAreaChanged', apply);
    onEvt('contentSafeAreaChanged', apply);
    onEvt('fullscreenChanged', apply);
    onEvt('fullscreenFailed', apply);
    onEvt('activated', apply);

    // Иногда безопасные зоны приходят не сразу — попросим клиент прислать их.
    try { tg.postEvent && tg.postEvent('web_app_request_safe_area', {}); } catch (_) {}
    try { tg.postEvent && tg.postEvent('web_app_request_content_safe_area', {}); } catch (_) {}
  }

  if (document.body) {
    setBodyClasses();
  } else {
    document.addEventListener('DOMContentLoaded', () => { setBodyClasses(); apply(); }, { once: true });
  }
})();
