const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','temporary-debuff-turns');
const viewports={desktop:{width:1366,height:768},phoneSmall:{width:320,height:700},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

async function inspect(page){
  return page.evaluate(()=>{
    const originalRandom=Math.random;
    Math.random=()=>.99;
    const fresh=()=>{
      state=initialState();
      state.weather='calm';state.weatherSeen=['calm'];state.sessionDate='2099-01-01';
      ordinaryCastContext=null;assemblyBuoyProtectionActive=false;
    };
    try{
      fresh();state.castClicks=10;processDebuff('Утка');
      const duck=state.debuffs.at(-1),duckInitial={remaining:duck.remainingCasts,createdCast:duck.createdCast};
      advanceTemporaryDebuffsAfterOrdinaryCast(10,[]);
      const duckAcquisitionCastRemaining=duck.remainingCasts,duckFish=[];
      for(let cast=11;cast<=14;cast++){
        state.castClicks=cast;
        const fish=makeFish('heavy','Заброс',true,{initialWeight:12,fishName:`треска ${cast}`});
        duckFish.push({limited:fish.debuffLimited,source:fish.debuffSource,weight:fish.weight});
        advanceTemporaryDebuffsAfterOrdinaryCast(cast,[fish]);
      }
      state.castClicks=15;
      const postDuckFish=makeFish('heavy','Заброс',true,{initialWeight:12,fishName:'треска после утки'});
      const duckResult={duckInitial,duckAcquisitionCastRemaining,fish:duckFish,active:duck.active,phase:duck.phase,postLimited:postDuckFish.debuffLimited};

      const weightLimitSourceMatrix=debuffName=>{
        const inspectSource=(source,arcadeCatch=false)=>{
          fresh();state.castClicks=0;processDebuff(debuffName);
          const fish=makeFish('heavy',source,source==='Заброс',{initialWeight:12,fishName:`тест источника ${source}`,arcadeCatch,skipSideEvents:true,ignoreRadioactive:true});
          return {source,limited:fish.debuffLimited,debuffSource:fish.debuffSource||null,weight:fish.weight};
        };
        fresh();state.castClicks=0;processDebuff(debuffName);
        const guardBuoy=grantAssemblyBlueprint('guardBuoy',{numbered:true});guardBuoy.stage='built';guardBuoy.charges=1;
        const guardedExcludedFish=makeFish('heavy','Разлом: защищённая граница',false,{initialWeight:12,fishName:'рыба разлома',skipSideEvents:true,ignoreRadioactive:true});
        return {
          allowed:[inspectSource('Заброс'),inspectSource('Аркадный улов',true)],
          excluded:[
            'Разлом: тест','Сфера течений','Бездонный ларь','Эхолот','Старина Ангус',
            'Темпоральный самоцвет','Око Балистьера','Эхо улова','Кристалл расслоения',
            'Трансмутация хлама','Преобразовано Xb1','Золотая шестерня','Пучина мёртвых вод'
          ].map(source=>inspectSource(source)),
          guardedExcluded:{limited:guardedExcludedFish.debuffLimited,weight:guardedExcludedFish.weight,guardCharges:guardBuoy.charges}
        };
      };
      const sourceBoundaryResult={duck:weightLimitSourceMatrix('Утка'),crab:weightLimitSourceMatrix('Рак')};

      fresh();state.castClicks=0;processDebuff('Рак');
      const crab=state.debuffs.at(-1),limitedFish=[];
      for(let cast=1;cast<=3;cast++){
        state.castClicks=cast;
        const fish=makeFish('heavy','Заброс',true,{initialWeight:12,fishName:`пикша ${cast}`});
        limitedFish.push({limited:fish.debuffLimited,source:fish.debuffSource,weight:fish.weight});
        advanceTemporaryDebuffsAfterOrdinaryCast(cast,[fish]);
      }
      const afterThree={active:crab.active,phase:crab.phase,remaining:crab.remainingCasts};
      state.castClicks=4;advanceTemporaryDebuffsAfterOrdinaryCast(4,[]);
      const afterNonFish={active:crab.active,phase:crab.phase};
      const caughtBeforeEscape=state.fishCaughtTotal,piranhaCounterBefore=state.dungeon.ordinaryFishSinceRoll;
      state.castClicks=5;
      const escaped=makeFish('giant','Заброс',true,{initialWeight:24.6,fishName:'рыба-меч'});
      const escapedRow=state.history.find(row=>row.fishId===escaped.id);
      const cleanWeight=round1(state.fish.filter(fish=>!fish.removed).reduce((sum,fish)=>sum+fish.weight,0));
      const crabResult={limitedFish,afterThree,afterNonFish,escaped:{removed:escaped.removed,crabEscaped:escaped.crabEscaped,weight:escaped.weight,rowCrabEscaped:escapedRow?.crabEscaped||false,rowEaten:escapedRow?.eaten||false,detail:escapedRow?.detail||'',tradeItemId:escapedRow?.tradeItemId||null},active:crab.active,phase:crab.phase,caughtBeforeEscape,caughtAfterEscape:state.fishCaughtTotal,piranhaCounterBefore,piranhaCounterAfter:state.dungeon.ordinaryFishSinceRoll,cleanWeight,availableWeight:round1(state.fish.filter(fish=>!fish.removed).reduce((sum,fish)=>sum+fish.weight,0))};

      fresh();state.castClicks=0;processDebuff('Чайка');
      const seagull=state.debuffs.at(-1);
      state.castClicks=1;advanceTemporaryDebuffsAfterOrdinaryCast(1,[]);
      const afterEmpty={active:seagull.active,remaining:seagull.remainingEligibleFish,seen:seagull.eligibleFishSeen};
      state.castClicks=2;
      const first=makeFish('normal','Заброс',true,{initialWeight:4.2,fishName:'белый окунь'});
      advanceTemporaryDebuffsAfterOrdinaryCast(2,[first]);
      const afterFirst={active:seagull.active,remaining:seagull.remainingEligibleFish,seen:seagull.eligibleFishSeen,stolen:seagull.stolenCount,firstRemoved:first.removed};
      state.castClicks=3;advanceTemporaryDebuffsAfterOrdinaryCast(3,[{id:'deep-fish',deepSea:true,removed:false}]);
      const afterExcluded={active:seagull.active,remaining:seagull.remainingEligibleFish,seen:seagull.eligibleFishSeen};
      state.castClicks=4;
      const second=makeFish('heavy','Заброс',true,{initialWeight:12.4,fishName:'красный луциан'});
      const extra=makeFish('giant','Око Балистьера',false,{initialWeight:29.2,fishName:'большая барракуда'});
      advanceTemporaryDebuffsAfterOrdinaryCast(4,[second,extra]);
      const seagullRow=state.history.find(row=>row.id===seagull.historyRowId);
      const seagullResult={afterEmpty,afterFirst,afterExcluded,remaining:seagull.remainingEligibleFish,seen:seagull.eligibleFishSeen,stolen:seagull.stolenCount,active:seagull.active,phase:seagull.phase,completedByAttempt:seagull.completedByAttempt,secondRemoved:second.removed,extraRemoved:extra.removed,firstRemoved:first.removed,detail:seagullRow?.detail||''};

      fresh();state.castClicks=0;processDebuff('Чайка');
      const guardedSeagull=state.debuffs.at(-1),guardBuoy=grantAssemblyBlueprint('guardBuoy',{numbered:true});guardBuoy.stage='built';guardBuoy.charges=1;
      state.castClicks=1;const guardedFirst=makeFish('normal','Заброс',true,{initialWeight:3.1,fishName:'плотва'});advanceTemporaryDebuffsAfterOrdinaryCast(1,[guardedFirst]);
      state.castClicks=2;const guardedSecond=makeFish('heavy','Заброс',true,{initialWeight:10.8,fishName:'судак'});advanceTemporaryDebuffsAfterOrdinaryCast(2,[guardedSecond]);
      const guardedRow=state.history.find(row=>row.id===guardedSeagull.historyRowId);
      const guardResult={active:guardedSeagull.active,completedByAttempt:guardedSeagull.completedByAttempt,secondRemoved:guardedSecond.removed,charges:guardBuoy.charges,detail:guardedRow?.detail||''};

      fresh();ensureRifts();state.rifts.relics.push({id:uid(),name:'Фантомный осколок',used:false});state.castClicks=0;processDebuff('Чайка');
      const phantomSeagull=state.debuffs.at(-1),phantom=state.rifts.relics.at(-1);
      state.castClicks=1;const phantomFirst=makeFish('normal','Заброс',true,{initialWeight:2.7,fishName:'карась'});advanceTemporaryDebuffsAfterOrdinaryCast(1,[phantomFirst]);
      state.castClicks=2;const phantomSecond=makeFish('heavy','Заброс',true,{initialWeight:11.2,fishName:'жерех'});advanceTemporaryDebuffsAfterOrdinaryCast(2,[phantomSecond]);
      const phantomRow=state.history.find(row=>row.id===phantomSeagull.historyRowId);
      const phantomResult={active:phantomSeagull.active,completedByAttempt:phantomSeagull.completedByAttempt,secondRemoved:phantomSecond.removed,relicUsed:phantom.used,detail:phantomRow?.detail||''};

      fresh();state.castClicks=0;processDebuff('Чайка');const sessionSeagull=state.debuffs.at(-1);
      state.castClicks=1;const sessionFirst=makeFish('normal','Заброс',true,{initialWeight:3.4,fishName:'ерш'});advanceTemporaryDebuffsAfterOrdinaryCast(1,[sessionFirst]);finalizePendingSeagulls();
      const sessionRow=state.history.find(row=>row.id===sessionSeagull.historyRowId);
      const sessionResult={active:sessionSeagull.active,finalizedWithSession:sessionSeagull.finalizedWithSession,completedByAttempt:sessionSeagull.completedByAttempt,detail:sessionRow?.detail||''};

      fresh();state.castClicks=7;processDebuff('Чайка');const legacySeagull=state.debuffs.at(-1);legacySeagull.temporaryRuleVersion=1;legacySeagull.remainingCasts=1;legacySeagull.eligibleFishSeen=1;delete legacySeagull.remainingEligibleFish;
      const migratedSeagull=hydrateState(serializeState(state)).debuffs.find(item=>item.id===legacySeagull.id);
      const migrationResult={version:migratedSeagull.temporaryRuleVersion,remaining:migratedSeagull.remainingEligibleFish,seen:migratedSeagull.eligibleFishSeen,hasRemainingCasts:Object.prototype.hasOwnProperty.call(migratedSeagull,'remainingCasts')};

      fresh();state.castClicks=0;processDebuff('Утка');const firstDuck=state.debuffs.at(-1);
      state.castClicks=1;advanceTemporaryDebuffsAfterOrdinaryCast(1,[]);processDebuff('Утка');const secondDuck=state.debuffs.at(-1);
      for(let cast=2;cast<=4;cast++){state.castClicks=cast;advanceTemporaryDebuffsAfterOrdinaryCast(cast,[]);}
      const repeatResult={first:{active:firstDuck.active,remaining:firstDuck.remainingCasts,createdCast:firstDuck.createdCast},second:{active:secondDuck.active,remaining:secondDuck.remainingCasts,createdCast:secondDuck.createdCast}};

      fresh();state.castClicks=0;processDebuff('Косатка');const orca=state.debuffs.at(-1),orcaRowId=orca.historyRowId;
      render();setHistoryRowExpanded(orcaRowId,true);
      const orcaText=()=>document.querySelector(`[data-history-id="${orcaRowId}"] .history-row-details`)?.textContent.replace(/\s+/g,' ').trim()||'';
      const initialOrcaText=orcaText();
      const firstOrcaFish=makeFish('heavy','Заброс',true,{initialWeight:8.1,fishName:'кижуч'});render();setHistoryRowExpanded(orcaRowId,true);const firstOrcaText=orcaText();
      const secondOrcaFish=makeFish('heavy','Заброс',true,{initialWeight:16.7,fishName:'кижуч'});render();setHistoryRowExpanded(orcaRowId,true);const secondOrcaText=orcaText();
      const orcaResult={initialOrcaText,firstOrcaText,secondOrcaText,affected:[...(orca.affectedFishIds||[])],firstRemoved:firstOrcaFish.removed,secondRemoved:secondOrcaFish.removed};

      fresh();state.castClicks=0;processDebuff('Рак');const visualCrab=state.debuffs.at(-1);visualCrab.phase='snare';visualCrab.remainingCasts=0;
      state.castClicks=1;const visualEscaped=makeFish('giant','Заброс',true,{initialWeight:24.6,fishName:'рыба-меч'});
      processDebuff('Утка');const visualDuck=state.debuffs.at(-1);visualDuck.active=false;visualDuck.phase='exhausted';visualDuck.remainingCasts=0;
      processDebuff('Чайка');const visualSeagull=state.debuffs.at(-1);visualSeagull.active=false;visualSeagull.phase='exhausted';visualSeagull.remainingCasts=0;
      render();
      const visualRow=state.history.find(row=>row.fishId===visualEscaped.id);
      setHistoryRowExpanded(visualRow.id,true);
      const row=document.querySelector(`[data-history-id="${visualRow.id}"]`),result=row?.querySelector('.chronology-row__result'),category=row?.querySelector('.chronology-weight-category-icon'),title=row?.querySelector('.chronology-row__title'),icon=row?.querySelector('.chronology-row__icon');
      const style=node=>node?{filter:getComputedStyle(node).filter,opacity:getComputedStyle(node).opacity,color:getComputedStyle(node).color}:null;
      const exhausted=[...document.querySelectorAll('#effectsList .effect-debuff.is-exhausted')];
      const visual={rowClass:row?.className||'',resultText:result?.textContent.trim()||'',category:Boolean(category),details:row?.querySelector('.history-row-details')?.textContent.replace(/\s+/g,' ').trim()||'',actions:row?.querySelectorAll('button').length||0,styles:{result:style(result),category:style(category),title:style(title),icon:style(icon)},exhausted:exhausted.map(chip=>({text:chip.textContent.replace(/\s+/g,' ').trim(),filter:getComputedStyle(chip).filter,opacity:getComputedStyle(chip).opacity})),effectCount:document.getElementById('effectCount')?.textContent||''};
      return {duckResult,sourceBoundaryResult,crabResult,seagullResult,guardResult,phantomResult,sessionResult,migrationResult,repeatResult,orcaResult,visual};
    }finally{Math.random=originalRandom;}
  });
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];page.on('pageerror',error=>errors.push(String(error)));
        await page.goto(pageUrl,{waitUntil:'load'});
        const result=await inspect(page);
        assert(errors.length===0,`${engineName}/${viewportName}: page errors ${errors.join(' | ')}`);
        assert(result.duckResult.duckInitial.remaining===4&&result.duckResult.duckAcquisitionCastRemaining===4,`${engineName}/${viewportName}: Duck counted its acquisition cast`);
        assert(result.duckResult.fish.length===4&&result.duckResult.fish.every(fish=>fish.limited&&fish.source==='Утка'&&fish.weight<=3),`${engineName}/${viewportName}: Duck did not limit all four following casts`);
        assert(!result.duckResult.active&&result.duckResult.phase==='exhausted'&&!result.duckResult.postLimited,`${engineName}/${viewportName}: Duck did not expire after four casts`);
        for(const [debuffName,matrix] of Object.entries(result.sourceBoundaryResult)){
          const expectedName=debuffName==='duck'?'Утка':'Рак',expectedMax=debuffName==='duck'?3:2.5;
          assert(matrix.allowed.length===2&&matrix.allowed.every(fish=>fish.limited&&fish.debuffSource===expectedName&&fish.weight<=expectedMax),`${engineName}/${viewportName}: ${expectedName} did not limit ordinary and arcade fish ${JSON.stringify(matrix.allowed)}`);
          assert(matrix.excluded.every(fish=>!fish.limited&&fish.debuffSource===null&&fish.weight===12),`${engineName}/${viewportName}: ${expectedName} leaked into excluded fish sources ${JSON.stringify(matrix.excluded)}`);
          assert(!matrix.guardedExcluded.limited&&matrix.guardedExcluded.weight===12&&matrix.guardedExcluded.guardCharges===1,`${engineName}/${viewportName}: ${expectedName} consumed Guard Buoy on an excluded source ${JSON.stringify(matrix.guardedExcluded)}`);
        }
        assert(result.crabResult.limitedFish.length===3&&result.crabResult.limitedFish.every(fish=>fish.limited&&fish.source==='Рак'&&fish.weight<=2.5),`${engineName}/${viewportName}: Crab three-cast weight limit changed`);
        assert(result.crabResult.afterThree.active&&result.crabResult.afterThree.phase==='snare'&&result.crabResult.afterNonFish.active&&result.crabResult.afterNonFish.phase==='snare',`${engineName}/${viewportName}: Crab did not wait through a non-fish fourth cast`);
        assert(result.crabResult.escaped.removed&&result.crabResult.escaped.crabEscaped&&result.crabResult.escaped.rowCrabEscaped&&!result.crabResult.escaped.rowEaten&&/Снасть повреждена.+рыба сорвалась/i.test(result.crabResult.escaped.detail),`${engineName}/${viewportName}: escaped Crab fish row is incorrect`);
        assert(!result.crabResult.active&&result.crabResult.phase==='exhausted'&&result.crabResult.caughtBeforeEscape===result.crabResult.caughtAfterEscape&&result.crabResult.piranhaCounterBefore===result.crabResult.piranhaCounterAfter&&!result.crabResult.escaped.tradeItemId&&result.crabResult.cleanWeight===result.crabResult.availableWeight,`${engineName}/${viewportName}: escaped Crab fish still participates in mechanics or weight`);
        assert(result.seagullResult.afterEmpty.active&&result.seagullResult.afterEmpty.remaining===2&&result.seagullResult.afterEmpty.seen===0,`${engineName}/${viewportName}: empty cast consumed Seagull`);
        assert(result.seagullResult.afterFirst.active&&result.seagullResult.afterFirst.remaining===1&&result.seagullResult.afterFirst.seen===1&&result.seagullResult.afterFirst.stolen===0&&!result.seagullResult.afterFirst.firstRemoved,`${engineName}/${viewportName}: Seagull stole the first eligible fish`);
        assert(result.seagullResult.afterExcluded.active&&result.seagullResult.afterExcluded.remaining===1&&result.seagullResult.afterExcluded.seen===1,`${engineName}/${viewportName}: excluded catch consumed Seagull`);
        assert(result.seagullResult.remaining===0&&result.seagullResult.seen===2&&result.seagullResult.stolen===1&&result.seagullResult.secondRemoved&&!result.seagullResult.extraRemoved&&!result.seagullResult.active&&result.seagullResult.phase==='exhausted'&&result.seagullResult.completedByAttempt&&/Вторая подходящая рыба украдена/i.test(result.seagullResult.detail),`${engineName}/${viewportName}: Seagull did not resolve on the second eligible fish`);
        assert(!result.guardResult.active&&result.guardResult.completedByAttempt&&!result.guardResult.secondRemoved&&result.guardResult.charges===0&&/Сторожевым буем.+действие завершено/i.test(result.guardResult.detail),`${engineName}/${viewportName}: Guard Buoy did not complete the blocked Seagull attempt`);
        assert(!result.phantomResult.active&&result.phantomResult.completedByAttempt&&!result.phantomResult.secondRemoved&&result.phantomResult.relicUsed&&/Фантомным осколком.+действие завершено/i.test(result.phantomResult.detail),`${engineName}/${viewportName}: Phantom Shard did not complete the blocked Seagull attempt`);
        assert(!result.sessionResult.active&&result.sessionResult.finalizedWithSession&&!result.sessionResult.completedByAttempt&&/завершено вместе с сессией.+замечено: 1/i.test(result.sessionResult.detail),`${engineName}/${viewportName}: unresolved Seagull did not finalize with the session`);
        assert(result.migrationResult.version===2&&result.migrationResult.remaining===2&&result.migrationResult.seen===0&&!result.migrationResult.hasRemainingCasts,`${engineName}/${viewportName}: legacy Seagull state was not migrated to eligible-fish counting`);
        assert(!result.repeatResult.first.active&&result.repeatResult.first.remaining===0&&result.repeatResult.second.active&&result.repeatResult.second.remaining===1&&result.repeatResult.second.createdCast===1,`${engineName}/${viewportName}: repeated Duck instances do not have independent timers`);
        assert(/Подходящей рыбы не было/i.test(result.orcaResult.initialOrcaText)&&/Съедено рыб: 1/i.test(result.orcaResult.firstOrcaText)&&/Съедено рыб: 2/i.test(result.orcaResult.secondOrcaText)&&result.orcaResult.affected.length===2&&result.orcaResult.firstRemoved&&result.orcaResult.secondRemoved,`${engineName}/${viewportName}: Orca history counter is not dynamic (${JSON.stringify(result.orcaResult)})`);
        assert(result.visual.rowClass.includes('is-crab-escaped')&&result.visual.category&&result.visual.resultText==='24,6 кг'&&/Снасть повреждена.+рыба сорвалась/i.test(result.visual.details)&&result.visual.actions===0,`${engineName}/${viewportName}: Crab escape row content is incomplete`);
        for(const [part,style] of Object.entries(result.visual.styles))assert(style&&style.filter.includes('grayscale'),`${engineName}/${viewportName}: ${part} is not gray in escaped Crab row`);
        assert(result.visual.exhausted.length===3&&result.visual.exhausted.every(chip=>chip.filter.includes('grayscale')&&Number(chip.opacity)<1&&!/неактив/i.test(chip.text))&&result.visual.effectCount==='0',`${engineName}/${viewportName}: expired debuffs are not compact gray chips`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),fullPage:true,animations:'disabled'});renders++;
        await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,viewports},null,2));
  process.stdout.write(`PASS: ${renders} temporary debuff renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
