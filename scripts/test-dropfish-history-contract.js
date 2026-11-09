const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;
const output=path.join(root,'test-results/dropfish-history-stage-7');
const source=fs.readFileSync(path.join(root,'dropfish/script.js'),'utf8');
const contract=JSON.parse(fs.readFileSync(path.join(root,'dropfish/history-contract.json'),'utf8'));
const viewports={
  phoneSmall:{width:320,height:568},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1280,height:900}
};

function verifyStaticContract(){
  assert.strictEqual(contract.schemaVersion,2,'unexpected history contract schema');
  assert.strictEqual(new Set(contract.types.map(entry=>entry.type)).size,contract.types.length,'duplicate history type in contract');
  assert(contract.types.length>=23,'history type matrix is incomplete');
  assert(contract.adapterFields.length===13,'row adapter field contract changed');
  const presentationFields=['icon','badge','collapsedResult','filterGroup','details','optionalMedia','tone','motionTier'];
  const motionTiers=new Set(['standard','catch','negative','rare','legendary','mythic','weather','special','rift','radioactive']);
  for(const entry of contract.types){
    for(const field of presentationFields)assert(Object.prototype.hasOwnProperty.call(entry,field),`${entry.type}.${field} presentation contract is missing`);
    assert(entry.icon&&entry.badge&&entry.collapsedResult&&entry.filterGroup&&entry.optionalMedia&&entry.tone,`${entry.type} has an empty presentation descriptor`);
    assert(Array.isArray(entry.details)&&entry.details.length>0,`${entry.type} detail field contract is empty`);
    assert(motionTiers.has(entry.motionTier),`${entry.type} has unknown motion tier ${entry.motionTier}`);
  }
  assert(source.includes('historyUi:{expandedIds:[]'),'multi-disclosure state is missing from initial state');
  assert(source.includes("filter:'all'"),'chronology filter state is missing from initial state');
  assert(source.includes('delete state.historyUi.expandedId'),'legacy expandedId migration is missing');
  for(const action of contract.actions){
    for(const attribute of action.attributes){
      const occurrences=source.split(attribute).length-1;
      assert(occurrences>=1,`${attribute} is missing from chronology markup`);
    }
    if(/^[A-Za-z_$][\w$]*$/.test(action.handler))assert(source.includes(`${action.handler}(`),`${action.handler} handler is missing`);
  }
}

async function installFixtures(page){
  await page.evaluate(contractTypes=>{
    state=initialState();
    state.history=[];
    state.historyUi={expandedIds:[],filter:'all',introducedKeys:[],initialized:true,compactVersion:5};
    const now=Date.now();
    const fish={id:uid(),name:'атлантическая треска',weight:4.82,originalWeight:4.82,category:'normal',source:'Заброс',direct:true,removed:false,tags:[]};
    const eatenFish={id:uid(),name:'полосатый окунь',weight:8.4,originalWeight:8.4,category:'heavy',source:'Заброс',direct:true,removed:true,tags:[]};
    const sacrificedFish={id:uid(),name:'атлантический лосось',weight:9.7,originalWeight:9.7,category:'heavy',source:'Заброс',direct:true,removed:true,tags:[]};
    const skeletonFish={id:uid(),name:'желтохвост',skeletonOf:'желтохвост',weight:0,originalWeight:22.4,category:'giant',source:'Заброс',direct:true,removed:true,mythicSkeleton:true,tags:[]};
    state.fish.push(fish,eatenFish,sacrificedFish,skeletonFish);
    state.eaten.push(eatenFish);
    const unusual={id:uid(),name:'Синий осьминог',weight:12.6,originalWeight:12.6,impacts:[]};
    state.nonFishCatches.push(unusual);
    const exactArtworkTexts={bonus:'Ласты',debuff:'Косатка'};
    const rows=contractTypes.map((type,index)=>({
      id:`contract-${type}`,
      type,
      text:exactArtworkTexts[type]||(type==='weather'?'Начался золотой час':type==='event'?'Очень длинное название события для проверки ограниченного двухстрочного заголовка хронологии':`Тест: ${type}`),
      detail:'',
      numbered:false,
      createdAt:now-index*60000,
      ...(type==='fish'?{fishId:fish.id,fishSource:'Заброс'}:{}),
      ...(type==='nonFishCatch'?{nonFishCatchId:unusual.id}:{}),
      ...(type==='assemblyDevice'?{assemblyDeviceKey:'echoSounder'}:{}),
      ...(type==='deepEquipment'?{deepGearRank:2,deepGearComponents:['rod','reel'],deepGearBonusCast:true}:{}),
      ...(type==='weather'?{weatherKey:'golden'}:{}),
      ...(type==='rift'?{riftType:'singularity',riftId:'contract-rift'}:{}),
      ...(type==='island'?{islandCompletion:true,islandKey:'leadenFog'}:{}),
      ...(type==='deadWaters'?{deadWatersEvent:true}:{}),
      ...(type==='dungeon'?{dungeonType:'astral',dungeonAction:'dive'}:{})
    }));
    rows.splice(1,0,{id:'legacy-time',type:'event',text:'Старая запись без времени',detail:'',numbered:false});
    rows.splice(2,0,{id:'expandable-row',type:'event',text:'Запись с подробностями',detail:'(Сохранённая подробность)',numbered:false,createdAt:now-99*60000});
    rows.splice(3,0,{id:'expandable-row-2',type:'event',text:'Вторая запись с подробностями',detail:'(Вторая сохранённая подробность)',numbered:false,createdAt:now-100*60000});
    rows.splice(4,0,{id:'rift-media-row',type:'rift',text:'Открыт Древний разлом: Сингулярная яма',detail:'(Исследование Разлома начато)',numbered:false,createdAt:now-101*60000,riftType:'singularity',riftId:'fixture-rift'});
    rows.splice(5,0,{id:'terminal-fish',type:'fish',text:'Полосатый окунь — 8,4 кг',detail:'',numbered:false,createdAt:now-102*60000,fishId:eatenFish.id,fishSource:'Заброс',eaten:true});
    rows.splice(6,0,{id:'terminal-rift-sacrifice',type:'fish',text:'Атлантический лосось — 9,7 кг',detail:'',numbered:false,createdAt:now-103*60000,fishId:sacrificedFish.id,fishSource:'Заброс',riftSacrificeLabel:'Отдана в жертву Разлому'});
    rows.splice(7,0,{id:'terminal-skeleton',type:'fish',text:'Желтохвост — 22,4 кг',detail:'',numbered:false,createdAt:now-104*60000,fishId:skeletonFish.id,fishSource:'Заброс'});
    state.history=rows;
    render();
    window.__historyContractIds={legacy:'legacy-time',expandable:'expandable-row',secondExpandable:'expandable-row-2',media:'rift-media-row',terminals:['terminal-fish','terminal-rift-sacrifice','terminal-skeleton']};
  },contract.types.map(entry=>entry.type));
}

async function verifyDecisionIndependence(page){
  return page.evaluate(()=>{
    state=initialState();
    const reward={id:uid(),key:'goldenGear',name:'Золотая шестерня',used:false,pending:true,applying:false,alternatives:[
      {id:'alternative-a',type:'normal',label:'Обычная рыба',decision:null,applied:false},
      {id:'alternative-b',type:'heavy',label:'Рыба-тяжеловес',decision:null,applied:false},
      {id:'alternative-c',type:'trash',label:'Хлам',decision:null,applied:false},
      {id:'alternative-d',type:'bonus',label:'Бонус',decision:null,applied:false}
    ]};
    state.dungeon.rewards.push(reward);
    reward.alternatives.forEach((item,index)=>{
      const row={id:`golden-row-${index}`,type:'event',text:`Альтернативный заброс ${index+1}: ${item.label}`,detail:'(Результат пока не применяется)',numbered:false,createdAt:Date.now()+index,goldenAlternative:true,goldenAlternativeId:item.id};
      item.historyRowId=row.id;
      state.history.push(row);
    });
    renderHistory();
    document.querySelector('[data-golden-id="alternative-a"][data-golden-decision="keep"]')?.click();
    const sibling=document.querySelector('[data-golden-id="alternative-b"][data-golden-decision="keep"]');
    return {first:reward.alternatives[0].decision,second:reward.alternatives[1].decision,siblingVisible:Boolean(sibling),siblingDisabled:Boolean(sibling?.disabled)};
  });
}

async function verifyExpandedArtworkMatrix(page){
  return page.evaluate(()=>{
    const samples=[
      {id:'rift',type:'rift',text:'Древний разлом',riftType:'singularity'},
      {id:'island',type:'island',text:'Остров завершён',islandCompletion:true,islandKey:'leadenFog'},
      {id:'dead-waters',type:'deadWaters',text:'Мёртвые воды',deadWatersEvent:true},
      {id:'dungeon',type:'dungeon',text:'Подземелье',dungeonType:'astral',dungeonAction:'sacrifice'}
    ];
    const host=document.createElement('ul');
    host.className='history-list';
    host.style.position='absolute';
    host.style.left='-10000px';
    host.innerHTML=samples.map(sample=>{
      const media=chronologyRowMedia(sample);
      const vm=createChronologyRowViewModel(sample,{icon:'<span>✦</span>',title:sample.text,details:'<small>Подробность</small>',media,expanded:true,showCompactArtwork:true,className:' is-expanded is-expandable'});
      return renderChronologyRow(vm);
    }).join('');
    document.querySelector('.mobile-game-shell__chronology').append(host);
    const result=[...host.querySelectorAll('.chronology-row')].map(row=>({
      id:row.dataset.historyId,
      integrated:row.classList.contains('has-integrated-artwork'),
      compactArtworkCount:row.querySelectorAll('.chronology-row__art').length,
      disclosureMediaCount:row.querySelectorAll('.chronology-disclosure__media').length
    }));
    host.remove();
    return result;
  });
}

(async()=>{
  verifyStaticContract();
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(pageUrl,{waitUntil:'load'});
        await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;caret-color:transparent!important}'});
        await installFixtures(page);
        await page.waitForTimeout(80);
        await page.locator('[data-history-id="contract-debuff"]').screenshot({path:path.join(output,`${engineName}-${viewportName}-orca.png`),animations:'disabled'});
        const expectedPresentation=Object.fromEntries(contract.types.map(entry=>[entry.type,{iconSource:entry.icon,badgeSource:entry.badge,resultSource:entry.collapsedResult,filterGroup:entry.filterGroup,detailFields:entry.details,mediaSource:entry.optionalMedia,tone:entry.tone,motionTier:entry.motionTier}]));
        const metrics=await page.evaluate(({expectedTypes,requiredFields,expectedPresentation})=>{
          const rows=[...document.querySelectorAll('.chronology-row')];
          const simple=rows.filter(row=>!row.classList.contains('has-history-actions')&&!row.classList.contains('is-expanded'));
          const boxes=simple.map(row=>row.getBoundingClientRect());
          const boxDetails=simple.map(row=>({id:row.dataset.historyId,height:row.getBoundingClientRect().height,disclosureHeight:row.querySelector('.chronology-disclosure')?.getBoundingClientRect().height||0}));
          const ids=window.__historyContractIds;
          const legacy=document.querySelector(`[data-history-id="${ids.legacy}"]`);
          const expandable=document.querySelector(`[data-history-id="${ids.expandable}"]`);
          const terminals=ids.terminals.map(id=>document.querySelector(`[data-history-id="${id}"]`));
          const scroller=document.getElementById('historyScroll');
          const sampleVm=createChronologyRowViewModel({id:'sample',type:'event',text:'Sample',createdAt:Date.now()},{icon:'<i></i>'});
          const mediaMappings={
            rift:chronologyRowMedia({type:'rift',riftType:'singularity'})?.src||'',
            island:chronologyRowMedia({type:'island',islandCompletion:true,islandKey:'leadenFog'})?.src||'',
            legacyIsland:chronologyRowMedia({type:'island',islandCompletion:true,islandName:ISLANDS.leadenFog.name})?.src||'',
            deadWaters:chronologyRowMedia({type:'deadWaters',deadWatersEvent:true})?.src||'',
            dungeon:chronologyRowMedia({type:'dungeon',dungeonType:'astral',dungeonAction:'sacrifice'})?.src||'',
            generic:chronologyRowMedia({type:'event'})
          };
          const supported=chronologySupportedTypes();
          const presentations=Object.fromEntries(supported.map(type=>[type,chronologyTypePresentation(type)]));
          const rowContracts=Object.fromEntries(supported.map(type=>{
            const row=document.querySelector(`[data-history-id="contract-${type}"]`);
            const art=row?.querySelector('.chronology-row__art')?.getBoundingClientRect(),box=row?.querySelector('.chronology-row__summary')?.getBoundingClientRect();
            const artImage=row?.querySelector('.chronology-row__art img'),artStyle=artImage?getComputedStyle(artImage):null,artScrim=row?.querySelector('.chronology-row__art');
            const badge=row?.querySelector('.chronology-row__badge');
            return [type,{hasIcon:Boolean(row?.querySelector('.chronology-row__icon')?.innerHTML.trim()),hasNoSummaryIcon:row?.classList.contains('has-no-summary-icon')||false,badgeTitle:badge?.getAttribute('title')||'',badgeKey:badge?.dataset.badgeKey||'',badgeImage:Boolean(badge?.querySelector('img')),hasNoHeaderBadge:row?.classList.contains('has-no-header-badge')||false,result:row?.querySelector('.chronology-row__result')?.textContent.trim()||'',tone:row?.dataset.historyTone||'',filterGroup:row?.dataset.historyFilterGroup||'',motionTier:row?.dataset.historyMotionTier||'',integrated:row?.classList.contains('has-integrated-artwork')||false,artWidth:art?.width||0,artHeight:art?.height||0,rowWidth:box?.width||0,rowHeight:box?.height||0,artSrc:artImage?.getAttribute('src')||'',artFit:artStyle?.objectFit||'',artPosition:artStyle?.objectPosition||'',artMask:artStyle?.maskImage||artStyle?.webkitMaskImage||'',artOpacity:artStyle?.opacity||'',artFilter:artStyle?.filter||'',artScrim:artScrim?getComputedStyle(artScrim,'::after').backgroundImage:''}];
          }));
          const title=rows.find(row=>row.dataset.historyType==='event'&&row.textContent.includes('Очень длинное'))?.querySelector('.chronology-row__title-text');
          const titleStyle=title?getComputedStyle(title):null;
          const firstIcon=rows[0]?.querySelector('.chronology-row__icon')?.getBoundingClientRect();
          const summary=expandable?.querySelector('[data-history-toggle]');
          const disclosure=expandable?.querySelector('.chronology-disclosure');
          const disclosureStyle=disclosure?getComputedStyle(disclosure):null;
          const genericMedia=rows.find(row=>row.dataset.historyId==='expandable-row')?.querySelector('.chronology-disclosure__media');
          const mediaRow=rows.find(row=>row.dataset.historyId===ids.media);
          const closedMediaCount=mediaRow?.querySelectorAll('.chronology-disclosure__media').length||0;
          const closedCompactArtwork=mediaRow?.querySelectorAll('.chronology-row__art').length||0;
          const standardCapacity=Math.floor((scroller.clientHeight+4)/(46+4));
          const filterRail=document.getElementById('historyFilters'),filterButtons=[...filterRail.querySelectorAll('[data-history-filter]')],activeFilter=filterButtons.find(button=>button.getAttribute('aria-pressed')==='true');
          const filterGroups=Object.fromEntries(supported.map(type=>[type,chronologyFilterGroup({type})]));
          return {
            renderedTypes:[...new Set(rows.map(row=>row.dataset.historyType))],
            supported,
            missingVmFields:requiredFields.filter(field=>!(field in sampleVm)),
            mediaMappings,
            minHeight:Math.min(...boxes.map(box=>box.height)),
            maxHeight:Math.max(...boxes.map(box=>box.height)),
            boxDetails,
            firstIcon:firstIcon?{width:firstIcon.width,height:firstIcon.height}:null,
            timestampCount:document.querySelectorAll('.chronology-row__time').length,
            titleClamp:titleStyle?.webkitLineClamp||'',
            summaryRole:summary?.getAttribute('role'),
            summaryTabIndex:summary?.getAttribute('tabindex'),
            expandedBefore:summary?.getAttribute('aria-expanded'),
            disclosureAriaHiddenBefore:disclosure?.getAttribute('aria-hidden'),
            disclosureInertBefore:Boolean(disclosure?.inert),
            disclosureHeightBefore:disclosure?.getBoundingClientRect().height,
            disclosureTransition:disclosureStyle?.transitionDuration||'',
            genericHasMedia:Boolean(genericMedia),
            closedMediaCount,
            closedCompactArtwork,
            terminalStates:terminals.map(row=>{
              const icon=row?.querySelector('.chronology-row__icon'),copy=row?.querySelector('.chronology-row__title-text'),status=row?.querySelector('.chronology-row__collapsed-status'),result=row?.querySelector('.chronology-row__result');
              const iconBox=icon?.getBoundingClientRect(),copyBox=copy?.getBoundingClientRect(),titleStyle=copy?getComputedStyle(copy):null,statusStyle=status?getComputedStyle(status):null,resultStyle=result?getComputedStyle(result):null;
              return {
                iconClass:row?.querySelector('.chronology-row__icon > *')?.className||'',
                title:copy?.childNodes[0]?.textContent?.trim()||'',
                origin:Boolean(row?.querySelector('.chronology-row__title .fish-inline-status')),
                badge:row?.querySelector('.chronology-row__badge')?.getAttribute('title')||'',
                status:status?.textContent.trim()||'',
                result:result?.textContent.trim()||'',
                titleColor:titleStyle?.color||'',
                titleDecoration:titleStyle?.textDecorationLine||'',
                statusColor:statusStyle?.color||'',
                statusBorder:statusStyle?.borderTopWidth||'',
                statusBackground:statusStyle?.backgroundColor||'',
                resultColor:resultStyle?.color||'',
                resultDecoration:resultStyle?.textDecorationLine||'',
                copyCenterDelta:iconBox&&copyBox?Math.abs((iconBox.top+iconBox.height/2)-(copyBox.top+copyBox.height/2)):null
              };
            }),
            presentations,
            rowContracts,
            standardCapacity,
            filterLabels:filterButtons.map(button=>button.querySelector('span')?.textContent.trim()),
            filterCounts:Object.fromEntries(filterButtons.map(button=>[button.dataset.historyFilter,Number(button.querySelector('.chronology-filter__count')?.textContent)])),
            filterGroups,
            filterRail:{clientWidth:filterRail.clientWidth,scrollWidth:filterRail.scrollWidth,clientHeight:filterRail.clientHeight,scrollHeight:filterRail.scrollHeight},
            activeFilter:activeFilter?.dataset.historyFilter||'',
            activeFilterFilled:activeFilter?getComputedStyle(activeFilter).backgroundImage!=='none':false,
            documentScroll:document.documentElement.scrollHeight-document.documentElement.clientHeight,
            expectedTypes,
            expectedPresentation
          };
        },{expectedTypes:contract.types.map(entry=>entry.type),requiredFields:contract.adapterFields,expectedPresentation});
        assert.deepStrictEqual([...metrics.supported].sort(),[...metrics.expectedTypes].sort(),`${engineName}/${viewportName}: adapter type list differs from contract`);
        assert.deepStrictEqual([...metrics.renderedTypes].sort(),[...metrics.expectedTypes].sort(),`${engineName}/${viewportName}: not every history type rendered`);
        assert.deepStrictEqual(metrics.missingVmFields,[],`${engineName}/${viewportName}: incomplete row view-model`);
        assert.deepStrictEqual(metrics.presentations,metrics.expectedPresentation,`${engineName}/${viewportName}: runtime presentation matrix differs from the recorded contract`);
        for(const [type,row] of Object.entries(metrics.rowContracts)){
          const expected=metrics.expectedPresentation[type];
          if(type==='rift')assert(!row.hasIcon&&row.hasNoSummaryIcon,`${engineName}/${viewportName}: Rift generic mini-marker returned`);
          else assert(row.hasIcon&&!row.hasNoSummaryIcon,`${engineName}/${viewportName}: ${type} has no chronology icon`);
          if(type==='angus')assert(!row.badgeTitle&&!row.badgeKey&&!row.badgeImage&&row.hasNoHeaderBadge,`${engineName}/${viewportName}: Angus duplicate header badge remains`);
          else assert(row.badgeTitle&&row.badgeKey&&row.badgeImage&&!row.hasNoHeaderBadge,`${engineName}/${viewportName}: ${type} has no chronology badge icon or accessible label`);
          if(['fish','trash','coin','flowSphere','assemblyBlueprint','assemblyDevice','event'].includes(type))assert(!row.integrated&&row.artWidth===0&&row.artHeight===0,`${engineName}/${viewportName}: ${type} must remain illustration-free`);
          else assert(row.integrated&&Math.abs(row.artWidth-row.rowWidth)<=.5&&Math.abs(row.artHeight-row.rowHeight)<=.5,`${engineName}/${viewportName}: ${type} does not use the shared wide row artwork (${row.artWidth}x${row.artHeight} versus ${row.rowWidth}x${row.rowHeight})`);
          const toneMatches=expected.tone==='fish-category'?['normal','heavy','giant','radioactive','deep','island','rare','epic','legendary','rift'].includes(row.tone):row.tone===expected.tone;
          assert(toneMatches&&row.filterGroup===expected.filterGroup&&row.motionTier===expected.motionTier,`${engineName}/${viewportName}: ${type} row metadata differs from its presentation contract`);
        }
        {const orca=metrics.rowContracts.debuff,baseline=metrics.rowContracts.bonus;assert(orca.artSrc.includes('orca-debuff.webp'),`${engineName}/${viewportName}: Orca artwork source is wrong`);assert(orca.artFit==='contain'&&orca.artPosition===baseline.artPosition&&orca.artMask==='none'&&orca.artOpacity===baseline.artOpacity&&orca.artFilter===baseline.artFilter&&orca.artScrim===baseline.artScrim,`${engineName}/${viewportName}: Orca artwork does not preserve its complete wide composition (${JSON.stringify({orca,baseline})})`);}
        assert(/^\+4,8 кг$/.test(metrics.rowContracts.fish.result)&&/^\+12,6 кг$/.test(metrics.rowContracts.nonFishCatch.result)&&metrics.rowContracts.deepEquipment.result==='+1 ЗАБРОС',`${engineName}/${viewportName}: collapsed result strategies are not applied (${JSON.stringify({fish:metrics.rowContracts.fish.result,nonFishCatch:metrics.rowContracts.nonFishCatch.result,deepEquipment:metrics.rowContracts.deepEquipment.result})})`);
        for(const type of metrics.expectedTypes.filter(type=>!['fish','nonFishCatch','deepEquipment'].includes(type)))assert(metrics.rowContracts[type].result==='',`${engineName}/${viewportName}: ${type} received an undocumented collapsed result`);
        assert(metrics.mediaMappings.rift.endsWith('/banners/rifts/singularity.webp')&&metrics.mediaMappings.island.endsWith('/banners/islands/leaden-fog.webp')&&metrics.mediaMappings.legacyIsland===metrics.mediaMappings.island&&metrics.mediaMappings.deadWaters.endsWith('/banners/events/dead-waters.webp')&&metrics.mediaMappings.dungeon.endsWith('/banners/dungeons/astral-whisper-abyss/entrance.webp')&&metrics.mediaMappings.generic===null,`${engineName}/${viewportName}: optional media mapping is incomplete or over-broad`);
        assert(metrics.minHeight>=44&&metrics.maxHeight<=76,`${engineName}/${viewportName}: closed row heights are ${metrics.minHeight}..${metrics.maxHeight}: ${JSON.stringify(metrics.boxDetails.filter(item=>item.height>76))}`);
        assert(metrics.firstIcon&&metrics.firstIcon.width===42&&metrics.firstIcon.height===42,`${engineName}/${viewportName}: icon slot is not 42px`);
        assert(metrics.timestampCount===0,`${engineName}/${viewportName}: chronology timestamps are still rendered`);
        assert(metrics.titleClamp==='none',`${engineName}/${viewportName}: chronology titles still use a line clamp (${metrics.titleClamp})`);
        assert(metrics.summaryRole==='button'&&metrics.summaryTabIndex==='0',`${engineName}/${viewportName}: disclosure is not keyboard reachable`);
        assert(metrics.expandedBefore==='false'&&metrics.disclosureAriaHiddenBefore==='true'&&metrics.disclosureInertBefore,`${engineName}/${viewportName}: disclosure is not initially inaccessible`);
        assert(metrics.disclosureHeightBefore<=.5,`${engineName}/${viewportName}: closed disclosure occupies ${metrics.disclosureHeightBefore}px`);
        assert(metrics.disclosureTransition.includes('.25s'),`${engineName}/${viewportName}: disclosure transition is not 250ms`);
        assert(!metrics.genericHasMedia,`${engineName}/${viewportName}: unrelated generic row received a banner`);
        assert(metrics.closedMediaCount===0&&metrics.closedCompactArtwork===1,`${engineName}/${viewportName}: illustrated row does not use one wide artwork (${JSON.stringify({media:metrics.closedMediaCount,artwork:metrics.closedCompactArtwork})})`);
        assert(metrics.terminalStates.length===3&&metrics.terminalStates[0].iconClass.includes('fish-eaten-main-icon')&&metrics.terminalStates[1].iconClass.includes('fish-rift-sacrifice-main-icon')&&metrics.terminalStates[2].iconClass.includes('fish-skeleton-main-icon'),`${engineName}/${viewportName}: eaten/sacrifice/skeleton icons did not replace the main fish icon`);
        const eatenTerminal=metrics.terminalStates[0];
        assert(eatenTerminal.status==='Съедена'&&eatenTerminal.result==='8,4 кг',`${engineName}/${viewportName}: eaten fish has no plain collapsed status or weight (${JSON.stringify(eatenTerminal)})`);
        assert(eatenTerminal.titleColor==='rgb(255, 111, 125)'&&eatenTerminal.statusColor===eatenTerminal.titleColor&&eatenTerminal.resultColor===eatenTerminal.titleColor,`${engineName}/${viewportName}: eaten fish name, status and weight are not consistently red (${JSON.stringify(eatenTerminal)})`);
        assert(eatenTerminal.titleDecoration==='none'&&eatenTerminal.resultDecoration==='none',`${engineName}/${viewportName}: eaten fish name or weight remains crossed out (${JSON.stringify(eatenTerminal)})`);
        assert(eatenTerminal.statusBorder==='0px'&&eatenTerminal.statusBackground==='rgba(0, 0, 0, 0)',`${engineName}/${viewportName}: eaten status received an unwanted container`);
        assert(eatenTerminal.copyCenterDelta!==null&&eatenTerminal.copyCenterDelta<=1,`${engineName}/${viewportName}: eaten fish text stack is ${eatenTerminal.copyCenterDelta}px off the icon center`);
        for(const terminal of metrics.terminalStates){
          assert(!/съедена|жертв|скелет|тяжеловес|гигант/i.test(terminal.title),`${engineName}/${viewportName}: terminal state/category repeats beside title`);
          assert(!terminal.origin,`${engineName}/${viewportName}: obsolete source icon remains beside the title`);
          assert(/ЗАБРОС|АРКАДА|РАЗЛОМ|ЭКСПЕДИЦИЯ|ПОДЗЕМЕЛЬЕ|РАДИАЦИЯ|ГЛУБИНА|ТОРГОВЛЯ|БОНУС|ЭПИЧЕСКИЙ/.test(terminal.badge),`${engineName}/${viewportName}: terminal row has no accessible source icon label (${JSON.stringify(terminal)})`);
        }
        assert.deepStrictEqual(metrics.filterLabels,['Все','Улов','События','Артефакты','Разломы'],`${engineName}/${viewportName}: filter labels/order changed`);
        assert.deepStrictEqual(metrics.filterCounts,{all:33,catch:6,events:22,artifacts:3,rifts:2},`${engineName}/${viewportName}: filter counts are incorrect`);
        assert(metrics.activeFilter==='all'&&metrics.activeFilterFilled,`${engineName}/${viewportName}: default filter is not visibly active`);
        assert(metrics.filterRail.clientHeight===44&&metrics.filterRail.scrollHeight<=metrics.filterRail.clientHeight,`${engineName}/${viewportName}: filter rail lost its 44px touch lane`);
        if(viewportName==='phoneSmall')assert(metrics.filterRail.scrollWidth>metrics.filterRail.clientWidth,`${engineName}: narrow filter rail does not scroll horizontally`);
        const expectedFilterGroups={fish:'catch',nonFishCatch:'catch',trash:'catch',epic:'artifacts',legendary:'artifacts',mythic:'artifacts',rift:'rifts'};
        for(const [type,group] of Object.entries(metrics.filterGroups))assert(group===(expectedFilterGroups[type]||'events'),`${engineName}/${viewportName}: ${type} mapped to ${group}`);
        assert(metrics.documentScroll<=1,`${engineName}/${viewportName}: document scroll is ${metrics.documentScroll}px`);
        if(viewportName==='phonePortrait')assert(metrics.standardCapacity>=7&&metrics.standardCapacity<=9,`${engineName}: portrait capacity is ${metrics.standardCapacity}, expected 7..9 with filters collapsed`);
        const ids=await page.evaluate(()=>window.__historyContractIds);
        const migration=await page.evaluate(ids=>{
          const current=state.historyUi;
          state.historyUi={expandedId:ids.secondExpandable,filter:'invalid',introducedKeys:[],initialized:true,compactVersion:4};
          const migrated=historyUiState();
          const legacyState=initialState();
          legacyState.history=[{id:ids.expandable,type:'event',text:'Первая'},{id:ids.secondExpandable,type:'event',text:'Вторая'}];
          legacyState.historyUi={expandedId:ids.expandable,filter:'events',introducedKeys:[],initialized:true,compactVersion:4};
          const hydrated=hydrateState(serializeState(legacyState));
          const multiState=initialState();
          multiState.history=legacyState.history;
          multiState.historyUi={expandedIds:[ids.expandable,ids.secondExpandable,ids.expandable],filter:'events',introducedKeys:[],initialized:true,compactVersion:5};
          const multiHydrated=hydrateState(serializeState(multiState));
          legacyState.historyUi.filter='invalid';
          const invalidHydrated=hydrateState(serializeState(legacyState));
          const result={expandedIds:migrated.expandedIds,filter:migrated.filter,compactVersion:migrated.compactVersion,hasLegacy:Object.prototype.hasOwnProperty.call(migrated,'expandedId'),hydratedIds:hydrated.historyUi.expandedIds,hydratedFilter:hydrated.historyUi.filter,multiHydratedIds:multiHydrated.historyUi.expandedIds,invalidHydratedFilter:invalidHydrated.historyUi.filter,hydratedHasLegacy:Object.prototype.hasOwnProperty.call(hydrated.historyUi,'expandedId')};
          state.historyUi=current;
          return result;
        },ids);
        assert.deepStrictEqual(migration.expandedIds,[ids.secondExpandable],`${engineName}/${viewportName}: live legacy disclosure did not migrate`);
        assert.deepStrictEqual(migration.hydratedIds,[ids.expandable],`${engineName}/${viewportName}: saved legacy disclosure did not migrate`);
        assert.deepStrictEqual(migration.multiHydratedIds,[ids.expandable,ids.secondExpandable],`${engineName}/${viewportName}: saved multi-disclosure state was not preserved or deduplicated`);
        assert(migration.filter==='all'&&migration.hydratedFilter==='events'&&migration.invalidHydratedFilter==='all'&&migration.compactVersion===5&&!migration.hasLegacy&&!migration.hydratedHasLegacy,`${engineName}/${viewportName}: history UI migration was not normalized safely`);

        const filterBehavior=await page.evaluate(ids=>{
          const before=JSON.stringify(state.history),expandedRecord=state.history.find(row=>row.id===ids.expandable);
          setHistoryRowExpanded(ids.expandable,true);
          setHistoryFilter('artifacts');
          const artifactRows=[...document.querySelectorAll('.chronology-row')];
          const artifactState={
            active:state.historyUi.filter,
            expandedIds:[...state.historyUi.expandedIds],
            types:artifactRows.map(row=>row.dataset.historyType),
            header:document.getElementById('historyCount').textContent,
            historyUnchanged:before===JSON.stringify(state.history),
            expandedRecordStillPresent:state.history.includes(expandedRecord),
            activePressed:document.querySelector('[data-history-filter="artifacts"]')?.getAttribute('aria-pressed'),
            activeClass:document.querySelector('[data-history-filter="artifacts"]')?.classList.contains('is-active')
          };
          setHistoryFilter('catch');
          const catchState={types:[...document.querySelectorAll('.chronology-row')].map(row=>row.dataset.historyType),header:document.getElementById('historyCount').textContent,historyUnchanged:before===JSON.stringify(state.history)};
          setHistoryFilter('all');
          const restoredRow=document.querySelector(`[data-history-id="${ids.expandable}"]`);
          const restoredExpanded=restoredRow?.classList.contains('is-expanded')&&restoredRow?.querySelector('[data-history-toggle]')?.getAttribute('aria-expanded')==='true';
          setHistoryRowExpanded(ids.expandable,false);
          const savedHistory=state.history;
          state.history=state.history.filter(row=>chronologyFilterGroup(row)==='catch');
          setHistoryFilter('rifts');
          const emptyState={visible:!document.getElementById('emptyHistory').classList.contains('hidden'),text:document.getElementById('emptyHistory').textContent.trim(),rows:document.querySelectorAll('.chronology-row').length};
          state.history=savedHistory;
          setHistoryFilter('all');
          const priority={
            angusArtifact:chronologyFilterGroup({type:'angus',artifactId:'nested'}),
            islandArtifact:chronologyFilterGroup({type:'island',islandLootResults:[{kind:'artifact'}]}),
            dungeonReward:chronologyFilterGroup({type:'dungeon',dungeonReward:{kind:'artifact'}}),
            riftLoot:chronologyFilterGroup({type:'rift',riftLootResults:[{kind:'artifact'}]})
          };
          return {artifactState,catchState,emptyState,priority,restoredExpanded};
        },ids);
        assert(filterBehavior.artifactState.active==='artifacts'&&filterBehavior.artifactState.expandedIds.includes(ids.expandable)&&filterBehavior.artifactState.historyUnchanged&&filterBehavior.artifactState.expandedRecordStillPresent&&filterBehavior.restoredExpanded,`${engineName}/${viewportName}: filtering mutated history or forgot a hidden expanded row`);
        assert(filterBehavior.artifactState.types.length===3&&filterBehavior.artifactState.types.every(type=>['epic','legendary','mythic'].includes(type))&&filterBehavior.artifactState.header==='3/33',`${engineName}/${viewportName}: artifact filter result is incorrect`);
        assert(filterBehavior.artifactState.activePressed==='true'&&filterBehavior.artifactState.activeClass,`${engineName}/${viewportName}: selected filter state is not exposed`);
        assert(filterBehavior.catchState.types.length===6&&filterBehavior.catchState.types.every(type=>['fish','nonFishCatch','trash'].includes(type))&&filterBehavior.catchState.header==='6/33'&&filterBehavior.catchState.historyUnchanged,`${engineName}/${viewportName}: catch filter result is incorrect`);
        assert(filterBehavior.emptyState.visible&&filterBehavior.emptyState.rows===0&&/нет записей/i.test(filterBehavior.emptyState.text),`${engineName}/${viewportName}: filtered empty state is incorrect`);
        assert.deepStrictEqual(filterBehavior.priority,{angusArtifact:'events',islandArtifact:'events',dungeonReward:'events',riftLoot:'rifts'},`${engineName}/${viewportName}: combined-row filter priority is not deterministic`);

        const firstToggle=page.locator(`[data-history-id="${ids.expandable}"] [data-history-toggle]`);
        await firstToggle.focus();
        await firstToggle.press('Enter');
        await page.waitForTimeout(500);
        const keyboardState=await page.evaluate(id=>{const row=document.querySelector(`[data-history-id="${id}"]`),toggle=row?.querySelector('[data-history-toggle]'),disclosure=row?.querySelector('.chronology-disclosure');return {expanded:toggle?.getAttribute('aria-expanded'),ariaHidden:disclosure?.getAttribute('aria-hidden'),inert:Boolean(disclosure?.inert),height:disclosure?.getBoundingClientRect().height,stored:[...state.historyUi.expandedIds],focused:document.activeElement===toggle};},ids.expandable);
        assert(keyboardState.expanded==='true'&&keyboardState.ariaHidden==='false'&&!keyboardState.inert&&keyboardState.height>0,`${engineName}/${viewportName}: Enter did not expand disclosure (${JSON.stringify(keyboardState)})`);
        assert.deepStrictEqual(keyboardState.stored,[ids.expandable],`${engineName}/${viewportName}: first expanded row was not stored`);
        assert(keyboardState.focused,`${engineName}/${viewportName}: keyboard focus was not preserved`);

        const secondToggle=page.locator(`[data-history-id="${ids.secondExpandable}"] [data-history-toggle]`);
        await secondToggle.focus();
        const secondTopBefore=(await secondToggle.boundingBox())?.y;
        await secondToggle.press('Enter');
        await page.waitForTimeout(500);
        const secondTopAfter=(await secondToggle.boundingBox())?.y;
        const multiDisclosure=await page.evaluate(ids=>{
          const row=id=>document.querySelector(`[data-history-id="${id}"]`);
          const first=row(ids.expandable),second=row(ids.secondExpandable);
          return {
            expandedRows:document.querySelectorAll('.chronology-row.is-expanded').length,
            stored:[...state.historyUi.expandedIds],
            firstExpanded:first?.querySelector('[data-history-toggle]')?.getAttribute('aria-expanded'),
            secondExpanded:second?.querySelector('[data-history-toggle]')?.getAttribute('aria-expanded'),
            firstHidden:first?.querySelector('.chronology-disclosure')?.getAttribute('aria-hidden'),
            secondHidden:second?.querySelector('.chronology-disclosure')?.getAttribute('aria-hidden'),
            focused:document.activeElement===second?.querySelector('[data-history-toggle]')
          };
        },ids);
        assert(multiDisclosure.expandedRows===2&&multiDisclosure.stored.includes(ids.expandable)&&multiDisclosure.stored.includes(ids.secondExpandable),`${engineName}/${viewportName}: multiple disclosure rows did not remain open`);
        assert(multiDisclosure.firstExpanded==='true'&&multiDisclosure.secondExpanded==='true'&&multiDisclosure.firstHidden==='false'&&multiDisclosure.secondHidden==='false',`${engineName}/${viewportName}: multi-disclosure ARIA state is inconsistent`);
        assert(multiDisclosure.focused,`${engineName}/${viewportName}: focus jumped while opening another disclosure`);
        assert(Number.isFinite(secondTopBefore)&&Number.isFinite(secondTopAfter)&&Math.abs(secondTopAfter-secondTopBefore)<=50,`${engineName}/${viewportName}: opening another disclosure jumped the focused row by ${Math.abs(secondTopAfter-secondTopBefore)}px`);

        await firstToggle.press('Enter');
        await page.waitForTimeout(350);
        const independentClose=await page.evaluate(ids=>{
          const first=document.querySelector(`[data-history-id="${ids.expandable}"]`),second=document.querySelector(`[data-history-id="${ids.secondExpandable}"]`);
          return {expandedRows:document.querySelectorAll('.chronology-row.is-expanded').length,stored:[...state.historyUi.expandedIds],first:first?.querySelector('[data-history-toggle]')?.getAttribute('aria-expanded'),second:second?.querySelector('[data-history-toggle]')?.getAttribute('aria-expanded')};
        },ids);
        assert(independentClose.expandedRows===1&&!independentClose.stored.includes(ids.expandable)&&independentClose.stored.includes(ids.secondExpandable)&&independentClose.first==='false'&&independentClose.second==='true',`${engineName}/${viewportName}: closing the earlier row also changed its sibling`);
        await secondToggle.press('Enter');

        const mediaToggle=page.locator(`[data-history-id="${ids.media}"] [data-history-toggle]`);
        await mediaToggle.press('Enter');
        await page.waitForTimeout(330);
        await page.locator(`[data-history-id="${ids.media}"] .chronology-row__art img`).scrollIntoViewIfNeeded();
        try{
          await page.waitForFunction(id=>{const image=document.querySelector(`[data-history-id="${id}"] .chronology-row__art img`);return Boolean(image?.complete&&image.naturalWidth);},ids.media);
        }catch(error){
          const diagnostic=await page.evaluate(id=>{const row=document.querySelector(`[data-history-id="${id}"]`),image=row?.querySelector('.chronology-row__art img');return {row:Boolean(row),expanded:row?.classList.contains('is-expanded'),source:image?.getAttribute('src')||'',resolvedSource:image?.currentSrc||'',complete:Boolean(image?.complete),naturalWidth:image?.naturalWidth||0,naturalHeight:image?.naturalHeight||0};},ids.media);
          throw new Error(`${engineName}/${viewportName}: wide chronology artwork did not load: ${JSON.stringify(diagnostic)} (${error.message})`);
        }
        const mediaState=await page.evaluate(id=>{
          const row=document.querySelector(`[data-history-id="${id}"]`),summary=row?.querySelector('.chronology-row__summary'),art=row?.querySelector('.chronology-row__art'),image=art?.querySelector('img'),box=summary?.getBoundingClientRect(),artBox=art?.getBoundingClientRect();
          return {expandedRows:document.querySelectorAll('.chronology-row.is-expanded').length,ariaHidden:row?.querySelector('.chronology-disclosure')?.getAttribute('aria-hidden'),integrated:row?.classList.contains('has-integrated-artwork'),compactArtworkCount:row?.querySelectorAll('.chronology-row__art').length||0,disclosureMediaCount:row?.querySelectorAll('.chronology-disclosure__media').length||0,width:box?.width||0,height:box?.height||0,artWidth:artBox?.width||0,artHeight:artBox?.height||0,backgroundImage:summary?getComputedStyle(summary).backgroundImage:'none',naturalWidth:image?.naturalWidth||0,naturalHeight:image?.naturalHeight||0,source:image?.getAttribute('src')||''};
        },ids.media);
        assert(mediaState.expandedRows===1&&mediaState.ariaHidden==='false',`${engineName}/${viewportName}: media disclosure did not become the sole open row`);
        assert(mediaState.integrated&&mediaState.compactArtworkCount===1&&mediaState.disclosureMediaCount===0,`${engineName}/${viewportName}: expanded row does not retain exactly one wide artwork (${JSON.stringify(mediaState)})`);
        assert(mediaState.width>0&&mediaState.height>0&&Math.abs(mediaState.artWidth-mediaState.width)<=.5&&Math.abs(mediaState.artHeight-mediaState.height)<=.5&&mediaState.backgroundImage==='none'&&mediaState.naturalWidth>0&&mediaState.naturalHeight>0,`${engineName}/${viewportName}: wide artwork is missing or does not cover the summary (${JSON.stringify(mediaState)})`);
        assert(mediaState.source.endsWith('/banners/rifts/singularity.webp'),`${engineName}/${viewportName}: unrelated wide artwork source ${mediaState.source}`);
        const artworkMatrix=await verifyExpandedArtworkMatrix(page);
        assert(artworkMatrix.length===4&&artworkMatrix.every(entry=>entry.integrated&&entry.compactArtworkCount===1&&entry.disclosureMediaCount===0),`${engineName}/${viewportName}: expanded illustration matrix is inconsistent (${JSON.stringify(artworkMatrix)})`);
        assert(!errors.length,`${engineName}/${viewportName}: page errors: ${errors.join('; ')}`);
        if(['phonePortrait','phoneLandscape','tabletPortrait','tabletLandscape','desktop'].includes(viewportName)){
          const box=await page.locator('.mobile-game-shell__chronology').boundingBox();
          assert(box,`${engineName}/${viewportName}: chronology is not visible`);
          await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),clip:box,animations:'disabled'});
        }
        await page.close();
        renders++;
      }
      const decisionPage=await browser.newPage({viewport:viewports.phonePortrait});
      await decisionPage.goto(pageUrl,{waitUntil:'load'});
      const decision=await verifyDecisionIndependence(decisionPage);
      assert(decision.first==='keep'&&decision.second===null&&decision.siblingVisible&&!decision.siblingDisabled,`${engineName}: sibling decision was changed or disabled`);
      await decisionPage.close();

      const reducedPage=await browser.newPage({viewport:viewports.phonePortrait});
      await reducedPage.emulateMedia({reducedMotion:'reduce'});
      await reducedPage.goto(pageUrl,{waitUntil:'load'});
      await installFixtures(reducedPage);
      const reducedDurations=await reducedPage.locator('[data-history-id="expandable-row"] .chronology-disclosure').evaluate(element=>getComputedStyle(element).transitionDuration.split(',').map(value=>value.trim()));
      assert(reducedDurations.every(value=>Number.parseFloat(value)<=.001),`${engineName}: reduced motion left disclosure transitions enabled (${reducedDurations.join(', ')})`);
      await reducedPage.close();
    }finally{
      await browser.close();
    }
  }
  const report={passed:true,renders,engines:['chromium','webkit'],viewports,types:contract.types.length,actions:contract.actions.length};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  process.stdout.write(`PASS: ${renders} stage-7 chronology renders; complete ${contract.types.length}-type presentation matrix, terminal-state icons and ${contract.actions.length} action contracts\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
