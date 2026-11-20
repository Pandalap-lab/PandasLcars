import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('all application scripts parse before packaging',()=>{
 for(const name of readdirSync(new URL('Assets/Web/',root)).filter(x=>/\.(?:js|mjs)$/.test(x))){
  const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL('Assets/Web/'+name,root))],{encoding:'utf8'});
  assert.equal(result.status,0,name+'\n'+result.stderr);
 }
});
test('packaged references exist and all release versions agree',()=>{
 const html=read('Assets/Web/index.html');
 for(const match of html.matchAll(/(?:src|href)="([^"#:]+\.(?:m?js|css))"/g))assert(existsSync(new URL('Assets/Web/'+match[1],root)),match[1]);
 const project=read('PandaLcarsTactical.csproj'),version=project.match(/<Version>([\d.]+)<\/Version>/)?.[1];
 assert(version);assert(html.includes('PandasLcars v'+version));
 assert(project.includes('<AssemblyVersion>'+version+'.0</AssemblyVersion>'));
 assert(project.includes('<FileVersion>'+version+'.0</FileVersion>'));
});
