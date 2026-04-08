const API_URL = "http://127.0.0.1:5000";

let localAtualId = null;

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
  Função para renderizar a lista de locais na tela
  --------------------------------------------------------------------------------------
*/
function renderLocais(data) {
  const container = document.getElementById("locais-container");
  container.innerHTML = "";

  const locais = Array.isArray(data) ? data : data.locais;

  if (!Array.isArray(locais)) {
    container.innerHTML = `<p>Nenhum resultado encontrado.</p>`;
    return;
  }

  if (locais.length === 0) {
    container.innerHTML = `<p>Nenhum local encontrado.</p>`;
    return;
  }

  locais.forEach((local) => {
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
  Função para carregar todos os locais da API
  --------------------------------------------------------------------------------------
*/
async function carregarLocais() {
  try {
    const response = await fetch(`${API_URL}/locais`);
    const data = await response.json();

    renderLocais(data);
  } catch (error) {
    console.error(error);
  }
}

/*
  --------------------------------------------------------------------------------------
  Função para abrir o modal e carregar avaliações de um local
  --------------------------------------------------------------------------------------
*/
async function abrirAvaliacoes(localId, nomeLocal) {
  try {
    const response = await fetch(`${API_URL}/locais/${localId}/avaliacoes`);
    const data = await response.json();

    const container = document.getElementById("lista-avaliacoes");
    const titulo = document.getElementById("modalTitulo");

    titulo.innerText = `Avaliações - ${nomeLocal}`;
    container.innerHTML = "";

    const avaliacoes = data.avaliacoes || data;

    localAtualId = localId;

    if (avaliacoes.length === 0) {
      container.innerHTML = "<p>Nenhuma avaliação ainda.</p>";
    } else {
      avaliacoes.forEach((avaliacao) => {
        const div = document.createElement("div");
        div.className =
          "avaliacao d-flex justify-content-between align-items-start";

        div.innerHTML = `
          <div>
            <strong>${avaliacao.nome_usuario}</strong>
            <span class="nota">⭐ ${avaliacao.nota}</span>
            <p>${avaliacao.comentario || ""}</p>
          </div>

          <button class="btn btn-sm btn-outline-danger btn-delete">
            🗑️
          </button>
        `;

        div
          .querySelector(".btn-delete")
          .addEventListener("click", () => deletarAvaliacao(avaliacao.id));

        container.appendChild(div);
      });
    }

    // reset form
    document.getElementById("form-container").style.display = "none";
    document.getElementById("btn-abrir-form").style.display = "block";

    const modal = new bootstrap.Modal(
      document.getElementById("modalAvaliacoes"),
    );
    modal.show();
  } catch (error) {
    console.error("Erro ao carregar avaliações:", error);
  }
}

/*
  --------------------------------------------------------------------------------------
  Função para deletar uma avaliação
  --------------------------------------------------------------------------------------
*/
async function deletarAvaliacao(avaliacaoId) {
  const confirmar = confirm("Deseja excluir esta avaliação?");
  if (!confirmar) return;

  try {
    await fetch(`${API_URL}/avaliacoes/${avaliacaoId}`, {
      method: "DELETE",
    });

    abrirAvaliacoes(
      localAtualId,
      document
        .getElementById("modalTitulo")
        .innerText.replace("Avaliações - ", ""),
    );

    await carregarLocais();
  } catch (error) {
    console.error("Erro ao deletar avaliação:", error);
  }
}

/*
  --------------------------------------------------------------------------------------
  Função para filtrar locais por cidade e categoria
  --------------------------------------------------------------------------------------
*/
async function filtrarLocais() {
  const cidade = document.getElementById("filtro-cidade").value;
  const categoria = document.getElementById("filtro-categoria").value;

  let url = `${API_URL}/locais?`;

  if (cidade) url += `cidade=${encodeURIComponent(cidade)}&`;
  if (categoria) url += `categoria=${encodeURIComponent(categoria)}&`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      renderLocais([]);
      return;
    }

    const data = await response.json();
    renderLocais(data);
  } catch (error) {
    console.error("Erro ao filtrar:", error);
  }
}

/*
  --------------------------------------------------------------------------------------
  Função para limpar filtros e recarregar lista
  --------------------------------------------------------------------------------------
*/
function limparFiltro() {
  document.getElementById("filtro-cidade").value = "";
  document.getElementById("filtro-categoria").value = "";

  carregarLocais();
}

/*
  --------------------------------------------------------------------------------------
  Eventos de inicialização da aplicação
  --------------------------------------------------------------------------------------
*/
document.addEventListener("DOMContentLoaded", carregarLocais);

/*
  --------------------------------------------------------------------------------------
  Evento de envio de avaliação
  --------------------------------------------------------------------------------------
*/
document
  .getElementById("form-avaliacao")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome_usuario").value;
    const nota = document.getElementById("nota").value;
    const comentario = document.getElementById("comentario").value;

    try {
      await fetch(`${API_URL}/locais/${localAtualId}/avaliacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_usuario: nome,
          nota: Number(nota),
          comentario,
        }),
      });

      document.getElementById("form-avaliacao").reset();

      abrirAvaliacoes(
        localAtualId,
        document
          .getElementById("modalTitulo")
          .innerText.replace("Avaliações - ", ""),
      );

      await carregarLocais();
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
    }
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
  Evento de envio de novo local
  --------------------------------------------------------------------------------------
*/
document.getElementById("form-local").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const cidade = document.getElementById("cidade").value;
  const categoria = document.getElementById("categoria").value;
  const descricao = document.getElementById("descricao").value;

  try {
    await fetch(`${API_URL}/locais`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, cidade, categoria, descricao }),
    });

    document.getElementById("form-local").reset();
    document.getElementById("form-local-container").style.display = "none";
    document.getElementById("btn-abrir-local").style.display = "block";

    await carregarLocais();
  } catch (error) {
    console.error("Erro ao criar local:", error);
  }
});
