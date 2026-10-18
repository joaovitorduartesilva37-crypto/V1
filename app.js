(()=>{
const K='fluxo:v1',$=s=>document.querySelector(s);
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const p2=n=>String(n).padStart(2,'0');
const hoje=()=>{const d=new Date();return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`};
const CD=['Moradia','Alimentação','Transporte','Saúde','Lazer','Educação','Outros'],CR=['Salário','Extra','Outros'];

let S=null;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}
S=S||{contas:[{id:1,nome:'Carteira',ini:0}],lanc:[]};
let tab='resumo',tipo='d',mes=hoje().slice(0,7);
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};

// t: 'r' receita, 'd' despesa, 't' transferência (conta -> dest)
const sum=(L,t)=>L.filter(l=>l.t==t).reduce((a,l)=>a+l.v,0);
const saldo=c=>S.lanc.reduce((a,l)=>l.conta==c.id?a+(l.t=='r'?l.v:-l.v):l.dest==c.id?a+l.v:a,c.ini);
const nm=id=>(S.contas.find(c=>c.id==id)||{nome:'—'}).nome;
const doMes=()=>S.lanc.filter(l=>l.d.startsWith(mes)).sort((a,b)=>b.d.localeCompare(a.d)||b.id-a.id);
const addM=(s,i)=>{const[y,m,d]=s.split('-').map(Number),t=new Date(y,m-1+i,1),u=new Date(t.getFullYear(),t.getMonth()+1,0).getDate();return `${t.getFullYear()}-${p2(t.getMonth()+1)}-${p2(Math.min(d,u))}`};

const mesBar=()=>{const[y,m]=mes.split('-');return `<div class="mes"><button class="x" data-act="mp" aria-label="Mês anterior">‹</button><b>${new Date(y,m-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><button class="x" data-act="mn" aria-label="Próximo mês">›</button></div>`};

const item=l=>`<div class="it"><div><div>${esc(l.desc||l.cat||'Transferência')}</div><div class="sub meta"><span>${l.d.slice(8)}/${l.d.slice(5,7)}</span><span>${l.t=='t'?esc(nm(l.conta))+' para '+esc(nm(l.dest)):esc(l.cat)}</span>${l.t=='t'?'':`<span>${esc(nm(l.conta))}</span>`}</div></div><div class="row"><b class="${l.t=='r'?'pos':l.t=='d'?'neg':''}">${l.t=='d'?'−':l.t=='r'?'+':''}${brl(l.v)}</b><button class="x" data-act="del" data-id="${l.id}" aria-label="Excluir lançamento">×</button></div></div>`;

const V={
resumo(){
  const L=doMes(),r=sum(L,'r'),d=sum(L,'d'),cs={};
  L.filter(l=>l.t=='d').forEach(l=>cs[l.cat]=(cs[l.cat]||0)+l.v);
  const top=Object.entries(cs).sort((a,b)=>b[1]-a[1]);
  return `${mesBar()}
<section class="glass p"><div class="sub">Saldo total</div><div class="big">${brl(S.contas.reduce((a,c)=>a+saldo(c),0))}</div></section>
<div class="two"><section class="glass p"><div class="sub">Receitas</div><b class="pos">${brl(r)}</b></section><section class="glass p"><div class="sub">Despesas</div><b class="neg">${brl(d)}</b></section></div>
<section class="glass p"><div class="sub">Despesas por categoria</div>${top.map(([c,v])=>`<div class="cat"><div class="row"><span>${esc(c)}</span><span class="sub">${brl(v)}</span></div><div class="bar"><i style="width:${v/d*100}%"></i></div></div>`).join('')||'<p class="sub">Nenhuma despesa neste mês. Toque em + para registrar.</p>'}</section>
<section class="glass p"><div class="sub">Últimos lançamentos</div>${L.slice(0,5).map(item).join('')||'<p class="sub">Nenhum lançamento neste mês.</p>'}</section>`;
},
lanc(){
  return `${mesBar()}<section class="glass p">${doMes().map(item).join('')||'<p class="sub">Nenhum lançamento neste mês. Toque em + para registrar.</p>'}</section>`;
},
contas(){
  return `<section class="glass p"><div class="sub">Contas</div>${S.contas.map(c=>`<div class="it"><span>${esc(c.nome)}</span><div class="row"><b>${brl(saldo(c))}</b><button class="x" data-act="delc" data-id="${c.id}" aria-label="Excluir conta">×</button></div></div>`).join('')}</section>
<form class="glass p" data-form="conta"><div class="sub">Nova conta</div><input name="nome" placeholder="Nome da conta" required><input name="ini" type="number" step="0.01" inputmode="decimal" placeholder="Saldo inicial (R$)"><button class="btn">Adicionar conta</button></form>`;
}};

const render=()=>{
  $('#view').innerHTML=V[tab]();
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab==tab));
};

const sheet=()=>{
  const o=a=>a.map(x=>`<option>${esc(x)}</option>`).join(''),
        ct=S.contas.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join(''),
        sh=$('#sheet');
  sh.hidden=false;
  sh.innerHTML=`<form class="glass" data-form="lanc"><div class="seg">${[['d','Despesa'],['r','Receita'],['t','Transferência']].map(([k,n])=>`<button type="button" data-tipo="${k}"${k==tipo?' class="on"':''}>${n}</button>`).join('')}</div>
<input name="v" type="number" step="0.01" min="0.01" inputmode="decimal" placeholder="Valor (R$)" required>
<input name="desc" placeholder="Descrição">
<label class="sub">${tipo=='t'?'Conta de origem':'Conta'}<select name="conta">${ct}</select></label>
${tipo=='t'?`<label class="sub">Conta de destino<select name="dest">${ct}</select></label>`:`<label class="sub">Categoria<select name="cat">${o(tipo=='r'?CR:CD)}</select></label>`}
<label class="sub">Data<input name="d" type="date" value="${hoje()}" required></label>
<label class="sub">Repetir ou parcelar em quantos meses<input name="n" type="number" min="1" max="60" value="1"></label>
<button class="btn">Salvar lançamento</button></form>`;
  sh.querySelector('input[name=v]').focus();
};

document.addEventListener('click',e=>{
  if(e.target.id=='sheet'){e.target.hidden=true;return}
  const b=e.target.closest('[data-act],[data-tab],[data-tipo]');if(!b)return;
  const{act,tab:t,tipo:tp,id}=b.dataset;
  if(t){tab=t;render();scrollTo(0,0)}
  else if(tp){tipo=tp;sheet()}
  else if(act=='novo'){tipo='d';sheet()}
  else if(act=='mp'||act=='mn'){const[y,m]=mes.split('-').map(Number),d=new Date(y,m-1+(act=='mp'?-1:1),1);mes=`${d.getFullYear()}-${p2(d.getMonth()+1)}`;render()}
  else if(act=='del'){if(confirm('Excluir este lançamento?')){S.lanc=S.lanc.filter(l=>l.id!=id);save();render()}}
  else if(act=='delc'){
    if(S.lanc.some(l=>l.conta==id||l.dest==id))alert('Esta conta tem lançamentos. Exclua-os antes de remover a conta.');
    else if(S.contas.length<2)alert('Mantenha ao menos uma conta.');
    else{S.contas=S.contas.filter(c=>c.id!=id);save();render()}
  }
});

document.addEventListener('submit',e=>{
  e.preventDefault();
  const f=e.target,x=Object.fromEntries(new FormData(f));
  if(f.dataset.form=='conta')S.contas.push({id:Date.now(),nome:x.nome.trim()||'Conta',ini:+x.ini||0});
  else{
    const n=Math.max(1,Math.min(60,+x.n||1));
    if(tipo=='t'&&x.conta==x.dest)return alert('Escolha contas diferentes para origem e destino.');
    const base=(x.desc||'').trim()||x.cat||'Transferência';
    for(let i=0;i<n;i++)S.lanc.push({id:Date.now()+i,t:tipo,v:+x.v,d:addM(x.d,i),conta:+x.conta,dest:tipo=='t'?+x.dest:0,cat:x.cat||'',desc:base+(n>1?` (${i+1}/${n})`:'')});
    $('#sheet').hidden=true;mes=x.d.slice(0,7);
  }
  save();render();
});

document.addEventListener('keydown',e=>{if(e.key=='Escape')$('#sheet').hidden=true});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
})();
