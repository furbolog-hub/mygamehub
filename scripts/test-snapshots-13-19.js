const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','snapshots-13-19');
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
async function screenshotLocatorRegion(page,locator,file){
  await locator.evaluate(element=>element.scrollIntoView({block:'center',inline:'nearest'}));
  assert(await locator.count(),`Screenshot target is missing: ${file}`);
  await page.screenshot({path:file,animations:'disabled'});
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        await page.goto(target,{waitUntil:'load'});
        await page.evaluate(()=>{
          state=initialState();

          const islandRow=addHistory('Экспедиция завершена: Остров Разрушительных Приливов','island','',{numbered:false,islandCompletion:true});
          const eaten=makeFish('giant','Островная экспедиция',false,{initialWeight:184.6,fishName:'Древний Абиссалор',parentHistoryId:islandRow.id});
          Object.assign(eaten,{islandColossus:true,rarity:'rare',removed:true});state.eaten.push(eaten);
          const unstable=makeFish('giant','Островная экспедиция',false,{initialWeight:222.4,fishName:'Первородный Абиссалор',parentHistoryId:islandRow.id});
          Object.assign(unstable,{islandColossus:true,rarity:'exceptional'});
          islandRow.islandLootResults=[
            {id:uid(),kind:'trade',...ISLAND_TRADE_ITEMS[0]},
            {id:uid(),kind:'mask',name:'Церемониальная маска'},
            {id:uid(),kind:'cache',opened:true,items:[ISLAND_CACHE_TRADE_ITEMS[0]]}
          ];

          const mainEaten=makeFish('heavy','Заброс',true,{initialWeight:14.7,fishName:'Краснопёрый тунец'});
          mainEaten.removed=true;state.eaten.push(mainEaten);
          const mainEatenRow=state.history.find(row=>row.fishId===mainEaten.id);mainEatenRow.eaten=true;

          const maskRow=addHistory('Подводная маска','bonus','',{numbered:true});
          const contaminatedRow=addHistory('Воздействие радиоактивных образцов','event','',{numbered:false,radioactiveImpact:true});
          const definition=TRADE_ITEMS[0];
          state.tradeItems.push({id:uid(),key:definition.key,name:definition.name,historyRowId:contaminatedRow.id,exchanged:true,radioactiveCorrupted:true,abyssChange:{kind:'transform',source:'Радиоактивные образцы',toName:'размокшее полено',toIcon:'🔘',toType:'trash'}});

          const tradeRow=addHistory('Торговое судно прибыло','tradeShip','',{numbered:false,tradeShipSource:'standard'});
          state.tradeShipHistoryId=tradeRow.id;state.tradeShipArrived=true;state.tradeShipCompleted=false;state.tradeShipSource='standard';
          state.tradeExchanges.push({id:uid(),itemId:uid(),itemKey:definition.key,itemName:definition.name,fishId:unstable.id,fishName:'Длиннопёрый океанический тунец',category:'giant',weight:36.8,tradeShipHistoryId:tradeRow.id});
          state.tradeShipOffers=[definition.key];
          state.tradeItems.push({id:uid(),key:definition.key,name:definition.name,icon:definition.icon,exchanged:false});
          state.artifacts.push({id:uid(),name:'Нить Сифонофоры',tier:'mythic',used:false,traded:false});

          const dungeonRow=addHistory('Пираньи Колыбели Левиафана','dungeon','',{numbered:false,dungeonAction:'sacrifice',dungeonType:'cradle'});
          state.dungeon.encounter={id:uid(),dungeonType:'cradle',phase:'piranhas',historyRowId:dungeonRow.id,castsUsed:0};

          startRadioactiveOutbreak();
          state.historyUi.expandedIds=[islandRow.id,contaminatedRow.id,tradeRow.id];
          window.__rows={island:islandRow.id,mask:maskRow.id,trade:tradeRow.id,contaminated:contaminatedRow.id,dungeon:dungeonRow.id};
          render();
        });
        await page.waitForFunction(()=>[...document.querySelectorAll('.fish-effect-badge img,.radioactive-impact-icon img')].every(img=>img.complete&&img.naturalWidth));

        const chronology=await page.evaluate(()=>{
          const island=document.querySelector(`[data-history-id="${window.__rows.island}"]`);
          const mainEaten=document.querySelector('.history-item.type-fish.is-orca-eaten');
          const contaminated=document.querySelector(`[data-history-id="${window.__rows.contaminated}"]`);
          const trade=document.querySelector(`[data-history-id="${window.__rows.trade}"]`);
          const mask=document.querySelector(`[data-history-id="${window.__rows.mask}"]`);
          const summary=island.querySelector('.chronology-row__summary').getBoundingClientRect();
          const details=island.querySelector('.history-row-details').getBoundingClientRect();
          const eatenEmbedded=island.querySelector('.embedded-fish-item.is-orca-eaten');
          const flat=[...island.querySelectorAll('.embedded-fish-item,.island-history-loot-item,.island-cache-contents>li')].every(node=>{const s=getComputedStyle(node);return s.backgroundColor==='rgba(0, 0, 0, 0)'&&parseFloat(s.borderTopWidth)===0;});
          return {
            overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            gap:details.top-summary.bottom,
            flat,
            eatenMainIcon:!!eatenEmbedded?.querySelector('.fish-eaten-main-icon'),
            duplicateEatenIcon:!!island.querySelector('img[src*="eaten-by-orca"]'),
            eatenLabel:eatenEmbedded?.querySelector('.orca-eaten-label')?.textContent.trim(),
            eatenDecoration:getComputedStyle(eatenEmbedded.querySelector('.embedded-fish-title')).textDecorationLine,
            eatenColor:getComputedStyle(eatenEmbedded.querySelector('.embedded-fish-title')).color,
            mainEatenColor:getComputedStyle(mainEaten.querySelector('.chronology-row__result')).color,
            unstableIcon:island.querySelector('.fish-effect-badge img[src$="unstable-presence.webp"]')?.getAttribute('src')||'',
            unstableBox:(()=>{const box=island.querySelector('.fish-effect-badge.is-unstable-presence')?.getBoundingClientRect();return box?{width:box.width,height:box.height}:null;})(),
            exchangeLabels:[...island.querySelectorAll('.island-loot-purpose-copy small,.island-cache-contents small')].map(node=>node.textContent.trim()),
            maskCopy:mask.textContent,
            radioactiveText:contaminated.textContent,
            radioactiveSource:contaminated.querySelector('.radioactive-impact-icon img')?.getAttribute('src')||'',
            radioactiveOverflow:contaminated.scrollWidth-contaminated.clientWidth,
            tradeOverflow:trade.scrollWidth-trade.clientWidth,
          };
        });
        assert(chronology.overflow<=1,`${engineName}/${viewportName}: page horizontal overflow ${chronology.overflow}px`);
        assert(chronology.gap>=-1&&chronology.gap<=8,`${engineName}/${viewportName}: island disclosure gap ${chronology.gap}px`);
        assert(chronology.flat,`${engineName}/${viewportName}: island disclosure still has colored backplates or borders`);
        assert(chronology.eatenMainIcon&&!chronology.duplicateEatenIcon&&chronology.eatenLabel==='Съедена Косаткой',`${engineName}/${viewportName}: orca terminal state is duplicated or missing`);
        assert(chronology.eatenDecoration==='none'&&chronology.eatenColor===chronology.mainEatenColor,`${engineName}/${viewportName}: eaten fish name/weight treatment differs`);
        assert(chronology.unstableIcon.endsWith('/fish-status/unstable-presence.webp')&&chronology.unstableBox.width<=32&&chronology.unstableBox.height<=32,`${engineName}/${viewportName}: unstable-presence asset is missing or oversized`);
        assert(chronology.exchangeLabels.filter(label=>label==='Предмет обмена').length===3,`${engineName}/${viewportName}: island exchange subtitles missing ${JSON.stringify(chronology.exchangeLabels)}`);
        assert(!/финальн/i.test(chronology.maskCopy),`${engineName}/${viewportName}: redundant mask final-weight line remains`);
        assert(!/[☢🔘]/.test(chronology.radioactiveText)&&chronology.radioactiveSource.endsWith('/icons/chronology/radioactive.webp'),`${engineName}/${viewportName}: radioactive placeholder remains`);
        assert(chronology.radioactiveOverflow<=1&&chronology.tradeOverflow<=1,`${engineName}/${viewportName}: expanded chronology content clipped`);

        const counters=await page.evaluate(()=>{
          const row=state.history.find(item=>item.id===window.__rows.dungeon);
          const inspect=()=>{
            const rowElement=document.querySelector(`[data-history-id="${row.id}"]`),countdown=rowElement?.querySelector('.dungeon-inline-countdown'),actions=rowElement?.querySelector('.history-row-actions');
            const rowBox=rowElement?.getBoundingClientRect(),countdownBox=countdown?.getBoundingClientRect(),actionsBox=actions?.getBoundingClientRect(),style=countdown?getComputedStyle(countdown):null;
            const visible=Boolean(countdownBox&&countdownBox.width>0&&countdownBox.height>0&&style?.display!=='none'&&style?.visibility!=='hidden'&&Number(style?.opacity||1)>0&&countdownBox.left>=rowBox.left-1&&countdownBox.right<=rowBox.right+1);
            const separated=!actionsBox||actionsBox.width===0||countdownBox.right<=actionsBox.left+1||actionsBox.right<=countdownBox.left+1;
            return {text:countdown?.textContent.trim()||'',visible,separated,countdownBox:countdownBox?{left:countdownBox.left,right:countdownBox.right}:null,actionsBox:actionsBox?{left:actionsBox.left,right:actionsBox.right,width:actionsBox.width}:null,metaWidth:rowElement?.style.getPropertyValue('--chronology-inline-meta-width')||''};
          };
          const p0=inspect();state.dungeon.encounter.castsUsed=1;render();const p1=inspect();
          state.dungeon.encounter.phase='trail';row.dungeonAction='dive';render();const trail=inspect();
          const timer=document.querySelector('.is-radioactive-prompt [data-radioactive-time]');const t0=timer?.textContent;radioactiveTick(700);const t1=timer?.textContent;
          return {p0,p1,trail,t0,t1};
        });
        assert(counters.p0.text==='3 забр.'&&counters.p1.text==='2 забр.'&&counters.trail.text==='2 забр.',`${engineName}/${viewportName}: dynamic dungeon counters failed ${JSON.stringify(counters)}`);
        assert([counters.p0,counters.p1,counters.trail].every(counter=>counter.visible&&counter.separated),`${engineName}/${viewportName}: dungeon counter is hidden or covered by its action ${JSON.stringify(counters)}`);
        assert(Number(counters.t0)>Number(counters.t1)&&Number(counters.t1)>=0,`${engineName}/${viewportName}: radioactive timer is not live ${JSON.stringify(counters)}`);
        await page.evaluate(()=>{const row=state.history.find(item=>item.id===window.__rows.dungeon),config=dungeonType(state.dungeon.encounter);state.dungeon.encounter.phase='piranhas';state.dungeon.encounter.castsUsed=1;row.text=config.piranhas;row.dungeonAction='sacrifice';render();});
        const dungeonRow=page.locator(`[data-history-id="${await page.evaluate(()=>window.__rows.dungeon)}"]`);
        await screenshotLocatorRegion(page,dungeonRow,path.join(output,`${engineName}-${viewportName}-piranha-counter.png`));
        await page.evaluate(()=>{const row=state.history.find(item=>item.id===window.__rows.dungeon),config=dungeonType(state.dungeon.encounter);state.dungeon.encounter.phase='trail';row.text=config.trail;row.dungeonAction='dive';render();});
        await screenshotLocatorRegion(page,dungeonRow,path.join(output,`${engineName}-${viewportName}-trail-counter.png`));
        await page.evaluate(()=>document.querySelector(`[data-history-id="${window.__rows.island}"]`)?.scrollIntoView({block:'center'}));
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-history.png`),fullPage:true});

        await page.evaluate(()=>{renderTradeDialog();$('tradeDialog').showModal();});
        const modal=await page.evaluate(()=>{
          const dialog=$('tradeDialog'),card=dialog.querySelector('.trade-card'),offer=dialog.querySelector('.trade-mythic-offer'),button=offer?.querySelector('button');
          const box=card.getBoundingClientRect(),buttonBox=button?.getBoundingClientRect(),offerBox=offer?.getBoundingClientRect();
          return {card:{left:box.left,top:box.top,right:box.right,bottom:box.bottom},buttonInside:buttonBox&&offerBox&&buttonBox.left>=offerBox.left-1&&buttonBox.right<=offerBox.right+1&&buttonBox.top>=offerBox.top-1&&buttonBox.bottom<=offerBox.bottom+1,horizontal:card.scrollWidth-card.clientWidth,thread:offer?.textContent||''};
        });
        assert(modal.card.left>=-1&&modal.card.top>=-1&&modal.card.right<=viewport.width+1&&modal.card.bottom<=viewport.height+1,`${engineName}/${viewportName}: trade dialog clipped`);
        assert(modal.buttonInside&&modal.horizontal<=1&&modal.thread.includes('Нить Сифонофоры'),`${engineName}/${viewportName}: trade offer content clipped`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-trade.png`)});
        await page.close();
      }
      process.stdout.write(`${engineName}: snapshots 13-19 PASS\n`);
    }finally{await browser.close();}
  }
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
