const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','snapshots-79-81');
const viewports={
  desktop:{width:1366,height:768},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768}
};
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
        const pageErrors=[];
        page.on('pageerror',error=>pageErrors.push(error.message));
        await page.goto(target,{waitUntil:'load'});
        await page.evaluate(()=>{
          state=initialState();
          state.weather='storm';
          const abyss=catchAbyssalLife('cast','parasite');
          const mask=grantBonus('Подводная маска');
          window.__snapshotRows={decision:abyss.rowId,mask:mask.historyRowId};
          render();
        });
        await page.waitForTimeout(180);

        const metrics=await page.evaluate(()=>{
          const rect=node=>{
            const box=node.getBoundingClientRect();
            return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height};
          };
          const textRects=node=>{
            const range=document.createRange();
            range.selectNodeContents(node);
            return [...range.getClientRects()].filter(box=>box.width>1&&box.height>1).map(box=>({left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height}));
          };
          const decision=document.querySelector(`[data-history-id="${window.__snapshotRows.decision}"]`);
          const summary=decision.querySelector('.chronology-row__summary');
          const titleText=decision.querySelector('.chronology-row__title-text');
          const actions=decision.querySelector('.history-row-actions');
          const buttons=[...actions.querySelectorAll('button')];
          const mask=document.querySelector(`[data-history-id="${window.__snapshotRows.mask}"]`);
          const maskSummary=mask.querySelector('.chronology-row__summary');
          const label=document.querySelector('.active-effects-rail__label');
          const count=document.getElementById('effectCount');
          const labelStyle=getComputedStyle(label),countStyle=getComputedStyle(count);
          return {
            overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            decision:{
              row:rect(decision),summary:rect(summary),actions:rect(actions),buttons:buttons.map(rect),
              titleRects:textRects(titleText),titleBox:rect(titleText),titleClientWidth:titleText.clientWidth,titleStyle:{display:getComputedStyle(titleText).display,maxWidth:getComputedStyle(titleText).maxWidth,width:getComputedStyle(titleText).width,paddingRight:getComputedStyle(titleText.parentElement).paddingRight},titleScrollOverflow:Math.max(titleText.scrollWidth-titleText.clientWidth,titleText.scrollHeight-titleText.clientHeight),
              inline:decision.classList.contains('has-inline-history-action'),stacked:decision.classList.contains('has-stacked-history-actions')
            },
            effects:{
              labelText:label.textContent.trim(),labelBorder:[labelStyle.borderTopWidth,labelStyle.borderRightWidth,labelStyle.borderBottomWidth,labelStyle.borderLeftWidth],
              labelBackground:labelStyle.backgroundColor,labelBackgroundImage:labelStyle.backgroundImage,labelRadius:labelStyle.borderRadius,
              countBorder:[countStyle.borderTopWidth,countStyle.borderRightWidth,countStyle.borderBottomWidth,countStyle.borderLeftWidth]
            },
            mask:{
              expandable:mask.classList.contains('is-expandable'),chevrons:mask.querySelectorAll('.chronology-row__chevron').length,
              ariaExpanded:maskSummary.getAttribute('aria-expanded'),hasToggle:maskSummary.hasAttribute('data-history-toggle')
            }
          };
        });

        assert(pageErrors.length===0,`${engineName}/${viewportName}: page errors ${pageErrors.join(' | ')}`);
        assert(metrics.overflow<=1,`${engineName}/${viewportName}: document overflow ${metrics.overflow}px`);
        const d=metrics.decision;
        assert(d.inline&&!d.stacked,`${engineName}/${viewportName}: two-choice abyss decision fell back to a detached action row`);
        assert(d.actions.top>=d.summary.top-1&&d.actions.bottom<=d.summary.bottom+1,`${engineName}/${viewportName}: abyss actions left the shared summary plane`);
        assert(d.buttons.length===2&&!intersects(d.buttons[0],d.buttons[1]),`${engineName}/${viewportName}: abyss buttons overlap`);
        assert(d.buttons.every(button=>button.left>=d.row.left-1&&button.right<=d.row.right+1),`${engineName}/${viewportName}: abyss button escaped its row`);
        assert(d.titleRects.length>=1&&d.titleRects.length<=2,`${engineName}/${viewportName}: abyss title uses ${d.titleRects.length} lines instead of at most two ${JSON.stringify(d)}`);
        if(viewportName==='phonePortrait')assert(d.titleRects.length===2,`${engineName}/${viewportName}: long abyss title did not wrap to two lines`);
        assert(d.titleRects.every(line=>d.buttons.every(button=>!intersects(line,button))),`${engineName}/${viewportName}: abyss title text intersects its actions`);
        assert(d.titleScrollOverflow<=1,`${engineName}/${viewportName}: abyss title is clipped by ${d.titleScrollOverflow}px`);

        assert(metrics.effects.labelText==='Эффекты',`${engineName}/${viewportName}: active-effect label changed unexpectedly`);
        assert(metrics.effects.labelBorder.every(width=>width==='0px')&&metrics.effects.labelBackground==='rgba(0, 0, 0, 0)'&&metrics.effects.labelBackgroundImage==='none',`${engineName}/${viewportName}: active-effect label still looks like a separate pill ${JSON.stringify(metrics.effects)}`);
        assert(metrics.effects.countBorder.some(width=>width!=='0px'),`${engineName}/${viewportName}: effect count lost its compact counter backplate`);

        assert(metrics.mask.expandable&&metrics.mask.hasToggle&&metrics.mask.chevrons===1&&metrics.mask.ariaExpanded==='false',`${engineName}/${viewportName}: diving-mask row has no collapsed disclosure affordance ${JSON.stringify(metrics.mask)}`);
        await page.locator(`[data-history-id="${await page.evaluate(()=>window.__snapshotRows.mask)}"] .chronology-row__summary`).click();
        const expanded=await page.evaluate(()=>{
          const row=document.querySelector(`[data-history-id="${window.__snapshotRows.mask}"]`);
          const summary=row.querySelector('.chronology-row__summary');
          const detail=row.querySelector('.history-row-details');
          return {expanded:row.classList.contains('is-expanded'),aria:summary.getAttribute('aria-expanded'),text:detail?.textContent.replace(/\s+/g,' ').trim()||'',visible:detail?.getBoundingClientRect().height>0};
        });
        assert(expanded.expanded&&expanded.aria==='true'&&expanded.visible,`${engineName}/${viewportName}: diving-mask disclosure did not open`);
        assert(expanded.text.includes('Каждая оставшаяся рыба')&&expanded.text.includes('Активных Масок')&&expanded.text.includes('общий множитель'),`${engineName}/${viewportName}: diving-mask explanation is incomplete (${expanded.text})`);

        if(viewportName==='phonePortrait')await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),animations:'disabled'});
        await page.close();
      }
      process.stdout.write(`${engineName}: snapshots 79-81 PASS\n`);
    }finally{
      await browser.close();
    }
  }
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
