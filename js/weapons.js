/* ═══════════════ weapons.js ═══════════════
   무기 발사 · 강화 · 조합 무기 · 해금 · 투사체 · 링/광선 무기 · 특수 무기(창/지뢰/블랙홀/유성/표창/전류 구체/충격파/인장)
   피해 출처 기록: 발사 시점의 curW(무기 키)를 투사체/특수 오브젝트에 w로 저장하고, 처리할 때 다시 curW로 설정 */
"use strict";
ELEM.shard="chill";                     // 빙창 파편
const maxed=k=>weapons[k]&&weapons[k].level>=8;
/* ── 해금 (회차 목표) ── */
function unlockCtx(){const t=(save&&save.tot)||{};return{kills:t.kills||0,rx:t.rx||0,boss:t.boss||0,maxLv:t.maxLv||0,pyro5:!!t.pyro5,clears:(save&&save.cl)||[]}}
const unlocked=k=>!UNLOCK[k]||!!(save&&UNLOCK[k].f(unlockCtx()));
const ch2On=()=>!!(STG[selSt]&&STG[selSt].ch===2);                              // 챕터 2 스테이지인가
const availW=k=>unlocked(k)&&(!defs[k].ch2||ch2On());                           // 이번 판에 나올 수 있는 무기 (챕터 2 전용 포함)
const availP=k=>!passiveDefs[k].ch2||ch2On();
/* ── 성장 ── */
const addsCount=(k,lv)=>k==="wand"?lv%2===0:lv%3===0;
function weaponUpgrade(k){const w=weapons[k];w.level++;if(w.level>1)w.damage*=1.2;w.rate=Math.max(.1,w.rate*.92);if(addsCount(k,w.level))w.count++;discover("w",k);sfx("upgrade")}
function availableCombos(){return comboRecipes.filter(r=>!weapons[r.key]&&weapons[r.a]&&weapons[r.a].level>=5&&passives[r.b]&&passives[r.b].level>=3&&level>=8)}
/* 조합 무기를 얻으면 재료 무기는 소모되어 무기 칸이 비고, 조합 무기 자체는 칸을 차지하지 않음 */
function addComboRecipe(r){
 weapons[r.key]={icon:r.icon,name:r.name,kind:r.kind,level:1,damage:r.damage,rate:r.rate,count:r.count,range:r.range,cool:0,desc:r.desc};
 const base=weapons[r.a];base.level=0;base.consumed=true;discover("w",r.key);
 toast("✨ 조합 무기 획득: "+r.name+" (무기 칸 +1)");stinger("evo");
 vfx({type:"ring",x:player.x,y:player.y,r0:10,r1:260,life:.6,max:.6,c:"rgba(255,215,110,.95)",w:7});
 vfx({type:"core",x:player.x,y:player.y,r:70,life:.3,max:.3,c:"#fff4c8"});
 for(let i=0;i<30;i++){const a=i/30*6.283,sp=rand(180,380);spawnP(player.x,player.y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.4,.8),rand(1.5,2.8),i&1?"#ffe58a":"#fff",1,3,0)}
 bombFlash=Math.max(bombFlash,.35);shake=Math.max(shake,8);
}
/* ── 공격 ── */
function addShot(s){if(s.pierce>0&&!s.hits)s.hits=new Map();s.w=curW;shots.push(s)}
function addX(o){o.w=curW;xs.push(o)}
function explode(x,y,r,dmg){
 const p={x,y};
 for(const e of query(x,y,r,QC))if(e.hp>0&&dist(e,p)<r+e.r)hitE(e,dmg,"#ffb070","boom",e.x-x,e.y-y);
 vfx({type:"boom",x,y,r,life:.32,max:.32});vfx({type:"light",x,y,r:r*2.6,life:.35,max:.35,c:"#ffa050"});addDecal("scorch",x,y,r*.55);
 const n=Math.min(12,4+(r/18|0));
 for(let i=0;i<n;i++){const a=Math.random()*6.283,sp=rand(140,340);spawnP(x,y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.2,.45),rand(1.5,3),i%3?"#ffb070":"#fff4c0",1,6,0)}
 for(let i=0;i<2;i++)spawnP(x+rand(-r*.3,r*.3),y+rand(-r*.3,r*.3),rand(-20,20),rand(-40,-15),rand(.5,.8),r*.22,"rgba(70,60,60,.45)",2,1,0);
 shake=Math.max(shake,4);kickR(2);sfx("boom");
}
function detonate(s){if(s.done)return;s.done=1;s.life=0;explode(s.x,s.y,s.aoe,s.damage)}
function clearEnemyShots(R){for(let i=shots.length-1;i>=0;i--)if(shots[i].enemy&&dist(player,shots[i])<R+10){burst(shots[i].x,shots[i].y,3);rm(shots,i)}}
/* 각도 차이 (-π~π 정규화 후 절댓값) */
const angDiff=(a,b)=>Math.abs(((a-b)%6.2832+9.4248)%6.2832-3.1416);
/* 몸 주위를 도는 접촉형 무기 */
const RING={orbit:{sp:3.8,mul:1,kb:0,tick:0},aegis:{sp:4.4,mul:1,kb:220,tick:0},flame:{sp:2.5,mul:.6,kb:520,tick:.4},inferno:{sp:2.6,mul:.6,kb:760,tick:.4}};   // sp: 회전 속도(라디안/초)
const ringR=w=>(w.kind==="inferno"?w.range*.9:w.range)*(w.kind==="flame"||w.kind==="inferno"?areaMul():1);
const RP={x:0,y:0,q:0};                 // 링 좌표 계산용 재사용 객체 (프레임당 할당 방지)
function ringPos(w,i){const n=wc(w),q=elapsed*RING[w.kind].sp+i*Math.PI*2/n,R=ringR(w);RP.x=player.x+Math.cos(q)*R;RP.y=player.y+Math.sin(q)*R;RP.q=q;return RP}
function seg(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1;let t=((px-ax)*dx+(py-ay)*dy)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+dx*t),py-(ay+dy*t))}
function lance(a,L,dm,steal){
 const x2=player.x+Math.cos(a)*L,y2=player.y+Math.sin(a)*L,wd=steal?20:14,ca=Math.cos(a),sa=Math.sin(a);let hits=0;
 for(const e of query((player.x+x2)/2,(player.y+y2)/2,L/2+10,QB)){
  if(e.hp<=0)continue;
  if(seg(e.x,e.y,player.x,player.y,x2,y2)<e.r+wd){hitE(e,dm,steal?"#ff8aa0":"#ffe9a8",steal?"blood":"spear",ca,sa);push(e,ca,sa,160);hits++}
 }
 if(steal&&hits)heal(Math.min(6,hits*.8),true);
 addX({t:"lance",x:player.x,y:player.y,a,L,life:.22,max:.22,steal,wd});
 vfx({type:"light",x:(player.x+x2)/2,y:(player.y+y2)/2,r:L*.9,life:.2,max:.2,c:steal?"#ff4a6a":"#ffe08a"});
 kick(-ca,-sa,3);
}
function thrust(w,steal){
 const t=nearest(w.range+100);if(!t)return;
 const dm=w.damage*dmgMul(),c=wc(w),n=steal?Math.max(3,c):c,base=Math.atan2(t.y-player.y,t.x-player.x);
 for(let i=0;i<n;i++)lance(base+(i-(n-1)/2)*(steal?.3:.26),w.range,dm,steal);
 sfx("spear");
}
function mineFire(w){
 const n=wc(w);let c=0;for(const o of xs)if(o.t==="mine")c++;if(c>=5+n*2)return;
 for(let i=0;i<n;i++){const a=rand(0,6.28),r=rand(20,80);addX({t:"mine",x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r,arm:.5,life:14,dm:w.damage*dmgMul(),aoe:85*areaMul()})}
 sfx("mine");
}
function holeFire(w){
 const list=enemies.filter(e=>e.hp>0&&dist(player,e)<w.range).sort(()=>Math.random()-.5).slice(0,wc(w)),am=areaMul();
 for(const e of list)addX({t:"bh",x:e.x,y:e.y,life:1.5,max:1.5,R:230*am,dm:w.damage*dmgMul(),aoe:170*am});
 if(list.length)sfx("hole");
}
function rain(w){
 const pool=enemies.filter(e=>e.hp>0&&dist(player,e)<w.range);if(!pool.length)return;
 const star=w.kind==="starfall",dl=star?.55:.8,am=areaMul();
 for(let i=0,n=wc(w);i<n;i++){const e=pool[Math.floor(Math.random()*pool.length)];addX({t:"met",x:e.x+rand(-30,30),y:e.y+rand(-30,30),delay:dl,d0:dl,dm:w.damage*dmgMul(),aoe:(star?100:85)*am,star})}
 sfx("meteor");
}
function starFire(w){
 const t=nearest(w.range);if(!t)return;
 const sh=w.kind==="shadowstar",base=Math.atan2(t.y-player.y,t.x-player.x),sp=sh?560:500,b=(sh?7:3)+Math.floor(w.level/2),n=wc(w);
 for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*.35;addX({t:"shk",x:player.x,y:player.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,sp,life:3,dm:w.damage*dmgMul(),b,last:null,r:sh?11:8,shadow:sh})}
 sfx("shuriken");
}
/* 혈월 낫 / 사신의 대낫: 부채꼴(대낫은 360°) 베기 + 흡혈 */
function sweep(w){
 const reaper=w.kind==="reaper",R=w.range*areaMul()*(reaper?1+.1*(wc(w)-1):1),t=nearest(R*1.8);
 const base=t?Math.atan2(t.y-player.y,t.x-player.x):(player.moving?player.aim:(player.face>0?0:Math.PI));
 const n=reaper?1:wc(w),half=1.1,dm=w.damage*dmgMul();let hits=0;
 for(const e of query(player.x,player.y,R,QB)){
  if(e.hp<=0||e.phased)continue;const dx=e.x-player.x,dy=e.y-player.y,q=Math.hypot(dx,dy);if(q>=R+e.r)continue;
  let ok=reaper||q<e.r+22;
  if(!ok){const ea=Math.atan2(dy,dx);for(let i=0;i<n;i++)if(angDiff(ea,base+i*6.2832/n)<=half){ok=true;break}}
  if(!ok)continue;const L=q||1;hitE(e,dm,"#ff7a96",w.kind,dx/L,dy/L);push(e,dx/L,dy/L,reaper?300:200);hits++;
 }
 if(hits)heal(Math.min(reaper?6:3,hits*(reaper?.5:.3)),true);
 for(let i=0;i<n;i++)vfx({type:"arc",a:base+i*6.2832/n,half:reaper?Math.PI:half,R,life:.24,max:.24,c:reaper?"#ff2a5a":"#ff6a8a",big:reaper});
 if(hits)kick(Math.cos(base),Math.sin(base),reaper?3:2);
 sfx("scythe");
}
/* 빙창 / 절대영도: 관통 창, 끝에서 파편(빙창) 또는 빙결 폭발(절대영도) */
function lanceShot(w){
 const ab=w.kind==="abszero",t=nearest(w.range);if(!t)return;
 const base=Math.atan2(t.y-player.y,t.x-player.x),n=wc(w),sp=560,dm=w.damage*dmgMul();
 for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*.2;addShot({x:player.x,y:player.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:ab?12:9,life:w.range/sp,damage:dm,kind:ab?"abszero":"icelance",pierce:999,end:ab?"nova":"shards"})}
 sfx("ice");
}
function lanceEnd(s){
 if(s.end==="shards"){
  for(let i=0;i<6;i++){const a=i/6*6.2832+Math.atan2(s.vy,s.vx);addShot({x:s.x,y:s.y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,r:6,life:.85,damage:s.damage*.35,kind:"shard",pierce:0})}
  vfx({type:"ring",x:s.x,y:s.y,r0:4,r1:34,life:.2,max:.2,c:"rgba(200,245,255,.9)",w:3});
 }else{
  const R=130*areaMul(),p={x:s.x,y:s.y};
  for(const e of query(s.x,s.y,R,QC)){if(e.hp<=0||dist(e,p)>=R+e.r)continue;hitE(e,s.damage*.8,"#dff8ff","abszero",e.x-s.x,e.y-s.y);freeze(e,1.1*statusPot())}
  vfx({type:"core",x:s.x,y:s.y,r:R*.5,life:.22,max:.22,c:"#eafcff"});vfx({type:"ring",x:s.x,y:s.y,r0:10,r1:R,life:.4,max:.4,c:"rgba(190,240,255,.95)",w:6});
  vfx({type:"light",x:s.x,y:s.y,r:R*2.4,life:.4,max:.4,c:"#9fe8ff"});addDecal("frost",s.x,s.y,R*.5);shake=Math.max(shake,4);
  for(let i=0;i<12;i++){const a=Math.random()*6.283,v=rand(120,300);spawnP(s.x,s.y,Math.cos(a)*v,Math.sin(a)*v,rand(.25,.5),rand(1.4,2.4),i&1?"#ffffff":"#9fe8ff",1,5,0)}
 }
}
/* 전류 구체 / 플라즈마 코어: 무기 수량만큼 구체 유지, 발사 주기마다 능력치 갱신 */
function teslaFire(w){
 const k=curW,pz=w.kind==="plasma",n=wc(w),dm=w.damage*dmgMul(),R=w.range*areaMul(),tick=Math.max(.18,w.rate*rateMul()*.25),m=(pz?3:1)+Math.floor(w.level/3);
 let c=0;
 for(const o of xs)if(o.t==="tesla"&&o.k===k){c++;o.dm=dm;o.R=R;o.tick=tick;o.n=m;o.cnt=n}
 for(;c<n;c++)addX({t:"tesla",k,x:player.x,y:player.y,a:c*6.2832/n,dm,R,tick,tk:rand(0,tick),n:m,pz,cnt:n,idx:c});
}
/* 화룡 방사 / 불사조의 숨결: 짧은 부채꼴 화염 (연속) */
function flamerFire(w){
 const ph=w.kind==="phoenix",R=w.range*areaMul(),t=nearest(R*1.25);if(!t)return;
 const base=Math.atan2(t.y-player.y,t.x-player.x),n=wc(w),half=ph?.5:.36,dm=w.damage*dmgMul();
 for(const e of query(player.x,player.y,R,QB)){
  if(e.hp<=0||e.phased)continue;const dx=e.x-player.x,dy=e.y-player.y,q=Math.hypot(dx,dy);if(q>=R+e.r)continue;
  const ea=Math.atan2(dy,dx);let ok=false;
  for(let i=0;i<n;i++)if(angDiff(ea,base+(i-(n-1)/2)*.7)<=half+e.r/Math.max(q,1)){ok=true;break}
  if(ok){const L=q||1;hitE(e,dm,"#ffb070",w.kind,dx/L,dy/L)}
 }
 for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*.7;
  vfx({type:"cone",a,half,R,life:.2,max:.2,ph});
  for(let j=0;j<2;j++){const aa=a+rand(-half,half)*.8,v=rand(R*1.6,R*2.6);spawnP(player.x+Math.cos(aa)*14,player.y+Math.sin(aa)*14,Math.cos(aa)*v,Math.sin(aa)*v,rand(.25,.4),rand(2,3.4),ph?(j?"#ffe58a":"#ff9a3a"):(j?"#ffd06a":"#ff5a1e"),0,3,-40)}}
 sfx("flamer");
}
/* 대지 파동 / 타이탄의 분노: 퍼져 나가는 충격파 (타이탄은 두 번) */
function quakeFire(w){
 const ti=w.kind==="titan",R=w.range*areaMul(),dm=w.damage*dmgMul(),n=wc(w)+(ti?1:0);
 for(let i=0;i<n;i++)addX({t:"wave",x:player.x,y:player.y,r:0,R:R*(1-i*.08),sp:R/.45,dm,hit:new Set(),kb:ti?560:380,ti,delay:i*.35});
 shake=Math.max(shake,ti?7:4);kick(0,1,ti?4:2);sfx("quake");
}
/* 파멸의 인장 / 종말의 서: 적 발밑에 인장 → 잠시 뒤 범위 저주 */
function sigilFire(w){
 const pool=enemies.filter(e=>e.hp>0&&!e.phased&&d2(player,e)<w.range*w.range);if(!pool.length)return;
 const doom=w.kind==="doom",dm=w.damage*dmgMul(),R=(doom?110:75)*areaMul();
 for(let i=0,n=wc(w);i<n&&pool.length;i++){const j=Math.floor(Math.random()*pool.length),e=pool[j];pool[j]=pool[pool.length-1];pool.pop();
  addX({t:"sigil",x:e.x,y:e.y,arm:.6,a0:.6,life:.35,max:.35,R,dm,doom})}
 sfx("sigil_arm");
}
/* ── 챕터 2 무기 ── */
/* 중력 구슬 / 사건의 지평선: 느린 구슬이 적을 끌어당기며 갈아버리고 끝에서 붕괴 */
function gravFire(w){
 const hz=w.kind==="horizon",t=nearest(w.range);if(!t)return;
 const base=Math.atan2(t.y-player.y,t.x-player.x),n=wc(w),sp=hz?120:160,dm=w.damage*dmgMul(),am=areaMul();
 for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*.5;addX({t:"grav",x:player.x,y:player.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:hz?3.4:2.4,max:hz?3.4:2.4,R:(hz?190:115)*am,dm,tk:0,hz})}
 sfx("hole");
}
/* 사슬 낫 / 지옥 사슬: 직선상의 적을 베고 끌어당김 (지옥 사슬은 맞은 적에서 다시 튐) */
function chainFire(w){
 const hc=w.kind==="hellchain",n=wc(w),dm=w.damage*dmgMul(),L=w.range*areaMul();
 const list=query(player.x,player.y,L,QB).filter(e=>e.hp>0&&!e.phased&&d2(e,player)<L*L).sort((a,b)=>d2(player,a)-d2(player,b));if(!list.length)return;
 for(let i=0;i<n&&i<list.length;i++){
  const t=list[i],a=Math.atan2(t.y-player.y,t.x-player.x),x2=player.x+Math.cos(a)*L,y2=player.y+Math.sin(a)*L;let hit=0;
  for(const e of query((player.x+x2)/2,(player.y+y2)/2,L/2+10,QC)){
   if(e.hp<=0||e.phased||seg(e.x,e.y,player.x,player.y,x2,y2)>=e.r+12)continue;
   hitE(e,dm,"#ff8aa0",w.kind,Math.cos(a),Math.sin(a));push(e,-Math.cos(a),-Math.sin(a),e.elite?120:380);hit++;
   if(hc&&hit<=3){let nx=null,bd=200*200;for(const q of query(e.x,e.y,200,QD)){if(q===e||q.hp<=0||q.phased)continue;const dd=d2(e,q);if(dd<bd){bd=dd;nx=q}}
    if(nx){hitE(nx,dm*.6,"#ff8aa0",w.kind);vfx({type:"zap",x:e.x,y:e.y,x2:nx.x,y2:nx.y,life:.2,max:.2,c:"#ff5a7a"})}}
  }
  addX({t:"chain",x:player.x,y:player.y,a,L,life:.25,max:.25,hc});
 }
 kick(0,0,0);sfx("scythe");
}
/* 방사능 코어 / 노심 용융: 주변 적에게 중독과 화상을 번갈아 (독화염 유도) · 노심 용융은 3번마다 폭발 */
function radFire(w){
 const md=w.kind==="meltdown",R=w.range*areaMul(),dm=w.damage*dmgMul();w.tk=(w.tk||0)+1;
 const burn=w.tk%2===0,boom=md&&w.tk%3===0;
 for(const e of query(player.x,player.y,R,QB)){
  if(e.hp<=0||e.phased||d2(e,player)>=(R+e.r)**2)continue;
  hitE(e,dm,burn?"#ffb070":"#b6ff5a",w.kind);if(burn)applyStatusQuiet(e,"burn",dm);
 }
 effects.push({type:"pulse",kind:"rad",r:R,life:.4,max:.4});
 if(boom){rxBlast(player.x,player.y,R*.75/areaMul(),dm*2.4,"#c8ff5a",420);sfx("boom")}
}
/* 레일건 / 궤도 포격 */
function railFire(w){
 const dm=w.damage*dmgMul();
 if(w.kind==="orbital"){
  const pool=enemies.filter(e=>e.hp>0&&!e.phased&&d2(player,e)<w.range*w.range);if(!pool.length)return;
  for(let i=0,n=wc(w);i<n&&pool.length;i++){const j=Math.floor(Math.random()*pool.length),e=pool[j];pool[j]=pool[pool.length-1];pool.pop();
   const R=60*areaMul();for(const q of query(e.x,e.y,R,QC))if(q.hp>0&&d2(q,e)<(R+q.r)**2)hitE(q,dm,"#bff6ff","orbital");
   addX({t:"pillar",x:e.x,y:e.y,R,life:.4,max:.4});vfx({type:"light",x:e.x,y:e.y,r:R*3,life:.35,max:.35,c:"#8fe8ff"});addDecal("scorch",e.x,e.y,R*.6)}
  shake=Math.max(shake,5);sfx("bolt");return;
 }
 const t=nearest(w.range);if(!t)return;
 const a=Math.atan2(t.y-player.y,t.x-player.x),L=1300,x2=player.x+Math.cos(a)*L,y2=player.y+Math.sin(a)*L;
 for(let i=0,n=wc(w);i<n;i++){const aa=a+(i-(n-1)/2)*.12,xx=player.x+Math.cos(aa)*L,yy=player.y+Math.sin(aa)*L;
  for(const e of enemies){if(e.hp<=0||e.phased)continue;if(seg(e.x,e.y,player.x,player.y,xx,yy)<e.r+14)hitE(e,dm,"#bff6ff","railgun",Math.cos(aa),Math.sin(aa))}
  addX({t:"rail",x:player.x,y:player.y,a:aa,L,life:.35,max:.35})}
 kick(-Math.cos(a),-Math.sin(a),6);shake=Math.max(shake,6);stopHit(.03);sfx("bolt");
}
const XK={spear:w=>thrust(w,false),bloodlance:w=>thrust(w,true),mine:mineFire,singularity:holeFire,meteor:rain,starfall:rain,shuriken:starFire,shadowstar:starFire,
 scythe:sweep,reaper:sweep,icelance:lanceShot,abszero:lanceShot,tesla:teslaFire,plasma:teslaFire,flamer:flamerFire,phoenix:flamerFire,quake:quakeFire,titan:quakeFire,sigil:sigilFire,doom:sigilFire,
 gravorb:gravFire,horizon:gravFire,chainblade:chainFire,hellchain:chainFire,radcore:radFire,meltdown:radFire,railgun:railFire,orbital:railFire};
const PASSIVE_KIND={orbit:1,aegis:1,beam:1,prism:1};   // 발사하지 않는 상시형 무기
function fire(k,w){
 const kind=w.kind,h=XK[kind];if(h)return h(w);
 if(PASSIVE_KIND[kind])return;
 const dm=w.damage*dmgMul(),am=areaMul();
 const t=nearest(w.range*(kind==="flame"||kind==="glacier"||kind==="inferno"||kind==="plague"?am:1));if(!t)return;
 if(kind==="bolt"){
  enemies.filter(e=>e.hp>0&&!e.phased&&d2(player,e)<=w.range*w.range).sort((a,b)=>d2(player,a)-d2(player,b)).slice(0,wc(w)).forEach(e=>{
   effects.push({type:"bolt",x:e.x,y:e.y,life:.18,damage:dm,w:curW});
   impact(e.x,e.y,"bolt",0,1);vfx({type:"ring",x:e.x,y:e.y,r0:8,r1:55,life:.2,max:.2,c:"rgba(190,235,255,.9)",w:3});
  });
  shake=Math.max(shake,2);sfx("bolt");return;
 }
 if(kind==="flame"){ // 화염 파동
  const R=150*am;
  for(const e of query(player.x,player.y,R,QB)){
   if(e.hp<=0)continue;const q=dist(player,e);if(q>=R+e.r)continue;
   const L=q||1,ux=(e.x-player.x)/L,uy=(e.y-player.y)/L;hitE(e,dm*.9,"#ffb070","flame",ux,uy);push(e,ux,uy,760);
  }
  clearEnemyShots(R);effects.push({type:"pulse",kind:"flame",r:R,life:.35,max:.35});shake=Math.max(shake,2.5);sfx("flame");return;
 }
 if(kind==="thunder"){
  let cur=t;const pts=[{x:player.x,y:player.y}],hit=new Set(),len=4+wc(w)*2;
  for(let i=0;i<len&&cur;i++){
   hit.add(cur);hitE(cur,dm,"#bdeaff","bolt");pts.push({x:cur.x,y:cur.y});
   let nx=null,bd=240*240;for(const e of query(cur.x,cur.y,240,QB)){if(e.hp<=0||e.phased||hit.has(e))continue;const q=d2(cur,e);if(q<bd){bd=q;nx=e}}cur=nx;
  }
  effects.push({type:"chain",pts,life:.25});shake=Math.max(shake,3);sfx("bolt");return;
 }
 if(kind==="glacier"||kind==="inferno"||kind==="plague"){
  const R=w.range*am,col={glacier:"#bff3ff",inferno:"#ff9a5a",plague:"#a8f08a"}[kind];
  for(const e of query(player.x,player.y,R,QB)){
   if(e.hp<=0)continue;const q=dist(player,e);if(q>=R+e.r)continue;
   const L=q||1,ux=(e.x-player.x)/L,uy=(e.y-player.y)/L;
   hitE(e,dm,col,kind,ux,uy);
   if(kind==="glacier")e.slowT=2;
   else if(kind==="plague")e.slowT=1;              // 중독은 hitE에서 원소(plague→poison)로 부여
   else push(e,ux,uy,900);
  }
  if(kind==="inferno")clearEnemyShots(R);
  effects.push({type:"pulse",kind,r:R,life:.35,max:.35});sfx(kind==="glacier"?"ice":kind==="inferno"?"flame":"poison");return;
 }
 if(kind==="poison"){
  const c=enemies.filter(e=>e.hp>0&&d2(player,e)<w.range*w.range);
  for(let i=0,n=wc(w);i<n&&c.length;i++){const e=c[Math.floor(Math.random()*c.length)];effects.push({type:"cloud",st:"poison",x:e.x,y:e.y,life:3.2,max:3.2,radius:78*am,dps:dm*2,tk:0,dm,w:curW})}
  sfx("poison");return;
 }
 const base=Math.atan2(t.y-player.y,t.x-player.x),n=wc(w);
 if(kind==="arcane"){
  for(let i=0;i<n;i++){const a=performance.now()/900+i*Math.PI*2/n;addShot({x:player.x,y:player.y,vx:Math.cos(a)*360,vy:Math.sin(a)*360,r:10,life:2,damage:dm,kind:"arcane",pierce:4})}
  sfx("orb");return;
 }
 if(kind==="bladeStorm"){
  const off=performance.now()/500;
  for(let i=0;i<n;i++){const a=off+i*Math.PI*2/n;addShot({x:player.x,y:player.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:7,life:1.3,damage:dm,kind:"knife",pierce:3})}
  sfx("knife");return;
 }
 if(kind==="boomerang"||kind==="crescent"){
  const big=kind==="crescent",sp=big?470:420;
  for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*(big?.5:.35);
   addShot({x:player.x,y:player.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:big?16:11,life:3.2,damage:dm,kind,boom:true,t:0,turn:w.range/sp,pierce:999,rehit:.45})}
  sfx("boomerang");return;
 }
 if(kind==="cannon"||kind==="fortress"){
  const big=kind==="fortress";
  for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*.22;
   addShot({x:player.x,y:player.y,vx:Math.cos(a)*330,vy:Math.sin(a)*330,r:big?12:9,life:w.range/330+.3,damage:dm,kind,aoe:(big?125:78)*am,pierce:0})}
  kick(-Math.cos(base),-Math.sin(base),big?5:3);  // 반동
  for(let i=0;i<4;i++){const a=base+rand(-.5,.5),sp=rand(80,200);spawnP(player.x+Math.cos(base)*16,player.y+Math.sin(base)*16,Math.cos(a)*sp,Math.sin(a)*sp,rand(.15,.3),rand(1.5,2.5),i&1?"#ffb055":"#fff0c0",1,8,0)}
  sfx("cannon");return;
 }
 const big=kind==="solar";
 for(let i=0;i<n;i++){
  const a=base+(i-(n-1)/2)*.15,sp=big?600:kind==="knife"?430:kind==="star"?500:530;
  addShot({x:player.x,y:player.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:big?16:kind==="star"?8:6,life:1.8,damage:dm,kind:big?"star":kind,pierce:big?8:kind==="star"?4:0,enemy:false});
 }
 sfx(kind==="knife"?"knife":kind==="crystal"?"ice":kind==="star"?"star":"orb");
}
/* 폭탄: 엘리트·보스를 제외한 모든 적 제거 (경험치는 보석으로만 남김) */
function detonateAll(x,y){
 let c=0;
 for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.elite)continue;e.blasted=true;e.hp=0;kill(e,true);rm(enemies,i);c++}
 for(let i=shots.length-1;i>=0;i--)if(shots[i].enemy)rm(shots,i);
 xs.push({t:"nova",x,y,life:.7,max:.7});bombFlash=.9;shake=Math.max(shake,16);stopHit(.12);
 sfx("bomb");setTimeout(chord,250);
 toast(c?`💣 폭탄! 잡몹 ${c}마리 소멸`:"💣 폭탄!");
}
function xUpdate(dt){
 for(let n=0;n<xs.length;n++){
  const o=xs[n];curW=o.w||"";
  switch(o.t){
   case"lance":case"nova":o.life-=dt;if(o.life<=0)o.dead=true;break;
   case"mine":
    o.life-=dt;o.arm-=dt;
    if(o.arm<=0)for(const e of query(o.x,o.y,32,QA))if(e.hp>0&&!e.phased&&dist(e,o)<e.r+32){explode(o.x,o.y,o.aoe,o.dm);o.dead=true;break}
    if(o.life<=0)o.dead=true;break;
   case"bh":
    o.life-=dt;
    for(const e of query(o.x,o.y,o.R,QA)){
     if(e.hp<=0)continue;const q=dist(e,o);if(q>=o.R+e.r)continue;
     const L=q||1,res=e.type==="boss"?.2:(e.elite||e.type==="tank"||e.type==="magma")?.5:1,pull=Math.min(q,320*dt*res*(1.2-q/(o.R*1.6)));
     e.x-=(e.x-o.x)/L*pull;e.y-=(e.y-o.y)/L*pull;if(e.type!=="boss")e.stun=Math.max(e.stun,.1);dmgTo(e,o.dm*.35*dt,true);
    }
    if(o.life<=0){explode(o.x,o.y,o.aoe,o.dm);o.dead=true;shake=Math.max(shake,8)}break;
   case"met":
    o.delay-=dt;
    if(o.delay<=0){
     o.dead=true;
     if(o.hostile){ // 용암 협곡의 적대 유성: 플레이어만 피해
      vfx({type:"eboom",x:o.x,y:o.y,r:o.aoe,life:.4,max:.4});vfx({type:"light",x:o.x,y:o.y,r:o.aoe*2.6,life:.35,max:.35,c:"#ff5a1e"});addDecal("scorch",o.x,o.y,o.aoe*.6);
      for(let i=0;i<10;i++){const a=Math.random()*6.283,sp=rand(140,320);spawnP(o.x,o.y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.25,.5),rand(1.6,3),i&1?"#ff7a2a":"#ffd08a",1,6,0)}
      shake=Math.max(shake,6);sfx("boom");if(dist(player,o)<o.aoe+player.r)hurt(o.dm);
     }else explode(o.x,o.y,o.aoe,o.dm);
    }break;
   case"shk":
    o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;
    for(const e of query(o.x,o.y,o.r*1.3,QA)){
     const rr=e.r+o.r*1.3;if(e.hp<=0||e.phased||e===o.last||d2(e,o)>=rr*rr)continue;
     hitE(e,o.dm,o.shadow?"#c9a8ff":"#dfe8ff",o.shadow?"shadow":"shk",o.vx/o.sp,o.vy/o.sp);sfx("ping");
     o.last=e;o.b--;
     let nx=null,bd=o.shadow?340:280;bd*=bd;
     for(const q of query(e.x,e.y,o.shadow?340:280,QB)){if(q.hp<=0||q.phased||q===e)continue;const dd=d2(e,q);if(dd<bd){bd=dd;nx=q}}
     if(nx&&o.b>=0){const a=Math.atan2(nx.y-o.y,nx.x-o.x);o.vx=Math.cos(a)*o.sp;o.vy=Math.sin(a)*o.sp}
     else if(o.b<0)o.dead=true;
     break;
    }
    if(o.life<=0)o.dead=true;break;
   case"tesla":{
    const w=weapons[o.k];if(!(w&&w.level>0)||o.idx>=o.cnt){o.dead=true;break}
    // 전류 구체는 플레이어 주변을 느리게 떠다니고, 플라즈마 코어는 가까이서 빠르게 공전
    o.a+=dt*(o.pz?2.4:.55);const ro=o.pz?90:150,tx=player.x+Math.cos(o.a)*ro,ty=player.y+Math.sin(o.a)*ro*.8,f=Math.min(1,dt*(o.pz?10:1.4));
    o.x+=(tx-o.x)*f;o.y+=(ty-o.y)*f;
    if((o.tk-=dt)<=0){o.tk=o.tick;let c=0;const R2=o.R*o.R;
     for(const e of query(o.x,o.y,o.R,QA)){if(c>=o.n)break;if(e.hp<=0||e.phased||d2(e,o)>R2)continue;c++;
      hitE(e,o.dm,"#fff27a",o.pz?"plasma":"tesla",e.x-o.x,e.y-o.y);vfx({type:"zap",x:o.x,y:o.y,x2:e.x,y2:e.y,life:.16,max:.16,c:o.pz?"#b8a0ff":"#fff27a"})}
     if(c)sfx("tesla");}
    break}
   case"wave":{
    if(o.delay>0){o.delay-=dt;o.x=player.x;o.y=player.y;break}
    o.r+=o.sp*dt;
    for(const e of query(o.x,o.y,o.r,QA)){
     if(e.hp<=0||o.hit.has(e))continue;const dx=e.x-o.x,dy=e.y-o.y,q=Math.hypot(dx,dy);if(q>=o.r+e.r||q<o.r-50)continue;
     o.hit.add(e);const L=q||1;hitE(e,o.dm,"#f0d8a8",o.ti?"titan":"quake",dx/L,dy/L);push(e,dx/L,dy/L,o.kb);
     if(o.ti)e.stunT=Math.max(e.stunT,1.3*stunRes(e));
    }
    if(impBudget>0&&Math.random()<.6){impBudget--;const a=Math.random()*6.283;spawnP(o.x+Math.cos(a)*o.r,o.y+Math.sin(a)*o.r,Math.cos(a)*40,-30,.4,rand(2.5,4),"rgba(200,170,120,.5)",2,3,0)}
    if(o.r>=o.R){o.dead=true;addDecal("scorch",o.x,o.y,o.R*.25)}
    break}
   case"grav":{ // 중력 구슬
    o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;const tick=(o.tk-=dt)<=0;if(tick)o.tk=.3;
    for(const e of query(o.x,o.y,o.R,QA)){
     if(e.hp<=0||e.phased)continue;const q=dist(e,o);if(q>=o.R+e.r)continue;
     const L=q||1,res=e.type==="boss"?.15:(e.elite||e.hv)?.45:1,pull=Math.min(q,260*dt*res);e.x-=(e.x-o.x)/L*pull;e.y-=(e.y-o.y)/L*pull;
     if(tick){if(q<o.R*.45)hitE(e,o.dm*.45,"#c8a8ff",o.hz?"horizon":"gravorb");else dmgTo(e,o.dm*.15,true)}
    }
    if(o.life<=0){o.dead=true;explode(o.x,o.y,o.R*.8,o.dm*(o.hz?3:1.8));if(o.hz){for(const e of query(o.x,o.y,o.R,QA))if(e.hp>0&&d2(e,o)<o.R*o.R)applyStatusQuiet(e,"curse",o.dm)}}
    break}
   case"chain":case"rail":case"pillar":o.life-=dt;if(o.life<=0)o.dead=true;break;
   case"dyna": // 총잡이 다이너마이트: 포물선 비행 후 폭발
    o.f+=dt/.45;const k=Math.max(0,Math.min(1,o.f));o.x=o.x0+(o.tx-o.x0)*k;o.y=o.y0+(o.ty-o.y0)*k-Math.sin(k*Math.PI)*90;
    if(k>=1){o.dead=true;explode(o.tx,o.ty,o.R,o.dm);shake=Math.max(shake,9)}break;
   case"saw": // 적대 톱날
    if(o.warn>0){o.warn-=dt;break}
    o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.hitT-=dt;
    if(o.hitT<=0&&d2(o,player)<(o.r+player.r)**2){o.hitT=.5;hurt(o.dm);sfx("hurt")}
    if(impBudget>0&&Math.random()<.4)spawnP(o.x,o.y,rand(-120,120),rand(-120,120),.2,1.5,"#ffd08a",1,6,0);
    if(o.life<=0)o.dead=true;break;
   case"well": // 중력 우물
    if(o.warn>0){o.warn-=dt;break}
    o.life-=dt;{const dx=o.x-player.x,dy=o.y-player.y,L=Math.hypot(dx,dy)||1;
     if(L<o.R&&player.dashT<=0){const f=Math.min(L,(150*(1-L/o.R)+30)*dt);player.x+=dx/L*f;player.y+=dy/L*f;if(L<34)hurt(o.dm*dt)}}
    if(o.life<=0)o.dead=true;break;
   case"sigil":
    if(o.arm>0){o.arm-=dt;
     if(o.arm<=0){const R2=o.R;
      for(const e of query(o.x,o.y,R2,QA)){if(e.hp<=0||e.phased||d2(e,o)>=(R2+e.r)**2)continue;hitE(e,o.dm,"#d890ff",o.doom?"doom":"sigil",e.x-o.x,e.y-o.y)}
      vfx({type:"ring",x:o.x,y:o.y,r0:o.R*.3,r1:o.R*1.1,life:.35,max:.35,c:"rgba(196,106,255,.95)",w:5});vfx({type:"light",x:o.x,y:o.y,r:o.R*2.6,life:.35,max:.35,c:"#c46aff"});
      sfx("sigil")}}
    else{o.life-=dt;if(o.life<=0)o.dead=true}
    break;
  }
 }
 cull(xs,notDead);
}
/* 쿨다운이 끝난 무기 발사 */
function updateWeapons(dt){
 const rm_=rateMul();
 for(const k in weapons){const w=weapons[k];w.cool=(w.cool||0)-dt;if(w.level>0&&w.cool<=0){w.cool=w.rate*rm_;curW=k;fire(k,w);if(player.atkCD<=0&&!PASSIVE_KIND[w.kind]){player.atk=1;player.atkCD=.45}}}
}
/* 접촉형 링 무기 (위성검 / 성역의 검 / 화염 고리 / 지옥의 왕관) */
function updateRingWeapons(){
 const rm_=rateMul(),dm0=dmgMul();
 for(const k in weapons){
  const w=weapons[k];if(!(w.level>0)||!RING[w.kind])continue;curW=k;
  const cfg=RING[w.kind],fl=w.kind==="flame"||w.kind==="inferno",tick=cfg.tick||Math.max(.3,w.rate*rm_),dm=w.damage*dm0*cfg.mul,hitR=fl?16:14;
  for(let i=0,n=wc(w);i<n;i++){
   const p=ringPos(w,i),px=p.x,py=p.y;
   for(const e of query(px,py,hitR,QA)){
    if(e.hp<=0)continue;const rr=e.r+hitR,ddx=e.x-px,ddy=e.y-py;if(ddx*ddx+ddy*ddy>=rr*rr)continue;
    e.cd=e.cd||{};
    if((e.cd[k]||0)<=elapsed){
     e.cd[k]=elapsed+tick;const q=dist(e,player)||1,ux=(e.x-player.x)/q,uy=(e.y-player.y)/q;
     hitE(e,dm,fl?"#ffb070":"#dfe8ff",fl?w.kind:"slash",ux,uy);
     if(cfg.kb)push(e,ux,uy,cfg.kb);
    }
   }
   for(let j=shots.length-1;j>=0;j--){const s=shots[j];if(s.enemy){const ddx=s.x-px,ddy=s.y-py;if(ddx*ddx+ddy*ddy<484){burst(s.x,s.y,3);rm(shots,j)}}}
  }
 }
}
/* 회전 광선 (프리즘 광선 / 프리즘 폭풍): 같은 적은 무기 간격마다 한 번 */
const beamAng=(w,i,n)=>elapsed*(w.kind==="prism"?1.5:.9)+i*6.2832/n;
const beamLen=w=>w.range*areaMul();
function updateBeams(){
 let dm0=0;
 for(const k in weapons){
  const w=weapons[k];if(!(w.level>0)||(w.kind!=="beam"&&w.kind!=="prism"))continue;
  if(!dm0)dm0=dmgMul();curW=k;
  const n=wc(w),L=beamLen(w),wd=w.kind==="prism"?15:11,tick=Math.max(.15,w.rate*rateMul()),dm=w.damage*dm0,list=query(player.x,player.y,L,QA);
  for(let i=0;i<n;i++){
   const a=beamAng(w,i,n),x2=player.x+Math.cos(a)*L,y2=player.y+Math.sin(a)*L;
   for(const e of list){
    if(e.hp<=0||e.phased)continue;e.cd=e.cd||{};if((e.cd[k]||0)>elapsed)continue;
    if(seg(e.x,e.y,player.x,player.y,x2,y2)>=e.r+wd)continue;
    e.cd[k]=elapsed+tick;hitE(e,dm,w.kind==="prism"?"#ffd0ff":"#fff6c0",w.kind,Math.cos(a+1.57),Math.sin(a+1.57));
   }
  }
 }
}
/* 투사체 (아군 + 적 탄) */
function updateProjectiles(dt){
 for(let i=shots.length-1;i>=0;i--){
  const s=shots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
  if(s.enemy){const rr=s.r+player.r;if(d2(s,player)<rr*rr){hurt(s.damage);if(s.fire&&impBudget>0)burst(s.x,s.y,5,"#ff9a3a");rm(shots,i)}else if(s.life<=0)rm(shots,i);continue}
  curW=s.w||"";
  if(s.kind==="crystal"||s.kind==="orb"){ // 유도: 0.15초마다 목표 재탐색
   if(!s.tg||s.tg.hp<=0||(s.tt-=dt)<=0){s.tt=.15;s.tg=nearest(s.kind==="orb"?340:300)}
   const t=s.tg;
   if(t&&t.hp>0){const a=Math.atan2(t.y-s.y,t.x-s.x),sp=Math.hypot(s.vx,s.vy),str=s.kind==="orb"?2.6:3;s.vx+=(Math.cos(a)*sp-s.vx)*dt*str;s.vy+=(Math.sin(a)*sp-s.vy)*dt*str}
  }
  if(s.boom){s.t+=dt;if(s.t>s.turn){const ddx=player.x-s.x,ddy=player.y-s.y,LL=Math.hypot(ddx,ddy)||1,sp=520;s.vx+=(ddx/LL*sp-s.vx)*Math.min(1,dt*6);s.vy+=(ddy/LL*sp-s.vy)*Math.min(1,dt*6);if(LL<24)s.life=0}}
  if(s.life>0)for(const e of query(s.x,s.y,s.r,QA)){
   if(e.hp<=0||e.phased)continue;const rr=s.r+e.r;if(d2(s,e)>=rr*rr)continue;
   if(s.aoe){detonate(s);break}
   if(s.lastE===e)continue;                            // 도탄: 방금 맞힌 적은 건너뜀
   if(s.hits){const lt=s.hits.get(e);if(lt!==undefined&&elapsed-lt<(s.rehit||1e9))continue;s.hits.set(e,elapsed)}
   const LL=Math.hypot(s.vx,s.vy)||1;
   hitE(e,s.gun?gunPre(e,s):s.damage,s.kind==="arcane"?"#e6a0ff":s.kind==="icelance"||s.kind==="abszero"||s.kind==="shard"?"#dff8ff":"#fff",s.kind,s.vx/LL,s.vy/LL);
   if(s.kb)push(e,s.vx/LL,s.vy/LL,s.kb);
   if(s.gun&&gunHit(e,s))break;                       // 도탄으로 튕겼으면 관통 소모 없이 계속 비행
   if(!s.boom){if(s.pierce>0)s.pierce--;else s.life=0}
   if(s.life<=0)break;
  }
  if(s.life<=0){if(s.aoe)detonate(s);if(s.end){lanceEnd(s);s.end=null}rm(shots,i)}
 }
}
