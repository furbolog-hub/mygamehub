const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','dropfish-mobile-shell');
const viewports={
  phoneSmall:{width:320,height:568},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1366,height:768}
};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const results=[];
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const pageErrors=[];
        page.on('pageerror',error=>pageErrors.push(String(error)));
        await page.goto(target,{waitUntil:'load'});
        await page.evaluate(()=>{
          state=initialState();
          state.history=[];
          state.historyUi={expandedId:null,filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
          render();
          for(let index=0;index<12;index++)addHistory(`Portrait shell fixture ${index+1}`,'event');
        });
        await page.waitForTimeout(100);
        const metrics=await page.evaluate(()=>{
          const rect=selector=>{
            const node=document.querySelector(selector);
            if(!node)return null;
            const box=node.getBoundingClientRect();
            return {top:box.top,right:box.right,bottom:box.bottom,left:box.left,width:box.width,height:box.height};
          };
          const shell=document.querySelector('[data-mobile-game-shell]');
          const scene=document.querySelector('.mobile-game-shell__fishing');
          const chronology=document.querySelector('.mobile-game-shell__chronology');
          const dock=document.querySelector('.mobile-game-shell__dock');
          const historyScroll=document.getElementById('historyScroll');
          const header=document.querySelector('.topbar');
          const weatherDescription=document.getElementById('weatherDescription');
          const lakeStats=document.querySelector('.lake-stat-strip');
          const artboard=document.querySelector('[data-scene-artboard]');
          const lake=document.getElementById('lakeCard');
          const inventory=document.querySelector('.active-effects-rail');
          const restart=document.getElementById('restartBtn');
          const headerControls=[...header.querySelectorAll('#sceneMenuBtn,#dropfishDebugBtn,#soundToggleBtn,#motionBtn,#guideBtn')];
          const firstRow=document.querySelector('.chronology-row');
          const visible=node=>Boolean(node&&getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0&&node.getBoundingClientRect().height>0);
          return {
            shell:rect('[data-mobile-game-shell]'),
            scene:rect('.mobile-game-shell__fishing'),
            chronology:rect('.mobile-game-shell__chronology'),
            dock:rect('.mobile-game-shell__dock'),
            cast:rect('#castBtn'),
            documentVertical:document.documentElement.scrollHeight-document.documentElement.clientHeight,
            bodyVertical:document.body.scrollHeight-document.body.clientHeight,
            horizontal:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            historyOverflow:getComputedStyle(historyScroll).overflowY,
            dockPosition:getComputedStyle(dock).position,
            header:rect('.topbar'),
            lake:rect('#lakeCard'),
            inventory:rect('.active-effects-rail'),
            headerControls:headerControls.map(node=>{
              const box=node.getBoundingClientRect();
              return {id:node.id,top:box.top,right:box.right,bottom:box.bottom,left:box.left,width:box.width,height:box.height,visible:visible(node)};
            }),
            gameMenu:{tag:document.getElementById('sceneMenuBtn')?.tagName,expanded:document.getElementById('sceneMenuBtn')?.getAttribute('aria-expanded'),expected:new URL('../index.html',location.href).href,controls:document.getElementById('sceneMenuBtn')?.getAttribute('aria-controls'),hubTag:document.querySelector('.mobile-menu-link')?.tagName,hubHref:document.querySelector('.mobile-menu-link')?.href},
            weatherDescription:weatherDescription&&getComputedStyle(weatherDescription).display!=='none'?rect('#weatherDescription'):null,
            lakeStats:rect('.lake-stat-strip'),
            shellChildren:[...shell.children].map(node=>node.className),
            ids:['castBtn','restartBtn','historyScroll','historyList','lakeCard','effectsList'].map(id=>document.querySelectorAll(`#${id}`).length),
            castInDock:dock.contains(document.getElementById('castBtn')),
            runtimeAssetIntake:[...document.querySelectorAll('[src],[href]')].some(node=>new RegExp(['for','work'].join('\\s+'),'i').test(node.getAttribute('src')||node.getAttribute('href')||'')),
            chronologyScrollable:historyScroll.scrollHeight>=historyScroll.clientHeight,
            portrait:innerHeight>innerWidth&&innerWidth<=600,
            sceneDisplay:getComputedStyle(scene).display,
            artboardDisplay:getComputedStyle(artboard).display,
            artworkInsideHero:lake.contains(document.querySelector('.scene-artwork')),
            visibleRows:firstRow?Math.floor(historyScroll.clientHeight/firstRow.getBoundingClientRect().height):0,
            visibleMobileNav:[...dock.querySelectorAll('.mobile-nav-item')].filter(visible).length,
            restartInDock:dock.contains(restart),
            restartVisible:visible(restart),
            restart:rect('#restartBtn'),
            restartLabel:restart?.getAttribute('aria-label')||'',
            castLabel:document.getElementById('castBtn')?.getAttribute('aria-label')||''
          };
        });

        assert(pageErrors.length===0,`${engineName}/${viewportName}: page errors ${pageErrors.join(' | ')}`);
        assert(metrics.shellChildren.length===8,`${engineName}/${viewportName}: shell must have fishing zones, Sphere layer/announcer, three section views and the dock`);
        assert(metrics.ids.every(count=>count===1),`${engineName}/${viewportName}: legacy IDs were lost or duplicated ${metrics.ids}`);
        assert(metrics.castInDock,`${engineName}/${viewportName}: cast CTA is outside the bottom dock`);
        assert(metrics.dockPosition==='relative',`${engineName}/${viewportName}: action row is not part of the unified shell`);
        assert(metrics.documentVertical<=1&&metrics.bodyVertical<=1,`${engineName}/${viewportName}: document scrolls ${JSON.stringify({document:metrics.documentVertical,body:metrics.bodyVertical})}`);
        assert(metrics.horizontal<=1,`${engineName}/${viewportName}: horizontal overflow ${metrics.horizontal}px`);
        assert(metrics.chronology.height>24&&['auto','scroll'].includes(metrics.historyOverflow),`${engineName}/${viewportName}: chronology has no positive scroll viewport`);
        assert(metrics.chronology.bottom<=metrics.dock.top+1,`${engineName}/${viewportName}: chronology overlaps the bottom action row`);
        assert(metrics.cast.top>=metrics.dock.top-1&&metrics.cast.bottom<=metrics.dock.bottom+1,`${engineName}/${viewportName}: cast CTA is not contained below chronology`);
        assert(metrics.shell.top>=-1&&metrics.shell.bottom<=viewport.height+1,`${engineName}/${viewportName}: shell escapes viewport`);
        assert(metrics.headerControls.map(control=>control.id).join('|')==='sceneMenuBtn|dropfishDebugBtn|soundToggleBtn|motionBtn|guideBtn',`${engineName}/${viewportName}: the five reference header actions are missing or reordered ${JSON.stringify(metrics.headerControls)}`);
        assert(metrics.headerControls.every(control=>control.visible&&control.left>=metrics.header.left-1&&control.right<=metrics.header.right+1&&control.top>=metrics.header.top-1&&control.bottom<=metrics.header.bottom+1&&control.width>=40&&control.height>=40),`${engineName}/${viewportName}: a header action is clipped, hidden or smaller than 40px ${JSON.stringify(metrics.headerControls)}`);
        assert(metrics.gameMenu.tag==='BUTTON'&&metrics.gameMenu.controls==='mobileMenuView'&&metrics.gameMenu.expanded==='false'&&metrics.gameMenu.hubTag==='A'&&metrics.gameMenu.hubHref===metrics.gameMenu.expected,`${engineName}/${viewportName}: in-game menu or explicit game-center link is missing ${JSON.stringify(metrics.gameMenu)}`);
        if(metrics.weatherDescription&&metrics.lakeStats){
          const intersects=metrics.weatherDescription.left<metrics.lakeStats.right&&metrics.weatherDescription.right>metrics.lakeStats.left&&metrics.weatherDescription.top<metrics.lakeStats.bottom&&metrics.weatherDescription.bottom>metrics.lakeStats.top;
          assert(!intersects,`${engineName}/${viewportName}: weather copy overlaps the session HUD`);
        }
        assert(!metrics.runtimeAssetIntake,`${engineName}/${viewportName}: runtime points to the asset intake folder`);
        assert(metrics.sceneDisplay==='contents'&&metrics.artboardDisplay==='contents',`${engineName}/${viewportName}: a separate scene screen still exists`);
        assert(metrics.artworkInsideHero,`${engineName}/${viewportName}: marine artwork is not inside Weather/HUD hero`);
        assert(metrics.header.bottom<=metrics.lake.top+1&&metrics.lake.bottom<=metrics.inventory.top+1&&metrics.inventory.bottom<=metrics.chronology.top+1,`${engineName}/${viewportName}: order is not header -> weather -> effects -> chronology`);
        assert(metrics.visibleMobileNav===0,`${engineName}/${viewportName}: navigation items are visible in the fishing action row`);
        assert(metrics.restartInDock&&metrics.restartVisible&&metrics.restart.width>=44&&metrics.restart.width<=72,`${engineName}/${viewportName}: compact new-session action is missing from the bottom action row`);
        assert(metrics.restartLabel==='Новая сессия',`${engineName}/${viewportName}: new-session action has the wrong accessible label: ${metrics.restartLabel}`);
        if(metrics.portrait){
          assert(/ЗАБРОСИТЬ УДОЧКУ/i.test(metrics.castLabel),`${engineName}/${viewportName}: primary action label does not match the concept`);
          if(viewportName==='phonePortrait')assert(metrics.visibleRows>=6&&metrics.visibleRows<=10,`${engineName}/${viewportName}: expected 6-10 compact visible chronology rows, got ${metrics.visibleRows}`);
        }

        await page.locator('#guideBtn').click();
        const dialog=await page.evaluate(()=>{
          const node=document.getElementById('guideDialog');
          const box=node.getBoundingClientRect();
          return {open:node.open,top:box.top,bottom:box.bottom,left:box.left,right:box.right};
        });
        assert(dialog.open&&dialog.top>=-1&&dialog.bottom<=viewport.height+1&&dialog.left>=-1&&dialog.right<=viewport.width+1,`${engineName}/${viewportName}: guide dialog is inaccessible ${JSON.stringify(dialog)}`);
        await page.locator('[data-close="guideDialog"]').click();

        const soundBefore=await page.locator('#soundToggleBtn').getAttribute('aria-pressed');
        await page.locator('#soundToggleBtn').click();
        const soundAfter=await page.locator('#soundToggleBtn').getAttribute('aria-pressed');
        assert(soundBefore!==soundAfter,`${engineName}/${viewportName}: restored sound action does not toggle`);
        await page.locator('#soundToggleBtn').click();

        const motionBefore=await page.evaluate(()=>document.body.classList.contains('reduce-motion'));
        await page.locator('#motionBtn').click();
        const motionAfter=await page.evaluate(()=>document.body.classList.contains('reduce-motion'));
        assert(motionBefore!==motionAfter,`${engineName}/${viewportName}: restored motion action does not toggle`);
        await page.locator('#motionBtn').click();

        await page.locator('#dropfishDebugBtn').click();
        assert(await page.locator('#dropfishDebugDialog').evaluate(node=>node.open),`${engineName}/${viewportName}: restored debug action does not open the test panel`);
        await page.locator('[data-close="dropfishDebugDialog"]').click();

        const finished=await page.evaluate(()=>{
          state.castsLeft=0;
          state.finished=true;
          render();
          const restart=document.getElementById('restartBtn');
          const box=restart.getBoundingClientRect();
          return {
            restartInDock:document.getElementById('bottomNavigation').contains(restart),
            restartVisible:getComputedStyle(restart).display!=='none'&&box.width>0&&box.height>0,
            restartDisabled:restart.disabled
          };
        });
        assert(finished.restartInDock&&finished.restartVisible&&!finished.restartDisabled,`${engineName}/${viewportName}: completed test session does not expose the new-session action ${JSON.stringify(finished)}`);
        await page.locator('#restartBtn').click();
        const restarted=await page.evaluate(()=>({
          castsLeft:state.castsLeft,
          finished:state.finished,
          finishedClass:document.body.classList.contains('game-finished'),
          restartInDock:document.getElementById('bottomNavigation').contains(document.getElementById('restartBtn'))
        }));
        assert(restarted.castsLeft===10&&!restarted.finished&&!restarted.finishedClass&&restarted.restartInDock,`${engineName}/${viewportName}: new-session action did not reset the completed test session ${JSON.stringify(restarted)}`);

        if(['phoneSmall','phonePortrait','phoneLandscape','tabletPortrait','desktop'].includes(viewportName)){
          await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),animations:'disabled'});
        }
        results.push({engine:engineName,viewport:viewportName,...metrics});
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,results},null,2));
  process.stdout.write(`PASS: ${results.length} DropFish mobile-shell renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
