// Configuração inicial do mapa
const mapa = L.map('map').setView([-27.897, -54.837], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mapa);

// Variáveis para controle do estado
let marcadorAtual = null;
let linhaTrajeto = null;
const pontosTrajeto = [];
let ultimaAtualizacaoBemSucedida = null;
let ultimaDataColetada = null;
const TEMPO_OFFLINE = 30000; // 30 segundos sem atualização = offline

// Função para formatar data/hora
function formatarDataHora(data) {
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Atualiza o relógio na interface
function atualizarRelogio() {
  const agora = new Date();
  document.getElementById('data').textContent = agora.toLocaleDateString('pt-BR');
  document.getElementById('hora').textContent = agora.toLocaleTimeString('pt-BR');
}

// Busca os dados mais recentes do servidor
async function buscarDadosRecentes() {
  try {
    const resposta = await fetch('/api/localizacoes');
    if (!resposta.ok) throw new Error('Erro na rede');
    
    const dados = await resposta.json();
    if (!dados || dados.length === 0) throw new Error('Sem dados disponíveis');
    
    return dados[0]; // Retorna o registro mais recente
  } catch (erro) {
    console.error('Erro ao buscar dados:', erro);
    throw erro;
  }
}

// Atualiza o status do dispositivo na interface
function atualizarStatusDispositivo() {
  const agora = new Date();
  const elementoStatus = document.getElementById('statusDispositivo');

  if (!ultimaDataColetada || (agora - ultimaDataColetada) > TEMPO_OFFLINE) {
    elementoStatus.textContent = 'Offline';
    elementoStatus.className = 'status offline';
  } else {
    elementoStatus.textContent = 'Online';
    elementoStatus.className = 'status online';
  }
}


// Atualiza a interface com os novos dados
function atualizarInterface(localizacao) {
  // Atualiza o timestamp da última atualização bem-sucedida
  ultimaAtualizacaoBemSucedida = new Date(); // hora que chegou o dado
  ultimaDataColetada = new Date(localizacao.data_hora); // hora que o dado foi coletado
  
  // Atualiza os valores no painel
  document.getElementById('latitude').textContent = localizacao.latitude.toFixed(6);
  document.getElementById('longitude').textContent = localizacao.longitude.toFixed(6);
  document.getElementById('ultimaAtualizacao').textContent = formatarDataHora(new Date(localizacao.data_hora));
  
  // Adiciona o ponto ao histórico
  pontosTrajeto.push([localizacao.latitude, localizacao.longitude]);
  
  // Remove o marcador anterior
  if (marcadorAtual) mapa.removeLayer(marcadorAtual);
  
  // Cria novo marcador
  marcadorAtual = L.marker([localizacao.latitude, localizacao.longitude])
    .addTo(mapa)
    .bindPopup(`
      <b>Latitude:</b> ${localizacao.latitude.toFixed(6)}<br>
      <b>Longitude:</b> ${localizacao.longitude.toFixed(6)}<br>
      <b>Data/Hora:</b> ${formatarDataHora(new Date(localizacao.data_hora))}
    `);
  
  // Centraliza o mapa
  mapa.setView([localizacao.latitude, localizacao.longitude]);
  
  // Atualiza a linha do trajeto
  if (linhaTrajeto) mapa.removeLayer(linhaTrajeto);
  if (pontosTrajeto.length > 1) {
    linhaTrajeto = L.polyline(pontosTrajeto, {color: 'blue'}).addTo(mapa);
  }
  
  // Atualiza o status do dispositivo
  atualizarStatusDispositivo();
}

// Trata erros na atualização
function tratarErro(erro) {
  console.error('Erro:', erro);
  atualizarStatusDispositivo();
}

// Atualiza os dados periodicamente
async function atualizarDados() {
  try {
    const dadosRecentes = await buscarDadosRecentes();
    atualizarInterface(dadosRecentes);
  } catch (erro) {
    tratarErro(erro);
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Configura o relógio
  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);
  
  // Configura a atualização dos dados
  atualizarDados();
  setInterval(atualizarDados, 5000); // Atualiza a cada 5 segundos
  
  // Verifica o status periodicamente
  setInterval(atualizarStatusDispositivo, 1000); // Verifica a cada segundo
});