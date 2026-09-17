const fs=require('fs');
const path=require('path');

const source=fs.readFileSync(path.resolve(__dirname,'../dropfish/script.js'),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const between=(start,end)=>{
  const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
  assert(from>=0&&to>from,`Не найден участок ${start} … ${end}`);
  return source.slice(from,to);
};
const keys=section=>[...section.matchAll(/key:'([^']+)'/g)].map(match=>match[1]);

const ordinaryKeys=keys(between('const TRADE_ITEMS','const RIFT_TRADE_ITEMS'));
const islandKeys=keys(between('const ISLAND_TRADE_ITEMS','const ISLAND_CACHE_TRADE_ITEMS'));
const overlap=ordinaryKeys.filter(key=>islandKeys.includes(key));
assert(!overlap.length,`Пересечение обычных и островных предметов: ${overlap.join(', ')}`);
assert(!ordinaryKeys.includes('tidePearl'),'Жемчужина прилива ошибочно находится в обычном пуле');
assert(islandKeys.includes('tidePearl'),'Жемчужина прилива отсутствует в островном пуле');

const islandGenerators=between('function rollDestructiveTidesReward','function startIslandExpedition');
assert(!/pick\(TRADE_ITEMS\)/.test(islandGenerators),'Островной генератор использует общий пул TRADE_ITEMS');
assert(/pick\(ISLAND_CACHE_TRADE_ITEMS\)/.test(islandGenerators),'Островные тайники не используют изолированный пул');

assert(/function addRiftLoot[\s\S]*?assertRiftLootSource\(item\)/.test(source),'На входе добычи Разлома отсутствует проверка источника');
assert(/function commitRiftLoot\(r\)[\s\S]*?r\.loot\.forEach\(item=>assertRiftLootSource/.test(source),'Перед переносом добычи Разлома отсутствует проверка источника');
assert(/function islandLocationOutcome[\s\S]*?assertIslandLootSource\(reward/.test(source),'После генерации островной награды отсутствует проверка источника');
assert(/function commitIslandLoot\(a,[\s\S]*?a\.loot\.forEach\(item=>assertIslandLootSource/.test(source),'Перед переносом островной добычи отсутствует проверка источника');
assert(/item\.riftItem&&ISLAND_TRADE_KEYS\.has\(item\.key\)/.test(source),'Восстановление сессии не очищает островные предметы из добычи Разлома');

process.stdout.write(`PASS: источники добычи разделены; обычных предметов ${ordinaryKeys.length}, островных ${islandKeys.length}\n`);
