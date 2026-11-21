/* Клас-код · спільні функції: розмітка, збирання сторінки учня, редактор, чат, зображення, вставки
   Звичайний скрипт (не модуль): усі файли js/ мають спільну глобальну область видимості; порядок підключення — в index.html. */
const $app=document.getElementById('app');
const el=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k==='class')e.className=a[k];else if(k.startsWith('on'))e[k]=a[k];else e.setAttribute(k,a[k])}c.flat().forEach(x=>e.append(x));return e};
const clear=()=>{$app.textContent=''};
const TPLDOC='<!DOCTYPE html>\n<html lang="uk">\n<head>\n  <meta charset="UTF-8">\n  <title>Назва сторінки</title>\n</head>\n<body>\n\n</body>\n</html>\n';
const HOOKB='(function(){var s=function(t,a){parent.postMessage({k:"log",t:t,m:a.map(function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")};["log","warn","error","info"].forEach(function(t){var o=console[t];console[t]=function(){s(t==="info"?"log":t,[].slice.call(arguments));o.apply(console,arguments)}});addEventListener("error",function(e){var L=e.lineno,n="index.html",l=L;for(var i=0;i<__M.length;i++){var r=__M[i];if(L>=r.a&&L<=r.b){n=r.n;l=L-r.s;break}}s("error",[e.message+(L?" ("+n+", рядок "+l+")":"")])});addEventListener("unhandledrejection",function(e){s("error",[String(e.reason)])});__X.forEach(function(x){s("error",["Не знайдено файл «"+x+"». Перевірте назву (регістр важливий) і чи створено такий файл."])})})();';
const fmtDur=ms=>{const s=Math.round((ms||0)/1000);return s<60?s+' с':(s/60|0)+' хв'+(s%60?' '+s%60+' с':'')};
const fmtT=ms=>{const s=Math.max(0,Math.ceil(ms/1000)),h=s/3600|0,m=(s%3600)/60|0;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s%60).padStart(2,'0')};
const byName=(a,b)=>(a.ln||'').localeCompare(b.ln||'','uk')||(a.fn||'').localeCompare(b.fn||'','uk');
/* список класу: «Прізвище Ім’я» або CSV «Прізвище;Ім’я»; перші два слова, решта ігнорується; id збігається з id роботи учня */
const parseRoster=txt=>{const map={};let dup=0,bad=0;txt.replace(/^\uFEFF/,'').split(/\r?\n/).forEach(line=>{const l=line.trim();if(!l)return;
  let p=l.split(/[;\t,]/).map(x=>x.trim()).filter(Boolean);if(p.length<2)p=l.split(/\s+/);
  if(/^(прізвище|surname|last ?name)$/i.test(p[0]||''))return;
  if(p.length<2){bad++;return}
  const ln=p[0],fn=p[1],id=slug(fn+' '+ln);if(map[id]){dup++;return}map[id]={ln,fn}});return{map,dup,bad}};
const jsonSafe=v=>JSON.stringify(v).replace(/</g,'\\u003c');
/* службовий скрипт вставляється одним рядком після DOCTYPE: номери рядків не зсуваються, а в кінець нічого не дописується */
const buildDoc=r=>{const h='<script>var __M='+jsonSafe(r.segs)+',__X='+jsonSafe(r.miss)+';'+HOOKB+'<\/script>',c=r.html,m=c.match(/^\s*<!doctype[^>]*>/i);return m?c.slice(0,m[0].length)+h+c.slice(m[0].length):h+c};
const nl=s=>(s.match(/\n/g)||[]).length;
const loc=u=>!/^\s*([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u||'');
const nmOf=u=>u.trim().replace(/^\.\//,'').split(/[?#]/)[0];
/* «підключення» файлів: <link href="x.css"> і <script src="x.js"> замінюються вмістом файлів; segs — карта рядків для повідомлень про помилки */
function bundle(F){
  const src=F['index.html']||'',segs=[],miss=[];let out='',pos=0,extra=0,start=1;
  const re=/<link\b[^>]*>|<script\b[^>]*?\ssrc\s*=\s*(["'])(.*?)\1[^>]*>\s*<\/script\s*>/gi;
  for(const m of src.matchAll(re)){
    const t=m[0];let rep,name,open='',isJs=false;
    if(/^<link/i.test(t)){
      if(!/\brel\s*=\s*["']?[^"'>]*\bstylesheet\b/i.test(t))continue;
      const h=t.match(/\shref\s*=\s*(["'])(.*?)\1/i);if(!h||!loc(h[2]))continue;
      name=nmOf(h[2]);if(F[name]===undefined||!/\.css$/i.test(name)){miss.push(name);continue}
      rep='<style>\n'+F[name]+'\n</style>';
    }else{
      if(!loc(m[2]))continue;name=nmOf(m[2]);
      if(F[name]===undefined||!/\.js$/i.test(name)){miss.push(name);continue}
      isJs=true;open=t.match(/^<script\b[^>]*>/i)[0].replace(/\s+src\s*=\s*(["']).*?\1/i,'');rep=open+'\n'+F[name]+'\n<\/script>';
    }
    out+=src.slice(pos,m.index);const sl=nl(out)+1,end=sl+nl(rep);
    segs.push({a:start,b:sl,n:'index.html',s:extra});
    if(isJs){const c1=sl+nl(open)+1;segs.push({a:c1,b:c1+nl(F[name]),n:name,s:c1-1})}
    else if(end-1>=sl+1)segs.push({a:sl+1,b:end-1,n:name,s:sl});
    out+=rep;pos=m.index+t.length;extra+=nl(rep)-nl(t);start=end;
  }
  segs.push({a:start,b:1e9,n:'index.html',s:extra});
  return{html:out+src.slice(pos),segs,miss:[...new Set(miss)]};
}
const oldDoc=d=>'<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<style>\n'+(d.c||'')+'\n</style>\n</head>\n<body>\n'+(d.h||'')+'\n<script>\n'+(d.j||'')+'\n<\/script>\n</body>\n</html>';
const legacyDoc=d=>d.code!=null?d.code:(d.h!=null||d.c!=null||d.j!=null)?oldDoc(d):'';
const fk=n=>n.replace(/\./g,'%2E');
const filesOf=(d,main='index.html')=>{const o={};if(d.files)Object.values(d.files).forEach(x=>{if(x&&x.n)o[x.n]=x.c||''});else if(main==='index.html')o[main]=legacyDoc(d);if(!(main in o))o[main]='';return o};
const isMain=n=>n==='index.html'||n==='main.py';
const ordF=(a,b)=>isMain(a)&&!isMain(b)?-1:isMain(b)&&!isMain(a)?1:a.localeCompare(b);
const frame=m=>el('iframe',{sandbox:m==='full'?'allow-scripts allow-modals':m==='run'?'allow-scripts':''});
function mkEditor(ro,onRun){
  const host=el('div',{class:'edh'}),MODE=n=>/\.css$/i.test(n)?'css':/\.js$/i.test(n)?'javascript':/\.py$/i.test(n)?'python':/\.json$/i.test(n)?{name:'javascript',json:true}:/\.(txt|csv)$/i.test(n)?'text/plain':'htmlmixed';let cm=null,ta=null,docs={},curN=null;
  if(window.CodeMirror){
    cm=CodeMirror(host,{value:'',mode:'htmlmixed',lineNumbers:true,tabSize:2,indentUnit:2,indentWithTabs:false,matchBrackets:true,readOnly:ro,
      extraKeys:{Tab:c=>c.somethingSelected()?c.execCommand('indentMore'):c.execCommand('insertSoftTab'),'Shift-Tab':'indentLess','Ctrl-Enter':()=>onRun&&onRun(),'Cmd-Enter':()=>onRun&&onRun()}});
    setTimeout(()=>cm.refresh(),60);setTimeout(()=>cm.refresh(),400);
  }else{ta=el('textarea',{class:'code',spellcheck:'false',wrap:'off'});ta.readOnly=ro;
    ta.onkeydown=e=>{if(e.key==='Tab'&&!ta.readOnly){e.preventDefault();ta.setRangeText('  ',ta.selectionStart,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input'))}};host.append(ta)}
  return{host,get:()=>cm?cm.getValue():ta.value,
    sync:(n,v)=>{if(cm){const d=docs[n];if(!d){docs[n]=new CodeMirror.Doc(v,MODE(n));return}if(d.getValue()===v)return;
        if(d===cm.getDoc()){const s=cm.getScrollInfo();d.setValue(v);cm.scrollTo(s.left,s.top)}else d.setValue(v)}else{docs[n]=v;if(n===curN)ta.value=v}},
    show:n=>{if(n===curN)return;if(cm){cm.swapDoc(docs[n]);const u=/\.py$/i.test(n)?4:2;cm.setOption('indentUnit',u);cm.setOption('tabSize',u)}else{if(curN!=null)docs[curN]=ta.value;ta.value=docs[n]||''}curN=n},
    drop:n=>{delete docs[n];if(curN===n)curN=null},
    ren:(a,b)=>{if(cm){docs[b]=new CodeMirror.Doc(docs[a].getValue(),MODE(b));delete docs[a];if(curN===a){curN=b;cm.swapDoc(docs[b])}}else{if(curN===a){docs[a]=ta.value;curN=b}docs[b]=docs[a];delete docs[a]}},
    on:f=>{cm?cm.on('change',(_,c)=>{if(c.origin!=='setValue')f()}):ta.addEventListener('input',f)},
    onIns:f=>{if(cm)cm.on('beforeChange',(c,ch)=>{if(!ch.text||ch.origin==='setValue')return;const x=ch.text.join('\n'),k=ch.origin==='paste'?'paste':ch.origin==='drop'?'drop':(ch.origin==='+input'&&x.length>=40?'type':null);if(k&&f(x,k))ch.cancel()});
      else{ta.addEventListener('paste',e=>{const x=(e.clipboardData||window.clipboardData||{getData:()=>''}).getData('text');if(x&&f(x,'paste'))e.preventDefault()});ta.addEventListener('drop',e=>{const x=e.dataTransfer&&e.dataTransfer.getData('text');if(x&&f(x,'drop'))e.preventDefault()})}},
    onCopy:f=>{const g=()=>{let x=cm?cm.getSelection():ta.value.slice(ta.selectionStart,ta.selectionEnd);if(!x&&cm)x=cm.getLine(cm.getCursor().line);f(x)};if(cm){cm.on('copy',g);cm.on('cut',g)}else{ta.addEventListener('copy',g);ta.addEventListener('cut',g)}},
    ro:b=>{cm?cm.setOption('readOnly',b):ta.readOnly=b},locked:()=>cm?!!cm.getOption('readOnly'):ta.readOnly,refresh:()=>{cm&&cm.refresh()}}}
const unreadOf=(w,me)=>Object.values(w.chat||{}).filter(x=>x.f!==me&&(x.at||0)>(w[me==='t'?'tRead':'sRead']||0)).length;
function mkChat(wref,me){
  const list=el('div',{class:'msgs'}),inp=el('input',{placeholder:'Напишіть повідомлення…'}),bt=el('button',{style:'flex:0'},'➤'),rk=me==='t'?'tRead':'sRead';
  let msgs={},vis=false,lw={},n=-1;
  const draw=()=>{list.textContent='';Object.keys(msgs).sort((a,b)=>(msgs[a].at||0)-(msgs[b].at||0)).forEach(k=>{const x=msgs[k];
    list.append(el('div',{class:'msg '+(x.f===me?'me':'ot')},el('div',{},x.m),el('div',{class:'mu',style:'font-size:11px'},(x.f==='t'?'Вчитель':'Учень')+' · '+new Date(x.at||Date.now()).toLocaleTimeString('uk',{hour:'2-digit',minute:'2-digit'}))))});list.scrollTop=1e9};
  const mark=()=>{if(vis&&unreadOf(lw,me))wref.child(rk).set(firebase.database.ServerValue.TIMESTAMP)};
  const send=()=>{const m=inp.value.trim();if(!m)return;inp.value='';wref.child('chat').push({f:me,m:m.slice(0,1000),at:firebase.database.ServerValue.TIMESTAMP})};
  bt.onclick=send;inp.onkeydown=e=>{if(e.key==='Enter')send()};
  return{el:el('div',{class:'chatbox'},list,el('div',{class:'row',style:'padding:8px;flex-wrap:nowrap;border-top:1px solid var(--bd)'},inp,bt)),
    update:w=>{lw=w;msgs=w.chat||{};const k=Object.keys(msgs).length;if(k!==n){n=k;draw()}mark()},
    show:v=>{vis=v;if(v){list.scrollTop=1e9;if(me==='s')inp.focus();mark()}}}}
const slug=s=>s.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'_');
const ago=t=>{if(!t)return'—';const s=(Date.now()-t)/1e3|0;return s<60?s+' с тому':s<3600?(s/60|0)+' хв тому':(s/3600|0)+' год тому'};
const U=c=>c.trim().toUpperCase();
const EM='@klas-kod.app';
const AE=e=>({'auth/email-already-in-use':'Ця пошта вже зареєстрована. Увійдіть або скористайтеся «Забули пароль?»','auth/weak-password':'Пароль закороткий (мінімум 6 символів)','auth/invalid-credential':'Невірний логін (пошта) або пароль','auth/wrong-password':'Невірний логін (пошта) або пароль','auth/user-not-found':'Невірний логін (пошта) або пароль','auth/invalid-email':'Некоректна адреса пошти','auth/requires-recent-login':'Потрібно щойно увійти: вийдіть, увійдіть знову й повторіть','auth/operation-not-allowed':'У Firebase не ввімкнено потрібний спосіб входу (Authentication → Sign-in method)','auth/network-request-failed':'Немає зв’язку із сервером','auth/too-many-requests':'Забагато спроб, спробуйте пізніше'}[e.code]||('Помилка: '+(e.message||e.code)));
let db,AU,MYUID;


const IMGMAX=1280,IMGLIM=260000;
function imgPack(f){return new Promise((ok,no)=>{if(!f||!/^image\//.test(f.type))return no(new Error('Оберіть файл із зображенням (PNG, JPG, WebP, GIF)'));
  const u=URL.createObjectURL(f),im=new Image();
  im.onload=()=>{URL.revokeObjectURL(u);let w=im.naturalWidth||1,h=im.naturalHeight||1;const k=Math.min(1,IMGMAX/Math.max(w,h));w=Math.max(1,Math.round(w*k));h=Math.max(1,Math.round(h*k));
    const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);
    let q=.88,d=c.toDataURL('image/jpeg',q);while(d.length>IMGLIM&&q>.45){q-=.1;d=c.toDataURL('image/jpeg',q)}
    d.length>IMGLIM?no(new Error('Зображення завелике навіть після стиснення. Оберіть менше.')):ok(d)};
  im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('Не вдалося прочитати зображення'))};im.src=u})}
function imgView(src){let ov,im;const close=()=>{ov.remove();$app.inert=false;removeEventListener('keydown',kd,true)};
  const kd=e=>{if(e.key==='Escape'){e.stopPropagation();close()}};
  im=el('img',{src,alt:'Зразок результату'});
  ov=el('div',{class:'imv',role:'dialog','aria-modal':'true',onclick:e=>{if(e.target!==im)close()}},el('button',{class:'imx',title:'Закрити (Esc)','aria-label':'Закрити',onclick:close},'✕'),im);
  $app.inert=true;document.body.append(ov);addEventListener('keydown',kd,true)}
const imgThumb=src=>el('img',{class:'timg',src,alt:'Зразок результату',title:'Натисніть, щоб збільшити',onclick:()=>imgView(src)});
function imgEd(src,on,enabled){let cur=src||null;const box=el('div',{class:'imed'});
  const draw=()=>{box.textContent='';box.append(el('b',{},'🖼 Зображення-зразок'));
    if(cur)box.append(imgThumb(cur));else box.append(el('span',{class:'mu'},enabled?'Не додано (необов’язково)':'Не додано'));
    if(enabled){const f=el('input',{type:'file',accept:'image/*',style:'display:none'});
      f.onchange=async()=>{try{const d=await imgPack(f.files[0]);cur=d;await on(d);draw()}catch(e){alert(e.message||e)}};
      box.append(f,el('button',{class:'g',onclick:()=>f.click()},cur?'Замінити':'＋ Додати зображення'));
      if(cur)box.append(el('button',{class:'g',onclick:async()=>{try{await on(null);cur=null;draw()}catch(e){alert(e.message||e)}}},'Прибрати'))}};
  draw();return{el:box,set:v=>{cur=v||null;draw()},get:()=>cur}}
const PSK={paste:'вставка',drop:'перетягування',type:'введення великого фрагмента за раз'};
function pasteView(d){if(!d)return;const L=Object.values(d.pl||{}).sort((a,b)=>(b.at||0)-(a.at||0));let ov;
  const close=()=>{ov.remove();removeEventListener('keydown',kd,true)},kd=e=>{if(e.key==='Escape'){e.stopPropagation();close()}};
  const box=el('div',{class:'pvb'},el('div',{class:'row',style:'align-items:center'},el('b',{style:'flex:1'},'📋 Вставки коду з інших джерел: '+d.n+' — '+(d.pc||0)+' (разом '+(d.pz||0)+' симв.)'),el('button',{class:'g',onclick:close},'✕ Закрити')),
    el('div',{class:'mu'},'Не враховуються: копіювання всередині власного коду учня та фрагменти з тексту завдання. Сам факт вставки ще не доводить порушення: обговоріть це з учнем.'),
    L.length?L.map(x=>el('div',{class:'pvi'+(x.b?' b':'')},el('div',{class:'mu'},new Date(x.at||0).toLocaleString('uk',{dateStyle:'short',timeStyle:'medium'})+' · '+(x.f||'')+' · '+(x.n||0)+' симв. · '+(PSK[x.k]||x.k||'')+(x.b?' · ⛔ заблоковано, у код не потрапило':'')),el('pre',{},x.x||''))):el('div',{class:'mu'},'Записів немає.'),
    (d.pc||0)>L.length?el('div',{class:'mu'},'Збережено останні '+L.length+' фрагментів.'):'');
  ov=el('div',{class:'imv',role:'dialog','aria-modal':'true',onclick:e=>{if(e.target===ov)close()}},box);document.body.append(ov);addEventListener('keydown',kd,true)}

/* ---------- автоперевірка веб-сторінок: чек-лист вимог ----------
   Правило: {k: тип, l: підпис для учня (необов'язково), ...поля}. Базові типи без полів — WBASE. */
const WBASE={doctype:'Є оголошення <!DOCTYPE html>',lang:'У тегу <html> вказано мову (lang)',title:'Є заголовок сторінки <title>',files:'Усі підключені файли CSS і JS існують',err:'Немає помилок JavaScript'};
const WKIND={has:'Є елемент(и)',attr:'В елементів є атрибут',text:'Елемент містить текст',css:'Стиль елемента',link:'Підключено файл',click:'Після натискання — результат'};
const clist=t=>t&&t.checks?Object.values(t.checks).filter(x=>x&&x.k&&(WBASE[x.k]||WKIND[x.k])):[];
const cLabel=r=>{if(r.l&&String(r.l).trim())return String(r.l).trim();if(WBASE[r.k])return WBASE[r.k];const s='«'+(r.s||'')+'»';
  return{has:()=>'Є '+(+r.n>1?'щонайменше '+r.n+' ':'')+s,attr:()=>'У '+s+' є атрибут '+(r.a||'')+(r.v?'="'+r.v+'"':''),text:()=>s+' містить текст «'+(r.v||'')+'»',
    css:()=>'У '+s+' '+(r.p||'')+(r.op==='~'?' містить «'+(r.v||'')+'»':': '+(r.v||'')),link:()=>'Підключено файл '+(r.f||''),
    click:()=>'Після натискання '+s+(r.inp?' (у «'+r.inp+'» введено «'+(r.val||'')+'»)':'')+' «'+(r.t||'')+'» містить «'+(r.v||'')+'»'}[r.k]()};
const cValid=r=>!!(WBASE[r.k]||{has:r.s,attr:r.s&&r.a,text:r.s&&r.v,css:r.s&&r.p&&r.v,link:r.f,click:r.s&&r.t&&r.v}[r.k]);
/* виконується ВСЕРЕДИНІ ізольованої сторінки учня (передається як текст функції); результат — postMessage батькові */
function WCK(R){
  var E=window.__WE||[],done=false;
  var q=function(s){try{return document.querySelectorAll(s)}catch(e){return null}};
  var tx=function(e){return String(e.innerText||e.textContent||'').replace(/\s+/g,' ').trim()};
  var sh=function(s){s=String(s);return s.length>70?s.slice(0,70)+'…':s};
  var low=function(s){return String(s==null?'':s).toLowerCase().trim()};
  var wait=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
  var one=function(r){
    if(r.k==='lang'){var lg=document.documentElement.getAttribute('lang');return{ok:!!(lg&&lg.trim()),w:''}}
    if(r.k==='title')return{ok:!!document.title.trim(),w:''};
    var L=q(r.s||'');if(L===null)return{ok:false,w:'помилковий селектор «'+r.s+'»'};
    if(r.k==='has'){var n=Math.max(1,+r.n||1);return{ok:L.length>=n,w:'знайдено: '+L.length}}
    if(!L.length)return{ok:false,w:'на сторінці немає «'+r.s+'»'};
    if(r.k==='attr'){var bad=0;for(var i=0;i<L.length;i++){var v=L[i].getAttribute(r.a);if(v===null||(r.v?v.trim()!==String(r.v).trim():!v.trim()))bad++}
      return{ok:!bad,w:bad?'не виконано для '+bad+' з '+L.length:''}}
    if(r.k==='text'){for(var j=0;j<L.length;j++)if(low(tx(L[j])).indexOf(low(r.v))>=0)return{ok:true,w:''};return{ok:false,w:'зараз: «'+sh(tx(L[0]))+'»'}}
    if(r.k==='css'){var e=L[0],p=String(r.p||'').trim().toLowerCase(),cv=getComputedStyle(e).getPropertyValue(p).trim();
      if(r.op==='~')return{ok:low(cv).indexOf(low(r.v))>=0,w:'зараз: '+(cv||'(не задано)')};
      var tg=/^(html|body|head)$/i.test(e.tagName)?'div':e.tagName,pr=document.createElement(tg);
      if(p!=='position')pr.style.setProperty('position','absolute','important');pr.style.setProperty('visibility','hidden','important');pr.style.setProperty(p,String(r.v).trim(),'important');
      if(!pr.style.getPropertyValue(p))return{ok:false,w:'значення «'+r.v+'» не підходить для '+p};
      (e.parentNode&&e.parentNode.nodeType===1?e.parentNode:document.body).appendChild(pr);var ev=getComputedStyle(pr).getPropertyValue(p).trim();pr.remove();
      return{ok:cv===ev,w:'зараз: '+(cv||'(не задано)')}}
    return{ok:false,w:''}};
  var go=async function(){if(done)return;done=true;var out={};
    R.forEach(function(r){if(r.k!=='click'&&r.k!=='err'){try{out[r.i]=one(r)}catch(e){out[r.i]={ok:false,w:'помилка перевірки: '+e.message}}}});
    for(var k=0;k<R.length;k++){var r=R[k];if(r.k!=='click')continue;
      try{if(r.inp){var I=q(r.inp);if(!I||!I.length){out[r.i]={ok:false,w:'на сторінці немає поля «'+r.inp+'»'};continue}I[0].value=r.val||'';I[0].dispatchEvent(new Event('input',{bubbles:true}));I[0].dispatchEvent(new Event('change',{bubbles:true}))}
        var B=q(r.s);if(!B||!B.length){out[r.i]={ok:false,w:'на сторінці немає «'+r.s+'»'};continue}
        B[0].click();await wait(400);var T=q(r.t);if(!T||!T.length){out[r.i]={ok:false,w:'на сторінці немає «'+r.t+'»'};continue}
        var t=T[0],tv=('value' in t&&!/^(li|button|meter|progress|data|option)$/i.test(t.tagName)&&t.tagName!=='DIV')?String(t.value):tx(t);
        out[r.i]={ok:low(tv).indexOf(low(r.v))>=0,w:'зараз: «'+sh(tv)+'»'}}catch(e){out[r.i]={ok:false,w:'помилка: '+e.message}}}
    R.forEach(function(r){if(r.k==='err')out[r.i]={ok:!E.length,w:E.length?E.length+' пом.: '+sh(E[0]):''}});
    parent.postMessage({k:'wck',r:out},'*')};
  if(document.readyState==='complete')setTimeout(go,150);else addEventListener('load',function(){setTimeout(go,150)});setTimeout(go,3000)}
const reEsc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function webCheck(F,rules,o){o=o||{};return new Promise(done=>{
  const R=rules.map((r,i)=>({...r,i})),out={},src=F['index.html']||'',b=bundle(F);
  R.forEach(r=>{if(r.k==='doctype')out[r.i]={ok:/^\s*<!doctype\s+html\s*>/i.test(src),w:''};
    else if(r.k==='files')out[r.i]={ok:!b.miss.length,w:b.miss.length?'не знайдено: '+b.miss.join(', '):''};
    else if(r.k==='link'){const f=nmOf(String(r.f||'')),css=/\.css$/i.test(f),q='["\']?(\\./)?'+reEsc(f)+'(["\'?#\\s>]|$)';
      const lk=new RegExp(css?'<link\\b[^>]*\\shref\\s*=\\s*'+q:'<script\\b[^>]*\\ssrc\\s*=\\s*'+q,'i').test(src),has=F[f]!==undefined;
      out[r.i]={ok:has&&lk,w:!has?'файлу '+f+' немає':!lk?'файл не підключено в index.html':''}}});
  const dyn=R.filter(r=>!(r.i in out));if(!dyn.length)return done(R.map(r=>out[r.i]));
  const ifr=el('iframe',{sandbox:'allow-scripts',title:'перевірка',style:'position:fixed;left:-12000px;top:0;width:1024px;height:768px;border:0;opacity:0;pointer-events:none'});
  let tm=null,over=false;
  const fin=miss=>{if(over)return;over=true;clearTimeout(tm);removeEventListener('message',h);ifr.remove();done(R.map(r=>out[r.i]||miss))};
  const h=e=>{if(e.source!==ifr.contentWindow||!e.data||e.data.k!=='wck')return;Object.assign(out,e.data.r||{});fin({ok:false,w:'не перевірено'})};
  addEventListener('message',h);
  const pre='<script>window.__WE=[];addEventListener("error",function(e){__WE.push(String(e.message||"помилка"))});addEventListener("unhandledrejection",function(e){__WE.push(String((e.reason&&e.reason.message)||e.reason||"помилка"))});<\/script>';
  const run='<script>('+WCK.toString()+')('+jsonSafe(dyn)+');<\/script>',c=b.html,m=c.match(/^\s*<!doctype[^>]*>/i);
  tm=setTimeout(()=>fin({ok:false,w:'сторінка не відповіла за '+Math.round((o.timeout||9000)/1000)+' с (можливо, нескінченний цикл у JavaScript)'}),o.timeout||9000);
  document.body.append(ifr);ifr.srcdoc=(m?c.slice(0,m[0].length)+pre+c.slice(m[0].length):pre+c)+run})}
const cPassed=res=>(res||[]).filter(x=>x&&x.ok).length;
function cView(rules,res){return el('div',{class:'tst'},rules.map((r,k)=>{const x=res[k]||{};
  return el('div',{class:'tsi '+(x.ok?'ok':'bad')},(x.ok?'✅ ':'❌ ')+cLabel(r),!x.ok&&x.w?el('div',{class:'mu'},x.w):'')}))}
