const $ = (s) => document.querySelector(s);
const splash = $('#splash'), app = $('#app'), splashImage = $('#splashImage');
const chat = $('#chat'), welcome = $('#welcome'), input = $('#input'), composer = $('#composer');
const historyEl = $('#history');
let messages = [];

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function escText(s){return String(s ?? '');}
function addMessage(role, text){
  const row=document.createElement('div'); row.className=`message ${role}`;
  if(role==='assistant'){
    const img=document.createElement('img'); img.className='avatar'; img.src='/icon-192.png'; img.alt='Learnex AI'; row.appendChild(img);
  }
  const bubble=document.createElement('div'); bubble.className='bubble'; bubble.textContent=escText(text); row.appendChild(bubble); chat.appendChild(row);
  requestAnimationFrame(()=>row.scrollIntoView({behavior:'smooth',block:'nearest'}));
  return bubble;
}
function addTyping(){const b=addMessage('assistant','');b.innerHTML='<span class="typing"><span></span><span></span><span></span></span>';return b;}
function saveHistory(){localStorage.setItem('learnex-history',JSON.stringify(messages.slice(-20)));renderHistory();}
function loadHistory(){try{messages=JSON.parse(localStorage.getItem('learnex-history')||'[]');}catch{messages=[]}if(messages.length){welcome.style.display='none';messages.forEach(m=>addMessage(m.role,m.content));}}
function renderHistory(){historyEl.innerHTML='';const users=messages.filter(m=>m.role==='user').slice(-8).reverse();users.forEach(m=>{const b=document.createElement('button');b.textContent=m.content;b.onclick=()=>{input.value=m.content;closeDrawer();input.focus()};historyEl.appendChild(b);});}
async function sendMessage(text){
  text=(text||'').trim(); if(!text) return;
  welcome.style.display='none';
  addMessage('user',text); messages.push({role:'user',content:text});
  input.value=''; input.style.height='auto';
  const typing=addTyping();
  try{
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages})});
    const data=await r.json().catch(()=>({error:'Invalid server response.'}));
    typing.innerHTML='';
    if(!r.ok) throw new Error(data.error||'The AI could not answer right now.');
    typing.textContent=data.reply;
    messages.push({role:'assistant',content:data.reply}); saveHistory();
  }catch(err){typing.innerHTML='';typing.textContent=`Sorry — ${err.message}`;}
}
composer.addEventListener('submit',e=>{e.preventDefault();sendMessage(input.value)});
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input.value)}});
input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,120)+'px'});
document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.prompt;input.focus();sendMessage(b.dataset.prompt)}));
$('#clearBtn').onclick=()=>{messages=[];localStorage.removeItem('learnex-history');chat.innerHTML='';welcome.style.display='block';renderHistory()};
$('#newChat').onclick=()=>{$('#clearBtn').click();closeDrawer()};
function openDrawer(){ $('#drawer').classList.add('open');$('#backdrop').classList.add('show');$('#drawer').setAttribute('aria-hidden','false'); }
function closeDrawer(){ $('#drawer').classList.remove('open');$('#backdrop').classList.remove('show');$('#drawer').setAttribute('aria-hidden','true'); }
$('#menuBtn').onclick=openDrawer;$('#closeDrawer').onclick=closeDrawer;$('#backdrop').onclick=closeDrawer;
$('#micBtn').onclick=()=>{if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window))return;const R=window.SpeechRecognition||window.webkitSpeechRecognition;const rec=new R();rec.lang='bn-BD';rec.onresult=e=>{input.value=e.results[0][0].transcript;input.dispatchEvent(new Event('input'))};rec.start()};

async function start(){
  const startTime=performance.now();
  if(splashImage.complete){/* already preloaded */}else await new Promise(r=>{splashImage.onload=r;splashImage.onerror=r});
  await sleep(Math.max(0,2200-(performance.now()-startTime)));
  loadHistory();renderHistory();
  app.classList.remove('is-hidden');app.style.visibility='visible';app.style.opacity='1';
  splash.classList.add('done');
  setTimeout(()=>splash.remove(),450);
}
window.addEventListener('load',start,{once:true});
