const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;
const output=path.join(root,'artifacts','trade-history-visuals');
const viewports={
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1280,height:900}
};

async function installFixture(page){
  await page.evaluate(()=>{
    state=initialState();
    state.historyUi={expandedIds:[],filter:'all',introducedKeys:[],initialized:true,compactVersion:5};
    state.castsLeft=1;

    const octopus={id:uid(),name:'Осьминог',weight:18.4,originalWeight:18.4,impacts:[]};
    state.nonFishCatches.push(octopus);
    addHistory(octopus.name,'nonFishCatch','',{numbered:false,nonFishCatchId:octopus.id});
    makeFish('heavy','Заброс',true,{initialWeight:12.7,fishName:'Северный тунец'});
    addHistory('Открыт Багровый разлом: Сердце бездны','rift','',{numbered:false,riftType:'crimson'});

    const tradeRow=addHistory('Торговое судно прибыло','tradeShip','',{numbered:false,tradeShipSource:'standard'});
    state.tradeShipHistoryId=tradeRow.id;
    state.tradeShipArrived=true;
    state.tradeShipChecked=true;
    state.tradeShipCompleted=false;
    state.tradeShipSource='standard';
    const exchangeFixtures=[
      ['sunkenAmber','Янтарь затонувших берегов','Бурый групер',13.1],
      ['glimmerCoral','Коралл мерцающих глубин','Королевская макрель',13.5],
      ['blackShellShard','Осколок чёрной раковины','Жёлтохвост',10.9],
      ['seaSerpentFang','Клык морского змея','Обыкновенный зубан',12.2]
    ];
    let firstFish=null;
    exchangeFixtures.forEach(([itemKey,itemName,fishName,weight])=>{
      const fish={id:uid(),name:fishName.toLocaleLowerCase('ru-RU'),category:'heavy',originalWeight:weight,weight,source:'Торговое судно',direct:false,tradeFish:true,removed:false,tags:[]};
      state.fish.push(fish);if(!firstFish)firstFish=fish;
      state.tradeExchanges.push({id:uid(),itemId:uid(),itemKey,itemName,fishId:fish.id,fishName:fish.name,category:fish.category,weight:fish.weight,tradeShipHistoryId:tradeRow.id});
    });
    render();
    window.__tradeVisualFixture={tradeRowId:tradeRow.id,fishId:firstFish.id};
  });
}

function rgbaAlpha(value){
  const match=String(value||'').match(/rgba?\([^)]*(?:,|\s)([\d.]+)\)$/);
  return value==='transparent'?0:match&&value.startsWith('rgba')?Number(match[1]):1;
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const report={passed:true,viewports,engines:{}};
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    report.engines[engineName]={};
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(pageUrl,{waitUntil:'load'});
        await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
        await installFixture(page);
        await page.waitForTimeout(80);

        const closed=await page.evaluate(()=>{
          const rows=[...document.querySelectorAll('.chronology-row:not(.is-expanded)')];
          const titleSizes=rows.map(row=>Number.parseFloat(getComputedStyle(row.querySelector('.chronology-row__title-text')).fontSize));
          const trade=document.querySelector(`[data-history-id="${window.__tradeVisualFixture.tradeRowId}"]`);
          const boxes={};
          for(const [key,selector] of Object.entries({row:'.history-row-head',title:'.chronology-row__title',badge:'.chronology-row__badge',action:'.trade-open-btn'})){
            const box=trade.querySelector(selector)?.getBoundingClientRect();
            boxes[key]=box?{left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height}:null;
          }
          const action=trade.querySelector('.trade-open-btn');
          return {titleSizes,boxes,actionOverflow:action?action.scrollWidth-action.clientWidth:null};
        });
        const sizeSpread=Math.max(...closed.titleSizes)-Math.min(...closed.titleSizes);
        assert(sizeSpread<=.1,`${engineName}/${viewportName}: closed chronology title sizes differ by ${sizeSpread}px (${closed.titleSizes.join(', ')})`);
        assert(closed.boxes.badge&&closed.boxes.action&&closed.boxes.title,`${engineName}/${viewportName}: trade row slots are missing`);
        assert(closed.boxes.badge.left>=closed.boxes.action.right-1,`${engineName}/${viewportName}: trade badge is not to the right of the trade action ${JSON.stringify(closed.boxes)}`);
        assert(closed.boxes.action.left>=closed.boxes.title.left-1&&closed.boxes.action.right<=closed.boxes.row.right+1,`${engineName}/${viewportName}: trade action escaped the row ${JSON.stringify(closed.boxes)}`);
        assert(closed.actionOverflow<=1,`${engineName}/${viewportName}: trade action label is clipped by ${closed.actionOverflow}px`);
        if(viewportName==='phonePortrait')await page.locator('#historyList').screenshot({path:path.join(output,`${engineName}-closed-history.png`),animations:'disabled'});

        await page.locator(`[data-history-id="${await page.evaluate(()=>window.__tradeVisualFixture.tradeRowId)}"] [data-history-toggle]`).click();
        const expanded=await page.evaluate(()=>{
          const trade=document.querySelector(`[data-history-id="${window.__tradeVisualFixture.tradeRowId}"]`),item=trade.querySelector('.trade-history-results > li'),sourceIcon=item?.querySelector('.trade-history-source > .trade-item-icon'),fishIcon=item?.querySelector('.base-fish-icon.is-trade-icon'),category=item?.querySelector('.base-fish-category-badge'),categoryImage=category?.querySelector('.fish-category-icon'),source=item?.querySelector('.trade-history-source'),copy=item?.querySelector('.trade-history-fish-copy'),badge=trade.querySelector('.chronology-row__badge'),head=trade.querySelector('.history-row-head'),details=trade.querySelector('.history-row-details');
          const box=node=>{const value=node?.getBoundingClientRect();return value?{left:value.left,right:value.right,top:value.top,bottom:value.bottom,width:value.width,height:value.height}:null;};
          const items=[...trade.querySelectorAll('.trade-history-results > li')];
          const sourceIconWidths=items.map(entry=>entry.querySelector('.trade-history-source > .trade-item-icon')?.getBoundingClientRect().width??null);
          const fishIconWidths=items.map(entry=>entry.querySelector('.base-fish-icon.is-trade-icon')?.getBoundingClientRect().width??null);
          return {item:box(item),itemCount:items.length,maxItemHeight:Math.max(...items.map(entry=>entry.getBoundingClientRect().height)),sourceIconWidths,fishIconWidths,allSourceIcons:sourceIconWidths.every(width=>width===42),allFishIcons:fishIconWidths.every(width=>width===42),sourceIcon:box(sourceIcon),fishIcon:box(fishIcon),category:box(category),categoryImage:box(categoryImage),sourceFont:source?Number.parseFloat(getComputedStyle(source).fontSize):0,copyFont:copy?Number.parseFloat(getComputedStyle(copy).fontSize):0,titleFont:Number.parseFloat(getComputedStyle(trade.querySelector('.chronology-row__title-text')).fontSize),badge:box(badge),head:box(head),detailOverflow:details?details.scrollWidth-details.clientWidth:999,pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
        });
        assert(expanded.badge&&expanded.head&&expanded.badge.left>=expanded.head.right-72,`${engineName}/${viewportName}: expanded trade badge left the shared right attribute lane ${JSON.stringify(expanded)}`);
        assert(expanded.sourceIcon?.width===42&&expanded.sourceIcon?.height===42&&expanded.fishIcon?.width===42&&expanded.fishIcon?.height===42,`${engineName}/${viewportName}: expanded exchange icons do not share the 42px fish slot ${JSON.stringify(expanded)}`);
        assert(expanded.category?.width===42&&expanded.category?.height===42&&expanded.categoryImage?.width===68&&expanded.categoryImage?.height===68,`${engineName}/${viewportName}: trade weight category does not use the shared optical crop ${JSON.stringify(expanded)}`);
        assert(expanded.category.left>=expanded.fishIcon.right-1&&Math.abs((expanded.category.left+expanded.category.right-expanded.categoryImage.left-expanded.categoryImage.right)/2)<=1,`${engineName}/${viewportName}: trade fish and weight-category slots overlap or are off-center ${JSON.stringify(expanded)}`);
        assert(Math.abs(expanded.sourceFont-expanded.titleFont)<=.1&&Math.abs(expanded.copyFont-expanded.titleFont)<=.1,`${engineName}/${viewportName}: expanded trade typography differs from closed chronology rows ${JSON.stringify(expanded)}`);
        assert(expanded.itemCount===4&&expanded.allSourceIcons&&expanded.allFishIcons&&expanded.maxItemHeight<=58&&expanded.detailOverflow<=1&&expanded.pageOverflow<=1,`${engineName}/${viewportName}: expanded exchange rows are not uniformly compact or overflow ${JSON.stringify(expanded)}`);
        if(viewportName==='phonePortrait')await page.locator(`[data-history-id="${await page.evaluate(()=>window.__tradeVisualFixture.tradeRowId)}"]`).screenshot({path:path.join(output,`${engineName}-expanded-history.png`),animations:'disabled'});

        await page.evaluate(()=>{renderTradeDialog();document.getElementById('tradeDialog').showModal();});
        await page.waitForTimeout(40);
        const dialog=await page.evaluate(()=>{
          const row=document.querySelector('#tradeDialog .trade-results li');
          const fish=row?.querySelector('.base-fish-icon.is-trade-icon')?.getBoundingClientRect();
          const category=row?.querySelector('.base-fish-category-badge')?.getBoundingClientRect();
          const copy=row?.querySelector('.trade-history-fish-copy')?.getBoundingClientRect();
          const rowBox=row?.getBoundingClientRect();
          const center=box=>box?(box.top+box.bottom)/2:null;
          return {fishCenter:center(fish),categoryCenter:center(category),copyCenter:center(copy),row:rowBox?{top:rowBox.top,bottom:rowBox.bottom}:null};
        });
        assert(dialog.row&&dialog.fishCenter!==null&&dialog.categoryCenter!==null&&dialog.copyCenter!==null,`${engineName}/${viewportName}: trade result geometry is incomplete ${JSON.stringify(dialog)}`);
        assert(Math.abs(dialog.fishCenter-dialog.categoryCenter)<=1&&Math.abs(dialog.fishCenter-dialog.copyCenter)<=2,`${engineName}/${viewportName}: trade fish/category/text are not aligned ${JSON.stringify(dialog)}`);
        if(viewportName==='phonePortrait')await page.locator('#tradeDialog .trade-card').screenshot({path:path.join(output,`${engineName}-trade-dialog.png`),animations:'disabled'});

        await page.evaluate(()=>{document.getElementById('tradeDialog').close();completeTradeShip();});
        await page.waitForTimeout(60);
        const completionId=await page.evaluate(()=>state.history.find(row=>/Торговля с судном завершена/i.test(row.text||''))?.id||'');
        const completion=page.locator(`[data-history-id="${completionId}"]`);
        assert(await completion.locator('[data-history-toggle][aria-expanded="false"]').count(),`${engineName}/${viewportName}: completed trade has no closed disclosure control`);
        assert(await completion.locator('.chronology-row__chevron').count(),`${engineName}/${viewportName}: completed trade has no chevron`);
        await completion.locator('[data-history-toggle]').click();
        const details=await completion.evaluate(row=>{
          const items=[...row.querySelectorAll('.trade-completion-fish-list > li')];
          return {
            count:items.length,
            badgeDetail:row.querySelectorAll('.chronology-row__badge-detail').length,
            items:items.map(item=>{
              const style=getComputedStyle(item);
              return {
                fish:Boolean(item.querySelector('.base-fish-icon')),
                name:item.querySelector('.trade-completion-fish__name')?.textContent.trim()||'',
                category:Boolean(item.querySelector('.chronology-weight-category-icon')),
                weight:item.querySelector('.trade-completion-fish__weight')?.textContent.trim()||'',
                height:item.getBoundingClientRect().height,
                border:Number.parseFloat(style.borderTopWidth)+Number.parseFloat(style.borderRightWidth)+Number.parseFloat(style.borderBottomWidth)+Number.parseFloat(style.borderLeftWidth),
                backgroundAlpha:(()=>{const value=style.backgroundColor;if(value==='transparent')return 0;const match=value.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);return match?Number(match[1]):1;})()
              };
            })
          };
        });
        assert(details.count===4&&details.items.every(item=>item.fish&&item.category)&&details.items[0].name==='Бурый групер'&&details.items[0].weight.includes('13,1 кг'),`${engineName}/${viewportName}: completed trade fish details are incomplete ${JSON.stringify(details)}`);
        assert(details.badgeDetail===0&&details.items.every(item=>item.height<=42&&item.border===0&&item.backgroundAlpha===0),`${engineName}/${viewportName}: completed trade details are not compact and flat ${JSON.stringify(details)}`);

        const sessionId=await page.evaluate(()=>addHistory('Игровая сессия завершена','event','',{numbered:false}).id);
        const session=await page.locator(`[data-history-id="${sessionId}"]`).evaluate(marker=>{
          const style=getComputedStyle(marker),box=marker.getBoundingClientRect(),parent=marker.parentElement.getBoundingClientRect();
          return {chronologyRow:marker.classList.contains('chronology-row'),images:marker.querySelectorAll('img').length,height:box.height,centerDelta:Math.abs((box.left+box.right)/2-(parent.left+parent.right)/2),background:style.backgroundImage,border:Number.parseFloat(style.borderTopWidth)+Number.parseFloat(style.borderRightWidth)+Number.parseFloat(style.borderBottomWidth)+Number.parseFloat(style.borderLeftWidth)};
        });
        assert(!session.chronologyRow&&session.images===0&&session.height<=28&&session.centerDelta<=1&&session.background==='none'&&session.border===0,`${engineName}/${viewportName}: session completion is not a compact centered label ${JSON.stringify(session)}`);
        if(viewportName==='phonePortrait')await page.locator('#historyList').screenshot({path:path.join(output,`${engineName}-completed-history.png`),animations:'disabled'});
        assert(!errors.length,`${engineName}/${viewportName}: page errors: ${errors.join('; ')}`);
        report.engines[engineName][viewportName]={closed,dialog,details,session};
        await page.close();
      }
    }finally{await browser.close();}
  }
  console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
