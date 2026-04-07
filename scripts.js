const API_URL = "http://127.0.0.1:5000";

async function carregarLocais() {
  try {
    const response = await fetch(`${API_URL}/locais`);
    const data = await response.json();

    console.log("API:", data);

    const container = document.getElementById("locais-container");
    container.innerHTML = "";

    const locais = data.locais || data;

    locais.forEach((local) => {
      const col = document.createElement("div");
      col.className = "col-md-4 mb-4";

      col.innerHTML = `
                <div class="card card-local h-100">

                    <!-- IMAGEM -->
                    <!--<img src="https://via.placeholder.com/300x200">-->
                    <img src="img/Placeholder-Landscape.jpg" class="card-img-top" alt="Local">

                    <div class="card-body">
                        <h5 class="card-title">${local.nome}</h5>
                        <p class="local-cidade">${local.cidade}</p>
                        <p class="local-descricao">${local.descricao}</p>
                    </div>

                </div>
            `;

      container.appendChild(col);
    });
  } catch (error) {
    console.error("Erro:", error);
  }
}

document.addEventListener("DOMContentLoaded", carregarLocais);
