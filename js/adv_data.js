/* ═══════════════ adv_data.js ═══════════════
   모험 모드 (BETA) 데이터: 직업 · 스킬 · 몬스터 · 장비 · 지역 · 퀘스트
   서바이버 모드와 완전히 분리된 RPG + 핵앤슬래시 모드. 그래픽 에셋(캐릭터 리그, 지형 청크, 파티클, 사운드)만 공유 */
"use strict";
/* ── 직업 ──
   main: 주 능력치(피해 +2%/pt) · atk: 기본 공격 방식 · rate: 초당 공격 · reach: 근접 사거리 */
const AJOB={
 warrior:{n:"전사",i:"🛡️",main:"str",hp:150,hpL:16,mp:40,mpL:3,st:{str:10,dex:5,int:3,vit:10},atk:"melee",rate:1.35,reach:78,arc:1.9,wep:"sword",
  d:"묵직한 근접 베기로 앞의 적을 한꺼번에 쓸어냅니다. 체력과 방어가 높아 최전선에 서는 직업.",
  look:{skin:"#f2c9a6",hair:"#7a4a26",hs:"short",eye:"#3a6ad8",fit:"armor",metal:"#c8d0dc",metal2:"#626c80",c1:"#a8323e",c2:"#561620",trim:"#e8c060",pants:"#3a3236",boots:"#6a7080",
   cape:"#8a2430",capeIn:"#40101a",head:"helm",plume:"#e8c060",item:"sword",shield:1,beard:1,ol:"#140c0c"}},
 archer:{n:"궁수",i:"🏹",main:"dex",hp:110,hpL:11,mp:55,mpL:4,st:{str:5,dex:11,int:4,vit:7},atk:"arrow",rate:1.7,wep:"bow",
  d:"멀리서 화살을 쏘아 적이 다가오기 전에 쓰러뜨립니다. 구르기로 거리를 벌리며 싸우는 직업.",
  look:{skin:"#f6d2b0",hair:"#e8c070",hs:"long",eye:"#3aa05a",fit:"tunic",c1:"#4a8a5a",c2:"#22442c",c3:"#8a6a3a",trim:"#e8d090",pants:"#4a3a2a",boots:"#6a4a2a",
   cape:"#2e5a3a",capeIn:"#163020",head:"hood",hat:"#3a6a46",hat2:"#1c3a24",scarf:"#c8a048",back:"quiver",item:"bow",ol:"#0c1a0e"}},
 mage:{n:"마법사",i:"🔮",main:"int",hp:95,hpL:9,mp:90,mpL:7,st:{str:3,dex:5,int:12,vit:6},atk:"bolt",rate:1.3,wep:"staff",
  d:"마력 탄과 강력한 원소 마법으로 넓은 범위를 휩쓸어 버립니다. 마나 관리가 중요한 직업.",
  look:{skin:"#ffe0cc",hair:"#c8b8f0",hs:"long",eye:"#a05aff",fit:"robe",c1:"#5a3ab0",c2:"#24145a",c3:"#b090ff",trim:"#f2c14e",pants:"#2a1c50",boots:"#3a2a4a",
   head:"wizard",hat:"#3a2490",hat2:"#1a0e48",item:"staff",mote:"elem",ol:"#120a2a"}},
 rogue:{n:"도적",i:"🗡️",main:"dex",hp:105,hpL:10,mp:50,mpL:4,st:{str:5,dex:12,int:3,vit:7},atk:"stab",rate:2.5,reach:62,arc:1.1,wep:"dagger",crit:.1,
  d:"빠른 단검 찌르기와 치명타, 그림자 기술로 적의 등 뒤를 노립니다. 치명타 확률 +10%.",
  look:{skin:"#ecc8a8",hair:"#1e1a24",hs:"slick",eye:"#e04a5a",fit:"coat",c1:"#2e2a3a",c2:"#121018",c3:"#6a5a7a",trim:"#b04050",pants:"#1a1820",boots:"#2a2028",
   head:"hood",hat:"#24202e",hat2:"#0e0c14",scarf:"#8a2a3a",item:"dagger",tails:"#24202e",ol:"#06050a"}}
};
const STAT_N={str:"힘",dex:"민첩",int:"지능",vit:"체력"};
const STAT_D={str:"전사 주 능력치 (피해 +3%) · 방어 +0.5",dex:"궁수·도적 주 능력치 (피해 +3%) · 치명타 +0.1%",int:"마법사 주 능력치 (피해 +3%) · 최대 MP +3",vit:"최대 HP +10"};

/* ── 스킬 ── (cd 초 · mp 소모 · m 피해 배율 · 레벨당 피해 +20%, 재사용 대기 -4%) */
const ASK={
 // 전사
 whirl:{c:"warrior",i:"🌀",n:"회전 베기",cd:4,mp:12,m:1.6,d:"주변 360°를 크게 베어 모든 적에게 160% 피해."},
 charge:{c:"warrior",i:"🐗",n:"돌진",cd:6,mp:10,m:1.4,d:"조준 방향으로 돌진하며 부딪힌 적에게 140% 피해 + 1초 기절."},
 slam:{c:"warrior",i:"💥",n:"대지 강타",cd:8,mp:18,m:2.6,d:"앞쪽 땅을 내리쳐 넓은 범위에 260% 피해 + 1.5초 기절."},
 shout:{c:"warrior",i:"📯",n:"전투 함성",cd:20,mp:15,m:0,d:"8초간 피해 +30%, 받는 피해 -25%. 주변 적을 도발합니다."},
 storm:{c:"warrior",i:"🌪️",n:"칼날 폭풍",cd:16,mp:30,m:.55,d:"3초간 회전하며 움직입니다. 0.2초마다 주변에 55% 피해."},
 execute:{c:"warrior",i:"⚔️",n:"처형",cd:6,mp:14,m:4,d:"앞의 적에게 400% 일격. HP 30% 이하인 적에게는 2배."},
 // 궁수
 multi:{c:"archer",i:"🎯",n:"다중 사격",cd:3,mp:10,m:.9,d:"부채꼴로 화살 7발 (각 90%)."},
 pierce:{c:"archer",i:"➶",n:"관통 화살",cd:5,mp:14,m:3,d:"모든 적을 꿰뚫는 거대한 화살 (300%)."},
 rain:{c:"archer",i:"🌧️",n:"화살비",cd:10,mp:22,m:.6,d:"조준 지점에 2.5초간 화살이 쏟아집니다 (0.15초마다 60%)."},
 vault:{c:"archer",i:"🦘",n:"후퇴 사격",cd:6,mp:10,m:1.2,d:"뒤로 크게 도약하며 화살 3발 (각 120%). 도약 중 무적."},
 boom:{c:"archer",i:"🧨",n:"폭발 화살",cd:6,mp:16,m:2.4,d:"맞으면 폭발하는 화살 (주변 240% + 화상)."},
 focus:{c:"archer",i:"🦅",n:"매의 눈",cd:20,mp:15,m:0,d:"8초간 공격 속도 +40%, 치명타 확률 +15%."},
 // 마법사
 fireball:{c:"mage",i:"🔥",n:"화염구",cd:2.5,mp:12,m:2.6,d:"폭발하는 화염구 (주변 260% + 화상)."},
 nova:{c:"mage",i:"❄️",n:"서리 고리",cd:8,mp:18,m:1.5,d:"주변에 냉기 폭발 (150%) + 2초 빙결."},
 chain:{c:"mage",i:"⚡",n:"연쇄 번개",cd:4,mp:14,m:1.8,d:"번개가 적 6명에게 튕깁니다 (각 180%)."},
 meteor:{c:"mage",i:"☄️",n:"메테오",cd:12,mp:32,m:5,d:"0.8초 뒤 조준 지점에 운석 낙하 (넓은 범위 500% + 화상)."},
 blink:{c:"mage",i:"✨",n:"순간이동",cd:5,mp:10,m:0,d:"조준 지점으로 순간이동 (최대 320). 도착 지점에 작은 폭발."},
 barrier:{c:"mage",i:"🔷",n:"마나 보호막",cd:25,mp:20,m:0,d:"10초간 받는 피해의 60%를 MP가 대신 받습니다."},
 // 도적
 shadow:{c:"rogue",i:"👤",n:"그림자 걸음",cd:6,mp:12,m:2.5,d:"조준한 적 뒤로 순간이동해 250% 치명타 일격."},
 fan:{c:"rogue",i:"🔪",n:"칼날 부채",cd:4,mp:12,m:1.1,d:"주변으로 단검 14개를 던집니다 (각 110%)."},
 venom:{c:"rogue",i:"🧪",n:"맹독 병",cd:7,mp:14,m:.5,d:"조준 지점에 독 구름 4초 (0.25초마다 50% + 중독)."},
 flurry:{c:"rogue",i:"🌩️",n:"난도질",cd:5,mp:12,m:.75,d:"앞으로 미끄러지며 7번 찌릅니다 (각 75%)."},
 smoke:{c:"rogue",i:"💨",n:"연막",cd:15,mp:16,m:0,d:"3초간 은신 · 이동 속도 +40% · 적이 놓칩니다. 은신 중 다음 공격 300%."},
 mark:{c:"rogue",i:"☠️",n:"죽음의 표식",cd:12,mp:12,m:0,d:"조준한 적에게 8초간 표식: 받는 피해 +50%. 죽으면 MP 회복."}
};
const ASK_START={warrior:"whirl",archer:"multi",mage:"fireball",rogue:"fan"};
const ASK_MAXLV=5;
const askOf=c=>Object.keys(ASK).filter(k=>ASK[k].c===c);

/* ── 몬스터 ──
   hp/dmg: 레벨 1 기준(레벨에 따라 증가) · spd 이동 · r 크기 · ai 행동 · rng 공격 사거리 · cd 공격 간격 · xp 경험치 배율
   draw: 그리기 방식 · skin/cloth 색 · wp 무기 */
const AMON={
 goblin:{n:"고블린",hp:34,dmg:7,spd:115,r:14,ai:"melee",rng:34,cd:1.3,xp:1,draw:"gob",skin:"#7bb04a",cloth:"#7a5030",wp:"club"},
 slinger:{n:"고블린 투석병",hp:26,dmg:6,spd:100,r:13,ai:"ranged",rng:330,cd:2,xp:1.1,draw:"gob",skin:"#8abf5a",cloth:"#5a6a3a",wp:"sling",keep:220},
 wolf:{n:"들늑대",hp:30,dmg:6,spd:175,r:15,ai:"lunge",rng:150,cd:2.2,xp:1.1,draw:"wolf",skin:"#8a8478",cloth:"#5a5248"},
 gwar:{n:"고블린 전사",hp:70,dmg:10,spd:105,r:16,ai:"melee",rng:38,cd:1.4,xp:1.6,draw:"gob",skin:"#6aa040",cloth:"#6a6a78",wp:"axe",helm:1,shield:1,arm:4},
 shaman:{n:"고블린 주술사",hp:44,dmg:9,spd:95,r:14,ai:"caster",rng:360,cd:2.6,xp:1.6,draw:"gob",skin:"#9ac06a",cloth:"#6a2a6a",wp:"totem",mask:1,keep:260},
 hob:{n:"홉고블린",hp:130,dmg:15,spd:95,r:21,ai:"slam",rng:70,cd:2.4,xp:2.4,draw:"gob",skin:"#c8783a",cloth:"#4a3a30",wp:"club",big:1.35,arm:6},
 kobold:{n:"코볼트 폭탄병",hp:24,dmg:22,spd:150,r:12,ai:"bomber",rng:44,cd:1,xp:1.2,draw:"kob",skin:"#c05a3a",cloth:"#3a2a20"},
 rider:{n:"늑대 기수",hp:90,dmg:12,spd:185,r:19,ai:"charger",rng:260,cd:3.2,xp:2.2,draw:"rider",skin:"#6a9a3a",cloth:"#3a3028"},
 ogre:{n:"오우거",hp:260,dmg:22,spd:80,r:27,ai:"slam",rng:90,cd:2.8,xp:4,draw:"ogre",skin:"#b8a078",cloth:"#5a4028",wp:"bigclub",arm:8},
 troll:{n:"동굴 트롤",hp:200,dmg:16,spd:110,r:24,ai:"melee",rng:52,cd:1.2,xp:3.4,draw:"troll",skin:"#5a8a8a",cloth:"#3a3020",regen:.03,arm:5},
 // 보스
 b_chief:{n:"고블린 대장 그락",boss:1,hp:1400,dmg:14,spd:125,r:30,ai:"boss",rng:60,cd:1.6,xp:40,draw:"gob",skin:"#6aa040",cloth:"#8a2a2a",wp:"axe",big:2,helm:2,arm:6,
  pat:["spin","charge","summon","slam"],sum:"goblin"},
 b_king:{n:"고블린 왕 크루그",boss:1,hp:2600,dmg:18,spd:110,r:34,ai:"boss",rng:70,cd:1.5,xp:90,draw:"gob",skin:"#d0a040",cloth:"#5a1a7a",wp:"scepter",big:2.3,crown:1,cape:"#7a1a3a",arm:8,
  pat:["bombs","slam","summon","firering","charge"],sum:"shaman"},
 b_ogre:{n:"오우거 족장 무르그",boss:1,hp:5200,dmg:26,spd:95,r:40,ai:"boss",rng:95,cd:1.7,xp:200,draw:"ogre",skin:"#8a90a8",cloth:"#3a2a48",wp:"bigclub",big:1.4,crown:2,arm:12,
  pat:["jump","boulder","slam","quake","summon"],sum:"troll"}
};

/* ── 지역 ── look: 지형 청크 스타일(0 숲 · 1 폐허 · 2 용암) · lv 몬스터 레벨 범위 · n 동시 몬스터 수 */
const AMAP={
 town:{n:"🏘️ 새벽 마을",w:2000,h:1500,look:0,town:1},
 f1:{n:"🌲 초록 들판",w:4600,h:3200,look:0,lv:[1,5],cap:46,mons:{goblin:5,slinger:3,wolf:3},boss:"b_chief",req:0,d:"Lv.1~5 · 고블린 · 투석병 · 들늑대 · 보스: 고블린 대장 그락"},
 f2:{n:"🏚️ 고블린 야영지",w:5000,h:3400,look:1,lv:[6,11],cap:52,mons:{goblin:2,gwar:4,shaman:3,hob:2,kobold:3},boss:"b_king",req:"b_chief",d:"Lv.6~11 · 고블린 전사 · 주술사 · 홉고블린 · 코볼트 · 보스: 고블린 왕 크루그"},
 f3:{n:"🌋 불타는 협곡",w:5400,h:3600,look:2,lv:[12,18],cap:50,mons:{rider:3,ogre:3,troll:3,shaman:2,hob:2,kobold:2},boss:"b_ogre",req:"b_king",d:"Lv.12~18 · 늑대 기수 · 오우거 · 동굴 트롤 · 보스: 오우거 족장 무르그"}
};
const AMAP_ORDER=["f1","f2","f3"];

/* ── 장비 ── */
const ARAR=[
 {n:"일반",c:"#d8d8d8",w:60,aff:0,m:1},
 {n:"고급",c:"#6ae06a",w:26,aff:1,m:1.1},
 {n:"희귀",c:"#5aa8ff",w:10,aff:2,m:1.22},
 {n:"영웅",c:"#c070ff",w:3.4,aff:3,m:1.38},
 {n:"전설",c:"#ff9a2a",w:.6,aff:4,m:1.6}
];
const ASLOT={weapon:{n:"무기",i:"⚔️"},helm:{n:"투구",i:"⛑️"},armor:{n:"갑옷",i:"🥋"},gloves:{n:"장갑",i:"🧤"},boots:{n:"신발",i:"👢"},ring:{n:"반지",i:"💍"},amulet:{n:"목걸이",i:"📿"}};
const ASLOTS=Object.keys(ASLOT);
const ATIER=["낡은","철제","강철","미스릴","용린","별철"];
const AWEP={sword:{n:"검",i:"🗡️",sp:1.2,names:["장검","전투 도끼","양손검"]},bow:{n:"활",i:"🏹",sp:1,names:["단궁","장궁","복합궁"]},
 staff:{n:"지팡이",i:"🪄",sp:1.05,names:["지팡이","마법봉","수정 지팡이"]},dagger:{n:"단검",i:"🔪",sp:.62,names:["단검","쌍단검","암살검"]}};
const AARM={helm:{names:["가죽 모자","투구","전투 투구"],def:1},armor:{names:["누비 갑옷","사슬 갑옷","판금 갑옷"],def:2.2},gloves:{names:["가죽 장갑","사슬 장갑","건틀릿"],def:.7},
 boots:{names:["가죽 신발","강철 장화","전투 장화"],def:.8},ring:{names:["구리 반지","은 반지","보석 반지"],def:0},amulet:{names:["부적","은 목걸이","보석 목걸이"],def:0}};
/* 추가 능력치: v(ilv) = 기본값 · p 백분율 표시 */
const AAFF={
 str:{n:"힘",v:l=>2+l*.5},dex:{n:"민첩",v:l=>2+l*.5},int:{n:"지능",v:l=>2+l*.5},vit:{n:"체력",v:l=>2+l*.5},
 hp:{n:"최대 HP",v:l=>12+l*5},mp:{n:"최대 MP",v:l=>6+l*2},def:{n:"방어",v:l=>2+l*.8},
 crit:{n:"치명타 확률",p:1,v:l=>.02+l*.0012},critd:{n:"치명타 피해",p:1,v:l=>.1+l*.008},aspd:{n:"공격 속도",p:1,v:l=>.04+l*.002},
 ms:{n:"이동 속도",p:1,v:l=>.04+l*.0012},ls:{n:"생명력 흡수",p:1,v:l=>.012+l*.0006},sdmg:{n:"스킬 피해",p:1,v:l=>.06+l*.004},
 cdr:{n:"재사용 대기 감소",p:1,v:l=>.03+l*.0015},hpreg:{n:"초당 HP 회복",v:l=>.6+l*.15},gold:{n:"골드 획득",p:1,v:l=>.08+l*.004}
};
const AFF_KEYS=Object.keys(AAFF);
/* 소모품 */
const APOT={hp:{n:"생명 물약",i:"❤️",price:20,d:"HP 45% 즉시 회복"},mp:{n:"마나 물약",i:"💙",price:20,d:"MP 50% 즉시 회복"}};

/* ── 퀘스트 (촌장) ── k: 처치 대상(몬스터 키 · any:지역 · 보스 키) · n 수 · r 보상 */
const AQUEST=[
 {n:"마을 앞의 고블린",d:"초록 들판의 고블린 10마리를 처치하세요.",k:"goblin",n2:10,r:{gold:120,xp:80,pot:5}},
 {n:"늑대 울음소리",d:"들늑대 8마리를 처치하세요.",k:"wolf",n2:8,r:{gold:180,xp:140,item:2}},
 {n:"돌팔매질 금지",d:"고블린 투석병 8마리를 처치하세요.",k:"slinger",n2:8,r:{gold:200,xp:180,book:1}},
 {n:"고블린 대장 그락",d:"초록 들판 동쪽 끝의 고블린 대장 그락을 쓰러뜨리세요.",k:"b_chief",n2:1,r:{gold:500,xp:400,item:3}},
 {n:"야영지 정찰",d:"고블린 야영지의 몬스터 30마리를 처치하세요.",k:"any:f2",n2:30,r:{gold:600,xp:700,pot:8}},
 {n:"불길한 주문",d:"고블린 주술사 8마리를 처치하세요.",k:"shaman",n2:8,r:{gold:700,xp:900,book:1}},
 {n:"고블린 왕 크루그",d:"고블린 야영지 깊은 곳의 고블린 왕 크루그를 쓰러뜨리세요.",k:"b_king",n2:1,r:{gold:1500,xp:1600,item:3}},
 {n:"협곡의 거인",d:"불타는 협곡의 오우거 10마리를 처치하세요.",k:"ogre",n2:10,r:{gold:1800,xp:2600,book:1}},
 {n:"오우거 족장 무르그",d:"불타는 협곡의 지배자 오우거 족장 무르그를 쓰러뜨리세요.",k:"b_ogre",n2:1,r:{gold:5000,xp:5000,item:4}}
];
/* ── 마을 NPC ── */
const ANPC=[
 {k:"chief",n:"촌장 바르토",x:-60,y:-250,role:"quest",line:"모험가여, 마을 주변 고블린들 때문에 큰일이네. 도와주겠나?",
  look:{skin:"#eac8a8",hair:"#e8e8e8",hs:"short",eye:"#5a6a8a",fit:"robe",c1:"#6a5a3a",c2:"#3a2e1e",c3:"#a89a6a",trim:"#e8d090",pants:"#3a3020",boots:"#4a3a28",item:"staff",beard:1,ol:"#140e08"}},
 {k:"shop",n:"상인 미라",x:-470,y:40,role:"shop",line:"어서 와요! 물약이랑 쓸 만한 장비가 있어요. 필요 없는 건 사 줄게요.",
  look:{skin:"#f6d8bc",hair:"#c0583a",hs:"braid",eye:"#3a8a5a",fit:"vest",c1:"#3a7a9a",c2:"#1a3a4a",c3:"#f4f0e0",trim:"#f2c14e",pants:"#3a2a2a",boots:"#4a2a1a",item:"flask",ol:"#140a08"}},
 {k:"smith",n:"대장장이 고르드",x:420,y:20,role:"smith",line:"장비를 가져오게. 골드만 있으면 더 단단하게 두들겨 주지. (+10까지)",
  look:{skin:"#d8a07a",hair:"#3a2a1a",hs:"short",eye:"#4a4a4a",fit:"bare",c1:"#5a3a24",c2:"#2a1a10",c3:"#8a6a4a",trim:"#c09060",pants:"#3a2a1a",boots:"#2a1a10",item:"axe",beard:1,metal:"#a0a6b0",metal2:"#5a606a",ol:"#0e0804"}},
 {k:"sage",n:"현자 엘린",x:-420,y:-330,role:"skill",line:"스킬서를 읽으면 새 기술을 익히거나 이미 아는 기술이 강해진다네. 내가 몇 권 팔지.",
  look:{skin:"#fbe8e0",hair:"#e0e8ff",hs:"long",eye:"#5a8aff",fit:"robe",c1:"#e8e8f8",c2:"#8a90b8",c3:"#c8d0ff",trim:"#a0b8ff",pants:"#5a6080",boots:"#c8d0e8",head:"wizard",hat:"#d8dcf0",hat2:"#7a80a8",item:"istaff",ol:"#141830"}}
];
const ATOWN_PORTAL={x:760,y:60};
