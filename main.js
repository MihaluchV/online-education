/* Клас-код · запуск: вибір сторінки (учень або #teacher)
   Звичайний скрипт (не модуль): усі файли js/ мають спільну глобальну область видимості; порядок підключення — в index.html. */
function home(){
  clear();
  if(JSON.stringify(CFG).includes('ВАШ')){$app.append(el('div',{class:'box'},el('h2',{},'Потрібне налаштування'),el('p',{},'Вставте свій firebaseConfig у верхній частині index.html (див. інструкцію).')));return}
  if(!db){const app=location.hash==='#teacher'?firebase.initializeApp(CFG):firebase.initializeApp(CFG,'stu');db=app.database();AU=app.auth();AU.languageCode='uk'}
  location.hash==='#teacher'?homeT():homeS()}
addEventListener('hashchange',()=>location.reload());


home();
