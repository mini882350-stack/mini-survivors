/* ═══════════════ data.js ═══════════════
   무기 · 패시브 · 조합 레시피 · 직업/외형 · 스테이지 · 영구 강화 · 적 · 상태이상/반응 · 해금 조건
   밸런스 조정은 대부분 이 파일에서. */
"use strict";
/* ── 기본 무기 (21) ── */
const defs={
 wand:{icon:"🔮",name:"마력탄",kind:"orb",level:0,damage:20,rate:.50,count:1,range:650,desc:"가까운 적을 추적하는 빛의 구체를 발사합니다. 2레벨마다 탄이 늘어납니다."},
 knife:{icon:"🗡️",name:"회전 단검",kind:"knife",level:0,damage:34,rate:.78,count:2,range:440,desc:"전방으로 날아가는 날카로운 칼날을 여러 개 발사합니다."},
 frost:{icon:"❄️",name:"빙결 파편",kind:"crystal",level:0,damage:16,rate:.72,count:3,range:560,desc:"적을 추적하는 얼음 결정을 퍼뜨립니다."},
 lightning:{icon:"⚡",name:"낙뢰",kind:"bolt",level:0,damage:58,rate:1.25,count:1,range:450,desc:"가까운 적 위에 즉시 번개를 떨어뜨립니다. 수가 늘면 여러 적을 동시에 타격합니다."},
 fire:{icon:"🔥",name:"화염 고리",kind:"flame",level:0,damage:30,rate:1.05,count:6,range:125,desc:"몸 주위를 도는 불꽃이 닿는 적을 태우며 강하게 밀쳐냅니다. 주기적으로 화염 파동도 터집니다."},
 holy:{icon:"☀️",name:"성휘",kind:"star",level:0,damage:44,rate:1.55,count:1,range:520,desc:"빛나는 별을 발사하며 적을 관통합니다."},
 boomerang:{icon:"🪃",name:"월광 부메랑",kind:"boomerang",level:0,damage:32,rate:1.0,count:1,range:480,desc:"날아갔다가 돌아오는 부메랑. 오가며 적을 관통합니다."},
 poison:{icon:"☠️",name:"독성 구름",kind:"poison",level:0,damage:18,rate:1.5,count:1,range:500,desc:"적 위에 독구름을 남겨 범위 지속 피해와 둔화를 줍니다."},
 orbit:{icon:"🪐",name:"위성검",kind:"orbit",level:0,damage:26,rate:.45,count:2,range:105,desc:"몸 주위를 회전하는 검이 닿는 적을 베어냅니다."},
 cannon:{icon:"💥",name:"폭렬포",kind:"cannon",level:0,damage:70,rate:1.7,count:1,range:620,desc:"착탄 시 범위 폭발을 일으키는 포탄을 발사합니다."},
 spear:{icon:"🔱",name:"관통창",kind:"spear",level:0,damage:52,rate:1.1,count:1,range:330,desc:"가까운 적 방향으로 긴 창을 내질러 직선상의 모든 적을 꿰뚫습니다."},
 mine:{icon:"💣",name:"지뢰",kind:"mine",level:0,damage:60,rate:1.6,count:1,range:0,desc:"발밑에 지뢰를 설치합니다. 적이 다가오면 폭발합니다."},
 meteor:{icon:"☄️",name:"유성우",kind:"meteor",level:0,damage:75,rate:1.9,count:2,range:460,desc:"적 머리 위로 유성을 떨어뜨립니다. 잠시 뒤 범위 폭발."},
 shuriken:{icon:"✴️",name:"표창",kind:"shuriken",level:0,damage:24,rate:.85,count:1,range:520,desc:"적 사이를 튕겨 다니며 여러 번 타격합니다."},
 // 신규
 scythe:{icon:"🌒",name:"혈월 낫",kind:"scythe",level:0,damage:40,rate:1.0,count:1,range:115,desc:"이동 방향을 크게 베어 여러 적에게 출혈. 적중할 때마다 HP를 조금 흡수합니다."},
 icelance:{icon:"🧊",name:"빙창",kind:"icelance",level:0,damage:46,rate:1.3,count:1,range:520,desc:"적을 꿰뚫는 얼음 창. 끝에 닿으면 얼음 파편 6개로 부서집니다."},
 tesla:{icon:"🔋",name:"전류 구체",kind:"tesla",level:0,damage:14,rate:2.2,count:1,range:130,desc:"천천히 떠다니며 주변 적에게 계속 전류를 흘리는 구체. 수량만큼 동시에 감전시킵니다."},
 flamer:{icon:"🐲",name:"화룡 방사",kind:"flamer",level:0,damage:9,rate:.16,count:1,range:150,desc:"가장 가까운 적 방향으로 짧은 화염을 끊임없이 뿜어 화상을 입힙니다."},
 beam:{icon:"🔦",name:"프리즘 광선",kind:"beam",level:0,damage:16,rate:.3,count:1,range:260,desc:"몸 주위를 천천히 도는 빛줄기. 닿는 모든 적에게 약화를 겁니다."},
 quake:{icon:"🪨",name:"대지 파동",kind:"quake",level:0,damage:38,rate:2.0,count:1,range:210,desc:"퍼져 나가는 충격파로 주변 적을 밀쳐내고 기절시킵니다."},
 sigil:{icon:"🔯",name:"파멸의 인장",kind:"sigil",level:0,damage:30,rate:1.8,count:2,range:420,desc:"적 발밑에 인장을 새겨, 잠시 뒤 범위 안 적들에게 저주를 겁니다."},
 // 챕터 2 전용 (ch2: 2챕터 스테이지에서만 등장)
 gravorb:{icon:"🪐",name:"중력 구슬",kind:"gravorb",level:0,damage:34,rate:1.7,count:1,range:520,ch2:1,desc:"천천히 날아가며 주변 적을 끌어당기고 갈아버리는 중력 구슬. 끝에서 붕괴 폭발."},
 chainblade:{icon:"🔗",name:"사슬 낫",kind:"chainblade",level:0,damage:58,rate:1.15,count:1,range:280,ch2:1,desc:"사슬 달린 낫을 던져 직선상의 적을 베고 플레이어 쪽으로 끌어옵니다."},
 radcore:{icon:"☢️",name:"방사능 코어",kind:"radcore",level:0,damage:22,rate:.5,count:1,range:125,ch2:1,desc:"주변에 방사선을 뿜어 중독과 화상을 번갈아 겁니다 → 독화염 반응."},
 railgun:{icon:"🎯",name:"레일건",kind:"railgun",level:0,damage:190,rate:2.6,count:1,range:900,ch2:1,desc:"화면을 가로지르는 초고속 관통 광선. 느리지만 일직선의 모든 적에게 막대한 피해."}
};
/* ── 패시브 (14) · 동시에 MAX_P개 ── */
const passiveDefs={
 might:{name:"힘의 룬",icon:"💪",level:0,max:5,desc:"모든 무기 피해 +15%"},
 haste:{name:"시간의 룬",icon:"⏱️",level:0,max:5,desc:"모든 무기 공격속도 +12%"},
 boots:{name:"바람의 장화",icon:"👟",level:0,max:5,desc:"이동속도 +12%"},
 heart:{name:"생명의 룬",icon:"❤️",level:0,max:5,desc:"최대 HP +20, 즉시 일부 회복"},
 magnet:{name:"자석의 룬",icon:"🧲",level:0,max:5,desc:"경험치 흡수 범위 +25%"},
 armor:{name:"철갑 룬",icon:"🛡️",level:0,max:5,desc:"받는 피해 -8%"},
 amp:{name:"원소의 룬",icon:"✨",level:0,max:5,desc:"상태이상 피해·지속시간 +20%"},
 cata:{name:"촉매의 룬",icon:"⚗️",level:0,max:5,desc:"원소 반응 피해 +30%, 반응 재발동 대기 -12%"},
 eye:{name:"예리한 눈",icon:"👁️",level:0,max:5,desc:"치명타 확률 +5%, 치명타 피해 +15%"},
 area:{name:"확산의 룬",icon:"🌐",level:0,max:5,desc:"폭발·오라·구름·충격파 등 범위 +12%"},
 multi:{name:"증식의 룬",icon:"🔁",level:0,max:3,desc:"모든 무기 수량 +1 (투사체·궤도·광선·인장 등)"},
 fang:{name:"흡혈의 이빨",icon:"🦷",level:0,max:5,desc:"적 처치 시 HP +0.4 회복"},
 luck:{name:"행운 부적",icon:"🍀",level:0,max:5,desc:"아이템·상자 드롭 +30%. Lv.3부터 레벨업 선택지 4개"},
 regen:{name:"재생의 룬",icon:"💚",level:0,max:5,desc:"초당 HP 0.5 회복"},
 reson:{name:"공명의 수정",icon:"🔮",level:0,max:5,ch2:1,desc:"원소 반응이 일어나면 가까운 적 2명에게 반응 피해가 연쇄 (Lv당 +12%)"},
 execu:{name:"처형인의 인장",icon:"🪓",level:0,max:5,ch2:1,desc:"HP가 (10+2×Lv)% 이하인 일반 적을 타격하면 즉시 처치"},
 thorns:{name:"가시 갑옷",icon:"🌵",level:0,max:5,ch2:1,desc:"닿은 적에게 피해 반사 · 받는 피해 -3%/Lv"}
};
/* ── 조합 무기 (25): 기본 무기 Lv.5 + 패시브 Lv.3 + 플레이어 Lv.8 ── */
const comboRecipes=[
 {a:"wand",b:"might",key:"arcane",icon:"🌌",name:"아케인 폭풍",kind:"arcane",damage:120,rate:.72,count:3,range:700,desc:"마력탄 + 힘의 룬. 관통 아케인 구체."},
 {a:"knife",b:"haste",key:"bladestorm",icon:"⚔️",name:"폭풍의 칼날",kind:"bladeStorm",damage:82,rate:.48,count:6,range:500,desc:"회전 단검 + 시간의 룬. 사방으로 칼날 폭풍."},
 {a:"frost",b:"haste",key:"glacier",icon:"🏔️",name:"빙하 심장",kind:"glacier",damage:105,rate:.72,count:8,range:210,desc:"빙결 파편 + 시간의 룬. 주변 적을 얼리고 둔화."},
 {a:"fire",b:"might",key:"inferno",icon:"☄️",name:"지옥의 왕관",kind:"inferno",damage:105,rate:.72,count:8,range:195,desc:"화염고리 + 힘의 룬. 탄환 제거와 강한 넉백."},
 {a:"holy",b:"might",key:"solar",icon:"🌞",name:"태양의 창",kind:"solar",damage:145,rate:1.05,count:3,range:760,desc:"성휘 + 힘의 룬. 거대한 관통 별창."},
 {a:"boomerang",b:"boots",key:"crescent",icon:"🌙",name:"초승달 폭풍",kind:"crescent",damage:90,rate:.82,count:3,range:620,desc:"월광 부메랑 + 바람의 장화. 커다란 초승달이 오가며 베어냅니다."},
 {a:"poison",b:"magnet",key:"plague",icon:"🟢",name:"역병의 안개",kind:"plague",damage:85,rate:.9,count:6,range:330,desc:"독성 구름 + 자석의 룬. 주변을 뒤덮는 독안개."},
 {a:"lightning",b:"might",key:"thunder",icon:"🌩️",name:"천둥왕관",kind:"thunder",damage:170,rate:.95,count:2,range:600,desc:"낙뢰 + 힘의 룬. 적 사이를 튀는 연쇄 번개."},
 {a:"orbit",b:"armor",key:"aegis",icon:"🛡️",name:"성역의 검",kind:"aegis",damage:70,rate:.15,count:4,range:150,desc:"위성검 + 철갑 룬. 회전 검, 탄환 차단, 받는 피해 -15%."},
 {a:"cannon",b:"area",key:"fortress",icon:"🏰",name:"요새포",kind:"fortress",damage:220,rate:1.6,count:2,range:650,desc:"폭렬포 + 확산의 룬. 거대한 폭발 포탄."},
 {a:"spear",b:"heart",key:"bloodlance",icon:"🩸",name:"혈룡창",kind:"bloodlance",damage:150,rate:.9,count:3,range:520,desc:"관통창 + 생명의 룬. 세 갈래 창격, 적중 시 HP 흡수."},
 {a:"mine",b:"magnet",key:"singularity",icon:"🕳️",name:"특이점",kind:"singularity",damage:180,rate:1.6,count:2,range:420,desc:"지뢰 + 자석의 룬. 적을 빨아들인 뒤 대폭발."},
 {a:"meteor",b:"haste",key:"starfall",icon:"🌠",name:"별의 종말",kind:"starfall",damage:190,rate:.9,count:5,range:520,desc:"유성우 + 시간의 룬. 화면을 뒤덮는 유성 폭격."},
 {a:"shuriken",b:"boots",key:"shadowstar",icon:"🌑",name:"그림자 표창",kind:"shadowstar",damage:95,rate:.7,count:4,range:480,desc:"표창 + 바람의 장화. 적 사이를 끝없이 튕기는 그림자 표창."},
 {a:"scythe",b:"fang",key:"reaper",icon:"💀",name:"사신의 대낫",kind:"reaper",damage:110,rate:.9,count:1,range:170,desc:"혈월 낫 + 흡혈의 이빨. 온몸을 휘감는 360° 베기, 흡혈량 대폭 증가."},
 {a:"icelance",b:"area",key:"abszero",icon:"🌨️",name:"절대영도",kind:"abszero",damage:120,rate:1.2,count:2,range:600,desc:"빙창 + 확산의 룬. 창이 끝에서 폭발해 범위 안 적을 모두 빙결."},
 {a:"tesla",b:"haste",key:"plasma",icon:"🌀",name:"플라즈마 코어",kind:"plasma",damage:40,rate:1.6,count:2,range:200,desc:"전류 구체 + 시간의 룬. 플레이어 곁을 돌며 더 많은 적에게 강한 전류."},
 {a:"flamer",b:"regen",key:"phoenix",icon:"🪶",name:"불사조의 숨결",kind:"phoenix",damage:22,rate:.12,count:1,range:210,desc:"화룡 방사 + 재생의 룬. 넓고 긴 화염, 불타는 적을 처치하면 HP 회복."},
 {a:"beam",b:"multi",key:"prism",icon:"🌈",name:"프리즘 폭풍",kind:"prism",damage:34,rate:.2,count:3,range:330,desc:"프리즘 광선 + 증식의 룬. 무지개 광선 세 줄기가 빠르게 회전."},
 {a:"quake",b:"armor",key:"titan",icon:"🗿",name:"타이탄의 분노",kind:"titan",damage:95,rate:1.7,count:1,range:300,desc:"대지 파동 + 철갑 룬. 두 번 몰아치는 거대한 충격파, 긴 기절."},
 {a:"sigil",b:"luck",key:"doom",icon:"📕",name:"종말의 서",kind:"doom",damage:80,rate:1.4,count:4,range:480,desc:"파멸의 인장 + 행운 부적. 커다란 인장, 저주가 끝나면 쌓인 피해를 더 크게 터뜨림."},
 {a:"gravorb",b:"reson",key:"horizon",icon:"🌌",name:"사건의 지평선",kind:"horizon",damage:90,rate:1.5,count:2,range:600,desc:"중력 구슬 + 공명의 수정. 거대한 중력장이 적을 삼키고 저주한 뒤 대붕괴."},
 {a:"chainblade",b:"execu",key:"hellchain",icon:"⛓️",name:"지옥 사슬",kind:"hellchain",damage:130,rate:.9,count:3,range:360,desc:"사슬 낫 + 처형인의 인장. 세 갈래 사슬이 맞은 적에게서 다시 튀어 나갑니다."},
 {a:"radcore",b:"thorns",key:"meltdown",icon:"☣️",name:"노심 용융",kind:"meltdown",damage:55,rate:.4,count:1,range:175,desc:"방사능 코어 + 가시 갑옷. 넓은 방사선, 3번마다 노심 폭발."},
 {a:"railgun",b:"eye",key:"orbital",icon:"🛰️",name:"궤도 포격",kind:"orbital",damage:320,rate:2.2,count:4,range:650,desc:"레일건 + 예리한 눈. 하늘에서 위성 광선이 여러 적에게 내리꽂힙니다."}
];
/* 밸런스: 모든 무기(기본 + 조합) 기본 공격력 +30% */
const WEAPON_DMG_MUL=1.3;
for(const k in defs)defs[k].damage=Math.round(defs[k].damage*WEAPON_DMG_MUL);
for(const r of comboRecipes)r.damage=Math.round(r.damage*WEAPON_DMG_MUL);
/* ── 무기 해금 (회차 목표). 조건: 누적 기록 t={kills,rx,boss,maxLv,clears:[..],pyro5} ── */
const UNLOCK={
 icelance:{d:"누적 처치 1,000",f:t=>t.kills>=1000},
 tesla:{d:"누적 원소 반응 300회",f:t=>t.rx>=300},
 flamer:{d:"화염술사로 5분 생존",f:t=>t.pyro5},
 beam:{d:"한 판에서 레벨 25 달성",f:t=>t.maxLv>=25},
 quake:{d:"보스 5마리 처치 (누적)",f:t=>t.boss>=5},
 sigil:{d:"저주받은 폐허 클리어",f:t=>(t.clears&&t.clears[1])>0}
};
/* ── 직업 (9): 시작 무기 + 고유 기믹 ──
   hp 최대HP 보정 · sp 이동속도 보정 · trait 고유 기믹 이름 */
const CH={
 mage:{n:"원소술사",i:"🧙",start:"wand",hp:0,sp:0,cost:0,trait:"원소 공명",d:"원소 반응 피해 +50%. 반응이 일어날 때마다 모든 무기의 재사용 대기시간이 줄어듭니다."},
 knight:{n:"성기사",i:"🛡️",start:"orbit",hp:30,sp:-.05,cost:0,trait:"신성 방벽",d:"10초마다 최대 HP 25%의 보호막. 보호막이 깨지면 성광이 터져 주변 적에게 피해 + 약화."},
 pyro:{n:"화염술사",i:"🔥",start:"fire",hp:-10,sp:0,cost:300,trait:"불꽃 발자국",d:"움직이면 불길이 남아 밟은 적에게 화상. 모든 화상 피해 +30%."},
 ranger:{n:"레인저",i:"🏹",start:"knife",hp:0,sp:.1,cost:400,trait:"구르기",d:"Space(모바일은 🌀 버튼): 무적 구르기(2.5초마다). 구른 뒤 2초간 치명타 확률 +40%."},
 plague:{n:"역병 의사",i:"🧪",start:"poison",hp:10,sp:0,cost:600,trait:"전염",d:"중독이 3명 더 번집니다. 중독된 적이 죽으면 35% 확률로 독 폭발."},
 vamp:{n:"흡혈귀",i:"🦇",start:"scythe",hp:20,sp:.05,cost:900,trait:"피의 갈증",d:"적 처치 시 HP 1 회복. HP 50% 이하일 때 모든 피해 +30%."},
 berserker:{n:"광전사",i:"🪓",start:"spear",hp:25,sp:0,cost:700,trait:"분노",d:"처치할 때마다 분노 +1 (최대 30, 3초 유지). 분노당 피해 +1.2% · 공격속도 +0.8%. 받는 피해 +10%."},
 cryo:{n:"빙결 마녀",i:"❄️",start:"frost",hp:0,sp:0,cost:800,trait:"혹한의 기운",d:"주변 적에게 1초마다 냉기를 겁니다(둔화, 5중첩 시 빙결). 빙결된 적에게 주는 피해 +30%."},
 gunslinger:{n:"총잡이",i:"🤠",start:null,hp:10,sp:.05,cost:100000,trait:"황야의 총잡이",d:"마우스로 조준 · 클릭(누르고 있으면 연사)으로 사격 · 휠로 스킬 선택, 우클릭으로 사용 (기본: 패닝) · E: 리볼버/산탄총/장총 교체 · Space: 즉시 재장전 무적 구르기(3초). 레벨업에서 총기·스킬·스탯 강화만 등장합니다."},
 swordsman:{n:"검객",i:"⚔️",start:null,hp:20,sp:.08,cost:0,req:"gs3",startLbl:"刀 도 · 劍 검 · 大 대검 (시작 시 선택)",trait:"섬보와 간파",d:"마우스로 조준 · 클릭(누르고 있으면 연격)으로 베기 · Space: 무적 섬보 — 공격이 닿기 직전에 피하면 '간파'로 반격 버프 · 휠로 스킬 선택, 우클릭 사용 · Lv.10 특전에서 무기가 진화하고 궁극기(E)가 열립니다."},
 stella:{n:"별의 아이 스텔라",i:"🌟",start:null,hp:-10,sp:.06,cost:0,req:"stella",startLbl:"🪄 별 부름 지팡이 (원소 / 우주 루트 선택)",trait:"별의 장막",d:"마우스로 조준 · 클릭(누르고 있으면 연사)으로 별빛 탄 · 루트 마법은 자동 시전 · 맞지 않으면 다시 차오르는 실드 · Space: 조준점으로 텔레포트 · Lv.10 특전 E, Lv.20 특전 F 궁극마법."},
 gambler:{n:"도박사",i:"🎲",start:"shuriken",hp:-10,sp:.05,cost:1000,trait:"행운의 주사위",d:"레벨업·상자 선택지 +1, 레벨업마다 다시 뽑기 2회. 치명타 확률 +10%."}
};
/* 직업별 외형 (hero.js의 리깅 캐릭터가 사용)
   skin 피부 · hair/hs 머리색·스타일 · eye 눈 · fit 의상(robe/armor/tunic/coat/bare/dress/vest)
   c1/c2 의상 그라디언트 · c3 보조색 · trim 장식 · pants/boots · cape/capeIn 망토 겉/안 · head 머리 장식 · item 무기 · mote 주변 입자 · ol 외곽선 */
const LOOK={
 mage:{skin:"#ffdcc4",hair:"#e6e2f6",hs:"long",eye:"#5a7cff",fit:"robe",c1:"#4456d8",c2:"#1a2068",c3:"#8a9bff",trim:"#f2c14e",pants:"#232a5a",boots:"#3a2a4a",
  head:"wizard",hat:"#2a36a0",hat2:"#151c5c",item:"staff",mote:"elem",ol:"#0e1236"},
 knight:{skin:"#f6d2b2",hair:"#e8c070",hs:"short",eye:"#3a6ad8",fit:"armor",metal:"#d6dde8",metal2:"#6f7a90",c1:"#2f52c0",c2:"#182c70",trim:"#f2c14e",pants:"#3a3f52",boots:"#8a93a6",
  cape:"#c22a40",capeIn:"#6e1222",head:"helm",plume:"#e23a4e",item:"sword",shield:1,ol:"#141824"},
 pyro:{skin:"#ffd2b0",hair:"#ff8a2a",hs:"spiky",eye:"#ff8a1a",fit:"robe",c1:"#e2481f",c2:"#5e100a",c3:"#ffb040",trim:"#ffc04a",pants:"#3a1410",boots:"#2a140e",
  head:"pyrohood",hat:"#9a1c10",hat2:"#4a0a06",item:"fstaff",mote:"ember",flameHem:1,ol:"#2a0804"},
 ranger:{skin:"#f2c8a0",hair:"#6a4428",hs:"short",eye:"#3a9a4a",fit:"tunic",c1:"#5a9a50",c2:"#2a4a26",c3:"#8a5c34",trim:"#d8b070",pants:"#4a3a2a",boots:"#5a3a22",
  cape:"#3d6e38",capeIn:"#1f3a1c",head:"hood",hat:"#3f7238",hat2:"#22421f",scarf:"#d8a848",back:"quiver",item:"bow",ol:"#0e1a0c"},
 plague:{skin:"#d8ccb8",hair:"#1a1a1a",hs:"none",eye:"#8fe36a",fit:"coat",c1:"#34343e",c2:"#101014",c3:"#5a4a3a",trim:"#8fe36a",pants:"#1a1a20",boots:"#2a2420",
  head:"plaguehat",hat:"#1c1c24",hat2:"#0a0a0e",item:"flask",mote:"bubble",ol:"#050507"},
 vamp:{skin:"#f2e8f0",hair:"#18121e",hs:"slick",eye:"#ff2a4a",fit:"coat",c1:"#2e0a16",c2:"#0e0206",c3:"#7a1028",trim:"#e8d8e8",pants:"#140810",boots:"#0e0608",
  cape:"#160410",capeIn:"#a8102e",collar:1,cravat:"#f4f0f4",item:"scythe",mote:"blood",ol:"#060104"},
 berserker:{skin:"#eab08e",hair:"#d0541a",hs:"braid",eye:"#4a8ad8",fit:"bare",c1:"#6a4630",c2:"#3a2416",c3:"#9a7a56",trim:"#d8c090",pants:"#4a3424",boots:"#7a5a3e",
  cape:"#6a4a32",capeIn:"#3e2a1c",head:"hornhelm",metal:"#a2a8b2",metal2:"#5a606c",paint:"#3a7ad8",item:"axe",beard:1,ol:"#1a0c04"},
 cryo:{skin:"#fbeaf2",hair:"#bfe8ff",hs:"long",eye:"#4ac8ff",fit:"dress",c1:"#eaf8ff",c2:"#5aa0d8",c3:"#9fd8f0",trim:"#ffffff",pants:"#5a8ac0",boots:"#cfeaff",
  cape:"#4a8ac8",capeIn:"#d8f2ff",head:"icecrown",item:"istaff",mote:"snow",ol:"#123050"},
 gunslinger:{skin:"#f0c8a0",hair:"#5a3a22",hs:"short",eye:"#4a7ab0",fit:"coat",c1:"#9a6236",c2:"#4a2a14",c3:"#2e2620",trim:"#f2c14e",pants:"#3a4c6e",boots:"#5a3a22",
  head:"cowboy",hat:"#7a4e2a",hat2:"#3a2414",item:"revolver",tails:"#8a5630",badge:1,kerchief:"#c8302e",stubble:1,ol:"#1a0e06"},
 swordsman:{skin:"#f4d2b4",hair:"#1a1c2e",hs:"long",eye:"#8ad0ff",fit:"coat",c1:"#2a3a6a",c2:"#141c36",c3:"#e8e4f0",trim:"#c8d8ff",pants:"#1c2238",boots:"#2a2a34",
  head:"headband",band:"#e83a4a",item:"blade",tails:"#2a3a6a",kerchief:"#e8e4f0",ol:"#0a0c18"},
 stella:{skin:"#fbe8f0",hair:"#9a62e8",hs:"stellar",eye:"#ffd36a",fit:"dress",c1:"#3a2a8e",c2:"#150a42",c3:"#d8c8ff",trim:"#ffd84a",pants:"#2a2060",boots:"#efe8ff",
  cape:"#140a40",capeIn:"#7a5ae0",head:"starpins",item:"starstaff",mote:"star",stars:1,eyeStyle:"anime",ol:"#120626"},
 gambler:{skin:"#f2cca8",hair:"#2a1a12",hs:"short",eye:"#e0a830",fit:"vest",c1:"#2c7a52",c2:"#123a26",c3:"#f4f1e8",trim:"#f2c14e",pants:"#1e1e26",boots:"#2a1a14",
  head:"tophat",hat:"#18181e",hat2:"#d8384a",item:"cards",tails:"#1a2a22",chain:1,ol:"#08100c"}
};
for(const k in CH)CH[k].look=LOOK[k]||LOOK.mage;
/* ── 스테이지 ── */
const STG=[
 {n:"🌲 고요한 숲",hp:1,dmg:1,g:1,d:"기본 난이도 · 분열체, 치유사 등장"},
 {n:"🏚️ 저주받은 폐허",hp:1.5,dmg:1.3,g:1.6,d:"고난도 · 순간이동하는 망령 · 골드 ×1.6 (숲 클리어 시 해금)"},
 {n:"🌋 용암 협곡",hp:2.1,dmg:1.6,g:2.3,d:"최고 난이도 · 용암 강은 밟으면 화상 · 주기적 유성 낙하 · 골드 ×2.3 (폐허 클리어 시 해금)"},
 // ── 챕터 2: 영구 강화를 충분히 올려야 하는 고난도 ──
 {n:"🍄 독버섯 늪",ch:2,hp:4.5,dmg:2.4,g:3.2,d:"챕터 2 · 독 늪은 밟으면 느려지고 중독 · 포자 모체, 수호자, 추적자 (용암 협곡 클리어 시 해금)"},
 {n:"⚙️ 태엽 성채",ch:2,hp:6,dmg:2.8,g:4,d:"챕터 2 · 화면을 가로지르는 톱날 · 강철 골렘 (독버섯 늪 클리어 시 해금)"},
 {n:"🌌 별의 심연",ch:2,hp:8,dmg:3.3,g:5,d:"챕터 2 최종 · 중력 우물이 끌어당김 + 별똥 낙하 (태엽 성채 클리어 시 해금)"}
];
/* ── 영구 강화 (골드, 최대 Lv.20): v(lv)=현재 효과 표시 ── */
const PK_MAX=20;
const PK={
 hp:{i:"❤️",n:"체력",d:"최대 HP +10",v:l=>`+${l*10}`},
 dmg:{i:"💪",n:"공격력",d:"피해 +4%",v:l=>`+${l*4}%`},
 cd:{i:"⏱️",n:"가속",d:"공격 간격 -1.5%",v:l=>`-${(l*1.5).toFixed(1)}%`},
 area:{i:"🌐",n:"범위",d:"공격 범위 +1.5%",v:l=>`+${(l*1.5).toFixed(1)}%`},
 crit:{i:"🎯",n:"치명타",d:"치명타 확률 +0.6%",v:l=>`+${(l*.6).toFixed(1)}%`},
 armor:{i:"🛡️",n:"방어",d:"받는 피해 -1.5%",v:l=>`-${(l*1.5).toFixed(1)}%`},
 regen:{i:"💚",n:"재생",d:"초당 HP +0.06",v:l=>`+${(l*.06).toFixed(2)}/초`},
 spd:{i:"👟",n:"이동속도",d:"이동속도 +2%",v:l=>`+${l*2}%`},
 magnet:{i:"🧲",n:"흡수 범위",d:"경험치 흡수 범위 +4%",v:l=>`+${l*4}%`},
 xp:{i:"📖",n:"경험치",d:"경험치 +5%",v:l=>`+${l*5}%`},
 gold:{i:"💰",n:"골드",d:"골드 +6%",v:l=>`+${l*6}%`},
 luck:{i:"🍀",n:"행운",d:"아이템·상자 드롭 +3%",v:l=>`+${l*3}%`},
 reroll:{i:"🎲",n:"다시 뽑기",d:"5레벨마다 판당 다시 뽑기 +1",v:l=>`${Math.floor(l/5)}회`},
 revive:{i:"🕊️",n:"부활",d:"사망 시 폭탄이 터지며 부활. Lv.10에 1회, Lv.20에 2회 · 레벨마다 부활 체력 +3%",v:l=>`${l>=20?2:l>=10?1:0}회 · HP ${Math.min(90,30+l*3)}%`,x:2}
};
const pkCost=(k,lv)=>Math.round((PK[k].x||1)*(lv<10?40*(lv+1):60*(lv+1)));
/* ── 적: r 반지름, h=[기본,초당증가] 체력, s=[기본,초당증가] 속도, x 경험치, g 보석 등급 ── */
const EN={
 grunt:{r:12,h:[34,1],s:[57,.11],c:"#e0566f",x:1,g:0},
 runner:{r:10,h:[28,.7],s:[100,.14],c:"#ffad45",x:2,g:0},
 shooter:{r:14,h:[75,1.5],s:[45,.05],c:"#3fc4d4",x:4,g:1},
 charger:{r:15,h:[120,2.1],s:[48,.06],c:"#d454c8",x:6,g:2},
 tank:{r:22,h:[220,3.4],s:[30,.03],c:"#7f68d8",x:10,g:2,hv:1},
 bomber:{r:11,h:[40,.8],s:[80,.1],c:"#40384a",x:3,g:1},
 splitter:{r:17,h:[95,1.7],s:[48,.08],c:"#5fd08a",x:4,g:1},   // 죽으면 작은 분열체 2마리
 mini:{r:9,h:[22,.5],s:[82,.12],c:"#7fe0a0",x:1,g:0},
 healer:{r:14,h:[110,1.8],s:[40,.05],c:"#f2eaa8",x:9,g:2},    // 주변 적 회복
 wraith:{r:14,h:[70,1.3],s:[72,.1],c:"#9ab0ff",x:5,g:1},      // 주기적 무적 + 순간이동
 magma:{r:24,h:[330,4.2],s:[28,.03],c:"#c8401a",x:12,g:2,hv:1},    // 용암 자국, 죽으면 용암 웅덩이
 imp:{r:11,h:[45,.9],s:[95,.14],c:"#ff7a2a",x:3,g:1},         // 가끔 화염탄
 // 챕터 2 적 (ai: 기본 행동 패턴, hv: 묵직함 — 넉백/기절 저항)
 spore:{r:12,h:[70,1.5],s:[62,.12],c:"#9a6ad0",x:2,g:0,ai:"grunt"},        // 죽으면 포자 구름 (플레이어 둔화)
 skitter:{r:10,h:[55,1.1],s:[112,.15],c:"#e0b040",x:3,g:0,ai:"runner"},
 lancer:{r:15,h:[230,3.2],s:[54,.07],c:"#d04a6a",x:7,g:2,ai:"charger"},
 golem:{r:23,h:[420,5.4],s:[31,.03],c:"#9a8a5a",x:12,g:2,ai:"tank",hv:1},
 drone:{r:11,h:[80,1.2],s:[92,.12],c:"#5a6a7a",x:4,g:1,ai:"bomber"},
 seer:{r:14,h:[150,2.2],s:[45,.05],c:"#40c0b0",x:6,g:1,ai:"shooter"},     // 3갈래 탄
 mother:{r:22,h:[560,6.5],s:[24,.02],c:"#b05ab0",x:14,g:2,ai:"mother",hv:1}, // 포자충을 낳음
 warden:{r:16,h:[300,3.8],s:[38,.04],c:"#6a8aff",x:10,g:2,ai:"warden"},     // 주변 적 피해 -50% 보호막
 stalker:{r:13,h:[180,2.6],s:[72,.1],c:"#8a4ad0",x:8,g:1,ai:"stalker"},     // 예고 후 플레이어 옆으로 순간이동
 elite:{r:18,h:[270,3.8],s:[48,.06],c:"#e6a82a",x:25,g:3},
 boss:{r:35,h:[1400,9],s:[24,0],c:"#c8347e",x:80,g:4}
};
// 스테이지별 특수 적: [종류, 등장 시간(초), 스폰당 확률]
const SPECIAL=[
 [["splitter",50,.07],["healer",140,.025]],
 [["wraith",30,.09],["splitter",60,.05],["healer",110,.03]],
 [["imp",15,.1],["magma",70,.05],["splitter",60,.04],["healer",100,.03]],
 [["mother",60,.03],["warden",90,.03],["stalker",40,.05]],
 [["warden",40,.05],["stalker",30,.07],["mother",80,.025]],
 [["stalker",20,.09],["warden",50,.05],["mother",60,.035]]
];
const CH2MAP={grunt:"spore",runner:"skitter",charger:"lancer",tank:"golem",bomber:"drone",shooter:"seer"};   // 챕터 2: 기본 적 교체
const GR=[5,6.5,8,10,13];   // 등급별 보석 반지름
const XP_MUL=1.35;          // 경험치 획득량 배율 (+35%)

/* ── 상태이상 / 원소 반응 ──
   ELEM: 타격 종류(kind) → 부여하는 상태이상. 무기의 kind로도 조회해서 UI에 원소를 표시함 */
const ELEM={
 flame:"burn",inferno:"burn",boom:"burn",cannon:"burn",fortress:"burn",mine:"burn",singularity:"burn",meteor:"burn",starfall:"burn",flamer:"burn",phoenix:"burn",
 crystal:"chill",glacier:"chill",icelance:"chill",abszero:"chill",
 bolt:"shock",thunder:"shock",tesla:"shock",plasma:"shock",
 poison:"poison",plague:"poison",
 knife:"bleed",bladeStorm:"bleed",slash:"bleed",orbit:"bleed",aegis:"bleed",spear:"bleed",blood:"bleed",bloodlance:"bleed",
 shk:"bleed",shuriken:"bleed",shadow:"bleed",shadowstar:"bleed",boomerang:"bleed",crescent:"bleed",scythe:"bleed",reaper:"bleed",
 orb:"mark",arcane:"mark",star:"mark",solar:"mark",beam:"mark",prism:"mark",
 quake:"stun",titan:"stun",
 sigil:"curse",doom:"curse",
 gravorb:"mark",horizon:"curse",chainblade:"bleed",hellchain:"bleed",radcore:"poison",meltdown:"poison",railgun:"shock",orbital:"shock"
};
const STATUS={
 burn:{n:"화상",i:"🔥",c:"#ff8a3c",d:"3초간 초당 피해 (타격 피해의 30%). 더 강한 불꽃이 들어오면 갱신."},
 chill:{n:"냉기",i:"❄️",c:"#9fe8ff",d:"중첩당 이동속도 -8%. 5중첩이 되면 1.2초 빙결."},
 shock:{n:"감전",i:"⚡",c:"#ffe14a",d:"감전된 적을 때리면 가까운 적에게 전류가 튑니다 (피해 35%)."},
 poison:{n:"중독",i:"☠️",c:"#8fe36a",d:"초당 피해. 중독된 채로 죽으면 주변 적 3명에게 독이 번집니다."},
 bleed:{n:"출혈",i:"🩸",c:"#ff4a6a",d:"최대 6중첩, 중첩마다 초당 피해가 쌓입니다."},
 mark:{n:"약화",i:"🎯",c:"#ffd36a",d:"4초간 받는 피해 +25%."},
 stun:{n:"기절",i:"💫",c:"#e8c890",d:"0.7초간 움직이지 못합니다 (보스는 짧게)."},
 curse:{n:"저주",i:"🟣",c:"#c46aff",d:"5초간 받은 피해를 쌓아 두었다가, 끝나면 35%를 한 번 더 터뜨립니다. 저주받은 채 죽으면 영혼 폭발."},
 frozen:{n:"빙결",i:"🧊",c:"#dff8ff",d:"움직이지 못하고 공격하지 못합니다. 받는 피해 +50%, 항상 치명타(쇄빙)."}
};
// 원소 반응: 한 적에게 a와 b가 동시에 걸리면 발동 (위에서부터 우선)
const REACT={
 steam:{a:"burn",b:"chill",n:"증기 폭발",i:"💨",c:"#e6f3ff",d:"화상 + 냉기 → 두 상태를 소모하며 주변에 큰 폭발 피해"},
 overload:{a:"burn",b:"shock",n:"과부하",i:"💥",c:"#ffb040",d:"화상 + 감전 → 폭발과 함께 주변 적을 강하게 밀쳐냄"},
 superc:{a:"chill",b:"shock",n:"초전도",i:"🧊",c:"#aee8ff",d:"냉기 + 감전 → 즉시 빙결 + 약화"},
 concuss:{a:"shock",b:"stun",n:"뇌진탕",i:"🌩️",c:"#fff27a",d:"감전 + 기절 → 전류가 주변 4명에게 튀고 기절 시간 2배"},
 magma:{a:"burn",b:"stun",n:"용암 분출",i:"🌋",c:"#ff6a2a",d:"화상 + 기절 → 발밑에서 용암이 솟아 주변을 계속 태움"},
 rupture:{a:"bleed",b:"stun",n:"절단",i:"🪚",c:"#ff2a4a",d:"출혈 + 기절 → 출혈이 즉시 6중첩, 3초치 출혈 피해가 한 번에"},
 decay:{a:"curse",b:"poison",n:"부패",i:"🦴",c:"#a8e06a",d:"저주 + 중독 → 저주가 즉시 터지며 주변에 독을 퍼뜨림"},
 judgment:{a:"curse",b:"mark",n:"심판",i:"⚖️",c:"#ffe58a",d:"저주 + 약화 → 쌓인 저주 피해의 2배가 즉시 떨어짐"},
 toxic:{a:"poison",b:"burn",n:"독화염",i:"☣️",c:"#b6ff5a",d:"중독 + 화상 → 화상 피해 2배, 주변 적에게 독이 번짐"},
 execute:{a:"bleed",b:"mark",n:"처형",i:"⚔️",c:"#ff3a5a",d:"출혈 + 약화 → 체력 20% 이하 일반 적을 즉시 처치"},
 plagueburst:{a:"poison",b:"bleed",n:"패혈",i:"🦠",c:"#c46aff",d:"중독 + 출혈 → 출혈 중첩이 2배로 쌓임"}
};
/* ── 모드 ── */
const MODES=[
 {n:"🏁 스테이지",d:"10분 생존 후 최종 보스를 처치하면 클리어"},
 {n:"∞ 무한 모드",d:"끝없이 강해지는 적. 3분마다 보스 러시. 최고 기록에 도전"}
];
/* ── 스테이지 비주얼: 지형 색 / 조명 / 적 색 ── */
const STAGE_LOOK=[
 { // 고요한 숲: 해 질 녘 숲
  ground:[[38,64,44],[52,84,52],[30,52,40],[88,72,50]],   // 풀 · 밝은 풀 · 숲 그늘 · 흙길
  dark:.34,amb:"8,14,30",
  enemy:{}
 },
 { // 저주받은 폐허: 달빛 폐허
  ground:[[44,40,54],[58,52,66],[30,28,40],[70,64,72]],   // 흙 · 이끼 돌 · 그늘 · 석판
  dark:.56,amb:"10,6,24",
  enemy:{grunt:"#6fa39a",runner:"#d8d2c0",charger:"#a33a4a",tank:"#6a6480",bomber:"#4a2a3a",shooter:"#8a6ad8",splitter:"#7a9a6a",mini:"#98b888"}
 },
 { // 용암 협곡: 현무암과 용암 강 (길 = 용암)
  ground:[[46,34,32],[60,44,40],[26,20,20],[255,120,34]],
  dark:.6,amb:"26,8,4",lava:true,haz:"lava",em:[255,110,30],plaza:[52,40,44],
  enemy:{grunt:"#8a4a3a",runner:"#e0a060",charger:"#b02a2a",tank:"#5a4a48",bomber:"#2a2020",shooter:"#ff9a4a",splitter:"#c86a2a",mini:"#e08a4a"}
 },
 { // 독버섯 늪: 길 = 독 늪
  ground:[[30,46,44],[42,62,54],[18,30,30],[96,170,70]],dark:.52,amb:"4,16,14",haz:"bog",em:[120,255,90],plaza:[44,52,48],
  enemy:{spore:"#9a6ad0",skitter:"#c8b050",lancer:"#c04a7a",golem:"#6a8a6a",drone:"#4a5a5a",seer:"#40c0a0",mother:"#b05ab0",warden:"#6aa0ff",stalker:"#7a3ab0"}
 },
 { // 태엽 성채: 길 = 놋쇠 레일
  ground:[[56,50,48],[70,62,56],[36,32,32],[170,130,60]],dark:.48,amb:"14,10,4",haz:"saw",plaza:[78,72,66],
  enemy:{spore:"#b08a5a",skitter:"#d8c070",lancer:"#c05a3a",golem:"#a08a5a",drone:"#6a7480",seer:"#5ad0c0",mother:"#a06a40",warden:"#7a9aff",stalker:"#6a4a8a"}
 },
 { // 별의 심연: 길 = 별빛 강
  ground:[[22,18,40],[32,26,58],[10,8,22],[130,100,240]],dark:.62,amb:"8,4,22",haz:"void",em:[150,110,255],plaza:[40,34,66],
  enemy:{spore:"#8a6aff",skitter:"#c0a0ff",lancer:"#ff5aa0",golem:"#5a5a9a",drone:"#3a3a6a",seer:"#5af0ff",mother:"#d05ad0",warden:"#8ab0ff",stalker:"#a04aff"}
 }
];

/* ── 총잡이 전용 성장 ── 레벨업/상자에서 다른 직업과 다른 선택지가 나옴 */
const GUN_UP={
 gdmg:{i:"🔫",n:"강화 탄두",max:8,d:"총기 피해 +20% (모든 총 · 스킬 포함)"},
 grate:{i:"⚡",n:"빠른 손",max:6,d:"총기 발사 간격 -10%"},
 gcyl:{i:"🛢️",n:"대형 실린더",max:5,d:"총기 장탄 수 증가 (리볼버 +2 · 산탄총·장총 +1)"},
 grel:{i:"🔄",n:"스피드 로더",max:5,d:"총기 재장전 시간 -15%"},
 gpier:{i:"🎯",n:"관통탄",max:4,d:"총알이 적을 1명 더 관통"},
 gspr:{i:"🔱",n:"산탄 실린더",max:3,d:"한 번에 나가는 총알 +1 (산탄총은 +2)"},
 gexp:{i:"💥",n:"폭발탄",max:5,d:"총알 명중 시 작은 폭발 (총알 피해의 25%+10%/Lv)"},
 ghol:{i:"🩸",n:"할로포인트",max:5,d:"치명타 피해 +25% · 총알 명중 시 출혈"},
 gfire:{i:"🔥",n:"소이탄",max:3,d:"총알 명중 시 화상 (Lv당 위력 증가)"},
 gice:{i:"❄️",n:"냉각탄",max:3,d:"총알 명중 시 냉기 (5중첩 빙결)"},
 gshock:{i:"🌩️",n:"전격탄",max:3,d:"총알 명중 시 감전 → 전류 전이"},
 gbnc:{i:"↪️",n:"도탄 (튕기는 탄환)",max:4,d:"총알이 맞힌 뒤 가까운 적에게 튕겨 나감 +1회/Lv"},
 // ── 챕터 2 전용 ──
 gres:{i:"🔮",n:"공명탄",max:4,ch2:1,d:"맞힌 적에게 걸린 상태이상 1개당 총알 피해 +(15+10×Lv)% (화상·냉기·감전·출혈·중독·표식·저주)"},
 gexe:{i:"🪓",n:"처형탄",max:4,ch2:1,d:"HP (8+3×Lv)% 이하 일반 적은 명중 시 즉사 · 엘리트·보스에게 총알 피해 +15%/Lv"},
 gwave:{i:"🌠",n:"레일 충격파",max:4,ch2:1,d:"6발마다 조준 방향으로 화면을 꿰뚫는 충격파 (총알 피해 ×(3+1.5×Lv)) · 맞은 적 표식"},
 gmast:{i:"🏅",n:"총잡이의 숙련",max:10,ch2:1,d:"총기·스킬 피해 +12% (최대 Lv.10)"}
};
const GUN_SK={
 deadeye:{i:"👁️",n:"데드아이",cd:12,d:"시간이 느려지며 화면의 적 (8+2×Lv)명에게 확정 치명타 (피해 800%+200%/Lv) · 끝나면 즉시 재장전"},
 dyna:{i:"🧨",n:"다이너마이트",cd:5,d:"조준점에 다이너마이트 투척 → 큰 폭발 (피해 600%+120%/Lv) + 화상 · Lv.2마다 묶음 +1개"},
 focus:{i:"🎯",n:"정조준",cd:9,d:"즉시 재장전 + 다음 (10+2×Lv)발이 치명타 ×1.5 피해 · 관통 +3"},
 storm:{i:"🔥",n:"난사",cd:15,d:"(3+0.5×Lv)초간 발사 간격 1/3 · 탄약 무한"},
 judge:{i:"⭐",n:"심판의 일격",cd:7,d:"화면을 꿰뚫는 굵은 대구경 탄 (피해 1200%+300%/Lv) · 맞은 적 1초 기절 + 약화"}
};
const GUN_PAS=["might","haste","eye","boots","heart","armor","magnet","regen","fang","luck","amp","cata"];   // 총잡이에게 나오는 패시브
/* ── 직업 특전: Lv.10마다 직업별 특전 3개 중 1개 선택 (판마다 초기화) ── */
const TAL={
 mage:[
  {k:"m_rx",i:"🌀",n:"연쇄 공명",d:"원소 반응 피해 +30% · 반응 시 무기 재사용 대기 감소량 2배"},
  {k:"m_tri",i:"🔺",n:"삼원소",d:"상태이상을 걸 때 30% 확률로 다른 원소(화상·냉기·감전·중독) 하나를 추가로 부여"},
  {k:"m_nova",i:"💠",n:"원소 폭주",d:"원소 반응이 일어나면 20% 확률로 그 자리에서 원소 폭발 (범위 피해)"},
  {k:"m_cd",i:"⏳",n:"마력 순환",d:"모든 무기 공격속도 +15%"},
  {k:"m_amp",i:"✨",n:"원소 지배",d:"상태이상 피해·지속시간 +40%"}],
 knight:[
  {k:"k_sh",i:"🛡️",n:"강화 방벽",d:"보호막이 최대 HP 40%로 증가 · 충전 주기 10초 → 7초"},
  {k:"k_holy",i:"☀️",n:"성광 폭발",d:"보호막이 깨질 때 성광 피해 ×3 · 범위 +50%"},
  {k:"k_aura",i:"⚜️",n:"수호의 오라",d:"받는 피해 -15%"},
  {k:"k_heal",i:"💖",n:"축복",d:"보호막이 충전될 때마다 HP 10% 회복"},
  {k:"k_ham",i:"🔨",n:"심판의 망치",d:"보호막이 충전될 때마다 화면의 적 6명에게 성광 낙뢰"}],
 pyro:[
  {k:"p_trail",i:"👣",n:"불바다",d:"불꽃 발자국 범위·지속시간 2배"},
  {k:"p_burn",i:"🔥",n:"업화",d:"모든 화상 피해 +30% → +80%"},
  {k:"p_expl",i:"💥",n:"연소 폭발",d:"화상 상태로 죽은 적이 35% 확률로 폭발하며 주변에 화상"},
  {k:"p_aura",i:"♨️",n:"열기 갑옷",d:"1초마다 주변 적에게 화상"},
  {k:"p_spd",i:"🏃",n:"타오르는 질주",d:"이동속도 +15% · 움직이는 동안 공격속도 +15%"}],
 ranger:[
  {k:"r_cd",i:"🌀",n:"곡예사",d:"구르기 재사용 2.5초 → 1.5초"},
  {k:"r_crit",i:"🎯",n:"급소 사냥",d:"구른 뒤 치명타 보너스 지속 2.2초 → 4초 · 그동안 치명타 피해 +50%"},
  {k:"r_knife",i:"🗡️",n:"칼날 회오리",d:"구를 때 사방으로 단검 12개 발사"},
  {k:"r_spd",i:"🍃",n:"바람걸음",d:"이동속도 +15%"},
  {k:"r_dodge",i:"💨",n:"회피술",d:"받는 공격을 20% 확률로 완전히 회피"}],
 plague:[
  {k:"pl_sp",i:"🦠",n:"팬데믹",d:"중독 전염 6명 → 12명 · 전염 범위 +40%"},
  {k:"pl_ex",i:"☣️",n:"독 폭탄",d:"중독 사망 시 독 폭발 확률 35% → 70%"},
  {k:"pl_dps",i:"🧪",n:"맹독",d:"중독 피해 +60%"},
  {k:"pl_aura",i:"🌫️",n:"역병 오라",d:"1초마다 주변 적을 중독"},
  {k:"pl_hp",i:"💉",n:"면역 체계",d:"최대 HP +60 · 초당 HP +2 재생"}],
 vamp:[
  {k:"v_heal",i:"🩸",n:"피의 축제",d:"처치 시 회복 1 → 2"},
  {k:"v_low",i:"🌑",n:"광기",d:"피의 갈증 발동 조건 HP 50% → 70% · 피해 보너스 +30% → +50%"},
  {k:"v_bat",i:"🦇",n:"박쥐 떼",d:"4초마다 박쥐 떼가 가까운 적 6명을 물어뜯고 HP 회복"},
  {k:"v_over",i:"🛡️",n:"혈액 보호막",d:"HP가 가득일 때 회복량이 보호막으로 (최대 HP 30%까지)"},
  {k:"v_rev",i:"⚰️",n:"불사",d:"즉시 부활 횟수 +1"}],
 berserker:[
  {k:"b_cap",i:"📈",n:"끝없는 분노",d:"분노 최대치 30 → 50"},
  {k:"b_dur",i:"⏱️",n:"식지 않는 피",d:"분노 유지 시간 3초 → 6초"},
  {k:"b_heal",i:"🍖",n:"전투의 굶주림",d:"분노가 20 이상일 때 처치 시 HP +1"},
  {k:"b_arm",i:"🪨",n:"강철 피부",d:"받는 피해 +10% 페널티 제거 → 받는 피해 -10%"},
  {k:"b_quake",i:"🌋",n:"대지 강타",d:"분노가 최대일 때 4초마다 주변에 충격파"}],
 cryo:[
  {k:"c_r",i:"❄️",n:"절대 영역",d:"혹한의 기운 범위 +50% · 주기 1초 → 0.6초"},
  {k:"c_dmg",i:"🧊",n:"얼음 분쇄",d:"빙결된 적에게 주는 피해 보너스 +30% → +60%"},
  {k:"c_fz",i:"⛄",n:"영구 동토",d:"빙결 지속시간 +60%"},
  {k:"c_sh",i:"💎",n:"얼음 파편",d:"빙결된 적이 죽으면 파편이 터져 주변에 피해 + 냉기"},
  {k:"c_arm",i:"🧥",n:"얼음 갑옷",d:"받는 피해 -15%"}],
 gambler:[
  {k:"g_ch",i:"🃏",n:"한 장 더",d:"레벨업·상자 선택지 +1"},
  {k:"g_roll",i:"🎲",n:"재굴림",d:"레벨업마다 무료 다시 뽑기 2회 → 4회"},
  {k:"g_crit",i:"🎰",n:"대박",d:"치명타 확률 +15% · 치명타 피해 +30%"},
  {k:"g_gold",i:"💰",n:"판돈 두 배",d:"이번 판 골드 획득 +50%"},
  {k:"g_jack",i:"🎁",n:"잭팟",d:"보물상자·자석·회복 드롭 확률 2배"}],
 gunslinger:[
  {k:"gs_dead",i:"👁️",n:"학살의 눈",sk:"deadeye",d:"데드아이가 시야의 모든 적을 노리고, 일반 적은 즉시 제거"},
  {k:"gs_dyna",i:"🧨",n:"연쇄 폭파",sk:"dyna",d:"다이너마이트 재사용 대기 50% 감소 · 묶음 +2개"},
  {k:"gs_judge",i:"⭐",n:"최후의 심판",sk:"judge",d:"심판의 일격 폭 2배 · 재사용 대기 -40% · 보스 피해 2배"},
  {k:"gs_storm",i:"🔥",n:"황야의 폭풍",sk:"storm",d:"난사 지속시간 2배 · 난사 중 탄환 도탄 +2"},
  {k:"gs_roll",i:"🤸",n:"총잡이의 춤",d:"구르기 재사용 3초 → 1.5초 · 구른 뒤 2초간 총기 피해 +50%"},
  {k:"gs_ammo",i:"♾️",n:"마르지 않는 탄창",d:"사격 시 50% 확률로 탄약을 소모하지 않음"}]
};
const TAL_LV=10;   // 이 레벨마다 특전
