// Configuração inicial do mapa
const mapa = L.map('map').setView([-27.897, -54.837], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mapa);

// Variáveis para controle do estado
let rastreamentoAtivo = true;
let ultimaPosicao = null;
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
  ultimaAtualizacaoBemSucedida = new Date();
  ultimaDataColetada = new Date(localizacao.data_hora);

  document.getElementById('latitude').textContent = localizacao.latitude.toFixed(6);
  document.getElementById('longitude').textContent = localizacao.longitude.toFixed(6);
  document.getElementById('ultimaAtualizacao').textContent = formatarDataHora(new Date(localizacao.data_hora));

  pontosTrajeto.push([localizacao.latitude, localizacao.longitude]);

  if (marcadorAtual) mapa.removeLayer(marcadorAtual);

  marcadorAtual = L.marker([localizacao.latitude, localizacao.longitude])
    .addTo(mapa)
    .bindPopup(`
      <b>Latitude:</b> ${localizacao.latitude.toFixed(6)}<br>
      <b>Longitude:</b> ${localizacao.longitude.toFixed(6)}<br>
      <b>Data/Hora:</b> ${formatarDataHora(new Date(localizacao.data_hora))}
    `);

  mapa.setView([localizacao.latitude, localizacao.longitude]);

  if (linhaTrajeto) mapa.removeLayer(linhaTrajeto);
  if (pontosTrajeto.length > 1) {
    linhaTrajeto = L.polyline(pontosTrajeto, { color: 'blue' }).addTo(mapa);
  }

  atualizarStatusDispositivo();
}

// Trata erros na atualização
function tratarErro(erro) {
  console.error('Erro:', erro);
  atualizarStatusDispositivo();
}

// Atualiza os dados periodicamente
async function atualizarDados() {
  if (!rastreamentoAtivo) return;
  try {
    const dadosRecentes = await buscarDadosRecentes();
    atualizarInterface(dadosRecentes);
  } catch (erro) {
    tratarErro(erro);
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("box-voltar").style.display = "none";

  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);

  atualizarDados();
  setInterval(atualizarDados, 5000);

  setInterval(atualizarStatusDispositivo, 1000);
});

// Botão: Mostrar Trajeto 24h
document.getElementById("botao-trajeto").addEventListener("click", async () => {
  try {
    const resposta = await fetch("/api/trajeto-24h");
    const dados = await resposta.json();

    const pontos = dados.map(p => [p.latitude, p.longitude]);

    if (marcadorAtual) {
      mapa.removeLayer(marcadorAtual);
      marcadorAtual = null;
    }

    if (linhaTrajeto) {
      mapa.removeLayer(linhaTrajeto);
      linhaTrajeto = null;
    }

    linhaTrajeto = L.polyline(pontos, { color: "blue" }).addTo(mapa);
    mapa.fitBounds(linhaTrajeto.getBounds());

    rastreamentoAtivo = false;

    // Mostra o botão de voltar, sem esconder o de 24h
    document.getElementById("box-voltar").style.display = "block";

  } catch (erro) {
    console.error("Erro ao buscar trajeto 24h:", erro);
  }
});

// Botão: Voltar ao Rastreamento em Tempo Real
document.getElementById("botao-voltar").addEventListener("click", () => {
  mapa.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
      mapa.removeLayer(layer);
    }
  });

  if (linhaTrajeto) {
    mapa.removeLayer(linhaTrajeto);
    linhaTrajeto = null;
  }

  if (marcadorAtual) {
    mapa.removeLayer(marcadorAtual);
    marcadorAtual = null;
  }

  rastreamentoAtivo = true;

  // Esconde o botão de voltar
  document.getElementById("box-voltar").style.display = "none";

  atualizarDados();
});
