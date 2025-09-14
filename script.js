const foods = [
  { nome: "Arroz branco cozido", kcal: 130, carb: 28, prot: 2.4, gord: 0.3, categoria: "carbo" },
  { nome: "Batata cozida", kcal: 86, carb: 20, prot: 2.0, gord: 0.1, categoria: "carbo" },
  { nome: "Pão francês", kcal: 270, carb: 50, prot: 8.0, gord: 3.0, categoria: "carbo" },
  { nome: "Feijão cozido", kcal: 76, carb: 13.6, prot: 4.8, gord: 0.5, categoria: "carbo" },
  { nome: "Frango grelhado", kcal: 165, carb: 0, prot: 31, gord: 3.6, categoria: "proteina" },
  { nome: "Ovo cozido", kcal: 155, carb: 1.1, prot: 13, gord: 11, categoria: "proteina" },
  { nome: "Patinho moído", kcal: 170, carb: 0, prot: 31, gord: 8, categoria: "proteina" },
  { nome: "Amêndoas", kcal: 579, carb: 22, prot: 21, gord: 50, categoria: "gordura" },
  { nome: "Azeite de oliva", kcal: 884, carb: 0, prot: 0, gord: 100, categoria: "gordura" }
];

function atualizarAlimentos() {
  const categoria = document.getElementById("category").value;
  const foodSelect = document.getElementById("food");
  foodSelect.innerHTML = '';
  if (!categoria) {
    foodSelect.innerHTML = '<option value="">Selecione primeiro a categoria</option>';
    return;
  }
  const lista = foods.filter(f => f.categoria === categoria);
  foodSelect.innerHTML = '<option value="">Selecione o alimento</option>';
  lista.forEach(f => {
    const option = document.createElement('option');
    option.value = f.nome;
    option.textContent = f.nome;
    foodSelect.appendChild(option);
  });
}

function calcularSubstituicao() {
  const foodName = document.getElementById("food").value;
  const grams = parseFloat(document.getElementById("grams").value);
  const base = foods.find(f => f.nome === foodName);
  if (!base || isNaN(grams)) return alert("Escolha um alimento e insira uma quantidade válida.");

  const targetKcal = (base.kcal * grams) / 100;

  let html = `<h3>Base: ${foodName} — ${grams} g</h3>`;
  html += `<p><strong>${targetKcal.toFixed(0)} kcal</strong> | Carbo: ${(base.carb*grams/100).toFixed(1)} g | Prot: ${(base.prot*grams/100).toFixed(1)} g | Gord: ${(base.gord*grams/100).toFixed(1)} g</p>`;

  const substitutos = foods.filter(f => f.categoria === base.categoria && f.nome !== base.nome);
  if (substitutos.length > 0) {
    html += `<div class="category"><h4>Substitutos (${base.categoria})</h4>`;
    substitutos.forEach(f => {
      const qtd = (targetKcal / f.kcal) * 100;
      const kcalEquiv = (f.kcal * qtd) / 100;

      html += `<div class="food-option ${f.categoria}">
        <strong>${f.nome}</strong><br>
        ~ ${qtd.toFixed(0)} g → ${kcalEquiv.toFixed(0)} kcal
      </div>`;
    });
    html += `</div>`;
  } else {
    html += `<p>Nenhum substituto disponível nesta categoria.</p>`;
  }

  document.getElementById("result").innerHTML = html;
}
