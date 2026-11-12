(() => {
  'use strict';

  // Source-only file. The public release contains only its obfuscated bundle.

  const game = document.documentElement.dataset.game;
  if (!['dropfish', 'agroclick'].includes(game)) return;

  const copy = game === 'dropfish'
    ? {
        title: 'DropFish',
        action: 'Начать рыбалку',
        done: 'Сегодня вы уже рыбачили, приходите через:',
        review: 'Посмотреть результаты рыбалки'
      }
    : {
        title: 'AgroClick',
        action: 'Начать сбор урожая',
        done: 'Сегодня вы уже собирали урожай, приходите через:',
        review: 'Посмотреть результаты сбора'
      };

  const INSTALL_KEY = 'daygamehub.install.v1';
  const DROP_STORAGE_KEY = 'proFishingDailySessionV3';
  const DROP_LEGACY_TEST_STORAGE_KEY = 'proFishingTestSessionV1';
  const AGRO_STORAGE_KEY = 'agroClickPublicSessionV1';
  let serverOffset = 0;
  let resetAt = 0;
  let countdownTimer = 0;

  function installId() {
    let value = localStorage.getItem(INSTALL_KEY);
    if (!/^[a-f0-9-]{32,64}$/i.test(value || '')) {
      value = crypto.randomUUID();
      localStorage.setItem(INSTALL_KEY, value);
    }
    return value;
  }

  function requestPayload(extra = {}) {
    return {
      game,
      installId: installId(),
      telegramInitData: window.Telegram?.WebApp?.initData || '',
      ...extra
    };
  }

  async function api(path, payload) {
    const response = await fetch(`https://game-portal-daily-limit.daygamehub.workers.dev${path}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      cache: 'no-store',
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `http_${response.status}`);
    return data;
  }

  function localResultAvailable() {
    try {
      if (game === 'dropfish') {
        const dailySaved = JSON.parse(localStorage.getItem(DROP_STORAGE_KEY) || 'null');
        const legacySaved = JSON.parse(localStorage.getItem(DROP_LEGACY_TEST_STORAGE_KEY) || 'null');
        const saved = dailySaved || legacySaved;
        const state = saved?.state
          ? (typeof saved.state === 'string' ? JSON.parse(saved.state) : saved.state)
          : null;
        if (!dailySaved && legacySaved && state?.finished && state?.finalResult) {
          localStorage.setItem(DROP_STORAGE_KEY, JSON.stringify(legacySaved));
        }
        return Boolean(state?.finished && state?.finalResult);
      }
      const state = JSON.parse(localStorage.getItem(AGRO_STORAGE_KEY) || 'null');
      return Boolean(state?.finished && state?.finalResult);
    } catch (error) {
      console.warn('Saved result check failed', error);
      return false;
    }
  }

  function unlock() {
    document.querySelector('.public-gate')?.remove();
    document.documentElement.classList.remove('public-game-locked');
  }

  function openSavedResults() {
    document.documentElement.classList.remove('public-game-locked');
    document.documentElement.classList.add('public-results-review');
    const gate = document.querySelector('.public-gate');
    const card = gate?.querySelector('.public-gate-card');
    gate?.classList.add('is-review');
    if (card) {
      card.innerHTML = `
        <p>${copy.done}</p>
        <strong class="public-countdown">--:--:--</strong>
        <a href="../">К выбору игр</a>`;
      const countdown = card.querySelector('.public-countdown');
      if (countdown) countdown.textContent = formatDuration(resetAt - (Date.now() + serverOffset));
    }
    requestAnimationFrame(() => {
      if (game === 'agroclick') {
        document.getElementById('resultsBtn')?.click();
        return;
      }
      const result = document.getElementById('resultCard');
      result?.scrollIntoView({behavior: 'smooth', block: 'center'});
    });
  }

  function formatDuration(milliseconds) {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    return [
      Math.floor(seconds / 3600),
      Math.floor(seconds % 3600 / 60),
      seconds % 60
    ].map(value => String(value).padStart(2, '0')).join(':');
  }

  function showFinishedGate(message = copy.done) {
    const card = document.querySelector('.public-gate-card');
    if (!card) return;
    const canReview = localResultAvailable();
    card.innerHTML = `
      <h1>${copy.title}</h1>
      <p>${message}</p>
      <strong class="public-countdown">--:--:--</strong>
      ${canReview ? `<button type="button" class="public-gate-review">${copy.review}</button>` : ''}
      <a href="../">К выбору игр</a>`;
    card.querySelector('.public-gate-review')?.addEventListener('click', openSavedResults);

    const update = () => {
      const remaining = resetAt - (Date.now() + serverOffset);
      const countdown = document.querySelector('.public-countdown');
      if (countdown) countdown.textContent = formatDuration(remaining);
      if (remaining <= 0) location.reload();
    };
    clearInterval(countdownTimer);
    update();
    countdownTimer = window.setInterval(update, 1000);
  }

  async function claimSession(button) {
    button.disabled = true;
    button.textContent = 'Проверяем лимит…';
    try {
      const result = await api('/v1/session/claim', requestPayload());
      serverOffset = Number(result.serverNow) - Date.now();
      resetAt = Number(result.resetAt);
      if (result.allowed) {
        unlock();
      } else {
        showFinishedGate();
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = copy.action;
      document.querySelector('.public-gate-status').textContent =
        'Не удалось проверить суточный лимит. Проверьте интернет и попробуйте ещё раз.';
      console.warn('Daily session check failed', error);
    }
  }

  window.PublicSession = Object.freeze({
    finish: async result => {
      try {
        return await api('/v1/session/finish', requestPayload({result}));
      } catch (error) {
        console.warn('Session finish registration failed', error);
        return null;
      }
    }
  });

  document.documentElement.classList.add('public-game-locked');
  document.addEventListener('DOMContentLoaded', () => {
    const gate = document.createElement('div');
    gate.className = 'public-gate';
    gate.innerHTML = `<section class="public-gate-card" role="dialog" aria-modal="true">
      <h1>${copy.title}</h1>
      <p>Доступна одна игровая сессия в сутки. Лимит сбрасывается в 00:00 по московскому времени.</p>
      <button type="button" class="public-gate-start">${copy.action}</button>
      <small class="public-gate-status" aria-live="polite"></small>
      <a href="../">К выбору игр</a>
    </section>`;
    document.body.append(gate);
    gate.querySelector('.public-gate-start')
      .addEventListener('click', event => claimSession(event.currentTarget));
  });
})();
