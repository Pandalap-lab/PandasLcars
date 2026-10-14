"use strict";
(()=>{
 const tile=document.querySelector('.dust-panel'),home=document.createComment('environment tile home');tile.before(home);
 const dialog=document.createElement('dialog');dialog.id='environmentDialog';document.body.append(dialog);
 const open=document.createElement('button');open.id='environmentExpand';open.textContent='⤢';open.title='Warnungen, Saharastaub und Blitze vergrößern';tile.querySelector('h2').append(open);
 const close=document.createElement('button');close.id='environmentClose';close.textContent='ZURÜCK';close.hidden=true;tile.append(close);
 open.onclick=()=>{dialog.append(tile);dialog.showModal();open.hidden=true;close.hidden=false;};close.onclick=()=>dialog.close();
 dialog.onclose=()=>{home.after(tile);open.hidden=false;close.hidden=true;open.focus();};
 const brief=document.createElement('div');brief.id='lightningBrief';tile.append(brief);
 const info=document.getElementById('lightningInfo');
 function update(){const lines=info.textContent.split('\n');brief.textContent='BLITZE · '+(lines.find(l=>l.startsWith('Daten:'))||'noch keine Daten').replace('Daten: ','')+(lines.some(l=>/ausgeschaltet/.test(l))?' · AUS':'');brief.title=info.textContent;}
 new MutationObserver(update).observe(info,{childList:true,characterData:true,subtree:true});update();
})();
