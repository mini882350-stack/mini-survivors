/* ═══════════════ adv_ui.js ═══════════════
   모험 모드 (BETA) 인터페이스: HUD · 캐릭터 선택/생성 · 가방/능력치/스킬/퀘스트 · NPC(퀘스트/상점/대장간/현자) · 지도 · 메뉴 */
"use strict";
(function(){
 const d=document.createElement("div");d.id="adv";d.innerHTML=`
 <div id="aTop"><div id="aName"></div><div id="aGold"></div><div id="aZone"></div>
  <div id="aBtns"><button data-ui="bag" title="가방 (I)">🎒</button><button data-ui="stat" title="능력치 (C)">👤<i id="aPts"></i></button><button data-ui="skill" title="스킬 (K)">✨</button><button data-ui="quest" title="퀘스트 (J)">📜</button><button data-ui="recall" title="귀환 (B)">🌀</button><button data-ui="menu" title="메뉴 (Esc)">☰</button></div></div>
 <div id="aQuest"></div>
 <div id="aBoss"><b id="aBossN"></b><div class="abar"><i id="aBossHp"></i></div></div>
 <div id="aPrompt"></div>
 <div id="aBottom">
  <div id="aBars"><div class="abar hp"><i id="aHp"></i><span id="aHpT"></span></div><div class="abar mp"><i id="aMp"></i><span id="aMpT"></span></div></div>
  <div id="aSkills"></div>
  <div class="abar xp"><i id="aXp"></i><span id="aXpT"></span></div>
 </div>
 <div id="aMob"><button id="aRoll">🌀</button><button id="aAtk">⚔️</button><button id="aUse">💬</button></div>
 <div id="aPanel"><div class="apbox"></div></div>`;
 document.body.appendChild(d);
})();
const AE={root:$("adv"),name:$("aName"),gold:$("aGold"),zone:$("aZone"),pts:$("aPts"),quest:$("aQuest"),boss:$("aBoss"),bossN:$("aBossN"),bossHp:$("aBossHp"),prompt:$("aPrompt"),
 hp:$("aHp"),hpT:$("aHpT"),mp:$("aMp"),mpT:$("aMpT"),xp:$("aXp"),xpT:$("aXpT"),sk:$("aSkills"),panel:$("aPanel"),box:document.querySelector("#aPanel .apbox"),use:$("aUse")};
ADV.panel=null;ADV.sel=null;ADV.tab="bag";ADV.shopTab="buy";ADV.delArm=-1;
const advPanelOpen=()=>!!ADV.panel;
/* ── 모드 진입 / 종료 ── */
function advEnter(){
 sfxInit();ADV.on=true;ADV.prevSt=selSt;running=false;paused=false;hideAll();clearMove();
 document.body.classList.add("advmode");AE.root.style.display="block";
 ADV.play=false;ADV.c=null;ADV.map="town";const M=AMAP.town;if(chunkStage!==M.look){chunks.clear();chunkStage=M.look}selSt=M.look;ADV.walls.length=0;ADV.mons.length=0;ADV.drops.length=0;ADV.projs.length=0;ADV.zones.length=0;
 advSetSong();advOpen("select");
}
function advExit(){
 if(ADV.play)advSaveNow();ADV.on=false;ADV.play=false;ADV.panel=null;AE.panel.style.display="none";
 document.body.classList.remove("advmode");AE.root.style.display="none";
 selSt=ADV.prevSt||0;chunks.clear();chunkStage=-1;pN=0;nN=0;canvas.style.cursor="";
 showTitle();draw();
}
function advStart(i){
 const c=advMem[i];if(!c)return;ADV.slot=i;ADV.c=c;
 c.pot=c.pot||{hp:0,mp:0};c.boss=c.boss||{};c.bar=c.bar||[null,null,null,null];
 ADV.cd={};ADV.buf={};ADV.dead=false;ADV.bossT={};ADV.shopStock=null;ADV.recall=0;
 const p=ADV.p;Object.assign(p,{dash:null,spin:null,flurry:null,roll:0,rollCD:0,inv:1,flash:0,lastHit:9});
 advCalc();p.hp=Math.min(c.hp||9999,ADV.st.maxHp);p.mp=Math.min(c.mp||9999,ADV.st.maxMp);
 ADV.play=true;advClose();advGoMap("town","load");
 toast(`🗡️ ${c.name} — WASD 이동 · 클릭 공격 · 1~4 스킬 · E 대화`);
 canvas.style.cursor=TOUCH?"":"crosshair";
}
/* ── HUD ── */
let advHudT=0;
function advHud(raw){
 advHudT-=raw;if(advHudT>0)return;advHudT=.08;
 const on=ADV.play;AE.root.classList.toggle("play",on);AE.root.classList.toggle("touch",TOUCH);
 if(!on)return;
 const c=ADV.c,p=ADV.p,s=ADV.st,M=AMAP[ADV.map];
 txt(AE.name,`${AJOB[c.job].i} ${c.name} · Lv.${c.lv}`);txt(AE.gold,`💰 ${c.gold.toLocaleString()}`);txt(AE.zone,M.n);
 txt(AE.pts,c.pts>0?String(c.pts):"");
 wid(AE.hp,p.hp/s.maxHp);txt(AE.hpT,`${Math.ceil(p.hp)} / ${s.maxHp}`);wid(AE.mp,p.mp/s.maxMp);txt(AE.mpT,`${Math.floor(p.mp)} / ${s.maxMp}`);
 const nd=aNeed(c.lv);wid(AE.xp,c.lv>=AMAX_LV?1:c.xp/nd);txt(AE.xpT,c.lv>=AMAX_LV?"MAX":`EXP ${Math.floor(c.xp/nd*1000)/10}%`);
 // 스킬 바
 let h="";for(let i=0;i<4;i++){const id=c.bar[i],S=id&&ASK[id],cd=id?Math.max(0,ADV.cd[id]||0):0,mx=id?S.cd*(1-.04*((c.sk[id]||1)-1))*(1-s.cdr):1;
  h+=`<button class="ask${!id?" empty":""}${id&&p.mp<S.mp?" nomp":""}" data-sk="${i}"><span class="ic">${S?S.i:"·"}</span><b>${i+1}</b>${cd>0?`<i class="cdv" style="--p:${(cd/mx*100).toFixed(0)}%"></i><em>${cd.toFixed(cd<1?1:0)}</em>`:""}${S?`<small>${c.sk[id]>1?"Lv"+c.sk[id]:""}</small>`:""}</button>`}
 h+=`<button class="ask pot" data-pot="hp"><span class="ic">❤️</span><b>Q</b><small>${c.pot.hp}</small></button><button class="ask pot" data-pot="mp"><span class="ic">💙</span><b>R</b><small>${c.pot.mp}</small></button>`;
 if(AE.sk._h!==h){AE.sk._h=h;AE.sk.innerHTML=h}
 // 퀘스트 추적
 const Q=AQUEST[c.q];let qh="";
 if(Q){qh=c.qs===0?`<b>📜 새 퀘스트</b><p>마을의 촌장 바르토에게 말을 거세요</p>`:c.qs===2?`<b>✅ ${Q.n}</b><p>촌장에게 보고하세요</p>`:`<b>📜 ${Q.n}</b><p>${Q.d}</p><p class="qp">${Math.min(c.qp,Q.n2)} / ${Q.n2}</p>`}
 else qh=`<b>🏆 베타 퀘스트 완료!</b><p>자유롭게 사냥하며 장비를 모아 보세요</p>`;
 if(AE.quest._h!==qh){AE.quest._h=qh;AE.quest.innerHTML=qh}
 // 보스 바
 const b=ADV.boss,bon=!!(b&&!b.dead&&(b.st==="chase"||Math.hypot(b.x-p.x,b.y-p.y)<700));
 AE.boss.style.display=bon?"block":"none";if(bon){txt(AE.bossN,`👑 ${b.D.n} · Lv.${b.lv}${b.hp<b.max*.4?" · 분노":""}`);wid(AE.bossHp,b.hp/b.max)}
 // 상호작용 안내
 const n=ADV.near,pr=n&&!ADV.dead?`<b>${TOUCH?"💬 버튼":"E"}</b> ${n.k==="portal"?"차원문 — 사냥터 선택":n.k==="exit"?"마을로 돌아가기":n.n+"와(과) 대화"}`:ADV.recall>0?`🌀 귀환 중… ${Math.max(0,3-ADV.recall).toFixed(1)}초`:"";
 if(AE.prompt._h!==pr){AE.prompt._h=pr;AE.prompt.innerHTML=pr;AE.prompt.style.display=pr?"block":"none"}
 AE.use.style.visibility=n?"visible":"hidden";
}
AE.root.addEventListener("click",e=>{
 const t=e.target.closest("[data-sk],[data-pot],[data-ui]");if(!t||!ADV.play)return;
 if(t.dataset.sk!==undefined)advSkill(+t.dataset.sk);else if(t.dataset.pot)advPot(t.dataset.pot);
 else{const u=t.dataset.ui;sfx("ui");if(u==="menu")advOpen("menu");else if(u==="recall")advRecall();else advOpen("char",u)}
});
/* 모바일 버튼 */
(()=>{const a=$("aAtk"),on=v=>e=>{e.preventDefault();ADV.touchAtk=v};a.addEventListener("pointerdown",on(true));a.addEventListener("pointerup",on(false));a.addEventListener("pointercancel",on(false));a.addEventListener("pointerleave",on(false));
 $("aRoll").addEventListener("pointerdown",e=>{e.preventDefault();advDodge()});$("aUse").addEventListener("pointerdown",e=>{e.preventDefault();advInteract()})})();
/* ── 패널 ── */
function advOpen(kind,arg){
 if(ADV.dead&&kind!=="dead")return;
 ADV.panel=kind;ADV.arg=arg;ADV.paused=true;ADV.sel=null;ADV.delArm=-1;ADV.touchAtk=false;mouse.down=false;clearPtr();
 if(kind==="char"&&arg)ADV.tab=arg;
 AE.panel.style.display="flex";advRender();
}
function advClose(){
 if(ADV.panel==="select"||ADV.panel==="create"||ADV.panel==="dead")return;
 ADV.panel=null;ADV.paused=false;AE.panel.style.display="none";last=performance.now();if(ADV.dirty)advSaveNow();
}
function advForceClose(){ADV.panel=null;ADV.paused=false;AE.panel.style.display="none"}
const APORT={};
function advPortrait(look,key){
 if(APORT[key])return APORT[key];const c=mkCanvas(128,128),g=c.getContext("2d");g.translate(62,86);g.scale(2.2,2.2);ctx=g;
 try{g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.ellipse(0,16,14,4.5,0,0,7);g.fill();drawHero(look,.8,0,0,0)}finally{ctx=MAINCTX}
 try{APORT[key]=c.toDataURL()}catch(e){APORT[key]=""}return APORT[key];
}
const fmtA=(k,v)=>AAFF[k].p?`+${(v*100).toFixed(1)}% ${AAFF[k].n}`:`+${v} ${AAFF[k].n}`;
function itemIcon(it){return it.s==="book"?ASK[it.sk].i:it.s==="weapon"?AWEP[it.w].i:ASLOT[it.s].i}
function itemCell(it,a,k,sel){if(!it)return`<div class="aic empty" data-a="${a}" data-k="${k}"></div>`;const R=ARAR[it.r];
 return`<div class="aic${sel?" sel":""}" data-a="${a}" data-k="${k}" style="--rc:${R.c}"><span>${itemIcon(it)}</span>${it.enh?`<b>+${it.enh}</b>`:""}${it.s!=="book"&&ADV.c&&ADV.c.lv<it.req?`<i class="lk">🔒</i>`:""}</div>`}
function itemInfo(it,cmp){
 const R=ARAR[it.r],c=ADV.c;
 if(it.s==="book"){const S=ASK[it.sk],lv=c.sk[it.sk]||0;return`<div class="ainfo" style="--rc:${R.c}"><h4>${S.i} ${it.n}</h4><div class="am">${AJOB[S.c].n} 스킬서</div><p>${S.d}</p><p class="ad">${S.c!==c.job?"❌ 다른 직업의 스킬서 (판매 가능)":lv>=ASK_MAXLV?"이미 최고 레벨":lv?`읽으면 Lv.${lv} → Lv.${lv+1}`:"읽으면 새로 배웁니다"}</p><div class="am">판매가 💰${itemPrice(it)}</div></div>`}
 let h=`<div class="ainfo" style="--rc:${R.c}"><h4>${itemIcon(it)} ${it.n}${it.enh?` <span class="enh">+${it.enh}</span>`:""}</h4><div class="am">${R.n} ${it.s==="weapon"?AWEP[it.w].n:ASLOT[it.s].n} · 아이템 Lv.${it.ilv} · <span class="${c.lv<it.req?"bad":""}">요구 Lv.${it.req}</span></div>`;
 if(it.dmg)h+=`<div class="amain">⚔️ 피해 ${Math.round(it.dmg[0]*enhMul(it))} ~ ${Math.round(it.dmg[1]*enhMul(it))}</div>`;
 if(it.def)h+=`<div class="amain">🛡️ 방어 ${Math.round(it.def*enhMul(it))}</div>`;
 for(const[k,v]of it.aff)h+=`<div class="aaf">${fmtA(k,v)}</div>`;
 const why=advCanEquip(it);if(why)h+=`<div class="bad">❌ ${why}</div>`;
 if(cmp&&!why){const eq=Object.assign({},c.eq);eq[it.s]=it;const a=ADV.st.power,b=advCalcFor(eq).power,dlt=b-a;
  h+=`<div class="acmp ${dlt>0?"up":dlt<0?"down":""}">장착 시 전투력 ${dlt>0?"▲ +":dlt<0?"▼ ":""}${dlt} (${a} → ${b})</div>`}
 h+=`<div class="am">판매가 💰${itemPrice(it)}</div></div>`;return h;
}
function advRender(){
 const k=ADV.panel,c=ADV.c,b=AE.box;let h="";
 b.className="apbox "+k;
 switch(k){
  case"select":{
   h=`<h2>🗡️ 모험 모드 <span class="beta">BETA</span></h2><div class="asub">서바이버와는 전혀 다른 RPG 모드 — 직접 싸우고, 장비를 파밍하고, 성장하세요</div><div class="aslots">`;
   for(let i=0;i<3;i++){const s=advMem[i];
    h+=s?`<div class="aslot"><img src="${advPortrait(AJOB[s.job].look,s.job)}" alt=""><div><b>${s.name}</b><p>${AJOB[s.job].i} ${AJOB[s.job].n} · Lv.${s.lv}<br>💰 ${s.gold.toLocaleString()} · 퀘스트 ${Math.min(s.q,AQUEST.length)}/${AQUEST.length}</p></div>
     <div class="abtn"><button data-a="play" data-k="${i}">▶ 시작</button><button class="alt" data-a="del" data-k="${i}">${ADV.delArm===i?"정말 삭제?":"삭제"}</button></div></div>`
     :`<div class="aslot empty" data-a="new" data-k="${i}"><div class="plus">＋</div><div><b>빈 슬롯</b><p>새 캐릭터 만들기</p></div></div>`}
   h+=`</div><div class="ahelp">WASD 이동 · 마우스 조준 · 클릭(누르고 있기) 기본 공격 · 1~4 스킬 (우클릭 = 1번) · Space 구르기 · Q/R 물약 · E 대화 · I 가방 · C 능력치 · K 스킬 · B 귀환</div>
    <div class="abtn c"><button class="alt" data-a="exit">← 서바이버 모드로</button></div>`;break}
  case"create":{
   const j=ADV.newJob||"warrior";
   h=`<h2>새 캐릭터</h2><div class="ajobs">${Object.keys(AJOB).map(k=>{const J=AJOB[k];return`<div class="ajob${k===j?" sel":""}" data-a="job" data-k="${k}"><img src="${advPortrait(J.look,k)}" alt=""><b>${J.i} ${J.n}</b><p>${J.d}</p>
    <div class="ast">HP ${J.hp} · MP ${J.mp} · 주 능력치 ${STAT_N[J.main]}</div><div class="ask0">시작 스킬: ${ASK[ASK_START[k]].i} ${ASK[ASK_START[k]].n}</div></div>`}).join("")}</div>
    <div class="aname">이름 <input id="aNameIn" maxlength="10" value="${ADV.newName||AJOB[j].n}" autocomplete="off"></div>
    <div class="abtn c"><button data-a="make">⚔️ 모험 시작</button><button class="alt" data-a="back">취소</button></div>`;break}
  case"char":{
   const tabs=[["bag","🎒 가방"],["stat","👤 능력치"+(c.pts?` <i class="dot">${c.pts}</i>`:"")],["skill","✨ 스킬"],["quest","📜 퀘스트"]];
   h=`<div class="atabs">${tabs.map(([t,n])=>`<button data-a="tab" data-k="${t}" class="${ADV.tab===t?"on":""}">${n}</button>`).join("")}<button class="x" data-a="close">✕</button></div>`;
   h+=advTab(ADV.tab);break}
  case"npc":{const n=ANPC.find(x=>x.k===ADV.arg);h=advNpc(n);break}
  case"map":{
   h=`<h2>⛩️ 차원문</h2><div class="asub">이동할 사냥터를 고르세요</div><div class="amaps">`;
   for(const k of AMAP_ORDER){const M=AMAP[k],lk=M.req&&!c.boss[M.req];
    h+=`<div class="amap${lk?" lock":""}" data-a="${lk?"":"go"}" data-k="${k}"><b>${M.n}</b><p>${M.d}</p>${lk?`<div class="bad">🔒 ${AMON[M.req].n} 처치 시 개방</div>`:c.boss[M.boss]?`<div class="ok">👑 보스 처치 ${c.boss[M.boss]}회</div>`:""}</div>`}
   h+=`</div><div class="abtn c"><button class="alt" data-a="close">닫기</button></div>`;break}
  case"menu":h=`<h2>☰ 메뉴</h2><div class="abtn col"><button data-a="close">▶ 계속하기</button><button class="alt" data-a="mute">${muted?"🔇 소리 켜기":"🔊 소리 끄기"}</button><button class="alt" data-a="toSel">💾 저장 후 캐릭터 선택</button><button class="alt" data-a="exit">💾 저장 후 서바이버 모드로</button></div>
   <div class="ahelp">WASD 이동 · 마우스 조준 · 클릭(누르고 있기) 기본 공격 · 1~4 스킬 (우클릭 = 1번) · Space 구르기(무적) · Q 생명 물약 · R 마나 물약 · E 대화/차원문 · I 가방 · C 능력치 · K 스킬 · J 퀘스트 · B 귀환 주문(3초)<br>모바일: 화면을 끌어 이동 · ⚔️ 누르고 있기 공격 (가까운 적 자동 조준)</div>
   <div class="asub">BETA 버전 — 진행 상황은 이 브라우저에 자동 저장됩니다 (서바이버 저장 코드에는 포함되지 않음)</div>`;break;
  case"dead":h=`<h2>💀 쓰러졌습니다</h2><div class="asub">마을에서 다시 일어납니다. 골드 10%를 잃습니다.</div><div class="abtn c"><button data-a="revive">🏘️ 마을에서 부활</button></div>`;break;
 }
 b.innerHTML=h;
 const ni=$("aNameIn");if(ni){ni.oninput=()=>{ADV.newName=ni.value};ni.onkeydown=e=>{if(e.key==="Enter")advMake();e.stopPropagation()}}
}
function advTab(t){
 const c=ADV.c,s=ADV.st;let h="";
 if(t==="bag"){
  const sel=ADV.sel;
  h+=`<div class="abag"><div class="aeq"><div class="apow">전투력 <b>${s.power.toLocaleString()}</b></div><div class="aeqg">${ASLOTS.map(sl=>`<div class="aeqs"><small>${ASLOT[sl].n}</small>${itemCell(c.eq[sl],"eq",sl,sel&&sel.f==="eq"&&sel.k===sl)}</div>`).join("")}</div>
   <div class="apots">❤️ 생명 물약 ${c.pot.hp} · 💙 마나 물약 ${c.pot.mp} · 💰 ${c.gold.toLocaleString()}</div></div>
   <div class="agrid">${Array.from({length:AMAX_BAG},(_,i)=>itemCell(c.bag[i],"bag",i,sel&&sel.f==="bag"&&sel.k===i)).join("")}</div>
   <div class="adet">${advSelInfo()}</div></div>
   <div class="abtn c"><button class="alt" data-a="sort">정렬</button></div>`;
 }else if(t==="stat"){
  h+=`<div class="astat"><div class="apts">남은 능력치 포인트 <b>${c.pts}</b> <small>(레벨업마다 +5 · 주 능력치는 자동 +1)</small></div>`;
  for(const k of["str","dex","int","vit"])h+=`<div class="asr"><b>${STAT_N[k]}</b><span class="v">${c.st[k]}${s[k]!==c.st[k]?` <em>(+${s[k]-c.st[k]})</em>`:""}</span><small>${STAT_D[k]}</small>${c.pts?`<button data-a="pt" data-k="${k}">+1</button><button class="alt" data-a="pt5" data-k="${k}">+5</button>`:""}</div>`;
  const rows=[["⚔️ 공격력",`${Math.round(s.dmin)} ~ ${Math.round(s.dmax)}`],["❤️ 최대 HP",s.maxHp],["💙 최대 MP",s.maxMp],["🛡️ 방어",`${s.def} (받는 피해 -${Math.round(s.def/(100+s.def)*100)}%)`],["🎯 치명타",`${(s.crit*100).toFixed(1)}% · ×${s.critd.toFixed(2)}`],
   ["⚡ 공격 속도",`+${Math.round((s.aspd-1)*100)}%`],["👟 이동 속도",`+${Math.round((s.ms-1)*100)}%`],["✨ 스킬 피해",`+${Math.round((s.sdmg-1)*100)}%`],["⏱️ 재사용 감소",`${Math.round(s.cdr*100)}%`],["🩸 생명력 흡수",`${(s.ls*100).toFixed(1)}%`],["💗 HP 회복",`${s.hpreg.toFixed(1)}/초`],["💰 골드 획득",`+${Math.round((s.gold-1)*100)}%`]];
  h+=`<div class="aderiv">${rows.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join("")}</div><div class="apow">전투력 <b>${s.power.toLocaleString()}</b> · 처치 ${c.kills.toLocaleString()} · 플레이 ${fmt(c.time)}</div></div>`;
 }else if(t==="skill"){
  h+=`<div class="asub">스킬서를 읽으면 배우거나 강화(최대 Lv.${ASK_MAXLV})합니다 · 스킬서는 몬스터·보스 드롭 또는 마을의 현자 엘린에게서 구할 수 있습니다</div><div class="askl">`;
  for(const id of askOf(c.job)){const S=ASK[id],lv=c.sk[id]||0,slot=c.bar.indexOf(id);
   h+=`<div class="askr${lv?"":" lock"}"><div class="ic">${S.i}</div><div class="dd"><b>${S.n} ${lv?`<em>Lv.${lv}</em>`:"<em class='bad'>미습득</em>"}</b><p>${S.d}</p><small>MP ${S.mp} · 재사용 ${S.cd}초${lv>1?` · 피해 +${(lv-1)*20}%`:""}</small></div>
    <div class="asl">${lv?[0,1,2,3].map(i=>`<button class="${slot===i?"on":"alt"}" data-a="bind" data-k="${id}" data-i="${i}">${i+1}</button>`).join(""):""}</div></div>`}
  h+=`</div>`;
 }else if(t==="quest"){
  const Q=AQUEST[c.q];
  h+=`<div class="aq">${Q?`<h3>${c.qs===2?"✅":"📜"} ${Q.n}</h3><p>${Q.d}</p><p>${c.qs===0?"아직 받지 않음 — 마을의 촌장에게 말을 거세요":`진행: <b>${Math.min(c.qp,Q.n2)} / ${Q.n2}</b>${c.qs===2?" — 촌장에게 보고하세요":""}`}</p><p class="am">보상: ${rewardTxt(Q.r)}</p>`:`<h3>🏆 모든 베타 퀘스트 완료</h3><p>오우거 족장까지 쓰러뜨렸습니다! 계속 사냥하며 전설 장비를 노려 보세요.</p>`}
   <h4>완료한 퀘스트</h4>${AQUEST.slice(0,c.q).map(q=>`<div class="ok">✔ ${q.n}</div>`).join("")||"<div class='am'>없음</div>"}
   <h4>보스 처치 기록</h4>${["b_chief","b_king","b_ogre"].map(b=>`<div>${AMON[b].n}: ${c.boss[b]||0}회</div>`).join("")}</div>`;
 }
 return h;
}
const rewardTxt=r=>[r.gold&&`💰 ${r.gold}`,r.xp&&`EXP ${r.xp}`,r.pot&&`물약 ${r.pot}개`,r.item&&`${ARAR[r.item].n} 장비`,r.book&&"스킬서"].filter(Boolean).join(" · ");
function advSelItem(){const s=ADV.sel,c=ADV.c;if(!s)return null;if(s.f==="bag")return c.bag[s.k];if(s.f==="eq")return c.eq[s.k];if(s.f==="shop")return ADV.shopStock[s.k];return null}
function advSelInfo(){
 const it=advSelItem(),s=ADV.sel;if(!it)return`<div class="am">아이템을 눌러 정보를 보세요</div>`;
 let h=itemInfo(it,s.f!=="eq");
 const panel=ADV.panel;
 if(panel==="char"){
  if(s.f==="bag")h+=`<div class="abtn">${it.s==="book"?`<button data-a="read">📖 읽기</button>`:`<button data-a="equip">장착</button>`}<button class="alt" data-a="drop">${ADV.delArm===999?"정말 버리기?":"버리기"}</button></div>`;
  else h+=`<div class="abtn"><button class="alt" data-a="uneq">장착 해제</button></div>`;
 }else if(panel==="npc"&&ADV.arg==="shop"){
  if(s.f==="shop")h+=`<div class="abtn"><button data-a="buy">💰 ${itemPrice(it)*4} 구매</button></div>`;
  else if(s.f==="bag")h+=`<div class="abtn"><button data-a="sell">💰 ${itemPrice(it)} 판매</button>${it.s!=="book"?`<button class="alt" data-a="equip">장착</button>`:""}</div>`;
 }else if(panel==="npc"&&ADV.arg==="smith"&&it.s!=="book"){
  const e=it.enh||0;if(e>=10)h+=`<div class="ok">최대 강화 (+10)</div>`;
  else{const cost=enhCost(it),ch=ENH_CH[e];h+=`<div class="aenh">+${e} → <b>+${e+1}</b> · 성공 확률 ${Math.round(ch*100)}% · 실패해도 장비는 사라지지 않음<br>${it.dmg?"피해":"방어"} +8% 증가</div><div class="abtn"><button data-a="enh"${ADV.c.gold<cost?" disabled":""}>🔨 강화 (💰${cost})</button></div>`}
 }
 return h;
}
const ENH_CH=[1,1,.95,.85,.75,.65,.55,.45,.35,.25];
const enhCost=it=>Math.round((40+it.ilv*18)*(1+(it.enh||0)*.6)*(1+it.r*.2));
const sagePrice=(id,lv)=>{const i=askOf(ASK[id].c).indexOf(id);return lv?Math.round(260*lv*(1+i*.25)):300+i*180};
function advNpc(n){
 const c=ADV.c;let h=`<div class="anpc"><img src="${advPortrait(n.look,"npc_"+n.k)}" alt=""><div><h2>${n.n}</h2><p class="line">“${n.line}”</p></div><button class="x" data-a="close">✕</button></div>`;
 if(n.role==="quest"){const Q=AQUEST[c.q];
  if(!Q)h+=`<div class="aq"><h3>🏆 고맙네, 영웅이여!</h3><p>자네 덕분에 마을이 평화를 되찾았네. (베타 콘텐츠를 모두 완료했습니다 — 정식 버전에서 이야기가 이어집니다)</p></div>`;
  else h+=`<div class="aq"><h3>${Q.n}</h3><p>${Q.d}</p><p class="am">보상: ${rewardTxt(Q.r)}</p>${c.qs===1?`<p>진행: <b>${c.qp} / ${Q.n2}</b></p>`:""}
   <div class="abtn">${c.qs===0?`<button data-a="qacc">📜 수락</button>`:c.qs===2?`<button data-a="qdone">🎁 보고하고 보상 받기</button>`:`<button class="alt" data-a="close">사냥하러 가기</button>`}</div></div>`;
 }else if(n.role==="shop"){
  h+=`<div class="atabs"><button data-a="stab" data-k="buy" class="${ADV.shopTab==="buy"?"on":""}">구매</button><button data-a="stab" data-k="sell" class="${ADV.shopTab==="sell"?"on":""}">판매</button></div>`;
  const sel=ADV.sel;
  if(ADV.shopTab==="buy"){
   h+=`<div class="apotb">${["hp","mp"].map(k=>`<div><b>${APOT[k].i} ${APOT[k].n}</b> <small>${APOT[k].d} · 보유 ${c.pot[k]}</small><button data-a="pot1" data-k="${k}">💰${APOT[k].price}</button><button class="alt" data-a="pot5" data-k="${k}">×5 💰${APOT[k].price*5}</button></div>`).join("")}</div>
    <div class="ashop"><div class="agrid s">${ADV.shopStock.map((it,i)=>it?itemCell(it,"shop",i,sel&&sel.f==="shop"&&sel.k===i):`<div class="aic empty"></div>`).join("")}</div><div class="adet">${advSelInfo()}</div></div>
    <div class="abtn c"><button class="alt" data-a="restock">🔄 새 물건 (💰${30+c.lv*10})</button></div>`;
  }else{
   h+=`<div class="ashop"><div class="agrid">${Array.from({length:AMAX_BAG},(_,i)=>itemCell(c.bag[i],"bag",i,sel&&sel.f==="bag"&&sel.k===i)).join("")}</div><div class="adet">${advSelInfo()}</div></div>
    <div class="abtn c"><button class="alt" data-a="sellj">일반·고급 장비 일괄 판매</button></div>`;
  }
  h+=`<div class="am c">💰 ${c.gold.toLocaleString()} · 가방 ${c.bag.length}/${AMAX_BAG}</div>`;
 }else if(n.role==="smith"){
  const sel=ADV.sel;
  h+=`<div class="asub">강화할 장비를 고르세요 (장착 중인 장비 · 가방)</div><div class="ashop"><div><div class="aeqg">${ASLOTS.map(sl=>`<div class="aeqs"><small>${ASLOT[sl].n}</small>${itemCell(c.eq[sl],"eq",sl,sel&&sel.f==="eq"&&sel.k===sl)}</div>`).join("")}</div>
   <div class="agrid">${c.bag.map((it,i)=>it.s==="book"?"":itemCell(it,"bag",i,sel&&sel.f==="bag"&&sel.k===i)).join("")}</div></div><div class="adet">${advSelInfo()}</div></div><div class="am c">💰 ${c.gold.toLocaleString()}</div>`;
 }else if(n.role==="skill"){
  h+=`<div class="askl">${askOf(c.job).map(id=>{const S=ASK[id],lv=c.sk[id]||0,pr=sagePrice(id,lv);
   return`<div class="askr${lv?"":" lock"}"><div class="ic">${S.i}</div><div class="dd"><b>${S.n} ${lv?`<em>Lv.${lv}</em>`:"<em class='bad'>미습득</em>"}</b><p>${S.d}</p></div><div class="asl">${lv>=ASK_MAXLV?`<span class="ok">MAX</span>`:`<button data-a="learn" data-k="${id}"${c.gold<pr?" disabled":""}>${lv?"강화":"배우기"} 💰${pr}</button>`}</div></div>`}).join("")}</div><div class="am c">💰 ${c.gold.toLocaleString()}</div>`;
 }
 return h;
}
function advMake(){
 const i=ADV.newSlot,j=ADV.newJob||"warrior",nm=(ADV.newName||AJOB[j].n).trim().slice(0,10)||AJOB[j].n;
 const c=advNewChar(nm,j);advMem[i]=c;ADV.slot=i;try{localStorage.setItem("ms_adv",JSON.stringify(advMem))}catch(e){}
 ADV.newName="";advForceClose();advStart(i);
}
AE.panel.addEventListener("click",e=>{
 const t=e.target.closest("[data-a]");if(!t)return;const a=t.dataset.a,k=t.dataset.k,c=ADV.c;if(!a)return;
 if(t.disabled)return;sfx("ui");
 switch(a){
  case"close":advClose();return;
  case"exit":advExit();return;
  case"play":advForceClose();advStart(+k);return;
  case"del":if(ADV.delArm===+k){advMem[+k]=null;try{localStorage.setItem("ms_adv",JSON.stringify(advMem))}catch(x){}ADV.delArm=-1}else ADV.delArm=+k;break;
  case"new":ADV.newSlot=+k;ADV.newJob=ADV.newJob||"warrior";ADV.newName=AJOB[ADV.newJob].n;ADV.panel="create";break;
  case"job":{const was=ADV.newJob;ADV.newJob=k;if(!ADV.newName||ADV.newName===AJOB[was||"warrior"].n)ADV.newName=AJOB[k].n;break}
  case"back":ADV.panel="select";break;
  case"make":advMake();return;
  case"tab":ADV.tab=k;ADV.sel=null;break;
  case"bag":case"eq":case"shop":{const same=ADV.sel&&ADV.sel.f===a&&ADV.sel.k===(a==="eq"?k:+k);ADV.sel={f:a,k:a==="eq"?k:+k};ADV.delArm=-1;
   const it=advSelItem();if(!it){ADV.sel=null;break}
   if(same&&ADV.panel==="char"){if(a==="bag"){if(it.s==="book")advReadBook(it);else advEquip(it);ADV.sel=null}else{advUnequip(k);ADV.sel=null}}
   break}
  case"equip":{const it=advSelItem();if(it&&advEquip(it))ADV.sel=null;break}
  case"uneq":advUnequip(ADV.sel.k);ADV.sel=null;break;
  case"read":{const it=advSelItem();if(it)advReadBook(it);ADV.sel=null;break}
  case"drop":if(ADV.delArm===999){c.bag.splice(ADV.sel.k,1);ADV.sel=null;ADV.delArm=-1;ADV.dirty=true}else ADV.delArm=999;break;
  case"sort":c.bag.sort((x,y)=>(x.s==="book")-(y.s==="book")||ASLOTS.indexOf(x.s)-ASLOTS.indexOf(y.s)||y.r-x.r||y.ilv-x.ilv);ADV.sel=null;break;
  case"pt":case"pt5":{const n=Math.min(c.pts,a==="pt5"?5:1);c.st[k]+=n;c.pts-=n;const hp=ADV.p.hp/ADV.st.maxHp;advCalc();ADV.p.hp=ADV.st.maxHp*hp;ADV.dirty=true;break}
  case"bind":{const i=+t.dataset.i,o=c.bar.indexOf(k);if(o>=0)c.bar[o]=c.bar[i];c.bar[i]=k;if(o===i){}ADV.dirty=true;break}
  case"qacc":c.qs=1;c.qp=0;toast(`📜 퀘스트 수락: ${AQUEST[c.q].n}`);break;
  case"qdone":{const Q=AQUEST[c.q],r=Q.r;c.gold+=r.gold||0;if(r.pot){c.pot.hp+=Math.ceil(r.pot/2);c.pot.mp+=Math.floor(r.pot/2)}
   const give=it=>{if(c.bag.length<AMAX_BAG)c.bag.push(it);else toast("가방이 가득 차 보상 아이템이 사라졌습니다")};
   if(r.item)give(advItem(c.lv+1,{rar:r.item}));if(r.book){const own=askOf(c.job).filter(id=>(c.sk[id]||0)<ASK_MAXLV),un=own.filter(id=>!c.sk[id]);give(advBook(aPick(un.length?un:own.length?own:askOf(c.job))))}
   c.q++;c.qs=0;c.qp=0;advGainXP(r.xp||0);toast(`🎁 퀘스트 보상: ${rewardTxt(r)}`);stinger("evo");advSaveNow();break}
  case"stab":ADV.shopTab=k;ADV.sel=null;break;
  case"pot1":case"pot5":{const n=a==="pot5"?5:1,pr=APOT[k].price*n;if(c.gold<pr){toast("골드가 부족합니다");break}c.gold-=pr;c.pot[k]+=n;ADV.dirty=true;break}
  case"buy":{const it=advSelItem(),pr=itemPrice(it)*4;if(c.gold<pr){toast("골드가 부족합니다");break}if(c.bag.length>=AMAX_BAG){toast("가방이 가득 찼습니다");break}
   c.gold-=pr;c.bag.push(it);ADV.shopStock[ADV.sel.k]=null;ADV.sel=null;toast(`구매: ${it.n}`);sfx("chest");ADV.dirty=true;break}
  case"sell":{const it=advSelItem();c.gold+=itemPrice(it);c.bag.splice(ADV.sel.k,1);ADV.sel=null;sfx("ping");ADV.dirty=true;break}
  case"sellj":{let g=0,n=0;c.bag=c.bag.filter(it=>{if(it.s!=="book"&&it.r<=1&&!it.enh){g+=itemPrice(it);n++;return false}return true});c.gold+=g;ADV.sel=null;toast(n?`장비 ${n}개 판매 · 💰+${g}`:"팔 장비가 없습니다");ADV.dirty=true;break}
  case"restock":{const pr=30+c.lv*10;if(c.gold<pr){toast("골드가 부족합니다");break}c.gold-=pr;advRestock();ADV.sel=null;break}
  case"enh":{const it=advSelItem(),cost=enhCost(it);if(c.gold<cost)break;c.gold-=cost;
   if(Math.random()<ENH_CH[it.enh||0]){it.enh=(it.enh||0)+1;toast(`🔨 강화 성공! ${it.n} +${it.enh}`);stinger("evo")}else{toast("💥 강화 실패… (장비는 무사합니다)");sfx("shield_break")}
   advCalc();ADV.dirty=true;break}
  case"learn":{const lv=c.sk[k]||0,pr=sagePrice(k,lv);if(c.gold<pr||lv>=ASK_MAXLV)break;c.gold-=pr;c.sk[k]=lv+1;
   if(!lv){const e=c.bar.indexOf(null);if(e>=0)c.bar[e]=k}toast(`✨ ${ASK[k].n} ${lv?"Lv."+(lv+1):"습득!"}`);stinger("evo");ADV.dirty=true;break}
  case"go":advForceClose();advGoMap(k);return;
  case"mute":muted=!muted;setVol();break;
  case"toSel":advSaveNow();ADV.play=false;ADV.c=null;advGoMapTitle();ADV.panel="select";break;
  case"revive":{c.gold=Math.floor(c.gold*.9);ADV.dead=false;ADV.p.hp=1;advForceClose();advGoMap("town","revive");toast("🏘️ 마을에서 정신을 차렸습니다 (골드 -10%)");return}
 }
 advRender();
});
function advGoMapTitle(){ADV.map="town";const M=AMAP.town;if(chunkStage!==M.look){chunks.clear();chunkStage=M.look}selSt=M.look;ADV.walls.length=0;ADV.mons.length=0;ADV.drops.length=0;ADV.projs.length=0;ADV.zones.length=0;ADV.boss=null;advSetSong()}
addEventListener("blur",()=>{if(ADV.on&&ADV.play&&!ADV.panel&&!ADV.dead)advOpen("menu")});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&ADV.on&&ADV.play&&!ADV.panel&&!ADV.dead)advOpen("menu")});
AE.panel.addEventListener("pointerdown",e=>{if(e.target===AE.panel&&ADV.panel&&!["select","create","dead"].includes(ADV.panel))advClose()});
