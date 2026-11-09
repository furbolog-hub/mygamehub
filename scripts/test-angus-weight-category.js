const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const target=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const output=path.join(root,'.visual-test-output','angus-weight-category');
const viewports={desktop:{width:1366,height:768},phonePortrait:{width:390,height:844},phoneReference:{width:440,height:892},phoneLandscape:{width:844,height:390},tabletPortrait:{width:768,height:1024},tabletLandscape:{width:1024,height:768}};
const engines={chromium,webkit};
const expectedFiles=['normal.webp','heavyweight.webp','giant.webp'];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let renders=0;
  for(const [engineName,engine] of Object.entries(engines)){
    const browser=await engine.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(String(error)));
        await page.goto(target,{waitUntil:'load'});
        const rowId=await page.evaluate(()=>{
          state=initialState();
          state.weather='calm';
          state.debuffs=[];
          const row=addHistory('Появился старина Ангус','angus','',{numbered:false});
          const gifts=[
            ['normal','белый окунь',4.2],
            ['heavy','ваху',12.4],
            ['giant','большая барракуда',29.2],
          ];
          gifts.forEach(([category,name,initialWeight],index)=>{
            const fish=makeFish(category,'Старина Ангус',false,{parentHistoryId:row.id,initialWeight,fishName:name,skipSideEvents:true});
            if(index===1){
              fish.goldenHourImpact={before:4.2,plus:3,after:7.2};
              fish.preDebuffWeight=7.2;
              fish.debuffBaseWeight=4.2;
              fish.debuffLimited=true;
              fish.debuffSource='Утка';
            }
          });
          render();
          setHistoryRowExpanded(row.id,true);
          return row.id;
        });
        await page.waitForTimeout(80);
        const metrics=await page.evaluate(id=>{
          const rect=node=>{const box=node?.getBoundingClientRect();return box?{left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height}:null;};
          const row=document.querySelector(`[data-history-id="${id}"]`);
          const scroller=document.getElementById('historyScroll');
          return {
            expanded:row?.classList.contains('is-expanded')||false,
            headerBadgeCount:row?.querySelectorAll('.history-row-head .chronology-row__badge').length||0,
            leadingIconCount:row?.querySelectorAll('.chronology-row__icon img').length||0,
            artworkCount:row?.querySelectorAll('.chronology-row__art img').length||0,
            noHeaderBadgeClass:row?.classList.contains('has-no-header-badge')||false,
            sourceText:row?.querySelector('.chronology-row__badge-detail')?.textContent.replace(/\s+/g,' ').trim()||'',
            overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            historyScrollLeft:scroller?.scrollLeft||0,
            historyScrollOverflow:scroller?(scroller.scrollWidth-scroller.clientWidth):0,
            summary:rect(row?.querySelector('.chronology-row__summary')),
            title:rect(row?.querySelector('.chronology-row__title')),
            markers:[...row.querySelectorAll('.embedded-fish-item')].map(item=>{
              const main=item.querySelector('.embedded-fish-main');
              const leading=main?.querySelector(':scope > .embedded-fish-icon');
              const attribute=main?.querySelector(':scope > .embedded-fish-attribute');
              const name=main?.querySelector(':scope > .embedded-fish-name');
              const marker=attribute?.querySelector('.fish-size-marker');
              const image=marker?.querySelector('.fish-category-icon');
              const markerStyle=marker?getComputedStyle(marker):null;
              const imageStyle=image?getComputedStyle(image):null;
              return {item:rect(item),leading:rect(leading),attribute:rect(attribute),name:rect(name),marker:rect(marker),image:rect(image),src:image?.getAttribute('src')||'',weightIconCount:item.querySelectorAll('.fish-category-icon.is-weight-category').length,baseBadgeCount:item.querySelectorAll('.base-fish-category-badge').length,correctDomOrder:leading?.nextElementSibling===attribute&&attribute?.nextElementSibling===name,overflow:markerStyle?.overflow||'',markerPosition:markerStyle?.position||'',markerDisplay:markerStyle?.display||'',markerTransform:markerStyle?.transform||'',imagePosition:imageStyle?.position||'',imageTop:imageStyle?.top||'',imageLeft:imageStyle?.left||'',imageTransform:imageStyle?.transform||'',title:item.querySelector('.embedded-fish-title')?.textContent.trim()||''};
            }),
            effects:[...row.querySelectorAll('.embedded-fish-item > .gear-impact')].map(effect=>{
              const icon=effect.querySelector(':scope > :is(.gear-icon,.fish-effect-badge-slot)');
              const image=icon?.querySelector('img');
              const copy=effect.querySelector(':scope > :not(.gear-icon):not(.fish-effect-badge-slot)');
              const summary=copy?.querySelector('.effect-impact-summary');
              const calculation=copy?.querySelector('.effect-impact-calculation');
              const strong=summary?.querySelector('strong');
              const target=summary?.querySelector('.effect-target-icon');
              return {effect:rect(effect),icon:rect(icon),image:rect(image),copy:rect(copy),summary:rect(summary),calculation:rect(calculation),target:rect(target),targetImage:rect(target?.querySelector('img')),fontStrong:strong?getComputedStyle(strong).fontSize:'',fontCalculation:calculation?getComputedStyle(calculation).fontSize:'',summaryText:summary?.textContent.replace(/\s+/g,' ').trim()||'',calculationText:calculation?.textContent.replace(/\s+/g,' ').trim()||'',targetAfterGain:strong?.nextElementSibling===target,legacyArrowCount:effect.querySelectorAll('.gear-arrow,.gear-target').length,className:effect.className};
            }),
          };
        },rowId);
        assert(metrics.expanded,`${engineName}/${viewportName}: Angus row did not expand`);
        assert(metrics.headerBadgeCount===0,`${engineName}/${viewportName}: duplicate Angus header badge remains`);
        assert(metrics.leadingIconCount===1&&metrics.artworkCount===1,`${engineName}/${viewportName}: Angus must keep one leading icon and one illustration`);
        assert(metrics.noHeaderBadgeClass,`${engineName}/${viewportName}: Angus compact grid was not applied`);
        assert(/Источник:\s*АНГУС/.test(metrics.sourceText),`${engineName}/${viewportName}: expanded Angus source text is missing`);
        assert(metrics.overflow<=1&&metrics.historyScrollOverflow<=1&&metrics.historyScrollLeft<=1,`${engineName}/${viewportName}: Angus disclosure creates horizontal scrolling ${JSON.stringify(metrics)}`);
        assert(metrics.markers.length===3,`${engineName}/${viewportName}: expected three Angus fish gifts`);
        metrics.markers.forEach((entry,index)=>{
          assert(entry.marker&&entry.image,`${engineName}/${viewportName}: ${entry.title} has no weight-category icon`);
          assert(entry.src.endsWith(`/fish-weight-categories/${expectedFiles[index]}`),`${engineName}/${viewportName}: ${entry.title} has wrong category icon ${entry.src}`);
          assert(entry.weightIconCount===1&&entry.baseBadgeCount===0,`${engineName}/${viewportName}: ${entry.title} duplicates its weight category ${JSON.stringify(entry)}`);
          assert(entry.correctDomOrder,`${engineName}/${viewportName}: ${entry.title} category icon is not immediately after the fish icon`);
          assert(entry.overflow==='visible',`${engineName}/${viewportName}: ${entry.title} category icon is clipped`);
          assert(entry.leading.right<=entry.attribute.left+1&&entry.attribute.right<=entry.name.left+1,`${engineName}/${viewportName}: ${entry.title} fish/category/name order overlaps ${JSON.stringify(entry)}`);
          assert(entry.image.left>=entry.item.left-1&&entry.image.right<=entry.item.right+1&&entry.image.top>=entry.item.top-1&&entry.image.bottom<=entry.item.bottom+1,`${engineName}/${viewportName}: ${entry.title} category icon leaves the fish row ${JSON.stringify(entry)}`);
        });
        assert(metrics.effects.length===2,`${engineName}/${viewportName}: Angus Golden Hour/weight-limit fixtures are missing`);
        metrics.effects.forEach(entry=>{
          assert(entry.icon&&entry.image&&entry.copy,`${engineName}/${viewportName}: effect lost its stable icon/copy slots ${JSON.stringify(entry)}`);
          assert(entry.icon.right<=entry.copy.left+1,`${engineName}/${viewportName}: effect icon overlaps its copy ${JSON.stringify(entry)}`);
          assert(entry.image.left>=entry.icon.left-1&&entry.image.right<=entry.icon.right+1&&entry.image.top>=entry.icon.top-1&&entry.image.bottom<=entry.icon.bottom+1,`${engineName}/${viewportName}: effect icon is clipped or escapes its slot ${JSON.stringify(entry)}`);
          assert(entry.copy.right<=entry.effect.right+1,`${engineName}/${viewportName}: effect copy leaves the row ${JSON.stringify(entry)}`);
          assert(entry.summary&&entry.calculation&&entry.calculation.top>=entry.summary.bottom-1,`${engineName}/${viewportName}: effect calculation is not below its compact summary ${JSON.stringify(entry)}`);
          assert(entry.fontStrong===entry.fontCalculation,`${engineName}/${viewportName}: effect summary/calculation typography diverges ${JSON.stringify(entry)}`);
        });
        const golden=metrics.effects.find(entry=>entry.className.includes('golden-hour-impact'));
        const limited=metrics.effects.find(entry=>entry.className.includes('fish-debuff-impact'));
        assert(golden?.target&&golden?.targetImage&&golden.targetAfterGain&&golden.legacyArrowCount===0,`${engineName}/${viewportName}: Golden Hour is not icon → gain → fish ${JSON.stringify(golden)}`);
        assert(golden.summaryText==='+3 кг'&&/4,2 кг \+ 3 кг = 7,2 кг/.test(golden.calculationText),`${engineName}/${viewportName}: Golden Hour compact text is wrong ${JSON.stringify(golden)}`);
        assert(limited?.summaryText==='Утка'&&/7,2 кг → 4,2 кг/.test(limited.calculationText),`${engineName}/${viewportName}: weight-limit compact text is wrong ${JSON.stringify(limited)}`);
        assert(golden.fontStrong===limited.fontStrong&&golden.fontCalculation===limited.fontCalculation,`${engineName}/${viewportName}: Golden Hour and weight-limit font sizes differ ${JSON.stringify({golden,limited})}`);
        assert(errors.length===0,`${engineName}/${viewportName}: page errors ${errors.join(' | ')}`);
        await page.screenshot({path:path.join(output,`${engineName}-${viewportName}.png`),fullPage:true,animations:'disabled'});renders++;
        await page.close();
      }
    }finally{await browser.close();}
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,engines:Object.keys(engines),viewports},null,2));
  process.stdout.write(`PASS: ${renders} Angus category renders across Chromium and WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
