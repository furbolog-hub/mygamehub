const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const scriptPath=path.join(root,'dropfish','script.js');
const source=fs.readFileSync(scriptPath,'utf8');
const assetRoot=path.join(root,'dropfish','assets','icons','trash');
const output=path.join(root,'test-results','dropfish-trash-icons');
const pageUrl=pathToFileURL(path.join(root,'dropfish','index.html')).href;
const viewports={
  desktop:{width:1366,height:768},
  phonePortrait:{width:390,height:844},
  phoneLandscape:{width:844,height:390},
  tabletPortrait:{width:768,height:1024},
  tabletLandscape:{width:1024,height:768}
};
const normalize=value=>String(value).trim().toLocaleLowerCase('ru-RU').replace(/ё/g,'е');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

function extractLiteral(pattern,label,wrapper){
  const match=source.match(pattern);
  assert(match,`Не найден литерал ${label}`);
  return vm.runInNewContext(wrapper(match[1]));
}

const trashNames=extractLiteral(/trash:\s*\[([\s\S]*?)\],\s*\n\s*bonuses:/,'DATA.trash',value=>`[${value}]`);
const iconFiles=extractLiteral(/const TRASH_ICON_FILES=Object\.freeze\(\{([\s\S]*?)\}\);/,'TRASH_ICON_FILES',value=>`({${value}})`);
assert(trashNames.length===24,`DATA.trash содержит ${trashNames.length} записей вместо 24`);
assert(Object.keys(iconFiles).length===24,`TRASH_ICON_FILES содержит ${Object.keys(iconFiles).length} записей вместо 24`);
assert(new Set(Object.values(iconFiles)).size===24,'Имена файлов иконок должны быть уникальными');
for(const name of trashNames){
  const file=iconFiles[normalize(name)];
  assert(file,`Нет иконки для «${name}»`);
  assert(fs.existsSync(path.join(assetRoot,file)),`Нет файла ${file} для «${name}»`);
}
assert(source.includes("const RADIOACTIVE_TRASH_ICON_PATH='./assets/icons/radioactive/radioactive-trash.webp';"),'Изменён путь радиоактивного хлама');
const intakeFolder=['For','work'].join(' ');
for(const file of ['index.html','script.js','style.css']){
  assert(!fs.readFileSync(path.join(root,'dropfish',file),'utf8').includes(intakeFolder),`${file} ссылается на папку входящих ассетов`);
}

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const baselines={};
  let renders=0;
  for(const [engineName,browserType] of Object.entries({chromium,webkit})){
    const browser=await browserType.launch({headless:true});
    try{
      for(const [viewportName,viewport] of Object.entries(viewports)){
        const page=await browser.newPage({viewport});
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(pageUrl,{waitUntil:'load'});
        await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}body{min-height:0!important;padding:8px!important;overflow:auto!important}.history{width:min(100%,960px)!important;margin:0 auto!important}.history-list{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))!important;align-items:start!important}'});
        await page.evaluate(()=>{
          state=initialState();
          DATA.trash.forEach(name=>processTrash(name));
          render();
          const history=document.querySelector('.history');
          document.body.replaceChildren(history);
        });
        await page.waitForFunction(()=>[...document.querySelectorAll('.history-item.type-trash img')].every(image=>image.complete&&image.naturalWidth>0));
        const metrics=await page.evaluate(()=>{
          const rows=[...document.querySelectorAll('.history-item.type-trash')];
          const icons=rows.map(row=>{
            const wrapper=row.querySelector('.trash-entity-icon'),image=wrapper?.querySelector('img'),box=wrapper?.getBoundingClientRect(),imageBox=image?.getBoundingClientRect();
            return {src:(image?.getAttribute('src')||'').split('/').pop(),width:box?.width||0,height:box?.height||0,imageWidth:imageBox?.width||0,imageHeight:imageBox?.height||0,naturalWidth:image?.naturalWidth||0,naturalHeight:image?.naturalHeight||0,rowOverflow:row.scrollWidth-row.clientWidth};
          });
          return {rows:rows.length,icons,horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
        });
        assert(!errors.length,`${engineName}/${viewportName}: ошибки страницы: ${errors.join(' | ')}`);
        assert(metrics.rows===24,`${engineName}/${viewportName}: отображено ${metrics.rows} строк вместо 24`);
        assert(new Set(metrics.icons.map(icon=>icon.src)).size===24,`${engineName}/${viewportName}: иконки не уникальны`);
        assert(metrics.icons.every(icon=>icon.src!=='trash.webp'),`${engineName}/${viewportName}: использована общая иконка trash.webp`);
        assert(metrics.icons.every(icon=>icon.naturalWidth>0&&icon.naturalHeight>0),`${engineName}/${viewportName}: одна из иконок не загрузилась`);
        assert(metrics.icons.every(icon=>icon.width<=42&&icon.height<=42&&icon.imageWidth<=42&&icon.imageHeight<=42),`${engineName}/${viewportName}: иконка вышла за компактный размер 42px`);
        assert(metrics.icons.every(icon=>icon.rowOverflow<=1),`${engineName}/${viewportName}: строка хлама переполнена`);
        assert(metrics.horizontalOverflow<=1,`${engineName}/${viewportName}: горизонтальное переполнение ${metrics.horizontalOverflow}px`);
        const geometry=metrics.icons.map(icon=>[Number(icon.width.toFixed(2)),Number(icon.height.toFixed(2)),Number(icon.imageWidth.toFixed(2)),Number(icon.imageHeight.toFixed(2))]);
        if(!baselines[viewportName])baselines[viewportName]=geometry;
        else assert(JSON.stringify(geometry)===JSON.stringify(baselines[viewportName]),`${engineName}/${viewportName}: геометрия иконок отличается от Chromium`);
        await page.locator('.history').screenshot({path:path.join(output,`${engineName}-${viewportName}.png`)});
        renders++;
        await page.close();
      }
    }finally{
      await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,renders,icons:trashNames.length,viewports},null,2));
  process.stdout.write(`PASS: ${trashNames.length} индивидуальных иконки, ${renders} визуальных проверок Chromium/WebKit\n`);
})().catch(error=>{process.stderr.write(`FAIL: ${error.stack||error}\n`);process.exitCode=1;});
