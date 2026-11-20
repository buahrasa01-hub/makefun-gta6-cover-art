import { composeCover, getPanelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas=document.querySelector('#coverCanvas');
const params=new URLSearchParams(location.search);
const sizes={ '1080x1080':[1080,1080], '1080x1350':[1080,1350], '1920x1080':[1920,1080] };
const state={photos:[],photoNames:[],panelPhotos:[0,1,0,1],crops:[],layout:'hero',grade:'vice',caption:'AFTER THE GLOW',position:'bottom',fontSize:88,outline:true};
let activePanel=0,selectedPhoto=0,drag=null;
const $=s=>document.querySelector(s);
function setCropDefaults(){state.crops=Array.from({length:4},()=>({zoom:1,panX:0,panY:0}));}
setCropDefaults();
function selectedSize(){return sizes[$('#sizeSelect').value]||sizes['1920x1080'];}
function render(){const [w,h]=selectedSize();composeCover(canvas,state,w,h);$('#canvasDimensions').textContent=w+' × '+h+' PX';$('#zoom').value=state.crops[activePanel].zoom;$('#zoomValue').textContent=Number(state.crops[activePanel].zoom).toFixed(1)+'×';}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});}
async function addSample(name){const src='samples/'+name+'.jpg';let index=state.photoNames.indexOf(src);if(index<0){const img=await loadImage(src);index=state.photos.push(img)-1;state.photoNames.push(src);}selectedPhoto=index;return index;}
function selectSample(name){addSample(name).then(i=>{state.panelPhotos[activePanel]=i;document.querySelectorAll('.sample-card').forEach(b=>b.classList.toggle('selected',b.dataset.sample===name));render();}).catch(()=>{});}
function updatePhotoCount(){$('#photoCount').textContent=String(state.photos.length).padStart(2,'0');}
function bindControls(){
 document.querySelectorAll('.sample-card').forEach(b=>b.addEventListener('click',()=>selectSample(b.dataset.sample)));
 $('#photoInput').addEventListener('change',async e=>{for(const file of e.target.files){if(!file.type.startsWith('image/'))continue;const url=URL.createObjectURL(file);try{const img=await loadImage(url);selectedPhoto=state.photos.push(img)-1;state.photoNames.push(file.name);state.panelPhotos[activePanel]=selectedPhoto;}catch{URL.revokeObjectURL(url);}}updatePhotoCount();render();e.target.value='';});
 document.querySelectorAll('.layout-choice').forEach(b=>b.addEventListener('click',()=>{state.layout=b.dataset.layout;document.querySelectorAll('.layout-choice').forEach(x=>x.classList.toggle('active',x===b));render();}));
 document.querySelectorAll('.grade-choice').forEach(b=>b.addEventListener('click',()=>{state.grade=b.dataset.grade;document.querySelectorAll('.grade-choice').forEach(x=>x.classList.toggle('active',x===b));render();}));
 document.querySelectorAll('.segmented button').forEach(b=>b.addEventListener('click',()=>{state.position=b.dataset.position;document.querySelectorAll('.segmented button').forEach(x=>x.classList.toggle('active',x===b));render();}));
 $('#panelSelect').addEventListener('change',e=>{activePanel=Number(e.target.value);selectedPhoto=state.panelPhotos[activePanel]||0;$('#zoom').value=state.crops[activePanel].zoom;$('#zoomValue').textContent=Number(state.crops[activePanel].zoom).toFixed(1)+'×';render();});
 $('#zoom').addEventListener('input',e=>{state.crops[activePanel].zoom=Number(e.target.value);render();});
 $('#fitBtn').addEventListener('click',()=>{state.crops[activePanel]={zoom:1,panX:0,panY:0};render();});
 $('#caption').addEventListener('input',e=>{state.caption=e.target.value;render();});
 $('#typeSize').addEventListener('input',e=>{state.fontSize=Number(e.target.value);$('#sizeValue').textContent=e.target.value;render();});
 $('#outlineToggle').addEventListener('change',e=>{state.outline=e.target.checked;render();});
 $('#sizeSelect').addEventListener('change',render);
 canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,w:r.width,h:r.height};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const c=state.crops[activePanel];c.panX=Math.max(-1,Math.min(1,c.panX+(e.clientX-drag.x)/drag.w));c.panY=Math.max(-1,Math.min(1,c.panY+(e.clientY-drag.y)/drag.h));drag.x=e.clientX;drag.y=e.clientY;render();});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 $('#exportBtn').addEventListener('click',()=>exportCover());
}
function exportCover(){const [w,h]=selectedSize(),out=document.createElement('canvas');composeCover(out,state,w,h);out.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vice-sunset-'+w+'x'+h+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');}
function applyQuery(){
 const layout=params.get('layout');if(['hero','strips','grid'].includes(layout)){state.layout=layout;document.querySelectorAll('.layout-choice').forEach(b=>b.classList.toggle('active',b.dataset.layout===layout));}
 const grade=params.get('grade');if(['vice','neon','palm'].includes(grade)){state.grade=grade;document.querySelectorAll('.grade-choice').forEach(b=>b.classList.toggle('active',b.dataset.grade===grade));}
 const size=params.get('size');if(sizes[size])$('#sizeSelect').value=size;
 if(params.has('caption')){$('#caption').value=params.get('caption');state.caption=params.get('caption');}
}
async function selfTest(){await document.fonts.load('900 88px ViceDisplay');await document.fonts.ready;const test=document.createElement('canvas');composeCover(test,state,640,360);test.toBlob(async blob=>{if(!blob){document.title='EXPORT_FAIL no blob';return;}const bytes=new Uint8Array(await blob.arrayBuffer()),magic=[137,80,78,71,13,10,26,10];document.title=magic.every((v,i)=>bytes[i]===v)?'EXPORT_OK '+bytes.length:'EXPORT_FAIL bad png';},'image/png');}
async function start(){bindControls();applyQuery();const shot=params.get('shot');if(shot){await runShot(shot,params,async name=>{const i=await addSample(name);state.panelPhotos=[i,i,i,i];});}
 else{const first=await addSample('boulevard'),second=await addSample('pier');state.panelPhotos=[first,second,first,second];}
 updatePhotoCount();if(params.get('shot')==='cover'){$('.app-shell').classList.add('cover-only');}
 await document.fonts.load('900 88px ViceDisplay');await document.fonts.ready;render();if(params.get('selftest')==='1')await selfTest();
 if(params.has('shot'))await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));if(params.has('shot'))window.__shotReady=true;
}
start().catch(()=>{document.title='APP_ERROR';});
