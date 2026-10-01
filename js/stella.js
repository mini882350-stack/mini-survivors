/* ═══════════════ stella.js ═══════════════
   1) 별의 심연 최종 보스 '스텔라': 등장하면 잡몹·위험요소가 사라지고 1:1 결투 (체력 단계별 패턴)
   2) 플레이어블 '별의 아이 스텔라': 별 부름 지팡이 · 별의 장막(실드) · Space 텔레포트
      시작 시 원소 마법 / 우주 마법 루트 선택 · Lv.10 특전 = E 궁극마법 · Lv.20 특전 = F 궁극마법 */
"use strict";
const isSt=()=>selCh==="stella";
const STELLA_HP=9;        // 보스 체력 = 일반 최종 보스 기준 배율
/* ══════════ 1) 보스 ══════════ */
const STB=[];             // 보스 예고·공격: {t:"beam"|"nova", ...}
function spawnStella(){
 for(const e of enemies)if(impBudget>0&&onScr(e.x,e.y,0)){impBudget--;vfx({type:"ring",x:e.x,y:e.y,r0:4,r1:e.r*2.4,life:.35,max:.35,c:"rgba(200,180,255,.85)",w:2})}
 enemies.length=0;for(let i=shots.length-1;i>=0;i--)if(shots[i].enemy)shots.splice(i,1);for(const o of xs)if(o.hostile)o.dead=true;for(let i=effects.length-1;i>=0;i--)if(HOSTILE_FX[effects[i].type])effects.splice(i,1);
 runSt.duel=true;STB.length=0;
 const a=Math.random()*6.283,b=makeEnemy("boss",player.x+Math.cos(a)*360,player.y+Math.sin(a)*360);
 b.final=true;b.stella=true;b.ai="stella";b.r=30;b.xp=800;b.hp=b.maxHp=b.hp*2.5*STELLA_HP;b.sp=120;b.dir=1;
 b.pt=2.2;b.ph=1;b.tp=6;b.cast=null;b.spin=0;b.face=1;
 toast("✨ 별의 아이 스텔라 — 1:1 결투!");stinger("boss");shake=Math.max(shake,16);slowT=.7;timeScale=.35;
 vfx({type:"ring",x:b.x,y:b.y,r0:20,r1:600,life:1,max:1,c:"rgba(200,170,255,.9)",w:10});vfx({type:"light",x:b.x,y:b.y,r:700,life:.8,max:.8,c:"#c8a8ff"});
 pickSong();
}
function stellaShot(e,a,sp,big){if(shots.length>=360)return;shots.push({x:e.x,y:e.y-10,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:big?9:6,life:5.5,damage:(big?15:9)*e.dmgS,enemy:true,star:1})}
/* 보스 이동·패턴 (updateEnemies의 switch에서 호출 → 이동 속도 반환) */
function stellaAI(e,dt,L,ux,uy){
 const hp=e.hp/e.maxHp,ph=hp>.6?1:hp>.3?2:3,fast=ph===3?1.35:ph===2?1.15:1;
 if(ph!==e.ph){e.ph=ph;e.wardT=1.5;STB.length=0;e.cast=null;e.pt=1.2;
  toast(ph===2?"✨ 스텔라: \"조금 더 진심으로 갈게!\"":"🌌 스텔라: \"별들아, 전부 떨어져라!\"");stinger("boss");shake=Math.max(shake,12);
  vfx({type:"ring",x:e.x,y:e.y,r0:20,r1:420,life:.6,max:.6,c:"rgba(255,220,140,.95)",w:8});for(let i=0;i<32;i++)stellaShot(e,i*6.283/32,150,true)}
 e.face=player.x>=e.x?1:-1;
 // 순간이동
 e.tp-=dt;if(e.tp<=0&&!e.cast){e.tp=(ph===3?4:ph===2?5.5:7)+rand(0,1.5);const a=Math.random()*6.283,r=rand(260,340);
  vfx({type:"ring",x:e.x,y:e.y,r0:30,r1:4,life:.3,max:.3,c:"rgba(220,200,255,.9)",w:4});e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;
  vfx({type:"ring",x:e.x,y:e.y,r0:4,r1:50,life:.3,max:.3,c:"rgba(220,200,255,.9)",w:4});sfx("sigil_arm")}
 // 패턴
 if(e.cast){const C=e.cast;C.t-=dt;
  if(C.k==="spiral"){C.tk-=dt;while(C.tk<=0){C.tk+=ph===3?.06:.08;e.spin+=.33;const arms=ph===1?2:3;for(let k=0;k<arms;k++)stellaShot(e,e.spin+k*6.283/arms,165*fast)}}
  else if(C.k==="burst"){C.tk-=dt;if(C.tk<=0&&C.n>0){C.tk=.42;C.n--;const m=ph===3?30:24,o=Math.random();for(let k=0;k<m;k++)stellaShot(e,o+k*6.283/m,150*fast,C.n%2===0);sfx("warn")}}
  if(C.t<=0)e.cast=null;
  if(C.hold)return[0,0];
 }else{e.pt-=dt;if(e.pt<=0){
  const pool=ph===1?["spiral","meteor","burst"]:ph===2?["spiral","meteor","burst","beam","hole"]:["spiral","meteor","beam","hole","nova","burst"];
  let k=pool[Math.floor(Math.random()*pool.length)];if(k===e.last&&pool.length>1)k=pool[(pool.indexOf(k)+1)%pool.length];e.last=k;
  e.pt=(ph===3?2.2:ph===2?2.8:3.4);
  if(k==="spiral"){e.cast={k,t:2.6,tk:0};vfx({type:"txt",x:e.x,y:e.y-70,t:"별빛 소용돌이",life:.8,max:.8,c:"#e8d8ff",sz:15})}
  else if(k==="burst")e.cast={k,t:1.6,tk:.3,n:ph===3?4:3};
  else if(k==="meteor"){const n=ph===3?14:ph===2?10:7;for(let i=0;i<n;i++){const a=Math.random()*6.283,r=i===0?rand(0,30):rand(50,280);xs.push({t:"met",x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r,delay:1.35+i*.06,d0:1.35+i*.06,dm:20*e.dmgS,aoe:82,hostile:true,star:1})}
   vfx({type:"txt",x:e.x,y:e.y-70,t:"유성우",life:.8,max:.8,c:"#ffd8a0",sz:15});sfx("warn")}
  else if(k==="beam"){const n=ph===3?6:4,base=Math.atan2(player.y-e.y,player.x-e.x);for(let i=0;i<n;i++)STB.push({t:"beam",x:e.x,y:e.y,a:base+i*6.283/n,L:900,w:26,warn:1.05,life:.35,dm:28*e.dmgS,hit:false});
   e.cast={k,t:1.4,hold:1};sfx("warn")}
  else if(k==="hole"){const a=Math.random()*6.283;xs.push({t:"well",x:player.x+Math.cos(a)*110,y:player.y+Math.sin(a)*110,warn:1,life:5,max:5,R:250,dm:32*e.dmgS,hostile:true});for(let i=0;i<12;i++)stellaShot(e,i*.5236,120);sfx("warn")}
  else if(k==="nova"){STB.push({t:"nova",x:e.x,y:e.y,R:310,warn:2.2,life:.3,dm:62*e.dmgS,hit:false});e.cast={k,t:2.5,hold:1};
   vfx({type:"txt",x:e.x,y:e.y-70,t:"초신성 — 범위 밖으로!",life:1.4,max:1.4,c:"#ff8a8a",sz:17});stinger("elite")}
 }}
 // 거리 유지하며 옆으로 돌기
 if(Math.random()<dt*.4)e.dir=-e.dir;
 const want=L>340?1:L<230?-1:0,sp=e.sp*fast;
 return[(ux*want-uy*.85*e.dir)*sp,(uy*want+ux*.85*e.dir)*sp];
}
function updateStellaBoss(dt){
 for(let i=STB.length-1;i>=0;i--){const o=STB[i];
  if(o.warn>0){o.warn-=dt;if(o.warn<=0){shake=Math.max(shake,o.t==="nova"?16:6);sfx(o.t==="nova"?"bomb":"fan")}continue}
  o.life-=dt;
  if(!o.hit){if(o.t==="beam"){const x2=o.x+Math.cos(o.a)*o.L,y2=o.y+Math.sin(o.a)*o.L;if(seg(player.x,player.y,o.x,o.y,x2,y2)<o.w+player.r*.6){o.hit=true;hurt(o.dm)}}
   else if(o.t==="nova"){if(dist(player,o)<o.R){o.hit=true;hurt(o.dm)}if(o.life<.25&&!o.fx){o.fx=1;vfx({type:"ring",x:o.x,y:o.y,r0:30,r1:o.R,life:.45,max:.45,c:"rgba(255,230,170,.95)",w:14});vfx({type:"light",x:o.x,y:o.y,r:o.R*2,life:.4,max:.4,c:"#ffe0a0"})}}}
  if(o.life<=0)STB.splice(i,1)}
}
function drawStellaFx(){
 if(!STB.length)return;
 for(const o of STB){
  if(o.t==="beam"){const x2=o.x+Math.cos(o.a)*o.L,y2=o.y+Math.sin(o.a)*o.L;ctx.save();ctx.lineCap="round";
   if(o.warn>0){const p=1-o.warn/1.05;ctx.strokeStyle=`rgba(255,40,60,${.12+.2*p})`;ctx.lineWidth=o.w*2;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(x2,y2);ctx.stroke();
    ctx.strokeStyle=`rgba(255,90,90,${.6+.4*p})`;ctx.lineWidth=2;ctx.setLineDash([12,8]);ctx.lineDashOffset=-elapsed*60;ctx.stroke();ctx.setLineDash([])}
   else{const k=o.life/.35;ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(200,160,255,${.6*k})`;ctx.lineWidth=o.w*2.2*k+4;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle=`rgba(255,255,255,${k})`;ctx.lineWidth=6*k+1;ctx.stroke()}
   ctx.restore()}
  else if(o.t==="nova"&&o.warn>0)dangerZone(o.x,o.y,o.R,1-o.warn/2.2);
 }
}
/* 보스 그리기: 플레이어블과 같은 리깅 캐릭터를 크게 */
function drawStellaBoss(e){
 const t=elapsed,s=2.3;
 ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=.35+.1*Math.sin(t*3);ctx.drawImage(glowSpr("rgba(190,150,255,.9)"),e.x-90,e.y-110,180,180);ctx.restore();
 for(let i=0;i<6;i++){const a=t*1.4+i*1.047,x=e.x+Math.cos(a)*54,y=e.y-18+Math.sin(a)*22;starPath(x,y,4.5,2);ctx.fillStyle=i%2?"#ffe58a":"#e8dcff";ctx.fill()}
 ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(e.x,e.y+34,30,9,0,0,7);ctx.fill();
 ctx.save();ctx.translate(e.x,e.y+Math.sin(t*2)*4-8);ctx.scale(s*e.face,s);if(e.hit>0&&(Math.floor(t*40)&1))ctx.globalAlpha=.55;
 drawHero(LOOK.stella,t,t*4,0,e.cast?.8:0);ctx.restore();ctx.globalAlpha=1;
 if(e.wardT>0){ctx.strokeStyle=`rgba(255,230,160,${.5+.4*Math.sin(t*20)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y-10,58,0,7);ctx.stroke()}
 statusFx(e,e.y);
}
function starPath(x,y,R,r){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r:R;ctx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}ctx.closePath()}

/* ══════════ 2) 플레이어블 스텔라 ══════════ */
const ST_ROUTE={
 elem:{i:"🌈",n:"원소 마법",c:"#ffb46a",d:"화염·냉기·번개·독 구슬을 넓게 흩뿌려 상태이상을 겹치고 원소 반응을 연쇄시킵니다. 별빛 탄도 원소를 띱니다."},
 cosmos:{i:"🌌",n:"우주 마법",c:"#b090ff",d:"조준점에 중력 붕괴를 일으켜 적을 끌어모은 뒤 큰 피해로 터뜨립니다. 별빛 탄이 맞으면 별 조각으로 갈라집니다."}
};
const ST_ULT={
 bigbang:{r:"cosmos",i:"💥",n:"빅뱅",cd:40,d:"1초간 힘을 모은 뒤(무적) 화면의 모든 적에게 4000% 대폭발 + 넉백"},
 blackhole:{r:"cosmos",i:"🕳️",n:"블랙홀",cd:45,d:"조준점에 5초간 거대한 블랙홀 — 적을 빨아들이며 초당 1200%, 끝에 붕괴 3000%"},
 starfall:{r:"cosmos",i:"🌠",n:"별의 비",cd:40,d:"3초간 유성 40개가 화면의 적에게 떨어집니다 (각 700%)"},
 prism:{r:"elem",i:"🌈",n:"원소 대폭발",cd:35,d:"화염→냉기→번개→독 4겹 파동 — 화면의 모든 적에게 각 900% + 상태이상 4종 → 원소 반응 연쇄"},
 zero:{r:"elem",i:"❄️",n:"절대영도",cd:45,d:"화면의 모든 적을 3초간 얼린 뒤 얼음이 깨지며 2500%"},
 storm:{r:"elem",i:"⛈️",n:"뇌운",cd:40,d:"6초간 조준점을 따라다니는 뇌운이 초당 10번 번개 (각 400% + 감전)"}
};
const ST_GEN=[
 {k:"st_aegis",i:"🛡️",n:"별의 가호",d:"별의 장막(실드) 최대치 +50%"},
 {k:"st_warp",i:"🌀",n:"공간 도약",d:"텔레포트 재사용 대기 50% 감소"},
 {k:"st_flux",i:"✨",n:"마력 폭주",d:"별빛 탄 시전 속도 +25% · 루트 마법 주기 -20%"},
 {k:"st_nebula",i:"🌫️",n:"성운",d:"모든 마법 범위 +30%"},
 {k:"st_rev",i:"🕊️",n:"별의 축복",d:"즉시 부활 횟수 +1"},
 {k:"st_ultcd",i:"⏳",n:"궁극 숙련",d:"궁극마법 재사용 대기 -30%"}
];
TAL.stella=[...Object.keys(ST_ULT).map(k=>({k:"ul_"+k,i:ST_ULT[k].i,n:"궁극마법: "+ST_ULT[k].n,d:ST_ULT[k].d+` (재사용 ${ST_ULT[k].cd}초)`})),...ST_GEN];
const ST_UP={
 stdmg:{i:"⭐",n:"별빛 강화",max:8,d:"마법 피해 +20% (별빛 탄 · 루트 마법 · 궁극마법)"},
 stspd:{i:"⚡",n:"빠른 영창",max:6,d:"별빛 탄 시전 간격 -10%"},
 stmulti:{i:"✳️",n:"별빛 분열",max:3,d:"별빛 탄 +1발 (부채꼴)"},
 stpow:{i:"🔮",n:"마력 증폭",max:5,d:"루트 마법 피해 +15%"},
 stfreq:{i:"🔁",n:"연속 영창",max:4,d:"루트 마법 주기 -10%"},
 starea:{i:"🌐",n:"마법 확산",max:4,d:"루트 마법 범위 +15%"},
 storb:{i:"🔴",n:"원소 구슬",max:4,route:"elem",d:"원소 산탄 구슬 +1개"},
 stgrav:{i:"🌀",n:"중력 강화",max:3,route:"cosmos",d:"중력 붕괴 흡입력 · 피해 +25%"},
 stsec:{i:"📖",n:"보조 마법",max:5,d:"원소: 원소 폭풍(주위를 도는 원소 구슬 4개) · 우주: 유성 낙하(3초마다 유성) — Lv당 강화"},
 stshield:{i:"🛡️",n:"별의 장막",max:5,d:"실드 최대치 +12% (최대 HP 기준)"},
 stregen:{i:"💠",n:"장막 재생",max:3,d:"실드 재생 시작 -0.5초 · 재생 속도 +30%"},
 sttele:{i:"🌀",n:"도약 숙련",max:3,d:"텔레포트 재사용 대기 -15% · 거리 +15%"},
 stmast:{i:"🏅",n:"별의 숙련",max:10,ch2:1,d:"마법 피해 +12% (챕터 2 전용)"}
};
const stu=k=>(player.st&&player.st.u[k])||0;
const ELC={burn:"#ff8a3a",chill:"#9fe8ff",shock:"#ffe14a",poison:"#9fff6a"},ELS=["burn","chill","shock","poison"],ELK={burn:"flame",chill:"crystal",shock:"bolt",poison:"poison"};
const stBase=()=>26*(1+stu("stdmg")*.2)*(1+stu("stmast")*.12)*bounty()*dmgMul();
const stArea=()=>(1+stu("starea")*.15)*(T("st_nebula")?1.3:1)*areaMul();
const stInt=()=>.34*(1-stu("stspd")*.1)*rateMul()*(T("st_flux")?.75:1);
const stPer=()=>(player.st.route==="elem"?1.2:2.6)*(1-stu("stfreq")*.1)*(T("st_flux")?.8:1);
const stShieldMax=()=>player.maxHp*(.3+.12*stu("stshield"))*(T("st_aegis")?1.5:1);
const stUltCd=k=>ST_ULT[k].cd*(T("st_ultcd")?.7:1);
function stInit(){player.st={route:null,u:{},cd:0,aim:0,spT:1,sp2T:2,calm:9,eUlt:null,fUlt:null,eCD:0,fCD:0,act:null,picked:false,elI:0};player.sh=0}
/* 시작 루트 선택 */
function stChooseStart(){
 paused=true;clearPtr();const lu=$("levelup"),box=$("choices");box.innerHTML="";lu.classList.add("talent");
 const h=lu.querySelector("h2"),sub=lu.querySelector(".sub");h.textContent="🪄 마법 루트를 고르세요";sub.textContent="별 부름 지팡이가 이번 판에 쓸 마법 · Lv.10/20 특전에서 E·F 궁극마법을 얻습니다 · 숫자 키로 선택";
 $("ownedL").innerHTML="";$("reroll").style.display="none";$("skipL").style.display="none";gridCls(box,2);
 for(const k of["elem","cosmos"]){const R_=ST_ROUTE[k],b=document.createElement("div");b.className="choice t-combo tal swpick";
  b.innerHTML=`<div class="icon">${R_.i}</div><b>${R_.n}</b><span class="tag">${k==="elem"?"원소 산탄 · 상태이상 조합":"중력 붕괴 · 강력한 한 방"}</span><p>${R_.d}</p><div class="stat">궁극마법: ${Object.values(ST_ULT).filter(u=>u.r===k).map(u=>u.i+" "+u.n).join(" · ")}</div>`;
  b.onmouseenter=()=>sfx("ui");
  b.onclick=()=>{player.st.route=k;player.st.picked=true;player.sh=stShieldMax();lu.classList.remove("talent");h.textContent="✨ 능력을 선택하세요";sub.textContent="원소가 다른 무기를 모으면 원소 반응이 일어납니다 · 숫자 키로 선택";$("skipL").style.display="";
   $("levelup").style.display="none";paused=false;last=performance.now();toast(`${R_.i} ${R_.n}`);sfx("upgrade");lvFx();stbS=""};
  box.appendChild(b)}
 show("levelup");
}
function stAim(){const s=player.st;
 if(mouse.used&&!TOUCH){s.aim=Math.atan2(mWY()-player.y,mWX()-player.x);s.tx=mWX();s.ty=mWY();return true}
 const t=nearest(520);if(t){s.aim=Math.atan2(t.y-player.y,t.x-player.x);s.tx=t.x;s.ty=t.y;return true}
 s.tx=player.x+Math.cos(s.aim)*200;s.ty=player.y+Math.sin(s.aim)*200;return false}
/* 별빛 탄 */
function stBolt(){
 const s=player.st,n=1+stu("stmulti"),dm=stBase();curW="st_bolt";
 for(let i=0;i<n;i++){const a=s.aim+(i-(n-1)/2)*.14;
  const el=s.route==="elem"?ELS[(s.elI++)%4]:null;
  addShot({x:player.x+Math.cos(a)*20,y:player.y-8+Math.sin(a)*20,vx:Math.cos(a)*720,vy:Math.sin(a)*720,r:7,life:.8,damage:dm,kind:"stbolt",pierce:s.route==="cosmos"?1:0,stl:1,el,col:el?ELC[el]:"#e8dcff"})}
 player.atk=1;player.atkCD=.12;sfx("orb");
}
function stShotHit(e,s){
 if(s.el)applyStatus(e,s.el,s.damage);
 if(player.st.route==="cosmos"&&!s.shard&&burstB>0){burstB--;const pw=curW;curW="st_shard";for(let k=0;k<3;k++){const a=Math.random()*6.283;addShot({x:e.x,y:e.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:5,life:.45,damage:s.damage*.35,kind:"stbolt",pierce:0,stl:1,shard:1,col:"#c8b8ff",lastE:e})}curW=pw}
}
/* 루트 마법 · 보조 마법 · 궁극마법 오브젝트 */
const STO=[];
function stCastRoute(){
 const s=player.st,pow=stBase()*(1+stu("stpow")*.15);
 if(s.route==="elem"){const n=5+stu("storb"),R=65*stArea(),cx=s.tx,cy=s.ty;
  for(let i=0;i<n;i++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*170*stArea(),el=ELS[(s.elI++)%4];STO.push({t:"orb",x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,sx:player.x,sy:player.y-20,d:.38+i*.03,d0:.38+i*.03,R,el,dm:pow*1.1})}sfx("orb")}
 else{const R=150*stArea()*(1+stu("stgrav")*.12);STO.push({t:"sing",x:s.tx,y:s.ty,life:1,max:1,R,dm:pow*6*(1+stu("stgrav")*.25)});sfx("hole")}
}
function stCastSec(){
 const s=player.st,lv=stu("stsec");if(!lv)return;
 if(s.route==="cosmos"){const on=enemies.filter(e=>e.hp>0&&!e.phased&&onScr(e.x,e.y,0));const n=2+lv;curW="st_meteor";
  for(let i=0;i<n&&on.length;i++){const e=on[Math.floor(Math.random()*on.length)];addX({t:"met",x:e.x+rand(-20,20),y:e.y+rand(-20,20),delay:.8,d0:.8,dm:stBase()*(3+lv*.6),aoe:80*stArea(),star:1})}}
}
function stUlt(slot){
 const s=player.st;if(!isSt()||!s||!running||paused||s.act)return;
 const k=slot?s.fUlt:s.eUlt;if(!k){toast(slot?"🔒 F 궁극마법은 Lv.20 특전에서 얻습니다":"🔒 E 궁극마법은 Lv.10 특전에서 얻습니다");return}
 if((slot?s.fCD:s.eCD)>0){toast(`${ST_ULT[k].n} 재사용 대기 ${Math.ceil(slot?s.fCD:s.eCD)}초`);return}
 if(slot)s.fCD=stUltCd(k);else s.eCD=stUltCd(k);stAim();
 const U=ST_ULT[k],b=stBase();curW="ul_"+k;stbS="";
 vfx({type:"txt",x:player.x,y:player.y-50,t:U.i+" "+U.n,life:1,max:1,c:"#ffe58a",sz:21});stinger("evo");
 const on=()=>enemies.filter(e=>e.hp>0&&!e.phased&&onScr(e.x,e.y,0));
 switch(k){
  case"bigbang":s.act={k,t:1,inv:1};slowT=.4;timeScale=.5;break;
  case"blackhole":STO.push({t:"bh",x:s.tx,y:s.ty,life:5,max:5,tk:0,R:420*stArea(),dm:b});break;
  case"starfall":s.act={k,t:3,n:40,f:0,tk:0};break;
  case"prism":s.act={k,t:1.2,w:0,tk:0};break;
  case"zero":{const L=on();for(const e of L){freeze(e,3);e.zeroT=3}STO.push({t:"zero",life:3,max:3,list:L,dm:b*25});SWFXflash("#cfefff");sfx("freeze");break}
  case"storm":STO.push({t:"storm",x:s.tx,y:s.ty,life:6,max:6,tk:0,dm:b*4});sfx("bolt");break;
 }
}
function SWFXflash(c){STO.push({t:"flash",life:.4,max:.4,c})}
/* Space: 텔레포트 */
function stTele(){
 const s=player.st;if(!s||!running||paused||player.dashCD>0||s.act)return;
 stAim();const R=300*(1+stu("sttele")*.15);let tx,ty;
 if(mouse.used&&!TOUCH){tx=mWX();ty=mWY()}else{const a=player.moving?player.aim:s.aim;tx=player.x+Math.cos(a)*220;ty=player.y+Math.sin(a)*220}
 let dx=tx-player.x,dy=ty-player.y;const L=Math.hypot(dx,dy)||1;if(L>R){dx=dx/L*R;dy=dy/L*R}
 vfx({type:"ring",x:player.x,y:player.y,r0:28,r1:4,life:.3,max:.3,c:"rgba(220,200,255,.9)",w:4});
 player.x+=dx;player.y+=dy;player.invT=Math.max(player.invT,.25);player.dashCD=2.4*(1-stu("sttele")*.15)*(T("st_warp")?.5:1);
 const pw=curW;curW="st_tele";areaHit(player.x,player.y,90*stArea(),stBase()*1.5,"#e8dcff");curW=pw;
 vfx({type:"ring",x:player.x,y:player.y,r0:4,r1:90*stArea(),life:.3,max:.3,c:"rgba(220,200,255,.95)",w:5});vfx({type:"light",x:player.x,y:player.y,r:220,life:.3,max:.3,c:"#c8a8ff"});sfx("sigil_arm");
}
const stPre=()=>!!(player.st&&player.st.act&&player.st.act.inv);
/* 매 프레임 */
function updateStella(dt){
 if(runSt.duel)updateStellaBoss(dt);
 if(!isSt()||!player.st)return;
 const s=player.st;if(!s.picked)return;
 const has=stAim();if(has||mouse.used)player.face=Math.cos(s.aim)>=0?1:-1;
 s.cd-=dt;s.eCD=Math.max(0,s.eCD-dt);s.fCD=Math.max(0,s.fCD-dt);
 // 별의 장막: 피해를 받지 않은 채 일정 시간이 지나면 재생
 s.calm+=dt;const mx=stShieldMax();if(s.calm>2.5-.5*stu("stregen")&&player.sh<mx)player.sh=Math.min(mx,player.sh+mx*.18*(1+.3*stu("stregen"))*dt);
 // 별빛 탄 (누르고 있으면 연사 · 모바일/마우스 미사용 시 자동)
 const want=mouse.used&&!TOUCH?mouse.down:has;
 if(want&&s.cd<=0&&!s.act){s.cd=stInt();stBolt()}
 // 루트 마법 (자동)
 s.spT-=dt;if(s.spT<=0&&(has||enemies.length)){s.spT=stPer();stCastRoute()}
 if(stu("stsec")&&s.route==="cosmos"){s.sp2T-=dt;if(s.sp2T<=0){s.sp2T=3;stCastSec()}}
 // 보조 마법(원소 폭풍): 주위를 도는 원소 구슬 4개
 if(stu("stsec")&&s.route==="elem"){s.sp2T-=dt;if(s.sp2T<=0){s.sp2T=.3;const lv=stu("stsec"),pw=curW;curW="st_storm";
  for(let i=0;i<4;i++){const a=elapsed*2.4+i*1.5708,x=player.x+Math.cos(a)*110,y=player.y+Math.sin(a)*110;areaHit(x,y,34*stArea(),stBase()*(.5+.15*lv),ELC[ELS[i]],ELS[i],stBase())}curW=pw}}
 // 궁극마법 진행
 if(s.act){const A=s.act;A.t-=dt;
  if(A.k==="bigbang"&&A.t<=0){const pw=curW;curW="ul_bigbang";for(const e of enemies){if(e.hp<=0||e.phased||!onScr(e.x,e.y,60))continue;const L=dist(e,player)||1;hitE(e,stBase()*40,"#ffe8c0","boom",(e.x-player.x)/L,(e.y-player.y)/L);if(e.type!=="boss")push(e,(e.x-player.x)/L,(e.y-player.y)/L,700)}curW=pw;
   vfx({type:"ring",x:player.x,y:player.y,r0:20,r1:900,life:.7,max:.7,c:"rgba(255,240,200,.95)",w:20});vfx({type:"light",x:player.x,y:player.y,r:1200,life:.6,max:.6,c:"#fff0c0"});SWFXflash("#fff4d8");shake=Math.max(shake,20);stopHit(.1);sfx("bomb")}
  else if(A.k==="starfall"){A.tk-=dt;const on=enemies.filter(e=>e.hp>0&&!e.phased&&onScr(e.x,e.y,0));while(A.tk<=0&&A.f<A.n){A.tk+=3/A.n;A.f++;const e=on.length?on[Math.floor(Math.random()*on.length)]:null;const pw=curW;curW="ul_starfall";
    addX({t:"met",x:e?e.x+rand(-16,16):player.x+rand(-400,400),y:e?e.y+rand(-16,16):player.y+rand(-250,250),delay:.55,d0:.55,dm:stBase()*7,aoe:90*stArea(),star:1});curW=pw}}
  else if(A.k==="prism"){A.tk-=dt;if(A.tk<=0&&A.w<4){A.tk=.25;const el=ELS[A.w++],pw=curW;curW="ul_prism";for(const e of enemies){if(e.hp<=0||e.phased||!onScr(e.x,e.y,40))continue;hitE(e,stBase()*9,ELC[el],ELK[el],0,0);applyStatus(e,el,stBase()*9)}curW=pw;
    vfx({type:"ring",x:player.x,y:player.y,r0:20,r1:800,life:.5,max:.5,c:ELC[el],w:14});sfx("rx_overload")}}
  if(A.t<=0)s.act=null;
 }
}
/* 스텔라 마법 오브젝트 (구슬 · 중력 붕괴 · 블랙홀 · 뇌운 · 절대영도) */
function updateStelObjs(dt){
 for(let i=STO.length-1;i>=0;i--){const o=STO[i];
  if(o.t==="orb"){o.d-=dt;if(o.d<=0){const pw=curW;curW="st_orb";areaHit(o.x,o.y,o.R,o.dm,ELC[o.el],o.el,o.dm);curW=pw;
    if(impBudget>0){impBudget--;vfx({type:"ring",x:o.x,y:o.y,r0:6,r1:o.R,life:.28,max:.28,c:ELC[o.el],w:4})}STO.splice(i,1)}continue}
  if(o.t==="sing"){o.life-=dt;for(const e of query(o.x,o.y,o.R*1.6,QD)){if(e.hp<=0||e.phased)continue;const dx=o.x-e.x,dy=o.y-e.y,L=Math.hypot(dx,dy)||1;if(L>o.R*1.6)continue;const f=Math.min(L,(e.type==="boss"?40:e.elite?110:260)*(1+stu("stgrav")*.25)*dt);e.x+=dx/L*f;e.y+=dy/L*f}
   if(o.life<=0){const pw=curW;curW="st_sing";for(const e of query(o.x,o.y,o.R,QD)){if(e.hp<=0||e.phased||d2(e,o)>(o.R+e.r)**2)continue;hitE(e,o.dm,"#c8a8ff","orb",0,0);e.markT=Math.max(e.markT,4)}curW=pw;
    vfx({type:"ring",x:o.x,y:o.y,r0:o.R,r1:8,life:.25,max:.25,c:"rgba(200,170,255,.95)",w:6});vfx({type:"ring",x:o.x,y:o.y,r0:8,r1:o.R*1.1,life:.35,max:.35,c:"rgba(255,240,255,.9)",w:4});shake=Math.max(shake,4);sfx("boom");STO.splice(i,1)}continue}
  if(o.t==="bh"){o.life-=dt;o.tk-=dt;for(const e of query(o.x,o.y,o.R,QD)){if(e.hp<=0||e.phased)continue;const dx=o.x-e.x,dy=o.y-e.y,L=Math.hypot(dx,dy)||1;if(L>o.R)continue;const f=Math.min(L,(e.type==="boss"?60:420)*dt);e.x+=dx/L*f;e.y+=dy/L*f}
   if(o.tk<=0){o.tk=.25;const pw=curW;curW="ul_blackhole";for(const e of query(o.x,o.y,200,QD))if(e.hp>0&&!e.phased&&d2(e,o)<40000)dmgTo(e,o.dm*3);curW=pw}
   if(o.life<=0){const pw=curW;curW="ul_blackhole";areaHit(o.x,o.y,260*stArea(),o.dm*30,"#e8d8ff");curW=pw;vfx({type:"ring",x:o.x,y:o.y,r0:10,r1:300,life:.5,max:.5,c:"rgba(230,210,255,.95)",w:12});shake=Math.max(shake,14);sfx("bomb");STO.splice(i,1)}continue}
  if(o.t==="storm"){o.life-=dt;if(mouse.used&&!TOUCH){o.x+=(mWX()-o.x)*Math.min(1,dt*3);o.y+=(mWY()-o.y)*Math.min(1,dt*3)}else{const n=nearest(600);if(n){o.x+=(n.x-o.x)*Math.min(1,dt*2);o.y+=(n.y-o.y)*Math.min(1,dt*2)}}
   o.tk-=dt;while(o.tk<=0){o.tk+=.1;const c=query(o.x,o.y,220,QD).filter(e=>e.hp>0&&!e.phased&&d2(e,o)<48400);if(c.length){const e=c[Math.floor(Math.random()*c.length)],pw=curW;curW="ul_storm";hitE(e,o.dm,"#ffe14a","bolt",0,1);curW=pw;effects.push({type:"bolt",x:e.x,y:e.y,life:.12,max:.12})}}
   if(o.life<=0)STO.splice(i,1);continue}
  if(o.t==="zero"){o.life-=dt;if(o.life<=0){const pw=curW;curW="ul_zero";for(const e of o.list)if(e.hp>0&&!e.phased){hitE(e,o.dm,"#dff8ff","crystal",0,0);if(impBudget>0){impBudget--;burst(e.x,e.y,4,"#dff8ff")}}curW=pw;shake=Math.max(shake,10);sfx("freeze");STO.splice(i,1)}continue}
  if(o.t==="flash"){o.life-=dt;if(o.life<=0)STO.splice(i,1)}
 }
}
function drawStelFx(){
 const s=player.st;
 for(const o of STO){
  if(o.t==="orb"){const p=1-o.d/o.d0,x=o.sx+(o.x-o.sx)*p,y=o.sy+(o.y-o.sy)*p-Math.sin(p*Math.PI)*70;ctx.globalCompositeOperation="lighter";ctx.drawImage(glowSpr(ELC[o.el]),x-12,y-12,24,24);ctx.globalCompositeOperation="source-over";
   ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();ctx.strokeStyle=ELC[o.el];ctx.globalAlpha=.5;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(o.x,o.y,o.R*p,0,7);ctx.stroke();ctx.globalAlpha=1}
  else if(o.t==="sing"||o.t==="bh"){const k=o.t==="bh",R=k?150:o.R*.7*(1-o.life/o.max*.4);ctx.save();
   const g=ctx.createRadialGradient(o.x,o.y,2,o.x,o.y,R);g.addColorStop(0,"rgba(0,0,0,.95)");g.addColorStop(.35,"rgba(70,30,140,.7)");g.addColorStop(1,"rgba(140,90,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,R,0,7);ctx.fill();
   ctx.strokeStyle="rgba(210,180,255,.75)";ctx.lineWidth=2;for(let j=0;j<4;j++){ctx.beginPath();for(let u=0;u<=1.001;u+=.08){const q=-elapsed*4+j*1.57+u*5,rr=R*u;ctx[u===0?"moveTo":"lineTo"](o.x+Math.cos(q)*rr,o.y+Math.sin(q)*rr)}ctx.stroke()}
   if(k){ctx.globalAlpha=.25;ctx.strokeStyle="#c8a8ff";ctx.setLineDash([8,10]);ctx.beginPath();ctx.arc(o.x,o.y,o.R,0,7);ctx.stroke();ctx.setLineDash([])}ctx.restore()}
  else if(o.t==="storm"){ctx.save();ctx.globalAlpha=.7;ctx.fillStyle="#3a3a52";for(let j=0;j<5;j++){ctx.beginPath();ctx.arc(o.x-40+j*20,o.y-90+Math.sin(elapsed*3+j)*4,20+(j%2)*6,0,7);ctx.fill()}
   ctx.globalAlpha=.25;ctx.strokeStyle="#ffe14a";ctx.setLineDash([6,8]);ctx.beginPath();ctx.arc(o.x,o.y,220,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore()}
  else if(o.t==="flash"){ctx.save();ctx.setTransform(D,0,0,D,0,0);ctx.globalAlpha=o.life/o.max*.5;ctx.fillStyle=o.c;ctx.fillRect(0,0,W,H);ctx.restore()}
 }
 if(s&&s.act&&s.act.k==="bigbang"){const p=1-s.act.t;ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=.4+.5*p;ctx.drawImage(glowSpr("rgba(255,240,200,.95)"),player.x-60-p*80,player.y-60-p*80,120+p*160,120+p*160);ctx.restore()}
}
function drawStbolt(s){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(elapsed*8);ctx.globalCompositeOperation="lighter";ctx.drawImage(glowSpr(s.col||"#e8dcff"),-s.r*2,-s.r*2,s.r*4,s.r*4);
 ctx.globalCompositeOperation="source-over";starPath(0,0,s.r*.9,s.r*.4);ctx.fillStyle="#ffffff";ctx.fill();ctx.restore()}
function drawStarShot(s){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(elapsed*6);ctx.globalCompositeOperation="lighter";ctx.drawImage(glowSpr("rgba(190,120,255,.9)"),-s.r*2.4,-s.r*2.4,s.r*4.8,s.r*4.8);
 ctx.globalCompositeOperation="source-over";starPath(0,0,s.r,s.r*.45);ctx.fillStyle="#f4e8ff";ctx.fill();ctx.strokeStyle="#8a4adf";ctx.lineWidth=1.2;ctx.stroke();ctx.restore()}
/* 실드 그리기 (별빛 장막) */
function drawStShield(){if(!(player.sh>0))return;const k=Math.min(1,player.sh/stShieldMax());ctx.save();ctx.globalAlpha=.18+.3*k;ctx.strokeStyle="#c8b8ff";ctx.lineWidth=2;ctx.fillStyle="rgba(170,150,255,.08)";
 ctx.beginPath();ctx.arc(player.x,player.y-4,28+Math.sin(elapsed*3)*1.5,0,7);ctx.fill();ctx.stroke();
 for(let i=0;i<5;i++){const a=elapsed*.8+i*1.2566;starPath(player.x+Math.cos(a)*28,player.y-4+Math.sin(a)*28,3,1.3);ctx.fillStyle="#ffe58a";ctx.fill()}ctx.restore()}
/* 레벨업 선택지 */
function stUpgrade(k){player.st.u[k]=(player.st.u[k]||0)+1;if(k==="stshield")player.sh=Math.min(stShieldMax(),player.sh+player.maxHp*.12);sfx("upgrade")}
function stChoiceData(){
 const pool=[],s=player.st;
 for(const k in ST_UP){const u=ST_UP[k],lv=stu(k);if(lv>=u.max||(u.ch2&&!ch2On())||(u.route&&u.route!==s.route))continue;
  const nm=k==="stsec"?(s.route==="elem"?"원소 폭풍":"유성 낙하"):u.n;
  pool.push({w:u.ch2?(lv?4:3.4):k==="stsec"&&!lv?3:lv?3.4:2.4,own:lv?1:0,icon:u.i,title:`${nm} ${lv?"Lv."+(lv+1):"NEW"}`,tag:u.ch2?"🌌 챕터 2 전용":k==="stsec"?"📖 보조 마법":"🪄 마법 강화",t:k==="stsec"?"combo":lv?"up":"new",desc:u.d,stat:`현재 Lv.${lv} → ${lv+1} (최대 ${u.max})`,fn:()=>stUpgrade(k)})}
 const pOpen=pSlots()<MAX_P;
 for(const k of ch2On()?GUN_PAS.concat(["reson","execu","thorns","area"]):GUN_PAS.concat(["area"])){const p=passives[k];if(!p||p.level>=p.max||!(p.level>0||pOpen))continue;
  pool.push({w:p.level?2.4:1.2,own:p.level?1:0,icon:p.icon,title:`${p.name} Lv.${p.level+1}`,tag:p.level?"패시브 강화":"새 패시브",t:"pas",desc:p.desc,stat:`현재 ${p.level} → ${p.level+1} (최대 ${p.max})`,fn:()=>passiveUpgrade(k)})}
 const pick=wpick(pool,choiceN());
 if(!pick.length)pick.push({icon:"❤️",title:"휴식",tag:"회복",t:"rest",desc:"모든 강화를 마쳤습니다. HP를 크게 회복합니다.",stat:"HP +50%",fn:()=>{player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.5)}});
 return pick;
}
/* 특전: Lv.10 → E 궁극마법 · Lv.20 → F 궁극마법 (내 루트 2 + 다른 루트 1) · 이후 공통 */
function stTalPool(){const s=player.st,ul=TAL.stella.filter(t=>t.k.startsWith("ul_")&&!T(t.k));
 if(!s.eUlt||!s.fUlt){const mine=ul.filter(t=>ST_ULT[t.k.slice(3)].r===s.route),other=ul.filter(t=>ST_ULT[t.k.slice(3)].r!==s.route);
  return wpick(mine.map(t=>({...t,w:1})),2).concat(wpick(other.map(t=>({...t,w:1})),1))}
 return ST_GEN.filter(t=>!T(t.k))}
function stTalApply(k){const s=player.st;
 if(k.startsWith("ul_")){const u=k.slice(3);if(!s.eUlt){s.eUlt=u;setTimeout(()=>toast(`${ST_ULT[u].i} 궁극마법 '${ST_ULT[u].n}' — E키로 발동`),900)}else if(!s.fUlt){s.fUlt=u;setTimeout(()=>toast(`${ST_ULT[u].i} 궁극마법 '${ST_ULT[u].n}' — F키로 발동`),900)}}
 if(k==="st_rev")player.revives++;if(k==="st_aegis")player.sh=stShieldMax();stbS=""}
function stIcons(cls){const s=player.st;let h=`<span class="${cls}" title="${s.route?ST_ROUTE[s.route].n:"루트 선택 전"}">${s.route?ST_ROUTE[s.route].i:"🪄"}</span>`;
 for(const k in ST_UP)if(s.u[k])h+=`<span class="${cls}" title="${ST_UP[k].n} Lv.${s.u[k]}">${ST_UP[k].i}<i>${s.u[k]}</i></span>`;
 for(const[u,key]of[[s.eUlt,"E"],[s.fUlt,"F"]])if(u)h+=`<span class="${cls} cb" title="${key}: ${ST_ULT[u].n}">${ST_ULT[u].i}</span>`;return h}
/* HUD 스킬 바 */
let stbS="";
function stBar(){
 const s=player.st;if(!s){SKB.style.display="none";return}
 const rc=player.dashCD>0?player.dashCD.toFixed(1)+"s":"OK",mx=stShieldMax();
 const btn=(u,cd,key)=>{const U=u?ST_ULT[u]:null,p=U&&cd>0?Math.min(1,cd/stUltCd(u)):0;
  return `<button class="skb wpn ult${U&&!cd?" ready":""}" data-stu="${key}"><span class="ic">${U?U.i:"🔒"}</span><i style="height:${(p*100).toFixed(0)}%"></i><b>${key}</b><small>${U?(cd>0?Math.ceil(cd)+"s":"OK"):key==="E"?"Lv10":"Lv20"}</small></button>`};
 let h=btn(s.eUlt,s.eCD,"E")+btn(s.fUlt,s.fCD,"F");
 h+=`<div class="ammo" style="color:${s.route?ST_ROUTE[s.route].c:"#ddd"}">${s.route?ST_ROUTE[s.route].i+" "+ST_ROUTE[s.route].n:"🪄"} · 🛡️${Math.ceil(player.sh)}/${Math.ceil(mx)} · 🌀${rc}</div>`;
 if(!TOUCH)h+=`<div class="hint">클릭 별빛 탄 · Space 텔레포트<br>E · F 궁극마법</div>`;
 if(h!==stbS){stbS=h;SKB.innerHTML=h;SKB.style.display="flex"}
}
SKB.addEventListener("pointerdown",e=>{if(!isSt()||!player.st)return;const b=e.target.closest("[data-stu]");if(!b)return;e.preventDefault();e.stopPropagation();stUlt(b.dataset.stu==="F"?1:0)});
