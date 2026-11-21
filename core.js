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

/* ---------- перегляд історії набору коду ----------
   E: записи з hist/{завдання}/{учень} ({k:1,F:[{n,c}]} — повний знімок; {f,p,d,x} — зміна файлу; {op:'mv'|'rm'}; {e:'sub'} — здача).
   o: {name, web, main, pl (вставки з works.pl), onClose} */
const hApply=(S,e)=>{if(e.k){const o={};(e.F?Object.values(e.F):[]).forEach(x=>{if(x&&x.n)o[x.n]=x.c||''});return o}
  if(e.op==='rm'){const o={...S};delete o[e.f];return o}if(e.op==='mv'){const o={...S};o[e.to]=o[e.f];delete o[e.f];return o}
  if(e.f==null||e.e)return S;const a=S[e.f]||'';return{...S,[e.f]:a.slice(0,e.p||0)+(e.x||'')+a.slice((e.p||0)+(e.d||0))}};
const hLen=S=>Object.values(S).reduce((a,c)=>a+String(c||'').length,0);
const hTime=ts=>new Date(ts).toLocaleTimeString('uk',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
function histView(E0,o){o=o||{};
  const E=(E0?Object.values(E0):[]).filter(e=>e&&e.at).sort((a,b)=>a.at-b.at);
  const ov=el('div',{class:'modal hv',style:'z-index:60'}),box=el('div',{});ov.append(box);
  const close=()=>{stop();ov.remove();removeEventListener('keydown',kd,true);if(o.onClose)o.onClose()};
  const kd=e=>{if(e.key==='Escape'){e.stopPropagation();close()}else if(e.key===' '&&e.target.tagName!=='INPUT'&&e.target.tagName!=='SELECT'){e.preventDefault();toggle()}};
  if(!E.length){const k0=e=>{if(e.key==='Escape'){e.stopPropagation();c0()}},c0=()=>{ov.remove();removeEventListener('keydown',k0,true);if(o.onClose)o.onClose()};
    box.append(el('header',{},el('b',{style:'flex:1'},'⏯ Історія набору: '+(o.name||'')),el('button',{class:'g',onclick:c0},'✕ Закрити')),
      el('div',{class:'tp'},el('div',{class:'mu'},'Історія для цієї роботи не записана. Вона з’являється, коли учень працює з оновленою версією платформи.')));
    document.body.append(ov);addEventListener('keydown',k0,true);return}
  /* стани після кожного запису; контрольні точки, щоб швидко перемотувати */
  const CP={},lens=[];let S={};E.forEach((e,i)=>{S=hApply(S,e);lens.push(hLen(S));if(i%25===0)CP[i]=S});
  const stateAt=i=>{let j=i-(i%25),s=CP[j];for(let k=j+1;k<=i;k++)s=hApply(s,E[k]);return s};
  const t0=E[0].at,t1=E[E.length-1].at;
  /* активний час: проміжки до 2 хв між записами */
  let act=0;for(let i=1;i<E.length;i++){const g=E[i].at-E[i-1].at;if(g<120000)act+=g}
  /* «великий фрагмент за раз»: багато символів з'явилося за кілька правок (c — кількість правок у редакторі між збереженнями) */
  const isBig=e=>{const L=(e.x||'').length;return !e.k&&e.f!=null&&!e.op&&L>=60&&(e.c!=null?e.c<=Math.max(3,L/20):L>=200)};
  const big=E.map((e,i)=>({e,i})).filter(z=>isBig(z.e));
  const PL=(o.pl?Object.values(o.pl):[]).filter(x=>x&&x.at);
  const fmtM=ms=>{const m=Math.round(ms/60000);return m<1?'менше хвилини':m<60?m+' хв':Math.floor(m/60)+' год '+(m%60)+' хв'};
  /* графік: обсяг коду в часі + позначки */
  const W=1000,H=70,maxL=Math.max(1,...lens),X=t=>t1>t0?(t-t0)/(t1-t0)*W:W/2,Y=l=>H-4-(l/maxL)*(H-10);
  const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('class','hvc');
  const pth=document.createElementNS(NS,'path');pth.setAttribute('d',E.map((e,i)=>(i?'L':'M')+X(e.at).toFixed(1)+' '+Y(lens[i]).toFixed(1)).join(' '));pth.setAttribute('class','hvl');svg.append(pth);
  const tick=(t,cls,title)=>{const r=document.createElementNS(NS,'rect');r.setAttribute('x',(X(t)-1.5).toFixed(1));r.setAttribute('y','0');r.setAttribute('width','3');r.setAttribute('height',String(H));r.setAttribute('class',cls);
    const tt=document.createElementNS(NS,'title');tt.textContent=title;r.append(tt);svg.append(r)};
  E.forEach(e=>{if(e.k)tick(e.at,'hvk','Початок сеансу '+hTime(e.at));if(e.e==='sub')tick(e.at,'hvs','Здано '+hTime(e.at))});
  big.forEach(z=>tick(z.e.at,'hvb','Великий фрагмент за раз: '+z.e.x.length+' симв. о '+hTime(z.e.at)));
  PL.forEach(x=>tick(x.at,'hvp','Вставка з іншого джерела ('+(x.n||0)+' симв.) о '+hTime(x.at)));
  const cur=document.createElementNS(NS,'rect');cur.setAttribute('y','0');cur.setAttribute('width','2');cur.setAttribute('height',String(H));cur.setAttribute('class','hvcur');svg.append(cur);
  /* керування */
  let pos=E.length-1,fc=null,timer=null,showPage=false;
  const rng=el('input',{type:'range',min:0,max:E.length-1,value:pos,style:'flex:1;min-width:160px'}),tl=el('span',{class:'mu',style:'min-width:190px'});
  const pb=el('button',{style:'flex:0 0 auto;min-width:96px',onclick:()=>toggle()},'▶ Відтворити');
  const spd=el('select',{style:'width:auto'});[['1','1×'],['4','4×'],['16','16×'],['64','64×']].forEach(([v,t])=>spd.append(el('option',{value:v},t)));spd.value='16';
  const skip=el('input',{type:'checkbox',style:'width:auto;flex:none'});skip.checked=true;
  const tabs=el('div',{class:'tabs'}),code=el('pre',{class:'hvcode'}),page=frame('none');page.setAttribute('sandbox','');page.className='hvpage';
  const pgBtn=o.web?el('button',{class:'g',onclick:()=>{showPage=!showPage;draw()}},'👁 Показати сторінку'):'';
  const stop=()=>{clearTimeout(timer);timer=null;pb.textContent='▶ Відтворити'};
  const step=()=>{if(pos>=E.length-1)return stop();const g=E[pos+1].at-E[pos].at,d=Math.max(25,(skip.checked?Math.min(g,1500):g)/(+spd.value));
    timer=setTimeout(()=>{pos++;draw();if(timer)step()},d)};
  const toggle=()=>{if(timer)return stop();if(pos>=E.length-1)pos=0;pb.textContent='⏸ Пауза';draw();step()};
  rng.oninput=()=>{pos=+rng.value;draw()};
  svg.onclick=ev=>{const r=svg.getBoundingClientRect(),t=t0+(ev.clientX-r.left)/r.width*(t1-t0);let b=0;E.forEach((e,i)=>{if(Math.abs(e.at-t)<Math.abs(E[b].at-t))b=i});pos=b;draw()};
  const nav=d=>()=>{stop();pos=Math.max(0,Math.min(E.length-1,pos+d));draw()};
  const draw=()=>{const s=stateAt(pos),e=E[pos],ns=Object.keys(s).sort(ordF);rng.value=pos;cur.setAttribute('x',(X(e.at)-1).toFixed(1));
    if(e.f&&!e.op&&s[e.f]!==undefined)fc=e.f;if(!fc||!(fc in s))fc=ns.includes(o.main||'')?o.main:ns[0];
    tl.textContent=hTime(e.at)+' · '+fmtM(e.at-t0)+' від початку · крок '+(pos+1)+' з '+E.length;
    tabs.textContent='';ns.forEach(n=>tabs.append(el('button',{class:n===fc?'on':'g',onclick:()=>{fc=n;draw()}},n)));if(pgBtn){pgBtn.textContent=showPage?'📝 Показати код':'👁 Показати сторінку';tabs.append(pgBtn)}
    const txt=s[fc]||'';code.textContent='';
    if(e.f===fc&&!e.k&&!e.op&&e.x){const a=e.p||0,b=a+e.x.length;code.append(txt.slice(0,a),el('mark',{},txt.slice(a,b)),txt.slice(b));const m=code.querySelector('mark');if(m)setTimeout(()=>{try{m.scrollIntoView({block:'center'})}catch(_){}},0)}
    else code.append(txt);
    info.textContent=e.k?'▶ Початок сеансу (повний знімок коду)':e.e==='sub'?'📥 Роботу здано':e.op==='rm'?'🗑 Видалено файл '+e.f:e.op==='mv'?'✏ Перейменовано '+e.f+' → '+e.to:
      '✎ '+e.f+': '+((e.x||'').length?'+'+(e.x||'').length+' симв.':'')+((e.d||0)?' −'+e.d+' симв.':'')+(isBig(e)?' · ⚠ великий фрагмент за раз ('+(e.c||1)+' правок)':'');
    page.style.display=showPage?'':'none';code.style.display=showPage?'none':'';if(showPage)page.srcdoc=bundle(s).html};
  const info=el('div',{class:'mu',style:'min-height:1.4em'});
  box.append(el('header',{},el('b',{style:'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'},'⏯ Історія набору: '+(o.name||'')),el('button',{class:'g',onclick:close},'✕ Закрити')),
    el('div',{class:'tp',style:'gap:8px'},
      el('div',{class:'mu'},'Від '+hTime(t0)+' до '+hTime(t1)+' · активна робота: '+fmtM(act)+' · збережень: '+E.filter(e=>!e.k&&!e.e).length+' · сеансів: '+E.filter(e=>e.k).length+
        (big.length?' · ⚠ великих фрагментів за раз: '+big.length:'')+(PL.length?' · 📋 вставок з інших джерел: '+PL.length:'')),
      svg,el('div',{class:'mu hvleg'},el('span',{class:'hvlg l'},'обсяг коду'),el('span',{class:'hvlg b'},'великий фрагмент за раз'),el('span',{class:'hvlg p'},'вставка з іншого джерела'),el('span',{class:'hvlg k'},'початок сеансу'),el('span',{class:'hvlg s'},'здача')),
      el('div',{class:'row',style:'align-items:center'},el('button',{class:'g',style:'flex:0 0 auto',title:'Крок назад',onclick:nav(-1)},'⟨'),pb,el('button',{class:'g',style:'flex:0 0 auto',title:'Крок уперед',onclick:nav(1)},'⟩'),rng,
        el('label',{class:'mu',style:'display:flex;gap:6px;align-items:center;flex:0 0 auto'},'швидкість',spd),el('label',{class:'mu',style:'display:flex;gap:6px;align-items:center;flex:0 0 auto'},skip,'пропускати паузи')),
      el('div',{class:'row',style:'align-items:center'},tl,info)),
    el('div',{class:'hvb2'},tabs,code,page));
  document.body.append(ov);addEventListener('keydown',kd,true);draw()}

/* ---------- критерії оцінювання ----------
   tasks.rub = {s: шкала оцінки (12), c: [{id, t: назва, m: макс. балів, a: 1 — підказка з автоперевірки}]}; бали учня — works.rs {id критерію: бали} */
const rlist=t=>t&&t.rub&&t.rub.c?Object.values(t.rub.c).filter(x=>x&&x.id&&String(x.t||'').trim()&&+x.m>0):[];
const rScale=t=>Math.max(1,Math.min(100,+(t&&t.rub&&t.rub.s)||12));
const rMax=C=>Math.round(C.reduce((a,c)=>a+(+c.m||0),0)*100)/100;
const rHas=v=>v!==undefined&&v!==null&&v!=='';
const rCalc=(t,rs)=>{const C=rlist(t),M=rMax(C);let S=0,n=0;C.forEach(c=>{const v=rs&&rs[c.id];if(rHas(v)){S+=Math.max(0,Math.min(+c.m,+v||0));n++}});
  S=Math.round(S*100)/100;return{sum:S,max:M,filled:n,total:C.length,grade:M&&n?Math.max(1,Math.round(S/M*rScale(t))):null}};
function rubView(t,rs){const C=rlist(t);if(!C.length)return null;const have=rs&&C.some(c=>rHas(rs[c.id]));
  return el('table',{class:'rubt'},el('tr',{},el('th',{},'Критерій'),el('th',{},have?'Бали':'Макс. балів')),
    C.map(c=>el('tr',{},el('td',{},c.t),el('td',{},have?(rHas(rs[c.id])?rs[c.id]:'—')+' / '+c.m:String(c.m)))),
    el('tr',{class:'rubs'},el('td',{},have?'Разом':'Разом (шкала оцінки — '+rScale(t)+')'),el('td',{},have?rCalc(t,rs).sum+' / '+rMax(C):String(rMax(C)))))}

/* ---------- підказки ----------
   tasks.hints=[{id,t}], tasks.hmode: 'teacher' (відкриває вчитель) | 'self' (учень може відкрити сам), tasks.hr={id:true} — відкрито всім;
   works.hu={id:true} — вчитель дав особисто, works.hs={id:час} — учень відкрив сам */
const hlist=t=>t&&t.hints?Object.values(t.hints).filter(x=>x&&x.id&&String(x.t||'').trim()):[];
const hWho=(t,w,h)=>t&&t.hr&&t.hr[h.id]?'all':w&&w.hu&&w.hu[h.id]?'me':w&&w.hs&&w.hs[h.id]?'self':'';
/* ---------- варіанти ----------
   tasks.vars=[{id,x: текст варіанта, tests?: тести Python для цього варіанта}], tasks.vmode: 'list' (за списком класу по черзі) | 'rand' (випадково, сталий для учня), tasks.va={id учня: id варіанта} — вручну */
const vlist=t=>t&&t.vars?Object.values(t.vars).filter(x=>x&&x.id&&String(x.x||'').trim()):[];
const hstr=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0}return h};
const varOf=(t,roster,sid,tid)=>{const V=vlist(t);if(!V.length)return null;const m=t.va&&t.va[sid];if(m){const v=V.find(x=>x.id===m);if(v)return v}
  if(t.vmode==='rand')return V[hstr(sid+'|'+(tid||''))%V.length];
  const ids=Object.values(roster||{}).filter(r=>r&&r.fn!=null).sort(byName).map(r=>slug(r.fn+' '+r.ln)),k=ids.indexOf(sid);return V[(k<0?hstr(sid):k)%V.length]};
const vNum=(t,v)=>v?vlist(t).findIndex(x=>x.id===v.id)+1:0;
const tTests=(t,v)=>v&&tlist(v).length?tlist(v):tlist(t);
