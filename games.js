/* Motion Quest: Space Snakes & Ladders, Space Tug-of-War, Memory Match, effects */
const rnd=n=>Math.floor(Math.random()*n);
let AC=null;
function beep(f,d,ty){if(DB.mute)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=ty||'square';o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.stop(AC.currentTime+d)}catch(e){}}
const sfx={ok:()=>{beep(660,.12);setTimeout(()=>beep(880,.18),110)},no:()=>beep(150,.3,'sawtooth'),roll:()=>beep(440,.06),win:()=>[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.22),i*140))};
function confetti(){for(let i=0;i<40;i++){const s=document.createElement('i');s.className='cf';s.textContent=['✦','★','●','▲'][i%4];s.style.cssText=`left:${Math.random()*100}vw;color:hsl(${rnd(360)},90%,65%);animation-duration:${1.8+Math.random()*1.6}s;animation-delay:${Math.random()*.5}s;font-size:${14+rnd(18)}px`;document.body.appendChild(s);setTimeout(()=>s.remove(),4200)}}
function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.remove('hide');t.style.animation='none';void t.offsetWidth;t.style.animation='';setTimeout(()=>t.classList.add('hide'),1500)}
const gw=ms=>{const g=GID;return new Promise(r=>setTimeout(()=>{if(g===GID)r()},ms))};
const nextQ=()=>S.pool[S.qi++%S.pool.length];
function holdOn(cb){S.state='hold';sm=[];prev=null;Z.forEach(z=>z.p=0);S.cb=cb}
function waveFor(label,cb){mkZ([label],[[0,0,1,1]],'wave');$('#ht').textContent='';holdOn(async()=>{S.state='busy';await cb()})}

/* ---- shared: question card popup, answered with the motion zones ---- */
function askQ(it,tag,done){
 const c=$('#card');c.innerHTML=`<div class="qcard"><div class="sub">${esc(tag)}</div>${it.p?`<div class="sub">${esc(it.p)}</div>`:''}<div class="qt">${esc(it.q)}</div></div>`;c.classList.remove('hide');
 mkZ(it.opts,LAY[it.opts.length]||LAY[2],'lock');S.left=A.read??4;S.state='read';
 S.cb=async k=>{S.state='busy';const ok=k===it.key;
  Z.forEach((z,i)=>{z.el.classList.remove('act');if(i===it.key)z.el.classList.add('ok');else if(i===k)z.el.classList.add('bad')});
  ok?sfx.ok():sfx.no();S.asked++;if(ok){S.ok++;S.sc[S.cur]++}hs();
  await gw(1300);c.classList.add('hide');done(ok)}}
function endBoard(w,line){
 confetti();sfx.win();const s=S,pct=s.asked?Math.round(s.ok/s.asked*100):0;
 (A.plays=A.plays||[]).unshift({d:Date.now(),pct,score:s.ok,total:s.asked,top:w,pts:s.ok,streak:0});A.plays.length=Math.min(A.plays.length,30);save();
 stop();$('#game').classList.add('hide');
 $('#end').innerHTML=`<div class="big">${w==='Draw'?'🤝 It’s a draw':'🏆 '+esc(w)+' wins!'}</div><p class="mut">${line}</p><p>${trophy(pct)} ${s.ok}/${s.asked} correct</p><p><button class="btn pri" onclick="lobby(useCam)">Play again</button> <button class="btn" onclick="menu()">Back to games</button></p>`;
 $('#end').classList.remove('hide')}
function startBoard(m){
 const T=S.T.length?S.T.slice(0,m==='tug'?2:4):['Team Mars','Team Venus'];
 Object.assign(S,{T,m,turn:0,asked:0,ok:0,qi:0,p:0,N:A.tugN||5,open:[],pos:T.map(()=>1),sc:Object.fromEntries(T.map(t=>[t,0])),pool:flat.slice().sort(()=>Math.random()-.5)});
 $('#hp').textContent='';hs();
 if(m==='memory')return memStart();
 $('#game').classList.add('bm');$('#board').classList.remove('hide');
 $('#board').innerHTML=(m==='snakes'?snHTML():tugHTML())+'<div id="card" class="hide"></div><div id="dice" class="dice hide"></div><div id="toast" class="toast hide"></div>';
 if(m==='snakes'){T.forEach((t,i)=>setTok(i,1));snTurn()}else{setRk();tgTurn()}}

/* ---- Space Snakes & Ladders (6x5 board, rockets up, meteors down) ---- */
const UP={3:12,8:18,15:26},DOWN={17:7,24:13,28:20},FACES=['⚀','⚁','⚂','⚃','⚄','⚅'];
const tp=n=>{const i=n-1,r=Math.floor(i/6),c=r%2?5-i%6:i%6;return[c*100+50,(4-r)*100+50]};
function snHTML(){
 let g='';for(let dr=0;dr<5;dr++){const r=4-dr;for(let c=0;c<6;c++){const n=r*6+(r%2?6-c:c+1);g+=`<div class="t ${(r+c)%2?'a':'b'} ${n===1?'start':n===30?'goal':''}">${n===30?'🪐':n===1?'🏁':n}</div>`}}
 const arc=(a,b,col,e1,e2)=>{const[x1,y1]=tp(a),[x2,y2]=tp(b),cx=(x1+x2)/2+60,cy=(y1+y2)/2-30,t=(x,y,e)=>`<text x="${x}" y="${y}" font-size="38" text-anchor="middle" dominant-baseline="central">${e}</text>`;
  return `<path d="M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 17"/>`+t(x1,y1,e1)+t(x2,y2,e2)};
 let s='';for(const a in UP)s+=arc(+a,UP[a],'#46e0ff','🚀','⭐');for(const a in DOWN)s+=arc(+a,DOWN[a],'#ff7a59','☄️','💥');
 return `<div class="sn"><div class="g">${g}</div><svg viewBox="0 0 600 500">${s}</svg>${S.T.map((t,i)=>`<div class="tok" id="tk${i}" style="--h:${i*75}deg;--ox:${(i%2)*26-13}px;--oy:${(i>>1)*20-6}px"><span>🚀</span><b style="background:hsl(${i*90+20},85%,60%)">${i+1}</b></div>`).join('')}</div>`}
const setTok=(i,n)=>{const[x,y]=tp(n),e=$('#tk'+i);if(e){e.style.left=x/6+'%';e.style.top=y/5+'%'}};
async function walk(t,a,b){const d=a<b?1:-1;for(let n=a;n!==b;){n+=d;setTok(t,n);beep(300+n*12,.07);await gw(240)}}
async function dice(n){const d=$('#dice');d.classList.remove('hide');d.classList.add('rolling');
 for(let i=0;i<8;i++){d.textContent=FACES[rnd(6)];sfx.roll();await gw(90)}
 d.classList.remove('rolling');d.textContent=FACES[n-1];d.classList.add('land');await gw(900);d.classList.remove('land');d.classList.add('hide')}
function snTurn(){
 const t=S.turn%S.T.length;S.cur=S.T[t];$('#hr').textContent='Space Snakes & Ladders';$('#hp').textContent=(t+1)+'. '+S.cur+'’s turn';
 waveFor('👋 Wave to roll the dice',async()=>{
  const n=1+rnd(6);await dice(n);const from=S.pos[t],to=Math.min(30,from+n);await walk(t,from,to);
  askQ(nextQ(),`Tile ${to} · ${S.cur}`,async ok=>{
   if(!ok){toast('Oops! Back to tile '+from);await walk(t,to,from);S.turn++;return snTurn()}
   if(to===30)return endBoard(S.cur,'Reached the planet!');
   const j=UP[to]||DOWN[to];
   if(j){toast(UP[to]?'🚀 Rocket boost!':'☄️ Meteor shower!');await gw(700);const e=$('#tk'+t);e.classList.add('fly');setTok(t,j);await gw(1000);e.classList.remove('fly')}
   S.pos[t]=j||to;S.turn++;snTurn()})})}

/* ---- Space Tug-of-War ---- */
const tugHTML=()=>`<div class="tug"><div class="tteam"><i>🪐</i>${esc(S.T[0])}</div><div class="track"></div><div id="rk" class="rkt">🛸</div><div class="tteam"><i>🌕</i>${esc(S.T[1])}</div></div>`;
const setRk=()=>{const e=$('#rk');if(e)e.style.left=(50+S.p/S.N*40)+'%'};
function tgTurn(){
 const t=S.turn%2;S.cur=S.T[t];$('#hr').textContent='Space Tug-of-War';$('#hp').textContent=S.cur+'’s pull';$('#ht').textContent='';
 askQ(nextQ(),S.cur+' pulls!',async ok=>{
  if(ok){S.p+=t?1:-1;setRk();toast('💪 Pull!')}
  await gw(900);
  if(Math.abs(S.p)>=S.N)return endBoard(S.p<0?S.T[0]:S.T[1],'Pulled the UFO all the way!');
  if(++S.turn>=40)return endBoard(S.p<0?S.T[0]:S.p>0?S.T[1]:'Draw','Time is up!');
  tgTurn()})}

/* ---- Memory Match (term = match pairs, flip cards by waving) ---- */
const pairs=()=>(A.pairs||'').split('\n').map(l=>l.split('=').map(x=>x.trim())).filter(a=>a.length>1&&a[0]&&a[1]).slice(0,6);
function memStart(){
 S.cards=pairs().flatMap((p,i)=>[{id:i,t:p[0]},{id:i,t:p[1]}]).sort(()=>Math.random()-.5);
 const n=S.cards.length,cols=n<=4?2:n<=6?3:4,rows=Math.ceil(n/cols);
 mkZ(S.cards.map(()=>'✦'),S.cards.map((c,i)=>[(i%cols)/cols,Math.floor(i/cols)/rows,1/cols,1/rows]),'tile');
 $('#hr').textContent='Memory Match';memTurn()}
function memTurn(){S.cur=S.T[S.turn%S.T.length];$('#hp').textContent=S.cur+'’s turn';hs();S.open=[];holdOn(flip)}
function face(z,t){z.el.firstChild.textContent=t;z.el.classList.remove('flip');void z.el.offsetWidth;if(t!=='✦')z.el.classList.add('flip')}
async function flip(k){
 const z=Z[k];z.rev=1;face(z,S.cards[k].t);sfx.roll();S.open.push(k);
 if(S.open.length<2)return holdOn(flip);
 S.state='busy';await gw(1200);const[a,b]=S.open,m=S.cards[a].id===S.cards[b].id;S.asked++;
 if(m){[a,b].forEach(i=>{Z[i].dead=1;Z[i].el.classList.add('ok')});S.sc[S.cur]++;S.ok++;sfx.ok()}
 else{[a,b].forEach(i=>{Z[i].rev=0;face(Z[i],'✦')});sfx.no();S.turn++}
 if(Z.every(q=>q.dead)){const mx=Math.max(...Object.values(S.sc)),w=S.T.filter(t=>S.sc[t]===mx);return endBoard(w.length>1?'Draw':w[0],'All pairs found!')}
 memTurn()}
