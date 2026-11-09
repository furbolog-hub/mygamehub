const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;
const output=path.join(root,'artifacts','chronology-compact-disclosure');
const viewports={
  phonePortrait:{width:390,height:844},
  phoneReference:{width:440,height:892},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1280,height:900}
};

async function installFixture(page,expandedId='fish-trade'){
  await page.evaluate(expanded=>{
    state=initialState();
    state.history=[];
    state.historyUi={expandedId:expanded,filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
    const now=Date.now();
    const plainFish={id:'fixture-fish-trade',name:'Полосатый лавракс',weight:10.9,originalWeight:10.9,category:'heavy',source:'Заброс',direct:true,removed:false,tags:[]};
    plainFish.name='Серебристый горбыль';
    const boostedFish={id:'fixture-fish-combined',name:'Обыкновенный снук',weight:6.8,originalWeight:2.8,category:'normal',source:'Заброс',direct:true,removed:false,tags:[],leviathanImpact:{before:2.8,after:6.8,plus:4}};
    const complexTradeFish={id:'fixture-fish-complex-trade',name:'Серебристый горбыль',weight:8.2,originalWeight:4.1,category:'normal',source:'Заброс',direct:true,removed:false,tags:[],flipperImpact:{before:4.1,after:8.2,factor:2,count:1,bonusIds:['fixture-flippers']}};
    const multiEffectTradeFish={id:'fixture-fish-multi-trade',name:'Королевская макрель',weight:54,originalWeight:18,category:'normal',source:'Заброс',direct:true,removed:false,tags:[],flipperImpact:{before:18,after:36,factor:2,count:1,bonusIds:['fixture-flippers']},scubaImpact:{before:36,after:54,factor:1.5,count:1}};
    const calculatedFish={id:'fixture-fish-calculation',name:'Люфар',weight:.4,originalWeight:8.4,category:'normal',source:'Заброс',direct:true,removed:false,tags:[],flipperImpact:{before:4.2,after:8.4,factor:2,count:1,bonusIds:['fixture-flippers']},sparkImpacts:[{before:8.4,after:.4}]};
    const maskFish={id:'fixture-fish-mask-impact',name:'Сайда',weight:15,originalWeight:10,category:'normal',source:'Заброс',direct:true,removed:false,tags:[],maskImpact:{before:10,after:15,factor:1.5,count:1}};
    const scubaFish={id:'fixture-fish-scuba-impact',name:'Палтус',weight:30,originalWeight:10,category:'heavy',source:'Заброс',direct:true,removed:false,tags:[],scubaImpact:{before:10,after:30,factor:3,count:1}};
    const abyssFish={id:'fixture-fish-abyss-impact',name:'Морской чёрт',weight:15.3,originalWeight:9.9,category:'normal',source:'Заброс',direct:true,removed:false,tags:[],abyssImpacts:[{source:'Симбиот',type:'weight',before:9.9,after:15.3}]};
    const transmutedFish={id:'fixture-transmuted-fish',name:'Рыба-меч',weight:20.5,originalWeight:20.5,category:'giant',source:'Трансмутация хлама',direct:false,removed:false,tags:['Штурвал Наутилуса']};
    const coalFish={id:'fixture-coal-fish',name:'Скумбрия',weight:2.4,originalWeight:2.4,category:'normal',source:'Заброс',direct:true,removed:true,darkCoalConverted:true,tags:[]};
    state.fish.push(plainFish,boostedFish,complexTradeFish,multiEffectTradeFish,calculatedFish,maskFish,scubaFish,abyssFish,transmutedFish,coalFish);
    state.bonuses.push({id:'fixture-flippers',name:'Ласты'});
    state.artifacts.push(
      {id:'fixture-spark',name:'Искра Хаоса',tier:'mythic',traded:false},
      {id:'fixture-nautilus',name:'Штурвал Наутилуса',tier:'legendary',traded:false},
      {id:'fixture-essence',name:'Эссенция «Великан Океанов»',tier:'epic',traded:false},
      {id:'fixture-ethirion-artifact',name:'Послание в бутылке',tier:'epic',traded:true,ethirionTransformed:true}
    );
    const star={id:'fixture-star',key:'seaSerpentFang',name:'Клык морского змея',historyRowId:'fish-trade',fishId:plainFish.id,exchanged:false};
    const amber={id:'fixture-amber',key:'sunkenAmber',name:'Янтарь затонувших берегов',historyRowId:'fish-combined',fishId:boostedFish.id,exchanged:false};
    const blackShell={id:'fixture-black-shell',key:'blackShellShard',name:'Осколок чёрной раковины',historyRowId:'fish-complex-trade',fishId:complexTradeFish.id,exchanged:false};
    const multiBlackShell={id:'fixture-multi-black-shell',key:'blackShellShard',name:'Осколок чёрной раковины',historyRowId:'fish-multi-trade',fishId:multiEffectTradeFish.id,exchanged:false};
    const sparkItem={id:'fixture-spark-item',key:'sunkenAmber',name:'Янтарь затонувших берегов',historyRowId:'spark-row',exchanged:false};
    const transformedItem={id:'fixture-transformed-item',key:'abyssStar',name:'Звезда бездны',historyRowId:'trade-transform-row',exchanged:true,abyssConsumed:true,abyssChange:{kind:'transform',source:'Расхититель',toName:'обрывок газеты',toType:'trash'}};
    state.tradeItems.push(star,amber,blackShell,multiBlackShell,sparkItem,transformedItem);
    state.deepThingConvertedCount=1;
    state.nautilus=true;
    state.trash.push(
      {id:'fixture-trash',name:'обрывок газеты',converted:true,historyRowId:'transmutation-row'},
      {id:'fixture-abyss-trash',name:'старая сеть',converted:true,historyRowId:'abyss-transform-row',abyssChange:{kind:'transform',source:'Метаморф',toName:'Звезда бездны',toType:'trade'}}
    );
    const coin={id:'fixture-coin',type:'copper',name:'Медная монета',add:10,luck:.12,used:false,success:false,applied:false,expired:false,historyRowId:'coin-row'};
    state.coins.push(coin);
    const expeditionItem={id:'fixture-expedition-item',name:'Обрывок письма пропавшего капитана',status:'active',source:'Заброс',historyRowId:'expedition-row'};
    state.islands.items.push(expeditionItem);
    state.history=[
      {id:'lucky-trash-row',type:'trash',text:'\u041a\u043e\u043b\u043f\u0430\u0447\u043e\u043a \u043e\u0442 \u0440\u0443\u0447\u043a\u0438',detail:'(\u0421\u0447\u0430\u0441\u0442\u043b\u0438\u0432\u044b\u0439 \u043f\u043e\u043f\u043b\u0430\u0432\u043e\u043a \u0432\u0435\u0440\u043d\u0443\u043b 1 \u0437\u0430\u0431\u0440\u043e\u0441)',numbered:true,createdAt:now+1000},
      {id:'coin-row',type:'coin',text:'Медная монета',detail:'',numbered:true,createdAt:now,coinId:coin.id},
      {id:'expedition-row',type:'island',text:expeditionItem.name,detail:'',numbered:false,createdAt:now-5000,expeditionItemId:expeditionItem.id},
      {id:'blueprint-row',type:'assemblyBlueprint',text:'Сборочный чертёж DF ME: Преобразователь Xb1',detail:'Преобразует глубинный импульс в дополнительный заброс.',numbered:false,createdAt:now-10000},
      {id:'essence-row',type:'epic',text:'Эссенция «Великан Океанов»',detail:'',numbered:true,createdAt:now-12000,artifactId:'fixture-essence',essencePending:true},
      {id:'nautilus-row',type:'legendary',text:'Штурвал Наутилуса',detail:'(Удваивает силу бонусов и призывает Глубоководное нечто. • Превращено единиц хлама в гигантов: 1)',numbered:true,createdAt:now-15000,artifactId:'fixture-nautilus'},
      {id:'transmutation-row',type:'trash',text:'Трансмутация хлама',detail:'(Трансмутация хлама • Штурвал Наутилуса / Глубоководное нечто)',numbered:true,createdAt:now-17000,transmutation:{trashName:'обрывок газеты',source:'Штурвал Наутилуса / Глубоководное нечто',sourceArtifactId:'fixture-nautilus',fishId:transmutedFish.id},embeddedFishIds:[transmutedFish.id]},
      {id:'abyss-transform-row',type:'trash',text:'Старая сеть',detail:'(Метаморф преобразовал находку)',numbered:true,createdAt:now-18000},
      {id:'trade-transform-row',type:'event',text:'Превращение предмета обмена',detail:'Расхититель превратил предмет обмена',numbered:false,createdAt:now-18500,tradeItemId:transformedItem.id},
      {id:'ethirion-transform-row',type:'epic',text:'Послание в бутылке',detail:'(Послание в бутылке → обрывок газеты • Гнев Эфириона)',numbered:true,createdAt:now-18750,artifactId:'fixture-ethirion-artifact',ethirionTransform:{beforeName:'Послание в бутылке',beforeTier:'epic',afterName:'обрывок газеты'}},
      {id:'dark-coal-row',type:'fish',text:'Скумбрия — 2,4 кг',detail:'',numbered:true,createdAt:now-19000,fishId:coalFish.id,fishSource:'Заброс',darkCoalTransform:{fishName:'Скумбрия',itemName:'Звезда бездны',itemKey:'abyssStar'}},
      {id:'abyss-positive-event',type:'abyssal',text:'Форма жизни вступила в симбиотическую связь',detail:'(Морской чёрт: обычная рыба 9,9 кг → тяжеловес 15,3 кг)',numbered:false,createdAt:now-19500,abyssPersonality:'symbiote',abyssManifestation:true},
      {id:'abyss-negative-event',type:'abyssal',text:'Паразит снова внедрился в добычу',detail:'(Морской чёрт: 15,3 кг → 7,7 кг)',numbered:false,createdAt:now-19750,abyssPersonality:'parasite',abyssManifestation:true},
      {id:'spark-row',type:'mythic',text:'Искра Хаоса',detail:'',numbered:true,createdAt:now-20000,artifactId:'fixture-spark',tradeItemId:sparkItem.id},
      {id:'flippers-row',type:'bonus',text:'Ласты',detail:'Каждая вторая будущая рыба получает множитель ×2',numbered:true,createdAt:now-30000,bonusId:'fixture-flippers'},
      {id:'fish-calculation',type:'fish',text:'Люфар — 0,4 кг',detail:'',numbered:true,createdAt:now-40000,fishId:calculatedFish.id,fishSource:'Заброс'},
      {id:'fish-trade',type:'fish',text:'Полосатый лавракс — 10,9 кг',detail:'',numbered:true,createdAt:now-60000,fishId:plainFish.id,fishSource:'Заброс',tradeItemId:star.id},
      {id:'fish-complex-trade',type:'fish',text:'Серебристый горбыль — 8,2 кг',detail:'',numbered:true,createdAt:now-90000,fishId:complexTradeFish.id,fishSource:'Заброс',tradeItemId:blackShell.id},
      {id:'fish-multi-trade',type:'fish',text:'Королевская макрель — 54,0 кг',detail:'',numbered:true,createdAt:now-100000,fishId:multiEffectTradeFish.id,fishSource:'Заброс',tradeItemId:multiBlackShell.id},
      {id:'fish-combined',type:'fish',text:'Обыкновенный снук — 6,8 кг',detail:'',numbered:true,createdAt:now-120000,fishId:boostedFish.id,fishSource:'Заброс',tradeItemId:amber.id}
    ];
    if(expanded==='fish-mask-impact')state.history.push({id:'fish-mask-impact',type:'fish',text:'Сайда — 15,0 кг',detail:'',numbered:true,createdAt:now-45000,fishId:maskFish.id,fishSource:'Заброс'});
    if(expanded==='fish-scuba-impact')state.history.push({id:'fish-scuba-impact',type:'fish',text:'Палтус — 30,0 кг',detail:'',numbered:true,createdAt:now-50000,fishId:scubaFish.id,fishSource:'Заброс'});
    if(expanded==='fish-abyss-impact')state.history.push({id:'fish-abyss-impact',type:'fish',text:'Морской чёрт — 15,3 кг',detail:'',numbered:true,createdAt:now-55000,fishId:abyssFish.id,fishSource:'Заброс'});
    render();
    document.getElementById('historyScroll').scrollTop=0;
  },expandedId);
}

async function compactMetrics(page,rowId){
  const metrics=await page.evaluate(id=>{
    const row=document.querySelector(`[data-history-id="${id}"]`);
    const head=row?.querySelector('.history-row-head');
    const summary=row?.querySelector('.chronology-row__summary');
    const disclosure=row?.querySelector(':scope > .chronology-disclosure');
    const detail=row?.querySelector('.history-row-details');
    const trade=row?.querySelector('.trade-item-find.is-available');
    const title=row?.querySelector('.chronology-row__title');
    const titleText=row?.querySelector('.chronology-row__title-text');
    const action=row?.querySelector('.history-row-actions');
    const meta=row?.querySelector('.chronology-row__meta');
    const result=row?.querySelector('.chronology-row__result');
    const coinButton=row?.querySelector('.coin-luck-btn');
    const expeditionButton=row?.querySelector('.expedition-study-btn, .expedition-go-btn');
    const toggle=row?.querySelector('[data-history-toggle]');
    const chevron=row?.querySelector('.chronology-row__chevron');
    const artwork=row?.querySelector('.chronology-row__art');
    const badgeElement=row?.querySelector('.chronology-row__badge');
    const primaryIcon=row?.querySelector('.chronology-row__icon > span, .chronology-row__icon > img');
    const inlineTradeIndicator=row?.querySelector('.chronology-row__title .history-trade-item-indicator');
    const tradeIcon=trade?.querySelector('.trade-item-icon');
    const tradeCopy=trade?.querySelector('.trade-item-find-copy');
    const combinedImpact=row?.querySelector('.ordinary-fish-combined-detail > .gear-impact');
    const flipper=row?.querySelector('.flipper-impact');
    const flipperIcon=flipper?.querySelector('.fish-item-impact__icon');
    const flipperCopy=flipper?.querySelector('.fish-item-impact__copy');
    const flipperSummary=flipper?.querySelector('.fish-item-impact__summary');
    const flipperFactor=flipper?.querySelector('.fish-item-impact__factor');
    const flipperTarget=flipper?.querySelector('.gear-target');
    const flipperCalculation=flipper?.querySelector('.fish-item-impact__calculation');
    const fishItemImpact=row?.querySelector('.fish-item-impact');
    const fishItemImpactIcon=fishItemImpact?.querySelector('.fish-item-impact__icon');
    const fishItemImpactCopy=fishItemImpact?.querySelector('.fish-item-impact__copy');
    const fishItemImpactSummary=fishItemImpact?.querySelector('.fish-item-impact__summary');
    const fishItemImpactFactor=fishItemImpact?.querySelector('.fish-item-impact__factor');
    const fishItemImpactTarget=fishItemImpact?.querySelector('.gear-target');
    const fishItemImpactCalculation=fishItemImpact?.querySelector('.fish-item-impact__calculation');
    const transform=row?.querySelector('.history-transform-chain');
    const transformObjectCopy=transform?.querySelector('.history-transform-object > span:last-child, .history-transform-object > s');
    const transformResultCopy=transform?.querySelector('.history-transform-result > strong');
    const transformCategory=transform?.querySelector('.history-transform-category');
    const transformCategoryIcon=transformCategory?.querySelector('img');
    const separator=row?.querySelector('.ordinary-fish-detail-divider');
    const directGearImpacts=[...(detail?.querySelectorAll(':scope > .gear-impact:not(.fish-debuff-impact)')||[])];
    const weightResults=[...(row?.querySelectorAll('.history-weight-result')||[])];
    const detailTypography=[...(detail?.querySelectorAll([
      ':scope > .history-detail',
      '.history-mechanic small',
      '.history-mechanic-copy',
      '.history-mechanic-status',
      '.trade-item-find-copy strong',
      '.trade-item-purpose',
      '.gear-impact > span:last-child',
      '.gear-impact strong',
      '.gear-impact small',
      '.gear-target',
      '.gear-weight-chain',
      '.fish-item-impact__summary',
      '.fish-item-impact__calculation',
      '.deep-impact',
      '.non-fish-impact',
      '.history-transform-object > span:last-child',
      '.history-transform-object > s',
      '.history-transform-result > strong',
      '.nautilus-summon-copy strong',
      '.nautilus-summon-copy small'
    ].join(','))||[])];
    const box=element=>element?.getBoundingClientRect();
    const textInkBox=element=>{
      if(!element)return null;
      const range=document.createRange();
      range.selectNodeContents(element);
      const rects=[...range.getClientRects()];
      return rects.length?rects[rects.length-1]:range.getBoundingClientRect();
    };
    const titleTextInk=textInkBox(titleText);
    const rowBox=box(row),summaryBox=box(summary),disclosureBox=box(disclosure),detailBox=box(detail);
    const protectedElements=detail?[...new Set([
      ...detail.children,
      ...detail.querySelectorAll('.history-transform-source-icon,.history-transform-object > .trade-item-spark,.history-transform-object > .trade-item-icon,.history-transform-result > :is(.artifact-entity-icon,.trade-item-icon,.coin-icon),.gear-icon,.fish-item-impact__icon')
    ])]:[];
    const protectedBoxes=protectedElements.filter(element=>getComputedStyle(element).display!=='none').map(element=>box(element));
    const textInkBoxes=[];
    if(detail){
      const walker=document.createTreeWalker(detail,NodeFilter.SHOW_TEXT);
      for(let node=walker.nextNode();node;node=walker.nextNode()){
        if(!node.textContent.trim()||getComputedStyle(node.parentElement).display==='none')continue;
        const range=document.createRange();range.selectNodeContents(node);
        textInkBoxes.push(...range.getClientRects());
      }
    }
    const disclosureContentBoxes=[...protectedBoxes,...textInkBoxes];
    const tradeStyle=trade?getComputedStyle(trade):null;
    const detailStyle=detail?getComputedStyle(detail):null;
    const coinButtonStyle=coinButton?getComputedStyle(coinButton):null;
    const expeditionButtonStyle=expeditionButton?getComputedStyle(expeditionButton):null;
    const titleTextStyle=titleText?getComputedStyle(titleText):null;
    const relativeLuminance=color=>{
      const channels=(color.match(/[\d.]+/g)||[]).slice(0,3).map(Number).map(value=>value/255).map(value=>value<=.03928?value/12.92:((value+.055)/1.055)**2.4);
      return channels.length===3?.2126*channels[0]+.7152*channels[1]+.0722*channels[2]:0;
    };
    const coinContrast=coinButtonStyle?(()=>{
      const foreground=relativeLuminance(coinButtonStyle.color),background=relativeLuminance(coinButtonStyle.backgroundColor);
      return (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05);
    })():0;
    const expeditionContrast=expeditionButtonStyle?(()=>{
      const foreground=relativeLuminance(expeditionButtonStyle.color),background=relativeLuminance(expeditionButtonStyle.backgroundColor);
      return (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05);
    })():0;
    const splitTitleWords=[];
    if(titleText){
      const walker=document.createTreeWalker(titleText,NodeFilter.SHOW_TEXT);
      for(let node=walker.nextNode();node;node=walker.nextNode()){
        for(const match of node.textContent.matchAll(/\S+/g)){
          const range=document.createRange();
          range.setStart(node,match.index);
          range.setEnd(node,match.index+match[0].length);
          if(range.getClientRects().length>1)splitTitleWords.push(match[0]);
        }
      }
    }
    return {
      rowClassName:row?.className||'',
      row:box(row),head:box(head),summary:box(summary),detail:box(detail),trade:box(trade),title:box(title),titleText:box(titleText),action:box(action),meta:box(meta),result:box(result),
      combinedImpact:box(combinedImpact),
      resultText:result?.textContent.replace(/\s+/g,' ').trim()||'',
      resultFits:Boolean(result&&result.scrollWidth<=result.clientWidth+1),
      detailClientHeight:detail?.clientHeight||0,
      detailScrollHeight:detail?.scrollHeight||0,
      detailDisplay:detailStyle?.display||'',
      detailBorderTop:detailStyle?.borderTopWidth||'',
      detailPaddingTop:detailStyle?.paddingTop||'',
      tradeBackground:tradeStyle?.backgroundImage||'',
      tradeBackgroundColor:tradeStyle?.backgroundColor||'',
      tradeBorder:tradeStyle?.borderTopWidth||'',
      itemName:trade?.querySelector('strong')?.textContent.trim()||'',
      itemNameFits:trade?trade.querySelector('strong').scrollWidth<=trade.querySelector('strong').clientWidth+1:false,
      purpose:trade?.querySelector('.trade-item-purpose')?.textContent.trim()||'',
      primaryIcon:box(primaryIcon),
      inlineTradeIndicator:box(inlineTradeIndicator),
      inlineTradeIndicatorAfterTitle:titleText?.nextElementSibling===inlineTradeIndicator,
      inlineTradeIndicatorGap:inlineTradeIndicator&&titleText?box(inlineTradeIndicator).left-box(titleText).right:null,
      inlineTradeIndicatorInkGap:inlineTradeIndicator&&titleTextInk?box(inlineTradeIndicator).left-titleTextInk.right:null,
      titleTextClipped:Boolean(titleText&&titleText.scrollWidth>titleText.clientWidth+1),
      titleTextContent:titleText?.textContent.replace(/\s+/g,' ').trim()||'',
      titleTextFits:Boolean(titleText&&titleText.scrollWidth<=titleText.clientWidth+1&&titleText.scrollHeight<=titleText.clientHeight+1),
      titleWordBreak:titleTextStyle?.wordBreak||'',
      titleOverflowWrap:titleTextStyle?.overflowWrap||'',
      splitTitleWords,
      tradeIcon:box(tradeIcon),
      tradeCopy:box(tradeCopy),
      tradeLineCenterDelta:tradeIcon&&tradeCopy?Math.abs((box(tradeIcon).top+box(tradeIcon).bottom)/2-(box(tradeCopy).top+box(tradeCopy).bottom)/2):0,
      tradeCopyFits:Boolean(tradeCopy&&tradeCopy.scrollWidth<=tradeCopy.clientWidth+1&&tradeCopy.scrollHeight<=tradeCopy.clientHeight+1),
      primaryTradeIconOverlap:tradeIcon&&primaryIcon?Math.max(0,Math.min(box(tradeIcon).bottom,box(primaryIcon).bottom)-Math.max(box(tradeIcon).top,box(primaryIcon).top)):0,
      flipper:box(flipper),
      flipperIcon:box(flipperIcon),
      flipperCopy:box(flipperCopy),
      flipperSummary:box(flipperSummary),
      flipperFactor:box(flipperFactor),
      flipperTarget:box(flipperTarget),
      flipperCalculation:box(flipperCalculation),
      flipperText:flipper?.textContent.replace(/\s+/g,' ').trim()||'',
      flipperIconLabel:flipperIcon?.getAttribute('aria-label')||'',
      flipperNoteCount:flipper?.querySelectorAll('.fish-item-impact__note').length||0,
      flipperCopyFits:Boolean(flipperCopy&&flipperCopy.scrollWidth<=flipperCopy.clientWidth+1&&flipperCopy.scrollHeight<=flipperCopy.clientHeight+1),
      flipperSummaryFontSize:parseFloat(flipperSummary?getComputedStyle(flipperSummary).fontSize:'0'),
      flipperCalculationFontSize:parseFloat(flipperCalculation?getComputedStyle(flipperCalculation).fontSize:'0'),
      fishItemImpact:box(fishItemImpact),
      fishItemImpactIcon:box(fishItemImpactIcon),
      fishItemImpactCopy:box(fishItemImpactCopy),
      fishItemImpactSummary:box(fishItemImpactSummary),
      fishItemImpactFactor:box(fishItemImpactFactor),
      fishItemImpactTarget:box(fishItemImpactTarget),
      fishItemImpactCalculation:box(fishItemImpactCalculation),
      fishItemImpactText:fishItemImpact?.textContent.replace(/\s+/g,' ').trim()||'',
      fishItemImpactIconLabel:fishItemImpactIcon?.getAttribute('aria-label')||'',
      fishItemImpactNoteCount:fishItemImpact?.querySelectorAll('.fish-item-impact__note').length||0,
      fishItemImpactCopyFits:Boolean(fishItemImpactCopy&&fishItemImpactCopy.scrollWidth<=fishItemImpactCopy.clientWidth+1&&fishItemImpactCopy.scrollHeight<=fishItemImpactCopy.clientHeight+1),
      fishItemImpactSummaryFontSize:parseFloat(fishItemImpactSummary?getComputedStyle(fishItemImpactSummary).fontSize:'0'),
      fishItemImpactCalculationFontSize:parseFloat(fishItemImpactCalculation?getComputedStyle(fishItemImpactCalculation).fontSize:'0'),
      directGearImpacts:directGearImpacts.map(impact=>{
        const icon=impact.querySelector(':scope > .gear-icon');
        const copy=impact.querySelector(':scope > span:last-child');
        const style=getComputedStyle(impact);
        return {
          className:impact.className,
          box:box(impact),
          icon:box(icon),
          copy:box(copy),
          copyFits:Boolean(copy&&copy.scrollWidth<=copy.clientWidth+1&&copy.scrollHeight<=copy.clientHeight+1),
          backgroundImage:style.backgroundImage,
          backgroundColor:style.backgroundColor,
          borderTopWidth:style.borderTopWidth
        };
      }),
      weightResults:weightResults.map(result=>({
        text:result.textContent.trim(),
        className:result.className,
        color:getComputedStyle(result).color
      })),
      detailTypography:detailTypography.filter(element=>{
        const ownText=[...element.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join('').trim();
        return element.textContent.trim()&&getComputedStyle(element).display!=='none'&&(ownText||element.children.length===0);
      }).map(element=>{
        const style=getComputedStyle(element);
        return {
          className:element.className,
          text:element.textContent.replace(/\s+/g,' ').trim(),
          fontSize:parseFloat(style.fontSize),
          lineHeight:parseFloat(style.lineHeight),
          textDecorationLine:style.textDecorationLine
        };
      }),
      transform:box(transform),
      transformBackground:transform?getComputedStyle(transform).backgroundImage:'',
      transformBackgroundColor:transform?getComputedStyle(transform).backgroundColor:'',
      transformBorder:transform?getComputedStyle(transform).borderTopWidth:'',
      transformArrowCount:transform?.querySelectorAll('.history-transform-arrow').length||0,
      transformSourceIconCount:transform?.querySelectorAll('.history-transform-source-icon').length||0,
      transformText:transform?.textContent.replace(/\s+/g,' ').trim()||'',
      transformObjectCopyFits:transformObjectCopy?transformObjectCopy.scrollWidth<=transformObjectCopy.clientWidth+1:true,
      transformResultCopyFits:transformResultCopy?transformResultCopy.scrollWidth<=transformResultCopy.clientWidth+1:true,
      transformCategoryCount:transform?.querySelectorAll('.history-transform-category').length||0,
      transformCategory:box(transformCategory),
      transformCategoryIcon:box(transformCategoryIcon),
      transformCategoryLoaded:Boolean(transformCategoryIcon?.complete&&transformCategoryIcon?.naturalWidth),
      transformCategoryIconMargin:transformCategoryIcon?`${getComputedStyle(transformCategoryIcon).marginTop} ${getComputedStyle(transformCategoryIcon).marginLeft}`:'',
      transformCategoryIconVisible:transformCategoryIcon?getComputedStyle(transformCategoryIcon).visibility==='visible'&&Number(getComputedStyle(transformCategoryIcon).opacity)>0:false,
      transformCategoryInsideResult:transformCategory?.parentElement?.classList.contains('history-transform-result')||false,
      transformCategoryImmediatelyAfterWeight:transformCategory?.previousElementSibling===transformResultCopy,
      detailText:detail?.textContent.replace(/\s+/g,' ').trim()||'',
      timestampCount:row?.querySelectorAll('.chronology-row__time').length||0,
      sourceIconCount:row?.querySelectorAll('.chronology-row__title .fish-inline-status').length||0,
      badge:row?.querySelector('.chronology-row__badge')?.textContent.trim()||'',
      separator:row?.querySelector('.ordinary-fish-detail-divider')?.textContent||'',
      separatorVisible:Boolean(separator&&getComputedStyle(separator).display!=='none'),
      artworkCount:row?.querySelectorAll('.chronology-row__art').length||0,
      integratedArtwork:Boolean(row?.classList.contains('has-integrated-artwork')),
      coinButtonText:coinButton?.textContent.trim()||'',
      coinButtonBackground:coinButtonStyle?.backgroundColor||'',
      coinButtonBackgroundImage:coinButtonStyle?.backgroundImage||'',
      coinButtonColor:coinButtonStyle?.color||'',
      coinButtonFontSize:parseFloat(coinButtonStyle?.fontSize||'0'),
      coinButtonTextFits:Boolean(coinButton&&coinButton.scrollWidth<=coinButton.clientWidth+1),
      coinButtonContrast:coinContrast,
      expeditionButtonText:expeditionButton?.textContent.trim()||'',
      expeditionButton:box(expeditionButton),
      badgeBox:box(badgeElement),
      expeditionButtonBackground:expeditionButtonStyle?.backgroundColor||'',
      expeditionButtonBackgroundImage:expeditionButtonStyle?.backgroundImage||'',
      expeditionButtonColor:expeditionButtonStyle?.color||'',
      expeditionButtonFontSize:parseFloat(expeditionButtonStyle?.fontSize||'0'),
      expeditionButtonTextFits:Boolean(expeditionButton&&expeditionButton.scrollWidth<=expeditionButton.clientWidth+1),
      expeditionButtonContrast:expeditionContrast,
      toggleAriaExpanded:toggle?.getAttribute('aria-expanded')||'',
      chevronCount:row?.querySelectorAll('.chronology-row__chevron').length||0,
      chevronBox:box(chevron),
      artworkBox:box(artwork),
      detailChildren:[...(detail?.children||[])].map(child=>({className:child.className,left:box(child).left,right:box(child).right,top:box(child).top,bottom:box(child).bottom})),
      disclosureIntegrity:Boolean(row?.classList.contains('is-expanded')&&rowBox&&summaryBox&&disclosureBox&&detailBox&&detailBox.top>=summaryBox.bottom-.5&&disclosureBox.top>=summaryBox.bottom-.5&&disclosureContentBoxes.length&&disclosureContentBoxes.every(contentBox=>contentBox.left>=rowBox.left-1&&contentBox.right<=rowBox.right+1&&contentBox.top>=summaryBox.bottom-.5&&contentBox.bottom<=rowBox.bottom+1)&&detail.scrollHeight<=detail.clientHeight+1),
      disclosureGeometry:{row:rowBox,summary:summaryBox,disclosure:disclosureBox,detail:detailBox,content:disclosureContentBoxes}
    };
  },rowId);
  if(metrics.rowClassName.includes('is-expanded'))assert(metrics.disclosureIntegrity,`${rowId}: expanded disclosure content overlaps its artwork/header or leaves the content-sized row (${JSON.stringify(metrics.disclosureGeometry)})`);
  return metrics;
}

async function metadataMetrics(page){
  return page.evaluate(()=>[...document.querySelectorAll('.chronology-row')].map(row=>{
    const metaElement=row.querySelector('.chronology-row__meta');
    const meta=metaElement?.getBoundingClientRect();
    const badgeElement=row.querySelector('.chronology-row__badge');
    const badge=badgeElement?.getBoundingClientRect();
    const chevron=row.querySelector('.chronology-row__chevron')?.getBoundingClientRect();
    const artwork=row.querySelector('.chronology-row__art')?.getBoundingClientRect();
    const metaStyle=metaElement?getComputedStyle(metaElement):null;
    const badgeStyle=badgeElement?getComputedStyle(badgeElement):null;
    return {
      id:row.dataset.historyId,
      closedArtwork:row.classList.contains('has-integrated-artwork')&&!row.classList.contains('is-expanded'),
      timeCount:row.querySelectorAll('.chronology-row__time').length,
      badgeText:row.querySelector('.chronology-row__badge')?.textContent.trim()||'',
      badgeTitle:row.querySelector('.chronology-row__badge')?.getAttribute('title')||'',
      badgeKey:row.querySelector('.chronology-row__badge')?.dataset.badgeKey||'',
      badgeImageLoaded:Boolean(row.querySelector('.chronology-row__badge img')?.naturalWidth),
      metaWidth:meta?.width||0,
      badgeLeft:badge?.left||0,
      badgeWidth:badge?.width||0,
      badgeHeight:badge?.height||0,
      badgeRight:badge?.right||0,
      chevronLeft:chevron?.left||0,
      artworkLeft:artwork?.left||0,
      badgeBackground:badgeStyle?.backgroundColor||'',
      badgeBorder:badgeStyle?.borderTopWidth||'',
      badgeShadow:badgeStyle?.boxShadow||'',
      metaBackgroundImage:metaStyle?.backgroundImage||'',
      metaBorderTopWidth:metaStyle?.borderTopWidth||'',
      metaBoxShadow:metaStyle?.boxShadow||'',
      metaBackdropFilter:metaStyle?.backdropFilter||metaStyle?.webkitBackdropFilter||''
    };
  }));
}

async function verifyActionMatrix(page){
  return page.evaluate(()=>{
    const actions=[
      '<button type="button">Бросить на удачу</button>',
      '<button type="button">Изучить</button>',
      '<button type="button">Торговля</button>',
      '<div class="dungeon-history-action"><button type="button">Выбрать жертву</button></div>',
      '<div class="dead-waters-history-action"><button type="button">Войти</button></div>',
      '<div class="abyss-decision"><button type="button">Удалить</button><button type="button">Оставить</button></div>',
      '<div class="golden-gear-history-action"><button type="button">Оставить</button><button type="button">Отказаться</button></div>'
    ];
    document.getElementById('historyList').innerHTML=actions.map((action,index)=>renderChronologyRow({
      id:`action-${index}`,
      type:'event',tone:'special',filterGroup:'event',motionTier:'standard',
      icon:'⚙',title:`Действие ${index+1}`,numberPrefix:'',origin:'',
      badge:{label:'СОБЫТИЕ',tone:'special'},result:'',resultIcon:'',time:{iso:'',label:'12:42'},
      expandable:false,expanded:false,details:'',actions:action,media:null,artwork:null,
      statusFirst:false,showCompactArtwork:false,className:' has-history-actions',decorations:''
    })).join('');
    syncChronologyInlineActions();
    return [...document.querySelectorAll('.chronology-row')].map(row=>{
      const rowBox=row.getBoundingClientRect(),summary=row.querySelector('.chronology-row__summary').getBoundingClientRect(),action=row.querySelector('.history-row-actions').getBoundingClientRect(),meta=row.querySelector('.chronology-row__meta').getBoundingClientRect();
      const buttons=[...row.querySelectorAll('.history-row-actions button')].map(button=>{
        const box=button.getBoundingClientRect(),style=getComputedStyle(button);
        return {width:box.width,height:box.height,clientWidth:button.clientWidth,scrollWidth:button.scrollWidth,overflow:style.overflow,textOverflow:style.textOverflow,whiteSpace:style.whiteSpace};
      });
      const actionElement=row.querySelector('.history-row-actions');
      return {height:rowBox.height,rowBottom:rowBox.bottom,summaryLeft:summary.left,summaryTop:summary.top,summaryBottom:summary.bottom,actionLeft:action.left,actionTop:action.top,actionBottom:action.bottom,actionRight:action.right,actionClientWidth:actionElement.clientWidth,actionScrollWidth:actionElement.scrollWidth,metaLeft:meta.left,buttons};
    });
  });
}

function assertAlignedDirectImpacts(metrics,label){
  assert(metrics.directGearImpacts.length,`${label}: fixture has no direct impact records`);
  for(const impact of metrics.directGearImpacts){
    assert(impact.icon&&impact.copy,`${label}: impact lost its icon or copy column (${impact.className})`);
    assert(Math.abs(impact.box.left-metrics.primaryIcon.left)<=1,`${label}: impact left the primary icon column (${impact.box.left}px vs ${metrics.primaryIcon.left}px; ${impact.className})`);
    assert(Math.abs(impact.icon.left-metrics.primaryIcon.left)<=1,`${label}: impact icon left the primary icon column (${impact.icon.left}px vs ${metrics.primaryIcon.left}px; ${impact.className})`);
    assert(Math.abs(metrics.title.left-impact.copy.left)<=1,`${label}: impact copy is not aligned with the title after moving the attribute icon right (${impact.copy.left}px vs ${metrics.title.left}px; ${impact.className})`);
    assert(impact.box.right<=metrics.summary.right+1&&metrics.summary.right-impact.box.right<=4&&impact.copyFits,`${label}: impact does not fill, overflows, or clips its expanded row (${impact.className})`);
    assert(impact.backgroundImage==='none'&&impact.backgroundColor==='rgba(0, 0, 0, 0)'&&impact.borderTopWidth==='0px',`${label}: impact still renders as a nested card (${impact.className})`);
  }
}

function assertReadableDetailTypography(metrics,label){
  for(const record of metrics.detailTypography){
    assert(record.fontSize>=11,`${label}: expanded record text is below the shared 11px scale (${record.fontSize}px; ${record.className}; ${record.text})`);
    assert(!record.textDecorationLine.includes('line-through'),`${label}: negative/transformed record uses strike-through (${record.className}; ${record.text})`);
  }
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
        await installFixture(page,null);
        await page.waitForTimeout(50);
        const closedStandalone=await compactMetrics(page,'fish-trade');
        const closedCombined=await compactMetrics(page,'fish-combined');
        for(const closed of [closedStandalone,closedCombined]){
          assert(closed.inlineTradeIndicator&&closed.inlineTradeIndicatorAfterTitle,`${engineName}/${viewportName}: closed trade-item indicator is not immediately after the fish name`);
          assert(closed.titleTextFits,`${engineName}/${viewportName}: closed fish title is clipped or ellipsized (${closed.titleTextContent})`);
          assert(closed.splitTitleWords.length===0,`${engineName}/${viewportName}: closed fish title breaks inside words (${closed.splitTitleWords.join(', ')})`);
          assert(closed.inlineTradeIndicatorInkGap<=7,`${engineName}/${viewportName}: closed trade-item indicator has a visible gap after the fish name (${closed.inlineTradeIndicatorInkGap}px)`);
          assert(closed.inlineTradeIndicator.right<=closed.meta.left-2,`${engineName}/${viewportName}: closed trade-item indicator overlaps chronology metadata`);
        }
        await installFixture(page,'fish-trade');
        await page.waitForTimeout(50);

        const coin=await compactMetrics(page,'coin-row');
        const standalone=await compactMetrics(page,'fish-trade');
        assert(coin.action&&coin.summary,`${engineName}/${viewportName}: coin action is missing`);
        assert(coin.row.height<=52,`${engineName}/${viewportName}: coin action enlarged the shared single-level row (${coin.row.height}px)`);
        assert(coin.action.top>=coin.summary.top-1&&coin.action.bottom<=coin.summary.bottom+1,`${engineName}/${viewportName}: coin action left the shared header plane`);
        assert(coin.artworkCount===0&&!coin.integratedArtwork,`${engineName}/${viewportName}: coin row received unrelated illustration artwork`);
        assert(coin.coinButtonText==='Подбросить',`${engineName}/${viewportName}: coin action label changed (${coin.coinButtonText})`);
        assert(coin.coinButtonBackground==='rgb(16, 36, 50)'&&coin.coinButtonBackgroundImage==='none',`${engineName}/${viewportName}: coin action keeps a translucent or illustrated backplate (${coin.coinButtonBackground}; ${coin.coinButtonBackgroundImage})`);
        assert(coin.coinButtonColor==='rgb(255, 241, 184)'&&coin.coinButtonContrast>=4.5,`${engineName}/${viewportName}: coin action contrast is too low (${coin.coinButtonContrast})`);
        assert(coin.coinButtonFontSize>=11&&coin.coinButtonTextFits,`${engineName}/${viewportName}: coin action label is too small or clipped (${coin.coinButtonFontSize}px)`);
        if(viewportName==='phonePortrait')await page.locator('[data-history-id="coin-row"]').screenshot({path:path.join(output,`${engineName}-coin-row.png`),animations:'disabled'});
        const expeditionClosed=await compactMetrics(page,'expedition-row');
        assert(expeditionClosed.action&&expeditionClosed.summary,`${engineName}/${viewportName}: expedition study action is missing`);
        assert(expeditionClosed.action.top>=expeditionClosed.summary.top-1&&expeditionClosed.action.bottom<=expeditionClosed.summary.bottom+1,`${engineName}/${viewportName}: expedition action left the shared header plane (${JSON.stringify({summary:expeditionClosed.summary,action:expeditionClosed.action})})`);
        assert(expeditionClosed.row.height<=52,`${engineName}/${viewportName}: expedition action enlarged the closed chronology row (${expeditionClosed.row.height}px)`);
        assert(expeditionClosed.titleTextContent==='Обрывок письма пропавшего капитана'&&expeditionClosed.titleTextFits,`${engineName}/${viewportName}: expedition item name is clipped (${JSON.stringify({text:expeditionClosed.titleTextContent,title:expeditionClosed.titleText})})`);
        assert(expeditionClosed.splitTitleWords.length===0&&expeditionClosed.titleWordBreak==='normal'&&expeditionClosed.titleOverflowWrap==='normal',`${engineName}/${viewportName}: expedition item breaks inside a word (${JSON.stringify(expeditionClosed.splitTitleWords)})`);
        assert(expeditionClosed.expeditionButtonText==='Изучить'&&expeditionClosed.expeditionButtonTextFits&&expeditionClosed.expeditionButtonFontSize>=11,`${engineName}/${viewportName}: expedition action is clipped or too small`);
        assert(expeditionClosed.expeditionButton.right<=expeditionClosed.badgeBox.left||expeditionClosed.expeditionButton.left>=expeditionClosed.badgeBox.right||expeditionClosed.expeditionButton.bottom<=expeditionClosed.badgeBox.top||expeditionClosed.expeditionButton.top>=expeditionClosed.badgeBox.bottom,`${engineName}/${viewportName}: expedition action overlaps its source badge`);
        assert(expeditionClosed.expeditionButtonBackground==='rgb(16, 36, 50)'&&expeditionClosed.expeditionButtonBackgroundImage==='none'&&expeditionClosed.expeditionButtonColor==='rgb(234, 255, 255)'&&expeditionClosed.expeditionButtonContrast>=4.5,`${engineName}/${viewportName}: expedition action contrast is too low (${expeditionClosed.expeditionButtonContrast})`);
        assert(expeditionClosed.toggleAriaExpanded==='false'&&expeditionClosed.chevronCount===1,`${engineName}/${viewportName}: expedition row has no disclosure control`);
        assert(expeditionClosed.chevronBox&&expeditionClosed.artworkBox&&(expeditionClosed.expeditionButton.right<=expeditionClosed.chevronBox.left-1||expeditionClosed.expeditionButton.left>=expeditionClosed.chevronBox.right+1||expeditionClosed.expeditionButton.bottom<=expeditionClosed.chevronBox.top||expeditionClosed.expeditionButton.top>=expeditionClosed.chevronBox.bottom),`${engineName}/${viewportName}: expedition action overlaps the disclosure arrow`);
        assert(expeditionClosed.detailText.includes('Расшифровка с шансом 50%')&&expeditionClosed.detailText.includes('скрытого острова'),`${engineName}/${viewportName}: expedition purpose is missing`);
        if(viewportName==='phonePortrait')await page.locator('[data-history-id="expedition-row"]').screenshot({path:path.join(output,`${engineName}-expedition-row-closed.png`),animations:'disabled'});
        await page.locator('[data-history-id="expedition-row"] [data-history-toggle]').click({position:{x:21,y:21}});
        await page.waitForTimeout(20);
        const expeditionExpanded=await compactMetrics(page,'expedition-row');
        assert(expeditionExpanded.toggleAriaExpanded==='true'&&expeditionExpanded.detail.height>0,`${engineName}/${viewportName}: expedition explanation does not open`);
        assert((await compactMetrics(page,'fish-trade')).toggleAriaExpanded==='true',`${engineName}/${viewportName}: opening expedition row collapsed another chronology row`);
        await installFixture(page,'lucky-trash-row');
        await page.waitForTimeout(20);
        const luckyTrash=await compactMetrics(page,'lucky-trash-row');
        assert(luckyTrash.detailBorderTop==='0px',`${engineName}/${viewportName}: generic expanded chronology row still has an internal divider`);
        if(viewportName==='phoneReference')await page.locator('[data-history-id="lucky-trash-row"]').screenshot({path:path.join(output,`${engineName}-generic-expanded-row-no-divider-440x892.png`),animations:'disabled'});
        if(viewportName==='phonePortrait')await page.locator('[data-history-id="expedition-row"]').screenshot({path:path.join(output,`${engineName}-expedition-row-expanded.png`),animations:'disabled'});
        assert(standalone.detail&&standalone.trade,`${engineName}/${viewportName}: compact trade detail is missing`);
        assert(standalone.detail.height<=64,`${engineName}/${viewportName}: trade detail keeps excess vertical space (${standalone.detail.height}px)`);
        assert(standalone.trade.top-standalone.detail.top<=.5,`${engineName}/${viewportName}: trade item line is vertically offset inside the detail (${standalone.trade.top-standalone.detail.top}px)`);
        assert(standalone.trade.top>=standalone.summary.bottom-.5&&standalone.trade.top<=standalone.summary.bottom+3,`${engineName}/${viewportName}: trade item line must start below the illustrated summary (${standalone.trade.top-standalone.summary.bottom}px)`);
        assert(standalone.row.height<=102,`${engineName}/${viewportName}: expanded fish is taller than the non-overlapping source/title/detail composition (${standalone.row.height}px)`);
        assert(standalone.detailBorderTop==='0px'&&standalone.tradeBorder==='0px',`${engineName}/${viewportName}: nested detail border remains`);
        assert(standalone.tradeBackground==='none'&&standalone.tradeBackgroundColor==='rgba(0, 0, 0, 0)',`${engineName}/${viewportName}: purple detail card remains`);
        assert(standalone.tradeCopy.left-standalone.tradeIcon.right>=3&&standalone.tradeCopy.left-standalone.tradeIcon.right<=5,`${engineName}/${viewportName}: exchange-item icon is detached from its name (${standalone.tradeCopy.left-standalone.tradeIcon.right}px)`);
        assert(Math.abs(standalone.title.left-standalone.tradeCopy.left)<=1,`${engineName}/${viewportName}: exchange-item copy is not aligned with the title after moving the attribute icon right (${standalone.tradeCopy.left}px vs ${standalone.title.left}px)`);
        assert(standalone.tradeLineCenterDelta<=1.5,`${engineName}/${viewportName}: exchange-item icon and copy are not on the same line (${standalone.tradeLineCenterDelta}px)`);
        assert(standalone.primaryTradeIconOverlap<=8,`${engineName}/${viewportName}: expanded exchange-item icon overlaps the fish artwork too much (${standalone.primaryTradeIconOverlap}px)`);
        assert(standalone.itemName==='Клык морского змея'&&standalone.purpose==='Предмет обмена',`${engineName}/${viewportName}: trade detail copy changed`);
        assert(standalone.itemNameFits,`${engineName}/${viewportName}: standalone item name is clipped`);
        assert(Math.abs(standalone.tradeIcon.width-22)<=.5&&Math.abs(standalone.tradeIcon.height-22)<=.5,`${engineName}/${viewportName}: exchange-item icon left the shared 22px detail size (${standalone.tradeIcon.width}x${standalone.tradeIcon.height})`);
        assertReadableDetailTypography(standalone,`${engineName}/${viewportName}/fish-trade`);

        await installFixture(page,'fish-combined');
        await page.waitForTimeout(50);
        const combined=await compactMetrics(page,'fish-combined');
        assert(combined.resultText==='+6,8 кг',`${engineName}/${viewportName}: fish header repeats the weight calculation instead of showing the compact final weight (${combined.resultText})`);
        assert(combined.titleTextFits&&combined.splitTitleWords.length===0,`${engineName}/${viewportName}: expanded fish title is clipped or breaks inside a word (${combined.titleTextContent})`);
        assert(combined.detail.height>=42&&combined.detail.height<=90&&combined.detailScrollHeight<=combined.detailClientHeight+1,`${engineName}/${viewportName}: combined trade detail does not grow cleanly with its readable content`);
        assert(combined.combinedImpact&&combined.combinedImpact.top>=combined.summary.bottom-.5&&combined.combinedImpact.top<=combined.summary.bottom+3,`${engineName}/${viewportName}: first combined impact must start below the illustrated summary (${combined.combinedImpact?.top-combined.summary.bottom}px)`);
        assert(combined.trade.top-combined.combinedImpact.bottom>=-1&&combined.trade.top-combined.combinedImpact.bottom<=4,`${engineName}/${viewportName}: combined exchange record is detached from the preceding impact (${combined.trade.top-combined.combinedImpact.bottom}px)`);
        assert(combined.row.height<=130,`${engineName}/${viewportName}: combined trade row keeps excess vertical space (${combined.row.height}px)`);
        assert(!combined.separatorVisible,`${engineName}/${viewportName}: combined detail still renders a separator`);
        assert(combined.detailChildren.length===2&&combined.detailChildren.some(child=>child.className.includes('chronology-row__badge-detail')),`${engineName}/${viewportName}: combined effects or expanded source label changed rows`);
        assert(combined.itemName==='Янтарь затонувших берегов'&&combined.itemNameFits,`${engineName}/${viewportName}: combined detail clips the full item name (${JSON.stringify(combined)})`);
        assert(Math.abs(combined.tradeIcon.width-22)<=.5&&Math.abs(combined.tradeIcon.height-22)<=.5,`${engineName}/${viewportName}: combined exchange-item icon left the shared 22px detail size`);
        assert(combined.tradeCopy.left-combined.tradeIcon.right>=3&&combined.tradeCopy.left-combined.tradeIcon.right<=5,`${engineName}/${viewportName}: combined exchange-item icon is detached from its name (${combined.tradeCopy.left-combined.tradeIcon.right}px)`);
        assert(combined.primaryTradeIconOverlap<=8,`${engineName}/${viewportName}: combined exchange-item icon overlaps the fish artwork too much (${combined.primaryTradeIconOverlap}px)`);
        assertReadableDetailTypography(combined,`${engineName}/${viewportName}/fish-combined`);

        await page.locator('[data-history-id="fish-combined"] .trade-item-find-copy strong').evaluate(element=>{
          element.textContent='Янтарь затонувших берегов с печатью хранителя затерянной бухты и отметкой дальнего обменного маршрута '.repeat(4).trim();
        });
        const longCombined=await compactMetrics(page,'fish-combined');
        assert(longCombined.row.height>combined.row.height&&longCombined.detail.height>combined.detail.height,`${engineName}/${viewportName}: long exchange record does not expand the chronology row (${combined.row.height}px → ${longCombined.row.height}px)`);
        assert(longCombined.itemNameFits&&longCombined.tradeCopyFits&&longCombined.detailScrollHeight<=longCombined.detailClientHeight+1,`${engineName}/${viewportName}: long exchange record is clipped after dynamic expansion`);
        assertReadableDetailTypography(longCombined,`${engineName}/${viewportName}/fish-combined-long`);

        await installFixture(page,'fish-complex-trade');
        await page.waitForTimeout(50);
        const complexTrade=await compactMetrics(page,'fish-complex-trade');
        assert(complexTrade.resultText==='+8,2 кг',`${engineName}/${viewportName}: complex fish result is not the compact final weight (${complexTrade.resultText})`);
        const complexEffectChildren=complexTrade.detailChildren.filter(child=>!child.className.includes('trade-item-find'));
        assert(complexTrade.detail.top>=complexTrade.summary.bottom-.5&&complexTrade.detail.top<=complexTrade.summary.bottom+3,`${engineName}/${viewportName}: complex fish disclosure must start below the illustrated summary (${complexTrade.detail.top-complexTrade.summary.bottom}px)`);
        assert(complexEffectChildren.every(child=>child.top>=complexTrade.summary.bottom-1),`${engineName}/${viewportName}: complex fish effect copy overlaps its header (${JSON.stringify(complexEffectChildren)})`);
        assert(complexTrade.detailScrollHeight<=complexTrade.detailClientHeight+1,`${engineName}/${viewportName}: complex fish disclosure clips stacked content`);
        assert(complexTrade.itemName==='Осколок чёрной раковины'&&complexTrade.itemNameFits,`${engineName}/${viewportName}: complex fish exchange item is missing or clipped (${JSON.stringify(complexTrade)})`);
        assert(complexTrade.tradeCopy.left-complexTrade.tradeIcon.right>=3&&complexTrade.tradeCopy.left-complexTrade.tradeIcon.right<=5,`${engineName}/${viewportName}: complex exchange-item icon is detached from its name (${complexTrade.tradeCopy.left-complexTrade.tradeIcon.right}px)`);
        assert(complexEffectChildren.every(child=>Math.abs(child.left-complexTrade.primaryIcon.left)<=1),`${engineName}/${viewportName}: a fish calculation left the primary icon column (${JSON.stringify(complexTrade.detailChildren)})`);
        assert(complexTrade.flipper&&complexTrade.flipperIconLabel==='Ласты',`${engineName}/${viewportName}: flipper calculation lost its accessible icon label`);
        assert(!complexTrade.flipperText.includes('Ласты')&&complexTrade.flipperText.startsWith('×2 → Серебристый горбыль'),`${engineName}/${viewportName}: flipper calculation repeats the item name or changed the icon → multiplier → fish order (${complexTrade.flipperText})`);
        assert(complexTrade.flipperCopyFits,`${engineName}/${viewportName}: flipper calculation is clipped or wraps chaotically`);
        assert(Math.abs(complexTrade.flipperCopy.left-complexTrade.tradeCopy.left)<=1,`${engineName}/${viewportName}: flipper copy does not match the exchange-item text column (${JSON.stringify({flipperCopy:complexTrade.flipperCopy,tradeCopy:complexTrade.tradeCopy})})`);
        assert(complexTrade.flipperFactor.left>=complexTrade.flipperIcon.right-1&&complexTrade.flipperTarget.left>=complexTrade.flipperFactor.right,`${engineName}/${viewportName}: flipper icon, multiplier, and fish are not in visual order`);
        assert(complexTrade.flipperCalculation.top>=complexTrade.flipperSummary.bottom-1&&Math.abs(complexTrade.flipperCalculation.left-complexTrade.flipperCopy.left)<=1,`${engineName}/${viewportName}: flipper equation is not a distinct aligned line (${JSON.stringify(complexTrade)})`);
        assert(Math.abs(complexTrade.flipperSummaryFontSize-complexTrade.flipperCalculationFontSize)<=.1&&complexTrade.flipperCalculationFontSize>=11,`${engineName}/${viewportName}: flipper summary and equation do not share one readable text size (${complexTrade.flipperSummaryFontSize}px/${complexTrade.flipperCalculationFontSize}px; ${complexTrade.rowClassName})`);
        assert(complexTrade.detailBorderTop==='0px'&&complexTrade.detailPaddingTop==='0px'&&complexTrade.flipperNoteCount===0,`${engineName}/${viewportName}: complex fish calculation has a divider, extra top padding, or repeated bonus explanation`);
        assert(complexTrade.flipper.top-complexTrade.trade.bottom>=-1&&complexTrade.flipper.top-complexTrade.trade.bottom<=2,`${engineName}/${viewportName}: flipper calculation is detached from the preceding exchange row (${complexTrade.flipper.top-complexTrade.trade.bottom}px)`);
        assert(complexTrade.row.height<=146,`${engineName}/${viewportName}: one modifier leaves excess vertical space (${complexTrade.row.height}px)`);
        assertReadableDetailTypography(complexTrade,`${engineName}/${viewportName}/fish-complex-trade`);

        await page.locator('[data-history-id="fish-complex-trade"] .fish-item-impact__calculation').evaluate(element=>{
          element.textContent='4,1 кг × 2 = 8,2 кг → проверка исходного веса → подтверждение множителя → итоговый вес 8,2 кг '.repeat(4).trim();
        });
        const longCalculation=await compactMetrics(page,'fish-complex-trade');
        assert(longCalculation.row.height>complexTrade.row.height&&longCalculation.detail.height>complexTrade.detail.height,`${engineName}/${viewportName}: long calculation does not expand the chronology row (${complexTrade.row.height}px → ${longCalculation.row.height}px)`);
        assert(longCalculation.flipperCopyFits&&longCalculation.detailScrollHeight<=longCalculation.detailClientHeight+1,`${engineName}/${viewportName}: long calculation is clipped after dynamic expansion`);
        assertReadableDetailTypography(longCalculation,`${engineName}/${viewportName}/fish-complex-trade-long`);

        await installFixture(page,'fish-multi-trade');
        await page.waitForTimeout(50);
        const multiTrade=await compactMetrics(page,'fish-multi-trade');
        const multiEffects=multiTrade.detailChildren.filter(child=>!child.className.includes('trade-item-find')&&!child.className.includes('chronology-row__badge-detail'));
        assert(multiTrade.detailChildren.length===4&&multiEffects.length===2&&multiTrade.detailChildren.some(child=>child.className.includes('chronology-row__badge-detail')),`${engineName}/${viewportName}: multi-effect exchange fixture did not render every record and source label (${JSON.stringify(multiTrade.detailChildren)})`);
        assert(multiTrade.tradeCopy.left-multiTrade.tradeIcon.right>=3&&multiTrade.tradeCopy.left-multiTrade.tradeIcon.right<=5&&multiEffects.every(child=>Math.abs(child.left-multiTrade.primaryIcon.left)<=1),`${engineName}/${viewportName}: multi-effect records lost compact exchange-item spacing or their shared effect column (${JSON.stringify(multiTrade.detailChildren)})`);
        assert(multiEffects[0].top>=multiTrade.trade.bottom-1&&multiEffects[0].top<=multiTrade.trade.bottom+2&&multiEffects[1].top>=multiEffects[0].bottom-1&&multiEffects[1].top<=multiEffects[0].bottom+2,`${engineName}/${viewportName}: multi-effect records overlap or gained uneven vertical gaps (${JSON.stringify(multiTrade.detailChildren)})`);
        assert(multiTrade.detailScrollHeight<=multiTrade.detailClientHeight+1,`${engineName}/${viewportName}: multi-effect exchange disclosure clips its dynamic stack`);
        assert(multiTrade.row.height>complexTrade.row.height&&multiTrade.row.height<=176,`${engineName}/${viewportName}: disclosure height does not track its modifier count (${complexTrade.row.height}px → ${multiTrade.row.height}px)`);
        assertReadableDetailTypography(multiTrade,`${engineName}/${viewportName}/fish-multi-trade`);
        if(viewportName==='phoneReference')await page.locator('[data-history-id="fish-multi-trade"]').screenshot({path:path.join(output,`${engineName}-stacked-item-calculations-440x892.png`),animations:'disabled'});

        await installFixture(page,'transmutation-row');
        await page.waitForTimeout(50);
        const transmutation=await compactMetrics(page,'transmutation-row');
        assert(transmutation.transform,`${engineName}/${viewportName}: compact transmutation chain is missing`);
        assert(transmutation.transformBackground==='none'&&transmutation.transformBackgroundColor==='rgba(0, 0, 0, 0)'&&transmutation.transformBorder==='0px',`${engineName}/${viewportName}: transmutation still has an inner card`);
        assert(transmutation.transformArrowCount===2&&transmutation.transformSourceIconCount===1,`${engineName}/${viewportName}: transmutation is not source → trash → fish`);
        assert(transmutation.transformText.includes('Обрывок газеты')&&transmutation.transformText.includes('Рыба-меч — 20,5 кг'),`${engineName}/${viewportName}: transmutation chain lost its input or result`);
        assert(transmutation.transformObjectCopyFits&&transmutation.transformResultCopyFits&&transmutation.transformCategoryCount===1,`${engineName}/${viewportName}: transmutation input, result, weight, or category icon is clipped`);
        assert(transmutation.transformCategoryLoaded&&transmutation.transformCategoryIcon.left>=transmutation.transform.left&&transmutation.transformCategoryIcon.right<=transmutation.transform.right+1,`${engineName}/${viewportName}: transmutation weight-category icon is not visibly contained in the chain`);
        assert(transmutation.transformCategoryIconVisible&&transmutation.transformCategoryIconMargin==='0px 0px',`${engineName}/${viewportName}: transmutation weight-category icon is visually hidden or displaced`);
        assert(Math.abs((transmutation.transformCategoryIcon.left+transmutation.transformCategoryIcon.right)-(transmutation.transformCategory.left+transmutation.transformCategory.right))<=1&&Math.abs((transmutation.transformCategoryIcon.top+transmutation.transformCategoryIcon.bottom)-(transmutation.transformCategory.top+transmutation.transformCategory.bottom))<=1,`${engineName}/${viewportName}: transmutation weight-category artwork is not centered in its visible slot`);
        assert(transmutation.transformCategoryInsideResult&&transmutation.transformCategoryImmediatelyAfterWeight,`${engineName}/${viewportName}: transmutation weight-category icon is not directly after the fish weight`);
        assert(!transmutation.detailText.includes('Штурвал Наутилуса'),`${engineName}/${viewportName}: causal artifact is duplicated inside the trash transformation`);
        assert(transmutation.row.height<=108,`${engineName}/${viewportName}: transmutation disclosure is not compact (${transmutation.row.height}px)`);
        assertReadableDetailTypography(transmutation,`${engineName}/${viewportName}/transmutation-row`);

        await installFixture(page,'nautilus-row');
        await page.waitForTimeout(50);
        const nautilus=await compactMetrics(page,'nautilus-row');
        assert(nautilus.transform&&nautilus.transformBackground==='none'&&nautilus.transformBackgroundColor==='rgba(0, 0, 0, 0)'&&nautilus.transformBorder==='0px',`${engineName}/${viewportName}: Nautilus disclosure still has an inner card`);
        assert(!nautilus.transformText.includes('Штурвал Наутилуса')&&nautilus.transformText.includes('Призвано Глубоководное нечто'),`${engineName}/${viewportName}: Nautilus is duplicated instead of showing only its compact result`);
        assertReadableDetailTypography(nautilus,`${engineName}/${viewportName}/nautilus-row`);

        await installFixture(page,'abyss-transform-row');
        await page.waitForTimeout(50);
        const abyssTransform=await compactMetrics(page,'abyss-transform-row');
        assert(abyssTransform.transform&&abyssTransform.transformBackground==='none'&&abyssTransform.transformBackgroundColor==='rgba(0, 0, 0, 0)'&&abyssTransform.transformBorder==='0px',`${engineName}/${viewportName}: analogous abyss transformation still has an inner card`);
        assert(abyssTransform.transformArrowCount===2&&abyssTransform.transformSourceIconCount===1,`${engineName}/${viewportName}: analogous transformation does not use the shared compact source → input → result chain`);
        assertReadableDetailTypography(abyssTransform,`${engineName}/${viewportName}/abyss-transform-row`);

        for(const rowId of ['trade-transform-row','ethirion-transform-row','dark-coal-row']){
          await installFixture(page,rowId);
          await page.waitForTimeout(50);
          const analogous=await compactMetrics(page,rowId);
          assert(analogous.transform&&analogous.transformBackground==='none'&&analogous.transformBackgroundColor==='rgba(0, 0, 0, 0)'&&analogous.transformBorder==='0px',`${engineName}/${viewportName}/${rowId}: analogous conversion still has an inner card`);
          assert(analogous.row.height<=108,`${engineName}/${viewportName}/${rowId}: analogous conversion is not compact (${analogous.row.height}px)`);
          assert(!analogous.detailText.includes('Гнев Эфириона')&&!analogous.detailText.includes('Уголь тьмы'),`${engineName}/${viewportName}/${rowId}: conversion cause is repeated as text`);
        }

        await installFixture(page,'flippers-row');
        await page.waitForTimeout(50);
        const flippers=await compactMetrics(page,'flippers-row');
        assertReadableDetailTypography(flippers,`${engineName}/${viewportName}/flippers-row`);
        assert(flippers.detailText.includes('Каждая вторая подходящая рыба')&&flippers.detailText.includes('Множитель этих Ласт')&&flippers.detailText.includes('Участий в расчётах'),`${engineName}/${viewportName}: flipper explanation or service parameters are missing from the bonus`);
        assert(flippers.detail.height<=70,`${engineName}/${viewportName}: flipper disclosure is not compact (${flippers.detail.height}px)`);

        await installFixture(page,'essence-row');
        await page.waitForTimeout(50);
        const essence=await compactMetrics(page,'essence-row');
        assert(essence.detailText.includes('две самые лёгкие оставшиеся рыбы получают ×5 каждая')&&essence.detailText.includes('если осталась одна — ×10')&&essence.detailText.includes('если рыб нет, Эссенция не применяется'),`${engineName}/${viewportName}: Essence chronology description does not expose every final branch (${essence.detailText})`);
        assert(essence.detailScrollHeight<=essence.detailClientHeight+1,`${engineName}/${viewportName}: complete Essence description is clipped`);
        assertReadableDetailTypography(essence,`${engineName}/${viewportName}/essence-row`);
        if(viewportName==='phoneReference')await page.locator('[data-history-id="essence-row"]').screenshot({path:path.join(output,`${engineName}-essence-description-440x892.png`),animations:'disabled'});

        await installFixture(page,'fish-calculation');
        await page.waitForTimeout(50);
        const calculation=await compactMetrics(page,'fish-calculation');
        assert(calculation.detailText.includes('4,2 кг')&&calculation.detailText.includes('8,4 кг')&&calculation.detailText.includes('0,4 кг'),`${engineName}/${viewportName}: fish calculation chain is incomplete`);
        assert(!calculation.detailText.includes('каждая вторая подходящая рыба'),`${engineName}/${viewportName}: bonus explanation leaked into fish calculation`);
        assert(!calculation.flipperText.includes('Ласты')&&calculation.flipperIconLabel==='Ласты',`${engineName}/${viewportName}: standalone flipper calculation must use the labelled icon instead of a repeated item name`);
        assert(calculation.detailBorderTop==='0px'&&calculation.detailPaddingTop==='0px',`${engineName}/${viewportName}: standalone calculation still has an internal divider or extra top padding`);
        assert(calculation.fishItemImpact.top>=calculation.summary.bottom-.5&&calculation.fishItemImpact.top<=calculation.summary.bottom+3,`${engineName}/${viewportName}: standalone calculation must start below the illustrated summary (${calculation.fishItemImpact.top-calculation.summary.bottom}px)`);
        assert(Math.abs(calculation.fishItemImpactSummaryFontSize-complexTrade.flipperSummaryFontSize)<=.1&&Math.abs(calculation.fishItemImpactCalculationFontSize-complexTrade.flipperCalculationFontSize)<=.1,`${engineName}/${viewportName}: analogous calculation typography differs between standalone and exchange rows`);
        assertAlignedDirectImpacts(calculation,`${engineName}/${viewportName}/fish-calculation`);
        assertReadableDetailTypography(calculation,`${engineName}/${viewportName}/fish-calculation`);
        assert(calculation.weightResults.some(result=>result.text==='8,4 кг'&&result.className.includes('is-positive')&&result.color==='rgb(98, 232, 155)')&&calculation.weightResults.some(result=>result.text==='0,4 кг'&&result.className.includes('is-negative')&&result.color==='rgb(255, 104, 104)'),`${engineName}/${viewportName}: structured increased/decreased weights do not use direction colours (${JSON.stringify(calculation.weightResults)})`);
        if(viewportName==='phoneReference')await page.locator('[data-history-id="fish-calculation"]').screenshot({path:path.join(output,`${engineName}-standalone-item-calculation-440x892.png`),animations:'disabled'});

        for(const [rowId,label,target,equation] of [
          ['fish-mask-impact','Подводная маска','Сайда','10,0 кг × 1.5 = 15,0 кг'],
          ['fish-scuba-impact','Акваланг','Палтус','10,0 кг × 3 = 30,0 кг']
        ]){
          await installFixture(page,rowId);
          await page.waitForTimeout(50);
          const analogousImpact=await compactMetrics(page,rowId);
          assert(analogousImpact.fishItemImpact&&analogousImpact.fishItemImpactIconLabel===label,`${engineName}/${viewportName}/${rowId}: analogous fish-impact icon lost its accessible label`);
          assert(!analogousImpact.fishItemImpactText.includes(label)&&analogousImpact.fishItemImpactText.startsWith('×')&&analogousImpact.fishItemImpactText.includes(target)&&analogousImpact.fishItemImpactText.includes(equation),`${engineName}/${viewportName}/${rowId}: analogous fish impact repeats the item name or lost its multiplier → fish → calculation structure (${analogousImpact.fishItemImpactText})`);
          assert(analogousImpact.fishItemImpactCopyFits,`${engineName}/${viewportName}/${rowId}: analogous fish-impact calculation overflows its row`);
          assert(analogousImpact.fishItemImpactCalculation.top>=analogousImpact.fishItemImpactSummary.bottom-1&&Math.abs(analogousImpact.fishItemImpactCalculation.left-analogousImpact.fishItemImpactCopy.left)<=1,`${engineName}/${viewportName}/${rowId}: analogous calculation is not a distinct aligned line`);
          assert(Math.abs(analogousImpact.fishItemImpactSummaryFontSize-complexTrade.flipperSummaryFontSize)<=.1&&Math.abs(analogousImpact.fishItemImpactCalculationFontSize-complexTrade.flipperCalculationFontSize)<=.1,`${engineName}/${viewportName}/${rowId}: analogous calculation typography differs from the shared item-impact size`);
          assert(analogousImpact.detailBorderTop==='0px'&&analogousImpact.detailPaddingTop==='0px'&&analogousImpact.fishItemImpactNoteCount===0,`${engineName}/${viewportName}/${rowId}: analogous calculation has a divider, extra top padding, or repeated bonus explanation`);
          assert(analogousImpact.fishItemImpact.top>=analogousImpact.summary.bottom-.5&&analogousImpact.fishItemImpact.top<=analogousImpact.summary.bottom+3,`${engineName}/${viewportName}/${rowId}: analogous calculation must start below the illustrated summary (${analogousImpact.fishItemImpact.top-analogousImpact.summary.bottom}px)`);
          assertAlignedDirectImpacts(analogousImpact,`${engineName}/${viewportName}/${rowId}`);
          assertReadableDetailTypography(analogousImpact,`${engineName}/${viewportName}/${rowId}`);
          if(viewportName==='phoneReference'&&rowId==='fish-mask-impact')await page.locator(`[data-history-id="${rowId}"]`).screenshot({path:path.join(output,`${engineName}-mask-calculation-440x892.png`),animations:'disabled'});
        }

        await installFixture(page,'fish-abyss-impact');
        await page.waitForTimeout(50);
        const abyssImpact=await compactMetrics(page,'fish-abyss-impact');
        assert(abyssImpact.detailText.includes('Симбиот')&&abyssImpact.detailText.includes('9,9 кг')&&abyssImpact.detailText.includes('15,3 кг'),`${engineName}/${viewportName}: abyss impact fixture lost its source or calculation`);
        assertAlignedDirectImpacts(abyssImpact,`${engineName}/${viewportName}/fish-abyss-impact`);
        assertReadableDetailTypography(abyssImpact,`${engineName}/${viewportName}/fish-abyss-impact`);
        assert(abyssImpact.detailBorderTop==='0px'&&abyssImpact.detailPaddingTop==='0px',`${engineName}/${viewportName}: abyss impact has a divider or extra top padding`);
        assert(abyssImpact.weightResults.some(result=>result.text==='15,3 кг'&&result.className.includes('is-positive')&&result.color==='rgb(98, 232, 155)'),`${engineName}/${viewportName}: increased fish-impact result is not green (${JSON.stringify(abyssImpact.weightResults)})`);
        if(viewportName==='phoneReference')await page.locator('[data-history-id="fish-abyss-impact"]').screenshot({path:path.join(output,`${engineName}-abyss-impact-440x892.png`),animations:'disabled'});

        await installFixture(page,'abyss-positive-event');
        await page.waitForTimeout(50);
        const positiveWeightEvent=await compactMetrics(page,'abyss-positive-event');
        assertReadableDetailTypography(positiveWeightEvent,`${engineName}/${viewportName}/abyss-positive-event`);
        assert.deepStrictEqual(positiveWeightEvent.weightResults,[{text:'15,3 кг',className:'history-weight-result is-positive',color:'rgb(98, 232, 155)'}],`${engineName}/${viewportName}: increased event weight is not the only green result (${JSON.stringify(positiveWeightEvent.weightResults)})`);

        await installFixture(page,'abyss-negative-event');
        await page.waitForTimeout(50);
        const negativeWeightEvent=await compactMetrics(page,'abyss-negative-event');
        assertReadableDetailTypography(negativeWeightEvent,`${engineName}/${viewportName}/abyss-negative-event`);
        assert.deepStrictEqual(negativeWeightEvent.weightResults,[{text:'7,7 кг',className:'history-weight-result is-negative',color:'rgb(255, 104, 104)'}],`${engineName}/${viewportName}: decreased event weight is not the only red result (${JSON.stringify(negativeWeightEvent.weightResults)})`);
        if(viewportName==='phoneReference')await page.locator('[data-history-id="abyss-positive-event"]').screenshot({path:path.join(output,`${engineName}-abyss-event-weight-result-440x892.png`),animations:'disabled'});

        await installFixture(page,'spark-row');
        await page.waitForTimeout(50);
        const spark=await compactMetrics(page,'spark-row');
        assert(spark.detailText.includes('Понижает категорию рыб')&&spark.itemName==='Янтарь затонувших берегов'&&spark.purpose==='Предмет обмена',`${engineName}/${viewportName}: artifact description or trade item disappeared`);
        assert(spark.tradeBackground==='none'&&spark.tradeBackgroundColor==='rgba(0, 0, 0, 0)'&&spark.tradeBorder==='0px',`${engineName}/${viewportName}: artifact trade item became a nested card`);

        await installFixture(page,'blueprint-row');
        await page.waitForTimeout(50);
        const blueprint=await compactMetrics(page,'blueprint-row');
        assert(blueprint.detail.height<=56,`${engineName}/${viewportName}: DF ME reference disclosure changed height (${blueprint.detail.height}px)`);

        const metadata=await metadataMetrics(page);
        assert(metadata.every(entry=>entry.timeCount===0),`${engineName}/${viewportName}: timestamp remains in chronology metadata`);
        assert(metadata.every(entry=>!entry.badgeText&&entry.badgeTitle&&entry.badgeKey),`${engineName}/${viewportName}: source/type icon or accessible label is missing`);
        assert(metadata.every(entry=>entry.badgeWidth===42&&entry.badgeHeight===42),`${engineName}/${viewportName}: attribute icon does not match the 42px object slot (${JSON.stringify(metadata)})`);
        assert(metadata.every(entry=>entry.badgeBackground==='rgba(0, 0, 0, 0)'&&entry.badgeBorder==='0px'&&entry.badgeShadow==='none'),`${engineName}/${viewportName}: colored attribute backplate returned`);
        assert(metadata.every(entry=>entry.chevronLeft?entry.badgeRight<=entry.chevronLeft+1:true),`${engineName}/${viewportName}: attribute icon overlaps the disclosure control`);
        const closedMetadata=metadata.filter(entry=>entry.closedArtwork);
        assert(closedMetadata.length,`${engineName}/${viewportName}: closed chronology metadata fixture is missing`);
        assert(closedMetadata.every(entry=>entry.metaBackgroundImage==='none'&&entry.metaBorderTopWidth==='0px'&&entry.metaBoxShadow==='none'&&entry.metaBackdropFilter==='none'),`${engineName}/${viewportName}: closed chronology metadata still has a container backplate (${JSON.stringify(closedMetadata)})`);

        const actionMatrix=await verifyActionMatrix(page);
        actionMatrix.forEach((entry,index)=>{
          const inline=entry.buttons.length===1;
          assert(entry.height<=(inline?52:82),`${engineName}/${viewportName}: action ${index+1} enlarged its chronology row beyond the shared ${inline?'single-level':'adaptive'} contract (${entry.height}px)`);
          assert(inline
            ?entry.actionTop>=entry.summaryTop-1&&entry.actionBottom<=entry.summaryBottom+1
            :entry.actionTop>=entry.summaryBottom-1&&entry.actionBottom<=entry.rowBottom+1,
          `${engineName}/${viewportName}: action ${index+1} is outside its shared ${inline?'inline':'stacked'} slot`);
          assert(entry.actionLeft>=entry.summaryLeft+40,`${engineName}/${viewportName}: action ${index+1} left the shared text lane`);
          assert(entry.actionScrollWidth<=entry.actionClientWidth+1,`${engineName}/${viewportName}: action ${index+1} overflows its row (${entry.actionScrollWidth}px > ${entry.actionClientWidth}px)`);
          entry.buttons.forEach(button=>{
            assert(button.height<=28.5,`${engineName}/${viewportName}: action ${index+1} button exceeds compact height`);
            assert(button.scrollWidth<=button.clientWidth+1,`${engineName}/${viewportName}: action ${index+1} button text is clipped (${button.scrollWidth}px > ${button.clientWidth}px)`);
            assert(button.overflow!=='hidden'&&button.textOverflow!=='ellipsis',`${engineName}/${viewportName}: action ${index+1} button restores hidden/ellipsis text`);
          });
        });
        assert(!errors.length,`${engineName}/${viewportName}: page errors: ${errors.join('; ')}`);

        if(viewportName==='phonePortrait'){
          await installFixture(page,null);
          await page.locator('[data-history-id="fish-trade"]').screenshot({path:path.join(output,`${engineName}-trade-closed.png`),animations:'disabled'});
          await installFixture(page,'fish-trade');
          await page.screenshot({path:path.join(output,`${engineName}-mobile-390x844.png`),animations:'disabled'});
          await page.locator('[data-history-id="fish-trade"]').screenshot({path:path.join(output,`${engineName}-trade-detail.png`),animations:'disabled'});
          await installFixture(page,'fish-combined');
          const row=page.locator('[data-history-id="fish-combined"]');
          await row.screenshot({path:path.join(output,`${engineName}-combined-detail.png`),animations:'disabled'});
          await installFixture(page,'fish-complex-trade');
          await page.locator('[data-history-id="fish-complex-trade"]').screenshot({path:path.join(output,`${engineName}-complex-trade-detail.png`),animations:'disabled'});
          await installFixture(page,'flippers-row');
          await page.screenshot({path:path.join(output,`${engineName}-bonus-metadata-390x844.png`),animations:'disabled'});
          await installFixture(page,'spark-row');
          await page.screenshot({path:path.join(output,`${engineName}-artifact-trade-390x844.png`),animations:'disabled'});
          await installFixture(page,'transmutation-row');
          await page.screenshot({path:path.join(output,`${engineName}-transmutation-390x844.png`),animations:'disabled'});
          await installFixture(page,'nautilus-row');
          await page.screenshot({path:path.join(output,`${engineName}-nautilus-390x844.png`),animations:'disabled'});
          await installFixture(page,'abyss-transform-row');
          await page.locator('[data-history-id="abyss-transform-row"]').screenshot({path:path.join(output,`${engineName}-abyss-transform.png`),animations:'disabled'});
        }else if(viewportName==='phoneReference'){
          await installFixture(page,'fish-trade');
          await page.locator('[data-history-id="fish-trade"]').screenshot({path:path.join(output,`${engineName}-trade-reference-440x892.png`),animations:'disabled'});
          await installFixture(page,'fish-complex-trade');
          await page.locator('[data-history-id="fish-complex-trade"]').screenshot({path:path.join(output,`${engineName}-complex-trade-reference-440x892.png`),animations:'disabled'});
          await installFixture(page,'fish-multi-trade');
          await page.locator('[data-history-id="fish-multi-trade"]').screenshot({path:path.join(output,`${engineName}-multi-trade-reference-440x892.png`),animations:'disabled'});
        }
        report.engines[engineName][viewportName]={closedStandalone,closedCombined,coin,standalone,combined,complexTrade,multiTrade,transmutation,nautilus,abyssTransform,flippers,essence,calculation,abyssImpact,positiveWeightEvent,negativeWeightEvent,spark,blueprint,metadata,actionMatrix};
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  process.stdout.write('PASS: compact chronology disclosure and inline actions in Chromium/WebKit across phone, tablet, and desktop\n');
})().catch(error=>{
  process.stderr.write(`FAIL: ${error.stack||error}\n`);
  process.exitCode=1;
});
