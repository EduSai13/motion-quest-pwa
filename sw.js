const V='mq-v4',F=['./','index.html','style.css','app.js','manifest.json','icon.svg','icon-192.png','icon-512.png'];
const put=(q,r)=>{const c=r.clone();caches.open(V).then(h=>h.put(q,c));return r};
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F.map(u=>new Request(u,{cache:'reload'})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET')return;
 if(new URL(q.url).origin===location.origin)e.respondWith(fetch(q,{cache:'no-cache'}).then(r=>put(q,r)).catch(()=>caches.match(q).then(m=>m||caches.match('index.html'))));
 else e.respondWith(caches.match(q).then(m=>m||fetch(q).then(r=>put(q,r))))});
