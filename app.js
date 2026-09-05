let masterPool = JSON.parse(localStorage.getItem('master_pool')) || [];
let unidadesPatio = JSON.parse(localStorage.getItem('unidades_patio')) || [];
let remolqueSeleccionado = null;

function verTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');
  renderizarListas();
}

function importarMasterCSV(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const lines = evt.target.result.split('\n');
    masterPool = [];
    lines.forEach((line, index) => {
      if (index === 0 || !line.trim()) return;
      const col = line.split(',');
      masterPool.push({
        placa: col[0] ? col[0].trim() : '-',
        economico: col[1] ? col[1].trim() : '-',
        tipo: col[2] ? col[2].trim() : '-',
        puerta: col[3] ? col[3].trim() : '-',
        categoria: col[4] ? col[4].trim() : '-',
        capacidad: col[5] ? col[5].trim() : '-',
        serie: col[6] ? col[6].trim() : '-',
        cedis: col[8] ? col[8].trim() : '-',
        arrendador: col[9] ? col[9].trim() : '-'
      });
    });
    localStorage.setItem('master_pool', JSON.stringify(masterPool));
    alert(`Master Pool cargado correctamente con ${masterPool.length} registros.`);
  };
  reader.readAsText(file);
}

function buscarRemolqueMaster() {
  const query = document.getElementById('input-busqueda').value.trim().toUpperCase();
  const cont = document.getElementById('resultado-master');
  if (!query) { cont.classList.add('hidden'); return; }

  const res = masterPool.find(m => m.economico.toUpperCase() === query || m.placa.toUpperCase() === query);
  if (res) {
    remolqueSeleccionado = res;
    document.getElementById('m-placa').textContent = res.placa;
    document.getElementById('m-eco').textContent = res.economico;
    document.getElementById('m-capacidad').textContent = res.capacidad;
    document.getElementById('m-cedis').textContent = res.cedis;
    document.getElementById('m-puerta').textContent = res.puerta;
    document.getElementById('m-serie').textContent = res.serie;
    document.getElementById('m-arrendador').textContent = res.arrendador;
    document.getElementById('m-categoria').textContent = res.categoria;
    cont.classList.remove('hidden');
  } else {
    cont.classList.add('hidden');
  }
}

function registrarProcesoCarga() {
  const eco = document.getElementById('f-eco').value.trim();
  const placa = document.getElementById('f-placa').value.trim();
  const horaInput = document.getElementById('f-inicio').value;

  if (!eco) { alert('Ingresa al menos el económico.'); return; }

  const ingresoFecha = horaInput ? new Date(horaInput).toISOString() : new Date().toISOString();

  unidadesPatio.unshift({
    id: Date.now(),
    economico: eco,
    placa: placa || 'S/P',
    estatus: 'Proceso de Carga',
    inicioCarga: ingresoFecha,
    fechaFacturado: null
  });

  guardar();
  document.getElementById('f-eco').value = '';
  document.getElementById('f-placa').value = '';
  alert('Unidad registrada en Proceso de Carga');
}

function enviarAFormado() {
  if (!remolqueSeleccionado) return;
  document.getElementById('f-eco').value = remolqueSeleccionado.economico;
  document.getElementById('f-placa').value = remolqueSeleccionado.placa;
  document.querySelectorAll('.tab-btn')[1].click();
}

function enviarAPatioDirecto() {
  if (!remolqueSeleccionado) return;
  unidadesPatio.unshift({
    id: Date.now(),
    economico: remolqueSeleccionado.economico,
    placa: remolqueSeleccionado.placa,
    estatus: 'En Patio',
    inicioCarga: new Date().toISOString(),
    fechaFacturado: null
  });
  guardar();
  alert('Remolque ingresado directamente a Patio');
}

function cambiarEstatus(id, nuevoEstatus) {
  const u = unidadesPatio.find(item => item.id === id);
  if (u) {
    u.estatus = nuevoEstatus;
    if (nuevoEstatus === 'Facturado') u.fechaFacturado = new Date().toISOString();
    guardar();
  }
}

function calcularHoras(isoFecha) {
  if (!isoFecha) return '0.0';
  const diff = new Date() - new Date(isoFecha);
  return (diff / (1000 * 60 * 60)).toFixed(1);
}

function guardar() {
  localStorage.setItem('unidades_patio', JSON.stringify(unidadesPatio));
  renderizarListas();
}

function renderizarListas() {
  const contFormado = document.getElementById('lista-formado');
  const contPatio = document.getElementById('lista-patio');
  contFormado.innerHTML = '';
  contPatio.innerHTML = '';

  unidadesPatio.forEach(u => {
    const hrsCarga = calcularHoras(u.inicioCarga);
    const hrsFacturado = u.fechaFacturado ? calcularHoras(u.fechaFacturado) : '-';

    if (u.estatus === 'Proceso de Carga') {
      const div = document.createElement('div');
      div.className = 'unit-row';
      div.innerHTML = `
        <div>
          <strong>Eco: ${u.economico}</strong> | Placa: ${u.placa}<br>
          <span class="badge badge-carga">Proceso de Carga</span>
        </div>
        <div style="text-align:right">
          <span style="font-size:1.1rem; font-weight:bold">${hrsCarga} hrs</span><br>
          <button class="btn btn-success" onclick="cambiarEstatus(${u.id}, 'Facturado')">Marcar Facturado</button>
        </div>
      `;
      contFormado.appendChild(div);
    }

    if (u.estatus !== 'Despachada') {
      const divP = document.createElement('div');
      divP.className = `unit-row ${u.estatus === 'Facturado' ? 'facturado' : ''}`;
      divP.innerHTML = `
        <div>
          <strong>Eco: ${u.economico}</strong> | Placa: ${u.placa}<br>
          <span class="badge badge-${u.estatus === 'Facturado' ? 'facturado' : 'carga'}">${u.estatus}</span>
        </div>
        <div style="text-align:right">
          <small>Carga: <b>${hrsCarga} hrs</b></small><br>
          ${u.estatus === 'Facturado' ? `<small>Facturado: <b style="color:var(--success)">${hrsFacturado} hrs</b></small><br>` : ''}
          <button class="btn btn-danger" onclick="cambiarEstatus(${u.id}, 'Despachada')" style="margin-top:4px">Despachar</button>
        </div>
      `;
      contPatio.appendChild(divP);
    }
  });
}

renderizarListas();
