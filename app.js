const checklistItems = [
  {id:1, title:'Freios estão OK?', critical:true},
  {id:2, title:'Há algum vazamento aparente?', critical:true},
  {id:3, title:'Pneus em bom estado, incluindo estepe, sulco mínimo de 3 mm, sem cortes ou carecas?', critical:true},
  {id:4, title:'Kit de segurança: triângulo, extintor, 4 cones P, faixas refletivas, calços e martelo estão em bom estado?', critical:true},
  {id:5, title:'Extintores carregados, em boas condições e dentro da validade?', critical:true},
  {id:6, title:'Parte elétrica funcionando: faróis, lanternas, luz de freio, setas, luz de ré, pisca-alerta, buzina, limpador e alerta de ré?', critical:true},
  {id:7, title:'Espelhos retrovisores e vidros em bom estado?', critical:true},
  {id:9, title:'Cinto de segurança 3 pontas funcionando?', critical:true},
  {id:10, title:'Nível do óleo lubrificante OK e vareta de verificação presente?', critical:true},
  {id:11, title:'Nível do combustível OK?', critical:false},
  {id:12, title:'Manutenções preventivas segundo manual do caminhão em dia?', critical:true},
  {id:13, title:'Tacógrafo OK e com disco/fita para a semana?', critical:true, extra:'Data de validade do tacógrafo'},
  {id:14, title:'Motorista possui EPIs indicados?', critical:true},
  {id:15, title:'Emissões do escapamento em conformidade, sem fumaça visível?', critical:true},
  {id:16, title:'Materiais de proteção de carga e equipamentos para descarga necessários disponíveis?', critical:true},
  {id:17, title:'Portas e travas do baú/furgão funcionando?', critical:true},
  {id:18, title:'Documentos do caminhão, histórico/relatório de viagem, planilhas de controle e vistoria disponíveis?', critical:true},
  {id:19, title:'Caixa de ferramentas completa?', critical:false},
  {id:20, title:'Higiene: caminhão limpo internamente e externamente?', critical:false},
  {id:22, title:'Faróis de neblina OK, se houver?', critical:false}
];

const $ = (id) => document.getElementById(id);
let answers = {};
let deferredPrompt = null;
let supabaseClient = null;

function initSupabase(){
  const cfg = window.LOGFER_CONFIG || {};
  if(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase){
    supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }
}

function todayDefaults(){
  const now = new Date();
  $('inspectionDate').value = now.toISOString().slice(0,10);
  $('inspectionTime').value = now.toTimeString().slice(0,5);
}

function renderChecklist(){
  const box = $('checklist');
  box.innerHTML = '';
  checklistItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'check-item';
    div.innerHTML = `
      <div class="check-title">${item.id} - ${item.title} ${item.critical ? '<span class="badge rejected">crítico</span>' : ''}</div>
      <div class="check-actions">
        <button type="button" class="option" data-id="${item.id}" data-answer="Conforme">Conforme</button>
        <button type="button" class="option" data-id="${item.id}" data-answer="Não conforme">Não conforme</button>
      </div>
      <div class="nonconformity hidden" id="non_${item.id}">
        ${item.extra ? `<label>${item.extra}<input id="extra_${item.id}" type="date" /></label>` : ''}
        <label>Observação ${item.critical ? '(obrigatória)' : ''}<textarea id="obs_${item.id}" rows="3"></textarea></label>
        <label>Foto ${item.critical ? '(obrigatória)' : ''}<input id="photo_${item.id}" type="file" accept="image/*" capture="environment" /></label>
      </div>`;
    box.appendChild(div);
  });
  box.querySelectorAll('.option').forEach(btn => btn.addEventListener('click', handleAnswer));
}

function handleAnswer(e){
  const id = e.target.dataset.id;
  const answer = e.target.dataset.answer;
  answers[id] = answer;
  document.querySelectorAll(`button[data-id="${id}"]`).forEach(b => b.classList.remove('active-ok','active-no'));
  e.target.classList.add(answer === 'Conforme' ? 'active-ok' : 'active-no');
  $('non_' + id).classList.toggle('hidden', answer !== 'Não conforme');
  updateProgress();
}

function updateProgress(){
  const total = checklistItems.length;
  const done = Object.keys(answers).length;
  $('progressText').textContent = Math.round((done / total) * 100) + '%';
}

function show(id){
  ['loginCard','inspectionCard','successCard','managerCard'].forEach(x => $(x).classList.add('hidden'));
  $(id).classList.remove('hidden');
}

async function fileToDataUrl(input){
  const file = input.files && input.files[0];
  if(!file) return null;
  return await new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function collectPayload(isDraft=false){
  const driverName = $('driverName').value.trim();
  const driverCnh = $('driverCnh').value.trim();
  const plate = $('plate').value.trim().toUpperCase();
  if(!driverName || !driverCnh) throw new Error('Informe nome e CNH do motorista.');
  if(!plate) throw new Error('Informe a placa do veículo.');
  if(!isDraft && Object.keys(answers).length < checklistItems.length) throw new Error('Responda todos os itens do checklist.');

  const items = [];
  for(const item of checklistItems){
    const answer = answers[item.id] || '';
    const obs = $('obs_' + item.id)?.value.trim() || '';
    const extra = $('extra_' + item.id)?.value || '';
    const photo = await fileToDataUrl($('photo_' + item.id));
    if(!isDraft && answer === 'Não conforme' && item.critical && (!obs || !photo)){
      throw new Error(`No item ${item.id}, informe observação e foto.`);
    }
    items.push({item_id:item.id, title:item.title, critical:item.critical, answer, observation:obs, extra_date:extra, photo});
  }

  const hasNonConformity = items.some(i => i.answer === 'Não conforme');
  const protocol = 'LOG-' + new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14);
  return {
    protocol,
    created_at: new Date().toISOString(),
    status: isDraft ? 'Rascunho' : (hasNonConformity ? 'Pendente de correção' : 'Aprovado'),
    driver_name: driverName,
    driver_cnh: driverCnh,
    inspection_date: $('inspectionDate').value,
    inspection_time: $('inspectionTime').value,
    odometer: $('odometer').value,
    plate,
    vehicle_type: $('vehicleType').value,
    needs_repair: $('needsRepair').value,
    driver_report: $('driverReport').value.trim(),
    signature: getSignatureData(),
    items
  };
}

async function savePayload(payload){
  if(supabaseClient){
    const header = {...payload};
    delete header.items;
    const {data, error} = await supabaseClient.from('inspections').insert(header).select().single();
    if(error) throw error;
    const rows = payload.items.map(i => ({...i, inspection_id:data.id}));
    const {error: itemError} = await supabaseClient.from('inspection_items').insert(rows);
    if(itemError) throw itemError;
  } else {
    const records = JSON.parse(localStorage.getItem('logfer_inspections') || '[]');
    records.unshift(payload);
    localStorage.setItem('logfer_inspections', JSON.stringify(records));
  }
}

function loadLocalRecords(){
  return JSON.parse(localStorage.getItem('logfer_inspections') || '[]');
}

function renderManager(){
  const records = loadLocalRecords();
  $('kpiTotal').textContent = records.length;
  $('kpiApproved').textContent = records.filter(r => r.status === 'Aprovado').length;
  $('kpiRejected').textContent = records.filter(r => r.status !== 'Aprovado').length;
  $('records').innerHTML = records.map(r => `
    <div class="record">
      <strong>${r.plate} - ${r.driver_name}</strong><br />
      <span>${r.inspection_date} ${r.inspection_time || ''}</span><br />
      <span class="badge ${r.status === 'Aprovado' ? 'approved':'rejected'}">${r.status}</span>
      <p>${r.driver_report || 'Sem relato do motorista.'}</p>
    </div>`).join('') || '<p class="muted">Nenhuma inspeção registrada neste aparelho.</p>';
}

function setupSignature(){
  const canvas = $('signature');
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  let drawing = false;
  function pos(e){
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {x:(touch.clientX-rect.left)*(canvas.width/rect.width), y:(touch.clientY-rect.top)*(canvas.height/rect.height)};
  }
  function start(e){drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault();}
  function move(e){if(!drawing)return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault();}
  function end(){drawing=false;}
  canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); window.addEventListener('mouseup',end);
  canvas.addEventListener('touchstart',start); canvas.addEventListener('touchmove',move); canvas.addEventListener('touchend',end);
  $('clearSignature').onclick = () => ctx.clearRect(0,0,canvas.width,canvas.height);
}

function getSignatureData(){ return $('signature').toDataURL('image/png'); }

$('startBtn').onclick = () => { todayDefaults(); show('inspectionCard'); };
$('saveDraft').onclick = async () => {
  try{ const payload = await collectPayload(true); await savePayload(payload); alert('Rascunho salvo neste aparelho.'); }
  catch(err){ alert(err.message); }
};
$('submitInspection').onclick = async () => {
  try{
    const payload = await collectPayload(false);
    await savePayload(payload);
    $('protocolText').textContent = `Protocolo: ${payload.protocol} | Status: ${payload.status}`;
    show('successCard');
  }catch(err){ alert(err.message); }
};
$('newInspection').onclick = () => location.reload();
$('openManager').onclick = () => { renderManager(); show('managerCard'); };
$('backHome').onclick = () => show('successCard');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e; $('btnInstall').classList.remove('hidden');
});
$('btnInstall').onclick = async () => { if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt = null; } };

if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js'); }
initSupabase(); renderChecklist(); setupSignature();
