/* Клас-код · сторінка учня: вхід за кодом і робота над завданням
   Звичайний скрипт (не модуль): усі файли js/ мають спільну глобальну область видимості; порядок підключення — в index.html. */
/* ---------------- УЧЕНЬ: вхід ---------------- */
function homeS(){
  const code=el('input',{placeholder:'Код завдання (від вчителя)',maxlength:8,style:'text-transform:uppercase',value:U(new URLSearchParams(location.search).get('c')||'')});
  const sel=el('select',{style:'display:none'}),who=el('select'),info=el('div',{class:'mu'}),note=el('div',{class:'mu'});let off=()=>{},T=null,CM={},msg='';
  /* fixed — клас задано в завданні; wait — вчитель ще не вибрав клас; legacy — старе завдання без класу (лишився вибір класу) */
  const mode=()=>!T?'none':T.task.cls?'fixed':(T.task.status==='draft'?'wait':'legacy');
  const curCls=()=>{const m=mode();return m==='fixed'?T.task.cls:m==='legacy'?sel.value:''};
  const fill=(v,ph)=>{const k=sel.value;sel.textContent='';sel.append(el('option',{value:''},ph));Object.keys(v).sort((a,b)=>v[a].name.localeCompare(v[b].name,'uk',{numeric:true})).forEach(i=>sel.append(el('option',{value:i},v[i].name)));sel.value=k;if(sel.value!==k)sel.value=''};
  const rosterOf=()=>{const c=CM[curCls()];return c&&c.roster&&Object.keys(c.roster).length?c.roster:null};
  const setInfo=()=>{const t=T&&T.task;info.textContent=t?'📝 '+t.title+(t.cls&&CM[t.cls]?' · 🏫 '+CM[t.cls].name:'')+(t.status==='finished'?' (завершено)':t.status==='draft'?' (ще не розпочато)':''):msg};
  const sync=()=>{const m=mode(),R=rosterOf(),k=who.value;who.textContent='';sel.style.display=m==='legacy'?'':'none';
    const ph=t=>{who.append(el('option',{value:''},t));who.disabled=true};
    if(m==='none'){ph('— спочатку введіть код завдання —');note.textContent='';return}
    if(m==='wait'){ph('— клас ще не вибрано —');note.textContent='Вчитель ще не вибрав клас для цього завдання. Зачекайте: список з’явиться сам.';return}
    if(m==='legacy'&&!sel.value){ph('— спочатку оберіть клас —');note.textContent='';return}
    if(!CM[curCls()]){ph('— клас не знайдено —');note.textContent='Клас цього завдання не знайдено. Зверніться до вчителя.';return}
    if(!R){ph('— списку класу немає —');note.textContent='Для цього класу вчитель ще не створив список учнів. Зверніться до вчителя.';return}
    who.disabled=false;note.textContent='';who.append(el('option',{value:''},'— оберіть себе зі списку —'));
    Object.keys(R).sort((a,b)=>byName(R[a],R[b])).forEach(i=>who.append(el('option',{value:i},R[i].ln+' '+R[i].fn)));who.value=k;if(who.value!==k)who.value=''};
  sel.onchange=sync;
  const load=async()=>{off();off=()=>{};T=null;CM={};msg='';fill({},'— оберіть клас —');sync();setInfo();const c=U(code.value);if(c.length<5)return;
    const s=await db.ref('codes/'+c).once('value');if(U(code.value)!==c)return;const v=s.val();if(!v){msg='Код не знайдено';setInfo();return}
    const tr=db.ref('tasks/'+v.o+'/'+v.t),cr=db.ref('classes/'+v.o);
    const f1=x=>{const t=x.val();T=t?{...v,task:t}:null;msg=t?'':'Завдання не знайдено';setInfo();sync()};
    const f2=x=>{const m=x.val()||{};CM=m;fill(m,Object.keys(m).length?'— оберіть клас —':'Класів поки немає');setInfo();sync()};
    tr.on('value',f1);cr.on('value',f2);off=()=>{tr.off('value',f1);cr.off('value',f2)}};
  code.oninput=load;load();
  const go=async()=>{if(!T)return alert('Спочатку введіть правильний код завдання');
    if(T.task&&T.task.wrn&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});
    if(mode()==='wait')return alert('Вчитель ще не вибрав клас для цього завдання. Зачекайте.');
    const cid=curCls();if(!cid)return alert('Оберіть клас');
    const R=rosterOf();if(!R)return alert('Для цього класу вчитель ще не створив список учнів. Зверніться до вчителя.');
    const r=R[who.value];if(!r)return alert('Оберіть себе зі списку класу');const F1=r.fn,L1=r.ln;
    let w;try{if(!AU.currentUser)await AU.signInAnonymously();MYUID=AU.currentUser.uid;w=await db.ref('works/'+T.t+'/'+slug(F1+' '+L1)).once('value')}
    catch(e){return alert(e.code==='auth/operation-not-allowed'||e.code==='auth/admin-restricted-operation'?'Вхід для учнів не налаштовано: у Firebase увімкніть Authentication → Sign-in method → Anonymous.':'Не вдалося підключитись. Можливо, цей учень зараз працює на іншому пристрої: закрийте там вкладку або зверніться до вчителя.')}
    if(T.task.status==='finished'&&!w.exists())return alert('Це завдання вже завершено вчителем');
    if(T.task.endsAt&&!w.exists()){const o=(await db.ref('.info/serverTimeOffset').once('value')).val()||0;if(Date.now()+o>=T.task.endsAt)return alert('Час виконання цього завдання вже вийшов')}
    const X=T;off();student(X.o,X.t,F1,L1,cid,(CM[cid]||{}).name||'',X.task.ttype||'web',!!X.task.pyk)};
  $app.append(el('div',{class:'box'},el('h2',{style:'margin:0'},'💻 Клас-код'),code,info,sel,who,note,el('button',{onclick:go},'Підключитися'),
    el('div',{class:'mu'},'Оберіть себе зі списку: ваша робота збережеться й відновиться після перезавантаження.')))}

/* ---------------- УЧЕНЬ: робота ---------------- */
function student(o,t,fn,ln,cid,cname,ttype,gui){
  const id=slug(fn+' '+ln),ref=db.ref('works/'+t+'/'+id),conn=db.ref('.info/connected'),tref=db.ref('tasks/'+o+'/'+t);
  const PY=ttype==='py',GUI=PY&&!!gui,MAIN=PY?'main.py':'index.html';
  let F={[MAIN]:''},cur=MAIN,dirty=new Set(),timer,st='work',W={},tk,gen0,had=false,gone=false,off=0,expSeen=false,aw=0,am=0,awayAt=0,counted=false;
  clear();
  let IMG=null;
  const status=el('span',{class:'mu'},'…'),task=el('div',{class:'banner'}),imgH=el('div',{class:'timgbox',style:'display:none'}),tbox=el('div',{class:'tbox'},task,imgH),imRef=db.ref('timg/'+o+'/'+t),res=el('div',{class:'banner',style:'display:none'}),sb=el('button',{class:'g',onclick:()=>submit()},'✅ Здати роботу');
  const pv=frame('full'),con=el('div',{class:'con'}),ac=el('input',{type:'checkbox',style:'width:auto'});ac.checked=true;
  let loaded=false,ini=false,warmed=false;const tm=el('b',{class:'tmr',style:'display:none'}),sn=()=>Date.now()+off,isExp=()=>!!(tk&&tk.status==='active'&&tk.endsAt&&sn()>=tk.endsAt);
  const runWeb=()=>{F[cur]=ed.get();con.textContent='';pv.srcdoc=buildDoc(bundle(F))};
  const py=PY?mkPy({files:()=>{F[cur]=ed.get();return F},libs:()=>pyLibs(tk),main:()=>MAIN,gui:()=>GUI,onDone:r=>{ref.update({out:String(r.out||'').slice(0,3000)}).catch(()=>{})}}):null;
  const runManual=()=>PY?py.run():runWeb(),refresh=()=>{if(!PY)runWeb()};
  /* автоперевірка тестами (лише Python без tkinter): результат бачить учень, а вчитель — підсумок на картці */
  const tres=el('div',{class:'tres',style:'display:none'});let tRun=false,tEng=null;
  const tb=el('button',{class:'g',style:'display:none',onclick:()=>doTests(false)},'🧪 Перевірити');
  const tAvail=()=>PY&&!GUI&&tlist(tk).length>0;
  const doTests=async auto=>{if(tRun||!tAvail())return;const T=tlist(tk);tRun=true;tb.disabled=true;F[cur]=ed.get();
    tres.style.display='';tres.textContent='';const ln=el('div',{class:'mu'},'🧪 Готую перевірку…');tres.append(ln);
    if(!tEng)tEng=testEngine();const r=await runTests({eng:tEng,files:{...F},libs:pyLibs(tk),main:MAIN,tests:T,mode:tk.tmode||'exact',limit:tk.tlim||5,onStatus:m=>{ln.textContent='⏳ '+m},onProgress:(a,b)=>{ln.textContent='🧪 Перевірено тестів: '+a+' з '+b+'…'}});
    tRun=false;tb.disabled=false;tres.textContent='';
    const x=el('button',{class:'g',style:'float:right;padding:2px 8px',title:'Сховати результати',onclick:()=>{tres.style.display='none'}},'✕');
    if(r.fatal){tres.append(x,el('div',{class:'banner rt',style:'margin:0'},'Не вдалося запустити Python для перевірки: '+r.fatal));return}
    const p=tPassed(r),n=T.length;
    tres.append(x,el('div',{class:'banner '+(p===n?'ok':'rt'),style:'margin:0 0 8px'},(p===n?'✅ Усі тести пройдено: ':'🧪 Пройдено тестів: ')+p+' з '+n+(auto?' (перевірка під час здачі)':'')),testView(T,r.results,false));
    ref.update({ts:{p,n,at:Date.now(),a:!!auto}}).catch(()=>{})};
  const ed=mkEditor(true,()=>runManual());
  const hb=el('button',{class:'g',onclick:()=>ref.update({help:W.help?null:firebase.database.ServerValue.TIMESTAMP})},'✋ Потрібна допомога');
  const awb=el('div',{class:'banner rt',style:'display:none'}),lb=el('div',{class:'banner rt',style:'display:none'}),ctl=el('span',{class:'mu'}),
    fsb=el('button',{class:'g',style:'display:none',onclick:()=>{if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{})}},'⛶ На весь екран');
  const chat=mkChat(ref,'s');let chatOpen=false;
  const cbd=el('span',{class:'cnt',style:'display:none'}),cbtn=el('button',{class:'g'},'💬 Чат',cbd);
  const bdg=()=>{const n=chatOpen?0:unreadOf(W,'s');cbd.textContent=n;cbd.style.display=n?'':'none'};
  const tog=v=>{chatOpen=v;cw.style.display=v?'flex':'none';chat.show(v);bdg()};
  cbtn.onclick=()=>tog(!chatOpen);
  const cw=el('div',{class:'chatwin',style:'display:none'},el('div',{class:'tabs',style:'justify-content:space-between'},el('b',{},'💬 Чат з учителем'),el('button',{class:'g',onclick:()=>tog(false)},'✕')),chat.el);
  const meta=()=>({n:fn+' '+ln,fn,ln,cls:cid,cn:cname});
  /* Код учня — окремо в code/{завдання}/{учень}: вчитель не отримує файли всіх учнів при кожному збереженні. Якщо правила бази ще старі — пишемо як раніше, у works. */
  const kref=db.ref('code/'+t+'/'+id);let kOK=true,lastSave=0,stimer=null;
  const kput=c=>{if(!Object.keys(c).length)return;if(!kOK){ref.update(c).catch(()=>{});return}kref.update(c).catch(()=>{kOK=false;ref.update(c).catch(()=>{})})};
  const pay=all=>{const u={upd:Date.now()},c={};if(all)Object.assign(u,meta());(all?Object.keys(F):[...dirty]).forEach(n=>{c['files/'+fk(n)+'/n']=n;c['files/'+fk(n)+'/c']=F[n]});dirty.clear();kput(c);return u};
  const save=()=>{clearTimeout(stimer);stimer=null;lastSave=Date.now();status.textContent='зберігаю…';ref.update(pay(false)).then(()=>status.textContent='✓ збережено')};
  const edit=()=>{F[cur]=ed.get();dirty.add(cur);clearTimeout(timer);timer=setTimeout(()=>{if(!PY&&ac.checked)runWeb()},900);
    clearTimeout(stimer);if(Date.now()-lastSave>10000&&lastSave)stimer=setTimeout(save,300);else stimer=setTimeout(save,2000)};
  const vflush=()=>{if(document.hidden&&dirty.size&&loaded)save()};document.addEventListener('visibilitychange',vflush);
  ed.on(edit);
  let psC=0,psZ=0,psN=0;const psCopy=[],psNrm=x=>String(x||'').replace(/\r\n?/g,'\n').trim();
  ed.onCopy(x=>{const v=psNrm(x);if(v){psCopy.push(v);if(psCopy.length>40)psCopy.shift()}});
  ed.onIns((x,k)=>{if(!(tk&&tk.pst&&tk.status==='active'&&!isExp()&&st!=='submitted'&&st!=='checked'))return false;const v=psNrm(x);
    if(v.length<(tk.psn||20))return false;if(psCopy.some(c=>c.includes(v)))return false;if(tk.text&&psNrm(tk.text).includes(v))return false;
    if(Object.values(F).some(c=>typeof c==='string'&&c.includes(v))&&k!=='type')return false;
    const blk=!!tk.pstb&&k!=='type';psC++;psZ+=v.length;ref.update({pc:psC,pz:psZ}).catch(()=>{});
    if(psN<100){psN++;ref.child('pl').push({at:Date.now(),n:v.length,f:cur,k,b:blk,x:v.slice(0,1500)}).catch(()=>{})}
    awb.textContent=blk?'⛔ Вставляти готовий код з інших джерел у цьому завданні заборонено. Спробу зафіксовано, вчитель її бачить. Пишіть код самостійно.':'📋 Вставку готового фрагмента коду зафіксовано, вчитель її бачить. Пишіть код самостійно.';
    awb.style.display='';clearTimeout(awb._t);awb._t=setTimeout(()=>{awb.style.display='none'},12000);return blk});
  /* --- файли --- */
  const fbar=el('div',{class:'tabs'}),tpl=el('button',{class:'g',onclick:()=>{if(ed.locked()||cur!==MAIN)return;if(ed.get().trim()&&!confirm('Замінити поточний код шаблоном?'))return;ed.sync(cur,(tk&&tk.tplCode)||(PY?PYTPL:TPLDOC));edit()}},'📄 Шаблон'),
    rb=el('button',{class:'g',onclick:()=>runManual()},'▶ Запустити');
  const drawF=()=>{fbar.textContent='';Object.keys(F).sort(ordF).forEach(n=>fbar.append(el('button',{class:n===cur?'on':'g',onclick:()=>openF(n)},n)));
    if(exts().length)fbar.append(el('button',{class:'g',title:'Створити файл',onclick:addF},'＋ Файл'));
    if(cur!==MAIN){if(exts().length)fbar.append(el('button',{class:'g',title:'Перейменувати',onclick:renF},'✎'));fbar.append(el('button',{class:'g',title:'Видалити файл',onclick:delF},'🗑'))}
    tpl.style.display=cur===MAIN&&tk&&tk.tplOn?'':'none'};
  const openF=n=>{F[cur]=ed.get();cur=n;ed.show(n);drawF()};
  const exts=()=>PY?(tk&&tk.pyf?['py','txt','csv','json']:[]):[...(!tk||tk.fcss!==false?['css']:[]),...(!tk||tk.fjs!==false?['js']:[])];
  const okN=n=>{const m=n.match(/^[\p{L}\p{N}_-]+\.([a-z]+)$/iu);return !!m&&exts().includes(m[1].toLowerCase())&&(!PY||m[1].toLowerCase()!=='py'||/^[\p{L}_][\p{L}\p{N}_]*\.py$/iu.test(n))},dup=(n,ex)=>Object.keys(F).some(k=>k!==ex&&k.toLowerCase()===n.toLowerCase());
  const BAD=()=>'Назва: літери, цифри, _ або -; розширення: '+exts().map(e=>'.'+e).join(' або ')+'. Папки не підтримуються.'+(PY?' Назви модулів .py мають бути як ідентифікатори Python (без дефіса).':'');
  const addF=()=>{if(ed.locked())return;const raw=prompt(PY?'Назва файлу (наприклад, helper.py або data.csv):':'Назва файлу (наприклад, style.css або script.js):');if(raw==null)return;const n=raw.trim();
    if(!okN(n))return alert(BAD());if(dup(n))return alert('Файл з такою назвою вже є');if(Object.keys(F).length>=20)return alert('Забагато файлів (максимум 20)');
    F[cur]=ed.get();F[n]='';ed.sync(n,'');cur=n;ed.show(n);dirty.add(n);drawF();save()};
  const renF=()=>{if(ed.locked()||cur===MAIN)return;const raw=prompt('Нова назва файлу:',cur);if(raw==null)return;const n=raw.trim();if(n===cur)return;
    if(!okN(n))return alert(BAD());if(dup(n,cur))return alert('Файл з такою назвою вже є');
    F[cur]=ed.get();const o=cur;F[n]=F[o];delete F[o];dirty.delete(o);ed.ren(o,n);cur=n;
    const u=pay(false);kput({['files/'+fk(o)]:null,['files/'+fk(n)+'/n']:n,['files/'+fk(n)+'/c']:F[n]});ref.update(u);drawF();refresh()};
  const delF=()=>{if(ed.locked()||cur===MAIN)return;if(!confirm('Видалити файл '+cur+'?'))return;const n=cur;
    delete F[n];dirty.delete(n);ed.drop(n);cur=MAIN;ed.show(cur);kput({['files/'+fk(n)]:null});ref.update({upd:Date.now()});drawF();refresh()};
  const onMsg=e=>{if(e.source!==pv.contentWindow||!e.data||e.data.k!=='log')return;con.append(el('div',{class:e.data.t},'› '+e.data.m));con.scrollTop=1e9};
  addEventListener('message',onMsg);
  const paint=()=>{const exp=isExp(),act=tk&&tk.status==='active'&&!exp,fin=tk&&tk.status==='finished';tb.style.display=tAvail()?'':'none';tb.textContent='🧪 Перевірити ('+tlist(tk).length+' тест.)';
    task.className='banner'+(fin?' rt':'');if(imgH._s!==IMG){imgH._s=IMG;imgH.textContent='';if(IMG)imgH.append(imgThumb(IMG))}imgH.style.display=act&&IMG?'':'none';
    task.textContent=tk===undefined?'⏳ Завантаження…':!tk?'Завдання не знайдено або видалене.':exp?'⏱ Час вийшов. Роботу здано автоматично. Очікуйте завершення завдання вчителем.':act?'📝 '+tk.title+(tk.text?'\n'+tk.text:''):fin?'⏹ Завдання «'+tk.title+'» завершено вчителем. Вашу роботу збережено.':'⏳ Завдання «'+tk.title+'» ще не розпочато. Очікуйте, поки вчитель відправить його.';
    const T={submitted:[W.auto?'📥 Роботу здано автоматично після завершення завдання. Очікуйте перевірки.':'📥 Роботу здано. Очікуйте перевірки.',''],checked:['✅ Вчитель перевірив вашу роботу'+(W.grade?'. Оцінка: '+W.grade:'')+(W.fb?'\n'+W.fb:''),'ok'],returned:['↩ Роботу повернено на доопрацювання'+(W.fb?':\n'+W.fb:''),'rt']}[st];
    res.style.display=T?'':'none';if(T){res.textContent=T[0];res.className='banner '+T[1]}
    const lckd=!!(tk&&tk.lck&&W.lk&&act);ed.ro(!act||st==='submitted'||st==='checked'||lckd);
    lb.style.display=lckd?'':'none';lb.textContent='🔒 Редактор заблоковано, бо ви залишили сторінку. Попросіть вчителя розблокувати (кнопка «✋ Потрібна допомога»).';
    ctl.textContent=[tk&&(tk.trk||tk.wrn||tk.lck)?'👁 Контроль виходів зі сторінки':'',tk&&tk.pst?(tk.pstb?'⛔ Вставка коду з інших джерел заборонена':'📋 Контроль вставки коду'):''].filter(Boolean).join(' · ');fsb.style.display=tk&&tk.wrn?'':'none';
    sb.textContent=st==='submitted'?'↩ Скасувати здачу':'✅ Здати роботу';sb.disabled=!act||st==='checked';hb.textContent=W.help?'✋ Скасувати виклик':'✋ Потрібна допомога';hb.className=W.help?'on':'g';hb.disabled=!act||st==='checked';
    rb.disabled=PY&&!(tk&&tk.status!=='draft');if(PY&&tk&&!warmed){warmed=true;py.warm()}
    if(loaded&&act&&tk.tplOn&&!ini&&F[MAIN]===''){ini=true;F[MAIN]=tk.tplCode||(PY?PYTPL:TPLDOC);ed.sync(MAIN,F[MAIN]);dirty.add(MAIN);const u=pay(false);u.ini=true;ref.update(u);refresh()}
    drawF()};
  const GONE='Вашу роботу видалено вчителем, або завдання задано заново. Сеанс завершено — за потреби підключіться знову за актуальним кодом.';
  const onVal=s=>{const v=s.val();if(v)had=true;else if(had)return bye(GONE);W=v||{};if(W.ini)ini=true;aw=Math.max(aw,W.aw||0);am=Math.max(am,W.am||0);psC=Math.max(psC,W.pc||0);psZ=Math.max(psZ,W.pz||0);psN=Math.max(psN,Object.keys(W.pl||{}).length);st=W.st||'work';chat.update(W);bdg();paint()};
  const onIm=s=>{IMG=s.val()||null;paint()};
  const onTask=s=>{tk=s.val();if(tk&&(tk.ttype||'web')!==(PY?'py':'web'))return bye('Тип завдання змінено вчителем. Підключіться знову.');if(tk&&PY&&!!tk.pyk!==GUI)return bye('Налаштування завдання змінено вчителем. Підключіться знову.');if(tk&&tk.cls&&tk.cls!==cid)return bye('Клас завдання змінено вчителем. Підключіться знову.');if(tk){const g=tk.gen||0;if(gen0===undefined)gen0=g;else if(g!==gen0)return bye(GONE)}paint()};
  const submit=()=>{if(!tk||tk.status!=='active'||isExp())return;
    if(st==='submitted'){if(confirm('Скасувати здачу й продовжити роботу?'))ref.update({st:'work',auto:null});return}
    if(st==='checked'||!confirm('Здати роботу вчителю? Після здачі редагування буде заблоковано.'))return;
    clearTimeout(timer);refresh();ref.update({...pay(true),st:'submitted',sub:Date.now(),auto:null});if(tAvail())doTests(true)};
  const leave=()=>{unwatch();if(py)py.dispose();clearInterval(tick);offRef.off('value',offFn);clearTimeout(timer);F[cur]=ed.get();conn.off();tref.off('value',onTask);imRef.off('value',onIm);ref.off('value',onVal);removeEventListener('message',onMsg);document.removeEventListener('visibilitychange',vflush);if(tEng){tEng.dispose();tEng=null}clearTimeout(stimer);
    ref.child('on').onDisconnect().cancel();ref.child('help').onDisconnect().cancel();ref.update({...pay(true),on:false,help:null});home()};
  const offRef=db.ref('.info/serverTimeOffset'),offFn=s=>{off=s.val()||0};offRef.on('value',offFn);
  const tick=setInterval(()=>{if(!tk||tk.status!=='active'||!tk.endsAt){tm.style.display='none';expSeen=false;return}
    const r=tk.endsAt-sn();tm.style.display='';
    if(r<=0){tm.textContent='⏱ 0:00';tm.className='tmr low';
      if(!expSeen){expSeen=true;if(st!=='submitted'&&st!=='checked'){clearTimeout(timer);refresh();ref.update({...pay(true),st:'submitted',sub:sn(),auto:true})}paint()}return}
    if(expSeen){expSeen=false;paint()}
    tm.textContent='⏱ '+fmtT(r);tm.className='tmr'+(r<=60000?' low':'')},1000);
  const bye=msg=>{if(gone)return;gone=true;unwatch();if(py)py.dispose();clearInterval(tick);offRef.off('value',offFn);clearTimeout(timer);conn.off();tref.off('value',onTask);imRef.off('value',onIm);ref.off('value',onVal);removeEventListener('message',onMsg);document.removeEventListener('visibilitychange',vflush);if(tEng){tEng.dispose();tEng=null}clearTimeout(stimer);
    ref.child('on').onDisconnect().cancel();home();setTimeout(()=>alert(msg),50)};
  /* --- контроль виходів зі сторінки (за налаштуваннями завдання) --- */
  const watch=()=>!!(loaded&&tk&&tk.status==='active'&&!isExp()&&(tk.trk||tk.wrn||tk.lck)&&st!=='submitted'&&st!=='checked');
  const check=()=>{if(gone)return;if(!watch()){awayAt=0;counted=false;return}
    const away=document.hidden||!document.hasFocus();
    if(away){if(!awayAt){awayAt=Date.now();setTimeout(check,1600)}
      else if(!counted&&Date.now()-awayAt>=1500){counted=true;aw++;const u={aw};if(tk.lck)u.lk=true;ref.update(u).catch(()=>{});paint()}}
    else if(awayAt){if(counted){am+=Date.now()-awayAt;ref.update({am}).catch(()=>{});
        if(tk.wrn){awb.textContent='⚠ Ви залишили сторінку ('+aw+'-й раз, разом '+fmtDur(am)+'). Вихід зафіксовано, вчитель його бачить.';awb.style.display='';clearTimeout(awb._t);awb._t=setTimeout(()=>{awb.style.display='none'},12000)}}
      awayAt=0;counted=false}};
  const wtick=setInterval(check,500);addEventListener('blur',check);addEventListener('focus',check);document.addEventListener('visibilitychange',check);
  const unwatch=()=>{clearInterval(wtick);removeEventListener('blur',check);removeEventListener('focus',check);document.removeEventListener('visibilitychange',check)};
  $app.append(el('header',{},el('b',{},'👤 '+fn+' '+ln),el('span',{class:'mu'},'🏫 '+cname),tm,ctl,status,fsb,hb,cbtn,sb,el('button',{class:'g',onclick:leave},'Вийти')),tbox,awb,lb,res,
    el('div',{class:'ws'},el('div',{class:'pane'},fbar,el('div',{class:'tabs'},tpl,rb,...(PY?[el('button',{class:'g',onclick:()=>py.stop()},'⏹ Зупинити'),tb,el('span',{class:'mu'},'Ctrl+Enter — запуск')]:[el('label',{class:'mu'},ac,' автооновлення')])),ed.host),el('div',{class:'pane'},...(PY?[py.el,tres]:[pv,con]))),cw);
  const DUP='Цю роботу зараз відкрито на іншому пристрої, або доступ закрито. Сеанс завершено.';
  const start=()=>{ref.once('value').then(async s=>{const v=s.val();let k=null;try{k=(await kref.once('value')).val()}catch(e){kOK=false}
      if(k&&k.files)F=filesOf(k,MAIN);else if(v)F=filesOf(v,MAIN);if(v&&v.ini)ini=true;
      Object.keys(F).forEach(n=>ed.sync(n,F[n]));cur=MAIN;ed.show(cur);drawF();refresh();
      const u=pay(true);if(v)u.upd=v.upd||u.upd;ref.update(u);loaded=true;paint();
      if(kOK&&v&&v.files)kref.once('value').then(x=>{if(x.val()&&x.val().files)ref.child('files').remove().catch(()=>{})}).catch(()=>{});
      conn.on('value',c=>{if(c.val()){ref.child('on').onDisconnect().set(false);ref.child('help').onDisconnect().remove();ref.child('on').set(true)}})}).catch(()=>bye(DUP));
    tref.on('value',onTask);imRef.on('value',onIm,()=>{});ref.on('value',onVal,()=>bye(DUP))};
  ref.child('u').set(MYUID).then(start,()=>bye(DUP));paint();drawF();
}
