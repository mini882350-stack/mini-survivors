/* ═══════════════ hero.js ═══════════════
   플레이어 캐릭터: 직업별 리깅 벡터 캐릭터
   · 관절 구조(다리 2 · 팔 2 · 몸통 · 머리)를 각도로 움직임 → 걷기 사이클, 팔 흔들기, 공격 모션, 숨쉬기
   · 망토/머리카락/깃털은 이동 속도에 따라 뒤로 흩날림, 눈 깜빡임
   · 외형 데이터는 data.js의 LOOK (색·의상·머리 장식·무기)
   좌표: 오른쪽을 바라보는 기준, 원점 = 몸 중심, 발바닥 y≈16 / 머리 중심 y≈-14 */
"use strict";
let HL=null;                                   // 지금 그리는 외형
const SHD=new Map();
/* 색 밝기 조절 (k<0 어둡게, k>0 밝게) — 결과 캐시 */
function shade(hex,k){
 const key=hex+k;let r=SHD.get(key);if(r)return r;
 const n=parseInt(hex.slice(1),16);let R=n>>16&255,G=n>>8&255,B=n&255;
 if(k<0){R*=1+k;G*=1+k;B*=1+k}else{R+=(255-R)*k;G+=(255-G)*k;B+=(255-B)*k}
 r="rgb("+(R|0)+","+(G|0)+","+(B|0)+")";SHD.set(key,r);return r;
}
function hOut(w){ctx.lineWidth=w||1.3;ctx.strokeStyle=HL.ol;ctx.stroke()}
function hVG(y0,y1,a,b){const g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g}
function hHG(x0,x1,a,b){const g=ctx.createLinearGradient(x0,0,x1,0);g.addColorStop(0,a);g.addColorStop(1,b);return g}
/* 팔다리: 외곽선 두께를 먼저 그리고 그 위에 색 → 깔끔한 캡슐 */
function hLimb(x1,y1,x2,y2,w,c){
 ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
 ctx.strokeStyle=HL.ol;ctx.lineWidth=w+2.4;ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();
}
function hDot(x,y,r,c,out){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();if(out)hOut(1.1)}
function hEll(x,y,rx,ry,a,c,out){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,a,0,7);ctx.fill();if(out)hOut(1.1)}
function hGlow(x,y,r,c){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
/* 노란 별 장식 (스텔라) */
function hStar(x,y,R,c,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.fillStyle=c||"#ffd84a";ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?R*.45:R;ctx.lineTo(Math.cos(a)*q,Math.sin(a)*q)}ctx.closePath();ctx.fill();hOut(.7);ctx.restore()}
const ELEM_C=["#ff7a3a","#7fdcff","#ffe14a","#9fff6a"];

/* ── 메인: 외형 L, 시간 t, 걷기 위상 ph, 이동 정도 mv(0~1), 공격 모션 atk(0~1) ── */
function drawHero(L,t,ph,mv,atk,aimL){
 HL=L;ctx.lineJoin="round";ctx.lineCap="round";
 const sw=Math.sin(ph)*mv,br=Math.sin(t*2.6)*(1-mv)*.45,hy=-14.5+br*.6;
 const legF=sw*.7,legB=-sw*.7,armB=.2+sw*.6;
 let armF=.6-sw*.5+atk*.85;if(aimL!==undefined)armF=Math.atan2(Math.cos(aimL),Math.sin(aimL))-atk*.25;   // 총잡이: 팔이 조준 방향을 향함 (반동으로 살짝 들림)
 if(L.mote)drawMotes(L,t,false);
 if(L.cape)drawCape(L,t,mv);
 if(L.tails)drawTails(L,t,mv);
 if(L.back==="quiver")drawQuiver(L);
 if(L.shield)drawShieldBack(L);
 // 먼 쪽 팔 · 다리 (어둡게)
 drawArm(-1.5,-4.5+br*.3,armB,true);
 drawLeg(-2,6,legB,true);
 drawLeg(2.2,6,legF,false);
 drawTorso(L,t,sw,br);
 if(L.stars){hStar(-1.6,-5+br*.3,1.7,"#ffd84a",.2);hStar(3.4,-.6+br*.3,1.3,"#ffe58a",-.3);hStar(-3.2,3.6,1.5,"#ffd84a",.5);hStar(2.2,5.2,1.2,"#ffe58a",0)}   // 스텔라: 드레스 별 무늬
 if(L.collar)drawCollar(L);
 drawHairBack(L,t,hy,mv);
 drawHeadBase(L,t,hy);
 drawHairFront(L,t,hy);
 drawHeadgear(L,t,hy,mv);
 // 가까운 쪽 팔 + 무기
 const sx=2.6,sy=-4.6+br*.3,hx=sx+Math.sin(armF)*8.5,hy2=sy+Math.cos(armF)*8.5;
 drawArm(sx,sy,armF,false);
 ctx.save();ctx.translate(hx+(aimL!==undefined?0:1.2),hy2);ctx.rotate(aimL!==undefined?aimL-atk*.35:.16+atk*.7);drawItem(L,t,atk);ctx.restore();
 hDot(hx,hy2,2.1,L.fit==="armor"?L.metal:L.skin,true);
 if(L.mote)drawMotes(L,t,true);
}
/* ── 팔다리 ── */
function sleeveCol(L,far){const c=L.fit==="armor"?L.metal:L.fit==="bare"?L.skin:L.fit==="vest"?L.c3:L.fit==="dress"?L.c3:L.c1;return far?shade(c.startsWith("#")?c:"#888888",-.28):c}
function drawArm(x,y,a,far){
 const L=HL,ex=x+Math.sin(a)*8.5,ey=y+Math.cos(a)*8.5;
 hLimb(x,y,ex,ey,3.6,sleeveCol(L,far));
 if(L.fit==="robe"||L.fit==="dress"){ // 넓은 소매
  ctx.fillStyle=far?shade(L.c2,-.1):L.c2;ctx.beginPath();ctx.ellipse(x+Math.sin(a)*6,y+Math.cos(a)*6,3.4,2.4,-a+1.57,0,7);ctx.fill();hOut(1)}
 if(L.fit==="bare"&&!far){ctx.strokeStyle=L.paint;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+Math.sin(a)*3-1.5,y+Math.cos(a)*3);ctx.lineTo(x+Math.sin(a)*3+1.5,y+Math.cos(a)*3);ctx.stroke()}
 if(far)hDot(ex,ey,1.9,shade(L.fit==="armor"?L.metal:L.skin,-.2),true);
}
function drawLeg(x,y,a,far){
 const L=HL,lift=Math.max(0,Math.sin(a*2.2))*1.6,fx=x+Math.sin(a)*9,fy=y+Math.cos(a)*9-lift;
 hLimb(x,y,fx,fy,4.2,far?shade(L.pants,-.3):L.pants);
 // 장화: 앞쪽으로 둥근 신발
 const bc=far?shade(L.boots,-.3):L.boots;
 ctx.fillStyle=bc;ctx.beginPath();ctx.moveTo(fx-2.6,fy-2.4);ctx.lineTo(fx+1.6,fy-2.4);ctx.quadraticCurveTo(fx+4.6,fy-1.4,fx+4.4,fy+1.4);ctx.lineTo(fx-2.6,fy+1.4);ctx.closePath();ctx.fill();hOut(1.1);
 ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(fx-2,fy-2,3,1);
}
/* ── 망토 / 연미복 꼬리 / 화살통 / 등 방패 ── */
function drawCape(L,t,mv){
 const sway=-mv*6-Math.sin(t*3.2)*1.1*(.5+mv),fl=Math.sin(t*7)*mv*1.2;
 ctx.fillStyle=hVG(-8,16,L.cape,shade(L.cape,-.35));
 ctx.beginPath();ctx.moveTo(-4.5,-7.5);ctx.lineTo(4,-7.5);ctx.quadraticCurveTo(3.5,4,2,14);
 ctx.quadraticCurveTo(-4+sway*.5,16+fl,-10+sway,14.5-mv*2);ctx.quadraticCurveTo(-9+sway*.3,2,-4.5,-7.5);ctx.closePath();ctx.fill();hOut(1.3);
 // 안감 (휘날리는 쪽 가장자리)
 ctx.fillStyle=L.capeIn;ctx.beginPath();ctx.moveTo(-5.5,-4);ctx.quadraticCurveTo(-9+sway*.3,3,-10+sway,14.5-mv*2);ctx.quadraticCurveTo(-7.5+sway*.6,10,-5.5,-4);ctx.closePath();ctx.fill();
 ctx.strokeStyle="rgba(0,0,0,.25)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-1,-5);ctx.quadraticCurveTo(-3+sway*.3,5,-5+sway*.6,14);ctx.stroke();
}
function drawTails(L,t,mv){
 const sw=-mv*4-Math.sin(t*3)*.6;ctx.fillStyle=L.tails;
 ctx.beginPath();ctx.moveTo(-5,2);ctx.lineTo(-1,2);ctx.lineTo(-3+sw*.5,13);ctx.lineTo(-8+sw,12);ctx.closePath();ctx.fill();hOut(1.1);
}
function drawQuiver(L){
 ctx.save();ctx.translate(-6,-2);ctx.rotate(-.45);
 ctx.fillStyle=hHG(-3,3,"#8a5c34","#4a2e18");ctx.beginPath();ctx.roundRect?ctx.roundRect(-3,-6,6,14,2):ctx.rect(-3,-6,6,14);ctx.fill();hOut(1.1);
 ctx.strokeStyle="#d8b070";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3,-3);ctx.lineTo(3,-3);ctx.moveTo(-3,5);ctx.lineTo(3,5);ctx.stroke();
 for(const[x,c]of[[-1.5,"#f4f1e8"],[0,"#d8384a"],[1.5,"#f4f1e8"]]){ctx.strokeStyle="#6a4a2a";ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(x,-6);ctx.lineTo(x,-10);ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,-13);ctx.lineTo(x+1.3,-10);ctx.lineTo(x-1.3,-10);ctx.closePath();ctx.fill()}
 ctx.restore();
}
function drawShieldBack(L){
 ctx.save();ctx.translate(-7.5,1);ctx.rotate(-.2);
 ctx.fillStyle=hHG(-6,6,shade(L.c1,.15),L.c2);ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(6,-8);ctx.lineTo(6,1);ctx.quadraticCurveTo(6,7,0,10);ctx.quadraticCurveTo(-6,7,-6,1);ctx.closePath();ctx.fill();hOut(1.4);
 ctx.strokeStyle=L.trim;ctx.lineWidth=1.6;ctx.stroke();ctx.fillStyle=L.trim;ctx.fillRect(-1,-6,2,13);ctx.fillRect(-4.5,-2.5,9,2);
 ctx.restore();
}
/* ── 몸통 (의상별) ── */
function torsoPath(){ctx.beginPath();ctx.moveTo(-5.6,-7.5);ctx.lineTo(5.8,-7.5);ctx.quadraticCurveTo(7.6,0,6.6,7);ctx.lineTo(-6,7);ctx.quadraticCurveTo(-7.2,0,-5.6,-7.5);ctx.closePath()}
function drawTorso(L,t,sw,br){
 const fit=L.fit,fl=sw*1.6;
 ctx.save();ctx.translate(0,br*.25);
 if(fit==="robe"||fit==="dress"){
  // 치마: 걸을 때 앞뒤로 펄럭
  ctx.fillStyle=hVG(-4,16,L.c1,L.c2);
  ctx.beginPath();ctx.moveTo(-6.4,0);ctx.lineTo(6.6,0);ctx.quadraticCurveTo(9+fl,8,10+fl,15.5);ctx.quadraticCurveTo(0,17.5,-10+fl*.5,15.5);ctx.quadraticCurveTo(-8.5,8,-6.4,0);ctx.closePath();ctx.fill();hOut(1.3);
  ctx.strokeStyle=shade(L.c2,-.2);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(1,2);ctx.quadraticCurveTo(2+fl*.5,9,2.5+fl,15.8);ctx.moveTo(-3,3);ctx.quadraticCurveTo(-4,9,-5+fl*.3,15.6);ctx.stroke();
  ctx.strokeStyle=L.trim;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-9.6+fl*.5,14.6);ctx.quadraticCurveTo(0,16.6,9.6+fl,14.6);ctx.stroke();
  if(L.flameHem){ctx.fillStyle=L.c3;for(let i=0;i<5;i++){const x=-8+i*4+fl*.6,h=3+Math.sin(t*9+i*1.7)*1.2;ctx.beginPath();ctx.moveTo(x-1.8,15.4);ctx.quadraticCurveTo(x,15.4-h*1.3,x+.4,15.4-h*1.6);ctx.quadraticCurveTo(x+.8,15.4-h*.6,x+1.8,15.4);ctx.closePath();ctx.fill()}}
  if(fit==="dress"){ctx.fillStyle="#ffffff";for(let i=0;i<6;i++){const x=-8+i*3.4+fl*.6;ctx.beginPath();ctx.arc(x,15.8,1.5,0,Math.PI);ctx.fill()}
   ctx.fillStyle="rgba(150,220,255,.8)";for(const[x,y]of[[-4,9],[3,11],[-1,6],[5,6]]){ctx.beginPath();ctx.moveTo(x,y-1.6);ctx.lineTo(x+1,y);ctx.lineTo(x,y+1.6);ctx.lineTo(x-1,y);ctx.closePath();ctx.fill()}}
 }
 if(fit==="coat"){ // 긴 코트: 앞섶이 갈라지는 자락
  ctx.fillStyle=hVG(0,15,L.c1,L.c2);
  ctx.beginPath();ctx.moveTo(-6.2,1);ctx.lineTo(6.6,1);ctx.lineTo(8+fl,14.5);ctx.lineTo(2.5+fl*.6,14);ctx.lineTo(1.5,7);ctx.lineTo(.5,14);ctx.lineTo(-8.5+fl*.3,14.5);ctx.closePath();ctx.fill();hOut(1.3);
 }
 // 상체
 const top=fit==="armor"?L.metal:fit==="bare"?L.skin:fit==="vest"?L.c3:L.c1;
 ctx.fillStyle=hHG(-6,7,shade(top==="#"?top:top,-.18),top);torsoPath();ctx.fill();
 ctx.fillStyle=hVG(-8,8,"rgba(255,255,255,.18)","rgba(0,0,0,.22)");torsoPath();ctx.fill();hOut(1.3);
 switch(fit){
  case"robe":case"dress":
   ctx.fillStyle=L.c3;ctx.beginPath();ctx.moveTo(1.2,-7.4);ctx.lineTo(4.8,-7.4);ctx.lineTo(3,1);ctx.closePath();ctx.fill();   // 앞섶
   ctx.fillStyle=L.trim;ctx.fillRect(-6.4,0,13,2.2);hDot(3,1.1,1.3,shade(L.trim,.3));                                         // 허리띠
   if(L.head==="wizard"){ctx.fillStyle=L.trim;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.9:2.2;ctx.lineTo(-1.5+Math.cos(a)*r,-3.5+Math.sin(a)*r)}ctx.closePath();ctx.fill()}
   break;
  case"armor":
   ctx.fillStyle=hVG(-1,14,L.c1,L.c2);ctx.beginPath();ctx.moveTo(-3.8,-1);ctx.lineTo(5,-1);ctx.lineTo(4.4,13.5);ctx.lineTo(1,15);ctx.lineTo(-3.4,13.5);ctx.closePath();ctx.fill();hOut(1.1);   // 휘장
   ctx.fillStyle=L.trim;ctx.fillRect(.1,1,1.6,9);ctx.fillRect(-2.2,3.5,6.2,1.6);
   ctx.strokeStyle=L.metal2;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-5,-3.5);ctx.quadraticCurveTo(1,-1.5,6.4,-3.5);ctx.stroke();
   ctx.fillStyle="#5a3a22";ctx.fillRect(-6.2,6,13,2);hDot(3.4,7,1.3,L.trim);
   ctx.fillStyle=hVG(-10,-2,"#ffffff",L.metal);ctx.beginPath();ctx.ellipse(3.6,-6.2,4.6,3.4,-.2,0,7);ctx.fill();hOut(1.2);   // 어깨 갑옷
   ctx.strokeStyle=L.metal2;ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(3.6,-5.6,3.4,2.2,-.2,.3,2.8);ctx.stroke();
   break;
  case"tunic":
   ctx.fillStyle=hVG(-7,6,L.c3,shade(L.c3,-.3));ctx.beginPath();ctx.moveTo(-5,-6);ctx.lineTo(5.6,-6);ctx.lineTo(5.8,6);ctx.lineTo(-5.4,6);ctx.closePath();ctx.fill();hOut(1);   // 가죽 조끼
   ctx.strokeStyle=shade(L.c3,.35);ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(1.6,-5.5);ctx.lineTo(1.6,5.5);ctx.stroke();
   ctx.fillStyle=hVG(6,11,L.c1,L.c2);ctx.beginPath();ctx.moveTo(-6.2,6);ctx.lineTo(6.8,6);ctx.lineTo(7.6+sw,11);ctx.lineTo(-7+sw*.5,11);ctx.closePath();ctx.fill();hOut(1.1);   // 짧은 치마
   ctx.fillStyle="#4a2e18";ctx.fillRect(-6.4,4.6,13.4,2);ctx.fillStyle=L.trim;ctx.fillRect(2.4,4.3,2.4,2.6);
   if(L.scarf){const fl2=-Math.sin(t*8)*.8-1;ctx.fillStyle=L.scarf;ctx.beginPath();ctx.ellipse(1,-7.6,5.6,2.2,0,0,7);ctx.fill();hOut(1);
    ctx.beginPath();ctx.moveTo(-3,-7);ctx.quadraticCurveTo(-7,-5+fl2,-10,-3+fl2*2);ctx.lineTo(-9,-1+fl2*2);ctx.quadraticCurveTo(-6,-4,-2.5,-5.6);ctx.closePath();ctx.fill();hOut(1)}
   break;
  case"coat":
   ctx.fillStyle=L.c3;ctx.beginPath();ctx.moveTo(.5,-7.4);ctx.lineTo(5,-7.4);ctx.lineTo(3.2,6);ctx.lineTo(1.8,6);ctx.closePath();ctx.fill();          // 안쪽 조끼
   ctx.strokeStyle=shade(L.c1,.25);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(.5,-7.4);ctx.lineTo(2.2,2);ctx.moveTo(5,-7.4);ctx.lineTo(3,2);ctx.stroke();   // 옷깃
   for(const y of[-2,1.5,5])hDot(2.6,y,.8,L.trim);
   if(L.badge){ctx.fillStyle=L.trim;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?1.1:2.6;ctx.lineTo(-2.6+Math.cos(a)*r,-3+Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.strokeStyle=HL.ol;ctx.lineWidth=.6;ctx.stroke();hDot(-2.6,-3,.6,"#fff6c8")}   // 보안관 배지
   if(L.kerchief){ctx.fillStyle=L.kerchief;ctx.beginPath();ctx.moveTo(-1.6,-6.6);ctx.lineTo(6.4,-6.6);ctx.lineTo(3.2,-1.6);ctx.closePath();ctx.fill();hOut(.9);hDot(1.6,-5.4,.45,"#fff");hDot(3.6,-5,.45,"#fff");hDot(3,-3.4,.45,"#fff")}
   if(L.cravat){ctx.fillStyle=L.cravat;ctx.beginPath();ctx.moveTo(1.8,-7.4);ctx.lineTo(4.4,-7.4);ctx.lineTo(3.6,-3);ctx.lineTo(2.4,-3);ctx.closePath();ctx.fill();hDot(3.1,-6.4,.9,"#c8102e")}
   if(L.head==="plaguehat"){ctx.fillStyle="#3a2a1a";ctx.fillRect(-6.4,3,13.4,2);for(const[x,c]of[[-4.2,"#8fe36a"],[-1.6,"#c46aff"],[5,"#8fe36a"]]){ctx.fillStyle=c;ctx.fillRect(x,4.6,1.8,3.2);ctx.strokeStyle=HL.ol;ctx.lineWidth=.7;ctx.strokeRect(x,4.6,1.8,3.2)}}
   break;
  case"bare":
   ctx.strokeStyle=shade(L.skin,-.3);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(1.6,-5);ctx.quadraticCurveTo(1,-1,1.8,3);ctx.moveTo(-2,-2.5);ctx.quadraticCurveTo(1,-1.2,5,-2.5);ctx.stroke();   // 근육선
   ctx.strokeStyle=L.paint;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(-1,2);ctx.moveTo(-4,2.5);ctx.lineTo(-1,4.5);ctx.stroke();                     // 전투 문신
   ctx.fillStyle=hVG(5,12,L.c1,L.c2);ctx.beginPath();ctx.moveTo(-6.2,5);ctx.lineTo(6.8,5);ctx.lineTo(7.8+sw,12);ctx.lineTo(3,11);ctx.lineTo(0,12.5);ctx.lineTo(-3,11);ctx.lineTo(-7.2+sw*.5,12);ctx.closePath();ctx.fill();hOut(1.1);   // 가죽 치마
   ctx.fillStyle=L.c2;ctx.fillRect(-6.4,4,13.4,2.4);hDot(2.8,5.2,1.7,L.trim,true);
   ctx.fillStyle=L.c3;for(const[x,y,r]of[[-4,-7.5,3.4],[0,-8.6,3.6],[4.2,-7.6,3.6],[6.6,-5.4,2.6],[-6,-5,2.4]]){ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}   // 모피 어깨
   ctx.strokeStyle=shade(L.c3,-.35);ctx.lineWidth=.8;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-5+i*2.6,-6);ctx.lineTo(-5.6+i*2.6,-4.4);ctx.stroke()}
   break;
  case"vest":
   ctx.fillStyle=hVG(-7,7,L.c1,L.c2);ctx.beginPath();ctx.moveTo(-5.4,-6.6);ctx.lineTo(1.6,-6.6);ctx.lineTo(3.4,4);ctx.lineTo(6.8,7);ctx.lineTo(-6,7);ctx.quadraticCurveTo(-7,0,-5.4,-6.6);ctx.closePath();ctx.fill();hOut(1);   // 조끼
   ctx.fillStyle=L.c1;ctx.beginPath();ctx.moveTo(4.2,-6.6);ctx.lineTo(5.9,-6.6);ctx.quadraticCurveTo(7.2,0,6.6,6.6);ctx.lineTo(4.6,4);ctx.closePath();ctx.fill();
   ctx.fillStyle=L.hat2;ctx.beginPath();ctx.moveTo(1.8,-7.4);ctx.lineTo(4.4,-7.4);ctx.lineTo(3.1,-5.6);ctx.closePath();ctx.fill();   // 나비넥타이
   ctx.strokeStyle=L.trim;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(-2,0);ctx.quadraticCurveTo(0,3.2,3,1);ctx.stroke();hDot(-2,0,.9,L.trim);   // 회중시계 줄
   for(const y of[-3,0,3])hDot(2.6,y,.7,L.trim);
   break;
 }
 ctx.restore();
 // 목
 ctx.fillStyle=shade(L.skin,-.18);ctx.fillRect(.4,-9.2,3.4,2.4);
}
function drawCollar(L){ // 흡혈귀: 머리 뒤로 솟은 높은 깃
 ctx.fillStyle=L.capeIn;ctx.beginPath();ctx.moveTo(-5,-6);ctx.lineTo(-8,-19);ctx.lineTo(-2,-12);ctx.lineTo(3,-7);ctx.closePath();ctx.fill();hOut(1.1);
 ctx.fillStyle=L.cape;ctx.beginPath();ctx.moveTo(-5.5,-6);ctx.lineTo(-9,-19.5);ctx.lineTo(-8,-19);ctx.lineTo(-4,-7);ctx.closePath();ctx.fill();
}
/* ── 머리 ── */
function drawHairBack(L,t,hy,mv){
 ctx.fillStyle=hVG(hy-9,hy+14,L.hair,shade(L.hair,-.35));
 if(L.hs==="long"){const w=Math.sin(t*2.5)*.8-mv*2.5;
  ctx.beginPath();ctx.moveTo(-6,hy-4);ctx.quadraticCurveTo(-10+w,hy+6,-8+w*1.4,hy+15);ctx.quadraticCurveTo(-3+w,hy+13,-1,hy+9);ctx.lineTo(2,hy);ctx.closePath();ctx.fill();hOut(1.1)}
 if(L.hs==="stellar"){const w=Math.sin(t*2.2)*1.1-mv*3,w2=Math.sin(t*2.2+1)*1.1-mv*3.4;
  ctx.beginPath();ctx.moveTo(-7.8,hy-5);ctx.quadraticCurveTo(-14+w,hy+8,-12+w*1.6,hy+27);ctx.quadraticCurveTo(-9.6+w*1.3,hy+23.5,-7.4+w2,hy+29.5);ctx.quadraticCurveTo(-4.6+w2*.8,hy+22,-1.6+w2*.6,hy+26.5);
  ctx.quadraticCurveTo(.6,hy+15,3.6,hy+6);ctx.lineTo(3.6,hy-1);ctx.closePath();ctx.fill();hOut(1.1);
  ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-8.6,hy+2);ctx.quadraticCurveTo(-11+w,hy+12,-9.4+w*1.4,hy+22);ctx.stroke();
  hStar(-10.4+w*1.2,hy+12,2.4,"#ffd84a",.3);hStar(-6.4+w2*.8,hy+20,1.9,"#ffe58a",-.4)}   // 뒷머리 별 장식
 if(L.hs==="braid"){const w=-mv*2;for(let i=0;i<3;i++){hEll(-6.6+w*i*.4,hy+3+i*3.4,2.2,1.9,0,i%2?shade(L.hair,-.15):L.hair,true)}}
}
function drawHeadBase(L,t,hy){
 // 얼굴: 큰 머리(치비) + 피부 그라디언트 + 볼터치
 const g=ctx.createRadialGradient(3,hy-3,1,1,hy,10);g.addColorStop(0,shade(L.skin,.25));g.addColorStop(1,shade(L.skin,-.12));
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(1,hy,8.6,0,7);ctx.fill();hOut(1.4);
 if(L.head==="plaguehat")return;                      // 가면이 얼굴을 덮음
 hEll(-1.6,hy+1.4,1.6,2.1,0,shade(L.skin,-.1));       // 귀
 hEll(6,hy+3,1.6,1,0,"rgba(255,110,120,.35)");        // 볼터치
 if(L.head==="helm")return;                            // 투구가 얼굴을 덮음
 const blink=(t%4.1)<.11;
 if(L.eyeStyle==="anime"){drawAnimeFace(L,hy,blink);return}
 for(const[x,s]of[[4.6,1],[.4,.8]]){
  if(blink){ctx.strokeStyle=HL.ol;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x-1.4*s,hy+.8);ctx.lineTo(x+1.4*s,hy+.8);ctx.stroke();continue}
  hEll(x,hy+.4,1.7*s,2.5*s,0,"#ffffff");
  hEll(x+.4*s,hy+.7,1.25*s,1.95*s,0,L.eye);
  hEll(x+.55*s,hy+.9,.7*s,1.1*s,0,"#140a10");
  hDot(x-.1*s,hy-.4,.55*s,"#ffffff");
  ctx.strokeStyle=HL.ol;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(x-1.8*s,hy-2.3);ctx.quadraticCurveTo(x,hy-3.1,x+1.8*s,hy-2.2);ctx.stroke();   // 위 속눈썹
 }
 ctx.strokeStyle=shade(L.skin,-.45);ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(5.2,hy+4.6);ctx.quadraticCurveTo(6,hy+5.2,6.8,hy+4.5);ctx.stroke();   // 입
 if(L.beard){ctx.fillStyle=hVG(hy+2,hy+11,L.hair,shade(L.hair,-.3));ctx.beginPath();ctx.moveTo(-1,hy+2.5);ctx.quadraticCurveTo(4,hy+6,8.6,hy+2.6);ctx.quadraticCurveTo(9,hy+8,5,hy+11);ctx.lineTo(4.4,hy+8.5);ctx.lineTo(3,hy+11);ctx.quadraticCurveTo(-1,hy+8,-1,hy+2.5);ctx.closePath();ctx.fill();hOut(1);
  ctx.strokeStyle=L.hair;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(3,hy+4);ctx.quadraticCurveTo(5,hy+3.2,8,hy+4.2);ctx.stroke()}   // 수염
 if(L.stubble){ctx.fillStyle="rgba(60,40,30,.28)";ctx.beginPath();ctx.ellipse(4.4,hy+4.6,3.6,2,0,0,7);ctx.fill()}   // 수염 자국
 if(L.eye==="#ff2a4a"){ctx.fillStyle="#ffffff";ctx.beginPath();ctx.moveTo(5.6,hy+4.7);ctx.lineTo(6.1,hy+6.2);ctx.lineTo(6.5,hy+4.6);ctx.closePath();ctx.fill()}   // 흡혈귀 송곳니
}
/* 애니메이션풍 얼굴: 굵은 위 속눈썹(반쯤 감긴 눈) + 크고 어두운 홍채 + 하이라이트 2개 + 작은 입 */
function drawAnimeFace(L,hy,blink){
 for(const[x,s,o]of[[4.8,.92,1],[-.2,.92,-1]]){        // 두 눈 같은 크기 · o: 눈꼬리 방향 (오른쪽 눈은 오른쪽, 왼쪽 눈은 왼쪽)
  const ix=x-o*2.1*s,ox=x+o*2.3*s;
  if(blink){ctx.strokeStyle="#140a16";ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(ix,hy+.6);ctx.quadraticCurveTo(x,hy+1.4,ox,hy+.5);ctx.lineTo(ox+o*.8*s,hy);ctx.stroke();continue}
  hEll(x,hy+.8,2.05*s,2.15*s,0,"#ffffff");                                                          // 흰자
  const g=ctx.createLinearGradient(0,hy-1.4,0,hy+3);g.addColorStop(0,"#120c1c");g.addColorStop(.55,"#2c2238");g.addColorStop(1,shade(L.eye,-.1));
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x+.15*o*s,hy+.95,1.55*s,2.05*s,0,0,7);ctx.fill();          // 홍채 (아래로 갈수록 눈 색)
  hEll(x+.15*o*s,hy+1,.72*s,1.05*s,0,"#05030a");                                                     // 동공
  hDot(x-.55*o*s,hy-.15,.62*s,"#ffffff");hDot(x+.65*o*s,hy+1.95,.32*s,"rgba(255,255,255,.85)");        // 하이라이트
  ctx.fillStyle="#140a16";ctx.beginPath();ctx.moveTo(ix,hy-1.1);ctx.quadraticCurveTo(x-o*.2*s,hy-2.5,ox,hy-.9);   // 굵은 위 속눈썹: 안쪽이 높고 눈꼬리로 갈수록 살짝 처짐 (차분한 반쯤 감긴 눈)
  ctx.lineTo(ox+o*.95*s,hy-.35);ctx.lineTo(ox+o*.1*s,hy+.05);ctx.quadraticCurveTo(x,hy-1.05,ix+o*.2*s,hy-.15);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(20,10,22,.3)";ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(x-o*.6*s,hy+3.05);ctx.quadraticCurveTo(x+o*.5*s,hy+3.2,x+o*1.5*s,hy+2.8);ctx.stroke();   // 아래 속눈썹 (옅게)
 }
 ctx.strokeStyle="#3a1a26";ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(1.9,hy+5.1);ctx.lineTo(2.9,hy+5.08);ctx.stroke();   // 작은 입 (두 눈 사이 아래)
}
function drawHairFront(L,t,hy){
 const c=hVG(hy-9,hy+2,shade(L.hair,.15),L.hair);ctx.fillStyle=c;
 switch(L.hs){
  case"long":case"short":case"braid":
   ctx.beginPath();ctx.moveTo(-7.4,hy+3);ctx.quadraticCurveTo(-9,hy-8,1,hy-9);ctx.quadraticCurveTo(9.4,hy-8.5,9.4,hy-2);
   ctx.lineTo(7,hy-3.4);ctx.lineTo(6.2,hy-1.6);ctx.lineTo(4.2,hy-3.6);ctx.lineTo(2.6,hy-1.8);ctx.lineTo(1,hy-4);ctx.quadraticCurveTo(-3,hy-3,-3.6,hy+4);ctx.closePath();ctx.fill();hOut(1.2);
   ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3,hy-6.4);ctx.quadraticCurveTo(1,hy-8,5,hy-6.8);ctx.stroke();
   break;
  case"stellar":
   ctx.beginPath();ctx.moveTo(-7.8,hy+4);ctx.quadraticCurveTo(-9.8,hy-8.8,1,hy-9.6);ctx.quadraticCurveTo(10.2,hy-9,10,hy-1.4);
   ctx.lineTo(8.6,hy-2.6);ctx.lineTo(7.4,hy-4.6);ctx.lineTo(6,hy-2.5);ctx.lineTo(4.6,hy-4.8);ctx.lineTo(3,hy-2.6);ctx.lineTo(1.6,hy-4.6);ctx.lineTo(.2,hy-2.4);ctx.lineTo(-1.2,hy-4);
   ctx.quadraticCurveTo(-3.4,hy-2.4,-3.8,hy+5);ctx.closePath();ctx.fill();hOut(1.2);
   ctx.beginPath();ctx.moveTo(8.8,hy-2.4);ctx.quadraticCurveTo(11.2,hy+5,9.8,hy+12);ctx.quadraticCurveTo(8.8,hy+8,7.6,hy+5.6);ctx.quadraticCurveTo(8.4,hy+2,7.8,hy-1.6);ctx.closePath();ctx.fill();hOut(1);   // 옆머리
   ctx.strokeStyle="rgba(255,255,255,.4)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3.4,hy-6.8);ctx.quadraticCurveTo(1,hy-8.6,5.6,hy-7.2);ctx.stroke();
   break;
  case"spiky":
   ctx.beginPath();ctx.moveTo(-7.6,hy+3);for(const[x,y]of[[-10,hy-5],[-5.6,hy-6],[-6,hy-12],[-1,hy-8],[1,hy-14],[3.6,hy-8],[8,hy-11],[7.6,hy-6],[10.6,hy-4],[8.6,hy-2.4]])ctx.lineTo(x,y);
   ctx.lineTo(6,hy-3.4);ctx.lineTo(3.6,hy-1.6);ctx.lineTo(1.4,hy-3.6);ctx.quadraticCurveTo(-3,hy-3,-3.6,hy+4);ctx.closePath();ctx.fill();hOut(1.2);break;
  case"slick":
   ctx.beginPath();ctx.moveTo(-7.4,hy+4);ctx.quadraticCurveTo(-9,hy-8,1,hy-9.2);ctx.quadraticCurveTo(9,hy-8.6,9.2,hy-3.4);ctx.quadraticCurveTo(6,hy-5.4,4.6,hy-2.6);ctx.quadraticCurveTo(3,hy-5.6,-1,hy-4.4);ctx.quadraticCurveTo(-4,hy-2,-3.8,hy+4.5);ctx.closePath();ctx.fill();hOut(1.2);
   ctx.strokeStyle="rgba(255,255,255,.3)";ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(-5,hy-4);ctx.quadraticCurveTo(0,hy-8.4,6,hy-6.6);ctx.stroke();break;
 }
}
/* ── 머리 장식 ── */
function drawHeadgear(L,t,hy,mv){
 switch(L.head){
  case"wizard":{ // 넓은 챙 + 휘어진 원뿔 + 띠 + 별
   const tw=Math.sin(t*2)*1.2-mv*3;
   ctx.fillStyle=hVG(hy-34,hy-6,L.hat,L.hat2);ctx.beginPath();ctx.moveTo(-6.6,hy-6);ctx.quadraticCurveTo(-4,hy-18,-6+tw,hy-30);ctx.quadraticCurveTo(-2+tw*.4,hy-25,1+tw*.2,hy-22);ctx.quadraticCurveTo(7,hy-14,8.4,hy-6);ctx.closePath();ctx.fill();hOut(1.3);
   ctx.fillStyle=L.trim;ctx.beginPath();ctx.moveTo(-6.4,hy-6.4);ctx.quadraticCurveTo(1,hy-8.6,8.2,hy-6.6);ctx.lineTo(7.6,hy-9.4);ctx.quadraticCurveTo(1,hy-11.4,-5.6,hy-9.2);ctx.closePath();ctx.fill();
   ctx.fillStyle=hVG(hy-9,hy-3,shade(L.hat,.15),L.hat2);ctx.beginPath();ctx.ellipse(1,hy-5.6,12.6,3.2,-.08,0,7);ctx.fill();hOut(1.3);
   ctx.fillStyle="#fff6c8";ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?1:2.4;ctx.lineTo(1.5+Math.cos(a)*r,hy-15+Math.sin(a)*r)}ctx.closePath();ctx.fill();
   hDot(-6+tw,hy-30,1.4,L.trim);break}
  case"helm":{ // 투구: 돔 + T자 바이저 + 깃털
   const pw=-mv*4-Math.sin(t*3)*1.2;
   ctx.fillStyle=L.plume;ctx.beginPath();ctx.moveTo(0,hy-8);ctx.quadraticCurveTo(-4+pw*.3,hy-17,-12+pw,hy-12);ctx.quadraticCurveTo(-8+pw*.6,hy-11,-9+pw,hy-6);ctx.quadraticCurveTo(-5,hy-10,-1,hy-6);ctx.closePath();ctx.fill();hOut(1.1);
   ctx.fillStyle=hHG(-8,10,shade(L.metal,-.2),"#ffffff");ctx.beginPath();ctx.arc(1,hy-.4,9.4,Math.PI*1.02,Math.PI*2.02);ctx.lineTo(10.4,hy+5);ctx.quadraticCurveTo(6,hy+9,1,hy+8.6);ctx.lineTo(-7.8,hy+6);ctx.closePath();ctx.fill();hOut(1.4);
   ctx.fillStyle="#141824";ctx.beginPath();ctx.moveTo(2,hy-1.6);ctx.lineTo(10,hy-1.6);ctx.lineTo(10,hy+.6);ctx.lineTo(5.4,hy+.6);ctx.lineTo(5.4,hy+5.4);ctx.lineTo(3.6,hy+5.4);ctx.lineTo(3.6,hy+.6);ctx.lineTo(2,hy+.6);ctx.closePath();ctx.fill();
   ctx.fillStyle="rgba(120,200,255,.85)";ctx.fillRect(7,hy-1.1,2,1.2);
   ctx.strokeStyle=L.trim;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(1,hy-.4,9.4,Math.PI*1.25,Math.PI*1.75);ctx.stroke();
   ctx.fillStyle="rgba(255,255,255,.55)";ctx.fillRect(-4,hy-7,1.6,4);break}
  case"pyrohood":case"hood":{ // 후드: 머리를 감싸고 끝이 뒤로 늘어짐 (화염술사는 끝에 불꽃)
   const tw=-mv*3-Math.sin(t*2.6);
   ctx.fillStyle=hVG(hy-11,hy+8,L.hat,L.hat2);ctx.beginPath();ctx.moveTo(5,hy-9.6);ctx.quadraticCurveTo(-6,hy-12,-9,hy-3);ctx.quadraticCurveTo(-13+tw,hy+2,-14+tw*1.4,hy+6);ctx.quadraticCurveTo(-9,hy+5,-8,hy+8);ctx.lineTo(-3.6,hy+8);
   ctx.quadraticCurveTo(-4.6,hy-4,1,hy-5.6);ctx.quadraticCurveTo(7,hy-6.4,9.6,hy-2);ctx.quadraticCurveTo(10,hy-8,5,hy-9.6);ctx.closePath();ctx.fill();hOut(1.3);
   ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-3,hy-4);ctx.quadraticCurveTo(3,hy-6.4,9,hy-2.6);ctx.stroke();   // 챙 그림자
   if(L.head==="pyrohood"){ctx.strokeStyle=L.trim;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-3.6,hy+7.6);ctx.quadraticCurveTo(-4.6,hy-4,1,hy-5.6);ctx.quadraticCurveTo(7,hy-6.4,9.6,hy-2);ctx.stroke();
    const fx=-14+tw*1.4,fy=hy+6,f=Math.sin(t*16)*1.2;hGlow(fx,fy-2,7,"rgba(255,140,40,.55)");
    ctx.fillStyle="#ff5a1e";ctx.beginPath();ctx.moveTo(fx-2.6,fy);ctx.quadraticCurveTo(fx-1,fy-6-f,fx,fy-8-f);ctx.quadraticCurveTo(fx+1.6,fy-4,fx+2.6,fy);ctx.closePath();ctx.fill();
    ctx.fillStyle="#ffd06a";ctx.beginPath();ctx.moveTo(fx-1.2,fy);ctx.quadraticCurveTo(fx,fy-4-f*.6,fx+.2,fy-5);ctx.quadraticCurveTo(fx+1,fy-2,fx+1.2,fy);ctx.closePath();ctx.fill()}
   break}
  case"plaguehat":{ // 넓은 챙 모자 + 새 부리 가면 + 초록 렌즈
   ctx.fillStyle=hHG(-2,17,"#efe4cc","#b8a888");ctx.beginPath();ctx.moveTo(3,hy-2);ctx.quadraticCurveTo(12,hy-1,17.6,hy+6.4);ctx.quadraticCurveTo(11,hy+5.6,4,hy+5.4);ctx.closePath();ctx.fill();hOut(1.2);
   ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(6,hy+2.6);ctx.quadraticCurveTo(12,hy+3,16.6,hy+6);ctx.stroke();
   hDot(3.4,hy-.6,2.7,"#1a1a1a",true);hGlow(3.4,hy-.6,4.6,"rgba(140,255,110,.45)");hDot(3.4,hy-.6,1.7,L.eye);hDot(2.8,hy-1.2,.6,"#ffffff");
   ctx.fillStyle=hVG(hy-20,hy-6,shade(L.hat,.12),L.hat2);ctx.beginPath();ctx.moveTo(-6,hy-6.4);ctx.lineTo(-5,hy-16);ctx.quadraticCurveTo(1,hy-18,7,hy-16);ctx.lineTo(8,hy-6.4);ctx.closePath();ctx.fill();hOut(1.2);
   ctx.fillStyle=L.trim;ctx.fillRect(-5.6,hy-9.6,13.4,2.2);
   ctx.fillStyle=L.hat;ctx.beginPath();ctx.ellipse(1.2,hy-6.2,14,3.2,-.06,0,7);ctx.fill();hOut(1.3);break}
  case"hornhelm":{ // 뿔 투구 + 코가리개
   ctx.fillStyle=hVG(hy-22,hy-6,"#f6eedc","#c8b898");
   for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(1+s*5.4,hy-6);ctx.quadraticCurveTo(1+s*14,hy-7,1+s*12,hy-20);ctx.quadraticCurveTo(1+s*9,hy-12,1+s*2.6,hy-9);ctx.closePath();ctx.fill();hOut(1.2)}
   ctx.fillStyle=hHG(-8,10,shade(L.metal,-.15),"#f0f2f6");ctx.beginPath();ctx.arc(1,hy-1,9.2,Math.PI*1.04,Math.PI*1.98);ctx.closePath();ctx.fill();hOut(1.3);
   ctx.fillStyle=L.metal2;ctx.fillRect(-8,hy-3,18.2,2);ctx.fillStyle=L.metal;ctx.fillRect(5.6,hy-2,2,5.6);ctx.strokeStyle=HL.ol;ctx.lineWidth=.9;ctx.strokeRect(5.6,hy-2,2,5.6);
   for(const x of[-5,-1,3])hDot(x,hy-2,.7,"#e8e0c8");break}
  case"icecrown":{ // 얼음 왕관: 빛나는 결정
   hGlow(1,hy-12,9,"rgba(160,230,255,.45)");
   for(const[x,h,w]of[[-4,6,1.8],[-1,9,2],[2.4,12,2.4],[5.6,8,2],[8,5,1.6]]){ctx.fillStyle=hVG(hy-8-h,hy-7,"#ffffff","#8fd8ff");ctx.beginPath();ctx.moveTo(x-w,hy-6.8);ctx.lineTo(x,hy-7-h);ctx.lineTo(x+w,hy-6.8);ctx.closePath();ctx.fill();hOut(.9)}
   ctx.fillStyle="#cfeeff";ctx.beginPath();ctx.ellipse(1.6,hy-6.6,7.8,1.8,-.05,0,7);ctx.fill();hOut(.9);hDot(2.4,hy-6.8,1.1,"#4ac8ff");break}
  case"starpins":{ // 노란 별 머리핀 3개 + 옆머리 끝 별
   const tw=.9+.1*Math.sin(t*5);hGlow(-3.4,hy-8,6*tw,"rgba(255,220,100,.55)");
   hStar(-3.4,hy-8.2,3.6*tw,"#ffd84a",-.2);hStar(4.2,hy-9.4,2.4,"#ffe58a",.35);hStar(-7.6,hy-3.4,2,"#ffd84a",.6);hStar(9.6,hy+11.4,1.7,"#ffe58a",0);break}
  case"startiara":{ // 별의 티아라: 금빛 테 + 가운데 큰 별 + 작은 별 두 개
   ctx.strokeStyle=L.trim;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-6.6,hy-4.6);ctx.quadraticCurveTo(1,hy-9,9,hy-4.4);ctx.stroke();
   const tw=.85+.15*Math.sin(t*5);hGlow(1.4,hy-10.5,7*tw,"rgba(255,230,140,.6)");
   ctx.save();ctx.translate(1.4,hy-10.5);ctx.fillStyle="#ffe58a";ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?1.7:4.2*tw;ctx.lineTo(Math.cos(a)*q,Math.sin(a)*q)}ctx.closePath();ctx.fill();hOut(.8);ctx.restore();
   hDot(-4,hy-7.4,1.1,"#fff4c8");hDot(6.8,hy-7.2,1.1,"#fff4c8");break}
  case"headband":{ // 검객 머리띠: 이마를 두른 띠 + 뒤로 휘날리는 두 가닥
   const fl=Math.sin(t*9)*1.6*(.4+mv),fl2=Math.sin(t*9+1.2)*1.8*(.4+mv);
   ctx.strokeStyle=L.band;ctx.lineWidth=2.2;ctx.lineCap="round";
   ctx.beginPath();ctx.moveTo(-6.4,hy-2.6);ctx.quadraticCurveTo(-12-mv*3,hy-4+fl,-17-mv*5,hy-1+fl*1.4);ctx.stroke();
   ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-6.4,hy-2);ctx.quadraticCurveTo(-11-mv*3,hy+1+fl2,-15-mv*4,hy+4+fl2*1.3);ctx.stroke();
   ctx.fillStyle=L.band;ctx.beginPath();ctx.moveTo(-7.4,hy-5.6);ctx.quadraticCurveTo(1,hy-8.8,9.4,hy-4.6);ctx.lineTo(9.6,hy-2.2);ctx.quadraticCurveTo(1,hy-6.4,-7.6,hy-3.2);ctx.closePath();ctx.fill();hOut(.9);
   ctx.fillStyle="#f4f0f4";ctx.fillRect(1.6,hy-7.6,2.4,2.2);break}
  case"cowboy":{ // 카우보이 모자: 양옆이 말려 올라간 챙 + 움푹한 크라운 + 띠
   ctx.fillStyle=hVG(hy-20,hy-6,shade(L.hat,.12),L.hat);ctx.beginPath();ctx.moveTo(-5.4,hy-6.6);ctx.quadraticCurveTo(-6.4,hy-17,-2,hy-18);ctx.quadraticCurveTo(1.4,hy-15.6,4,hy-18);ctx.quadraticCurveTo(8.6,hy-17.4,7.8,hy-6.6);ctx.closePath();ctx.fill();hOut(1.2);
   ctx.fillStyle=L.hat2;ctx.fillRect(-5.6,hy-9.4,13.4,2.4);ctx.fillStyle=L.trim;ctx.fillRect(-1,hy-9.2,2,2);
   ctx.fillStyle=hVG(hy-10,hy-4,shade(L.hat,.2),shade(L.hat,-.25));ctx.beginPath();ctx.moveTo(-12,hy-9.6);ctx.quadraticCurveTo(-9,hy-5.2,1,hy-5.2);ctx.quadraticCurveTo(11,hy-5.2,14.4,hy-9.8);ctx.quadraticCurveTo(12,hy-3.6,1,hy-3.4);ctx.quadraticCurveTo(-10,hy-3.6,-12,hy-9.6);ctx.closePath();ctx.fill();hOut(1.2);
   ctx.strokeStyle="rgba(255,255,255,.25)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3,hy-16);ctx.quadraticCurveTo(-4,hy-12,-3.4,hy-9.8);ctx.stroke();break}
  case"tophat":{ // 실크해트 + 붉은 띠 + 카드
   ctx.fillStyle=hHG(-5,8,L.hat,shade(L.hat,.25));ctx.beginPath();ctx.moveTo(-4.6,hy-7);ctx.lineTo(-4,hy-20);ctx.lineTo(7,hy-20);ctx.lineTo(7.6,hy-7);ctx.closePath();ctx.fill();hOut(1.2);
   ctx.fillStyle=L.hat2;ctx.fillRect(-4.6,hy-10.6,12.2,2.6);
   ctx.save();ctx.translate(-2.6,hy-12.6);ctx.rotate(-.35);ctx.fillStyle="#f4f1e8";ctx.fillRect(-1.8,-3.6,3.6,5);ctx.strokeStyle=HL.ol;ctx.lineWidth=.7;ctx.strokeRect(-1.8,-3.6,3.6,5);ctx.fillStyle="#d8384a";ctx.fillRect(-.6,-2.2,1.2,1.4);ctx.restore();
   ctx.fillStyle=L.hat;ctx.beginPath();ctx.ellipse(1.4,hy-6.6,9.8,2.4,-.06,0,7);ctx.fill();hOut(1.2);
   ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(5,hy-19,1.4,8);break}
 }
}
/* ── 무기 (손 좌표계: 손 = 원점, 위쪽 = -y) ── */
function shaft(y1,y2,c,w){hLimb(0,y1,0,y2,w||2.2,c)}
function drawItem(L,t,atk){
 switch(L.item){
  case"staff":{shaft(11,-19,"#6b4a2b");
   ctx.strokeStyle=L.trim;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-3,-19);ctx.quadraticCurveTo(-3.4,-24,0,-26);ctx.moveTo(3,-19);ctx.quadraticCurveTo(3.4,-24,0,-26);ctx.stroke();
   const c=ELEM_C[Math.floor(t*1.2)%4],p=4.2+Math.sin(t*5)*.5+atk*1.6;hGlow(0,-23,11+atk*6,c+"aa");hDot(0,-23,p,c,true);hDot(-1.2,-24.2,p*.35,"#ffffff");break}
  case"fstaff":{shaft(11,-17,"#3a2418");
   ctx.fillStyle="#5a3a22";ctx.beginPath();ctx.moveTo(-3.6,-17);ctx.lineTo(3.6,-17);ctx.lineTo(2.4,-20);ctx.lineTo(-2.4,-20);ctx.closePath();ctx.fill();hOut(1);
   const f=Math.sin(t*15)*1.4,s=1+atk*.5;hGlow(0,-24,10*s,"rgba(255,120,30,.6)");
   ctx.fillStyle="#ff4a14";ctx.beginPath();ctx.moveTo(-3.6*s,-20);ctx.quadraticCurveTo(-3*s,-27*s-f,0,-31*s-f);ctx.quadraticCurveTo(3*s,-26*s,3.6*s,-20);ctx.closePath();ctx.fill();
   ctx.fillStyle="#ffd06a";ctx.beginPath();ctx.moveTo(-1.8,-20);ctx.quadraticCurveTo(-1,-25-f*.6,.4,-26.5-f);ctx.quadraticCurveTo(1.6,-23,1.8,-20);ctx.closePath();ctx.fill();break}
  case"istaff":{shaft(11,-17,"#cfe4f2",2);
   hGlow(0,-23,10+atk*5,"rgba(140,220,255,.6)");
   for(const[x,y,h,w]of[[-2.6,-19,7,1.8],[2.6,-19,6,1.6],[0,-19,11,2.4]]){ctx.fillStyle=hHG(x-w,x+w,"#ffffff","#7fd0ff");ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(x,y-h);ctx.lineTo(x+w,y);ctx.lineTo(x,y+1.6);ctx.closePath();ctx.fill();hOut(.9)}break}
  case"sword":{
   ctx.fillStyle=hHG(-1.8,1.8,"#ffffff","#8c98b4");ctx.beginPath();ctx.moveTo(-1.8,-2);ctx.lineTo(-1.8,-20);ctx.lineTo(0,-23.5);ctx.lineTo(1.8,-20);ctx.lineTo(1.8,-2);ctx.closePath();ctx.fill();hOut(1.1);
   ctx.strokeStyle="rgba(140,160,200,.8)";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(0,-20);ctx.stroke();
   if(atk>.1){ctx.globalAlpha=atk*.8;hGlow(0,-12,12,"rgba(255,240,180,.7)");ctx.globalAlpha=1}
   ctx.fillStyle=L.trim;ctx.fillRect(-4.6,-2.2,9.2,2.2);ctx.strokeStyle=HL.ol;ctx.lineWidth=.9;ctx.strokeRect(-4.6,-2.2,9.2,2.2);
   shaft(0,4,"#4a2e1c",2);hDot(0,5.4,1.5,L.trim,true);break}
  case"bow":{
   const d=atk*3.5;
   ctx.strokeStyle=HL.ol;ctx.lineWidth=3.6;ctx.beginPath();ctx.moveTo(-1,-14);ctx.quadraticCurveTo(9,0,-1,14);ctx.stroke();
   ctx.strokeStyle="#9a6a3a";ctx.lineWidth=2.2;ctx.stroke();ctx.strokeStyle="#d8b070";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(3.6,-3);ctx.lineTo(3.6,3);ctx.stroke();
   ctx.strokeStyle="#f4f1e8";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-1,-14);ctx.lineTo(-1-d,0);ctx.lineTo(-1,14);ctx.stroke();
   if(atk>.05){ctx.strokeStyle="#6a4a2a";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-1-d,0);ctx.lineTo(13,0);ctx.stroke();ctx.fillStyle="#cfd6e2";ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(12,-1.6);ctx.lineTo(12,1.6);ctx.closePath();ctx.fill()}
   break}
  case"flask":{
   hGlow(1,-4,8,"rgba(140,255,100,.45)");
   ctx.fillStyle="rgba(220,240,255,.5)";ctx.beginPath();ctx.arc(1,-4,4.4,0,7);ctx.fill();hOut(1.1);
   ctx.fillStyle="#7fe35a";ctx.beginPath();ctx.arc(1,-4,4.4,.2,Math.PI-.2);ctx.closePath();ctx.fill();
   ctx.fillStyle="rgba(230,255,220,.8)";hDot(-.4+Math.sin(t*4)*.6,-3-((t*3)%3),.7,"#e8ffd8");hDot(2.2,-2-((t*2.2+1)%3),.5,"#e8ffd8");
   ctx.fillStyle="rgba(220,240,255,.6)";ctx.fillRect(-.4,-10.6,2.8,3);ctx.fillStyle="#8a5a2b";ctx.fillRect(-.6,-12,3.2,1.8);
   hDot(-.6,-5.6,.9,"rgba(255,255,255,.8)");break}
  case"scythe":{shaft(12,-23,"#2a1a1e",2.2);
   ctx.fillStyle=hVG(-30,-18,"#f2eef8","#9a96a8");ctx.beginPath();ctx.moveTo(0,-23);ctx.quadraticCurveTo(-8,-31,-19,-24);ctx.quadraticCurveTo(-10,-26,-1,-19.5);ctx.closePath();ctx.fill();hOut(1.2);
   ctx.strokeStyle="#c8102e";ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-2,-22);ctx.quadraticCurveTo(-9,-27,-17,-24.4);ctx.stroke();
   hDot(0,-23,1.6,"#c8102e",true);if(atk>.1){ctx.globalAlpha=atk*.7;hGlow(-8,-24,10,"rgba(255,40,80,.7)");ctx.globalAlpha=1}break}
  case"dagger":{ // 모험 모드 도적: 짧은 단검
   ctx.fillStyle="#2a2030";ctx.fillRect(-1.3,-1,2.6,5);ctx.fillStyle=L.trim;ctx.fillRect(-3.4,-2.4,6.8,1.8);
   ctx.fillStyle=hHG(-1.6,1.6,"#ffffff","#9aa4bc");ctx.beginPath();ctx.moveTo(-1.6,-2.4);ctx.lineTo(0,-13.5);ctx.lineTo(1.6,-2.4);ctx.closePath();ctx.fill();hOut(1);
   if(atk>.1){ctx.globalAlpha=atk*.7;hGlow(0,-8,9,"rgba(255,120,140,.7)");ctx.globalAlpha=1}break}
  case"axe":{shaft(10,-17,"#5a3a22",2.6);
   ctx.fillStyle=hHG(-11,11,"#9aa0aa","#f0f2f6");
   for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(0,-18.6);ctx.quadraticCurveTo(s*11,-22,s*10.6,-12);ctx.quadraticCurveTo(s*6,-14,0,-12.6);ctx.closePath();ctx.fill();hOut(1.2)}
   ctx.strokeStyle="rgba(255,255,255,.7)";ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(9.6,-19);ctx.quadraticCurveTo(10.6,-16,9.8,-13);ctx.stroke();
   ctx.fillStyle="#7a5a3e";ctx.fillRect(-1.6,-19.6,3.2,8);hOut(1);break}
  case"starstaff":{ // 별 부름 지팡이: 은빛 자루 + 초승달 고리 안의 빛나는 별
   shaft(11,-18,"#d8dcf0",2);ctx.strokeStyle=L.trim;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,-23,5.6,-.4,Math.PI+.4,true);ctx.stroke();
   const tw=.9+.1*Math.sin(t*6)+atk*.5;hGlow(0,-23,10+atk*7,"rgba(200,170,255,.75)");
   ctx.save();ctx.translate(0,-23);ctx.rotate(t*.8);ctx.fillStyle="#fff4c8";ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?1.6:3.8*tw;ctx.lineTo(Math.cos(a)*q,Math.sin(a)*q)}ctx.closePath();ctx.fill();hOut(.8);ctx.restore();
   hDot(-2.6,-14,1,"#c8b8ff");hDot(2.6,-15,.9,"#ffe58a");break}
  case"blade":{
   const sw_=running&&player.sw&&isSw()?player.sw:null,k=sw_?SWB[sw_.wp].k:"katana",col=sw_?swEvoC():"#cfe6ff";
   if(!sw_)ctx.rotate(-Math.PI/2+.35);
   if(k==="katana"){ // 도: 둥근 코등이 + 살짝 휜 긴 칼날
    ctx.fillStyle="#2a2030";ctx.fillRect(-7,-1.3,7,2.6);ctx.fillStyle="#e8e4f0";for(let i=0;i<3;i++)ctx.fillRect(-6+i*2.2,-1.3,1,2.6);
    hEll(.4,0,1.4,3.6,0,"#c8a040",true);
    ctx.fillStyle=hVG(-2,2,"#ffffff","#a8b8cc");ctx.beginPath();ctx.moveTo(1.6,-1.3);ctx.quadraticCurveTo(14,-3.4,27,-4.4);ctx.lineTo(25,-2.4);ctx.quadraticCurveTo(14,-.4,1.6,1.1);ctx.closePath();ctx.fill();hOut(.9);
    ctx.strokeStyle=col;ctx.globalAlpha=.7;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(3,-.4);ctx.quadraticCurveTo(14,-2.2,24,-3.2);ctx.stroke();ctx.globalAlpha=1}
   else if(k==="sword"){ // 검: 십자 가드 + 곧은 양날
    ctx.fillStyle="#4a2e1c";ctx.fillRect(-6,-1.3,6,2.6);hDot(-6.6,0,1.6,"#ffd36a",true);
    ctx.fillStyle="#ffd36a";ctx.fillRect(-.6,-4.6,2.2,9.2);hOut(.9);
    ctx.fillStyle=hVG(-2.4,2.4,"#ffffff","#9aa8c0");ctx.beginPath();ctx.moveTo(1.6,-2.2);ctx.lineTo(21,-2.2);ctx.lineTo(25,0);ctx.lineTo(21,2.2);ctx.lineTo(1.6,2.2);ctx.closePath();ctx.fill();hOut(1);
    ctx.strokeStyle=col;ctx.globalAlpha=.8;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(3,0);ctx.lineTo(21,0);ctx.stroke();ctx.globalAlpha=1}
   else{ // 대검: 긴 손잡이 + 넓고 두꺼운 칼날
    ctx.fillStyle="#3a2418";ctx.fillRect(-9,-1.5,9,3);hDot(-9.6,0,1.9,"#8a8e98",true);
    ctx.fillStyle="#6a6e7a";ctx.fillRect(-.8,-6,3,12);hOut(1);
    ctx.fillStyle=hVG(-4.6,4.6,"#f4f6fa","#7a8296");ctx.beginPath();ctx.moveTo(2.2,-4.4);ctx.lineTo(28,-4.6);ctx.lineTo(33,0);ctx.lineTo(28,4.6);ctx.lineTo(2.2,4.4);ctx.closePath();ctx.fill();hOut(1.2);
    ctx.fillStyle=col;ctx.globalAlpha=.55;ctx.fillRect(5,-1,20,2);ctx.globalAlpha=1}
   if(sw_&&(sw_.swing>0||sw_.ctr>0)){ctx.globalAlpha=.6;hGlow(16,0,14,col+"aa");ctx.globalAlpha=1}
   break}
  case"revolver":{ // 총잡이 총 (+x 방향): 리볼버 / 산탄총 / 장총
   const k=-atk*2.5;ctx.translate(k,0);
   const wp=running&&player.gun&&isGun()?player.gun.wp:0;
   if(wp){ // 산탄총(굵은 이중 총열) / 장총(긴 총열 + 조준경), 개머리판은 팔 뒤쪽
    const long=wp===2,bl=long?24:17;
    ctx.fillStyle="#6a4426";ctx.beginPath();ctx.moveTo(-9,-1);ctx.lineTo(1,-2.4);ctx.lineTo(1,2.6);ctx.lineTo(-9,5);ctx.closePath();ctx.fill();hOut(1);   // 개머리판
    ctx.fillStyle=hVG(-3,2,"#9aa0ae","#4a4e58");ctx.fillRect(1,-2.6,bl,long?2.2:3.4);ctx.strokeStyle=HL.ol;ctx.lineWidth=1;ctx.strokeRect(1,-2.6,bl,long?2.2:3.4);
    if(!long){ctx.strokeStyle="#2a2a30";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(1,-.9);ctx.lineTo(1+bl,-.9);ctx.stroke();ctx.fillStyle="#7a5232";ctx.fillRect(5,1,8,2.6)}
    else{ctx.fillStyle="#2a2a30";ctx.fillRect(4,-6,9,2.4);hDot(4,-4.8,1.4,"#5ad0ff");ctx.fillStyle="#7a5232";ctx.fillRect(2,-.4,11,2.6)}
    if(atk>.55){const mx=1+bl+2;hGlow(mx,-1,long?8:12,"rgba(255,210,120,.9)");ctx.fillStyle="#fff4c8";ctx.beginPath();ctx.moveTo(mx-2,-4);ctx.lineTo(mx+(long?10:7),-1);ctx.lineTo(mx-2,2.4);ctx.closePath();ctx.fill()}
    break}
   ctx.fillStyle="#5a3a22";ctx.beginPath();ctx.moveTo(-1,1);ctx.lineTo(2.6,1);ctx.lineTo(1.6,7.5);ctx.lineTo(-2.4,7);ctx.closePath();ctx.fill();hOut(1);
   ctx.fillStyle=hVG(-3,1,"#d8dce6","#6a7080");ctx.fillRect(-1,-2.6,6,4);hOut(1);ctx.fillRect(4.6,-2,9,2.4);ctx.strokeStyle=HL.ol;ctx.lineWidth=1;ctx.strokeRect(4.6,-2,9,2.4);
   hDot(2,-.6,2.6,"#9aa0ae",true);ctx.fillStyle="#3a3e48";ctx.fillRect(1.2,-1.4,1.6,1.6);ctx.fillStyle="#f2c14e";ctx.fillRect(-2.4,-3.6,1.6,1.6);
   if(atk>.55){hGlow(16,-.8,9,"rgba(255,210,120,.9)");ctx.fillStyle="#fff4c8";ctx.beginPath();ctx.moveTo(14,-3.4);ctx.lineTo(22,-.8);ctx.lineTo(14,1.8);ctx.closePath();ctx.fill()}
   break}
  case"cards":
   for(let i=0;i<4;i++){ctx.save();ctx.translate(2,1);ctx.rotate(-.35+i*.38-atk*.3);ctx.translate(0,-5);
    ctx.fillStyle="#f4f1e8";ctx.fillRect(-2.4,-4,4.8,7);ctx.strokeStyle=HL.ol;ctx.lineWidth=.8;ctx.strokeRect(-2.4,-4,4.8,7);
    ctx.fillStyle=i%2?"#d8384a":"#1a1a1a";ctx.beginPath();ctx.moveTo(0,-1.8);ctx.lineTo(1.1,-.4);ctx.lineTo(0,1);ctx.lineTo(-1.1,-.4);ctx.closePath();ctx.fill();ctx.restore()}
   break;
 }
}
/* ── 주변 입자 (앞/뒤 나눠서 깊이감) ── */
function drawMotes(L,t,front){
 const n=4;
 for(let i=0;i<n;i++){
  const a=t*1.6+i*6.283/n,z=Math.sin(a);if((z>0)!==front)continue;
  const x=Math.cos(a)*15,y=-2+Math.sin(a*1.3)*3+z*3,s=.8+z*.25;
  switch(L.mote){
   case"elem":hGlow(x,y,5*s,ELEM_C[i]+"99");hDot(x,y,1.6*s,ELEM_C[i]);break;
   case"star":{const tw=.6+.4*Math.sin(t*7+i*2);hGlow(x,y-6,5*s*tw,i%2?"rgba(255,230,140,.7)":"rgba(200,170,255,.7)");ctx.fillStyle=i%2?"#ffe58a":"#efe4ff";ctx.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4,q=k%2?.5:2.2*s*tw;ctx.lineTo(x+Math.cos(a)*q,y-6+Math.sin(a)*q)}ctx.closePath();ctx.fill();break}
   case"ember":{const yy=10-((t*14+i*9)%30);hDot(Math.sin(t*3+i*2)*9,yy,1.1*s,i%2?"#ffb040":"#ff5a1e");break}
   case"snow":{ctx.save();ctx.translate(x,y);ctx.rotate(t+i);ctx.strokeStyle="rgba(220,245,255,.9)";ctx.lineWidth=.8;for(let k=0;k<3;k++){ctx.rotate(1.047);ctx.beginPath();ctx.moveTo(-2*s,0);ctx.lineTo(2*s,0);ctx.stroke()}ctx.restore();break}
   case"bubble":{const yy=6-((t*8+i*7)%22);ctx.strokeStyle="rgba(160,255,120,.7)";ctx.lineWidth=.8;ctx.beginPath();ctx.arc(Math.sin(t*2+i*3)*10,yy,1.2+i*.3,0,7);ctx.stroke();break}
   case"blood":hGlow(x,y,4*s,"rgba(220,20,60,.5)");hDot(x,y,1*s,"#ff2a4a");break;
  }
 }
}
/* ── 게임 화면의 플레이어 ── */
function drawPlayer(){
 const f=player.face||1,t=elapsed;
 ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(player.x,player.y+16,15,5,0,0,7);ctx.fill();
 const bob=-Math.abs(Math.sin(player.walk||0))*1.8*(player.mvs||0);
 ctx.save();ctx.translate(player.x,player.y+bob);ctx.scale(f,1);
 if(player.flash>0&&(Math.floor(elapsed*30)&1))ctx.globalAlpha=.5;        // 피격 깜빡임
 const ga=player.gun?(f>0?player.gun.aim:Math.PI-player.gun.aim):player.sw&&isSw()?(f>0?player.sw.bladeA:Math.PI-player.sw.bladeA):undefined;   // 총잡이: 조준 각도(좌우 반전 고려)
 drawHero(chr().look||LOOK.mage,t,player.walk||0,player.mvs||0,player.atk||0,ga);
 ctx.restore();ctx.globalAlpha=1;
 drawPlayerFx();
}
/* 캐릭터 선택 화면용 초상화 (한 번만 생성해서 캐시) */
const PORT={};
function portrait(k){
 if(PORT[k]!==undefined)return PORT[k];
 const c=mkCanvas(128,128),g=c.getContext("2d");g.translate(60,84);g.scale(2.15,2.15);ctx=g;
 try{g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.ellipse(0,16,14,4.5,0,0,7);g.fill();drawHero(CH[k].look,.8,0,0,0)}finally{ctx=MAINCTX}
 try{PORT[k]=c.toDataURL()}catch(e){PORT[k]=""}
 return PORT[k];
}
