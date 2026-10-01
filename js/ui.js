/* ═══════════════ ui.js ═══════════════
   HUD · 토스트 · 레벨업/보물상자 · 결과 화면 · 일시정지 메뉴(설정/스탯/도감/조합표/원소 반응) · 타이틀/저장 */
"use strict";
const E={xp:$("xp"),hp:$("hp"),lv:$("lv"),time:$("time"),kills:$("kills"),hptxt:$("hptxt"),wl:$("weaponList"),toast:$("toast"),flash:$("flash"),bomb:$("bombfl"),low:$("lowhp"),vig:$("vig"),
 boss:$("bossbar"),bossName:$("bossname"),bossHp:$("bosshp")};
const overlays=document.querySelectorAll(".overlay");
let runBonus=0,pTab="set";
function toast(s){E.toast.textContent=s;E.toast.classList.add("show");toastTimer=2}
function show(id){$(id).style.display="flex"}
function hideAll(){overlays.forEach(x=>x.style.display="none")}
function txt(el,s){if(el._t!==s){el._t=s;el.textContent=s}}
function wid(el,p){const s=Math.min(100,Math.max(0,p*100)).toFixed(1)+"%";if(el._w!==s){el._w=s;el.style.width=s}}
function op(el,v){v=Math.round(v*100)/100;if(el._o!==v){el._o=v;el.style.opacity=v}}
/* ── 도감 기록 / 원소 도우미 ── */
function discover(t,k){if(!save)return;const dx=save.dex||(save.dex={w:{},p:{},r:{}});(dx[t]||(dx[t]={}))[k]=1}
const elOf=kind=>{const s=ELEM[kind];return s?STATUS[s]:null};
function ownedElems(){const set=new Set();for(const k in weapons){const w=weapons[k];if(w.level>0&&ELEM[w.kind])set.add(ELEM[w.kind])}return set}
function activeRx(set){const out=[];for(const k in REACT)if(set.has(REACT[k].a)&&set.has(REACT[k].b))out.push(k);return out}
function elTag(kind){const st=elOf(kind);return st?`<span class="eltag" style="color:${st.c}">${st.i} ${st.n}</span>`:""}
function rxChip(k,extra){const r=REACT[k];return `<span style="color:${r.c}">${r.i} ${r.n}${extra||""}</span>`}
/* 이 무기를 얻으면 새로 열리는 원소 반응 */
function newRxHint(kind){
 const s=ELEM[kind];if(!s)return"";const cur=ownedElems();if(cur.has(s))return"";
 const before=activeRx(cur);cur.add(s);const nw=activeRx(cur).filter(k=>!before.includes(k));
 return nw.length?`<div class="newrx">⚗️ 새 원소 반응: ${nw.map(k=>REACT[k].i+" "+REACT[k].n).join(", ")}</div>`:"";
}
/* ── 레벨업 / 보물상자 ── */
function wpick(pool,n){
 const res=[],p=pool.slice();
 while(res.length<n&&p.length){let tot=0;for(const x of p)tot+=x.w;let r=Math.random()*tot,i=0;for(;i<p.length-1;i++){r-=p[i].w;if(r<=0)break}res.push(p.splice(i,1)[0])}
 return res;
}
/* 이 아이템이 재료인, 아직 만들지 않은 조합 무기 (선택지 카드에 표시) */
function comboHint(k,isP){
 const out=[];for(const r of comboRecipes){if(weapons[r.key]||(isP?r.b!==k:r.a!==k))continue;
  const other=isP?weapons[r.a]:passives[r.b],have=other&&other.level>0;
  out.push(`<span class="${have?"hot":""}">${r.icon} ${r.name}${have?" ✔":""}</span>`)}
 return out.length?`<div class="chint">🔗 ${out.join(" ")}</div>`:"";
}
/* 조합 재료 룬 가중치: 짝 무기를 보유 중이고 아직 조합 전이면 룬이 훨씬 잘 나옴 (무기 Lv.5 이상이면 최우선) */
function runeNeed(k){let n=0;for(const r of comboRecipes){if(r.b!==k||(weapons[r.key]&&weapons[r.key].level>0))continue;const w=weapons[r.a];if(!w||!(w.level>0)||w.consumed)continue;n=Math.max(n,w.level>=5?2:1)}
 return passives[k].level>=3?0:n}
/* 무기 Lv.5인데 짝 룬이 선택지에 없으면 하나를 끼워 넣음 */
function ensureRune(pick,pool){
 if(pick.some(x=>x.need===2))return;const cand=pool.filter(x=>x.need===2&&!pick.includes(x));if(!cand.length)return;
 let j=-1;for(let i=pick.length-1;i>=0;i--){const x=pick[i];if(x.need)continue;if(x.own&&pick.filter(y=>y.own).length<=1)continue;j=i;break}
 const c=wpick(cand,1)[0];if(j<0)pick.push(c);else pick[j]=c;
}
/* 선택지: 보유 중인 무기·패시브 강화가 더 자주 나오고, 최소 1개는 보장 */
function choiceData(){
 if(isGun())return gunChoiceData();
 if(isSw())return swChoiceData();
 if(isSt())return stChoiceData();                    // 스텔라: 마법 전용 선택지                    // 검객: 검·스킬·스탯 전용 선택지                 // 총잡이: 리볼버·스킬·스탯 위주 전용 선택지
 let a=[];const combos=availableCombos();
 if(combos.length){const r=combos[0];a.push({icon:r.icon,title:r.name,tag:"★ 조합 무기",t:"combo",el:elTag(r.kind),desc:r.desc,stat:`피해 ${r.damage} · 수량 ${r.count} · ${weapons[r.a].name} 소모 → 무기 칸 +1`,fn:()=>addComboRecipe(r)})}
 const pool=[],nW=wSlots(),wOpen=nW<MAX_W,pOpen=pSlots()<MAX_P,newW=nW>=5?.45:nW>=3?.7:1;   // 무기가 많을수록 새 무기 비중 감소
 for(const k in weapons){
  const w=weapons[k];
  if(w.level>0){
   if(!maxed(k))pool.push({w:4,own:1,icon:w.icon,title:`${w.name} Lv.${w.level+1}`,tag:"무기 강화",t:"up",el:elTag(w.kind),rx:defs[k]?comboHint(k,false):"",desc:w.desc,stat:`피해 ${Math.round(w.damage)} → ${Math.round(w.damage*1.2)}`+(addsCount(k,w.level+1)?" · 수량 +1":""),fn:()=>weaponUpgrade(k)});
  }else if(defs[k]&&!w.consumed&&wOpen&&availW(k))pool.push({w:newW*(defs[k].ch2?1.8:1),icon:w.icon,title:w.name+" NEW",tag:"새 무기",t:"new",el:elTag(w.kind),rx:newRxHint(w.kind)+comboHint(k,false),desc:w.desc,stat:`피해 ${w.damage} · 수량 ${w.count}`,fn:()=>weaponUpgrade(k)});
 }
 for(const k in passives){
  const p=passives[k];if(p.level>=p.max)continue;
  const nd=runeNeed(k);
  if((p.level>0||pOpen)&&(p.level>0||availP(k)))pool.push({w:nd===2?9:nd?4.5:p.level>0?3.2:p.ch2?1.6:1.2,need:nd,own:p.level>0?1:0,icon:p.icon,title:`${p.name} Lv.${p.level+1}`,tag:p.level>0?"패시브 강화":"새 패시브",t:"pas",rx:comboHint(k,true),desc:p.desc,stat:`현재 ${p.level} → ${p.level+1} (최대 ${p.max})`,fn:()=>passiveUpgrade(k)});
 }
 const pick=wpick(pool,choiceN()-a.length);
 if(pick.length&&!pick.some(x=>x.own)){const own=pool.filter(x=>x.own&&!pick.includes(x));if(own.length)pick[pick.length-1]=wpick(own,1)[0]}
 ensureRune(pick,pool);a=a.concat(pick.slice(0,Math.max(1,choiceN()-a.length)));
 if(!a.length)a.push({icon:"❤️",title:"휴식",tag:"회복",t:"rest",desc:"모든 강화를 마쳤습니다. HP를 크게 회복합니다.",stat:"HP +50%",fn:()=>{player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.5)}});
 return a;
}
const choiceN=()=>(passives.luck.level>=3?4:3)+(isJob("gambler")?1:0)+T("g_ch");   // 행운 부적 Lv.3+ / 도박사: 선택지 +1
/* 보유 무기 / 패시브 한눈에 보기 + 조합표 펼치기 (레벨업·보물상자 창) */
let recOpen=false;
/* 총잡이: 리볼버 강화 + 스킬 아이콘 */
function gunIcons(cls){const g=player.gun;let h="";
 for(const k in GUN_UP)if(g.u[k])h+=`<span class="${cls}" title="${GUN_UP[k].n} Lv.${g.u[k]}">${GUN_UP[k].i}<i>${g.u[k]}</i></span>`;
 g.sk.forEach((s,i)=>{h+=`<span class="${cls} cb" title="${i+1}번 키: ${GUN_SK[s.k].n} Lv.${s.lv}">${GUN_SK[s.k].i}<i>${s.lv}</i></span>`});return h}
function ownedStrip(){
 let w="",p="",nw=0,np=0;
 if(isGun()&&player.gun)w=gunIcons("oi");
 if(isSw()&&player.sw)w=swIcons("oi");
 if(isSt()&&player.st)w=stIcons("oi");
 for(const k in weapons){const x=weapons[k];if(!(x.level>0))continue;if(defs[k])nw++;const st=elOf(x.kind);
  w+=`<span class="oi${defs[k]?"":" cb"}" title="${x.name} Lv.${x.level}${st?" · "+st.n:""}">${x.icon}<i>${x.level}</i></span>`}
 for(const k in passives){const x=passives[k];if(!(x.level>0))continue;np++;p+=`<span class="oi pa" title="${x.name} Lv.${x.level} — ${x.desc}">${x.icon}<i>${x.level}</i></span>`}
 const rx=activeRx(ownedElems());
 const tl=(TAL[selCh]||[]).filter(t=>T(t.k));
 return `<div class="owned">${tl.length?`<div class="otal"><small>⭐ 특전</small>${tl.map(t=>`<span class="oi tl" title="${t.n} — ${t.d}">${t.i}</span>`).join("")}</div>`:""}<div><small>${isGun()?"🔫 총기 · 스킬":isSw()?"⚔️ 검 · 스킬":isSt()?"🪄 마법":"무기 "+nw+"/"+MAX_W}</small>${w||'<span class="dim">없음</span>'}</div><div><small>패시브 ${np}/${MAX_P}</small>${p||'<span class="dim">없음</span>'}</div>${rx.length?`<div class="orx">${rx.map(k=>rxChip(k)).join("")}</div>`:""}
  <button class="rbtn" data-rec>📖 조합표 ${recOpen?"접기 ▲":"보기 ▼"}</button></div><div class="recbox"${recOpen?"":' style="display:none"'}>${miniRecipes()}</div>`;
}
/* 간단 조합표: 재료를 보유한 레시피 먼저, 조건 충족은 금색 */
function miniRecipes(){
 const rows=comboRecipes.map(r=>{const wa=weapons[r.a]?weapons[r.a].level:0,pb=passives[r.b]?passives[r.b].level:0,done=weapons[r.key]&&weapons[r.key].level>0,rel=wa>0||pb>0,ready=!done&&wa>=5&&pb>=3;
  return{r,wa,pb,done,rel,ready,o:done?3:ready?0:rel?1:2}}).sort((x,y)=>x.o-y.o);
 return `<div class="mrec">${rows.map(x=>{const A=defs[x.r.a],B=passiveDefs[x.r.b];
  return `<div class="mr${x.done?" done":x.ready?" ready":x.rel?"":" dim"}"><span class="${x.wa>=5||x.done?"ok":x.wa?"have":""}">${A.icon} ${A.name} ${x.done?"✔":x.wa+"/5"}</span>+<span class="${x.pb>=3||x.done?"ok":x.pb?"have":""}">${B.icon} ${B.name} ${x.done?"✔":x.pb+"/3"}</span>→<b>${x.r.icon} ${x.r.name}</b></div>`}).join("")}</div>
  <div class="legend" style="text-align:center;margin:6px 0 0">무기 Lv.5 + 패시브 Lv.3 + 플레이어 Lv.8 → 조합 무기 등장</div>`;
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-rec]");if(!b)return;e.stopPropagation();recOpen=!recOpen;sfx("ui");
 for(const id of["ownedL","ownedC"]){const el=$(id);if(el&&el.firstChild)el.innerHTML=ownedStrip()}},true);
function lvFx(){
 vfx({type:"ring",x:player.x,y:player.y,r0:10,r1:170,life:.45,max:.45,c:"rgba(255,215,110,.95)",w:6});
 vfx({type:"txt",x:player.x,y:player.y-48,t:"LEVEL UP!",life:.9,max:.9,c:"#ffe58a"});
 vfx({type:"light",x:player.x,y:player.y,r:360,life:.5,max:.5,c:"#ffd36a"});
 for(let i=0;i<22;i++){const a=i/22*6.283,sp=rand(140,300);spawnP(player.x,player.y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.35,.7),rand(1.4,2.4),i&1?"#ffe58a":"#fff",1,3,0)}
 shake=Math.max(shake,4);
}
const gridCls=(el,n)=>{el.classList.toggle("g4",n===4);el.classList.toggle("g5",n>=5)};
/* 선택지 카드 (레벨업·보물상자 공용) */
function cardEl(x,onPick){
 const b=document.createElement("div");b.className="choice t-"+x.t;
 b.innerHTML=`<div class="icon">${x.icon}</div><b>${x.title}</b><span class="tag">${x.tag}</span>${x.el||""}<p>${x.desc}</p><div class="stat">${x.stat}</div>${x.rx||""}`;
 b.onmouseenter=()=>sfx("ui");b.onclick=onPick;return b;
}
function showLevelUp(reroll){
 paused=true;clearPtr();const box=$("choices");box.innerHTML="";
 if(!reroll)player.rolls=isJob("gambler")?(T("g_roll")?4:2):0;
 const list=choiceData();gridCls(box,list.length);$("ownedL").innerHTML=ownedStrip();
 for(const x of list){
  box.appendChild(cardEl(x,()=>{clearPtr();paused=false;$("levelup").style.display="none";x.fn();lvFx();updateUI();checkLevel()}));
 }
 rollBtns($("reroll"),$("skipL"));
 if(!reroll){show("levelup");chord()}
}
/* ── 직업 특전 (Lv.10마다 3중 택1) ── */
function talPool(){if(isSt()&&player.st)return stTalPool();if(isSw()&&player.sw)return swTalPool();const L=TAL[selCh]||[];return L.filter(t=>!T(t.k))}
function showTalent(){
 paused=true;clearPtr();const lu=$("levelup"),box=$("choices");box.innerHTML="";lu.classList.add("talent");
 const h=lu.querySelector("h2"),sub=lu.querySelector(".sub");h.textContent=`⭐ 직업 특전 — Lv.${level}`;sub.textContent=`${chr().i} ${chr().n} 전용 · 하나를 고르면 이번 판 동안 유지됩니다 · 숫자 키로 선택`;
 // 총잡이: 가진 스킬의 특전을 우선
 const pool=talPool().map(t=>({...t,w:t.sk?(player.gun&&player.gun.sk.some(s=>s.k===t.sk)?3:.4):1.5}));
 const list=wpick(pool,3);gridCls(box,list.length);$("ownedL").innerHTML="";$("reroll").style.display="none";$("skipL").style.display="none";
 for(const t of list){const b=document.createElement("div");b.className="choice t-combo tal";
  const own=t.sk&&!(player.gun&&player.gun.sk.some(s=>s.k===t.sk));
  b.innerHTML=`<div class="icon">${t.i}</div><b>${t.n}</b><span class="tag">⭐ 직업 특전</span><p>${t.d}</p>${own?`<div class="stat">⚠ ${GUN_SK[t.sk].n} 스킬 필요</div>`:""}`;
  b.onmouseenter=()=>sfx("ui");
  b.onclick=()=>{player.tal[t.k]=1;talApply(t.k);lu.classList.remove("talent");h.textContent="✨ 능력을 선택하세요";sub.textContent="원소가 다른 무기를 모으면 원소 반응이 일어납니다 · 숫자 키로 선택";$("skipL").style.display="";
   toast(`⭐ 특전: ${t.i} ${t.n}`);sfx("upgrade");lvFx();showLevelUp()};box.appendChild(b)}
 show("levelup");stinger("evo");
}
/* 선택 즉시 적용되는 특전 */
function talApply(k){
 if(isSw()&&player.sw)swTalApply(k);
 if(isSt()&&player.st)stTalApply(k);
 if(k==="v_rev")player.revives++;
 if(k==="pl_hp"){player.maxHp+=60;player.hp+=60}
 if(k==="k_sh")player.shT=Math.min(player.shT,1);
}
/* ── 다시 뽑기 / 포기 ──
   rolls: 도박사가 레벨업마다 받는 무료 횟수 · tokens: 판 전체에서 쓰는 다시 뽑기 (영구 강화 + 포기로 획득)
   포기: 이번 선택지를 받지 않고 다시 뽑기 +1을 저장 → 원하는 것이 없을 때 다음 기회에 사용 */
const rollsLeft=()=>player.rolls+player.tokens;
function useRoll(){if(player.rolls>0)player.rolls--;else if(player.tokens>0)player.tokens--;else return false;return true}
function rollBtns(rb,sk){const n=rollsLeft();rb.style.display=n>0?"":"none";rb.textContent=`🎲 다시 뽑기 (${n}) · R`;sk.textContent=`⏭ 포기하고 다시 뽑기 +1 · X`}
function skipPick(id){
 player.tokens=Math.min(9,player.tokens+1);clearPtr();paused=false;$(id).style.display="none";sfx("ui");
 toast(`⏭ 선택 포기 → 다시 뽑기 +1 (보유 ${rollsLeft()-player.rolls})`);updateUI();checkLevel();
}
$("reroll").onclick=()=>{if(!useRoll())return;sfx("ui");showLevelUp(true)};
$("skipL").onclick=()=>skipPick("levelup");
$("rerollC").onclick=()=>{if(!useRoll())return;sfx("ui");openChest(true)};
$("skipC").onclick=()=>skipPick("chest");
function openChest(reroll){
 paused=true;clearPtr();const box=$("rewards");box.innerHTML="";
 // 레벨업과 같은 선택지·같은 카드 (조합 무기 우선, 보유 아이템 가중치, 원소/조합 힌트 동일)
 const list=choiceData().filter(x=>x.t!=="rest");
 while(list.length<3)list.push({icon:"✨",title:"신비한 축복",tag:"보물상자",t:"rest",desc:"HP 35% 회복 + 경험치 35",stat:"HP +35% · EXP +35",fn:()=>{player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.35);gainXP(35)}});
 $("ownedC").innerHTML=ownedStrip();gridCls(box,list.length);
 for(const x of list)box.appendChild(cardEl(x,()=>{clearPtr();paused=false;$("chest").style.display="none";x.fn();lvFx();sfx("chest");updateUI();checkLevel()}));
 rollBtns($("rerollC"),$("skipC"));
 if(!reroll){show("chest");chord()}
}
/* ── 결과 화면 ──
   골드는 '이번 판 누적 - 이미 지급한 양'만 지급 → 클리어 후 무한 모드로 이어가도 중복 지급 없음 */
function endRun(win){
 if(win)runBonus+=300;
 const S_=STG[selSt],total=Math.floor((kills*.4+elapsed/6)*(1+pl("gold")*.06)*S_.g*(mode===1?1.2:1)*(player.tal&&player.tal.g_gold?1.5:1))+runBonus,g=Math.max(0,total-paidGold);paidGold=total;
 save.gold+=g;
 const inf=mode===1&&!win,prevInf=save.bestInf||0;
 if(inf)save.bestInf=Math.max(prevInf,Math.floor(elapsed));else save.best=Math.max(save.best||0,Math.floor(elapsed));
 // 누적 기록 (무기 해금 조건) — 이어하기로 두 번 호출돼도 차이만 더함
 const T=save.tot,before=Object.keys(UNLOCK).filter(k=>!unlocked(k)),stBefore=STG.map((_,i)=>stageOpen(i));
 let rxN=0;for(const k in runRx)rxN+=runRx[k];
 T.kills+=kills-runSt.cK;runSt.cK=kills;T.rx+=rxN-runSt.cRx;runSt.cRx=rxN;T.boss+=runSt.boss-runSt.cB;runSt.cB=runSt.boss;
 T.maxLv=Math.max(T.maxLv||0,level);if(selCh==="pyro"&&elapsed>=300)T.pyro5=true;
 const chBefore=Object.keys(CH).filter(k=>CH[k].req&&!reqMet(CH[k].req));
 if(win){save.cl[selSt]=(save.cl[selSt]||0)+1;if(selSt===0)save.clears=(save.clears||0)+1;save.cc=save.cc||{};const ck=selCh+"_"+selSt;save.cc[ck]=(save.cc[ck]||0)+1}
 if(win&&runSt.stellaDown)save.stella=1;                       // 스텔라 처치 기록 → '별의 아이 스텔라' 해금
 const newC=chBefore.filter(k=>reqMet(CH[k].req));for(const k of newC)if(!save.chars.includes(k))save.chars.push(k);
 const newW=before.filter(k=>unlocked(k)),newS=STG.map((s,i)=>!stBefore[i]&&stageOpen(i)?s.n:null).filter(Boolean);
 commit();
 document.querySelector("#gameover h2").textContent=win?"🏆 STAGE CLEAR!":mode===1?"∞ 무한 모드 종료":"☠️ GAME OVER";
 const rx=Object.keys(runRx).sort((a,b)=>runRx[b]-runRx[a]).map(k=>rxChip(k," ×"+runRx[k])).join("");
 $("result").innerHTML=`<div class="res"><div><b>${fmt(elapsed)}</b><small>생존</small></div><div><b>${kills}</b><small>처치</small></div><div><b>${level}</b><small>레벨</small></div><div><b>💰${g}</b><small>획득 골드</small></div></div>
  ${rx?`<h3>이번 판 원소 반응</h3><div class="syn" style="justify-content:center">${rx}</div>`:""}
  ${inf?`<div class="rec">∞ 최고 기록 ${fmt(save.bestInf)}${Math.floor(elapsed)>prevInf?" · 🎉 신기록!":""}</div>`:""}
  ${win&&mode===0?`<div class="rec">계속 싸우면 무한 모드로 이어집니다 (골드 ×1.2)</div>`:""}
  ${newC.length?`<div class="rec unlock">🔓 새 직업 해금: ${newC.map(k=>CH[k].i+" "+CH[k].n).join(" · ")}</div>`:""}
  ${newW.length?`<div class="rec unlock">🔓 새 무기 해금: ${newW.map(k=>defs[k].icon+" "+defs[k].name).join(" · ")}</div>`:""}
  ${newS.length?`<div class="rec unlock">🔓 새 스테이지 해금: ${newS.join(" · ")}</div>`:""}
  ${dmgTable(5)}`;
 $("cont").style.display=win&&mode===0?"":"none";
}
function victory(){running=false;E.boss._on=false;E.boss.style.display="none";endRun(true);show("gameover");chord()}
$("cont").onclick=()=>{ // 클리어 후 무한 모드로 계속
 mode=1;running=true;paused=false;pendingWin=0;slowT=0;timeScale=1;infAnnounced=true;nextRush=elapsed+150;
 hideAll();last=performance.now();toast("∞ 무한 모드! 끝까지 버텨보세요");stinger("boss");updateUI();
};
/* ── HUD ── */
function slotHtml(w,cls){const st=elOf(w.kind);return `<div class="slot ${cls}" title="${w.name} Lv.${w.level}">${w.icon}<span class="lv">${w.level}</span>${st?`<span class="el">${st.i}</span>`:""}</div>`}
function updateUI(){
 wid(E.xp,xp/need);wid(E.hp,player.hp/player.maxHp);
 txt(E.lv,""+level);txt(E.time,(mode===1?"∞ ":"")+fmt(elapsed));txt(E.kills,`☠ ${kills}`);txt(E.hptxt,`❤ ${Math.max(0,Math.ceil(player.hp))}/${player.maxHp}`);
 // 보스 체력바: 최종 보스 우선, 없으면 가장 큰 보스
 let b=null;for(const e of enemies)if(e.type==="boss"&&e.hp>0&&(!b||(e.final&&!b.final)||(!b.final&&e.maxHp>b.maxHp)))b=e;
 if(b){if(!E.boss._on){E.boss._on=true;E.boss.style.display="block"}txt(E.bossName,b.stella?"✨ 별의 아이 스텔라":b.final?"👑 최종 보스":"👑 보스");wid(E.bossHp,b.hp/b.maxHp)}
 else if(E.boss._on){E.boss._on=false;E.boss.style.display="none"}
 // 인벤토리 (HTML이 바뀔 때만 DOM 갱신)
 let h='<div class="srow">',n=0;
 if(isSt()&&player.st){h+=stIcons("slot").replace(/<i>/g,'<span class="lv">').replace(/<\/i>/g,"</span>")}
 else if(isSw()&&player.sw){h+=swIcons("slot").replace(/<i>/g,'<span class="lv">').replace(/<\/i>/g,"</span>")}
 else if(isGun()&&player.gun){h+=gunIcons("slot").replace(/<i>/g,'<span class="lv">').replace(/<\/i>/g,"</span>")||'<div class="slot empty">🔫</div>'}
 else{for(const k in defs){const w=weapons[k];if(w&&w.level>0){n++;h+=slotHtml(w,"")}}
 for(;n<MAX_W;n++)h+='<div class="slot empty"></div>';}
 h+='</div>';
 let combo="";for(const k in weapons)if(!defs[k]&&weapons[k].level>0)combo+=slotHtml(weapons[k],"combo");
 if(combo)h+=`<div class="srow">${combo}</div>`;
 h+='<div class="srow">';let m=0;
 for(const k in passives){const p=passives[k];if(p.level>0){m++;h+=`<div class="slot pas" title="${p.name} Lv.${p.level}">${p.icon}<span class="lv">${p.level}</span></div>`}}
 for(;m<MAX_P;m++)h+='<div class="slot pas empty"></div>';
 h+='</div>';
 const rx=activeRx(ownedElems());
 h+=`<div class="syn">${rx.length?rx.map(k=>rxChip(k)).join(""):'<span class="dim">⚗️ 원소가 다른 무기 2개 → 원소 반응</span>'}</div>`;
 if(h!==uiCache){uiCache=h;E.wl.innerHTML=h}
}
function fx(){
 op(E.flash,Math.min(1,player.flash*2));op(E.bomb,Math.min(.85,bombFlash));
 const low=running&&!paused&&player.hp/player.maxHp<.3;
 if(E.low._on!==low){E.low._on=low;E.low.classList.toggle("on",low);if(!low)E.low.style.opacity=0}
}
/* 토스트 자동 숨김 + HUD 갱신(0.1초 간격, DOM 조작 최소화) */
function updateHud(dt){
 toastTimer-=dt;if(toastTimer<=0)E.toast.classList.remove("show");
 uiT-=dt;if(uiT<=0){uiT=.1;updateUI();updateSkillBar()}
}
/* ── 일시정지 메뉴 (탭) ── */
const pct=v=>v?Math.round(v*100)+"%":"끔";
const SETS=[
 ["그래픽 품질","q",["auto","0","1","2"],v=>v==="auto"?`자동 (현재 ${Q.n})`:QL[+v].n],
 ["화면 흔들림","shake",[1,.5,0],pct],
 ["데미지 숫자","dmgNum",["all","crit","off"],v=>({all:"모두 표시",crit:"치명타만",off:"끄기"})[v]||"모두 표시"],
 ["이펙트 투명도 (내 공격)","fxa",[1,.7,.45,.2],v=>v>=1?"불투명":v>=.7?"약간 투명 70%":v>=.45?"반투명 45%":"거의 투명 20%"],
 ["적 외곽선 강조","hl",[0,1,2,3],v=>["끔","흰색","빨강","노랑"][v]],
 ["배경 어둡게 (적 구분)","bgDim",[0,.2,.4],v=>v?(v<.3?"약하게":"강하게"):"끔"],
 ["전체 음량","vol",[1,.7,.4,.15],pct],
 ["배경음악 음량","mvol",[.8,.5,.25,0,1],pct],
 ["배경음악 선택","bgm",["random","stage","up"],v=>({random:"랜덤 (신나는 곡 포함)",stage:"스테이지 곡만",up:"신나는 곡만"})[v]],
 ["효과음","svol",[1,.7,.4,0],pct],
 ["FPS / 프레임 표시 (F3)","fps",[false,true],v=>v?"켬":"끔"]
];
const TABS=[["set","⚙ 설정"],["stats","📊 내 스탯"],["codex","📖 도감"],["combo","🔗 조합표"],["rx","⚗️ 원소 반응"]];
const TABF={
 set:()=>SETS.map((s,i)=>`<div class="setrow" data-i="${i}">${s[0]}<span>${s[3](S[s[1]])}</span></div>`).join("")+`<div class="legend" style="text-align:center;margin-top:12px">항목을 클릭하면 바뀝니다 · 자동 저장 · 저사양 PC는 품질 '낮음'(조명 효과 끔)</div>`,
 stats:tabStats,codex:tabCodex,combo:tabCombo,rx:tabRx
};
function tabStats(){
 const c=chr(),rows=[
  ["최대 HP",player.maxHp],["피해 배율","×"+dmgMul().toFixed(2)],["공격 간격","×"+rateMul().toFixed(2)],["이동 속도",Math.round(speed())],
  ["흡수 범위",Math.round(pickupRange())],["받는 피해",Math.round(armorMul()*100)+"%"],["치명타",`${Math.round(critC()*100)}% · ×${critM().toFixed(2)}`],["경험치 획득","×"+xpMul().toFixed(2)],
  ["상태이상 위력","×"+statusPot().toFixed(2)],["원소 반응 피해","×"+rxMul().toFixed(2)],["범위","×"+areaMul().toFixed(2)],["무기 수량","+"+passives.multi.level],
  ["드롭률","×"+dropMul().toFixed(1)],["초당 재생",(passives.regen.level*.5).toFixed(1)],["다시 뽑기",rollsLeft()+"회"],["부활",player.revives+"회"],["처치",kills],["생존 시간",fmt(elapsed)]];
 let h=`<h3>${c.i} ${c.n} · Lv.${level} · ${MODES[mode].n} · ${STG[selSt].n}</h3><div class="trait">★ ${c.trait} — ${c.d}</div><div class="sgrid">${rows.map(r=>`<div><small>${r[0]}</small><b>${r[1]}</b></div>`).join("")}</div>`;
 h+=`<h3>무기별 피해</h3>${dmgTable(99)}`;
 if(isGun()&&player.gun)h+=`<h3>${GW().i} 총기 — 현재 ${GW().n}</h3><div class="sgrid">${[["1발 피해",Math.round(gunDmg())],["발사 간격",gunInt().toFixed(2)+"초"],["장탄",gunCyl()+"발"],["재장전",gunRel().toFixed(2)+"초"],["관통",gu("gpier")],["동시 탄환",1+gu("gspr")],["치명타 피해","×"+critM().toFixed(2)],["스킬",player.gun.sk.map((s,i)=>(i+1)+":"+GUN_SK[s.k].i).join(" ")||"-"]].map(r=>`<div><small>${r[0]}</small><b>${r[1]}</b></div>`).join("")}</div>`;
 h+=`<h3>무기</h3><table class="wt"><tr><th>무기</th><th>Lv</th><th>원소</th><th>1회 피해</th><th>수량</th><th>공격 간격</th></tr>`;
 for(const k in weapons){const w=weapons[k];if(!(w.level>0))continue;const st=elOf(w.kind);
  h+=`<tr><td>${w.icon} ${w.name}${defs[k]?"":" ★"}</td><td>${w.level}</td><td>${st?`<span style="color:${st.c}">${st.i} ${st.n}</span>`:"-"}</td><td>${Math.round(w.damage*dmgMul())}</td><td>${wc(w)}</td><td>${w.kind==="orbit"||w.kind==="aegis"?"상시 접촉":w.kind==="beam"||w.kind==="prism"?"상시 회전 · 같은 적 "+(w.rate*rateMul()).toFixed(2)+"초":(w.rate*rateMul()).toFixed(2)+"초"}</td></tr>`}
 h+=`</table><h3>패시브</h3><div class="syn">`;
 let any=false;for(const k in passives){const p=passives[k];if(p.level>0){any=true;h+=`<span style="color:#d8c8ff">${p.icon} ${p.name} Lv.${p.level} — ${p.desc}</span>`}}
 h+=(any?"":'<span class="dim">없음</span>')+`</div><h3>원소 반응</h3><div class="syn">`;
 const act=activeRx(ownedElems());
 h+=act.length?act.map(k=>rxChip(k,runRx[k]?` ×${runRx[k]}`:"")).join(""):'<span class="dim">아직 활성화된 반응이 없습니다 — 조합표/원소 반응 탭 참고</span>';
 return h+"</div>";
}
/* 피해 출처 이름: 무기 / 상태이상 지속 피해 / 원소 반응 / 직업 기믹 */
function srcName(k){
 const w=weapons[k];if(w)return `${w.icon} ${w.name}${defs[k]?"":" ★"}`;
 if(k.startsWith("st_")){const s=STATUS[k.slice(3)];return s?`${s.i} ${s.n} <small>상태이상</small>`:k}
 if(k.startsWith("rx_")){const r=REACT[k.slice(3)];return r?`${r.i} ${r.n} <small>반응</small>`:k}
 if(k==="trait"){const c=chr();return `${c.i} ${c.trait} <small>직업</small>`}
 const p=passiveDefs[k];if(p)return `${p.icon} ${p.name} <small>패시브</small>`;
 if(k.startsWith("ss_")){const s=SW_SK[k.slice(3)];return s?`${s.i} ${s.n} <small>스킬</small>`:k}
 if(k.startsWith("su_")){const u=SW_ULT[{su_katana:"katana",su_sword:"sword",su_great:"great"}[k]];return u?`${u.i} ${u.n} <small>궁극기</small>`:k}
 if(k.startsWith("ul_")){const u=ST_ULT[k.slice(3)];return u?`${u.i} ${u.n} <small>궁극마법</small>`:k}
 const STN={st_bolt:"⭐ 별빛 탄",st_shard:"✳️ 별 조각",st_orb:"🌈 원소 산탄",st_sing:"🌌 중력 붕괴",st_meteor:"☄️ 유성 낙하",st_storm:"🌀 원소 폭풍",st_tele:"✨ 텔레포트 폭발"};if(STN[k])return STN[k];
 const SWN={sw_slash:"⚔️ 베기",sw_slash3:"⚔️ 3타 베기",sw_thrust:"⚡ 섬광 찌르기",sw_wave:"🌙 검기",sw_slam:"💥 지면 강타",sw_dual:"🌙 쌍도 추가 베기",sw_crush:"🌋 파쇄 충격파",sw_flame:"🔥 염검 폭발",sw_frost:"❄️ 얼음 파편",sw_rai:"⚡ 뇌절 연쇄",sw_ghost:"👥 잔상 베기"};if(SWN[k])return SWN[k];
 if(k==="revolver")return "🔫 리볼버";if(k==="fan")return "🔫 패닝 <small>우클릭</small>";if(k==="gun_exp")return "💥 폭발탄";if(k==="gun_sg")return "💥 산탄총";if(k==="gun_rf")return "🎯 장총";if(k==="gun_wave")return "🌠 레일 충격파";if(k==="gun_exe")return "🪓 처형탄";if(k==="gun_roll")return "🌀 구르기 폭발";
 if(k.startsWith("sk_")){const s=GUN_SK[k.slice(3)];return s?`${s.i} ${s.n} <small>스킬</small>`:k}
 return"기타";
}
/* 출처별 누적 피해 표: 총 피해 · 초당 피해 · 비중 막대 */
function dmgTable(max){
 const keys=Object.keys(DMG).filter(k=>DMG[k]>=1).sort((a,b)=>DMG[b]-DMG[a]);if(!keys.length)return'<div class="dim" style="text-align:center">아직 기록된 피해가 없습니다</div>';
 let tot=0;for(const k of keys)tot+=DMG[k];const t=Math.max(1,elapsed),top=DMG[keys[0]];
 const f=v=>v>=1e6?(v/1e6).toFixed(2)+"M":v>=1e4?(v/1e3).toFixed(1)+"k":Math.round(v)+"";
 let h=`<table class="wt dmg"><tr><th>출처</th><th>총 피해</th><th>초당</th><th>비중</th></tr>`;
 for(const k of keys.slice(0,max))h+=`<tr><td>${srcName(k)}</td><td>${f(DMG[k])}</td><td>${f(DMG[k]/t)}</td><td class="bar"><i style="width:${(DMG[k]/top*100).toFixed(1)}%"></i><span>${(DMG[k]/tot*100).toFixed(1)}%</span></td></tr>`;
 return h+`<tr class="sum"><td>합계</td><td>${f(tot)}</td><td>${f(tot/t)}</td><td></td></tr></table>`;
}
function tabCodex(){
 const dx=(save&&save.dex)||{},seenW=dx.w||{},seenP=dx.p||{};
 const total=Object.keys(defs).length+comboRecipes.length+Object.keys(passiveDefs).length,got=Object.keys(seenW).length+Object.keys(seenP).length;
 const wcard=(k,o,gold)=>{const seen=seenW[k],lk=UNLOCK[k]&&!unlocked(k);return `<div class="card${seen?"":" no"}${gold?" gold":""}"><span class="ic">${lk?"🔒":o.icon}</span><b>${o.name}</b><br>${elTag(o.kind)}${o.ch2||(defs[o.a]&&defs[o.a].ch2)?'<span class="eltag ch2">🌌 챕터 2</span>':""}${lk?`<span class="eltag lock">🔒 ${UNLOCK[k].d}</span>`:seen?"":'<span class="eltag">미발견</span>'}<p>${o.desc}</p></div>`};
 let h=`<div class="legend">한 번이라도 획득한 무기·패시브는 밝게 표시됩니다 · 발견 ${got}/${total}</div>`;
 h+=`<h3>기본 무기 (${Object.keys(defs).length}) · 무기 칸 ${MAX_W}</h3><div class="cgrid">${Object.keys(defs).map(k=>wcard(k,defs[k])).join("")}</div>`;
 h+=`<h3>조합 무기 (${comboRecipes.length})</h3><div class="cgrid">${comboRecipes.map(r=>wcard(r.key,r,true)).join("")}</div>`;
 h+=`<h3>패시브 (${Object.keys(passiveDefs).length}) · 동시에 최대 ${MAX_P}개</h3><div class="cgrid">${Object.keys(passiveDefs).map(k=>{const p=passiveDefs[k];return `<div class="card${seenP[k]?"":" no"}"><span class="ic">${p.icon}</span><b>${p.name}</b>${p.ch2?' <span class="eltag ch2">🌌 챕터 2</span>':""}<p>${p.desc} · 최대 Lv.${p.max}</p></div>`}).join("")}</div>`;
 h+=`<h3>상태이상</h3><div class="cgrid">${Object.keys(STATUS).map(k=>{const s=STATUS[k],src=Object.keys(defs).filter(w=>ELEM[defs[w].kind]===k).map(w=>defs[w].icon).join(" ");
  return `<div class="card"><span class="ic">${s.i}</span><b style="color:${s.c}">${s.n}</b><p>${s.d}<br><small>${src?"부여하는 무기: "+src:"냉기 5중첩 · 초전도 반응 · 절대영도로 발생"}</small></p></div>`}).join("")}</div>`;
 return h;
}
function tabCombo(){
 const inRun=!pauseFromTitle;
 let h=`<div class="legend">기본 무기 Lv.5 + 패시브 Lv.3 + 플레이어 Lv.8 → 레벨업 선택지와 보물상자에 조합 무기가 등장합니다. 조합하면 재료 무기 칸이 비고, 조합 무기는 칸을 차지하지 않습니다.</div>`;
 for(const r of comboRecipes){
  const a=defs[r.a],b=passiveDefs[r.b],done=inRun&&weapons[r.key]&&weapons[r.key].level>0;
  const wa=inRun&&weapons[r.a]?weapons[r.a].level:0,pb=inRun&&passives[r.b]?passives[r.b].level:0,ready=inRun&&!done&&wa>=5&&pb>=3;
  const prog=(v,m)=>inRun?`<div class="pbar"><i style="width:${Math.min(100,v/m*100)}%"></i></div><small>Lv.${v}/${m}</small>`:`<small> · Lv.${m}</small>`;
  h+=`<div class="recipe${done?" done":ready?" ready":""}"><div>${a.icon} ${a.name}${prog(done?5:wa,5)}</div><span class="op">+</span><div>${b.icon} ${b.name}${prog(done?3:pb,3)}</div><span class="op">→</span>
   <div><b>${r.icon} ${r.name}</b> ${elTag(r.kind)}<br><small>${done?"✅ 보유 중":ready?(level>=8?"✨ 다음 레벨업에 등장!":"플레이어 Lv.8이 되면 등장"):r.desc}</small></div></div>`;
 }
 return h;
}
function tabRx(){
 const inRun=!pauseFromTitle,own=inRun?ownedElems():new Set(),seen=(save&&save.dex&&save.dex.r)||{};
 let h=`<div class="legend">한 적에게 두 원소가 동시에 걸리면 반응이 일어납니다. 같은 적에게는 잠시 후 다시 발동 · ⚗️ 촉매의 룬으로 강화 · ✨ 원소의 룬은 상태이상 자체를 강화</div><div class="cgrid">`;
 for(const k in REACT){
  const r=REACT[k],A=STATUS[r.a],B=STATUS[r.b],on=own.has(r.a)&&own.has(r.b);
  h+=`<div class="card${on?" gold":""}"><span class="ic">${r.i}</span><b style="color:${r.c}">${r.n}</b>${seen[k]?"":' <span class="eltag">미발견</span>'}<br><span class="eltag" style="color:${A.c}">${A.i} ${A.n}</span><span class="eltag" style="color:${B.c}">${B.i} ${B.n}</span>${on?'<span class="eltag" style="color:#ffe58a">지금 발동 가능</span>':""}<p>${r.d}${inRun&&runRx[k]?`<br><b>이번 판 ${runRx[k]}회</b>`:""}</p></div>`;
 }
 return h+`</div><h3>공통 규칙</h3><div class="card"><p>🧊 빙결된 적은 항상 치명타를 받고 피해가 +50% (쇄빙) · 🎯 약화된 적은 모든 피해 +25% · ☠️ 중독된 적이 죽으면 주변 3명에게 독이 번집니다 · 💫 기절한 적은 움직이거나 공격하지 못합니다 · 🟣 저주받은 채 죽은 적은 영혼 폭발을 일으킵니다.</p></div>`;
}
function renderPause(){
 const tabs=TABS.filter(t=>!(pauseFromTitle&&t[0]==="stats"));
 if(!tabs.some(t=>t[0]===pTab))pTab=tabs[0][0];
 $("ptabs").innerHTML=tabs.map(t=>`<button data-t="${t[0]}" class="${t[0]===pTab?"on":""}">${t[1]}</button>`).join("");
 $("pbody").innerHTML=TABF[pTab]();
}
$("ptabs").addEventListener("click",e=>{const b=e.target.closest("[data-t]");if(!b)return;pTab=b.dataset.t;sfx("ui");renderPause()});
$("pbody").addEventListener("click",e=>{
 const row=e.target.closest("[data-i]");if(!row)return;
 const s=SETS[+row.dataset.i],opts=s[2],k=s[1];
 S[k]=opts[(opts.indexOf(S[k])+1)%opts.length];
 if(k==="q"){if(S.q!=="auto")qi=+S.q;applyQ()}
 if(k==="vol"||k==="mvol"||k==="svol")setVol();
 if(k==="bgm"&&running)songPend=true;
 saveSet();renderPause();sfx("ui");
});
function openPause(fromTitle,tab){clearPtr();
 pauseFromTitle=fromTitle;pTab=tab||"set";joy.on=false;joy.x=joy.y=0;
 $("pauseTitle").textContent=fromTitle?"📖 메뉴":"⏸ 일시정지";
 $("resume").textContent=fromTitle?"닫기":"계속하기";
 $("giveup").style.display=fromTitle?"none":"";
 if(!fromTitle)paused=true;
 renderPause();show("pause");
}
function closePause(){clearPtr();$("pause").style.display="none";if(!pauseFromTitle){paused=false;last=performance.now()}}
$("resume").onclick=closePause;
/* 모바일 버튼: 일시정지 / 구르기(레인저) */
$("mPause").onclick=()=>{if(running&&!paused)openPause(false)};
$("mDash").addEventListener("pointerdown",e=>{e.preventDefault();tryDash()});
$("giveup").onclick=()=>{$("pause").style.display="none";paused=false;running=false;endRun(false);show("gameover")};
/* ── 타이틀 / 저장 ── */
function commit(){mem[slot]=save;try{localStorage.setItem("ms_save",JSON.stringify(mem))}catch(e){}}
/* 저장 데이터 이전: 직업 개편(15 → 6) 시 사라지거나 무료가 된 직업의 구매 골드 환급 · 스테이지 클리어/누적 기록 필드 추가 */
function migrate(s){
 if(!s.dex)s.dex={w:{},p:{},r:{}};
 if(!s.cl)s.cl=[s.clears||0,0,0];while(s.cl.length<STG.length)s.cl.push(0);
 if(!s.tot)s.tot={kills:0,rx:0,boss:0,maxLv:0,pyro5:false};
 if(!s.v3){s.v3=1;
  const OLD={knight:300,frostmage:400,stormcaller:600,alchemist:700,gunner:800,windwalker:800,ninja:1000,lancer:1000,sapper:1200,astro:1500};
  let ref=0;for(const k of s.chars||[])if(OLD[k]&&(!CH[k]||!CH[k].cost))ref+=OLD[k];
  s.chars=(s.chars||[]).filter(k=>CH[k]);if(!s.chars.includes("mage"))s.chars.push("mage");
  if(ref){s.gold+=ref;s.refund=ref}
 }
 return s;
}
const stageOpen=i=>i===0||!!(save&&save.cl&&save.cl[i-1]>0);
/* 직업 해금 조건 (save.cc: 직업_스테이지별 클리어 수) */
const REQ_TXT={gs3:"총잡이로 🍄 독버섯 늪 클리어 시 해금",stella:"✨ 별의 심연 최종 보스 스텔라 처치 시 해금"};
function reqMet(r){const cc=save&&save.cc||{};if(r==="gs3")return (cc.gunslinger_3||0)>0;if(r==="stella")return !!(save&&save.stella);return true}
function pickSlot(i){slot=i;save=migrate(mem[i]||{gold:0,chars:["mage"],perks:{},clears:0,best:0,v3:1});if(!CH[selCh])selCh="mage";commit();showTitle()}
function pickCh(k){const c=CH[k];if(!save.chars.includes(k)){if(c.req&&!reqMet(c.req))return;if(save.gold<c.cost)return;save.gold-=c.cost;save.chars.push(k);commit()}selCh=k;showTitle()}
function pickSt(i){if(!stageOpen(i))return;selSt=i;showTitle()}
function buyPk(k){const lv=pl(k),c=pkCost(k,lv);if(lv>=PK_MAX||save.gold<c)return;save.gold-=c;save.perks[k]=lv+1;commit();showTitle()}
function backSlots(){slot=-1;save=null;showTitle()}
function startRun(){if(!CH[selCh]||!save.chars.includes(selCh))selCh="mage";if(!stageOpen(selSt))selSt=0;runBonus=0;reset()}
function showTitle(){
 running=false;paused=false;hideAll();
 const el=$("title"),p=el.firstElementChild;el.style.display="flex";
 if(save){let ch=false;for(const k in CH)if(!CH[k].cost&&!save.chars.includes(k)&&(!CH[k].req||reqMet(CH[k].req))){save.chars.push(k);ch=true}if(ch)commit()}
 if(slot<0){
  p.innerHTML=`<h2>⚔️ MINI SURVIVORS</h2><div class="sub">저장 슬롯을 선택하세요</div><div class="choices">${[0,1,2].map(i=>{const s=mem[i];
   return `<div class="choice t-new" data-a="slot" data-k="${i}"><div class="icon">💾</div><b>슬롯 ${i+1}</b><p>${s?`💰 ${s.gold} · 클리어 ${s.cl?s.cl.reduce((a,b)=>a+b,0):s.clears||0}회<br>최고 생존 ${fmt(s.best||0)} · ∞ ${fmt(s.bestInf||0)}`:"비어 있음 — 새로 시작"}</p></div>`}).join("")}</div>
   <div style="text-align:center"><button class="ghost" data-a="code">💾 저장 코드로 불러오기</button> <button class="ghost" data-a="notes">📜 패치 노트</button> <button class="ghost" data-a="set">⚙ 설정</button></div>`;
  return;
 }
 const dx=save.dex||{},got=Object.keys(dx.w||{}).length+Object.keys(dx.p||{}).length,tot=Object.keys(defs).length+comboRecipes.length+Object.keys(passiveDefs).length;
 const ref=save.refund;if(ref){delete save.refund;commit()}
 const lockedW=Object.keys(UNLOCK).filter(k=>!unlocked(k));
 p.innerHTML=`<h2>⚔️ MINI SURVIVORS</h2><div class="sub">슬롯 ${slot+1} · 💰 ${save.gold} · 📖 도감 ${got}/${tot} · ∞ 최고 ${fmt(save.bestInf||0)}</div>
 ${ref?`<div class="rec unlock">🎁 직업 개편 보상: 사라진 직업 구매 골드 💰${ref} 환급</div>`:""}
 <h3>직업 — 각자 고유 기믹을 가지고 시작합니다</h3><div class="choices g3">${Object.keys(CH).map(k=>{const c=CH[k],own=save.chars.includes(k),src=portrait(k),w=defs[c.start]||(c.startLbl?{icon:"⚔️",name:c.startLbl,kind:""}:{icon:"🔫",name:"총기 3종 (전용)",kind:""}),st=elOf(w.kind),rq=c.req&&!reqMet(c.req);
  return `<div class="choice t-up${selCh===k?" sel":""}${own||(!rq&&save.gold>=c.cost)?"":" lock"}" data-a="ch" data-k="${k}">${src?`<img class="por" src="${src}" alt="">`:`<div class="icon">${c.i}</div>`}<b>${c.n}</b><div class="trait">★ ${c.trait}</div><p>${c.d}<br><span class="sw">${w.icon} ${w.name}${st?` <span style="color:${st.c}">${st.i} ${st.n}</span>`:""}</span>${c.hp?` · HP ${c.hp>0?"+":""}${c.hp}`:""}${c.sp?` · 이속 ${c.sp>0?"+":""}${Math.round(c.sp*100)}%`:""}</p><div class="stat">${own?(selCh===k?"선택됨":"보유"):rq?"🔒 "+REQ_TXT[c.req]:"🔒 해금 💰 "+c.cost}</div></div>`}).join("")}</div>
 ${[1,2].map(chn=>`<h3>${chn===1?"스테이지 · 챕터 1":"🌌 챕터 2 — 새로운 적·무기·패시브 · 권장: 영구 강화 대부분 Lv.20"}</h3><div class="choices g3">${STG.map((s,i)=>{if((s.ch||1)!==chn)return"";const lk=!stageOpen(i);
  return `<div class="choice t-pas${chn===2?" ch2":""}${selSt===i?" sel":""}${lk?" lock":""}" data-a="st" data-k="${i}"><b>${s.n}</b><p>${lk?`🔒 ${STG[i-1].n} 클리어 시 해금`:s.d}</p>${save.cl[i]?`<div class="stat">클리어 ${save.cl[i]}회</div>`:""}</div>`}).join("")}</div>`).join("")}
 ${lockedW.length?`<div class="legend" style="text-align:center">🔒 잠긴 무기: ${lockedW.map(k=>`${defs[k].icon} ${defs[k].name} (${UNLOCK[k].d})`).join(" · ")}</div>`:""}
 <h3>모드</h3><div class="choices" style="grid-template-columns:1fr 1fr">${MODES.map((m,i)=>`<div class="choice t-new${mode===i?" sel":""}" data-a="mode" data-k="${i}"><b>${m.n}</b><p>${m.d}${i===1?` · 골드 ×1.2 · 최고 ${fmt(save.bestInf||0)}`:""}</p></div>`).join("")}</div>
 <h3>영구 강화 (골드로 구매 · 최대 Lv.${PK_MAX})</h3><div class="pkgrid">${Object.keys(PK).map(k=>{const P=PK[k],lv=pl(k),c=pkCost(k,lv),mx=lv>=PK_MAX;
  return `<div class="pk${mx?" max":save.gold<c?" poor":""}" data-a="pk" data-k="${k}" title="${P.d}"><div class="pkh"><span class="ic">${P.i}</span><b>${P.n}</b><small>Lv.${lv}</small></div>
   <div class="pbar"><i style="width:${lv/PK_MAX*100}%"></i></div><p>${P.d}</p><div class="pkf"><span>현재 ${lv?P.v(lv):"-"}</span><em>${mx?"MAX":"💰 "+c}</em></div></div>`}).join("")}</div>
 <button class="go" data-a="go">▶ 출발</button>
 <div style="text-align:center"><button class="ghost" data-a="back">슬롯 변경</button> <button class="ghost" data-a="code">💾 저장 코드</button> <button class="ghost" data-a="dex">📖 도감 · 조합표</button> <button class="ghost" data-a="notes">📜 패치 노트</button> <button class="ghost" data-a="set">⚙ 설정</button></div>`;
}
$("title").addEventListener("click",e=>{
 const t=e.target.closest("[data-a]");if(!t)return;const a=t.dataset.a,k=t.dataset.k;sfx("ui");
 if(a==="slot")pickSlot(+k);else if(a==="ch")pickCh(k);else if(a==="st")pickSt(+k);else if(a==="pk")buyPk(k);else if(a==="mode"){mode=+k;showTitle()}
 else if(a==="go")startRun();else if(a==="back")backSlots();else if(a==="set")openPause(true,"set");else if(a==="code")openCode();else if(a==="notes")showNotes();else if(a==="dex")openPause(true,"codex");
});
$("restart").onclick=showTitle;
/* 재시작: 같은 직업 · 스테이지 · 모드로 바로 새 판 (일시정지에서 누르면 지금 판은 포기 처리 후 골드 지급) */
function restartRun(fromPause){if(!save)return;if(fromPause){running=false;endRun(false)}hideAll();sfx("ui");runBonus=0;startRun()}
$("again").onclick=()=>restartRun(false);$("againP").onclick=()=>restartRun(true);
/* ── 저장 코드: 슬롯 데이터를 문자열로 내보내 다른 기기·브라우저에서 불러오기 ──
   형식: MS1.<deflate+base64url>.<체크섬>  (압축 미지원 브라우저는 MS0. 비압축) */
const b64u={enc:u=>{let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")},
 dec:s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}};
const ckSum=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36).slice(0,5)};
async function zipBytes(u,mode){const cs=mode?new CompressionStream("deflate-raw"):new DecompressionStream("deflate-raw");
 const out=new Response(new Blob([u]).stream().pipeThrough(cs));return new Uint8Array(await out.arrayBuffer())}
async function makeCode(s){const raw=new TextEncoder().encode(JSON.stringify(s));let body,v="MS0";
 if(typeof CompressionStream==="function"){try{body=b64u.enc(await zipBytes(raw,1));v="MS1"}catch(e){}}
 if(!body)body=b64u.enc(raw);return `${v}.${body}.${ckSum(v+body)}`}
async function readCode(code){
 code=(code||"").replace(/\s+/g,"");const m=/^(MS[01])\.([A-Za-z0-9_-]+)\.([0-9a-z]+)$/.exec(code);if(!m)throw"형식이 올바르지 않은 코드입니다.";
 if(ckSum(m[1]+m[2])!==m[3])throw"코드가 손상되었습니다. 전체를 빠짐없이 복사했는지 확인하세요.";
 let u=b64u.dec(m[2]);if(m[1]==="MS1"){if(typeof DecompressionStream!=="function")throw"이 브라우저는 압축 코드를 지원하지 않습니다.";u=await zipBytes(u,0)}
 const s=JSON.parse(new TextDecoder().decode(u));
 if(!s||typeof s!=="object"||typeof s.gold!=="number"||!Array.isArray(s.chars)||typeof(s.perks||{})!=="object")throw"저장 데이터가 아닙니다.";
 s.gold=Math.max(0,Math.floor(s.gold));s.perks=s.perks||{};for(const k in s.perks)s.perks[k]=Math.max(0,Math.min(PK_MAX,s.perks[k]|0));
 return migrate(s)}
let codeSlot=0,codeArm=false;
async function openCode(){
 hideAll();const el=$("codeov"),p=el.firstElementChild;el.style.display="flex";codeArm=false;if(slot>=0)codeSlot=slot;
 const exp=save?await makeCode(save):"";
 p.innerHTML=`<h2>💾 저장 코드</h2><div class="sub">코드를 복사해 두면 다른 기기·브라우저에서도 그대로 이어서 할 수 있어요</div>
 ${save?`<h3>내보내기 — 슬롯 ${slot+1} (💰 ${save.gold})</h3><textarea id="cdOut" class="cdbox" readonly>${exp}</textarea>
  <div class="cdrow"><button class="go sm" data-c="copy">📋 코드 복사</button><span id="cdCopyMsg" class="cdmsg"></span></div>`:""}
 <h3>불러오기</h3><textarea id="cdIn" class="cdbox" placeholder="MS1.… 로 시작하는 저장 코드를 붙여넣으세요"></textarea>
 <div class="cdrow">덮어쓸 슬롯 ${[0,1,2].map(i=>`<button class="ghost cdslot${codeSlot===i?" on":""}" data-c="slot" data-k="${i}">슬롯 ${i+1}${mem[i]?"":" (빈)"}</button>`).join("")}</div>
 <div class="cdrow"><button class="go sm" data-c="load">📥 불러오기</button><span id="cdMsg" class="cdmsg"></span></div>
 <div style="text-align:center"><button class="ghost" data-c="close">← 돌아가기</button></div>`;
}
$("codeov").addEventListener("click",async e=>{
 const t=e.target.closest("[data-c]");if(!t)return;const c=t.dataset.c;sfx("ui");
 if(c==="close"){$("codeov").style.display="none";showTitle();return}
 if(c==="copy"){const ta=$("cdOut"),msg=$("cdCopyMsg");let ok=false;
  try{await Promise.race([navigator.clipboard.writeText(ta.value),new Promise((_,j)=>setTimeout(j,800))]);ok=true}catch(x){}
  if(!ok){try{ta.focus();ta.select();ok=document.execCommand("copy")}catch(x){}}
  ta.select();msg.textContent=ok?"✔ 복사됨! 메모장 등에 붙여넣어 보관하세요":"코드를 길게 눌러(또는 Ctrl+C) 직접 복사하세요";return}
 if(c==="slot"){codeSlot=+t.dataset.k;codeArm=false;document.querySelectorAll(".cdslot").forEach(b=>b.classList.toggle("on",+b.dataset.k===codeSlot));$("cdMsg").textContent="";return}
 if(c==="load"){const msg=$("cdMsg");let s;
  try{s=await readCode($("cdIn").value)}catch(err){msg.className="cdmsg bad";msg.textContent="⚠ "+(typeof err==="string"?err:"코드를 읽을 수 없습니다.");codeArm=false;return}
  if(mem[codeSlot]&&!codeArm){codeArm=true;msg.className="cdmsg warn";msg.textContent=`슬롯 ${codeSlot+1}에 기존 데이터가 있어요. 덮어쓰려면 한 번 더 누르세요 (💰 ${s.gold})`;return}
  mem[codeSlot]=s;slot=codeSlot;save=s;commit();$("codeov").style.display="none";showTitle();toast(`📥 슬롯 ${codeSlot+1}에 불러왔습니다 · 💰 ${s.gold}`)}
});

/* ── 패치 노트: 새 버전으로 처음 접속했을 때 1회 팝업 (타이틀의 📜 버튼으로 다시 보기) ── */
const GAME_VER="7.9";
const NOTES=[
 {v:"7.9",t:"별의 아이 스텔라",items:[
  "🎵 챕터 2 고유 BGM — 🍄 독버섯 늪: 어둡고 축축한 늪 (물방울·거품·개구리) · ⚙️ 태엽 성채: 째깍거리는 기계 행진 · 🌌 별의 심연: 신비로운 우주",
  "✨ 별의 심연 최종 보스 <b>스텔라</b>: 등장하면 잡몹이 사라지고 1:1 결투 · 체력에 따라 3단계 패턴 (별빛 소용돌이·유성우·별자리 광선·블랙홀·초신성) · 전용 BGM",
  "🌟 플레이어블 <b>별의 아이 스텔라</b> — 스텔라 처치 시 해금 · 별 부름 지팡이 · 다시 차오르는 실드 · Space 텔레포트",
  "시작 시 🌈 원소 마법(상태이상 산탄) / 🌌 우주 마법(중력 붕괴) 루트 선택 · Lv.10 특전 E, Lv.20 특전 F 궁극마법 (빅뱅·블랙홀·별의 비·원소 대폭발·절대영도·뇌운)",
  "🔄 R키 재시작 (결과 화면 · 일시정지 메뉴)"]},
 {v:"7.8.1",t:"사운드 수정",items:[
  "🔊 공격속도가 오르거나 적이 많을 때 소리가 깨지던 현상 수정 (동시에 만드는 효과음 수 제한 · 효과음이 많을 땐 가벼운 음색 · 리버브 연산 절감 · 오디오 버퍼 확대)",
  "🔨 타격음이 끝까지 안 나오던 버그 수정: 타격음 전용 몫을 따로 둬서 항상 들림",
  "🏆 온라인 리더보드 제거"]},
 {v:"7.8",t:"새 직업: 검객",items:[
  "⚔️ <b>검객</b> 추가 — 총잡이로 🍄 독버섯 늪을 클리어하면 해금",
  "마우스로 조준해 베는 근접 전투 · 누르고 있으면 3연격 콤보 · 판 시작 시 刀 도 / 劍 검 / 大 대검 중 선택",
  "Space 섬보(무적 대시) — 공격이 닿기 직전에 피하면 '간파!' 시간 감속 + 반격 버프 · 반격 자세 · 회전 베기 · 일섬 등 무적기 다수",
  "Lv.10 특전: 시작 무기가 3갈래 중 하나로 진화하고 궁극기(E) 해금 · Lv.20 특전: 궁극기 강화",
  "궁극기: 도 '천섬' · 검 '만검귀종' · 대검 '대지 가르기' (공격으로 게이지 충전)"]},
 {v:"7.7",t:"최적화 · 편의 개선 · 리더보드",items:[
  "⚡ 최적화: 조명 레이어 갱신 절반으로, 적 그림자 한 번에 그리기, 가까운 경험치 보석 자동 합치기, 파티클이 많을 때 가벼운 모양 사용",
  "🎁 보물상자 선택지가 레벨업과 같은 카드로 표시 (설명·수치·원소·조합 힌트 동일)",
  "⚠ 공격 예고 구분: 적 공격은 빨간 바닥 + 굵은 테두리 + ⚠ 표시, 내 공격은 하늘색 점선 + 조준점",
  "🔢 데미지 숫자 설정: 모두 표시 / 치명타만 / 끄기",
  "🏆 온라인 리더보드: 스테이지별 최고 생존 시간 순위 (게시된 페이지에서 로그인 시)"]},
 {v:"7.6",t:"직업 특전 · 패치 노트",items:[
  "⭐ <b>직업 특전</b>: 모든 챕터에서 Lv.10마다 직업 전용 특전 3개 중 1개 선택 (레벨업 보상과 별도로 추가)",
  "직업마다 특전 5~6종 — 예) 총잡이 '학살의 눈': 데드아이가 시야의 모든 적을 노리고 일반 적은 즉시 제거",
  "총잡이: 가지고 있는 스킬의 특전이 더 잘 나옴 · 선택창 아래에 보유 특전 표시",
  "📜 패치 노트 팝업 추가 (새 버전 첫 접속 시 1회)",
  "총잡이 설명 정리: '리볼버 피해' → '총기 피해' 등 세 총 모두에 적용되는 강화로 표기"]},
 {v:"7.5",t:"총잡이 챕터 2",items:["챕터 2 전용 총잡이 강화 4종 (공명탄 · 처형탄 · 레일 충격파 · 총잡이의 숙련)","챕터 2: 레벨당 총기 피해 +3%, 처치 시 HP 회복, 구르기 흙먼지 폭발","이동 중 캐릭터가 멈추는 현상 수정"]},
 {v:"7.4",t:"저장 코드",items:["💾 저장 코드: 다른 기기·브라우저로 진행 상황 옮기기","선택지 후 혼자 한쪽으로 걸어가는 버그 수정","보스가 빨리 죽으면 체력바가 남는 현상 수정"]},
 {v:"7.3",t:"룬 · 드롭 수정",items:["조합 재료 룬이 훨씬 잘 나오고, 무기 Lv.5면 짝 룬 보장","후반에 자석·회복 아이템이 드랍되지 않던 버그 수정"]}
];
function showNotes(){
 const el=$("notesov"),p=el.firstElementChild;el.style.display="flex";
 const [cur,...old]=NOTES;
 p.innerHTML=`<h2>📜 패치 노트</h2><div class="sub">Mini Survivors v${cur.v} — ${cur.t}</div>
  <ul class="nlist">${cur.items.map(x=>`<li>${x}</li>`).join("")}</ul>
  <details class="nold"><summary>이전 업데이트</summary>${old.map(n=>`<h3>v${n.v} — ${n.t}</h3><ul class="nlist">${n.items.map(x=>`<li>${x}</li>`).join("")}</ul>`).join("")}</details>
  <button class="go" data-n="ok">확인</button>`;
}
$("notesov").addEventListener("click",e=>{if(e.target.closest("[data-n]")||e.target.id==="notesov"){sfx("ui");$("notesov").style.display="none"}});
function maybeNotes(){let seen=null;try{seen=localStorage.getItem("ms_ver")}catch(x){}
 if(seen!==GAME_VER){showNotes();try{localStorage.setItem("ms_ver",GAME_VER)}catch(x){}}}

