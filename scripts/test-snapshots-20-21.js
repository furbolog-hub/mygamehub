const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','snapshots-20-21');
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const engines={chromium,webkit};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const intersects=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;

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
          state.weather='calm';
          const abyss=catchAbyssalLife('cast','parasite');
          const decisionRow=state.history.find(row=>row.id===abyss.rowId);

          const fish=makeFish('normal','Заброс',true,{initialWeight:9.6,fishName:'Морской чёрт'});
          const fishRow=state.history.find(row=>row.fishId===fish.id);
          fishRow.detail='';
          const definition=TRADE_ITEMS.find(item=>item.key==='seaSerpentFang');
          const tradeItem={id:uid(),key:definition.key,name:definition.name,icon:definition.icon,fishId:fish.id,historyRowId:fishRow.id,exchanged:true,abyssConsumed:true,destroyedByParasite:true,abyssChange:{kind:'destroyed',source:'Паразит',label:'Уничтожен Паразитом'}};
          state.tradeItems.push(tradeItem);fishRow.tradeItemId=tradeItem.id;
          addHistory('Обнаружены паразитические свойства','abyssal','(Паразит поглотил предмет обмена «Клык морского змея»)',{numbered:false,abyssPersonality:'parasite',abyssManifestation:true});
          state.historyUi.expandedIds=[fishRow.id];
          window.__snapshotRows={decision:decisionRow.id,fish:fishRow.id};
          render();
        });
        await page.waitForFunction(()=>{const row=document.querySelector(`[data-history-id="${window.__snapshotRows.decision}"]`),image=row?.querySelector('.chronology-row__art img');return Boolean(image?.complete&&image.naturalWidth);});
        await page.waitForTimeout(250);

        const result=await page.evaluate(()=>{
          const rect=node=>{const box=node.getBoundingClientRect();return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height};};
          const textRects=node=>{const range=document.createRange();range.selectNodeContents(node);return [...range.getClientRects()].filter(box=>box.width>1&&box.height>1).map(box=>({left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height}));};
          const decision=document.querySelector(`[data-history-id="${window.__snapshotRows.decision}"]`);
          const summary=decision.querySelector('.chronology-row__summary');
          const title=decision.querySelector('.chronology-row__title');
          const titleText=decision.querySelector('.chronology-row__title-text');
          const actions=decision.querySelector('.history-row-actions');
          const decisionArt=decision.querySelector('.chronology-row__art');
          const decisionArtImage=decisionArt?.querySelector('img');
          const buttons=[...actions.querySelectorAll('button')];
          const fish=document.querySelector(`[data-history-id="${window.__snapshotRows.fish}"]`);
          const fishSummary=fish.querySelector('.chronology-row__summary');
          const details=fish.querySelector('.history-row-details');
          const terminal=fish.querySelector('.trade-item-find.is-abyss-removed');
          const icon=terminal.querySelector('.trade-item-spark');
          const iconImage=icon.querySelector('img');
          const copy=terminal.querySelector('.trade-item-find-copy');
          const name=copy.querySelector(':scope > strong');
          const status=terminal.querySelector('.trade-item-used');
          const purpose=terminal.querySelector('.trade-item-purpose');
          const terminalStyle=getComputedStyle(terminal);
          const iconImageStyle=getComputedStyle(iconImage);
          const copyStyle=getComputedStyle(copy);
          const statusStyle=getComputedStyle(status);
          return {
            pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            decision:{row:rect(decision),summary:rect(summary),title:rect(title),titleLines:textRects(titleText),actions:rect(actions),art:rect(decisionArt),artHidden:decisionArt?.hidden||false,artDisplay:decisionArt?getComputedStyle(decisionArt).display:'',rowClass:decision.className,artSource:decisionArtImage?.getAttribute('src')||'',artLoaded:Boolean(decisionArtImage?.naturalWidth),buttons:buttons.map(rect),buttonOverflow:buttons.map(button=>button.scrollWidth-button.clientWidth),titleOverflow:Math.max(titleText.scrollWidth-titleText.clientWidth,titleText.scrollHeight-titleText.clientHeight),titleText:titleText.textContent.trim()},
            fish:{row:rect(fish),summary:rect(fishSummary),details:rect(details),terminal:rect(terminal),icon:rect(icon),iconImage:rect(iconImage),copy:copy?rect(copy):null,name:rect(name),status:rect(status),purpose:purpose?.textContent.trim()||'',terminalDisplay:terminalStyle.display,terminalColumns:terminalStyle.gridTemplateColumns,terminalBackground:terminalStyle.backgroundColor,terminalBackgroundImage:terminalStyle.backgroundImage,terminalBorder:[terminalStyle.borderTopWidth,terminalStyle.borderRightWidth,terminalStyle.borderBottomWidth,terminalStyle.borderLeftWidth],terminalShadow:terminalStyle.boxShadow,iconImageOpacity:Number(iconImageStyle.opacity),iconImageFilter:iconImageStyle.filter,copyFontSize:parseFloat(copyStyle.fontSize),statusFontSize:parseFloat(statusStyle.fontSize),statusInsideCopy:copy.contains(status),terminalOverflowX:terminal.scrollWidth-terminal.clientWidth,terminalOverflowY:terminal.scrollHeight-terminal.clientHeight,detailsOverflow:details.scrollHeight-details.clientHeight,itemMentions:(fish.textContent.match(/Клык морского змея/g)||[]).length,children:[...details.children].map(child=>({className:child.className,text:child.textContent.trim(),box:rect(child)}))}
          };
        });
        const d=result.decision,f=result.fish;
        assert(result.pageOverflow<=1,`${engineName}/${viewportName}: page overflow ${result.pageOverflow}px`);
        assert(d.actions.top>=d.summary.top-1&&d.actions.bottom<=d.summary.bottom+1,`${engineName}/${viewportName}: abyss actions left the shared summary plane`);
        assert(d.titleLines.length>=1&&d.titleLines.length<=2&&d.titleLines.every(line=>!intersects(line,d.actions)),`${engineName}/${viewportName}: abyss actions cover the two-line title ${JSON.stringify(d)}`);
        assert(d.buttons.length===2&&!intersects(d.buttons[0],d.buttons[1]),`${engineName}/${viewportName}: abyss buttons overlap`);
        assert(d.buttons.every(button=>button.left>=d.row.left-1&&button.right<=d.row.right+1&&button.top>=d.row.top-1&&button.bottom<=d.row.bottom+1),`${engineName}/${viewportName}: abyss button is outside its row`);
        assert(d.buttonOverflow.every(value=>value<=1),`${engineName}/${viewportName}: abyss button label is clipped`);
        assert(d.titleText.includes('Неизвестная абиссальная форма жизни')&&d.titleOverflow<=1,`${engineName}/${viewportName}: abyss title is clipped (${d.titleOverflow}px)`);
        assert(d.artLoaded&&d.artSource.endsWith('/assets/chronology-row-art/abyssal-unknown.webp'),`${engineName}/${viewportName}: unknown abyssal decision uses the wrong artwork (${d.artSource})`);
        assert(Math.abs(d.art.width-d.summary.width)<=1&&Math.abs(d.art.height-d.summary.height)<=1,`${engineName}/${viewportName}: abyssal decision artwork does not cover its fixed summary plane ${JSON.stringify({art:d.art,summary:d.summary,hidden:d.artHidden,display:d.artDisplay,rowClass:d.rowClass})}`);
        assert(f.details.top-f.summary.bottom>=-12&&f.details.top-f.summary.bottom<=6,`${engineName}/${viewportName}: fish disclosure overlap/gap ${f.details.top-f.summary.bottom}px`);
        assert(f.terminalOverflowX<=1&&f.terminalOverflowY<=1&&f.detailsOverflow<=1,`${engineName}/${viewportName}: destroyed trade item is clipped ${JSON.stringify({terminalOverflowX:f.terminalOverflowX,terminalOverflowY:f.terminalOverflowY,detailsOverflow:f.detailsOverflow,terminal:f.terminal,details:f.details,children:f.children})}`);
        assert(f.icon.left>=f.terminal.left-1&&f.icon.right<=f.terminal.right+1&&f.status.left>=f.terminal.left-1&&f.status.right<=f.terminal.right+1,`${engineName}/${viewportName}: destroyed trade item content escapes its line`);
        assert(f.copy&&f.purpose==='Предмет обмена'&&f.itemMentions===1,`${engineName}/${viewportName}: destroyed trade item copy is incomplete or duplicated`);
        assert(!intersects(f.name,f.status),`${engineName}/${viewportName}: destroyed trade item status overlaps its name`);
        assert(f.statusInsideCopy,`${engineName}/${viewportName}: terminal status escaped the shared copy column`);
        assert(f.terminalDisplay==='grid'&&f.terminalColumns.trim().split(/\s+/).length===2,`${engineName}/${viewportName}: terminal detail does not use the shared two-column record (${f.terminalDisplay}; ${f.terminalColumns})`);
        assert(f.terminalBackground==='rgba(0, 0, 0, 0)'&&f.terminalBackgroundImage==='none'&&f.terminalBorder.every(value=>value==='0px')&&f.terminalShadow==='none',`${engineName}/${viewportName}: terminal detail regained a nested backplate (${JSON.stringify({background:f.terminalBackground,backgroundImage:f.terminalBackgroundImage,border:f.terminalBorder,shadow:f.terminalShadow})})`);
        assert(f.iconImage.width>=56&&f.iconImage.height>=56&&f.iconImageOpacity>=.85,`${engineName}/${viewportName}: terminal effect icon is not clearly visible (${JSON.stringify({icon:f.iconImage,opacity:f.iconImageOpacity,filter:f.iconImageFilter})})`);
        assert(f.copyFontSize>=10&&f.statusFontSize>=10,`${engineName}/${viewportName}: terminal effect copy became unreadably small (${f.copyFontSize}px/${f.statusFontSize}px)`);
        assert(f.row.height<=105,`${engineName}/${viewportName}: expanded fish row is not compact (${f.row.height}px)`);

        await page.locator(`[data-history-id="${await page.evaluate(()=>window.__snapshotRows.fish)}"]`).screenshot({path:path.join(output,`${engineName}-${viewportName}-terminal-row.png`),animations:'disabled'});
        await page.evaluate(()=>document.querySelector(`[data-history-id="${window.__snapshotRows.decision}"]`)?.scrollIntoView({block:'center'}));
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),fullPage:true});
        await page.locator(`[data-history-id="${await page.evaluate(()=>window.__snapshotRows.decision)}"] [data-abyss-decision="keep"]`).click();
        const resolved=await page.evaluate(()=>{
          const row=state.history.find(item=>item.id===window.__snapshotRows.decision);
          const element=document.querySelector(`[data-history-id="${window.__snapshotRows.decision}"]`);
          const art=element?.querySelector('.chronology-row__art img');
          return {status:state.abyssal.entity?.status,decision:row?.abyssDecision,buttons:element?.querySelectorAll('[data-abyss-decision]').length,artSource:art?.getAttribute('src')||'',artFilter:art?getComputedStyle(art).filter:''};
        });
        assert(resolved.status==='retained'&&!resolved.decision&&resolved.buttons===0,`${engineName}/${viewportName}: abyss decision buttons do not resolve cleanly ${JSON.stringify(resolved)}`);
        assert(resolved.artSource.endsWith('/assets/chronology-row-art/abyssal-unknown.webp'),`${engineName}/${viewportName}: resolved abyssal row did not retain the unknown-life artwork (${resolved.artSource})`);
        assert(!resolved.artFilter.includes('grayscale(1)'),`${engineName}/${viewportName}: retained abyssal artwork became grayscale (${resolved.artFilter})`);
        await page.evaluate(()=>{
          state.abyssal.entity=null;
          const entity=catchAbyssalLife('rift','parasite');
          window.__snapshotRows.removed=entity.rowId;
          render();
        });
        await page.locator(`[data-history-id="${await page.evaluate(()=>window.__snapshotRows.removed)}"] [data-abyss-decision="remove"]`).click();
        const removed=await page.evaluate(()=>{
          const row=state.history.find(item=>item.id===window.__snapshotRows.removed);
          const element=document.querySelector(`[data-history-id="${window.__snapshotRows.removed}"]`);
          const art=element?.querySelector('.chronology-row__art img');
          return {removed:row?.abyssRemoved,decision:row?.abyssDecision,rowClass:element?.className||'',buttons:element?.querySelectorAll('[data-abyss-decision]').length,artSource:art?.getAttribute('src')||'',artFilter:art?getComputedStyle(art).filter:''};
        });
        assert(removed.removed&&!removed.decision&&removed.buttons===0,`${engineName}/${viewportName}: remove decision did not resolve cleanly ${JSON.stringify(removed)}`);
        assert(removed.artSource.endsWith('/assets/chronology-row-art/abyssal-unknown.webp'),`${engineName}/${viewportName}: removed abyssal row did not retain the unknown-life artwork (${removed.artSource})`);
        assert(removed.rowClass.includes('is-unknown-abyss-removed')&&removed.artFilter.includes('grayscale(1)'),`${engineName}/${viewportName}: removed abyssal artwork did not become grayscale (${JSON.stringify(removed)})`);
        await page.close();
      }
      process.stdout.write(`${engineName}: snapshots 20-21 PASS\n`);
    }finally{await browser.close();}
  }
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
