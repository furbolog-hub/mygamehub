const path=require('path');
const fs=require('fs');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const target=pathToFileURL(path.resolve(__dirname,'../dropfish/index.html')).href;
const output=path.resolve(__dirname,'../.visual-test-output/active-effects');
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const formatKg=value=>`${Number(value).toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1})} кг`;

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        await page.goto(target,{waitUntil:'load'});
        await page.waitForTimeout(150);
        const result=await page.evaluate(()=>{
          state=initialState();
          state.islands.flares=1;
          state.artifacts.push({id:uid(),name:'Око Шторма',tier:'mythic',traded:false,used:false});
          state.dungeon.rewards.push({id:uid(),key:'singula',name:'Пульсирующая сингула',used:false,activated:true});
          state.dungeon.rewards.push({id:uid(),key:'pearl',name:'Жемчужина осквернённого сердца',used:false,bonusArtifacts:0,bonusAngus:0});
          const fish=makeFish('normal','Заброс',true,{initialWeight:.1,fishName:'контрольная рыба'});
          const singulaAfter=fish.singulaImpact?.after;
          state.rifts.temporaryEffects.push({id:uid(),name:'Багровый осколок: следующая рыба +15%',type:'weight',casts:1,value:1.15});
          render();
          const chips=[...document.querySelectorAll('#effectsList .chip')];
          const flare=chips.find(x=>x.textContent.includes('Руническая сигнальная ракета'));
          const eye=chips.find(x=>x.textContent.includes('Око Шторма'));
          const crimson=chips.find(x=>x.textContent.includes('Багровый осколок'));
          const pearl=chips.find(x=>x.textContent.includes('Жемчужина осквернённого сердца'));
          const singulaImpact=document.querySelector('.singula-weight-impact');
          const cleanSingula=singulaImpact?.querySelector('.dungeon-icon');
          const cleanStyle=cleanSingula?getComputedStyle(cleanSingula):null;
          const filters=[...document.querySelectorAll('.chronology-filter')];
          return {
            fishWeight:singulaAfter,
            singulaText:singulaImpact?.textContent||'',
            singulaBackground:cleanStyle?.backgroundImage||'',
            singulaBackgroundColor:cleanStyle?.backgroundColor||'',
            flareOverflow:flare?flare.scrollWidth-flare.clientWidth:999,
            flareIconOverflow:flare?.querySelector('.island-loot-icon')?.scrollWidth-flare?.querySelector('.island-loot-icon')?.clientWidth,
            eyeText:eye?.textContent.trim()||'',
            crimsonIcon:crimson?.querySelector('img')?.getAttribute('src')||'',
            pearlText:pearl?.querySelector('.effect-chip-copy')?.textContent.trim()||'',
            pearlOverflow:pearl?pearl.scrollWidth-pearl.clientWidth:999,
            invalidChipStructure:chips.filter(chip=>chip.querySelectorAll(':scope > .effect-chip-main').length!==1||chip.querySelectorAll(':scope > .effect-chip-main > .effect-chip-copy').length!==1||!chip.querySelector(':scope > .effect-chip-main > .is-effect-icon')).map(chip=>chip.textContent.trim()),
            chipOverflows:chips.flatMap(chip=>{const outer=chip.getBoundingClientRect(),main=chip.querySelector(':scope > .effect-chip-main')?.getBoundingClientRect();return main&&(main.left<outer.left-1||main.right>outer.right+1||main.top<outer.top-1||main.bottom>outer.bottom+1)?[{text:chip.querySelector('.effect-chip-copy')?.textContent.trim(),outer:{width:outer.width,height:outer.height},main:{width:main.width,height:main.height}}]:[];}),
            heartIcon:riftRelicIcon('Сердце бездны','is-effect-icon'),
            rareLoot:riftLootText({kind:'fish',rarity:'rare'}),
            filterCount:filters.length,
            filterIconCount:filters.reduce((count,filter)=>count+filter.querySelectorAll('img').length,0),
            filterMaxHeight:Math.max(0,...filters.map(filter=>filter.getBoundingClientRect().height)),
            filterRailHeight:document.getElementById('historyFilters').getBoundingClientRect().height,
            pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          };
        });
        const prefix=`${engineName}/${viewportName}`;
        assert(result.fishWeight===.2&&/0,1 кг.*1,3.*0,2 кг/.test(result.singulaText),`${prefix}: Singula did not visibly increase 0.1 kg (${JSON.stringify(result)})`);
        assert(result.singulaBackground==='none'&&result.singulaBackgroundColor==='rgba(0, 0, 0, 0)',`${prefix}: Singula icon still has a backplate`);
        assert(result.flareOverflow<=1&&result.flareIconOverflow<=1,`${prefix}: flare is clipped (${JSON.stringify(result)})`);
        assert(result.eyeText==='Око Шторма',`${prefix}: Storm Eye contains leftover action copy`);
        assert(result.pearlText==='Жемчужина осквернённого сердца'&&result.pearlOverflow<=1,`${prefix}: corrupted pearl contains duplicate status or overflows (${JSON.stringify(result)})`);
        assert(!result.invalidChipStructure.length,`${prefix}: active effects do not share icon/title structure (${JSON.stringify(result.invalidChipStructure)})`);
        assert(!result.chipOverflows.length,`${prefix}: active effect content overflows (${JSON.stringify(result.chipOverflows)})`);
        assert(result.crimsonIcon.endsWith('/crimson-shard.webp')&&!result.heartIcon.includes('crimson-shard.webp'),`${prefix}: Crimson Shard and Abyss Heart icons are not distinct`);
        assert(!result.rareLoot.includes('/fish-categories/rift.webp'),`${prefix}: rift-origin icon remains inside rift loot`);
        assert(result.filterCount===5&&result.filterIconCount===0&&result.filterMaxHeight<=30.5&&result.filterRailHeight<=44.5,`${prefix}: chronology filters regained tiny icons or increased their row height ${JSON.stringify(result)}`);
        assert(result.pageOverflow<=1,`${prefix}: page overflowed by ${result.pageOverflow}px`);
        await page.locator('.inventory').screenshot({path:path.join(output,`${engineName}-${viewportName}.png`)});

        const riftLoot=await page.evaluate(()=>{
          state=initialState();window.__riftLootRandom=Math.random;Math.random=()=>.5;
          makeRift('leviathan',true);
          const rift=state.rifts.active;rift.status='inside';rift.depth=3;
          addRiftLoot(riftFishReward('heavy',1,{weightMultiplier:2}),riftFishReward('legendary'),riftReward('relic',1,{name:'Печать Левиафана'}),riftReward('relic',1,{name:'Ядро DF1'}));
          renderRift();window.__riftLootHistoryRowId=rift.historyRowId;
          const previews=rift.loot.filter(item=>item.kind==='fish').flatMap(item=>materializeRiftFishLoot(item));
          const fish=[...document.querySelectorAll('#riftLoot .rift-loot-fish')],panel=document.querySelector('#riftLoot');
          return {
            previews,
            fishCount:fish.length,
            speciesIcons:fish.filter(item=>item.querySelector('.base-fish-icon,.rift-fish-icon,.island-fish-icon,.deep-fish-icon')).length,
            categoryBadges:panel.querySelectorAll('.fish-category-icon').length,
            fishText:fish.map(item=>item.textContent.replace(/\s+/g,' ').trim()),
            panelText:panel.textContent.replace(/\s+/g,' ').trim(),
            overflow:panel.scrollWidth-panel.clientWidth
          };
        });
        assert(riftLoot.fishCount===2&&riftLoot.speciesIcons===2,`${prefix}: concrete fish icons are missing inside the Rift ${JSON.stringify(riftLoot)}`);
        assert(riftLoot.categoryBadges===0&&!/\bрыба\b/i.test(riftLoot.panelText),`${prefix}: category/legendary placeholder remains inside the Rift ${JSON.stringify(riftLoot)}`);
        assert(riftLoot.previews.every((fish,index)=>riftLoot.fishText[index]===formatKg(fish.weight)&&!riftLoot.panelText.includes(fish.name)),`${prefix}: Rift fish must show only its icon and weight ${JSON.stringify(riftLoot)}`);
        assert(riftLoot.overflow<=1,`${prefix}: Rift loot overflowed by ${riftLoot.overflow}px`);
        await page.locator('#riftDialog').screenshot({path:path.join(output,`${engineName}-${viewportName}-leviathan-loot.png`)});

        await page.evaluate(()=>{
          exitRift();
          state.historyUi.expandedIds=[];
          render();
          Math.random=window.__riftLootRandom;
        });
        await page.waitForTimeout(80);
        const closedRiftHistory=await page.evaluate(()=>{
          const row=document.querySelector(`[data-history-id="${window.__riftLootHistoryRowId}"]`);
          return {
            expanded:row.classList.contains('is-expanded'),
            parentOriginBadge:row.querySelector(':scope > .history-row-head .chronology-row__badge')?.dataset.badgeKey||'',
            summaryMarkerCount:row.querySelectorAll(':scope > .history-row-head .chronology-row__icon').length,
            height:row.querySelector('.chronology-row__summary')?.getBoundingClientRect().height||0
          };
        });
        assert(!closedRiftHistory.expanded&&closedRiftHistory.parentOriginBadge==='origin-rift'&&closedRiftHistory.summaryMarkerCount===0&&closedRiftHistory.height<=76,`${prefix}: closed Rift row must keep only the compact service origin badge ${JSON.stringify(closedRiftHistory)}`);
        await page.evaluate(()=>{
          state.historyUi.expandedIds=[window.__riftLootHistoryRowId];
          render();
        });
        await page.waitForTimeout(80);
        const riftHistory=await page.evaluate(()=>{
          const row=document.querySelector(`[data-history-id="${window.__riftLootHistoryRowId}"]`),fish=[...row.querySelectorAll('.embedded-fish-item')],seal=[...row.querySelectorAll('.rift-loot-result-item.type-relic.has-purpose')].find(item=>item.textContent.includes('Печать Левиафана')),df1=[...row.querySelectorAll('.rift-loot-result-item.type-relic.has-purpose')].find(item=>item.textContent.includes('Ядро DF1')),purpose=seal?.querySelector('.rift-relic-purpose'),name=seal?.querySelector('.rift-relic-copy strong'),style=seal?getComputedStyle(seal):null,purposeBox=purpose?.getBoundingClientRect(),nameBox=name?.getBoundingClientRect();
          return {
            expanded:row.classList.contains('is-expanded'),
            parentOriginBadge:row.querySelector(':scope > .history-row-head .chronology-row__badge')?.dataset.badgeKey||'',
            summaryMarkerCount:row.querySelectorAll(':scope > .history-row-head .chronology-row__icon').length,
            embeddedOriginIconCount:fish.reduce((count,item)=>count+item.querySelectorAll('img[src$="/fish-categories/rift.webp"], img[src$="/chronology-badges/origin-rift.webp"]').length,0),
            fishCount:fish.length,
            fishTitles:fish.map(item=>item.querySelector('.embedded-fish-title')?.textContent.replace(/\s+/g,' ').trim()||''),
            speciesIcons:fish.filter(item=>item.querySelector('.base-fish-icon,.rift-fish-icon,.island-fish-icon,.deep-fish-icon')).length,
            heavyweightBadge:row.querySelector('.base-fish-category-badge img')?.getAttribute('src')||'',
            weightBadgeGeometry:(()=>{const wrapper=row.querySelector('.embedded-fish-name > .base-fish-category-badge'),icon=wrapper?.querySelector('.fish-category-icon'),wrapperBox=wrapper?.getBoundingClientRect(),iconBox=icon?.getBoundingClientRect();return wrapperBox&&iconBox?{wrapper:{left:wrapperBox.left,top:wrapperBox.top,right:wrapperBox.right,bottom:wrapperBox.bottom,width:wrapperBox.width,height:wrapperBox.height},icon:{left:iconBox.left,top:iconBox.top,right:iconBox.right,bottom:iconBox.bottom,width:iconBox.width,height:iconBox.height}}:null;})(),
            legendaryBadge:row.querySelector('.rift-fish-badges img[src$="legendary.webp"]')?.getAttribute('src')||'',
            purpose:purpose?.textContent.replace(/\s+/g,' ').trim()||'',
            df1Purpose:df1?.querySelector('.rift-relic-purpose')?.textContent.replace(/\s+/g,' ').trim()||'',
            purposeUnderName:Boolean(purposeBox&&nameBox&&purposeBox.top>=nameBox.bottom-1),
            flat:Boolean(style&&style.borderTopWidth==='0px'&&style.backgroundColor==='rgba(0, 0, 0, 0)'&&style.boxShadow==='none'),
            detailOverflow:(()=>{const details=row.querySelector('.history-row-details');return details?details.scrollWidth-details.clientWidth:0;})(),
            pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
          };
        });
        assert(riftHistory.expanded&&riftHistory.fishCount===2&&riftHistory.speciesIcons===2,`${prefix}: Rift fish did not transfer into expanded chronology ${JSON.stringify(riftHistory)}`);
        assert(riftHistory.parentOriginBadge==='origin-rift'&&riftHistory.summaryMarkerCount===0&&riftHistory.embeddedOriginIconCount===0,`${prefix}: Rift origin must remain once on the parent row without a left mini-marker or per-fish duplicates ${JSON.stringify(riftHistory)}`);
        assert(riftLoot.previews.every(preview=>{const displayName=preview.name.charAt(0).toUpperCase()+preview.name.slice(1),originalWeight=Number.isFinite(preview.baseWeight)?preview.baseWeight:preview.weight;return riftHistory.fishTitles.some(title=>title.includes(displayName)&&title.includes(formatKg(originalWeight)));}),`${prefix}: chronology fish identity/original weight differs from Rift loot ${JSON.stringify({riftLoot,riftHistory})}`);
        assert(riftHistory.heavyweightBadge.endsWith('/fish-weight-categories/heavyweight.webp')&&riftHistory.legendaryBadge.endsWith('/fish-categories/legendary.webp'),`${prefix}: post-Rift category or Legendary badge is missing ${JSON.stringify(riftHistory)}`);
        assert(riftHistory.weightBadgeGeometry&&Math.abs(riftHistory.weightBadgeGeometry.wrapper.width-34)<=1&&Math.abs(riftHistory.weightBadgeGeometry.wrapper.height-34)<=1&&Math.abs(riftHistory.weightBadgeGeometry.icon.width-34)<=1&&Math.abs(riftHistory.weightBadgeGeometry.icon.height-34)<=1&&riftHistory.weightBadgeGeometry.icon.left>=riftHistory.weightBadgeGeometry.wrapper.left-1&&riftHistory.weightBadgeGeometry.icon.top>=riftHistory.weightBadgeGeometry.wrapper.top-1&&riftHistory.weightBadgeGeometry.icon.right<=riftHistory.weightBadgeGeometry.wrapper.right+1&&riftHistory.weightBadgeGeometry.icon.bottom<=riftHistory.weightBadgeGeometry.wrapper.bottom+1,`${prefix}: Rift weight icon is clipped or does not use the shared 34px slot ${JSON.stringify(riftHistory.weightBadgeGeometry)}`);
        assert(riftHistory.purpose.includes('увеличивает вес выбранного тяжеловеса на 25–40%')&&riftHistory.purpose.includes('опасное событие')&&riftHistory.purposeUnderName&&riftHistory.flat,`${prefix}: Leviathan Seal explanation is missing, misplaced, or uses a backplate ${JSON.stringify(riftHistory)}`);
        assert(riftHistory.df1Purpose.includes('показывает основной результат следующего заброса')&&riftHistory.df1Purpose.includes('зафиксировать или уничтожить'),`${prefix}: DF1 explanation is missing from expanded Rift history ${JSON.stringify(riftHistory)}`);
        assert(riftHistory.detailOverflow<=1&&riftHistory.pageOverflow<=1,`${prefix}: expanded Rift history overflowed ${JSON.stringify(riftHistory)}`);
        await page.locator('.history-item.type-rift.is-expanded').last().screenshot({path:path.join(output,`${engineName}-${viewportName}-leviathan-history.png`)});
        await page.close();
      }
    }finally{await browser.close();}
  }
  process.stdout.write('PASS: rift UI regressions across Chromium and WebKit\n');
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
