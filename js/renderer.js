/* ═══════════════ renderer.js ═══════════════
   그래픽 자산/캐시 · 지형 청크 · 적/플레이어 스프라이트 · 카메라 · 레이어별 draw */
"use strict";
/* 카메라: 부드러운 흔들림(사인 노이즈) + 이동 방향 시선 선행 + 방향성 임펄스 */
function updateCamera(dt){
 cam.t+=dt;
 const tx=player.moving?Math.cos(player.aim)*30:0,ty=player.moving?Math.sin(player.aim)*22:0,k=Math.min(1,dt*2.5);
 cam.lx+=(tx-cam.lx)*k;cam.ly+=(ty-cam.ly)*k;
 const dmp=Math.exp(-dt*10);cam.kx*=dmp;cam.ky*=dmp;
 shake=Math.max(0,shake-dt*28);
 const s=shake*S.shake,kk=S.shake;
 cam.x=player.x+cam.lx+cam.kx*kk+s*(Math.sin(cam.t*53.1)+Math.sin(cam.t*37.7+1.3))*.5;
 cam.y=player.y+cam.ly+cam.ky*kk+s*(Math.sin(cam.t*47.3+.7)+Math.sin(cam.t*29.9+2.1))*.5;
}
/* ── 그래픽 자산 ── */
function h2(x,y){let n=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return((n^(n>>>16))>>>0)/4294967296}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=h2(xi,yi),b=h2(xi+1,yi),c=h2(xi,yi+1),d=h2(xi+1,yi+1);return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v}
function fbm(x,y){return vnoise(x,y)*.55+vnoise(x*2.1+17.3,y*2.1-9.1)*.3+vnoise(x*4.3-31.7,y*4.3+5.9)*.15}
function seeded(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
const mkCanvas=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c};
/* 등급별 경험치 보석 스프라이트 */
const GC=[["#3cc8f0","#a6f3ff","#57dfff","d"],["#4fdc6a","#b8ffc4","#6bff8a","d"],["#a56bff","#e0c8ff","#c39aff","h"],["#ffb43a","#fff0b0","#ffd06a","s"],["#ff4d7a","#ffd0e0","#ff7aa0","s"]];
const gemTiers=GC.map(([c,l,glow,shape])=>{
 const cv=mkCanvas(64,64),g=cv.getContext("2d");g.translate(32,32);
 g.shadowBlur=14;g.shadowColor=glow;g.fillStyle=c;g.strokeStyle=l;g.lineWidth=1.6;g.beginPath();
 if(shape==="d"){g.moveTo(0,-19);g.lineTo(13,-3);g.lineTo(0,19);g.lineTo(-13,-3)}
 else if(shape==="h"){for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/2;g.lineTo(Math.cos(a)*17,Math.sin(a)*17)}}
 else{for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?8:20;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}}
 g.closePath();g.fill();g.shadowBlur=0;g.stroke();
 g.fillStyle=l;g.globalAlpha=.55;g.beginPath();g.arc(-4,-6,5,0,7);g.fill();return cv;
});
/* 발광 스프라이트 — 매 프레임 shadowBlur·그라디언트 생성 대신 미리 렌더링 */
const glow=(size,stops)=>{const c=mkCanvas(size,size),g=c.getContext("2d"),h=size/2,gr=g.createRadialGradient(h,h,0,h,h,h);for(const[o,col]of stops)gr.addColorStop(o,col);g.fillStyle=gr;g.fillRect(0,0,size,size);return c};
const playerGlow=glow(220,[[.03,"rgba(130,150,255,.16)"],[1,"rgba(130,150,255,0)"]]);
const LIGHT=glow(128,[[0,"rgba(0,0,0,1)"],[.45,"rgba(0,0,0,.75)"],[1,"rgba(0,0,0,0)"]]);   // 조명 마스크 (destination-out)
const GLOWC=new Map();   // 색깔별 발광 스프라이트 캐시 (가산 합성용)
function glowSpr(c){let s=GLOWC.get(c);if(!s){s=glow(128,[[0,c],[.25,c],[1,"rgba(0,0,0,0)"]]);GLOWC.set(c,s)}return s}
/* 적 그림자 / 상태이상 표시 스프라이트 */
const SHADOW=(()=>{const c=mkCanvas(64,24),g=c.getContext("2d");g.fillStyle="rgba(0,0,0,.38)";g.beginPath();g.ellipse(32,12,31,11,0,0,7);g.fill();return c})();
const FROST=(()=>{const c=mkCanvas(48,48),g=c.getContext("2d");g.strokeStyle="rgba(190,240,255,.85)";g.lineWidth=2.5;g.setLineDash([6,5]);g.beginPath();g.arc(24,24,21,0,7);g.stroke();g.setLineDash([]);g.fillStyle="rgba(220,250,255,.9)";for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;g.beginPath();g.arc(24+Math.cos(a)*21,24+Math.sin(a)*21,2.4,0,7);g.fill()}return c})();
const POIS=(()=>{const c=mkCanvas(48,48),g=c.getContext("2d");g.fillStyle="rgba(140,235,100,.8)";for(const[x,y,r]of[[10,14,3.5],[36,10,2.8],[40,30,3.2],[14,36,2.6],[26,6,2.2]]){g.beginPath();g.arc(x,y,r,0,7);g.fill()}return c})();
const ICE=(()=>{const c=mkCanvas(64,64),g=c.getContext("2d");g.translate(32,32);
 const gr=g.createLinearGradient(-24,-28,20,28);gr.addColorStop(0,"rgba(235,252,255,.75)");gr.addColorStop(1,"rgba(120,200,240,.5)");
 g.fillStyle=gr;g.strokeStyle="rgba(255,255,255,.9)";g.lineWidth=2;g.beginPath();
 for(const[x,y]of[[-22,-8],[-10,-28],[12,-24],[26,-4],[20,22],[-4,28],[-24,16]])g.lineTo(x,y);g.closePath();g.fill();g.stroke();
 g.strokeStyle="rgba(255,255,255,.55)";g.lineWidth=1.5;g.beginPath();g.moveTo(-12,-16);g.lineTo(-4,4);g.moveTo(8,-14);g.lineTo(14,6);g.stroke();return c})();
const FLAME=(()=>{const c=mkCanvas(32,40),g=c.getContext("2d");
 const f=(x,s,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(x,40-26*s);g.quadraticCurveTo(x+9*s,40-10*s,x,40);g.quadraticCurveTo(x-9*s,40-10*s,x,40-26*s);g.fill()};
 f(9,.8,"#ff5a1e");f(22,.95,"#ff5a1e");f(16,1.2,"#ff7a2a");f(16,.7,"#ffd06a");f(9,.45,"#ffe08a");return c})();
const SPARK=(()=>{const c=mkCanvas(48,48),g=c.getContext("2d");g.translate(24,24);g.strokeStyle="#fff4a0";g.lineWidth=2;g.lineJoin="round";
 for(let i=0;i<3;i++){const a=i*2.1;g.beginPath();g.moveTo(Math.cos(a)*8,Math.sin(a)*8);g.lineTo(Math.cos(a+.3)*14,Math.sin(a+.3)*14);g.lineTo(Math.cos(a-.1)*17,Math.sin(a-.1)*17);g.lineTo(Math.cos(a+.2)*22,Math.sin(a+.2)*22);g.stroke()}return c})();
const DROPS=(()=>{const c=mkCanvas(32,32),g=c.getContext("2d");g.fillStyle="#e0203e";
 for(const[x,y,s]of[[8,10,1],[22,6,.8],[16,20,1.1]]){g.beginPath();g.moveTo(x,y-5*s);g.quadraticCurveTo(x+4*s,y+1,x,y+4*s);g.quadraticCurveTo(x-4*s,y+1,x,y-5*s);g.fill()}return c})();
const MARK=(()=>{const c=mkCanvas(32,32),g=c.getContext("2d");g.translate(16,16);g.strokeStyle="#ffd36a";g.lineWidth=2;
 g.beginPath();g.arc(0,0,9,0,7);g.stroke();g.beginPath();g.moveTo(0,-14);g.lineTo(0,-5);g.moveTo(0,5);g.lineTo(0,14);g.moveTo(-14,0);g.lineTo(-5,0);g.moveTo(5,0);g.lineTo(14,0);g.stroke();
 g.fillStyle="#ff4a3a";g.beginPath();g.arc(0,0,2.5,0,7);g.fill();return c})();
/* 바닥 자국 스프라이트 */
const DEC={
 scorch:glow(96,[[0,"rgba(20,12,8,.8)"],[.55,"rgba(30,18,10,.45)"],[1,"rgba(0,0,0,0)"]]),
 frost:(()=>{const c=glow(96,[[0,"rgba(200,240,255,.55)"],[.6,"rgba(150,210,240,.25)"],[1,"rgba(0,0,0,0)"]]),g=c.getContext("2d");g.translate(48,48);g.strokeStyle="rgba(235,250,255,.6)";g.lineWidth=2;for(let i=0;i<6;i++){const a=i*Math.PI/3;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*34,Math.sin(a)*34);g.stroke()}return c})(),
 poison:glow(96,[[0,"rgba(120,220,70,.5)"],[.6,"rgba(80,160,50,.3)"],[1,"rgba(0,0,0,0)"]])
};
const SPLAT=new Map();
function splatSpr(col){
 let s=SPLAT.get(col);if(s)return s;
 const c=mkCanvas(64,64),g=c.getContext("2d"),r=seeded(col.length*97+col.charCodeAt(1));g.translate(32,32);g.fillStyle=col;
 g.beginPath();g.arc(0,0,13,0,7);g.fill();
 for(let i=0;i<9;i++){const a=r()*6.28,d=12+r()*14,rr=2+r()*5;g.beginPath();g.arc(Math.cos(a)*d,Math.sin(a)*d,rr,0,7);g.fill()}
 g.globalCompositeOperation="source-atop";g.fillStyle="rgba(0,0,0,.35)";g.fillRect(-32,-32,64,64);
 SPLAT.set(col,c);return c;
}

/* ── 지형: 256px 청크를 한 번 그려 캐시 ──
   1) 32×32 저해상도 색 필드(노이즈)를 부드럽게 확대 → 수채화 같은 바닥
   2) 흙길 / 석판 광장 / 풀결 텍스처
   3) 32px 격자마다 해시로 소품 배치 (스테이지별), 빛나는 소품은 광원 목록에 등록 */
const CT=4,CS=CT*TS,chunks=new Map();let chunkStage=-1;
const LOWN=32,LOWM=LOWN+2,LOWC=mkCanvas(LOWM,LOWM),LOWG=LOWC.getContext("2d"),LOWD=LOWG.createImageData(LOWM,LOWM),EMG=mkCanvas(1,1).getContext("2d");
function groundField(wx,wy){ // 반환: [r,g,b, 길(0~1), 광장(0/1)]
 const P=STAGE_LOOK[selSt].ground,n=fbm(wx/520,wy/520),d=fbm(wx/150+50,wy/150-20),pn=Math.abs(fbm(wx/700+100,wy/700-60)-.5);
 const path=Math.max(0,1-pn/.045),plaza=fbm(wx/420-40,wy/420+70)>(selSt===1?.6:.72)?1:0;
 let t=Math.min(1,Math.max(0,(n-.3)/.45)),r=P[0][0]+(P[1][0]-P[0][0])*t,g=P[0][1]+(P[1][1]-P[0][1])*t,b=P[0][2]+(P[1][2]-P[0][2])*t;
 const sh=Math.max(0,(.36-n)/.2);if(sh>0){const k=Math.min(1,sh);r+=(P[2][0]-r)*k;g+=(P[2][1]-g)*k;b+=(P[2][2]-b)*k}
 const pk=Math.min(1,path*1.4);if(pk>0){r+=(P[3][0]-r)*pk;g+=(P[3][1]-g)*pk;b+=(P[3][2]-b)*pk}
 const j=(d-.5)*26;return[r+j,g+j,b+j*.8,path,plaza];
}
function getChunk(cx,cy,now){
 const k=(cx+32768)*65536+cy+32768;let c=chunks.get(k);
 if(c){c.u=now;return c}
 if(chunks.size>=90){let ok,ou=1e18;for(const[kk,v]of chunks)if(v.u<ou){ou=v.u;ok=kk}chunks.delete(ok)}
 const cv=mkCanvas(CS,CS),g=cv.getContext("2d"),x0=cx*CS,y0=cy*CS,st=selSt,lights=[];
 // 1) 저해상도 색 필드
 const D_=LOWD.data,step=CS/LOWN;
 // 가장자리 1칸 여유를 두고 샘플링 → 이웃 청크와 보간 결과가 이어져 경계 이음새가 생기지 않음
 const EC=STAGE_LOOK[st].em,lava=!!EC,EM=lava?EMG.createImageData(LOWM,LOWM):null;   // em: 길(용암/독늪/별빛)이 스스로 빛나는 색
 for(let j=0;j<LOWM;j++)for(let i=0;i<LOWM;i++){const f=groundField(x0+(i-.5)*step,y0+(j-.5)*step),o=(j*LOWM+i)*4;D_[o]=f[0];D_[o+1]=f[1];D_[o+2]=f[2];D_[o+3]=255;
  if(lava){const a=Math.max(0,Math.min(1,(f[3]-.3)*2.2));EM.data[o]=EC[0];EM.data[o+1]=Math.min(255,EC[1]+60*a);EM.data[o+2]=EC[2];EM.data[o+3]=a*255}}
 let em=null;if(lava){em=mkCanvas(LOWM,LOWM);em.getContext("2d").putImageData(EM,0,0)}   // 용암 발광 마스크 (조명 위에 가산 합성)
 LOWG.putImageData(LOWD,0,0);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(LOWC,-step,-step,CS+step*2,CS+step*2);
 const rnd=seeded(cx*73856093^cy*19349663);
 // 2) 석판 광장 / 풀결
 for(let j=0;j<8;j++)for(let i=0;i<8;i++){
  const wx=x0+i*32+16,wy=y0+j*32+16,f=groundField(wx,wy),px=i*32,py=j*32;
  if(f[4]){ // 석판
   const P=STAGE_LOOK[st].plaza||STAGE_LOOK[st].ground[3],v=h2(wx>>5,wy>>5);
   if(v<.9){const sh=(v-.5)*22;g.fillStyle=`rgb(${P[0]+sh},${P[1]+sh},${P[2]+sh})`;g.fillRect(px+1,py+1,30,30);
    g.fillStyle="rgba(255,255,255,.06)";g.fillRect(px+1,py+1,30,3);g.fillStyle="rgba(0,0,0,.22)";g.fillRect(px+1,py+28,30,3);
    if(v<.18){g.strokeStyle="rgba(0,0,0,.35)";g.lineWidth=1;g.beginPath();g.moveTo(px+4+v*60,py+3);g.lineTo(px+14,py+16);g.lineTo(px+8+v*40,py+29);g.stroke()}
    if(st===1&&v>.72){g.fillStyle="rgba(70,110,70,.35)";g.beginPath();g.arc(px+6+v*20,py+26,6,0,7);g.fill()}}
  }else if(st===0&&f[3]<.3){ // 풀결
   for(let q=0;q<5;q++){const bx=px+rnd()*32,by=py+rnd()*32,l=3+rnd()*4,sh=rnd()<.5?"rgba(120,170,90,.35)":"rgba(20,40,24,.35)";
    g.strokeStyle=sh;g.lineWidth=1.2;g.beginPath();g.moveTo(bx,by);g.lineTo(bx+(rnd()-.5)*3,by-l);g.stroke()}
  }else if(st===1&&f[3]<.3&&rnd()<.5){ // 폐허: 잔돌
   g.fillStyle="rgba(20,16,28,.35)";g.beginPath();g.ellipse(px+rnd()*32,py+rnd()*32,1.5+rnd()*2,1+rnd(),0,0,7);g.fill()}
  else if(st===2){
   if(f[3]>.5){ // 용암 강: 식어 가는 껍질 + 밝은 흐름
    g.fillStyle="rgba(255,236,150,.35)";g.beginPath();g.ellipse(px+6+rnd()*20,py+6+rnd()*20,3+rnd()*4,1.5+rnd()*2,rnd()*3,0,7);g.fill();
    if(rnd()<.55){g.fillStyle="rgba(70,26,16,.5)";g.beginPath();g.ellipse(px+6+rnd()*20,py+6+rnd()*20,2+rnd()*4,1.5+rnd()*3,rnd()*3,0,7);g.fill()}
   }else if(f[3]>.25){ // 강가: 불씨 점
    if(rnd()<.5){g.fillStyle="rgba(255,170,80,.55)";g.fillRect(px+rnd()*30,py+rnd()*30,1.6,1.6)}
   }else if(rnd()<.6){ // 재와 현무암 조각
    g.fillStyle=rnd()<.5?"rgba(20,14,14,.45)":"rgba(90,80,80,.25)";g.beginPath();g.ellipse(px+rnd()*32,py+rnd()*32,1.5+rnd()*2.5,1+rnd()*1.4,0,0,7);g.fill();
    if(rnd()<.15){g.strokeStyle="rgba(10,6,6,.5)";g.lineWidth=1;g.beginPath();const cx_=px+rnd()*32,cy_=py+rnd()*32;g.moveTo(cx_,cy_);g.lineTo(cx_+rnd()*14-7,cy_+rnd()*10);g.lineTo(cx_+rnd()*20-10,cy_+rnd()*16);g.stroke()}
   }
  }
  else if(st===3){ // 독버섯 늪: 늪 거품 · 이끼 얼룩
   if(f[3]>.5){if(rnd()<.6){g.strokeStyle="rgba(200,255,170,.4)";g.lineWidth=1;g.beginPath();g.arc(px+6+rnd()*20,py+6+rnd()*20,1.5+rnd()*2.5,0,7);g.stroke()}
    if(rnd()<.4){g.fillStyle="rgba(30,60,30,.45)";g.beginPath();g.ellipse(px+6+rnd()*20,py+6+rnd()*20,4,2.4,rnd()*3,0,7);g.fill()}}
   else if(rnd()<.6){g.fillStyle=rnd()<.5?"rgba(60,100,70,.35)":"rgba(10,20,20,.35)";g.beginPath();g.ellipse(px+rnd()*32,py+rnd()*32,2+rnd()*4,1.2+rnd()*2,0,0,7);g.fill()}
  }
  else if(st===4){ // 태엽 성채: 금속 판 리벳 · 놋쇠 레일
   if(f[3]>.5){g.fillStyle="rgba(255,220,140,.25)";g.fillRect(px+4,py+14,24,2);g.fillStyle="rgba(60,40,10,.35)";g.fillRect(px+4,py+17,24,1.5)}
   else{if(((wx>>5)+(wy>>5))&1){g.fillStyle="rgba(0,0,0,.08)";g.fillRect(px,py,32,32)}g.fillStyle="rgba(200,190,170,.28)";for(const[a,b]of[[3,3],[28,3],[3,28],[28,28]])g.fillRect(px+a,py+b,1.6,1.6)}
  }
  else if(st===5){ // 별의 심연: 반짝이는 별가루
   if(rnd()<.55){const c=rnd();g.fillStyle=c<.3?"rgba(255,255,255,.75)":c<.6?"rgba(190,160,255,.6)":"rgba(120,200,255,.5)";const sz=rnd()<.15?2:1.1;g.fillRect(px+rnd()*31,py+rnd()*31,sz,sz)}
   if(f[3]>.5&&rnd()<.5){g.fillStyle="rgba(230,220,255,.35)";g.beginPath();g.ellipse(px+6+rnd()*20,py+6+rnd()*20,3+rnd()*3,1,rnd()*3,0,7);g.fill()}
  }
 }
 // 3) 소품 (이웃 칸까지 그려서 청크 경계에서 잘리지 않게)
 g.save();g.translate(-x0,-y0);
 for(let j=-1;j<=8;j++)for(let i=-1;i<=8;i++){
  const gx=(x0>>5)+i,gy=(y0>>5)+j,hv=h2(gx*7+3,gy*13-5);if(hv>.16)continue;
  const wx=gx*32+6+h2(gx,gy*3)*20,wy=gy*32+6+h2(gx*5,gy)*20,f=groundField(wx,wy);
  if(f[3]>.4||f[4])continue;   // 길·광장 위에는 소품 없음
  const inside=wx>=x0&&wx<x0+CS&&wy>=y0&&wy<y0+CS;
  const lt=(PROPS[st]||propForest)(g,wx,wy,hv,f);
  if(lt&&inside)lights.push(lt);
 }
 g.restore();
 c={cv,u:now,lights,em,x0,y0};chunks.set(k,c);return c;
}
function blob(g,x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill()}
function propForest(g,x,y,hv,f){
 const shade=f[0]<40;
 if(hv<.02){ // 꽃무리
  const cols=["#f3d65a","#f08fb2","#9fd0ff","#ffffff","#ff9a5a"],col=cols[Math.floor(h2(x,y)*5)];
  for(let i=0;i<4;i++){const ox=(i-1.5)*5+h2(x+i,y)*4,oy=(i%2)*4;g.strokeStyle="#2a4a30";g.lineWidth=1.2;g.beginPath();g.moveTo(x+ox,y+oy+6);g.lineTo(x+ox,y+oy);g.stroke();blob(g,x+ox,y+oy-1,2.8,2.8,col);blob(g,x+ox,y+oy-1,1,1,"#fff6c8")}
 }else if(hv<.05){ // 덤불
  blob(g,x,y+9,17,5,"rgba(0,0,0,.28)");
  const c1=shade?"#1c3a2c":"#2c5a3a",c2=shade?"#27503a":"#3c7448";
  g.fillStyle=c1;g.beginPath();g.arc(x-8,y+2,10,0,7);g.arc(x+8,y+2,10,0,7);g.arc(x,y-5,11,0,7);g.fill();
  g.fillStyle=c2;g.beginPath();g.arc(x-5,y-2,6,0,7);g.arc(x+5,y-7,5,0,7);g.fill();
  if(hv<.03){blob(g,x+6,y,2,2,"#d8384a");blob(g,x-4,y+4,2,2,"#d8384a")}
 }else if(hv<.07){ // 바위
  blob(g,x,y+6,11,4,"rgba(0,0,0,.3)");blob(g,x,y,10,7,"#6a707a");blob(g,x-2,y-2,6,3,"#8a909a");
  g.fillStyle="rgba(90,140,80,.55)";g.beginPath();g.ellipse(x+3,y+4,5,2.5,0,0,7);g.fill();
 }else if(hv<.09&&shade){ // 발광 버섯 (그늘) → 약한 광원
  for(let i=0;i<3;i++){const ox=(i-1)*6,s=1-i*.15;g.fillStyle="#e8dfc8";g.fillRect(x+ox-1,y+2,2,5*s);g.fillStyle="#6ad8ff";g.beginPath();g.ellipse(x+ox,y+2,5*s,3.5*s,0,Math.PI,0);g.fill();g.fillStyle="rgba(255,255,255,.7)";g.beginPath();g.arc(x+ox-1,y,1,0,7);g.fill()}
  return{x,y,r:70};
 }else if(hv<.1){ // 그루터기
  blob(g,x,y+7,12,4,"rgba(0,0,0,.3)");g.fillStyle="#5a3e28";g.fillRect(x-9,y-4,18,10);blob(g,x,y-4,9,4,"#8a6a48");
  g.strokeStyle="#5a3e28";g.lineWidth=1;g.beginPath();g.ellipse(x,y-4,5,2,0,0,7);g.stroke();
 }else if(hv<.11){ // 쓰러진 통나무
  blob(g,x,y+6,24,5,"rgba(0,0,0,.3)");g.fillStyle="#5e4230";g.fillRect(x-22,y-5,40,11);blob(g,x+18,y,4,6,"#8a6a48");
  g.fillStyle="rgba(90,150,80,.6)";g.fillRect(x-14,y-6,10,3);
 }else{ // 풀 덤불
  g.strokeStyle=shade?"#2a5038":"#4a8a4e";g.lineWidth=1.5;
  for(let i=0;i<6;i++){const a=-Math.PI/2+(i-2.5)*.28;g.beginPath();g.moveTo(x,y+4);g.quadraticCurveTo(x+Math.cos(a)*5,y+Math.sin(a)*5,x+Math.cos(a)*10,y+Math.sin(a)*10+4);g.stroke()}
 }
 return null;
}
function propRuins(g,x,y,hv,f){
 if(hv<.02){ // 보라 수정 → 광원
  blob(g,x,y+8,12,4,"rgba(0,0,0,.35)");
  for(const[ox,h,w]of[[-5,16,5],[3,22,6],[9,12,4]]){g.fillStyle="#7a4ad8";g.beginPath();g.moveTo(x+ox-w,y+6);g.lineTo(x+ox,y+6-h);g.lineTo(x+ox+w,y+6);g.closePath();g.fill();g.fillStyle="rgba(220,190,255,.55)";g.beginPath();g.moveTo(x+ox-w*.3,y+4);g.lineTo(x+ox,y+6-h);g.lineTo(x+ox+w*.2,y+4);g.closePath();g.fill()}
  return{x,y,r:110};
 }else if(hv<.045){ // 묘비
  blob(g,x,y+10,12,4,"rgba(0,0,0,.35)");g.fillStyle="#5a5868";g.beginPath();g.moveTo(x-9,y+10);g.lineTo(x-9,y-6);g.arc(x,y-6,9,Math.PI,0);g.lineTo(x+9,y+10);g.closePath();g.fill();
  g.fillStyle="#6e6c7e";g.fillRect(x-9,y-6,4,16);g.strokeStyle="rgba(0,0,0,.45)";g.lineWidth=1.5;g.beginPath();g.moveTo(x,y-9);g.lineTo(x,y+2);g.moveTo(x-4,y-5);g.lineTo(x+4,y-5);g.stroke();
 }else if(hv<.06){ // 촛불 → 광원
  blob(g,x,y+5,8,3,"rgba(0,0,0,.35)");g.fillStyle="#d8d0c0";g.fillRect(x-3,y-6,6,11);g.fillRect(x+5,y-2,4,7);
  blob(g,x,y-9,2,3.5,"#ffcf5a");blob(g,x+7,y-5,1.5,2.5,"#ffcf5a");return{x,y,r:95};
 }else if(hv<.08){ // 부서진 기둥
  blob(g,x,y+12,14,4.5,"rgba(0,0,0,.35)");g.fillStyle="#565c6b";g.fillRect(x-9,y-8,18,20);g.fillStyle="#6b7282";g.fillRect(x-9,y-8,6,20);
  g.beginPath();g.moveTo(x-9,y-8);g.lineTo(x-4,y-13);g.lineTo(x+2,y-9);g.lineTo(x+9,y-12);g.lineTo(x+9,y-8);g.closePath();g.fill();
  g.strokeStyle="rgba(0,0,0,.3)";g.lineWidth=1;g.beginPath();g.moveTo(x-9,y+1);g.lineTo(x+9,y+1);g.stroke();
 }else if(hv<.1){ // 뼈와 해골
  g.fillStyle="#d8d2c0";blob(g,x,y,5,4.5,"#d8d2c0");g.fillStyle="#2a2030";g.beginPath();g.arc(x-2,y-.5,1.3,0,7);g.arc(x+2,y-.5,1.3,0,7);g.fill();
  g.strokeStyle="#cfc8b4";g.lineWidth=2;g.beginPath();g.moveTo(x+6,y+5);g.lineTo(x+16,y+2);g.moveTo(x-12,y+6);g.lineTo(x-4,y+8);g.stroke();
 }else if(hv<.12){ // 돌무더기
  blob(g,x,y+5,14,4,"rgba(0,0,0,.35)");blob(g,x-5,y,6,4,"#4e4a5c");blob(g,x+4,y+1,7,4.5,"#5c5870");blob(g,x,y-4,5,3.5,"#6a6680");
 }else{ // 마른 풀
  g.strokeStyle="#6a6050";g.lineWidth=1.2;for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*.35;g.beginPath();g.moveTo(x,y+4);g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9+4);g.stroke()}
 }
 return null;
}
function propMagma(g,x,y,hv,f){
 if(hv<.025){ // 용암 분출구 → 광원
  blob(g,x,y+6,16,6,"rgba(0,0,0,.4)");blob(g,x,y+2,14,8,"#2a1a18");blob(g,x,y,9,5,"#4a2a20");
  const gr=g.createRadialGradient(x,y,1,x,y,8);gr.addColorStop(0,"#fff0a0");gr.addColorStop(.5,"#ff8a2a");gr.addColorStop(1,"rgba(200,40,10,0)");g.fillStyle=gr;g.beginPath();g.ellipse(x,y,8,4.5,0,0,7);g.fill();
  return{x,y,r:130};
 }else if(hv<.06){ // 흑요석 가시
  blob(g,x,y+8,14,4,"rgba(0,0,0,.45)");
  for(const[ox,h,w]of[[-6,18,5],[2,26,6],[9,14,4]]){g.fillStyle="#141018";g.beginPath();g.moveTo(x+ox-w,y+8);g.lineTo(x+ox,y+8-h);g.lineTo(x+ox+w,y+8);g.closePath();g.fill();
   g.fillStyle="rgba(170,140,220,.35)";g.beginPath();g.moveTo(x+ox-w*.2,y+6);g.lineTo(x+ox,y+8-h);g.lineTo(x+ox+w*.3,y+6);g.closePath();g.fill()}
 }else if(hv<.085){ // 불탄 나무
  blob(g,x,y+12,12,4,"rgba(0,0,0,.4)");g.strokeStyle="#1a1210";g.lineWidth=4;g.lineCap="round";
  g.beginPath();g.moveTo(x,y+12);g.lineTo(x,y-10);g.moveTo(x,y-2);g.lineTo(x-9,y-12);g.moveTo(x,y-6);g.lineTo(x+8,y-15);g.stroke();
  g.strokeStyle="rgba(255,110,40,.6)";g.lineWidth=1;g.beginPath();g.moveTo(x-1,y+8);g.lineTo(x+1,y+2);g.stroke();
 }else if(hv<.11){ // 현무암 바위 (균열에 용암)
  blob(g,x,y+6,13,4,"rgba(0,0,0,.4)");blob(g,x,y,12,8,"#3a2e2e");blob(g,x-3,y-3,6,3,"#54464a");
  g.strokeStyle="#ff6a1e";g.lineWidth=1.3;g.beginPath();g.moveTo(x-6,y+2);g.lineTo(x-1,y-1);g.lineTo(x+4,y+3);g.lineTo(x+8,y);g.stroke();
 }else if(hv<.125){ // 뼈
  g.strokeStyle="#cfc4b0";g.lineWidth=2.2;g.lineCap="round";g.beginPath();g.moveTo(x-8,y);g.lineTo(x+8,y+3);g.moveTo(x-5,y+6);g.lineTo(x+3,y-4);g.stroke();
 }else{ // 재 더미
  blob(g,x,y+3,9,3.5,"rgba(30,24,24,.5)");blob(g,x-2,y+1,4,2,"rgba(120,100,100,.35)");
 }
 return null;
}
/* 챕터 2 지형 소품 */
function propSwamp(g,x,y,hv,f){
 if(hv<.03){ // 빛나는 거대 버섯 → 광원
  blob(g,x,y+12,14,4,"rgba(0,0,0,.4)");g.fillStyle="#d8d0c0";g.fillRect(x-3,y-4,6,16);
  g.fillStyle="#b04ad0";g.beginPath();g.ellipse(x,y-5,14,8,0,Math.PI,0);g.fill();g.fillStyle="#e8b0ff";for(const[a,b,r]of[[-6,-8,2],[2,-10,2.4],[7,-7,1.6]]){g.beginPath();g.arc(x+a,y+b,r,0,7);g.fill()}
  return{x,y:y-6,r:110};
 }else if(hv<.06){ // 작은 버섯 무리
  for(const[ox,s,c]of[[-6,.7,"#d86a4a"],[0,1,"#8ad04a"],[6,.6,"#d86a4a"]]){g.fillStyle="#e8e0c8";g.fillRect(x+ox-1,y,2,6*s);g.fillStyle=c;g.beginPath();g.ellipse(x+ox,y,5*s,3.5*s,0,Math.PI,0);g.fill()}
 }else if(hv<.09){ // 갈대
  g.strokeStyle="#4a7a4a";g.lineWidth=1.4;for(let i=0;i<5;i++){g.beginPath();g.moveTo(x+(i-2)*3,y+6);g.quadraticCurveTo(x+(i-2)*4,y-4,x+(i-2)*5,y-12);g.stroke()}
  g.fillStyle="#7a5a3a";g.beginPath();g.ellipse(x+5,y-12,1.6,4,0,0,7);g.fill();
 }else if(hv<.11){ // 썩은 통나무
  blob(g,x,y+6,22,5,"rgba(0,0,0,.35)");g.fillStyle="#3a3a2a";g.fillRect(x-20,y-5,36,10);blob(g,x+16,y,4,5,"#5a5a40");g.fillStyle="rgba(140,220,90,.5)";g.fillRect(x-12,y-6,12,3);
 }else if(hv<.13){ // 연잎
  blob(g,x,y,9,5,"#3a7a4a");g.strokeStyle="#204a2a";g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+8,y-2);g.stroke();
 }else{blob(g,x,y+2,6,3,"rgba(20,40,30,.45)")}
 return null;
}
function propClock(g,x,y,hv,f){
 if(hv<.03){ // 증기 배출구 → 광원
  blob(g,x,y+6,12,4,"rgba(0,0,0,.4)");g.fillStyle="#5a504a";g.fillRect(x-8,y-4,16,10);g.fillStyle="#ffb040";g.fillRect(x-5,y-2,10,3);return{x,y,r:95};
 }else if(hv<.07){ // 톱니바퀴
  g.save();g.translate(x,y);g.fillStyle=hv<.05?"#a8843a":"#7a7a80";g.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?9:12;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();
  g.fillStyle="#3a3430";g.beginPath();g.arc(0,0,4,0,7);g.fill();g.strokeStyle="rgba(255,255,255,.25)";g.lineWidth=1;g.beginPath();g.arc(0,0,7,3.6,5.2);g.stroke();g.restore();
 }else if(hv<.1){ // 파이프
  g.fillStyle="#6a5a4a";g.fillRect(x-14,y-3,28,6);g.fillStyle="#8a7a6a";g.fillRect(x-14,y-3,28,2);g.fillStyle="#a8843a";g.fillRect(x-3,y-5,6,10);
 }else if(hv<.12){ // 나무 상자
  blob(g,x,y+8,12,3,"rgba(0,0,0,.35)");g.fillStyle="#7a5a3a";g.fillRect(x-9,y-8,18,16);g.strokeStyle="#4a3420";g.lineWidth=1.4;g.strokeRect(x-9,y-8,18,16);g.beginPath();g.moveTo(x-9,y-8);g.lineTo(x+9,y+8);g.stroke();
 }else{g.fillStyle="rgba(120,110,100,.35)";g.fillRect(x-4,y-1,8,2)}
 return null;
}
function propVoid(g,x,y,hv,f){
 if(hv<.03){ // 떠 있는 수정 → 광원
  blob(g,x,y+14,10,3,"rgba(0,0,0,.4)");for(const[ox,h,w,c]of[[-5,14,4,"#7a5aff"],[2,20,5,"#a080ff"],[8,11,3,"#5ac0ff"]]){g.fillStyle=c;g.beginPath();g.moveTo(x+ox-w,y+2);g.lineTo(x+ox,y+2-h);g.lineTo(x+ox+w,y+2);g.lineTo(x+ox,y+6);g.closePath();g.fill()}
  return{x,y,r:120};
 }else if(hv<.06){ // 떠다니는 바위
  blob(g,x,y+12,9,2.5,"rgba(0,0,0,.35)");g.fillStyle="#3a3458";g.beginPath();g.moveTo(x-9,y);g.lineTo(x-4,y-7);g.lineTo(x+7,y-5);g.lineTo(x+9,y+2);g.lineTo(x-2,y+5);g.closePath();g.fill();g.fillStyle="#5a5280";g.fillRect(x-4,y-6,6,2);
 }else if(hv<.08){ // 무너진 고대 기둥
  blob(g,x,y+12,12,4,"rgba(0,0,0,.4)");g.fillStyle="#4a4470";g.fillRect(x-7,y-10,14,22);g.fillStyle="#6a64a0";g.fillRect(x-7,y-10,4,22);g.fillStyle="#9a8aff";g.fillRect(x-1,y-4,2,2);
 }else if(hv<.1){ // 별 모양 꽃
  g.fillStyle="#c0a0ff";g.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?2:5;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}g.closePath();g.fill();
 }else{g.fillStyle="rgba(200,190,255,.35)";g.fillRect(x,y,1.5,1.5)}
 return null;
}
const PROPS=[propForest,propRuins,propMagma,propSwamp,propClock,propVoid];
/* ── 적 스프라이트 ── */
let BAKING=false,EYE=null;              // BAKING: 오프스크린에 스프라이트를 굽는 중 · EYE: 굽는 동안 눈동자 방향 고정값
const LD={x:0,y:0};
function lookDir(e){if(EYE)return EYE;const dx=player.x-e.x,dy=player.y-e.y,L=Math.hypot(dx,dy)||1;LD.x=dx/L;LD.y=dy/L;return LD}
function glowOn(b,c){if(Q.glow){ctx.shadowBlur=b;ctx.shadowColor=c}}   // 일반 오브젝트 발광은 고품질에서만
function rrect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function bodyDraw(e,pathFn,color){
 const r=e.r;
 ctx.fillStyle=color||e.color;pathFn();ctx.fill();
 ctx.save();pathFn();ctx.clip();
 ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(0,r*.7,r*1.5,r*.85,0,0,7);ctx.fill();
 ctx.fillStyle="rgba(255,255,255,.22)";ctx.beginPath();ctx.ellipse(-r*.32,-r*.42,r*.34,r*.2,-.6,0,7);ctx.fill();
 ctx.lineWidth=3;ctx.strokeStyle="rgba(255,255,255,.17)";ctx.save();ctx.translate(1.6,2.2);pathFn();ctx.restore();ctx.stroke();   // 림라이트
 if(e.hit>0){ctx.fillStyle="rgba(255,255,255,.75)";ctx.fillRect(-r*2,-r*2,r*4,r*4)}
 ctx.restore();
 ctx.lineWidth=2;ctx.strokeStyle=OUT;pathFn();ctx.stroke();
}
function eyes(e,ox,oy,sp,sz,pupil){
 const d=lookDir(e),px=d.x*sz*.45,py=d.y*sz*.45;
 for(const s of[-1,1]){ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(ox+s*sp,oy,sz,0,7);ctx.fill();ctx.fillStyle=pupil||"#1a0c14";ctx.beginPath();ctx.arc(ox+s*sp+px,oy+py,sz*.55,0,7);ctx.fill()}
}
function crown(y){ctx.fillStyle="#ffd85a";ctx.strokeStyle="#7a5a10";ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-8,y);ctx.lineTo(-9,y-9);ctx.lineTo(-4,y-4);ctx.lineTo(0,y-11);ctx.lineTo(4,y-4);ctx.lineTo(9,y-9);ctx.lineTo(8,y);ctx.closePath();ctx.fill();ctx.stroke()}
/* 적 본체 (원점 기준). 일반 적은 이 함수로 스프라이트를 미리 구워 두고, 엘리트/보스/사수는 매 프레임 직접 그림 */
function drawEnemyBody(e){
 const r=e.r,t=elapsed;
 const circle=()=>{ctx.beginPath();ctx.arc(0,0,r,0,7)};
 switch(e.type){
  case"grunt":{
   const sq=BAKING?0:Math.sin(t*7+e.ph)*.08;
   bodyDraw(e,()=>{ctx.beginPath();ctx.ellipse(0,1,r*(1+sq),r*(1-sq)*.95,0,0,7)});
   eyes(e,0,-r*.1,r*.36,r*.24);
   ctx.strokeStyle=OUT;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,r*.32,r*.22,.2,Math.PI-.2);ctx.stroke();break}
  case"runner":{
   ctx.fillStyle=e.color;ctx.strokeStyle=OUT;ctx.lineWidth=1.6;
   ctx.beginPath();ctx.moveTo(-r*.7,-r*.5);ctx.lineTo(-r*1.05,-r*1.5);ctx.lineTo(-r*.15,-r*.9);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.moveTo(r*.7,-r*.5);ctx.lineTo(r*1.05,-r*1.5);ctx.lineTo(r*.15,-r*.9);ctx.closePath();ctx.fill();ctx.stroke();
   bodyDraw(e,()=>{ctx.beginPath();ctx.moveTo(0,-r*1.05);ctx.lineTo(r*1.05,-r*.1);ctx.lineTo(r*.8,r*.95);ctx.lineTo(-r*.8,r*.95);ctx.lineTo(-r*1.05,-r*.1);ctx.closePath()});
   eyes(e,0,-r*.05,r*.36,r*.24);break}
  case"charger":{
   if(e.st===1){ctx.shadowBlur=18;ctx.shadowColor="#ff2a2a";if(!BAKING)ctx.translate(rand(-1.5,1.5),0)}
   ctx.fillStyle="#f1e6d0";ctx.strokeStyle=OUT;ctx.lineWidth=1.6;
   ctx.beginPath();ctx.moveTo(-r*.55,-r*.6);ctx.lineTo(-r*1.0,-r*1.4);ctx.lineTo(-r*.1,-r*.9);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.moveTo(r*.55,-r*.6);ctx.lineTo(r*1.0,-r*1.4);ctx.lineTo(r*.1,-r*.9);ctx.closePath();ctx.fill();ctx.stroke();
   bodyDraw(e,circle);ctx.shadowBlur=0;
   ctx.fillStyle="rgba(255,255,255,.18)";ctx.beginPath();ctx.ellipse(0,r*.38,r*.52,r*.34,0,0,7);ctx.fill();
   ctx.fillStyle=OUT;ctx.beginPath();ctx.arc(-r*.16,r*.38,1.4,0,7);ctx.arc(r*.16,r*.38,1.4,0,7);ctx.fill();
   eyes(e,0,-r*.18,r*.38,r*.22,e.st?"#ff2a2a":null);
   ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.62,-r*.55);ctx.lineTo(-r*.15,-r*.36);ctx.moveTo(r*.62,-r*.55);ctx.lineTo(r*.15,-r*.36);ctx.stroke();break}
  case"tank":{
   bodyDraw(e,()=>rrect(-r,-r*.95,r*2,r*1.9,r*.3));
   ctx.fillStyle="rgba(255,255,255,.13)";rrect(-r*.8,-r*.78,r*1.6,r*.42,4);ctx.fill();
   ctx.fillStyle="rgba(255,255,255,.35)";for(const s of[-1,1]){ctx.beginPath();ctx.arc(s*r*.62,-r*.57,1.6,0,7);ctx.fill()}
   ctx.fillStyle="#150b22";rrect(-r*.72,-r*.2,r*1.44,r*.42,3);ctx.fill();
   const d=lookDir(e);
   ctx.fillStyle="#ffd54a";ctx.shadowBlur=6;ctx.shadowColor="#ffd54a";for(const s of[-1,1]){ctx.beginPath();ctx.arc(s*r*.32+d.x*2,r*.01+d.y*1.5,r*.11,0,7);ctx.fill()}ctx.shadowBlur=0;
   break}
  case"bomber":{
   bodyDraw(e,circle);
   ctx.strokeStyle="#c9a66b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r*.2,-r*.95);ctx.quadraticCurveTo(r*.75,-r*1.5,r*.3,-r*1.85);ctx.stroke();
   eyes(e,0,-r*.05,r*.36,r*.24,"#ff3a2a");
   ctx.strokeStyle="#ff6a4a";ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-r*.45,r*.4);ctx.lineTo(r*.45,r*.4);ctx.stroke();break}
  case"shooter":{
   ctx.strokeStyle="rgba(120,230,240,.6)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*1.45,r*.5,t*2,0,7);ctx.stroke();
   bodyDraw(e,circle);
   ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(0,0,r*.58,0,7);ctx.fill();
   const d=lookDir(e);
   ctx.fillStyle="#0c5560";ctx.beginPath();ctx.arc(d.x*r*.22,d.y*r*.22,r*.33,0,7);ctx.fill();ctx.fillStyle="#04161a";ctx.beginPath();ctx.arc(d.x*r*.26,d.y*r*.26,r*.16,0,7);ctx.fill();break}
  case"elite":{
   ctx.shadowBlur=18;ctx.shadowColor="#ffbd3e";
   ctx.fillStyle="#ffd36a";ctx.strokeStyle=OUT;ctx.lineWidth=1.4;
   for(let i=0;i<10;i++){const a=i*Math.PI/5+t*.4;ctx.beginPath();ctx.moveTo(Math.cos(a-.16)*r*.95,Math.sin(a-.16)*r*.95);ctx.lineTo(Math.cos(a)*r*1.38,Math.sin(a)*r*1.38);ctx.lineTo(Math.cos(a+.16)*r*.95,Math.sin(a+.16)*r*.95);ctx.closePath();ctx.fill();ctx.stroke()}
   bodyDraw(e,circle,e.enr?"#d6452a":null);ctx.shadowBlur=0;
   if(e.enr){ctx.fillStyle=`rgba(255,60,30,${.2+.15*Math.sin(t*14)})`;circle();ctx.fill()}
   eyes(e,0,-r*.12,r*.36,r*.24,"#7a1010");
   ctx.strokeStyle=OUT;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-r*.7,-r*.5);ctx.lineTo(-r*.15,-r*.3);ctx.moveTo(r*.7,-r*.5);ctx.lineTo(r*.15,-r*.3);ctx.stroke();
   crown(-r-2);break}
  case"boss":{
   ctx.strokeStyle=`rgba(255,60,160,${.3+.15*Math.sin(t*4)})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,r*(1.3+.05*Math.sin(t*4)),0,7);ctx.stroke();
   ctx.fillStyle="#2a1020";ctx.strokeStyle=OUT;ctx.lineWidth=2;
   for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(s*r*.6,-r*.7);ctx.quadraticCurveTo(s*r*1.35,-r*1.0,s*r*1.0,-r*1.85);ctx.quadraticCurveTo(s*r*.75,-r*1.1,s*r*.25,-r*.95);ctx.closePath();ctx.fill();ctx.stroke()}
   ctx.shadowBlur=24;ctx.shadowColor="#ff3c9d";bodyDraw(e,circle);ctx.shadowBlur=0;
   ctx.fillStyle="#ffe14a";ctx.shadowBlur=10;ctx.shadowColor="#ffb000";for(const s of[-1,1]){ctx.beginPath();ctx.ellipse(s*r*.36,-r*.15,r*.16,r*.09,s*.35,0,7);ctx.fill()}ctx.shadowBlur=0;
   ctx.fillStyle="#f6efe0";ctx.strokeStyle=OUT;ctx.lineWidth=1.2;for(let i=0;i<6;i++){const x=-r*.5+i*r*.2;ctx.beginPath();ctx.moveTo(x,r*.32);ctx.lineTo(x+r*.1,r*.6);ctx.lineTo(x+r*.2,r*.32);ctx.fill();ctx.stroke()}
   crown(-r-1);break}
  case"splitter":case"mini":{ // 분열체: 젤리 몸 안에 핵
   const sq=BAKING?0:Math.sin(t*6+e.ph)*.06;
   bodyDraw(e,()=>{ctx.beginPath();ctx.ellipse(0,1,r*(1+sq),r*(1-sq)*.92,0,0,7)});
   ctx.fillStyle="rgba(20,60,30,.35)";
   if(e.type==="splitter"){ctx.beginPath();ctx.arc(-r*.32,r*.3,r*.2,0,7);ctx.arc(r*.32,r*.3,r*.2,0,7);ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(0,-r*.95);ctx.lineTo(0,r*.9);ctx.stroke();ctx.setLineDash([])}
   eyes(e,0,-r*.18,r*.34,r*.22);break}
  case"healer":{ // 치유사: 후광 + 녹색 십자
   ctx.strokeStyle="#f8f0b0";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-r*1.25,r*.6,r*.2,0,0,7);ctx.stroke();
   bodyDraw(e,()=>{ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*1.2,-r*.2,r*.8,r*.95);ctx.lineTo(-r*.8,r*.95);ctx.quadraticCurveTo(-r*1.2,-r*.2,0,-r);ctx.closePath()});
   ctx.fillStyle="#4fd86a";ctx.fillRect(-r*.12,r*.1,r*.24,r*.62);ctx.fillRect(-r*.3,r*.3,r*.6,r*.22);
   eyes(e,0,-r*.22,r*.3,r*.18,"#2a6a3a");break}
  case"wraith":{ // 망령: 꼬리가 흩날리는 유령
   const wv=BAKING?0:Math.sin(t*8+e.ph)*r*.12;
   bodyDraw(e,()=>{ctx.beginPath();ctx.arc(0,-r*.1,r*.9,Math.PI,0);ctx.lineTo(r*.9,r*.5);
    ctx.quadraticCurveTo(r*.6,r*1.1+wv,r*.3,r*.6);ctx.quadraticCurveTo(0,r*1.2-wv,-r*.3,r*.6);ctx.quadraticCurveTo(-r*.6,r*1.1+wv,-r*.9,r*.5);ctx.closePath()});
   ctx.fillStyle="#0c0c24";for(const sx of[-1,1]){ctx.beginPath();ctx.ellipse(sx*r*.32,-r*.2,r*.17,r*.26,0,0,7);ctx.fill()}
   ctx.fillStyle="#bfe0ff";for(const sx of[-1,1]){ctx.beginPath();ctx.arc(sx*r*.32,-r*.24,r*.07,0,7);ctx.fill()}
   ctx.fillStyle="#0c0c24";ctx.beginPath();ctx.ellipse(0,r*.25,r*.14,r*.2,0,0,7);ctx.fill();break}
  case"magma":{ // 용암 거인: 바위 몸 + 빛나는 균열
   bodyDraw(e,()=>{ctx.beginPath();const pts=[[-1,-.3],[-.6,-.95],[.1,-1],[.75,-.7],[1,.05],[.8,.8],[0,1],[-.8,.85]];pts.forEach((p,i)=>ctx[i?"lineTo":"moveTo"](p[0]*r,p[1]*r));ctx.closePath()},"#3a2622");
   ctx.strokeStyle="#ff7a2a";ctx.lineWidth=2.4;if(Q.glow||BAKING){ctx.shadowBlur=8;ctx.shadowColor="#ff5a1e"}
   ctx.beginPath();ctx.moveTo(-r*.7,-r*.2);ctx.lineTo(-r*.2,r*.1);ctx.lineTo(-r*.3,r*.6);ctx.moveTo(-r*.2,r*.1);ctx.lineTo(r*.4,-r*.05);ctx.lineTo(r*.7,r*.45);ctx.moveTo(r*.4,-r*.05);ctx.lineTo(r*.3,-r*.6);ctx.stroke();ctx.shadowBlur=0;
   ctx.fillStyle="#ffe14a";for(const sx of[-1,1]){ctx.beginPath();ctx.ellipse(sx*r*.3,-r*.42,r*.13,r*.08,sx*.3,0,7);ctx.fill()}break}
  case"imp":{ // 임프: 뿔 + 작은 날개
   ctx.fillStyle="#6a1a10";ctx.strokeStyle=OUT;ctx.lineWidth=1.3;
   for(const sx of[-1,1]){ctx.beginPath();ctx.moveTo(sx*r*.6,-r*.1);ctx.lineTo(sx*r*1.7,-r*.7);ctx.lineTo(sx*r*1.4,-r*.05);ctx.lineTo(sx*r*1.6,r*.3);ctx.closePath();ctx.fill();ctx.stroke()}
   ctx.fillStyle="#2a0a06";for(const sx of[-1,1]){ctx.beginPath();ctx.moveTo(sx*r*.35,-r*.8);ctx.lineTo(sx*r*.65,-r*1.5);ctx.lineTo(sx*r*.7,-r*.6);ctx.closePath();ctx.fill()}
   bodyDraw(e,circle);eyes(e,0,-r*.1,r*.36,r*.24,"#ffd000");
   ctx.strokeStyle=OUT;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-r*.35,r*.38);ctx.lineTo(-r*.1,r*.5);ctx.lineTo(r*.1,r*.38);ctx.lineTo(r*.35,r*.5);ctx.stroke();break}
  case"spore":{ // 포자충: 버섯 갓 + 포자 점
   bodyDraw(e,()=>{ctx.beginPath();ctx.ellipse(0,2,r,r*.85,0,0,7)});
   ctx.fillStyle="#5a2a7a";ctx.beginPath();ctx.ellipse(0,-r*.35,r*1.15,r*.7,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=1.6;ctx.stroke();
   ctx.fillStyle="rgba(255,255,255,.6)";for(const[a,b]of[[-.5,-.75],[.2,-.95],[.6,-.6]]){ctx.beginPath();ctx.arc(a*r,b*r,r*.13,0,7);ctx.fill()}
   eyes(e,0,r*.15,r*.32,r*.2);break}
  case"skitter":{ // 갑각 질주자: 다리 6개
   ctx.strokeStyle=OUT;ctx.lineWidth=2;for(const s of[-1,1])for(let i=0;i<3;i++){const a=(i-1)*.6;ctx.beginPath();ctx.moveTo(s*r*.6,a*r*.6);ctx.lineTo(s*r*1.5,a*r*1.2+(i-1)*r*.2);ctx.stroke()}
   bodyDraw(e,()=>{ctx.beginPath();ctx.ellipse(0,0,r*1.05,r*.85,0,0,7)});
   ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,-r*.8);ctx.lineTo(0,r*.8);ctx.stroke();eyes(e,0,-r*.25,r*.3,r*.2,"#a01010");break}
  case"lancer":{ // 돌격 기사: 투구 + 창끝
   if(e.st===1){ctx.shadowBlur=18;ctx.shadowColor="#ff2a6a";if(!BAKING)ctx.translate(rand(-1.5,1.5),0)}
   ctx.fillStyle="#d8dce6";ctx.strokeStyle=OUT;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-r*.2,-r*.9);ctx.lineTo(0,-r*1.9);ctx.lineTo(r*.2,-r*.9);ctx.closePath();ctx.fill();ctx.stroke();
   bodyDraw(e,circle);ctx.shadowBlur=0;
   ctx.fillStyle="#c8ccd6";ctx.strokeStyle=OUT;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,-r*.1,r*.85,Math.PI*1.05,Math.PI*1.95);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle="#140a10";ctx.fillRect(-r*.5,-r*.3,r,r*.18);ctx.fillStyle=e.st?"#ff2a6a":"#ffcf5a";ctx.fillRect(-r*.3,-r*.28,r*.6,r*.12);break}
  case"golem":{ // 태엽 골렘: 금속 상자 + 태엽 열쇠
   ctx.fillStyle="#a8843a";ctx.strokeStyle=OUT;ctx.lineWidth=1.6;ctx.fillRect(-r*.15,-r*1.45,r*.3,r*.5);ctx.beginPath();ctx.ellipse(0,-r*1.5,r*.5,r*.22,0,0,7);ctx.fill();ctx.stroke();
   bodyDraw(e,()=>rrect(-r,-r*.95,r*2,r*1.9,r*.25));
   ctx.fillStyle="rgba(255,255,255,.22)";for(const[a,b]of[[-.75,-.7],[.75,-.7],[-.75,.7],[.75,.7]]){ctx.beginPath();ctx.arc(a*r,b*r,2,0,7);ctx.fill()}
   ctx.fillStyle="#1a1410";rrect(-r*.6,-r*.3,r*1.2,r*.45,4);ctx.fill();{const d=lookDir(e);ctx.fillStyle="#5af0ff";ctx.fillRect(-r*.4+d.x*3,-r*.18,r*.25,r*.18);ctx.fillRect(r*.15+d.x*3,-r*.18,r*.25,r*.18)}break}
  case"drone":{ // 자폭 드론: 프로펠러 + 붉은 코어
   ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*1.5,-r*.6);ctx.lineTo(r*1.5,-r*.6);ctx.stroke();
   ctx.fillStyle="rgba(200,220,240,.6)";for(const s of[-1,1]){ctx.beginPath();ctx.ellipse(s*r*1.3,-r*.75,r*.6,r*.15,0,0,7);ctx.fill()}
   bodyDraw(e,circle);ctx.fillStyle="#ff3a2a";ctx.beginPath();ctx.arc(0,r*.1,r*.35,0,7);ctx.fill();ctx.fillStyle="#ffd0c0";ctx.beginPath();ctx.arc(-r*.1,0,r*.12,0,7);ctx.fill();break}
  case"seer":{ // 공허 눈: 촉수 + 큰 눈
   ctx.strokeStyle=e.color;ctx.lineWidth=3;for(let i=0;i<4;i++){const a=Math.PI*.25+i*.5,w=BAKING?0:Math.sin(t*4+i)*3;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.6,Math.sin(a)*r*.6);ctx.quadraticCurveTo(Math.cos(a)*r*1.3+w,Math.sin(a)*r*1.3,Math.cos(a)*r*1.6,Math.sin(a)*r*1.7+w);ctx.stroke()}
   bodyDraw(e,circle);ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(0,-r*.05,r*.6,0,7);ctx.fill();{const d=lookDir(e);
   ctx.fillStyle="#7a1aa0";ctx.beginPath();ctx.arc(d.x*r*.22,-r*.05+d.y*r*.22,r*.32,0,7);ctx.fill();ctx.fillStyle="#0a0410";ctx.beginPath();ctx.ellipse(d.x*r*.26,-r*.05+d.y*r*.26,r*.08,r*.26,0,0,7);ctx.fill()}break}
  case"mother":{ // 포자 모체: 큰 버섯 몸 + 알주머니
   bodyDraw(e,()=>{ctx.beginPath();ctx.ellipse(0,r*.2,r*.85,r*.8,0,0,7)});
   ctx.fillStyle="#7a2a8a";ctx.beginPath();ctx.ellipse(0,-r*.35,r*1.25,r*.75,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.stroke();
   ctx.fillStyle="#f0c0ff";for(const[a,b,rr]of[[-.6,-.7,.16],[.1,-.95,.2],[.7,-.6,.14],[-.2,-.55,.1]]){ctx.beginPath();ctx.arc(a*r,b*r,rr*r,0,7);ctx.fill()}
   ctx.fillStyle="rgba(200,255,150,.75)";for(const s of[-1,1]){ctx.beginPath();ctx.arc(s*r*.55,r*.55,r*.18,0,7);ctx.fill()}eyes(e,0,r*.05,r*.3,r*.18,"#3a0a4a");break}
  case"warden":{ // 수호자: 방패 문양 + 육각 후광
   ctx.strokeStyle="rgba(140,180,255,.85)";ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(Math.cos(a)*r*1.35,Math.sin(a)*r*1.35)}ctx.closePath();ctx.stroke();
   bodyDraw(e,()=>{ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.9,-r*.5);ctx.lineTo(r*.75,r*.5);ctx.lineTo(0,r);ctx.lineTo(-r*.75,r*.5);ctx.lineTo(-r*.9,-r*.5);ctx.closePath()});
   ctx.fillStyle="#e8f0ff";ctx.fillRect(-r*.1,-r*.55,r*.2,r*.9);ctx.fillRect(-r*.4,-r*.25,r*.8,r*.18);eyes(e,0,-r*.05,r*.42,r*.16,"#1a2a6a");break}
  case"stalker":{ // 추적자: 그림자 망토 + 낫 손
   ctx.fillStyle="#d8d0ff";ctx.strokeStyle=OUT;ctx.lineWidth=1.3;for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(s*r*.7,0);ctx.quadraticCurveTo(s*r*1.7,-r*.3,s*r*1.5,r*.6);ctx.quadraticCurveTo(s*r*1.3,r*.1,s*r*.7,r*.3);ctx.closePath();ctx.fill();ctx.stroke()}
   bodyDraw(e,()=>{ctx.beginPath();ctx.moveTo(0,-r*1.1);ctx.quadraticCurveTo(r,-r*.5,r*.8,r);ctx.lineTo(-r*.8,r);ctx.quadraticCurveTo(-r,-r*.5,0,-r*1.1);ctx.closePath()});
   ctx.fillStyle="#0a0414";ctx.beginPath();ctx.ellipse(0,-r*.2,r*.55,r*.4,0,0,7);ctx.fill();ctx.fillStyle="#ff4aff";for(const s of[-1,1]){ctx.beginPath();ctx.ellipse(s*r*.2,-r*.22,r*.1,r*.06,s*.3,0,7);ctx.fill()}break}
  default:bodyDraw(e,circle)
 }
}
/* 스프라이트 캐시: 일반 적 5종 × 눈동자 8방향 (+돌진병 예고 자세). 피격 시에는 흰 실루엣을 겹쳐 그림 */
const FAST={grunt:1,runner:1,charger:1,tank:1,bomber:1,splitter:1,mini:1,healer:1,wraith:1,magma:1,imp:1,spore:1,skitter:1,lancer:1,golem:1,drone:1,mother:1,warden:1,stalker:1},SPR=new Map(),SIL=new Map(),SS=2;
function bake(type,dir,v){
 const s=EN[type],r=s.r,col=STAGE_LOOK[selSt].enemy[type]||s.c,size=Math.ceil(r*4.4)+28,cv=mkCanvas(size*SS,size*SS),g=cv.getContext("2d");
 g.scale(SS,SS);g.translate(size/2,size/2);
 const a=dir*Math.PI/4;EYE={x:Math.cos(a),y:Math.sin(a)};BAKING=true;ctx=g;
 try{drawEnemyBody({type,r,color:col,hit:0,ph:0,st:v,guarded:false,enr:false,x:0,y:0})}
 finally{ctx=MAINCTX;BAKING=false;EYE=null}
 return{cv,sz:size};
}
function getSpr(type,dir,v){const k=selSt+type+dir+(v?"w":"");let s=SPR.get(k);if(!s){s=bake(type,dir,v);SPR.set(k,s)}return s}
function silhouette(type){
 const key=selSt+type;let s=SIL.get(key);if(s)return s;
 const b=getSpr(type,2,0),cv=mkCanvas(b.cv.width,b.cv.height),g=cv.getContext("2d");
 g.drawImage(b.cv,0,0);g.globalCompositeOperation="source-in";g.fillStyle="#fff";g.fillRect(0,0,cv.width,cv.height);
 s={cv,sz:b.sz};SIL.set(key,s);return s;
}
/* 적 강조 외곽선: 실루엣을 강조색으로 칠해 조금 크게 뒤에 깔아 그림 (종류×색 1회 생성) */
const HL_C=[null,"#ffffff","#ff3b3b","#ffe14a"],OUTL=new Map();
function outlineSpr(type){
 const col=HL_C[S.hl]||"#fff",key=selSt+type+col;let c=OUTL.get(key);if(c)return c;
 const b=silhouette(type).cv;c=mkCanvas(b.width,b.height);const g=c.getContext("2d");
 g.drawImage(b,0,0);g.globalCompositeOperation="source-in";g.fillStyle=col;g.fillRect(0,0,c.width,c.height);OUTL.set(key,c);return c;
}
function prewarmSprites(){for(const t in FAST){if(!stageHas(t))continue;for(let d=0;d<8;d++){getSpr(t,d,0);if(EN[t].ai==="charger"||t==="charger")getSpr(t,d,1)}silhouette(t)}}   // 미리 구워서 첫 등장 시 끊김 방지 (스테이지마다)
const stageHas=t=>{const c2=STG[selSt]&&STG[selSt].ch===2,base=c2?Object.values(CH2MAP):["grunt","runner","charger","tank","bomber"];return base.includes(t)||(SPECIAL[selSt]||[]).some(s=>s[0]===t||(s[0]==="splitter"&&t==="mini")||(s[0]==="mother"&&t==="spore"))};
prewarmSprites();
/* 기절 / 저주 표시 스프라이트 */
const STUNS=(()=>{const c=mkCanvas(40,16),g=c.getContext("2d");for(let i=0;i<3;i++){const x=6+i*14;g.fillStyle="#ffe58a";g.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,r=k%2?2.2:5.5;g.lineTo(x+Math.cos(a)*r,8+Math.sin(a)*r)}g.closePath();g.fill()}return c})();
const CURSE=(()=>{const c=mkCanvas(32,32),g=c.getContext("2d");g.translate(16,16);g.fillStyle="rgba(150,60,220,.9)";g.beginPath();g.arc(0,-2,9,0,7);g.fill();g.fillRect(-6,4,12,6);
 g.fillStyle="#f0d8ff";g.beginPath();g.arc(-3.5,-2,2.4,0,7);g.arc(3.5,-2,2.4,0,7);g.fill();g.fillStyle="#2a0a3a";g.fillRect(-4,6,2,4);g.fillRect(-.5,6,2,4);g.fillRect(3,6,2,4);return c})();
/* 상태이상 표시 (모두 캐시 스프라이트) */
function statusFx(e,y){
 const r=e.r;
 if(statusLite&&!e.elite){ // 적이 많을 때(중간/낮음 품질): 핵심 상태만 표시
  if(e.frozenT>0)ctx.drawImage(ICE,e.x-r*1.35,y-r*1.4,r*2.7,r*2.7);
  else if(e.burnT>0)ctx.drawImage(FLAME,e.x-r*.75,y-r*1.5,r*1.5,r*1.9);
  if(e.stunT>0)ctx.drawImage(STUNS,e.x-15,y-r-14,30,12);
  return;
 }
 if(e.frozenT>0){ctx.globalAlpha=.85;ctx.drawImage(ICE,e.x-r*1.35,y-r*1.4,r*2.7,r*2.7);ctx.globalAlpha=1}
 else if(e.chillN>0||e.slowT>0){ctx.globalAlpha=Math.min(1,.45+e.chillN*.14);ctx.drawImage(FROST,e.x-r*1.25,y-r*1.25,r*2.5,r*2.5);ctx.globalAlpha=1}
 if(e.burnT>0){const f=.85+.15*Math.sin(elapsed*20+e.ph);ctx.drawImage(FLAME,e.x-r*.75,y-r*.2-r*1.3*f,r*1.5,r*1.9*f)}
 if(e.poisonT>0)ctx.drawImage(POIS,e.x-r*1.25,y-r*1.25-3-(elapsed*8+e.ph)%6,r*2.5,r*2.5);
 if(e.shockT>0&&((elapsed*20+e.ph)|0)%3!==0){ctx.save();ctx.translate(e.x,y);ctx.rotate((elapsed*13+e.ph)%6.28);ctx.drawImage(SPARK,-r*1.3,-r*1.3,r*2.6,r*2.6);ctx.restore()}
 if(e.bleedN>0)ctx.drawImage(DROPS,e.x-r*.8,y-r*.1,r*1.6,r*1.6);
 if(e.markT>0)ctx.drawImage(MARK,e.x-9,y-r-(e.elite?34:26),18,18);
 if(e.curseT>0){ctx.globalAlpha=.55+.3*Math.sin(elapsed*6+e.ph);ctx.drawImage(CURSE,e.x+r*.4,y-r-14,16,16);ctx.globalAlpha=1}
 if(e.stunT>0){ctx.save();ctx.translate(e.x,y-r-8);ctx.scale(Math.cos(elapsed*5+e.ph),1);ctx.drawImage(STUNS,-15,-6,30,12);ctx.restore()}
}
function drawEnemyFast(e){
 const r=e.r,t=elapsed;
 let dir=Math.round(Math.atan2(player.y-e.y,player.x-e.x)/.7853981634);dir=(dir%8+8)%8;
 const v=e.ai==="charger"&&e.st===1?1:0,s=getSpr(e.type,dir,v);
 const bob=Math.sin(t*6+e.ph)*1.5;let sx=1,sy=1;
 if(e.type==="grunt"){const q=Math.sin(t*7+e.ph)*.08;sx=1+q;sy=1-q}
 if(e.hit>0){sx*=1.14;sy*=.88}                       // 피격 찌그러짐
 const w=s.sz*sx,h=s.sz*sy,x=e.x-w/2+(v?rand(-1.5,1.5):0),y=e.y+bob-h/2+(1-sy)*r*.5;
 if(S.hl&&!e.phased){const o=outlineSpr(e.type),f=(r+2.4)/r,ow=w*f,oh=h*f;ctx.drawImage(o,x+w/2-ow/2,y+h/2-oh/2,ow,oh)}   // 설정: 적 외곽선 강조
 if(e.phased)ctx.globalAlpha=.28+.1*Math.sin(t*30);
 ctx.drawImage(s.cv,x,y,w,h);ctx.globalAlpha=1;
 if(e.hit>0){ctx.globalAlpha=.75;ctx.drawImage(silhouette(e.type).cv,x,y,w,h);ctx.globalAlpha=1}
 if(e.wardT>0){ctx.strokeStyle="rgba(140,180,255,.75)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y+bob,r+5,0,7);ctx.stroke()}   // 수호자 보호막
 if(e.blinkT>0){ctx.strokeStyle=`rgba(190,90,255,${.5+.4*Math.sin(t*30)})`;ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(e.bx,e.by,r+10,0,7);ctx.stroke();ctx.setLineDash([])}   // 추적자 순간이동 예고
 if(e.ai==="bomber"){
  if(Math.sin(t*(d2(e,player)<16900?26:9)+e.ph)>0){ctx.fillStyle="rgba(255,70,40,.4)";ctx.beginPath();ctx.arc(e.x,e.y+bob,r,0,7);ctx.fill()}
  ctx.fillStyle="#ffdd66";ctx.beginPath();ctx.arc(e.x+r*.3,e.y+bob-r*1.85,2+Math.random()*1.8,0,7);ctx.fill();
 }else if(e.type==="healer"&&e.healT<.6&&e.healT>0){
  ctx.strokeStyle=`rgba(150,255,140,${.8-e.healT})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y+bob,r+6+e.healT*20,0,7);ctx.stroke();
 }else if(e.ai==="tank"&&e.guarded){
  ctx.save();ctx.translate(e.x,e.y+bob);ctx.strokeStyle="rgba(159,216,255,.9)";ctx.fillStyle="rgba(120,190,255,.16)";ctx.lineWidth=3.5;glowOn(14,"#8fd0ff");
  ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.8;ctx.lineTo(Math.cos(a)*r*1.5,Math.sin(a)*r*1.5)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
 statusFx(e,e.y+bob);
}
function drawEnemy(e){ // 벡터 렌더링: 엘리트 / 보스 / 사수 (수가 적어서 고품질 유지)
 const r=e.r,t=elapsed;
 ctx.save();ctx.translate(e.x,e.y);
 ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(0,r*.9,r*.95,r*.32,0,0,7);ctx.fill();
 if(e.elite){const p=.5+.5*Math.sin(t*4+e.ph);ctx.strokeStyle=e.type==="boss"?`rgba(255,60,160,${.35+.3*p})`:`rgba(255,190,60,${.3+.3*p})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,r*.9,r*1.45+p*5,r*.52+p*1.8,0,0,7);ctx.stroke()}
 const bob=e.ai==="shooter"?Math.sin(t*3+e.ph)*4-8:Math.sin(t*6+e.ph)*1.5;
 ctx.translate(0,bob);if(e.hit>0)ctx.scale(1.08,.93);
 if(S.hl){ctx.strokeStyle=HL_C[S.hl];ctx.lineWidth=3;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(0,0,e.r+3,0,7);ctx.stroke();ctx.globalAlpha=1}
 drawEnemyBody(e);
 ctx.restore();
 statusFx(e,e.y+bob);
 if(e.elite){
  ctx.fillStyle="#000b";ctx.fillRect(e.x-r-5,e.y-r-19,(r+5)*2,5);ctx.fillStyle=e.enr?"#ff8a3a":"#ff5b68";ctx.fillRect(e.x-r-5,e.y-r-19,(r+5)*2*Math.max(0,e.hp/e.maxHp),5);
 }
}
/* 플레이어 주변 효과 · 체력바 (캐릭터 본체는 hero.js) */
function drawPlayerFx(){
 // 성기사 보호막
 if(player.sh>0){const k=player.sh/(player.maxHp*.25);ctx.save();ctx.globalAlpha=.25+.45*k;ctx.strokeStyle="#ffe27a";ctx.lineWidth=2.5;ctx.fillStyle="rgba(255,226,122,.08)";
  ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+elapsed*.6;ctx.lineTo(player.x+Math.cos(a)*27,player.y-3+Math.sin(a)*27)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
 // 광전사: 분노 오라 / 빙결 마녀: 냉기 영역
 if(player.rage>0){const k=player.rage/30;ctx.save();ctx.globalAlpha=.15+.35*k;ctx.strokeStyle="#ff4a2a";ctx.lineWidth=2+k*3;ctx.beginPath();ctx.arc(player.x,player.y,24+Math.sin(elapsed*14)*2*k,0,7);ctx.stroke();ctx.restore();
  if(k>.5&&Math.random()<k*.5)spawnP(player.x+rand(-12,12),player.y+rand(-6,14),0,rand(-80,-40),.4,rand(1.4,2.4),"#ff6a3a",0,1,0)}
 if(isJob("cryo")){const R_=150*areaMul();ctx.save();ctx.strokeStyle="rgba(180,235,255,.28)";ctx.lineWidth=2;ctx.setLineDash([10,12]);ctx.lineDashOffset=elapsed*20;ctx.beginPath();ctx.arc(player.x,player.y,R_,0,7);ctx.stroke();ctx.restore()}
 // 레인저: 치명타 버프
 if(player.critT>0){ctx.strokeStyle=`rgba(160,255,150,${Math.min(.8,player.critT*.5)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y,22+Math.sin(elapsed*10)*2,0,7);ctx.stroke()}
 ctx.fillStyle="#000a";ctx.fillRect(player.x-27,player.y-54,54,6);ctx.fillStyle="#62e77c";ctx.fillRect(player.x-27,player.y-54,54*Math.max(0,player.hp/player.maxHp),6);
 if(player.sh>0){ctx.fillStyle="#ffe27a";ctx.fillRect(player.x-27,player.y-54,54*Math.min(1,player.sh/player.maxHp),3)}
 if(player.rage>0){ctx.fillStyle="#000a";ctx.fillRect(player.x-27,player.y-47,54,3);ctx.fillStyle="#ff5a2a";ctx.fillRect(player.x-27,player.y-47,54*player.rage/30,3)}
 if(isJob("ranger")){ctx.fillStyle="#000a";ctx.fillRect(player.x-27,player.y-47,54,3);ctx.fillStyle=player.dashCD>0?"#6a9a6a":"#a8ff9a";ctx.fillRect(player.x-27,player.y-47,54*(1-Math.max(0,player.dashCD)/2.5),3)}
}
/* ── 투사체 스프라이트 (미리 구워 두고 회전해서 그림) ── */
function bakeSpr(w,h,fn){const c=mkCanvas(w*2,h*2),g=c.getContext("2d");g.scale(2,2);g.translate(w/2,h/2);fn(g);return{cv:c,w,h}}
const PS={
 orb:bakeSpr(28,28,g=>{g.drawImage(glow(64,[[0,"rgba(190,150,255,.9)"],[1,"rgba(120,80,255,0)"]]),-14,-14,28,28);
  const gr=g.createRadialGradient(-2,-2,1,0,0,7);gr.addColorStop(0,"#ffffff");gr.addColorStop(.4,"#d8c4ff");gr.addColorStop(1,"#8a5cff");g.fillStyle=gr;g.beginPath();g.arc(0,0,7,0,7);g.fill()}),
 knife:bakeSpr(34,14,g=>{const gr=g.createLinearGradient(0,-4,0,4);gr.addColorStop(0,"#ffffff");gr.addColorStop(.5,"#c8d4e8");gr.addColorStop(1,"#7a88a8");
  g.fillStyle=gr;g.beginPath();g.moveTo(15,0);g.lineTo(-3,-4);g.lineTo(-3,4);g.closePath();g.fill();g.strokeStyle="#4a5878";g.lineWidth=.8;g.stroke();
  g.fillStyle="#f2c14e";g.fillRect(-5,-5.5,2.5,11);g.fillStyle="#4a2e1c";g.fillRect(-12,-2,7,4);g.fillStyle="#f2c14e";g.beginPath();g.arc(-13,0,2,0,7);g.fill()}),
 crystal:bakeSpr(30,20,g=>{g.fillStyle="rgba(150,230,255,.35)";g.beginPath();g.ellipse(0,0,14,9,0,0,7);g.fill();
  const gr=g.createLinearGradient(-8,-6,10,6);gr.addColorStop(0,"#ffffff");gr.addColorStop(.5,"#a8ecff");gr.addColorStop(1,"#4ab0e0");
  g.fillStyle=gr;g.beginPath();g.moveTo(13,0);g.lineTo(2,-7);g.lineTo(-9,-2);g.lineTo(-9,2);g.lineTo(2,7);g.closePath();g.fill();g.strokeStyle="#ffffff";g.lineWidth=1;g.stroke();
  g.strokeStyle="rgba(255,255,255,.7)";g.beginPath();g.moveTo(-6,0);g.lineTo(11,0);g.stroke()}),
 star:bakeSpr(40,40,g=>{g.drawImage(glow(64,[[0,"rgba(255,235,150,.85)"],[1,"rgba(255,200,80,0)"]]),-20,-20,40,40);
  g.fillStyle="#fff6c8";g.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%4===0?15:i%2?5:9;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();
  g.fillStyle="#ffffff";g.beginPath();g.arc(0,0,3.5,0,7);g.fill()}),
 arcane:bakeSpr(40,40,g=>{g.drawImage(glow(64,[[0,"rgba(230,140,255,.8)"],[1,"rgba(160,60,255,0)"]]),-20,-20,40,40);
  const gr=g.createRadialGradient(-3,-3,1,0,0,10);gr.addColorStop(0,"#ffffff");gr.addColorStop(.5,"#e6a0ff");gr.addColorStop(1,"#8a3ad8");g.fillStyle=gr;g.beginPath();g.arc(0,0,10,0,7);g.fill();
  g.strokeStyle="rgba(255,255,255,.85)";g.lineWidth=1.2;g.beginPath();g.arc(0,0,14,0,1.5);g.stroke();g.beginPath();g.arc(0,0,14,3.1,4.6);g.stroke()}),
 cannon:bakeSpr(26,26,g=>{g.drawImage(glow(64,[[0,"rgba(255,150,60,.6)"],[1,"rgba(255,100,30,0)"]]),-13,-13,26,26);
  const gr=g.createRadialGradient(-3,-3,1,0,0,9);gr.addColorStop(0,"#8a90a0");gr.addColorStop(1,"#23262e");g.fillStyle=gr;g.beginPath();g.arc(0,0,9,0,7);g.fill();
  g.strokeStyle="#ff9a4c";g.lineWidth=1.5;g.stroke();g.fillStyle="rgba(255,255,255,.45)";g.beginPath();g.arc(-3,-3,2.5,0,7);g.fill()}),
 boomerang:bakeSpr(30,30,g=>{const gr=g.createLinearGradient(-12,-12,12,12);gr.addColorStop(0,"#eaf6ff");gr.addColorStop(1,"#7ab0e0");g.fillStyle=gr;
  g.beginPath();g.arc(0,0,12,Math.PI*.5,Math.PI*1.5);g.arc(-5,0,10,Math.PI*1.5,Math.PI*.5,true);g.closePath();g.fill();g.strokeStyle="#ffffff";g.lineWidth=1;g.stroke()}),
 crescent:bakeSpr(40,40,g=>{g.drawImage(glow(64,[[0,"rgba(255,230,140,.7)"],[1,"rgba(255,200,80,0)"]]),-20,-20,40,40);
  const gr=g.createLinearGradient(-15,-15,15,15);gr.addColorStop(0,"#fffbe0");gr.addColorStop(1,"#f2c14e");g.fillStyle=gr;
  g.beginPath();g.arc(0,0,16,Math.PI*.5,Math.PI*1.5);g.arc(-6,0,13.6,Math.PI*1.5,Math.PI*.5,true);g.closePath();g.fill()}),
 ebullet:bakeSpr(26,16,g=>{g.drawImage(glow(64,[[0,"rgba(255,70,90,.85)"],[1,"rgba(255,30,60,0)"]]),-13,-8,26,16);
  g.fillStyle="#ff5a6a";g.beginPath();g.moveTo(9,0);g.lineTo(-7,-4.5);g.lineTo(-4,0);g.lineTo(-7,4.5);g.closePath();g.fill();g.fillStyle="#ffe0e4";g.beginPath();g.ellipse(2,0,4,1.8,0,0,7);g.fill()}),
 fireorb:bakeSpr(40,40,g=>{g.drawImage(glow(64,[[0,"rgba(255,140,40,.8)"],[1,"rgba(255,60,20,0)"]]),-20,-20,40,40);
  const gr=g.createRadialGradient(0,-2,1,0,0,11);gr.addColorStop(0,"#fff4c0");gr.addColorStop(.35,"#ffb040");gr.addColorStop(1,"#e8401a");g.fillStyle=gr;g.beginPath();g.arc(0,0,11,0,7);g.fill()}),
 sword:bakeSpr(20,36,g=>{const gr=g.createLinearGradient(-4,0,4,0);gr.addColorStop(0,"#ffffff");gr.addColorStop(.5,"#c8d4ee");gr.addColorStop(1,"#6a7898");
  g.fillStyle=gr;g.beginPath();g.moveTo(0,-17);g.lineTo(4,-12);g.lineTo(3.5,7);g.lineTo(-3.5,7);g.lineTo(-4,-12);g.closePath();g.fill();g.strokeStyle="#3a4868";g.lineWidth=.8;g.stroke();
  g.fillStyle="#f2c14e";g.fillRect(-7,7,14,3);g.fillStyle="#4a2e1c";g.fillRect(-1.8,10,3.6,6);g.fillStyle="#f2c14e";g.beginPath();g.arc(0,17,2.2,0,7);g.fill()}),
 icelance:bakeSpr(46,16,g=>{g.drawImage(glow(64,[[0,"rgba(170,235,255,.7)"],[1,"rgba(120,200,255,0)"]]),-23,-8,46,16);
  const gr=g.createLinearGradient(0,-5,0,5);gr.addColorStop(0,"#ffffff");gr.addColorStop(.5,"#bff3ff");gr.addColorStop(1,"#4ab0e0");g.fillStyle=gr;
  g.beginPath();g.moveTo(22,0);g.lineTo(8,-5);g.lineTo(-18,-2.5);g.lineTo(-21,0);g.lineTo(-18,2.5);g.lineTo(8,5);g.closePath();g.fill();g.strokeStyle="#ffffff";g.lineWidth=.8;g.stroke();
  g.strokeStyle="rgba(255,255,255,.8)";g.beginPath();g.moveTo(-14,0);g.lineTo(18,0);g.stroke()}),
 efire:bakeSpr(26,26,g=>{g.drawImage(glow(64,[[0,"rgba(255,120,30,.9)"],[1,"rgba(255,40,10,0)"]]),-13,-13,26,26);
  const gr=g.createRadialGradient(-1,-1,1,0,0,6);gr.addColorStop(0,"#fff4c0");gr.addColorStop(.5,"#ff9a2a");gr.addColorStop(1,"#c8200a");g.fillStyle=gr;g.beginPath();g.arc(0,0,6,0,7);g.fill()}),
 tesla:bakeSpr(40,40,g=>{g.drawImage(glow(64,[[0,"rgba(255,245,140,.8)"],[1,"rgba(255,220,60,0)"]]),-20,-20,40,40);
  const gr=g.createRadialGradient(-2,-2,1,0,0,8);gr.addColorStop(0,"#ffffff");gr.addColorStop(.5,"#fff27a");gr.addColorStop(1,"#c8a01a");g.fillStyle=gr;g.beginPath();g.arc(0,0,8,0,7);g.fill()}),
 plasma:bakeSpr(46,46,g=>{g.drawImage(glow(64,[[0,"rgba(190,150,255,.85)"],[1,"rgba(120,80,255,0)"]]),-23,-23,46,46);
  const gr=g.createRadialGradient(-2,-2,1,0,0,10);gr.addColorStop(0,"#ffffff");gr.addColorStop(.45,"#d8c8ff");gr.addColorStop(1,"#6a4ad8");g.fillStyle=gr;g.beginPath();g.arc(0,0,10,0,7);g.fill();
  g.strokeStyle="rgba(255,242,122,.9)";g.lineWidth=1.2;g.beginPath();g.ellipse(0,0,15,5,.5,0,7);g.stroke()}),
 swordG:bakeSpr(20,36,g=>{const gr=g.createLinearGradient(-4,0,4,0);gr.addColorStop(0,"#fffbe0");gr.addColorStop(.5,"#ffe27a");gr.addColorStop(1,"#c8902a");
  g.fillStyle=gr;g.beginPath();g.moveTo(0,-17);g.lineTo(4,-12);g.lineTo(3.5,7);g.lineTo(-3.5,7);g.lineTo(-4,-12);g.closePath();g.fill();g.strokeStyle="#7a5210";g.lineWidth=.8;g.stroke();
  g.fillStyle="#ffffff";g.fillRect(-7,7,14,3);g.fillStyle="#3a2210";g.fillRect(-1.8,10,3.6,6)})
};
const SIGIL=(()=>{const c=mkCanvas(128,128),g=c.getContext("2d");g.translate(64,64);g.strokeStyle="#d890ff";g.lineWidth=3;
 g.beginPath();g.arc(0,0,58,0,7);g.stroke();g.lineWidth=1.5;g.beginPath();g.arc(0,0,48,0,7);g.stroke();
 g.lineWidth=2.5;g.beginPath();for(let i=0;i<=5;i++){const a=i*Math.PI*4/5-Math.PI/2;g.lineTo(Math.cos(a)*48,Math.sin(a)*48)}g.stroke();
 g.fillStyle="#f0d8ff";for(let i=0;i<8;i++){const a=i*Math.PI/4;g.fillRect(Math.cos(a)*53-2,Math.sin(a)*53-2,4,4)}return c})();
function spr(p,x,y,a,s){ctx.save();ctx.translate(x,y);if(a)ctx.rotate(a);const w=p.w*(s||1),h=p.h*(s||1);ctx.drawImage(p.cv,-w/2,-h/2,w,h);ctx.restore()}
function drawSword(x,y,ang,col){spr(col==="#ffe27a"?PS.swordG:PS.sword,x,y,ang+Math.PI/2)}
function drawFlameOrb(x,y,big){const f=1+Math.sin(elapsed*18+x*.05)*.1;spr(PS.fireorb,x,y,0,(big?1.25:1.05)*f)}
function drawDropRaw(type){
 if(type==="heal"){glowOn(16,"#60ff80");ctx.fillStyle="#2fbf5f";ctx.beginPath();ctx.arc(0,0,10,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="#0d5a2a";ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle="#fff";ctx.fillRect(-2,-6,4,12);ctx.fillRect(-6,-2,12,4)}
 else if(type==="magnet"){glowOn(16,"#63dfff");ctx.strokeStyle="#ff4d63";ctx.lineWidth=5;ctx.lineCap="butt";ctx.beginPath();ctx.arc(0,-1,6.5,0,Math.PI);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#e9f4ff";ctx.fillRect(-9.2,-8,5.4,6);ctx.fillRect(3.8,-8,5.4,6)}
 else if(type==="chest"){
  ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(0,14,18,5,0,0,7);ctx.fill();
  ctx.shadowBlur=22;ctx.shadowColor="#ffd35a";   // 보상은 중요도가 높아서 항상 발광
  ctx.fillStyle="#8a5a2b";ctx.strokeStyle="#3a2210";ctx.lineWidth=2;ctx.fillRect(-16,-6,32,20);ctx.strokeRect(-16,-6,32,20);
  ctx.fillStyle="#a8703a";ctx.beginPath();ctx.moveTo(-16,-6);ctx.quadraticCurveTo(0,-24,16,-6);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;ctx.fillStyle="#ffd35a";ctx.fillRect(-3,-4,6,9);ctx.fillRect(-16,2,32,3);
 }else{ // bomb
  const pu=.5;
  ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(0,15,13,4,0,0,7);ctx.fill();
  ctx.shadowBlur=14+pu*10;ctx.shadowColor="#ff4a2a";
  const g=ctx.createRadialGradient(-4,-3,2,0,2,13);g.addColorStop(0,"#5b6072");g.addColorStop(1,"#141722");
  ctx.fillStyle=g;ctx.strokeStyle="#000";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,2,12,0,7);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle="rgba(255,255,255,.35)";ctx.beginPath();ctx.ellipse(-4,-2,3.5,2,-.6,0,7);ctx.fill();
  ctx.fillStyle="#d8d0c0";ctx.fillRect(-3,-12,6,4);
  ctx.strokeStyle="#c9a66b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-12);ctx.quadraticCurveTo(6,-18,3,-22);ctx.stroke();
  ctx.fillStyle="#ffdd66";ctx.shadowBlur=10;ctx.shadowColor="#ffb030";ctx.beginPath();ctx.arc(3,-22,2.6,0,7);ctx.fill();
 }
}
/* 드롭 스프라이트: 발광(shadowBlur)이 비싸서 종류별로 한 번만 그려 캐시 → 드롭이 많이 쌓여도 가벼움 */
const DROPSPR={};
function dropSpr(type){
 let c=DROPSPR[type];if(c)return c;
 c=mkCanvas(128,128);const g=c.getContext("2d");g.scale(2,2);g.translate(32,34);const gq=Q.glow;Q.glow=true;ctx=g;
 try{drawDropRaw(type)}finally{ctx=MAINCTX;Q.glow=gq}
 DROPSPR[type]=c;return c;
}
function drawDrop(dr){
 const bob=Math.sin(elapsed*4+dr.x)*2,age=dr.t0!==undefined&&(dr.type==="heal"||dr.type==="magnet")?elapsed-dr.t0:0;
 if(age>50)ctx.globalAlpha=Math.sin(elapsed*12)>0?.4:.9;                      // 사라지기 직전 깜빡임
 ctx.drawImage(dropSpr(dr.type),dr.x-32,dr.y+bob-34,64,64);ctx.globalAlpha=1;
 if(dr.type==="bomb"){ctx.fillStyle="#ffdd66";ctx.beginPath();ctx.arc(dr.x+3,dr.y+bob-22,1.5+Math.random()*1.8,0,7);ctx.fill()}
}
/* ── 렌더링 ── */
const pulseCol={glacier:"#9be8ff",inferno:"#ff7a3a",plague:"#7be35a",flame:"#ff8a3c",rad:"#c8ff5a"};
const TRAIL={icelance:"#bff3ff",abszero:"#e8fbff",shard:"#bff3ff",orb:"#a67cff",knife:"#9fc8ff",crystal:"#9beaff",star:"#ffe27a",arcane:"#dc8cff",cannon:"#ff8a3c",fortress:"#ff8a3c"};
function drawShot(s){
 const a=Math.atan2(s.vy,s.vx);
 if(s.enemy){if(s.fire)spr(PS.efire,s.x,s.y,0,1+.1*Math.sin(elapsed*20));else spr(PS.ebullet,s.x,s.y,a);return}
 const tr=TRAIL[s.kind];
 if(tr){ // 궤적: 속도에 비례한 꼬리 (위치 기록 없이 선 하나로)
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.globalAlpha=.35;ctx.strokeStyle=tr;ctx.lineWidth=s.r*1.1;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(-Math.min(42,Math.hypot(s.vx,s.vy)*.055),0);ctx.stroke();ctx.restore();ctx.globalAlpha=1;
 }
 switch(s.kind){
  case"orb":spr(PS.orb,s.x,s.y,0);break;
  case"knife":spr(PS.knife,s.x,s.y,a);break;
  case"crystal":spr(PS.crystal,s.x,s.y,a);break;
  case"star":spr(PS.star,s.x,s.y,elapsed*6,s.r/8);break;
  case"arcane":spr(PS.arcane,s.x,s.y,elapsed*5);break;
  case"cannon":case"fortress":spr(PS.cannon,s.x,s.y,0,s.r/9);break;
  case"boomerang":spr(PS.boomerang,s.x,s.y,elapsed*18);break;
  case"crescent":spr(PS.crescent,s.x,s.y,elapsed*16);break;
  case"revolver":ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.globalCompositeOperation="lighter";ctx.strokeStyle="rgba(255,200,90,.55)";ctx.lineWidth=4;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-26,0);ctx.lineTo(0,0);ctx.stroke();
   ctx.strokeStyle="#fff8d8";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(3,0);ctx.stroke();ctx.restore();break;
  case"icelance":spr(PS.icelance,s.x,s.y,a);break;
  case"abszero":spr(PS.icelance,s.x,s.y,a,1.4);break;
  case"shard":spr(PS.crystal,s.x,s.y,a,.6);break;
  case"swave":drawSwave(s);break;
 }
}
function drawX(o){
 switch(o.t){
  case"lance":{
   const p=o.life/o.max,x2=o.x+Math.cos(o.a)*o.L,y2=o.y+Math.sin(o.a)*o.L;
   ctx.globalAlpha=Math.max(0,p);ctx.lineCap="round";ctx.strokeStyle=o.steal?"#ff6b88":"#fff2b0";ctx.lineWidth=o.wd*p+4;glowOn(18,o.steal?"#ff3d6a":"#ffd36a");
   ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;break}
  case"mine":{
   ctx.save();ctx.translate(o.x,o.y);
   ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(0,6,11,3.5,0,0,7);ctx.fill();
   ctx.fillStyle="#3b4152";ctx.strokeStyle="#12151f";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,9,0,7);ctx.fill();ctx.stroke();
   for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillRect(Math.cos(a)*9-1.5,Math.sin(a)*9-1.5,3,3)}
   const on=o.arm<=0&&Math.sin(elapsed*10+o.x)>0;ctx.fillStyle=on?"#ff4a3a":"#5a2a2a";if(on)glowOn(10,"#ff4a3a");ctx.beginPath();ctx.arc(0,-1,3,0,7);ctx.fill();
   ctx.restore();break}
  case"bh":{
   const p=1-o.life/o.max,R=o.R*Math.min(1,p*3+.3);
   const g=ctx.createRadialGradient(o.x,o.y,2,o.x,o.y,R);g.addColorStop(0,"rgba(0,0,0,.95)");g.addColorStop(.35,"rgba(50,10,90,.75)");g.addColorStop(1,"rgba(120,60,220,0)");
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,R,0,7);ctx.fill();
   ctx.strokeStyle="rgba(190,140,255,.7)";ctx.lineWidth=2.5;
   for(let i=0;i<3;i++){ctx.beginPath();for(let t=0;t<=1.001;t+=.06){const q=elapsed*5+i*2.09+t*4,rr=R*t;ctx[t===0?"moveTo":"lineTo"](o.x+Math.cos(q)*rr,o.y+Math.sin(q)*rr)}ctx.stroke()}
   break}
  case"met":{
   const p=1-o.delay/o.d0;
   if(o.hostile)dangerZone(o.x,o.y,o.aoe,p);else allyZone(o.x,o.y,o.aoe,p);ctx.save();
   const fx_=o.x+(1-p)*260,fy=o.y-(1-p)*520;
   ctx.strokeStyle="rgba(255,150,60,.55)";ctx.lineWidth=8;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(fx_,fy);ctx.lineTo(fx_+(fx_-o.x)*.4,fy+(fy-o.y)*.4);ctx.stroke();
   glowOn(20,"#ff6a1e");ctx.fillStyle="#ff8a2a";ctx.beginPath();ctx.arc(fx_,fy,o.star?12:9,0,7);ctx.fill();ctx.fillStyle="#ffe58a";ctx.beginPath();ctx.arc(fx_,fy,o.star?6:4,0,7);ctx.fill();
   ctx.restore();break}
  case"shk":{
   ctx.save();ctx.translate(o.x,o.y);ctx.rotate(elapsed*22);glowOn(10,o.shadow?"#a070ff":"#9fd0ff");
   ctx.fillStyle=o.shadow?"#3a2466":"#e6efff";ctx.strokeStyle=o.shadow?"#c9a8ff":"#8fb8ff";ctx.lineWidth=1.5;
   ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?o.r*.38:o.r*1.3;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}
   ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();break}
  case"tesla":{
   const pz=o.pz;spr(pz?PS.plasma:PS.tesla,o.x,o.y+Math.sin(elapsed*3+o.a)*3,0,1+.08*Math.sin(elapsed*12+o.a));
   if(((elapsed*20+o.a*10)|0)%3===0){ctx.strokeStyle=pz?"rgba(210,190,255,.8)":"rgba(255,245,160,.8)";ctx.lineWidth=1.4;ctx.beginPath();const a=Math.random()*6.283;ctx.moveTo(o.x,o.y);ctx.lineTo(o.x+Math.cos(a)*14+rand(-4,4),o.y+Math.sin(a)*14+rand(-4,4));ctx.lineTo(o.x+Math.cos(a)*22,o.y+Math.sin(a)*22);ctx.stroke()}
   break}
  case"wave":{
   if(o.delay>0)break;const p=o.r/o.R;ctx.save();ctx.globalAlpha=Math.max(0,1-p*p);
   ctx.strokeStyle=o.ti?"#ffcf7a":"#e8c890";ctx.lineWidth=(o.ti?16:11)*(1-p*.6);ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,7);ctx.stroke();
   ctx.strokeStyle="rgba(90,60,30,.6)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(o.x,o.y,Math.max(1,o.r-8),0,7);ctx.stroke();ctx.restore();break}
  case"sigil":{
   const armed=o.arm>0,p=armed?1-o.arm/o.a0:1,k=armed?1:Math.max(0,o.life/o.max),s=o.R*2*(armed?.6+.4*p:1+.2*(1-k));
   ctx.save();ctx.translate(o.x,o.y);ctx.rotate(elapsed*(o.doom?1.4:2));ctx.globalAlpha=(armed?.35+.55*p:k)*(o.doom?1:.9);ctx.drawImage(SIGIL,-s/2,-s/2,s,s);
   if(o.doom){ctx.rotate(-elapsed*2.8);ctx.globalAlpha*=.6;ctx.drawImage(SIGIL,-s*.35,-s*.35,s*.7,s*.7)}
   ctx.restore();ctx.globalAlpha=1;break}
  case"grav":{ // 중력 구슬: 어두운 핵 + 소용돌이 + 끌어당기는 범위
   const k=Math.min(1,(o.max-o.life)*4),R_=o.R*k;ctx.save();ctx.globalAlpha=.18;ctx.fillStyle=o.hz?"#5a2aa0":"#3a2a80";ctx.beginPath();ctx.arc(o.x,o.y,R_,0,7);ctx.fill();ctx.globalAlpha=.7;
   ctx.strokeStyle=o.hz?"#d890ff":"#a090ff";ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(o.x,o.y,R_*(.35+i*.22),elapsed*(3+i)+i,elapsed*(3+i)+i+2.2);ctx.stroke()}
   ctx.globalAlpha=1;ctx.drawImage(glowSpr(o.hz?"rgba(200,120,255,.9)":"rgba(150,130,255,.9)"),o.x-22,o.y-22,44,44);ctx.fillStyle="#08040f";ctx.beginPath();ctx.arc(o.x,o.y,o.hz?11:8,0,7);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=1.2;ctx.stroke();ctx.restore();break}
  case"chain":{ // 사슬 낫: 사슬 선 + 끝의 낫날
   const p=o.life/o.max,x2=o.x+Math.cos(o.a)*o.L,y2=o.y+Math.sin(o.a)*o.L;ctx.save();ctx.globalAlpha=p;ctx.strokeStyle=o.hc?"#ff5a7a":"#c8ccd6";ctx.lineWidth=3;ctx.setLineDash([5,3]);
   ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);ctx.translate(x2,y2);ctx.rotate(o.a);ctx.fillStyle="#eef0f6";ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(10,-14,-4,-18);ctx.quadraticCurveTo(4,-10,-2,0);ctx.closePath();ctx.fill();ctx.restore();break}
  case"rail":{ // 레일건 광선
   const p=o.life/o.max,x2=o.x+Math.cos(o.a)*o.L,y2=o.y+Math.sin(o.a)*o.L;ctx.save();ctx.lineCap="round";ctx.globalCompositeOperation="lighter";
   ctx.globalAlpha=p*.5;ctx.strokeStyle=o.gold?"#ffb84a":"#4ad8ff";ctx.lineWidth=26*p+4;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(x2,y2);ctx.stroke();
   ctx.globalAlpha=p;ctx.strokeStyle="#e8fcff";ctx.lineWidth=6*p+1;ctx.stroke();ctx.restore();break}
  case"pillar":{ // 궤도 포격 기둥
   const p=o.life/o.max;ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=p*.6;ctx.fillStyle="#5ad8ff";ctx.fillRect(o.x-o.R*.45*p,o.y-700,o.R*.9*p,700);
   ctx.globalAlpha=p;ctx.fillStyle="#ffffff";ctx.fillRect(o.x-4*p,o.y-700,8*p,700);ctx.drawImage(glowSpr("rgba(140,230,255,.9)"),o.x-o.R,o.y-o.R*.6,o.R*2,o.R*1.2);ctx.restore();break}
  case"dyna":{ // 다이너마이트 (날아가는 중) + 착탄 예고
   allyZone(o.tx,o.ty,o.R,Math.min(1,o.f>0?o.f*1.6:0));ctx.save();
   ctx.translate(o.x,o.y);ctx.rotate(elapsed*14);ctx.fillStyle="#c8302e";ctx.fillRect(-7,-3,14,6);ctx.fillStyle="#f4f1e8";ctx.fillRect(-2,-3,1.5,6);ctx.fillRect(1,-3,1.5,6);
   ctx.fillStyle="#ffdd66";ctx.beginPath();ctx.arc(8,0,2+Math.random()*1.5,0,7);ctx.fill();ctx.restore();break}
  case"saw":{ // 적대 톱날: 예고선 → 회전 톱날
   if(o.warn>0){const k=1-o.warn/1.1;ctx.save();ctx.strokeStyle=`rgba(255,60,40,${.25+.45*k})`;ctx.lineWidth=o.r*2*(.3+.7*k);ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x+o.vx*4,o.y+o.vy*4);ctx.stroke();ctx.restore();break}
   ctx.save();ctx.translate(o.x,o.y);ctx.rotate(elapsed*20);ctx.fillStyle="#c8ccd6";ctx.strokeStyle="#2a2a30";ctx.lineWidth=1.5;ctx.beginPath();
   for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?o.r*.78:o.r;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#6a6a74";ctx.beginPath();ctx.arc(0,0,o.r*.35,0,7);ctx.fill();ctx.restore();break}
  case"well":{ // 중력 우물: 예고 → 소용돌이
   const k=o.warn>0?1-o.warn:1,fade=Math.min(1,o.life);ctx.save();ctx.globalAlpha=(o.warn>0?.35:.55)*fade;
   const g=ctx.createRadialGradient(o.x,o.y,4,o.x,o.y,o.R*k);g.addColorStop(0,"rgba(10,0,30,.95)");g.addColorStop(.25,"rgba(90,40,180,.55)");g.addColorStop(1,"rgba(120,80,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,o.R*k,0,7);ctx.fill();
   ctx.strokeStyle="#b090ff";ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();for(let u=0;u<=1.001;u+=.08){const q=-elapsed*2.5+i*1.57+u*5,rr=o.R*k*u;ctx[u===0?"moveTo":"lineTo"](o.x+Math.cos(q)*rr,o.y+Math.sin(q)*rr)}ctx.stroke()}
   ctx.globalAlpha=fade;ctx.strokeStyle="#ff4a6a";ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(o.x,o.y,34,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore();break}
  case"nova":{
   const p=1-o.life/o.max;ctx.globalAlpha=Math.max(0,1-p);ctx.strokeStyle="#ffd9a0";ctx.lineWidth=16*(1-p)+2;ctx.shadowBlur=24;ctx.shadowColor="#ff8a3c";
   ctx.beginPath();ctx.arc(o.x,o.y,1400*p,0,7);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;break}
 }
}
function drawParticles(onScr){
 if(!pN)return;
 ctx.lineCap="round";
 for(let i=0;i<pN;i++){
  const p=PART[i];if(!onScr(p.x,p.y,20))continue;
  ctx.globalAlpha=p.life/p.max;
  if(p.k===1){ctx.strokeStyle=p.c;ctx.lineWidth=p.r;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.stroke()}
  else if(p.k===2){ctx.fillStyle=p.c;const rr=p.r*(1.6-p.life/p.max*.6);if(pN>300)ctx.fillRect(p.x-rr*.85,p.y-rr*.85,rr*1.7,rr*1.7);else{ctx.beginPath();ctx.arc(p.x,p.y,rr,0,7);ctx.fill()}}
  else{ctx.fillStyle=p.c;ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2)}
 }
 ctx.globalAlpha=1;
}
function drawNums(onScr){
 if(!nN)return;
 ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="rgba(0,0,0,.72)";
 ctx.font="bold 12px system-ui";                     // 폰트 설정은 비싸므로 일반/치명타 두 번만
 for(let i=0;i<nN;i++){const n=NUM[i];if(n.crit||!onScr(n.x,n.y,30))continue;ctx.globalAlpha=Math.min(1,n.life*2.5);ctx.fillStyle=n.c;ctx.strokeText(n.t,n.x,n.y);ctx.fillText(n.t,n.x,n.y)}
 ctx.font="900 18px system-ui";ctx.lineWidth=4;
 for(let i=0;i<nN;i++){
  const n=NUM[i];if(!n.crit||!onScr(n.x,n.y,40))continue;
  const age=n.max-n.life,s=age<.1?1.8-age*8:1;       // 튀어나오는 팝 애니메이션
  ctx.globalAlpha=Math.min(1,n.life*2.5);ctx.save();ctx.translate(n.x,n.y);ctx.scale(s,s);ctx.fillStyle=n.c;ctx.strokeText(n.t,0,0);ctx.fillText(n.t,0,0);ctx.restore();
 }
 ctx.globalAlpha=1;ctx.textAlign="start";
}
/* ── 한 프레임 그리기 ──
   조명을 받는 층(지형·자국·적·플레이어) → 조명(어둠 + 광원) → 스스로 빛나는 층(효과·투사체·보석·파티클·글자) */
let VX0=0,VX1=0,VY0=0,VY1=0;                                    // 현재 화면의 월드 좌표 범위
function onScr(x,y,m){return x>VX0-m&&x<VX1+m&&y>VY0-m&&y<VY1+m}   // 화면 밖 렌더링 생략
function draw(){
 ctx.clearRect(0,0,W,H);
 const vw=W/ZM,vh=H/ZM,camX=Math.round(W/2-cam.x*ZM),camY=Math.round(H/2-cam.y*ZM);
 VX0=cam.x-vw/2;VX1=cam.x+vw/2;VY0=cam.y-vh/2;VY1=cam.y+vh/2;
 ctx.save();ctx.translate(camX,camY);if(ZM!==1)ctx.scale(ZM,ZM);
 drawTerrain();
 drawDecals();
 if(S.bgDim){ctx.fillStyle=`rgba(0,0,0,${S.bgDim})`;ctx.fillRect(VX0-4,VY0-4,VX1-VX0+8,VY1-VY0+8)}   // 설정: 배경 어둡게 (적·캐릭터 구분)
 drawEnemies();
 drawPlayer();
 drawLighting();
 drawPickups();
 // 내 공격 이펙트: '이펙트 투명도' 설정이 100%가 아니면 별도 캔버스에 그린 뒤 반투명으로 합성
 const fxa=S.fxa===undefined?1:S.fxa,sep=fxa<.99;
 if(sep)fxBegin();
 drawGroundFx(false);
 drawAuras();
 drawShots(false);
 drawOverFx();
 drawRingWeapons();
 drawBeams();
 drawSpecials(false);
 drawSwordFx();
 drawParticles(onScr);
 drawGlowFx();
 if(sep)fxEnd(fxa);
 // 위험 요소는 항상 선명하게: 적 탄, 돌진 예고, 보스 내려찍기, 용암·포자, 적대 유성·톱날·중력 우물
 drawGroundFx(true);
 drawShots(true);
 drawSpecials(true);
 drawPlayerGlow();
 drawFloatTexts();
 drawNums(onScr);
 ctx.restore();
 // 화면 좌표 레이어
 drawChestArrows();
 drawBossArrows();
 drawGunHud();
 drawJoy();
 drawDebug();
}
/* 모바일 가상 조이스틱 표시 */
/* 총잡이: 마우스 조준선 · 탄약/재장전 표시 · 데드아이 표적 */
function drawGunHud(){
 const g=player.gun;if(!g||!running)return;
 const sx=W/2+(player.x-cam.x)*ZM,sy=H/2+(player.y-cam.y)*ZM;
 // 탄약: 플레이어 아래 실린더 점 / 재장전 원호
 const n=gunCyl();ctx.save();
 if(g.rl>0){const p=1-g.rl/gunRel();ctx.strokeStyle="#ffe58a";ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy+30*ZM,8,-1.57,-1.57+p*6.283);ctx.stroke()}
 else{const w=Math.min(5,60/n);for(let i=0;i<n;i++){ctx.fillStyle=g.stormT>0?"#ff8a3c":i<g.ammo?"#ffd36a":"rgba(255,255,255,.18)";ctx.fillRect(sx-n*w/2+i*w,sy+26*ZM,w-1.2,4)}}
 // 데드아이 표적
 if(g.dead)for(const e of g.dead.list){if(e.hp<=0)continue;const ex=W/2+(e.x-cam.x)*ZM,ey=H/2+(e.y-cam.y)*ZM,r=(e.r+10)*ZM;
  ctx.strokeStyle="#ff3a3a";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(ex,ey,r,0,7);ctx.moveTo(ex-r-6,ey);ctx.lineTo(ex-r+6,ey);ctx.moveTo(ex+r-6,ey);ctx.lineTo(ex+r+6,ey);ctx.moveTo(ex,ey-r-6);ctx.lineTo(ex,ey-r+6);ctx.moveTo(ex,ey+r-6);ctx.lineTo(ex,ey+r+6);ctx.stroke()}
 // 마우스 조준선
 if(mouse.used&&!TOUCH&&!paused){const mx=mouse.x,my=mouse.y,sp=g.rl>0?10:6+(g.cd>0?3:0);
  ctx.strokeStyle="rgba(0,0,0,.6)";ctx.lineWidth=4;ctx.beginPath();ctx.arc(mx,my,9,0,7);ctx.stroke();
  ctx.strokeStyle=g.rl>0?"#ff9a5a":"#fff2c0";ctx.lineWidth=2;ctx.beginPath();ctx.arc(mx,my,9,0,7);ctx.stroke();
  ctx.beginPath();for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(mx+a*(sp+6),my+b*(sp+6));ctx.lineTo(mx+a*(sp+13),my+b*(sp+13))}ctx.stroke();
  ctx.fillStyle="#ff3a3a";ctx.fillRect(mx-1.5,my-1.5,3,3)}
 ctx.restore();
}
let FXC=null,FXG=null;
function fxBegin(){
 if(!FXC||FXC.width!==canvas.width||FXC.height!==canvas.height){FXC=mkCanvas(canvas.width,canvas.height);FXG=FXC.getContext("2d")}
 FXG.setTransform(1,0,0,1,0,0);FXG.clearRect(0,0,FXC.width,FXC.height);FXG.setTransform(MAINCTX.getTransform());ctx=FXG;
}
function fxEnd(a){ctx=MAINCTX;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=a;ctx.drawImage(FXC,0,0);ctx.restore()}
function drawJoy(){
 if(!joy.on)return;
 ctx.save();ctx.globalAlpha=.35;ctx.fillStyle="#0b111c";ctx.strokeStyle="#ffffff";ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(joy.ox,joy.oy,JOY_R,0,7);ctx.fill();ctx.stroke();
 ctx.globalAlpha=.6;ctx.fillStyle="#f2c14e";ctx.beginPath();ctx.arc(joy.ox+joy.x*JOY_R,joy.oy+joy.y*JOY_R,22,0,7);ctx.fill();ctx.restore();
}
/* 지형 (청크 캐시) — 이번 프레임에 보이는 청크는 VIS에 모아 광원 수집에 사용 */
const VIS=[];
function drawTerrain(){
 VIS.length=0;
 const vx=VX0-16,vy=VY0-16,vw=VX1-VX0+32,vh=VY1-VY0+32;
 for(let gx=Math.floor(vx/CS),gx1=Math.floor((vx+vw)/CS);gx<=gx1;gx++)for(let gy=Math.floor(vy/CS),gy1=Math.floor((vy+vh)/CS);gy<=gy1;gy++){const c=getChunk(gx,gy,elapsed);ctx.drawImage(c.cv,gx*CS,gy*CS);VIS.push(c)}
}
/* 바닥 자국 */
function drawDecals(){
 for(const d of decals){
  if(!onScr(d.x,d.y,d.r*2))continue;
  ctx.globalAlpha=Math.min(1,d.life/2)*(d.t==="splat"?.5:.8);
  const img=d.t==="splat"?splatSpr(d.c):DEC[d.t],s=d.r*2.4;
  ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.drawImage(img,-s/2,-s/2,s,s);ctx.restore();
 }
 ctx.globalAlpha=1;
}
/* ── 조명: 1/4 해상도 캔버스에 어둠을 칠하고 광원 위치를 지워낸 뒤(destination-out) 화면에 확대 ── */
const LSC=4,LX=new Float32Array(160),LY=new Float32Array(160),LR=new Float32Array(160);
let LC=null,LG=null,lN=0;
function addLight(x,y,r){if(lN>=Q.lmax||r<4||!onScr(x,y,r))return;LX[lN]=x;LY[lN]=y;LR[lN]=r;lN++}
function collectLights(){
 lN=0;
 addLight(player.x,player.y,[340,300,310,300,320,290][selSt]||300);
 for(const c of VIS)for(const l of c.lights)addLight(l.x,l.y,l.r*(.9+.1*Math.sin(elapsed*3+l.x)));   // 지형 광원 먼저 (한도 초과 시 청크 단위로 어두워지는 이음새 방지)
 for(const d of drops)if(d.type==="chest"||d.type==="bomb")addLight(d.x,d.y,110);
 for(const e of enemies)if(e.elite)addLight(e.x,e.y,e.r*5);
 for(const ef of effects){
  switch(ef.type){
   case"boom":case"eboom":addLight(ef.x,ef.y,ef.r*2.8*(ef.life/ef.max+.3));break;
   case"bolt":addLight(ef.x,ef.y,190);break;
   case"light":addLight(ef.x,ef.y,ef.r*(ef.life/ef.max));break;
   case"pulse":addLight(player.x,player.y,ef.r*1.7);break;
   case"cloud":if(!ef.fire||ef.radius>30)addLight(ef.x,ef.y,ef.radius*(ef.fire?1.8:1.2));break;
   case"lava":addLight(ef.x,ef.y,ef.r*2.6);break;
   case"cone":addLight(player.x+Math.cos(ef.a)*ef.R*.5,player.y+Math.sin(ef.a)*ef.R*.5,ef.R*1.3);break;
   case"slam":addLight(ef.x,ef.y,ef.r*1.6);break;
  }
 }
 for(const k in weapons){const w=weapons[k];if(!(w.level>0))continue;
  if(w.kind==="flame"||w.kind==="inferno")for(let i=0,n=wc(w);i<n;i++){const p=ringPos(w,i);addLight(p.x,p.y,95)}
  else if(w.kind==="beam"||w.kind==="prism"){const n=wc(w),L=beamLen(w);for(let i=0;i<n;i++){const a=beamAng(w,i,n);addLight(player.x+Math.cos(a)*L*.5,player.y+Math.sin(a)*L*.5,L*.8)}}}
 for(const o of xs){if(o.t==="met")addLight(o.x,o.y,o.aoe*2*(1-o.delay/o.d0)+30);else if(o.t==="bh")addLight(o.x,o.y,220);else if(o.t==="mine")addLight(o.x,o.y,45);
  else if(o.t==="tesla")addLight(o.x,o.y,o.pz?150:120);else if(o.t==="grav")addLight(o.x,o.y,o.R*1.3);else if(o.t==="saw"&&o.warn<=0)addLight(o.x,o.y,90);else if(o.t==="pillar")addLight(o.x,o.y,o.R*3);else if(o.t==="sigil")addLight(o.x,o.y,o.R*1.8);else if(o.t==="wave"&&o.delay<=0)addLight(o.x,o.y,o.r*1.4)}
 for(let i=0;i<shots.length&&lN<Q.lmax*.8;i+=2){const s=shots[i];addLight(s.x,s.y,s.enemy?60:75)}   // 탄 광원은 절반만
}
let lightF=0,LVX=0,LVY=0;const LM=10;   // LM: 조명 캔버스 가장자리 여백(저해상도 px)
function drawLighting(){
 if(!Q.light)return;
 const lw=Math.ceil(W/LSC)+LM*2,lh=Math.ceil(H/LSC)+LM*2;
 const L=STAGE_LOOK[selSt];
 let fresh=false;
 if(!LC||LC.width!==lw||LC.height!==lh){LC=mkCanvas(lw,lh);LG=LC.getContext("2d");fresh=true}
 // 광원이 많을 땐 조명 레이어를 2프레임에 1번만 다시 그림 (그 사이엔 카메라 이동만큼 밀어서 사용)
 if(fresh||!(paused||!running)&&(++lightF&1)===0||lN<40||paused||!running){
  collectLights();
  LG.globalCompositeOperation="source-over";LG.clearRect(0,0,lw,lh);
  LG.fillStyle=`rgba(${L.amb},${L.dark})`;LG.fillRect(0,0,lw,lh);
  LG.globalCompositeOperation="destination-out";
  const zs=ZM/LSC;for(let i=0;i<lN;i++){const r=LR[i]*zs,x=(LX[i]-VX0)*zs+LM,y=(LY[i]-VY0)*zs+LM;LG.drawImage(LIGHT,x-r,y-r,r*2,r*2)}
  LVX=VX0;LVY=VY0;
 }
 const ox=(LVX-VX0)*ZM-LM*LSC,oy=(LVY-VY0)*ZM-LM*LSC;
 ctx.save();ctx.setTransform(D,0,0,D,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(LC,ox,oy,lw*LSC,lh*LSC);ctx.restore();
 if(L.em){ // 용암/독늪/별빛 강은 스스로 빛남: 청크별 저해상도 발광 마스크를 가산 합성 (청크당 drawImage 1회)
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.imageSmoothingEnabled=true;ctx.globalAlpha=.3+.06*Math.sin(elapsed*2.2);
  for(const c of VIS)if(c.em)ctx.drawImage(c.em,1,1,LOWN,LOWN,c.x0,c.y0,CS,CS);ctx.restore();
 }
}
/* 색 있는 발광 (폭발·반응 등): 가산 합성, 캐시한 스프라이트 사용 */
function drawGlowFx(){
 if(!Q.light)return;
 ctx.globalCompositeOperation="lighter";
 for(const ef of effects){
  if(ef.type!=="light"||!onScr(ef.x,ef.y,ef.r))continue;
  const k=ef.life/ef.max,s=ef.r*.9;ctx.globalAlpha=k*.45;ctx.drawImage(glowSpr(ef.c),ef.x-s/2,ef.y-s/2,s,s);
 }
 ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";
}
/* 드롭 / 보석 */
function drawPickups(){
 for(const dr of drops)if(onScr(dr.x,dr.y,40))drawDrop(dr);
 for(const g of gems){if(!onScr(g.x,g.y,20))continue;const s=g.r*4.4,bob=Math.sin(elapsed*4+g.x*.1)*1.5;ctx.drawImage(gemTiers[g.t],g.x-s/2,g.y-s/2+bob,s,s)}
}
/* 바닥 효과: 돌진 예고선, 독구름, 폭발, 내려찍기 예고 */
const HOSTILE_FX={spore:1,lava:1,eboom:1,slam:1};
/* ── 공격 예고 표준 ──
   적 공격(위험): 빨간 반투명 바닥 + 굵은 실선 테두리 + 시간이 지날수록 안쪽이 차오름 + 중앙 ⚠
   내 공격(아군): 하늘색 얇은 점선(회전) + 작은 조준점, 빨간색 사용 안 함 */
function dangerZone(x,y,R,p){
 ctx.save();const pulse=.5+.5*Math.sin(elapsed*18);
 ctx.fillStyle=`rgba(255,25,35,${.1+.1*p})`;ctx.beginPath();ctx.arc(x,y,R,0,7);ctx.fill();
 ctx.fillStyle=`rgba(255,40,40,${.18+.22*p})`;ctx.beginPath();ctx.arc(x,y,Math.max(1,R*p),0,7);ctx.fill();
 ctx.strokeStyle=`rgba(255,${40+60*pulse|0},${40+30*pulse|0},${.75+.25*p})`;ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(x,y,R,0,7);ctx.stroke();
 if(R>26){ctx.fillStyle=`rgba(255,235,220,${.55+.45*pulse})`;ctx.font="900 "+Math.min(26,R*.35|0)+"px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("⚠",x,y)}
 ctx.restore();
}
function allyZone(x,y,R,p){
 ctx.save();ctx.strokeStyle=`rgba(120,225,255,${.45+.4*p})`;ctx.lineWidth=2;ctx.setLineDash([7,8]);ctx.lineDashOffset=-elapsed*40;
 ctx.beginPath();ctx.arc(x,y,R,0,7);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle=`rgba(120,225,255,${.05+.07*p})`;ctx.beginPath();ctx.arc(x,y,R*p,0,7);ctx.fill();
 ctx.strokeStyle="rgba(200,245,255,.8)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-7,y);ctx.lineTo(x+7,y);ctx.moveTo(x,y-7);ctx.lineTo(x,y+7);ctx.stroke();
 ctx.restore();
}
function drawGroundFx(hostile){
 if(hostile)for(const e of enemies)if(e.ai==="charger"&&e.st===1&&onScr(e.x,e.y,400)){
  const k=1-e.tm/.75,a=.25+.35*k;ctx.save();ctx.strokeStyle=`rgba(255,40,40,${a})`;ctx.lineWidth=e.r*1.3;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+e.dx*380,e.y+e.dy*380);ctx.stroke();
  ctx.strokeStyle=`rgba(255,90,80,${.6+.4*k})`;ctx.lineWidth=2.5;ctx.stroke();
  const hx=e.x+e.dx*380,hy=e.y+e.dy*380,an=Math.atan2(e.dy,e.dx);ctx.fillStyle=`rgba(255,70,60,${.6+.4*k})`;ctx.beginPath();ctx.moveTo(hx+Math.cos(an)*18,hy+Math.sin(an)*18);ctx.lineTo(hx+Math.cos(an+2.4)*16,hy+Math.sin(an+2.4)*16);ctx.lineTo(hx+Math.cos(an-2.4)*16,hy+Math.sin(an-2.4)*16);ctx.closePath();ctx.fill();ctx.restore();
 }
 for(const ef of effects){
  if(!HOSTILE_FX[ef.type]!==!hostile)continue;
  if(ef.type==="cloud"&&ef.fire){ // 불길 장판: 캐시한 발광 스프라이트 + 일렁이는 불꽃
   if(!onScr(ef.x,ef.y,ef.radius))continue;
   const a=Math.min(1,ef.life/.5),R_=ef.radius;ctx.globalAlpha=a*.75;ctx.drawImage(glowSpr("rgba(255,110,30,.55)"),ef.x-R_*1.3,ef.y-R_*1.3,R_*2.6,R_*2.6);
   const f=.8+.2*Math.sin(elapsed*16+ef.x);ctx.globalAlpha=a*.9;ctx.drawImage(FLAME,ef.x-R_*.45,ef.y-R_*1.1*f,R_*.9,R_*1.1*f);ctx.globalAlpha=1;
  }else if(ef.type==="spore"){ // 포자 구름 (플레이어 둔화)
   if(!onScr(ef.x,ef.y,ef.r))continue;const a=Math.min(1,ef.life)*.55;ctx.globalAlpha=a;ctx.drawImage(glowSpr("rgba(200,140,255,.7)"),ef.x-ef.r*1.2,ef.y-ef.r*1.2,ef.r*2.4,ef.r*2.4);ctx.globalAlpha=1;
  }else if(ef.type==="lava"){
   if(!onScr(ef.x,ef.y,ef.r*1.5))continue;
   const a=Math.min(1,ef.life/1)*Math.min(1,(ef.max-ef.life)*4),R_=ef.r;
   ctx.globalAlpha=a*.85;ctx.drawImage(glowSpr("rgba(255,90,20,.8)"),ef.x-R_*1.5,ef.y-R_*1.5,R_*3,R_*3);
   ctx.fillStyle=`rgba(255,${170+40*Math.sin(elapsed*5+ef.x)|0},60,${a*.7})`;ctx.beginPath();ctx.ellipse(ef.x,ef.y,R_*.8,R_*.55,0,0,7);ctx.fill();ctx.globalAlpha=1;
  }else if(ef.type==="cloud"){
   if(!onScr(ef.x,ef.y,ef.radius))continue;
   const a=Math.min(1,ef.life/.6)*.9;ctx.save();ctx.globalAlpha=a*.85;
   ctx.drawImage(glowSpr("rgba(120,225,85,.5)"),ef.x-ef.radius*1.25,ef.y-ef.radius*1.25,ef.radius*2.5,ef.radius*2.5);ctx.globalAlpha=a;   // 캐시된 원형 발광
   ctx.fillStyle="rgba(150,240,110,.22)";for(let i=0;i<4;i++){const q=elapsed*1.5+i*1.6;ctx.beginPath();ctx.arc(ef.x+Math.cos(q)*ef.radius*.5,ef.y+Math.sin(q*1.2)*ef.radius*.5,ef.radius*.28,0,7);ctx.fill()}
   ctx.restore();
  }else if(ef.type==="boom"){
   if(!onScr(ef.x,ef.y,ef.r))continue;
   const p=1-ef.life/ef.max,k=1-p;ctx.save();
   ctx.globalAlpha=k*.6;ctx.fillStyle="#ff9d3c";ctx.beginPath();ctx.arc(ef.x,ef.y,ef.r*(.45+.55*p),0,7);ctx.fill();
   ctx.globalAlpha=k;ctx.strokeStyle="#fff2b0";ctx.lineWidth=4*k+1;ctx.stroke();
   if(p<.4){ctx.globalAlpha=1-p/.4;ctx.fillStyle="#fffbe8";ctx.beginPath();ctx.arc(ef.x,ef.y,ef.r*.38*(1-p),0,7);ctx.fill()}   // 폭발 중심 섬광
   ctx.restore();
  }
  else if(ef.type==="eboom"){if(!onScr(ef.x,ef.y,ef.r))continue;const p=1-ef.life/ef.max;ctx.save();ctx.globalAlpha=(1-p)*.7;ctx.fillStyle="#ff4a3a";ctx.beginPath();ctx.arc(ef.x,ef.y,ef.r*(.4+.6*p),0,7);ctx.fill();ctx.strokeStyle="#ffd0c0";ctx.lineWidth=3;ctx.stroke();ctx.restore()}
  else if(ef.type==="slam"){dangerZone(ef.x,ef.y,ef.r,1-ef.life/ef.max)}
 }
}
/* 오라 무기 바닥 표시 (빙하 심장 / 역병의 안개 / 태풍의 눈) */
function drawAuras(){
 for(const k in weapons){
  const w=weapons[k];if(!(w.level>0))continue;
  const AR=w.range*areaMul();
  if(w.kind==="glacier"){ctx.save();ctx.translate(player.x,player.y);ctx.fillStyle="rgba(140,220,255,.10)";ctx.strokeStyle="rgba(190,240,255,.6)";ctx.lineWidth=3;ctx.setLineDash([14,10]);ctx.lineDashOffset=-elapsed*30;ctx.beginPath();ctx.arc(0,0,AR,0,7);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="rgba(220,250,255,.7)";for(let i=0;i<6;i++){const q=elapsed*.8+i*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(q)*AR*.7,Math.sin(q)*AR*.7,4,0,7);ctx.fill()}ctx.restore()}
  else if(w.kind==="plague"){ctx.save();ctx.translate(player.x,player.y);const g=ctx.createRadialGradient(0,0,20,0,0,AR);g.addColorStop(0,"rgba(120,220,80,.05)");g.addColorStop(1,"rgba(120,220,80,.22)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,AR,0,7);ctx.fill();ctx.fillStyle="rgba(150,240,110,.18)";for(let i=0;i<7;i++){const q=elapsed*.6+i*.9;ctx.beginPath();ctx.arc(Math.cos(q)*AR*.6,Math.sin(q*1.3)*AR*.6,AR*.16,0,7);ctx.fill()}ctx.restore()}
 }
}
function drawShots(enemy){for(const s of shots)if(!s.enemy===!enemy&&onScr(s.x,s.y,40))drawShot(s)}
/* 적: 일반 적은 캐시 스프라이트, 엘리트/보스/사수는 벡터 */
let statusLite=false;
function drawEnemies(){
 statusLite=qi>0&&enemies.length>250;
 // 그림자 일괄 그리기: 적마다 drawImage 1회 → 전체 경로 1번 채우기 (그리기 호출 수 대폭 감소)
 ctx.fillStyle="rgba(0,0,0,.36)";ctx.beginPath();
 for(const e of enemies)if(FAST[e.type]&&onScr(e.x,e.y,80)){const r=e.r;ctx.moveTo(e.x+r*.95,e.y+r*.9);ctx.ellipse(e.x,e.y+r*.9,r*.95,r*.32,0,0,6.2832)}
 ctx.fill();
 for(const e of enemies)if(onScr(e.x,e.y,80)){if(FAST[e.type])drawEnemyFast(e);else drawEnemy(e)}
}
/* 적 위에 그리는 효과: 번개 / 연쇄 번개 / 전류 / 펄스 / 충격파 링 / 섬광 / 처형 베기 */
function drawOverFx(){
 for(const ef of effects){
  if(ef.type==="bolt"){ctx.strokeStyle="#bdeaff";ctx.lineWidth=5;ctx.shadowBlur=15;ctx.shadowColor="#8ceaff";ctx.beginPath();ctx.moveTo(ef.x,ef.y-95);for(let i=0;i<6;i++)ctx.lineTo(ef.x+rand(-22,22),ef.y-95+i*32);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle="#ffffff";ctx.lineWidth=1.5;ctx.stroke()}
  else if(ef.type==="chain"){ctx.strokeStyle="#d9f0ff";ctx.lineWidth=4;ctx.shadowBlur=16;ctx.shadowColor="#8ceaff";ctx.beginPath();ef.pts.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else{const a=ef.pts[i-1];ctx.lineTo((a.x+p.x)/2+rand(-10,10),(a.y+p.y)/2+rand(-10,10));ctx.lineTo(p.x,p.y)}});ctx.stroke();ctx.shadowBlur=0}
  else if(ef.type==="zap"){ctx.globalAlpha=Math.max(0,ef.life/ef.max);ctx.strokeStyle=ef.c||"#fff27a";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ef.x,ef.y);ctx.lineTo((ef.x+ef.x2)/2+rand(-12,12),(ef.y+ef.y2)/2+rand(-12,12));ctx.lineTo(ef.x2,ef.y2);ctx.stroke();ctx.globalAlpha=1}
  else if(ef.type==="slash"){const p=1-ef.life/ef.max;ctx.save();ctx.translate(ef.x,ef.y);ctx.rotate(ef.a);ctx.globalAlpha=1-p;ctx.lineCap="round";ctx.strokeStyle="#ff2a4a";ctx.lineWidth=7*(1-p)+1;ctx.beginPath();ctx.moveTo(-44*(.5+p),0);ctx.lineTo(44*(.5+p),0);ctx.stroke();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();ctx.restore();ctx.globalAlpha=1}
  else if(ef.type==="pulse"){const p=1-ef.life/ef.max;ctx.globalAlpha=Math.max(0,1-p);ctx.strokeStyle=pulseCol[ef.kind];ctx.lineWidth=ef.kind==="flame"?9:6;ctx.beginPath();ctx.arc(player.x,player.y,ef.r*(.4+.6*p),0,7);ctx.stroke();if(ef.kind==="flame"){ctx.fillStyle="rgba(255,120,40,.12)";ctx.fill()}ctx.globalAlpha=1}
  else if(ef.type==="ring"){if(!onScr(ef.x,ef.y,ef.r1))continue;const p=1-ef.life/ef.max,e2=1-(1-p)*(1-p);ctx.globalAlpha=Math.max(0,1-p);ctx.strokeStyle=ef.c;ctx.lineWidth=Math.max(.5,ef.w*(1-p));ctx.beginPath();ctx.arc(ef.x,ef.y,ef.r0+(ef.r1-ef.r0)*e2,0,7);ctx.stroke();ctx.globalAlpha=1}
  else if(ef.type==="arc"){ // 낫 베기: 플레이어 기준 부채꼴 궤적
   const p=1-ef.life/ef.max,R_=ef.R*(.75+.25*p),sw=ef.half*2*Math.min(1,p*3),a0=ef.a-ef.half;
   ctx.save();ctx.translate(player.x,player.y);ctx.globalAlpha=Math.max(0,1-p*p);ctx.lineCap="round";
   ctx.fillStyle=ef.big?"rgba(255,40,90,.16)":"rgba(255,90,130,.14)";ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R_,a0,a0+sw);ctx.closePath();ctx.fill();
   ctx.strokeStyle=ef.c;ctx.lineWidth=(ef.big?12:9)*(1-p)+2;ctx.beginPath();ctx.arc(0,0,R_,a0,a0+sw);ctx.stroke();
   ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,R_+2,a0+sw*.2,a0+sw);ctx.stroke();ctx.restore()}
  else if(ef.type==="cone"){ // 화염 방사: 플레이어 기준 부채꼴 그라디언트
   const p=1-ef.life/ef.max,R_=ef.R*(.6+.4*p);
   ctx.save();ctx.translate(player.x,player.y);ctx.globalAlpha=Math.max(0,.9-p)*.8;
   const g=ctx.createRadialGradient(0,0,6,0,0,R_);g.addColorStop(0,ef.ph?"rgba(255,250,200,.9)":"rgba(255,230,150,.9)");g.addColorStop(.35,ef.ph?"rgba(255,170,60,.7)":"rgba(255,120,30,.7)");g.addColorStop(1,"rgba(200,40,10,0)");
   ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R_,ef.a-ef.half,ef.a+ef.half);ctx.closePath();ctx.fill();ctx.restore()}
  else if(ef.type==="judg"){ // 심판: 하늘에서 떨어지는 빛기둥
   const p=1-ef.life/ef.max;ctx.save();ctx.globalAlpha=Math.max(0,1-p);ctx.fillStyle="rgba(255,236,160,.55)";ctx.fillRect(ef.x-14*(1-p)-3,ef.y-260,28*(1-p)+6,260);
   ctx.fillStyle="#fff";ctx.fillRect(ef.x-3,ef.y-260,6,260);ctx.restore()}
  else if(ef.type==="core"){if(!onScr(ef.x,ef.y,ef.r))continue;const p=1-ef.life/ef.max;ctx.globalAlpha=Math.max(0,1-p);ctx.fillStyle=ef.c;ctx.beginPath();ctx.arc(ef.x,ef.y,ef.r*(1-p*.5),0,7);ctx.fill();ctx.globalAlpha=1}
 }
}
/* 접촉형 링 무기 */
function drawRingWeapons(){
 for(const k in weapons){
  const w=weapons[k];if(!(w.level>0)||!RING[w.kind])continue;
  for(let i=0,n=wc(w);i<n;i++){
   const p=ringPos(w,i);
   if(w.kind==="orbit"||w.kind==="aegis")drawSword(p.x,p.y,p.q,w.kind==="aegis"?"#ffe27a":"#b9c8ff");
   else drawFlameOrb(p.x,p.y,w.kind==="inferno");
  }
  if(w.kind==="aegis"){ctx.strokeStyle="rgba(255,226,122,.25)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y,w.range,0,7);ctx.stroke()}
  if(w.kind==="flame"||w.kind==="inferno"){ctx.strokeStyle="rgba(255,140,60,.16)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y,ringR(w),0,7);ctx.stroke()}
 }
}
/* 회전 광선: 넓은 반투명 선 + 흰 심지 (가산 합성) */
const PRISM_C=["#ff6a9a","#ffd36a","#7affb0","#6ad0ff","#c89aff","#ff9a5a"];
function drawBeams(){
 for(const k in weapons){
  const w=weapons[k];if(!(w.level>0)||(w.kind!=="beam"&&w.kind!=="prism"))continue;
  const n=wc(w),L=beamLen(w),pr=w.kind==="prism";
  ctx.save();ctx.globalCompositeOperation="lighter";ctx.lineCap="round";
  for(let i=0;i<n;i++){
   const a=beamAng(w,i,n),x2=player.x+Math.cos(a)*L,y2=player.y+Math.sin(a)*L,c=pr?PRISM_C[i%6]:"#ffe8a0",fl=.85+.15*Math.sin(elapsed*30+i);
   ctx.globalAlpha=.28*fl;ctx.strokeStyle=c;ctx.lineWidth=pr?22:16;ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(x2,y2);ctx.stroke();
   ctx.globalAlpha=.7*fl;ctx.lineWidth=pr?7:5;ctx.stroke();
   ctx.globalAlpha=.9;ctx.strokeStyle="#ffffff";ctx.lineWidth=2;ctx.stroke();
   ctx.globalAlpha=.6;ctx.drawImage(glowSpr(c),x2-18,y2-18,36,36);
  }
  ctx.restore();
 }
}
function drawPlayerGlow(){ctx.globalCompositeOperation="lighter";ctx.drawImage(playerGlow,player.x-110,player.y-110);ctx.globalCompositeOperation="source-over"}
function drawSpecials(hostile){for(const o of xs)if(!o.hostile===!hostile)drawX(o)}
/* "LEVEL UP!", 원소 반응 이름 등 떠오르는 글자 */
function drawFloatTexts(){
 ctx.textAlign="center";ctx.lineWidth=4;ctx.strokeStyle="rgba(0,0,0,.7)";
 for(const ef of effects)if(ef.type==="txt"){const p=1-ef.life/ef.max,sz=ef.sz||20;ctx.globalAlpha=Math.max(0,1-p*p);ctx.font=`900 ${sz}px system-ui`;ctx.fillStyle=ef.c;ctx.strokeText(ef.t,ef.x,ef.y-p*26);ctx.fillText(ef.t,ef.x,ef.y-p*26)}
 ctx.textAlign="start";ctx.globalAlpha=1;
}
/* 화면 밖 상자 방향 표시 */
function drawChestArrows(){
 const cx=cam.x,cy=cam.y;
 for(const c of drops){
  if(c.type!=="chest")continue;
  const dx=(c.x-cx)*ZM,dy=(c.y-cy)*ZM;
  if(Math.abs(dx)<W/2-30&&Math.abs(dy)<H/2-30)continue;
  const a=Math.atan2(dy,dx),m=Math.min((W/2-40)/Math.abs(Math.cos(a)||1e-6),(H/2-40)/Math.abs(Math.sin(a)||1e-6));
  ctx.save();ctx.translate(W/2+Math.cos(a)*m,H/2+Math.sin(a)*m);ctx.rotate(a);
  ctx.fillStyle="#ffd35a";ctx.shadowBlur=12;ctx.shadowColor="#ffd35a";ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-9);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();ctx.restore();
 }
}
/* 화면 밖 보스 / 엘리트 위치 표시: 화면 가장자리에 방향 화살표 + 거리 */
function edgeMark(dx,dy,col,icon,big,dist_){
 const a=Math.atan2(dy,dx),pad=big?52:44,m=Math.min((W/2-pad)/Math.abs(Math.cos(a)||1e-6),(H/2-pad)/Math.abs(Math.sin(a)||1e-6)),x=W/2+Math.cos(a)*m,y=H/2+Math.sin(a)*m;
 ctx.save();ctx.translate(x,y);
 ctx.save();ctx.rotate(a);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(big?28:22,0);ctx.lineTo(big?12:9,-9);ctx.lineTo(big?12:9,9);ctx.closePath();ctx.fill();ctx.restore();
 const r=big?17:12;ctx.fillStyle="rgba(10,6,16,.85)";ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.stroke();
 ctx.font=`${big?17:12}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(icon,0,1);
 if(big){ctx.font="bold 10px system-ui";ctx.fillStyle="#ffd0e8";ctx.fillText(Math.round(dist_/10)+"m",0,r+9)}
 ctx.restore();
}
function drawBossArrows(){
 const cx=cam.x,cy=cam.y,pulse=.75+.25*Math.sin(elapsed*6);
 for(const e of enemies){
  if(!e.elite||e.hp<=0)continue;
  const dx=(e.x-cx)*ZM,dy=(e.y-cy)*ZM;if(Math.abs(dx)<W/2-20&&Math.abs(dy)<H/2-20)continue;
  const boss=e.type==="boss";ctx.globalAlpha=pulse;edgeMark(dx,dy,boss?(e.final?"#ffd36a":"#ff4aa8"):"#ffb040",boss?"👑":"⚠️",boss,Math.hypot(e.x-player.x,e.y-player.y));
 }
 ctx.globalAlpha=1;ctx.textBaseline="alphabetic";ctx.textAlign="start";
}
/* 디버그: FPS / 프레임 시간 / 객체 수 (F3) */
function drawDebug(){
 if(!S.fps)return;
 ctx.font="12px ui-monospace,Consolas,monospace";ctx.fillStyle="rgba(0,0,0,.65)";ctx.fillRect(8,H-78,380,68);
 ctx.fillStyle=fps>=55?"#8f8":fps>=40?"#ff8":"#f88";
 ctx.fillText(`FPS ${fps.toFixed(0)}   update ${uMs.toFixed(2)}ms   draw ${dMs.toFixed(2)}ms`,14,H-60);
 ctx.fillStyle="#cde";
 ctx.fillText(`적 ${enemies.length}  탄 ${shots.length}  보석 ${gems.length}  특수 ${xs.length}  자국 ${decals.length}`,14,H-42);
 ctx.fillText(`파티클 ${pN}/${Q.pmax}  숫자 ${nN}/${Q.nmax}  FX ${effects.length}  광원 ${lN}  품질 ${Q.n}${S.q==="auto"?"(자동)":""}`,14,H-24);
}
