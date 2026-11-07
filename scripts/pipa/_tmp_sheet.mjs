import sharp from 'sharp';import fs from 'node:fs';
const ids=process.argv.slice(3);const D=process.argv[2].startsWith('/')?process.argv[2]:'';
const W=170;const comps=[];
for(const [i,id] of ids.entries()){const b=await sharp(process.env.DIR+id+'.png').resize(W-10,W-30,{fit:'inside',background:'#fff'}).flatten({background:'#ddd'}).toBuffer();
 comps.push({input:b,left:(i%6)*W+5,top:Math.floor(i/6)*W+5});
 comps.push({input:Buffer.from(`<svg width="${W}" height="20"><text x="2" y="14" font-size="11">${id}</text></svg>`),left:(i%6)*W,top:Math.floor(i/6)*W+W-22});}
await sharp({create:{width:6*W,height:Math.ceil(ids.length/6)*W,channels:3,background:'#fff'}}).composite(comps).png().toFile(process.argv[2]);
