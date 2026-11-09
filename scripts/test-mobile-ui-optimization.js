const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','mobile-ui-optimization');
const viewports={
  phone320x568:{width:320,height:568},
  phone360x800:{width:360,height:800},
  phone375x812:{width:375,height:812},
  phone390x844:{width:390,height:844},
  phone393x852:{width:393,height:852},
  phone414x896:{width:414,height:896},
  phone430x932:{width:430,height:932},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1366,height:768}
};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const results=[];
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        await page.goto(target,{waitUntil:'load'});
        await page.evaluate(()=>{
          state=initialState();
          const fish={
            id:uid(),name:'карпиодес',category:'normal',rarity:'common',originalWeight:4,weight:11.2,finalWeight:11.2,
            source:'Заброс',direct:true,removed:false,tags:['Чешуя +5 кг','Метаморф: +24%'],debuffLimited:false,
            leviathanImpact:{before:4,after:9,plus:5,step:1},
            abyssImpacts:[{source:'Метаморф',type:'weight',before:9,after:11.2}]
          };
          state.fish.push(fish);
          const fishRow=addFishHistory(fish,'Заброс');
          const tradeItem={id:uid(),key:'sunkenAmber',name:'Янтарь Затонувших Берегов',icon:'',fishId:fish.id,historyRowId:fishRow.id,exchanged:false};
          state.tradeItems.push(tradeItem);fishRow.tradeItemId=tradeItem.id;
          const trashRow=addHistory('Полиэтиленовый пакет','trash','(⚡ Удар молнии поднял хлам со дна • Нить Сифонофоры удалила хлам • возвращён 1 заброс)',{numbered:true});trashRow.threadRemoved=true;
          const scuba={id:uid(),name:'Акваланг',abyssEnhanced:false};state.bonuses.push(scuba);
          const scubaRow=addHistory('Акваланг','bonus','(Самая тяжёлая оставшаяся рыба получает ×3. Несколько Аквалангов складываются линейно. Штурвал Наутилуса удваивает силу каждого Акваланга.)',{bonusId:scuba.id,numbered:false});
          const carapace={id:uid(),key:'carapace',name:'Панцирная чешуя',used:true,finalWeight:288.8,finalTargets:[fish.id],protectedFish:1,dungeonType:'cradle'};
          state.dungeon.rewards.push(carapace);
          const carapaceRow=addHistory('Панцирная чешуя','dungeon','(Финальный чистый вес 288,8 кг установлен для рыб: Карпиодес)',{numbered:false,dungeonReward:'carapace',dungeonRewardId:carapace.id,dungeonType:'cradle'});carapace.historyRowId=carapaceRow.id;
          state.artifacts.push(
            {id:uid(),name:'Чешуя Левиафана',tier:'epic',traded:false},
            {id:uid(),name:'Компас потерянных глубин',tier:'mythic',traded:false},
            {id:uid(),name:'Жемчужина Осквернённого Сердца',tier:'mythic',traded:false},
            {id:uid(),name:'Спёкшееся изотопное ядро',tier:'legendary',traded:false}
          );
          render();
          window.__mobileUiRows={fish:fishRow.id,trash:trashRow.id,scuba:scubaRow.id,carapace:carapaceRow.id};
          const gameplayState={...state};delete gameplayState.historyUi;window.__mobileUiState=JSON.stringify(gameplayState);
        });
        await page.waitForTimeout(80);
        const metrics=await page.evaluate(()=>{
          const app=document.querySelector('.app-shell'),timeline=document.querySelector('#historyScroll'),action=document.querySelector('#bottomNavigation');
          const header=document.querySelector('.topbar'),weather=document.querySelector('.merged-weather-card'),chips=document.querySelector('#effectsList');
          const fishRow=document.querySelector(`[data-history-id="${window.__mobileUiRows.fish}"]`);
          const scubaRow=document.querySelector(`[data-history-id="${window.__mobileUiRows.scuba}"]`);
          const carapaceRow=document.querySelector(`[data-history-id="${window.__mobileUiRows.carapace}"]`);
          const trashRow=document.querySelector(`[data-history-id="${window.__mobileUiRows.trash}"]`);
          const leviathan=fishRow?.querySelector('.leviathan-impact'),metamorph=fishRow?.querySelector('.abyss-fish-impact');
          const rect=element=>{const r=element.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
          return {
            bodyOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            bodyVertical:document.documentElement.scrollHeight-document.documentElement.clientHeight,
            app:rect(app),header:rect(header),weather:rect(weather),action:rect(action),timeline:rect(timeline),
            headerControls:[...header.querySelectorAll('#sceneMenuBtn,#dropfishDebugBtn,#soundToggleBtn,#motionBtn,#guideBtn')].map(rect),
            timelineOverflow:getComputedStyle(timeline).overflowY,
            chipWrap:getComputedStyle(chips).flexWrap,
            chipHeight:Math.max(...[...chips.querySelectorAll('.chip')].map(chip=>chip.getBoundingClientRect().height),0),
            chainOrder:Boolean(leviathan&&metamorph&&leviathan.compareDocumentPosition(metamorph)&Node.DOCUMENT_POSITION_FOLLOWING),
            chainText:[...fishRow.querySelectorAll('.leviathan-impact,.abyss-fish-impact')].map(node=>node.textContent.replace(/\s+/g,' ').trim()).join(' '),
            catchText:fishRow?.querySelector('.chronology-row__result')?.textContent.replace(/\s+/g,' ').trim()||'',
            duplicateScale:(fishRow?.textContent.match(/Чешуя Левиафана/g)||[]).length,
            targetRepeated:[...fishRow.querySelectorAll('.modifier-row-title')].some(node=>/Карпиодес/i.test(node.textContent)),
            descriptionButton:Boolean(scubaRow?.classList.contains('is-expandable')&&scubaRow?.querySelector('.scuba-bonus-status')),
            carapaceState:carapaceRow?.querySelector('.history-entity-detail')?.textContent.replace(/\s+/g,' ').trim()||'',
            carapaceDescription:Boolean(carapaceRow?.classList.contains('is-expandable')&&carapaceRow?.querySelector('.history-entity-detail')),
            trashChain:trashRow?.querySelector('.history-entity-detail')?.textContent.replace(/\s+/g,' ').trim()||'',
            longTextOverflow:[...document.querySelectorAll('.effect-chip-title,.trade-item-find-copy strong')].some(node=>node.scrollWidth-node.clientWidth>1),
          };
        });
        assert(metrics.bodyOverflow<=1,`${engineName}/${viewportName}: horizontal page overflow ${metrics.bodyOverflow}px`);
        assert(metrics.bodyVertical<=1,`${engineName}/${viewportName}: whole page scrolls by ${metrics.bodyVertical}px`);
        assert(metrics.app.top>=-1&&metrics.app.bottom<=viewport.height+1,`${engineName}/${viewportName}: app shell leaves viewport`);
        for(const [name,rect] of Object.entries({header:metrics.header,weather:metrics.weather,action:metrics.action}))assert(rect.top>=-1&&rect.bottom<=viewport.height+1,`${engineName}/${viewportName}: ${name} is not persistently visible`);
        assert(metrics.headerControls.length===5&&metrics.headerControls.every(rect=>rect.left>=metrics.header.left-1&&rect.right<=metrics.header.right+1&&rect.top>=metrics.header.top-1&&rect.bottom<=metrics.header.bottom+1&&rect.width>=40&&rect.height>=40),`${engineName}/${viewportName}: a restored header control is clipped or has a small touch area ${JSON.stringify({header:metrics.header,controls:metrics.headerControls})}`);
        assert(metrics.timeline.height>24&&['auto','scroll'].includes(metrics.timelineOverflow),`${engineName}/${viewportName}: chronology is not the scroll region`);
        assert(metrics.chipWrap==='nowrap'&&metrics.chipHeight<=60,`${engineName}/${viewportName}: active effects are not a compact single row (${metrics.chipHeight}px)`);
        assert(metrics.chainOrder,`${engineName}/${viewportName}: modifier calculation order is wrong`);
        assert(/4,0 кг.*9,0 кг.*9,0 кг.*11,2 кг/.test(metrics.chainText),`${engineName}/${viewportName}: 4.0 → 9.0 → 11.2 chain is incomplete: ${metrics.chainText}`);
        assert(metrics.catchText==='+11,2 кг',`${engineName}/${viewportName}: primary weight summary must keep only the compact final weight: ${metrics.catchText}`);
        assert(metrics.duplicateScale===1&&!metrics.targetRepeated,`${engineName}/${viewportName}: modifier repeats source or target`);
        assert(metrics.descriptionButton,`${engineName}/${viewportName}: complex description is not progressively disclosed`);
        assert(/Финальный чистый вес.*288,8 кг.*Карпиодес/.test(metrics.carapaceState)&&metrics.carapaceDescription,`${engineName}/${viewportName}: carapace state is not structured from source data`);
        assert(/Удар молнии поднял хлам со дна.*Нить Сифонофоры удалила хлам.*возвращён 1 заброс/.test(metrics.trashChain),`${engineName}/${viewportName}: trash cause chain is incomplete`);
        assert(!metrics.longTextOverflow,`${engineName}/${viewportName}: a real long DropFish name overflows its component`);
        const scubaRowId=await page.evaluate(()=>window.__mobileUiRows.scuba);
        await page.evaluate(id=>setHistoryRowExpanded(id,true),scubaRowId);
        const toggle=await page.evaluate(id=>{const row=document.querySelector(`[data-history-id="${id}"]`),gameplayState={...state};delete gameplayState.historyUi;return{expanded:row?.querySelector('[data-history-toggle]')?.getAttribute('aria-expanded'),hidden:row?.querySelector('.chronology-disclosure')?.getAttribute('aria-hidden'),stateSame:JSON.stringify(gameplayState)===window.__mobileUiState};},scubaRowId);
        assert(toggle.expanded==='true'&&toggle.hidden==='false'&&toggle.stateSame,`${engineName}/${viewportName}: disclosure changed game state or failed to expand`);
        if(['phone320x568','phone390x844','phoneLandscape','tabletPortrait','tabletLandscape','desktop'].includes(viewportName))await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`)});
        results.push({engine:engineName,viewport:viewportName,...metrics});
        await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,results},null,2));
  process.stdout.write(`PASS: ${results.length} mobile UI renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
