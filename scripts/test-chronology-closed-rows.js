const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;
const output=path.join(root,'artifacts','chronology-closed-rows');
const viewport={width:390,height:844};

async function installFixtures(page){
  await page.evaluate(()=>{
    state=initialState();
    state.history=[];
    state.historyUi={expandedId:null,filter:'all',introducedKeys:[],initialized:true,compactVersion:4};
    const now=Date.now();
    const fish={id:uid(),name:'атлантическая треска',weight:4.82,originalWeight:4.82,category:'normal',source:'Заброс',direct:true,removed:false,tags:[]};
    state.fish.push(fish);
    state.history=[
      {id:'closed-fish',type:'fish',text:'Атлантическая треска — 4,82 кг',detail:'',numbered:false,createdAt:now,fishId:fish.id,fishSource:'Заброс'},
      {id:'closed-trash',type:'trash',text:'Пластиковая бутылка',detail:'',numbered:false,createdAt:now-60000},
      {id:'closed-event',type:'event',text:'С моря надвигается шторм',detail:'(Погодное предупреждение)',numbered:false,createdAt:now-120000},
      {id:'closed-bonus',type:'bonus',text:'Счастливый поплавок',detail:'(Хлам не расходует заброс)',numbered:false,createdAt:now-180000},
      {id:'closed-trade',type:'tradeShip',text:'Прибыло торговое судно',detail:'(Обмен доступен)',numbered:false,createdAt:now-240000,tradeShipSource:'natural'},
      {id:'closed-dungeon',type:'dungeon',text:'Бездна астрального шёпота',detail:'(Вход в подземелье обнаружен)',numbered:false,createdAt:now-300000,dungeonType:'astral',dungeonAction:'dive'},
      {id:'closed-rift',type:'rift',text:'Открыт Древний разлом: Сингулярная яма',detail:'(Исследование Разлома начато)',numbered:false,createdAt:now-360000,riftType:'singularity',riftId:'closed-fixture-rift'}
    ];
    state.history.push(
      {id:'legacy-bonus-fallback',type:'bonus',text:'Legacy unknown bonus',detail:'',numbered:false,createdAt:now-420000},
      {id:'legacy-debuff-fallback',type:'debuff',text:'Legacy unknown debuff',detail:'',numbered:false,createdAt:now-480000},
      {id:'legacy-epic-fallback',type:'epic',text:'Legacy unknown epic artifact',detail:'',numbered:false,createdAt:now-540000},
      {id:'legacy-legendary-fallback',type:'legendary',text:'Legacy unknown legendary artifact',detail:'',numbered:false,createdAt:now-600000},
      {id:'legacy-mythic-fallback',type:'mythic',text:'Legacy unknown mythic artifact',detail:'',numbered:false,createdAt:now-660000},
      {id:'legacy-fish-fallback',type:'fish',text:'Legacy fish without entity',detail:'',numbered:false,createdAt:now-720000,fishId:'missing-legacy-fish'}
    );
    render();
    const scroll=document.getElementById('historyScroll');
    if(scroll)scroll.scrollTop=0;
  });
}

async function waitForArtwork(page){
  await page.waitForFunction(()=>[...document.querySelectorAll('.chronology-row__art img')].every(image=>image.complete&&image.naturalWidth>0));
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('.chronology-row__art img')].map(image=>image.decode?.().catch(()=>{})||Promise.resolve())));
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const report={passed:true,viewport,engines:{}};
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      const page=await browser.newPage({viewport});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(pageUrl,{waitUntil:'load'});
      await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
      await installFixtures(page);
      await waitForArtwork(page);

      const metrics=await page.evaluate(()=>{
        const rows=[...document.querySelectorAll('.chronology-row')];
        return rows.map(row=>{
          const box=row.getBoundingClientRect();
          const art=row.querySelector('.chronology-row__art');
          const artImage=art?.querySelector('img');
          const artBox=art?.getBoundingClientRect();
          const meta=row.querySelector('.chronology-row__meta');
          const metaBox=meta?.getBoundingClientRect();
          const title=row.querySelector('.chronology-row__title');
          const summary=row.querySelector('.chronology-row__summary');
          const summaryBox=summary?.getBoundingClientRect();
          const overlay=art?getComputedStyle(art,'::after'):null;
          return {
            id:row.dataset.historyId,
            type:row.dataset.historyType,
            height:box.height,
            width:box.width,
            integrated:row.classList.contains('has-integrated-artwork'),
            artWidth:artBox?.width||0,
            artHeight:artBox?.height||0,
            summaryWidth:summaryBox?.width||0,
            summaryHeight:summaryBox?.height||0,
            artRightGap:artBox?Math.abs(box.right-artBox.right):null,
            artInlineStyle:art?.getAttribute('style')||'',
            artBackground:art?getComputedStyle(art).backgroundImage:'none',
            artSource:artImage?.currentSrc||artImage?.src||'',
            metaWidth:metaBox?.width||0,
            titleShadow:title?getComputedStyle(title).textShadow:'none',
            summaryBackground:summary?getComputedStyle(summary).backgroundImage:'none',
            overlay:overlay?.backgroundImage||'none',
            expanded:row.classList.contains('is-expanded'),
            iconHasImage:Boolean(row.querySelector('.chronology-row__icon img')),
            iconSource:row.querySelector('.chronology-row__icon img')?.getAttribute('src')||'',
            badgeSource:row.querySelector('.chronology-row__badge img')?.getAttribute('src')||'',
            iconFallbackVisible:[...row.querySelectorAll('.chronology-row__icon .chronology-fallback-glyph')].some(glyph=>!glyph.hidden)
          };
        });
      });

      assert.strictEqual(metrics.length,13,`${engineName}: fixture row count changed`);
      const heights=metrics.map(row=>row.height);
      assert(Math.max(...heights)-Math.min(...heights)<=1,`${engineName}: closed row heights differ (${heights.join(', ')})`);
      for(const row of metrics){
        assert(!row.expanded,`${engineName}/${row.type}: fixture row expanded unexpectedly`);
        if(row.id.startsWith('legacy-'))continue;
        if(['fish','trash','event'].includes(row.type)){
          assert(!row.integrated&&row.artWidth===0,`${engineName}/${row.type}: simple row received artwork`);
        }else{
          assert(row.integrated,`${engineName}/${row.type}: illustrated row lacks integrated artwork`);
          assert(Math.abs(row.artWidth-row.summaryWidth)<=.5&&Math.abs(row.artHeight-row.summaryHeight)<=.5,`${engineName}/${row.type}: wide artwork does not cover the summary (${row.artWidth}x${row.artHeight} versus ${row.summaryWidth}x${row.summaryHeight})`);
          assert(row.artRightGap<=10,`${engineName}/${row.type}: artwork is detached from the row edge`);
          assert(row.metaWidth<=96,`${engineName}/${row.type}: metadata zone is not compact`);
          assert(row.titleShadow!=='none'&&row.summaryBackground==='none'&&row.overlay.includes('gradient'),`${engineName}/${row.type}: wide-art readability layers are missing ${JSON.stringify({titleShadow:row.titleShadow,summaryBackground:row.summaryBackground,overlay:row.overlay})}`);
        }
      }
      for(const row of metrics.filter(row=>row.id.startsWith('legacy-'))){
        assert(row.iconHasImage&&!row.iconFallbackVisible&&row.iconSource!==row.badgeSource,`${engineName}/${row.type}: legacy row leaked a text/emoji fallback or duplicated its badge (${JSON.stringify({image:row.iconHasImage,fallback:row.iconFallbackVisible,icon:row.iconSource,badge:row.badgeSource})})`);
      }
      assert(!errors.length,`${engineName}: page errors: ${errors.join('; ')}`);

      await page.screenshot({path:path.join(output,`${engineName}-mobile-390x844.png`),animations:'disabled'});
      const groups={fish:['closed-fish'],trash:['closed-trash'],event:['closed-event'],bonus:['closed-bonus'],tradeDungeonRift:['closed-trade','closed-dungeon','closed-rift']};
      for(const [name,ids] of Object.entries(groups)){
        const boxes=await Promise.all(ids.map(id=>page.locator(`[data-history-id="${id}"]`).boundingBox()));
        const left=Math.min(...boxes.map(box=>box.x));
        const top=Math.min(...boxes.map(box=>box.y));
        const right=Math.max(...boxes.map(box=>box.x+box.width));
        const bottom=Math.max(...boxes.map(box=>box.y+box.height));
        await page.screenshot({path:path.join(output,`${engineName}-${name}-closed.png`),clip:{x:left,y:top,width:right-left,height:bottom-top},animations:'disabled'});
      }
      report.engines[engineName]={rows:metrics};
      await page.close();
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  process.stdout.write('PASS: unified closed chronology rows at 390x844 in Chromium and WebKit\n');
})().catch(error=>{
  process.stderr.write(`FAIL: ${error.stack||error}\n`);
  process.exitCode=1;
});
