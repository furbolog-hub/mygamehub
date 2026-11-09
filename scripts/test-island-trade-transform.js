const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'artifacts','island-trade-transform');
const viewports={
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  desktop:{width:1280,height:900}
};

async function installFixture(page){
  return page.evaluate(()=>{
    state=initialState();
    state.history=[];
    state.historyUi={expandedId:'island-transform-row',filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
    const item={
      id:'fixture-island-flower',key:'surfFlower',name:'Цветок грохочущего прибоя',
      icon:'🌺',historyRowId:'island-transform-row',exchanged:true,abyssConsumed:true,islandTrade:true,
      abyssChange:{kind:'transform',source:'Расхититель',toName:'обрывок газеты',toIcon:'🔘',toType:'trash',toTrashId:'fixture-island-trash'}
    };
    state.tradeItems.push(item);
    state.trash.push({id:'fixture-island-trash',name:'обрывок газеты',converted:false,historyRowId:'island-transform-row',abyssCreated:true});
    state.history.push({
      id:'island-transform-row',type:'island',text:'Экспедиция завершена: Остров Разрушительных Приливов',detail:'',
      numbered:false,createdAt:Date.now(),islandCompletion:true,islandKey:'destructiveTides',
      islandLootResults:[{id:'fixture-flower-loot',kind:'trade',key:'surfFlower',name:'Цветок грохочущего прибоя',icon:'🌺'}]
    });
    renderHistory();

    const legacy=initialState();
    legacy.history=[];
    legacy.tradeItems.push({
      id:'legacy-flower',key:'surfFlower',name:'Цветок грохочущего прибоя',icon:'🌺',exchanged:true,
      abyssConsumed:true,islandTrade:true,
      abyssChange:{kind:'transform',source:'Расхититель',toName:'обрывок газеты',toIcon:'🔘',toType:'trash'}
    });
    legacy.trash.push({id:'legacy-trash',name:'обрывок газеты',converted:false,historyRowId:'legacy-trash-row',abyssCreated:true});
    legacy.history.push(
      {id:'legacy-island-row',type:'island',text:'Экспедиция завершена',detail:'',numbered:false,createdAt:1,islandCompletion:true,islandLootResults:[{kind:'trade',key:'surfFlower',name:'Цветок грохочущего прибоя',icon:'🌺'}]},
      {id:'legacy-abyss-row',type:'abyssal',text:'Расхититель',detail:'(Предмет «Цветок грохочущего прибоя» превращён в обрывок газеты)',numbered:false,createdAt:2,abyssPersonality:'raider'},
      {id:'legacy-trash-row',type:'trash',text:'Обрывок газеты',detail:'(Создано формой жизни • Расхититель)',numbered:false,createdAt:3}
    );
    const restored=hydrateState(serializeState(legacy));
    const restoredItem=restored.tradeItems.find(entry=>entry.id==='legacy-flower');
    const restoredTrash=restored.trash.find(entry=>entry.id==='legacy-trash');

    const committedState=state;
    state=initialState();
    commitIslandLoot({island:'destructiveTides',loot:[{kind:'trade',key:'surfFlower',name:'Цветок грохочущего прибоя',icon:'🌺'}]},'future-island-row');
    const futureItem=state.tradeItems.find(entry=>entry.key==='surfFlower');
    state=committedState;

    return {
      restoredItemRow:restoredItem?.historyRowId,
      restoredTrashRow:restoredTrash?.historyRowId,
      restoredTrashResultId:restoredItem?.abyssChange?.toTrashId,
      legacyTrashRowExists:restored.history.some(row=>row.id==='legacy-trash-row'),
      futureItemRow:futureItem?.historyRowId
    };
  });
}

async function metrics(page){
  return page.evaluate(()=>{
    const row=document.querySelector('[data-history-id="island-transform-row"]');
    const detail=row?.querySelector('.history-row-details');
    const chain=row?.querySelector('.history-transform-chain');
    const sourceName=chain?.querySelector('.history-transform-object .history-affected-object-name');
    const sourceIcon=chain?.querySelector('.history-transform-object .trade-item-icon');
    const resultIcon=chain?.querySelector('.history-transform-result .trade-item-icon, .history-transform-result img');
    return {
      rowExists:Boolean(row),chainCount:row?.querySelectorAll('.history-transform-chain').length||0,
      chainText:chain?.textContent.replace(/\s+/g,' ').trim()||'',
      unchangedSourceRows:[...(row?.querySelectorAll('.island-history-loot-item')||[])].filter(entry=>entry.textContent.includes('Цветок грохочущего прибоя')).length,
      sourceColor:sourceName?getComputedStyle(sourceName).color:'',
      sourceFilter:sourceIcon?getComputedStyle(sourceIcon).filter:'',
      resultFilter:resultIcon?getComputedStyle(resultIcon).filter:'',
      detailFits:Boolean(detail&&detail.scrollWidth<=detail.clientWidth+1),
      standaloneTrashRows:[...document.querySelectorAll('[data-history-id]')].filter(entry=>entry!==row&&/Обрывок газеты/i.test(entry.textContent)).length
    };
  });
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  for(const [browserName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    for(const [viewportName,viewport] of Object.entries(viewports)){
      const page=await browser.newPage({viewport});
      await page.goto(pageUrl,{waitUntil:'load'});
      await page.waitForFunction(()=>typeof initialState==='function'&&typeof renderHistory==='function');
      const stateChecks=await installFixture(page);
      const ui=await metrics(page);
      assert.equal(stateChecks.restoredItemRow,'legacy-island-row',`${browserName}/${viewportName}: legacy item was not linked to its island row`);
      assert.equal(stateChecks.restoredTrashRow,'legacy-island-row',`${browserName}/${viewportName}: legacy trash was not folded into the island row`);
      assert.equal(stateChecks.restoredTrashResultId,'legacy-trash',`${browserName}/${viewportName}: transformed result id was not restored`);
      assert.equal(stateChecks.legacyTrashRowExists,false,`${browserName}/${viewportName}: misleading standalone trash row remains`);
      assert.equal(stateChecks.futureItemRow,'future-island-row',`${browserName}/${viewportName}: new island item lacks its history row id`);
      assert(ui.rowExists,`${browserName}/${viewportName}: island row is missing`);
      assert.equal(ui.chainCount,1,`${browserName}/${viewportName}: expected exactly one transformation chain`);
      assert(ui.chainText.includes('Цветок грохочущего прибоя')&&ui.chainText.includes('Обрывок газеты'),`${browserName}/${viewportName}: transformation labels are incomplete`);
      assert.equal(ui.unchangedSourceRows,0,`${browserName}/${viewportName}: unchanged island loot entry is duplicated`);
      assert.equal(ui.sourceColor,'rgb(146, 157, 163)',`${browserName}/${viewportName}: source name is not grey`);
      assert(/grayscale\(1\)/.test(ui.sourceFilter),`${browserName}/${viewportName}: source icon is not greyed (${ui.sourceFilter})`);
      assert(!/grayscale\(1\)/.test(ui.resultFilter),`${browserName}/${viewportName}: result icon was greyed with the source`);
      assert(ui.detailFits,`${browserName}/${viewportName}: transformation overflows its row`);
      assert.equal(ui.standaloneTrashRows,0,`${browserName}/${viewportName}: a separate trash row is visible`);
      await page.screenshot({path:path.join(output,`${browserName}-${viewportName}.png`),fullPage:true});
      await page.close();
    }
    await browser.close();
  }
  console.log('Island trade transformation checks passed in Chromium and WebKit.');
})().catch(error=>{console.error(error);process.exitCode=1;});
