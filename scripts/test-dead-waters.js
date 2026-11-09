const {chromium,webkit}=require('playwright');
const {pathToFileURL}=require('url');
const path=require('path');
const fs=require('fs');
const assert=require('assert/strict');

const tentacleSoundPath=path.resolve('dropfish/assets/audio/events/dead-waters-tentacle-attack.ogg');
assert(fs.existsSync(tentacleSoundPath),'tentacle attack sound asset is missing');
assert.equal(fs.readFileSync(tentacleSoundPath).subarray(0,4).toString('ascii'),'OggS','tentacle attack sound asset is not an OGG stream');

const viewports=[
  ['desktop',1280,800],
  ['phone-portrait',390,844],
  ['phone-landscape',844,390],
  ['tablet-portrait',768,1024],
  ['tablet-landscape',1024,768]
];

(async()=>{
  const output=path.resolve('.visual-test-output/dead-waters');
  fs.mkdirSync(output,{recursive:true});
  for(const [engine,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pathToFileURL(path.resolve('dropfish/index.html')).href);
      const checks=await page.evaluate(async()=>{
        const results=[];
        const ok=(value,label)=>{if(!value)throw new Error(label);results.push(label);};
        const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
        const reset=()=>{
          document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
          stopDeadWatersSound();$('deadWatersCard')?.classList.remove('is-tentacle-impact');
          deadWatersMergeTargetId=null;
          state=initialState();
          state.weather='sunny';
          state.weatherSeen=['sunny'];
          render();
        };
        const reward=(kind,index=0)=>{
          if(kind==='fish')return {id:uid(),kind,category:'normal',name:'плотва',weight:2.4,label:'Плотва — 2,4 кг',opened:false};
          if(kind==='trade'){const item=TRADE_ITEMS[index%TRADE_ITEMS.length];return {id:uid(),kind,key:item.key,name:item.name,label:item.name,opened:false};}
          if(kind==='bonus')return {id:uid(),kind,name:'Ласты',label:'Ласты',opened:false};
          if(kind==='debuff')return {id:uid(),kind,name:'Рак',label:'Рак',opened:false};
          if(kind==='artifact')return {id:uid(),kind,tier:'epic',name:'Чешуя Левиафана',label:'Чешуя Левиафана',opened:false};
          if(kind==='expedition')return {id:uid(),kind,name:EXPEDITION_ITEMS[0],label:EXPEDITION_ITEMS[0],opened:false};
          if(kind==='trash')return {id:uid(),kind,name:'погнутый крючок',label:'Погнутый крючок',opened:false};
          return {id:uid(),kind:'tentacle',name:'Гигантское щупальце',label:'Гигантское щупальце',opened:false};
        };
        const grid=(kinds=['fish','trade','bonus','debuff','artifact','expedition','trash','fish','tentacle'])=>kinds.map((kind,index)=>reward(kind,index));
        const spawn=(cells=grid())=>{ok(maybeSpawnDeadWatersAfterCast(true,cells),'forced spawn');return activeDeadWaters();};
        const reveal=count=>{const active=activeDeadWaters();for(let i=0;i<count&&activeDeadWaters();i++)revealDeadWatersCell(active.cells[i].id);};
        const waitForCommit=async()=>{for(let i=0;i<30&&activeDeadWaters();i++)await wait(20);};
        const nativeRandom=Math.random;
        try{
          reset();
          ok(DEAD_WATERS_NAME==='Пучина мёртвых вод'&&$('deadWatersTitle').textContent.trim()===DEAD_WATERS_NAME,'Dead Waters uses the renamed title everywhere');
          ok(BALANCE.deadWaters.defaultChance===.03,'sunny chance configured at 3%');
          for(const weather of ['fog','thunder','storm']){state.weather=weather;ok(deadWatersSpawnChance()===.04,`${weather} chance configured at 4%`);}
          for(const weather of ['sunny','rain','calm','golden','eclipse']){state.weather=weather;ok(deadWatersSpawnChance()===.03,`${weather} chance configured at 3%`);}
          ok(BALANCE.deadWaters.lifetimeMs===20000,'entry lifetime is 20 seconds');

          reset();Math.random=()=>.42;
          const generated=createDeadWatersGrid();
          ok(generated.length===9,'generated grid contains nine cells');
          ok(generated.filter(cell=>cell.kind==='tentacle').length===1,'generated grid contains exactly one tentacle');
          ok(generated.filter(cell=>cell.kind!=='tentacle').length===8,'generated grid contains eight independent rewards');
          ok(Object.values(BALANCE.deadWaters.rewardWeights).reduce((sum,value)=>sum+value,0)===100,'reward weights total 100');
          ok(BALANCE.deadWaters.rewardWeights.trash===25&&BALANCE.deadWaters.rewardWeights.fish===25&&BALANCE.deadWaters.rewardWeights.trade===15,'primary reward weights match specification');
          ok(BALANCE.deadWaters.fishWeights.normal===70&&BALANCE.deadWaters.fishWeights.heavy===25&&BALANCE.deadWaters.fishWeights.giant===5,'fish weights match specification');
          ok(BALANCE.deadWaters.artifactWeights.epic===80&&BALANCE.deadWaters.artifactWeights.legendary===18&&BALANCE.deadWaters.artifactWeights.mythic===2,'artifact weights match specification');

          reset();
          const labelCells=grid(['artifact','expedition','trade','bonus','debuff','trash','fish','artifact','tentacle']);
          labelCells[0]={id:uid(),kind:'artifact',tier:'epic',name:'Эссенция «Великан Океанов»',label:'Эссенция «Великан Океанов»',opened:true};
          labelCells[1]={id:uid(),kind:'expedition',name:'Обрывок письма пропавшего капитана',label:'Обрывок письма пропавшего капитана',opened:true};
          labelCells[7]={id:uid(),kind:'artifact',tier:'epic',name:'Компас потерянных глубин',label:'Компас потерянных глубин',opened:true};
          labelCells.forEach(cell=>cell.opened=true);
          let active=spawn(labelCells);openDeadWaters(active.rowId);active.openedOrder=active.cells.map(cell=>cell.id);renderDeadWaters();
          const renderedLabels=[...document.querySelectorAll('.dead-waters-cell-label')];
          ok(renderedLabels.length===9&&renderedLabels.every(label=>{const cell=label.closest('.dead-waters-cell').getBoundingClientRect(),box=label.getBoundingClientRect();return box.width>0&&label.scrollHeight<=label.clientHeight+1&&box.top>=cell.top&&box.bottom<=cell.bottom;}),'every reward label, including the longest artifact and expedition names, is fully visible');

          reset();
          const timed=spawn();
          ok(timed.status==='available'&&!deadWatersBlocksCasting(),'fishing remains available while the entry waits');
          ok(timed.expiresAt-Date.now()>19500&&timed.expiresAt-Date.now()<=20000,'entry stores an absolute 20 second deadline');
          ok(document.querySelector(`[data-open-dead-waters="${timed.rowId}"]`),'chronology row contains entry action');
          const timedRow=document.querySelector(`[data-history-id="${timed.rowId}"]`),timedStatus=timedRow?.querySelector('.chronology-row__meta .chronology-live-countdown'),timedValue=timedStatus?.querySelector('[data-dead-waters-time]'),timedResult=timedStatus?.closest('.chronology-row__result');
          const timedBox=timedValue?.getBoundingClientRect(),timedResultBox=timedResult?.getBoundingClientRect(),initialTimedValue=Number(timedValue?.textContent);
          ok(Boolean(timedBox&&timedResultBox&&timedBox.width>0&&timedBox.left>=timedResultBox.left-1&&timedBox.right<=timedResultBox.right+1&&timedStatus.scrollWidth<=timedResult.clientWidth+1&&getComputedStyle(timedValue).visibility==='visible'&&Number(getComputedStyle(timedValue).opacity)>0),'Dead Waters countdown number is fully visible in the chronology header');
          await wait(150);deadWatersTick();
          ok(Number(timedValue.textContent)<initialTimedValue,'Dead Waters visible countdown advances');
          const saved=hydrateState(serializeState(state));
          ok(saved.deadWaters.active.cells.length===9&&saved.deadWaters.active.cells.filter(cell=>cell.kind==='tentacle').length===1,'active vortex survives hydration');
          timed.expiresAt=Date.now()-1;deadWatersTick();
          ok(!activeDeadWaters()&&state.history.find(row=>row.id===timed.rowId)?.deadWatersStatus==='expired','expired entry closes and remains in chronology');

          reset();
          let soundPlays=0,pauseCalls=0;
          const originalClone=sounds.deadWaters.cloneNode;
          const fakeAudio={preload:'',volume:0,currentTime:0,paused:true,loop:false,play(){this.paused=false;soundPlays++;return Promise.resolve();},pause(){this.paused=true;pauseCalls++;}};
          sounds.deadWaters.cloneNode=()=>fakeAudio;
          try{
            const active=spawn();
            ok(soundPlays===1&&activeDeadWatersSound===fakeAudio&&fakeAudio.loop,'looping event sound starts when chronology row appears');
            openDeadWaters(active.rowId);openDeadWaters(active.rowId);
            ok(soundPlays===1&&!fakeAudio.paused,'entering the vortex does not restart or stop its sound');
            ok(deadWatersBlocksCasting()&&$('castBtn').disabled,'casting is blocked during exploration');
            reveal(3);escapeDeadWaters();await waitForCommit();
            ok(fakeAudio.paused&&pauseCalls===1&&activeDeadWatersSound===null,'event sound stops when the vortex completes');
          }finally{stopDeadWatersSound();sounds.deadWaters.cloneNode=originalClone;}

          reset();
          active=spawn(grid(['trade','trash','fish','trade','trash','fish','trade','trash','tentacle']));openDeadWaters(active.rowId);
          const before={fish:state.fish.length,trade:state.tradeItems.length,trash:state.trash.length};
          revealDeadWatersCell(active.cells[0].id);
          let renderedCells=[...$('deadWatersGrid').children];
          ok(renderedCells.filter(cell=>cell.classList.contains('is-newly-opened')).length===1&&renderedCells[0].classList.contains('is-newly-opened')&&getComputedStyle(renderedCells[0]).animationName==='deadWatersReveal','first reveal animates only the first newly opened cell');
          revealDeadWatersCell(active.cells[1].id);renderedCells=[...$('deadWatersGrid').children];
          ok(!renderedCells[0].classList.contains('is-newly-opened')&&getComputedStyle(renderedCells[0]).animationName==='none'&&renderedCells[1].classList.contains('is-newly-opened')&&getComputedStyle(renderedCells[1]).animationName==='deadWatersReveal','second reveal does not replay the first cell animation');
          revealDeadWatersCell(active.cells[2].id);renderedCells=[...$('deadWatersGrid').children];
          ok(renderedCells.slice(0,2).every(cell=>!cell.classList.contains('is-newly-opened')&&getComputedStyle(cell).animationName==='none')&&renderedCells[2].classList.contains('is-newly-opened'),'third reveal animates only the third cell');
          ok(deadWatersCanLeave()&&!$('deadWatersLeaveBtn').disabled,'manual exit is enabled after three safe cells');
          ok(state.fish.length===before.fish&&state.tradeItems.length===before.trade&&state.trash.length===before.trash,'opened rewards remain staged before exit');
          revealDeadWatersCell(active.cells[3].id);
          ok(!deadWatersCanLeave()&&$('deadWatersLeaveBtn').disabled,'fourth cell closes the three-cell exit');
          revealDeadWatersCell(active.cells[4].id);
          ok(!deadWatersCanLeave(),'exit remains closed after five cells');
          revealDeadWatersCell(active.cells[5].id);
          ok(deadWatersCanLeave()&&!$('deadWatersLeaveBtn').disabled,'manual exit is enabled after six safe cells');
          escapeDeadWaters();await waitForCommit();
          ok(!activeDeadWaters()&&state.tradeItems.length===2&&state.trash.length===2&&state.fish.length===2,'six staged rewards commit on successful exit');

          reset();
          active=spawn(grid());const parentId=active.rowId;openDeadWaters(parentId);
          for(let i=0;i<8;i++){const current=activeDeadWaters();if(current)revealDeadWatersCell(current.cells[i].id);}
          await waitForCommit();
          const parent=state.history.find(row=>row.id===parentId);
          ok(!activeDeadWaters()&&parent.deadWatersStatus==='escaped'&&parent.deadWatersRewards.length===8,'eighth safe cell automatically closes the vortex with all rewards');
          ok(state.fish.length===2&&state.tradeItems.length===1&&state.trash.length===1&&state.bonuses.some(item=>item.name==='Ласты')&&state.debuffs.some(item=>item.name==='Рак')&&state.artifacts.some(item=>item.name==='Чешуя Левиафана')&&state.islands.items.some(item=>item.source===DEAD_WATERS_NAME),'all supported reward categories use standard mechanics');
          ok(state.fish.every(fish=>fish.source===DEAD_WATERS_NAME),'vortex fish preserve their acquisition source');
          ok(!state.dungeon.encounter,'vortex fish do not trigger cast-only dungeon events');
          renderHistory();
          const parentElement=document.querySelector(`[data-history-id="${parentId}"]`);
          const safeStatus=parentElement.querySelector('.chronology-row__title .dead-waters-history-status'),safeStatusStyle=getComputedStyle(safeStatus);
          ok(parentElement.querySelector('.dead-waters-history-icon img[src*="icons/events/dead-waters-vortex.webp"]'),'chronology uses the vortex image instead of an emoji placeholder');
          ok(parentElement.querySelector('.chronology-row__title-text').textContent.trim()===DEAD_WATERS_NAME&&safeStatus?.textContent.trim()==='Успешный выход','successful outcome is shown directly below the renamed collapsed-row title');
          ok(safeStatusStyle.backgroundColor==='rgba(0, 0, 0, 0)'&&safeStatusStyle.borderTopWidth==='0px'&&safeStatus.classList.contains('is-safe'),'successful outcome is plain green text without a backplate');
          ok(parentElement.querySelectorAll('.dead-waters-history-loot li').length===8,'all rewards are grouped under one chronology row');
          ok(parentElement.querySelector('[data-expedition-study]'),'expedition reward exposes the standard decode action');
          ok(state.history.filter(row=>row.mergedIntoHistoryId===parentId).length>=7,'generated reward rows are merged into the vortex row');

          reset();
          const chestCells=grid(['artifact','trade','trash','fish','trade','trash','fish','trade','tentacle']);
          chestCells[0]={id:uid(),kind:'artifact',tier:'epic',name:'Бездонный ларь',label:'Бездонный ларь',opened:false};
          active=spawn(chestCells);const chestParentId=active.rowId;openDeadWaters(chestParentId);reveal(3);Math.random=()=>.01;escapeDeadWaters();await waitForCommit();Math.random=()=>.42;renderHistory();
          const chestParent=state.history.find(row=>row.id===chestParentId),chestReward=chestParent.deadWatersRewards.find(item=>item.name==='Бездонный ларь'),chestSourceRow=state.history.find(row=>row.id===chestReward.generatedHistoryId),chestElement=document.querySelector(`[data-history-id="${chestParentId}"]`),nestedChestRows=chestElement.querySelectorAll('.dead-waters-nested-loot li');
          ok(chestReward.entityId&&chestSourceRow?.embeddedFishIds?.length>=1,'bottomless chest creates and links its standard contents');
          ok(nestedChestRows.length===deadWatersRewardContents(chestReward).length&&nestedChestRows.length>=1,'bottomless chest contents are visibly nested under the chest reward');
          ok(chestSourceRow.bottomlessExpeditionItemId&&chestElement.querySelector('.dead-waters-nested-loot [data-expedition-study]'),'bottomless chest expedition document keeps its standard decode action');

          reset();
          let tentacleSoundPlays=0;
          const originalTentacleClone=sounds.deadWatersTentacleAttack.cloneNode;
          sounds.deadWatersTentacleAttack.cloneNode=()=>({preload:'',volume:0,play(){tentacleSoundPlays++;return Promise.resolve();}});
          active=spawn(grid(['trade','tentacle','fish','trash','bonus','debuff','artifact','expedition','fish']));const deathRowId=active.rowId;openDeadWaters(deathRowId);
          revealDeadWatersCell(active.cells[0].id);
          ok(state.tradeItems.length===0&&tentacleSoundPlays===0,'safe find is still staged and does not play the tentacle attack');
          revealDeadWatersCell(active.cells[1].id);
          ok(activeDeadWaters()?.status==='tentacle'&&$('deadWatersDialog').open&&!state.finished&&tentacleSoundPlays===1,'tentacle remains revealed for its impact beat and plays its attack once');
          renderDeadWaters();renderDeadWaters();
          ok(tentacleSoundPlays===1,'tentacle attack does not replay during interface renders');
          sounds.deadWatersTentacleAttack.cloneNode=originalTentacleClone;
          ok($('deadWatersCard').classList.contains('is-tentacle-impact')&&document.querySelector('.dead-waters-cell.is-tentacle'),'tentacle impact and red vignette are visible');
          const tentacleCell=document.querySelector('.dead-waters-cell.is-tentacle'),tentacleLabel=tentacleCell.querySelector('.dead-waters-cell-label'),tentacleCellBox=tentacleCell.getBoundingClientRect(),tentacleLabelBox=tentacleLabel.getBoundingClientRect();
          ok(tentacleLabel.textContent.trim()==='Гигантское щупальце'&&tentacleLabel.scrollHeight<=tentacleLabel.clientHeight+1&&tentacleLabelBox.top>=tentacleCellBox.top&&tentacleLabelBox.bottom<=tentacleCellBox.bottom,'full tentacle label is visibly contained inside its cell');
          await wait(1050);
          const deathRow=state.history.find(row=>row.id===deathRowId);
          ok(state.finished&&state.castsLeft===0&&!activeDeadWaters(),'tentacle zeroes casts and immediately finishes the session');
          ok(state.tradeItems.length===0&&deathRow.deadWatersRewards.filter(item=>item.kind!=='tentacle').every(item=>item.lost),'tentacle discards every staged reward');
          ok(deathRow.deadWatersStatus==='dead','tentacle outcome remains visible in chronology');
          renderHistory();
          const failedStatus=document.querySelector(`[data-history-id="${deathRowId}"] .chronology-row__title .dead-waters-history-status`),failedStatusStyle=getComputedStyle(failedStatus);
          ok(failedStatus?.textContent.trim()==='Неуспешный выход'&&failedStatus.classList.contains('is-dead'),'failed outcome is shown directly below the collapsed-row title');
          ok(failedStatusStyle.backgroundColor==='rgba(0, 0, 0, 0)'&&failedStatusStyle.borderTopWidth==='0px','failed outcome is plain red text without a backplate');
          const lostRows=[...document.querySelectorAll(`[data-history-id="${deathRowId}"] .dead-waters-history-loot li.is-lost`)];
          const tentacleRow=document.querySelector(`[data-history-id="${deathRowId}"] .dead-waters-history-loot li.type-tentacle`);
          ok(lostRows.every(item=>getComputedStyle(item).textDecorationLine==='none'&&getComputedStyle(item).filter.includes('grayscale')),'lost rewards are gray without strikethrough');
          ok(tentacleRow&&!tentacleRow.classList.contains('is-lost')&&getComputedStyle(tentacleRow).animationName==='deadWatersDangerRow','tentacle stays colored with dangerous row animation');

          reset();
          active=spawn();const firstId=active.id;expireDeadWaters(active);active=spawn();
          ok(active.id!==firstId,'a later cast can open another vortex after the previous one resolves');
          return results;
        }finally{Math.random=nativeRandom;}
      });
      assert.equal(errors.length,0,errors.join('\n'));

      const normalized=[];
      for(const [label,width,height] of viewports){
        await page.setViewportSize({width,height});
        await page.evaluate(()=>{
          document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
          state=initialState();state.weather='storm';state.weatherSeen=['storm'];
          maybeSpawnDeadWatersAfterCast(true);render();
        });
        await page.waitForTimeout(120);
        const activeCountdown=await page.evaluate(()=>{
          const row=document.querySelector('.type-deadWaters.has-live-countdown'),status=row?.querySelector('.chronology-live-countdown'),timer=status?.querySelector('[data-dead-waters-time]'),result=status?.closest('.chronology-row__result'),title=row?.querySelector('.chronology-row__title'),titleText=title?.querySelector('.chronology-row__title-text');
          const timerBox=timer?.getBoundingClientRect(),resultBox=result?.getBoundingClientRect(),titleBox=title?.getBoundingClientRect(),titleRange=document.createRange();if(titleText)titleRange.selectNodeContents(titleText);const titleInk=titleText?titleRange.getBoundingClientRect():null;
          return {value:Number(timer?.textContent),timerVisible:Boolean(timerBox&&resultBox&&timerBox.width>0&&timerBox.left>=resultBox.left-1&&timerBox.right<=resultBox.right+1&&status.scrollWidth<=result.clientWidth+1),titleVisible:Boolean(titleBox&&titleInk&&titleInk.left>=titleBox.left-1&&titleInk.right<=titleBox.right+1&&titleInk.top>=titleBox.top-3&&titleInk.bottom<=titleBox.bottom+3),pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
        });
        await page.waitForTimeout(250);
        const laterCountdown=await page.evaluate(()=>Number(document.querySelector('.type-deadWaters [data-dead-waters-time]')?.textContent));
        assert(activeCountdown.timerVisible,`${engine} ${label}: Dead Waters countdown number is fully visible`);
        assert(activeCountdown.titleVisible,`${engine} ${label}: Dead Waters title remains fully visible beside its countdown`);
        assert(laterCountdown<activeCountdown.value,`${engine} ${label}: Dead Waters countdown visibly advances`);
        assert.equal(activeCountdown.pageOverflow,false,`${engine} ${label}: active Dead Waters row does not cause page overflow`);
        await page.locator('.type-deadWaters.has-live-countdown').screenshot({path:path.join(output,`${engine}-${label}-active-countdown.png`)});
        await page.evaluate(()=>{
          document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
          state=initialState();state.weather='storm';state.weatherSeen=['storm'];
          const make=(kind,index)=>{
            if(kind==='fish')return {id:uid(),kind,category:'giant',name:'озерный осетр',weight:31.4,label:'Озерный осетр — 31,4 кг',opened:index<4};
            if(kind==='trade'){const item=TRADE_ITEMS[0];return {id:uid(),kind,key:item.key,name:item.name,label:item.name,opened:index<4};}
            if(kind==='artifact')return {id:uid(),kind,tier:'epic',name:'Эссенция «Великан Океанов»',label:'Эссенция «Великан Океанов»',opened:index<4};
            if(kind==='tentacle')return {id:uid(),kind,name:'Гигантское щупальце',label:'Гигантское щупальце',opened:index<4};
            return {id:uid(),kind:'trash',name:'погнутый крючок',label:'Погнутый крючок',opened:false};
          };
          const kinds=['fish','trade','artifact','tentacle','trash','trash','trash','trash','trash'];
          maybeSpawnDeadWatersAfterCast(true,kinds.map(make));
          const active=activeDeadWaters();active.status='tentacle';active.openedOrder=active.cells.filter(cell=>cell.opened).map(cell=>cell.id);
          const row=deadWatersHistoryRow(active);row.deadWatersStatus='playing';
          renderDeadWaters();$('deadWatersDialog').showModal();fitDeadWatersStage();
        });
        await page.waitForTimeout(1100);
        await page.waitForFunction(()=>[...document.querySelectorAll('.dead-waters-cell img')].every(image=>image.complete&&image.naturalWidth>0));
        const geometry=await page.evaluate(()=>{
          const card=$('deadWatersCard').getBoundingClientRect(),scene=document.querySelector('.dead-waters-scene').getBoundingClientRect(),grid=$('deadWatersGrid').getBoundingClientRect(),cells=[...document.querySelectorAll('.dead-waters-cell')].map(cell=>cell.getBoundingClientRect()),icons=[...document.querySelectorAll('.dead-waters-cell.is-open .dead-waters-cell-icon')].map(icon=>icon.getBoundingClientRect()),closed=document.querySelector('.dead-waters-cell:not(.is-open)'),button=$('deadWatersLeaveBtn').getBoundingClientRect();
          const scale=card.width/720;
          const tentacleCell=document.querySelector('.dead-waters-cell.is-tentacle'),tentacleLabel=tentacleCell.querySelector('.dead-waters-cell-label'),tentacleCellBox=tentacleCell.getBoundingClientRect(),tentacleLabelBox=tentacleLabel.getBoundingClientRect(),labels=[...document.querySelectorAll('.dead-waters-cell-label')].map(label=>{const cell=label.closest('.dead-waters-cell').getBoundingClientRect(),box=label.getBoundingClientRect();return {text:label.textContent.trim(),contained:box.top>=cell.top&&box.bottom<=cell.bottom,unclipped:label.scrollHeight<=label.clientHeight+1};});
          return {
            scale,card:{left:card.left,top:card.top,width:card.width,height:card.height},scene:{width:scene.width,height:scene.height},
            grid:{x:(grid.left-card.left)/scale,y:(grid.top-card.top)/scale,width:grid.width/scale,height:grid.height/scale},
            cells:cells.map(cell=>({width:cell.width/scale,height:cell.height/scale})),icons:icons.map(icon=>({width:icon.width/scale,height:icon.height/scale})),
            centered:Math.abs(card.left+card.width/2-innerWidth/2)<1&&Math.abs(card.top+card.height/2-innerHeight/2)<1,
            contained:card.left>=-1&&card.top>=-1&&card.right<=innerWidth+1&&card.bottom<=innerHeight+1,
            overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1,
            background:getComputedStyle(document.querySelector('.dead-waters-scene')).backgroundImage,
            question:getComputedStyle(closed,'::after').content,
            tentacle:!!document.querySelector('.dead-waters-cell.is-tentacle img[src*="giant-tentacle.webp"]'),tentacleLabel:{text:tentacleLabel.textContent.trim(),contained:tentacleLabelBox.top>=tentacleCellBox.top&&tentacleLabelBox.bottom<=tentacleCellBox.bottom,unclipped:tentacleLabel.scrollHeight<=tentacleLabel.clientHeight+1},labels,dangerClass:$('deadWatersCard').classList.contains('is-tentacle-impact'),dangerOpacity:Number(getComputedStyle(document.querySelector('.dead-waters-danger-overlay')).opacity),
            cellCount:cells.length,openCount:document.querySelectorAll('.dead-waters-cell.is-open').length,
            leaveHeight:button.height/scale
          };
        });
        assert.equal(geometry.cellCount,9,`${engine} ${label}: nine cells`);
        assert.equal(geometry.openCount,4,`${engine} ${label}: reveal state`);
        assert.equal(geometry.centered,true,`${engine} ${label}: centered letterbox`);
        assert.equal(geometry.contained,true,`${engine} ${label}: scene contained`);
        assert.equal(geometry.overflow,false,`${engine} ${label}: no page overflow`);
        assert(geometry.background.includes('dead-waters-vortex.webp'),`${engine} ${label}: background asset`);
        assert.equal(geometry.question,'"?"',`${engine} ${label}: CSS-drawn closed cell`);
        assert.equal(geometry.tentacle,true,`${engine} ${label}: tentacle asset`);
        assert.deepEqual(geometry.tentacleLabel,{text:'Гигантское щупальце',contained:true,unclipped:true},`${engine} ${label}: full tentacle label is visible`);
        assert(geometry.labels.every(item=>item.contained&&item.unclipped)&&geometry.labels.some(item=>item.text==='Эссенция «Великан Океанов»'),`${engine} ${label}: every opened reward label is fully visible`);
        assert.equal(geometry.dangerClass,true,`${engine} ${label}: danger vignette state`);
        assert(geometry.dangerOpacity>.8,`${engine} ${label}: red danger vignette visible`);
        assert(Math.abs(geometry.scene.width/geometry.scale-720)<1&&Math.abs(geometry.scene.height/geometry.scale-1280)<1,`${engine} ${label}: fixed scene coordinates`);
        assert(Math.abs(geometry.grid.x-75)<1&&Math.abs(geometry.grid.y-350)<1&&Math.abs(geometry.grid.width-570)<1&&Math.abs(geometry.grid.height-570)<1,`${engine} ${label}: fixed grid coordinates`);
        assert(geometry.cells.every(cell=>Math.abs(cell.width-170)<1&&Math.abs(cell.height-170)<1),`${engine} ${label}: square fixed cells ${JSON.stringify(geometry.cells)}`);
        assert(geometry.icons.length===4&&geometry.icons.every(icon=>Math.abs(icon.width-geometry.icons[0].width)<1&&Math.abs(icon.height-geometry.icons[0].height)<1),`${engine} ${label}: all revealed cell icons use one size`);
        assert(geometry.leaveHeight<=63,`${engine} ${label}: compact action height`);
        normalized.push({label,grid:geometry.grid,cells:geometry.cells});
        await page.screenshot({path:path.join(output,`${engine}-${label}.png`)});
        await page.evaluate(()=>{
          const active=activeDeadWaters(),row=deadWatersHistoryRow(active);
          row.deadWatersRewards=deadWatersOpenedCells(active).map(item=>({...item,lost:item.kind!=='tentacle'}));
          row.deadWatersStatus='dead';row.detail='(Гигантское щупальце завершило сессию • найденные награды потеряны)';
          stopDeadWatersSound();deadWatersState().active=null;$('deadWatersDialog').close();$('deadWatersCard').classList.remove('is-tentacle-impact');renderHistory();setHistoryRowExpanded(row.id,true);
        });
        await page.waitForFunction(()=>[...document.querySelectorAll('.dead-waters-history-icon img,.dead-waters-history-loot img')].every(image=>image.complete&&image.naturalWidth>0));
        const historyAppearance=await page.evaluate(()=>{
          const row=document.querySelector('.history-item.type-deadWaters'),lost=[...row.querySelectorAll('.dead-waters-history-loot li.is-lost')],tentacle=row.querySelector('.dead-waters-history-loot li.type-tentacle'),status=row.querySelector('.chronology-row__title .dead-waters-history-status'),statusStyle=getComputedStyle(status),loot=[...row.querySelectorAll('.dead-waters-history-loot>li')].map(item=>{const style=getComputedStyle(item),box=item.getBoundingClientRect();return {height:box.height,border:style.borderTopWidth,background:style.backgroundColor,shadow:style.boxShadow};});
          return {overflow:row.scrollWidth>row.clientWidth+1,icon:!!row.querySelector('.dead-waters-history-icon img[src*="icons/events/dead-waters-vortex.webp"]'),title:row.querySelector('.chronology-row__title-text').textContent.trim(),status:{text:status.textContent.trim(),parent:status.parentElement.className,color:statusStyle.color,border:statusStyle.borderTopWidth,background:statusStyle.backgroundColor},loot,lost:lost.map(item=>({decoration:getComputedStyle(item).textDecorationLine,filter:getComputedStyle(item).filter,color:getComputedStyle(item).color})),tentacle:{lost:tentacle.classList.contains('is-lost'),filter:getComputedStyle(tentacle).filter,animation:getComputedStyle(tentacle).animationName}};
        });
        assert.equal(historyAppearance.overflow,false,`${engine} ${label}: chronology row does not overflow`);
        assert.equal(historyAppearance.icon,true,`${engine} ${label}: chronology vortex image`);
        assert.equal(historyAppearance.title,'Пучина мёртвых вод',`${engine} ${label}: renamed chronology title`);
        assert(historyAppearance.status.text==='Неуспешный выход'&&historyAppearance.status.parent.includes('chronology-row__title')&&historyAppearance.status.border==='0px'&&historyAppearance.status.background==='rgba(0, 0, 0, 0)'&&historyAppearance.status.color==='rgb(255, 111, 125)',`${engine} ${label}: plain red failed outcome under title`);
        assert(historyAppearance.loot.every(item=>item.border==='0px'&&item.background==='rgba(0, 0, 0, 0)'&&item.shadow==='none'&&item.height<=48),`${engine} ${label}: expanded loot still uses card backplates or excess height ${JSON.stringify(historyAppearance.loot)}`);
        assert(historyAppearance.lost.every(item=>item.decoration==='none'&&item.filter.includes('grayscale')),`${engine} ${label}: chronology losses are gray without strikethrough`);
        assert.equal(historyAppearance.tentacle.lost,false,`${engine} ${label}: chronology tentacle remains colored`);
        assert.equal(historyAppearance.tentacle.animation,'deadWatersDangerRow',`${engine} ${label}: chronology tentacle danger animation`);
        await page.locator('.history-item.type-deadWaters').screenshot({path:path.join(output,`${engine}-${label}-history.png`)});
        await page.evaluate(()=>{
          state=initialState();state.weather='sunny';state.weatherSeen=['sunny'];
          const trade=TRADE_ITEMS[0],cells=[
            {id:uid(),kind:'artifact',tier:'epic',name:'Бездонный ларь',label:'Бездонный ларь',opened:false},
            {id:uid(),kind:'trade',key:trade.key,name:trade.name,label:trade.name,opened:false},
            {id:uid(),kind:'trash',name:'погнутый крючок',label:'Погнутый крючок',opened:false},
            ...Array.from({length:5},()=>({id:uid(),kind:'fish',category:'normal',name:'плотва',weight:2.4,label:'Плотва — 2,4 кг',opened:false})),
            {id:uid(),kind:'tentacle',name:'Гигантское щупальце',label:'Гигантское щупальце',opened:false}
          ];
          maybeSpawnDeadWatersAfterCast(true,cells);const active=activeDeadWaters();window.__deadWatersChestRowId=active.rowId;openDeadWaters(active.rowId);for(let index=0;index<3;index++)revealDeadWatersCell(active.cells[index].id);escapeDeadWaters();
        });
        await page.waitForFunction(()=>!activeDeadWaters());
        await page.waitForFunction(()=>[...document.querySelectorAll('.dead-waters-nested-loot img')].every(image=>image.complete&&image.naturalWidth>0));
        const chestAppearance=await page.evaluate(()=>{
          const row=document.querySelector(`[data-history-id="${window.__deadWatersChestRowId}"]`),chest=row.querySelector('.dead-waters-history-loot>li.has-contents'),nested=[...row.querySelectorAll('.dead-waters-nested-loot li')];
          return {overflow:row.scrollWidth>row.clientWidth+1,chest:chest?.querySelector('.dead-waters-loot-main')?.textContent.trim(),title:getComputedStyle(chest.querySelector('.dead-waters-nested-loot'),'::before').content,nested:nested.map(item=>item.textContent.trim())};
        });
        assert.equal(chestAppearance.overflow,false,`${engine} ${label}: bottomless chest row does not overflow`);
        assert.equal(chestAppearance.chest,'Бездонный ларь',`${engine} ${label}: bottomless chest parent is visible`);
        assert.equal(chestAppearance.title,'"Содержимое ларя"',`${engine} ${label}: bottomless chest contents heading`);
        assert(chestAppearance.nested.length>=1&&chestAppearance.nested.every(text=>text.length>0),`${engine} ${label}: bottomless chest contents are visibly listed`);
        await page.locator(`[data-history-id="${await page.evaluate(()=>window.__deadWatersChestRowId)}"]`).screenshot({path:path.join(output,`${engine}-${label}-bottomless-chest.png`)});
      }
      const baseline=normalized[0].grid;
      assert(normalized.every(item=>['x','y','width','height'].every(key=>Math.abs(item.grid[key]-baseline[key])<1)),`${engine}: normalized grid geometry is stable`);
      console.log(`${engine}: ${checks.length} mechanics checks, ${viewports.length} visual sizes PASS`);
    }finally{await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
