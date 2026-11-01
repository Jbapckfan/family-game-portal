import fs from 'node:fs';
const base=new URL('../',import.meta.url),read=name=>fs.readFileSync(new URL(name,base),'utf8');
const engine=read('engine.mjs').replace(/^export /gm,''),app=read('app.mjs'),css=read('styles.css'),bank=read('bank.json');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark"><title>Alford Daily · Experimental Candidates</title><style>${css}</style></head><body><div id="app"></div><script>(()=>{'use strict';const BANK=${bank};\n${engine}\n${app}\n})();</script></body></html>`;
fs.writeFileSync(new URL('index.html',base),html);
console.log(JSON.stringify({artifact:'index.html',bytes:Buffer.byteLength(html),games:Object.keys(JSON.parse(bank).games).length,boards:Object.values(JSON.parse(bank).games).reduce((n,a)=>n+a.length,0)}));
