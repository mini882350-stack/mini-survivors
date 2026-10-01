/* ═══════════════ player.js ═══════════════
   플레이어 상태 · 능력치 계산 · 이동 · 경험치/레벨 · 피해 · 직업 기믹 */
"use strict";
const player={x:0,y:0,r:16,speed:225,hp:100,maxHp:100,aim:0,flash:0,face:1,moving:false,
 sh:0,shT:0,dashT:0,dashCD:0,dvx:0,dvy:0,critT:0,trailT:0,healCap:0,rage:0,rageT:0,auraT:0,rolls:0,walk:0,mvs:0,atk:0,atkCD:0,invT:0,tokens:0,revives:0};
const pl=k=>save&&save.perks?save.perks[k]||0:0;
const chr=()=>CH[selCh]||{};
const isJob=k=>selCh===k;
const dmgMul=()=>(1+passives.might.level*.15+pl("dmg")*.04)*(isJob("vamp")&&player.hp<player.maxHp*.5?1.3:1)*(1+player.rage*.012);
const rateMul=()=>Math.max(.4,1-passives.haste.level*.12)*(1-player.rage*.008)*(1-pl("cd")*.015);   // 광전사: 분노당 공격속도 +0.8%
const speed=()=>player.speed*(1+passives.boots.level*.12)*(1+pl("spd")*.02)*(player.slow||1);   // slow: 독 늪 / 포자 구름
const pickupRange=()=>125*(1+passives.magnet.level*.25)*(1+pl("magnet")*.04);
const armorMul=()=>Math.max(.3,1-passives.armor.level*.08-(weapons.aegis&&weapons.aegis.level>0?.15:0))*(isJob("berserker")?1.1:1)*(1-pl("armor")*.015)*(1-passives.thorns.level*.03);
const critC=()=>CRIT_C+passives.eye.level*.05+(player.critT>0?.4:0)+(isJob("gambler")?.1:0)+pl("crit")*.006;   // 레인저: 구른 뒤 +40%
const critM=()=>CRIT_M+passives.eye.level*.15+(player.gun?(player.gun.u.ghol||0)*.25:0);
const statusPot=()=>1+passives.amp.level*.2;                   // 상태이상 피해·지속 배율
const rxMul=()=>(1+passives.cata.level*.3)*(isJob("mage")?1.5:1);  // 원소술사: 반응 피해 +50%
const rxCd=()=>.7*(1-passives.cata.level*.12);
const xpMul=()=>XP_MUL*(1+pl("xp")*.05);
const areaMul=()=>1+passives.area.level*.12+pl("area")*.015;                    // 확산의 룬
const wc=w=>w.count+passives.multi.level;                       // 증식의 룬: 모든 무기 수량 +1
const dropMul=()=>(1+passives.luck.level*.3)*(1+pl("luck")*.03);
const wSlots=()=>{let n=0;for(const k in defs)if(weapons[k]&&weapons[k].level>0)n++;return n};
const pSlots=()=>{let n=0;for(const k in passives)if(passives[k].level>0)n++;return n};
function passiveUpgrade(k){const p=passives[k];p.level++;discover("p",k);if(k==="heart"){player.maxHp+=20;player.hp=Math.min(player.maxHp,player.hp+35)}sfx("upgrade")}
function gainXP(n){xp+=n*xpMul();checkLevel()}
/* 클리어 연출(pendingWin) 중에는 레벨업 창을 띄우지 않음 */
function checkLevel(){if(paused||!running||pendingWin>0)return;if(xp>=need){xp-=need;need=Math.floor(need*1.4+8);level++;showLevelUp()}}
/* 회복 (흡혈 등 초당 상한이 있는 회복은 capped=true) */
function heal(n,capped){
 if(capped){if(player.healCap>=12)return;player.healCap+=n}
 player.hp=Math.min(player.maxHp,player.hp+n);
}
function hurt(n){
 if(!running||pendingWin>0||player.dashT>0||player.invT>0)return;   // 구르는 중 / 부활 직후 무적
 let d=n*armorMul();
 if(player.sh>0){ // 성기사 보호막
  const a=Math.min(player.sh,d);player.sh-=a;d-=a;
  if(player.sh<=0){player.sh=0;holyNova()}
  if(d<=0)return;
 }
 player.hp-=d;player.flash=.12;shake=Math.max(shake,d>=5?9:5);
 if(hurtFxT<=0){hurtFxT=.18;sfx("hurt");burst(player.x,player.y,5,"#ff5a5a");kickR(5)}
 if(d>=8)stopHit(.05);
 if(player.hp<=0){
  if(player.revives>0){player.hp=1;player.invT=99;player.reviveQ=true;return}   // 부활은 프레임 끝에서 처리 (적/탄 배열 순회 중 삭제 방지)
  running=false;endRun(false);show("gameover");sfx("death")}
}
/* 영구 강화 '부활': 폭탄 효과로 주변을 쓸어버리고 HP 회복 + 2초 무적 */
function revive(){
 player.revives--;player.hp=player.maxHp*Math.min(.9,.3+pl("revive")*.03);player.invT=2;player.flash=0;
 detonateAll(player.x,player.y);
 for(const e of enemies){const L=dist(e,player)||1;if(L<360)push(e,(e.x-player.x)/L,(e.y-player.y)/L,900)}
 vfx({type:"ring",x:player.x,y:player.y,r0:10,r1:300,life:.7,max:.7,c:"rgba(255,250,210,.95)",w:8});vfx({type:"light",x:player.x,y:player.y,r:600,life:.6,max:.6,c:"#fff4c8"});
 for(let i=0;i<30;i++){const a=i/30*6.283,sp=rand(150,380);spawnP(player.x,player.y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.5,.9),rand(1.6,2.8),i&1?"#fff4c8":"#ffe58a",1,3,0)}
 slowT=.5;timeScale=.3;toast(`🕊️ 부활! (남은 부활 ${player.revives}회)`);stinger("evo");
}
/* ── 직업 기믹 ── */
/* 성기사: 보호막이 깨지면 성광 폭발 (피해 + 약화) */
function holyNova(){
 const R=170*areaMul(),dm=(40+level*6)*dmgMul(),pw=curW;curW="trait";
 for(const e of query(player.x,player.y,R,QD)){
  if(e.hp<=0)continue;const q=dist(e,player);if(q>=R+e.r)continue;
  const L=q||1;dmgTo(e,dm);dnum(e,dm,"#ffe58a",false);e.markT=5*statusPot();push(e,(e.x-player.x)/L,(e.y-player.y)/L,420);
 }
 curW=pw;
 vfx({type:"core",x:player.x,y:player.y,r:R*.5,life:.25,max:.25,c:"#fff6c8"});
 vfx({type:"ring",x:player.x,y:player.y,r0:20,r1:R,life:.4,max:.4,c:"rgba(255,226,122,.95)",w:7});
 vfx({type:"light",x:player.x,y:player.y,r:R*2.4,life:.4,max:.4,c:"#ffe27a"});
 for(let i=0;i<16;i++){const a=i/16*6.283,sp=rand(200,360);spawnP(player.x,player.y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.3,.5),rand(1.5,2.6),i&1?"#ffe58a":"#fff",1,5,0)}
 shake=Math.max(shake,6);sfx("shield_break");
}
/* 레인저: 무적 구르기 */
/* 광전사: 처치 시 분노 */
function addRage(){if(!isJob("berserker"))return;const was=player.rage|0;player.rage=Math.min(30,player.rage+1);player.rageT=3;if(was<30&&player.rage>=30){toast("🪓 분노 최대!");sfx("enrage")}}
function tryDash(){
 if(isJob("gunslinger")){gunRoll();return}
 if(!isJob("ranger")||!running||paused||player.dashCD>0)return;
 const a=player.moving?player.aim:(player.face>0?0:Math.PI);
 player.dashT=.22;player.dashCD=2.5;player.critT=2.2;player.dvx=Math.cos(a);player.dvy=Math.sin(a);
 sfx("dash_p");vfx({type:"ring",x:player.x,y:player.y,r0:8,r1:44,life:.25,max:.25,c:"rgba(170,255,170,.8)",w:3});
}
/* 플레이어 이동 (입력) + 직업 기믹 진행 */
function updatePlayer(dt){
 let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),iy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),mag=1;
 if(joy.on&&(joy.x||joy.y)){ix=joy.x;iy=joy.y;mag=Math.min(1,Math.hypot(ix,iy))}   // 모바일 가상 조이스틱 (아날로그)
 player.moving=!!(ix||iy);if(ix)player.face=ix>0?1:-1;
 player.slow=runSt.pslow||1;runSt.pslow=1;                                     // 지난 프레임에 걸린 둔화 적용 후 초기화
 if(player.dashT>0){ // 구르기: 빠르게 미끄러지며 잔상
  player.dashT-=dt;const sp=speed()*3.4;player.x+=player.dvx*sp*dt;player.y+=player.dvy*sp*dt;player.moving=true;
  spawnP(player.x+rand(-6,6),player.y+rand(-4,10),-player.dvx*40,-player.dvy*40,.3,rand(3,5),"rgba(160,255,170,.35)",2,3,0);
 }else if(ix||iy){const l=Math.hypot(ix,iy),sp=speed()*mag;player.x+=ix/l*sp*dt;player.y+=iy/l*sp*dt;player.aim=Math.atan2(iy,ix)}
 if(player.dashCD>0)player.dashCD-=dt;if(player.critT>0)player.critT-=dt;
 player.healCap=Math.max(0,player.healCap-dt*12);
 // 재생의 룬
 const rg=passives.regen.level*.5+pl("regen")*.06;if(rg&&player.hp<player.maxHp)player.hp=Math.min(player.maxHp,player.hp+rg*dt);
 if(player.invT>0)player.invT-=dt;
 // 성기사: 10초마다 보호막 충전
 if(isJob("knight")){player.shT-=dt;if(player.shT<=0){player.shT=10;const m=player.maxHp*.25;if(player.sh<m){player.sh=m;sfx("shield");vfx({type:"ring",x:player.x,y:player.y,r0:30,r1:18,life:.3,max:.3,c:"rgba(255,226,122,.9)",w:3})}}}
 // 광전사: 분노는 3초간 처치가 없으면 빠르게 식음
 if(player.rage>0){player.rageT-=dt;if(player.rageT<=0)player.rage=Math.max(0,player.rage-dt*12)}
 // 빙결 마녀: 1초마다 주변 적에게 냉기 (반응도 일으킴)
 if(isJob("cryo")){player.auraT-=dt;if(player.auraT<=0){player.auraT=1;const R=150*areaMul(),dm=(8+level*1.5)*dmgMul(),pw=curW;curW="trait";
  for(const e of query(player.x,player.y,R,QD)){if(e.hp<=0||e.phased||d2(e,player)>(R+e.r)**2)continue;dmgTo(e,dm*.4,true);applyStatus(e,"chill",dm)}
  curW=pw;vfx({type:"ring",x:player.x,y:player.y,r0:R*.6,r1:R,life:.4,max:.4,c:"rgba(170,230,255,.45)",w:3})}}
 // 화염술사: 움직이면 불꽃 발자국
 if(isJob("pyro")&&player.moving){player.trailT-=dt;if(player.trailT<=0){player.trailT=.2;
  effects.push({type:"cloud",st:"burn",fire:true,x:player.x+rand(-4,4),y:player.y+10,life:2,max:2,radius:26*areaMul(),dps:(5+level*1.1)*dmgMul(),tk:0,dm:(9+level*1.4)*dmgMul(),w:"trait"})}}
}
/* 프레임 끝: 발먼지, 피격 번쩍임 감소 */
function updatePlayerLate(dt){
 dustT-=dt;if(player.moving&&dustT<=0){dustT=.09;spawnP(player.x-player.face*4,player.y+14,rand(-25,25)-player.face*20,rand(-30,-8),.35,rand(1.5,3),"rgba(200,190,170,.55)",2,3,0)}
 player.flash=Math.max(0,player.flash-dt);
 if(player.reviveQ){player.reviveQ=false;revive()}
 // 캐릭터 애니메이션: 걷기 위상 · 이동 정도(부드럽게) · 공격 모션
 player.mvs+=((player.moving?1:0)-player.mvs)*Math.min(1,dt*10);player.walk+=dt*11*player.mvs;
 player.atk=Math.max(0,player.atk-dt*5);player.atkCD-=dt;
}
