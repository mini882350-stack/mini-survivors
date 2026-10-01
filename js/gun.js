/* ═══════════════ gun.js ═══════════════
   총잡이 전용: 마우스 조준 리볼버 · 연사(누르고 있기) · 패닝(우클릭) · 재장전 · 숫자키 스킬 · 전용 성장 선택지
   휠: 스킬 선택 (0번 = 패닝) · 우클릭: 선택한 스킬 사용 · Space: 즉시 재장전 무적 구르기 (3초)
   (모바일: 가장 가까운 적 자동 조준 + 자동 사격, 스킬 바를 눌러 사용) */
"use strict";
const mouse={x:0,y:0,down:false,used:false};
let fanReq=false;
const isGun=()=>selCh==="gunslinger";
addEventListener("pointermove",e=>{if(e.pointerType==="mouse"){mouse.x=e.clientX;mouse.y=e.clientY;mouse.used=true}},{passive:true});
canvas.addEventListener("pointerdown",e=>{
 if(e.pointerType!=="mouse"||!running||paused)return;
 mouse.x=e.clientX;mouse.y=e.clientY;mouse.used=true;
 if(e.button===0)mouse.down=true;else if(e.button===2)useSelected();
});
addEventListener("pointerup",e=>{if(e.pointerType==="mouse"&&e.button===0)mouse.down=false});
canvas.addEventListener("contextmenu",e=>e.preventDefault());
/* 휠: 스킬 선택 (패닝 → 스킬1 → … 순환) */
addEventListener("wheel",e=>{
 if(!running||paused||!isGun()||!player.gun)return;e.preventDefault();
 const g=player.gun,n=1+g.sk.length;g.sel=((g.sel+(e.deltaY>0?1:-1))%n+n)%n;sfx("ui");skbCache="";
},{passive:false});
function useSelected(){const g=player.gun;if(!g)return;if(g.sel===0)fanReq=true;else useSkill(g.sel-1)}
addEventListener("blur",()=>{mouse.down=false});
/* 마우스 화면 좌표 → 월드 좌표 */
const mWX=()=>cam.x+(mouse.x-W/2)/ZM,mWY=()=>cam.y+(mouse.y-H/2)/ZM;
/* ── 리볼버 능력치 ── */
const gu=k=>(player.gun&&player.gun.u[k])||0;
/* 총 3종 (E키로 교체): dm 피해 배율 · it 발사 간격 · cy 장탄(+실린더 강화당) · rl 재장전 · n 탄환 수 · sp 퍼짐 · v 탄속 · lf 사거리(수명) · pi 기본 관통 · kb 넉백 */
const GUNS=[
 {k:"rev",n:"리볼버",i:"🔫",dm:1,it:.3,cy:6,cyU:2,rl:1.2,n:1,sp:.03,v:980,lf:.85,pi:0,kb:0,sfx:"gun"},
 {k:"sg",n:"산탄총",i:"💥",dm:.6,it:.7,cy:3,cyU:1,rl:1.3,n:7,sp:.36,v:820,lf:.4,pi:0,kb:240,sfx:"shotgun"},
 {k:"rf",n:"장총",i:"🎯",dm:3.4,it:1.05,cy:5,cyU:1,rl:1.7,n:1,sp:0,v:1650,lf:.95,pi:3,kb:120,sfx:"rifle"}
];
const GW=()=>GUNS[player.gun?player.gun.wp:0];
/* 현상금 사냥꾼 (챕터 2): 플레이어 레벨당 총·스킬 피해 +3% */
const bounty=()=>ch2On()?1+.03*(level-1):1;
const gunBase=()=>32*(1+gu("gdmg")*.2)*(1+gu("gmast")*.12)*bounty()*dmgMul()*(player.gun&&player.gun.rollBuff>0?1.5:1);   // 스킬 피해 기준
const gunDmg=()=>gunBase()*GW().dm;
const gunInt=()=>Math.max(.07,GW().it*(1-gu("grate")*.1)*rateMul()*(player.gun.stormT>0?.34:1));
const gunCyl=()=>GW().cy+gu("gcyl")*GW().cyU;
const gunRel=()=>GW().rl*(1-gu("grel")*.15)*rateMul();
function gunInit(){player.gun={u:{},sk:[],ammo:6,rl:0,cd:0,fanQ:0,fanT:0,emp:0,stormT:0,dead:null,aim:0,flash:0,sel:0,focus:0,wp:0,am:[6,3,5],swapT:0,wc:0}}
/* E: 리볼버 → 산탄총 → 장총 교체 (총마다 남은 탄을 따로 기억) */
function gunSwap(){
 const g=player.gun;if(!g||!running||paused||g.fanQ>0)return;
 g.am[g.wp]=g.rl>0?0:g.ammo;g.wp=(g.wp+1)%GUNS.length;g.ammo=Math.min(g.am[g.wp],gunCyl());g.rl=g.ammo<=0?gunRel():0;g.swapT=.25;g.cd=Math.max(g.cd,.25);
 toast(`${GW().i} ${GW().n}`);sfx("reload");skbCache="";
}
/* Space: 무적 구르기 + 즉시 재장전 (재사용 3초) */
function gunRoll(){
 const g=player.gun;if(!g||!running||paused||player.dashCD>0)return;
 const a=player.moving?player.aim:g.aim;player.dashT=.24;player.dashCD=T("gs_roll")?1.5:3;if(T("gs_roll"))g.rollBuff=2;player.dvx=Math.cos(a);player.dvy=Math.sin(a);
 g.ammo=gunCyl();g.rl=0;g.fanQ=0;g.am=g.am.map((_,i)=>GUNS[i].cy+gu("gcyl")*GUNS[i].cyU);sfx("dash_p");sfx("reload");   // 구르면 세 총 모두 장전
 vfx({type:"ring",x:player.x,y:player.y,r0:8,r1:46,life:.25,max:.25,c:"rgba(255,220,150,.85)",w:3});
 // 챕터 2: 구르기 시작 지점에서 흙먼지 폭발 → 주변 적 밀쳐내기 + 피해 + 짧은 기절
 if(ch2On()){const R=130*areaMul(),dm=gunBase()*2.5,pw=curW;curW="gun_roll";
  for(const e of query(player.x,player.y,R,QD)){if(e.hp<=0||e.phased)continue;const dx=e.x-player.x,dy=e.y-player.y,L=Math.hypot(dx,dy)||1;if(L>R+e.r)continue;
   hitE(e,dm,"#ffd9a0","revolver",dx/L,dy/L);push(e,dx/L,dy/L,e.type==="boss"?120:420);e.stunT=Math.max(e.stunT,.6*stunRes(e))}
  curW=pw;vfx({type:"ring",x:player.x,y:player.y,r0:14,r1:R,life:.3,max:.3,c:"rgba(230,180,110,.9)",w:6});shake=Math.max(shake,4)}
}
/* 조준 각도: 마우스(데스크톱) / 가장 가까운 적(모바일·키보드) */
function gunAim(){
 const g=player.gun;
 if(mouse.used&&!TOUCH){g.aim=Math.atan2(mWY()-player.y,mWX()-player.x);return true}
 const t=nearest(700);if(t){g.aim=Math.atan2(t.y-player.y,t.x-player.x);return true}
 return false;
}
/* 한 발 (산탄이면 부채꼴로 여러 발) */
function gunShoot(mul,spread,kind){
 const g=player.gun,W_=GW(),sg=W_.k==="sg",n=W_.n+gu("gspr")*(sg?2:1),foc=g.focus>0,dm=gunDmg()*mul*(g.emp>0?1.5:1)*(foc?critM()*1.5:1),a0=g.aim+(spread&&!foc?rand(-spread,spread):0);
 if(g.emp>0)g.emp--;if(foc)g.focus--;
 curW=kind||W_.k==="rev"?(kind||"revolver"):"gun_"+W_.k;
 for(let i=0;i<n;i++){const a=sg?a0+rand(-W_.sp,W_.sp):a0+(i-(n-1)/2)*.11,v=W_.v*(sg?rand(.85,1.1):1),bx=player.x+Math.cos(a)*22,by=player.y-4+Math.sin(a)*22;
  addShot({x:bx,y:by,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:foc?7:W_.k==="rf"?6:sg?4:5,life:W_.lf,damage:dm,kind:"revolver",pierce:W_.pi+gu("gpier")+(foc?3:0),gun:1,bnc:gu("gbnc")+(g.stormT>0&&T("gs_storm")?2:0),foc,kb:W_.kb,rifle:W_.k==="rf"})}
 player.atk=1;player.atkCD=.1;g.flash=.06;
 const wv=gu("gwave");if(wv&&++g.wc%6===0)gunWave(dm*(3+1.5*wv)*(foc?1/(critM()*1.5):1));
 const mx=player.x+Math.cos(g.aim)*26,my=player.y-4+Math.sin(g.aim)*26;
 vfx({type:"light",x:mx,y:my,r:120,life:.08,max:.08,c:"#ffd27a"});
 if(impBudget>0){impBudget--;for(let i=0;i<3;i++){const a=g.aim+rand(-.5,.5),v=rand(120,260);spawnP(mx,my,Math.cos(a)*v,Math.sin(a)*v,rand(.08,.16),rand(1.4,2.2),i?"#ffd27a":"#fff8d8",1,6,0)}}
 kick(-Math.cos(g.aim),-Math.sin(g.aim),W_.k==="rev"?1.6:4);sfx(W_.sfx);if(W_.k!=="rev")shake=Math.max(shake,2.5);
}
/* 레일 충격파: 조준 방향 직선 관통 */
function gunWave(dm){
 const g=player.gun,a=g.aim,L=1100,x2=player.x+Math.cos(a)*L,y2=player.y+Math.sin(a)*L,pw=curW;curW="gun_wave";
 for(const e of enemies){if(e.hp<=0||e.phased)continue;if(seg(e.x,e.y,player.x,player.y,x2,y2)<e.r+30){hitE(e,dm*(e.elite?1+.15*gu("gexe"):1),"#9fe3ff","revolver",Math.cos(a),Math.sin(a));e.markT=Math.max(e.markT,4)}}
 curW=pw;addX({t:"rail",x:player.x,y:player.y-4,a,L,life:.3,max:.3});shake=Math.max(shake,3);sfx("rifle");
}
/* 탄 명중 직전 피해 계산: 공명탄(상태이상 수) · 처형탄(엘리트·보스 추가 피해) */
function gunPre(e,s){
 let d=s.damage;const rs=gu("gres"),ex=gu("gexe");
 if(rs){const n=(e.burnT>0)+(e.chillN>0||e.frozenT>0)+(e.shockT>0)+(e.bleedN>0)+(e.poisonT>0)+(e.markT>0)+(e.curseT>0);if(n)d*=1+n*(.15+.1*rs)}
 if(ex&&e.elite)d*=1+.15*ex;
 return d;
}
/* 리볼버 탄 명중 시 추가 효과 (updateProjectiles에서 호출) */
function gunHit(e,s){
 if(s.foc&&impBudget>0)vfx({type:"ring",x:e.x,y:e.y,r0:4,r1:e.r+16,life:.16,max:.16,c:"rgba(255,80,80,.95)",w:3});
 const xe=gu("gexe");
 if(xe&&!e.elite&&e.hp>0&&e.hp<e.maxHp*(.08+.03*xe)){DMG.gun_exe=(DMG.gun_exe||0)+e.hp;e.hp=0;if(impBudget>0){impBudget--;vfx({type:"slash",x:e.x,y:e.y,a:Math.random()*3.14,life:.2,max:.2})}}
 const ex=gu("gexp"),hl=gu("ghol"),f=gu("gfire"),c=gu("gice"),sh=gu("gshock");
 if(hl)applyStatus(e,"bleed",s.damage*.5);
 if(f)applyStatus(e,"burn",s.damage*(.4+.3*f));
 if(c)for(let i=0;i<c;i++)applyStatus(e,"chill",s.damage);
 if(sh)applyStatus(e,"shock",s.damage);
 if(ex&&burstB>0){burstB--;const R=(42+ex*8)*areaMul(),d=s.damage*(.25+.1*ex),pw=curW;curW="gun_exp";
  for(const q of query(e.x,e.y,R,QD))if(q.hp>0&&q!==e&&d2(q,e)<(R+q.r)**2){dmgTo(q,d);dnum(q,d,"#ffb070",false)}
  curW=pw;vfx({type:"ring",x:e.x,y:e.y,r0:6,r1:R,life:.18,max:.18,c:"rgba(255,170,80,.9)",w:3})}
 // 도탄: 가장 가까운 다른 적에게 튕겨 나감 (피해 85%로 감소)
 if(s.bnc>0){let nx=null,bd=280*280;for(const q of query(e.x,e.y,280,QD)){if(q===e||q.hp<=0||q.phased)continue;const dd=d2(e,q);if(dd<bd){bd=dd;nx=q}}
  if(nx){s.bnc--;s.lastE=e;s.x=e.x;s.y=e.y;const a=Math.atan2(nx.y-e.y,nx.x-e.x),sp=Math.hypot(s.vx,s.vy);s.vx=Math.cos(a)*sp;s.vy=Math.sin(a)*sp;s.life=.6;s.damage*=.85;
   if(impBudget>0){impBudget--;spawnP(e.x,e.y,Math.cos(a)*200,Math.sin(a)*200,.15,1.8,"#fff2c0",1,6,0)}sfx("ping");return true}}
 return false;
}
/* 매 프레임: 재장전 · 연사 · 패닝 · 스킬 쿨다운 · 데드아이 */
function updateGun(dt){
 if(!isGun()||!player.gun)return;
 const g=player.gun,has=gunAim();
 if(Math.cos(g.aim)!==0&&(has||mouse.used))player.face=Math.cos(g.aim)>=0?1:-1;
 g.cd-=dt;g.flash-=dt;if(g.rollBuff>0)g.rollBuff-=dt;if(g.stormT>0)g.stormT-=dt;if(g.swapT>0)g.swapT-=dt;
 for(const s of g.sk)if(s.cd>0)s.cd-=dt;
 // 데드아이: 조준 시간이 지나면 표적 전원에게 확정 치명타
 if(g.dead){g.dead.t-=dt;if(g.dead.t<=0){const lv=g.dead.lv,dm=gunBase()*(8+2*lv)*critM();curW="sk_deadeye";
   for(const e of g.dead.list){if(e.hp<=0)continue;let d;if(T("gs_dead")&&!e.elite){d=e.hp;DMG[curW]=(DMG[curW]||0)+d;e.hp=0;e.hit=.09}else d=dmgTo(e,dm);   // 학살의 눈: 일반 적 즉시 제거 (피해 감소 무시)
   dnum(e,d,"#ff4a4a",true);impact(e.x,e.y,"revolver",e.x-player.x,e.y-player.y);
    vfx({type:"zap",x:player.x,y:player.y-4,x2:e.x,y2:e.y,life:.18,max:.18,c:"#fff2c0"})}
   g.dead=null;g.ammo=gunCyl();g.rl=0;shake=Math.max(shake,8);sfx("fan");kickR(5)}}
 // 재장전
 if(g.rl>0){g.rl-=dt;if(g.rl<=0){g.ammo=gunCyl();sfx("reload")}return}
 const inf=g.stormT>0;
 // 패닝: 남은 탄을 빠르게 난사
 if(fanReq){fanReq=false;if(g.ammo>0&&!g.fanQ){g.fanQ=g.ammo;g.fanT=0}}
 if(g.fanQ>0){g.fanT-=dt;if(g.fanT<=0){g.fanT=.045;g.fanQ--;if(!inf&&!(T("gs_ammo")&&Math.random()<.5))g.ammo--;gunShoot(.9,.28,"fan");if(g.fanQ<=0||g.ammo<=0){g.fanQ=0;if(!inf){g.rl=gunRel();sfx("reload")}}}return}
 // 연사: 누르고 있으면 계속 (모바일/마우스 미사용 시 적이 있으면 자동)
 const want=mouse.used&&!TOUCH?mouse.down:has;
 if(want&&g.cd<=0&&has){g.cd=gunInt();if(!inf&&!(T("gs_ammo")&&Math.random()<.5))g.ammo--;gunShoot(1,.03);if(g.ammo<=0){g.rl=gunRel();sfx("reload")}}
}
/* ── 스킬 ── */
const skCd=s=>GUN_SK[s.k].cd*(1-.08*(s.lv-1))*(player.gun.stormT>0&&s.k!=="storm"?.5:1)*(s.k==="dyna"&&T("gs_dyna")?.5:s.k==="judge"&&T("gs_judge")?.6:1);
function useSkill(i){
 if(!isGun()||!running||paused)return;
 const g=player.gun,s=g.sk[i];if(!s||s.cd>0)return;
 gunAim();const lv=s.lv;s.cd=skCd(s);curW="sk_"+s.k;g.sel=i+1;
 switch(s.k){
  case"deadeye":{
   let list=enemies.filter(e=>e.hp>0&&!e.phased&&onScr(e.x,e.y,0)).sort((a,b)=>b.maxHp-a.maxHp);if(!T("gs_dead"))list=list.slice(0,8+2*lv);
   g.dead={t:.32,list,lv};slowT=.9;timeScale=.3;sfx("sigil_arm");toast("👁️ 데드아이");break}
  case"dyna":{
   const tx=mouse.used&&!TOUCH?mWX():player.x+Math.cos(g.aim)*220,ty=mouse.used&&!TOUCH?mWY():player.y+Math.sin(g.aim)*220;
   const bd=gunBase(),R=(140+20*lv)*areaMul(),n=1+Math.floor(lv/2)+T("gs_dyna")*2;   // Lv.2마다 묶음 +1개
   for(let i=0;i<n;i++){const a=i*2.4,o=i?R*.55:0;addX({t:"dyna",x:player.x,y:player.y,x0:player.x,y0:player.y,tx:tx+Math.cos(a)*o,ty:ty+Math.sin(a)*o,f:-i*.08,R:i?R*.7:R,dm:bd*(6+1.2*lv)*(i?.6:1)})}
   sfx("mine");break}
  case"focus":g.focus=10+2*lv;g.ammo=gunCyl();g.rl=0;toast("🎯 정조준");sfx("sigil_arm");break;
  case"storm":g.stormT=(3+.5*lv)*(T("gs_storm")?2:1);g.ammo=gunCyl();g.rl=0;toast("🔥 난사!");sfx("enrage");break;
  case"judge":{
   const a=g.aim,L=1400,x2=player.x+Math.cos(a)*L,y2=player.y+Math.sin(a)*L,dm=gunBase()*(12+3*lv),wd=T("gs_judge")?80:40;
   for(const e of enemies){if(e.hp<=0||e.phased)continue;if(seg(e.x,e.y,player.x,player.y,x2,y2)<e.r+wd){hitE(e,dm*(T("gs_judge")&&e.type==="boss"?2:1),"#ffe58a","revolver",Math.cos(a),Math.sin(a));e.markT=Math.max(e.markT,6);e.stunT=Math.max(e.stunT,1*stunRes(e))}}
   addX({t:"rail",x:player.x,y:player.y-4,a,L,life:.4,max:.4,gold:1});kick(-Math.cos(a),-Math.sin(a),9);shake=Math.max(shake,8);stopHit(.05);sfx("fan");break}
 }
}
/* ── 전용 성장 선택지 ── */
function gunUpgrade(k){player.gun.u[k]=(player.gun.u[k]||0)+1;if(k==="gcyl")player.gun.ammo+=2;sfx("upgrade")}
function gunSkillAdd(k){player.gun.sk.push({k,lv:1,cd:0});toast(`${GUN_SK[k].i} ${GUN_SK[k].n} 습득! (${player.gun.sk.length}번 키)`);sfx("upgrade")}
function gunChoiceData(){
 const pool=[],g=player.gun;
 for(const k in GUN_UP){const u=GUN_UP[k],lv=gu(k);if(lv>=u.max||(u.ch2&&!ch2On()))continue;
  pool.push({w:u.ch2?(lv?4:3.4):lv?3.6:2.4,own:lv?1:0,icon:u.i,title:`${u.n} Lv.${lv+1}`,tag:u.ch2?"🌌 챕터 2 전용":"🔫 총기 강화",t:lv?"up":"new",desc:u.d,stat:`현재 Lv.${lv} → ${lv+1} (최대 ${u.max})`,fn:()=>gunUpgrade(k)})}
 for(const k in GUN_SK){const s=g.sk.find(x=>x.k===k),S_=GUN_SK[k];
  if(s){if(s.lv<5)pool.push({w:3,own:1,icon:S_.i,title:`${S_.n} Lv.${s.lv+1}`,tag:`스킬 강화 · ${g.sk.indexOf(s)+1}번 키`,t:"combo",desc:S_.d,stat:`재사용 ${skCd({k,lv:s.lv+1}).toFixed(1)}초 · 위력 증가`,fn:()=>{s.lv++;sfx("upgrade")}})}
  else if(g.sk.length<4)pool.push({w:2.2,icon:S_.i,title:`${S_.n} NEW`,tag:`새 스킬 · ${g.sk.length+1}번 키`,t:"combo",desc:S_.d,stat:`재사용 ${S_.cd}초`,fn:()=>gunSkillAdd(k)})}
 const pOpen=pSlots()<MAX_P;
 for(const k of ch2On()?GUN_PAS.concat(["reson","execu","thorns"]):GUN_PAS){const p=passives[k];if(!p||p.level>=p.max||!(p.level>0||pOpen))continue;
  pool.push({w:p.level?2.4:1.2,own:p.level?1:0,icon:p.icon,title:`${p.name} Lv.${p.level+1}`,tag:p.level?"패시브 강화":"새 패시브",t:"pas",desc:p.desc,stat:`현재 ${p.level} → ${p.level+1} (최대 ${p.max})`,fn:()=>passiveUpgrade(k)})}
 // 첫 레벨업에는 스킬 하나를 꼭 보여 줌
 const pick=wpick(pool,choiceN());
 if(!g.sk.length&&!pick.some(x=>x.t==="combo")){const sk=pool.filter(x=>x.t==="combo");if(sk.length)pick[pick.length-1]=wpick(sk,1)[0]}
 if(!pick.length)pick.push({icon:"❤️",title:"휴식",tag:"회복",t:"rest",desc:"모든 강화를 마쳤습니다. HP를 크게 회복합니다.",stat:"HP +50%",fn:()=>{player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.5)}});
 return pick;
}
/* HUD 스킬 바 (0.1초마다, 바뀔 때만 DOM 갱신) */
const SKB=$("skillbar");let skbCache="";
function updateSkillBar(){
 if(isSw()&&running)return swBar();
 if(!isGun()||!player.gun||!running){if(skbCache){skbCache="";SKB.innerHTML="";SKB.style.display="none"}return}
 const g=player.gun,rc=player.dashCD>0?Math.ceil(player.dashCD):0;
 let h=`<button class="skb wpn" data-swap="1"><span class="ic">${GW().i}</span><b>E</b><small>${GW().n}</small></button><div class="ammo">${g.rl>0?"🔄 장전 중":`${GW().i} ${g.stormT>0?"∞":g.ammo}/${gunCyl()}`}${g.focus>0?` · 🎯${g.focus}`:""} · 🌀${rc?rc+"s":"OK"}</div>`;
 h+=`<button class="skb${g.sel===0?" sel":""}" data-fan="1"><span class="ic">🔫</span><b>휠</b><small>패닝</small></button>`;
 g.sk.forEach((s,i)=>{const S_=GUN_SK[s.k],p=s.cd>0?Math.min(1,s.cd/skCd(s)):0;
  h+=`<button class="skb${p?" cd":""}${g.sel===i+1?" sel":""}" data-sk="${i}"><span class="ic">${S_.i}</span><i style="height:${(p*100).toFixed(0)}%"></i><b>${i+1}</b><small>${s.cd>0?Math.ceil(s.cd):"Lv."+s.lv}</small></button>`});
 for(let i=g.sk.length;i<4;i++)h+=`<div class="skb empty"><b>${i+1}</b></div>`;
 if(!TOUCH)h+=`<div class="hint">E 총 교체 · 휠 선택 · 우클릭 사용<br>Space 구르기+재장전</div>`;
 if(h!==skbCache){skbCache=h;SKB.innerHTML=h;SKB.style.display="flex"}
}
SKB.addEventListener("pointerdown",e=>{const b=e.target.closest("[data-sk],[data-fan],[data-swap]");if(!b)return;e.preventDefault();e.stopPropagation();const g=player.gun;if(!g)return;
 if(b.dataset.swap){gunSwap();return}
 g.sel=b.dataset.fan?0:+b.dataset.sk+1;skbCache="";useSelected()});
