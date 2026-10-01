/* ═══════════════ enemies.js ═══════════════
   적 생성/종류 · 스폰 · AI/기믹 · 보스/엘리트 · 피해/넉백/사망 · 상태이상/원소 반응 · 스테이지 위험 요소 */
"use strict";
function nearest(range=99999){let best=null,bd=range*range;for(const e of enemies){if(e.hp<=0||e.phased)continue;const q=d2(player,e);if(q<bd){bd=q;best=e}}return best}
/* ── 적 ── */
function rollType(t,r){
 if(t>150&&r<.03)return"boss";
 if(t>70&&r<.10)return"elite";
 if(t>95&&r<.17)return"tank";
 if(t>45&&r<.235)return"charger";
 if(t>60&&r<.25)return"bomber";
 if(t>85&&r<.256){let n=0;for(const e of enemies)if(e.ai==="shooter")n++;return n<3?"shooter":"grunt"}
 if(t>25&&r<.38)return"runner";
 return"grunt";
}
const ELITE_CD=()=>Math.max(40,70-elapsed*.05),ELITE_CAP=()=>selSt>0?3:2,BOSS_CD=90,BOSS_CAP=1;
const SP_CAP={healer:4,magma:6,wraith:40,splitter:40,imp:40,mother:4,warden:8,stalker:14};
function countType(ty){let n=0;for(const e of enemies)if(e.type===ty&&!e.final&&e.hp>0)n++;return n}
function enemyType(){
 // 스테이지 특수 적
 for(const s of SPECIAL[selSt]||[])if(elapsed>=s[1]&&Math.random()<s[2]&&countType(s[0])<(SP_CAP[s[0]]||40))return s[0];
 const t=rollType(elapsed+[0,70,110,150,180,210][selSt],Math.random());
 if(t!=="elite"&&t!=="boss")return STG[selSt].ch===2?CH2MAP[t]||t:t;
 if(t==="boss"){if(elapsed>=nextBoss&&countType("boss")<BOSS_CAP){nextBoss=elapsed+BOSS_CD;return"boss"}}
 else if(elapsed>=nextElite&&countType("elite")<ELITE_CAP()){nextElite=elapsed+ELITE_CD();return"elite"}
 const fb=elapsed>95?"tank":"grunt";return STG[selSt].ch===2?CH2MAP[fb]:fb;  // 제한에 걸리면 상자를 안 주는 일반 몹으로 대체
}
function makeEnemy(type,x,y){
 const t=elapsed,S_=STG[selSt],s=EN[type],hp=(s.h[0]+t*s.h[1])*(1+t/420+(t/900)**2)*S_.hp;
 const e={x,y,type,r:s.r,color:STAGE_LOOK[selSt].enemy[type]||s.c,hp,maxHp:hp,sp:(s.s[0]+t*s.s[1])*(1+Math.min(.35,t/1500)),xp:Math.max(1,Math.round(s.x*(1+t/600))),dmgS:(1+t/650)*S_.dmg,
  shot:rand(2,4),hit:0,slowT:0,poisonT:0,poisonDps:0,kx:0,ky:0,stun:0,ph:rand(0,6.28),st:0,tm:rand(1.5,3),dx:0,dy:0,guarded:false,gt:rand(0,6),enr:false,sl:3.5,sm:9,blasted:false,
  elite:type==="elite"||type==="boss",cd:null,final:false,ai:s.ai||type,hv:!!s.hv,
  wardT:0,blinkT:0,bx:0,by:0,spawnT:rand(2,4),sp2:rand(3,5),
  // 특수 적 기믹 타이머
  phased:false,phT:rand(2,4),healT:rand(1,3),lavaT:1,fbT:rand(2,4),
  // 상태이상
  burnT:0,burnDps:0,chillN:0,chillT:0,frozenT:0,shockT:0,bleedN:0,bleedT:0,bleedB:0,markT:0,toxT:0,rxT:0,zapT:0,dotAcc:0,dotT:.5,
  stunT:0,curseT:0,curseAcc:0,curseK:.35};
 enemies.push(e);return e;
}
function spawnEnemy(){
 const a=Math.random()*Math.PI*2,d=Math.max(W,H)/ZM*.72+80,type=enemyType();
 makeEnemy(type,player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);
 if(type==="elite"){toast("⚠️ 엘리트 몬스터 등장!");stinger("elite")}
 if(type==="boss"){toast("👑 보스 출현!");stinger("boss");shake=Math.max(shake,10);vfx({type:"ring",x:player.x,y:player.y,r0:40,r1:520,life:.7,max:.7,c:"rgba(255,60,160,.8)",w:5})}
}
/* 피해 적용: 방어 자세 -70%, 약화 +25%, 빙결 +50% · 망령 위상 중에는 무효 · 저주 중에는 받은 피해 누적
   DMG[curW]: 출처별 누적 피해 (일시정지 메뉴 '무기별 데미지') */
function dmgTo(e,d,quiet){
 if(e.phased)return 0;
 if(e.guarded)d*=.3;if(e.wardT>0)d*=.5;if(e.markT>0)d*=1.25;if(e.frozenT>0)d*=isJob("cryo")?(T("c_dmg")?2.4:1.95):1.5;
 if(e.curseT>0)e.curseAcc+=d;
 const real=Math.min(d,Math.max(0,e.hp));DMG[curW]=(DMG[curW]||0)+real;
 e.hp-=d;if(!quiet)e.hit=.09;return d;
}
/* 직접 타격: 치명타(빙결이면 항상) + 데미지 숫자 + 타격 이펙트/소리 + 상태이상 부여 + 감전 전이 */
function hitE(e,dm,col,kind,ax,ay){
 if(e.phased)return 0;
 const ex=passives.execu.level;
 if(ex&&!e.elite&&e.hp>0&&e.hp<e.maxHp*(.1+.02*ex)){DMG.execu=(DMG.execu||0)+e.hp;e.hp=0;if(impBudget>0){impBudget--;vfx({type:"slash",x:e.x,y:e.y,a:Math.random()*3.14,life:.2,max:.2})}return 0}   // 처형인의 인장
 const frozen=e.frozenT>0,crit=frozen||Math.random()<critC();
 const d=dmgTo(e,crit?dm*critM():dm);
 dnum(e,d,crit?(frozen?"#dff8ff":"#ffe14a"):col,crit);
 impact(e.x,e.y,kind,ax,ay);
 if(crit){shake=Math.max(shake,2.2);critSfx();if(impBudget>0)vfx({type:"ring",x:e.x,y:e.y,r0:6,r1:e.r+18,life:.16,max:.16,c:frozen?"rgba(220,250,255,.95)":"rgba(255,225,80,.95)",w:3})}
 else hitSfx();
 if(e.elite&&crit)stopHit(.025);
 const st=ELEM[kind];if(st)applyStatus(e,st,dm);
 if(e.shockT>0&&e.zapT<=0)zap(e,dm);
 return d;
}
/* ── 상태이상 ── */
const stunRes=e=>e.type==="boss"?.25:(e.elite||e.hv)?.5:1;
function applyStatus(e,st,dm){
 const pot=statusPot();
 switch(st){
  case"burn":e.burnT=3*pot;e.burnDps=Math.max(e.burnDps,dm*.3*pot*(isJob("pyro")?(T("p_burn")?1.8:1.3):1));break;
  case"chill":e.chillT=2.5*pot;if(e.frozenT<=0&&++e.chillN>=5)freeze(e,1.2*pot);break;
  case"shock":e.shockT=3*pot;break;
  case"poison":e.poisonT=Math.max(e.poisonT,4*pot);e.poisonDps=Math.max(e.poisonDps,dm*.35*pot*(T("pl_dps")?1.6:1));break;
  case"bleed":e.bleedT=4*pot;e.bleedN=Math.min(6,e.bleedN+1);e.bleedB=Math.max(e.bleedB,dm*.06*pot);break;
  case"mark":e.markT=4*pot;break;
  case"stun":e.stunT=Math.max(e.stunT,.7*pot*stunRes(e));break;
  case"curse":if(e.curseT<=0)e.curseAcc=0;e.curseT=5;e.curseK=Math.max(e.curseK,weapons.doom&&weapons.doom.level>0?.5:.35);break;
 }
 // 원소술사 특전 '삼원소': 다른 원소 하나 추가 (재귀 방지)
 if(T("m_tri")&&!runSt.triL&&(st==="burn"||st==="chill"||st==="shock"||st==="poison")&&Math.random()<.3){runSt.triL=1;const o=["burn","chill","shock","poison"].filter(x=>x!==st);applyStatus(e,o[Math.floor(Math.random()*3)],dm*.6);runSt.triL=0}
 react(e,st,dm);
}
function freeze(e,t){
 t*=e.type==="boss"?.25:(e.elite||e.hv)?.5:1;
 if(T("c_fz"))t*=1.6;
 e.frozenT=Math.max(e.frozenT,t);e.chillN=0;e.chillT=0;
 if(impBudget>0){impBudget--;for(let i=0;i<5;i++){const a=Math.random()*6.283;spawnP(e.x,e.y,Math.cos(a)*rand(60,160),Math.sin(a)*rand(60,160),rand(.2,.4),rand(1.4,2.4),i&1?"#dff8ff":"#9fe8ff",1,6,0)}}
 sfx("freeze");
}
/* 감전 전이: 가장 가까운 다른 적에게 전류 */
function zap(e,dm){
 e.zapT=.3;
 let best=null,bd=150*150;
 for(const q of query(e.x,e.y,150,QD)){if(q===e||q.hp<=0||q.phased)continue;const dd=d2(e,q);if(dd<bd){bd=dd;best=q}}
 if(!best)return;
 const pw=curW;curW="st_shock";const d=dmgTo(best,dm*.35*statusPot());curW=pw;dnum(best,d,"#ffe14a",false);
 vfx({type:"zap",x:e.x,y:e.y,x2:best.x,y2:best.y,life:.14,max:.14});
 sfx("zap");
}
function spreadPoison(e,n,R){
 const list=query(e.x,e.y,R,QD);let c=0;
 for(const q of list){
  if(c>=n)break;if(q===e||q.hp<=0||d2(q,e)>R*R)continue;
  q.poisonT=Math.max(q.poisonT,4*statusPot());q.poisonDps=Math.max(q.poisonDps,e.poisonDps*.8,1);c++;
  vfx({type:"zap",x:e.x,y:e.y,x2:q.x,y2:q.y,life:.25,max:.25,c:"rgba(150,240,90,.8)"});
 }
}
/* 저주 폭발: 저주 중 쌓인 피해의 일부를 한 번 더 */
function curseBurst(e){
 const d=e.curseAcc*e.curseK*statusPot();e.curseAcc=0;e.curseT=0;
 if(d<1||e.hp<=0)return;
 const pw=curW;curW="st_curse";dmgTo(e,d);curW=pw;dnum(e,d,"#d890ff",d>200);
 vfx({type:"ring",x:e.x,y:e.y,r0:4,r1:e.r*2.6,life:.3,max:.3,c:"rgba(200,110,255,.95)",w:4});
 if(impBudget>0){impBudget--;for(let i=0;i<6;i++){const a=Math.random()*6.283;spawnP(e.x,e.y,Math.cos(a)*rand(60,180),Math.sin(a)*rand(60,180),rand(.25,.45),rand(1.5,2.5),i&1?"#c46aff":"#f0d8ff",1,5,0)}}
 sfx("curse");
}
/* 주변 범위 피해 (반응/직업 폭발 공용, 상태이상 부여 선택) */
function areaHit(x,y,R,dmg,col,st,stDm){
 for(const q of query(x,y,R,QD)){
  if(q.hp<=0)continue;const rr=R+q.r;if(d2(q,{x,y})>=rr*rr)continue;
  const d=dmgTo(q,dmg);dnum(q,d,col,false);if(st)applyStatusQuiet(q,st,stDm||dmg);
 }
}
/* 반응을 다시 일으키지 않는 상태이상 부여 (연쇄 폭주 방지) */
function applyStatusQuiet(e,st,dm){const b=rxBudget;rxBudget=0;applyStatus(e,st,dm);rxBudget=b}
/* ── 원소 반응 ── */
const rxLabelT={};
function react(e,st,dm){
 if(e.rxT>0||rxBudget<=0||e.hp<=0)return;
 const burn=e.burnT>0,chill=e.chillN>0||e.frozenT>0,shock=e.shockT>0,pois=e.poisonT>0,bleed=e.bleedN>0,mark=e.markT>0,stun=e.stunT>0,curse=e.curseT>0;
 let k=null;
 if(burn&&chill)k="steam";
 else if(burn&&shock)k="overload";
 else if(chill&&shock)k="superc";
 else if(shock&&stun)k="concuss";
 else if(burn&&stun)k="magma";
 else if(bleed&&stun)k="rupture";
 else if(curse&&pois)k="decay";
 else if(curse&&mark&&e.curseAcc>0)k="judgment";
 else if(pois&&burn&&e.toxT<=0)k="toxic";
 else if(bleed&&mark&&!e.elite&&e.hp<e.maxHp*.2)k="execute";
 else if(pois&&bleed&&st==="bleed")k="plagueburst";
 if(!k)return;
 rxBudget--;e.rxT=rxCd();runRx[k]=(runRx[k]||0)+1;discover("r",k);
 const R=REACT[k],base=dm*rxMul(),pw=curW;curW="rx_"+k;
 switch(k){
  case"steam":
   e.burnT=0;e.burnDps=0;e.chillN=0;e.chillT=0;e.frozenT=0;
   rxBlast(e.x,e.y,90,base*1.8,"#e6f3ff",0);
   for(let i=0;i<8;i++)spawnP(e.x+rand(-20,20),e.y+rand(-12,12),rand(-30,30),rand(-70,-30),rand(.6,1),rand(6,11),"rgba(235,245,255,.35)",2,2,0);
   break;
  case"overload":
   e.shockT=0;rxBlast(e.x,e.y,100,base*1.4,"#ffb040",560);addDecal("scorch",e.x,e.y,40);break;
  case"superc":
   e.shockT=0;freeze(e,1.5*statusPot());e.markT=4;dmgTo(e,base*.8);
   vfx({type:"ring",x:e.x,y:e.y,r0:6,r1:e.r*3,life:.3,max:.3,c:"rgba(170,230,255,.95)",w:4});addDecal("frost",e.x,e.y,34);break;
  case"concuss":{ // 전류가 주변 4명에게 튀고, 기절 2배
   e.shockT=0;e.stunT=Math.min(2.4,e.stunT*2+.2);dmgTo(e,base*.6);let c=0;
   for(const q of query(e.x,e.y,170,QD)){if(c>=4)break;if(q===e||q.hp<=0||q.phased||d2(q,e)>28900)continue;c++;
    const d=dmgTo(q,base*.9);dnum(q,d,"#fff27a",false);q.stunT=Math.max(q.stunT,.6*stunRes(q));vfx({type:"zap",x:e.x,y:e.y,x2:q.x,y2:q.y,life:.22,max:.22,c:"#fff6a0"})}
   vfx({type:"ring",x:e.x,y:e.y,r0:6,r1:70,life:.25,max:.25,c:"rgba(255,242,122,.95)",w:4});vfx({type:"light",x:e.x,y:e.y,r:180,life:.25,max:.25,c:"#fff27a"});
   break}
  case"magma": // 발밑에서 용암 분출 → 불타는 장판
   rxBlast(e.x,e.y,70,base*.9,"#ff6a2a",220);
   effects.push({type:"cloud",st:"burn",fire:true,x:e.x,y:e.y,life:2.5,max:2.5,radius:55*areaMul(),dps:base*.28,tk:0,dm:base*.3,w:"rx_magma"});
   addDecal("scorch",e.x,e.y,44);break;
  case"rupture": // 출혈 즉시 6중첩 + 3초치 출혈 피해
   e.bleedN=6;e.bleedT=4*statusPot();{const d=dmgTo(e,e.bleedB*6*3+base*.5);dnum(e,d,"#ff2a4a",true)}
   vfx({type:"slash",x:e.x,y:e.y,a:Math.random()*3.14,life:.25,max:.25});vfx({type:"slash",x:e.x,y:e.y,a:Math.random()*3.14,life:.25,max:.25});
   addDecal("splat",e.x,e.y,22,"#b0102a");break;
  case"decay": // 저주 즉시 폭발 + 독 확산
   if(e.curseAcc>0)curseBurst(e);e.curseT=0;spreadPoison(e,5,170);
   vfx({type:"ring",x:e.x,y:e.y,r0:8,r1:90,life:.35,max:.35,c:"rgba(168,224,106,.9)",w:4});addDecal("poison",e.x,e.y,40);break;
  case"judgment":{ // 쌓인 저주 피해의 2배가 즉시
   const d=dmgTo(e,Math.max(e.curseAcc*2,base));e.curseAcc=0;dnum(e,d,"#ffe58a",true);
   vfx({type:"core",x:e.x,y:e.y,r:e.r*2.4,life:.25,max:.25,c:"#fff4c8"});vfx({type:"judg",x:e.x,y:e.y,life:.45,max:.45});
   vfx({type:"light",x:e.x,y:e.y,r:220,life:.35,max:.35,c:"#ffe58a"});shake=Math.max(shake,4);break}
  case"toxic":
   e.toxT=3;spreadPoison(e,4,150);vfx({type:"ring",x:e.x,y:e.y,r0:8,r1:80,life:.35,max:.35,c:"rgba(180,255,90,.85)",w:4});addDecal("poison",e.x,e.y,36);break;
  case"execute":
   DMG[curW]=(DMG[curW]||0)+Math.max(0,e.hp);e.hp=0;vfx({type:"slash",x:e.x,y:e.y,a:Math.random()*3.14,life:.25,max:.25});addDecal("splat",e.x,e.y,26,"#b0102a");shake=Math.max(shake,3);break;
  case"plagueburst":
   e.bleedN=Math.min(6,e.bleedN+1);vfx({type:"ring",x:e.x,y:e.y,r0:4,r1:e.r*2.2,life:.25,max:.25,c:"rgba(196,106,255,.9)",w:3});break;
 }
 const rs=passives.reson.level;   // 공명의 수정: 가까운 적 2명에게 반응 피해 연쇄
 if(rs){curW="reson";let c=0;for(const q of query(e.x,e.y,180,QD)){if(c>=2)break;if(q===e||q.hp<=0||q.phased)continue;c++;const d=dmgTo(q,base*(.12*rs+.2));dnum(q,d,R.c,false);vfx({type:"zap",x:e.x,y:e.y,x2:q.x,y2:q.y,life:.2,max:.2,c:R.c})}}
 curW=pw;
 // 원소술사: 반응이 일어나면 모든 무기의 재사용 대기시간 감소
 if(isJob("mage")&&elapsed>runSt.mageT){runSt.mageT=elapsed+.25;const cd=T("m_rx")?.16:.08;for(const kk in weapons)if(weapons[kk].level>0)weapons[kk].cool-=cd}
 if(T("m_nova")&&burstB>0&&Math.random()<.2){burstB--;const pw2=curW;curW="trait";const RR=90*areaMul();areaHit(e.x,e.y,RR,(30+level*5)*dmgMul()*rxMul(),R.c);curW=pw2;
  vfx({type:"ring",x:e.x,y:e.y,r0:8,r1:RR,life:.3,max:.3,c:R.c,w:5})}
 sfx("rx_"+k);
 if(!(rxLabelT[k]>elapsed)){rxLabelT[k]=elapsed+.35;vfx({type:"txt",x:e.x,y:e.y-e.r-18,t:R.i+" "+R.n,life:.7,max:.7,c:R.c,sz:15})}
}
/* 반응 폭발: 주변 적에게 피해(+넉백). 상태이상을 다시 부여하지 않으므로 연쇄 폭주가 없음 */
function rxBlast(x,y,R,dmg,col,kb){
 R*=areaMul();
 for(const q of query(x,y,R,QD)){
  if(q.hp<=0)continue;const dd=dist(q,{x,y});if(dd>=R+q.r)continue;
  const d=dmgTo(q,dmg);dnum(q,d,col,false);
  if(kb){const L=dd||1;push(q,(q.x-x)/L,(q.y-y)/L,kb)}
 }
 vfx({type:"core",x,y,r:R*.55,life:.18,max:.18,c:col});
 vfx({type:"ring",x,y,r0:R*.3,r1:R,life:.32,max:.32,c:col,w:5});
 vfx({type:"light",x,y,r:R*2.4,life:.3,max:.3,c:col});
 for(let i=0;i<10;i++){const a=Math.random()*6.283,sp=rand(160,360);spawnP(x,y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.2,.4),rand(1.5,2.8),i&1?col:"#ffffff",1,6,0)}
 shake=Math.max(shake,4);kickR(2);
}
/* 넉백: 단단한 적일수록 덜 밀림, 밀리는 동안 잠깐 기절. 강한 넉백은 흙먼지 */
function push(e,ux,uy,force){
 const res=e.type==="boss"?.15:(e.elite||e.hv)?.5:1;
 e.kx+=ux*force*res;e.ky+=uy*force*res;e.stun=Math.max(e.stun,.12+.22*res);
 if(force*res>=400&&impBudget>0){impBudget--;for(let i=0;i<2;i++)spawnP(e.x+rand(-4,4),e.y+e.r*.7,-ux*rand(20,60)+rand(-20,20),-uy*rand(20,60)-10,.35,rand(2,3.5),"rgba(215,205,185,.6)",2,4,0)}
}
function enemyBlast(e){
 if(e.blasted)return;e.blasted=true;
 vfx({type:"eboom",x:e.x,y:e.y,r:72,life:.35,max:.35});vfx({type:"light",x:e.x,y:e.y,r:200,life:.3,max:.3,c:"#ff6a3a"});addDecal("scorch",e.x,e.y,46);
 for(let i=0;i<10;i++){const a=Math.random()*6.283,sp=rand(120,300);spawnP(e.x,e.y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.2,.45),rand(1.5,3),i&1?"#ff7a4a":"#ffd08a",1,6,0)}
 shake=Math.max(shake,5);sfx("boom");
 if(dist(player,e)<72+player.r)hurt(22*e.dmgS);
}
/* 용암 자국 (적 → 플레이어에게만 피해) */
let lavaN=0;
function addLava(x,y,r,life,dmg){if(lavaN>=40)return;lavaN++;effects.push({type:"lava",x,y,r,life,max:life,dmg})}
function kill(e,quiet){
 kills++;
 if(e.final){pendingWin=1.6;chestQueue.length=0;if(e.stella){runSt.stellaDown=true;STB.length=0;for(let i=shots.length-1;i>=0;i--)if(shots[i].enemy)shots.splice(i,1)}}             // 먼저 표시해 두어야 아래 경험치로 레벨업 창이 뜨지 않음
 if(e.type==="boss"){runSt.boss++;e.hp=Math.min(e.hp,0);updateUI()}   // 체력바 즉시 갱신 (레벨업 창이 바로 떠도 남지 않게)
 if(!quiet)addRage();
 if(!quiet)gainXP(e.xp);
 addGem(e.x,e.y,EN[e.type].g,e.xp);
 deathFx(e,quiet);
 if(!quiet){
  // 중독 사망 → 주변으로 독 전파 (역병 의사: +3명, 35% 독 폭발)
  if(e.poisonT>0){
   const plague=isJob("plague");spreadPoison(e,plague?(T("pl_sp")?12:6):3,plague?(T("pl_sp")?224:160):130);
   if(plague&&burstB>0&&Math.random()<(T("pl_ex")?.7:.35)){burstB--;const pw=curW;curW="trait";areaHit(e.x,e.y,75*areaMul(),Math.max(8,e.poisonDps*2.5),"#9fff6a","poison",e.poisonDps*2);curW=pw;
    vfx({type:"ring",x:e.x,y:e.y,r0:8,r1:75*areaMul(),life:.3,max:.3,c:"rgba(150,255,90,.9)",w:4});addDecal("poison",e.x,e.y,34);sfx("poison")}
  }
  // 저주받은 채 사망 → 영혼 폭발
  if(e.curseT>0&&burstB>0){burstB--;const pw=curW;curW="st_curse";areaHit(e.x,e.y,85*areaMul(),Math.max(10,e.maxHp*.08*statusPot()),"#d890ff");curW=pw;
   vfx({type:"ring",x:e.x,y:e.y,r0:6,r1:85*areaMul(),life:.35,max:.35,c:"rgba(196,106,255,.9)",w:5});vfx({type:"light",x:e.x,y:e.y,r:170,life:.3,max:.3,c:"#c46aff"})}
  // 회복: 흡혈귀 / 흡혈의 이빨 / 불사조
  // 스텔라 '상태 전염': 걸려 있던 상태이상을 주변 적에게 옮김
  if(player.st&&player.st.u.stspread&&burstB>0){const sts=[];if(e.burnT>0)sts.push("burn");if(e.chillN>0||e.frozenT>0)sts.push("chill");if(e.shockT>0)sts.push("shock");if(e.poisonT>0)sts.push("poison");
   if(sts.length){burstB--;let c=0;const n=1+player.st.u.stspread,dm=Math.max(10,stBase());for(const q of query(e.x,e.y,150,QD)){if(c>=n)break;if(q===e||q.hp<=0||q.phased)continue;c++;for(const st of sts)applyStatusQuiet(q,st,dm);if(impBudget>0){impBudget--;vfx({type:"zap",x:e.x,y:e.y,x2:q.x,y2:q.y,life:.15,max:.15,c:"#9fff6a"})}}}}
  // 화염술사 '연소 폭발' / 빙결 마녀 '얼음 파편'
  if(T("p_expl")&&e.burnT>0&&burstB>0&&Math.random()<.35){burstB--;const pw=curW;curW="trait";const RR=85*areaMul();areaHit(e.x,e.y,RR,Math.max(10,e.burnDps*3),"#ff9a4a","burn",Math.max(10,e.burnDps*3));curW=pw;
   vfx({type:"ring",x:e.x,y:e.y,r0:8,r1:RR,life:.3,max:.3,c:"rgba(255,140,60,.95)",w:5})}
  if(T("c_sh")&&e.frozenT>0&&burstB>0){burstB--;const pw=curW;curW="trait";const RR=90*areaMul();areaHit(e.x,e.y,RR,(30+level*5)*dmgMul(),"#dff8ff","chill",(30+level*5));curW=pw;
   vfx({type:"ring",x:e.x,y:e.y,r0:8,r1:RR,life:.3,max:.3,c:"rgba(190,240,255,.95)",w:5})}
  let h=0;if(isJob("vamp"))h+=T("v_heal")?2:1;if((selCh==="gunslinger"||selCh==="swordsman"||selCh==="stella")&&ch2On())h+=.3;   // 총잡이 현상금 (챕터 2): 처치 시 HP +0.3
  h+=passives.fang.level*.4;if(e.burnT>0&&weapons.phoenix&&weapons.phoenix.level>0)h+=.6;
  if(h>0&&player.hp<player.maxHp)heal(h,true);
 }
 if(e.ai==="bomber")enemyBlast(e);
 if(e.type==="spore"&&!quiet)effects.push({type:"spore",x:e.x,y:e.y,r:46,life:3,max:3});      // 포자 구름: 플레이어 둔화
 if(e.type==="splitter"&&!quiet&&enemies.length<450){for(const s of[-1,1]){const m=makeEnemy("mini",e.x+s*12,e.y+rand(-6,6));m.kx=s*160}}
 if(e.type==="magma"&&!quiet)addLava(e.x,e.y,62,6,14*e.dmgS);
 if(e.elite&&!e.final)drops.push({x:e.x,y:e.y,type:"chest",r:14});
 else if(!quiet&&!e.elite){
  const r=Math.random(),m=dropMul()*(T("g_jack")?2:1);
  if(r<.035*m)drops.push({x:e.x,y:e.y,type:"heal",r:9});
  else if(r<.06*m)drops.push({x:e.x,y:e.y,type:"magnet",r:9});
  else if(r<(.06+BOMB_P)*m)drops.push({x:e.x,y:e.y,type:"bomb",r:12});
  else if(r<(.06+BOMB_P+CHEST_P)*m)drops.push({x:e.x,y:e.y,type:"chest",r:14});
 }
 if(!quiet){
  if(S.dmgNum==="all")addNum(e.x,e.y-12,"+"+Math.round(e.xp*xpMul()),"#9ff",false);
  sfx(e.elite?"bigkill":"kill");
 }
 if(e.final){ // 최종 보스: 슬로모션 연출 후 클리어
  pendingWin=1.6;slowT=1.2;timeScale=.2;bombFlash=.8;shake=20;
  for(let i=0;i<3;i++)vfx({type:"ring",x:e.x,y:e.y,r0:20+i*30,r1:500+i*200,life:.8+i*.2,max:.8+i*.2,c:"rgba(255,220,140,.9)",w:8-i*2});
 }
}
/* 10분: 최종 보스 (스테이지 모드) · 무한 모드는 한계 돌파 알림 + 3분마다 보스 러시 */
function updateFinalBoss(){
 if(mode===1){
  if(elapsed>=600&&!infAnnounced){infAnnounced=true;toast("∞ 한계 돌파! 적이 끝없이 강해집니다");stinger("boss");shake=Math.max(shake,10)}
  if(elapsed>=nextRush){nextRush=elapsed+180;bossRush()}
  return;
 }
 if(elapsed>=600&&!finalSpawned&&selSt===5){finalSpawned=true;spawnStella();return}   // 별의 심연: 최종 보스 스텔라 (1:1)
 if(elapsed>=600&&!finalSpawned){
  finalSpawned=true;const b=makeEnemy("boss",player.x+420,player.y);
  b.final=true;b.r=48;b.xp=300;b.hp*=2.5;b.maxHp=b.hp;toast("👑 최종 보스 출현! 처치하면 클리어!");stinger("boss");shake=Math.max(shake,14);
 }
}
function bossRush(){
 const n=1+Math.floor(Math.max(0,elapsed-600)/360);
 for(let i=0;i<n;i++){const a=Math.random()*6.283;makeEnemy("boss",player.x+Math.cos(a)*480,player.y+Math.sin(a)*480)}
 for(let i=0;i<2;i++){const a=Math.random()*6.283;makeEnemy("elite",player.x+Math.cos(a)*420,player.y+Math.sin(a)*420)}
 toast(`👑 보스 러시! 보스 ${n} · 엘리트 2`);stinger("boss");shake=Math.max(shake,12);
 vfx({type:"ring",x:player.x,y:player.y,r0:40,r1:600,life:.8,max:.8,c:"rgba(255,60,160,.85)",w:6});
}
/* 위협 단계 알림 + 적 스폰 */
function updateSpawning(dt){
 if(runSt.duel||DEV.nospawn)return;                      // 스텔라와 1:1 결투 중엔 적이 나오지 않음
 const nt=Math.floor(elapsed/120);if(nt>tier){tier=nt;toast(`⚠️ 적이 더 강해졌습니다! (위협 ${tier})`);sfx("warn")}
 spawn-=dt;
 if(spawn<=0){spawn=Math.max(.11,.72-elapsed*.0028);const n=elapsed>600?7:elapsed>480?6:elapsed>320?5:elapsed>200?4:elapsed>100?3:elapsed>45?2:1;if(enemies.length<450)for(let i=0;i<n;i++)spawnEnemy()}
}
/* ── 스테이지 위험 요소 (용암 협곡) ── 용암 강 위에 서 있으면 화상 · 주기적으로 적대 유성 낙하 */
function updateHazards(dt){
 if(runSt.duel)return;
 const hz=STAGE_LOOK[selSt].haz;if(!hz)return;
 const sc=STG[selSt].dmg*(1+elapsed/500);
 if(hz==="lava"||hz==="bog"){
  runSt.lavaT-=dt;
  if(runSt.lavaT<=0){runSt.lavaT=.1;runSt.onLava=groundField(player.x,player.y)[3]>.55}
  if(runSt.onLava&&player.dashT<=0){
   if(hz==="lava"){hurt(9*(1+elapsed/500)*dt);
    if(Math.random()<dt*14)spawnP(player.x+rand(-12,12),player.y+12,rand(-20,20),rand(-90,-40),rand(.3,.5),rand(1.4,2.2),Math.random()<.5?"#ffb040":"#ff5a1e",0,2,-40);
    if(!runSt.lavaWarn){runSt.lavaWarn=true;toast("🌋 용암 강! 밟고 있으면 계속 화상을 입습니다")}}
   else{runSt.pslow=Math.min(runSt.pslow||1,.6);hurt(4*sc*dt);       // 독 늪: 느려짐 + 중독
    if(Math.random()<dt*10)spawnP(player.x+rand(-12,12),player.y+12,rand(-10,10),rand(-40,-20),rand(.5,.8),rand(2,3.4),"rgba(140,255,100,.5)",2,1,0);
    if(!runSt.lavaWarn){runSt.lavaWarn=true;toast("🍄 독 늪! 느려지고 중독됩니다")}}
  }
 }
 if(hz==="saw"&&elapsed>=runSt.met){ // 태엽 성채: 화면을 가로지르는 톱날 (예고선 후 발사)
  runSt.met=elapsed+Math.max(3.5,8-elapsed/150);
  const n=Math.min(4,1+Math.floor(elapsed/160));
  for(let i=0;i<n;i++){const a=Math.random()*6.283,off=rand(-140,140),px=player.x-Math.sin(a)*off,py=player.y+Math.cos(a)*off,D_=900;
   xs.push({t:"saw",x:px-Math.cos(a)*D_,y:py-Math.sin(a)*D_,a,vx:Math.cos(a)*520,vy:Math.sin(a)*520,warn:1.1,life:4.2,r:24,dm:26*sc,hitT:0,hostile:true})}
  sfx("warn");
 }
 if((hz==="lava"||hz==="void")&&elapsed>=(runSt.met2||45)){ // 적대 유성 (용암 협곡 / 별의 심연)
  runSt.met2=elapsed+Math.max(7,16-elapsed/80);
  const n=Math.min(6,2+Math.floor(elapsed/150));
  for(let i=0;i<n;i++){const a=Math.random()*6.283,r=i===0?rand(0,40):rand(60,260);xs.push({t:"met",x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r,delay:1.5,d0:1.5,dm:22*sc,aoe:78,hostile:true})}
  sfx("meteor");
 }
 if(hz==="void"&&elapsed>=runSt.met){ // 별의 심연: 중력 우물 (플레이어를 끌어당기고 중심은 피해)
  runSt.met=elapsed+Math.max(6,12-elapsed/120);
  const a=Math.random()*6.283,r=rand(120,260);
  xs.push({t:"well",x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r,warn:1,life:7,max:7,R:240,dm:30*sc,hostile:true});
 }
}
/* 적 이동 / 기믹 / 공격 / 상태이상 진행 */
function dot(e,amt,key){if(amt<=0)return;const pw=curW;curW=key;e.dotAcc+=dmgTo(e,amt,true);curW=pw}
function updateEnemies(dt){
 for(let n=0;n<enemies.length;n++){
  const e=enemies[n],dx=player.x-e.x,dy=player.y-e.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
  let m=1,exX=0,exY=0;
  if(e.hit>0)e.hit-=dt;
  if(e.slowT>0){e.slowT-=dt;m*=.45}
  if(e.chillT>0){e.chillT-=dt;m*=Math.max(.6,1-.08*e.chillN)}else e.chillN=0;
  // 지속 피해 (화상 / 중독 / 출혈) — 출처별로 기록, 0.5초마다 묶어서 숫자 표시
  if(e.burnT>0){e.burnT-=dt;dot(e,e.burnDps*(e.toxT>0?2:1)*dt,"st_burn")}else e.burnDps=0;
  if(e.poisonT>0){e.poisonT-=dt;dot(e,e.poisonDps*dt,"st_poison")}else e.poisonDps=0;
  if(e.bleedT>0){e.bleedT-=dt;dot(e,e.bleedN*e.bleedB*dt,"st_bleed")}else{e.bleedN=0;e.bleedB=0}
  if((e.dotT-=dt)<=0){e.dotT=.5;if(e.dotAcc>=1)dnum(e,e.dotAcc,"#ffb38a",false);e.dotAcc=0}
  if(e.markT>0)e.markT-=dt;if(e.shockT>0)e.shockT-=dt;if(e.toxT>0)e.toxT-=dt;if(e.rxT>0)e.rxT-=dt;if(e.zapT>0)e.zapT-=dt;
  if(e.curseT>0){e.curseT-=dt;if(e.curseT<=0)curseBurst(e)}
  if(e.wardT>0)e.wardT-=dt;
  if(e.ai==="runner"){e.ph+=dt*5;const side=Math.sin(e.ph)*.75;exX=-uy*side*e.sp;exY=ux*side*e.sp}
  let vx=ux*e.sp*m+exX,vy=uy*e.sp*m+exY;
  switch(e.ai){
   case"charger":
    if(e.st===0){e.tm-=dt;if(e.tm<=0&&L<420){e.st=1;e.tm=.75;e.dx=ux;e.dy=uy}}
    else if(e.st===1){vx=vy=0;e.tm-=dt;if(e.tm>.25){e.dx=ux;e.dy=uy}if(e.tm<=0){e.st=2;e.tm=.5;sfx("dash")}}
    else{vx=e.dx*e.sp*6;vy=e.dy*e.sp*6;e.tm-=dt;if(e.tm<=0){e.st=0;e.tm=rand(2.5,4)}}
    break;
   case"tank":e.gt+=dt;e.guarded=(e.gt%6)>3.6;if(e.guarded){vx*=.5;vy*=.5}break;
   case"elite":
    if(!e.enr&&e.hp<e.maxHp*.5){e.enr=true;sfx("enrage");vfx({type:"ring",x:e.x,y:e.y,r0:e.r,r1:e.r*4,life:.4,max:.4,c:"rgba(255,90,40,.9)",w:5})}
    if(e.enr){vx*=1.6;vy*=1.6}break;
   case"boss":
    e.sl-=dt;if(e.sl<=0){e.sl=6;effects.push({type:"slam",x:player.x,y:player.y,r:95,life:1,max:1,dmg:26*e.dmgS});sfx("warn")}
    if(STG[selSt].ch===2){e.sp2-=dt;if(e.sp2<=0&&shots.length<300){e.sp2=5.5;const n=16,o=elapsed*1.7;   // 챕터 2 보스: 원형 탄막
     for(let i=0;i<n;i++){const a=o+i*6.283/n;shots.push({x:e.x,y:e.y,vx:Math.cos(a)*135,vy:Math.sin(a)*135,r:6,life:5,damage:16*e.dmgS,enemy:true})}sfx("warn")}}
    e.sm-=dt;if(e.sm<=0){e.sm=12;if(enemies.length<450)for(let i=0;i<4;i++){const a=i*Math.PI/2;makeEnemy(STG[selSt].ch===2?"spore":"grunt",e.x+Math.cos(a)*60,e.y+Math.sin(a)*60)}toast("👑 보스가 졸개를 소환했다!");vfx({type:"ring",x:e.x,y:e.y,r0:e.r,r1:e.r*3,life:.4,max:.4,c:"rgba(255,60,160,.8)",w:4})}
    break;
   case"stella":{const v=stellaAI(e,dt,L,ux,uy);vx=v[0];vy=v[1];break}
   case"healer": // 주변 적 회복 (3초마다 최대 체력 8%)
    if(L<260){vx*=.3;vy*=.3}
    e.healT-=dt;if(e.healT<=0&&e.stunT<=0&&e.frozenT<=0){e.healT=3;let c=0;
     for(const q of query(e.x,e.y,150,QD)){if(q===e||q.hp<=0||q.hp>=q.maxHp||d2(q,e)>22500)continue;q.hp=Math.min(q.maxHp,q.hp+q.maxHp*(q.type==="boss"?.02:q.elite?.04:.08));c++}
     vfx({type:"ring",x:e.x,y:e.y,r0:10,r1:150,life:.5,max:.5,c:"rgba(160,255,150,.7)",w:3});
     if(c&&impBudget>0){impBudget--;for(let i=0;i<5;i++)spawnP(e.x+rand(-60,60),e.y+rand(-40,40),0,-50,.6,2.2,"#9fff9a",0,1,0)}}
    break;
   case"wraith": // 주기적으로 위상 이동(무적·반투명) 후 플레이어 쪽으로 순간이동
    e.phT-=dt;
    if(e.phased){vx*=1.5;vy*=1.5;if(e.phT<=0){e.phased=false;e.phT=rand(3,5);const j=Math.min(90,L-40);if(j>0){e.x+=ux*j;e.y+=uy*j}
     vfx({type:"ring",x:e.x,y:e.y,r0:4,r1:36,life:.25,max:.25,c:"rgba(160,180,255,.9)",w:3})}}
    else if(e.phT<=0&&e.stunT<=0&&e.frozenT<=0){e.phased=true;e.phT=1.2}
    break;
   case"magma": // 지나간 자리에 용암
    e.lavaT-=dt;if(e.lavaT<=0){e.lavaT=1.3;addLava(e.x,e.y,24,4,9*e.dmgS)}break;
   case"mother": // 포자 모체: 주기적으로 포자충 3마리
    e.spawnT-=dt;if(e.spawnT<=0&&e.stunT<=0&&e.frozenT<=0){e.spawnT=5;if(enemies.length<430)for(let i=0;i<2;i++){const a=i*2.09+Math.random();makeEnemy("spore",e.x+Math.cos(a)*30,e.y+Math.sin(a)*30)}
     vfx({type:"ring",x:e.x,y:e.y,r0:e.r,r1:e.r*2.6,life:.35,max:.35,c:"rgba(200,120,220,.8)",w:3})}
    break;
   case"warden": // 수호자: 주변 적에게 피해 감소 보호막 (자신 제외)
    if(L<240){vx*=.4;vy*=.4}
    e.spawnT-=dt;if(e.spawnT<=0){e.spawnT=1;for(const q of query(e.x,e.y,160,QD))if(q!==e&&q.hp>0&&d2(q,e)<25600)q.wardT=1.3}
    break;
   case"stalker": // 추적자: 예고 원을 띄운 뒤 플레이어 옆으로 순간이동
    if(e.blinkT>0){vx=vy=0;e.blinkT-=dt;if(e.blinkT<=0){vfx({type:"ring",x:e.x,y:e.y,r0:4,r1:30,life:.25,max:.25,c:"rgba(170,90,255,.9)",w:3});e.x=e.bx;e.y=e.by;e.st=1.2;
      vfx({type:"ring",x:e.x,y:e.y,r0:30,r1:4,life:.25,max:.25,c:"rgba(170,90,255,.9)",w:3});sfx("dash")}}
    else{e.spawnT-=dt;if(e.st>0){e.st-=dt;vx*=2.2;vy*=2.2}
     if(e.spawnT<=0&&L<520&&e.stunT<=0&&e.frozenT<=0){e.spawnT=rand(4.5,6.5);const a=Math.random()*6.283;e.bx=player.x+Math.cos(a)*75;e.by=player.y+Math.sin(a)*75;e.blinkT=.7}}
    break;
   case"imp": // 가끔 화염탄
    if(L<520){e.fbT-=dt;if(e.fbT<=0&&e.stunT<=0&&e.frozenT<=0&&shots.length<260){e.fbT=rand(3,4.5);shots.push({x:e.x,y:e.y,vx:ux*175,vy:uy*175,r:7,life:3.5,damage:11*e.dmgS,enemy:true,fire:true})}}
    break;
  }
  if(e.stun>0){e.stun-=dt;vx=vy=0}
  const hold=e.frozenT>0||e.stunT>0;                           // 빙결/기절: 이동·공격 불가
  if(e.frozenT>0)e.frozenT-=dt;if(e.stunT>0)e.stunT-=dt;
  if(hold){vx=vy=0}
  e.x+=(vx+e.kx)*dt;e.y+=(vy+e.ky)*dt;const dmp=Math.exp(-dt*7);e.kx*=dmp;e.ky*=dmp;
  if(hold||e.phased)continue;
  // 원거리 공격: shooter는 극소수, 보스는 느리고 성긴 탄막
  if(e.ai==="shooter"||e.type==="boss"){
   e.shot-=dt;
   if(e.shot<=0){const boss=e.type==="boss",seer=e.type==="seer",count=boss?8:seer?3:1;e.shot=boss?3.8:3;
    for(let i=0;i<count;i++){const a=Math.atan2(player.y-e.y,player.x-e.x)+(boss?i*Math.PI*2/count:seer?(i-1)*.28:0);shots.push({x:e.x,y:e.y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,r:6,life:4,damage:(boss?18:13)*e.dmgS,enemy:true})}}
  }
  const cr=player.r+e.r;
  if(d2(e,player)<cr*cr){
   if(e.ai==="bomber"){enemyBlast(e);e.hp=0}
   else{hurt((e.type==="boss"?34:e.hv?20:e.type==="elite"?17:11)*e.dmgS*(e.ai==="charger"&&e.st===2?1.6:1)*dt);
    const th=passives.thorns.level;if(th){const pw=curW;curW="thorns";dot(e,(20+th*15)*dmgMul()*dt,"thorns");curW=pw}}   // 가시 갑옷: 접촉 반사
  }
 }
}
/* 이번 프레임에 쓰러진 적 처리 (범위 피해·독 등 포함) */
function removeDeadEnemies(){
 for(let i=enemies.length-1;i>=0;i--)if(enemies[i].hp<=0){const e=enemies[i];rm(enemies,i);kill(e)}
}
