import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('legacy update controls remain available',()=>{
 const html=read('Assets/Web/index.html');
 assert.match(html,/id="updateCheck"/);
 assert.match(html,/id="updateDownload"/);
 assert.match(html,/id="updateStatus"/);
});
test('05 DATA opens SpaceX, not Explorer',()=>{
 const html=read('Assets/Web/index.html');
 const native=read('../MainWindow.xaml.cs');
 const board=read('Assets/Web/spacex-board.mjs');
 assert.match(html,/05 Data – SpaceX Mission Control/);
 assert.doesNotMatch(native,/case "data":\s*if\(!await ExternalWindows\.LaunchAsync\("explorer"/);
 assert.match(board,/\[data-action="data"\]/);
});
test('release stays at 0.6.14 until validated',()=>{
 const csproj=read('../PandaLcarsTactical.csproj');
 assert.match(csproj,/<Version>0\.6\.14<\/Version>/);
});
