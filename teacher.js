/* Клас-код · кабінет вчителя: вхід, завдання, картки учнів, перевірка, журнал
   Звичайний скрипт (не модуль): усі файли js/ мають спільну глобальну область видимості; порядок підключення — в index.html. */
/* ---------------- ВЧИТЕЛЬ: вхід / реєстрація ---------------- */
function homeT(){
  let busy=false;
  const LOGIN_OK=/^[a-z0-9_-]{3,24}$/,MAIL_OK=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  $app.append(el('div',{class:'mu',style:'padding:24px'},'Завантаження…'));
  AU.onAuthStateChanged(async u=>{if(busy)return;if(!u||u.isAnonymous)return authScreen();
    const p=(await db.ref('teachers/'+u.uid).once('value')).val()||{login:(u.email||'').split('@')[0]};cabinet(u.uid,p)});
  const doLogin=async(id,pw)=>{let cands=[];
    if(id.includes('@'))cands=[id];
    else{try{const m=(await db.ref('logins/'+id).once('value')).val();if(m&&m.e)cands.push(m.e)}catch(e){}cands.push(id+EM)}
    let last;for(const e of cands){try{return await AU.signInWithEmailAndPassword(e,pw)}catch(x){last=x;if(!['auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/invalid-email'].includes(x.code))throw x}}
    throw last};
  function authScreen(){let mode='in';
    const draw=()=>{clear();
      const f={},mk=(k,ph,ty,ac)=>f[k]=el('input',{placeholder:ph,type:ty||'text',autocomplete:ac||'off'});
      const err=el('div',{class:'err'}),ok=el('div',{class:'banner ok',style:'display:none;margin:0'});let go;
      const box=el('div',{class:'box'},el('h2',{style:'margin:0'},'🧑‍🏫 Кабінет вчителя'));
      if(mode!=='reset')box.append(el('div',{class:'row'},el('button',{class:mode==='in'?'on':'g',onclick:()=>{mode='in';draw()}},'Вхід'),el('button',{class:mode==='up'?'on':'g',onclick:()=>{mode='up';draw()}},'Реєстрація')));
      if(mode==='in'){
        box.append(mk('lg','Логін або пошта','text','username'),mk('pw','Пароль','password','current-password'),err);
        go=async()=>{err.textContent='';const id=f.lg.value.trim().toLowerCase(),pw=f.pw.value;if(!id||!pw)return void(err.textContent='Введіть логін (або пошту) і пароль');
          try{await doLogin(id,pw)}catch(e){err.textContent=AE(e)}};
        box.append(el('button',{onclick:go},'Увійти'),el('button',{class:'g',onclick:()=>{mode='reset';draw()}},'Забули пароль?'));f.pw.onkeydown=e=>{if(e.key==='Enter')go()};
      }else if(mode==='up'){
        box.append(mk('fn',"Ім’я"),mk('mn','По батькові'),mk('ln','Прізвище'),mk('em','Пошта (для відновлення пароля)','email','email'),mk('lg','Логін (латиницею)','text','username'),mk('pw','Пароль (мінімум 6 символів)','password','new-password'),err);
        go=async()=>{err.textContent='';const first=f.fn.value.trim(),middle=f.mn.value.trim(),last=f.ln.value.trim(),email=f.em.value.trim().toLowerCase(),login=f.lg.value.trim().toLowerCase(),pw=f.pw.value;
          if(!first||!middle||!last)return void(err.textContent="Заповніть ім’я, по батькові та прізвище");
          if(!MAIL_OK.test(email))return void(err.textContent='Введіть дійсну пошту: на неї прийде лист для відновлення пароля');
          if(!LOGIN_OK.test(login))return void(err.textContent='Логін: 3–24 символи, латиниця, цифри, _ або -');
          if(pw.length<6)return void(err.textContent='Пароль: мінімум 6 символів');
          try{
            if((await db.ref('logins/'+login).once('value')).exists())return void(err.textContent='Такий логін уже зайнятий');
            busy=true;const c=await AU.createUserWithEmailAndPassword(email,pw),uid=c.user.uid;
            try{await db.ref('logins/'+login).set({o:uid,e:email})}catch(e){await c.user.delete().catch(()=>{});busy=false;return void(err.textContent='Такий логін уже зайнятий')}
            const prof={first,middle,last,login,email,created:Date.now()};await db.ref('teachers/'+uid).set(prof).catch(()=>{});
            c.user.sendEmailVerification().catch(()=>{});busy=false;cabinet(uid,prof)
          }catch(e){busy=false;err.textContent=AE(e)}};
        box.append(el('button',{onclick:go},'Зареєструватися'),el('div',{class:'mu'},'Після реєстрації надійде лист для підтвердження пошти.'));f.pw.onkeydown=e=>{if(e.key==='Enter')go()};
      }else{
        box.append(el('h3',{style:'margin:0'},'Відновлення пароля'),mk('rid','Логін або пошта','text','username'),err,ok);
        go=async()=>{err.textContent='';const id=f.rid.value.trim().toLowerCase();if(!id)return void(err.textContent='Введіть логін або пошту');
          let email=null;if(id.includes('@'))email=id;else{try{const m=(await db.ref('logins/'+id).once('value')).val();if(m&&m.e)email=m.e}catch(e){}}
          try{if(email)await AU.sendPasswordResetEmail(email)}catch(e){if(e.code==='auth/invalid-email')return void(err.textContent=AE(e))}
          ok.style.display='';ok.textContent='Якщо до цього облікового запису прив’язано пошту, лист із посиланням для нового пароля вже надіслано. Перевірте також «Спам». Посилання діє обмежений час.'};
        box.append(el('button',{onclick:go},'Надіслати лист'),el('button',{class:'g',onclick:()=>{mode='in';draw()}},'← Назад до входу'),
          el('div',{class:'mu'},'Акаунти без прив’язаної пошти (створені раніше) відновити не можна: зареєструйтеся заново або зверніться до адміністратора.'));f.rid.onkeydown=e=>{if(e.key==='Enter')go()};
      }
      $app.append(box)};
    draw()}
}

/* ---------------- ВЧИТЕЛЬ: кабінет ---------------- */
function cabinet(uid,prof){
  clear();
  /* Мініатюри коду: беремо code/{завдання}/{учень} разово й не частіше, ніж раз на tiv секунд; відкритий учень — наживо. */
  let CODE={},cfly=0,mref=null,mfn=null;const TIV=[10,30,60,0];let tiv=(()=>{try{const r=localStorage.getItem('kk_tiv'),v=r===null?NaN:+r;return TIV.includes(v)?v:30}catch(e){return 30}})();
  const mainF=()=>(T()&&T().ttype==='py')?'main.py':'index.html';
  const codeOf=(i,m)=>{const C=CODE[i];return C&&C.F?C.F:filesOf(data[i]||{},m||mainF())};
  const pull=i=>{const d=data[i],C=CODE[i];if(!d||!sel||cfly>=4)return;if(C&&C.busy)return;
    const need=!C||C.want||(!C.den&&C.u!==d.upd&&tiv>0&&Date.now()-C.at>=tiv*1000);if(!need)return;
    const s0=sel;cfly++;CODE[i]={...(C||{}),busy:true,want:false};
    db.ref('code/'+s0+'/'+i).once('value').then(x=>{const v=x.val();return{F:v&&v.files?filesOf(v,mainF()):null}},()=>({F:(C&&C.F)||null,den:true}))
      .then(r=>{cfly--;if(sel!==s0)return;CODE[i]={F:r.F,den:!!r.den,u:d.upd,at:Date.now(),v:((C&&C.v)||0)+1};render()})};
  const mOff=()=>{if(mref)mref.off('value',mfn);mref=null};
  const mOn=i=>{mOff();const s0=sel;mref=db.ref('code/'+s0+'/'+i);mfn=x=>{if(sel!==s0)return;const v=x.val(),C=CODE[i]||{};CODE[i]={F:v&&v.files?filesOf(v,mainF()):null,u:data[i]?data[i].upd:0,at:Date.now(),v:(C.v||0)+1};modal._cv=(modal._cv||0)+1;render()};
    mref.on('value',mfn,()=>{CODE[i]={...(CODE[i]||{}),den:true}})};
  setInterval(()=>{if(!sel||!showGrid())return;Object.keys(cards).forEach(i=>{if(vis(i)&&i!==open)pull(i)})},1500);
  const tsel=el('select',{style:'width:auto'});[[10,'кожні 10 с'],[30,'кожні 30 с'],[60,'щохвилини'],[0,'лише вручну']].forEach(([v,t])=>tsel.append(el('option',{value:v},t)));tsel.value=tiv;
  tsel.onchange=()=>{tiv=+tsel.value;try{localStorage.setItem('kk_tiv',tiv)}catch(e){}};
  const tctl=el('div',{class:'row',style:'padding:0 16px;align-items:center;gap:8px;flex-wrap:wrap;display:none'},el('span',{class:'mu',style:'flex:0 0 auto'},'🔄 Оновлення мініатюр коду:'),tsel,
    el('button',{class:'g',style:'flex:0 0 auto',onclick:()=>Object.keys(cards).forEach(i=>{CODE[i]={...(CODE[i]||{}),want:true}})},'Оновити зараз'),
    el('span',{class:'mu',style:'flex:1 1 220px'},'Рідше — менше трафіку бази. Відкритий учень завжди оновлюється наживо.'));
  let tasks={},classes={},sel=null,creating=false,data={},open=null,cards={},cur='all',prev={},pc={},ph={},pl={},pw={},pp={},phs={},ready=false,quiet=0,wref=null,wfn=null,pkey='';
  const tref=db.ref('tasks/'+uid),cref=db.ref('classes/'+uid),wk=i=>db.ref('works/'+sel+'/'+i),base=location.href.split(/[?#]/)[0];
  const who=[prof.last,prof.first,prof.middle].filter(Boolean).join(' ')||prof.login||'Вчитель';
  const tbar=el('div',{class:'chips tbar'}),panel=el('div',{}),chips=el('div',{class:'chips'}),grid=el('div',{class:'grid'}),toasts=el('div',{class:'toasts'}),
    empty=el('div',{class:'mu',style:'padding:0 16px 16px'},'Поки що немає підключених учнів.'),modal=el('div',{class:'modal',style:'display:none'});
  let off=0;db.ref('.info/serverTimeOffset').on('value',s=>{off=s.val()||0});const tnow=()=>Date.now()+off;let fired='';
  const T=()=>tasks[sel]||null,cname=k=>(classes[k]&&classes[k].name)||'';
  const locked=()=>Object.values(tasks).some(t=>t.status==='active');
  const listed=()=>{const t=T();if(!t)return[];return Object.keys(data).filter(i=>data[i].n&&(t.status==='finished'||data[i].on||data[i].st==='submitted'))};
  const vis=i=>cur==='all'||data[i].cls===cur;
  const cardsVis={};
  const showGrid=()=>{const t=T();if(creating||!t)return false;const v=cardsVis[sel+'|'+t.status];return v!==undefined?v:t.status==='active'};
  const apply=()=>{let n=0;Object.keys(cards).forEach(i=>{const v=vis(i);cards[i].e.style.display=v?'':'none';if(v)n++});grid.style.display=showGrid()?'':'none';tctl.style.display=showGrid()?'flex':'none';empty.style.display=showGrid()&&!n?'':'none'};
  const copy=(s,b)=>{const o=b.textContent;(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>{b.textContent='✓ Скопійовано';setTimeout(()=>b.textContent=o,1500)},()=>prompt('Скопіюйте:',s))};
  /* --- завдання --- */
  const ICON={draft:'📝',active:'🟢',finished:'⏹'};
  const drawBar=()=>{tbar.textContent='';const lk=locked(),ks=Object.keys(tasks).sort((a,b)=>(tasks[b].created||0)-(tasks[a].created||0));
    const s=el('select',{style:'flex:1;min-width:230px;max-width:520px'});
    s.append(el('option',{value:''},ks.length?'Створити нове завдання або вибрати потрібне':'Завдань ще немає — натисніть «＋ Нове завдання»'));
    ks.forEach(k=>{const t=tasks[k],o=el('option',{value:k},ICON[t.status]+'  '+t.title);o.disabled=lk&&t.status!=='active';s.append(o)});
    s.value=creating?'':(sel||'');s.disabled=!ks.length;s.title=lk?'Перемикання заблоковане, доки є активне завдання':'';
    s.onchange=()=>{creating=false;select(s.value||null)};
    const nb=el('button',{class:creating?'on':'g',title:lk?'Спочатку завершіть активне завдання':''},'＋ Нове завдання');nb.disabled=lk;nb.onclick=()=>{prefill=null;creating=true;drawAll()};
    tbar.append(el('b',{},'Завдання:'),s,nb,el('span',{class:'mu',style:'margin-left:auto'},'📝 чернетка · 🟢 активне · ⏹ завершене'))};
  const mkCode=async t=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for(let k=0;k<15;k++){const c=Array.from({length:5},()=>A[Math.random()*A.length|0]).join('');const r=await db.ref('codes/'+c).transaction(v=>v?undefined:{o:uid,t});if(r.committed)return c}throw Error('code')};
  const create=async(title,text,btn,opts)=>{if(!title)return alert('Введіть назву завдання');btn.disabled=true;
    const r=tref.push();await r.set({title,text,status:'draft',created:Date.now(),...(opts||{})});try{['kk_ref_','kk_wref_'].forEach(p=>{const v=localStorage.getItem(p+'new');if(v)localStorage.setItem(p+r.key,v);localStorage.removeItem(p+'new')})}catch(e){}if(newImg)await db.ref('timg/'+uid+'/'+r.key).set(newImg).catch(()=>alert('Завдання створено, але зображення зберегти не вдалося: перевірте правила бази (розділ timg).'));newImg=null;await db.ref('owners/'+r.key).set(uid).catch(()=>{});creating=false;prefill=null;select(r.key);
    try{await r.update({code:await mkCode(r.key)})}catch(e){}};
  let prefill=null,prefillId=null,newImg=null;
  const dm=el('div',{class:'modal',style:'display:none'});
  const delTask=()=>{const t=T();if(!t||t.status==='active')return;const n=Object.keys(data).filter(i=>data[i].n).length;
    const doDel=async()=>{const id=sel,u={};u['tasks/'+uid+'/'+id]=null;u['timg/'+uid+'/'+id]=null;u['works/'+id]=null;u['owners/'+id]=null;if(t.code)u['codes/'+t.code]=null;
      try{await db.ref().update(u)}catch(e){return alert('Не вдалося видалити завдання: '+(e.message||e))}db.ref('code/'+id).remove().catch(()=>{});db.ref('hist/'+id).remove().catch(()=>{});dm.style.display='none'};
    if(!n){if(confirm('Видалити завдання «'+t.title+'»?'))doDel();return}
    dm.textContent='';
    const ck=el('input',{type:'checkbox',style:'width:auto;flex:none'}),go=el('button',{style:'background:#dc2626',onclick:doDel},'🗑 Видалити назавжди');go.disabled=true;
    ck.onchange=()=>{go.disabled=!ck.checked};
    dm.append(el('div',{style:'flex:none;margin:auto;width:min(580px,94vw)'},el('header',{},el('b',{},'🗑 Видалити завдання «'+t.title+'»?')),
      el('div',{class:'tp'},el('div',{},'Разом із завданням буде назавжди видалено роботи всіх учнів ('+n+'), їхні переписки й код доступу. Учнів, які ще на сторінці, буде відключено.'),
        el('div',{class:'banner rt',style:'margin:0'},'Збережіть результати у файл JSON, поки роботи ще є. Оцінки, внесені в «📒 Журнал», залишаться.'),
        el('button',{onclick:()=>{exp();ck.checked=true;go.disabled=false}},'⬇ Зберегти результати (JSON)'),
        el('label',{style:'display:flex;gap:8px;align-items:center'},ck,'Результати збережено (або вони мені не потрібні)'),
        el('div',{class:'row'},el('button',{class:'g',onclick:()=>{dm.style.display='none'}},'Скасувати'),go))));
    dm.style.display='flex'};
  const qm=el('div',{class:'modal',style:'display:none'});
  const closeQR=()=>{qm.style.display='none';qm.textContent=''};
  qm.onclick=e=>{if(e.target===qm)closeQR()};addEventListener('keydown',e=>{if(e.key==='Escape'&&qm.style.display!=='none')closeQR()});
  const openQR=t=>{const link=base+'?c='+t.code;qm.textContent='';
    const wrap=el('div',{class:'qrw'});let ok=false;
    try{if(typeof qrcode!=='function')throw 0;const q=qrcode(0,'M');q.addData(link);q.make();wrap.innerHTML=q.createSvgTag({cellSize:8,margin:4,scalable:true});ok=true}catch(e){}
    const cp=el('button',{class:'g'},'📋 Копіювати посилання');cp.onclick=()=>copy(link,cp);
    qm.append(el('div',{class:'qrb'},el('header',{},el('b',{},'📱 QR-код завдання «'+t.title+'»'),el('button',{class:'g',onclick:closeQR},'✕ Закрити')),
      el('div',{class:'tp',style:'justify-items:center;text-align:center'},
        ok?wrap:el('div',{class:'banner rt',style:'margin:0'},'Не вдалося створити QR-код. Скористайтеся посиланням нижче.'),
        el('div',{class:'code5',style:'flex:none'},t.code),el('div',{class:'mu',style:'word-break:break-all;user-select:all'},link),
        el('div',{class:'mu'},ok?'Учні наводять камеру телефона на код — посилання відкриється з уже підставленим кодом завдання.':''),
        t.status==='draft'?el('div',{class:'mu'},'Завдання ще не відправлено: учні, що підключаться зараз, побачать «Очікуйте», доки ви не натиснете «▶ Відправити учням».'):'',cp)));
    qm.style.display='flex'};
  const copyTask=()=>{const t=T();if(!t)return;prefill=t;prefillId=sel;newImg=null;try{['kk_ref_','kk_wref_'].forEach(p=>{const v=localStorage.getItem(p+sel);v?localStorage.setItem(p+'new',v):localStorage.removeItem(p+'new')})}catch(e){}creating=true;drawAll()};
  const finish=auto=>{const t0=T(),left=t0&&t0.endsAt?t0.endsAt-tnow():0;if(!auto&&!confirm('Завершити завдання для ВСІХ учнів одночасно'+(left>0?' (до кінця таймера ще '+fmtT(left)+')':'')+'?\nНездані роботи буде здано автоматично.'))return;
    const now=Date.now(),u={};quiet=now+5000;u['tasks/'+uid+'/'+sel+'/status']='finished';u['tasks/'+uid+'/'+sel+'/finished']=now;
    Object.keys(data).forEach(i=>{const s=data[i].st;if(data[i].n&&s!=='submitted'&&s!=='checked'){const p='works/'+sel+'/'+i+'/';u[p+'st']='submitted';u[p+'sub']=now;u[p+'auto']=true}});Object.keys(data).forEach(i=>{if(data[i].help)u['works/'+sel+'/'+i+'/help']=null});db.ref().update(u)};
  const delChecked=()=>{const ids=Object.keys(data).filter(i=>data[i].st==='checked');if(!ids.length)return;
    if(!confirm('Видалити '+ids.length+' оцінених робіт разом із перепискою? Це незворотно.\nЯкщо вони потрібні, спершу збережіть їх кнопкою «⬇ Роботи (JSON)».'))return;
    const u={},cu={};ids.forEach(i=>{u['works/'+sel+'/'+i]=null;cu['code/'+sel+'/'+i]=null;cu['hist/'+sel+'/'+i]=null});db.ref().update(u);db.ref().update(cu).catch(()=>{})};
  const again=async()=>{const t=T(),n=Object.keys(data).filter(i=>data[i].n).length;
    if(!confirm('Задати завдання «'+t.title+'» знову?\n'+(n?'Усі роботи цього завдання ('+n+') буде видалено, а учнів, які ще на сторінці, буде відключено.\nЯкщо роботи потрібні, спершу збережіть їх кнопкою «⬇ Роботи (JSON)».\n':'')+'Завдання повернеться до чернеток із НОВИМ кодом.'))return;
    try{const c=await mkCode(sel),u={},p='tasks/'+uid+'/'+sel+'/';u[p+'status']='draft';u[p+'code']=c;u[p+'finished']=null;u[p+'started']=null;u[p+'gen']=(t.gen||0)+1;u[p+'arch']=null;
      u['works/'+sel]=null;u[p+'endsAt']=null;if(t.code)u['codes/'+t.code]=null;const id=sel;await db.ref().update(u);CODE={};db.ref('code/'+id).remove().catch(()=>{});db.ref('hist/'+id).remove().catch(()=>{})}catch(e){alert('Не вдалося задати знову: '+(e.message||e))}};
  const updDc=()=>{const b=panel._dc;if(!b)return;const n=Object.values(data).filter(x=>x.st==='checked').length;b.textContent='🗑 Видалити оцінені роботи ('+n+')';b.disabled=!n};
  /* --- редактор критеріїв оцінювання --- */
  const rid=()=>'c'+Math.random().toString(36).slice(2,9);
  const RTPL={web:[['Структура HTML, семантичні теги',3],['Оформлення CSS відповідно до завдання',3],['Виконання вимог завдання',4,1],['Охайність і читабельність коду',2]],
    py:[['Програма працює правильно',6,1],['Використано потрібні конструкції (умови, цикли, функції…)',3],['Зрозумілі назви змінних і структура програми',2],['Охайність коду, коментарі',1]]};
  const rubricEd=(rub,onCh,kindF)=>{const R=(rub&&rub.c?Object.values(rub.c):[]).filter(Boolean).map(x=>({id:x.id||rid(),t:x.t||'',m:+x.m||1,a:!!x.a}));
    const sc=el('input',{type:'number',min:1,max:100,value:(rub&&rub.s)||12,style:'width:80px'}),lst=el('div',{style:'display:grid;gap:6px'}),sum=el('div',{class:'mu'});
    const upd=()=>{const M=Math.round(R.filter(c=>c.t.trim()).reduce((a,c)=>a+(+c.m||0),0)*100)/100,S=+sc.value||12;
      sum.textContent=R.length?'Сума балів: '+M+' · оцінка за '+S+'-бальною шкалою'+(M&&M!==S?' (сума перераховується в оцінку пропорційно)':''):'Критеріїв немає: оцінку ставите як зазвичай.'};
    const fire=()=>{upd();if(onCh)onCh()};
    const draw=()=>{lst.textContent='';R.forEach((c,k)=>{const ti=el('input',{value:c.t,placeholder:'Назва критерію'}),mi=el('input',{type:'number',min:0.5,max:100,step:0.5,value:c.m}),ai=el('input',{type:'checkbox',style:'width:auto;flex:none'});ai.checked=c.a;
        ti.onchange=()=>{c.t=ti.value.trim();fire()};mi.onchange=()=>{c.m=Math.max(0.5,Math.min(100,+mi.value||1));mi.value=c.m;fire()};ai.onchange=()=>{c.a=ai.checked;fire()};
        lst.append(el('div',{class:'rrow'},ti,mi,el('span',{class:'mu'},'б.'),el('label',{class:'mu',title:'Платформа запропонує бали за результатом тестів (Python) або чек-листа вимог (веб)',style:'display:flex;gap:4px;align-items:center;white-space:nowrap'},ai,'за автоперевіркою'),
          el('button',{class:'g',style:'padding:2px 8px',title:'Видалити критерій',onclick:()=>{R.splice(k,1);draw();fire()}},'✕')))});upd()};
    sc.onchange=fire;draw();
    return{el:el('div',{style:'display:grid;gap:8px'},lst,el('div',{class:'row'},el('button',{class:'g',onclick:()=>{R.push({id:rid(),t:'',m:1,a:false});draw()}},'＋ Додати критерій'),
        el('button',{class:'g',onclick:()=>{if(R.length&&!confirm('Замінити критерії шаблоном?'))return;R.splice(0,R.length,...RTPL[kindF()==='py'?'py':'web'].map(([t,m,a])=>({id:rid(),t,m,a:!!a})));sc.value=12;draw();fire()}},'📄 Шаблон критеріїв')),
        el('div',{style:'display:flex;gap:8px;align-items:center'},el('span',{class:'mu'},'Шкала оцінки:'),sc,el('span',{class:'mu'},'балів')),sum),
      get:()=>{const c=R.filter(x=>x.t.trim()&&+x.m>0).map(x=>({id:x.id,t:x.t.trim(),m:+x.m,...(x.a?{a:1}:{})}));return c.length?{s:Math.max(1,Math.min(100,+sc.value||12)),c}:null},count:()=>R.filter(x=>x.t.trim()).length}};
  /* --- редактори підказок і варіантів --- */
  const hintsEd=(list,onCh)=>{const H=(list?Object.values(list):[]).filter(Boolean).map(x=>({id:x.id||rid(),t:x.t||''})),lst=el('div',{style:'display:grid;gap:6px'});
    const draw=()=>{lst.textContent='';H.forEach((h,k)=>{const ta=el('textarea',{rows:2,placeholder:'Текст підказки '+(k+1)+' (від загальної до конкретнішої)'});ta.value=h.t;ta.onchange=()=>{h.t=ta.value.trim();if(onCh)onCh()};
        lst.append(el('div',{class:'trow'},el('div',{style:'display:flex;gap:8px;align-items:center'},el('b',{style:'flex:1'},'💡 Підказка '+(k+1)),
          k?el('button',{class:'g',style:'padding:2px 8px',title:'Вище',onclick:()=>{H.splice(k-1,0,H.splice(k,1)[0]);draw();if(onCh)onCh()}},'↑'):'',
          el('button',{class:'g',style:'padding:2px 8px',title:'Видалити',onclick:()=>{H.splice(k,1);draw();if(onCh)onCh()}},'✕')),ta))});
      if(!H.length)lst.append(el('div',{class:'mu'},'Підказок немає.'))};draw();
    return{el:el('div',{style:'display:grid;gap:8px'},lst,el('div',{class:'row'},el('button',{class:'g',onclick:()=>{H.push({id:rid(),t:''});draw()}},'＋ Додати підказку'))),
      get:()=>{const r=H.filter(h=>h.t.trim()).map(h=>({id:h.id,t:h.t.trim()}));return r.length?r:null},count:()=>H.filter(h=>h.t.trim()).length}};
  const varsEd=(list,onCh,kindF)=>{const V=(list?Object.values(list):[]).filter(Boolean).map(x=>({id:x.id||rid(),x:x.x||'',tests:tlist(x)})),lst=el('div',{style:'display:grid;gap:8px'});
    const draw=()=>{lst.textContent='';const py=kindF()==='py';V.forEach((v,k)=>{const ta=el('textarea',{rows:3,placeholder:'Текст варіанта '+(k+1)+' (додається до загального тексту завдання)'});ta.value=v.x;ta.onchange=()=>{v.x=ta.value.trim();if(onCh)onCh()};
        const tl2=el('div',{style:'display:grid;gap:6px'});
        const dT=()=>{tl2.textContent='';v.tests.forEach((x,j)=>{const a=el('textarea',{rows:2,spellcheck:'false',placeholder:'Вхідні дані',style:'font:13px/1.4 ui-monospace,monospace'}),b=el('textarea',{rows:2,spellcheck:'false',placeholder:'Очікуваний вивід',style:'font:13px/1.4 ui-monospace,monospace'}),hc=el('input',{type:'checkbox',style:'width:auto;flex:none'});
            a.value=x.i;b.value=x.o;hc.checked=x.h;a.onchange=()=>{x.i=a.value;if(onCh)onCh()};b.onchange=()=>{x.o=b.value;if(onCh)onCh()};hc.onchange=()=>{x.h=hc.checked;if(onCh)onCh()};
            tl2.append(el('div',{style:'display:grid;gap:4px'},el('div',{style:'display:flex;gap:8px;align-items:center'},el('span',{class:'mu',style:'flex:1'},'Тест '+(j+1)),el('label',{class:'mu',style:'display:flex;gap:4px;align-items:center'},hc,'прихований'),
              el('button',{class:'g',style:'padding:1px 7px',onclick:()=>{v.tests.splice(j,1);dT();if(onCh)onCh()}},'✕')),el('div',{class:'tsg'},a,b)))})};dT();
        lst.append(el('div',{class:'trow'},el('div',{style:'display:flex;gap:8px;align-items:center'},el('b',{style:'flex:1'},'🔀 Варіант '+(k+1)),el('button',{class:'g',style:'padding:2px 8px',title:'Видалити варіант',onclick:()=>{V.splice(k,1);draw();if(onCh)onCh()}},'✕')),ta,
          py?el('details',{},el('summary',{class:'mu'},'🧪 Власні тести варіанта ('+v.tests.length+'): якщо не задано, діють спільні тести завдання'),el('div',{style:'display:grid;gap:6px;margin-top:6px'},tl2,
            el('button',{class:'g',style:'justify-self:start',onclick:()=>{v.tests.push({i:'',o:'',h:false});dT()}},'＋ Тест варіанта'))):''))});
      if(!V.length)lst.append(el('div',{class:'mu'},'Варіантів немає: усі учні виконують однакове завдання.'))};draw();
    return{el:el('div',{style:'display:grid;gap:8px'},lst,el('div',{class:'row'},el('button',{class:'g',onclick:()=>{V.push({id:rid(),x:'',tests:[]});draw()}},'＋ Додати варіант'))),redraw:draw,
      get:()=>{const py=kindF()==='py',r=V.filter(v=>v.x.trim()).map(v=>{const o={id:v.id,x:v.x.trim()};const T2=py?v.tests.filter(x=>String(x.i).trim()||String(x.o).trim()).map(x=>({i:x.i,o:x.o,h:!!x.h})):[];if(T2.length)o.tests=T2;return o});return r.length>1?r:null},
      count:()=>V.filter(v=>v.x.trim()).length}};
  const rbM=el('div',{class:'modal',style:'display:none'});
  const openRub=()=>{const t=T();if(!t)return;rbM.textContent='';const ed2=rubricEd(t.rub,null,()=>t.ttype);
    rbM.append(el('div',{style:'flex:none;margin:auto;width:min(760px,96vw);max-height:92vh'},el('header',{},el('b',{style:'flex:1'},'📊 Критерії оцінювання: '+t.title),el('button',{class:'g',onclick:()=>{rbM.style.display='none'}},'✕ Закрити')),
      el('div',{class:'tp'},el('div',{class:'mu'},'Учні бачать критерії під текстом завдання, а після перевірки — свої бали. Бали вже оцінених робіт прив’язані до критеріїв: якщо критерій видалити, його бали не враховуватимуться.'),ed2.el,
        el('div',{class:'row'},el('button',{class:'g',onclick:()=>{rbM.style.display='none'}},'Скасувати'),el('button',{onclick:async()=>{try{await tref.child(sel).update({rub:ed2.get()});rbM.style.display='none'}catch(e){alert('Не вдалося зберегти: '+(e.message||e))}}},'💾 Зберегти критерії')))));
    rbM.style.display='flex'};
  /* --- вікно «💡 Підказки» (під час уроку): відкрити всім / закрити, редагувати --- */
  const hiM=el('div',{class:'modal',style:'display:none'});
  const openHints=()=>{const t=T();if(!t)return;hiM.textContent='';const H=hlist(t),ed2=hintsEd(t.hints,null);
    const rows=H.map((h,k)=>{const all=!!(t.hr&&t.hr[h.id]),me=Object.values(data).filter(w=>w&&w.hu&&w.hu[h.id]).length,sf=Object.values(data).filter(w=>w&&w.hs&&w.hs[h.id]).length;
      return el('div',{class:'trow'},el('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},el('b',{style:'flex:1'},'💡 Підказка '+(k+1)),
          el('span',{class:'mu'},all?'✅ відкрито всім':(me||sf?'відкрито: '+(me?me+' особисто':'')+(me&&sf?', ':'')+(sf?sf+' самостійно':''):'🔒 закрито')),
          el('button',{class:all?'g':'',onclick:async()=>{await tref.child(sel+'/hr/'+h.id).set(all?null:true).catch(e=>alert(e.message||e));openHints()}},all?'Закрити для всіх':'Відкрити всім')),
        el('div',{style:'white-space:pre-wrap'},h.t))});
    hiM.append(el('div',{style:'flex:none;margin:auto;width:min(760px,96vw);max-height:92vh'},el('header',{},el('b',{style:'flex:1'},'💡 Підказки: '+t.title),el('button',{class:'g',onclick:()=>{hiM.style.display='none'}},'✕ Закрити')),
      el('div',{class:'tp'},el('div',{class:'mu'},'Окремому учневі підказку можна дати в його вікні (клік по картці). Учні бачать відкриті підказки під текстом завдання й отримують повідомлення про нову.'),
        H.length?rows:el('div',{class:'mu'},'Підказок ще немає — додайте нижче.'),
        el('details',H.length?{}:{open:''},el('summary',{},'✏ Редагувати й додавати підказки'),el('div',{style:'display:grid;gap:8px;margin-top:8px'},ed2.el,
          el('button',{style:'justify-self:start',onclick:async()=>{try{await tref.child(sel).update({hints:ed2.get()});openHints()}catch(e){alert('Не вдалося зберегти: '+(e.message||e))}}},'💾 Зберегти підказки'))))));
    hiM.style.display='flex'};
  /* --- вікно «🔀 Варіанти»: спосіб розподілу і ручне призначення --- */
  const vaM=el('div',{class:'modal',style:'display:none'});
  const openVars=()=>{const t=T();if(!t)return;vaM.textContent='';const V=vlist(t),R=(classes[t.cls]||{}).roster||{};
    const md=el('select',{style:'width:auto'});md.append(el('option',{value:'list'},'За списком класу по черзі'),el('option',{value:'rand'},'Випадково (сталий для кожного учня)'));md.value=t.vmode==='rand'?'rand':'list';
    md.onchange=async()=>{await tref.child(sel).update({vmode:md.value}).catch(()=>{});openVars()};
    const list=Object.values(R).filter(r=>r&&r.fn!=null).sort(byName),cnt={};
    const rows=list.map(r=>{const sid=slug(r.fn+' '+r.ln),v=varOf(t,R,sid,sel),man=t.va&&t.va[sid];cnt[v.id]=(cnt[v.id]||0)+1;
      const s2=el('select');s2.append(el('option',{value:''},'авто'));V.forEach((x,k)=>s2.append(el('option',{value:x.id},'Варіант '+(k+1))));s2.value=man&&V.some(x=>x.id===man)?man:'';
      s2.onchange=async()=>{await tref.child(sel+'/va/'+sid).set(s2.value||null).catch(e=>alert(e.message||e));openVars()};
      return el('tr',{},el('td',{},r.ln+' '+r.fn),el('td',{},el('b',{},'В'+vNum(t,v)),man?'':el('span',{class:'mu'},' (авто)')),el('td',{},s2))});
    vaM.append(el('div',{style:'flex:none;margin:auto;width:min(680px,96vw);max-height:92vh'},el('header',{},el('b',{style:'flex:1'},'🔀 Варіанти: '+t.title),el('button',{class:'g',onclick:()=>{vaM.style.display='none'}},'✕ Закрити')),
      el('div',{class:'tp'},el('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},el('span',{class:'mu'},'Розподіл:'),md,el('span',{class:'mu'},V.map((x,k)=>'В'+(k+1)+': '+(cnt[x.id]||0)).join(' · '))),
        t.status==='active'?el('div',{class:'banner rt',style:'margin:0'},'Завдання вже виконується: учень, якому змінили варіант, одразу побачить новий текст (його код не зміниться).'):'',
        list.length?el('div',{class:'jw',style:'padding:0;max-height:60vh'},el('table',{class:'vtab'},el('tr',{},el('th',{},'Учень'),el('th',{},'Варіант'),el('th',{},'Вручну')),rows)):el('div',{class:'mu'},'У класу завдання немає списку учнів: варіант визначається випадково за ім’ям.'))));
    vaM.style.display='flex'};
  const optsUI=(o,onCh,rk)=>{
    const mk=(txt,v)=>{const i=el('input',{type:'checkbox',style:'width:auto;flex:none'}),sp=el('span',{},txt);i.checked=v;return[i,el('label',{style:'display:flex;gap:8px;align-items:center'},i,sp),sp]};
    const ty=el('select');ty.append(el('option',{value:'web'},'🌐 Веб-дизайн (HTML, CSS, JavaScript)'),el('option',{value:'py'},'🐍 Програмування (Python)'));ty.value=o.ttype==='py'?'py':'web';
    const[ki,kl]=mk('⏱ Обмежити час виконання (інакше — доки ви самі не завершите завдання)',!!o.timerOn),mi=el('input',{type:'number',min:1,max:600,value:o.mins||40,style:'width:90px'}),mrow=el('div',{style:'display:flex;gap:8px;align-items:center'},mi,'хвилин');
    const[ti,tl,tsp]=mk('',!!o.tplOn),[ci,cl]=mk('🎨 Дозволити учням створювати файли CSS',o.fcss!==false),[ji,jl]=mk('⚙️ Дозволити учням створювати файли JavaScript',o.fjs!==false);
    const[ni,nl]=mk('🔢 numpy (масиви, обчислення)',o.pyn!==false),[pi,pl]=mk('🐼 pandas (таблиці; потребує numpy)',o.pyp!==false),[fi,fl]=mk('📎 Дозволити учням створювати додаткові файли (.py модулі, .txt, .csv, .json)',o.pyf!==false),[gi,gl]=mk('🖼 tkinter (сумісний режим): вікна, кнопки, поля, Canvas тощо',!!o.pyk);
    const pynote=el('div',{class:'mu'},'');
    const rbx=rubricEd(o.rub,()=>chg(),()=>ty.value),hbx=hintsEd(o.hints,()=>chg()),vbx=varsEd(o.vars,()=>chg(),()=>ty.value);
    const hmo=el('select',{style:'width:auto'});hmo.append(el('option',{value:'teacher'},'Підказки відкриваю я (усім або окремому учню)'),el('option',{value:'self'},'Учень може відкрити підказку сам (я бачу, хто і яку)'));hmo.value=o.hmode==='self'?'self':'teacher';
    const vmo=el('select',{style:'width:auto'});vmo.append(el('option',{value:'list'},'Розподіл за списком класу по черзі (1-й учень — В1, 2-й — В2 …)'),el('option',{value:'rand'},'Випадковий розподіл (сталий для кожного учня)'));vmo.value=o.vmode==='rand'?'rand':'list';
    /* --- автоперевірка Python: тести + еталонний розв'язок (еталон зберігається лише в цьому браузері) --- */
    const TS=tlist(o).map(x=>({...x}));const tbx=el('div',{style:'flex-direction:column;gap:8px;border:1px dashed var(--bd);border-radius:10px;padding:10px'}),tlst=el('div',{style:'display:grid;gap:8px'}),tout=el('div',{});
    const tmo=el('select',{style:'width:auto;max-width:100%'});Object.keys(TMODES).forEach(k=>tmo.append(el('option',{value:k},TMODES[k])));tmo.value=TMODES[o.tmode]?o.tmode:'exact';
    const tli=el('input',{type:'number',min:1,max:30,value:o.tlim||5,style:'width:70px'}),tnote=el('div',{class:'mu'},'');
    const rkey='kk_ref_'+(rk||'new');let rv='';try{rv=localStorage.getItem(rkey)||''}catch(e){}
    const rsol=el('textarea',{rows:6,spellcheck:'false',placeholder:'Еталонний розв’язок (необов’язково). Учням не передається й зберігається лише в цьому браузері.',style:'font:13px/1.4 ui-monospace,Menlo,monospace'});rsol.value=rv;
    rsol.onchange=()=>{try{localStorage.setItem(rkey,rsol.value)}catch(e){}};
    const drawT=()=>{tlst.textContent='';TS.forEach((t,k)=>{const ti2=el('textarea',{rows:2,spellcheck:'false',placeholder:'Вхідні дані: кожне значення з нового рядка (порожньо, якщо input() немає)',style:'font:13px/1.4 ui-monospace,monospace'}),
        to2=el('textarea',{rows:2,spellcheck:'false',placeholder:'Очікуваний вивід (лише те, що друкує print)',style:'font:13px/1.4 ui-monospace,monospace'}),hc=el('input',{type:'checkbox',style:'width:auto;flex:none'});
      ti2.value=t.i;to2.value=t.o;hc.checked=t.h;ti2.onchange=()=>{t.i=ti2.value;chg()};to2.onchange=()=>{t.o=to2.value;chg()};hc.onchange=()=>{t.h=hc.checked;chg()};
      tlst.append(el('div',{class:'trow'},el('div',{style:'display:flex;gap:8px;align-items:center'},el('b',{style:'flex:1'},'Тест '+(k+1)),el('label',{class:'mu',style:'display:flex;gap:6px;align-items:center'},hc,'прихований'),
        el('button',{class:'g',style:'padding:2px 8px',title:'Видалити тест',onclick:()=>{TS.splice(k,1);drawT();chg()}},'✕')),el('div',{class:'tsg'},ti2,to2)))});
      if(!TS.length)tlst.append(el('div',{class:'mu'},'Тестів ще немає. Без тестів автоперевірка вимкнена.'))};
    const tRunRef=async fill=>{if(!rsol.value.trim())return alert('Спершу вставте еталонний розв’язок.');const T=TS.filter(t=>t.i.trim()||t.o.trim()||fill);if(!T.length)return alert('Додайте хоча б один тест.');
      try{localStorage.setItem(rkey,rsol.value)}catch(e){}tout.textContent='';const ln=el('div',{class:'mu'},'⏳ Запускаю еталон…');tout.append(ln);
      const r=await runTests({files:{'main.py':rsol.value},libs:pyLibs({pyn:ni.checked||pi.checked,pyp:pi.checked}),main:'main.py',tests:T,mode:tmo.value,limit:+tli.value||5,onStatus:m=>{ln.textContent='⏳ '+m},onProgress:(a,b)=>{ln.textContent='🧪 '+a+' з '+b+'…'}});
      tout.textContent='';if(r.fatal)return tout.append(el('div',{class:'banner rt',style:'margin:0'},'Не вдалося запустити Python: '+r.fatal));
      if(fill){let n=0;r.results.forEach((x,k)=>{if(!x.err&&!x.need){T[k].o=tNorm(x.out);n++}});drawT();chg();
        tout.append(el('div',{class:'banner ok',style:'margin:0'},'Очікуваний вивід заповнено з еталону для '+n+' з '+T.length+' тестів.'+(n<T.length?' Для решти еталон завершився з помилкою або чекав більше введення.':'')))}
      else tout.append(el('div',{class:'banner '+(tPassed(r)===T.length?'ok':'rt'),style:'margin:0 0 8px'},'Еталон проходить '+tPassed(r)+' з '+T.length+' тестів.'),testView(T,r.results,true))};
    tbx.append(el('b',{},'🧪 Автоперевірка тестами'),tnote,tlst,el('div',{class:'row'},el('button',{class:'g',onclick:()=>{TS.push({i:'',o:'',h:false});drawT()}},'＋ Додати тест')),
      el('label',{style:'display:grid;gap:4px'},el('span',{class:'mu'},'Як порівнювати вивід'),tmo),el('div',{style:'display:flex;gap:8px;align-items:center'},el('span',{class:'mu'},'Час на один тест:'),tli,el('span',{class:'mu'},'с')),
      el('details',{},el('summary',{},'Еталонний розв’язок: перевірити тести або заповнити очікуваний вивід'),el('div',{style:'display:grid;gap:8px;margin-top:8px'},rsol,
        el('div',{class:'row'},el('button',{class:'g',onclick:()=>tRunRef(false)},'▶ Перевірити тести на еталоні'),el('button',{class:'g',onclick:()=>{if(TS.some(t=>t.o.trim())&&!confirm('Замінити очікуваний вивід тестів результатами еталону?'))return;tRunRef(true)}},'⤵ Заповнити очікуваний вивід з еталону')),tout)));
    drawT();
    /* --- чек-лист вимог для веб-завдань (зразок розв'язку зберігається лише в цьому браузері) --- */
    const CK=clist(o).map(x=>({...x})),CU=CK.filter(r=>!WBASE[r.k]),cbx=el('div',{style:'flex-direction:column;gap:8px;border:1px dashed var(--bd);border-radius:10px;padding:10px'}),clst=el('div',{style:'display:grid;gap:8px'}),cout=el('div',{});
    const BC={};Object.keys(WBASE).forEach(k=>{const[i,l]=mk(WBASE[k],CK.some(r=>r.k===k));BC[k]={i,l}});
    const wkey='kk_wref_'+(rk||'new');let wv='';try{wv=localStorage.getItem(wkey)||''}catch(e){}
    const wsol=el('textarea',{rows:7,spellcheck:'false',placeholder:'Зразок розв’язку: повний код index.html (CSS і JS можна вписати всередину). Учням не передається й зберігається лише в цьому браузері.',style:'font:13px/1.4 ui-monospace,Menlo,monospace'});wsol.value=wv;
    wsol.onchange=()=>{try{localStorage.setItem(wkey,wsol.value)}catch(e){}};
    const FLD={has:[['s','Селектор, напр. h1, nav a, .card'],['n','Скільки щонайменше (1)','number']],attr:[['s','Селектор, напр. img'],['a','Атрибут, напр. alt'],['v','Значення (необов’язково)']],
      text:[['s','Селектор, напр. h1'],['v','Текст, який має бути']],css:[['s','Селектор, напр. body, h1, .card'],['p','Властивість CSS, напр. background-color'],['op','',''],['v','Значення, напр. #f5f5f5 або center']],
      link:[['f','Назва файлу, напр. style.css або script.js']],click:[['s','Що натиснути, напр. #btn'],['inp','Поле, куди ввести (необов’язково), напр. #name'],['val','Що ввести'],['t','Де перевірити результат, напр. #out'],['v','Очікуваний текст']]};
    const drawC=()=>{clst.textContent='';CU.forEach((r,k)=>{const ks=el('select',{style:'width:auto'});Object.keys(WKIND).forEach(x=>ks.append(el('option',{value:x},WKIND[x])));ks.value=r.k;
        ks.onchange=()=>{CU[k]={k:ks.value};drawC();chg()};
        const fs=FLD[r.k].map(([f,ph,tp])=>{if(f==='op'){const os=el('select',{style:'width:auto'});os.append(el('option',{value:'='},'дорівнює'),el('option',{value:'~'},'містить'));os.value=r.op==='~'?'~':'=';os.onchange=()=>{r.op=os.value;upl();chg()};return os}
          const i=el('input',{placeholder:ph,type:tp||'text',value:r[f]==null?'':r[f]});if(tp==='number'){i.min=1;i.style.width='110px'}i.onchange=()=>{r[f]=tp==='number'?Math.max(1,+i.value||1):i.value.trim();upl();chg()};return i});
        const lb=el('input',{placeholder:'Як показати учням (необов’язково)',value:r.l||''}),auto=el('div',{class:'mu'});const upl=()=>{auto.textContent=cValid(r)?'Учень побачить: '+cLabel(r):'⚠ Заповніть обов’язкові поля'};upl();
        lb.onchange=()=>{r.l=lb.value.trim();upl();chg()};
        clst.append(el('div',{class:'trow'},el('div',{style:'display:flex;gap:8px;align-items:center'},el('b',{style:'flex:0 0 auto'},(k+1)+'.'),ks,el('span',{style:'flex:1'}),
          el('button',{class:'g',style:'padding:2px 8px',title:'Видалити вимогу',onclick:()=>{CU.splice(k,1);drawC();chg()}},'✕')),el('div',{class:'tsg'},fs),lb,auto))});
      if(!CU.length)clst.append(el('div',{class:'mu'},'Власних вимог ще немає.'))};
    const cRules=()=>[...Object.keys(WBASE).filter(k=>BC[k].i.checked).map(k=>({k})),...CU.filter(cValid).map(r=>{const o2={};Object.keys(r).forEach(x=>{if(r[x]!==''&&r[x]!=null)o2[x]=r[x]});return o2})];
    const cTry=async()=>{const R=cRules();if(!wsol.value.trim())return alert('Спершу вставте зразок розв’язку.');if(!R.length)return alert('Додайте хоча б одну вимогу.');
      try{localStorage.setItem(wkey,wsol.value)}catch(e){}cout.textContent='';cout.append(el('div',{class:'mu'},'☑ Перевіряю зразок…'));
      const res=await webCheck({'index.html':wsol.value},R);cout.textContent='';
      cout.append(el('div',{class:'banner '+(cPassed(res)===R.length?'ok':'rt'),style:'margin:0 0 8px'},'Зразок виконує '+cPassed(res)+' з '+R.length+' вимог.'),cView(R,res))};
    cbx.append(el('b',{},'☑ Чек-лист вимог (автоперевірка сторінки)'),el('div',{class:'mu'},'Учень натискає «☑ Перевірити вимоги» й бачить, які вимоги виконано. Перевіряється готова сторінка у браузері: остаточні стилі (неважливо, як записано колір чи де лежить CSS), текст, атрибути й реакція на натискання. Дизайн і якість оцінюєте ви. Селектори — як у CSS: h1, nav a, .card, #btn.'),
      el('div',{style:'display:grid;gap:4px'},el('span',{class:'mu'},'Базові вимоги:'),...Object.keys(WBASE).map(k=>BC[k].l)),
      el('span',{class:'mu'},'Власні вимоги:'),clst,el('div',{class:'row'},el('button',{class:'g',onclick:()=>{CU.push({k:'has'});drawC()}},'＋ Додати вимогу')),
      el('details',{},el('summary',{},'Зразок розв’язку: перевірити чек-лист'),el('div',{style:'display:grid;gap:8px;margin-top:8px'},wsol,el('div',{class:'row'},el('button',{class:'g',onclick:cTry},'▶ Перевірити чек-лист на зразку')),cout)));
    drawC();
    const[ai,al]=mk('👁 Вести облік виходів зі сторінки (лічильник і час на картці учня)',!!o.trk),[wi,wl]=mk('⚠ Попереджати: кнопка «на весь екран», повідомлення учню при поверненні й сигнал вам після',!!o.wrn),
      wn=el('input',{type:'number',min:1,max:50,value:o.wn||3,style:'width:70px'}),wspan=el('span',{},wn,' виходів'),wrow=el('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},wl,wspan),
      [li,ll]=mk('🔒 Блокувати редактор після виходу, доки ви не розблокуєте його',!!o.lck),
      [xi,xl]=mk('📋 Фіксувати вставку готового коду з інших джерел: кількість, обсяг і самі фрагменти побачите ви',!!o.pst),[xb,xbl]=mk('⛔ Забороняти таку вставку (вставлене не потрапить у код, спробу буде зафіксовано)',!!o.pstb),
      xn=el('input',{type:'number',min:5,max:500,value:o.psn||20,style:'width:80px'}),xrow=el('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},el('span',{},'Враховувати фрагменти від'),xn,el('span',{},'символів')),
      xnote=el('div',{class:'mu'},'Дозволено без обліку: копіювання всередині власного коду учня та фрагменти з тексту завдання. Код, набраний вручну з іншого екрана, розпізнати неможливо.');
    const ta=el('textarea',{rows:6,spellcheck:'false',style:'font:13px/1.4 ui-monospace,Menlo,monospace'}),sum=el('div',{class:'mu'});ta.value=o.tplCode||(o.ttype==='py'?PYTPL:TPLDOC);let lastTy=ty.value;
    const webG=[cl,jl,cbx],pyG=[nl,pl,fl,gl,pynote,tbx];
    const ctlTxt=()=>[ai.checked?'облік':'',wi.checked?'попередження ('+(parseInt(wn.value)||3)+')':'',li.checked?'блокування':''].filter(Boolean).join(', ');
    const upd=()=>{const py=ty.value==='py';if(vbx._ty!==ty.value){vbx._ty=ty.value;vbx.redraw()}
      if(ty.value!==lastTy){if(ta.value===(lastTy==='py'?PYTPL:TPLDOC))ta.value=py?PYTPL:TPLDOC;lastTy=ty.value}
      webG.forEach(x=>x.style.display=py?'none':'flex');pyG.forEach(x=>x.style.display=py?(x===pynote?'':'flex'):'none');
      tnote.textContent=gi.checked?'⚠ Для програм з tkinter автоперевірка недоступна: учні не побачать кнопку перевірки. Вимкніть tkinter, щоб користуватися тестами.':'Програма учня запускається з вхідними даними кожного тесту; у вивід потрапляє лише print (підказки input() не враховуються). Учень бачить відкриті тести повністю, а прихований — лише «пройдено/не пройдено». Технічно обізнаний учень може знайти дані тестів у коді сторінки, тож прихований тест — не секрет.';
      pynote.textContent=gi.checked?'Завжди доступні math, random, json та інша стандартна бібліотека. tkinter працює в сумісному режимі: Tk, Toplevel, Frame, LabelFrame, Label, Button, Entry, Text, Canvas, Checkbutton, Radiobutton, Listbox, Scale, Spinbox, OptionMenu, ttk (частково), messagebox, simpledialog, StringVar/IntVar/DoubleVar/BooleanVar, pack/grid/place, bind, after, mainloop. Відмінності: mainloop() не блокує виконання, а Menu, PhotoImage і filedialog не підтримуються.':'Завжди доступні math, random, json та інша стандартна бібліотека. Без сумісного режиму import tkinter дає учню підказку запустити програму в Thonny/IDLE і здати код для перегляду.';
      tsp.textContent=py?'📄 Шаблон: учні отримують готовий стартовий код у main.py (нижче можна змінити)':'📄 Шаблон: учні отримують готовий стартовий код у index.html (нижче можна змінити)';
      ta.style.display=ti.checked?'':'none';mrow.style.display=ki.checked?'flex':'none';wspan.style.display=wi.checked?'':'none';
      if(pi.checked){ni.checked=true;ni.disabled=true}else ni.disabled=false;
      if(wi.checked||li.checked){ai.checked=true;ai.disabled=true}else ai.disabled=false;
      if(xb.checked){xi.checked=true;xi.disabled=true}else xi.disabled=false;xbl.style.display=xrow.style.display=xnote.style.display=xi.checked?'flex':'none';xnote.style.display=xi.checked?'':'none';
      sum.textContent='Учні матимуть: '+(py?'main.py'+(fi.checked?' + файли .py/.txt/.csv/.json':'')+' · бібліотеки: math, random, json'+(ni.checked?', numpy':'')+(pi.checked?', pandas':'')+(gi.checked?', tkinter (сумісний режим)':'')+(!gi.checked&&TS.length?' · 🧪 тестів: '+TS.filter(t=>t.i.trim()||t.o.trim()).length:''):'index.html'+(ci.checked?' + CSS':'')+(ji.checked?' + JS':''))+(!py&&cRules().length?' · ☑ вимог: '+cRules().length:'')+' · шаблон: '+(ti.checked?'так':'ні')+' · '+(ki.checked?'таймер: '+(parseInt(mi.value)||40)+' хв':'без таймера')+(hbx.count()?' · підказок: '+hbx.count():'')+(vbx.count()>1?' · варіантів: '+vbx.count():'')+(rbx.count()?' · критеріїв оцінювання: '+rbx.count():'')+' · контроль виходів: '+(ctlTxt()||'вимкнено')+' · вставка коду: '+(xb.checked?'заборона':xi.checked?'облік':'без контролю')};
    const chg=()=>{upd();if(onCh)onCh()};[ty,ti,ci,ji,ki,ai,wi,li,ni,pi,fi,gi,xi,xb,...Object.keys(WBASE).map(k=>BC[k].i)].forEach(i=>i.onchange=chg);ta.onchange=chg;mi.onchange=chg;wn.onchange=chg;xn.onchange=chg;tmo.onchange=chg;tli.onchange=chg;hmo.onchange=chg;vmo.onchange=chg;upd();
    return{el:el('div',{style:'display:grid;gap:8px;border-top:1px dashed var(--bd);padding-top:10px'},el('b',{},'Тип практичної'),ty,el('b',{style:'margin-top:4px'},'Можливості для учнів'),tl,ta,cl,jl,cbx,nl,pl,fl,gl,pynote,tbx,kl,mrow,el('b',{style:'margin-top:4px'},'💡 Підказки'),el('div',{class:'mu'},'Підказки можна додавати й відкривати й під час уроку: кнопка «💡 Підказки» в панелі завдання.'),hbx.el,hmo,
      el('b',{style:'margin-top:4px'},'🔀 Варіанти завдання'),el('div',{class:'mu'},'Щонайменше 2 варіанти. Учень бачить загальний текст завдання й текст свого варіанта. Розподіл можна змінити вручну кнопкою «🔀 Варіанти» в панелі завдання.'),vbx.el,vmo,
      el('b',{style:'margin-top:4px'},'📊 Критерії оцінювання'),rbx.el,el('b',{style:'margin-top:4px'},'Контроль виходів зі сторінки'),al,wrow,ll,el('b',{style:'margin-top:4px'},'Контроль вставки коду (академічна доброчесність)'),xl,xbl,xrow,xnote,sum),
      get:()=>({ttype:ty.value,tplOn:ti.checked,tplCode:ti.checked?ta.value:'',fcss:ci.checked,fjs:ji.checked,pyn:ni.checked||pi.checked,pyp:pi.checked,pyf:fi.checked,pyk:gi.checked,timerOn:ki.checked,mins:Math.max(1,Math.min(600,parseInt(mi.value)||40)),
        trk:ai.checked||wi.checked||li.checked,wrn:wi.checked,wn:Math.max(1,Math.min(50,parseInt(wn.value)||3)),lck:li.checked,pst:xi.checked||xb.checked,pstb:xb.checked,psn:Math.max(5,Math.min(500,parseInt(xn.value)||20)),
        tests:ty.value==='py'?TS.filter(t=>t.i.trim()||t.o.trim()).map(t=>({i:t.i,o:t.o,h:!!t.h})):null,tmode:ty.value==='py'?tmo.value:null,tlim:ty.value==='py'?Math.max(1,Math.min(30,+tli.value||5)):null,checks:ty.value==='web'&&cRules().length?cRules():null,rub:rbx.get(),hints:hbx.get(),hmode:hmo.value,vars:vbx.get(),vmode:vmo.value})}};
  const kPanel=()=>{const t=T();return [sel,creating,t&&rlist(t).length,t&&hlist(t).length,t&&vlist(t).length,t&&t.status,t&&t.arch&&t.arch.at,t&&t.code,t&&t.endsAt,t&&t.cls,Object.keys(tasks).length,Object.keys(classes).length].join('|')};
  const drawPanel=()=>{panel.textContent='';panel._dc=null;panel._tm=null;pkey=kPanel();const t=T();
    if(!creating&&!t){const a=Object.keys(tasks).find(k=>tasks[k].status==='active');
      panel.append(el('div',{class:'tp'},el('div',{class:'mu'},a?'🟢 Зараз виконується завдання «'+tasks[a].title+'». Оберіть його у списку, щоб побачити роботу учнів.':Object.keys(tasks).length?'Оберіть завдання зі списку або створіть нове кнопкою «＋ Нове завдання».':'Створіть перше завдання кнопкою «＋ Нове завдання».')));return}
    if(creating){const ti=el('input',{placeholder:'Назва завдання (напр. «Практична 3. Списки»)'}),tx=el('textarea',{rows:5,placeholder:'Текст завдання для учнів…'}),mk=el('button',{},'Створити завдання');
      const ou=optsUI(prefill||{},null,'new'),ie=imgEd(newImg,v=>{newImg=v},true);if(prefill){ti.value=prefill.title+' (копія)';tx.value=prefill.text||'';if(prefillId&&!newImg)db.ref('timg/'+uid+'/'+prefillId).once('value').then(x=>{if(x.val()&&!newImg&&creating){newImg=x.val();ie.set(newImg)}}).catch(()=>{})}mk.onclick=()=>create(ti.value.trim(),tx.value,mk,ou.get());
      panel.append(el('div',{class:'tp'},el('h3',{style:'margin:0'},'📝 Нове завдання'+(prefill?' (на основі «'+prefill.title+'»)':'')),ti,tx,ie.el,ou.el,el('div',{class:'row'},mk,Object.keys(tasks).length?el('button',{class:'g',onclick:()=>{creating=false;prefill=null;newImg=null;drawAll()}},'Скасувати'):''),
        el('div',{class:'mu'},'Код для учнів буде згенеровано одразу після створення завдання.')));return}
    const dr=t.status==='draft',tt=el('input',{value:t.title}),tx=el('textarea',{rows:4,placeholder:'Текст завдання'});tx.value=t.text||'';tt.disabled=tx.disabled=!dr;const ou=dr?optsUI(t,()=>tref.child(sel).update(ou.get()),sel):null;
    tt.onchange=()=>tref.child(sel).update({title:tt.value.trim()||t.title});tx.onchange=()=>tref.child(sel).update({text:tx.value});
    const stx={draft:'📝 Чернетка — учням ще не відправлено',active:'🟢 Активне — учні виконують завдання',finished:'⏹ Завершено '+new Date(t.finished||Date.now()).toLocaleString('uk',{dateStyle:'short',timeStyle:'short'})+(t.arch?' · 📦 роботи ('+(t.arch.n||0)+') перенесено в архів '+new Date(t.arch.at).toLocaleDateString('uk'):'')}[t.status];
    const clsEl=dr?(()=>{const s=el('select',{style:'max-width:360px'});s.append(el('option',{value:''},'— оберіть клас —'));
      Object.keys(classes).sort((a,b)=>classes[a].name.localeCompare(classes[b].name,'uk',{numeric:true})).forEach(k=>{const n=classes[k].roster?Object.keys(classes[k].roster).length:0;s.append(el('option',{value:k},classes[k].name+(n?' ('+n+' учнів)':' (немає списку)')))});
      s.value=t.cls&&classes[t.cls]?t.cls:'';
      s.onchange=()=>{const k=s.value;tref.child(sel).update(k?{cls:k,cn:classes[k].name}:{cls:null,cn:null});cur=k||'all';drawChips();apply();updAbs()};
      return el('div',{class:'row',style:'align-items:center'},el('b',{style:'flex:0 0 auto'},'🏫 Клас, для якого задається завдання:'),s,Object.keys(classes).length?'':el('span',{class:'mu'},'Спочатку додайте клас кнопкою «＋ Додати клас» і створіть його список учнів.'))})()
      :el('div',{class:'mu'},'🏫 Клас: '+(cname(t.cls)||t.cn||'не вказано (старе завдання)'));
    const acts=[];
    if(!t.code)acts.push(el('button',{onclick:async()=>{try{await tref.child(sel).update({code:await mkCode(sel)})}catch(e){alert('Не вдалося згенерувати код')}}},'🔑 Згенерувати код'));
    if(dr&&t.code)acts.push(el('button',{onclick:()=>{{const o=ou.get(),c=t.cls,K=c&&classes[c];
      if(!K)return alert('Оберіть клас, для якого задається завдання.');
      if(!K.roster||!Object.keys(K.roster).length)return alert('У класу «'+K.name+'» немає списку учнів: учні не зможуть увійти. Створіть список кнопкою «👥 Список класу».');
      if(confirm('Відправити завдання класу «'+K.name+'»?\nПісля цього перемикання між завданнями буде заблоковано, доки ви його не завершите.'+(o.timerOn?'\nТаймер: '+o.mins+' хв почнеться одразу.':'')))tref.child(sel).update({title:tt.value.trim()||t.title,text:tx.value,...o,cls:c,cn:K.name,status:'active',started:Date.now(),endsAt:o.timerOn?tnow()+o.mins*60000:null})}}},'▶ Відправити учням'));
    if(!dr)acts.push(el('button',{class:'g',onclick:openHints},'💡 Підказки ('+hlist(t).length+')'));
    if(vlist(t).length)acts.push(el('button',{class:'g',onclick:openVars},'🔀 Варіанти ('+vlist(t).length+')'));
    if(!dr)acts.push(el('button',{class:'g',onclick:openRub},rlist(t).length?'📊 Критерії оцінювання ('+rlist(t).length+')':'📊 Додати критерії оцінювання'));
    if(t.status!=='active')acts.push(el('button',{class:'g',onclick:copyTask},'📋 Копіювати завдання'),el('button',{class:'g',onclick:delTask},'🗑 Видалити завдання'));
    else{const b=el('button',{class:'g',title:'Спочатку завершіть завдання'},'🗑 Видалити завдання');b.disabled=true;acts.push(b)}
    if(t.status==='active'&&t.endsAt)acts.push(el('button',{class:'g',onclick:()=>tref.child(sel).update({endsAt:t.endsAt+300000})},'＋5 хв'));
    if(t.ttype==='py'&&!t.pyk&&tAny(t)&&t.status!=='draft')acts.push(el('button',{class:'g','data-bt':'1',onclick:e=>batchTests(e.target)},bRun?'🧪 Перевіряю…':'🧪 Перевірити всіх тестами'));
    if(t.ttype!=='py'&&clist(t).length&&t.status!=='draft')acts.push(el('button',{class:'g','data-bt':'1',onclick:e=>batchTests(e.target)},bRun?'☑ Перевіряю…':'☑ Перевірити вимоги в усіх'));
    if(t.status==='active')acts.push(el('button',{style:'background:#dc2626',onclick:()=>finish(false)},t.endsAt?'⏹ Завершити достроково для всіх':'⏹ Завершити для всіх учнів'));
    if(t.status==='finished'){const dc=el('button',{class:'g',onclick:delChecked},'');panel._dc=dc;acts.push(dc,el('button',{class:'g',title:'Зберегти всі роботи у файл архіву й видалити їх з бази',onclick:e=>arDo([sel],e.target)},'📦 Архівувати роботи'),el('button',{onclick:again},'♻ Задати знову'))}
    const tmEl=t.status==='active'&&t.endsAt?el('b',{class:'tmr',style:'margin-left:10px'},'⏱ …'):null;panel._tm=tmEl;
    const imId=sel,ie=imgEd(null,v=>db.ref('timg/'+uid+'/'+imId).set(v),dr);db.ref('timg/'+uid+'/'+imId).once('value').then(x=>{if(sel===imId&&x.val()&&!ie.get())ie.set(x.val())}).catch(()=>{});
    const kids=[el('div',{class:'mu'},stx,tmEl||''),tt,tx,ie.el,clsEl,ou?ou.el:el('div',{class:'mu'},(t.ttype==='py'?'🐍 Python: main.py'+(t.pyf?' + файли':'')+' · numpy: '+(t.pyn?'так':'ні')+' · pandas: '+(t.pyp?'так':'ні')+(t.pyk?' · tkinter: сумісний режим':''):'🌐 Веб: index.html'+(t.fcss!==false?' + CSS':'')+(t.fjs!==false?' + JS':''))+' · шаблон: '+(t.tplOn?'так':'ні')+' · '+(t.timerOn?'таймер: '+t.mins+' хв':'без таймера')+(t.trk||t.wrn||t.lck?' · контроль виходів: '+[t.trk?'облік':'',t.wrn?'попередження ('+(t.wn||3)+')':'',t.lck?'блокування':''].filter(Boolean).join(', '):'')+(t.ttype!=='py'&&clist(t).length?' · ☑ вимог: '+clist(t).length:'')+(t.ttype==='py'&&tlist(t).length?' · 🧪 тестів: '+tlist(t).length+' ('+(t.tmode==='words'?'збіг слів':t.tmode==='has'?'містить':'точний збіг')+')':'')+(t.pst?' · вставка коду: '+(t.pstb?'заборона':'облік'):''))];
    if(t.code){const cb=el('button',{class:'g'},'📋 Код'),lb=el('button',{class:'g'},'🔗 Посилання'),qb=el('button',{class:'g'},'📱 QR-код');qb.onclick=()=>openQR(t);cb.onclick=()=>copy(t.code,cb);lb.onclick=()=>copy(base+'?c='+t.code,lb);
      kids.push(el('div',{class:'row'},el('span',{class:'mu',style:'flex:0 0 auto'},'Код для учнів:'),el('span',{class:'code5'},t.code),cb,lb,qb))}
    kids.push(el('div',{class:'row'},acts));panel.append(el('div',{class:'tp'},kids))};
  const dflt=()=>{const ks=Object.keys(tasks),a=ks.find(k=>tasks[k].status==='active'),k=a||ks.sort((x,y)=>(tasks[y].created||0)-(tasks[x].created||0))[0];if(k)select(k);else drawAll()};
  const select=k=>{prefill=null;newImg=null;mOff();CODE={};sel=k;data={};prev={};pc={};ph={};pl={};pw={};pp={};phs={};ready=false;open=null;cur=(tasks[k]&&tasks[k].cls&&classes[tasks[k].cls])?tasks[k].cls:'all';Object.values(cards).forEach(c=>c.e.remove());cards={};
    if(wref)wref.off('value',wfn);wref=null;
    if(k){wref=db.ref('works/'+k);wfn=s=>{data=s.val()||{};
        if(ready&&Date.now()>quiet&&T()&&T().status==='active')Object.keys(data).forEach(i=>{if(data[i].st==='submitted'&&!data[i].auto&&prev[i]!=='submitted')toast(i,data[i])});
        Object.keys(data).forEach(i=>{const a=Object.values(data[i].chat||{}).filter(x=>x.f==='s').sort((x,y)=>(x.at||0)-(y.at||0));
          if(ready&&a.length>(pc[i]||0)&&open!==i){const m=a[a.length-1].m;toast(i,data[i],'💬 '+data[i].n+': '+(m.length>70?m.slice(0,70)+'…':m))}pc[i]=a.length});
        Object.keys(data).forEach(i=>{const h=!!data[i].help;if(ready&&h&&!ph[i]&&open!==i)toast(i,data[i],'✋ '+data[i].n+' просить допомоги');ph[i]=h});
        Object.keys(data).forEach(i=>{const d=data[i],t=T()||{},th=t.wn||3;
          if(ready&&d.lk&&!pl[i]&&open!==i)toast(i,d,'🔒 '+d.n+' залишив(ла) сторінку — редактор заблоковано');pl[i]=!!d.lk;
          if(ready&&t.wrn&&(d.aw||0)>=th&&!pw[i]&&open!==i)toast(i,d,'👁 '+d.n+': '+d.aw+' виходів зі сторінки');if((d.aw||0)>=th)pw[i]=true;
          if(ready&&(d.pc||0)>(pp[i]||0)&&open!==i){const z=Object.values(d.pl||{}).sort((a,b)=>(b.at||0)-(a.at||0))[0];toast(i,d,(z&&z.b?'⛔ ':'📋 ')+d.n+': '+(z&&z.b?'спроба вставки':'вставка')+' коду'+(z?' ('+z.n+' симв.)':''))}pp[i]=d.pc||0;
          {const n=Object.keys(d.hs||{}).length;if(ready&&n>(phs[i]||0)&&open!==i)toast(i,d,'💡 '+d.n+' відкрив(ла) підказку');phs[i]=n}});
        Object.keys(data).forEach(i=>prev[i]=data[i].st);ready=true;render()};const wr=wref;db.ref('owners/'+k).once('value').then(s=>s.exists()||db.ref('owners/'+k).set(uid)).catch(()=>{}).then(()=>{if(wref===wr)wr.on('value',wfn)})}
    drawAll()};
  const drawAll=()=>{drawBar();drawPanel();render()};
  /* --- класи --- */
  const addClass=()=>{const n=prompt('Назва класу (напр. 9-А):');if(n&&n.trim())cref.push({name:n.trim()})};
  const delClass=()=>{if(confirm('Видалити клас «'+cname(cur)+'»? Роботи учнів залишаться.'))cref.child(cur).remove()};
  const drawChips=()=>{chips.textContent='';const ids=listed();
    const mk=(k,t,list,total)=>{const p=list.filter(i=>data[i].st==='submitted').length,hh=list.filter(i=>data[i].help).length;
      return el('button',{class:cur===k?'on':'g',onclick:()=>{cur=k;drawChips();apply();updAbs()}},t,el('span',{class:'cnt',title:total?'Підключено зараз / усього учнів у списку':'Підключено зараз'},String(list.filter(i=>data[i].on).length)+(total?'/'+total:'')),p?el('span',{class:'cnt',title:'Здали роботу'},'📥'+p):'',hh?el('span',{class:'cnt',title:'Просять допомоги'},'✋'+hh):'')};
    {const cl=Object.values(classes),hasR=c=>c.roster&&Object.keys(c.roster).length;chips.append(mk('all','Усі',ids,cl.length&&cl.every(hasR)?cl.reduce((s,c)=>s+Object.keys(c.roster).length,0):0))}
    Object.keys(classes).sort((a,b)=>classes[a].name.localeCompare(classes[b].name,'uk',{numeric:true})).forEach(k=>chips.append(mk(k,'🏫 '+classes[k].name,ids.filter(i=>data[i].cls===k),classes[k].roster?Object.keys(classes[k].roster).length:0)));
    chips.append(el('button',{class:'g',onclick:addClass},'＋ Додати клас'));
    if(cur!=='all')chips.append(el('button',{class:'g',onclick:openR},'👥 Список класу'),el('button',{class:'g',onclick:delClass},'🗑 Видалити клас'));
    {const t=T();if(!creating&&t&&(t.status==='active'||t.status==='finished')){const on=showGrid();chips.append(el('button',{class:'g',style:'margin-left:auto',onclick:()=>{cardsVis[sel+'|'+t.status]=!showGrid();render()}},on?'🙈 Приховати екрани учнів':'🖥 Показати екрани учнів ('+ids.length+')'))}}};
  /* --- учні --- */
  const STT=d=>d.st==='submitted'?[d.auto?'📥 Здано (авто)':'📥 Здано','s']:d.st==='checked'?['✅ '+(d.grade||'Перевірено'),'k']:d.st==='returned'?['↩ Доопрац.','r']:['',''];
  const stLine=d=>d.st==='submitted'?'📥 Здано '+new Date(d.sub||Date.now()).toLocaleTimeString('uk',{hour:'2-digit',minute:'2-digit'}):d.st==='checked'?'✅ Перевірено'+(d.grade?' · '+d.grade:''):d.st==='returned'?'↩ На доопрацюванні':'✏ Працює';
  const openS=i=>{open=i;modal.dataset.id='';modal._u=null;detail()};
  const toast=(i,d,txt)=>{const t=el('div',{class:'toast',onclick:()=>{t.remove();openS(i)}},txt||('📥 '+d.n+(cname(d.cls)?' ('+cname(d.cls)+')':'')+' здав(ла) роботу'));toasts.append(t);setTimeout(()=>t.remove(),12000);
    try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.15)}catch(e){}};
  /* --- автоперевірка Python у браузері вчителя: результат позначається як перевірений вчителем (t:true) --- */
  let mEng=null;
  const vOf=id=>{const t=T();return t?varOf(t,(classes[t.cls]||{}).roster,id,sel):null};const tAny=t=>tlist(t).length>0||vlist(t).some(v=>tlist(v).length);
  /* --- оцінювання за критеріями: бали зберігаються одразу (works.rs), оцінка рахується автоматично, доки ви не впишете її вручну --- */
  const mRub=(id,d,gr)=>{const t=T(),C=rlist(t);if(!C.length)return'';const rs={...(d.rs||{})},py=t.ttype==='py';
    const calc=()=>rCalc(t,rs),tot=el('div',{style:'font-weight:600'});let man=!!(d.grade&&String(d.grade)!==String(calc().grade));
    gr.addEventListener('input',()=>{man=gr.value.trim()!==''});
    const auto=()=>{const z=data[id]&&(py?data[id].ts:data[id].ws);return z&&z.n?z:null};
    const save=(c,v)=>{rs[c.id]=v;if(!rHas(v))delete rs[c.id];wk(id).update({['rs/'+c.id]:rHas(v)?v:null}).catch(()=>{});show()};
    const show=()=>{const r=calc();tot.textContent='Сума: '+r.sum+' з '+r.max+(r.filled<r.total?' (оцінено '+r.filled+' з '+r.total+' критеріїв)':'')+(r.grade?' → оцінка '+r.grade:'');
      if(!man)gr.value=r.grade?String(r.grade):'';rows.forEach(f=>f())};
    const rows=[];
    const items=C.map(c=>{const inp=el('input',{type:'number',min:0,max:c.m,step:0.5,placeholder:'бали',value:rHas(rs[c.id])?rs[c.id]:''}),q=el('div',{class:'rgq'}),hint=el('div',{class:'mu'});
      inp.onchange=()=>{const v=inp.value.trim()===''?null:Math.max(0,Math.min(c.m,Math.round(+inp.value*2)/2));if(v!==null)inp.value=v;save(c,v)};
      if(c.m<=6&&Number.isInteger(c.m))for(let k=0;k<=c.m;k++)q.append(el('button',{class:'g',onclick:()=>{inp.value=k;save(c,k)}},String(k)));
      q.append(inp,el('span',{class:'mu'},'/ '+c.m));
      rows.push(()=>{q.querySelectorAll('button').forEach(b=>{b.className=rHas(rs[c.id])&&+b.textContent===+rs[c.id]?'on':'g'});const z=c.a&&auto();hint.textContent='';
        if(c.a&&z){const sg=Math.round(c.m*z.p/z.n*2)/2;hint.append((py?'🧪 тести ':'☑ вимоги ')+z.p+'/'+z.n+' → пропоновано '+sg+' ',el('button',{class:'g',style:'padding:1px 8px',onclick:()=>{inp.value=sg;save(c,sg)}},'⤵ застосувати'))}
        else if(c.a)hint.textContent=py?'🧪 тести ще не запускали':'☑ вимоги ще не перевіряли'});
      return el('div',{class:'rgi'},el('div',{},el('div',{},c.t),hint),q)});
    const fillAll=el('button',{class:'g',onclick:()=>{const z=auto();if(!z)return alert(py?'Спершу запустіть тести («🧪 Перевірити тестами»).':'Спершу перевірте вимоги («☑ Перевірити вимоги»).');C.forEach(c=>{if(c.a){const sg=Math.round(c.m*z.p/z.n*2)/2;rs[c.id]=sg;wk(id).update({['rs/'+c.id]:sg}).catch(()=>{})}});man=false;modal._rr&&modal._rr()}},'⤵ Заповнити з автоперевірки');
    const box=el('div',{class:'rgr'},el('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},el('b',{style:'flex:1'},'📊 Оцінювання за критеріями'),C.some(c=>c.a)?fillAll:'',
        el('button',{class:'g',title:'Перерахувати оцінку з балів',onclick:()=>{man=false;show()}},'↺ Оцінка з балів')),...items,tot);
    modal._rr=()=>{items.forEach((it,k)=>{const v=rs[C[k].id];it.querySelector('input').value=rHas(v)?v:''});show()};show();return box};
  const openHist=async(id,btn)=>{const d=data[id];if(!d)return;const t=T()||{},o0=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent='⏳ Завантаження…'}
    let E=null;try{E=(await db.ref('hist/'+sel+'/'+id).once('value')).val()}catch(e){E=null}
    if(btn){btn.disabled=false;btn.textContent=o0}histView(E,{name:d.n,web:t.ttype!=='py',main:t.ttype==='py'?'main.py':'index.html',pl:d.pl})};
  const mTest=async()=>{const t=T(),id=open,TT=tTests(t,vOf(id)),box=modal._tr;if(!TT.length||!box)return;box.style.display='';box.textContent='';const ln=el('div',{class:'mu'},'🧪 Готую перевірку…');box.append(ln);
    if(!mEng)mEng=testEngine();const r=await runTests({eng:mEng,files:{...(modal._F||{})},libs:pyLibs(t),main:'main.py',tests:TT,mode:t.tmode||'exact',limit:t.tlim||5,onStatus:m=>{ln.textContent='⏳ '+m},onProgress:(a,b)=>{ln.textContent='🧪 Перевірено тестів: '+a+' з '+b+'…'}});
    if(open!==id||modal._tr!==box)return;box.textContent='';
    if(r.fatal)return box.append(el('div',{class:'banner rt',style:'margin:0'},'Не вдалося запустити Python: '+r.fatal));
    const p=tPassed(r);box.append(el('div',{class:'banner '+(p===TT.length?'ok':'rt'),style:'margin:0 0 8px'},'🧪 Пройдено тестів: '+p+' з '+TT.length),testView(TT,r.results,true));
    wk(id).update({ts:{p,n:TT.length,at:Date.now(),t:true}}).catch(()=>{})};
  const mWeb=async()=>{const t=T(),C=clist(t),id=open,box=modal._wr;if(!C.length||!box)return;box.style.display='';box.textContent='';box.append(el('div',{class:'mu'},'☑ Перевіряю сторінку…'));
    const res=await webCheck({...(modal._F||{})},C);if(open!==id||modal._wr!==box)return;box.textContent='';const p=cPassed(res);
    box.append(el('div',{class:'banner '+(p===C.length?'ok':'rt'),style:'margin:0 0 8px'},'☑ Виконано вимог: '+p+' з '+C.length),cView(C,res));
    wk(id).update({ws:{p,n:C.length,at:Date.now(),t:true}}).catch(()=>{})};
  let bRun=false;
  const batchTests=async btn=>{const t=T(),web=t&&t.ttype!=='py',TT=web?clist(t):tlist(t);if(bRun||!(web?TT.length:tAny(t)))return;const ids=Object.keys(data).filter(i=>data[i].n);if(!ids.length)return alert('Робіт учнів ще немає.');
    if(!confirm('Запустити '+(web?TT.length+' перевірок вимог':'тести (свого варіанта)')+' для кожної з '+ids.length+' робіт у вашому браузері?\nЦе може зайняти кілька хвилин; кабінетом можна користуватися далі.'))return;
    bRun=true;const s0=sel,eng=web?null:testEngine();let k=0,okAll=0,fatal=null;const lab=()=>{const b=panel.querySelector('[data-bt]');if(b){b.disabled=bRun;b.textContent=bRun?(web?'☑':'🧪')+' Перевіряю '+k+' з '+ids.length+'…':web?'☑ Перевірити вимоги в усіх':'🧪 Перевірити всіх тестами'}};lab();
    try{for(const i of ids){if(sel!==s0)break;k++;lab();let F=null;
        const mf=web?'index.html':'main.py';try{const v=(await db.ref('code/'+s0+'/'+i).once('value')).val();if(v&&v.files)F=filesOf(v,mf)}catch(e){}
        if(!F)F=filesOf(data[i]||{},mf);let p;
        if(web)p=cPassed(await webCheck(F,TT));
        let NN=TT.length;
        if(web)NN=TT.length;else{const TV=tTests(t,vOf(i));NN=TV.length;if(!NN)continue;const r=await runTests({eng,files:F,libs:pyLibs(t),main:'main.py',tests:TV,mode:t.tmode||'exact',limit:t.tlim||5});if(r.fatal){fatal=r.fatal;break}p=tPassed(r)}
        if(p===NN)okAll++;
        await db.ref('works/'+s0+'/'+i+'/'+(web?'ws':'ts')).set({p,n:NN,at:Date.now(),t:true}).catch(()=>{})}}
    finally{if(eng)eng.dispose();bRun=false;lab()}
    if(fatal)alert('Не вдалося запустити Python: '+fatal);else if(sel===s0)alert('Перевірку завершено: '+k+' робіт; '+(web?'усі вимоги виконали ':'усі тести пройшли ')+okAll+'.')};
  const detail=()=>{const d=data[open];if(!d){mOff();if(modal._pyc){modal._pyc.dispose();modal._pyc=null}modal.style.display='none';modal.dataset.id='';return}
    modal.style.display='flex';
    const drawFt=()=>{const ft=modal._ft;ft.textContent='';Object.keys(modal._F).sort(ordF).forEach(n=>ft.append(el('button',{class:n===modal._fc?'on':'g',onclick:()=>{modal._fc=n;modal._e.show(n);drawFt()}},n)))};
    if(modal.dataset.id!==open){if(modal._pyc){modal._pyc.dispose();modal._pyc=null}const isPy=(T()||{}).ttype==='py';modal._isPy=isPy;modal.dataset.id=open;modal.textContent='';modal._rr=null;modal._rrk=null;modal._hv=null;modal._hvk=null;modal._live=false;modal._fc=isPy?'main.py':'index.html';modal._F={};
      const p=frame('none'),ed=mkEditor(true),sl=el('span',{class:'mu'}),chat=mkChat(db.ref('works/'+sel+'/'+open),'t'),ft=el('div',{class:'tabs'});
      const fb=el('input',{placeholder:'Відгук до статусу (необов’язково)',value:d.fb||''}),gr=el('input',{placeholder:'Оцінка',style:'max-width:100px',value:d.grade||''});
      const put=o=>wk(open).update(o);
      const rr=el('button',{class:'g',onclick:()=>{modal._live=true;modal._u=null;detail()}},'▶ Виконати JS'),hb2=el('button',{onclick:()=>put({help:null})},'✔ Допомогу надано'),ub=el('button',{onclick:()=>put({lk:null})},'🔓 Розблокувати'),pvb=el('button',{class:'g',onclick:()=>pasteView(data[open])},'📋 Вставки');modal._hb=hb2;modal._ub=ub;modal._pv=pvb;
      modal._p=p;modal._e=ed;modal._s=sl;modal._c=chat;modal._ft=ft;
      modal.append(el('div',{},el('header',{},el('b',{},d.n+(cname(d.cls)?' · '+cname(d.cls):'')),sl,hb2,ub,pvb,el('button',{class:'g',title:'Як учень набирав код: відтворення в часі',onclick:e=>openHist(open,e.target)},'⏯ Історія'),el('button',{class:'g',onclick:()=>{open=null;detail()}},'✕ Закрити')),
        el('div',{class:'tp'},el('div',{class:'row'},fb,gr),(modal._hv=el('div',{style:'display:grid;gap:6px'})),mRub(open,d,gr),
          el('div',{class:'row'},el('button',{class:'g',onclick:()=>{put({st:'returned',fb:fb.value,grade:null,auto:null});jdel(open)}},'↩ На доопрацювання'),
            el('button',{onclick:()=>{const r=rlist(T()).length?rCalc(T(),data[open].rs||{}):null;if(r&&r.filled<r.total&&!confirm('Оцінено '+r.filled+' з '+r.total+' критеріїв. Однаково позначити роботу перевіреною?'))return;put({st:'checked',fb:fb.value,grade:gr.value||null,chk:Date.now()});jrec(open,gr.value.trim())}},'✔ Перевірено — повідомити учню'))),
        el('div',{class:'ws c3',style:'flex:1;height:auto'},el('div',{class:'pane'},ft,ed.host),
          isPy?(modal._lo=el('pre',{class:'thp2'}),modal._pyc=mkPy({files:()=>modal._F,libs:()=>pyLibs(T()),main:()=>'main.py',gui:()=>!!(T()&&T().pyk)}),el('div',{class:'pane'},el('div',{class:'tabs'},el('button',{class:'g',onclick:()=>modal._pyc.run()},'▶ Виконати код учня'),(tAny(T())&&!(T()||{}).pyk)?el('button',{class:'g',onclick:()=>mTest()},'🧪 Перевірити тестами'):'',el('button',{class:'g',onclick:()=>modal._pyc.stop()},'⏹ Зупинити'),el('span',{class:'mu'},'в ізольованому середовищі')),el('div',{class:'mu',style:'padding:6px 10px'},'Останній вивід, який бачив учень:'),modal._lo,modal._pyc.el,(modal._tr=el('div',{class:'tres',style:'display:none'})))):el('div',{class:'pane'},el('div',{class:'tabs'},rr,clist(T()).length?el('button',{class:'g',onclick:()=>mWeb()},'☑ Перевірити вимоги'):'',el('span',{class:'mu'},'Перегляд без виконання JS')),p,(modal._wr=el('div',{class:'tres',style:'display:none'}))),
          el('div',{class:'pane chatpane'},el('div',{class:'tabs'},el('b',{},'💬 Чат з учнем')),chat.el))));
      chat.show(true);setTimeout(()=>ed.refresh(),60)}
    modal._s.textContent=stLine(d)+(d.help?' · ✋ просить допомоги':'')+(d.aw?' · 👁 '+d.aw+' виходів ('+fmtDur(d.am)+')':'')+(d.lk?' · 🔒 заблоковано':'')+(d.pc?' · 📋 '+d.pc+' вставок ('+(d.pz||0)+' симв.)':'')+(d.ts?' · 🧪 '+d.ts.p+'/'+d.ts.n+(d.ts.t?' (перевірено вчителем)':' (перевірив учень)'):'')+(d.ws?' · ☑ '+d.ws.p+'/'+d.ws.n+(d.ws.t?' (перевірено вчителем)':' (перевірив учень)'):'');modal._pv.style.display=d.pc?'':'none';modal._pv.textContent='📋 Вставки ('+(d.pc||0)+')';modal._hb.style.display=d.help?'':'none';modal._ub.style.display=d.lk?'':'none';modal._c.update(d);
    if(modal._hv){const t=T(),H=hlist(t),vv=vlist(t).length?vOf(open):null,key=JSON.stringify([H,t.hr,d.hu,d.hs,vv&&vv.id]);
      if(modal._hvk!==key){modal._hvk=key;const b=modal._hv;b.textContent='';
        if(vv)b.append(el('details',{},el('summary',{},'🔀 Варіант '+vNum(t,vv)+(t.va&&t.va[open]?' (призначено вручну)':'')),el('div',{style:'white-space:pre-wrap;margin-top:6px'},vv.x)));
        if(H.length)b.append(el('div',{style:'display:flex;gap:6px;flex-wrap:wrap;align-items:center'},el('span',{class:'mu'},'💡 Підказки:'),H.map((h,k)=>{const w=hWho(t,d,h);
          return w?el('span',{class:'bd hn',title:h.t},'П'+(k+1)+' '+(w==='all'?'(всім)':w==='me'?'(особисто)':'(відкрив сам '+new Date(d.hs[h.id]).toLocaleTimeString('uk',{hour:'2-digit',minute:'2-digit'})+')')):
            el('button',{class:'g',style:'padding:2px 10px',title:h.t,onclick:()=>wk(open).update({['hu/'+h.id]:true}).catch(e=>alert(e.message||e))},'💡 Дати П'+(k+1))})))}}
    if(modal._rr&&modal._rrk!==JSON.stringify([d.ts,d.ws])){modal._rrk=JSON.stringify([d.ts,d.ws]);modal._rr()}
    if(modal._isPy&&modal._lo)modal._lo.textContent=d.out||'(учень ще не запускав програму)';
    if(!mref||mref.key!==open||mref.parent.key!==sel)setTimeout(()=>{if(open&&data[open]&&(!mref||mref.key!==open))mOn(open)},0);
    const mkey=(modal._cv||0)+'|'+(d.files?d.upd:'');if(modal._u!==mkey){modal._u=mkey;const F=codeOf(open,modal._isPy?'main.py':'index.html');modal._F=F;Object.keys(F).forEach(n=>modal._e.sync(n,F[n]));
      if(!(modal._fc in F))modal._fc=modal._isPy?'main.py':'index.html';modal._e.show(modal._fc);drawFt();
      if(!modal._isPy){modal._p.setAttribute('sandbox',modal._live?'allow-scripts':'');modal._p.srcdoc=bundle(F).html}}};
  const render=()=>{const all=listed().sort((a,b)=>(data[b].help?1:0)-(data[a].help?1:0)||((data[a].help&&data[b].help)?data[a].help-data[b].help:0)||data[a].n.localeCompare(data[b].n,'uk')),ids=showGrid()?all:[];
    Object.keys(cards).forEach(i=>{if(!ids.includes(i)){cards[i].e.remove();delete cards[i]}});
    ids.forEach(i=>{const d=data[i];let c=cards[i];
      if(!c){const nm=el('span',{style:'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'}),hp=el('span',{class:'bd h'},'✋ Допомога'),hx=el('button',{class:'g',title:'Допомогу надано',style:'padding:0 7px',onclick:e=>{e.stopPropagation();wk(i).update({help:null})}},'✔'),ab=el('span',{class:'bd a'}),pb=el('span',{class:'bd p'}),tsb=el('span',{class:'bd t'}),wsb=el('span',{class:'bd t'}),vb=el('span',{class:'bd v'}),hb3=el('span',{class:'bd hn'}),ux=el('button',{class:'g',title:'Розблокувати редактор',style:'padding:0 7px',onclick:e=>{e.stopPropagation();wk(i).update({lk:null})}},'🔓'),bd=el('span',{class:'bd'}),cb=el('span',{class:'bd c'}),tm=el('span',{class:'mu'}),dot=el('span',{class:'dot'}),th=el('div',{class:'th'},(T()&&T().ttype==='py')?el('pre',{class:'thp'}):frame('none'));
        c=cards[i]={e:el('div',{class:'st',onclick:()=>openS(i)},el('h4',{},dot,nm,vb,hp,hx,ux,ab,pb,tsb,wsb,hb3,cb,bd,tm),th),nm,bd,cb,tm,dot,hp,hx,ab,pb,tsb,wsb,vb,hb3,ux,f:th.firstChild}}
      c.dot.className='dot'+(d.on?' o':'');c.nm.textContent=d.n+(cname(d.cls)?' · '+cname(d.cls):'');c.tm.textContent=ago(d.upd);
      const[b,k]=STT(d);c.bd.textContent=b;c.bd.className='bd '+k;c.bd.style.display=b?'':'none';{const u=unreadOf(d,'t');c.cb.textContent=u?'💬'+u:'';c.cb.style.display=u?'':'none'}c.hp.style.display=c.hx.style.display=d.help?'':'none';c.ab.textContent=d.aw?'👁'+d.aw:'';c.ab.style.display=d.aw?'':'none';c.ab.title='Виходів зі сторінки: '+(d.aw||0)+', разом '+fmtDur(d.am);{const t0=T(),vv=t0&&vlist(t0).length?vOf(i):null;c.vb.style.display=vv?'':'none';if(vv){c.vb.textContent='В'+vNum(t0,vv);c.vb.title='Варіант '+vNum(t0,vv)}
        const hm=t0?hlist(t0).filter(h=>!(t0.hr&&t0.hr[h.id])&&(d.hu&&d.hu[h.id]||d.hs&&d.hs[h.id])).length:0,hsf=t0?hlist(t0).filter(h=>d.hs&&d.hs[h.id]&&!(d.hu&&d.hu[h.id])).length:0;
        c.hb3.style.display=hm?'':'none';c.hb3.textContent='💡'+hm;c.hb3.title='Особисті підказки: '+hm+(hsf?' (з них '+hsf+' учень відкрив сам)':'')}
      {const z=d.ws;c.wsb.style.display=z?'':'none';if(z){c.wsb.textContent='☑'+z.p+'/'+z.n+(z.t?'✔':'');c.wsb.className='bd t'+(z.p<z.n?' f':'');c.wsb.title='Вимоги: виконано '+z.p+' з '+z.n+(z.t?', перевірено вчителем':', перевірив учень')}}{const z=d.ts;c.tsb.style.display=z?'':'none';if(z){c.tsb.textContent='🧪'+z.p+'/'+z.n+(z.t?'✔':'');c.tsb.className='bd t'+(z.p<z.n?' f':'');c.tsb.title='Тести: пройдено '+z.p+' з '+z.n+(z.t?', перевірено вчителем':', перевірив учень')+' о '+new Date(z.at||0).toLocaleTimeString('uk',{hour:'2-digit',minute:'2-digit'})}}c.pb.textContent=d.pc?'📋'+d.pc:'';c.pb.style.display=d.pc?'':'none';c.pb.title='Вставок коду з інших джерел: '+(d.pc||0)+', разом '+(d.pz||0)+' симв.';c.ux.style.display=d.lk?'':'none';c.e.className='st'+(d.st==='submitted'?' sub':'')+(d.help?' hlp':'')+(d.lk?' lk':'');
      {const ck=((CODE[i]&&CODE[i].v)||0)+'|'+(d.files?d.upd:'')+'|'+(d.out||'');if(c.k!==ck){c.k=ck;if(c.f.tagName==='PRE')c.f.textContent=d.out?'▶ '+String(d.out).slice(-420):(codeOf(i,'main.py')['main.py']||'').slice(0,420);else c.f.srcdoc=bundle(codeOf(i,'index.html')).html}}
      grid.append(c.e)});
    drawChips();apply();updAbs();updDc();if(open&&!all.includes(open))open=null;detail()};
  const exp=async()=>{const t=T();if(!t)return;let cd={};try{cd=(await db.ref('code/'+sel).once('value')).val()||{}}catch(e){}
    const sts={};Object.keys(data).forEach(i=>{sts[i]={...data[i]};if(cd[i]&&cd[i].files)sts[i].files=cd[i].files});
    const b=new Blob([JSON.stringify({task:t,classes,students:sts},null,1)],{type:'application/json'});el('a',{href:URL.createObjectURL(b),download:'роботи_'+(t.code||'завдання')+'.json'}).click()};
  /* --- журнал оцінок: окреме сховище journal/{вчитель}/{клас}/{тема}/{учень}; не залежить від видалення робіт --- */
  let jref=null,jfn=null,jdata={},jcls=null,jview='topics',jerr=false;
  const jm=el('div',{class:'modal',style:'display:none'}),jch=el('div',{class:'chips'}),jb=el('div',{class:'jw'});
  const fmt=ts=>ts?new Date(ts).toLocaleDateString('uk',{day:'2-digit',month:'2-digit',year:'numeric'}):'—';
  const nameCmp=(a,b)=>(a.ln||'').localeCompare(b.ln||'','uk')||(a.fn||'').localeCompare(b.fn||'','uk');
  const jEntries=c=>{const o=[],T=jdata[c]||{};Object.keys(T).forEach(t=>Object.keys(T[t]).forEach(s=>o.push({t,s,...T[t][s]})));return o};
  const jName=c=>(classes[c]&&classes[c].name)||(jEntries(c)[0]||{}).cn||'Без класу';
  const jrec=(sid,grade)=>{const w=data[sid],t=T();if(!w)return;const cid=w.cls||'none',p=(w.n||'').split(' ');
    db.ref('journal/'+uid+'/'+cid+'/'+sel+'/'+sid).set({fn:w.fn||p[0]||'',ln:w.ln||p.slice(1).join(' '),g:grade||'',d:w.sub||(t&&t.started)||w.upd||Date.now(),chk:Date.now(),tt:t?t.title:'',td:t?(t.started||t.created||0):0,cn:w.cn||cname(w.cls)||''})
      .catch(()=>alert('Оцінку не записано в журнал. Додайте в правила Firebase розділ journal (див. інструкцію).'))};
  const jdel=sid=>{const w=data[sid];if(w)db.ref('journal/'+uid+'/'+(w.cls||'none')+'/'+sel+'/'+sid).remove().catch(()=>{})};
  const drawJ=()=>{jch.textContent='';jb.textContent='';
    if(jerr){jb.append(el('div',{class:'banner rt'},'Немає доступу до журналу. У Firebase → Realtime Database → Rules додайте розділ journal (див. інструкцію) й оновіть сторінку.'));return}
    const cids=Object.keys(jdata).sort((a,b)=>jName(a).localeCompare(jName(b),'uk',{numeric:true}));
    if(!cids.length){jb.append(el('div',{class:'mu',style:'padding:16px'},'Журнал порожній. Оцінки з’являються тут, коли ви натискаєте «✔ Перевірено».'));return}
    if(!jcls||!jdata[jcls])jcls=cids[0];
    cids.forEach(c=>jch.append(el('button',{class:c===jcls?'on':'g',onclick:()=>{jcls=c;drawJ()}},'🏫 '+jName(c))));
    jch.append(el('span',{style:'flex:1'}),el('button',{class:jview==='topics'?'on':'g',onclick:()=>{jview='topics';drawJ()}},'По темах'),el('button',{class:jview==='matrix'?'on':'g',onclick:()=>{jview='matrix';drawJ()}},'Таблиця'));
    const E=jEntries(jcls),topics={},cell={},S={};
    E.forEach(e=>{const tp=topics[e.t]=topics[e.t]||{t:e.t,title:e.tt||'Без назви',td:e.td||e.d||0,rows:[]};if(e.td&&(!tp.td||e.td<tp.td))tp.td=e.td;tp.rows.push(e);cell[e.t+'|'+e.s]=e;S[e.s]={s:e.s,fn:e.fn,ln:e.ln}});
    const TL=Object.values(topics).sort((a,b)=>a.td-b.td),th=h=>el('th',{},h);
    if(jview==='topics')TL.forEach(tp=>jb.append(el('h3',{class:'jh'},'📝 '+tp.title,el('span',{class:'mu'},'  ·  '+fmt(tp.td))),
      el('div',{class:'jx'},el('table',{class:'jt'},el('thead',{},el('tr',{},['Дата здачі','Прізвище','Ім’я','Оцінка'].map(th))),
        el('tbody',{},tp.rows.sort(nameCmp).map(e=>el('tr',{},el('td',{},fmt(e.d)),el('td',{},e.ln),el('td',{},e.fn),el('td',{class:'jg'},e.g||'✓'))))))));
    else{const SL=Object.values(S).sort(nameCmp);
      jb.append(el('div',{class:'jx'},el('table',{class:'jt'},el('thead',{},el('tr',{},th('Прізвище та ім’я'),TL.map(tp=>el('th',{},tp.title,el('div',{class:'mu'},fmt(tp.td)))),th('Сер.'))),
        el('tbody',{},SL.map(s=>{const nums=[];const tds=TL.map(tp=>{const e=cell[tp.t+'|'+s.s];if(e){const x=parseFloat(String(e.g).replace(',','.'));if(!isNaN(x))nums.push(x)}
          return el('td',{class:'jg'},e?[e.g||'✓',el('div',{class:'mu'},fmt(e.d))]:'')});
          return el('tr',{},el('td',{},(s.ln||'')+' '+(s.fn||'')),tds,el('td',{class:'jg'},nums.length?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1):''))})))))}};
  const csv=()=>{const rows=[['Клас','Тема','Дата теми','Дата здачі','Прізвище','Ім’я','Оцінка']];
    Object.keys(jdata).sort((a,b)=>jName(a).localeCompare(jName(b),'uk',{numeric:true})).forEach(c=>jEntries(c).sort((a,b)=>(a.td||0)-(b.td||0)||nameCmp(a,b)).forEach(e=>rows.push([jName(c),e.tt,fmt(e.td),fmt(e.d),e.ln,e.fn,e.g||''])));
    const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"',b=new Blob(['\uFEFF'+rows.map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});el('a',{href:URL.createObjectURL(b),download:'журнал_оцінок.csv'}).click()};
  const closeJ=()=>{jm.style.display='none';if(jref){jref.off('value',jfn);jref=null}};
  const openJ=()=>{jm.style.display='flex';jerr=false;if(!jref){jref=db.ref('journal/'+uid);jfn=s=>{jdata=s.val()||{};drawJ()};jref.on('value',jfn,()=>{jerr=true;drawJ()})}drawJ()};
  jm.append(el('div',{},el('header',{},el('b',{},'📒 Журнал оцінок'),el('button',{class:'g',onclick:csv},'⬇ CSV (Excel)'),el('button',{class:'g',onclick:closeJ},'✕ Закрити')),jch,jb));
  /* --- списки класів і відвідуваність --- */
  const absent=el('div',{class:'mu',style:'padding:0 16px 12px'});
  const updAbs=()=>{const c=cur!=='all'?classes[cur]:null,R=c&&c.roster?Object.keys(c.roster):[];
    if(creating){absent.style.display='none';return}
    if(c&&!R.length){absent.style.display='';absent.textContent='⚠ Для цього класу не створено список учнів — вони не зможуть підключитися. Натисніть «👥 Список класу».';return}
    if(!R.length||!T()){absent.style.display='none';return}
    const miss=R.filter(i=>!(data[i]&&data[i].n)).map(i=>c.roster[i]).sort(byName).map(x=>x.ln+' '+x.fn);
    absent.style.display='';absent.textContent=miss.length?'Не підключились ('+miss.length+' із '+R.length+'): '+miss.join(', '):'✅ Підключились усі ('+R.length+')'};
  const rm=el('div',{class:'modal',style:'display:none'}),rta=el('textarea',{rows:16,placeholder:'Один учень у рядку: Прізвище Ім’я',style:'font:14px/1.5 ui-monospace,Menlo,monospace'}),rinfo=el('div',{class:'mu'}),rt=el('b',{},''),fin=el('input',{type:'file',accept:'.csv,.txt,text/csv,text/plain',style:'display:none'});let rcid=null;
  const decode=buf=>{try{return new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(e){return new TextDecoder('windows-1251').decode(buf)}};
  const closeR=()=>{rm.style.display='none'};
  const openR=()=>{rcid=cur;const R=(classes[cur]&&classes[cur].roster)||{};rta.value=Object.values(R).sort(byName).map(x=>x.ln+' '+x.fn).join('\n');rinfo.textContent='';rt.textContent='👥 Список класу «'+cname(rcid)+'»';rm.style.display='flex'};
  const saveR=()=>{const{map,dup,bad}=parseRoster(rta.value),n=Object.keys(map).length;
    if(!confirm('Зберегти список класу «'+cname(rcid)+'»: '+n+' учнів'+(dup?'\nПовторів пропущено: '+dup:'')+(bad?'\nРядків без прізвища чи імені пропущено: '+bad:'')+(n?'':'\nСписок буде очищено — учні знову вводитимуть ім’я вручну.')))return;
    cref.child(rcid+'/roster').set(n?map:null).then(closeR,()=>alert('Не вдалося зберегти список'))};
  fin.onchange=()=>{const f=fin.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const t=decode(r.result).trim();rta.value=(rta.value.trim()?rta.value.trim()+'\n':'')+t;rinfo.textContent='Файл «'+f.name+'» додано до списку. Перевірте його й натисніть «Зберегти список».';fin.value=''};r.readAsArrayBuffer(f)};
  rm.append(el('div',{style:'overflow:auto'},el('header',{},rt,el('button',{class:'g',onclick:closeR},'✕ Закрити')),el('div',{class:'tp'},
    el('div',{class:'mu'},'Один учень у рядку: «Прізвище Ім’я». Підходить і CSV («Прізвище;Ім’я»). Додаткові слова (по батькові) ігноруються. Збережений список замінює попередній; учні обиратимуть себе з нього при вході.'),rta,
    el('div',{class:'row'},el('button',{class:'g',onclick:()=>fin.click()},'📂 Імпорт з файлу (CSV, TXT)'),el('button',{onclick:saveR},'💾 Зберегти список')),rinfo,fin)));
  /* --- пошта для відновлення пароля --- */
  const user=AU.currentUser,legacy=!!(user&&(user.email||'').endsWith(EM)),warn=el('div',{class:'banner rt',style:'display:none'});
  const addMail=async()=>{const em=(prompt('Ваша електронна пошта для відновлення пароля:')||'').trim().toLowerCase();if(!em)return;
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return alert('Некоректна адреса пошти');
    const login=prof.login||(user.email||'').split('@')[0];
    try{await user.verifyBeforeUpdateEmail(em);await db.ref('logins/'+login).set({o:uid,e:em}).catch(()=>{});await db.ref('teachers/'+uid+'/email').set(em).catch(()=>{});
      alert('Лист для підтвердження надіслано на '+em+'. Після підтвердження входьте як і раніше, а відновлення пароля працюватиме.')}
    catch(e){alert(AE(e))}};
  const chPw=async()=>{if(!user||legacy)return alert('Спочатку додайте пошту для відновлення (кнопка «✉ Додати пошту» вгорі).');
    if(!confirm('Надіслати лист для зміни пароля на '+user.email+'?'))return;try{await AU.sendPasswordResetEmail(user.email);alert('Лист надіслано. Перевірте також «Спам».')}catch(e){alert(AE(e))}};
  const drawWarn=()=>{warn.textContent='';
    if(legacy){warn.style.display='';warn.append('⚠ До акаунта не прив’язано пошту — забутий пароль відновити буде неможливо. ',el('button',{onclick:addMail},'✉ Додати пошту'))}
    else if(user&&!user.emailVerified){warn.style.display='';warn.append('✉ Пошту '+user.email+' ще не підтверджено — без цього лист для відновлення пароля може не дійти. ',el('button',{onclick:()=>user.sendEmailVerification().then(()=>alert('Лист надіслано. Перевірте також «Спам».'),e=>alert(AE(e)))},'Надіслати лист ще раз'))}
    else warn.style.display='none'};
  /* --- архів: роботи завершених завдань → файл JSON, потім очищення бази; перегляд файлів архіву --- */
  const arM=el('div',{class:'modal',style:'display:none'}),avM=el('div',{class:'modal',style:'display:none'});
  const ymd=ts=>{const d=new Date(ts||Date.now());return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const fname=x=>String(x||'').replace(/[\\/:*?"<>|]+/g,'_').trim().slice(0,60)||'завдання';
  const dl=(obj,name)=>{const b=new Blob([JSON.stringify(obj,null,1)],{type:'application/json'}),a=el('a',{href:URL.createObjectURL(b),download:name});document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},5000)};
  const arPack=async tid=>{const t=tasks[tid];
    const [w,c,im,hs]=await Promise.all([db.ref('works/'+tid).once('value').then(x=>x.val()||{}),db.ref('code/'+tid).once('value').then(x=>x.val()||{},()=>({})),db.ref('timg/'+uid+'/'+tid).once('value').then(x=>x.val(),()=>null),db.ref('hist/'+tid).once('value').then(x=>x.val()||{},()=>({}))]);
    const st={};Object.keys(w).forEach(i=>{st[i]={...w[i]};if(c[i]&&c[i].files)st[i].files=c[i].files});
    return{id:tid,task:t,image:im||null,hist:hs,classes:t.cls&&classes[t.cls]?{[t.cls]:{name:classes[t.cls].name}}:{},students:st}};
  const arDo=async(ids,btn)=>{ids=ids.filter(k=>tasks[k]&&tasks[k].status==='finished');if(!ids.length)return alert('Архівувати можна лише завершені завдання.');
    if(btn)btn.disabled=true;
    try{const packs=[];for(const k of ids)packs.push(await arPack(k));const n=packs.reduce((a,p)=>a+Object.keys(p.students).length,0);
      if(!n)return alert('У '+(ids.length>1?'вибраних завданнях':'цьому завданні')+' немає робіт учнів — архівувати нічого.');
      const name='архів_'+(ids.length===1?fname(tasks[ids[0]].title):ids.length+'_завдань')+'_'+ymd()+'.json';
      dl({kind:'klas-kod-archive',v:1,at:Date.now(),teacher:who,tasks:packs},name);
      if(!confirm('Файл «'+name+'» ('+n+' робіт) завантажено.\n\nПереконайтеся, що він зберігся на комп’ютері (папка «Завантаження»), і натисніть OK, щоб видалити ці роботи з бази.\nСкасувати — роботи залишаться в базі.\n\nЗавдання, зображення-зразок і оцінки в журналі залишаться.'))return;
      const u={},now=Date.now();packs.forEach(p=>{u['works/'+p.id]=null;u['tasks/'+uid+'/'+p.id+'/arch']={at:now,n:Object.keys(p.students).length}});await db.ref().update(u);
      packs.forEach(p=>{db.ref('code/'+p.id).remove().catch(()=>{});db.ref('hist/'+p.id).remove().catch(()=>{})});if(ids.includes(sel))CODE={}}
    catch(e){alert('Не вдалося архівувати: '+(e.message||e))}
    finally{if(btn)btn.disabled=false;if(arM.style.display!=='none')arOpen()}};
  let arSel=new Set(),arCnt={};
  const arDraw=()=>{arM.textContent='';const ks=Object.keys(tasks).sort((a,b)=>(tasks[b].finished||tasks[b].created||0)-(tasks[a].finished||tasks[a].created||0));
    const can=k=>tasks[k].status==='finished'&&arCnt[k]>0;[...arSel].forEach(k=>{if(!tasks[k]||!can(k))arSel.delete(k)});
    const go=el('button',{onclick:e=>arDo([...arSel],e.target)},'📦 Архівувати вибрані ('+arSel.size+')');go.disabled=!arSel.size;
    const old=el('button',{class:'g',onclick:()=>{const lim=Date.now()-30*864e5;ks.forEach(k=>{if(can(k)&&(tasks[k].finished||0)<lim)arSel.add(k)});arDraw()}},'Вибрати завершені понад 30 днів тому');
    const rows=ks.map(k=>{const t=tasks[k],c=arCnt[k],ck=el('input',{type:'checkbox',style:'width:auto;flex:none'});ck.checked=arSel.has(k);ck.disabled=!can(k);ck.onchange=()=>{ck.checked?arSel.add(k):arSel.delete(k);arDraw()};
      const info=(t.status==='finished'?'⏹ завершено '+(t.finished?new Date(t.finished).toLocaleDateString('uk'):''):t.status==='active'?'🟢 активне':'📝 чернетка')+(cname(t.cls)?' · '+cname(t.cls):'')+' · робіт у базі: '+(c===undefined?'…':c)+(t.arch?' · 📦 архів '+new Date(t.arch.at).toLocaleDateString('uk')+' ('+(t.arch.n||0)+')':'');
      return el('label',{style:'display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--bd)'},ck,el('div',{style:'flex:1;min-width:0'},el('div',{},t.title||'(без назви)'),el('div',{class:'mu'},info)))});
    arM.append(el('div',{style:'flex:none;margin:auto;width:min(760px,96vw);max-height:92vh'},el('header',{},el('b',{style:'flex:1'},'🗄 Архів і очищення бази'),el('button',{class:'g',onclick:arLoad},'📂 Переглянути файл архіву'),el('button',{class:'g',onclick:()=>{arM.style.display='none'}},'✕ Закрити')),
      el('div',{class:'tp'},el('div',{class:'mu'},'Архівування зберігає роботи учнів (код, статуси, оцінки, відгуки, переписку) у файл JSON на вашому комп’ютері й видаляє їх з бази. Завдання, зображення-зразок і журнал оцінок залишаються, тож завдання можна скопіювати або задати знову. Файл архіву можна будь-коли переглянути кнопкою «📂 Переглянути файл архіву».'),
        el('div',{class:'row'},old,go)),el('div',{class:'jw'},rows.length?rows:el('div',{class:'mu'},'Завдань ще немає.'))))};
  const arOpen=()=>{arM.style.display='flex';arCnt={};arDraw();Promise.all(Object.keys(tasks).map(k=>db.ref('works/'+k).once('value').then(x=>{arCnt[k]=Object.keys(x.val()||{}).length},()=>{arCnt[k]=0}))).then(()=>{if(arM.style.display!=='none')arDraw()})};
  const arLoad=()=>{const f=el('input',{type:'file',accept:'.json,application/json'});f.onchange=()=>{const x=f.files[0];if(!x)return;
      const r=new FileReader();r.onload=()=>{let o;try{o=JSON.parse(r.result)}catch(e){return alert('Не вдалося прочитати файл: це не JSON.')}
        const packs=o&&o.kind==='klas-kod-archive'&&Array.isArray(o.tasks)?o.tasks:(o&&o.task&&o.students?[{id:'',task:o.task,classes:o.classes||{},students:o.students}]:null);
        if(!packs||!packs.length)return alert('Файл не схожий на архів або експорт Клас-коду.');avOpen(packs,x.name)};r.readAsText(x)};f.click()};
  const avOpen=(packs,name)=>{let ti=0,si=null,fc=null;
    const draw=()=>{avM.textContent='';const p=packs[ti]||{},t=p.task||{},S=p.students||{},py=t.ttype==='py',main=py?'main.py':'index.html';
      const ids=Object.keys(S).filter(i=>S[i]&&S[i].n).sort((a,b)=>byName(S[a],S[b])||String(S[a].n).localeCompare(String(S[b].n),'uk'));
      const tsel=el('select',{style:'width:auto;max-width:360px'});packs.forEach((q,k)=>tsel.append(el('option',{value:k},((q.task||{}).title||'(без назви)')+' · '+Object.keys(q.students||{}).length+' робіт')));tsel.value=ti;tsel.onchange=()=>{ti=+tsel.value;si=null;fc=null;draw()};
      const list=el('div',{class:'avl'},ids.length?ids.map(i=>{const d=S[i],[b]=STT(d);return el('button',{class:i===si?'on':'g',style:'display:block;width:100%;text-align:left;margin-bottom:4px',onclick:()=>{si=i;fc=null;draw()}},d.n,el('span',{class:'mu',style:'margin-left:6px'},(b||'✏ не здано')+(((p.classes||{})[d.cls]||{}).name?' · '+p.classes[d.cls].name:d.cn?' · '+d.cn:'')))}):el('div',{class:'mu'},'Робіт немає.'));
      let det;const d=si&&S[si];
      if(!d)det=el('div',{class:'avd'},el('h3',{style:'margin:0'},'📝 '+(t.title||'(без назви)')),t.text?el('div',{class:'banner',style:'margin:0'},t.text):'',p.image?imgThumb(p.image):'',
        el('div',{class:'mu'},(t.finished?'Завершено '+new Date(t.finished).toLocaleString('uk',{dateStyle:'short',timeStyle:'short'})+' · ':'')+'Робіт: '+ids.length+'. Оберіть учня ліворуч, щоб переглянути його роботу.'));
      else{const F=filesOf(d,main),ns=Object.keys(F).sort(ordF);if(!fc||!(fc in F))fc=ns.includes(main)?main:ns[0];
        const tabs=el('div',{class:'tabs'},ns.map(n=>el('button',{class:n===fc?'on':'g',onclick:()=>{fc=n;draw()}},n)));
        const chat=Object.values(d.chat||{}).sort((a,b)=>(a.at||0)-(b.at||0));
        const pv=py?null:frame('none');if(pv){pv.setAttribute('sandbox','');pv.srcdoc=bundle(F).html}
        det=el('div',{class:'avd'},el('h3',{style:'margin:0'},d.n),
          d.rs&&rlist(t).length?rubView(t,d.rs):'',el('div',{class:'mu'},stLine(d)+(d.fb?' · відгук: '+d.fb:'')+(d.aw?' · 👁 '+d.aw+' виходів':'')+(d.pc?' · 📋 '+d.pc+' вставок':'')),
          el('div',{class:'row'},d.pc?el('button',{class:'g',style:'flex:0 0 auto',onclick:()=>pasteView(d)},'📋 Вставки ('+d.pc+')'):'',p.hist&&p.hist[si]?el('button',{class:'g',style:'flex:0 0 auto',onclick:()=>histView(p.hist[si],{name:d.n,web:!py,main,pl:d.pl})},'⏯ Історія набору'):''),
          tabs,el('pre',{class:'avc'},F[fc]||''),
          py?el('div',{},el('b',{},'Останній вивід програми'),el('pre',{class:'avc'},d.out||'(немає)')):el('div',{},el('b',{},'Вигляд сторінки (без виконання JS)'),pv),
          chat.length?el('div',{},el('b',{},'💬 Переписка'),chat.map(m=>el('div',{class:'mu'},(m.f==='t'?'Вчитель':'Учень')+(m.at?' · '+new Date(m.at).toLocaleString('uk',{dateStyle:'short',timeStyle:'short'}):'')+': ',el('span',{style:'color:var(--tx)'},m.m||'')))):'')}
      avM.append(el('div',{},el('header',{},el('b',{style:'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'},'📂 '+name),packs.length>1?tsel:'',el('button',{class:'g',onclick:()=>{avM.style.display='none';avM.textContent=''}},'✕ Закрити')),
        el('div',{class:'avw'},list,det)))};
    avM.style.display='flex';draw()};
  $app.append(el('header',{},el('b',{},'🧑‍🏫 '+who),el('button',{class:'g',onclick:openJ},'📒 Журнал'),el('button',{class:'g',onclick:arOpen},'🗄 Архів'),el('button',{class:'g',onclick:exp},'⬇ Роботи (JSON)'),el('button',{class:'g',onclick:chPw},'🔑 Пароль'),el('button',{class:'g',onclick:()=>AU.signOut().then(()=>location.reload())},'Вийти')),warn,tbar,panel,chips,tctl,grid,empty,absent,modal,jm,rm,dm,qm,arM,avM,rbM,hiM,vaM,toasts);
  drawWarn();if(user&&user.reload)user.reload().then(drawWarn,()=>{});
  tref.on('value',s=>{tasks=s.val()||{};if(sel&&!tasks[sel])select(null);
    drawBar();if(kPanel()!==pkey)drawPanel();render();
    if(vaM.style.display!=='none')openVars();if(hiM.style.display!=='none'&&!hiM.querySelector('details[open]'))openHints()});
  cref.on('value',s=>{classes=s.val()||{};if(cur!=='all'&&!classes[cur])cur='all';render()});
  setInterval(()=>Object.keys(cards).forEach(i=>data[i]&&(cards[i].tm.textContent=ago(data[i].upd))),15000);
  setInterval(()=>{const t=T();
    if(t&&panel._tm&&t.endsAt){const r=t.endsAt-tnow();panel._tm.textContent='⏱ '+fmtT(r);panel._tm.className='tmr'+(r<=60000?' low':'')}
    Object.keys(tasks).forEach(id=>{const x=tasks[id];
      if(x.status==='active'&&x.endsAt&&tnow()>=x.endsAt&&fired!==id+'|'+x.endsAt){fired=id+'|'+x.endsAt;
        if(id===sel)finish(true);else tref.child(id).update({status:'finished',finished:tnow()})}})},1000);
}
