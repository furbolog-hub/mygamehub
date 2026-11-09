/* DropFish mobile shell: fixed-coordinate scene adapter and bottom navigation. */
(() => {
  'use strict';

  const SCENE_WIDTH = 720;
  const SCENE_HEIGHT = 600;
  const MAX_SCENE_SCALE = 0.68;
  const SECTION_NAMES = new Set(['fishing', 'journal', 'collection', 'menu']);

  const init = () => {
    const scene = document.getElementById('mobileFishingScene');
    const chronology = document.getElementById('mobileFishingChronology');
    const artboard = document.querySelector('[data-scene-artboard]');
    const sceneMenuButton = document.getElementById('sceneMenuBtn');
    const portraitRestartSlot = document.getElementById('portraitRestartSlot');
    const menuActions = document.querySelector('#mobileMenuView .mobile-menu-actions');
    const navButtons = [...document.querySelectorAll('[data-mobile-nav]')];
    const sectionViews = new Map(
      [...document.querySelectorAll('[data-mobile-section-view]')]
        .map(view => [view.dataset.mobileSectionView, view])
    );

    if (!scene || !chronology || !artboard || !navButtons.length) return;

    const restartControl = document.getElementById('restartBtn');

    const syncResponsiveControls = () => {
      if (!portraitRestartSlot || !restartControl) return;
      if (!restartControl.hasAttribute('aria-label')) {
        const label = restartControl.querySelector('strong')?.textContent?.trim();
        if (label) restartControl.setAttribute('aria-label', label);
      }
      portraitRestartSlot.append(restartControl);
    };

    let fitFrame = 0;
    const fitScene = () => {
      const width = scene.clientWidth;
      const height = scene.clientHeight;
      if (width <= 0 || height <= 0) return;

      const scale = Math.min(width / SCENE_WIDTH, height / SCENE_HEIGHT, MAX_SCENE_SCALE);
      artboard.style.setProperty('--scene-scale', String(scale));
      artboard.dataset.sceneScale = scale.toFixed(6);
    };
    const scheduleSceneFit = () => {
      cancelAnimationFrame(fitFrame);
      fitFrame = requestAnimationFrame(fitScene);
    };

    const refreshViewportLayout = () => {
      const scroller = document.getElementById('historyScroll');
      const previousTop = scroller?.scrollTop || 0;
      const bottomDistance = scroller
        ? Math.max(0, scroller.scrollHeight - scroller.clientHeight - previousTop)
        : 0;
      const wasAtBottom = bottomDistance <= 24;

      window.syncDropfishViewport?.();
      scheduleSceneFit();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!scroller?.isConnected) return;
        void scroller.offsetHeight;
        const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        scroller.scrollTop = wasAtBottom ? maxTop : Math.min(previousTop, maxTop);
      }));
    };

    const refreshAfterOrientationChange = () => {
      [0, 100, 300, 650].forEach(delay => setTimeout(refreshViewportLayout, delay));
    };

    const setInactive = (element, inactive) => {
      element.hidden = inactive;
      element.setAttribute('aria-hidden', String(inactive));
      if ('inert' in element) element.inert = inactive;
    };

    const refreshJournalSummary = () => {
      const historySummary = document.getElementById('journalHistorySummary');
      const weightSummary = document.getElementById('journalWeightSummary');
      const historyCount = document.getElementById('historyCount');
      const weightLabel = document.getElementById('weightLabel');
      if (historySummary && historyCount) historySummary.textContent = historyCount.textContent.trim() || '0';
      if (weightSummary && weightLabel) weightSummary.textContent = weightLabel.textContent.trim() || '0,0 кг';
    };

    const setSection = (requestedSection, { focusNav = false } = {}) => {
      const section = SECTION_NAMES.has(requestedSection) ? requestedSection : 'fishing';
      const fishingActive = section === 'fishing';

      if (restartControl && portraitRestartSlot && menuActions) {
        if (fishingActive) portraitRestartSlot.append(restartControl);
        else if (section === 'menu') menuActions.prepend(restartControl);
      }

      setInactive(scene, !fishingActive);
      setInactive(chronology, !fishingActive);
      sectionViews.forEach((view, name) => setInactive(view, name !== section));

      navButtons.forEach(button => {
        const active = button.dataset.mobileNav === section;
        button.classList.toggle('is-active', active);
        if (active) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });

      document.body.dataset.mobileSection = section;
      sceneMenuButton?.setAttribute('aria-expanded', String(section === 'menu'));
      if (section === 'journal') refreshJournalSummary();

      if (fishingActive) scheduleSceneFit();
      if (focusNav) {
        navButtons.find(button => button.dataset.mobileNav === section)?.focus({ preventScroll: true });
      }

      window.dispatchEvent(new CustomEvent('dropfishsectionchange', { detail: { section } }));
      return section;
    };

    window.fitDropfishMobileScene = scheduleSceneFit;
    window.setDropfishMobileSection = setSection;

    syncResponsiveControls();
    fitScene();
    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(scheduleSceneFit)
      : null;
    observer?.observe(scene);
    window.addEventListener('resize', refreshViewportLayout, { passive: true });
    window.addEventListener('orientationchange', refreshAfterOrientationChange, { passive: true });
    window.visualViewport?.addEventListener('resize', refreshViewportLayout, { passive: true });

    navButtons.forEach(button => {
      button.addEventListener('click', () => setSection(button.dataset.mobileNav));
    });

    sceneMenuButton?.addEventListener('click', () => setSection('menu'));

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || document.body.dataset.mobileSection === 'fishing') return;
      event.stopPropagation();
      setSection('fishing', { focusNav: true });
    });

    setSection('fishing');
    refreshViewportLayout();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
