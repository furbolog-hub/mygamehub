const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pagePath=path.join(root,'dropfish','index.html');
const target=pathToFileURL(pagePath).href;
const output=path.join(root,'.visual-test-output','dropfish-bottom-navigation');
const viewports={
  phoneSmall:{width:320,height:568},
  phonePortrait:{width:390,height:844},
  telegramPortrait:{width:390,height:844,safeArea:true},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1366,height:768}
};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

(async()=>{
  const html=fs.readFileSync(pagePath,'utf8');
  const script=fs.readFileSync(path.join(root,'dropfish','script.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'dropfish','mobile-ui.css'),'utf8');
  assert((html.match(/id="castBtn"/g)||[]).length===1,'castBtn must remain unique');
  assert(/\$\('castBtn'\)\.addEventListener\('click',castLine\)/.test(script),'castBtn no longer calls the existing castLine mechanism');
  assert(/#castBtn[\s\S]*:active|\.cast-action:active/.test(css),'pressed cast state is missing');
  assert(/\.cast-action\.is-casting/.test(css),'processing cast state is missing');
  assert(/\.cast-action(?::disabled|\[data-cast-state="disabled"\])/.test(css),'disabled cast state is missing');
  const intakePattern=new RegExp(['For','work'].join(' '),'i');
  assert(!intakePattern.test([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match=>match[1]).join('\n')),'runtime markup points to the intake directory');

  fs.mkdirSync(output,{recursive:true});
  const results=[];
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
        const pageErrors=[];
        page.on('pageerror',error=>pageErrors.push(String(error)));
        await page.goto(target,{waitUntil:'load'});
        if(viewport.safeArea){
          await page.evaluate(()=>{
            document.documentElement.style.setProperty('--tg-inset-top','24px');
            document.documentElement.style.setProperty('--tg-inset-right','7px');
            document.documentElement.style.setProperty('--tg-inset-bottom','20px');
            document.documentElement.style.setProperty('--tg-inset-left','7px');
            window.dispatchEvent(new Event('resize'));
          });
        }
        await page.waitForTimeout(120);

        const geometry=await page.evaluate(()=>{
          const box=node=>{const r=node.getBoundingClientRect();return {top:r.top,right:r.right,bottom:r.bottom,left:r.left,width:r.width,height:r.height};};
          const dock=document.getElementById('bottomNavigation');
          const cast=document.getElementById('castBtn');
          const chronology=document.getElementById('mobileFishingChronology');
          const restart=document.getElementById('restartBtn');
          const nav=[...document.querySelectorAll('[data-mobile-nav]')];
          return {
            dock:box(dock),cast:box(cast),chronology:box(chronology),
            dockPosition:getComputedStyle(dock).position,
            nav:nav.map(node=>({...box(node),name:node.dataset.mobileNav,current:node.getAttribute('aria-current')})),
            navNames:nav.map(node=>node.dataset.mobileNav),
            active:nav.filter(node=>node.classList.contains('is-active')).map(node=>node.dataset.mobileNav),
            castInDock:dock.contains(cast),
            castState:cast.dataset.castState,
            castDisabled:cast.disabled,
            documentOverflow:Math.max(document.documentElement.scrollHeight-document.documentElement.clientHeight,document.body.scrollHeight-document.body.clientHeight),
            horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            section:document.body.dataset.mobileSection,
            fishingVisible:!document.getElementById('mobileFishingScene').hidden&&!chronology.hidden
            ,portrait:innerHeight>innerWidth&&innerWidth<=600
            ,restartInDock:dock.contains(restart)
          };
        });

        assert(!pageErrors.length,`${engineName}/${viewportName}: page errors ${pageErrors.join(' | ')}`);
        assert(geometry.castInDock&&geometry.dockPosition==='relative',`${engineName}/${viewportName}: cast CTA is not in the unified bottom action row`);
        assert(geometry.nav.length===4&&geometry.navNames.join('|')==='fishing|journal|collection|menu',`${engineName}/${viewportName}: navigation order changed`);
        assert(geometry.nav.every(item=>item.width===0&&item.height===0),`${engineName}/${viewportName}: section navigation is visible in the focused fishing action zone`);
        assert(geometry.cast.width>220&&geometry.cast.height>=60&&geometry.cast.height<=64,`${engineName}/${viewportName}: cast action is not the large primary CTA`);
        assert(geometry.cast.top>=geometry.dock.top-1&&geometry.cast.bottom<=geometry.dock.bottom+1&&geometry.restartInDock,`${engineName}/${viewportName}: bottom action zone is incomplete`);
        assert(geometry.chronology.bottom<=geometry.cast.top+1,`${engineName}/${viewportName}: chronology reaches under the CTA`);
        assert(geometry.active.length===1&&geometry.active[0]==='fishing'&&geometry.nav[0].current==='page',`${engineName}/${viewportName}: fishing is not the initial main section`);
        assert(geometry.section==='fishing'&&geometry.fishingVisible,`${engineName}/${viewportName}: fishing view is not visible initially`);
        assert(!geometry.castDisabled&&geometry.castState==='ready',`${engineName}/${viewportName}: ready cast state is wrong`);
        assert(geometry.documentOverflow<=1&&geometry.horizontalOverflow<=1,`${engineName}/${viewportName}: main document scrolls`);

        await page.locator('#sceneMenuBtn').click();
        for(const section of ['journal','collection','menu']){
          await page.locator(`[data-mobile-nav="${section}"]`).click();
          const switched=await page.evaluate(expected=>{
            const view=document.querySelector(`[data-mobile-section-view="${expected}"]`);
            const active=[...document.querySelectorAll('[data-mobile-nav].is-active')];
            const scroll=view.querySelector('.mobile-section-scroll');
            return {
              section:document.body.dataset.mobileSection,
              visible:!view.hidden,
              fishingHidden:document.getElementById('mobileFishingScene').hidden&&document.getElementById('mobileFishingChronology').hidden,
              otherViewsHidden:[...document.querySelectorAll('[data-mobile-section-view]')].filter(node=>node!==view).every(node=>node.hidden),
              active:active.length===1&&active[0].dataset.mobileNav===expected&&active[0].getAttribute('aria-current')==='page',
              overflow:getComputedStyle(scroll).overflowY,
              documentOverflow:document.documentElement.scrollHeight-document.documentElement.clientHeight
            };
          },section);
          assert(switched.section===section&&switched.visible&&switched.fishingHidden&&switched.otherViewsHidden&&switched.active,`${engineName}/${viewportName}: ${section} is not an independent view ${JSON.stringify(switched)}`);
          assert(['auto','scroll'].includes(switched.overflow)&&switched.documentOverflow<=1,`${engineName}/${viewportName}: ${section} does not own scrolling`);
        }

        const menuControls=await page.evaluate(()=>({
          guide:Boolean(document.getElementById('guideBtn')),
          soundCopy:Boolean(document.querySelector('#soundToggleBtn [data-sound-label]')),
          motionCopy:Boolean(document.querySelector('#motionBtn [data-motion-label]')),
          restart:Boolean(document.getElementById('restartBtn')),
          debugVisible:getComputedStyle(document.getElementById('dropfishDebugBtn')).display!=='none',
          targets:[...document.querySelectorAll('#mobileMenuView .mobile-menu-action')].map(node=>node.getBoundingClientRect().height)
        }));
        assert(menuControls.guide&&menuControls.soundCopy&&menuControls.motionCopy&&menuControls.restart,`${engineName}/${viewportName}: menu controls were lost`);
        assert(menuControls.targets.every(height=>height>=44),`${engineName}/${viewportName}: menu action target below 44px`);

        await page.keyboard.press('Escape');
        await page.evaluate(()=>{state=initialState();state.weatherSeen=[state.weather];Math.random=()=>.5;render();});
        const castsBefore=await page.evaluate(()=>state.castsLeft);
        await page.locator('#castBtn').click();
        await page.waitForTimeout(30);
        const processing=await page.evaluate(()=>({casts:state.castsLeft,state:document.getElementById('castBtn').dataset.castState,casting:document.getElementById('castBtn').classList.contains('is-casting'),disabled:document.getElementById('castBtn').disabled}));
        assert(processing.casts===castsBefore-1,`${engineName}/${viewportName}: central CTA changed cast semantics`);
        assert(processing.state==='processing'&&processing.casting&&!processing.disabled,`${engineName}/${viewportName}: processing state locks or fails to animate ${JSON.stringify(processing)}`);
        await page.waitForTimeout(930);
        assert(await page.locator('#castBtn').evaluate(node=>node.dataset.castState==='ready'&&!node.classList.contains('is-casting')),`${engineName}/${viewportName}: processing state did not return to ready`);

        const disabled=await page.evaluate(()=>{state.castsLeft=0;render();const button=document.getElementById('castBtn');return {disabled:button.disabled,state:button.dataset.castState};});
        assert(disabled.disabled&&disabled.state==='disabled',`${engineName}/${viewportName}: disabled state is not explicit`);
        const finished=await page.evaluate(()=>{state.finished=true;render();const dock=document.getElementById('bottomNavigation'),button=document.getElementById('castBtn');return {dock:getComputedStyle(dock).display,visible:getComputedStyle(button).visibility,disabled:button.disabled};});
        assert(finished.dock==='grid'&&finished.visible==='visible'&&finished.disabled,`${engineName}/${viewportName}: final session hides navigation or CTA ${JSON.stringify(finished)}`);

        await page.locator('#sceneMenuBtn').click();
        await page.locator('#restartBtn').click();
        const restarted=await page.evaluate(()=>({casts:state.castsLeft,finished:state.finished,restartDisabled:document.getElementById('restartBtn').disabled}));
        assert(restarted.casts===10&&!restarted.finished&&!restarted.restartDisabled,`${engineName}/${viewportName}: test restart from Menu failed ${JSON.stringify(restarted)}`);

        await page.locator('[data-mobile-nav="fishing"]').click();
        await page.locator('#sceneMenuBtn').click();
        assert(await page.evaluate(()=>document.body.dataset.mobileSection==='menu'&&!document.getElementById('mobileMenuView').hidden&&document.querySelector('[data-mobile-nav="menu"]').getAttribute('aria-current')==='page'),`${engineName}/${viewportName}: scene menu is not mapped to Menu view`);

        if(['phonePortrait','phoneLandscape','tabletPortrait','tabletLandscape','desktop'].includes(viewportName)){
          await page.waitForTimeout(2250);
          await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-menu.png`),animations:'disabled'});
          await page.locator('[data-mobile-nav="fishing"]').click();
          await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-fishing.png`),animations:'disabled'});
        }
        results.push({engine:engineName,viewport:viewportName,geometry,menuControls});
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,results},null,2));
  process.stdout.write(`PASS: ${results.length} bottom-navigation renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
