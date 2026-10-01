/* ═══════════════ sword.js ═══════════════
   검객 전용: 마우스 조준 근접 베기 (누르고 있으면 연격) · 3연격 콤보 · Space 섬보(무적 대시) + 완벽한 회피(간파) 반격
   휠: 스킬 선택 · 우클릭: 스킬 사용 · E: 궁극기 (Lv.10 특전으로 무기를 진화시키면 해금, 게이지는 공격으로 충전)
   시작 시 도 / 검 / 대검 중 선택 → 특전으로 분기 진화 · 2차 특전에서 궁극기 강화
   (모바일: 가까운 적 자동 조준 + 자동 공격, 스킬 바를 눌러 사용) */
"use strict";
const isSw=()=>selCh==="swordsman";
/* 시작 무기 3종: dm 피해 배율 · it 공격 간격 · R 사거리 · half 베기 반각(라디안) · lunge 전진 거리 · kb 넉백 */
const SWB=[
 {k:"katana",n:"도",i:"刀",dm:1,it:.21,R:96,half:.95,lunge:42,kb:60,c:"#9fdcff",c2:"#ecf8ff",d:"빠른 3연격 · 3타째 섬광 찌르기 (앞으로 돌진 + 짧은 무적)"},
 {k:"sword",n:"검",i:"劍",dm:1.3,it:.3,R:104,half:1.2,lunge:26,kb:120,c:"#ffd36a",c2:"#fff6d8",d:"균형 잡힌 베기 · 3타째 적을 꿰뚫는 검기 발사"},
 {k:"great",n:"대검",i:"大",dm:2.7,it:.58,R:138,half:1.65,lunge:14,kb:300,c:"#ff8a5a",c2:"#ffe2cc",d:"느리지만 넓고 강한 베기 · 휘두르는 동안 받는 피해 -40% · 3타째 지면 강타 (기절)"}
];
/* 1차 특전 (Lv.10): 시작 무기에 따른 진화 분기 3갈래 → 고르면 궁극기 해금 */
const SW_EVO={
 katana:[
  {k:"e_mura",i:"🩸",n:"요도 '무라마사'",c:"#ff4a6a",d:"처치할 때마다 피해 +1% (최대 +60%) · 처치 시 HP +0.5 · 베기에 출혈"},
  {k:"e_rai",i:"⚡",n:"뇌절도 '라이키리'",c:"#ffe14a",d:"베기가 가까운 적 2명에게 번개로 연쇄 (피해 50%) · 감전 부여"},
  {k:"e_dual",i:"🌙",n:"쌍도 '월하'",c:"#c8b8ff",d:"공격속도 +40% · 한 번 휘두를 때 반대 방향으로 한 번 더 벱니다 (피해 60%)"}],
 sword:[
  {k:"e_holy",i:"✨",n:"성검",c:"#fff2a0",d:"모든 베기가 검기를 발사 (피해 70%) · 3타 검기는 2배 크기 · 맞은 적 약화"},
  {k:"e_flame",i:"🔥",n:"염검",c:"#ff7a3a",d:"베기에 화상 · 3타째 폭발 (범위 화상 피해)"},
  {k:"e_frost",i:"❄️",n:"빙검",c:"#9fe8ff",d:"베기에 냉기 2중첩 · 얼어붙은 적을 베면 얼음 파편 폭발"}],
 great:[
  {k:"e_crush",i:"🌋",n:"파쇄자",c:"#ffb070",d:"휘두를 때마다 주변에 충격파 (피해 50%) · 3타 강타 범위 +50%"},
  {k:"e_dark",i:"🖤",n:"흑염 대검",c:"#b070ff",d:"베기에 화상 + 저주 · 준 피해의 일부만큼 HP 회복"},
  {k:"e_giant",i:"🗿",n:"거인의 검",c:"#e8d0a0",d:"사거리 +40% · 넉백 2배 · 맞은 적 0.4초 기절"}]
};
/* 궁극기 (E) */
const SW_ULT={
 katana:{i:"⚡",n:"천섬(千閃)",d:"무적 상태로 화면의 강한 적부터 순간이동하며 12번 벱니다 (1회 2500%)"},
 sword:{i:"🗡️",n:"만검귀종(萬劍歸宗)",d:"2초 동안 하늘에서 검 30자루가 적에게 꽂힙니다 (1자루 600% 범위) · 시전 중 1초 무적"},
 great:{i:"🌋",n:"대지 가르기",d:"뛰어올라 내려찍어 넓은 범위에 3000% 피해 + 2초 기절 · 시전 중 무적"}
};
/* 2차 특전 (Lv.20): 궁극기 강화 */
const SW_UEN={
 katana:[
  {k:"u_k1",i:"♾️",n:"무한 섬광",d:"천섬 베기 횟수 2배 (12 → 24)"},
  {k:"u_k2",i:"🔁",n:"발도 귀환",d:"궁극기 게이지 충전 2배 · 사용 후 게이지 30% 돌려받음"},
  {k:"u_k3",i:"🌠",n:"종언의 일섬",d:"천섬 마지막에 화면 전체를 가르는 일섬 (5000%)"}],
 sword:[
  {k:"u_s1",i:"⚔️",n:"만검",d:"떨어지는 검 2배 (30 → 60)"},
  {k:"u_s2",i:"🛡️",n:"검의 성역",d:"시전 내내 무적 · 끝난 뒤 3초간 받는 피해 -70% · 게이지 40% 돌려받음"},
  {k:"u_s3",i:"🩸",n:"성흔",d:"검의 범위 +50% · 맞은 적에게 출혈 + 약화 · 일반 적은 HP 15% 이하면 처형"}],
 great:[
  {k:"u_g1",i:"💥",n:"여진",d:"내려찍은 뒤 여진 3번 (각 50%)"},
  {k:"u_g2",i:"🏔️",n:"거신의 일격",d:"범위 +60% · 피해 ×1.5"},
  {k:"u_g3",i:"🔥",n:"대지의 분노",d:"내려찍은 자리에 불길 · 이후 5초간 받는 피해 -70%"}]
};
/* Lv.30 이후 공통 특전 */
const SW_GEN=[
 {k:"sw_gale",i:"💨",n:"질풍",d:"섬보(Space) 재사용 대기 50% 감소"},
 {k:"sw_read",i:"👁️",n:"간파의 달인",d:"완벽한 회피 반격 피해 ×1.8 → ×2.5 · 반격 지속 +1초"},
 {k:"sw_dance",i:"💃",n:"검무",d:"공격속도 +25%"},
 {k:"sw_rev",i:"🕊️",n:"불굴",d:"즉시 부활 횟수 +1"},
 {k:"sw_sage",i:"🧘",n:"검성",d:"모든 스킬 재사용 대기 -35%"},
 {k:"sw_zen",i:"🌊",n:"명경지수",d:"궁극기 게이지 충전 +60%"}
];
TAL.swordsman=[...SW_EVO.katana,...SW_EVO.sword,...SW_EVO.great,...SW_UEN.katana,...SW_UEN.sword,...SW_UEN.great,...SW_GEN];
/* 레벨업 강화 */
const SW_UP={
 sdmg:{i:"🗡️",n:"날 벼리기",max:8,d:"검 피해 +20% (베기 · 검기 · 스킬 · 궁극기 포함)"},
 sspd:{i:"⚡",n:"연격",max:6,d:"공격 간격 -10%"},
 srng:{i:"📏",n:"긴 칼날",max:4,d:"베기 사거리 +15% · 베기 각도 +8%"},
 sdash:{i:"💨",n:"섬보 숙련",max:4,d:"섬보(Space) 재사용 대기 -12%"},
 sghost:{i:"👥",n:"잔상 베기",max:3,d:"섬보로 지나간 길에 잔상이 남아 벱니다 (피해 150%+50%/Lv)"},
 scrit:{i:"🎯",n:"일격필살",max:5,d:"치명타 확률 +6% · 치명타 피해 +20%"},
 swave:{i:"🌙",n:"검기",max:4,d:"3타째 검기 발사 (검은 검기 피해 +25%/Lv)"},
 svamp:{i:"🩸",n:"흡혈검",max:3,d:"벨 때마다 HP 회복 (+0.3/Lv)"},
 scounter:{i:"🛡️",n:"간파 숙련",max:3,d:"완벽한 회피 반격 지속 +0.7초 · 궁극기 게이지 +5"},
 sbleed:{i:"💉",n:"혈참",max:3,d:"베기에 출혈 부여"},
 sfire:{i:"🔥",n:"화염 부여",max:3,d:"베기에 화상 부여 (Lv당 위력 증가)"},
 sice:{i:"❄️",n:"서리 부여",max:3,d:"베기에 냉기 부여 (5중첩 빙결)"},
 sshock:{i:"🌩️",n:"뇌전 부여",max:3,d:"베기에 감전 부여 → 전류 전이"},
 smast:{i:"🏅",n:"검객의 숙련",max:10,ch2:1,d:"검 피해 +12% (챕터 2 전용)"}
};
/* 스킬 (휠 선택 + 우클릭 / 숫자키) */
const SW_SK={
 dash:{i:"🌪️",n:"질풍참",cd:5,d:"조준 방향으로 260px 돌진하며 지나간 적을 벱니다 (400%+80%/Lv) · 돌진 중 무적"},
 whirl:{i:"🌀",n:"회전 베기",cd:9,d:"(1+0.15×Lv)초간 회전하며 주변을 계속 벱니다 (틱당 60%+10%/Lv) · 회전 중 무적"},
 wave:{i:"🌙",n:"검기 난무",cd:7,d:"부채꼴로 검기 (7+Lv)개 발사 (각 150%+30%/Lv, 관통)"},
 parry:{i:"🛡️",n:"반격 자세",cd:6,d:"0.7초간 무적 자세 · 그동안 공격받으면 주변을 크게 반격 (800%+150%/Lv, 1초 기절)"},
 flash:{i:"⚔️",n:"일섬",cd:11,d:"잠깐 숨을 고른 뒤 380px 앞으로 순간이동하며 일직선을 가릅니다 (1200%+250%/Lv) · 시전 중 무적"}
};
const swu=k=>(player.sw&&player.sw.u[k])||0;
const SWW=()=>SWB[player.sw?player.sw.wp:0];
const swEvoC=()=>{const s=player.sw;if(!s||!s.evo)return SWW().c;for(const b in SW_EVO)for(const e of SW_EVO[b])if(e.k===s.evo)return e.c;return SWW().c};
const swBase=()=>{const s=player.sw;return 30*(1+swu("sdmg")*.2)*(1+swu("smast")*.12)*bounty()*dmgMul()*(s&&s.ctr>0?(T("sw_read")?2.5:1.8):1)*(T("e_mura")?1+Math.min(.6,(s.kills||0)*.01):1)};
const swInt=()=>SWW().it*(1-swu("sspd")*.1)*rateMul()*(T("e_dual")?.6:1)*(T("sw_dance")?.75:1);
const swR=()=>SWW().R*(1+swu("srng")*.15)*(T("e_giant")?1.4:1);
const swHalf=()=>SWW().half*(1+swu("srng")*.08);
const swSkCd=s=>SW_SK[s.k].cd*(1-.08*(s.lv-1))*(T("sw_sage")?.65:1);
const swGain=()=>(T("sw_zen")?1.6:1)*(T("u_k2")?2:1);
function swInit(){player.sw={wp:0,u:{},sk:[],sel:0,cd:0,combo:0,comboT:0,aim:0,bladeA:0,swing:0,swDir:1,ult:0,ultOn:false,evo:null,ue:null,ctr:0,pdCD:0,armorT:0,act:null,kills:0,mv:null,dashFrom:null,echo:null,picked:false}}
/* ── 시작 무기 선택 (판 시작 시) ── */
function swChooseStart(){
 paused=true;clearPtr();const lu=$("levelup"),box=$("choices");box.innerHTML="";lu.classList.add("talent");
 const h=lu.querySelector("h2"),sub=lu.querySelector(".sub");h.textContent="⚔️ 무기를 고르세요";sub.textContent="이번 판에 쓸 검 · Lv.10 특전에서 이 무기가 진화하고 궁극기(E)가 열립니다 · 숫자 키로 선택";
 $("ownedL").innerHTML="";$("reroll").style.display="none";$("skipL").style.display="none";gridCls(box,3);
 SWB.forEach((w,i)=>{const b=document.createElement("div");b.className="choice t-combo tal swpick";
  b.innerHTML=`<div class="icon swk" style="color:${w.c}">${w.i}</div><b>${w.n}</b><span class="tag">궁극기: ${SW_ULT[w.k].i} ${SW_ULT[w.k].n}</span><p>${w.d}</p><div class="stat">피해 ×${w.dm} · 간격 ${w.it}초 · 사거리 ${w.R}</div>`;
  b.onmouseenter=()=>sfx("ui");
  b.onclick=()=>{player.sw.wp=i;player.sw.picked=true;lu.classList.remove("talent");h.textContent="✨ 능력을 선택하세요";sub.textContent="원소가 다른 무기를 모으면 원소 반응이 일어납니다 · 숫자 키로 선택";$("skipL").style.display="";
   $("levelup").style.display="none";paused=false;last=performance.now();toast(`${w.i} ${w.n} 장착`);sfx("upgrade");lvFx();skbS=""};
  box.appendChild(b)});
 show("levelup");
}
/* ── 조준 ── */
function swAim(){
 const s=player.sw;
 if(mouse.used&&!TOUCH){s.aim=Math.atan2(mWY()-player.y,mWX()-player.x);return true}
 const t=nearest(420);if(t){s.aim=Math.atan2(t.y-player.y,t.x-player.x);return true}
 return false;
}
const angD=(a,b)=>{let d=a-b;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return Math.abs(d)};
/* ── 베기 이펙트 (자체 배열) ── */
const SWFX=[],SWX=[];
function swSlashFx(x,y,a,R,half,c,side,big){SWFX.push({t:"arc",x,y,a,R,half,c,side,big,life:big?.26:.18,max:big?.26:.18})}
function swLineFx(x,y,x2,y2,w,c){SWFX.push({t:"line",x,y,x2,y2,w,c,life:.3,max:.3})}
/* ── 한 대 맞히기 ── */
function swHit(e,dm,ux,uy,noKb){
 if(e.hp<=0||e.phased)return 0;const s=player.sw,W=SWW();
 const d=hitE(e,dm,swEvoC(),"swd",ux,uy);
 if(!noKb&&e.type!=="boss")push(e,ux,uy,W.kb*(T("e_giant")?2:1)*(e.elite?.4:1));
 if(swu("sbleed")||T("e_mura"))applyStatus(e,"bleed",dm*(.3+.15*swu("sbleed")));
 if(swu("sfire")||T("e_flame")||T("e_dark"))applyStatus(e,"burn",dm*(.35+.25*swu("sfire")));
 const ic=swu("sice")+(T("e_frost")?2:0);if(ic){if(T("e_frost")&&e.frozenT>0&&burstB>0){burstB--;const pw=curW;curW="sw_frost";areaHit(e.x,e.y,80*areaMul(),dm*.6,"#dff8ff","chill",dm);curW=pw}for(let i=0;i<Math.min(3,ic);i++)applyStatus(e,"chill",dm)}
 if(swu("sshock")||T("e_rai"))applyStatus(e,"shock",dm);
 if(T("e_dark"))applyStatus(e,"curse",dm);
 if(T("e_holy"))e.markT=Math.max(e.markT,3);
 if(T("e_giant"))e.stunT=Math.max(e.stunT,.4*stunRes(e));
 if(swu("svamp"))heal(.3*swu("svamp"),true);
 if(T("e_dark"))heal(Math.min(1.5,d*.004),true);
 if(T("e_rai")&&burstB>0&&Math.random()<.6){burstB--;let c=0;const pw=curW;curW="sw_rai";
  for(const q of query(e.x,e.y,170,QD)){if(c>=2)break;if(q===e||q.hp<=0||q.phased)continue;c++;hitE(q,dm*.5,"#ffe14a","bolt",0,0);vfx({type:"zap",x:e.x,y:e.y,x2:q.x,y2:q.y,life:.15,max:.15,c:"#ffe14a"})}curW=pw}
 if(e.hp<=0){s.kills=(s.kills||0)+1;if(!(curW||"").startsWith("su_"))s.ult=Math.min(100,s.ult+.8*swGain());if(T("e_mura"))heal(.5,true)}   // 궁극기로 잡은 적은 게이지 충전 안 함
 return d;
}
/* 부채꼴 판정: 반환 = 맞힌 수 */
function swArc(x,y,a,R,half,dm,kind){
 const pw=curW;curW=kind;let n=0;
 for(const e of query(x,y,R+40,QD)){if(e.hp<=0||e.phased)continue;const dx=e.x-x,dy=e.y-y,L=Math.hypot(dx,dy);if(L>R+e.r)continue;
  if(L>e.r&&angD(Math.atan2(dy,dx),a)>half+Math.atan2(e.r,L))continue;swHit(e,dm,dx/(L||1),dy/(L||1));n++}
 curW=pw;return n;
}
/* 직선 판정 (찌르기 · 일섬 · 돌진) */
function swLine(x1,y1,x2,y2,w,dm,kind,fn){
 const pw=curW;curW=kind;let n=0;const L=Math.hypot(x2-x1,y2-y1)||1,ux=(x2-x1)/L,uy=(y2-y1)/L;
 for(const e of enemies){if(e.hp<=0||e.phased)continue;if(seg(e.x,e.y,x1,y1,x2,y2)<e.r+w){swHit(e,dm,ux,uy,true);if(fn)fn(e);n++}}
 curW=pw;return n;
}
function swWave(a,dm,big,kind){
 const W=SWW(),v=640;
 const pw=curW;curW=kind||"sw_wave";
 addShot({x:player.x+Math.cos(a)*24,y:player.y-4+Math.sin(a)*24,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:big?24:15,life:.7,damage:dm,kind:"swave",pierce:8,sw:1,col:swEvoC()});
 curW=pw;
}
function swShotHit(e,s){if(T("e_holy"))e.markT=Math.max(e.markT,3);if(swu("svamp"))heal(.15*swu("svamp"),true);player.sw.ult=Math.min(100,player.sw.ult+.3*swGain())}
/* ── 기본 베기 (3연격) ── */
function swSwing(){
 const s=player.sw,W=SWW(),a=s.aim;
 s.combo=s.comboT>0?(s.combo+1)%3:0;s.comboT=.9;s.cd=swInt();s.swing=W.k==="great"?.3:.17;s.swDir=-s.swDir;s.swA0=a;
 const third=s.combo===2,dm=swBase()*W.dm*(third?1.4:1),R=swR()*(third&&W.k==="great"?1.1:1),half=swHalf();
 // 전진 (lunge)
 const lg=W.lunge*(third&&W.k==="katana"?2.6:1);s.mv={vx:Math.cos(a)*lg/.08,vy:Math.sin(a)*lg/.08,t:.08};
 const n=swArc(player.x,player.y,a,R,half,dm,third?"sw_slash3":"sw_slash");
 swSlashFx(player.x,player.y,a,R,half,swEvoC(),s.swDir,third);
 if(T("e_dual"))s.echo={t:.07,a,R,half,dm:dm*.6};
 if(T("e_crush")){const pw=curW;curW="sw_crush";areaHit(player.x,player.y,R*1.15*areaMul(),dm*.5,"#ffb070");curW=pw;vfx({type:"ring",x:player.x,y:player.y,r0:20,r1:R*1.15*areaMul(),life:.25,max:.25,c:"rgba(255,170,100,.7)",w:4})}
 if(T("e_holy"))swWave(a,dm*.7,false,"sw_wave");
 if(third){
  if(W.k==="katana"){ // 섬광 찌르기: 돌진 + 직선 관통 + 짧은 무적
   player.invT=Math.max(player.invT,.2);const L=150;swLine(player.x,player.y,player.x+Math.cos(a)*L,player.y+Math.sin(a)*L,26,dm*1.6,"sw_thrust");
   swLineFx(player.x,player.y,player.x+Math.cos(a)*L,player.y+Math.sin(a)*L,10,swEvoC());stopHit(.035)}
  else if(W.k==="sword"){swWave(a,dm*1.2*(1+swu("swave")*.25),T("e_holy"),"sw_wave")}
  else{ // 지면 강타
   const RR=150*areaMul()*(T("e_crush")?1.5:1),pw=curW;curW="sw_slam";
   for(const e of query(player.x,player.y,RR,QD)){if(e.hp<=0||e.phased||d2(e,player)>(RR+e.r)**2)continue;swHit(e,dm*1.8,0,0,true);e.stunT=Math.max(e.stunT,.5*stunRes(e))}
   curW=pw;vfx({type:"ring",x:player.x,y:player.y,r0:20,r1:RR,life:.35,max:.35,c:"rgba(255,160,90,.95)",w:8});shake=Math.max(shake,8);stopHit(.05);sfx("quake")}
  if(swu("swave")&&W.k!=="sword")swWave(a,dm*(.6+.2*swu("swave")),false,"sw_wave");
  if(T("e_flame")&&burstB>0){burstB--;const ex=player.x+Math.cos(a)*R*.7,ey=player.y+Math.sin(a)*R*.7,pw=curW;curW="sw_flame";areaHit(ex,ey,120*areaMul(),dm,"#ff8a3a","burn",dm);curW=pw;
   vfx({type:"ring",x:ex,y:ey,r0:10,r1:120*areaMul(),life:.3,max:.3,c:"rgba(255,140,60,.95)",w:6});vfx({type:"light",x:ex,y:ey,r:200,life:.25,max:.25,c:"#ff8a3a"})}
 }
 s.ult=Math.min(100,s.ult+Math.min(n,6)*.9*swGain());
 player.atk=1;player.atkCD=.1;sfx(W.k==="great"?"quake":"scythe");if(n&&third)shake=Math.max(shake,3);
}
/* ── Space: 섬보 (무적 대시) ── */
function swDash(){
 const s=player.sw;if(!s||!running||paused||player.dashCD>0||s.act)return;
 const a=player.moving?player.aim:s.aim;player.dashT=.26*(T("sw_read")?1.5:1);player.dashCD=1.4*(1-.12*swu("sdash"))*(T("sw_gale")?.5:1);player.dvx=Math.cos(a);player.dvy=Math.sin(a);
 s.dashFrom={x:player.x,y:player.y};sfx("dash_p");
 vfx({type:"ring",x:player.x,y:player.y,r0:8,r1:40,life:.22,max:.22,c:"rgba(170,220,255,.85)",w:3});
}
/* 완벽한 회피(간파): 섬보 중에 공격이 닿으면 시간 감속 + 반격 버프. hurt()가 먼저 호출 → true면 피해 무시 */
function swPre(){
 const s=player.sw;if(!s)return false;
 if(s.act&&(s.act.inv||s.act.k==="parry")){if(s.act.k==="parry"&&!s.act.done)swCounter();return true}
 if(player.dashT>0&&s.pdCD<=0){s.pdCD=1;s.ctr=2+.7*swu("scounter")+(T("sw_read")?1:0);player.dashCD=Math.min(player.dashCD,.5);   // 간파 시 섬보 재사용 대기를 0.5초로 (무한 무적 방지)
  s.ult=Math.min(100,s.ult+5*(1+swu("scounter")*.2)*swGain());
  slowT=.35;timeScale=.35;vfx({type:"txt",x:player.x,y:player.y-40,t:"간파!",life:.7,max:.7,c:"#bfe6ff",sz:20});vfx({type:"ring",x:player.x,y:player.y,r0:10,r1:90,life:.3,max:.3,c:"rgba(190,230,255,.95)",w:4});sfx("sigil_arm");return true}
 return false;
}
const swArmor=()=>{const s=player.sw;if(!s)return 1;let m=1;if(SWW().k==="great"&&(s.swing>0||s.act))m*=.6;if(s.armorT>0)m*=.3;return m};
function swCounter(){
 const s=player.sw,lv=s.act.lv;s.act.done=true;s.act.t=Math.min(s.act.t,.12);
 const R=200*areaMul(),dm=swBase()*(8+1.5*lv),pw=curW;curW="ss_parry";
 for(const e of query(player.x,player.y,R,QD)){if(e.hp<=0||e.phased||d2(e,player)>(R+e.r)**2)continue;const L=dist(e,player)||1;swHit(e,dm,(e.x-player.x)/L,(e.y-player.y)/L);e.stunT=Math.max(e.stunT,1*stunRes(e))}
 curW=pw;player.dashCD=0;s.ctr=Math.max(s.ctr,1.5);
 for(let i=0;i<4;i++)swSlashFx(player.x,player.y,i*1.57,R*.9,.8,"#bfe6ff",i&1?1:-1,true);
 vfx({type:"txt",x:player.x,y:player.y-40,t:"반격!",life:.7,max:.7,c:"#ffe58a",sz:20});shake=Math.max(shake,9);stopHit(.06);sfx("shield_break");
}
/* ── 스킬 ── */
function useSwSkill(i){
 if(!isSw()||!running||paused)return;
 const s=player.sw,k=s.sk[i];if(!k||k.cd>0||s.act)return;
 swAim();const lv=k.lv,a=s.aim;k.cd=swSkCd(k);s.sel=i;skbS="";
 switch(k.k){
  case"dash":{const L=260,x0=player.x,y0=player.y;s.mv={vx:Math.cos(a)*L/.15,vy:Math.sin(a)*L/.15,t:.15};player.invT=Math.max(player.invT,.35);
   swLine(x0,y0,x0+Math.cos(a)*L,y0+Math.sin(a)*L,40,swBase()*(4+.8*lv),"ss_dash");swLineFx(x0,y0,x0+Math.cos(a)*L,y0+Math.sin(a)*L,14,swEvoC());sfx("dash_p");sfx("scythe");shake=Math.max(shake,4);break}
  case"whirl":s.act={k:"whirl",t:1+.15*lv,tk:0,lv,inv:1};sfx("enrage");break;
  case"wave":{const n=7+lv;for(let j=0;j<n;j++)swWave(a+(j-(n-1)/2)*.17,swBase()*(1.5+.3*lv),false,"ss_wave");sfx("scythe");break}
  case"parry":s.act={k:"parry",t:.7,lv,done:false};vfx({type:"ring",x:player.x,y:player.y,r0:30,r1:24,life:.7,max:.7,c:"rgba(190,230,255,.9)",w:3});sfx("shield");break;
  case"flash":s.act={k:"flash",t:.22,lv,a,inv:1};slowT=.25;timeScale=.4;sfx("sigil_arm");break;
 }
}
/* ── 궁극기 (E) ── */
function swUlt(){
 const s=player.sw;if(!isSw()||!s||!running||paused||s.act)return;
 if(!s.ultOn){toast("⚔️ 궁극기는 Lv.10 특전에서 무기를 진화시키면 열립니다");return}
 if(s.ult<100){toast(`궁극기 충전 중 ${Math.floor(s.ult)}%`);return}
 const W=SWW();s.ult=T("u_k2")?30:T("u_s2")?40:0;swAim();
 if(W.k==="katana"){const n=T("u_k1")?24:12,list=enemies.filter(e=>e.hp>0&&!e.phased&&onScr(e.x,e.y,0)).sort((a,b)=>b.maxHp-a.maxHp);
  s.act={k:"u_k",t:n*.065+.35,n,list,i:0,tk:0,inv:1};slowT=.2;timeScale=.4}
 else if(W.k==="sword"){const n=T("u_s1")?60:30;s.act={k:"u_s",t:2,n,fired:0,tk:0,inv:1,invT:T("u_s2")?2:1}}
 else s.act={k:"u_g",t:.55,ph:0,aft:0,inv:1};
 vfx({type:"txt",x:player.x,y:player.y-46,t:SW_ULT[W.k].n,life:1,max:1,c:"#ffe58a",sz:22});stinger("evo");shake=Math.max(shake,6);skbS="";
}
function swGreatSlam(mul){
 const R=380*areaMul()*(T("u_g2")?1.6:1)*mul,dm=swBase()*30*(T("u_g2")?1.5:1)*(mul<1?.5:1),pw=curW;curW="su_great";
 for(const e of query(player.x,player.y,R,QD)){if(e.hp<=0||e.phased||d2(e,player)>(R+e.r)**2)continue;swHit(e,dm,0,0,true);e.stunT=Math.max(e.stunT,2*stunRes(e))}
 curW=pw;vfx({type:"ring",x:player.x,y:player.y,r0:30,r1:R,life:.5,max:.5,c:"rgba(255,170,90,.95)",w:12});vfx({type:"ring",x:player.x,y:player.y,r0:10,r1:R*.6,life:.35,max:.35,c:"rgba(255,240,200,.9)",w:6});
 vfx({type:"light",x:player.x,y:player.y,r:R*1.5,life:.4,max:.4,c:"#ff9a4a"});shake=Math.max(shake,mul<1?8:18);stopHit(mul<1?.03:.08);sfx("quake");sfx("bomb");
}
/* ── 매 프레임 ── */
function updateSword(dt){
 if(!isSw()||!player.sw)return;
 const s=player.sw,W=SWW();
 if(!s.picked)return;
 const has=swAim();if(has||mouse.used)player.face=Math.cos(s.aim)>=0?1:-1;
 s.cd-=dt;s.comboT-=dt;s.pdCD-=dt;if(s.ctr>0)s.ctr-=dt;if(s.armorT>0)s.armorT-=dt;if(s.swing>0)s.swing-=dt;
 for(const k of s.sk)if(k.cd>0)k.cd-=dt;
 // 칼날 각도 (그리기용): 휘두르는 중이면 반원을 쓸고, 아니면 조준 방향
 if(s.swing>0){const p=1-s.swing/(W.k==="great"?.3:.17);s.bladeA=s.swA0+s.swDir*swHalf()*(1-2*p)}else if(s.act&&s.act.k==="whirl")s.bladeA+=dt*28;else s.bladeA=s.aim;
 // 전진 이동
 if(s.mv){const k=Math.min(dt,s.mv.t);player.x+=s.mv.vx*k;player.y+=s.mv.vy*k;s.mv.t-=dt;if(s.mv.t<=0)s.mv=null}
 // 쌍도: 반대 방향 한 번 더
 if(s.echo){s.echo.t-=dt;if(s.echo.t<=0){const e=s.echo;s.echo=null;swArc(player.x,player.y,e.a,e.R,e.half,e.dm,"sw_dual");swSlashFx(player.x,player.y,e.a,e.R*.95,e.half,"#c8b8ff",-s.swDir,false)}}
 // 잔상 베기: 섬보가 끝나면 지나간 길을 벰
 if(s.dashFrom&&player.dashT<=0){const f=s.dashFrom;s.dashFrom=null;const g=swu("sghost");
  if(g){swLine(f.x,f.y,player.x,player.y,32,swBase()*(1.5+.5*g),"sw_ghost");swLineFx(f.x,f.y,player.x,player.y,8,"#bfe6ff")}}
 // 진행 중인 동작 (스킬 · 궁극기)
 if(s.act){const A=s.act;A.t-=dt;
  if(A.k==="whirl"){A.tk-=dt;if(A.tk<=0){A.tk=.12;const R=swR()*1.25;swArc(player.x,player.y,0,R,Math.PI,swBase()*(.6+.1*A.lv)*W.dm,"ss_whirl");swSlashFx(player.x,player.y,s.bladeA,R,1.4,swEvoC(),1,false);sfx("scythe")}}
  else if(A.k==="flash"&&A.t<=0){const L=380,x0=player.x,y0=player.y,x1=x0+Math.cos(A.a)*L,y1=y0+Math.sin(A.a)*L;
   swLine(x0,y0,x1,y1,50,swBase()*(12+2.5*A.lv),"ss_flash",e=>{e.markT=Math.max(e.markT,5)});player.x=x1;player.y=y1;player.invT=Math.max(player.invT,.3);
   swLineFx(x0,y0,x1,y1,20,"#ffffff");swLineFx(x0,y0,x1,y1,36,swEvoC());shake=Math.max(shake,10);stopHit(.07);sfx("fan")}
  else if(A.k==="u_k"){A.tk-=dt;while(A.tk<=0&&A.i<A.n){A.tk+=.065;
    let e=null;while(A.list.length&&!e){const c=A.list[A.i%A.list.length];if(c&&c.hp>0)e=c;else A.list.splice(A.i%A.list.length,1)}
    if(!e){const q=nearest(500);if(q)e=q}
    A.i++;if(!e)continue;const a=Math.atan2(e.y-player.y,e.x-player.x),x0=player.x,y0=player.y;player.x=e.x-Math.cos(a)*28;player.y=e.y-Math.sin(a)*28;
    const pw=curW;curW="su_katana";swHit(e,swBase()*25,Math.cos(a),Math.sin(a),true);for(const q of query(e.x,e.y,70,QD))if(q!==e&&q.hp>0&&!q.phased&&d2(q,e)<4900)swHit(q,swBase()*10,0,0,true);curW=pw;
    swLineFx(x0,y0,player.x,player.y,6,"#ffffff");swSlashFx(e.x,e.y,a+1.57,60,.9,swEvoC(),A.i&1?1:-1,true);sfx("scythe");shake=Math.max(shake,4)}
   if(A.t<=0&&T("u_k3")){const pw=curW;curW="su_katana";for(const e of enemies)if(e.hp>0&&!e.phased&&onScr(e.x,e.y,0))swHit(e,swBase()*50,1,0,true);curW=pw;
    SWFX.push({t:"screen",life:.45,max:.45,c:swEvoC()});shake=Math.max(shake,16);stopHit(.09);sfx("fan");sfx("bomb")}}
  else if(A.k==="u_s"){A.tk-=dt;const per=2/A.n;while(A.tk<=0&&A.fired<A.n){A.tk+=per;A.fired++;
    const on=enemies.filter(e=>e.hp>0&&!e.phased&&onScr(e.x,e.y,0));const e=on.length?on[Math.floor(Math.random()*on.length)]:null;
    const tx=e?e.x+rand(-14,14):player.x+rand(-300,300),ty=e?e.y+rand(-14,14):player.y+rand(-200,200);
    SWX.push({x:tx,y:ty,t:.28,max:.28,R:60*(T("u_s3")?1.5:1)*areaMul(),dm:swBase()*6})}
   if(A.t<=2-A.invT)A.inv=0;if(A.t<=0&&T("u_s2"))s.armorT=Math.max(s.armorT,3)}
  else if(A.k==="u_g"){
   if(A.ph===0&&A.t<=0){A.ph=1;swGreatSlam(1);if(T("u_g3")){s.armorT=5;for(let i=0;i<10;i++){const a=i/10*6.283,r=rand(80,260);effects.push({type:"cloud",st:"burn",fire:true,x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r,life:4,max:4,radius:46*areaMul(),dps:swBase()*.8,tk:0,dm:swBase(),w:"su_great"})}}
    if(T("u_g1")){A.aft=3;A.t=.4}else A.t=.15}
   else if(A.ph===1&&A.t<=0&&A.aft>0){A.aft--;swGreatSlam(.6);A.t=A.aft>0?.4:.1}
  }
  if(A.t<=0&&!(A.k==="u_g"&&(A.ph===0||A.aft>0)))s.act=null;
  return;
 }
 // 기본 베기: 누르고 있으면 연격 (모바일/마우스 미사용: 가까운 적이 있으면 자동)
 const near=nearest(swR()+90);
 const want=mouse.used&&!TOUCH?mouse.down:!!near;
 if(want&&s.cd<=0)swSwing();
}
/* 떨어지는 검(만검귀종) 처리 · 베기 이펙트 수명 */
function updateSwordFx(dt){
 for(let i=SWFX.length-1;i>=0;i--){SWFX[i].life-=dt;if(SWFX[i].life<=0)SWFX.splice(i,1)}
 for(let i=SWX.length-1;i>=0;i--){const o=SWX[i];o.t-=dt;if(o.t<=0){SWX.splice(i,1);const pw=curW;curW="su_sword";
  for(const e of query(o.x,o.y,o.R,QD)){if(e.hp<=0||e.phased||d2(e,o)>(o.R+e.r)**2)continue;
   if(T("u_s3")&&!e.elite&&e.hp<e.maxHp*.15){DMG.su_sword=(DMG.su_sword||0)+e.hp;e.hp=0;continue}
   swHit(e,o.dm,0,0,true);if(T("u_s3")){applyStatus(e,"bleed",o.dm*.3);e.markT=Math.max(e.markT,4)}}
  curW=pw;vfx({type:"ring",x:o.x,y:o.y,r0:6,r1:o.R,life:.25,max:.25,c:"rgba(255,240,180,.9)",w:4});if(impBudget>0){impBudget--;burst(o.x,o.y,4,"#fff4c8")}}}
}
/* ── 그리기 (renderer의 그리기 순서에서 호출) ── */
function drawSwordFx(){
 if(!SWFX.length&&!SWX.length)return;
 ctx.save();ctx.lineCap="round";
 for(const f of SWFX){const p=1-f.life/f.max,k=f.life/f.max;
  if(f.t==="arc"){const a0=f.a-f.half,a1=f.a+f.half,R=f.R*(.85+.15*p);
   ctx.globalAlpha=k*.22;ctx.fillStyle=f.c;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.arc(f.x,f.y,R,a0,a1);ctx.closePath();ctx.fill();
   ctx.globalAlpha=k*.95;ctx.strokeStyle=f.c;ctx.lineWidth=(f.big?14:9)*k+2;ctx.beginPath();ctx.arc(f.x,f.y,R,f.side>0?a0+(a1-a0)*p*.5:a0,f.side>0?a1:a1-(a1-a0)*p*.5);ctx.stroke();
   ctx.strokeStyle="#ffffff";ctx.lineWidth=2.4*k+.6;ctx.beginPath();ctx.arc(f.x,f.y,R+1,a0+(a1-a0)*.15,a1-(a1-a0)*.15);ctx.stroke()}
  else if(f.t==="line"){ctx.globalAlpha=k;ctx.strokeStyle=f.c;ctx.lineWidth=f.w*k+1;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x2,f.y2);ctx.stroke();
   ctx.strokeStyle="#ffffff";ctx.lineWidth=Math.max(1,f.w*.25*k);ctx.stroke()}
  else if(f.t==="screen"){ctx.save();ctx.setTransform(D,0,0,D,0,0);ctx.globalAlpha=k*.8;ctx.fillStyle="#ffffff";ctx.fillRect(0,H/2-6*k-1,W,12*k+2);ctx.globalAlpha=k*.25;ctx.fillStyle=f.c;ctx.fillRect(0,0,W,H);ctx.restore()}
 }
 for(const o of SWX){const p=1-o.t/o.max,h=(1-p)*260;
  ctx.globalAlpha=.35+.4*p;ctx.strokeStyle="rgba(255,240,180,.8)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(o.x,o.y,o.R*p,o.R*p*.4,0,0,7);ctx.stroke();
  ctx.globalAlpha=1;ctx.save();ctx.translate(o.x,o.y-h);ctx.fillStyle="#f4f6ff";ctx.beginPath();ctx.moveTo(-3,-34);ctx.lineTo(3,-34);ctx.lineTo(3,-4);ctx.lineTo(0,4);ctx.lineTo(-3,-4);ctx.closePath();ctx.fill();
  ctx.fillStyle="#ffd36a";ctx.fillRect(-8,-38,16,3);ctx.fillStyle="#6a4426";ctx.fillRect(-2,-48,4,10);ctx.globalAlpha=.5;ctx.fillStyle="rgba(255,240,180,.6)";ctx.fillRect(-1,-34-40,2,40);ctx.restore()}
 ctx.restore();ctx.globalAlpha=1;
 // 반격 자세 / 반격 버프 / 궁극기 준비 표시
 const s=player.sw;if(!s)return;
 if(s.act&&s.act.k==="parry"&&!s.act.done){ctx.strokeStyle=`rgba(190,230,255,${.5+.4*Math.sin(elapsed*30)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,30,0,7);ctx.stroke()}
 if(s.ctr>0){ctx.strokeStyle=`rgba(255,230,140,${Math.min(.8,s.ctr*.4)})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(player.x,player.y,24+Math.sin(elapsed*12)*2,0,7);ctx.stroke()}
 if(s.ultOn&&s.ult>=100){ctx.globalCompositeOperation="lighter";ctx.globalAlpha=.25+.15*Math.sin(elapsed*6);ctx.drawImage(glowSpr(swEvoC()),player.x-46,player.y-50,92,92);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"}
}
/* 검기 탄 그리기 */
function drawSwave(s){const a=Math.atan2(s.vy,s.vx);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.globalCompositeOperation="lighter";
 ctx.strokeStyle=s.col||"#ffe08a";ctx.globalAlpha=.85;ctx.lineWidth=s.r*.45;ctx.lineCap="round";ctx.beginPath();ctx.arc(-s.r*.6,0,s.r,-1.1,1.1);ctx.stroke();
 ctx.strokeStyle="#ffffff";ctx.lineWidth=s.r*.15;ctx.beginPath();ctx.arc(-s.r*.55,0,s.r,-.9,.9);ctx.stroke();ctx.restore()}
/* ── 전용 성장 선택지 ── */
function swUpgrade(k){player.sw.u[k]=(player.sw.u[k]||0)+1;sfx("upgrade")}
function swSkillAdd(k){player.sw.sk.push({k,lv:1,cd:0});toast(`${SW_SK[k].i} ${SW_SK[k].n} 습득! (${player.sw.sk.length}번 키 · 휠로 선택)`);sfx("upgrade");skbS=""}
function swChoiceData(){
 const pool=[],s=player.sw;
 for(const k in SW_UP){const u=SW_UP[k],lv=swu(k);if(lv>=u.max||(u.ch2&&!ch2On()))continue;
  pool.push({w:u.ch2?(lv?4:3.4):lv?3.6:2.4,own:lv?1:0,icon:u.i,title:`${u.n} Lv.${lv+1}`,tag:u.ch2?"🌌 챕터 2 전용":"⚔️ 검 강화",t:lv?"up":"new",desc:u.d,stat:`현재 Lv.${lv} → ${lv+1} (최대 ${u.max})`,fn:()=>swUpgrade(k)})}
 for(const k in SW_SK){const q=s.sk.find(x=>x.k===k),S_=SW_SK[k];
  if(q){if(q.lv<5)pool.push({w:3,own:1,icon:S_.i,title:`${S_.n} Lv.${q.lv+1}`,tag:`스킬 강화 · ${s.sk.indexOf(q)+1}번 키`,t:"combo",desc:S_.d,stat:`재사용 ${swSkCd({k,lv:q.lv+1}).toFixed(1)}초 · 위력 증가`,fn:()=>{q.lv++;sfx("upgrade")}})}
  else if(s.sk.length<4)pool.push({w:2.2,icon:S_.i,title:`${S_.n} NEW`,tag:`새 스킬 · ${s.sk.length+1}번 키`,t:"combo",desc:S_.d,stat:`재사용 ${S_.cd}초`,fn:()=>swSkillAdd(k)})}
 const pOpen=pSlots()<MAX_P;
 for(const k of ch2On()?GUN_PAS.concat(["reson","execu","thorns"]):GUN_PAS){const p=passives[k];if(!p||p.level>=p.max||!(p.level>0||pOpen))continue;
  pool.push({w:p.level?2.4:1.2,own:p.level?1:0,icon:p.icon,title:`${p.name} Lv.${p.level+1}`,tag:p.level?"패시브 강화":"새 패시브",t:"pas",desc:p.desc,stat:`현재 ${p.level} → ${p.level+1} (최대 ${p.max})`,fn:()=>passiveUpgrade(k)})}
 const pick=wpick(pool,choiceN());
 if(!s.sk.length&&!pick.some(x=>x.t==="combo")){const sk=pool.filter(x=>x.t==="combo");if(sk.length)pick[pick.length-1]=wpick(sk,1)[0]}
 if(!pick.length)pick.push({icon:"❤️",title:"휴식",tag:"회복",t:"rest",desc:"모든 강화를 마쳤습니다. HP를 크게 회복합니다.",stat:"HP +50%",fn:()=>{player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.5)}});
 return pick;
}
/* 특전 순서: 1차 = 시작 무기의 진화 분기 → 2차 = 궁극기 강화 → 이후 공통 */
function swTalPool(){const s=player.sw,b=SWW().k;if(!s.evo)return SW_EVO[b];if(!s.ue)return SW_UEN[b];return SW_GEN.filter(t=>!T(t.k))}
function swTalApply(k){
 const s=player.sw,b=SWW().k;
 if(SW_EVO[b].some(t=>t.k===k)){s.evo=k;s.ultOn=true;s.ult=Math.max(s.ult,50);const U=SW_ULT[b];setTimeout(()=>toast(`${U.i} 궁극기 '${U.n}' 해금! E키로 발동`),900)}
 else if(SW_UEN[b].some(t=>t.k===k))s.ue=k;
 if(k==="sw_rev")player.revives++;
 skbS="";
}
/* 보유 강화 아이콘 (선택창 · HUD) */
function swIcons(cls){const s=player.sw;let h=`<span class="${cls}" title="${SWW().n}${s.evo?" → 진화":""}" style="color:${swEvoC()}">${SWW().i}</span>`;
 for(const k in SW_UP)if(s.u[k])h+=`<span class="${cls}" title="${SW_UP[k].n} Lv.${s.u[k]}">${SW_UP[k].i}<i>${s.u[k]}</i></span>`;
 s.sk.forEach((q,i)=>{h+=`<span class="${cls} cb" title="${i+1}번 키: ${SW_SK[q.k].n} Lv.${q.lv}">${SW_SK[q.k].i}<i>${q.lv}</i></span>`});return h}
/* HUD 스킬 바 */
let skbS="";
function swBar(){
 const s=player.sw;if(!s){SKB.style.display="none";return}
 const rc=player.dashCD>0?Math.ceil(player.dashCD*10)/10:0,U=SW_ULT[SWW().k],up=Math.min(1,s.ult/100);
 let h=`<button class="skb wpn ult${s.ultOn&&up>=1?" ready":""}" data-ult="1"><span class="ic">${s.ultOn?U.i:"🔒"}</span><i style="height:${((1-up)*100).toFixed(0)}%"></i><b>E</b><small>${s.ultOn?Math.floor(s.ult)+"%":"Lv10"}</small></button>`;
 h+=`<div class="ammo" style="color:${swEvoC()}">${SWW().i} ${SWW().n}${s.ctr>0?" · ⚡반격":""} · 💨${rc?rc.toFixed(1)+"s":"OK"}</div>`;
 s.sk.forEach((q,i)=>{const S_=SW_SK[q.k],p=q.cd>0?Math.min(1,q.cd/swSkCd(q)):0;
  h+=`<button class="skb${p?" cd":""}${s.sel===i?" sel":""}" data-ssk="${i}"><span class="ic">${S_.i}</span><i style="height:${(p*100).toFixed(0)}%"></i><b>${i+1}</b><small>${q.cd>0?Math.ceil(q.cd):"Lv."+q.lv}</small></button>`});
 for(let i=s.sk.length;i<4;i++)h+=`<div class="skb empty"><b>${i+1}</b></div>`;
 if(!TOUCH)h+=`<div class="hint">휠 선택 · 우클릭 스킬 · E 궁극기<br>Space 섬보 (회피 성공 시 반격)</div>`;
 if(h!==skbS){skbS=h;SKB.innerHTML=h;SKB.style.display="flex"}
}
SKB.addEventListener("pointerdown",e=>{if(!isSw()||!player.sw)return;const b=e.target.closest("[data-ssk],[data-ult]");if(!b)return;e.preventDefault();e.stopPropagation();
 if(b.dataset.ult)swUlt();else{const i=+b.dataset.ssk;if(TOUCH||player.sw.sel===i)useSwSkill(i);else{player.sw.sel=i;skbS=""}}});
/* 휠: 스킬 선택 · 우클릭: 선택 스킬 사용 (gun.js의 입력과 같은 방식) */
addEventListener("wheel",e=>{
 if(!running||paused||!isSw()||!player.sw)return;e.preventDefault();
 const s=player.sw,n=s.sk.length;if(!n)return;s.sel=((s.sel+(e.deltaY>0?1:-1))%n+n)%n;sfx("ui");skbS="";
},{passive:false});
canvas.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button===2&&running&&!paused&&isSw()&&player.sw)useSwSkill(player.sw.sel)});
