/* ═══════════════ core.js ═══════════════
   게임 상태 · 공용 유틸 · 설정/품질 · 공간 그리드 · 입력 · 게임 시작/루프
   가장 먼저 로드됨. 다른 파일의 함수는 실행 시점에만 호출하므로 로드 순서 문제 없음. */
"use strict";
/* ── 기본 설정 / 상태 ── */
const $=id=>document.getElementById(id),canvas=$("game"),MAINCTX=canvas.getContext("2d");
let ctx=MAINCTX;                   // 스프라이트 굽기/초상화 생성 시 잠깐 오프스크린 컨텍스트로 교체됨
const TS=64,MAX_W=8,MAX_P=6,OUT="rgba(12,5,14,.88)";
const BOMB_P=.005,CHEST_P=.003;   // 폭탄 / 일반 몬스터 상자 드롭 확률
const CRIT_C=.07,CRIT_M=2;        // 치명타 확률 / 배율
const GEM_CAP=300;                // 보석 최대 개수 (넘으면 기존 보석에 합쳐짐)
let W,H,D,last=performance.now(),running=false,paused=false,elapsed=0,level=1,xp=0,need=16,kills=0,spawn=0,shake=0,toastTimer=0,tier=0,uiCache="",uiT=0,bombFlash=0,dustT=0,finalSpawned=false,nextElite=0,nextBoss=0,barIx=0,selCh="mage",selSt=0,slot=-1,save=null;
let hitStop=0,hitStopCD=0,timeScale=1,slowT=0,pendingWin=0,impBudget=0,pickCombo=0,pickT=0,hurtFxT=0,gemMix=0,pauseFromTitle=false;
let mode=0,paidGold=0,rxBudget=0,runRx={},nextRush=0,infAnnounced=false;   // mode: 0=스테이지 1=무한 · runRx: 이번 판 원소 반응 횟수
let curW="",DMG={},runSt={boss:0},burstB=0;   // curW: 지금 피해를 주는 출처(무기 키 / st_상태 / rx_반응 / trait) · DMG: 출처별 누적 피해
const keys={},enemies=[],shots=[],gems=[],effects=[],drops=[],xs=[],chestQueue=[];
let weapons={},passives={};
const cam={x:0,y:0,lx:0,ly:0,kx:0,ky:0,t:0};
const loadJSON=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"null")||d}catch(e){return d}};
let mem=loadJSON("ms_save",[]);
/* ── 설정 / 그래픽 품질 ──
   pmax 파티클 최대 · nmax 데미지 숫자 최대 · fx 시각 효과 최대 · imp 프레임당 타격 이펙트 예산
   glow 일반 오브젝트 shadowBlur 사용 · light 조명 레이어 · lmax 광원 최대 · dec 바닥 자국 최대 · dpr 최대 해상도 배율 */
const QL=[
 {n:"높음",pmax:900,nmax:120,fx:90,imp:70,glow:true,light:true,lmax:140,dec:70,dpr:2},
 {n:"중간",pmax:450,nmax:80,fx:50,imp:35,glow:false,light:true,lmax:70,dec:40,dpr:1.5},
 {n:"낮음",pmax:180,nmax:40,fx:24,imp:14,glow:false,light:false,lmax:0,dec:16,dpr:1}
];
const S=Object.assign({q:"auto",shake:1,dmgNum:true,fps:false,vol:1,mvol:.8,svol:1,hl:0,bgDim:0,bgm:"random",fxa:1},loadJSON("ms_settings",{}));
const TOUCH=matchMedia("(pointer:coarse)").matches||"ontouchstart"in window;   // 모바일/태블릿
let qi=S.q==="auto"?(TOUCH?1:0):Math.min(2,Math.max(0,+S.q||0)),Q=QL[qi];
let ZM=1;                                                                       // 화면 확대율: 작은 화면에서는 더 넓게 보이도록 축소
function saveSet(){try{localStorage.setItem("ms_settings",JSON.stringify(S))}catch(e){}}
/* ── 유틸 ── */
const fmt=t=>String(Math.floor(t/60)).padStart(2,"0")+":"+String(Math.floor(t%60)).padStart(2,"0");
const d2=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
const dist=(a,b)=>Math.sqrt(d2(a,b));
const rand=(a,b)=>Math.random()*(b-a)+a;
const rm=(a,i)=>{a[i]=a[a.length-1];a.pop()};                       // 순서 무관 O(1) 삭제
const cull=(a,f)=>{let j=0;for(let i=0;i<a.length;i++){const o=a[i];if(f(o))a[j++]=o}a.length=j};
const alive=o=>o.life>0,notDead=o=>!o.dead;
/* ── 공간 분할 그리드 (적 충돌 탐색 가속) ── */
const G=96,grid=new Map(),cellPool=[],QA=[],QB=[],QC=[],QD=[];   // QD: 상태이상/원소 반응 전용 (다른 조회 루프 안에서 호출되므로 분리)
const gk=(cx,cy)=>(cx+4096)*8192+cy+4096;
function buildGrid(){
 for(const a of grid.values()){a.length=0;cellPool.push(a)}grid.clear();
 for(const e of enemies){if(e.hp<=0)continue;const k=gk(Math.floor(e.x/G),Math.floor(e.y/G));let a=grid.get(k);if(!a){a=cellPool.pop()||[];grid.set(k,a)}a.push(e)}
}
function query(x,y,r,out){
 out.length=0;const R=r+52,x0=Math.floor((x-R)/G),x1=Math.floor((x+R)/G),y0=Math.floor((y-R)/G),y1=Math.floor((y+R)/G);
 for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++){const a=grid.get(gk(cx,cy));if(a)for(let i=0;i<a.length;i++)out.push(a[i])}
 return out;
}
/* ── 입력 ── */
addEventListener("keydown",e=>{
 keys[e.code]=true;
 if(e.code==="KeyM"){muted=!muted;setVol();toast(muted?"🔇 음소거":"🔊 소리 켜짐")}
 if(e.code==="F3"){e.preventDefault();S.fps=!S.fps;saveSet()}
 if(e.code==="Escape"||e.code==="KeyP"){
  if($("pause").style.display==="flex")closePause();
  else if(running&&!paused)openPause(false);
 }
 if(running&&!paused&&/^Digit[1-4]$/.test(e.code)&&selCh==="gunslinger")useSkill(+e.code[5]-1);   // 총잡이 스킬
 if(running&&!paused&&e.code==="KeyE"&&selCh==="gunslinger")gunSwap();                         // 총잡이 총 교체
 if((e.code==="Space"||e.code==="ShiftLeft"||e.code==="ShiftRight")&&running){if(e.code==="Space")e.preventDefault();if(!paused)tryDash()}
 if(e.code==="Tab"){e.preventDefault();if($("pause").style.display==="flex")closePause();else if(running&&!paused)openPause(false,"stats")}
 if(paused&&(e.code==="KeyR"||e.code==="KeyX")){
  const lv=$("levelup").style.display==="flex",ch=$("chest").style.display==="flex";
  if(lv||ch){const b=$(e.code==="KeyR"?(lv?"reroll":"rerollC"):(lv?"skipL":"skipC"));if(b&&b.style.display!=="none")b.click()}
 }
 if(paused&&"12345".includes(e.key)&&e.key){
  const sel=$("levelup").style.display==="flex"?"#choices .choice":$("chest").style.display==="flex"?"#rewards .reward":null;
  if(sel){const b=document.querySelectorAll(sel)[+e.key-1];if(b)b.click()}
 }
});
addEventListener("keyup",e=>{if(e.code)keys[e.code]=false;else clearMove()});   // 떼는 키만 해제 (코드가 비어 오는 드문 경우에만 전부 해제)
/* 입력 초기화: 창 포커스를 잃거나 우클릭 메뉴가 뜰 때 (keyup을 놓칠 수 있는 경우)만 키보드까지 초기화 */
function clearMove(){for(const k in keys)keys[k]=false;clearPtr()}
/* 선택창·메뉴 열고 닫을 때: 키보드 상태는 유지(누르고 있는 키는 계속 이동), 조이스틱·마우스 사격만 초기화 */
function clearPtr(){if(typeof joy!=="undefined"){joy.on=false;joy.x=joy.y=0;joy.id=-1}if(typeof mouse!=="undefined")mouse.down=false}
addEventListener("contextmenu",e=>{if(!e.defaultPrevented)clearMove()});   // 실제 우클릭 메뉴가 뜰 때만 (게임 화면 우클릭=총잡이 스킬은 제외)
addEventListener("blur",()=>{clearMove();if(running&&!paused)openPause(false)});
["pointerdown","keydown"].forEach(ev=>addEventListener(ev,()=>{try{if(sfxInit())AC.resume()}catch(x){}},{passive:true}));
function resize(){D=Math.min(devicePixelRatio||1,Q.dpr);W=innerWidth;H=innerHeight;canvas.width=W*D;canvas.height=H*D;MAINCTX.setTransform(D,0,0,D,0,0);
 ZM=Math.max(.6,Math.min(1,Math.min(W,H)/640))}
/* ── 모바일: 화면 아무 곳이나 눌러 끌면 가상 조이스틱 (아날로그 이동) ── */
const joy={on:false,id:-1,ox:0,oy:0,px:0,py:0,x:0,y:0};
const JOY_R=56;
canvas.addEventListener("pointerdown",e=>{
 if(e.pointerType==="mouse"||!running||paused||joy.on)return;
 joy.on=true;joy.id=e.pointerId;joy.ox=joy.px=e.clientX;joy.oy=joy.py=e.clientY;joy.x=joy.y=0;
 try{canvas.setPointerCapture(e.pointerId)}catch(x){}
 e.preventDefault();
});
canvas.addEventListener("pointermove",e=>{
 if(!joy.on||e.pointerId!==joy.id)return;
 let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const L=Math.hypot(dx,dy);
 if(L>JOY_R){joy.ox+=dx/L*(L-JOY_R);joy.oy+=dy/L*(L-JOY_R);dx=e.clientX-joy.ox;dy=e.clientY-joy.oy}   // 손가락을 따라 기준점이 끌려옴
 joy.px=e.clientX;joy.py=e.clientY;const k=Math.hypot(dx,dy)<8?0:1/JOY_R;joy.x=dx*k;joy.y=dy*k;
});
const joyEnd=e=>{if(e.pointerId===joy.id){joy.on=false;joy.x=joy.y=0;joy.id=-1}};
canvas.addEventListener("pointerup",joyEnd);canvas.addEventListener("pointercancel",joyEnd);
if(TOUCH)document.body.classList.add("touch");
document.addEventListener("visibilitychange",()=>{clearMove();if(document.hidden&&running&&!paused)openPause(false)});
addEventListener("resize",()=>{resize();if(!(running&&!paused))draw()});
resize();
function applyQ(){
 Q=QL[qi];if(pN>Q.pmax)pN=Q.pmax;if(nN>Q.nmax)nN=Q.nmax;
 if(Math.min(devicePixelRatio||1,Q.dpr)!==D){resize();if(!(running&&!paused))draw()}
}
let fps=60,fpsAcc=0,fpsN=0,uMs=0,dMs=0;
/* 한 프레임 업데이트. 호출 순서가 곧 기존 동작 순서이므로 순서를 바꾸지 말 것 */
function update(dt){
 if(!running)return;
 impBudget=Q.imp;rxBudget=10;burstB=8;
 if(!paused)pickups();
 if(!paused&&chestQueue.length&&pendingWin<=0){chestQueue.pop();openChest();return}
 if(paused)return;
 elapsed+=dt;pickT-=dt;hurtFxT-=dt;
 updateFinalBoss();      // enemies.js
 updatePlayer(dt);       // player.js — 이동 + 직업 기믹(구르기/보호막/불꽃 발자국/재생)
 updateHazards(dt);      // enemies.js — 용암 협곡: 용암 강 / 유성 낙하
 updateSpawning(dt);     // enemies.js
 updateWeapons(dt);      // weapons.js
 updateGun(dt);          // gun.js — 총잡이 리볼버/스킬
 updateEffects(dt);      // effects.js
 updateEnemies(dt);      // enemies.js
 buildGrid();            // core.js — 이동이 끝난 적 위치로 공간 그리드 재구성
 updateRingWeapons();    // weapons.js
 updateBeams();          // weapons.js — 회전 광선
 updateProjectiles(dt);  // weapons.js
 xUpdate(dt);            // weapons.js — 창/지뢰/블랙홀/유성/표창
 removeDeadEnemies();    // enemies.js
 cull(effects,alive);
 updateGems(dt);         // effects.js
 updateDecals(dt);       // effects.js — 바닥 자국 페이드
 updateParticles(dt);updateNums(dt);
 updatePlayerLate(dt);   // player.js — 발먼지, 피격 번쩍임
 updateHud(dt);          // ui.js — 토스트, HUD(0.1초 간격)
}
/* ── 시작 / 루프 ── */
function reset(){
 const c=CH[selCh];
 weapons={};for(const k in defs)weapons[k]={...defs[k],cool:Math.random()*.3};
 passives={};for(const k in passiveDefs)passives[k]={...passiveDefs[k]};
 Object.assign(player,{x:0,y:0,r:16,speed:225*(1+c.sp),maxHp:100+c.hp+pl("hp")*10,aim:0,flash:0,face:1,moving:false,
  sh:0,shT:2,dashT:0,dashCD:0,dvx:0,dvy:0,critT:0,trailT:0,healCap:0,rage:0,rageT:0,auraT:1,rolls:0,walk:0,mvs:0,atk:0,atkCD:0,invT:0,reviveQ:false,
  tokens:Math.min(4,Math.floor(pl("reroll")/5)),revives:pl("revive")>=20?2:pl("revive")>=10?1:0});player.hp=player.maxHp;
 for(const a of[enemies,shots,gems,effects,drops,xs,chestQueue,decals])a.length=0;
 pN=0;nN=0;
 buildGrid();
 Object.assign(cam,{x:0,y:0,lx:0,ly:0,kx:0,ky:0});
 elapsed=0;level=1;xp=0;need=16;kills=0;spawn=0;shake=0;tier=0;bombFlash=0;dustT=0;barIx=0;finalSpawned=false;uiCache="";uiT=0;
 hitStop=0;hitStopCD=0;timeScale=1;slowT=0;pendingWin=0;pickCombo=0;pickT=0;hurtFxT=0;
 paidGold=0;runRx={};nextRush=780;infAnnounced=false;musicReset();
 DMG={};runSt={boss:0,cK:0,cRx:0,cB:0,met:45,lavaWarn:false,lavaT:0,onLava:false,mageT:0};curW="";
 if(chunkStage!==selSt){chunks.clear();chunkStage=selSt}      // 스테이지가 바뀌면 지형 캐시 새로 생성
 prewarmSprites();                                              // 스테이지별 적 색상 스프라이트
 nextElite=[75,40,35,30,28,25][selSt];nextBoss=[170,110,100,90,85,80][selSt];
 E.vig.className=["","s2","s3","s4","s5","s6"][selSt];document.body.classList.toggle("ranger",selCh==="ranger");document.body.classList.toggle("gunslinger",selCh==="gunslinger");
 if(c.start)weaponUpgrade(c.start);
 if(selCh==="gunslinger")gunInit();else player.gun=null;
 $("hint").textContent=selCh==="gunslinger"?"WASD 이동 · 클릭 사격(누르고 있으면 연사) · E 총 교체 · 휠 스킬 선택 · 우클릭 스킬 사용 · Space 구르기+재장전 · Esc 메뉴":"WASD 이동 · 자동 공격 · 1~5 선택 · Space 구르기(레인저) · Esc 메뉴 · Tab 내 스탯 · M 음소거 · F3 FPS";
 canvas.style.cursor=selCh==="gunslinger"&&!TOUCH?"none":"";
 hideAll();running=true;paused=false;clearMove();E.boss._on=false;E.boss.style.display="none";
 toast(mode===1?"∞ 무한 모드 · 얼마나 버틸 수 있을까?":"WASD로 이동 · 자동 공격");setTimeout(()=>toast(""),1800);
 updateUI();
}
/* 자동 품질: 실제 작업 시간(update+draw)이 길게 유지되면 한 단계 낮추고, 여유가 오래 지속되면 다시 올림 */
let qHi=0,qLo=0;
function autoQ(raw){
 if(S.q!=="auto"||!running||paused)return;
 const work=uMs+dMs;
 qHi=work>13?qHi+raw:0;qLo=work<5?qLo+raw:0;
 if(qHi>2.5&&qi<2){qi++;applyQ();qHi=0}
 else if(qLo>10&&qi>0){qi--;applyQ();qLo=0}
}
function loop(now){
 const raw=Math.min(.05,(now-last)/1000);last=now;
 hitStopCD=Math.max(0,hitStopCD-raw);
 if(pendingWin>0&&!paused){pendingWin-=raw;if(pendingWin<=0&&running)victory()}
 if(slowT>0)slowT-=raw;else timeScale+=(1-timeScale)*Math.min(1,raw*3);
 const t0=performance.now();
 if(hitStop>0)hitStop-=raw;                                  // 히트 스톱: 게임 시간 정지, 화면(흔들림)은 계속
 else update(Math.min(.033,raw)*timeScale);
 const t1=performance.now();
 autoQ(raw);
 if(running&&!paused){updateCamera(raw);draw()}             // 일시정지/메뉴 중에는 마지막 프레임 유지
 const t2=performance.now();
 bombFlash=Math.max(0,bombFlash-raw*1.6);fx();
 uMs+=((t1-t0)-uMs)*.1;dMs+=((t2-t1)-dMs)*.1;
 fpsAcc+=raw;fpsN++;if(fpsAcc>=.5){fps=fpsN/fpsAcc;fpsAcc=0;fpsN=0}
 requestAnimationFrame(loop);
}
