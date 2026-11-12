const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','arcade-creatures');
const weather=['sunny','rain','calm','golden','fog','eclipse','thunder','storm'];
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneReference:{width:440,height:892},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

async function selectWeather(page,key){
  await page.evaluate(next=>{state.weather=next;render();},key);
  await page.waitForFunction(next=>{
    const image=document.getElementById('weatherArtwork');
    return image?.dataset.weatherArtwork===next&&image.complete&&image.naturalWidth>0&&!image.classList.contains('is-switching')&&Number(getComputedStyle(image).opacity)>.99;
  },key,{timeout:5000});
}

async function mountReferenceCreatures(page){
  return page.evaluate(()=>{
    const layer=document.getElementById('arcadeLayer');
    layer.querySelectorAll('.arcade-fish').forEach(node=>node.remove());
    const make=(className,markup,left)=>{
      const target=document.createElement('button');
      target.type='button';
      target.className=`arcade-fish ${className}`;
      target.innerHTML=`<span class="arcade-creature-shape">${markup}</span>`;
      target.style.animation='none';
      target.style.left=left;
      target.style.transform='translateY(-50%)';
      layer.appendChild(target);
      return target;
    };
    make('left-to-right category-normal','<span class="arcade-fish-body"><span class="arcade-fish-eye"></span><span class="arcade-fish-tail"></span><span class="arcade-fish-pectoral"></span></span>','19%');
    make('right-to-left arcade-orca','<span class="arcade-orca-body"><span class="arcade-orca-fin"></span><span class="arcade-orca-tail"></span><span class="arcade-orca-pectoral"></span></span>','67%');
  });
}

async function creatureMetrics(page){
  return page.evaluate(()=>{
    const normal=document.querySelector('.arcade-fish.category-normal');
    const orca=document.querySelector('.arcade-fish.arcade-orca');
    const normalBody=normal.querySelector('.arcade-fish-body');
    const orcaBody=orca.querySelector('.arcade-orca-body');
    const normalStyle=getComputedStyle(normal);
    const orcaStyle=getComputedStyle(orca);
    const normalBodyStyle=getComputedStyle(normalBody);
    const orcaBodyStyle=getComputedStyle(orcaBody);
    const filterCount=value=>(value.match(/drop-shadow/g)||[]).length;
    return {
      normalTarget:{width:parseFloat(normalStyle.width),height:parseFloat(normalStyle.height)},
      orcaTarget:{width:parseFloat(orcaStyle.width),height:parseFloat(orcaStyle.height)},
      normalBody:normalBody.getBoundingClientRect().toJSON(),
      orcaBody:orcaBody.getBoundingClientRect().toJSON(),
      normalOpacity:Number(normalStyle.opacity),
      orcaOpacity:Number(orcaStyle.opacity),
      normalFilterCount:filterCount(normalStyle.filter),
      orcaFilterCount:filterCount(orcaStyle.filter),
      normalFill:normalBodyStyle.backgroundImage||normalBodyStyle.backgroundColor,
      orcaFill:orcaBodyStyle.backgroundImage||orcaBodyStyle.backgroundColor,
      shapeCount:document.querySelectorAll('.arcade-creature-shape').length,
    };
  });
}

async function verifyRuntimeTurn(page,engineName,viewportName){
  for(const [seed,label] of [[.2,'left-to-right'],[.8,'right-to-left']]){
    await page.evaluate(randomSeed=>{
      document.querySelectorAll('#arcadeLayer .arcade-fish').forEach(node=>node.remove());
      if(activeArcadeFish)removeArcadeCreature(activeArcadeFish);
      state.finished=false;
      state.arcadeCaughtCount=0;
      const originalRandom=Math.random;
      Math.random=()=>randomSeed;
      try{spawnArcadeCreature();}finally{Math.random=originalRandom;}
    },seed);
    const sample=()=>page.locator('#arcadeLayer .arcade-fish').evaluate(node=>({left:node.getBoundingClientRect().left,transform:getComputedStyle(node).transform,animationName:getComputedStyle(node).animationName,animationDuration:getComputedStyle(node).animationDuration,animations:node.getAnimations().map(animation=>({currentTime:animation.currentTime,playbackRate:animation.playbackRate,playState:animation.playState}))}));
    await page.locator('#arcadeLayer .arcade-fish').evaluate(node=>{const animation=node.getAnimations()[0];animation.pause();animation.currentTime=600;});
    const before=await sample();
    await page.locator('#arcadeLayer .arcade-fish').evaluate(node=>{node.getAnimations()[0].currentTime=1200;});
    const atTurn=await sample();
    const reversed=await page.evaluate(()=>reverseArcadeCreature(activeArcadeFish));
    await page.locator('#arcadeLayer .arcade-fish').evaluate(node=>{node.getAnimations()[0].currentTime=1000;});
    await page.waitForTimeout(120);
    const after=await page.locator('#arcadeLayer .arcade-fish').evaluate(node=>({left:node.getBoundingClientRect().left,reversed:node.classList.contains('is-course-reversed'),shapeTransform:getComputedStyle(node.querySelector('.arcade-creature-shape')).transform}));
    const initialDelta=atTurn.left-before.left;
    const reversedDelta=after.left-atTurn.left;
    assert(reversed,`${engineName}/${viewportName}/${label}: runtime arcade creature refused to reverse`);
    assert(Math.abs(initialDelta)>1&&Math.abs(reversedDelta)>1&&Math.sign(initialDelta)===-Math.sign(reversedDelta),`${engineName}/${viewportName}/${label}: runtime arcade creature did not retrace its route (${JSON.stringify(before)}, ${JSON.stringify(atTurn)}, ${after.left})`);
    assert(after.reversed&&after.shapeTransform!=='none',`${engineName}/${viewportName}/${label}: runtime arcade creature did not turn its body toward the new direction`);
    await page.evaluate(()=>removeArcadeCreature(activeArcadeFish));
  }
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let cases=0;
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(String(error)));
        await page.goto(target,{waitUntil:'load'});
        await verifyRuntimeTurn(page,engineName,viewportName);
        for(const key of weather){
          await selectWeather(page,key);
          await mountReferenceCreatures(page);
          const metrics=await creatureMetrics(page);
          assert(metrics.shapeCount===2,`${engineName}/${viewportName}/${key}: creature direction wrappers are missing`);
          assert(metrics.normalTarget.width<=100&&metrics.normalTarget.height<=84,`${engineName}/${viewportName}/${key}: ordinary arcade target is still oversized ${JSON.stringify(metrics.normalTarget)}`);
          assert(metrics.orcaTarget.width>metrics.normalTarget.width&&metrics.orcaTarget.width<=112,`${engineName}/${viewportName}/${key}: Orca target is not slightly larger ${JSON.stringify(metrics)}`);
          const visualRatio=metrics.orcaBody.width/metrics.normalBody.width;
          assert(visualRatio>=1.08&&visualRatio<=1.28,`${engineName}/${viewportName}/${key}: Orca visual ratio is ${visualRatio.toFixed(2)}, expected only slightly larger`);
          assert(metrics.normalOpacity>=.9&&metrics.orcaOpacity>=.9,`${engineName}/${viewportName}/${key}: arcade creatures remain translucent`);
          assert(metrics.normalFilterCount>=2&&metrics.orcaFilterCount>=2,`${engineName}/${viewportName}/${key}: dual contrast outline is missing`);
          assert(metrics.normalFill!==metrics.orcaFill,`${engineName}/${viewportName}/${key}: fish and Orca still use the same fill treatment`);
          if(viewportName==='phoneReference'||['calm','storm'].includes(key)){
            await page.locator('#lakeCard').screenshot({path:path.join(output,`${engineName}-${viewportName}-${key}.png`),animations:'disabled'});
          }
          cases++;
        }
        assert(errors.length===0,`${engineName}/${viewportName}: page errors ${errors.join(' | ')}`);
        await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,cases,engines:Object.keys(engines),viewports,weather},null,2));
  process.stdout.write(`PASS: ${cases} arcade creature/weather combinations with reversible routes\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
