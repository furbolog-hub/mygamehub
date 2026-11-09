const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','requested-regressions');
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        await page.goto(target,{waitUntil:'load'});
        await page.evaluate(()=>{
          state=initialState();
          state.artifacts.push({id:uid(),name:'Чешуя Левиафана',tier:'epic',traded:false});
          state.leviathanStep=0;
          makeFish('normal','Заброс',true,{initialWeight:4.2,fishName:'Заброс обычная'});
          makeFish('heavy','Заброс',true,{initialWeight:12,fishName:'Заброс тяжеловес'});
          makeFish('giant','Заброс',true,{initialWeight:24,fishName:'Заброс гигант'});
          makeFish('normal','Аркадный улов',false,{initialWeight:4.2,fishName:'Аркада обычная',arcadeCatch:true});
          makeFish('heavy','Аркадный улов',false,{initialWeight:12,fishName:'Аркада тяжеловес',arcadeCatch:true});
          makeFish('giant','Аркадный улов',false,{initialWeight:24,fishName:'Аркада гигант',arcadeCatch:true});
          const stolenFish=makeFish('heavy','Заброс',true,{initialWeight:14.8,fishName:'Украденная чайкой рыба'});
          stolenFish.removed=true;state.stolen.push(stolenFish);setFishHistoryStolen(stolenFish,true);
          const eatenFish=makeFish('giant','Заброс',true,{initialWeight:27.4,fishName:'Съеденная косаткой рыба'});
          eatenFish.removed=true;state.eaten.push(eatenFish);setFishHistoryEaten(eatenFish,true);
          addHistory('Сфера течений: +30 кг к итоговому весу','flowSphere','',{numbered:false});
          addHistory('Игровая сессия завершена','event','',{numbered:false});
          const flippersRow=addHistory('Ласты','bonus','',{numbered:false});
          const nonFish={id:uid(),name:'Гигантский кальмар',weight:31.6,originalWeight:31.6,impacts:[]};
          state.nonFishCatches.push(nonFish);
          const nonFishRow=addHistory(nonFish.name,'nonFishCatch','',{numbered:false,nonFishCatchId:nonFish.id});
          const riftFish=makeFish('heavy','Нестабильный разлом',false,{initialWeight:18.7,fishName:'Золотая рыбка'});
          riftFish.riftFish=true;riftFish.rarity='heavy';
          const dedicatedRiftFish=makeFish('heavy','Нестабильный разлом',false,{initialWeight:49.2,fishName:'Сингулярный тунец'});
          dedicatedRiftFish.riftFish=true;dedicatedRiftFish.rarity='epic';
          const islandFish=makeFish('giant','Заброс',false,{initialWeight:126.3,fishName:'Островной гигант'});
          islandFish.islandColossus=true;islandFish.rarity='common';
          const replaced=makeFish('normal','Заброс',true,{initialWeight:3.8,fishName:'Заменённая рыба'});
          replaced.removed=true;replaced.crystalReplaced=true;
          const replacedRow=state.history.find(row=>row.fishId===replaced.id);replacedRow.crystalReplaced=true;
          const angusRow=addHistory('Старина Ангус поделился уловом','angus','(Добавлена рыба)',{numbered:false});
          const angusFish=makeFish('giant','Старина Ангус',false,{initialWeight:39.6,fishName:'Сом Ангуса',parentHistoryId:angusRow.id});
          angusFish.tags=[];delete angusFish.leviathanImpact;
          const symbioteRow=addHistory('Открыт Нестабильный разлом','rift','',{numbered:false});
          const symbioteFish=makeFish('normal','Нестабильный разлом',false,{initialWeight:52,fishName:'Штормовой целакант',parentHistoryId:symbioteRow.id});
          symbioteFish.category='heavy';symbioteFish.originalWeight=52;symbioteFish.weight=12.2;symbioteFish.abyssTransformed=true;
          symbioteFish.tags=['Симбиот: normal → heavy'];delete symbioteFish.leviathanImpact;
          symbioteFish.abyssImpacts=[{source:'Симбиот',type:'category',before:52,after:12.2,beforeCategory:'normal',afterCategory:'heavy'}];
          window.__requestedRows={angus:angusRow.id,symbiote:symbioteRow.id,flippers:flippersRow.id,nonFish:nonFishRow.id};
          const cache={id:'visual-island-cache',kind:'cache',opened:false,items:[ISLAND_CACHE_TRADE_ITEMS[0],ISLAND_CACHE_TRADE_ITEMS[1]]};
          const cacheRow=addHistory('Экспедиция завершена: Остров Разрушительных Приливов','island','',{numbered:false,islandCompletion:true});
          cacheRow.islandLootResults=[cache];
          state.dungeon.encounter={id:uid(),dungeonType:'cradle',phase:'piranhas',historyRowId:null,castsUsed:0};
          render();
        });
        await page.waitForTimeout(100);
        const main=await page.evaluate(()=>{
          const chip=document.querySelector('.dungeon-encounter-effect');
          const fishRows=[...document.querySelectorAll('.history-item.type-fish')];
          const angusRow=document.querySelector(`[data-history-id="${window.__requestedRows.angus}"]`);
          const symbioteRow=document.querySelector(`[data-history-id="${window.__requestedRows.symbiote}"]`);
          const symbioteImpact=symbioteRow?.querySelector('.abyss-fish-impact');
          return {
            chipOverflow:chip?chip.scrollWidth-chip.clientWidth:0,
            chipText:chip?.querySelector('.effect-chip-copy')?.textContent.trim(),
            inlineStatuses:document.querySelectorAll('.history-item.type-fish .fish-inline-status').length,
            sourceIcons:Object.fromEntries(fishRows.map(row=>[row.querySelector('.chronology-row__title-text')?.textContent||'',row.querySelector('.chronology-row__badge img')?.getAttribute('src')||''])),
            leadingIcons:Object.fromEntries(fishRows.map(row=>[row.querySelector('.chronology-row__title-text')?.textContent||'',[...row.querySelectorAll('.chronology-row__icon img')].map(img=>img.getAttribute('src')||'')])),
            weightCategoryIcons:Object.fromEntries(fishRows.map(row=>[row.querySelector('.chronology-row__title-text')?.textContent||'',row.querySelector('.chronology-row__result .chronology-weight-category-icon')?.getAttribute('src')||''])),
            fishTextGaps:Object.fromEntries(fishRows.map(row=>{const lead=row.querySelector('.chronology-row__icon'),copy=row.querySelector('.chronology-row__title');return [row.querySelector('.chronology-row__title-text')?.textContent||'',lead&&copy?copy.getBoundingClientRect().left-lead.getBoundingClientRect().right:null];})),
            replacedIcons:document.querySelectorAll('.chronology-row__icon .fish-crystal-replaced-main-icon').length,
            angusCategoryIcon:angusRow?.querySelector('.embedded-fish-attribute .fish-size-marker img')?.getAttribute('src')||'',
            symbioteNegative:symbioteImpact?.classList.contains('abyss-impact-negative')||false,
            symbioteResultColor:symbioteImpact?getComputedStyle(symbioteImpact.querySelector('.gear-result')).color:'',
            leakedCategoryKeys:/\b(?:normal|heavy|giant)\b/i.test(document.querySelector('#historyList')?.textContent||''),
            horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            fishRows:fishRows.length,
            flowSphere:(()=>{const row=[...document.querySelectorAll('.chronology-row')].find(item=>item.querySelector('.chronology-row__title-text')?.textContent.includes('Сфера течений'));return{icon:row?.querySelector('.chronology-row__icon img')?.getAttribute('src')||'',badge:row?.querySelector('.chronology-row__badge img')?.getAttribute('src')||'',art:row?.querySelectorAll('.chronology-row__art').length||0};})(),
            sessionFinished:(()=>{const marker=[...document.querySelectorAll('[data-history-id]')].find(item=>item.textContent.includes('Игровая сессия завершена'));return{marker:Boolean(marker?.classList.contains('chronology-session-complete')),row:Boolean(marker?.classList.contains('chronology-row')),images:marker?.querySelectorAll('img').length??-1};})(),
            lostRows:[...document.querySelectorAll('.chronology-row:is(.is-stolen,.is-eaten)')].map(row=>{const style=getComputedStyle(row);return{title:row.querySelector('.chronology-row__title-text')?.textContent||'',background:style.backgroundImage,shadow:style.boxShadow,borderLeft:style.borderLeftColor,borderRight:style.borderRightColor};}),
            wideArtRows:Object.fromEntries(['flippers','nonFish'].map(key=>{const row=document.querySelector(`[data-history-id="${window.__requestedRows[key]}"]`),summary=row?.querySelector('.chronology-row__summary'),art=row?.querySelector('.chronology-row__art'),image=art?.querySelector('img'),badge=row?.querySelector('.chronology-row__badge img'),result=row?.querySelector('.chronology-row__result'),summaryBox=summary?.getBoundingClientRect(),artBox=art?.getBoundingClientRect();return[key,{source:image?.getAttribute('src')||'',summary:[summaryBox?.width||0,summaryBox?.height||0],art:[artBox?.width||0,artBox?.height||0],mask:image?(getComputedStyle(image).webkitMaskImage||getComputedStyle(image).maskImage):'none',titleShadow:row?getComputedStyle(row.querySelector('.chronology-row__title')).textShadow:'none',resultText:result?.textContent.trim()||'',resultShadow:result?getComputedStyle(result).textShadow:'none',badgeFilter:badge?getComputedStyle(badge).filter:'none'}];})),
          };
        });
        assert(main.chipOverflow<=1,`${engineName}/${viewportName}: piranha chip overflowed by ${main.chipOverflow}px`);
        assert(main.chipText==='Пираньи Колыбели Левиафана',`${engineName}/${viewportName}: piranha chip has extra copy: ${JSON.stringify(main.chipText)}`);
        assert(main.inlineStatuses===0,`${engineName}/${viewportName}: legacy post-title source icons are duplicated (${main.inlineStatuses} found)`);
        const iconFor=name=>Object.entries(main.sourceIcons).find(([title])=>title.includes(name))?.[1]||'';
        for(const name of ['Заброс обычная','Заброс тяжеловес','Заброс гигант'])assert(iconFor(name).endsWith('/origin-cast.webp'),`${engineName}/${viewportName}: ${name} lost the shared cast-origin badge`);
        for(const [name,file] of [['Заброс тяжеловес','heavyweight.webp'],['Заброс гигант','giant.webp']]){
          const categoryIcon=main.weightCategoryIcons[Object.keys(main.weightCategoryIcons).find(title=>title.includes(name))]||'';
          assert(categoryIcon.endsWith(`/fish-weight-categories/${file}`),`${engineName}/${viewportName}: ${name} lost its post-weight category icon`);
        }
        for(const name of ['Аркада обычная','Аркада тяжеловес','Аркада гигант'])assert(iconFor(name).endsWith('/origin-arcade.webp'),`${engineName}/${viewportName}: ${name} does not use the shared arcade-origin badge`);
        assert(main.flowSphere.icon.endsWith('/assets/icons/chronology/flow-sphere.webp'),`${engineName}/${viewportName}: flow-sphere row does not use the supplied project icon (${main.flowSphere.icon})`);
        assert(main.flowSphere.badge.endsWith('/origin-arcade.webp'),`${engineName}/${viewportName}: flow-sphere row does not use the shared arcade-origin badge (${main.flowSphere.badge})`);
        assert(main.flowSphere.art===0,`${engineName}/${viewportName}: flow-sphere row still uses compact artwork`);
        assert(main.sessionFinished.marker&&!main.sessionFinished.row&&main.sessionFinished.images===0,`${engineName}/${viewportName}: session completion is not the icon-free compact caption (${JSON.stringify(main.sessionFinished)})`);
        assert(main.lostRows.length===2,`${engineName}/${viewportName}: stolen/eaten visual fixtures are missing (${main.lostRows.length})`);
        for(const row of main.lostRows){
          assert((row.background.match(/linear-gradient/g)||[]).length>=3,`${engineName}/${viewportName}: ${row.title} has no asymmetric red edge glow (${row.background})`);
          assert(row.shadow.includes('inset')&&/rgba?\(255,\s*(?:5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])/.test(row.shadow),`${engineName}/${viewportName}: ${row.title} has no soft red inset shadow (${row.shadow})`);
          assert(row.borderLeft!==row.borderRight,`${engineName}/${viewportName}: ${row.title} does not emphasize the left edge`);
        }
        const flippersArt=main.wideArtRows.flippers,weightedArt=main.wideArtRows.nonFish;
        assert(flippersArt.source.endsWith('/assets/chronology-row-art/flippers.webp'),`${engineName}/${viewportName}: flippers did not receive their exact wide artwork (${flippersArt.source})`);
        assert(weightedArt.source.endsWith('/assets/chronology-row-art/octopus.webp'),`${engineName}/${viewportName}: weighted non-fish row did not receive its exact wide artwork (${weightedArt.source})`);
        for(const [name,row] of Object.entries(main.wideArtRows)){
          assert(Math.abs(row.summary[0]-row.art[0])<=1&&Math.abs(row.summary[1]-row.art[1])<=1,`${engineName}/${viewportName}: ${name} artwork is not a full-row layer (${JSON.stringify(row)})`);
          assert(row.mask!=='none'&&row.mask.includes('gradient'),`${engineName}/${viewportName}: ${name} wide artwork has no left feathering (${row.mask})`);
          assert(/(?:rgba\(0,\s*0,\s*0,\s*0\)|transparent)\s+100%/.test(row.mask),`${engineName}/${viewportName}: ${name} wide artwork does not dissolve at the right edge (${row.mask})`);
          assert(row.titleShadow!=='none'&&row.badgeFilter!=='none',`${engineName}/${viewportName}: ${name} title or attribute icon lost contrast protection`);
        }
        assert(weightedArt.resultText.includes('31,6 кг')&&weightedArt.resultShadow!=='none',`${engineName}/${viewportName}: weighted row result is unreadable or missing (${JSON.stringify(weightedArt)})`);
        assert(iconFor('Золотая рыбка').endsWith('/origin-rift.webp'),`${engineName}/${viewportName}: rift reward lost the shared rift-origin badge`);
        const ordinaryRiftCategory=main.weightCategoryIcons[Object.keys(main.weightCategoryIcons).find(title=>title.includes('Золотая рыбка'))]||'';
        assert(ordinaryRiftCategory.endsWith('/fish-weight-categories/heavyweight.webp'),`${engineName}/${viewportName}: ordinary heavyweight rewarded by a rift lost its post-weight category icon`);
        for(const [name,originFile] of [['Сингулярный тунец','origin-rift.webp'],['Островной гигант','origin-expedition.webp']]){
          assert(iconFor(name).endsWith(`/${originFile}`),`${engineName}/${viewportName}: ${name} lost its shared acquisition-origin badge`);
          const categoryFiles=main.leadingIcons[Object.keys(main.leadingIcons).find(title=>title.includes(name))]||[];
          assert(!categoryFiles.some(src=>/(?:normal|heavyweight|giant)\.webp$/.test(src)),`${engineName}/${viewportName}: ${name} incorrectly uses an ordinary weight-category icon`);
          const gap=main.fishTextGaps[Object.keys(main.fishTextGaps).find(title=>title.includes(name))];
          assert(gap===null||gap>=0,`${engineName}/${viewportName}: ${name} category visual overlaps its title by ${-gap}px`);
        }
        const closedCache=await page.evaluate(()=>{const button=document.querySelector('[data-island-cache="visual-island-cache"]');return{buttonHeight:button?.getBoundingClientRect().height||0,contents:document.querySelectorAll('.island-cache-contents>li').length,tradeItems:state.tradeItems.filter(item=>item.islandCacheId==='visual-island-cache').length};});
        assert(closedCache.buttonHeight>0&&closedCache.buttonHeight<=30,`${engineName}/${viewportName}: island cache action is not compact (${closedCache.buttonHeight}px)`);
        assert(closedCache.contents===0&&closedCache.tradeItems===0,`${engineName}/${viewportName}: closed island cache revealed or granted contents early (${JSON.stringify(closedCache)})`);
        await page.evaluate(()=>document.querySelector('[data-island-cache="visual-island-cache"]')?.click());
        const openedCache=await page.evaluate(()=>({contents:document.querySelectorAll('.island-cache-contents>li').length,tradeItems:state.tradeItems.filter(item=>item.islandCacheId==='visual-island-cache').length,buttons:document.querySelectorAll('[data-island-cache="visual-island-cache"]').length,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
        assert(openedCache.contents===2&&openedCache.tradeItems===2&&openedCache.buttons===0,`${engineName}/${viewportName}: island cache did not reveal and grant each item exactly once`);
        assert(openedCache.overflow<=1,`${engineName}/${viewportName}: opened island cache caused ${openedCache.overflow}px horizontal overflow`);
        assert(main.replacedIcons===1,`${engineName}/${viewportName}: crystal replacement did not replace the main fish icon`);
        assert(main.angusCategoryIcon.endsWith('/fish-weight-categories/giant.webp'),`${engineName}/${viewportName}: Angus giant fish category icon is missing or wrong (${main.angusCategoryIcon})`);
        assert(main.symbioteNegative,`${engineName}/${viewportName}: Symbiote weight loss is not marked as negative`);
        const symbioteRgb=main.symbioteResultColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        assert(symbioteRgb&&Number(symbioteRgb[1])>=240&&Number(symbioteRgb[2])<=120&&Number(symbioteRgb[3])<=130,`${engineName}/${viewportName}: Symbiote reduced weight is not red (${main.symbioteResultColor})`);
        assert(!main.leakedCategoryKeys,`${engineName}/${viewportName}: internal fish category key leaked into history`);
        assert(main.horizontalOverflow<=1,`${engineName}/${viewportName}: main page overflowed horizontally`);
        await page.locator('.chronology-row.is-stolen').screenshot({path:path.join(output,`${engineName}-${viewportName}-stolen-glow.png`)});renders++;
        await page.locator('.chronology-row.is-eaten').screenshot({path:path.join(output,`${engineName}-${viewportName}-eaten-glow.png`)});renders++;
        await page.locator(`[data-history-id="${await page.evaluate(()=>window.__requestedRows.flippers)}"]`).screenshot({path:path.join(output,`${engineName}-${viewportName}-flippers-wide-art.png`)});renders++;
        await page.locator(`[data-history-id="${await page.evaluate(()=>window.__requestedRows.nonFish)}"]`).screenshot({path:path.join(output,`${engineName}-${viewportName}-weighted-wide-art.png`)});renders++;
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-history.png`),fullPage:true});renders++;

        await page.evaluate(()=>{state.rifts.active=null;makeRift('df1',true);});
        await page.waitForTimeout(80);
        const buttons=await page.evaluate(()=>{
          const leave=document.querySelector('#riftLeaveBtn'),next=document.querySelector('#riftContinueBtn');
          const a=getComputedStyle(leave),b=getComputedStyle(next),card=document.querySelector('.rift-card').getBoundingClientRect();
          return {leaveHeight:leave.getBoundingClientRect().height,nextHeight:next.getBoundingClientRect().height,leaveRadius:a.borderRadius,nextRadius:b.borderRadius,leaveBackground:a.backgroundImage,nextBackground:b.backgroundImage,card:{left:card.left,top:card.top,right:card.right,bottom:card.bottom}};
        });
        assert(Math.abs(buttons.leaveHeight-buttons.nextHeight)<=1,`${engineName}/${viewportName}: rift action heights differ`);
        assert(buttons.leaveRadius===buttons.nextRadius,`${engineName}/${viewportName}: rift action radii differ`);
        assert(buttons.leaveBackground!=='none'&&buttons.nextBackground!=='none',`${engineName}/${viewportName}: translucent button backgrounds missing`);
        assert(buttons.card.left>=-1&&buttons.card.top>=-1&&buttons.card.right<=viewport.width+1&&buttons.card.bottom<=viewport.height+1,`${engineName}/${viewportName}: rift card clipped`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}-rift.png`)});renders++;
        await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,engines:Object.keys(engines),viewports},null,2));
  process.stdout.write(`PASS: ${renders} requested-regression renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
