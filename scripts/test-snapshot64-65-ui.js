const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const pageUrl=pathToFileURL(path.join(root,'dropfish/index.html')).href;
const output=path.join(root,'artifacts','snapshot64-65-ui');
const viewports={
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768},
  desktop:{width:1280,height:900}
};

async function installDarkEtherFixture(page){
  await page.evaluate(()=>{
    state=initialState();
    state.history=[];state.fish=[];state.castsLeft=8;
    const ether={id:'snapshot-dark-ether',key:'darkEther',name:'Тёмный эфир',used:false,charges:5,dungeonType:'astral'};
    state.dungeon.rewards.push(ether);state.dungeon.darkEtherArmedId=ether.id;
    makeFish('normal','Заброс',true,{initialWeight:3.4,fishName:'кижуч'});
    makeFish('heavy','Заброс',true,{initialWeight:12.6,fishName:'королевская макрель'});
    makeFish('giant','Заброс',true,{initialWeight:24.1,fishName:'обыкновенный зубан'});
    render();
  });
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.goto(pageUrl,{waitUntil:'load'});
        await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
        await installDarkEtherFixture(page);
        const actions=await page.evaluate(()=>[...document.querySelectorAll('.dark-ether-history-action')].map(action=>{
          const button=action.querySelector('button'),row=action.closest('.chronology-row'),actionBox=action.getBoundingClientRect(),buttonBox=button.getBoundingClientRect(),rowBox=row.getBoundingClientRect(),actionStyle=getComputedStyle(action),buttonStyle=getComputedStyle(button);
          return {text:button.textContent.trim(),buttonWidth:buttonBox.width,buttonHeight:buttonBox.height,buttonOverflow:button.scrollWidth-button.clientWidth,insideRow:buttonBox.left>=rowBox.left-1&&buttonBox.right<=rowBox.right+1&&buttonBox.top>=rowBox.top-1&&buttonBox.bottom<=rowBox.bottom+1,borderTop:actionStyle.borderTopWidth,textOverflow:buttonStyle.textOverflow,whiteSpace:buttonStyle.whiteSpace,actionWidth:actionBox.width};
        }));
        assert(actions.length===3,`${engineName}/${viewportName}: Dark Ether actions are missing`);
        assert(actions.every(item=>item.text==='Удалить результат'&&item.buttonOverflow<=1&&item.insideRow&&item.borderTop==='0px'&&item.textOverflow==='clip'&&item.whiteSpace==='nowrap'&&item.buttonHeight===28&&item.actionWidth===124),`${engineName}/${viewportName}: Dark Ether action is clipped, decorated, or oversized ${JSON.stringify(actions)}`);
        if(viewportName==='phonePortrait')await page.locator('#historyList').screenshot({path:path.join(output,`${engineName}-dark-ether.png`),animations:'disabled'});

        await page.locator('#dropfishDebugBtn').click();
        const sticky=await page.evaluate(()=>{
          const dialog=document.getElementById('dropfishDebugDialog'),card=dialog.querySelector('.debug-card'),close=card.querySelector('.modal-close'),before=close.getBoundingClientRect(),cardBox=card.getBoundingClientRect();
          card.scrollTop=card.scrollHeight;
          const after=close.getBoundingClientRect();
          return {position:getComputedStyle(close).position,scrollTop:card.scrollTop,scrollable:card.scrollHeight>card.clientHeight,beforeTop:before.top,afterTop:after.top,cardTop:cardBox.top,afterBottom:after.bottom,cardBottom:cardBox.bottom,visible:after.top>=cardBox.top-1&&after.bottom<=cardBox.bottom+1};
        });
        assert(sticky.position==='sticky'&&sticky.scrollable&&sticky.scrollTop>0&&sticky.visible&&Math.abs(sticky.afterTop-sticky.beforeTop)<=1,`${engineName}/${viewportName}: debug close control does not remain fixed while scrolling ${JSON.stringify(sticky)}`);
        if(viewportName==='phonePortrait')await page.locator('#dropfishDebugDialog .debug-card').screenshot({path:path.join(output,`${engineName}-debug-bottom.png`),animations:'disabled'});
        await page.evaluate(()=>document.querySelector('#dropfishDebugDialog .modal-close').click());
        assert(!await page.locator('#dropfishDebugDialog').evaluate(dialog=>dialog.open),`${engineName}/${viewportName}: sticky close control did not close the debug panel`);
        assert(!errors.length,`${engineName}/${viewportName}: page errors ${errors.join('; ')}`);
        await page.close();
      }
    }finally{await browser.close();}
  }
  process.stdout.write('PASS: Snapshot64-65 Dark Ether actions and sticky debug close across Chromium/WebKit\n');
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
