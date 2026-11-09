const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','dropfish-hud-scene');
const viewports={
  phoneSmall:{width:320,height:568},
  phonePortrait:{width:390,height:844},
  telegramPortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1366,height:768}
};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const close=(actual,expected,tolerance=1)=>Math.abs(actual-expected)<=tolerance;

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
        if(viewportName==='telegramPortrait'){
          await page.evaluate(()=>{
            document.documentElement.style.setProperty('--tg-inset-top','24px');
            document.documentElement.style.setProperty('--tg-inset-right','7px');
            document.documentElement.style.setProperty('--tg-inset-bottom','20px');
            document.documentElement.style.setProperty('--tg-inset-left','7px');
            document.body.classList.add('telegram-safe-area-simulation');
            window.dispatchEvent(new Event('resize'));
          });
        }
        await page.waitForTimeout(120);

        const metrics=await page.evaluate(()=>{
          const rect=node=>{
            const box=node.getBoundingClientRect();
            return {top:box.top,right:box.right,bottom:box.bottom,left:box.left,width:box.width,height:box.height};
          };
          const scene=document.querySelector('.mobile-game-shell__fishing');
          const artboard=document.querySelector('[data-scene-artboard]');
          const portraitShell=innerHeight>innerWidth&&innerWidth<=600;
          const longChip=document.createElement('button');
          longChip.type='button';
          longChip.className='chip effect-assembly';
          longChip.innerHTML='<span class="effect-chip-copy">Сверхдлинный активный эффект с дополнительным уточнением действия</span>';
          document.getElementById('effectsList').appendChild(longChip);
          const rail=document.querySelector('.active-effects-rail');
          const railBefore=rect(rail);
          const longChipRect=rect(longChip);
          const railAfter=rect(rail);

          const arcadeFish=document.createElement('button');
          arcadeFish.type='button';
          arcadeFish.className='arcade-fish left-to-right category-normal';
          arcadeFish.innerHTML='<span class="arcade-fish-body"><span class="arcade-fish-eye"></span><span class="arcade-fish-tail"></span><span class="arcade-fish-pectoral"></span></span>';
          document.getElementById('arcadeLayer').appendChild(arcadeFish);
          const arcadeRect=rect(arcadeFish);
          const arcadeStyle=getComputedStyle(arcadeFish);
          const statStrip=document.querySelector('.lake-stat-strip');
          const statStripStyle=getComputedStyle(statStrip);
          const hudStats=[...document.querySelectorAll('.lake-stat')].map((stat,index)=>{
            const style=getComputedStyle(stat),label=stat.querySelector('.lake-stat__label'),value=stat.querySelector('strong');
            return {
              label:label?.textContent.trim()||'',
              labelSize:parseFloat(getComputedStyle(label).fontSize),
              value:value?.textContent.trim()||'',
              valueSize:parseFloat(getComputedStyle(value).fontSize),
              background:style.backgroundColor,
              borderTop:style.borderTopWidth,
              borderLeft:style.borderLeftWidth,
              iconCount:stat.querySelectorAll('img').length,
              index
            };
          });

          return {
            sceneDisplay:getComputedStyle(scene).display,
            artboardDisplay:getComputedStyle(artboard).display,
            portraitShell,
            header:rect(document.querySelector('.topbar')),
            lake:rect(document.getElementById('lakeCard')),
            rail:rect(document.querySelector('.active-effects-rail')),
            chronology:rect(document.getElementById('mobileFishingChronology')),
            dock:rect(document.getElementById('bottomNavigation')),
            artworkInsideHero:document.getElementById('lakeCard').contains(document.querySelector('.scene-artwork')),
            castInsideScene:scene.contains(document.getElementById('castBtn')),
            sceneFxInsideLake:['castArc','splash','arcadeLayer'].every(id=>document.getElementById('lakeCard').contains(document.getElementById(id))),
            permanentCharacterCount:document.querySelectorAll('.fisherman,.angler,.fishing-hand,.player-hand').length,
            activeHeadingHidden:getComputedStyle(document.getElementById('activeEffectsTitle')).position==='absolute'&&rect(document.getElementById('activeEffectsTitle')).width<=1.1,
            railBefore,
            railAfter,
            longChip:longChipRect,
            arcade:arcadeRect,
            arcadePointer:arcadeStyle.pointerEvents,
            arcadeAnimation:arcadeStyle.animationName,
            statStrip:{...rect(statStrip),background:statStripStyle.backgroundColor,border:statStripStyle.borderTopWidth},
            hudStats,
            runtimeAssetIntake:[...document.querySelectorAll('[src],[href]')].some(node=>/for\s+work/i.test(node.getAttribute('src')||node.getAttribute('href')||''))
          };
        });

        assert(pageErrors.length===0,`${engineName}/${viewportName}: page errors ${pageErrors.join(' | ')}`);
        assert(metrics.sceneDisplay==='contents'&&metrics.artboardDisplay==='contents',`${engineName}/${viewportName}: fixed mini-viewport still exists`);
        assert(metrics.artworkInsideHero,`${engineName}/${viewportName}: marine artwork is not owned by Weather/HUD hero`);
        assert(metrics.header.bottom<=metrics.lake.top+1&&metrics.lake.bottom<=metrics.rail.top+1&&metrics.rail.bottom<=metrics.chronology.top+1&&metrics.chronology.bottom<=metrics.dock.top+1,`${engineName}/${viewportName}: unified vertical order changed`);
        assert(!metrics.castInsideScene,`${engineName}/${viewportName}: cast CTA returned to the scene`);
        assert(metrics.sceneFxInsideLake,`${engineName}/${viewportName}: existing cast/weather arcade scene hooks were detached`);
        assert(metrics.permanentCharacterCount===0,`${engineName}/${viewportName}: permanent fisherman/hand was introduced`);
        assert(metrics.activeHeadingHidden,`${engineName}/${viewportName}: active effects restored a large heading`);
        assert(close(metrics.railBefore.height,metrics.railAfter.height,.5)&&metrics.longChip.width<=163,`${engineName}/${viewportName}: long effect stretches its rail/backplate`);
        assert(metrics.arcade.width>=40&&metrics.arcade.height>=40&&metrics.arcadePointer==='auto'&&metrics.arcadeAnimation==='mobileSceneArcadeRight',`${engineName}/${viewportName}: arcade target/track regressed ${JSON.stringify(metrics.arcade)}`);
        assert(metrics.hudStats.length===2&&metrics.hudStats.every(stat=>stat.iconCount===0&&stat.background==='rgba(0, 0, 0, 0)'&&stat.borderTop==='0px'&&stat.labelSize>=8.5&&stat.valueSize>=14)&&metrics.hudStats[1].borderLeft!=='0px',`${engineName}/${viewportName}: Weather HUD is not one readable icon-free rail ${JSON.stringify(metrics.hudStats)}`);
        assert(metrics.statStrip.height>=35&&metrics.statStrip.height<=49&&metrics.statStrip.background!=='rgba(0, 0, 0, 0)'&&metrics.statStrip.border!=='0px',`${engineName}/${viewportName}: shared Weather HUD rail geometry regressed ${JSON.stringify(metrics.statStrip)}`);
        assert(!metrics.runtimeAssetIntake,`${engineName}/${viewportName}: runtime points to For work`);

        const headerActions=await page.evaluate(()=>{
          const header=document.querySelector('.topbar');
          const viewport={left:0,right:innerWidth,top:0,bottom:innerHeight};
          const controls=[...header.querySelectorAll('#sceneMenuBtn,#dropfishDebugBtn,#soundToggleBtn,#motionBtn,#guideBtn')];
          return {
            ids:controls.map(node=>node.id),
            targets:controls.map(node=>{
              const box=node.getBoundingClientRect();
              return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height,display:getComputedStyle(node).display};
            }),
            viewport,
            menuTag:document.getElementById('sceneMenuBtn').tagName,
            menuControls:document.getElementById('sceneMenuBtn').getAttribute('aria-controls')
          };
        });
        assert(headerActions.ids.join('|')==='sceneMenuBtn|dropfishDebugBtn|soundToggleBtn|motionBtn|guideBtn',`${engineName}/${viewportName}: reference header actions are missing or reordered ${JSON.stringify(headerActions)}`);
        assert(headerActions.targets.every(target=>target.display!=='none'&&target.width>=40&&target.height>=40&&target.left>=headerActions.viewport.left-1&&target.right<=headerActions.viewport.right+1),`${engineName}/${viewportName}: a header action is clipped or smaller than 40px ${JSON.stringify(headerActions)}`);
        assert(headerActions.menuTag==='BUTTON'&&headerActions.menuControls==='mobileMenuView',`${engineName}/${viewportName}: menu icon does not open the current in-game menu ${JSON.stringify(headerActions)}`);
        await page.locator('#guideBtn').click();
        assert(await page.locator('#guideDialog').evaluate(node=>node.open),`${engineName}/${viewportName}: restored guide action does not open the guide`);
        await page.locator('[data-close="guideDialog"]').click();

        if(['phoneSmall','phonePortrait','telegramPortrait','phoneLandscape','tabletPortrait','desktop'].includes(viewportName)){
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
  process.stdout.write(`PASS: ${results.length} unified HUD hero layouts across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
