const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const self=path.resolve(__filename);
const skippedDirectories=new Set(['.git','.npm-cache','.visual-test-output','For work','graphify-out','node_modules','test-results']);
const runtimeExtensions=new Set(['.bat','.cjs','.cmd','.css','.html','.js','.json','.jsonc','.jsx','.mjs','.ps1','.sh','.ts','.tsx','.webmanifest','.xml']);
const forbidden=/For(?: |%20)work(?=[\\/"'?#)]|$)/i;
const files=[];

function collect(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    if(entry.isDirectory()&&skippedDirectories.has(entry.name))continue;
    const absolute=path.join(directory,entry.name);
    if(entry.isDirectory())collect(absolute);
    else if(path.resolve(absolute)!==self&&runtimeExtensions.has(path.extname(entry.name).toLowerCase()))files.push(absolute);
  }
}

collect(root);
const violations=[];
for(const file of files){
  const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
  lines.forEach((line,index)=>{if(forbidden.test(line))violations.push(`${path.relative(root,file)}:${index+1}`);});
}

if(violations.length)throw new Error(`Runtime references to the asset intake folder are forbidden:\n${violations.join('\n')}`);
console.log(`Asset-path audit PASS: ${files.length} runtime files contain no references to the asset intake folder.`);
