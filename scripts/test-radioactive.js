const {chromium,webkit}=require('playwright');
const {pathToFileURL}=require('url');
const path=require('path');
const fs=require('fs');
const assert=require('assert/strict');
(async()=>{
 for(const [engine,browserType] of Object.entries({chromium,webkit})){
  const browser=await browserType.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve('dropfish/index.html')).href);
   const checks=await page.evaluate(async()=>{
    const results=[];
    const ok=(value,label)=>{if(!value)throw new Error(label);results.push(label);};
    const fresh=()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());state=initialState();state.weather='sunny';state.weatherSeen=['sunny'];render();};
    const random=Math.random;Math.random=()=>.5;
    try{
     fresh();state.debuffs.push({id:uid(),name:'К\u0430сатка',active:true});state=hydrateState(serializeState(state));
     ok(activeDebuff('Косатка')&&state.debuffs[0].name==='Косатка','legacy orca name migration');
     fresh();startRadioactiveOutbreak();render();const rowId=radioactiveState().rowId;
     ok(document.querySelector('[data-radioactive-time]'),'inline timer');
     radioactiveTick(1000);ok(radioactiveState().ms===4000,'timer elapsed');
     $('guideDialog').showModal();radioactiveTick(1000);ok(radioactiveState().ms===4000,'dialog pauses timer');$('guideDialog').close();
     state=hydrateState(serializeState(state));ok(radioactiveState().ms===4000,'saved timer');
     castLine();ok(state.history.find(h=>h.id===rowId)?.type==='fish','same row becomes catch');
     ok(radioactiveState().rowId!==rowId&&radioactiveState().ms===5000,'next timer');
     ok(state.fish[0].radioactiveSample&&state.fish[0].weight===75,'sample weight');
     const fish=state.fish[0];processDebuff('Осьминог');ok(state.fish.some(f=>f.radioactiveOctopus)&&!activeDebuff('Осьминог'),'octopus converted');
     processDebuff('Чайка');processDebuff('Косатка');processDebuff('Рак');processDebuff('Утка');ok(!fish.removed&&fish.weight===75,'debuff immunity');
     changeAbyssFishWeight(fish,.5,'Паразит');setFishAbyssLost(fish,'Уничтожена Разрушителем');ok(!fish.removed&&fish.weight===75,'abyss negative immunity');
     changeAbyssFishWeight(fish,1.4,'Симбиот');ok(fish.weight===105,'abyss growth');
     applyLeviaxarWrath();state.dungeon.wrath=true;smolderFishBeforeCast();ok(!fish.removed&&fish.weight===105,'wrath immunity');
     ok(!availableSacrificeFish().includes(fish)&&!dungeonAvailableFish().includes(fish),'sacrifice immunity');
     endRadioactiveOutbreak();processBonus('Подводная маска');processBonus('Акваланг');ok(finalFishSnapshot().find(f=>f.id===fish.id)?.weight===105,'final gear and orca immunity');
     state.weather='sunny';discardRadioactiveSample(fish.id);ok(!fish.removed,'sunny discard blocked');state.weather='storm';discardRadioactiveSample(fish.id);ok(fish.removed,'storm discard');
     fresh();const ordinary=makeFish('giant'),arcade=makeFish('normal','Аркадный улов',false,{arcadeCatch:true}),rift=makeFish('normal','Разлом: тест');
     const sample=createRadioactiveCatch();addFishHistory(sample,'Заброс');
     state.tradeItems.push(...['tideRoot','enchantedIdol','ceremonialMask','firstWaterFlask'].map(key=>({id:uid(),key,name:key,exchanged:false})));
     radioactiveState().risk=1;Math.random=()=>.999;
     checkRadioactiveContamination();ok(ordinary.radioactiveSkeleton&&arcade.radioactiveSkeleton&&!rift.removed,'source boundaries');
     ok(state.tradeItems.find(i=>i.key==='tideRoot').exchanged&&!state.tradeItems.find(i=>i.key==='enchantedIdol').exchanged&&!state.tradeItems.find(i=>i.key==='firstWaterFlask').exchanged,'item boundaries');
     render();const skeletonRow=document.querySelector(`[data-history-id="${state.history.find(h=>h.fishId===ordinary.id).id}"]`);
     ok(skeletonRow.querySelector('img[src*="fish-status/skeleton"]'),'skeleton icon');
     ok(!skeletonRow.querySelector('img[src*="fish-status/giant"]'),'no former category');
     const octopus=createRadioactiveCatch(true);const base=octopus.weight;octopus.weight+=50;mutateRadioactiveOctopus(octopus,10);ok(octopus.mutationWeight===100&&octopus.weight===150,'mutation cap excludes boosts');
     checkRadioactiveContamination(true);const count=state.history.length;checkRadioactiveContamination(true);ok(count===state.history.length,'final check idempotent');
     fresh();Math.random=()=>.5;startRadioactiveOutbreak();const initial=state.fish.length;makeFish('giant','Бездонный ларь',false);ok(state.fish.length===initial,'artifact fish deferred');endRadioactiveOutbreak();ok(state.fish.length===initial+1,'deferred fish restored');
     fresh();const first=createRadioactiveCatch(),second=createRadioactiveCatch();addFishHistory(first,'Заброс');addFishHistory(second,'Заброс');state.weather='storm';discardRadioactiveSample(first.id);ok(!second.removed&&radioactiveSamples().length===1,'independent discard');
     radioactiveState().risk=.1;checkRadioactiveContamination();ok(radioactiveState().risk===.12,'risk grows by two percentage points');
     radioactiveState().risk=.99;checkRadioactiveContamination();ok(radioactiveState().risk===1,'risk capped at 100 percent');
     discardRadioactiveSample(second.id);ok(radioactiveState().risk===.1,'last discard resets risk');
     fresh();startRadioactiveOutbreak();endRadioactiveOutbreak();Math.random=()=>.01;
     for(let i=0;i<5;i++)advanceRadioactiveAfterOrdinaryCast();ok(!radioactiveActive(),'five casts cooldown');advanceRadioactiveAfterOrdinaryCast();ok(radioactiveActive(),'outbreak can recur after cooldown');
     processBonus('Ласты');processCoinCatch();ok(!state.bonuses.length&&!state.coins.length,'no bonus or coin catches');
     state.rifts.preparedCatch='giant';const prepared=state.rifts.preparedCatch;castLine();ok(state.rifts.preparedCatch===prepared,'prepared catch preserved');
     fresh();Math.random=()=>.5;startRadioactiveOutbreak();Object.defineProperty(document,'hidden',{configurable:true,value:true});radioactiveTick(6000);ok(radioactiveState().ms===5000,'hidden app pauses countdown');delete document.hidden;
     radioactiveTick(5001);ok(!radioactiveActive()&&state.castsLeft===BALANCE.session.casts,'waiting expires without spending casts');
     fresh();state.dungeon.rewards.push({id:uid(),key:'chronocrystal',used:false});startRadioactiveOutbreak();const oldPrompt=radioactiveState().rowId;castLine();const chronoRow=state.dungeon.chronoCurrentRowId,casts=state.castsLeft;useChronocrystal(chronoRow);ok(radioactiveActive()&&radioactiveState().rowId===oldPrompt&&state.castsLeft===casts&&!state.fish.length,'chronocrystal restores outbreak without restoring attempt');
     fresh();const finalFish=makeFish('normal');const finalSample=createRadioactiveCatch();addFishHistory(finalSample,'Заброс');state.castsLeft=0;radioactiveState().risk=1;Math.random=()=>.999;beginTradeShip();ok(finalFish.radioactiveSkeleton&&radioactiveState().finalChecked,'arrival checks contamination');
     ok(state.history.findIndex(h=>h.type==='tradeShip')<state.history.findIndex(h=>h.radioactiveImpact),'arrival precedes final contamination');
     stopRadioactiveSound(false);fresh();Math.random=()=>.5;
     const originalRadioactiveClone=sounds.radioactive.cloneNode;
     let pauseCalls=0;
     const fakeRadioactiveAudio={preload:'',volume:0,currentTime:4,paused:false,ended:false,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;pauseCalls++;}};
     sounds.radioactive.cloneNode=()=>fakeRadioactiveAudio;
     try{
      state.castsLeft=1;startRadioactiveOutbreak();
      ok(activeRadioactiveSound===fakeRadioactiveAudio,'outbreak audio is tracked');
      castRadioactiveLine();
      ok(state.castsLeft===0&&!radioactiveActive(),'last available cast ends outbreak');
      await new Promise(resolve=>setTimeout(resolve,120));
      ok(!fakeRadioactiveAudio.paused&&fakeRadioactiveAudio.volume>0&&fakeRadioactiveAudio.volume<sounds.radioactive.volume,'outbreak audio fades progressively');
      await new Promise(resolve=>setTimeout(resolve,RADIOACTIVE_SOUND_FADE_MS+80));
      ok(fakeRadioactiveAudio.paused&&pauseCalls===1&&fakeRadioactiveAudio.currentTime===0&&activeRadioactiveSound===null,'outbreak audio stops after fade');
     }finally{stopRadioactiveSound(false);sounds.radioactive.cloneNode=originalRadioactiveClone;}
     return results;
    }finally{Math.random=random;}
   });
   assert.equal(errors.length,0,errors.join('\n'));
   const out=path.resolve('.visual-test-output/radioactive');fs.mkdirSync(out,{recursive:true});
   for(const [label,width,height] of [['desktop',1280,800],['phone-portrait',390,844],['phone-landscape',844,390],['tablet-portrait',768,1024],['tablet-landscape',1024,768]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>{state=initialState();state.weather='storm';state.weatherSeen=['storm'];RADIOACTIVE_SPECIES.forEach((def,i)=>{const f=createRadioactiveCatch();f.name=def[0];f.radioactiveSpecies=def[1];addFishHistory(f,'Заброс');});const ordinary=makeFish('giant');ordinary.radioactiveSkeleton=true;ordinary.removed=true;ordinary.weight=0;startRadioactiveOutbreak();render();});
    await page.evaluate(()=>{
     const row=state.history.find(h=>state.fish.find(f=>f.id===h.fishId)?.radioactiveSkeleton),definition=TRADE_ITEMS[0];
     const item={id:uid(),key:definition.key,name:definition.name,historyRowId:row.id,exchanged:true,radioactiveCorrupted:true,abyssChange:{kind:'transform',source:'Радиоактивные образцы',toName:'размокшее полено',toIcon:'🔘',toType:'trash'}};
     state.tradeItems.push(item);row.tradeItemId=item.id;render();
    });
    await page.waitForFunction(()=>[...document.querySelectorAll('.radioactive-fish-icon')].every(i=>i.complete&&i.naturalWidth));
    await page.evaluate(()=>{const scroll=$('historyScroll');scroll.style.setProperty('scroll-behavior','auto','important');scroll.scrollTop=scroll.scrollHeight;});
    await page.waitForTimeout(900);
    const bounds=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,timer:!!document.querySelector('[data-radioactive-time]'),buttons:[...document.querySelectorAll('.radioactive-action button')].map(b=>b.getBoundingClientRect().height),missing:[...document.querySelectorAll('.radioactive-fish-icon')].filter(i=>!i.complete||!i.naturalWidth).length}));
    assert.equal(bounds.overflow,false,`${engine} ${label} overflow`);assert(bounds.timer);assert(bounds.buttons.every(h=>h<=29));assert.equal(bounds.missing,0);
    const appearance=await page.evaluate(()=>{
     const sample=document.querySelector('.is-radioactive-sample'),change=document.querySelector('.is-radioactive-change'),animation=getComputedStyle(sample,'::before');
     return {count:document.querySelectorAll('.is-radioactive-sample').length,name:animation.animationName,duration:animation.animationDuration,opacity:animation.opacity,color:getComputedStyle(change.querySelector('.abyss-change-agent')).color,icon:!!change.querySelector('.abyss-result-trash img[src*="/trash/trash.webp"]'),placeholder:change.textContent.includes('🔘')};
    });
    assert.equal(appearance.count,6);assert.equal(appearance.name,'radioactive-drift');assert.equal(appearance.duration,'18s');assert.equal(appearance.opacity,'0.38');assert.equal(appearance.color,'rgb(216, 237, 121)');assert(appearance.icon);assert(!appearance.placeholder);
    await page.screenshot({path:path.join(out,`${engine}-${label}.png`)});
    await page.evaluate(()=>document.body.classList.add('reduce-motion'));
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.is-radioactive-sample'),'::before').animationName),'none');
    await page.evaluate(()=>document.body.classList.remove('reduce-motion'));
   }
   console.log(`${engine}: ${checks.length} mechanics checks, 5 visual sizes PASS`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
