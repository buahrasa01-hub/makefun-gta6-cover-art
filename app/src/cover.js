const GRADES={vice:{tint:[255,104,128,.19],low:'#ffb06a',glow:'#ff6497'},neon:{tint:[68,48,146,.27],low:'#d552b5',glow:'#8a67ff'},palm:{tint:[201,142,83,.18],low:'#f4a36c',glow:'#b8cf90'}};
export function getPanelRects(layout,width,height){
 const gap=Math.max(5,Math.round(Math.min(width,height)*.009));
 if(layout==='strips'){const p=(width-gap*2)/3;return[0,1,2].map(i=>({x:i*(p+gap),y:0,w:p,h:height}));}
 if(layout==='grid'){const w=(width-gap)/2,h=(height-gap)/2;return[{x:0,y:0,w,h},{x:w+gap,y:0,w,h},{x:0,y:h+gap,w,h},{x:w+gap,y:h+gap,w,h}];}
 const heroW=width*.64-gap/2,sideX=heroW+gap,sideW=width-sideX;
 return[{x:0,y:0,w:heroW,h:height},{x:sideX,y:0,w:sideW,h:(height-gap)/2},{x:sideX,y:(height+gap)/2,w:sideW,h:(height-gap)/2}];
}
function drawImagePanel(ctx,rect,photo,crop,grade,index){
 const {x,y,w,h}=rect;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 if(photo&&photo.naturalWidth){const scale=Math.max(w/photo.naturalWidth,h/photo.naturalHeight)*(crop.zoom||1),sw=photo.naturalWidth*scale,sh=photo.naturalHeight*scale;
  const mx=Math.max(0,(sw-w)/2),my=Math.max(0,(sh-h)/2),dx=x+(w-sw)/2+(crop.panX||0)*mx*2,dy=y+(h-sh)/2+(crop.panY||0)*my*2;ctx.drawImage(photo,dx,dy,sw,sh);
 }else{const sky=ctx.createLinearGradient(x,y,x+w,y+h);sky.addColorStop(0,'#162b46');sky.addColorStop(.5,'#bd5679');sky.addColorStop(1,'#f9a763');ctx.fillStyle=sky;ctx.fillRect(x,y,w,h);ctx.fillStyle='#152230';ctx.fillRect(x,y+h*.7,w,h*.3);for(let n=0;n<8;n++){const bx=x+w*(.08+n*.12),bh=h*(.1+(n*7%5)*.035);ctx.fillStyle='#252337';ctx.fillRect(bx,y+h*.68-bh,w*.055,bh);}}
 const t=grade.tint;ctx.fillStyle='rgba('+t[0]+','+t[1]+','+t[2]+','+t[3]+')';ctx.fillRect(x,y,w,h);
 const shade=ctx.createLinearGradient(x,y,x,y+h);shade.addColorStop(0,'rgba(9,12,30,.09)');shade.addColorStop(.55,'rgba(16,9,26,.03)');shade.addColorStop(1,'rgba(8,8,20,.56)');ctx.fillStyle=shade;ctx.fillRect(x,y,w,h);
 if(index===0){const sun=ctx.createRadialGradient(x+w*.68,y+h*.25,0,x+w*.68,y+h*.25,w*.6);sun.addColorStop(0,grade.glow+'55');sun.addColorStop(1,'transparent');ctx.fillStyle=sun;ctx.fillRect(x,y,w,h);}ctx.restore();
}
function drawCaption(ctx,state,width,height,grade){
 const text=(state.caption||'AFTER THE GLOW').trim().toUpperCase();if(!text)return;const margin=width*.055,fontPx=width*(state.fontSize||88)/1080;
 ctx.save();ctx.font='900 '+fontPx+'px ViceDisplay, Impact, sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';const words=text.split(/\s+/),lines=[];let line='',max=width*.9;
 for(const word of words){const test=line?line+' '+word:word;if(line&&ctx.measureText(test).width>max){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);
 const widest=Math.max(...lines.map(v=>ctx.measureText(v).width));if(widest>max)ctx.font='900 '+fontPx*max/widest+'px ViceDisplay, Impact, sans-serif';
 const lineH=fontPx*.79,blockH=lineH*lines.length,bottom=state.position!=='top',base=bottom?height*.83-blockH/2:height*.18+blockH/2;
 const fill=ctx.createLinearGradient(0,base-blockH/2,0,base+blockH/2);fill.addColorStop(0,'#fff9e5');fill.addColorStop(.44,'#ffe2bc');fill.addColorStop(1,grade.low);ctx.shadowColor='#140c1d';ctx.shadowBlur=width*.013;ctx.shadowOffsetY=width*.006;
 lines.forEach((str,i)=>{const y=base+(i-(lines.length-1)/2)*lineH;if(state.outline!==false){ctx.lineJoin='round';ctx.lineWidth=Math.max(3,width*.009);ctx.strokeStyle='#241322';ctx.strokeText(str,margin,y);ctx.lineWidth=Math.max(1,width*.003);ctx.strokeStyle='#fff2dd';ctx.strokeText(str,margin,y);}ctx.fillStyle=fill;ctx.fillText(str,margin,y);});
 ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.font='700 '+Math.max(10,width*.014)+'px ui-monospace,monospace';ctx.fillStyle='#fff3df';ctx.globalAlpha=.94;ctx.fillText('VICE CITY  /  FLORIDA',margin,bottom?height*.94:height*.075);ctx.textAlign='right';ctx.fillStyle=grade.low;ctx.fillText('NO. 06  —  AFTER HOURS',width-margin,bottom?height*.94:height*.075);ctx.restore();
}
export function composeCover(canvas,state,width,height){
 const ctx=canvas.getContext('2d',{alpha:false});canvas.width=width;canvas.height=height;const grade=GRADES[state.grade]||GRADES.vice;ctx.fillStyle='#10111c';ctx.fillRect(0,0,width,height);
 getPanelRects(state.layout,width,height).forEach((rect,i)=>{const pi=state.panelPhotos&&state.panelPhotos[i]!==undefined?state.panelPhotos[i]:(i===0?0:i%Math.max(1,(state.photos||[]).length));drawImagePanel(ctx,rect,(state.photos||[])[pi],(state.crops||[])[i]||{zoom:1,panX:0,panY:0},grade,i);});
 const pad=Math.max(8,width*.014);ctx.strokeStyle='#fce6d6';ctx.globalAlpha=.72;ctx.lineWidth=Math.max(1,width*.0015);ctx.strokeRect(pad,pad,width-pad*2,height-pad*2);ctx.globalAlpha=1;
 drawCaption(ctx,state,width,height,grade);
 const vignette=ctx.createRadialGradient(width/2,height*.45,width*.16,width/2,height*.45,width*.78);vignette.addColorStop(.55,'transparent');vignette.addColorStop(1,'rgba(7,7,17,.42)');ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);return canvas;
}
