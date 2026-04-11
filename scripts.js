const API_URL = "http://127.0.0.1:5000";

let localAtualId = null;
let modoOffline = false;

/*
  --------------------------------------------------------------------------------------
  Dados mockados utilizados quando a API não está disponível
  --------------------------------------------------------------------------------------
*/
let locaisMock = [
  {
    id: 1,
    nome: "Museu do Universo Planetário da Gávea",
    cidade: "Rio de Janeiro",
    categoria: "Museu, Planetário, Planetario",
    descricao:
      "Museu do Universo Planetário da Gávea localizado próximo da PUC",
    avaliacoes: [
      { id: 1, nome_usuario: "Leonardo", nota: 5, comentario: "Ótimo lugar" },
    ],
  },
  {
    id: 2,
    nome: "Praia do Leblon",
    cidade: "Rio de Janeiro",
    categoria: "Praia",
    descricao: "Praia localizada no Leblon",
    avaliacoes: [],
  },
];

/*
  --------------------------------------------------------------------------------------
  Função para calcular média de avaliações
  --------------------------------------------------------------------------------------
*/
function calcularMedia(local) {
  if (!local.avaliacoes || local.avaliacoes.length === 0) return null;

  const soma = local.avaliacoes.reduce((acc, a) => acc + a.nota, 0);
  return soma / local.avaliacoes.length;
}

/*
  --------------------------------------------------------------------------------------
  Função para renderizar estrelas com base na média
  --------------------------------------------------------------------------------------
*/
function renderEstrelas(media) {
  if (!media) return "Sem avaliações";

  const estrelas = Math.round(media);
  return "⭐".repeat(estrelas) + ` (${media.toFixed(1)})`;
}

/*
  --------------------------------------------------------------------------------------
  Função para renderizar lista de locais
  --------------------------------------------------------------------------------------
*/
function renderLocais(data) {
  const container = document.getElementById("locais-container");
  container.innerHTML = "";

  const locais = Array.isArray(data) ? data : data.locais;

  if (!Array.isArray(locais) || locais.length === 0) {
    container.innerHTML = `<p>Nenhum local encontrado.</p>`;
    return;
  }

  locais.forEach((local) => {
    if (local.avaliacoes) {
      local.media_avaliacoes = calcularMedia(local);
      local.total_avaliacoes = local.avaliacoes.length;
    }

    const col = document.createElement("div");
    col.className = "col-md-4 mb-4";

    col.innerHTML = `
      <div class="card card-local h-100" style="cursor:pointer;">
        <img src="img/placeholder.jpg" class="card-img-top">
        <div class="card-body">
          <h5>${local.nome}</h5>
          <p>${local.cidade}</p>
          <p class="media-avaliacao">
            ${renderEstrelas(local.media_avaliacoes)}
            <small>(${local.total_avaliacoes || 0})</small>
          </p>
          <p>${local.descricao}</p>
        </div>
      </div>
    `;

    col
      .querySelector(".card")
      .addEventListener("click", () => abrirAvaliacoes(local.id, local.nome));

    container.appendChild(col);
  });
}

/*
  --------------------------------------------------------------------------------------
  Função para carregar locais (online ou offline)
  --------------------------------------------------------------------------------------
*/
async function carregarLocais() {
  try {
    const response = await fetch(`${API_URL}/locais`);
    if (!response.ok) throw new Error();

    const data = await response.json();
    modoOffline = false;

    renderLocais(data);
  } catch {
    modoOffline = true;
    renderLocais(locaisMock);
  }
}

/*
  --------------------------------------------------------------------------------------
  Função para renderizar uma avaliação
  --------------------------------------------------------------------------------------
*/
function renderAvaliacao(avaliacao, container) {
  const div = document.createElement("div");
  div.className = "avaliacao d-flex justify-content-between align-items-start";

  div.innerHTML = `
    <div>
      <strong>${avaliacao.nome_usuario}</strong>
      <span class="nota">⭐ ${avaliacao.nota}</span>
      <p>${avaliacao.comentario || ""}</p>
    </div>

    <button class="btn btn-sm btn-outline-danger btn-delete">🗑️</button>
  `;

  div
    .querySelector(".btn-delete")
    .addEventListener("click", () => deletarAvaliacao(avaliacao.id));

  container.appendChild(div);
}

/*
  --------------------------------------------------------------------------------------
  Função para abrir modal de avaliações
  --------------------------------------------------------------------------------------
*/
async function abrirAvaliacoes(localId, nomeLocal) {
  const container = document.getElementById("lista-avaliacoes");
  const titulo = document.getElementById("modalTitulo");

  titulo.innerText = `Avaliações - ${nomeLocal}`;
  container.innerHTML = "";

  localAtualId = localId;

  if (modoOffline) {
    const local = locaisMock.find((l) => l.id === localId);
    const avaliacoes = local.avaliacoes || [];

    if (avaliacoes.length === 0) {
      container.innerHTML = "<p>Nenhuma avaliação ainda.</p>";
    } else {
      avaliacoes.forEach((a) => renderAvaliacao(a, container));
    }
  } else {
    const response = await fetch(`${API_URL}/locais/${localId}/avaliacoes`);
    const data = await response.json();

    const avaliacoes = data.avaliacoes || data;

    if (avaliacoes.length === 0) {
      container.innerHTML = "<p>Nenhuma avaliação ainda.</p>";
    } else {
      avaliacoes.forEach((a) => renderAvaliacao(a, container));
    }
  }

  document.getElementById("form-container").style.display = "none";
  document.getElementById("btn-abrir-form").style.display = "block";

  new bootstrap.Modal(document.getElementById("modalAvaliacoes")).show();
}

/*
  --------------------------------------------------------------------------------------
  Função para deletar avaliação
  --------------------------------------------------------------------------------------
*/
async function deletarAvaliacao(avaliacaoId) {
  if (!confirm("Deseja excluir esta avaliação?")) return;

  if (modoOffline) {
    const local = locaisMock.find((l) => l.id === localAtualId);

    local.avaliacoes = local.avaliacoes.filter((a) => a.id !== avaliacaoId);

    local.media_avaliacoes = calcularMedia(local);
    local.total_avaliacoes = local.avaliacoes.length;

    renderLocais(locaisMock);
    abrirAvaliacoes(localAtualId, "Local");

    return;
  }

  await fetch(`${API_URL}/avaliacoes/${avaliacaoId}`, { method: "DELETE" });

  await carregarLocais();
  abrirAvaliacoes(localAtualId, "Local");
}

/*
  --------------------------------------------------------------------------------------
  Função de filtro (online + offline)
  --------------------------------------------------------------------------------------
*/
async function filtrarLocais() {
  const cidade = document.getElementById("filtro-cidade").value.toLowerCase();
  const categoria = document
    .getElementById("filtro-categoria")
    .value.toLowerCase();

  if (modoOffline) {
    let resultado = locaisMock;

    if (cidade) {
      resultado = resultado.filter((l) =>
        l.cidade.toLowerCase().includes(cidade),
      );
    }

    if (categoria) {
      resultado = resultado.filter((l) =>
        l.categoria.toLowerCase().includes(categoria),
      );
    }

    renderLocais(resultado);
    return;
  }

  let url = `${API_URL}/locais?`;

  if (cidade) url += `cidade=${encodeURIComponent(cidade)}&`;
  if (categoria) url += `categoria=${encodeURIComponent(categoria)}&`;

  const response = await fetch(url);
  const data = await response.json();

  renderLocais(data);
}

/*
  --------------------------------------------------------------------------------------
  Função para limpar filtros
  --------------------------------------------------------------------------------------
*/
function limparFiltro() {
  document.getElementById("filtro-cidade").value = "";
  document.getElementById("filtro-categoria").value = "";
  carregarLocais();
}

/*
  --------------------------------------------------------------------------------------
  Evento de criação de avaliação
  --------------------------------------------------------------------------------------
*/
document
  .getElementById("form-avaliacao")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome_usuario").value;
    const nota = Number(document.getElementById("nota").value);
    const comentario = document.getElementById("comentario").value;

    if (modoOffline) {
      const local = locaisMock.find((l) => l.id === localAtualId);

      local.avaliacoes.push({
        id: Date.now(),
        nome_usuario: nome,
        nota,
        comentario,
      });

      local.media_avaliacoes = calcularMedia(local);
      local.total_avaliacoes = local.avaliacoes.length;

      document.getElementById("form-avaliacao").reset();

      renderLocais(locaisMock);
      abrirAvaliacoes(localAtualId, "Local");

      return;
    }

    await fetch(`${API_URL}/locais/${localAtualId}/avaliacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome_usuario: nome, nota, comentario }),
    });

    document.getElementById("form-avaliacao").reset();

    await carregarLocais();
    abrirAvaliacoes(localAtualId, "Local");
  });

/*
  --------------------------------------------------------------------------------------
  Evento de criação de local
  --------------------------------------------------------------------------------------
*/
document.getElementById("form-local").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const cidade = document.getElementById("cidade").value;
  const categoria = document.getElementById("categoria").value;
  const descricao = document.getElementById("descricao").value;

  if (modoOffline) {
    locaisMock.push({
      id: Date.now(),
      nome,
      cidade,
      categoria,
      descricao,
      avaliacoes: [],
    });

    renderLocais(locaisMock);
  } else {
    await fetch(`${API_URL}/locais`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cidade, categoria, descricao }),
    });

    await carregarLocais();
  }

  document.getElementById("form-local").reset();
});

/*
  --------------------------------------------------------------------------------------
  Eventos de controle do formulário de avaliação
  --------------------------------------------------------------------------------------
*/
document.getElementById("btn-abrir-form").addEventListener("click", () => {
  document.getElementById("form-container").style.display = "block";
  document.getElementById("btn-abrir-form").style.display = "none";
});

document.getElementById("btn-cancelar").addEventListener("click", () => {
  document.getElementById("form-container").style.display = "none";
  document.getElementById("btn-abrir-form").style.display = "block";
  document.getElementById("form-avaliacao").reset();
});

/*
  --------------------------------------------------------------------------------------
  Eventos de controle do formulário de criação de local
  --------------------------------------------------------------------------------------
*/
document.getElementById("btn-abrir-local").addEventListener("click", () => {
  document.getElementById("form-local-container").style.display = "block";
  document.getElementById("btn-abrir-local").style.display = "none";
});

document.getElementById("btn-cancelar-local").addEventListener("click", () => {
  document.getElementById("form-local-container").style.display = "none";
  document.getElementById("btn-abrir-local").style.display = "block";
  document.getElementById("form-local").reset();
});

/*
  --------------------------------------------------------------------------------------
  Inicialização
  --------------------------------------------------------------------------------------
*/
document.addEventListener("DOMContentLoaded", carregarLocais);
