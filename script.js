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

let select2Initialized = false;

// --- FUNÇÕES DE PREENCHIMENTO E FILTRAGEM ---

function preencherSelectBase() {
    const baseSelect = document.getElementById("food-base");
    const categoria = document.getElementById("category").value;
    
    baseSelect.innerHTML = '<option value="">Selecione ou digite o alimento...</option>'; 

    let lista = foods;
    if (categoria) {
        lista = foods.filter(f => f.categoria === categoria);
    }

    lista.forEach(f => {
        const option = document.createElement('option');
        option.value = f.nome;

        if (!categoria) {
            option.textContent = `${f.nome}`;
        } else {
            option.textContent = f.nome; 
        }
        baseSelect.appendChild(option);
    });
    
    if (select2Initialized) {
        $('#food-base').val(null).trigger('change');
    }
    
    document.getElementById("food-substitute").innerHTML = '<option value="">Selecione primeiro o alimento base</option>';
    if (select2Initialized) {
        $('#food-substitute').val(null).trigger('change');
    }
    document.getElementById("result").innerHTML = '';
    // Adicionado: Esconde o resultado ao resetar os filtros
    $('#result').hide(); 
}

function filtrarSubstitutos() {
    const baseName = $('#food-base').val(); 
    const subSelect = document.getElementById("food-substitute");
    
    subSelect.innerHTML = '<option value="">Selecione o substituto...</option>';

    if (!baseName) {
        if (select2Initialized) {
            $('#food-substitute').val(null).trigger('change');
        }
        document.getElementById("result").innerHTML = '';
        $('#result').hide(); // Esconde o resultado
        return;
    }

    const base = foods.find(f => f.nome === baseName);
    if (!base) return;

    const substitutos = foods.filter(f => f.categoria === base.categoria && f.nome !== base.nome);
    
    subSelect.innerHTML = '<option value="">Selecione o substituto...</option>';

    if (substitutos.length === 0) {
        subSelect.innerHTML = '<option value="">Nenhum substituto encontrado nesta categoria.</option>';
    } else {
        substitutos.forEach(f => {
            const option = document.createElement('option');
            option.value = f.nome;
            option.textContent = f.nome;
            subSelect.appendChild(option);
        });
    }
    
    if (select2Initialized) {
        $('#food-substitute').val(null).trigger('change');
    }
}

// --- FUNÇÃO DE CÁLCULO ---

function calcularSubstituicao() {
    const baseName = $('#food-base').val(); 
    const subName = $('#food-substitute').val(); 
    const grams = parseFloat($('#grams').val());
    const resultDiv = $('#result');

    // CORREÇÃO: Exibe o container de resultado (que está 'display: none;' no CSS)
    resultDiv.show(); 

    const base = foods.find(f => f.nome === baseName);
    const substituto = foods.find(f => f.nome === subName);
    
    if (!base || !substituto || isNaN(grams) || grams <= 0) {
        // Exibe mensagem de erro e retorna
        resultDiv.html('<p class="error">Selecione o alimento base, o substituto e insira uma quantidade válida.</p>');
        return;
    }
    
    // CÁLCULO
    const targetKcal = (base.kcal * grams) / 100;
    const qtdSubstituta = (targetKcal / substituto.kcal) * 100;
    const kcalEquiv = (substituto.kcal * qtdSubstituta) / 100;

    const subCarb = (substituto.carb / 100) * qtdSubstituta;
    const subProt = (substituto.prot / 100) * qtdSubstituta;
    const subGord = (substituto.gord / 100) * qtdSubstituta;


    let html = `
        <div class="food-option ${substituto.categoria}">
            <strong>Para substituir: ${grams}g de ${base.nome}</strong><br><br>
            <strong>Utilize: ${qtdSubstituta.toFixed(0)}g de ${substituto.nome}</strong>
            
            <p class="nutrients">
                ${kcalEquiv.toFixed(0)} kcal | C: ${subCarb.toFixed(1)}&nbsp;g | P: ${subProt.toFixed(1)}&nbsp;g | G: ${subGord.toFixed(1)}&nbsp;g
            </p>
        </div>
        <div class="summary">
            <h5>Base (${base.nome}, ${grams}g)</h5>
            <p>${(base.kcal*grams/100).toFixed(0)} kcal | C: ${(base.carb*grams/100).toFixed(1)}&nbsp;g | P: ${(base.prot*grams/100).toFixed(1)}&nbsp;g | G: ${(base.gord*grams/100).toFixed(1)}&nbsp;g</p>
        </div>
    `;

    resultDiv.html(html);
}


// --- INICIALIZAÇÃO PRINCIPAL ---
$(document).ready(function() {
    
    preencherSelectBase();
    
    // Opções de Select2 para ambos os campos
    const select2Options = {
        width: '100%', 
        placeholder: "Selecione ou digite o alimento...", 
        allowClear: true,
        selectionAdapter: $.fn.select2.amd.require('select2/selection/single'),
        templateSelection: function (data) {
            return $('<span style="line-height: 40px; display: block;">' + data.text + '</span>');
        }
    };
    
    // Aplica as opções ao Alimento Base
    $('#food-base').select2({
        ...select2Options,
        dropdownParent: $('#food-base').closest('.input-container'),
    });
    
    // Aplica as opções ao Alimento Substituto
    $('#food-substitute').select2({
        ...select2Options,
        placeholder: "Selecione o substituto...", 
        dropdownParent: $('#food-substitute').closest('.input-container'),
    });
    
    select2Initialized = true;
    
    // Associa os eventos de alteração
    $('#category').on('change', function() {
        preencherSelectBase(); 
    });

    $('#food-base').on('change', function() {
        filtrarSubstitutos();
    });
});

const atualizarAlimentos = preencherSelectBase;