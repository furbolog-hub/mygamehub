const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, webkit } = require('playwright');

const root = process.env.PUBLIC_RELEASE_ROOT
  ? path.resolve(process.env.PUBLIC_RELEASE_ROOT)
  : path.resolve(__dirname, '..', 'public-release');
const gameDir = path.join(root, 'dropfish');
const output = path.resolve(__dirname, '..', 'tmp', 'public-dropfish-qa');
const workerUrl = 'https://game-portal-daily-limit.daygamehub.workers.dev';
const liveUrl = process.env.PUBLIC_RELEASE_URL || '';
const viewports = {
  phonePortrait: { width: 390, height: 844 },
  phoneLandscape: { width: 844, height: 390 },
  tabletPortrait: { width: 820, height: 1180 },
  tabletLandscape: { width: 1180, height: 820 },
  desktop: { width: 1440, height: 900 },
};
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function auditReleaseFiles() {
  const html = fs.readFileSync(path.join(gameDir, 'index.html'), 'utf8');
  assert.match(html, /<html lang="ru" data-game="dropfish">/);
  assert.match(html, /\.\.\/session-guard\.css\?v=20261112-daily-limit-protected/);
  assert.match(html, /\.\.\/session-guard\.min\.js\?v=20261112-daily-limit-protected/);
  assert.match(html, /mobile-ui\.css\?v=20261112-dropfish-effects-arcade/);
  assert.match(html, /script\.public\.min\.js\?v=20261112-dropfish-effects-arcade/);
  assert.doesNotMatch(html, /PUBLIC_STRIP_DEBUG|dropfishDebug|debug-toggle|debug-panel|debug-modal|Тестовая панель/i);
  assert.doesNotMatch(html, /src="(?:script|mobile-ui|ui-enhancements|viewport-fit)\.js/i);
  assert.equal(fs.existsSync(path.join(root, 'session-guard.js')), false, 'raw session guard leaked into public-release');

  const bundles = [
    ['session-guard.min.js', path.join(root, 'session-guard.min.js'), 40],
    ['viewport-fit.min.js', path.join(gameDir, 'viewport-fit.min.js'), 20],
    ['mobile-ui.min.js', path.join(gameDir, 'mobile-ui.min.js'), 40],
    ['ui-enhancements.min.js', path.join(gameDir, 'ui-enhancements.min.js'), 20],
    ['script.public.min.js', path.join(gameDir, 'script.public.min.js'), 1000],
  ];
  for (const [name, file, minimum] of bundles) {
    const source = fs.readFileSync(file, 'utf8');
    assert.ok((source.match(/_0x[0-9a-f]+/g) || []).length >= minimum, `${name} is not sufficiently obfuscated`);
    assert.doesNotMatch(source, /buildDropfishDebugPanel|dropfishDebug|data-debug-action|debug-panel/i, `${name} contains debug code`);
  }

  const assetFiles = fs.readdirSync(path.join(gameDir, 'assets'), { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(entry.parentPath || entry.path, entry.name).replaceAll('\\', '/'));
  assert.ok(assetFiles.length >= 490, `public asset set is incomplete: ${assetFiles.length}`);
  assert.ok(assetFiles.every(file => !/chronology-compact-art|chronology-row-art\/.*\.jpg$|debug-panel\.webp$|\.(?:md|gitkeep)$/.test(file)), 'retired/test-only asset leaked');
}

function createServer() {
  return http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(response);
  });
}

async function routeSessionApi(page, allowed) {
  await page.route(`${workerUrl}/**`, async route => {
    const endpoint = new URL(route.request().url()).pathname;
    const now = Date.now();
    const body = endpoint.endsWith('/claim')
      ? { allowed, resumed: false, finished: !allowed, serverNow: now, resetAt: now + 60_000 }
      : { ok: true, resultCode: 'LOCALQA', serverNow: now, resetAt: now + 60_000 };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': new URL(liveUrl || 'http://127.0.0.1:8137').origin },
      body: JSON.stringify(body),
    });
  });
}

async function auditReviewMode(browser, engineName, url) {
  const page = await browser.newPage({ viewport: viewports.phonePortrait, ignoreHTTPSErrors: Boolean(liveUrl) });
  await page.addInitScript(() => {
    localStorage.setItem('proFishingDailySessionV3', JSON.stringify({
      date: '2099-01-01',
      state: { finished: true, finalResult: { total: 1 } },
    }));
  });
  await page.route('**/dropfish/*.min.js*', route => {
    if (route.request().url().includes('session-guard.min.js')) return route.continue();
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  await routeSessionApi(page, false);
  await page.goto(url, { waitUntil: liveUrl ? 'domcontentloaded' : 'load', timeout: 60_000 });
  await page.locator('.public-gate-start').click();
  await page.locator('.public-gate-review').click();
  await page.waitForFunction(() => document.documentElement.classList.contains('public-results-review'));
  const state = await page.evaluate(() => ({
    locked: document.documentElement.classList.contains('public-game-locked'),
    review: document.documentElement.classList.contains('public-results-review'),
    gate: Boolean(document.querySelector('.public-gate.is-review')),
    countdown: document.querySelector('.public-countdown')?.textContent || '',
    restartVisible: getComputedStyle(document.getElementById('restartBtn')).display !== 'none',
  }));
  assert.deepEqual({ locked: state.locked, review: state.review, gate: state.gate, restartVisible: state.restartVisible }, {
    locked: false,
    review: true,
    gate: true,
    restartVisible: false,
  }, `${engineName}: protected review state is wrong`);
  assert.match(state.countdown, /^\d{2}:\d{2}:\d{2}$/, `${engineName}: reset countdown is missing (${JSON.stringify(state)})`);
  await page.close();
}

async function run() {
  auditReleaseFiles();
  fs.mkdirSync(output, { recursive: true });
  const server = liveUrl ? null : createServer();
  if (server) await new Promise((resolve, reject) => server.listen(8137, '127.0.0.1', error => error ? reject(error) : resolve()));
  const url = liveUrl || 'http://127.0.0.1:8137/dropfish/';
  const releaseOrigin = new URL(url).origin;
  let renders = 0;
  try {
    for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
      const browser = await engine.launch({ headless: true });
      try {
        for (const [viewportName, viewport] of Object.entries(viewports)) {
          const page = await browser.newPage({ viewport, ignoreHTTPSErrors: Boolean(liveUrl) });
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          page.on('response', response => {
            if (response.status() >= 400 && response.url().startsWith(releaseOrigin)) errors.push(`${response.status()} ${response.url()}`);
          });
          await routeSessionApi(page, true);
          await page.goto(url, { waitUntil: liveUrl ? 'domcontentloaded' : 'load', timeout: 60_000 });
          assert.ok(await page.locator('html.public-game-locked').count(), `${engineName}/${viewportName}: gate did not lock before claim`);
          await page.locator('.public-gate-start').click();
          await page.waitForFunction(() => !document.documentElement.classList.contains('public-game-locked'));
          await page.waitForTimeout(250);
          const checkArcade = viewportName === 'phonePortrait' || viewportName === 'phoneLandscape';
          const layout = await page.evaluate(({ checkArcade }) => {
            state = initialState();
            state.bonuses = [];
            render();
            const effectsRail = document.querySelector('.active-effects-rail');
            const effectsEmpty = document.querySelector('.active-effects-empty');
            const effectsRailBox = effectsRail.getBoundingClientRect();
            const effectsEmptyBox = effectsEmpty.getBoundingClientRect();
            const emptyEffects = {
              text: effectsEmpty.textContent.trim(),
              offset: Math.abs((effectsEmptyBox.left + effectsEmptyBox.right - effectsRailBox.left - effectsRailBox.right) / 2),
              count: document.getElementById('effectCount').textContent,
            };
            state.bonuses = [{ id: 'public-qa-effect', name: 'Подводная маска' }];
            render();
            const populatedEffects = {
              empty: Boolean(document.querySelector('.active-effects-empty')),
              count: document.getElementById('effectCount').textContent,
              chips: document.querySelectorAll('#effectsList .chip').length,
            };

            let arcade = null;
            if (checkArcade) {
              state = initialState();
              state.weather = 'eclipse';
              state.weatherSeen = ['eclipse'];
              render();
              document.querySelectorAll('#arcadeLayer .arcade-fish').forEach(node => node.remove());
              if (activeArcadeFish) removeArcadeCreature(activeArcadeFish);
              const originalRandom = Math.random;
              Math.random = () => .2;
              try { spawnArcadeCreature(); } finally { Math.random = originalRandom; }
              const target = document.querySelector('#arcadeLayer .arcade-fish');
              const animation = target.getAnimations()[0];
              animation.pause();
              animation.currentTime = animation.effect.getTiming().duration * .5;
              const rect = node => node.getBoundingClientRect().toJSON();
              const targetBox = rect(target);
              const lakeBox = rect(document.getElementById('lakeCard'));
              const style = getComputedStyle(target);
              arcade = {
                target: targetBox,
                body: rect(target.querySelector('.arcade-fish-body,.arcade-orca-body')),
                lake: lakeBox,
                weatherCopy: rect(document.querySelector('.weather-copy')),
                effects: rect(document.querySelector('.active-effects-rail')),
                trajectoryOffset: (targetBox.top + targetBox.bottom - lakeBox.top - lakeBox.bottom) / 2,
                appearance: style.appearance || style.webkitAppearance,
                webkitAppearance: style.webkitAppearance,
                backgroundColor: style.backgroundColor,
                backgroundImage: style.backgroundImage,
                borderWidths: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
                boxShadow: style.boxShadow,
                padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
              };
            }
            const scene = document.getElementById('lakeCard')?.getBoundingClientRect();
            return {
              debug: document.querySelectorAll('#dropfishDebugBtn,#dropfishDebugDialog,[data-debug-action]').length,
              logo: document.querySelector('.brand-logo')?.getAttribute('src') || '',
              shell: Boolean(document.querySelector('.mobile-game-shell')),
              activeSection: document.body.dataset.mobileSection || '',
              weather: document.getElementById('weatherArtwork')?.getAttribute('src') || '',
              horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              scene: scene ? { width: scene.width, height: scene.height } : null,
              sceneScale: document.querySelector('[data-scene-artboard]')?.dataset.sceneScale || '',
              emptyEffects,
              populatedEffects,
              arcade,
            };
          }, { checkArcade });
          assert.equal(layout.debug, 0, `${engineName}/${viewportName}: debug UI leaked`);
          assert.equal(layout.logo, './assets/branding/dropfish-logo.png', `${engineName}/${viewportName}: branded logo missing`);
          assert.ok(layout.shell && layout.activeSection === 'fishing' && layout.scene && layout.scene.width > 0 && layout.scene.height > 0, `${engineName}/${viewportName}: mobile scene shell missing (${JSON.stringify(layout)})`);
          assert.match(layout.weather, /scene\/weather\/(?:sunny|rain|calm|golden|fog|eclipse|thunder|storm)\.png$/, `${engineName}/${viewportName}: weather artwork missing`);
          assert.ok(layout.horizontalOverflow <= 1, `${engineName}/${viewportName}: horizontal overflow ${layout.horizontalOverflow}`);
          assert.deepEqual(layout.emptyEffects, { text: 'Эффекты: Пока нет', offset: layout.emptyEffects.offset, count: '0' }, `${engineName}/${viewportName}: empty active-effects state is wrong`);
          assert.ok(layout.emptyEffects.offset <= 2, `${engineName}/${viewportName}: empty active-effects label is not centered (${layout.emptyEffects.offset}px)`);
          assert.deepEqual(layout.populatedEffects, { empty: false, count: '1', chips: 1 }, `${engineName}/${viewportName}: empty label did not disappear after the first effect`);
          if (layout.arcade) {
            const { arcade } = layout;
            assert.ok(arcade.trajectoryOffset >= 25 && arcade.trajectoryOffset <= 27, `${engineName}/${viewportName}: arcade trajectory offset is wrong (${arcade.trajectoryOffset}px)`);
            assert.ok(arcade.body.top >= arcade.weatherCopy.bottom - 1, `${engineName}/${viewportName}: arcade fish intersects weather text`);
            assert.ok(arcade.body.top >= arcade.lake.top - 1 && arcade.body.bottom <= arcade.lake.bottom + 1 && arcade.body.bottom <= arcade.effects.top + 1, `${engineName}/${viewportName}: arcade fish is clipped or overlaps active effects`);
            assert.equal(arcade.appearance, 'none', `${engineName}/${viewportName}: native arcade button appearance leaked`);
            assert.equal(arcade.webkitAppearance, 'none', `${engineName}/${viewportName}: WebKit arcade button appearance leaked`);
            assert.equal(arcade.backgroundColor, 'rgba(0, 0, 0, 0)', `${engineName}/${viewportName}: arcade fish has an opaque backplate`);
            assert.equal(arcade.backgroundImage, 'none', `${engineName}/${viewportName}: arcade fish has a background image`);
            assert.equal(arcade.boxShadow, 'none', `${engineName}/${viewportName}: arcade fish has a box shadow`);
            assert.ok(arcade.borderWidths.every(value => value === '0px') && arcade.padding.every(value => value === '0px'), `${engineName}/${viewportName}: arcade fish retains rectangular button metrics`);
          }
          assert.deepEqual(errors, [], `${engineName}/${viewportName}: ${errors.join('; ')}`);
          await page.screenshot({ path: path.join(output, `${engineName}-${viewportName}.png`), animations: 'disabled' });
          renders += 1;
          await page.close();
        }
        await auditReviewMode(browser, engineName, url);
      } finally {
        await browser.close();
      }
    }
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
  }
  process.stdout.write(`PASS: protected public DropFish release (${renders} Chromium/WebKit renders + review-mode checks)\n`);
}

run().catch(error => {
  process.stderr.write(`FAIL: ${error.stack || error}\n`);
  process.exitCode = 1;
});
