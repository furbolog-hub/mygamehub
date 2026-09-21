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
     fresh();grantBonus('Счастливый поплавок');Math.random=()=>.75;const luckyCasts=state.castsLeft;startRadioactiveOutbreak();
     for(let i=0;i<3;i++)castRadioactiveLine();
     const discardCore=radioactiveState().cores.find(core=>core.stage==='forming'),discardTrash=state.trash.find(item=>item.radioactiveTrash&&!item.converted);
     ok(state.castClicks===3&&state.castsLeft===luckyCasts,'radioactive trash casts count while lucky float restores attempts');
     ok(discardCore?.castsRemaining===2&&discardCore.trashIds.length===3,'three trash from one outbreak schedules isotope core');
     state.weather='sunny';discardRadioactiveTrash(discardTrash.id);ok(!discardTrash.converted,'radioactive trash discard blocked outside dangerous weather');
     state.weather='storm';discardRadioactiveTrash(discardTrash.id);ok(discardTrash.radioactiveDiscarded&&discardCore.stage==='cancelled','discard cancels isotope formation');
     fresh();Math.random=()=>.75;startRadioactiveOutbreak();for(let i=0;i<3;i++)castRadioactiveLine();
     const forming=radioactiveState().cores.find(core=>core.stage==='forming');castLine();ok(forming.stage==='forming'&&forming.castsRemaining===1,'first later cast advances formation');castLine();
     ok(forming.stage==='core'&&forming.castsRemaining===2,'second later cast forms isotope core');
     ok(state.history.filter(row=>row.radioactiveTrash).length===0&&state.history.filter(row=>row.type==='radioactiveCore').length===1,'three trash rows merge into one core row');
     render();ok(document.querySelector('.type-radioactiveCore img[src*="isotope-core.webp"]'),'core chronology icon');
     ok(document.querySelector('.effect-radioactive img[src*="isotope-core.webp"]')&&document.querySelector('.effect-radioactive')?.textContent.includes('2 забр.'),'core active effect countdown');
     const preservedSample=createRadioactiveCatch();addFishHistory(preservedSample,'Заброс');const sampleBefore=preservedSample.weight;
     const ordinaryBeforeExplosion=makeFish('giant');ordinaryBeforeExplosion.moonShellProtected=true;ordinaryBeforeExplosion.dungeonAlly=true;ordinaryBeforeExplosion.dungeonAllyKey='eel';
     const chestRow=processEpic('Бездонный ларь'),chestArtifact=state.artifacts.find(item=>item.id===chestRow.artifactId),chestFish=state.fish.filter(item=>item.source==='Бездонный ларь');
     const preservedArtifacts=[chestArtifact,...[['legendary','Гексаэдр пятой грани'],['mythic','Око Шторма']].map(([tier,name])=>{const artifact={id:uid(),name,tier};state.artifacts.push(artifact);artifact.historyRowId=addHistory(name,tier,'',{numbered:true,artifactId:artifact.id}).id;return artifact;})];
     grantBonus('Ласты');const tradeDefinition=TRADE_ITEMS[0],tradeItem={id:uid(),key:tradeDefinition.key,name:tradeDefinition.name,icon:tradeDefinition.icon,exchanged:false};state.tradeItems.push(tradeItem);
     grantDungeonReward('eye',{bossHp:0,dungeonType:'vault'});const victoryReward=state.dungeon.rewards.at(-1);grantDungeonReward('flame',{bossHp:1000,dungeonType:'vault'});const partialReward=state.dungeon.rewards.at(-1);
     castLine();ok(forming.stage==='core'&&forming.castsRemaining===1,'first core cast advances explosion countdown');castLine();
     ok(forming.stage==='exploded','second core cast explodes');
     ok(preservedSample.weight===round1(sampleBefore*2)&&!preservedSample.removed&&preservedSample.isotopeImpacts.length===1,'sample survives and doubles');
     ok(ordinaryBeforeExplosion.isotopeDestroyed&&ordinaryBeforeExplosion.moonShellProtected&&chestFish.length>0&&chestFish.every(item=>item.isotopeDestroyed),'explosion bypasses protection and destroys bottomless chest fish');
     ok(preservedArtifacts.every(item=>item&&!item.isotopeDestroyed&&state.artifacts.includes(item)),'all artifact categories survive explosion');
     ok(victoryReward.fullBossVictory&&!victoryReward.isotopeDestroyed&&partialReward.isotopeDestroyed,'only full boss victory reward survives');
     ok(tradeItem.isotopeDestroyed&&state.bonuses.every(item=>item.isotopeDestroyed),'non-artifact catch inventory destroyed');
     render();const explodedCoreRow=document.querySelector('.type-radioactiveCore.is-isotope-exploded'),destroyedRows=[...document.querySelectorAll('.history-item.is-isotope-destroyed')];
     ok(explodedCoreRow&&state.history.filter(row=>row.type==='radioactiveCore').length===1,'explosion reuses core history row');
     ok(destroyedRows.length>0&&destroyedRows.some(row=>getComputedStyle(row).borderLeftColor==='rgb(212, 68, 77)')&&destroyedRows.some(row=>getComputedStyle(row.querySelector('.history-row-head')).color==='rgb(155, 155, 155)'),'destroyed chronology rows are red with gray content');
     const sampleHistory=document.querySelector(`[data-history-id="${state.history.find(row=>row.fishId===preservedSample.id).id}"]`);
     ok(sampleHistory.querySelector('.fish-final-equals.is-positive')?.textContent.includes('→')&&sampleHistory.querySelector('.fish-final-weight.is-positive')?.textContent.includes(kg(preservedSample.weight)),'sample row shows arrow and green doubled weight');
     const secondCoreRow=addHistory(ISOTOPE_CORE_NAME,'radioactiveCore','',{numbered:true}),secondCore={id:uid(),outbreakId:uid(),trashIds:[],stage:'core',castsRemaining:1,createdCast:state.castClicks-1,historyRowId:secondCoreRow.id};radioactiveState().cores.push(secondCore);advanceIsotopeCoresAfterCast();
     ok(secondCore.stage==='exploded'&&preservedSample.weight===round1(sampleBefore*4),'later core explosion doubles samples again');
     fresh();Math.random=()=>.75;startRadioactiveOutbreak();for(let i=0;i<3;i++)castRadioactiveLine();const forcedCore=radioactiveState().cores.find(core=>core.stage==='forming'),forcedSample=createRadioactiveCatch(),forcedFish=makeFish('normal');addFishHistory(forcedSample,'Заброс');const forcedBefore=forcedSample.weight;state.castsLeft=0;maybeFinalizeSession();
     ok(forcedCore.stage==='exploded'&&forcedFish.isotopeDestroyed&&forcedSample.weight===round1(forcedBefore*2),'session end forces pending formation and explosion');
     fresh();Math.random=()=>.5;startRadioactiveOutbreak();
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
    await page.evaluate(()=>{
     state=initialState();state.weather='storm';state.weatherSeen=['storm'];
     RADIOACTIVE_SPECIES.forEach(def=>{const f=createRadioactiveCatch();f.name=def[0];f.radioactiveSpecies=def[1];addFishHistory(f,'Заброс');});
     const ordinary=makeFish('giant');ordinary.radioactiveSkeleton=true;ordinary.removed=true;ordinary.weight=0;
     const outbreakId=uid(),trashRow=addHistory(RADIOACTIVE_TRASH_NAME,'trash','',{numbered:true}),trash={id:uid(),name:RADIOACTIVE_TRASH_NAME,kind:'radioactiveTrash',outbreakId,historyRowId:trashRow.id};
     trashRow.radioactiveTrash=true;trashRow.radioactiveOutbreakId=outbreakId;state.trash.push(trash);
     const coreRow=addHistory(ISOTOPE_CORE_NAME,'radioactiveCore','',{numbered:true});
     radioactiveState().cores.push({id:uid(),outbreakId:uid(),trashIds:[],stage:'core',castsRemaining:2,createdCast:state.castClicks,historyRowId:coreRow.id});
     startRadioactiveOutbreak();render();
    });
    await page.evaluate(()=>{
     const row=state.history.find(h=>state.fish.find(f=>f.id===h.fishId)?.radioactiveSkeleton),definition=TRADE_ITEMS[0];
     const item={id:uid(),key:definition.key,name:definition.name,historyRowId:row.id,exchanged:true,radioactiveCorrupted:true,abyssChange:{kind:'transform',source:'Радиоактивные образцы',toName:'размокшее полено',toIcon:'🔘',toType:'trash'}};
     state.tradeItems.push(item);row.tradeItemId=item.id;render();
    });
    await page.waitForFunction(()=>[...document.querySelectorAll('.radioactive-fish-icon,.radioactive-trash-icon img,.isotope-core-icon img')].every(i=>i.complete&&i.naturalWidth));
    await page.evaluate(()=>{const scroll=$('historyScroll');scroll.style.setProperty('scroll-behavior','auto','important');scroll.scrollTop=scroll.scrollHeight;});
    await page.waitForTimeout(900);
    const bounds=await page.evaluate(()=>{const coreChip=document.querySelector('.chip.effect-radioactive'),coreBox=coreChip?.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+1,timer:!!document.querySelector('[data-radioactive-time]'),buttons:[...document.querySelectorAll('.radioactive-action button')].map(b=>b.getBoundingClientRect().height),missing:[...document.querySelectorAll('.radioactive-fish-icon,.radioactive-trash-icon img,.isotope-core-icon img')].filter(i=>!i.complete||!i.naturalWidth).length,trash:!!document.querySelector('.is-radioactive-trash .radioactive-trash-icon'),core:!!document.querySelector('.type-radioactiveCore .isotope-core-icon'),coreChip:coreBox?{width:coreBox.width,height:coreBox.height}:null};});
    assert.equal(bounds.overflow,false,`${engine} ${label} overflow`);assert(bounds.timer);assert(bounds.buttons.every(h=>h<=29));assert.equal(bounds.missing,0);assert(bounds.trash&&bounds.core&&bounds.coreChip);assert(bounds.coreChip.width<=148&&bounds.coreChip.height<=60,`${engine} ${label} compact isotope core effect`);
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
