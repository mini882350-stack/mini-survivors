/* ═══════════════ dev.js ═══════════════
   개발자 테스트 모드: 코드를 입력하면 켜짐 (대소문자 무관)
   · 아무 화면에서나 키보드로 코드 입력 (자판 위치 기준이라 한/영 상태와 무관) · 또는 설정 탭의 입력칸
   · 켜지면 화면 오른쪽 위 🛠 버튼 / F9 / ` 키로 패널 열기 · 상태는 이 브라우저에 저장 (패널에서 끄기 가능)
   코드는 원문 대신 해시로만 비교 */
"use strict";
const DEV={on:false,god:false,dmg:1,nospawn:false,open:false,wasPaused:false};
try{DEV.on=localStorage.getItem("ms_dev")==="1"}catch(e){}
const devHash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
const DEV_H="3zkwte",DEV_LEN=11;
function devTry(code){
 if(devHash(String(code||"").trim().toLowerCase())!==DEV_H)return false;
 DEV.on=true;try{localStorage.setItem("ms_dev","1")}catch(e){}devBtn();toast("🛠 개발자 테스트 모드 ON — F9 / ` / 🛠 버튼으로 패널");sfx("evo");return true;
}
/* 키보드로 아무 데서나 입력: 물리 키(e.code)를 글자로 바꿔 최근 11자 비교 */
let devBuf="";
addEventListener("keydown",e=>{
 if(e.target&&(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"))return;
 const c=e.code;let ch="";if(/^Key[A-Z]$/.test(c))ch=c[3].toLowerCase();else if(/^Digit\d$/.test(c))ch=c[5];else if(/^Numpad\d$/.test(c))ch=c[6];
 if(ch){devBuf=(devBuf+ch).slice(-DEV_LEN);if(!DEV.on&&devTry(devBuf))devBuf=""}
 if(DEV.on&&(c==="F9"||c==="Backquote")){e.preventDefault();devToggle()}
});
/* 🛠 버튼 */
function devBtn(){let b=$("devbtn");if(!DEV.on){if(b)b.remove();return}
 if(!b){b=document.createElement("button");b.id="devbtn";b.textContent="🛠";b.title="개발자 패널 (F9)";b.onclick=e=>{e.stopPropagation();devToggle()};document.body.appendChild(b)}}
/* 패널 */
function devToggle(){
 let p=$("devov");if(!p){p=document.createElement("div");p.id="devov";document.body.appendChild(p);p.addEventListener("click",devClick)}
 DEV.open=!DEV.open;
 if(DEV.open){DEV.wasPaused=paused;if(running)paused=true;if(typeof ADV!=="undefined"&&ADV.on&&ADV.play)ADV.paused=true;devRender();p.style.display="block"}
 else{p.style.display="none";if(typeof ADV!=="undefined"&&ADV.on&&ADV.play&&!ADV.panel)ADV.paused=false;if(running&&!DEV.wasPaused&&!["levelup","chest","pause","gameover"].some(id=>$(id).style.display==="flex")){paused=false;last=performance.now()}}
}
const devB=(a,t,on)=>`<button data-dv="${a}"${on?' class="on"':""}>${t}</button>`;
function devRender(){
 const p=$("devov");if(!p)return;const inRun=running;
 if(typeof ADV!=="undefined"&&ADV.on){p.innerHTML=`<div class="dvh">🛠 개발자 — 모험 모드 <button data-dv="close">✕</button></div><div class="dvs">전투</div><div class="dvg">${devB("god",(DEV.god?"✅":"⬜")+" 무적",DEV.god)}${devB("dmg",(DEV.dmg>1?"✅":"⬜")+" 피해 ×10",DEV.dmg>1)}${devB("a_heal","❤️ HP·MP 회복")}${devB("a_kill","☠️ 몬스터 전부 처치")}${devB("a_cd","⏱️ 쿨다운 초기화")}${devB("a_boss","👑 보스 소환")}</div><div class="dvs">성장</div><div class="dvg">${devB("a_lv1","⬆️ 레벨 +1")}${devB("a_lv5","⏫ 레벨 +5")}${devB("a_gold","💰 골드 +100,000")}${devB("a_leg","🟧 전설 장비 3개")}${devB("a_sk","✨ 모든 스킬 Lv.5")}${devB("a_map","🗺️ 모든 지역 개방")}${devB("a_pot","🧪 물약 +20")}</div><div class="dvn">${ADV.play?`${ADV.c.name} · Lv.${ADV.c.lv} · ${AMAP[ADV.map].n} · 몬스터 ${ADV.mons.length}`:"캐릭터를 먼저 고르세요"}</div>`;return}
 p.innerHTML=`<div class="dvh">🛠 개발자 테스트 모드 <button data-dv="close">✕</button></div>
 <div class="dvs">전투</div><div class="dvg">
  ${devB("god",(DEV.god?"✅":"⬜")+" 무적",DEV.god)}${devB("dmg",(DEV.dmg>1?"✅":"⬜")+" 피해 ×10",DEV.dmg>1)}${devB("nospawn",(DEV.nospawn?"✅":"⬜")+" 적 생성 끔",DEV.nospawn)}
  ${devB("heal","❤️ HP 회복")}${devB("killall","☠️ 적 전부 처치")}${devB("cd","⏱️ 쿨다운 초기화")}</div>
 <div class="dvs">성장</div><div class="dvg">
  ${devB("lv1","⬆️ 레벨 +1")}${devB("lv5","⏫ 레벨 +5")}${devB("tal","⭐ 다음 특전까지")}${devB("chest","🎁 보물상자")}${devB("maxall","💪 무기·패시브 최대")}${devB("ult","⚡ 궁극기 게이지 가득")}</div>
 <div class="dvs">진행</div><div class="dvg">
  ${devB("t60","⏩ 시간 +60초")}${devB("t590","🕘 9:50으로 (최종 보스 직전)")}${devB("boss","👑 보스 소환")}${devB("elite","💀 엘리트 소환")}${devB("stella","✨ 스텔라 소환")}${devB("win","🏆 즉시 클리어")}</div>
 <div class="dvs">저장 데이터 (현재 슬롯)</div><div class="dvg">
  ${devB("gold","💰 골드 +1,000,000")}${devB("unlock","🔓 직업·스테이지 전부 해금")}${devB("perks","🏅 영구 강화 최대")}${devB("off","🚪 개발자 모드 끄기")}</div>
 <div class="dvn">${inRun?`현재: ${chr().n} · ${STG[selSt].n} · ${fmt(elapsed)} · Lv.${level} · 적 ${enemies.length}`:"게임 밖: 저장 데이터 항목만 동작합니다 (슬롯을 먼저 고르세요)"}</div>`;
}
function devClick(e){
 const b=e.target.closest("[data-dv]");if(!b)return;e.stopPropagation();const a=b.dataset.dv;sfx("ui");
 const run=running,need_=()=>{if(!run){toast("게임 중에만 쓸 수 있어요");return false}return true};
 switch(a){
  case"close":devToggle();return;
  case"a_heal":case"a_kill":case"a_cd":case"a_boss":case"a_lv1":case"a_lv5":case"a_gold":case"a_leg":case"a_sk":case"a_map":case"a_pot":{
   if(!ADV.play){toast("캐릭터를 먼저 고르세요");break}const c=ADV.c;
   if(a==="a_heal"){ADV.p.hp=ADV.st.maxHp;ADV.p.mp=ADV.st.maxMp}else if(a==="a_kill"){for(const m of ADV.mons.slice())if(!m.dead)advKill(m)}else if(a==="a_cd"){ADV.cd={}}
   else if(a==="a_boss"){if(AMAP[ADV.map].town)toast("사냥터에서만 가능");else if(!ADV.boss){ADV.bossT[ADV.map]=0;advSpawnBoss()}}
   else if(a==="a_lv1"||a==="a_lv5"){for(let i=0;i<(a==="a_lv5"?5:1);i++)advGainXP(aNeed(c.lv)-c.xp)}else if(a==="a_gold")c.gold+=1e5;
   else if(a==="a_leg"){for(let i=0;i<3&&c.bag.length<AMAX_BAG;i++)c.bag.push(advItem(c.lv+2,{rar:4}));toast("🟧 가방에 전설 장비 지급")}
   else if(a==="a_sk"){for(const id of askOf(c.job))c.sk[id]=ASK_MAXLV;toast("✨ 모든 스킬 Lv.5 — K 창에서 슬롯 등록")}else if(a==="a_map"){for(const k of AMAP_ORDER)if(AMAP[k].req)c.boss[AMAP[k].req]=Math.max(1,c.boss[AMAP[k].req]||0);toast("🗺️ 모든 지역 개방")}
   else if(a==="a_pot"){c.pot.hp+=20;c.pot.mp+=20}
   advCalc();ADV.dirty=true;break}
  case"god":DEV.god=!DEV.god;break;
  case"dmg":DEV.dmg=DEV.dmg>1?1:10;break;
  case"nospawn":DEV.nospawn=!DEV.nospawn;break;
  case"heal":if(need_()){player.hp=player.maxHp;if(player.st)player.sh=stShieldMax()}break;
  case"killall":if(need_()){for(const e of enemies)if(!e.final&&!e.stella){e.hp=0}}break;
  case"cd":if(need_()){player.dashCD=0;if(player.gun)for(const s of player.gun.sk)s.cd=0;if(player.sw)for(const s of player.sw.sk)s.cd=0;if(player.st){player.st.eCD=player.st.fCD=0;for(const s of player.st.sk)s.cd=0}for(const k in weapons)weapons[k].cool=0}break;
  case"lv1":case"lv5":if(need_()){devClose();for(let i=0;i<(a==="lv5"?5:1);i++)xp+=need;checkLevel();return}break;
  case"tal":if(need_()){devClose();const t=Math.ceil((level+1)/TAL_LV)*TAL_LV;level=t-1;xp=need;checkLevel();return}break;
  case"chest":if(need_()){devClose();chestQueue.push(1);return}break;
  case"maxall":if(need_()){
   if(player.gun)for(const k in GUN_UP)if(!GUN_UP[k].ch2||ch2On())player.gun.u[k]=GUN_UP[k].max;
   if(player.sw)for(const k in SW_UP)if(!SW_UP[k].ch2||ch2On())player.sw.u[k]=SW_UP[k].max;
   if(player.st)for(const k in ST_UP){const u=ST_UP[k];if((!u.ch2||ch2On())&&(!u.route||u.route===player.st.route))player.st.u[k]=u.max}
   if(!player.gun&&!player.sw&&!player.st)for(const k in weapons){const w=weapons[k];if(w.level>0)while(!maxed(k))weaponUpgrade(k)}
   for(const k in passives)if(passives[k].level>0)while(passives[k].level<passives[k].max)passiveUpgrade(k);toast("💪 보유 중인 강화 전부 최대")}break;
  case"ult":if(need_()){if(player.sw){player.sw.ultOn=true;player.sw.ult=100}if(player.st){player.st.eCD=player.st.fCD=0}}break;
  case"t60":if(need_())elapsed+=60;break;
  case"t590":if(need_()&&elapsed<590)elapsed=590;break;
  case"boss":if(need_()){makeEnemy("boss",player.x+360,player.y);stinger("boss")}break;
  case"elite":if(need_()){makeEnemy("elite",player.x+300,player.y)}break;
  case"stella":if(need_()){if(!runSt.duel)spawnStella()}break;
  case"win":if(need_()){devClose();running=false;victory();return}break;
  case"gold":if(save){save.gold+=1e6;commit();if(!run)showTitle()}else toast("슬롯을 먼저 고르세요");break;
  case"unlock":if(save){save.cl=STG.map((_,i)=>Math.max(1,save.cl[i]||0));save.cc=save.cc||{};save.cc.gunslinger_3=Math.max(1,save.cc.gunslinger_3||0);save.stella=1;for(const k in CH)if(!save.chars.includes(k))save.chars.push(k);commit();if(!run)showTitle();toast("🔓 전부 해금")}else toast("슬롯을 먼저 고르세요");break;
  case"perks":if(save){for(const k in PK)save.perks[k]=PK_MAX;commit();if(!run)showTitle();toast("🏅 영구 강화 최대 (다음 판부터 적용)")}else toast("슬롯을 먼저 고르세요");break;
  case"off":DEV.on=DEV.god=DEV.nospawn=false;DEV.dmg=1;try{localStorage.removeItem("ms_dev")}catch(x){}devClose();devBtn();toast("개발자 모드 OFF");return;
 }
 devRender();
}
function devClose(){if(DEV.open)devToggle()}
devBtn();
