const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'test-results','dropfish-flow-sphere');
const viewports={
  desktop:{width:1366,height:768},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768}
};

async function prepare(page){
  await page.addInitScript(()=>{
    localStorage.removeItem('proFishingTestSessionV1');
    localStorage.setItem('proFishingReduceMotion','0');
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(pageUrl,{waitUntil:'load'});
  await page.evaluate(()=>{
    state=initialState();
    state.sessionDate=localDayKey();
    state.weather='calm';
    render();
  });
  return errors;
}

async function mountSphere(page,reward){
  // Let the initial viewport-fit resize cycle settle before creating a sphere.
  // A real resize intentionally interrupts and requeues an active sphere.
  await page.waitForTimeout(220);
  await page.evaluate(nextReward=>{
    interruptFlowSphere({requeue:false});
    clearTimeout(flowSphereTimer);
    state.flowSphere.pendingRewards=[];
    state.flowSphere.activeReward=null;
    queueFlowSphereReward(nextReward);
    clearTimeout(flowSphereTimer);
    if(!spawnFlowSphere())throw new Error('Сфера течений не появилась');
    activeFlowSphere.animation.pause();
    activeFlowSphere.animation.currentTime=0;
  },reward);
  await page.locator('.flow-sphere').waitFor({state:'visible'});
}

async function sphereMetrics(page){
  return page.evaluate(()=>{
    const shell=document.querySelector('.app-shell').getBoundingClientRect();
    const weather=document.getElementById('lakeCard').getBoundingClientRect();
    const cast=document.getElementById('castBtn').getBoundingClientRect();
    const layer=document.getElementById('flowSphereLayer');
    const target=document.querySelector('.flow-sphere');
    const visual=target.querySelector('.flow-sphere__visual');
    const targetStyle=getComputedStyle(target),visualStyle=getComputedStyle(visual);
    const frames=activeFlowSphere.animation.effect.getKeyframes();
    const points=frames.map(frame=>{
      const match=String(frame.transform).match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/);
      return match?{x:Number(match[1]),y:Number(match[2])}:null;
    });
    const targetRect=target.getBoundingClientRect();
    return {
      shell:{top:shell.top,left:shell.left},
      weather:{bottom:weather.bottom},
      cast:{top:cast.top,bottom:cast.bottom,left:cast.left,right:cast.right},
      target:{top:targetRect.top,left:targetRect.left,width:parseFloat(targetStyle.width),height:parseFloat(targetStyle.height)},
      visual:{width:parseFloat(visualStyle.width),height:parseFloat(visualStyle.height),backdrop:visualStyle.backdropFilter||visualStyle.webkitBackdropFilter},
      clipTop:parseFloat(getComputedStyle(layer).getPropertyValue('--flow-sphere-clip-top')),
      pointerEventsLayer:getComputedStyle(layer).pointerEvents,
      pointerEventsTarget:targetStyle.pointerEvents,
      points
    };
  });
}

function verifyMetrics(metrics,label){
  assert(metrics.target.width>=48&&metrics.target.height>=48,`${label}: зона нажатия меньше 48px`);
  assert(metrics.visual.width>=60&&metrics.visual.width<metrics.target.width,`${label}: размер видимой сферы неверен`);
  assert(metrics.visual.backdrop&&metrics.visual.backdrop!=='none',`${label}: отсутствует локальное размытие содержимого под сферой`);
  assert.strictEqual(metrics.pointerEventsLayer,'none',`${label}: слой блокирует интерфейс`);
  assert.strictEqual(metrics.pointerEventsTarget,'auto',`${label}: сфера не принимает нажатие`);
  assert(Math.abs(metrics.clipTop-(metrics.weather.bottom-metrics.shell.top))<=2,`${label}: отсечка не совпадает с нижней границей погодного блока`);
  assert(metrics.points.length>=5&&metrics.points.every(Boolean),`${label}: путь сферы не читается`);
  const pathStartTop=metrics.shell.top+metrics.points[0].y;
  assert(pathStartTop>=metrics.cast.top-2&&pathStartTop<=metrics.cast.bottom,`${label}: сфера стартует не из-под кнопки заброса`);
  for(let index=1;index<metrics.points.length;index++)assert(metrics.points[index].y<metrics.points[index-1].y,`${label}: траектория не всегда направлена вверх`);
  assert(metrics.points.at(-1).y+metrics.target.height<=metrics.clipTop+1,`${label}: сфера не уходит полностью под границу погоды`);
  assert(new Set(metrics.points.map(point=>Math.round(point.x))).size>=3,`${label}: траектория не хаотична по горизонтали`);
}

async function verifyDebugModalGuard(page,label,screenshotPath){
  if(!await page.locator('.flow-sphere').count()){
    await mountSphere(page,{id:`debug-${label}`,kind:'casts',count:2});
  }
  const immediate=await page.evaluate(()=>{
    const dialog=$('dropfishDebugDialog'),layer=$('flowSphereLayer'),sphere=document.querySelector('.flow-sphere');
    dialog.showModal();
    return {dialog:dialog.open,layerVisibility:getComputedStyle(layer).visibility,sphereVisibility:getComputedStyle(sphere).visibility};
  });
  assert.deepStrictEqual(immediate,{dialog:true,layerVisibility:'hidden',sphereVisibility:'hidden'},`${label}: игровая Сфера видна сквозь тестовую панель`);
  await page.waitForTimeout(60);
  const deferred=await page.evaluate(()=>({active:Boolean(activeFlowSphere),pending:state.flowSphere.pendingRewards.length,dialog:$('dropfishDebugDialog').open}));
  assert.deepStrictEqual(deferred,{active:false,pending:1,dialog:true},`${label}: тестовая панель не вернула активную Сферу в очередь`);
  await page.screenshot({path:screenshotPath,animations:'disabled'});
  await page.evaluate(()=>{$('dropfishDebugDialog').close();clearTimeout(flowSphereTimer);state.flowSphere.pendingRewards=[];});
}

async function verifyRules(page,label){
  const threshold=await page.evaluate(()=>{
    state=initialState();state.sessionDate=localDayKey();
    const original=Math.random;Math.random=()=>0;
    try{
      state.castClicks=3;const before=maybeQueueFlowSphereAfterCast();
      state.castClicks=4;const after=maybeQueueFlowSphereAfterCast();
      clearTimeout(flowSphereTimer);
      return {before,after,pending:state.flowSphere.pendingRewards.length};
    }finally{Math.random=original;}
  });
  assert.deepStrictEqual(threshold,{before:false,after:true,pending:1},`${label}: проверка начинается не с четвёртого заброса`);

  await page.evaluate(()=>{state=initialState();state.sessionDate=localDayKey();render();});
  await mountSphere(page,{id:'catch-test',kind:'finalKg',kg:30});
  await page.evaluate(()=>{activeFlowSphere.animation.currentTime=activeFlowSphere.animation.effect.getTiming().duration*.55;});
  await page.locator('.flow-sphere').click({position:{x:40,y:40}});
  await page.waitForTimeout(240);
  const caught=await page.evaluate(()=>({rows:state.history.filter(row=>row.type==='flowSphere').length,flat:state.flowSphere.flatKgBonuses.map(item=>item.kg),caught:state.flowSphere.caught,active:Boolean(activeFlowSphere)}));
  assert.deepStrictEqual(caught,{rows:1,flat:[30],caught:1,active:false},`${label}: поимка не выдала одну награду и одну строку`);

  const beforeMiss=await page.evaluate(()=>state.history.length);
  await mountSphere(page,{id:'miss-test',kind:'casts',count:3});
  await page.evaluate(()=>{activeFlowSphere.animation.finish();});
  await page.waitForTimeout(60);
  const missed=await page.evaluate(()=>({history:state.history.length,missed:state.flowSphere.missed,casts:state.castsLeft}));
  assert.strictEqual(missed.history,beforeMiss,`${label}: пропуск создал строку хронологии`);
  assert.strictEqual(missed.missed,1,`${label}: пропуск не учтён`);
  assert.strictEqual(missed.casts,10,`${label}: пропущенная награда была применена`);

  await mountSphere(page,{id:'dialog-test',kind:'finalKg',kg:17});
  await page.evaluate(()=>$('guideDialog').showModal());
  await page.waitForTimeout(60);
  const deferred=await page.evaluate(()=>({active:Boolean(activeFlowSphere),pending:state.flowSphere.pendingRewards.map(item=>item.id),dialog:$('guideDialog').open}));
  assert.deepStrictEqual(deferred,{active:false,pending:['dialog-test'],dialog:true},`${label}: обязательный интерфейс не вернул активную Сферу в очередь`);
  await page.evaluate(()=>{$('guideDialog').close();clearTimeout(flowSphereTimer);state.flowSphere.pendingRewards=[];});

  await page.locator('#dropfishDebugBtn').click();
  const debugIcon=await page.locator('[data-debug-action="flow-sphere"] .flow-sphere-icon').evaluate(slot=>{
    const image=slot.querySelector('img'),slotBox=slot.getBoundingClientRect(),imageBox=image?.getBoundingClientRect();
    return {slot:{width:slotBox.width,height:slotBox.height},image:imageBox?{width:imageBox.width,height:imageBox.height,left:imageBox.left,right:imageBox.right,top:imageBox.top,bottom:imageBox.bottom}:null};
  });
  assert(debugIcon.image&&debugIcon.image.width<=debugIcon.slot.width+1&&debugIcon.image.height<=debugIcon.slot.height+1,`${label}: изображение Сферы вышло из компактного слота тестовой кнопки (${JSON.stringify(debugIcon)})`);
  await page.locator('[data-debug-action="flow-sphere"]').click();
  await page.locator('.flow-sphere').waitFor({state:'visible'});
  const debugTrigger=await page.evaluate(()=>({dialog:$('dropfishDebugDialog').open,active:Boolean(activeFlowSphere),layerVisibility:getComputedStyle($('flowSphereLayer')).visibility}));
  assert.deepStrictEqual(debugTrigger,{dialog:false,active:true,layerVisibility:'visible'},`${label}: тестовый вызов Сферы не вернул игрока в свободный игровой интерфейс`);
  await page.evaluate(()=>interruptFlowSphere({requeue:false}));

  const final=await page.evaluate(()=>{
    interruptFlowSphere({requeue:false});
    state=initialState();state.sessionDate=localDayKey();state.castsLeft=0;state.tradeShipChecked=true;state.tradeShipCompleted=true;
    state.fish=[{id:'fixture-fish',name:'треска',category:'normal',originalWeight:200,weight:200,source:'Заброс',direct:true,removed:false,tags:[],debuffLimited:false}];
    state.flowSphere.flatKgBonuses=[{id:'flat',rowId:null,kg:30}];
    state.flowSphere.multipliers=[{id:'m1',rowId:null,factor:1.4},{id:'m2',rowId:null,factor:1.8}];
    finishGame();
    return {total:state.finalResult.total,impact:state.finalResult.sphereImpact,text:document.getElementById('resultCard').textContent};
  });
  assert.strictEqual(final.total,579.6,`${label}: нарушен порядок итоговой формулы`);
  assert.strictEqual(final.impact.before,200,`${label}: Сфера применена до существующих финальных расчётов`);
  assert(final.text.includes('Сфера течений')&&final.text.includes('579,6'),`${label}: формула не показана в итоговой карточке`);
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const report=[];
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=await prepare(page);
        await mountSphere(page,{id:`visual-${engineName}-${viewportName}`,kind:'casts',count:2});
        const metrics=await sphereMetrics(page);
        verifyMetrics(metrics,`${engineName}/${viewportName}`);
        await page.evaluate(()=>{
          activeFlowSphere.animation.currentTime=activeFlowSphere.animation.effect.getTiming().duration*.45;
        });
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),animations:'allow'});
        await verifyDebugModalGuard(page,`${engineName}/${viewportName}`,path.join(output,`${engineName}-${viewportName}-debug-modal-guard.png`));
        if(viewportName==='phonePortrait')await verifyRules(page,`${engineName}/${viewportName}`);
        assert.deepStrictEqual(errors,[],`${engineName}/${viewportName}: ошибки страницы: ${errors.join(' | ')}`);
        report.push({engine:engineName,viewport:viewportName,metrics});
        await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,report},null,2));
  console.log(`PASS: Сфера течений — ${report.length} Chromium/WebKit визуальных конфигураций и полный механический контракт.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
