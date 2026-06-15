const checklistItems = [
  {id:1, group:'Freios', title:'Freios estão OK?', critical:true, severity:'Crítica'},
  {id:2, group:'Vazamentos', title:'Há algum vazamento aparente?', critical:true, severity:'Alta'},
  {id:3, group:'Pneus', title:'Pneus em bom estado, incluindo estepe, sulco mínimo de 3 mm, sem cortes ou carecas?', critical:true, severity:'Crítica'},
  {id:4, group:'Segurança', title:'Kit de segurança completo: triângulo, extintor, 4 cones P, faixas refletivas, calços e martelo?', critical:true, severity:'Alta'},
  {id:5, group:'Segurança', title:'Extintores carregados, em boas condições e dentro da validade?', critical:true, severity:'Crítica', extra:'Data de validade do extintor'},
  {id:6, group:'Elétrica', title:'Parte elétrica funcionando: faróis, lanternas, luz de freio, setas, luz de ré, pisca-alerta, buzina, limpador e alerta de ré?', critical:true, severity:'Crítica'},
  {id:7, group:'Cabine', title:'Espelhos retrovisores e vidros em bom estado?', critical:true, severity:'Alta'},
  {id:9, group:'Segurança', title:'Cinto de segurança 3 pontas funcionando?', critical:true, severity:'Crítica'},
  {id:10, group:'Motor', title:'Nível do óleo lubrificante OK e vareta de verificação presente?', critical:true, severity:'Alta'},
  {id:11, group:'Operação', title:'Nível do combustível OK?', critical:false, severity:'Baixa'},
  {id:12, group:'Manutenção', title:'Manutenções preventivas segundo manual do caminhão em dia?', critical:true, severity:'Alta'},
  {id:13, group:'Documentação/Controle', title:'Tacógrafo OK e com disco/fita para a semana?', critical:true, severity:'Crítica', extra:'Data de validade do tacógrafo'},
  {id:14, group:'EPI', title:'Motorista possui os EPIs indicados?', critical:true, severity:'Alta', details:'Calçado de segurança e capacete de segurança.'},
  {id:15, group:'Emissões', title:'Emissões do escapamento em conformidade, sem fumaça visível?', critical:true, severity:'Alta'},
  {id:16, group:'Carga', title:'Materiais de proteção de carga e equipamentos para carga/descarga disponíveis?', critical:true, severity:'Alta'},
  {id:17, group:'Baú/Furgão', title:'Portas e travas do baú/furgão funcionando?', critical:true, severity:'Alta'},
  {id:18, group:'Documentação', title:'Documentos do caminhão, histórico/relatório de viagem, planilhas de controle e vistoria disponíveis?', critical:true, severity:'Alta'},
  {id:19, group:'Ferramentas', title:'Caixa de ferramentas completa?', critical:false, severity:'Média', details:'2 alicates, martelo e demais itens definidos pela operação.'},
  {id:20, group:'Higiene', title:'Caminhão limpo internamente e externamente?', critical:false, severity:'Baixa'},
  {id:22, group:'Elétrica', title:'Faróis de neblina OK, se houver?', critical:false, severity:'Baixa'}
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
  let lastGroup = '';
  checklistItems.forEach(item => {
    if(item.group !== lastGroup){
      const g = document.createElement('h3');
      g.className = 'group-title';
      g.textContent = item.group;
      box.appendChild(g);
      lastGroup = item.group;
    }
    const div = document.createElement('div');
    div.className = 'check-item';
    div.innerHTML = `
      <div class="check-title">
        <span>${item.id} - ${item.title}</span>
        <div class="badges">
          ${item.critical ? '<span class="badge rejected">crítico</span>' : '<span class="badge neutral">controle</span>'}
          <span class="badge severity">${item.severity}</span>
        </div>
      </div>
      ${item.details ? `<p class="muted small">${item.details}</p>` : ''}
      <div class="check-actions">
        <button type="button" class="option" data-id="${item.id}" data-answer="Conforme">Conforme</button>
        <button type="button" class="option" data-id="${item.id}" data-answer="Não conforme">Não conforme</button>
        <button type="button" class="option" data-id="${item.id}" data-answer="Não se aplica">N/A</button>
      </div>
      <div class="nonconformity hidden" id="non_${item.id}">
        ${item.extra ? `<label>${item.extra}<input id="extra_${item.id}" type="date" /></label>` : ''}
        <label>Observação <strong>(obrigatória)</strong><textarea id="obs_${item.id}" rows="3"></textarea></label>
        <label>Foto ${item.critical ? '<strong>(obrigatória)</strong>' : '(opcional)'}<input id="photo_${item.id}" type="file" accept="image/*" capture="environment" /></label>
      </div>`;
    box.appendChild(div);
  });
  box.querySelectorAll('.option').forEach(btn => btn.addEventListener('click', handleAnswer));
}

function handleAnswer(e){
  const id = e.target.dataset.id;
  const answer = e.target.dataset.answer;
  answers[id] = answer;
  document.querySelectorAll(`button[data-id="${id}"]`).forEach(b => b.classList.remove('active-ok','active-no','active-na'));
  e.target.classList.add(answer === 'Conforme' ? 'active-ok' : answer === 'Não conforme' ? 'active-no' : 'active-na');
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
  const file = input && input.files && input.files[0];
  if(!file) return null;
  return await new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function hasSignature(){
  const canvas = $('signature');
  const blank = document.createElement('canvas');
  blank.width = canvas.width; blank.height = canvas.height;
  return canvas.toDataURL() !== blank.toDataURL();
}

async function collectPayload(isDraft=false){
  const driverName = $('driverName').value.trim();
  const driverCnh = $('driverCnh').value.trim();
  const plate = $('plate').value.trim().toUpperCase();
  if(!driverName || !driverCnh) throw new Error('Informe nome e CNH do motorista.');
  if(!plate) throw new Error('Informe a placa do veículo.');
  if(!isDraft && Object.keys(answers).length < checklistItems.length) throw new Error('Responda todos os itens do checklist.');
  if(!isDraft && !hasSignature()) throw new Error('Assine a inspeção antes de enviar.');

  const items = [];
  for(const item of checklistItems){
    const answer = answers[item.id] || '';
    const obs = $('obs_' + item.id)?.value.trim() || '';
    const extra = $('extra_' + item.id)?.value || '';
    const photo = await fileToDataUrl($('photo_' + item.id));
    if(!isDraft && answer === 'Não conforme' && !obs){
      throw new Error(`No item ${item.id}, informe a observação da não conformidade.`);
    }
    if(!isDraft && answer === 'Não conforme' && item.critical && !photo){
      throw new Error(`No item ${item.id}, anexe uma foto da não conformidade crítica.`);
    }
    items.push({item_id:item.id, group:item.group, title:item.title, critical:item.critical, severity:item.severity, answer, observation:obs, extra_date:extra, photo});
  }

  const non = items.filter(i => i.answer === 'Não conforme');
  const hasCritical = non.some(i => i.critical);
  const protocol = 'LOG-' + new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14);
  return {
    protocol,
    created_at: new Date().toISOString(),
    status: isDraft ? 'Rascunho' : (hasCritical ? 'Reprovado - item crítico' : non.length ? 'Pendente de correção' : 'Aprovado'),
    driver_name: driverName,
    driver_cnh: driverCnh,
    inspection_date: $('inspectionDate').value,
    inspection_time: $('inspectionTime').value,
    odometer: $('odometer').value,
    plate,
    vehicle_type: $('vehicleType').value,
    route: $('route').value.trim(),
    needs_repair: $('needsRepair').value,
    driver_report: $('driverReport').value.trim(),
    manager_status: 'Aguardando análise',
    manager_action: '',
    release_date: '',
    signature: getSignatureData(),
    items
  };
}

async function savePayload(payload){
  if(supabaseClient){
    const header = {
      protocolo: payload.protocol,
      motorista_nome: payload.driver_name,
      motorista_cnh: payload.driver_cnh,
      data_inspecao: payload.inspection_date,
      horario_inspecao: payload.inspection_time,
      hodometro: payload.odometer ? Number(payload.odometer) : null,
      veiculo_placa: payload.plate,
      tipo_veiculo: payload.vehicle_type,
      rota: payload.route,
      precisa_reparo: payload.needs_repair,
      relato_motorista: payload.driver_report,
      status: payload.status,
      observacoes: payload.driver_report,
      assinatura_motorista: payload.signature
    };

    const {data, error} = await supabaseClient
      .from('inspecoes')
      .insert(header)
      .select()
      .single();

    if(error) throw error;

    const rows = payload.items
      .filter(i => i.answer === 'Não conforme')
      .map(i => ({
        inspecao_id: data.id,
        item: String(i.item_id),
        titulo_item: i.title,
        grupo: i.group,
        gravidade: i.severity,
        observacao: i.observation,
        resposta: i.answer,
        foto_base64: i.photo,
        status: 'ABERTA'
      }));

    if(rows.length){
      const {error: itemError} = await supabaseClient
        .from('nao_conformidades')
        .insert(rows);

      if(itemError) throw itemError;
    }
  } else {
    const records = loadLocalRecords();
    records.unshift(payload);
    localStorage.setItem('logfer_inspections', JSON.stringify(records));
  }
}

function loadLocalRecords(){
  return JSON.parse(localStorage.getItem('logfer_inspections') || '[]');
}
function saveLocalRecords(records){ localStorage.setItem('logfer_inspections', JSON.stringify(records)); }

function renderManager(){
  const records = loadLocalRecords();
  $('kpiTotal').textContent = records.length;
  $('kpiApproved').textContent = records.filter(r => r.status === 'Aprovado').length;
  $('kpiRejected').textContent = records.filter(r => r.status !== 'Aprovado').length;
  $('kpiCritical').textContent = records.filter(r => r.status.includes('crítico')).length;
  $('records').innerHTML = records.map((r, idx) => {
    const non = (r.items || []).filter(i => i.answer === 'Não conforme');
    return `<div class="record">
      <div class="record-head"><strong>${r.plate} - ${r.driver_name}</strong><span class="badge ${r.status === 'Aprovado' ? 'approved':'rejected'}">${r.status}</span></div>
      <span>${r.inspection_date || ''} ${r.inspection_time || ''} | Odômetro: ${r.odometer || '-'} | ${r.vehicle_type || '-'}</span>
      <p><strong>Protocolo:</strong> ${r.protocol}</p>
      <p><strong>Não conformidades:</strong> ${non.length ? non.map(i => `${i.item_id} (${i.severity})`).join(', ') : 'Nenhuma'}</p>
      <p><strong>Relato:</strong> ${r.driver_report || 'Sem relato do motorista.'}</p>
      <label>Status do gestor
        <select data-idx="${idx}" class="manager-status">
          ${['Aguardando análise','Liberado','Bloqueado para manutenção','Liberado com ressalva','Encerrado'].map(s => `<option ${r.manager_status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </label>
      <label>Medida corretiva / decisão do gestor
        <textarea data-idx="${idx}" class="manager-action" rows="3">${r.manager_action || ''}</textarea>
      </label>
      <label>Data de liberação
        <input data-idx="${idx}" class="release-date" type="date" value="${r.release_date || ''}" />
      </label>
      <button class="secondary save-manager" data-idx="${idx}">Salvar análise</button>
    </div>`;
  }).join('') || '<p class="muted">Nenhuma inspeção registrada neste aparelho.</p>';

  document.querySelectorAll('.save-manager').forEach(btn => btn.addEventListener('click', (e) => {
    const idx = Number(e.target.dataset.idx);
    const records = loadLocalRecords();
    records[idx].manager_status = document.querySelector(`.manager-status[data-idx="${idx}"]`).value;
    records[idx].manager_action = document.querySelector(`.manager-action[data-idx="${idx}"]`).value;
    records[idx].release_date = document.querySelector(`.release-date[data-idx="${idx}"]`).value;
    saveLocalRecords(records);
    alert('Análise do gestor salva neste aparelho.');
    renderManager();
  }));
}

function exportCsv(){
  const records = loadLocalRecords();
  const header = ['protocolo','data','hora','placa','motorista','cnh','odometro','tipo','rota','status','status_gestor','nao_conformidades','relato','medida_corretiva','data_liberacao'];
  const rows = records.map(r => [
    r.protocol, r.inspection_date, r.inspection_time, r.plate, r.driver_name, r.driver_cnh, r.odometer, r.vehicle_type, r.route, r.status, r.manager_status,
    (r.items||[]).filter(i=>i.answer==='Não conforme').map(i=>`${i.item_id}-${i.severity}`).join(' | '),
    r.driver_report, r.manager_action, r.release_date
  ]);
  const csv = [header, ...rows].map(row => row.map(v => `"${String(v||'').replaceAll('"','""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'inspecoes-logfer.csv'; a.click(); URL.revokeObjectURL(url);
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
$('openManagerHome').onclick = () => { renderManager(); show('managerCard'); };
$('backHome').onclick = () => show('loginCard');
$('exportCsv').onclick = exportCsv;
$('clearLocal').onclick = () => { if(confirm('Apagar todas as inspeções de teste salvas neste aparelho?')){ localStorage.removeItem('logfer_inspections'); renderManager(); } };

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e; $('btnInstall').classList.remove('hidden');
});
$('btnInstall').onclick = async () => { if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt = null; } };

if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js'); }
initSupabase(); renderChecklist(); setupSignature();
