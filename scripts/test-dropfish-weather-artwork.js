const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','dropfish-weather-artwork');
const weather={
  sunny:{file:'sunny.png',name:'Солнечно'},
  rain:{file:'rain.png',name:'Дождь'},
  calm:{file:'calm.png',name:'Штиль'},
  golden:{file:'golden.png',name:'Золотой час'},
  fog:{file:'fog.png',name:'Туман'},
  eclipse:{file:'eclipse.png',name:'Затмение'},
  thunder:{file:'thunder.png',name:'Гроза'},
  storm:{file:'storm.png',name:'Шторм'}
};
const viewports={
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1366,height:768}
};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

async function selectWeather(page,key){
  await page.evaluate(next=>{state.weather=next;render();},key);
  await page.waitForFunction(next=>{
    const image=document.getElementById('weatherArtwork');
    return image?.dataset.weatherArtwork===next&&image.complete&&image.naturalWidth>0&&!image.classList.contains('is-switching')&&Number(getComputedStyle(image).opacity)>.99;
  },key,{timeout:5000});
}

async function weatherMetrics(page){
  return page.evaluate(()=>{
    const hero=document.getElementById('lakeCard');
    const image=document.getElementById('weatherArtwork');
    const style=getComputedStyle(image);
    const fx=document.getElementById('weatherFx');
    return {
      heroHeight:hero.getBoundingClientRect().height,
      source:new URL(image.currentSrc||image.src).pathname.split('/').pop(),
      state:image.dataset.weatherArtwork,
      fallback:image.hasAttribute('data-weather-artwork-fallback'),
      imageCount:hero.querySelectorAll('.scene-artwork img').length,
      legacyBaseCount:hero.querySelectorAll('.scene-artwork__base').length,
      objectFit:style.objectFit,
      opacity:style.opacity,
      title:document.getElementById('weatherTitle').textContent,
      bodyWeather:document.body.dataset.weather,
      ambientDisplay:getComputedStyle(hero.querySelector('.ambient-layer')).display,
      beforeDisplay:getComputedStyle(hero,'::before').display,
      afterDisplay:getComputedStyle(hero,'::after').display,
      fxDisplay:fx?getComputedStyle(fx).display:'absent',
      fxClass:fx?.className||''
    };
  });
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const report=[];
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const context=await browser.newContext({viewport,reducedMotion:'reduce'});
        const page=await context.newPage();
        const errors=[];
        page.on('pageerror',error=>errors.push(String(error)));
        await page.goto(target,{waitUntil:'load'});
        let stableHeight=null;
        for(const [key,expected] of Object.entries(weather)){
          await selectWeather(page,key);
          const metrics=await weatherMetrics(page);
          if(stableHeight===null)stableHeight=metrics.heroHeight;
          assert(Math.abs(metrics.heroHeight-stableHeight)<=0.5,`${engineName}/${viewportName}/${key}: hero height changed`);
          assert(metrics.source===expected.file,`${engineName}/${viewportName}/${key}: expected ${expected.file}, got ${metrics.source}`);
          assert(metrics.state===key&&metrics.bodyWeather===key,`${engineName}/${viewportName}/${key}: weather state is not hard-bound`);
          assert(metrics.title===expected.name,`${engineName}/${viewportName}/${key}: HUD title changed unexpectedly`);
          assert(metrics.imageCount===1&&metrics.legacyBaseCount===0,`${engineName}/${viewportName}/${key}: weather images overlap or legacy base is mounted`);
          assert(metrics.objectFit==='cover'&&metrics.opacity==='1',`${engineName}/${viewportName}/${key}: artwork fit/visibility regressed`);
          assert(!metrics.fallback,`${engineName}/${viewportName}/${key}: emergency fallback was used`);
          assert(metrics.ambientDisplay==='none'&&metrics.beforeDisplay==='none'&&metrics.afterDisplay==='none',`${engineName}/${viewportName}/${key}: legacy marine-scene overlays are active`);
          assert(metrics.fxDisplay==='none'&&metrics.fxClass==='weather-fx',`${engineName}/${viewportName}/${key}: legacy weather FX is active`);
          report.push({engine:engineName,viewport:viewportName,weather:key,...metrics});
        }
        assert(errors.length===0,`${engineName}/${viewportName}: page errors ${errors.join(' | ')}`);
        await context.close();
      }

      const context=await browser.newContext({viewport:viewports.desktop,reducedMotion:'no-preference'});
      const page=await context.newPage();
      await page.goto(target,{waitUntil:'load'});
      await selectWeather(page,'sunny');
      const fullMotion=await page.evaluate(()=>{
        const image=document.getElementById('weatherArtwork');
        return {body:document.body.classList.contains('reduce-motion'),system:matchMedia('(prefers-reduced-motion: reduce)').matches,duration:getComputedStyle(image).transitionDuration};
      });
      assert(!fullMotion.body&&!fullMotion.system&&fullMotion.duration.includes('0.32s'),`${engineName}: full-motion artwork transition is unavailable ${JSON.stringify(fullMotion)}`);
      await page.evaluate(()=>{state.weather='rain';render();});
      await page.waitForFunction(()=>document.getElementById('weatherArtwork')?.classList.contains('is-switching'),null,{timeout:5000});
      await page.waitForTimeout(100);
      const fadeOut=await page.evaluate(()=>({
        source:new URL(document.getElementById('weatherArtwork').src).pathname.split('/').pop(),
        opacity:getComputedStyle(document.getElementById('weatherArtwork')).opacity,
        targetOpacity:document.getElementById('weatherArtwork').style.opacity,
        className:document.getElementById('weatherArtwork').className,
        property:getComputedStyle(document.getElementById('weatherArtwork')).transitionProperty,
        duration:getComputedStyle(document.getElementById('weatherArtwork')).transitionDuration
      }));
      assert(fadeOut.source==='sunny.png'&&fadeOut.targetOpacity==='0'&&fadeOut.className.includes('is-switching'),`${engineName}: fade-out did not keep a single outgoing image ${JSON.stringify(fadeOut)}`);
      await selectWeather(page,'rain');
      await page.locator('#motionBtn').click();
      await selectWeather(page,'calm');
      const reduced=await page.evaluate(()=>({
        body:document.body.classList.contains('reduce-motion'),
        switching:document.getElementById('weatherArtwork').classList.contains('is-switching'),
        source:new URL(document.getElementById('weatherArtwork').src).pathname.split('/').pop()
      }));
      assert(reduced.body&&!reduced.switching&&reduced.source==='calm.png',`${engineName}: motion toggle did not disable the artwork fade`);
      await page.locator('#motionBtn').click();
      for(const key of Object.keys(weather)){
        await selectWeather(page,key);
        await page.locator('#lakeCard').screenshot({path:path.join(output,`${engineName}-${key}.png`),animations:'disabled'});
      }
      await context.close();
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,cases:report.length,report},null,2));
  process.stdout.write(`PASS: ${report.length} weather artwork states across Chromium/WebKit and all target viewport classes\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
