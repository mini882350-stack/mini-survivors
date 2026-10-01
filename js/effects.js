/* ═══════════════ effects.js ═══════════════
   파티클/숫자 오브젝트 풀 · 타격 이펙트 · 처치 연출 · 보석/드롭 · 지속 효과 · 사운드 */
"use strict";
/* ── 오브젝트 풀 (파티클 / 데미지 숫자) ──
   매 프레임 객체를 새로 만들지 않고 미리 만든 객체를 재사용. 죽은 항목은 마지막 활성 항목과 자리 교환. */
const PMAX=900,PART=[];let pN=0;
for(let i=0;i<PMAX;i++)PART.push({x:0,y:0,vx:0,vy:0,life:0,max:1,r:1,c:"#fff",k:0,drag:0,g:0});
// k: 0=사각 점, 1=속도 방향 줄무늬(스파크/파편), 2=원(연기/거품)
function spawnP(x,y,vx,vy,life,r,c,k,drag,g){
 if(pN>=Q.pmax)return null;
 const p=PART[pN++];p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.life=p.max=life;p.r=r;p.c=c;p.k=k;p.drag=drag;p.g=g;return p;
}
const NMAX=200,NUM=[];let nN=0;
for(let i=0;i<NMAX;i++)NUM.push({x:0,y:0,vy:0,life:0,max:1,t:"",c:"#fff",crit:false});
function addNum(x,y,t,c,crit){
 if(nN>=Q.nmax)return;
 const n=NUM[nN++];n.x=x;n.y=y;n.vy=crit?-75:-48;n.life=n.max=crit?.8:.5;n.t=t;n.c=c;n.crit=crit;
}
function dnum(e,d,c,crit){
 if(S.dmgNum==="off"||d<.5)return;
 if((S.dmgNum==="crit"||qi===2)&&!crit)return;          // 설정 '치명타만' / 저사양: 치명타만 표시
 addNum(e.x+rand(-6,6),e.y-e.r-4,crit?Math.round(d)+"!":""+Math.round(d),c||"#fff",!!crit);
}
function burst(x,y,n,c){for(let i=0;i<n;i++){const a=Math.random()*6.283,sp=rand(40,190);if(!spawnP(x,y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.2,.6),rand(1,3),c||"#fff",0,3,0))break}}
function vfx(o){if(effects.length<Q.fx+60)effects.push(o)}   // 순수 시각 효과만 개수 제한 (게임플레이 효과는 직접 push)
/* 손맛: 히트 스톱 / 카메라 임펄스 */
function stopHit(s){if(hitStopCD>0&&s<.1)return;hitStop=Math.max(hitStop,s);hitStopCD=.25}
function kick(ax,ay,p){cam.kx+=ax*p;cam.ky+=ay*p}
function kickR(p){const a=Math.random()*6.283;kick(Math.cos(a),Math.sin(a),p)}
/* ── 사운드 ──
   신호 흐름: sfxBus(효과음) / musBus(음악) → master → 로우패스 → 컴프레서 → 출력, 리버브는 send로 섞음 */
let AC=null,master=null,sfxBus=null,musBus=null,voices=0,musV=0,nbuf=null,muted=false;
/* 오디오 부하 관리: 효과음과 음악의 동시 발음 수를 따로 셈 → 후반 효과음 폭주가 배경음을 밀어내지 않음 */
const SFX_MAX=16,MUS_MAX=44,HIT_MAX=5;let sfxWin=0,sfxN=0;
/* 동시 발음 수: 각 소리가 '끝나는 시각' 목록으로 셈 → onended가 누락돼도 자동으로 회복 (예전엔 카운터가 새면 효과음이 영영 막힘)
   타격음은 전용 몫(HIT)을 따로 둬서 공격·처치음이 아무리 많아도 항상 들림 */
const VEND=[],MEND=[],HEND=[];
function liveN(q,n){let j=0;for(let i=0;i<q.length;i++)if(q[i]>n)q[j++]=q[i];q.length=j;return j}
let nodeWin=0,nodeN=0;
function nodeOk(n){if(n-nodeWin>.1){nodeWin=n;nodeN=0}return ++nodeN<=12}   // 효과음은 0.1초에 최대 12음 (오디오 스레드 과부하 = 소리 깨짐 방지)
const lastNote=new Map(),sfxLast=new Map();
function setVol(){if(!master)return;master.gain.value=muted?0:.9*S.vol;sfxBus.gain.value=S.svol;musBus.gain.value=S.mvol*.85}
function sfxInit(){
 if(AC)return AC;
 try{
  const AC_=window.AudioContext||window.webkitAudioContext;let a;try{a=new AC_({latencyHint:"balanced"})}catch(e){a=new AC_()}AC=a;   // 버퍼를 조금 키워 끊김(언더런) 방지
  master=a.createGain();sfxBus=a.createGain();musBus=a.createGain();setVol();
  const lp=a.createBiquadFilter();lp.type="lowpass";lp.frequency.value=11000;
  const cmp=a.createDynamicsCompressor();cmp.threshold.value=-16;cmp.ratio.value=4;cmp.attack.value=.004;cmp.release.value=.18;
  sfxBus.connect(master);musBus.connect(master);master.connect(lp);lp.connect(cmp);cmp.connect(a.destination);
  const len=Math.floor(a.sampleRate*1.3),buf=a.createBuffer(2,len,a.sampleRate);   // 리버브 길이 2.2→1.3초 (연산량 절감)
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}
  const cv=a.createConvolver();cv.buffer=buf;
  const sSend=a.createGain();sSend.gain.value=.16;const mSend=a.createGain();mSend.gain.value=.34;
  sfxBus.connect(sSend);musBus.connect(mSend);sSend.connect(cv);mSend.connect(cv);cv.connect(cmp);
 }catch(e){AC=null}
 return AC;
}
/* 필터 노이즈: type lowpass/highpass/bandpass, fc → f2로 스윕 */
function noise(t,d,v,fc,type,f2,bus){
 const a=AC;if(!a||muted)return;
 const mus=bus===musBus,hit=bus==="hit",n0=a.currentTime;if(hit)bus=null;
 if(mus){if(liveN(MEND,n0)>MUS_MAX)return}else if(hit){if(liveN(HEND,n0)>=HIT_MAX)return}else if(liveN(VEND,n0)>=SFX_MAX||!nodeOk(n0))return;
 if(!nbuf){nbuf=a.createBuffer(1,a.sampleRate,a.sampleRate);const c=nbuf.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1}
 const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();
 s.buffer=nbuf;s.loop=true;f.type=type||"lowpass";if(f.type==="bandpass")f.Q.value=1.2;
 f.frequency.setValueAtTime(fc,t);f.frequency.exponentialRampToValueAtTime(Math.max(40,f2||120),t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
 s.connect(f);f.connect(g);g.connect(bus||sfxBus);s.start(t,Math.random()*.5);s.stop(t+d+.02);
 (mus?MEND:hit?HEND:VEND).push(t+d+.02);
}
/* 음 하나: f → fEnd 글라이드(선택), 톤에 맞는 필터와 배음 */
function note(f,when,d,type,v,atk,bus,fEnd){
 try{
  const a=sfxInit();if(!a||muted)return;const n0=a.currentTime;
  if(bus){if(liveN(MEND,n0)>MUS_MAX)return}else if(liveN(VEND,n0)>=SFX_MAX||!nodeOk(n0))return;
  if(a.state==="suspended")a.resume();
  if(!when&&!bus){ // 같은 효과음이 35ms 안에 겹치면 생략
   const k=type+(f>>3),l=lastNote.get(k);
   if(l!==undefined&&a.currentTime-l<.035)return;lastNote.set(k,a.currentTime);
  }
  atk=atk||.005;const t=a.currentTime+(when||0),hard=type==="square"||type==="sawtooth";
  const o=a.createOscillator(),o2=a.createOscillator(),g2=a.createGain(),fl=a.createBiquadFilter(),g=a.createGain();
  o.type=type;o2.type="sine";
  o.frequency.setValueAtTime(f,t);
  if(fEnd)o.frequency.exponentialRampToValueAtTime(fEnd,t+d);
  else if(f<240&&!bus){o.frequency.setValueAtTime(f*1.5,t);o.frequency.exponentialRampToValueAtTime(f,t+.07)}
  const lite=!bus&&(hard||VEND.length>8);   // 효과음이 많을 땐 배음 오실레이터 생략 (노드 수 절감)
  o2.frequency.value=f*2.005;g2.gain.value=hard?0:.2;
  fl.type="lowpass";fl.Q.value=.7;
  fl.frequency.setValueAtTime(Math.min(10000,Math.max(500,f*(hard?5:10))),t);
  fl.frequency.exponentialRampToValueAtTime(Math.max(260,f*1.4),t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v*1.7,t+atk);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(fl);if(!lite){o2.connect(g2);g2.connect(fl)}fl.connect(g);g.connect(bus||sfxBus);
  o.start(t);o.stop(t+d+.05);if(!lite){o2.start(t);o2.stop(t+d+.05)}(bus?MEND:VEND).push(t+d+.05);
 }catch(e){}
}
function tone(f,d=.06,type="sine",v=.025){note(f,0,d,type,v)}
function chord(){[523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>note(f,i*.07,.5,"triangle",.026))}
let hitSfxT=0;
function hitSfx(){ // 타격음: 50ms에 한 번만, 음색 무작위
 const a=AC;if(!a||muted||a.state!=="running")return;
 const n=a.currentTime;if(n-hitSfxT<.06)return;hitSfxT=n;
 try{noise(n,.045,.055,2600+Math.random()*2200,"lowpass",600,"hit")}catch(e){}
}
let critT=0,pickTn=0;
function critSfx(){const a=AC;if(!a||a.currentTime-critT<.07)return;critT=a.currentTime;note(1500+Math.random()*200,0,.07,"triangle",.018);note(2300,.025,.09,"sine",.012)}
/* 효과음 라이브러리: 이름 → [최소 간격(초), 재생 함수(t=현재 시각)] */
const SFX={
 orb:[.05,t=>note(880,0,.1,"sine",.016,.003,0,520)],
 knife:[.05,t=>{noise(t,.08,.045,7000,"highpass",2500);note(1500,0,.04,"triangle",.007)}],
 ice:[.06,t=>{note(1760,0,.13,"sine",.011);note(2637,.03,.16,"sine",.008)}],
 star:[.08,t=>{note(1318,0,.2,"triangle",.013);note(1976,.05,.22,"sine",.008)}],
 bolt:[.07,t=>{noise(t,.2,.09,9000,"highpass",1800);note(170,0,.2,"sawtooth",.02,.002,0,55)}],
 flame:[.08,t=>noise(t,.3,.07,1600,"lowpass",250)],
 boomerang:[.1,t=>noise(t,.24,.035,700,"bandpass",2600)],
 cannon:[.08,t=>{note(95,0,.24,"sine",.05,.002,0,38);noise(t,.18,.07,1000,"lowpass",150)}],
 poison:[.1,t=>{note(280,0,.09,"sine",.02,.005,0,620);note(390,.07,.09,"sine",.016,.005,0,820)}],
 spear:[.08,t=>{noise(t,.14,.07,3200,"bandpass",700);note(230,0,.1,"sawtooth",.012,.002,0,110)}],
 mine:[.1,t=>note(1250,0,.035,"square",.009)],
 hole:[.2,t=>note(130,0,.6,"sine",.045,.03,0,38)],
 meteor:[.12,t=>note(1900,0,.55,"sine",.011,.02,0,280)],
 shuriken:[.06,t=>note(2300,0,.05,"square",.006,.002,0,1700)],
 ping:[.05,t=>note(2600,0,.05,"triangle",.008)],
 boom:[.06,t=>{note(72,0,.38,"sine",.07,.002,0,30);noise(t,.42,.12,1700,"lowpass",90)}],
 bomb:[.3,t=>{note(55,0,.9,"sine",.1,.002,0,24);noise(t,.9,.16,2400,"lowpass",60);note(110,.02,.5,"sawtooth",.03,.002,0,40)}],
 kill:[.03,t=>note(360+Math.random()*120,0,.08,"triangle",.014,.002,0,150)],
 bigkill:[.2,t=>{stinger("bigkill");note(65,0,.5,"sine",.07,.002,0,30)}],
 upgrade:[.05,t=>{note(660,0,.1,"triangle",.02);note(990,.06,.14,"triangle",.018)}],
 hurt:[.15,t=>{note(150,0,.14,"sawtooth",.03,.002,0,70);noise(t,.12,.06,900,"lowpass",200)}],
 death:[1,t=>{[330,262,196,131].forEach((f,i)=>note(f,i*.14,.5,"triangle",.03));noise(t,.9,.08,800,"lowpass",60)}],
 freeze:[.08,t=>{note(2400,0,.25,"sine",.01,.002,0,1600);noise(t,.2,.03,9000,"highpass",5000)}],
 zap:[.05,t=>noise(t,.07,.04,6000,"highpass",3000)],
 dash:[.12,t=>noise(t,.22,.04,600,"bandpass",2600)],
 enrage:[.3,t=>{note(160,0,.35,"sawtooth",.03,.01,0,120);note(170,0,.35,"sawtooth",.02,.01,0,125)}],
 warn:[.25,t=>{note(310,0,.13,"square",.018);note(310,.18,.13,"square",.018)}],
 chest:[.2,t=>[784,988,1175,1568].forEach((f,i)=>note(f,i*.05,.25,"triangle",.018))],
 heal:[.2,t=>{note(523,0,.18,"sine",.02,.01,0,784);note(1046,.08,.2,"sine",.012)}],
 magnet:[.3,t=>note(400,0,.45,"sine",.02,.01,0,1600)],
 ui:[.03,t=>note(920,0,.035,"triangle",.012)],
 rx_steam:[.08,t=>{noise(t,.55,.08,9000,"highpass",2500);note(90,0,.3,"sine",.04,.002,0,40)}],
 rx_overload:[.08,t=>{note(70,0,.4,"sine",.07,.002,0,30);noise(t,.3,.1,5000,"bandpass",600);noise(t+.05,.1,.05,8000,"highpass",4000)}],
 rx_superc:[.08,t=>{note(2093,0,.3,"sine",.012);note(2637,.03,.32,"sine",.01);note(3136,.06,.35,"sine",.008)}],
 rx_toxic:[.1,t=>{note(200,0,.12,"sine",.02,.004,0,500);note(260,.08,.12,"sine",.018,.004,0,560);note(180,.15,.14,"sine",.016,.004,0,420)}],
 rx_execute:[.1,t=>{noise(t,.18,.09,5000,"bandpass",900);note(90,0,.3,"sawtooth",.03,.002,0,45)}],
 rx_plagueburst:[.12,t=>note(210,0,.2,"sawtooth",.012,.004,0,90)],
 rx_concuss:[.08,t=>{noise(t,.12,.08,8000,"highpass",3000);note(120,0,.3,"square",.02,.002,0,50)}],
 rx_magma:[.1,t=>{note(60,0,.5,"sine",.07,.002,0,28);noise(t,.5,.1,900,"lowpass",80)}],
 rx_rupture:[.08,t=>{noise(t,.1,.09,6000,"bandpass",1200);noise(t+.06,.1,.07,5000,"bandpass",900)}],
 rx_decay:[.1,t=>{note(160,0,.35,"sawtooth",.015,.01,0,70);note(240,.05,.3,"sine",.02,.01,0,110)}],
 rx_judgment:[.12,t=>{[1046,1568,2093].forEach((f,i)=>note(f,i*.03,.4,"triangle",.016));note(80,0,.4,"sine",.05,.002,0,40)}],
 // 신규 무기 / 직업
 scythe:[.08,t=>{noise(t,.18,.07,2600,"bandpass",600);note(300,0,.12,"sawtooth",.01,.002,0,120)}],
 flamer:[.22,t=>noise(t,.26,.05,1300,"lowpass",300)],
 tesla:[.09,t=>{noise(t,.05,.035,7000,"highpass",4000);note(1400,0,.04,"square",.005,.001,0,900)}],
 quake:[.15,t=>{note(48,0,.6,"sine",.09,.002,0,26);noise(t,.5,.13,500,"lowpass",60)}],
 sigil_arm:[.15,t=>note(520,0,.35,"sine",.012,.05,0,780)],
 sigil:[.1,t=>{note(220,0,.35,"triangle",.02,.004,0,110);note(233,0,.35,"triangle",.016,.004,0,116)}],
 curse:[.06,t=>note(190,0,.25,"sawtooth",.014,.004,0,80)],
 dash_p:[.2,t=>noise(t,.2,.06,900,"bandpass",3200)],
 shield:[.5,t=>{note(660,0,.3,"sine",.018,.02,0,990);note(990,.05,.3,"sine",.012,.02)}],
 gun:[.05,t=>{noise(t,.09,.11,3800,"bandpass",900);note(110,0,.12,"square",.025,.001,0,45);noise(t,.22,.03,1400,"lowpass",200)}],
 shotgun:[.08,t=>{noise(t,.22,.16,2200,"lowpass",300);note(70,0,.25,"sine",.07,.002,0,32);noise(t,.06,.08,6000,"highpass",2500)}],
 rifle:[.1,t=>{noise(t,.05,.14,7000,"highpass",3000);note(140,0,.18,"square",.03,.001,0,50);noise(t+.03,.4,.04,1200,"lowpass",150)}],
 fan:[.04,t=>{noise(t,.07,.12,4200,"bandpass",1000);note(95,0,.1,"square",.03,.001,0,40)}],
 reload:[.3,t=>{note(2200,0,.03,"square",.008);note(1800,.09,.03,"square",.008);note(2600,.2,.04,"square",.01)}],
 shield_break:[.3,t=>{[1318,988,784].forEach((f,i)=>note(f,i*.04,.35,"triangle",.02));noise(t,.3,.08,6000,"highpass",2000)}]
};
function sfx(k){
 const s=SFX[k];if(!s)return;
 const a=sfxInit();if(!a||muted||a.state!=="running")return;
 const n=a.currentTime,l=sfxLast.get(k);if(l!==undefined&&n-l<Math.max(s[0],k==="kill"?.07:.08))return;   // 같은 소리는 최소 0.08초 간격 (연사·다수 처치 시 과부하 방지)
 if(n-sfxWin>.1){sfxWin=n;sfxN=0}if(++sfxN>6)return;                              // 0.1초에 효과음 9개까지 (오디오 스레드 과부하 방지)
 sfxLast.set(k,n);
 // 자동 볼륨: 동시에 울리는 효과음이 많을수록 효과음 버스를 살짝 줄임
 const act=liveN(VEND,n),tg=S.svol*Math.min(1,2.2/Math.sqrt(Math.max(1,act)));if(Math.abs(sfxBus.gain.value-tg)>.02)sfxBus.gain.setTargetAtTime(tg,n,.06);
 try{s[1](n)}catch(e){}
}
function stinger(k){
 if(k==="elite"){[392,370,311,233].forEach((f,i)=>note(f,i*.08,.4,"sawtooth",.02))}
 else if(k==="boss"){[110,116.5,98,82.4].forEach((f,i)=>note(f,i*.2,1,"sawtooth",.03));try{if(AC)noise(AC.currentTime,1.2,.1,900,"lowpass",60)}catch(e){}}
 else if(k==="evo"){[523,659,784,1046,1318,1568,2093].forEach((f,i)=>note(f,i*.055,.7,"triangle",.024))}
 else if(k==="bigkill"){[196,247,294].forEach((f,i)=>note(f,i*.05,.35,"square",.018))}
}
const mtof=n=>440*Math.pow(2,(n-69)/12);

/* ── 배경음악: 16분음표 시퀀서 (미리 예약 방식이라 프레임 드랍과 무관하게 박자가 일정)
   층: 패드(항상) · 베이스 · 아르페지오 · 드럼 — 적 수/보스에 따라 강도(inten)가 올라가며 층이 추가됨 */
let BPM=110,STEP=60/BPM/4;
/* 스테이지 곡 (차분한 탐험 분위기) */
const SONG=[
 {n:"고요한 숲",bpm:110,prog:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],bass:[45,41,36,43],arp:[0,1,2,1,2,1,0,2]},     // Am F C G
 {n:"저주받은 폐허",bpm:110,prog:[[57,60,64],[53,56,60],[50,53,57],[52,56,59]],bass:[45,41,38,40],arp:[0,2,1,2,0,1,2,1]},  // Am Fm Dm E
 {n:"용암 협곡",bpm:110,prog:[[50,53,57],[51,55,58],[50,53,57],[48,51,55]],bass:[38,39,38,36],arp:[0,1,2,1,0,2,1,2]},     // Dm Eb Dm Cm
 // ── 챕터 2 고유곡: style로 전용 연주 방식 사용 ──
 {n:"독버섯 늪",style:"swamp",bpm:84,prog:[[52,55,59],[53,57,60],[52,55,59],[50,53,57]],bass:[40,41,40,38],arp:[0,2,1,0,2,1,2,0],   // Em F Em Dm (프리지안): 어둡고 축축하게
  lead:[[4,64,6],[12,65,4],[20,64,8],[34,67,3],[38,65,3],[44,64,6],[52,63,4],[58,64,6]]},
 {n:"태엽 성채",style:"clock",bpm:128,prog:[[50,54,57],[48,52,55],[55,59,62],[50,54,57]],bass:[38,36,43,38],arp:[0,1,2,1,0,1,2,1],   // D C G D (믹솔리디안): 딱딱하고 경쾌하게
  lead:[[0,74,1],[2,78,1],[4,81,1],[6,78,1],[8,79,2],[10,81,1],[12,83,2],[16,81,1],[18,79,1],[20,78,1],[22,76,1],[24,74,2],[28,72,2],[32,74,1],[34,78,1],[36,81,1],[38,86,1],[40,84,2],[42,83,1],[44,81,2],[48,79,1],[50,81,1],[52,79,1],[54,78,1],[56,76,2],[60,74,3]]},
 {n:"별의 심연",style:"cosmos",bpm:108,prog:[[46,50,53],[48,52,55],[45,48,52],[43,46,50]],bass:[34,36,33,31],arp:[0,2,1,2,0,2,1,2],   // Bb C Am Gm (리디안): 신비롭지만 앞으로 나아가는 느낌
  lead:[[0,77,3],[4,81,2],[6,82,2],[8,84,4],[14,82,2],[16,81,3],[20,77,2],[22,76,2],[24,74,6],[32,77,3],[36,81,2],[38,82,2],[40,86,4],[46,84,2],[48,82,3],[52,81,2],[54,79,2],[56,77,6]]}
];
/* 신나는 곡: 8분음표 베이스 · 4박 킥 · 오프비트 하이햇 · 리드 멜로디 [16분음표 위치, MIDI, 길이] (4마디 반복) */
const UPSONG=[
 {n:"질주",bpm:132,drive:1,prog:[[52,55,59],[48,52,55],[50,54,57],[47,50,54]],bass:[40,36,38,35],arp:[0,1,2,1,0,2,1,2],
  lead:[[0,76,2],[2,79,2],[4,83,3],[8,81,2],[10,79,2],[12,76,4],[16,76,2],[18,79,2],[20,84,3],[24,83,2],[26,81,2],[28,79,4],[32,78,2],[34,81,2],[36,86,3],[40,84,2],[42,83,2],[44,81,4],[48,79,2],[50,78,2],[52,76,2],[54,78,2],[56,79,4],[60,83,4]]},
 {n:"불꽃 행진",bpm:140,drive:1,prog:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],bass:[45,41,36,43],arp:[0,2,1,2,0,1,2,1],
  lead:[[0,69,1],[1,72,1],[2,76,2],[4,74,2],[6,72,2],[8,76,3],[12,79,4],[16,77,2],[18,76,2],[20,72,2],[22,69,2],[24,72,4],[28,74,4],[32,72,2],[34,76,2],[36,79,3],[40,81,2],[42,79,2],[44,76,4],[48,74,2],[50,72,2],[52,71,2],[54,74,2],[56,76,6]]},
 {n:"돌격",bpm:126,drive:1,prog:[[55,58,62],[51,55,58],[58,62,65],[53,57,60]],bass:[43,39,46,41],arp:[0,1,2,1,2,1,0,1],
  lead:[[0,79,2],[2,77,2],[4,74,4],[8,74,2],[10,77,2],[12,79,2],[14,82,2],[16,79,3],[19,75,1],[20,74,4],[24,70,2],[26,74,2],[28,75,4],[32,77,2],[34,74,2],[36,70,4],[40,74,2],[42,77,2],[44,82,4],[48,81,2],[50,77,2],[52,72,4],[56,77,2],[58,81,2],[60,84,4]]}
];
/* 최종 보스 스텔라 전용 (D 단조, 빠르고 웅장하게) */
const STELLA_SONG={n:"별의 아이",style:"stella",bpm:150,prog:[[50,53,57],[46,50,53],[48,52,55],[45,49,52]],bass:[38,34,36,33],arp:[0,1,2,1,0,2,1,2],
 lead:[[0,74,2],[2,77,2],[4,81,4],[8,79,2],[10,77,2],[12,76,4],[16,74,2],[18,77,2],[20,82,4],[24,81,2],[26,79,2],[28,77,4],[32,76,2],[34,79,2],[36,84,4],[40,82,2],[42,81,2],[44,79,4],[48,81,2],[50,77,2],[52,73,4],[56,76,4],[60,81,4]]};
for(const u of UPSONG.concat(SONG.filter(s=>s.lead),[STELLA_SONG])){u.L=new Array(64).fill(null);for(const[st,n,l]of u.lead)u.L[st]=[n,l]}
let seqT=0,seqStep=0,inten=0,bossOn=false,song=SONG[0],songEnd=150,songPend=false;
/* 곡 고르기: 설정(랜덤 / 스테이지 곡 / 신나는 곡)에 따라, 직전 곡은 피해서 무작위 */
function pickSong(){
 if(runSt&&runSt.duel&&elapsed>0){song=STELLA_SONG;BPM=song.bpm;STEP=60/BPM/4;return}   // 스텔라 결투 중엔 전용곡 고정
 const st=SONG[selSt]||SONG[0],pool=S.bgm==="stage"||(st.style&&S.bgm!=="up")?[st]:S.bgm==="up"?UPSONG:[st].concat(UPSONG);   // 챕터 2는 스테이지 고유곡
 let c=pool[Math.floor(Math.random()*pool.length)];if(pool.length>1&&c===song)c=pool[(pool.indexOf(c)+1)%pool.length];
 song=c;BPM=c.bpm;STEP=60/BPM/4;
}
function musicReset(){seqStep=0;seqT=0;inten=0;pickSong();songEnd=150;songPend=false}
function mv(f,t,d,type,v,atk,cut,rel){ // 음악용 음 (음악 버스, 필터 컷오프 지정)
 const a=AC;if(liveN(MEND,a.currentTime)>MUS_MAX)return;
 const o=a.createOscillator(),fl=a.createBiquadFilter(),g=a.createGain();
 o.type=type;o.frequency.value=f;fl.type="lowpass";fl.frequency.value=cut;fl.Q.value=.8;
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+atk);g.gain.setValueAtTime(v,t+Math.max(atk,d-(rel||.1)));g.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.connect(fl);fl.connect(g);g.connect(musBus);o.start(t);o.stop(t+d+.05);MEND.push(t+d+.05);
}
function kickDrum(t,v){const a=AC,o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.22);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g);g.connect(musBus);o.start(t);o.stop(t+.32)}
function playStep(i,t){
 const sg=song,bar=Math.floor(i/16)%4,s=i%16,ch=sg.prog[bar];
 if(sg.drive){playDrive(sg,i,t,bar,s,ch);return}
 if(sg.style){MSTY[sg.style](sg,i,t,bar,s,ch);return}
 const L=inten;
 if(s===0){ // 패드: 디튠한 톱니파 두 겹, 강도가 오를수록 필터가 열림
  const cut=700+L*1600;
  for(const n of ch){mv(mtof(n),t,STEP*16+.3,"sawtooth",.0042,.5,cut,.6);mv(mtof(n)*1.006,t,STEP*16+.3,"sawtooth",.0036,.5,cut,.6)}
  mv(mtof(ch[0]-12),t,STEP*16,"sine",.012,.3,600,.4);
 }
 if(L>.12&&(s===0||s===6||s===8||s===14||(L>.55&&(s===3||s===11)))){ // 베이스
  const n=sg.bass[bar]+(s===8||s===11?7:0);mv(mtof(n),t,STEP*1.8,"triangle",.03,.005,900,.08);mv(mtof(n-12),t,STEP*1.8,"sine",.02,.005,300,.08);
 }
 if(L>.3&&s%2===0){ // 아르페지오 (플럭)
  const n=ch[sg.arp[(s/2)|0]]+(L>.7&&s%4===2?24:12);mv(mtof(n),t,STEP*1.6,"square",.006,.002,1400+L*2000,.12);
 }
 if(L>.2&&(s===0||s===8||(L>.7&&s===10)))kickDrum(t,.12+L*.06);                               // 킥
 if(L>.45&&(s===4||s===12)){noise(t,.16,.05,2400,"bandpass",1200,musBus);mv(190,t,.08,"triangle",.012,.002,1500,.05)}  // 스네어
 if(L>.25&&(L>.75||s%2===0))noise(t,.035,s%4===2?.014:.009,9000,"highpass",7000,musBus);   // 하이햇
 if(bossOn&&s%8===0)mv(mtof(ch[0]-23),t,STEP*8,"sawtooth",.01,.2,500,.3);                // 보스: 불협 저음 드론
}
/* 음정이 미끄러지는 음 (물방울 · 개구리 · 테레민) */
function mg(f,f2,t,d,type,v,cut){const a=AC;if(liveN(MEND,a.currentTime)>MUS_MAX)return;const o=a.createOscillator(),fl=a.createBiquadFilter(),g=a.createGain();
 o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);fl.type="lowpass";fl.frequency.value=cut;
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+Math.min(.04,d*.2));g.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.connect(fl);fl.connect(g);g.connect(musBus);o.start(t);o.stop(t+d+.05);MEND.push(t+d+.05)}
const MSTY={
 /* 독버섯 늪: 웅웅거리는 어두운 패드 · 심장 박동 같은 킥 · 물방울 · 거품 · 개구리 울음 · 흐느끼는 리드 */
 swamp(sg,i,t,bar,s,ch){const L=inten;
  if(s===0){const cut=380+L*700;for(const n of ch){mv(mtof(n),t,STEP*16+.8,"sawtooth",.0034,1.4,cut,1.1);mv(mtof(n)*.992,t,STEP*16+.8,"sawtooth",.003,1.4,cut,1.1)}mv(mtof(ch[0]-24),t,STEP*16+.5,"sine",.022,1,180,.9)}
  if(s===0||s===3||(L>.45&&(s===8||s===11)))kickDrum(t,.07+L*.06);
  if(L>.12&&(s===0||s===10))mv(mtof(sg.bass[bar]),t,STEP*5,"triangle",.026,.03,480,.35);
  if((s===5||s===13||(L>.3&&s===9))&&Math.random()<.7){const f=1400+Math.random()*900;mg(f,f*.45,t+Math.random()*STEP,.12,"sine",.009,4000)}   // 물방울
  if(L>.2&&s%4===2&&Math.random()<.55)noise(t,.08,.022,520,"lowpass",110,musBus);                                                         // 거품
  if(bar===3&&s===12&&Math.random()<.7)mg(150,85,t,.32,"square",.006,700);                                                                   // 개구리
  const ld=sg.L[i%64];if(ld&&L>.2){const f=mtof(ld[0]);mg(f*1.02,f,t,STEP*ld[1],"sine",.008,1600);mv(f*.5,t,STEP*ld[1],"triangle",.003,.2,900,.3)}
  if(bossOn&&s%8===0)mv(mtof(ch[0]-23),t,STEP*8,"sawtooth",.01,.2,500,.3)},
 /* 태엽 성채: 째깍째깍 · 쇳소리 · 스타카토 베이스 · 래칫 · 장난감 로봇 같은 멜로디 */
 clock(sg,i,t,bar,s,ch){const L=Math.max(inten,.3);
  if(s===0)for(const n of ch)mv(mtof(n),t,STEP*16,"square",.0016,.04,800+L*800,.3);
  noise(t,.016,s%4===0?.028:.014,s%2?5400:3600,"bandpass",s%2?5000:3300,musBus);                                                          // 째깍
  if(s===0||s===8||(L>.6&&s===10))kickDrum(t,.15);
  if(s===4||s===12){mv(1180,t,.09,"square",.0055,.001,4200,.06);mv(1717,t,.07,"sine",.008,.001,6000,.05);noise(t,.05,.026,6000,"highpass",3000,musBus)}   // 쇳소리
  if(s%2===0){const n=sg.bass[bar]+(s%8===4?12:0)+(s===14?7:0);mv(mtof(n),t,STEP*.85,"square",.013,.002,560+L*600,.03);mv(mtof(n-12),t,STEP*.85,"sine",.018,.002,240,.03)}
  if(s===15&&bar===3)for(let k=0;k<6;k++)noise(t+k*STEP/6,.012,.024,4000,"bandpass",3000,musBus);                                          // 래칫
  const ld=sg.L[i%64];if(ld){const f=mtof(ld[0]);mv(f,t,STEP*ld[1]*.6,"square",.0055,.002,3200,.04);mv(f*2,t,STEP*ld[1]*.4,"triangle",.0035,.002,5000,.04)}
  if(L>.5&&bar===1&&s===8)noise(t,.4,.018,7000,"highpass",9000,musBus);                                                                      // 증기
  if(bossOn&&s%8===0)mv(mtof(ch[0]-23),t,STEP*8,"sawtooth",.01,.2,500,.3)},
 /* 별의 심연: 반짝이는 메아리 아르페지오 · 테레민 같은 미끄러지는 리드 · 별 반짝임 · 아득한 저음 */
 cosmos(sg,i,t,bar,s,ch){const L=Math.max(inten,.2);
  // 패드: 예전보다 빨리 차오르게 (늘어지는 느낌 줄이기)
  if(s===0){for(const n of ch){mv(mtof(n),t,STEP*16+.8,"sine",.0075,.6,2400,.9);mv(mtof(n+12)*1.004,t,STEP*16+.8,"triangle",.0026,.8,3400,.9)}mv(mtof(ch[0]-12),t,STEP*16,"sine",.011,.5,380,.8)}
  // 16분 아르페지오 + 짧은 메아리 (반짝이며 굴러가는 느낌)
  {const n=ch[sg.arp[(s>>1)%8]]+24+(s%4===3?12:0)+(s%8===6?7:0),f=mtof(n);mv(f,t,STEP*.9,"triangle",.0042,.002,5600,.08);if(s%2===0)mv(f*2,t+STEP*1.5,STEP*.8,"sine",.0014,.002,6000,.08)}
  // 8분 베이스 펄스 (처음부터 박을 잡아 줌)
  if(s%2===0){const n=sg.bass[bar]+(s===6||s===14?12:0);mv(mtof(n),t,STEP*1.5,"triangle",.017,.003,600+L*500,.05);mv(mtof(n-12),t,STEP*1.5,"sine",.016,.003,240,.05)}
  // 부드러운 킥 · 셰이커 · 클랩 (강도가 오르면 추가)
  if(s===0||s===8||(L>.5&&s===10))kickDrum(t,.08+L*.06);
  if(s%2===1)noise(t,.03,s%4===3?.011:.007,9500,"highpass",7500,musBus);
  if(L>.45&&(s===4||s===12))noise(t,.12,.04,2600,"bandpass",1300,musBus);
  if(Math.random()<.14+L*.12)mv(mtof(84+[0,2,4,6,7,9,11][Math.random()*7|0]+(Math.random()<.5?12:0)),t+Math.random()*STEP,.24,"sine",.003,.002,8000,.2);   // 별 반짝임
  // 리드: 테레민처럼 살짝 미끄러져 들어가되, 음표가 촘촘해 앞으로 나아감
  const ld=sg.L[i%64];if(ld){const f=mtof(ld[0]);mg(f*.97,f,t,STEP*ld[1]*.95,"sine",.009,2800);mv(f*2,t,STEP*ld[1]*.6,"triangle",.0022,.004,5000,.1)}
  if(bar===3&&s===12)noise(t,.6,.016,300,"bandpass",4000,musBus);                                                       // 마디 끝 우주 바람 (짧게)
  if(bossOn&&s%8===0)mv(mtof(ch[0]-23),t,STEP*8,"sawtooth",.01,.2,500,.3)},
 /* 스텔라 결투: 합창 같은 패드 · 펌핑 베이스 · 4박 킥 · 16분 아르페지오 · 영웅적인 단조 리드 */
 stella(sg,i,t,bar,s,ch){
  if(s===0)for(const n of ch){mv(mtof(n+12),t,STEP*16,"sine",.0075,.4,3000,.5);mv(mtof(n),t,STEP*16,"sawtooth",.003,.25,1600,.5)}
  if(s%2===0){const n=sg.bass[bar]+(s%4===2?12:0);mv(mtof(n),t,STEP*1.6,"sawtooth",.02,.003,900,.05);mv(mtof(n-12),t,STEP*1.6,"sine",.024,.003,250,.05)}
  if(s%4===0)kickDrum(t,.18);
  if(s===4||s===12){noise(t,.15,.06,2500,"bandpass",1200,musBus);mv(190,t,.08,"triangle",.012,.002,1500,.05)}
  noise(t,.03,s%2?.007:.012,9000,"highpass",7000,musBus);
  {const n=ch[sg.arp[(s>>1)%8]]+24+(s%2?12:0);mv(mtof(n),t,STEP*.9,"triangle",.0045,.002,5000,.05)}
  const ld=sg.L[i%64];if(ld){const f=mtof(ld[0]);mv(f,t,STEP*ld[1]*.95,"square",.007,.006,2800,.05);mv(f*1.005,t,STEP*ld[1]*.95,"sawtooth",.0035,.006,2000,.05)}}
};
/* 신나는 곡: 처음부터 킥·베이스·멜로디가 나오고, 강도가 오르면 아르페지오·클랩·16비트 하이햇이 더해짐 */
function playDrive(sg,i,t,bar,s,ch){
 const L=Math.max(inten,.35);
 if(s===0){const cut=900+L*1400;for(const n of ch)mv(mtof(n),t,STEP*16+.2,"sawtooth",.0028,.3,cut,.5)}
 if(s%2===0){const n=sg.bass[bar]+(s%4===2?12:0);mv(mtof(n),t,STEP*1.7,"sawtooth",.018,.004,700+L*500,.05);mv(mtof(n-12),t,STEP*1.7,"sine",.022,.004,250,.05)}  // 옥타브 펌핑 베이스
 if(s%4===0)kickDrum(t,.15+L*.04);                                                             // 4박 킥
 if(s===4||s===12){noise(t,.14,.06,2600,"bandpass",1100,musBus);noise(t+.012,.1,.03,3200,"bandpass",1500,musBus)}  // 클랩
 if(s%4===2)noise(t,.07,.018,8000,"highpass",6000,musBus);                                     // 오프비트 오픈햇
 else if(L>.6)noise(t,.03,.008,9500,"highpass",7500,musBus);
 const ld=sg.L[i%64];if(ld){const f=mtof(ld[0]);mv(f,t,STEP*ld[1]*.95,"square",.0075,.006,2400+L*1400,.05);mv(f*1.004,t,STEP*ld[1]*.95,"sawtooth",.0035,.006,1800,.05)}   // 리드 멜로디
 if(L>.55&&s%2===1){const n=ch[sg.arp[((s-1)/2)|0]]+24;mv(mtof(n),t,STEP*1.2,"triangle",.005,.002,3000,.06)}
 if(bossOn&&s%8===0)mv(mtof(ch[0]-23),t,STEP*8,"sawtooth",.01,.2,500,.3);
}
setInterval(()=>{
 if(!running||paused||muted||!AC||AC.state!=="running"){seqT=0;return}
 bossOn=false;for(let i=0;i<enemies.length;i++)if(enemies[i].type==="boss"){bossOn=true;break}
 const target=Math.min(1,enemies.length/260+(bossOn?.35:0)+elapsed/1200);inten+=(target-inten)*.03;
 if(elapsed>=songEnd&&S.bgm!=="stage")songPend=true;                         // 2분 30초마다 다른 곡으로 (4마디 경계에서 전환)
 const now=AC.currentTime;if(seqT<now)seqT=now+.05;
 try{while(seqT<now+.32){                                                    // 0.32초 앞까지 미리 예약 → 프레임이 잠깐 끊겨도 음악은 계속
  if(songPend&&seqStep%64===0){songPend=false;songEnd=elapsed+150;pickSong();toast("♪ "+song.n)}
  playStep(seqStep,seqT);seqT+=STEP;seqStep++}}catch(e){}
},50);

/* ── 바닥 자국 (그을음 / 서리 / 독 웅덩이 / 피) — 개수 제한, 오래된 것부터 교체 ── */
const decals=[];
function addDecal(t,x,y,r,c){
 if(Q.dec<=0)return;
 if(decals.length>=Q.dec)decals.shift();
 decals.push({t,x,y,r,c:c||"#000",rot:Math.random()*6.283,life:t==="splat"?7:9,max:t==="splat"?7:9});
}
function updateDecals(dt){for(const d of decals)d.life-=dt;cull(decals,alive)}
/* ── 처치 / 피해 / 종료 ── */
function addGem(x,y,t,val){
 if(gems.length>=GEM_CAP){ // 보석이 너무 많으면 기존 보석에 경험치를 합침 (총 경험치 보존)
  const g=gems[gemMix++%gems.length];g.val+=val;if(g.t<4){g.t=4;g.r=GR[4]}return;
 }
 const a=Math.random()*6.283,sp=rand(40,110);
 gems.push({x,y,r:GR[t],t,val,pulled:false,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp});
}
function deathFx(e,quiet){
 const boss=e.type==="boss",n=quiet?1:e.elite?(boss?30:18):5;
 for(let i=0;i<n;i++){const a=Math.random()*6.283,sp=rand(100,e.elite?360:240);spawnP(e.x,e.y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.25,.55),rand(1.6,e.elite?3.4:2.6),i%3?e.color:"#ffffff",1,5,0)}
 if(quiet)return;
 addDecal("splat",e.x,e.y,e.r*(e.elite?1.8:1.25),e.color);
 vfx({type:"ring",x:e.x,y:e.y,r0:e.r*.5,r1:e.r*2.2,life:.2,max:.2,c:"rgba(255,255,255,.85)",w:3});
 if(e.elite){
  vfx({type:"core",x:e.x,y:e.y,r:e.r*2.2,life:.25,max:.25,c:"#fff6d8"});vfx({type:"light",x:e.x,y:e.y,r:e.r*12,life:.5,max:.5,c:boss?"#ff5ab0":"#ffc050"});
  vfx({type:"ring",x:e.x,y:e.y,r0:e.r,r1:e.r*(boss?7:4.5),life:.45,max:.45,c:boss?"rgba(255,80,170,.9)":"rgba(255,190,70,.9)",w:6});
  shake=Math.max(shake,boss?14:8);kickR(boss?10:5);bombFlash=Math.max(bombFlash,boss?.4:.15);
  stinger("bigkill");
  if(boss&&!e.final){slowT=.35;timeScale=.35}else stopHit(boss?.12:.07);
 }
}
/* ── 타격 이펙트 (무기별 시각 언어) ──
   s: 스파크(진행 방향으로 튀는 줄무늬) · e: 불씨(위로 떠오름) · b: 거품 · d: 흩날리는 점 */
const IMP={
 orb:{c:"#c9a8ff",c2:"#f3ecff",n:3,s:"s",ring:"rgba(200,170,255,.8)"},
 knife:{c:"#e9f2ff",c2:"#8fc4ff",n:3,s:"s"},
 crystal:{c:"#bff3ff",c2:"#ffffff",n:4,s:"s",ring:"rgba(190,240,255,.8)"},
 star:{c:"#fff1a6",c2:"#ffd36a",n:4,s:"s",ring:"rgba(255,230,140,.9)"},
 arcane:{c:"#e6a0ff",c2:"#ffffff",n:4,s:"s",ring:"rgba(230,160,255,.9)"},
 boomerang:{c:"#cfe8ff",c2:"#ffffff",n:3,s:"s"},
 crescent:{c:"#ffe9a0",c2:"#ffffff",n:4,s:"s",ring:"rgba(255,233,160,.8)"},
 boom:{c:"#ffb070",c2:"#ffe0a0",n:2,s:"s"},
 flame:{c:"#ff8a3c",c2:"#ffd06a",n:3,s:"e"},
 inferno:{c:"#ff6a2a",c2:"#ffe07a",n:4,s:"e"},
 bolt:{c:"#bdeaff",c2:"#ffffff",n:4,s:"s"},
 glacier:{c:"#bff3ff",c2:"#ffffff",n:3,s:"s"},
 plague:{c:"#a8f08a",c2:"#6fd04a",n:2,s:"b"},
 slash:{c:"#ffffff",c2:"#b9c8ff",n:3,s:"s"},
 spear:{c:"#fff2b0",c2:"#ffd36a",n:3,s:"s"},
 blood:{c:"#ff6b88",c2:"#ff2a4a",n:4,s:"s"},
 shk:{c:"#dfe8ff",c2:"#ffffff",n:3,s:"s"},
 shadow:{c:"#c9a8ff",c2:"#5a3a9a",n:3,s:"s"},
 scythe:{c:"#ff6a8a",c2:"#ffffff",n:3,s:"s"},
 reaper:{c:"#ff2a5a",c2:"#ffd0da",n:4,s:"s",ring:"rgba(255,60,100,.8)"},
 icelance:{c:"#dff8ff",c2:"#9fe8ff",n:4,s:"s",ring:"rgba(200,245,255,.8)"},
 abszero:{c:"#ffffff",c2:"#9fe8ff",n:4,s:"s",ring:"rgba(220,250,255,.9)"},
 shard:{c:"#bff3ff",c2:"#ffffff",n:2,s:"s"},
 tesla:{c:"#fff27a",c2:"#ffffff",n:2,s:"s"},
 plasma:{c:"#c8b0ff",c2:"#fff27a",n:3,s:"s"},
 flamer:{c:"#ff7a2a",c2:"#ffd06a",n:1,s:"e"},
 phoenix:{c:"#ffb040",c2:"#fff0a0",n:2,s:"e"},
 beam:{c:"#fff6c0",c2:"#ffd36a",n:2,s:"s"},
 prism:{c:"#ffb0ff",c2:"#a0f0ff",n:2,s:"s"},
 quake:{c:"#d8c0a0",c2:"#8a7058",n:3,s:"d"},
 titan:{c:"#e8d0a8",c2:"#8a7058",n:4,s:"d"},
 sigil:{c:"#c46aff",c2:"#f0d8ff",n:3,s:"b"},
 doom:{c:"#d890ff",c2:"#ffe58a",n:4,s:"b"},
 revolver:{c:"#ffe08a",c2:"#ffffff",n:3,s:"s",ring:"rgba(255,220,140,.8)"},
 gravorb:{c:"#a090ff",c2:"#ffffff",n:2,s:"d"},horizon:{c:"#d890ff",c2:"#ffffff",n:3,s:"d"},
 chainblade:{c:"#ff8aa0",c2:"#ffffff",n:3,s:"s"},hellchain:{c:"#ff4a6a",c2:"#ffd0da",n:4,s:"s"},
 radcore:{c:"#c8ff5a",c2:"#ffb040",n:2,s:"b"},meltdown:{c:"#c8ff5a",c2:"#ffe14a",n:3,s:"b"},
 railgun:{c:"#bff6ff",c2:"#ffffff",n:4,s:"s"},orbital:{c:"#8fe8ff",c2:"#ffffff",n:4,s:"s"}
};
function impact(x,y,kind,ax,ay){
 if(impBudget<=0)return;impBudget--;           // 프레임당 예산: 대량 타격 시 이펙트 폭증 방지
 const m=IMP[kind]||IMP.slash,base=(ax||ay)?Math.atan2(ay,ax):Math.random()*6.283;
 for(let i=0;i<m.n;i++){
  const c=i&1?m.c2:m.c;
  if(m.s==="s"){const a=base+rand(-.9,.9),sp=rand(160,320);spawnP(x,y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.12,.26),rand(1.2,2.2),c,1,8,0)}
  else if(m.s==="e")spawnP(x+rand(-5,5),y+rand(-5,5),rand(-40,40),rand(-120,-40),rand(.3,.55),rand(1.4,2.4),c,0,2,-60);
  else if(m.s==="b")spawnP(x+rand(-8,8),y+rand(-6,6),rand(-15,15),rand(-50,-20),rand(.4,.7),rand(1.5,3),c,2,1,0);
  else{const a=Math.random()*6.283,sp=rand(60,150);spawnP(x,y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.2,.4),rand(1.2,2),c,0,5,0)}
 }
 if(m.ring)vfx({type:"ring",x,y,r0:4,r1:16,life:.14,max:.14,c:m.ring,w:2});
}
/* ── 업데이트 ── */
function pickups(){
 let magnet=false;const pr=player.r;
 // 회복/자석 드롭은 60초 뒤 사라지고, 50개가 넘으면 오래된 것부터 정리 (후반 누적 방지)
 // 버그 수정: 예전에는 폭탄·상자까지 개수에 포함돼, 폭탄이 50개 넘게 쌓이면 새 회복/자석이 생기자마자 지워졌음
 // → 회복·자석끼리만 세어 오래된 것부터 정리, 폭탄은 따로 90초 뒤 소멸
 let hm=0;for(const d of drops){if(d.t0===undefined)d.t0=elapsed;if(!d.dead&&(d.type==="heal"||d.type==="magnet"))hm++}
 for(const d of drops){if(d.dead)continue;
  if(d.type==="heal"||d.type==="magnet"){if(elapsed-d.t0>60||hm>40){d.dead=true;hm--}}
  else if(d.type==="bomb"&&elapsed-d.t0>90)d.dead=true}
 for(const d of drops){
  if(d.dead)continue;const q=d2(player,d);
  if(d.type==="chest"){if(q<(pr+24)**2){d.dead=true;chestQueue.push(1);sfx("chest");
   for(let i=0;i<16;i++){const a=Math.random()*6.283,sp=rand(100,260);spawnP(d.x,d.y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.3,.6),rand(1.5,2.6),i&1?"#ffd35a":"#fff",1,4,0)}}}
  else if(d.type==="bomb"){if(q<(pr+20)**2){d.dead=true;detonateAll(d.x,d.y)}}
  else if(q<(pr+14)**2){
   d.dead=true;
   if(d.type==="magnet"){magnet=true;sfx("magnet");toast("🧲 자석! 맵 전체의 경험치가 끌려옵니다.");vfx({type:"ring",x:player.x,y:player.y,r0:20,r1:420,life:.6,max:.6,c:"rgba(100,220,255,.8)",w:5})}
   else{player.hp=Math.min(player.maxHp,player.hp+35);sfx("heal");toast("❤️ 회복 +35");addNum(player.x,player.y-40,"+35","#7dff9a",true);
    vfx({type:"ring",x:player.x,y:player.y,r0:10,r1:60,life:.35,max:.35,c:"rgba(110,255,150,.9)",w:4});
    for(let i=0;i<10;i++)spawnP(player.x+rand(-14,14),player.y+rand(-6,14),rand(-15,15),rand(-110,-50),rand(.4,.7),rand(1.5,2.5),"#8dffb0",0,1,0)}
  }
 }
 if(magnet)for(const g of gems)g.pulled=true;
 cull(drops,notDead);
}
function pickFx(g){
 pickCombo=pickT>0?Math.min(pickCombo+1,15):0;pickT=.4;
 if(AC&&AC.currentTime-pickTn>.045){pickTn=AC.currentTime;tone(880*Math.pow(2,pickCombo/12),.05,"sine",.012)}    // 연속 획득 시 음이 반음씩 올라감
 if(impBudget>0){impBudget--;spawnP(player.x+rand(-8,8),player.y+rand(-10,4),rand(-30,30),rand(-90,-40),.35,1.6,GC[g.t][1],0,3,0)}
}
function updateParticles(dt){
 for(let i=pN-1;i>=0;i--){
  const p=PART[i];p.life-=dt;
  if(p.life<=0){pN--;PART[i]=PART[pN];PART[pN]=p;continue}
  if(p.drag){const f=Math.exp(-p.drag*dt);p.vx*=f;p.vy*=f}
  p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
 }
}
function updateNums(dt){
 for(let i=nN-1;i>=0;i--){
  const n=NUM[i];n.life-=dt;
  if(n.life<=0){nN--;NUM[i]=NUM[nN];NUM[nN]=n;continue}
  n.y+=n.vy*dt;n.vy*=Math.exp(-dt*4);
 }
}
/* 지속 효과: 낙뢰 잔류 피해, 독구름, 보스 내려찍기 */
function updateEffects(dt){
 lavaN=0;
 for(let n=0;n<effects.length;n++){
  const ef=effects[n];ef.life-=dt;
  if(ef.type==="bolt"){curW=ef.w||"";for(const e of query(ef.x,ef.y,55,QA))if(e.hp>0&&d2(e,ef)<3025)dmgTo(e,ef.damage*dt*5,true)}
  else if(ef.type==="cloud"){ // 장판 (독구름 / 불길): 지속 피해 (+독은 둔화), 0.5초마다 상태이상 부여
   const tick=(ef.tk-=dt)<=0;if(tick)ef.tk=.5;curW=ef.w||"";
   for(const e of query(ef.x,ef.y,ef.radius,QA)){const rr=ef.radius+e.r;if(e.hp>0&&d2(e,ef)<rr*rr){dmgTo(e,ef.dps*dt,true);if(!ef.fire)e.slowT=Math.max(e.slowT||0,.3);if(tick&&ef.dm)applyStatus(e,ef.st||"poison",ef.dm)}}
  }
  else if(ef.type==="spore"){const rr=ef.r+player.r*.5;if(d2(player,ef)<rr*rr)runSt.pslow=Math.min(runSt.pslow||1,.65)}
  else if(ef.type==="lava"){ // 적이 남긴 용암: 플레이어에게만 피해
   if(ef.life>0)lavaN++;
   const rr=ef.r+player.r*.6;if(player.dashT<=0&&d2(player,ef)<rr*rr)hurt(ef.dmg*dt);
  }
  else if(ef.type==="slam"&&ef.life<=0&&!ef.done){
   ef.done=true;vfx({type:"eboom",x:ef.x,y:ef.y,r:ef.r,life:.35,max:.35});vfx({type:"light",x:ef.x,y:ef.y,r:ef.r*2.5,life:.35,max:.35,c:"#ff4a5a"});addDecal("scorch",ef.x,ef.y,ef.r*.6);shake=Math.max(shake,9);kickR(6);sfx("boom");
   for(let i=0;i<12;i++){const a=Math.random()*6.283,sp=rand(150,340);spawnP(ef.x,ef.y,Math.cos(a)*sp,Math.sin(a)*sp,rand(.25,.5),rand(2,3.5),i&1?"#ff5a6a":"#ffc0b0",1,6,0)}
   if(dist(player,ef)<ef.r+player.r)hurt(ef.dmg);
  }
 }
}
/* 경험치 보석: 드롭 시 튀어나왔다가 흡수 */
const GEM_MV=[0,3,9,30,1e9];   // 합쳐진 경험치량에 따른 보석 등급
let gemMergeT=0;const GEMCELL=new Map();
function mergeGems(){
 GEMCELL.clear();
 for(let i=gems.length-1;i>=0;i--){const g=gems[i];if(g.pulled||g.vx||g.vy)continue;
  const k=((g.x/48)|0)*100003+((g.y/48)|0),h=GEMCELL.get(k);
  if(!h){GEMCELL.set(k,g);continue}
  h.val+=g.val;let t=h.t;while(t<4&&h.val>GEM_MV[t+1])t++;if(t>h.t){h.t=t;h.r=GR[t]}rm(gems,i)}
}
function updateGems(dt){
 if(gems.length>120){gemMergeT-=dt;if(gemMergeT<=0){gemMergeT=.5;mergeGems()}}
 const pr=pickupRange(),pr2=pr*pr;
 for(let i=gems.length-1;i>=0;i--){
  const g=gems[i];
  if(g.vx||g.vy){g.x+=g.vx*dt;g.y+=g.vy*dt;const f=Math.exp(-dt*7);g.vx*=f;g.vy*=f;if(Math.abs(g.vx)+Math.abs(g.vy)<4)g.vx=g.vy=0}
  const q=d2(player,g),dd=Math.sqrt(q);
  if(g.pulled||q<pr2){const sp=g.pulled?950:430,step=Math.min(dd,sp*dt),L=dd||1;g.x+=(player.x-g.x)/L*step;g.y+=(player.y-g.y)/L*step}
  if(q<(player.r+g.r+2)**2){rm(gems,i);gainXP(g.val);pickFx(g)}
 }
}
