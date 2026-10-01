/* ═══════════════ adv.js ═══════════════
   모험 모드 (BETA) 엔진: 상태 · 저장 · 장비/능력치 · 지역/몬스터 · 전투 · 스킬 · 렌더링
   서바이버 루프(core.js loop)는 ADV.on일 때 advFrame만 호출하고 나머지는 건너뜀 */
"use strict";
const ADV={on:false,play:false,paused:false,slot:-1,c:null,map:"town",t:0,mons:[],projs:[],zones:[],drops:[],fx:[],walls:[],
 st:{},buf:{},cd:{},atkCD:0,potCD:0,boss:null,bossT:{},spawnT:0,near:null,saveT:0,dirty:false,dead:false,recall:0,inten:0,shopStock:null,sfxT:0,
 p:{x:0,y:0,r:15,face:1,aim:0,walk:0,mvs:0,atk:0,moving:false,roll:0,rollCD:0,rvx:0,rvy:0,inv:0,flash:0,hp:100,mp:50,dash:null,spin:null,flurry:null,lastHit:9,cast:0},
 touchAtk:false,uid:1};
const AMAX_BAG=36,AMAX_LV=30;
const aRand=(a,b)=>a+Math.random()*(b-a),aPick=a=>a[Math.floor(Math.random()*a.length)];
const aClamp=(v,a,b)=>v<a?a:v>b?b:v;
const AZ=()=>ZM*1.22;                                            // 모험 모드는 조금 더 가까이 (캐릭터가 크게 보이도록)
/* ── 저장 ── */
let advMem=loadJSON("ms_adv",[null,null,null]);
function advSaveNow(){
 const c=ADV.c;if(!c)return;c.hp=Math.round(ADV.p.hp);c.mp=Math.round(ADV.p.mp);
 advMem[ADV.slot]=c;try{localStorage.setItem("ms_adv",JSON.stringify(advMem))}catch(e){}ADV.dirty=false;
}
function advNewChar(name,job){
 const J=AJOB[job],c={v:1,name:name||J.n,job,lv:1,xp:0,pts:0,st:{...J.st},gold:60,eq:{},bag:[],sk:{},bar:[null,null,null,null],pot:{hp:4,mp:3},q:0,qs:0,qp:0,boss:{},kills:0,time:0,uid:1,hp:9999,mp:9999};
 const s=ASK_START[job];c.sk[s]=1;c.bar[0]=s;
 ADV.c=c;c.eq.weapon=advItem(1,{slot:"weapon",rar:0});c.eq.armor=advItem(1,{slot:"armor",rar:0});
 return c;
}
const aNeed=lv=>Math.round(60*Math.pow(lv,1.55));
/* ── 장비 ── */
function advRollRar(b){
 const w=ARAR.map((r,i)=>i===0?r.w/(1+b*2):i===1?r.w:r.w*(1+b*(i-1)*.9));let t=w.reduce((a,v)=>a+v,0),x=Math.random()*t;
 for(let i=0;i<w.length;i++){x-=w[i];if(x<=0)return i}return 0;
}
function advItem(ilv,o){
 o=o||{};const c=ADV.c,job=o.job||(c?c.job:"warrior");ilv=Math.max(1,Math.min(40,Math.round(ilv)));
 let slot=o.slot;if(!slot){const r=Math.random();slot=r<.22?"weapon":r<.35?"helm":r<.5?"armor":r<.63?"gloves":r<.76?"boots":r<.88?"ring":"amulet"}
 const rar=o.rar!==undefined?o.rar:advRollRar(o.luck||0),R=ARAR[rar],tier=Math.min(ATIER.length-1,Math.floor((ilv-1)/4)),v=Math.min(2,Math.floor(((ilv-1)%4)/1.4));
 const it={u:c?c.uid++:ADV.uid++,s:slot,r:rar,ilv,req:Math.max(1,ilv-2),enh:0,aff:[]};
 if(slot==="weapon"){const wb=AWEP[AJOB[job].wep];it.w=AJOB[job].wep;it.n=ATIER[tier]+" "+wb.names[v];
  const base=(6+ilv*2.8)*wb.sp*R.m*aRand(.92,1.08);it.dmg=[Math.max(1,Math.round(base*.8)),Math.round(base*1.2)]}
 else{const ab=AARM[slot];it.n=ATIER[tier]+" "+ab.names[v];if(ab.def)it.def=Math.max(1,Math.round((3+ilv*1.3)*ab.def*R.m*aRand(.9,1.1)))}
 let n=R.aff+((slot==="ring"||slot==="amulet")?1:0);const pool=AFF_KEYS.filter(k=>!(slot==="weapon"&&(k==="def"||k==="hpreg"))&&!(k==="ms"&&slot!=="boots"&&Math.random()<.7));
 while(n-->0&&pool.length){const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0],A=AAFF[k];let val=A.v(ilv)*aRand(.7,1.15)*(rar===4?1.35:1);val=A.p?Math.round(val*1000)/1000:Math.max(1,Math.round(val));it.aff.push([k,val])}
 if(rar===4)it.n="전설의 "+it.n;
 return it;
}
function advBook(sk){const S=ASK[sk];return{u:ADV.c.uid++,s:"book",sk,r:2,ilv:1,req:1,n:"스킬서: "+S.n,aff:[]}}
const itemPrice=it=>it.s==="book"?60:Math.round((6+it.ilv*3)*(1+it.r*1.3)*(1+(it.enh||0)*.25));
const enhMul=it=>1+(it.enh||0)*.08;
function advCanEquip(it){const c=ADV.c;if(it.s==="book")return"책";if(c.lv<it.req)return`Lv.${it.req} 필요`;if(it.s==="weapon"&&it.w!==AJOB[c.job].wep)return`${AJOB[c.job].n} 전용 무기가 아님`;return""}
/* ── 능력치 계산 ── eq: 계산에 쓸 장비 (비교용으로 다른 장비를 넣어 볼 수 있음) */
function advCalcFor(eq){
 const c=ADV.c,J=AJOB[c.job],A={};for(const k of AFF_KEYS)A[k]=0;let def=0,w=null;
 for(const s of ASLOTS){const it=eq[s];if(!it)continue;for(const[k,v]of it.aff)A[k]+=v;if(it.def)def+=it.def*enhMul(it);if(s==="weapon")w=it}
 const st={str:c.st.str+A.str,dex:c.st.dex+A.dex,int:c.st.int+A.int,vit:c.st.vit+A.vit},main=st[J.main];
 const o={};
 o.str=st.str;o.dex=st.dex;o.int=st.int;o.vit=st.vit;
 o.maxHp=Math.round(J.hp+J.hpL*(c.lv-1)+st.vit*10+A.hp);
 o.maxMp=Math.round(J.mp+J.mpL*(c.lv-1)+st.int*3+A.mp);
 const wd=w?[w.dmg[0]*enhMul(w),w.dmg[1]*enhMul(w)]:[2,4],mm=1+main*.03;
 o.dmin=wd[0]*mm;o.dmax=wd[1]*mm;
 o.def=Math.round(def+st.str*.5+A.def);
 o.crit=Math.min(.75,.05+st.dex*.001+(J.crit||0)+A.crit);o.critd=1.5+A.critd;
 o.aspd=1+A.aspd;o.ms=1+A.ms;o.ls=A.ls;o.sdmg=1+A.sdmg;o.cdr=Math.min(.4,A.cdr);
 o.hpreg=.4+st.vit*.05+A.hpreg;o.mpreg=1.4+st.int*.09;o.gold=1+A.gold;
 o.power=Math.round((o.dmin+o.dmax)/2*(1+o.crit*(o.critd-1))*J.rate*o.aspd*Math.sqrt(o.sdmg)*4+o.maxHp*.5+o.def*3);
 return o;
}
function advCalc(){const p=ADV.p,o=advCalcFor(ADV.c.eq);ADV.st=o;p.hp=Math.min(p.hp,o.maxHp);p.mp=Math.min(p.mp,o.maxMp)}
function advEquip(it){
 const c=ADV.c,why=advCanEquip(it);if(why){toast("❌ "+why);return false}
 const i=c.bag.indexOf(it);if(i<0)return false;const old=c.eq[it.s];c.bag.splice(i,1);c.eq[it.s]=it;if(old)c.bag.splice(i,0,old);
 advCalc();ADV.dirty=true;sfx("upgrade");return true;
}
function advUnequip(s){const c=ADV.c;if(!c.eq[s])return;if(c.bag.length>=AMAX_BAG){toast("가방이 가득 찼습니다");return}c.bag.push(c.eq[s]);delete c.eq[s];advCalc();ADV.dirty=true;sfx("ui")}
function advReadBook(it){
 const c=ADV.c,S=ASK[it.sk];if(S.c!==c.job){toast("다른 직업의 스킬서입니다 (판매 가능)");return}
 const lv=c.sk[it.sk]||0;if(lv>=ASK_MAXLV){toast("이미 최고 레벨입니다");return}
 c.sk[it.sk]=lv+1;c.bag.splice(c.bag.indexOf(it),1);
 if(!lv){const e=c.bar.indexOf(null);if(e>=0)c.bar[e]=it.sk;toast(`📖 새 스킬: ${S.i} ${S.n}`+(e>=0?` (${e+1}번 슬롯)`:" — 스킬 창에서 슬롯에 등록하세요"))}
 else toast(`📖 ${S.i} ${S.n} Lv.${lv+1}`);
 stinger("evo");ADV.dirty=true;
}
/* ── 지역 ── */
const ATOWN={houses:[
 {x:-640,y:-540,w:250,h:180,roof:"#9a3e32"},{x:-170,y:-600,w:320,h:230,roof:"#3a5a8a",big:1},{x:280,y:-540,w:260,h:180,roof:"#7a5a2a"},
 {x:-860,y:120,w:230,h:170,roof:"#6a3a5a"},{x:600,y:200,w:250,h:180,roof:"#5a6a3a"},{x:-330,y:320,w:230,h:170,roof:"#8a4a2a"},{x:120,y:340,w:250,h:170,roof:"#4a4a6a"}],
 lamps:[[-260,-170],[230,-170],[-260,190],[260,190],[620,-60],[620,150]],well:{x:0,y:-40,r:36}};
function mapBounds(k){const M=AMAP[k];return M.town?{x0:-M.w/2,y0:-M.h/2,x1:M.w/2,y1:M.h/2}:{x0:0,y0:0,x1:M.w,y1:M.h}}
function advGoMap(k,how){
 const M=AMAP[k],p=ADV.p;ADV.map=k;ADV.mons.length=0;ADV.projs.length=0;ADV.zones.length=0;ADV.drops.length=0;ADV.fx.length=0;ADV.boss=null;ADV.recall=0;
 pN=0;nN=0;
 if(chunkStage!==M.look){chunks.clear();chunkStage=M.look}selSt=M.look;
 ADV.walls.length=0;
 if(M.town){p.x=how==="portal"?ATOWN_PORTAL.x-90:0;p.y=how==="portal"?ATOWN_PORTAL.y+10:120;
  for(const h of ATOWN.houses)ADV.walls.push({x:h.x,y:h.y+h.h*.32,w:h.w,h:h.h*.68});
  p.hp=ADV.st.maxHp;p.mp=ADV.st.maxMp;if(!ADV.shopStock||how!=="load")advRestock();advSaveNow()}
 else{p.x=220;p.y=M.h/2;for(let i=0;i<60&&ADV.mons.length<M.cap;i++)advSpawnPack(true);if((ADV.bossT[k]||0)<=0)advSpawnBoss()}
 cam.x=p.x;cam.y=p.y;
 advSetSong();toast(M.n+(M.lv?` · Lv.${M.lv[0]}~${M.lv[1]}`:""));
}
function advSetSong(){
 const M=AMAP[ADV.map];
 song=M.town?ATOWN_SONG:SONG[M.look]||SONG[0];BPM=song.bpm;STEP=60/BPM/4;seqStep=0;seqT=0;songEnd=1e9;songPend=false;inten=0;
}
const ATOWN_SONG={n:"새벽 마을",bpm:88,prog:[[60,64,67],[55,59,62],[57,60,64],[53,57,60]],bass:[48,43,45,41],arp:[0,1,2,1,0,2,1,2]};
/* 몬스터 무리 생성: 입구·보스 투기장과 먼 곳, 화면 밖 */
function advSpawnPack(init){
 const M=AMAP[ADV.map],p=ADV.p;let x,y,ok=false;
 for(let t=0;t<20&&!ok;t++){x=aRand(650,M.w-260);y=aRand(220,M.h-220);ok=!(x>M.w-900&&Math.abs(y-M.h/2)<520)&&Math.hypot(x-p.x,y-p.y)>(init?700:820)}
 if(!ok)return;
 const keys=Object.keys(M.mons),tot=keys.reduce((a,k)=>a+M.mons[k],0);let r=Math.random()*tot,k=keys[0];for(const q of keys){r-=M.mons[q];if(r<=0){k=q;break}}
 const n=2+Math.floor(Math.random()*3),f=aClamp((x-500)/(M.w-1300),0,1);
 for(let i=0;i<n;i++){
  const kk=i>0&&Math.random()<.35?aPick(keys):k,lv=Math.max(1,Math.round(M.lv[0]+(M.lv[1]-M.lv[0])*f+aRand(-.7,.7)));
  advMakeMon(kk,x+aRand(-90,90),y+aRand(-90,90),lv,Math.random()<.06);
 }
}
function advMakeMon(k,x,y,lv,elite){
 const D=AMON[k],L=lv-1,hm=1+.38*L+.012*L*L;
 const m={k,D,x,y,hx:x,hy:y,lv,elite:!!elite,r:D.r*(elite?1.15:1),hp:0,max:0,dmg:D.dmg*(1+.18*L)*(elite?1.4:1),arm:(D.arm||0)*(1+.15*L),spd:D.spd*(elite?1.08:1),
  st:"idle",cd:aRand(.5,1.5),wind:0,tele:null,act:null,face:1,mvs:0,walk:Math.random()*6,flash:0,stun:0,frz:0,burn:0,burnD:0,poi:0,poiD:0,dotT:0,mark:0,kx:0,ky:0,
  wx:x,wy:y,wt:aRand(1,4),ag:D.boss?560:300,hpbar:0,pi:0,patCd:2.5,dead:false,ph:Math.random()*9};
 m.max=m.hp=Math.round(D.hp*hm*(elite?3.2:1));
 ADV.mons.push(m);return m;
}
function advSpawnBoss(){
 const M=AMAP[ADV.map];if(!M.boss)return;const m=advMakeMon(M.boss,M.w-450,M.h/2,M.lv[1]+1,false);m.ag=520;ADV.boss=m;
}
/* ── 상점 재고 ── */
function advRestock(){const c=ADV.c;ADV.shopStock=[];for(let i=0;i<6;i++){const it=advItem(c.lv+aRand(-1,1.5),{luck:.6});ADV.shopStock.push(it)}}
/* ── 피해 계산 ── */
function advRoll(M,forceCrit){
 const s=ADV.st,b=ADV.buf;let d=aRand(s.dmin,s.dmax)*M*(b.shout>0?1.3:1)*DEV.dmg;
 const cr=forceCrit||Math.random()<s.crit+(b.focus>0?.15:0);if(cr)d*=s.critd;return[d,cr];
}
function advHitMon(m,M,o){
 if(m.dead||m.hp<=0)return;o=o||{};
 let[d,cr]=advRoll(M,o.crit);if(o.flat){d=o.flat;cr=false}
 if(m.mark>0)d*=1.5;if(m.frz>0)d*=1.15;d*=60/(60+m.arm);
 m.hp-=d;m.flash=.09;m.hpbar=4;if(m.st!=="ret")m.st="chase";
 if(!o.quiet){dnum(m,d,cr?"#ffd84a":o.col||"#ffffff",cr);if(ADV.sfxT<=0){ADV.sfxT=.06;cr?critSfx():hitSfx()}
  for(let i=0;i<(cr?6:3);i++){const a=Math.random()*6.283,sp=aRand(60,200);spawnP(m.x,m.y-m.r*.4,Math.cos(a)*sp,Math.sin(a)*sp,aRand(.2,.4),aRand(1.5,2.8),i&1?m.D.skin:"#ffffff",0,4,0)}}
 if(o.kb&&!m.D.boss){const L=Math.hypot(m.x-o.kx,m.y-o.ky)||1,k=o.kb*(m.D.big?.5:1);m.kx+=(m.x-o.kx)/L*k;m.ky+=(m.y-o.ky)/L*k}
 if(o.stun)m.stun=Math.max(m.stun,m.D.boss?o.stun*.35:o.stun);
 if(o.frz)m.frz=Math.max(m.frz,m.D.boss?o.frz*.35:o.frz);
 if(o.burn){m.burn=3;m.burnD=Math.max(m.burnD,(ADV.st.dmin+ADV.st.dmax)*.18*ADV.st.sdmg)}
 if(o.poi){m.poi=4;m.poiD=Math.max(m.poiD,(ADV.st.dmin+ADV.st.dmax)*.22*ADV.st.sdmg)}
 if(ADV.st.ls>0&&!o.dot){const p=ADV.p;p.hp=Math.min(ADV.st.maxHp,p.hp+Math.min(d*ADV.st.ls,ADV.st.maxHp*.03))}
 if(m.hp<=0)advKill(m);
}
const ADVTMP=[];
function advMonsNear(x,y,R){ADVTMP.length=0;for(const m of ADV.mons)if(!m.dead&&(m.x-x)**2+(m.y-y)**2<(R+m.r)**2)ADVTMP.push(m);return ADVTMP}
function advHitCircle(x,y,R,M,o){const l=advMonsNear(x,y,R).slice();o=Object.assign({kx:x,ky:y},o);for(const m of l)advHitMon(m,M,o);return l.length}
function advHitCone(x,y,a,arc,R,M,o){
 let n=0;o=Object.assign({kx:x,ky:y},o);
 for(const m of advMonsNear(x,y,R).slice()){const da=Math.abs(((Math.atan2(m.y-y,m.x-x)-a)%6.2832+9.4248)%6.2832-3.1416);if(da<=arc/2+Math.atan2(m.r,Math.max(1,Math.hypot(m.x-x,m.y-y)))){advHitMon(m,M,o);n++}}
 return n;
}
function advKill(m){
 if(m.dead)return;m.dead=true;const c=ADV.c,D=m.D,M=AMAP[ADV.map];
 c.kills++;
 // 경험치 (레벨 차이가 크면 감소)
 let xp=(8+m.lv*4)*(D.xp||1)*(m.elite?3:1);if(c.lv>m.lv+5)xp*=.2;else if(c.lv>m.lv+3)xp*=.6;advGainXP(Math.round(xp));
 // 퀘스트
 const Q=AQUEST[c.q];if(Q&&c.qs===1&&(Q.k===m.k||Q.k==="any:"+ADV.map)){c.qp++;if(c.qp>=Q.n2){c.qs=2;toast(`📜 퀘스트 완료: ${Q.n} — 촌장에게 보고하세요`);sfx("chest")}}
 // 전리품
 const luck=D.boss?3:m.elite?1.4:0,gm=ADV.st.gold;
 if(Math.random()<(D.boss?1:.62))advDrop(m.x,m.y,"gold",Math.max(1,Math.round(aRand(2,5)*(1+m.lv*.6)*gm*(D.boss?18:m.elite?3:1))));
 let ni=D.boss?3+(Math.random()<.5?1:0):m.elite?1+(Math.random()<.5?1:0):Math.random()<.1?1:0;
 for(let i=0;i<ni;i++)advDrop(m.x,m.y,"item",advItem(m.lv+(D.boss?1:0),{luck,rar:D.boss&&i===0?Math.max(2,advRollRar(luck)):undefined}));
 if(Math.random()<(D.boss?1:.05))advDrop(m.x,m.y,"pot",Math.random()<.55?"hp":"mp");
 if(Math.random()<(D.boss?.6:m.elite?.07:.01)){const own=askOf(c.job),sk=Math.random()<.85?aPick(own):aPick(Object.keys(ASK));advDrop(m.x,m.y,"book",advBook(sk))}
 // 연출
 const big=D.boss||m.elite||D.big; for(let i=0;i<(big?24:10);i++){const a=Math.random()*6.283,sp=aRand(80,260);spawnP(m.x,m.y-m.r*.3,Math.cos(a)*sp,Math.sin(a)*sp,aRand(.3,.7),aRand(2,4),i%3?D.skin:"#3a1a10",0,3,140)}
 if(m.mark>0&&c.job==="rogue"){ADV.p.mp=Math.min(ADV.st.maxMp,ADV.p.mp+ADV.st.maxMp*.25)}
 if(D.boss){sfx("bigkill");stinger("evo");shake=Math.max(shake,14);c.boss[m.k]=(c.boss[m.k]||0)+1;ADV.bossT[ADV.map]=120;ADV.boss=null;
  toast(`👑 ${D.n} 처치!`+(AMAP_ORDER.some(k=>AMAP[k].req===m.k)&&c.boss[m.k]===1?" — 새 지역이 열렸습니다":""));
  ADV.fx.push({k:"ring",x:m.x,y:m.y,r0:20,r1:320,t:0,max:.8,c:"#ffd84a"});advSaveNow()}
 else sfx(big?"bigkill":"kill");
}
function advDrop(x,y,type,val){const a=Math.random()*6.283,sp=aRand(40,140);ADV.drops.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,z:0,vz:aRand(180,260),type,val,t:0})}
function advGainXP(n){
 const c=ADV.c;if(c.lv>=AMAX_LV)return;c.xp+=n;
 while(c.lv<AMAX_LV&&c.xp>=aNeed(c.lv)){c.xp-=aNeed(c.lv);c.lv++;c.pts+=5;c.st[AJOB[c.job].main]++;advCalc();const p=ADV.p;p.hp=ADV.st.maxHp;p.mp=ADV.st.maxMp;
  toast(`⭐ 레벨 업! Lv.${c.lv} — 능력치 포인트 +5 (C)`);sfx("upgrade");stinger("evo");
  ADV.fx.push({k:"ring",x:p.x,y:p.y,r0:10,r1:140,t:0,max:.6,c:"#ffe58a"});ADV.fx.push({k:"txt",x:p.x,y:p.y-50,t:0,max:1.4,s:"LEVEL UP!",c:"#ffe58a"});
  for(let i=0;i<26;i++){const a=i/26*6.283;spawnP(p.x,p.y,Math.cos(a)*220,Math.sin(a)*220,.6,2.6,i&1?"#ffe58a":"#fff",1,4,0)}
  advSaveNow()}
 if(c.lv>=AMAX_LV)c.xp=0;
}
/* ── 플레이어 피격 ── */
function advHurtP(d,src){
 const p=ADV.p;if(ADV.dead||p.inv>0||p.roll>0||DEV.god)return;
 d*=100/(100+ADV.st.def);if(ADV.buf.shout>0)d*=.75;
 if(ADV.buf.barrier>0&&p.mp>0){const a=Math.min(p.mp,d*.6);p.mp-=a;d-=a}
 p.hp-=d;p.flash=.15;p.lastHit=0;ADV.recall=0;shake=Math.max(shake,d>ADV.st.maxHp*.1?8:4);
 addNum(p.x+aRand(-6,6),p.y-30,"-"+Math.round(d),"#ff6a6a",false);
 if(ADV.sfxT<=0){ADV.sfxT=.05;sfx("hurt")}
 if(p.hp<=0){p.hp=0;ADV.dead=true;ADV.deadT=.9;sfx("death");ADV.buf={};p.dash=p.spin=p.flurry=null;ADV.recall=0}
}
/* ── 입력 / 조준 ── */
function advAimWorld(){
 const p=ADV.p;
 if(TOUCH||!mouse.used){const t=advNearestMon(p.x,p.y,460);if(t)return[t.x,t.y];return[p.x+Math.cos(p.aim)*200,p.y+Math.sin(p.aim)*200]}
 return[cam.x+(mouse.x-W/2)/AZ(),cam.y+(mouse.y-H/2)/AZ()];
}
function advNearestMon(x,y,R){let b=null,bd=R*R;for(const m of ADV.mons){if(m.dead)continue;const q=(m.x-x)**2+(m.y-y)**2;if(q<bd){bd=q;b=m}}return b}
/* ── 기본 공격 ── */
function advBasic(){
 const c=ADV.c,J=AJOB[c.job],p=ADV.p,[ax,ay]=advAimWorld(),a=Math.atan2(ay-p.y,ax-p.x);
 p.aim=a;p.face=Math.cos(a)>=0?1:-1;p.atk=1;
 ADV.atkCD=1/(J.rate*ADV.st.aspd*(ADV.buf.focus>0?1.4:1));
 let M=1;if(ADV.buf.stealth>0){M=3;ADV.buf.stealth=0}
 if(J.atk==="melee"||J.atk==="stab"){
  const R=J.reach,n=advHitCone(p.x,p.y,a,J.arc,R,M,{kb:J.atk==="melee"?160:60,crit:M>1&&c.job==="rogue"});
  ADV.fx.push({k:"slash",x:p.x,y:p.y,a,arc:J.arc,r:R,t:0,max:.16,c:J.atk==="melee"?"#fff2c8":"#ffb0c0",w:J.atk==="melee"?10:5});
  sfx(J.atk==="melee"?"spear":"knife");if(n&&J.atk==="melee"){shake=Math.max(shake,2.5)}
  p.x+=Math.cos(a)*6;p.y+=Math.sin(a)*6;
 }else if(J.atk==="arrow"){advShoot(p.x,p.y-8,a,780,{k:"arrow",M,r:6,life:.85});sfx("knife")}
 else{advShoot(p.x,p.y-10,a,560,{k:"bolt",M,r:9,life:1.05,splash:42});sfx("orb")}
}
function advShoot(x,y,a,sp,o){ADV.projs.push(Object.assign({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,from:"p",pierce:0,hits:[],life:1,r:6,M:1},o))}
function advMonShot(m,a,sp,o){ADV.projs.push(Object.assign({x:m.x,y:m.y-m.r*.4,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,from:"m",dmg:m.dmg,life:2.2,r:7,k:"rock"},o))}
/* ── 스킬 ── */
function advSkill(i){
 const c=ADV.c,p=ADV.p,id=c.bar[i];if(!ADV.play||ADV.paused||ADV.dead)return;
 if(!id){toast("빈 슬롯 — 스킬 창(K)에서 등록하세요");return}
 const S=ASK[id],lv=c.sk[id]||1;if((ADV.cd[id]||0)>0)return;
 if(p.mp<S.mp){toast("💙 마나가 부족합니다");sfx("warn");return}
 if(p.roll>0||p.dash||p.flurry)return;
 p.mp-=S.mp;ADV.cd[id]=S.cd*(1-.04*(lv-1))*(1-ADV.st.cdr);
 const M=S.m*(1+.2*(lv-1))*ADV.st.sdmg,[ax,ay]=advAimWorld(),a=Math.atan2(ay-p.y,ax-p.x),ca=Math.cos(a),sa=Math.sin(a);
 p.aim=a;p.face=ca>=0?1:-1;p.atk=1;ADV.recall=0;
 const tgtPt=(mx)=>{const L=Math.hypot(ax-p.x,ay-p.y);const k=L>mx?mx/L:1;return[p.x+(ax-p.x)*k,p.y+(ay-p.y)*k]};
 switch(id){
  case"whirl":advHitCircle(p.x,p.y,135,M,{kb:220});ADV.fx.push({k:"slash",x:p.x,y:p.y,a,arc:6.28,r:135,t:0,max:.25,c:"#fff2c8",w:14});sfx("scythe");shake=Math.max(shake,5);break;
  case"charge":p.dash={vx:ca*980,vy:sa*980,t:.3,M,hit:[],stun:1};sfx("dash");break;
  case"slam":{const x=p.x+ca*95,y=p.y+sa*95;advHitCircle(x,y,125,M,{stun:1.5,kb:120});ADV.fx.push({k:"ring",x,y,r0:20,r1:135,t:0,max:.4,c:"#ffb070",w:9});
   for(let q=0;q<22;q++){const b=Math.random()*6.283,s_=aRand(80,280);spawnP(x,y,Math.cos(b)*s_,Math.sin(b)*s_,aRand(.3,.6),aRand(2,4),q&1?"#8a6a4a":"#c8a070",0,3,200)}
   sfx("quake");shake=Math.max(shake,11);break}
  case"shout":ADV.buf.shout=8;for(const m of advMonsNear(p.x,p.y,420))if(m.st!=="ret")m.st="chase";ADV.fx.push({k:"ring",x:p.x,y:p.y,r0:20,r1:420,t:0,max:.5,c:"#ff8a5a",w:6});sfx("enrage");break;
  case"storm":p.spin={t:3,tick:0,M};sfx("scythe");break;
  case"execute":{let best=null,bd=1e9;for(const m of advMonsNear(p.x,p.y,120)){const da=Math.abs(((Math.atan2(m.y-p.y,m.x-p.x)-a)%6.2832+9.4248)%6.2832-3.1416);const q=Math.hypot(m.x-p.x,m.y-p.y);if(da<1&&q<bd){bd=q;best=m}}
   ADV.fx.push({k:"slash",x:p.x,y:p.y,a,arc:1.2,r:120,t:0,max:.22,c:"#ff5a5a",w:16});
   if(best){advHitMon(best,M*(best.hp<best.max*.3?2:1),{kb:260});stopHit(.06)}sfx("cannon");shake=Math.max(shake,7);break}
  case"multi":for(let q=-3;q<=3;q++)advShoot(p.x,p.y-8,a+q*.13,800,{k:"arrow",M,r:6,life:.75});sfx("fan");break;
  case"pierce":advShoot(p.x,p.y-8,a,1150,{k:"big",M,r:14,life:.9,pierce:99});sfx("rifle");shake=Math.max(shake,4);break;
  case"rain":{const[x,y]=tgtPt(560);ADV.zones.push({k:"tick",x,y,r:115,t:0,max:2.5,ev:.15,acc:0,M,eff:"rain",from:"p"});sfx("fan");break}
  case"vault":p.dash={vx:-ca*850,vy:-sa*850,t:.24,M:0,hit:[],inv:1};for(let q=-1;q<=1;q++)advShoot(p.x,p.y-8,a+q*.12,820,{k:"arrow",M,r:6,life:.8});sfx("dash");break;
  case"boom":advShoot(p.x,p.y-8,a,760,{k:"arrow",M,r:8,life:.9,boom:{r:95},burn:1,col:"#ff9a3a"});sfx("knife");break;
  case"focus":ADV.buf.focus=8;sfx("shield");ADV.fx.push({k:"ring",x:p.x,y:p.y,r0:50,r1:10,t:0,max:.35,c:"#9af0ff",w:4});break;
  case"fireball":advShoot(p.x,p.y-10,a,620,{k:"fire",M,r:12,life:1.1,boom:{r:88},burn:1});sfx("flame");break;
  case"nova":advHitCircle(p.x,p.y,175,M,{frz:2});ADV.fx.push({k:"ring",x:p.x,y:p.y,r0:20,r1:180,t:0,max:.45,c:"#aee8ff",w:10});
   for(let q=0;q<26;q++){const b=q/26*6.283;spawnP(p.x,p.y,Math.cos(b)*320,Math.sin(b)*320,.45,2.6,"#dff6ff",1,4,0)}sfx("freeze");break;
  case"chain":{let cur=advNearestMon(ax,ay,260)||advNearestMon(p.x,p.y,480),px=p.x,py=p.y-14;const hit=[];
   for(let q=0;q<6&&cur;q++){hit.push(cur);advHitMon(cur,M,{col:"#bfe8ff"});ADV.fx.push({k:"bolt",x:px,y:py,x2:cur.x,y2:cur.y-cur.r*.4,t:0,max:.22});px=cur.x;py=cur.y-cur.r*.4;
    let nx=null,nd=270*270;for(const m of ADV.mons){if(m.dead||hit.includes(m))continue;const dd=(m.x-px)**2+(m.y-py)**2;if(dd<nd){nd=dd;nx=m}}cur=nx}
   sfx("zap");break}
  case"meteor":{const[x,y]=tgtPt(560);ADV.zones.push({k:"circle",x,y,r:165,t:0,max:.8,M,from:"p",eff:"meteor",burn:1});sfx("meteor");break}
  case"blink":{const[x,y]=tgtPt(320);for(let q=0;q<14;q++)spawnP(p.x,p.y-10,aRand(-120,120),aRand(-120,120),.4,2.4,"#c8b0ff",0,4,0);p.x=x;p.y=y;advCollide(p);p.inv=.25;
   advHitCircle(p.x,p.y,80,.9*ADV.st.sdmg,{kb:200});ADV.fx.push({k:"ring",x:p.x,y:p.y,r0:10,r1:90,t:0,max:.3,c:"#c8b0ff",w:6});sfx("star");break}
  case"barrier":ADV.buf.barrier=10;sfx("shield");break;
  case"shadow":{const t=advNearestMon(ax,ay,220)||advNearestMon(p.x,p.y,450);if(!t){toast("대상이 없습니다");p.mp+=S.mp;ADV.cd[id]=0;break}
   const b=Math.atan2(t.y-p.y,t.x-p.x);for(let q=0;q<12;q++)spawnP(p.x,p.y-10,aRand(-90,90),aRand(-90,90),.4,2.6,"#3a2a4a",0,4,0);
   p.x=t.x+Math.cos(b)*(t.r+22);p.y=t.y+Math.sin(b)*(t.r+22);advCollide(p);p.face=Math.cos(b+3.14)>=0?1:-1;p.aim=b+Math.PI;p.inv=.3;
   advHitMon(t,M*(ADV.buf.stealth>0?3:1),{crit:true,kb:120});ADV.buf.stealth=0;ADV.fx.push({k:"slash",x:p.x,y:p.y,a:b+Math.PI,arc:1.4,r:70,t:0,max:.2,c:"#ff5a7a",w:10});stopHit(.05);sfx("scythe");break}
  case"fan":for(let q=0;q<14;q++)advShoot(p.x,p.y-8,q/14*6.283,640,{k:"knife",M,r:6,life:.55,pierce:1});sfx("shuriken");break;
  case"venom":{const[x,y]=tgtPt(480);ADV.zones.push({k:"tick",x,y,r:105,t:0,max:4,ev:.25,acc:0,M,eff:"venom",from:"p",poi:1});sfx("poison");break}
  case"flurry":p.flurry={t:.62,n:7,ev:0,a,M};sfx("knife");break;
  case"smoke":ADV.buf.stealth=3;for(const m of ADV.mons)if(m.st==="chase"&&!m.D.boss)m.st="idle";for(let q=0;q<26;q++)spawnP(p.x+aRand(-30,30),p.y+aRand(-20,10),aRand(-60,60),aRand(-60,-10),aRand(.6,1),aRand(6,11),"rgba(160,160,170,.5)",0,2,0);sfx("dash_p");break;
  case"mark":{const t=advNearestMon(ax,ay,220)||advNearestMon(p.x,p.y,500);if(!t){toast("대상이 없습니다");p.mp+=S.mp;ADV.cd[id]=0;break}t.mark=8;t.st="chase";sfx("curse");ADV.fx.push({k:"ring",x:t.x,y:t.y,r0:60,r1:t.r+6,t:0,max:.35,c:"#ff4a6a",w:4});break}
 }
}
/* ── 물약 · 구르기 · 귀환 · 상호작용 ── */
function advPot(k){
 const c=ADV.c,p=ADV.p;if(!ADV.play||ADV.paused||ADV.dead)return;if(ADV.potCD>0)return;
 if(c.pot[k]<=0){toast(`${APOT[k].i} ${APOT[k].n}이 없습니다 — 상인에게 구매`);return}
 if(k==="hp"&&p.hp>=ADV.st.maxHp||k==="mp"&&p.mp>=ADV.st.maxMp)return;
 c.pot[k]--;ADV.potCD=.6;if(k==="hp")p.hp=Math.min(ADV.st.maxHp,p.hp+ADV.st.maxHp*.45);else p.mp=Math.min(ADV.st.maxMp,p.mp+ADV.st.maxMp*.5);
 sfx("heal");for(let i=0;i<12;i++)spawnP(p.x+aRand(-14,14),p.y+aRand(-10,10),0,aRand(-90,-40),.6,2.4,k==="hp"?"#ff7a8a":"#7ab0ff",0,2,0);ADV.dirty=true;
}
function advDodge(){
 const p=ADV.p;if(!ADV.play||ADV.paused||ADV.dead||p.roll>0||p.rollCD>0||p.dash)return;
 let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),iy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
 if(joy.on&&(joy.x||joy.y)){ix=joy.x;iy=joy.y}
 let a=ix||iy?Math.atan2(iy,ix):p.aim;p.roll=.3;p.rollCD=1.1;p.rvx=Math.cos(a);p.rvy=Math.sin(a);sfx("dash_p");ADV.recall=0;
}
function advInteract(){
 if(!ADV.play||ADV.paused||ADV.dead)return;const n=ADV.near;if(!n)return;
 if(n.k==="portal")advOpen("map");else if(n.k==="exit")advGoMap("town","portal");else advOpen("npc",n.k);
}
function advRecall(){if(!ADV.play||ADV.paused||ADV.dead||AMAP[ADV.map].town)return;if(ADV.recall>0){ADV.recall=0;return}ADV.recall=.001;toast("🌀 귀환 주문 시전 중… (3초, 맞으면 취소)")}
/* ── 업데이트 ── */
function advCollide(o){
 const B=mapBounds(ADV.map);o.x=aClamp(o.x,B.x0+20,B.x1-20);o.y=aClamp(o.y,B.y0+30,B.y1-20);
 for(const w of ADV.walls){const cx=aClamp(o.x,w.x,w.x+w.w),cy=aClamp(o.y,w.y,w.y+w.h),dx=o.x-cx,dy=o.y-cy,q=dx*dx+dy*dy,r=o.r||15;
  if(q<r*r){if(q>0){const L=Math.sqrt(q);o.x=cx+dx/L*r;o.y=cy+dy/L*r}else{o.y=w.y+w.h+r}}}
 if(AMAP[ADV.map].town){const wl=ATOWN.well,dx=o.x-wl.x,dy=o.y-wl.y,L=Math.hypot(dx,dy),r=wl.r+(o.r||15);if(L<r&&L>0){o.x=wl.x+dx/L*r;o.y=wl.y+dy/L*r}}
}
function advUpdate(dt){
 const c=ADV.c,p=ADV.p,st=ADV.st,M=AMAP[ADV.map];
 c.time+=dt;ADV.sfxT-=dt;ADV.potCD-=dt;p.lastHit+=dt;
 for(const k in ADV.cd)if(ADV.cd[k]>0)ADV.cd[k]-=dt;
 for(const k in ADV.buf)if(ADV.buf[k]>0)ADV.buf[k]-=dt;
 if(ADV.dead){ADV.deadT-=dt;if(ADV.deadT<=0&&ADV.panel!=="dead")advOpen("dead")}
 if(!ADV.dead){
  // 이동
  let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),iy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),mag=1;
  if(joy.on&&(joy.x||joy.y)){ix=joy.x;iy=joy.y;mag=Math.min(1,Math.hypot(ix,iy))}
  p.moving=!!(ix||iy);const spd=230*st.ms*(ADV.buf.stealth>0?1.4:1)*(p.spin?.85:1);
  if(p.roll>0){p.roll-=dt;const s=spd*2.9;p.x+=p.rvx*s*dt;p.y+=p.rvy*s*dt;p.moving=true;if(Math.random()<.5)spawnP(p.x+aRand(-6,6),p.y+8,-p.rvx*40,-p.rvy*40,.3,aRand(3,5),"rgba(220,210,190,.35)",2,3,0)}
  else if(p.dash){const d=p.dash;d.t-=dt;p.x+=d.vx*dt;p.y+=d.vy*dt;p.inv=Math.max(p.inv,.05);
   if(d.M)for(const m of advMonsNear(p.x,p.y,40))if(!d.hit.includes(m)){d.hit.push(m);advHitMon(m,d.M,{stun:d.stun,kb:300,kx:p.x-d.vx,ky:p.y-d.vy})}
   spawnP(p.x,p.y,-d.vx*.05,-d.vy*.05,.3,4,"rgba(255,230,180,.4)",2,3,0);if(d.t<=0)p.dash=null}
  else if(p.flurry){const f=p.flurry;f.t-=dt;f.ev-=dt;p.x+=Math.cos(f.a)*120*dt;p.y+=Math.sin(f.a)*120*dt;p.atk=1;
   if(f.ev<=0&&f.n>0){f.ev=.085;f.n--;advHitCone(p.x,p.y,f.a,1.2,82,f.M,{kb:40});ADV.fx.push({k:"slash",x:p.x,y:p.y,a:f.a+aRand(-.4,.4),arc:.9,r:82,t:0,max:.1,c:"#ffb0c0",w:5});if(ADV.sfxT<=0)sfx("knife")}
   if(f.t<=0)p.flurry=null}
  else if(ix||iy){const l=Math.hypot(ix,iy);p.x+=ix/l*spd*mag*dt;p.y+=iy/l*spd*mag*dt;if(!mouse.down&&!ADV.touchAtk)p.aim=Math.atan2(iy,ix);if(ix&&!mouse.down)p.face=ix>0?1:-1}
  advCollide(p);
  if(p.spin){const s=p.spin;s.t-=dt;s.tick-=dt;p.atk=1;if(s.tick<=0){s.tick=.2;advHitCircle(p.x,p.y,115,s.M,{kb:90});ADV.fx.push({k:"slash",x:p.x,y:p.y,a:ADV.t*14,arc:3.4,r:115,t:0,max:.18,c:"#fff2c8",w:8});if(ADV.sfxT<=0)sfx("scythe")}if(s.t<=0)p.spin=null}
  if(p.rollCD>0)p.rollCD-=dt;if(p.inv>0)p.inv-=dt;if(p.flash>0)p.flash-=dt;
  // 공격
  ADV.atkCD-=dt;
  const want=(mouse.down&&!TOUCH)||ADV.touchAtk;
  if(want&&ADV.atkCD<=0&&p.roll<=0&&!p.dash&&!p.flurry&&!p.spin&&!M.town)advBasic();
  if(!M.town&&mouse.used&&!TOUCH&&mouse.down){const[ax]=advAimWorld();p.face=ax>=p.x?1:-1}
  // 회복
  const ooc=p.lastHit>5?2.5:1;
  p.hp=Math.min(st.maxHp,p.hp+(M.town?st.maxHp*.2:st.hpreg*ooc)*dt);p.mp=Math.min(st.maxMp,p.mp+(M.town?st.maxMp*.2:st.mpreg*ooc)*dt);
  // 귀환
  if(ADV.recall>0){ADV.recall+=dt;if(Math.random()<.4)spawnP(p.x+aRand(-20,20),p.y+12,0,aRand(-120,-60),.6,2.4,"#8ad0ff",0,1,0);if(ADV.recall>=3){ADV.recall=0;advGoMap("town","recall");return}}
 }
 // 애니메이션
 p.mvs+=((p.moving?1:0)-p.mvs)*Math.min(1,dt*10);p.walk+=dt*11*p.mvs;p.atk=Math.max(0,p.atk-dt*5);
 // 상호작용 대상
 ADV.near=null;
 if(M.town){for(const n of ANPC)if(Math.hypot(n.x-p.x,n.y-p.y)<95){ADV.near=n;break}if(!ADV.near&&Math.hypot(ATOWN_PORTAL.x-p.x,ATOWN_PORTAL.y-p.y)<110)ADV.near={k:"portal",n:"차원문"}}
 else if(Math.hypot(90-p.x,M.h/2-p.y)<110)ADV.near={k:"exit",n:"마을로 가는 차원문"};
 if(!M.town){advUpdMons(dt);
  // 몬스터 보충
  ADV.spawnT-=dt;if(ADV.spawnT<=0){ADV.spawnT=1.2;let n=0;for(const m of ADV.mons)if(!m.dead&&!m.D.boss)n++;if(n<M.cap-3)advSpawnPack(false)}
  if(ADV.bossT[ADV.map]>0){ADV.bossT[ADV.map]-=dt;if(ADV.bossT[ADV.map]<=0&&!ADV.boss)advSpawnBoss()}
 }
 advUpdProjs(dt);advUpdZones(dt);advUpdDrops(dt);
 cull(ADV.mons,m=>!m.dead);
 for(const f of ADV.fx)f.t+=dt;cull(ADV.fx,f=>f.t<f.max);
 updateParticles(dt);updateNums(dt);
 // 음악 강도
 let near=0;for(const m of ADV.mons)if(m.st==="chase")near++;ADV.inten=Math.min(1,near/14+(ADV.boss&&ADV.boss.st==="chase"?.5:0));
 // 자동 저장
 ADV.saveT-=dt;if(ADV.saveT<=0){ADV.saveT=20;advSaveNow()}
}
/* ── 몬스터 AI ── */
function advUpdMons(dt){
 const p=ADV.p,stealth=ADV.buf.stealth>0||ADV.dead,ms=ADV.mons;
 for(const m of ms){
  if(m.dead)continue;const D=m.D;
  m.flash-=dt;m.cd-=dt;m.hpbar-=dt;if(m.mark>0)m.mark-=dt;if(m.patCd>0)m.patCd-=dt;
  // 상태이상 피해 (0.5초마다)
  m.dotT-=dt;if(m.dotT<=0){m.dotT=.5;
   if(m.burn>0){advHitMon(m,0,{flat:m.burnD*.5,quiet:1,dot:1});addNum(m.x+aRand(-6,6),m.y-m.r,""+Math.round(m.burnD*.5),"#ff9a4a",false)}
   if(m.poi>0&&!m.dead){advHitMon(m,0,{flat:m.poiD*.5,quiet:1,dot:1});addNum(m.x+aRand(-6,6),m.y-m.r,""+Math.round(m.poiD*.5),"#9aff6a",false)}
   if(D.regen&&m.burn<=0&&m.hp<m.max)m.hp=Math.min(m.max,m.hp+m.max*D.regen*.5)}
  if(m.dead)continue;
  if(m.burn>0)m.burn-=dt;if(m.poi>0)m.poi-=dt;
  // 넉백
  if(m.kx||m.ky){m.x+=m.kx*dt;m.y+=m.ky*dt;const f=Math.exp(-dt*9);m.kx*=f;m.ky*=f;if(Math.abs(m.kx)+Math.abs(m.ky)<4)m.kx=m.ky=0}
  if(m.stun>0||m.frz>0){m.stun-=dt;m.frz-=dt;m.wind=0;m.tele=null;m.act=null;m.mvs*=.9;continue}
  const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy)||1,a=Math.atan2(dy,dx);
  // 어그로
  if(m.st==="idle"){if(!stealth&&d<m.ag)m.st="chase"}
  else if(m.st==="chase"){if(stealth&&!D.boss)m.st="idle";if(Math.hypot(m.x-m.hx,m.y-m.hy)>(D.boss?1500:1100))m.st="ret"}
  if(m.wind>0){m.wind-=dt;m.mvs*=.85;if(m.tele&&m.tele.track){m.tele.a=a}if(m.wind<=0)advMonStrike(m);continue}
  if(m.act){advMonAct(m,dt);continue}
  let mvx=0,mvy=0,sp=m.spd;
  if(m.st==="ret"){const hx=m.hx-m.x,hy=m.hy-m.y,hd=Math.hypot(hx,hy);m.hp=Math.min(m.max,m.hp+m.max*(D.boss?.08:.3)*dt);if(hd<30)m.st="idle";else{mvx=hx/hd;mvy=hy/hd;sp*=1.4}}
  else if(m.st==="chase"){
   const rng=D.rng+p.r;
   if(D.boss){if(m.patCd<=0&&d<620){advBossPat(m,d,a);continue}if(d<rng+12&&m.cd<=0){advMonStart(m,d,a,"melee");continue}}
   else if(m.cd<=0&&d<rng+(D.ai==="lunge"||D.ai==="charger"?0:6)&&!(D.ai==="charger"&&d<90)){advMonStart(m,d,a,D.ai);continue}
   if(D.keep&&d<D.keep){mvx=-dx/d;mvy=-dy/d}else if(d>rng*.85){mvx=dx/d;mvy=dy/d}
   else{const s_=Math.sin(m.ph+ADV.t*.8)>0?1:-1;mvx=-dy/d*s_*.5;mvy=dx/d*s_*.5}
  }else{ // 배회
   m.wt-=dt;if(m.wt<=0){m.wt=aRand(2,5);m.wx=m.hx+aRand(-160,160);m.wy=m.hy+aRand(-160,160)}
   const wx=m.wx-m.x,wy=m.wy-m.y,wd=Math.hypot(wx,wy);if(wd>12){mvx=wx/wd;mvy=wy/wd;sp*=.35}
  }
  if(mvx||mvy){m.x+=mvx*sp*dt;m.y+=mvy*sp*dt;if(Math.abs(mvx)>.15)m.face=mvx>0?1:-1;m.mvs=Math.min(1,m.mvs+dt*6)}else m.mvs*=.9;
  if(m.st==="chase"&&Math.abs(dx)>4)m.face=dx>0?1:-1;
  m.walk+=dt*10*m.mvs;
 }
 // 서로 밀어내기 + 플레이어와 겹침 방지
 const B=mapBounds(ADV.map);
 for(let i=0;i<ms.length;i++){const a=ms[i];if(a.dead)continue;
  for(let j=i+1;j<ms.length;j++){const b=ms[j];if(b.dead)continue;const dx=b.x-a.x,dy=b.y-a.y,r=a.r+b.r,q=dx*dx+dy*dy;if(q<r*r&&q>.01){const L=Math.sqrt(q),o=(r-L)*.5/L;a.x-=dx*o;a.y-=dy*o;b.x+=dx*o;b.y+=dy*o}}
  const dx=a.x-p.x,dy=a.y-p.y,r=a.r+p.r-4,q=dx*dx+dy*dy;if(q<r*r&&q>.01&&!a.act){const L=Math.sqrt(q);a.x=p.x+dx/L*r;a.y=p.y+dy/L*r}
  a.x=aClamp(a.x,B.x0+20,B.x1-20);a.y=aClamp(a.y,B.y0+30,B.y1-20);
 }
}
/* 공격 준비 (예고) */
function advMonStart(m,d,a,ai){
 const D=m.D;m.cd=D.cd*aRand(.9,1.15)*(D.boss&&m.hp<m.max*.4?.7:1);
 switch(ai){
  case"melee":m.wind=D.boss?.45:.42;m.tele={k:"cone",a,arc:1.5,r:D.rng+m.r*.4+26,track:0};break;
  case"ranged":m.wind=.5;m.tele={k:"line",a,len:120,track:1};m.atk="rock";break;
  case"caster":{let hurt=null;for(const o of advMonsNear(m.x,m.y,280))if(o!==m&&o.hp<o.max*.7&&!o.D.boss){hurt=o;break}
   if(hurt&&Math.random()<.6){m.wind=.6;m.atk="heal";m.tele=null}else{m.wind=.6;m.atk="fire";m.tele={k:"line",a,len:140,track:1}}break}
  case"lunge":m.wind=.38;m.tele={k:"line",a,len:180,track:0};break;
  case"slam":{const R=m.r*2.4+20,x=m.x+Math.cos(a)*D.rng*.7,y=m.y+Math.sin(a)*D.rng*.7;m.wind=.85;m.tele=null;ADV.zones.push({k:"circle",x,y,r:R,t:0,max:.85,dmg:m.dmg*1.3,from:"m",eff:"slam",mon:m});break}
  case"bomber":m.wind=.75;m.tele=null;ADV.zones.push({k:"circle",x:m.x,y:m.y,r:90,t:0,max:.75,dmg:m.dmg,from:"m",eff:"bomb",mon:m,follow:1});break;
  case"charger":m.wind=.6;m.tele={k:"line",a,len:440,w:m.r*2,track:0};break;
 }
 m.ai=ai;
}
function advMonStrike(m){
 const p=ADV.p,D=m.D,t=m.tele,ai=m.ai;m.tele=null;
 switch(ai){
  case"melee":{const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy),da=Math.abs(((Math.atan2(dy,dx)-t.a)%6.2832+9.4248)%6.2832-3.1416);
   ADV.fx.push({k:"slash",x:m.x,y:m.y,a:t.a,arc:t.arc,r:t.r,t:0,max:.14,c:"#ff8a7a",w:7});
   if(d<t.r+p.r&&da<t.arc/2+.25)advHurtP(m.dmg,m);if(ADV.sfxT<=0)sfx("spear");break}
  case"ranged":advMonShot(m,t.a,400,{k:"rock",r:6});break;
  case"caster":if(m.atk==="heal"){for(const o of advMonsNear(m.x,m.y,280))if(!o.D.boss){o.hp=Math.min(o.max,o.hp+o.max*.25);for(let i=0;i<5;i++)spawnP(o.x+aRand(-10,10),o.y,0,aRand(-80,-40),.6,2.4,"#7aff8a",0,2,0)}ADV.fx.push({k:"ring",x:m.x,y:m.y,r0:20,r1:280,t:0,max:.5,c:"#7aff8a",w:4})}
   else advMonShot(m,t.a,300,{k:"mfire",r:10,boom:46});break;
  case"lunge":m.act={k:"dash",vx:Math.cos(t.a)*560,vy:Math.sin(t.a)*560,t:.32,hit:false};break;
  case"charger":m.act={k:"dash",vx:Math.cos(t.a)*700,vy:Math.sin(t.a)*700,t:.62,hit:false};sfx("dash");break;
  case"bomber":m.hp=0;m.dead=true;m.boomed=1;advDeathSmall(m);break;
 }
}
function advDeathSmall(m){for(let i=0;i<16;i++){const a=Math.random()*6.283,s=aRand(80,240);spawnP(m.x,m.y,Math.cos(a)*s,Math.sin(a)*s,.5,3,i&1?"#ffb040":"#3a2a20",0,3,0)}}
function advMonAct(m,dt){
 const p=ADV.p,A=m.act;A.t-=dt;
 switch(A.k){
  case"dash":m.x+=A.vx*dt;m.y+=A.vy*dt;m.mvs=1;m.walk+=dt*20;if(!A.hit&&Math.hypot(p.x-m.x,p.y-m.y)<m.r+p.r+6){A.hit=true;advHurtP(m.dmg*1.2,m)}
   if(Math.random()<.5)spawnP(m.x,m.y+m.r*.6,-A.vx*.05,-A.vy*.05,.3,4,"rgba(200,180,150,.4)",2,3,0);break;
  case"spin":{const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy)||1;m.x+=dx/d*m.spd*.95*dt;m.y+=dy/d*m.spd*.95*dt;m.mvs=1;m.walk+=dt*10;A.tick-=dt;
   if(A.tick<=0){A.tick=.35;ADV.fx.push({k:"slash",x:m.x,y:m.y,a:ADV.t*12,arc:4,r:m.r+60,t:0,max:.2,c:"#ff8a7a",w:9});if(d<m.r+60+p.r)advHurtP(m.dmg*.8,m);sfx("scythe")}break}
  case"jump":{const k=1-A.t/A.max;m.x=A.sx+(A.tx-A.sx)*k;m.y=A.sy+(A.ty-A.sy)*k;m.z=Math.sin(k*Math.PI)*120;if(A.t<=0){m.z=0}break}
 }
 if(A.t<=0)m.act=null;
}
/* 보스 패턴 */
function advBossPat(m,d,a){
 const D=m.D,p=ADV.p,pat=D.pat[m.pi++%D.pat.length],enr=m.hp<m.max*.4;m.patCd=enr?3.2:4.6;m.cd=1.2;
 switch(pat){
  case"spin":m.act={k:"spin",t:2.2,tick:.2};toast(`🌀 ${D.n}: 회전 베기!`);break;
  case"charge":m.wind=.75;m.ai="charger";m.tele={k:"line",a,len:520,w:m.r*2,track:0};break;
  case"summon":{let n=0;for(const o of ADV.mons)if(!o.dead&&!o.D.boss&&Math.hypot(o.x-m.x,o.y-m.y)<500)n++;if(n>=8){m.patCd=1;break}
   for(let i=0;i<(enr?5:3);i++){const b=i/(enr?5:3)*6.283;advMakeMon(D.sum,m.x+Math.cos(b)*90,m.y+Math.sin(b)*90,Math.max(1,m.lv-2),false).st="chase"}
   ADV.fx.push({k:"ring",x:m.x,y:m.y,r0:30,r1:160,t:0,max:.5,c:"#c070ff",w:6});sfx("curse");toast(`📯 ${D.n}이(가) 부하를 부릅니다!`);break}
  case"slam":ADV.zones.push({k:"circle",x:p.x,y:p.y,r:150,t:0,max:1.05,dmg:m.dmg*1.6,from:"m",eff:"slam"});m.wind=.6;m.ai="none";m.tele=null;break;
  case"bombs":for(let i=0;i<(enr?9:6);i++){const b=Math.random()*6.283,r=Math.random()*240;ADV.zones.push({k:"circle",x:p.x+Math.cos(b)*r,y:p.y+Math.sin(b)*r,r:72,t:-i*.12,max:1.1,dmg:m.dmg*1.2,from:"m",eff:"bomb"})}m.wind=.5;m.ai="none";sfx("warn");break;
  case"firering":for(let i=0;i<(enr?18:13);i++){const b=i/(enr?18:13)*6.283+ADV.t;advMonShot(m,b,250,{k:"mfire",r:11,dmg:m.dmg,boom:0})}sfx("flame");break;
  case"jump":{const tx=p.x,ty=p.y;ADV.zones.push({k:"circle",x:tx,y:ty,r:160,t:0,max:1,dmg:m.dmg*1.8,from:"m",eff:"slam"});m.act={k:"jump",t:1,max:1,sx:m.x,sy:m.y,tx,ty};toast(`⚠️ ${D.n}: 도약!`);break}
  case"boulder":for(let i=-1;i<=1;i++)advMonShot(m,a+i*.26,340,{k:"boulder",r:22,dmg:m.dmg*1.4,life:2.6});m.wind=.4;m.ai="none";sfx("cannon");break;
  case"quake":for(let i=1;i<=6;i++)ADV.zones.push({k:"circle",x:m.x+Math.cos(a)*i*105,y:m.y+Math.sin(a)*i*105,r:85,t:-i*.14,max:.8,dmg:m.dmg*1.4,from:"m",eff:"slam"});m.wind=.6;m.ai="none";sfx("quake");break;
 }
}
/* ── 투사체 ── */
function advUpdProjs(dt){
 const p=ADV.p,B=mapBounds(ADV.map);
 for(const s of ADV.projs){
  s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.x<B.x0-50||s.x>B.x1+50||s.y<B.y0-50||s.y>B.y1+50)s.life=0;
  if(s.life<=0)continue;
  if(s.from==="p"){
   for(const m of ADV.mons){if(m.dead||s.hits.includes(m))continue;const r=m.r+s.r;if((m.x-s.x)**2+(m.y-m.r*.4-s.y)**2>r*r)continue;
    s.hits.push(m);
    if(s.boom){advHitCircle(s.x,s.y,s.boom.r,s.M,{burn:s.burn,kb:140});ADV.fx.push({k:"ring",x:s.x,y:s.y,r0:10,r1:s.boom.r,t:0,max:.3,c:s.k==="fire"?"#ff9a3a":"#ffd070",w:8});
     for(let i=0;i<14;i++){const b=Math.random()*6.283,v=aRand(80,260);spawnP(s.x,s.y,Math.cos(b)*v,Math.sin(b)*v,aRand(.3,.6),aRand(2,4),i&1?"#ffb040":"#ff5a2a",0,3,0)}sfx("boom");shake=Math.max(shake,4);s.life=0;break}
    advHitMon(m,s.M,{kb:s.k==="big"?200:70,kx:s.x-s.vx,ky:s.y-s.vy,burn:s.burn});
    if(s.splash)for(const o of advMonsNear(s.x,s.y,s.splash).slice())if(o!==m)advHitMon(o,s.M*.45,{quiet:0});
    if(s.pierce-->0)continue;s.life=0;break}
  }else{
   const r=p.r+s.r-3;if((p.x-s.x)**2+(p.y-10-s.y)**2<r*r&&p.roll<=0&&p.inv<=0){advHurtP(s.dmg,null);s.life=0;
    if(s.boom){ADV.fx.push({k:"ring",x:s.x,y:s.y,r0:8,r1:s.boom,t:0,max:.25,c:"#ff7a3a",w:5})}}
  }
 }
 cull(ADV.projs,s=>s.life>0);
}
/* ── 범위 효과 (예고 → 폭발) ── */
function advUpdZones(dt){
 const p=ADV.p;
 for(const z of ADV.zones){
  z.t+=dt;if(z.t<0)continue;
  if(z.follow&&z.mon&&!z.mon.dead){z.x=z.mon.x;z.y=z.mon.y}
  if(z.mon&&(z.mon.dead&&!z.mon.boomed||z.mon.stun>0||z.mon.frz>0)&&z.from==="m"){z.done=1;continue}
  if(z.k==="tick"){z.acc-=dt;if(z.acc<=0){z.acc=z.ev;advHitCircle(z.x,z.y,z.r,z.M,{poi:z.poi,quiet:z.eff==="venom"&&Math.random()<.5});
    if(z.eff==="rain")for(let i=0;i<5;i++){const b=Math.random()*6.283,r=Math.random()*z.r;spawnP(z.x+Math.cos(b)*r,z.y+Math.sin(b)*r-60,0,600,.1,2,"#e8e0c8",1,0,0)}}
   if(z.t>=z.max)z.done=1;continue}
  if(z.t>=z.max){z.done=1;
   if(z.from==="m"){if(Math.hypot(p.x-z.x,p.y-z.y)<z.r+p.r*.5)advHurtP(z.dmg,null)}
   else advHitCircle(z.x,z.y,z.r,z.M,{burn:z.burn,kb:200,stun:z.eff==="meteor"?.5:0});
   const col=z.eff==="meteor"||z.eff==="bomb"?"#ffb040":"#c8a070";
   ADV.fx.push({k:"ring",x:z.x,y:z.y,r0:10,r1:z.r,t:0,max:.35,c:col,w:9});
   for(let i=0;i<(z.eff==="meteor"?40:18);i++){const b=Math.random()*6.283,v=aRand(80,z.r*2.4);spawnP(z.x,z.y,Math.cos(b)*v,Math.sin(b)*v,aRand(.3,.7),aRand(2,4.5),i&1?col:"#3a2a20",0,3,120)}
   if(z.eff==="meteor"||z.eff==="bomb"){sfx("bomb");shake=Math.max(shake,z.eff==="meteor"?14:6)}else{sfx("quake");shake=Math.max(shake,7)}
  }
 }
 cull(ADV.zones,z=>!z.done);
}
/* ── 전리품 ── */
function advUpdDrops(dt){
 const p=ADV.p,c=ADV.c;
 for(const d of ADV.drops){
  d.t+=dt;if(d.z>0||d.vz>0){d.vz-=700*dt;d.z+=d.vz*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;if(d.z<=0){d.z=0;d.vz=0}}
  const q=Math.hypot(d.x-p.x,d.y-p.y);if(d.t<.35||ADV.dead)continue;
  if(d.type==="gold"&&q<90){d.x+=(p.x-d.x)*Math.min(1,dt*10);d.y+=(p.y-d.y)*Math.min(1,dt*10);if(q<24){c.gold+=d.val;d.got=1;addNum(p.x,p.y-34,"+"+d.val+"G","#ffd84a",false);if(ADV.sfxT<=0){ADV.sfxT=.04;sfx("ping")}}}
  else if(d.type!=="gold"&&q<36){
   if(d.type==="pot"){c.pot[d.val]=Math.min(30,c.pot[d.val]+1);d.got=1;toast(`${APOT[d.val].i} ${APOT[d.val].n} +1`);sfx("ui")}
   else{if(c.bag.length>=AMAX_BAG){if(!d.warn){d.warn=1;toast("🎒 가방이 가득 찼습니다 (I: 가방)")}continue}
    c.bag.push(d.val);d.got=1;const R=ARAR[d.val.r];toast(`${d.type==="book"?"📖":"🎁"} ${d.val.n} 획득`+(d.val.r>=3?` (${R.n})`:""));sfx(d.val.r>=3?"chest":"ui");ADV.dirty=true}
  }
 }
 cull(ADV.drops,d=>!d.got);
}
/* ══════════════ 렌더링 ══════════════ */
function advCamera(dt){
 const p=ADV.p;cam.t+=dt;const k=1-Math.exp(-dt*7);cam.lx+=(p.x-cam.lx)*k;cam.ly+=(p.y-cam.ly)*k;
 if(Math.abs(cam.lx-p.x)>600||Math.abs(cam.ly-p.y)>600){cam.lx=p.x;cam.ly=p.y}
 shake=Math.max(0,shake-dt*28);const s=shake*S.shake;
 cam.x=cam.lx+s*(Math.sin(cam.t*53.1)+Math.sin(cam.t*37.7+1.3))*.5;cam.y=cam.ly+s*(Math.sin(cam.t*47.3+.7)+Math.sin(cam.t*29.9+2.1))*.5;
}
let ACOB=null;
function advCobble(){
 if(ACOB)return ACOB;const c=mkCanvas(128,128),g=c.getContext("2d");g.fillStyle="#8a8270";g.fillRect(0,0,128,128);
 const r=seeded(77);for(let j=0;j<8;j++)for(let i=0;i<8;i++){const x=i*16+(j%2)*8,y=j*16,v=r()*26-13;g.fillStyle=`rgb(${150+v},${142+v},${124+v})`;g.beginPath();g.ellipse(x+8,y+8,7,6.4,r()*.6,0,7);g.fill();g.fillStyle="rgba(255,255,255,.12)";g.beginPath();g.ellipse(x+6.5,y+6,4,2.4,0,0,7);g.fill()}
 ACOB=MAINCTX.createPattern(c,"repeat");return ACOB;
}
function advDrawTown(){
 ctx.fillStyle=advCobble();
 ctx.beginPath();ctx.ellipse(0,-30,640,400,0,0,7);ctx.fill();
 ctx.fillRect(0,-10,1000,150);ctx.fillRect(-90,300,180,460);ctx.fillRect(-1000,-10,400,150);
 ctx.strokeStyle="rgba(60,50,40,.35)";ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,-30,640,400,0,0,7);ctx.stroke();
}
function advDrawHouse(h){
 const{x,y,w}=h,hh=h.h,wallH=hh*.42,rb=y+hh-wallH;
 ctx.fillStyle="rgba(0,0,0,.28)";ctx.fillRect(x+8,y+hh-6,w,14);
 ctx.fillStyle="#d9c9a6";ctx.fillRect(x,rb,w,wallH);
 ctx.strokeStyle="#5a3a22";ctx.lineWidth=5;ctx.strokeRect(x,rb,w,wallH);
 ctx.lineWidth=4;ctx.beginPath();for(let i=1;i<3;i++){ctx.moveTo(x+w*i/3,rb);ctx.lineTo(x+w*i/3,y+hh)}ctx.stroke();
 const dx=x+w/2-17;ctx.fillStyle="#6a4024";ctx.fillRect(dx,y+hh-46,34,46);ctx.strokeStyle="#3a2010";ctx.lineWidth=2;ctx.strokeRect(dx,y+hh-46,34,46);ctx.fillStyle="#e8c060";ctx.fillRect(dx+26,y+hh-24,3,3);
 for(const wx of[x+w*.17,x+w*.83-26]){ctx.fillStyle="#ffd890";ctx.fillRect(wx,rb+12,26,22);ctx.strokeStyle="#4a2a14";ctx.lineWidth=3;ctx.strokeRect(wx,rb+12,26,22);ctx.beginPath();ctx.moveTo(wx+13,rb+12);ctx.lineTo(wx+13,rb+34);ctx.moveTo(wx,rb+23);ctx.lineTo(wx+26,rb+23);ctx.stroke()}
 // 굴뚝
 ctx.fillStyle="#7a6a5a";ctx.fillRect(x+w*.72,y-14,20,40);ctx.strokeStyle="#3a2a1a";ctx.lineWidth=2;ctx.strokeRect(x+w*.72,y-14,20,40);
 // 지붕
 const rc=h.roof;ctx.fillStyle=rc;ctx.beginPath();ctx.moveTo(x-14,rb+8);ctx.lineTo(x+w+14,rb+8);ctx.lineTo(x+w-8,y);ctx.lineTo(x+8,y);ctx.closePath();ctx.fill();
 ctx.strokeStyle="rgba(0,0,0,.25)";ctx.lineWidth=2;ctx.beginPath();for(let i=1;i<6;i++){const yy=y+(rb+8-y)*i/6;ctx.moveTo(x+8-22*i/6,yy);ctx.lineTo(x+w-8+22*i/6,yy)}ctx.stroke();
 ctx.fillStyle="rgba(255,255,255,.18)";ctx.fillRect(x+8,y,w-16,6);
 ctx.strokeStyle="#2a1810";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-14,rb+8);ctx.lineTo(x+w+14,rb+8);ctx.lineTo(x+w-8,y);ctx.lineTo(x+8,y);ctx.closePath();ctx.stroke();
 if(Math.random()<.04)spawnP(x+w*.72+10,y-16,aRand(-8,8),-30,1.6,aRand(5,8),"rgba(200,200,210,.3)",0,0,-6);
}
function advDrawDecor(){
 const t=ADV.t,wl=ATOWN.well;
 // 우물
 ctx.fillStyle="rgba(0,0,0,.3)";ctx.beginPath();ctx.ellipse(wl.x+4,wl.y+10,40,16,0,0,7);ctx.fill();
 ctx.fillStyle="#7a7268";ctx.beginPath();ctx.ellipse(wl.x,wl.y,38,24,0,0,7);ctx.fill();ctx.fillStyle="#2a4a6a";ctx.beginPath();ctx.ellipse(wl.x,wl.y-2,26,14,0,0,7);ctx.fill();
 ctx.strokeStyle="#3a3028";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(wl.x,wl.y,38,24,0,0,7);ctx.stroke();
 ctx.strokeStyle="#5a3a22";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(wl.x-30,wl.y);ctx.lineTo(wl.x-30,wl.y-56);ctx.lineTo(wl.x+30,wl.y-56);ctx.lineTo(wl.x+30,wl.y);ctx.stroke();
 ctx.fillStyle="#8a3a2a";ctx.beginPath();ctx.moveTo(wl.x-42,wl.y-52);ctx.lineTo(wl.x,wl.y-78);ctx.lineTo(wl.x+42,wl.y-52);ctx.closePath();ctx.fill();
 // 상점 노점
 const sx=-660,sy=-20;ctx.fillStyle="#6a4428";ctx.fillRect(sx,sy+20,130,34);ctx.fillStyle="#8a5a34";ctx.fillRect(sx,sy+16,130,8);
 for(let i=0;i<6;i++){ctx.fillStyle=i&1?"#f4f0e0":"#3a7a9a";ctx.fillRect(sx-6+i*24,sy-24,24,22)}ctx.strokeStyle="#3a2010";ctx.lineWidth=2;ctx.strokeRect(sx-6,sy-24,144,22);
 for(let i=0;i<5;i++){ctx.fillStyle=["#ff6a7a","#6aa0ff","#ffd84a","#7ae07a","#c08aff"][i];ctx.beginPath();ctx.arc(sx+16+i*24,sy+12,6,0,7);ctx.fill()}
 // 대장간
 const fx_=470,fy=80;ctx.fillStyle="#4a4a52";ctx.fillRect(fx_+50,fy-40,70,60);ctx.fillStyle=`rgba(255,${120+Math.sin(t*9)*30},40,.9)`;ctx.fillRect(fx_+64,fy-20,42,24);
 ctx.fillStyle="#2a2a30";ctx.beginPath();ctx.moveTo(fx_-24,fy+8);ctx.lineTo(fx_+24,fy+8);ctx.lineTo(fx_+16,fy-6);ctx.lineTo(fx_+30,fy-12);ctx.lineTo(fx_-30,fy-12);ctx.lineTo(fx_-16,fy-6);ctx.closePath();ctx.fill();
 if(Math.random()<.2)spawnP(fx_+85,fy-24,aRand(-20,20),aRand(-80,-40),.6,1.6,"#ffb040",0,1,0);
 // 현자 책상
 ctx.fillStyle="#5a3a2a";ctx.fillRect(-500,-300,70,30);ctx.fillStyle="#e8e0c8";ctx.fillRect(-490,-306,22,8);ctx.fillStyle="#8a2a3a";ctx.fillRect(-462,-308,18,10);ctx.fillStyle="#3a5a9a";ctx.fillRect(-490,-316,20,10);
 // 게시판
 ctx.fillStyle="#6a4428";ctx.fillRect(40,-290,8,50);ctx.fillRect(110,-290,8,50);ctx.fillStyle="#8a6a44";ctx.fillRect(30,-330,98,50);ctx.fillStyle="#f0e8d0";for(let i=0;i<4;i++)ctx.fillRect(38+i*22,-322+(i%2)*8,16,20);
 // 가로등
 for(const[lx,ly]of ATOWN.lamps){ctx.fillStyle="#2a2a2e";ctx.fillRect(lx-3,ly-60,6,62);ctx.fillStyle="#ffe8a0";ctx.beginPath();ctx.arc(lx,ly-64,7,0,7);ctx.fill();
  const g=ctx.createRadialGradient(lx,ly-64,2,lx,ly-64,60);g.addColorStop(0,"rgba(255,220,140,.45)");g.addColorStop(1,"rgba(255,220,140,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(lx,ly-64,60,0,7);ctx.fill()}
}
function advDrawPortal(x,y,col,label){
 const t=ADV.t;ctx.save();ctx.translate(x,y);
 const g=ctx.createRadialGradient(0,0,4,0,0,70);g.addColorStop(0,col+"cc");g.addColorStop(1,col+"00");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,70,40,0,0,7);ctx.fill();
 ctx.strokeStyle="#5a5a6a";ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(0,-20,34,54,0,Math.PI*.95,Math.PI*2.05);ctx.stroke();
 for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(255,255,255,${.5-i*.12})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-20,26-i*7,46-i*12,0,t*2+i*2,t*2+i*2+4);ctx.stroke()}
 ctx.fillStyle=col+"66";ctx.beginPath();ctx.ellipse(0,-20,26,46,0,0,7);ctx.fill();
 ctx.restore();if(Math.random()<.25)spawnP(x+aRand(-24,24),y-aRand(0,60),0,aRand(-50,-20),.8,2,col,0,1,0);
 if(label){ctx.font="bold 13px system-ui";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="rgba(0,0,0,.7)";ctx.strokeText(label,x,y-86);ctx.fillStyle="#cfe8ff";ctx.fillText(label,x,y-86)}
}
function advDrawArena(){
 const M=AMAP[ADV.map];if(!M.boss)return;const x=M.w-450,y=M.h/2;
 ctx.strokeStyle="rgba(40,20,20,.55)";ctx.lineWidth=14;ctx.beginPath();ctx.ellipse(x,y,380,250,0,0,7);ctx.stroke();
 ctx.strokeStyle="rgba(200,60,40,.35)";ctx.lineWidth=3;ctx.setLineDash([18,14]);ctx.beginPath();ctx.ellipse(x,y,380,250,0,0,7);ctx.stroke();ctx.setLineDash([]);
 for(let i=0;i<8;i++){const b=i/8*6.283,tx=x+Math.cos(b)*380,ty=y+Math.sin(b)*250;ctx.fillStyle="#3a2a20";ctx.fillRect(tx-4,ty-34,8,36);
  const f=Math.sin(ADV.t*12+i)*2;ctx.fillStyle="#ffb040";ctx.beginPath();ctx.ellipse(tx,ty-40+f*.3,6,10+f,0,0,7);ctx.fill();ctx.fillStyle="#fff2a0";ctx.beginPath();ctx.ellipse(tx,ty-37,3,5,0,0,7);ctx.fill()}
 if(!ADV.boss){const s=Math.ceil(ADV.bossT[ADV.map]||0);ctx.font="bold 16px system-ui";ctx.textAlign="center";ctx.fillStyle="rgba(255,220,200,.8)";ctx.fillText(`👑 보스 재등장까지 ${s}초`,x,y)}
}
function advDrawFog(){
 const B=mapBounds(ADV.map),E=900,f="rgba(4,6,10,.92)";
 ctx.fillStyle=f;ctx.fillRect(B.x0-E,B.y0-E,B.x1-B.x0+E*2,E);ctx.fillRect(B.x0-E,B.y1,B.x1-B.x0+E*2,E);ctx.fillRect(B.x0-E,B.y0,E,B.y1-B.y0);ctx.fillRect(B.x1,B.y0,E,B.y1-B.y0);
 const W_=B.x1-B.x0,H_=B.y1-B.y0;
 let g=ctx.createLinearGradient(B.x0+100,0,B.x0,0);g.addColorStop(0,"rgba(4,6,10,0)");g.addColorStop(1,f);ctx.fillStyle=g;ctx.fillRect(B.x0,B.y0,100,H_);
 g=ctx.createLinearGradient(B.x1-100,0,B.x1,0);g.addColorStop(0,"rgba(4,6,10,0)");g.addColorStop(1,f);ctx.fillStyle=g;ctx.fillRect(B.x1-100,B.y0,100,H_);
 g=ctx.createLinearGradient(0,B.y0+100,0,B.y0);g.addColorStop(0,"rgba(4,6,10,0)");g.addColorStop(1,f);ctx.fillStyle=g;ctx.fillRect(B.x0,B.y0,W_,100);
 g=ctx.createLinearGradient(0,B.y1-100,0,B.y1);g.addColorStop(0,"rgba(4,6,10,0)");g.addColorStop(1,f);ctx.fillStyle=g;ctx.fillRect(B.x0,B.y1-100,W_,100);
}
/* 몬스터 그리기 (벡터, 오른쪽을 보는 기준) */
function aOl(w){ctx.strokeStyle="#1a120c";ctx.lineWidth=w||1.6;ctx.stroke()}
function aCirc(x,y,r,c,o){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();if(o)aOl(o)}
function aEll(x,y,rx,ry,c,o,rot){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot||0,0,7);ctx.fill();if(o)aOl(o)}
function aLine(x1,y1,x2,y2,w,c){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function advDrawGob(m,sk,cl,sw,atk){
 const D=m.D;
 // 다리
 aLine(-3,6,-3-sw*4,13,3.6,"#1a120c");aLine(3,6,3+sw*4,13,3.6,"#1a120c");aLine(-3,6,-3-sw*4,13,2.2,sk);aLine(3,6,3+sw*4,13,2.2,sk);
 if(D.cape){ctx.fillStyle=D.cape;ctx.beginPath();ctx.moveTo(-6,-4);ctx.quadraticCurveTo(-14,6+sw*2,-10,12);ctx.lineTo(4,10);ctx.lineTo(2,-4);ctx.closePath();ctx.fill();aOl(1.2)}
 // 뒷팔 + 방패
 aLine(-4,-1,-8,6,3.4,"#1a120c");aLine(-4,-1,-8,6,2,sk);
 if(D.shield){aEll(-9,4,5,7,"#8a6a3a",1.4);aCirc(-9,4,1.6,"#c8c8d0")}
 // 몸통
 aEll(0,2,7,7.5,cl,1.6);ctx.fillStyle="#3a2a1a";ctx.fillRect(-7,4,14,2.4);
 if(D.arm>=6&&!D.crown){ctx.fillStyle="#9aa0aa";ctx.fillRect(-5,-3,10,5);ctx.strokeStyle="#3a3a40";ctx.lineWidth=1;ctx.strokeRect(-5,-3,10,5)}
 // 머리
 const hy=-9;
 for(const s of[-1,1]){ctx.fillStyle=sk;ctx.beginPath();ctx.moveTo(s*5,hy-2);ctx.lineTo(s*16,hy-7+Math.sin(ADV.t*3+m.ph)*.8);ctx.lineTo(s*6,hy+3);ctx.closePath();ctx.fill();aOl(1.3)}
 aCirc(0,hy,8,sk,1.6);
 ctx.fillStyle=sk;ctx.beginPath();ctx.moveTo(5,hy);ctx.lineTo(11,hy+2);ctx.lineTo(5,hy+3.5);ctx.closePath();ctx.fill();aOl(1);
 if(D.mask){ctx.fillStyle="#efe6d0";ctx.beginPath();ctx.ellipse(1.5,hy,6.5,7,0,0,7);ctx.fill();aOl(1.2);aCirc(-1,hy-1,1.6,"#1a0a0a");aCirc(4.4,hy-1,1.6,"#1a0a0a");
  for(let i=0;i<3;i++){ctx.strokeStyle=["#e84a3a","#3ab0e8","#e8c83a"][i];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-3+i*3,hy-7);ctx.lineTo(-6+i*4,hy-16);ctx.stroke()}}
 else{aCirc(-1,hy-1.5,2.1,"#ffe14a");aCirc(4.3,hy-1.5,2.1,"#ffe14a");aCirc(-.4,hy-1.5,1,"#1a0a0a");aCirc(4.9,hy-1.5,1,"#1a0a0a");
  ctx.strokeStyle="#3a1010";ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-2,hy+4);ctx.lineTo(5,hy+4);ctx.stroke();ctx.fillStyle="#fff";ctx.fillRect(0,hy+4,1.4,1.6);ctx.fillRect(3,hy+4,1.4,1.6)}
 if(D.helm){ctx.fillStyle="#8a909a";ctx.beginPath();ctx.arc(0,hy-1,8.6,Math.PI,0);ctx.closePath();ctx.fill();aOl(1.3);
  if(D.helm===2)for(const s of[-1,1]){ctx.fillStyle="#efe6d0";ctx.beginPath();ctx.moveTo(s*6,hy-6);ctx.quadraticCurveTo(s*15,hy-10,s*13,hy-19);ctx.lineTo(s*4,hy-8);ctx.closePath();ctx.fill();aOl(1.1)}}
 if(D.crown){ctx.fillStyle="#ffd84a";ctx.beginPath();ctx.moveTo(-7,hy-6);ctx.lineTo(-7,hy-13);ctx.lineTo(-3.5,hy-9);ctx.lineTo(0,hy-15);ctx.lineTo(3.5,hy-9);ctx.lineTo(7,hy-13);ctx.lineTo(7,hy-6);ctx.closePath();ctx.fill();aOl(1.1);aCirc(0,hy-8,1.4,"#e83a5a")}
 // 앞팔 + 무기
 const wa=-.4+atk*1.6;ctx.save();ctx.translate(4,-1);ctx.rotate(wa);
 aLine(0,0,0,8,3.6,"#1a120c");aLine(0,0,0,8,2.2,sk);ctx.translate(0,8);
 switch(D.wp){
  case"club":aLine(0,2,0,-13,4.2,"#1a120c");aLine(0,2,0,-13,2.8,"#8a5a30");aCirc(0,-13,3.6,"#7a4a26",1.2);break;
  case"bigclub":aLine(0,3,0,-18,6,"#1a120c");aLine(0,3,0,-18,4.4,"#7a5a3a");aEll(0,-18,5.5,7,"#6a4a2a",1.4);aCirc(-3,-21,1.2,"#c8c8c8");aCirc(3,-17,1.2,"#c8c8c8");break;
  case"axe":aLine(0,2,0,-13,3.6,"#1a120c");aLine(0,2,0,-13,2.4,"#6a4a2a");ctx.fillStyle="#c8ccd4";ctx.beginPath();ctx.moveTo(0,-13);ctx.quadraticCurveTo(9,-15,8,-7);ctx.lineTo(0,-8);ctx.closePath();ctx.fill();aOl(1.1);break;
  case"sling":aLine(0,0,5,-6,1.4,"#6a4a2a");aCirc(5,-7,2.4,"#8a8a8a",1);break;
  case"totem":aLine(0,4,0,-16,3.6,"#1a120c");aLine(0,4,0,-16,2.4,"#5a3a2a");aCirc(0,-17,4,"#efe6d0",1.2);aCirc(-1.3,-17.5,.9,"#1a0a0a");aCirc(1.3,-17.5,.9,"#1a0a0a");
   ctx.globalAlpha=.6+Math.sin(ADV.t*6)*.3;aCirc(0,-17,7,"rgba(160,90,255,.35)");ctx.globalAlpha=1;break;
  case"scepter":aLine(0,3,0,-15,3.4,"#1a120c");aLine(0,3,0,-15,2.2,"#e8c050");aCirc(0,-16,3.8,"#e83a8a",1.2);break;
 }
 ctx.restore();
}
function advDrawWolf(m,sk,cl,sw){
 const t=m.walk;for(const[lx,ph]of[[-8,0],[-4,3.14],[6,1.57],[10,4.71]]){const s=Math.sin(t+ph)*4*m.mvs;aLine(lx,3,lx+s,12,3.8,"#1a120c");aLine(lx,3,lx+s,12,2.4,cl)}
 ctx.strokeStyle="#1a120c";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,-1);ctx.quadraticCurveTo(-20,-6+Math.sin(ADV.t*6+m.ph)*2,-22,-10);ctx.stroke();ctx.strokeStyle=sk;ctx.lineWidth=3;ctx.stroke();
 aEll(0,0,13,7,sk,1.6);ctx.fillStyle="rgba(255,255,255,.18)";ctx.beginPath();ctx.ellipse(0,3,9,3,0,0,7);ctx.fill();
 aCirc(11,-6,6.4,sk,1.5);ctx.fillStyle=sk;ctx.beginPath();ctx.moveTo(14,-9);ctx.lineTo(22,-4);ctx.lineTo(14,-2);ctx.closePath();ctx.fill();aOl(1.2);aCirc(21.5,-4.4,1.3,"#1a0a0a");
 for(const s of[7,12]){ctx.fillStyle=sk;ctx.beginPath();ctx.moveTo(s,-10);ctx.lineTo(s+1,-17);ctx.lineTo(s+4,-10);ctx.closePath();ctx.fill();aOl(1)}
 aCirc(13,-7.5,1.5,"#ffd84a");aCirc(13.4,-7.5,.7,"#1a0a0a");
}
function advDrawKob(m,sk,cl,sw,fuse){
 aLine(-2.5,4,-2.5-sw*3,10,3.2,"#1a120c");aLine(2.5,4,2.5+sw*3,10,3.2,"#1a120c");
 ctx.strokeStyle="#1a120c";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-5,3);ctx.quadraticCurveTo(-12,4,-13,-1);ctx.stroke();ctx.strokeStyle=sk;ctx.lineWidth=1.8;ctx.stroke();
 aEll(0,1,5.5,6,cl,1.4);aCirc(1,-7,5.5,sk,1.4);ctx.fillStyle=sk;ctx.beginPath();ctx.moveTo(4,-9);ctx.lineTo(11,-6);ctx.lineTo(4,-4);ctx.closePath();ctx.fill();aOl(1);
 aCirc(2.5,-8.5,1.3,"#ffe14a");ctx.fillStyle="#efe6d0";ctx.beginPath();ctx.moveTo(-2,-11);ctx.lineTo(-5,-17);ctx.lineTo(0,-12);ctx.fill();
 // 폭탄 (등에 짊어짐)
 aCirc(-5,-12,6,"#2a2a32",1.4);aCirc(-7,-14,1.6,"rgba(255,255,255,.4)");aLine(-5,-18,-3,-22,1.4,"#8a6a3a");
 const f=fuse||Math.sin(ADV.t*14)>0;aCirc(-3,-23,f?2.6:1.6,f?"#ffd84a":"#ff7a2a");
}
function advDrawOgre(m,sk,cl,sw,atk){
 const D=m.D;
 aLine(-6,10,-6-sw*5,22,7,"#1a120c");aLine(6,10,6+sw*5,22,7,"#1a120c");aLine(-6,10,-6-sw*5,22,5,sk);aLine(6,10,6+sw*5,22,5,sk);
 aLine(-10,-6,-16,10,7,"#1a120c");aLine(-10,-6,-16,10,5,sk);
 aEll(0,0,15,15,sk,2);aEll(1,6,11,8,"rgba(255,255,255,.12)");ctx.fillStyle=cl;ctx.fillRect(-14,8,28,7);ctx.strokeStyle="#1a120c";ctx.lineWidth=1.4;ctx.strokeRect(-14,8,28,7);
 if(D.crown===2){for(const s of[-1,1]){aCirc(s*12,-10,6,"#efe6d0",1.4);aCirc(s*12+1,-10,1.4,"#1a0a0a")}}
 const hy=-17;aCirc(2,hy,8.5,sk,1.8);
 aCirc(0,hy-2,1.6,"#ff4a2a");aCirc(5,hy-2,1.6,"#ff4a2a");ctx.strokeStyle="#1a120c";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-2,hy-5);ctx.lineTo(2,hy-3.5);ctx.moveTo(7,hy-5);ctx.lineTo(4,hy-3.5);ctx.stroke();
 for(const s of[-1,1]){ctx.fillStyle="#f4ecd8";ctx.beginPath();ctx.moveTo(2+s*3,hy+4);ctx.lineTo(2+s*4.5,hy-1);ctx.lineTo(2+s*1.5,hy+4);ctx.closePath();ctx.fill()}
 if(D.crown===2){ctx.fillStyle="#c8a040";ctx.beginPath();ctx.moveTo(-5,hy-6);ctx.lineTo(-6,hy-14);ctx.lineTo(-1,hy-9);ctx.lineTo(2,hy-16);ctx.lineTo(5,hy-9);ctx.lineTo(10,hy-14);ctx.lineTo(9,hy-6);ctx.closePath();ctx.fill();aOl(1.2)}
 ctx.save();ctx.translate(11,-6);ctx.rotate(-.5+atk*1.7);aLine(0,0,0,13,7,"#1a120c");aLine(0,0,0,13,5,sk);ctx.translate(0,13);
 aLine(0,4,0,-24,8,"#1a120c");aLine(0,4,0,-24,6,"#7a5a3a");aEll(0,-24,8,10,"#6a4a2a",1.6);for(const[a,b]of[[-4,-28],[4,-22],[-2,-19]])aCirc(a,b,1.6,"#c8c8c8");ctx.restore();
}
function advDrawTroll(m,sk,cl,sw,atk){
 aLine(-5,8,-5-sw*5,20,5,"#1a120c");aLine(5,8,5+sw*5,20,5,"#1a120c");aLine(-5,8,-5-sw*5,20,3.4,sk);aLine(5,8,5+sw*5,20,3.4,sk);
 aLine(-8,-10,-14,14+sw*3,5,"#1a120c");aLine(-8,-10,-14,14+sw*3,3.4,sk);
 aEll(0,-2,10,13,sk,1.8);ctx.fillStyle=cl;ctx.fillRect(-9,4,18,6);
 const hy=-17;aEll(6,hy,7,6,sk,1.6);ctx.fillStyle=sk;ctx.beginPath();ctx.moveTo(11,hy-1);ctx.lineTo(19,hy+4);ctx.lineTo(11,hy+3);ctx.closePath();ctx.fill();aOl(1.1);
 aCirc(8,hy-2,1.5,"#ffe14a");ctx.fillStyle="#3a5a3a";ctx.beginPath();ctx.moveTo(0,hy-5);ctx.lineTo(-4,hy-12);ctx.lineTo(3,hy-7);ctx.lineTo(4,hy-13);ctx.lineTo(7,hy-6);ctx.closePath();ctx.fill();
 ctx.save();ctx.translate(8,-9);ctx.rotate(-.2+atk*1.5);aLine(0,0,2,24,5,"#1a120c");aLine(0,0,2,24,3.4,sk);for(let i=-1;i<=1;i++)aLine(2,24,2+i*3,29,1.6,"#efe6d0");ctx.restore();
}
function advDrawMon(m){
 const D=m.D,sw=Math.sin(m.walk)*m.mvs,atk=m.wind>0?Math.max(0,1-m.wind/.5)*-.6:(m.act?1:0),s=(D.big||1)*(m.elite?1.12:1)*(D.draw==="ogre"?1:1),z=m.z||0;
 const fl=m.flash>0,sk=fl?"#ffffff":m.frz>0?"#bfe8ff":D.skin,cl=fl?"#ffffff":D.cloth;
 // 그림자 · 정예 표시
 ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(m.x,m.y+m.r*.55,m.r*1.05,m.r*.36,0,0,7);ctx.fill();
 if(m.elite||D.boss){ctx.strokeStyle=D.boss?"rgba(255,80,60,.7)":"rgba(255,210,80,.75)";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(m.x,m.y+m.r*.55,m.r*1.25,m.r*.45,0,0,7);ctx.stroke()}
 if(m.mark>0){ctx.strokeStyle="rgba(255,60,90,.8)";ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(m.x,m.y+m.r*.55,m.r*1.4,m.r*.5,ADV.t,0,7);ctx.stroke();ctx.setLineDash([])}
 ctx.save();ctx.translate(m.x,m.y-z-Math.abs(sw)*1.2);ctx.scale(m.face*s,s);
 if(m.stun>0)ctx.rotate(Math.sin(ADV.t*20)*.05);
 switch(D.draw){
  case"gob":advDrawGob(m,sk,cl,sw,atk);break;
  case"wolf":advDrawWolf(m,sk,cl,sw);break;
  case"kob":advDrawKob(m,sk,cl,sw,m.wind>0&&Math.sin(ADV.t*30)>0);break;
  case"rider":ctx.save();ctx.scale(1.25,1.25);advDrawWolf(m,fl?"#fff":"#6a6458",fl?"#fff":"#4a4238",sw);ctx.restore();ctx.save();ctx.translate(-1,-15);ctx.scale(.85,.85);advDrawGob(m,sk,cl,0,atk);ctx.restore();break;
  case"ogre":advDrawOgre(m,sk,cl,sw,atk);break;
  case"troll":advDrawTroll(m,sk,cl,sw,atk);break;
 }
 ctx.restore();
 if(m.stun>0)for(let i=0;i<3;i++){const b=ADV.t*5+i*2.1;aCirc(m.x+Math.cos(b)*m.r*.7,m.y-m.r*1.9-z+Math.sin(b)*3,2.4,"#ffe14a")}
 if(m.burn>0&&Math.random()<.3)spawnP(m.x+aRand(-m.r*.6,m.r*.6),m.y-m.r*.5,0,-50,.4,2.2,"#ff8a2a",0,1,0);
 if(m.poi>0&&Math.random()<.25)spawnP(m.x+aRand(-m.r*.6,m.r*.6),m.y-m.r*.5,0,-30,.5,2.2,"#9aff6a",0,1,0);
}
function advDrawMonUI(m){
 const D=m.D;if(D.boss)return;const z=m.z||0,top=m.y-m.r*(D.draw==="ogre"||D.draw==="troll"?2.6:2.1)*(D.big||1)-z-6;
 if(m.hpbar>0||m.elite){const w=Math.max(30,m.r*2.2);ctx.fillStyle="rgba(0,0,0,.65)";ctx.fillRect(m.x-w/2-1,top-1,w+2,6);ctx.fillStyle=m.elite?"#ffb030":"#e83a3a";ctx.fillRect(m.x-w/2,top,w*Math.max(0,m.hp/m.max),4)}
 if(m.elite||m.hpbar>0){ctx.font="bold 11px system-ui";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="rgba(0,0,0,.75)";const s=`${m.elite?"정예 ":""}${D.n} Lv.${m.lv}`;ctx.strokeText(s,m.x,top-4);ctx.fillStyle=m.elite?"#ffd070":"#f0e8e0";ctx.fillText(s,m.x,top-4)}
}
function advDrawP(){
 const p=ADV.p,c=ADV.c,J=AJOB[c.job],L=J.look,t=ADV.t;
 ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(p.x,p.y+16,15,5,0,0,7);ctx.fill();
 if(ADV.dead){ctx.save();ctx.translate(p.x,p.y+6);ctx.rotate(Math.PI/2*p.face);ctx.globalAlpha=.8;drawHero(L,t,0,0,0);ctx.restore();ctx.globalAlpha=1;return}
 const bob=-Math.abs(Math.sin(p.walk))*1.8*p.mvs;
 ctx.save();ctx.translate(p.x,p.y+bob);ctx.scale(p.face,1);
 if(p.roll>0){ctx.translate(0,4);ctx.rotate((1-p.roll/.3)*6.283*.9)}
 if(p.spin)ctx.scale(Math.cos(t*22)>0?1:-1,1);
 if(p.flash>0&&Math.floor(t*30)&1)ctx.globalAlpha=.5;if(ADV.buf.stealth>0)ctx.globalAlpha=.32;
 const aimL=(J.atk==="arrow"||J.atk==="bolt")&&p.atk>0?(p.face>0?p.aim:Math.PI-p.aim):undefined;
 drawHero(L,t,p.walk,p.mvs,p.atk,aimL);
 ctx.restore();ctx.globalAlpha=1;
 if(ADV.buf.barrier>0){ctx.strokeStyle=`rgba(120,180,255,${.4+Math.sin(t*6)*.15})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y-6,26,0,7);ctx.stroke()}
 if(ADV.buf.shout>0&&Math.random()<.3)spawnP(p.x+aRand(-12,12),p.y,0,-60,.5,2,"#ff7a4a",0,1,0);
 if(ADV.buf.focus>0&&Math.random()<.3)spawnP(p.x+aRand(-12,12),p.y,0,-60,.5,2,"#9af0ff",0,1,0);
}
function advDrawNpc(n){
 const t=ADV.t,p=ADV.p,f=p.x<n.x?-1:1;
 ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(n.x,n.y+16,15,5,0,0,7);ctx.fill();
 ctx.save();ctx.translate(n.x,n.y);ctx.scale(f,1);drawHero(n.look,t+20+Math.abs(n.x)*.01,0,0,0);ctx.restore();
 const c=ADV.c,q=c&&AQUEST[c.q],mark=n.role==="quest"&&q?(c.qs===2?"?":c.qs===0?"!":""):"";
 ctx.font="bold 12px system-ui";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="rgba(0,0,0,.75)";ctx.strokeText(n.n,n.x,n.y-44);ctx.fillStyle="#ffe8a8";ctx.fillText(n.n,n.x,n.y-44);
 if(mark){ctx.font="900 26px system-ui";ctx.strokeText(mark,n.x,n.y-60+Math.sin(t*4)*3);ctx.fillStyle="#ffd84a";ctx.fillText(mark,n.x,n.y-60+Math.sin(t*4)*3)}
}
function advDrawDrop(d){
 const y=d.y-d.z,t=ADV.t;
 if(d.type==="gold"){aCirc(d.x,y,5,"#ffd84a",1.2);aCirc(d.x-1.5,y-1.5,1.6,"#fff6c0");return}
 if(d.type==="pot"){aCirc(d.x,y,6,d.val==="hp"?"#ff4a5a":"#4a8aff",1.2);ctx.fillStyle="#d8d0c0";ctx.fillRect(d.x-2,y-10,4,4);return}
 const R=ARAR[d.val.r];
 if(d.val.r>=2){const h=d.val.r>=3?120:60;const g=ctx.createLinearGradient(d.x,y,d.x,y-h);g.addColorStop(0,R.c+"aa");g.addColorStop(1,R.c+"00");ctx.fillStyle=g;ctx.fillRect(d.x-5,y-h,10,h)}
 ctx.save();ctx.translate(d.x,y);ctx.rotate(Math.sin(t*2+d.x)*.15);ctx.fillStyle="#2a2430";ctx.fillRect(-8,-8,16,16);ctx.strokeStyle=R.c;ctx.lineWidth=2;ctx.strokeRect(-8,-8,16,16);
 ctx.font="12px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(d.type==="book"?"📖":d.val.s==="weapon"?AWEP[d.val.w].i:ASLOT[d.val.s].i,0,1);ctx.restore();ctx.textBaseline="alphabetic";
 ctx.font="bold 11px system-ui";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="rgba(0,0,0,.8)";ctx.strokeText(d.val.n,d.x,y-14);ctx.fillStyle=R.c;ctx.fillText(d.val.n,d.x,y-14);
}
function advDrawProj(s){
 const a=Math.atan2(s.vy,s.vx);
 switch(s.k){
  case"arrow":case"big":{const L=s.k==="big"?34:18;aLine(s.x-Math.cos(a)*L,s.y-Math.sin(a)*L,s.x,s.y,s.k==="big"?5:2.4,s.col||"#e8d8b0");
   ctx.fillStyle=s.k==="big"?"#bfefff":"#d8dce8";ctx.beginPath();ctx.moveTo(s.x+Math.cos(a)*6,s.y+Math.sin(a)*6);ctx.lineTo(s.x+Math.cos(a+2.5)*5,s.y+Math.sin(a+2.5)*5);ctx.lineTo(s.x+Math.cos(a-2.5)*5,s.y+Math.sin(a-2.5)*5);ctx.fill();
   if(s.k==="big"&&Math.random()<.6)spawnP(s.x,s.y,0,0,.25,4,"rgba(160,230,255,.5)",0,0,0);break}
  case"bolt":{const g=ctx.createRadialGradient(s.x,s.y,1,s.x,s.y,14);g.addColorStop(0,"#ffffff");g.addColorStop(.4,"#c0a0ff");g.addColorStop(1,"rgba(140,90,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,14,0,7);ctx.fill();if(Math.random()<.5)spawnP(s.x,s.y,0,0,.25,2.4,"#b090ff",0,0,0);break}
  case"fire":case"mfire":{const r=s.r*1.4,g=ctx.createRadialGradient(s.x,s.y,1,s.x,s.y,r);g.addColorStop(0,"#fff6c0");g.addColorStop(.4,"#ffa030");g.addColorStop(1,"rgba(255,60,20,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,r,0,7);ctx.fill();
   if(Math.random()<.6)spawnP(s.x,s.y,aRand(-20,20),aRand(-20,20),.35,3,"#ff7a2a",0,2,0);break}
  case"knife":ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.fillStyle="#e8ecf4";ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-4,-2.4);ctx.lineTo(-4,2.4);ctx.closePath();ctx.fill();ctx.fillStyle="#3a2a3a";ctx.fillRect(-8,-1.4,4,2.8);ctx.restore();break;
  case"rock":aCirc(s.x,s.y,s.r,"#8a8478",1.2);break;
  case"boulder":ctx.save();ctx.translate(s.x,s.y);ctx.rotate(ADV.t*6);aCirc(0,0,s.r,"#6a6258",2);aCirc(-6,-6,5,"#8a8276");aCirc(6,4,3,"#4a443c");ctx.restore();break;
 }
}
function advDrawZone(z){
 if(z.t<0)return;const k=Math.min(1,z.t/z.max);
 if(z.k==="tick"){
  if(z.eff==="venom"){ctx.fillStyle=`rgba(120,220,80,${.22+Math.sin(ADV.t*5)*.05})`;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.fill();if(Math.random()<.5)spawnP(z.x+aRand(-z.r,z.r)*.7,z.y+aRand(-z.r,z.r)*.5,0,-20,.8,aRand(6,10),"rgba(140,255,90,.3)",0,1,0)}
  else{ctx.strokeStyle="rgba(230,220,190,.35)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.stroke()}
  return}
 const mine=z.from==="p",c1=mine?"120,170,255":"255,60,40";
 ctx.fillStyle=`rgba(${c1},${.1+k*.12})`;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.fill();
 ctx.fillStyle=`rgba(${c1},.28)`;ctx.beginPath();ctx.arc(z.x,z.y,z.r*k,0,7);ctx.fill();
 ctx.strokeStyle=`rgba(${c1},.8)`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.stroke();
 if(z.eff==="meteor"){const h=(1-k)*500;aCirc(z.x+h*.4,z.y-h,16+k*6,"#ff8a2a");aCirc(z.x+h*.4,z.y-h,9,"#fff2a0");spawnP(z.x+h*.4,z.y-h,0,0,.3,6,"rgba(255,120,40,.5)",0,0,0)}
}
function advDrawTele(m){
 const t=m.tele;if(!t)return;const k=1-Math.max(0,m.wind)/.6;
 ctx.fillStyle=`rgba(255,50,40,${.12+k*.18})`;ctx.strokeStyle="rgba(255,70,50,.75)";ctx.lineWidth=1.5;
 if(t.k==="cone"){ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.arc(m.x,m.y,t.r,t.a-t.arc/2,t.a+t.arc/2);ctx.closePath();ctx.fill();ctx.stroke()}
 else{const w=t.w||10;ctx.save();ctx.translate(m.x,m.y);ctx.rotate(t.a);ctx.fillRect(0,-w/2,t.len,w);ctx.strokeRect(0,-w/2,t.len,w);ctx.restore()}
}
function advDrawFx(f){
 const k=f.t/f.max;
 if(f.k==="slash"){ctx.globalAlpha=1-k;ctx.strokeStyle=f.c;ctx.lineWidth=f.w*(1-k*.5);ctx.lineCap="round";ctx.beginPath();
  const a0=f.a-f.arc/2,a1=f.a+f.arc/2;ctx.arc(f.x,f.y-6,f.r*(.75+k*.25),a0+(a1-a0)*k*.3,a1);ctx.stroke();ctx.globalAlpha=1}
 else if(f.k==="ring"){ctx.globalAlpha=1-k;ctx.strokeStyle=f.c;ctx.lineWidth=f.w||5;ctx.beginPath();ctx.arc(f.x,f.y,f.r0+(f.r1-f.r0)*k,0,7);ctx.stroke();ctx.globalAlpha=1}
 else if(f.k==="bolt"){ctx.globalAlpha=1-k;ctx.strokeStyle="#dff4ff";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x,f.y);
  const n=6;for(let i=1;i<n;i++){const q=i/n;ctx.lineTo(f.x+(f.x2-f.x)*q+aRand(-10,10),f.y+(f.y2-f.y)*q+aRand(-10,10))}ctx.lineTo(f.x2,f.y2);ctx.stroke();ctx.strokeStyle="rgba(120,190,255,.5)";ctx.lineWidth=8;ctx.stroke();ctx.globalAlpha=1}
 else if(f.k==="txt"){ctx.globalAlpha=Math.min(1,(1-k)*2);ctx.font="900 22px system-ui";ctx.textAlign="center";ctx.lineWidth=4;ctx.strokeStyle="rgba(0,0,0,.7)";ctx.strokeText(f.s,f.x,f.y-k*40);ctx.fillStyle=f.c;ctx.fillText(f.s,f.x,f.y-k*40);ctx.globalAlpha=1}
}
const ADRAW=[];
function advDraw(){
 ctx=MAINCTX;ctx.clearRect(0,0,W,H);
 const Z=AZ(),vw=W/Z,vh=H/Z,camX=Math.round(W/2-cam.x*Z),camY=Math.round(H/2-cam.y*Z),M=AMAP[ADV.map];
 VX0=cam.x-vw/2;VX1=cam.x+vw/2;VY0=cam.y-vh/2;VY1=cam.y+vh/2;
 ctx.save();ctx.translate(camX,camY);ctx.scale(Z,Z);
 drawTerrain();
 if(M.town)advDrawTown();else advDrawArena();
 for(const z of ADV.zones)if(onScr(z.x,z.y,z.r))advDrawZone(z);
 for(const m of ADV.mons)if(m.tele&&!m.dead)advDrawTele(m);
 for(const d of ADV.drops)if(onScr(d.x,d.y,40))advDrawDrop(d);
 // 깊이 정렬
 ADRAW.length=0;
 if(M.town){for(const h of ATOWN.houses)if(onScr(h.x+h.w/2,h.y+h.h/2,h.w))ADRAW.push([h.y+h.h,0,h]);for(const n of ANPC)ADRAW.push([n.y,1,n]);ADRAW.push([ATOWN.well.y+10,3,null]);ADRAW.push([ATOWN_PORTAL.y,4,null])}
 else ADRAW.push([M.h/2,5,null]);
 for(const m of ADV.mons)if(!m.dead&&onScr(m.x,m.y,m.r*3))ADRAW.push([m.y,2,m]);
 if(ADV.play)ADRAW.push([ADV.p.y,6,null]);
 ADRAW.sort((a,b)=>a[0]-b[0]);
 for(const[,k,o]of ADRAW){
  if(k===0)advDrawHouse(o);else if(k===1)advDrawNpc(o);else if(k===2)advDrawMon(o);
  else if(k===3)advDrawDecor();else if(k===4)advDrawPortal(ATOWN_PORTAL.x,ATOWN_PORTAL.y,"#6ab0ff","⛩️ 차원문 — 사냥터 이동");
  else if(k===5)advDrawPortal(90,M.h/2,"#8ad0ff","🏘️ 마을로");else if(k===6)advDrawP();
 }
 for(const s of ADV.projs)if(onScr(s.x,s.y,40))advDrawProj(s);
 for(const m of ADV.mons)if(!m.dead&&onScr(m.x,m.y,80))advDrawMonUI(m);
 for(const f of ADV.fx)advDrawFx(f);
 drawParticles(onScr);
 advDrawFog();
 drawNums(onScr);
 if(ADV.recall>0){const p=ADV.p,k=ADV.recall/3;ctx.strokeStyle="#8ad0ff";ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y-8,30,-1.57,-1.57+k*6.283);ctx.stroke()}
 ctx.restore();
 if(ADV.play)advMinimap();
 drawJoy();
}
function advMinimap(){
 const M=AMAP[ADV.map],B=mapBounds(ADV.map),mw=TOUCH?130:180,mh=Math.round(mw*(B.y1-B.y0)/(B.x1-B.x0)),x0=W-mw-10,y0=10,k=mw/(B.x1-B.x0);
 const X=x=>x0+(x-B.x0)*k,Y=y=>y0+(y-B.y0)*k;
 ctx.fillStyle="rgba(8,10,16,.72)";ctx.fillRect(x0-2,y0-2,mw+4,mh+4);ctx.strokeStyle="rgba(232,200,120,.6)";ctx.lineWidth=1.5;ctx.strokeRect(x0-2,y0-2,mw+4,mh+4);
 if(M.town){ctx.fillStyle="rgba(150,140,120,.5)";ctx.beginPath();ctx.ellipse(X(0),Y(-30),640*k,400*k,0,0,7);ctx.fill();ctx.fillStyle="#8a5a3a";for(const h of ATOWN.houses)ctx.fillRect(X(h.x),Y(h.y),h.w*k,h.h*k);
  ctx.fillStyle="#ffd84a";for(const n of ANPC){ctx.beginPath();ctx.arc(X(n.x),Y(n.y),2.5,0,7);ctx.fill()}ctx.fillStyle="#6ab0ff";ctx.beginPath();ctx.arc(X(ATOWN_PORTAL.x),Y(ATOWN_PORTAL.y),4,0,7);ctx.fill()}
 else{ctx.fillStyle="#8ad0ff";ctx.beginPath();ctx.arc(X(90),Y(M.h/2),4,0,7);ctx.fill();
  ctx.strokeStyle="rgba(255,90,60,.6)";ctx.beginPath();ctx.ellipse(X(M.w-450),Y(M.h/2),380*k,250*k,0,0,7);ctx.stroke();
  for(const m of ADV.mons){if(m.dead)continue;ctx.fillStyle=m.D.boss?"#ff3a2a":m.elite?"#ffb030":"#e85a5a";const r=m.D.boss?4.5:m.elite?2.4:1.6;ctx.fillRect(X(m.x)-r,Y(m.y)-r,r*2,r*2)}}
 const p=ADV.p;ctx.fillStyle="#ffffff";ctx.beginPath();ctx.arc(X(p.x),Y(p.y),3.4,0,7);ctx.fill();ctx.strokeStyle="#000";ctx.lineWidth=1;ctx.stroke();
}
/* ── 프레임 ── */
function advFrame(raw){
 const dt=Math.min(.033,raw);
 if(ADV.play&&!ADV.paused){ADV.t+=dt;elapsed=ADV.t;advUpdate(dt);if(ADV.dirty&&ADV.saveT>5)ADV.saveT=5}
 else if(!ADV.play){ADV.t+=dt;elapsed=ADV.t}
 if(ADV.play)advCamera(raw);else{cam.t+=raw;cam.x=Math.sin(ADV.t*.07)*200;cam.y=-40+Math.cos(ADV.t*.05)*80;cam.lx=cam.x;cam.ly=cam.y}
 advDraw();
 toastTimer-=raw;if(toastTimer<=0)E.toast.classList.remove("show");
 advHud(raw);
}
/* ── 입력 ── */
addEventListener("keydown",e=>{
 if(!ADV.on)return;const c=e.code;
 if(e.target&&(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"))return;
 if(c==="Space"||c==="Tab")e.preventDefault();
 if(c==="Escape"){if(advPanelOpen())advClose();else if(ADV.play)advOpen("menu");return}
 if(!ADV.play)return;
 if(advPanelOpen()){
  if(c==="KeyI"&&ADV.panel==="char")advClose();else if(c==="KeyC"&&ADV.panel==="char")advClose();else if(c==="KeyK"&&ADV.panel==="char")advClose();else if(c==="Tab"&&ADV.panel==="char")advClose();
  return}
 if(/^Digit[1-4]$/.test(c))advSkill(+c[5]-1);
 else if(c==="Space"||c==="ShiftLeft"||c==="ShiftRight")advDodge();
 else if(c==="KeyQ")advPot("hp");else if(c==="KeyR")advPot("mp");
 else if(c==="KeyE"||c==="KeyF")advInteract();
 else if(c==="KeyI"||c==="Tab")advOpen("char","bag");else if(c==="KeyC")advOpen("char","stat");else if(c==="KeyK")advOpen("char","skill");else if(c==="KeyJ"||c==="KeyL")advOpen("char","quest");
 else if(c==="KeyB")advRecall();
});
canvas.addEventListener("pointerdown",e=>{
 if(!ADV.on||!ADV.play||ADV.paused)return;
 if(e.pointerType==="mouse"){mouse.x=e.clientX;mouse.y=e.clientY;mouse.used=true;if(e.button===0)mouse.down=true;else if(e.button===2)advSkill(0);return}
 if(joy.on)return;joy.on=true;joy.id=e.pointerId;joy.ox=joy.px=e.clientX;joy.oy=joy.py=e.clientY;joy.x=joy.y=0;try{canvas.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault();
});
