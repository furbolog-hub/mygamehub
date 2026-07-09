'use strict';
/*
 * viewport-fit.js — единый надёжный контроллер видимой области.
 *
 * Задача: интерфейс должен точно вписываться в реально видимую высоту на
 * любом устройстве и в любом контексте — обычный браузер (десктоп/мобильный),
 * Safari на iPhone, а также Telegram Mini App на телефоне И на планшете.
 *
 * Скрипт НЕ трогает игровую механику, математику, анимации и тестовую панель.
 * Он только: определяет контекст, выставляет классы is-telegram/is-browser,
 * держит переменную --fit-height равной фактической видимой высоте и просит
 * Telegram развернуть мини-апп. Значение --fit-height имеет приоритет в CSS.
 */
(() => {
  const root = document.documentElement;
  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  // Реальный Telegram-контекст: официальный bridge создаётся и в обычном Safari,
  // поэтому проверяем данные запуска, а не только наличие объекта.
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
  };

  // Наилучшая доступная видимая высота для текущего контекста.
  const measureHeight = () => {
    let h = 0;
    if (isTelegram && tg) {
      // Стабильная высота окна мини-аппа — единственный корректный источник
      // на планшетах/десктопе, где Telegram открывает окно фиксированного размера.
      h = Number(tg.viewportStableHeight) || Number(tg.viewportHeight) || 0;
    }
    if (!(h > 0) && window.visualViewport && Number.isFinite(window.visualViewport.height)) {
      h = window.visualViewport.height;
    }
    if (!(h > 0)) h = window.innerHeight;
    return (h > 0) ? Math.round(h) : 0;
  };

  let frame = 0;
  const apply = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const h = measureHeight();
      if (h > 0) root.style.setProperty('--fit-height', `${h}px`);
    });
  };

  // Первичная посадка + повторные замеры, чтобы поймать позднюю раскладку
  // (анимация раскрытия Telegram, появление/скрытие адресной строки и т.п.).
  apply();
  [60, 200, 500, 1000].forEach(t => setTimeout(apply, t));

  window.addEventListener('resize', apply, { passive: true });
  window.addEventListener('orientationchange', () => { apply(); setTimeout(apply, 250); }, { passive: true });
  window.addEventListener('pageshow', apply, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', apply, { passive: true });
    window.visualViewport.addEventListener('scroll', apply, { passive: true });
  }

  if (isTelegram && tg) {
    try { tg.ready(); } catch (_) {}
    try { tg.expand(); } catch (_) {}
    // Не даём мини-аппу произвольно «уезжать»/закрываться свайпом (если поддерживается).
    try { tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (_) {}
    try { tg.onEvent && tg.onEvent('viewportChanged', apply); } catch (_) {}
    try { tg.onEvent && tg.onEvent('safeAreaChanged', apply); } catch (_) {}
    try { tg.onEvent && tg.onEvent('fullscreenChanged', apply); } catch (_) {}
  }

  if (document.body) {
    setBodyClasses();
  } else {
    document.addEventListener('DOMContentLoaded', () => { setBodyClasses(); apply(); }, { once: true });
  }
})();
