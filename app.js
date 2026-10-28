const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mc=(q,o,k)=>({type:'mc',q,opts:o,key:k}),tf=(q,k)=>({type:'tf',q,opts:['True','False'],key:k}),so=(p,c,r)=>({type:'sort',q:p,cats:c,rows:r.map(x=>({w:x[0],c:x[1]})),shuffle:true});
const sample=()=>({title:'Science Motion Quest',theme:'sunburst',time:15,hold:1.2,sens:4,read:4,rounds:[
 {name:'Round 1: Matter',items:[mc('Which state of matter has a definite volume but no definite shape?',['Solid','Liquid','Gas','Plasma'],1),tf('Water boils at 100 °C at sea level.',0)]},
 {name:'Round 2: Sort the rocks',items:[so('Rock type',['Igneous','Sedimentary','Metamorphic'],[['Granite',0],['Marble',2],['Basalt',0],['Limestone',1],['Slate',2],['Sandstone',1]])]}]});
const uid=()=>Math.random().toString(36).slice(2,9);
let DB={games:[],i:0};
try{const s=JSON.parse(localStorage.getItem('mq_db')||'null');if(s&&s.games&&s.games.length)DB=s;else{const o=JSON.parse(localStorage.getItem('mq_act')||'null');if(o&&o.rounds){o.id=uid();o.plays=[];DB.games.push(o)}}}catch(e){}
if(!DB.games.length){const g=sample();g.id=uid();g.plays=[];DB.games.push(g)}
let A=DB.games[Math.min(DB.i||0,DB.games.length-1)];
const save=()=>{try{localStorage.setItem('mq_db',JSON.stringify(DB))}catch(e){}};
function setA(o){o.id=A.id;o.plays=A.plays||[];DB.games[DB.games.indexOf(A)]=A=o;save()}
function theme(){const r=document.documentElement;A.theme&&A.theme!=='sunburst'?r.setAttribute('data-theme',A.theme):r.removeAttribute('data-theme')}
function tab(t){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));['play','edit','trophy','ppst'].forEach(x=>$('#'+x).classList.toggle('hide',x!==t));if(t==='edit')ed();if(t==='ppst')pp();if(t==='trophy')tr();if(t==='play')menu()}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{stop();tab(b.dataset.t)});
const cnt=g=>g.rounds.reduce((n,r)=>n+r.items.reduce((m,i)=>m+(i.type==='sort'?i.rows.length:1),0),0),count=()=>cnt(A);
/* ---------- EDITOR ---------- */
const sel=(v,list)=>list.map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('');
function ed(){
 let h=`<div class="card"><div class="row"><label class="f" style="flex:2;min-width:180px">Activity title<input type="text" value="${esc(A.title)}" oninput="A.title=this.value;save()"></label>
 <label class="f">Theme<select onchange="A.theme=this.value;theme();save()">${sel(A.theme,['sunburst','desert','dusk','chiffon','matcha','dark'])}</select></label>
 <label class="f">Seconds per item<input type="number" min="5" max="120" value="${A.time}" onchange="A.time=+this.value||15;save()"></label>
 <label class="f">Hold to answer (s)<input type="number" min="0.5" max="5" step="0.1" value="${A.hold}" onchange="A.hold=+this.value||1.2;save()"></label>
 <label class="f">Read time (s)<input type="number" min="0" max="30" value="${A.read??4}" onchange="A.read=Math.max(0,+this.value||0);save()"></label>
 <label class="f">Motion needed (% of zone)<input type="number" min="1" max="40" value="${A.sens}" onchange="A.sens=+this.value||6;save()"></label></div></div>`;
 A.rounds.forEach((r,ri)=>{
  h+=`<div class="card"><div class="row"><label class="f" style="flex:1"><span>Round / section ${ri+1}</span><input type="text" value="${esc(r.name)}" oninput="A.rounds[${ri}].name=this.value;save()"></label>
  <button class="btn danger" onclick="delR(${ri})">Delete round</button></div>`;
  r.items.forEach((it,ii)=>{
   if(it.type==='sort'){h+=sortEd(ri,ii,it);return}
   h+=`<div class="card" style="background:var(--bg)"><div class="row"><span class="tag">${it.type==='mc'?'Multiple choice':it.type==='tf'?'True / False':'Sorting'} · #${ii+1}</span><button class="btn danger" style="margin-left:auto" onclick="delI(${ri},${ii})">Remove</button></div>
   <label class="f">${it.type==='sort'?'Item to sort':'Question'}<input type="text" value="${esc(it.q)}" oninput="A.rounds[${ri}].items[${ii}].q=this.value;save()"></label>
   <div class="mut" style="margin-top:6px">${it.type==='sort'?'Bins':'Options'} — select the correct one:</div>`;
   it.opts.forEach((o,oi)=>{
    h+=`<div class="opt"><input type="radio" name="k${ri}_${ii}" ${it.key===oi?'checked':''} onchange="A.rounds[${ri}].items[${ii}].key=${oi};save()">`+
    (it.type==='tf'?`<b>${o}</b>`:`<input type="text" value="${esc(o)}" oninput="A.rounds[${ri}].items[${ii}].opts[${oi}]=this.value;save()">`)+`</div>`});
   if(it.type!=='tf')h+=`<button class="btn" onclick="optN(${ri},${ii},1)">+ option</button> <button class="btn" onclick="optN(${ri},${ii},-1)">− option</button> <span class="mut">(2–4)</span>`;
   h+=`</div>`});
  h+=`<button class="btn" onclick="addI(${ri},'mc')">+ Multiple choice</button> <button class="btn" onclick="addI(${ri},'tf')">+ True/False</button> <button class="btn" onclick="addI(${ri},'sort')">+ Sorting table</button></div>`});
 h+=`<button class="btn pri" onclick="addR()">+ Add round</button>
 <div class="card" style="margin-top:12px"><b>Share / backup</b><p class="mut">Export your activity as text to copy and keep, or paste text here and import.</p><textarea id="jx" rows="4"></textarea>
 <div class="row" style="margin-top:6px"><button class="btn" onclick="$('#jx').value=JSON.stringify(A)">Export</button><button class="btn" onclick="imp()">Import</button><button class="btn danger" onclick="if(confirm('Reset to sample?')){setA(sample());theme();ed()}">Reset sample</button></div></div>`;
 $('#edit').innerHTML=h}
const addR=()=>{A.rounds.push({name:'Round '+(A.rounds.length+1),items:[]});save();ed()};
const delR=i=>{if(confirm('Delete this round?')){A.rounds.splice(i,1);save();ed()}};
const delI=(r,i)=>{A.rounds[r].items.splice(i,1);save();ed()};
function addI(r,t){A.rounds[r].items.push(t==='mc'?mc('New question',['A','B','C','D'],0):t==='tf'?tf('New statement',0):so('Sort each keyword',['Class 1','Class 2'],[['Keyword 1',0],['Keyword 2',1]]));save();ed()}
function optN(r,i,d){const it=A.rounds[r].items[i];if(d>0&&it.opts.length<4)it.opts.push('Option '+(it.opts.length+1));if(d<0&&it.opts.length>2){it.opts.pop();if(it.key>=it.opts.length)it.key=0}save();ed()}
function imp(){try{const o=JSON.parse($('#jx').value);if(!o.rounds)throw 0;setA(o);theme();ed()}catch(e){alert('That text is not a valid activity.')}}
/* ---------- PLAY / MOTION ---------- */
const W=160,H=120,cv=document.createElement('canvas');cv.width=W;cv.height=H;const cx=cv.getContext('2d',{willReadFrequently:true});
const LAY={2:[[0,0,.5,1],[.5,0,.5,1]],3:[[0,0,1/3,1],[1/3,0,1/3,1],[2/3,0,1/3,1]],4:[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]};
let S=null,stream=null,cam=false,prev=null,raf=0,flat=[],Z=[],hov={},last=0,acc=0,sm=[],useCam=true;
const wait=ms=>new Promise(r=>setTimeout(r,ms)),trophy=p=>p==null?'':p>=90?'🏆':p>=75?'🥈':p>=50?'🥉':'⭐';
function stop(){cancelAnimationFrame(raf);S=null;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}$('#vid').srcObject=null;ov('');$('#setup').classList.add('hide');dctx.clearRect(0,0,W,H)}
function ov(h){const o=$('#ov');o.innerHTML=h||'';o.classList.toggle('hide',!h)}
/* ---------- GAME LIBRARY ---------- */
function pick(i){DB.i=i;A=DB.games[i];theme();save()}
function menu(){stop();const m=$('#menu');m.className='';
 m.innerHTML=`<div class="row" style="justify-content:space-between;margin-bottom:10px"><b style="font-size:1.2rem">My games <span class="mut" style="font-size:.7rem">build 4</span></b><button class="btn pri" onclick="newGame()">+ New game</button></div>`+DB.games.map((g,i)=>{const p=g.plays||[],b=p.length?Math.max(...p.map(x=>x.pct)):null;
 return `<div class="card"><div class="row"><div style="flex:1;min-width:160px"><b>${esc(g.title)}</b><div class="mut">${g.rounds.length} round(s) · ${cnt(g)} items · ${p.length?'played '+p.length+'× · best '+b+'%':'not played yet'}</div></div><span style="font-size:1.8rem">${trophy(b)}</span></div>
 <div class="row" style="margin-top:8px"><button class="btn pri" onclick="pick(${i});lobby(true)">Play</button><button class="btn" onclick="pick(${i});lobby(false)">Mouse/touch</button><button class="btn" onclick="pick(${i});tab('edit')">Edit</button><button class="btn" onclick="dup(${i})">Copy</button><button class="btn danger" onclick="delG(${i})">Delete</button></div></div>`}).join('');
 m.classList.remove('hide');$('#game').classList.add('hide');$('#end').classList.add('hide')}
function newGame(){const g=sample();g.title='New game';g.id=uid();g.plays=[];g.rounds=[{name:'Round 1',items:[mc('New question',['A','B','C','D'],0)]}];DB.games.push(g);pick(DB.games.length-1);tab('edit')}
function dup(i){const g=JSON.parse(JSON.stringify(DB.games[i]));g.id=uid();g.title+=' (copy)';g.plays=[];DB.games.splice(i+1,0,g);save();menu()}
function delG(i){if(!confirm('Delete this game and its history?'))return;DB.games.splice(i,1);if(!DB.games.length){const g=sample();g.id=uid();g.plays=[];DB.games.push(g)}pick(0);menu()}
function tr(){const all=DB.games.flatMap(g=>(g.plays||[]).map(p=>({...p,g:g.title}))).sort((a,b)=>b.d-a.d),c=t=>all.filter(p=>trophy(p.pct)===t).length;
 $('#trophy').innerHTML=`<div class="card"><b>Trophy shelf</b><div class="big" style="margin-top:6px">🏆 ${c('🏆')} &nbsp;🥈 ${c('🥈')} &nbsp;🥉 ${c('🥉')} &nbsp;⭐ ${c('⭐')}</div><p class="mut">🏆 90%+ · 🥈 75%+ · 🥉 50%+ · ⭐ every game played</p></div>`+
 (all.length?`<div class="card"><b>Past games</b><table><tr><th>Date</th><th>Game</th><th>Score</th><th>Top</th></tr>${all.slice(0,40).map(p=>`<tr><td>${new Date(p.d).toLocaleDateString()}</td><td>${esc(p.g)}</td><td>${trophy(p.pct)} ${p.score}/${p.total}</td><td>${esc(p.top)} ${p.pts}</td></tr>`).join('')}</table></div>`:'<p class="mut">No games played yet.</p>')}
/* ---------- PLAY / MOTION ---------- */
function build(){flat=[];A.rounds.forEach((r,ri)=>r.items.forEach(it=>{if(it.type==='sort'){const rows=it.rows.slice();if(it.shuffle)rows.sort(()=>Math.random()-.5);rows.forEach(w=>flat.push({type:'sort',p:it.q,q:w.w||'(blank)',opts:it.cats,key:w.c,round:r.name,rid:ri}))}else flat.push({...it,round:r.name,rid:ri})}));flat.forEach((x,i)=>x.first=!i||flat[i-1].rid!==x.rid)}
async function lobby(c){
 useCam=c;build();if(!flat.length){alert('Add at least one item in the Editor.');return}
 stop();cam=false;cerr='';dbgOn=true;
 if(c){try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:640,height:480},audio:false});const v=$('#vid');v.srcObject=stream;await v.play();cam=true}catch(e){cerr=e.name+(e.message?': '+e.message:'')}}
 $('#menu').classList.add('hide');$('#end').classList.add('hide');$('#game').classList.remove('hide');
 document.querySelectorAll('.zone').forEach(z=>z.remove());$('#q').textContent='';['#hr','#hp','#ht','#hs'].forEach(s=>$(s).textContent='');
 $('#gn').textContent=cam?'Stand back so hands or bodies fit inside one zone.':(c?'Camera unavailable ('+cerr+'). Check the browser camera permission and that no other app is using it. Mouse/touch mode is on.':'Mouse/touch mode: hover or press a zone and hold.');
 Z=[{r:[0,0,1,1],p:0,k:0}];sm=[];prev=null;S={state:'lobby'};
 $('#setup').innerHTML=`<b>Game setup</b>
 <label class="f" style="margin:8px 0">Multiplayer: team names, comma separated (blank = whole class)<input type="text" id="tm" placeholder="Team Mango, Team Kiwi" value="${esc(A.teams||'')}"></label>
 <div class="mut">Motion now: <b id="mread">0.0</b>% · past the halfway mark counts as motion</div><div class="meter" style="width:100%;background:var(--line);margin:4px 0 8px"><i id="mtr"></i></div>
 <label class="f">Motion needed: <span id="svl">${A.sens}</span>%<input type="range" id="sv" min="1" max="30" value="${A.sens}" oninput="A.sens=+this.value;$('#svl').textContent=this.value;save()"></label>
 <div class="row" style="margin:8px 0"><label class="f">Hold (s)<input type="number" min="0.5" max="5" step="0.1" value="${A.hold}" onchange="A.hold=+this.value||1.2;save()"></label><label class="f">Read time (s)<input type="number" min="0" max="30" value="${A.read??4}" onchange="A.read=Math.max(0,+this.value||0);save()"></label></div>
 <label class="mut"><input type="checkbox" id="dbgc"> Keep the white motion overlay during the game</label>
 <p><button class="btn pri" onclick="begin()">Start game ▶</button></p>`;$('#setup').classList.remove('hide');
 last=performance.now();raf=requestAnimationFrame(loop)}
async function begin(){
 $('#setup').classList.add('hide');dbgOn=!!($('#dbgc')&&$('#dbgc').checked);if(!dbgOn)dctx.clearRect(0,0,W,H);
 const T=($('#tm').value||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,6);A.teams=T.join(', ');save();
 S={i:0,state:'count',T,sc:Object.fromEntries((T.length?T:['Class']).map(t=>[t,0])),turn:0,correct:0,streak:0,best:0,log:[]};
 for(const n of [3,2,1]){if(!S)return;ov(`<div class="big" style="font-size:5rem">${n}</div><div>Get ready</div>`);await wait(800)}
 if(S)next()}
function hs(){$('#hs').textContent=Object.entries(S.sc).map(([k,v])=>k+': '+v).join(' · ')}
function next(){
 if(!S)return;if(S.i>=flat.length)return finish();
 const it=flat[S.i];
 if(it.first){S.state='intro';const n=flat.filter(x=>x.rid===it.rid).length;ov(`<div class="sub">Round ${it.rid+1}</div><div class="big">${esc(it.round)}</div><div>${n} item${n>1?'s':''}</div><button class="btn pri" onclick="item()">Start round ▶</button>`)}
 else item()}
function item(){
 const it=flat[S.i];ov('');S.state='read';S.left=A.read??4;hov={};sm=[];prev=null;
 S.cur=S.T.length?S.T[S.turn++%S.T.length]:null;
 document.querySelectorAll('.zone').forEach(z=>z.remove());
 $('#q').innerHTML=(it.p?'<div class="sub">'+esc(it.p)+'</div>':'')+esc(it.q);
 const L=LAY[it.opts.length]||LAY[2];Z=it.opts.map((o,k)=>{
  const d=document.createElement('div');d.className='zone lock';const [x,y,w,h]=L[k];
  d.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%`;
  d.innerHTML=`<span>${esc(o)}</span><div class="bar"></div>`;
  d.onpointerenter=d.onpointerdown=()=>hov[k]=1;d.onpointerleave=d.onpointerup=d.onpointercancel=()=>hov[k]=0;
  $('#stage').appendChild(d);return{el:d,r:L[k],p:0,k,on:false}});
 $('#hr').textContent=it.round+(S.cur?' · '+S.cur+'’s turn':'');$('#hp').textContent='Item '+(S.i+1)+'/'+flat.length;hs()}
let cerr='',dbgOn=false,mask=null;
const dbg=$('#dbg'),dctx=dbg.getContext('2d');dbg.width=W;dbg.height=H;
function gray(d){const g=new Uint8Array(W*H);for(let i=0;i<W*H;i++)g[i]=(d[i*4]*77+d[i*4+1]*150+d[i*4+2]*29)>>8;return g}
function blur(a){const o=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0,n=0;for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=H)continue;for(let dx=-1;dx<=1;dx++){const xx=x+dx;if(xx<0||xx>=W)continue;s+=a[yy*W+xx];n++}}o[y*W+x]=s/n}return o}
function dil(a){const o=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=0;for(let dy=-1;dy<=1&&!v;dy++){const yy=y+dy;if(yy<0||yy>=H)continue;for(let dx=-1;dx<=1;dx++){const xx=x+dx;if(xx>=0&&xx<W&&a[yy*W+xx]){v=1;break}}}o[y*W+x]=v}return o}
function detect(g,p){const d=new Uint8Array(W*H);for(let i=0;i<W*H;i++)d[i]=Math.abs(g[i]-p[i]);const b=blur(d),m=new Uint8Array(W*H);for(let i=0;i<W*H;i++)m[i]=b[i]>20?1:0;return dil(m)}
function zoneR(m,Z){return Z.map(z=>{const x0=Math.floor(z.r[0]*W),x1=Math.floor((z.r[0]+z.r[2])*W),y0=Math.floor(z.r[1]*H),y1=Math.floor((z.r[1]+z.r[3])*H);let c=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)c+=m[y*W+x];return c/((x1-x0)*(y1-y0))*100})}
function drawMask(m){if(!dbgOn)return;const im=dctx.createImageData(W,H);for(let i=0;i<W*H;i++)if(m[i]){im.data[i*4]=255;im.data[i*4+1]=255;im.data[i*4+2]=255;im.data[i*4+3]=170}dctx.putImageData(im,0,0)}
function ratios(){
 if(!cam)return Z.map(z=>hov[z.k]?100:0);
 const v=$('#vid');if(!v.videoWidth)return Z.map(()=>0);
 cx.save();cx.scale(-1,1);cx.drawImage(v,-W,0,W,H);cx.restore();
 const g=gray(cx.getImageData(0,0,W,H).data);let out=Z.map(()=>0);
 if(prev){mask=detect(g,prev);out=zoneR(mask,Z);drawMask(mask)}
 prev=g;return out}
function loop(t){
 if(!S)return;const dt=Math.min(.1,(t-last)/1000);last=t;const st=S.state;
 if(st==='lobby'||st==='read'||st==='ask'){
  acc+=dt;if(acc>=.04){acc=0;const r=ratios();sm=Z.map((z,i)=>Math.max(r[i],(sm[i]||0)*.75))}
  if(st==='lobby'){const m=$('#mtr'),mr=$('#mread');if(m)m.style.width=Math.min(100,(sm[0]||0)/A.sens*50)+'%';if(mr)mr.textContent=(sm[0]||0).toFixed(1)}
  else if(st==='read'){S.left-=dt;$('#ht').textContent='👀 '+Math.max(0,Math.ceil(S.left))+'s';
   if(S.left<=0){S.state='ask';S.left=A.time;sm=[];prev=null;Z.forEach(z=>z.el.classList.remove('lock'))}}
  else{let pick=-1,best=-1;
   Z.forEach((z,i)=>{const v=sm[i]||0;z.on=v>=A.sens*(z.on?.5:1);z.p=z.on?Math.min(A.hold,z.p+dt):Math.max(0,z.p-dt*.5);
    z.el.classList.toggle('act',z.on);z.el.lastChild.style.height=(z.p/A.hold*100)+'%';if(z.p>=A.hold&&v>best){best=v;pick=i}});
   S.left-=dt;$('#ht').textContent='⏱ '+Math.max(0,Math.ceil(S.left))+'s';
   if(pick>=0)answer(pick);else if(S.left<=0)answer(-1)}}
 raf=requestAnimationFrame(loop)}
function answer(k){
 const it=flat[S.i],ok=k===it.key,key=S.cur||'Class';S.state='fb';let pts=0;
 if(ok){pts=100+Math.round(50*Math.max(0,S.left)/A.time)+Math.min(50,S.streak*10);S.streak++;S.best=Math.max(S.best,S.streak);S.correct++}else S.streak=0;
 S.sc[key]+=pts;S.log.push({rid:it.rid,round:it.round,ok});
 Z.forEach((z,i)=>{z.el.classList.remove('act');if(i===it.key)z.el.classList.add('ok');else if(i===k)z.el.classList.add('bad')});
 $('#ht').textContent=ok?'✔ +'+pts:(k<0?'⏱ Time’s up':'✘ Not quite');hs();
 setTimeout(()=>{if(S){S.i++;next()}},1500)}
function finish(){
 const s=S;stop();$('#game').classList.add('hide');const by={};
 s.log.forEach(l=>{const b=by[l.rid]=by[l.rid]||{n:l.round,c:0,t:0};b.t++;if(l.ok)b.c++});
 const pct=Math.round(s.correct/flat.length*100),rk=Object.entries(s.sc).sort((a,b)=>b[1]-a[1]),perfect=Object.values(by).filter(b=>b.c===b.t).map(b=>b.n),med=['🥇','🥈','🥉'];
 (A.plays=A.plays||[]).unshift({d:Date.now(),pct,score:s.correct,total:flat.length,top:rk[0][0],pts:rk[0][1],streak:s.best});A.plays.length=Math.min(A.plays.length,30);save();
 $('#end').innerHTML=`<div class="big">${trophy(pct)} ${s.correct} / ${flat.length}</div><p class="mut">${pct}% correct · best streak ${s.best}</p>`+
 (s.T.length?`<div class="card" style="background:var(--bg)"><b>Leaderboard</b>${rk.map((r,i)=>`<div class="opt"><span>${med[i]||(i+1)+'.'}</span><b style="flex:1">${esc(r[0])}</b>${r[1]} pts</div>`).join('')}</div>`:`<p><b>${rk[0][1]} points</b></p>`)+
 (perfect.length?`<p>⭐ Perfect round: ${perfect.map(esc).join(', ')}</p>`:'')+(s.best>=5?`<p>🔥 ${s.best} in a row</p>`:'')+(pct===100?'<p>🏅 Perfect game</p>':'')+
 `<table>${Object.values(by).map(b=>`<tr><td>${esc(b.n)}</td><td>${b.c}/${b.t}</td></tr>`).join('')}</table><p><button class="btn pri" onclick="lobby(useCam)">Play again</button> <button class="btn" onclick="menu()">Back to games</button></p>`;
 $('#end').classList.remove('hide')}
$('#quit').onclick=()=>{stop();menu()};
/* ---------- PPST ---------- */
const PPST=[['1.3','Positive use of ICT to facilitate teaching and learning','Students respond through camera-based motion, a different interface from paper or keyboard.'],
['1.5','Strategies for developing critical and creative thinking, and other higher-order thinking skills','Sorting rounds make learners classify and justify rather than recall.'],
['2.3','Management of classroom structure to engage learners','Rounds and timed items set a clear structure and keep the whole class moving.'],
['3.1','Learners’ gender, needs, strengths, interests and experiences','Movement-based answering suits kinesthetic learners; the mouse/touch mode offers an alternative.'],
['5.2','Monitoring and evaluation of learner progress and achievement','Per-round scores show where the class is strong or weak.'],
['5.3','Feedback to improve learning','Instant green/red feedback and the revealed key after each item.']];
function pp(){
 const note=`ICT integration: "${A.title}" is a motion-detection game with ${A.rounds.length} round(s) and ${count()} item(s) (${[...new Set(A.rounds.flatMap(r=>r.items.map(i=>i.type==='mc'?'multiple choice':i.type==='tf'?'true/false':'sorting')))].join(', ')||'none yet'}). Learners answer by moving in front of a webcam. It runs in the browser, works offline once loaded, and processes camera frames only on the device.`;
 $('#ppst').innerHTML=`<div class="card"><b>How this tool maps to the PPST</b><p class="mut">Suggested alignment for your lesson plan or portfolio. Check indicator wording against your current PPST copy and pick the ones that match your actual lesson.</p>
 <table>${PPST.map(p=>`<tr><td><b>${p[0]}</b></td><td>${p[1]}<div class="mut">${p[2]}</div></td></tr>`).join('')}</table></div>
 <div class="card"><b>Lesson-plan snippet</b><textarea rows="6" onclick="this.select()">${esc(note)}</textarea></div>
 <div class="card"><b>Classroom setup tips</b><p class="mut">Face the camera toward learners with steady lighting. Keep the background still (a moving curtain counts as motion). Raise “Motion needed” if zones trigger by themselves, lower it if they do not respond. For offline use, open the app once with internet, then add it to the home screen; after that it works without a connection.</p></div>`}
theme();menu();
if('serviceWorker' in navigator){const had=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!window.__r){window.__r=1;location.reload()}});addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}

/* ---------- SORTING TABLE EDITOR ---------- */
const SI=(r,i)=>A.rounds[r].items[i];
function sortEd(ri,ii,it){
 const P=`SI(${ri},${ii})`;
 let h=`<div class="card" style="background:var(--bg)"><div class="row"><span class="tag">Sorting table</span><button class="btn danger" style="margin-left:auto" onclick="delI(${ri},${ii})">Remove</button></div>
 <label class="f">Instruction shown above each keyword<input type="text" value="${esc(it.q)}" oninput="${P}.q=this.value;save()"></label>
 <div class="mut" style="margin-top:6px">Classifications (2–4)</div>`;
 it.cats.forEach((c,ci)=>h+=`<div class="opt"><input type="text" value="${esc(c)}" oninput="SCn(${ri},${ii},${ci},this.value)"></div>`);
 h+=`<button class="btn" onclick="catN(${ri},${ii},1)">+ class</button> <button class="btn" onclick="catN(${ri},${ii},-1)">− class</button>
 <table style="margin-top:8px"><tr><th>Keyword</th><th>Classification (key)</th><th></th></tr>`;
 it.rows.forEach((w,wi)=>h+=`<tr><td><input type="text" value="${esc(w.w)}" oninput="${P}.rows[${wi}].w=this.value;save()"></td><td><select class="s${ri}_${ii}" onchange="${P}.rows[${wi}].c=+this.value;save()">${it.cats.map((c,ci)=>`<option value="${ci}" ${w.c===ci?'selected':''}>${esc(c)}</option>`).join('')}</select></td><td><button class="btn danger" onclick="delRow(${ri},${ii},${wi})">×</button></td></tr>`);
 h+=`</table><button class="btn" style="margin-top:6px" onclick="addRow(${ri},${ii})">+ keyword</button>
 <details style="margin-top:8px"><summary class="mut">Paste many (keyword = classification, one per line)</summary><textarea id="bk${ri}_${ii}" rows="4" placeholder="Granite = Igneous"></textarea><button class="btn" onclick="bulk(${ri},${ii})">Add lines</button></details>
 <label class="mut" style="display:block;margin-top:8px"><input type="checkbox" ${it.shuffle?'checked':''} onchange="${P}.shuffle=this.checked;save()"> Shuffle keywords when playing</label></div>`;
 return h}
function SCn(r,i,ci,v){SI(r,i).cats[ci]=v;save();document.querySelectorAll('.s'+r+'_'+i).forEach(s=>{if(s.options[ci])s.options[ci].text=v})}
function addRow(r,i){SI(r,i).rows.push({w:'',c:0});save();ed()}
function delRow(r,i,w){SI(r,i).rows.splice(w,1);save();ed()}
function catN(r,i,d){const it=SI(r,i);if(d>0&&it.cats.length<4)it.cats.push('Class '+(it.cats.length+1));if(d<0&&it.cats.length>2){it.cats.pop();it.rows.forEach(x=>{if(x.c>=it.cats.length)x.c=0})}save();ed()}
function bulk(r,i){const it=SI(r,i);$('#bk'+r+'_'+i).value.split('\n').forEach(l=>{l=l.trim();if(!l)return;const m=l.match(/^(.*?)\s*(?:=|\||\t)\s*(.+)$/)||l.match(/^(.*),\s*([^,]+)$/);if(!m)return;let c=it.cats.findIndex(x=>x.trim().toLowerCase()===m[2].trim().toLowerCase());if(c<0){if(it.cats.length>=4)return;it.cats.push(m[2].trim());c=it.cats.length-1}it.rows.push({w:m[1].trim(),c})});save();ed()}
