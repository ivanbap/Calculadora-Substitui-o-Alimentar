// ...existing code...
// Variável global para armazenar todos os dados do JSON
let foods = [];
let select2Initialized = false;

// O CAMINHO CORRETO PARA SEU ARQUIVO JSON
const JSON_URL = 'assets/alimentos1.json';

// --- FUNÇÕES DE CARREGAMENTO E INICIALIZAÇÃO ASSÍNCRONA ---
function carregarDadosJSON() {
    $.getJSON(JSON_URL, function (data) {
        // Mapeamento e Conversão de Tipos
        foods = data.map(item => {
            // Normaliza categoria em array (aceita array ou string "cat1, cat2")
            let categorias = [];
            if (Array.isArray(item.categoria)) {
                categorias = item.categoria.map(c => String(c).trim()).filter(Boolean);
            } else if (item.categoria != null) {
                categorias = String(item.categoria).split(',').map(c => c.trim()).filter(Boolean);
            }

            return {
                nome: item.alimento,
                kcal: parseFloat(item.kcal) || 0,
                carb: parseFloat(item.carbo) || 0,
                prot: parseFloat(item.prot) || 0,
                gord: parseFloat(item.gord) || 0,
                categorias // array de categorias
            };
        });

        iniciarApp();
    })
    .fail(function (jqxhr, textStatus, error) {
        const err = textStatus + ", " + error;
        console.error("Erro ao carregar o JSON: " + err);
        alert("Erro ao carregar a base de alimentos. Verifique o caminho dos arquivos em assets.");
    });
}

// --- Funções de Inicialização e Select2 ---
function inicializarSelect2(idSeletor, placeholderTexto, isCategory = false) {
    $(idSeletor).attr('data-placeholder', placeholderTexto);

    const select2Options = {
        width: '100%',
        placeholder: placeholderTexto,
        allowClear: !isCategory,
        dropdownParent: $(idSeletor).closest('.input-container'),
        // Garante que o texto selecionado apareça
        templateSelection: function (data) {
            return data && data.text ? data.text : (data && data.id ? data.id : '');
        }
    };

    $(idSeletor).select2(select2Options);
}

function iniciarApp() {
    // Definindo o valor padrão como "all" no início
    $('#category').val('all');

    preencherSelectBase();

    // Inicializa todos os Select2 UMA ÚNICA VEZ
    inicializarSelect2('#category', 'Todas as Categorias', true);
    inicializarSelect2('#food-base', 'Selecione ou digite o alimento...');
    inicializarSelect2('#food-substitute', 'Selecione primeiro o alimento base');

    select2Initialized = true;

    // Força o dropdown do #food-substitute a abrir SEMPRE para baixo.
    $('#food-substitute').on('select2:opening', function () {
        const $dropdown = $('.select2-dropdown');
        $dropdown.removeClass('select2-dropdown--above');
        $dropdown.addClass('select2-dropdown--below');
    });

    // Associa os eventos de alteração
    $('#category').on('change', function () {
        preencherSelectBase();
    });

    $('#food-base').on('change', function () {
        filtrarSubstitutos();
        mostrarDetalhesBase();
    });

    $('#grams').on('input', mostrarDetalhesBase);
    $('button').on('click', calcularSubstituicao);

    $('#base-result, #substitute-result').show();
}

// --- Funções de Manipulação do Select2 e Resultados ---
function resetResults() {
    $('#base-result').html('<p>Insira a quantidade e o alimento para ver as calorias e macros aqui.</p>');
    $('#substitute-result').html('<p>O resultado da substituição aparecerá aqui.</p>');
}

function forceSelect2Placeholder() {
    $('.select2-selection__rendered').each(function () {
        const $rendered = $(this);
        const prevSelect = $rendered.closest('.select2-container').prev('select');
        const isCategorySelect = prevSelect.attr && prevSelect.attr('id') === 'category';

        if ($rendered.find('span').length === 0 && $rendered.text().trim() === '' && !isCategorySelect) {
            const placeholder = prevSelect.data('placeholder');
            if (placeholder) {
                const $placeholderSpan = $('<span class="select2-selection__placeholder"></span>').text(placeholder);
                $rendered.empty().append($placeholderSpan);
            }
        }
    });
}

function preencherSelectBase() {
    const baseSelect = document.getElementById("food-base");
    const categoria = $('#category').val();

    // 1. Preenchimento do SELECT nativo
    baseSelect.innerHTML = '<option value="">Selecione ou digite o alimento...</option>';

    let lista = foods;
    // Se a categoria for "all", não aplicamos filtro
    if (categoria && categoria !== 'all') {
        lista = foods.filter(f => Array.isArray(f.categorias) && f.categorias.includes(categoria));
    }

    lista.forEach(f => {
        const option = document.createElement('option');
        option.value = f.nome;
        option.textContent = f.nome;
        baseSelect.appendChild(option);
    });

    // 2. Atualiza Select2 e força a exibição
    if (select2Initialized) {
        setTimeout(function () {
            $('#food-base').val(null).trigger('change');

            document.getElementById("food-substitute").innerHTML = '<option value="">Selecione primeiro o alimento base</option>';
            $('#food-substitute').val(null).trigger('change');

            forceSelect2Placeholder();
        }, 0);
    }

    resetResults();
}

function filtrarSubstitutos() {
    const baseName = $('#food-base').val();
    const subSelect = document.getElementById("food-substitute");

    subSelect.innerHTML = '<option value="">Selecione o substituto...</option>';

    if (!baseName) {
        if (select2Initialized) {
            setTimeout(function () {
                $('#food-substitute').val(null).trigger('change');
                forceSelect2Placeholder();
            }, 0);
        }
        resetResults();
        return;
    }

    const base = foods.find(f => f.nome === baseName);
    if (!base) return;

    // Filtra substitutos que compartilham ao menos uma categoria com a base
    const substitutos = foods.filter(f =>
        f.nome !== base.nome &&
        Array.isArray(f.categorias) &&
        f.categorias.some(c => base.categorias.includes(c))
    );

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
        setTimeout(function () {
            $('#food-substitute').val(null).trigger('change');
            forceSelect2Placeholder();
        }, 0);
    }
}

// --- FUNÇÕES DE EXIBIÇÃO DE DETALHES E CÁLCULO (MANTIDAS) ---
function mostrarDetalhesBase() {
    const baseName = $('#food-base').val();
    const grams = parseFloat($('#grams').val());
    const baseResultDiv = $('#base-result');

    baseResultDiv.show();

    const base = foods.find(f => f.nome === baseName);

    if (!base || isNaN(grams) || grams <= 0) {
        baseResultDiv.html('<p>Insira a quantidade e o alimento para ver as calorias e macros aqui.</p>');
        return;
    }

    const fator = grams / 100;
    const targetKcal = base.kcal * fator;
    const baseCarb = base.carb * fator;
    const baseProt = base.prot * fator;
    const baseGord = base.gord * fator;

    const classes = (base.categorias || []).join(' ');

    const baseHtml = `
        <div class="food-option ${classes}">
            <h4>${grams.toFixed(0)}g de ${base.nome}</h4>
            <div class="wrap-option">
                <p class="nutrients">Calorias: <strong>${targetKcal.toFixed(0)} kcal</strong></p>
                <p class="nutrients">Carboidrato: <strong>${baseCarb.toFixed(1)}g</strong> 🍞</p>
                <p class="nutrients">Proteína: <strong>${baseProt.toFixed(1)}g</strong> 🍗</p>
                <p class="nutrients">Gordura: <strong>${baseGord.toFixed(1)}g</strong> 🧈</p>
            </div>
        </div>
    `;
    baseResultDiv.html(baseHtml);
}

function calcularSubstituicao() {
    const baseName = $('#food-base').val();
    const subName = $('#food-substitute').val();
    const grams = parseFloat($('#grams').val());
    const subResultDiv = $('#substitute-result');

    if (!baseName || !subName || isNaN(grams) || grams <= 0) {
        alert("Selecione o alimento base e o substituto, e insira uma quantidade válida.");
        return;
    }

    const base = foods.find(f => f.nome === baseName);
    const substituto = foods.find(f => f.nome === subName);

    const targetKcal = (base.kcal * grams) / 100;
    const qtdSubstituta = (substituto.kcal === 0) ? 0 : (targetKcal / substituto.kcal) * 100;

    const subCarb = (substituto.carb * qtdSubstituta) / 100;
    const subProt = (substituto.prot * qtdSubstituta) / 100;
    const subGord = (substituto.gord * qtdSubstituta) / 100;

    mostrarDetalhesBase();

    const classes = (substituto.categorias || []).join(' ');

    const substituteHtml = `
        <div class="food-option ${classes}">
            <h4>${qtdSubstituta.toFixed(0)}g de ${substituto.nome}</h4>
            <div class="wrap-option">
                <p class="nutrients">Calorias: <strong>${targetKcal.toFixed(0)} kcal</strong></p>
                <p class="nutrients">Carboidrato: <strong>${subCarb.toFixed(1)}g</strong> 🍞</p>
                <p class="nutrients">Proteína: <strong>${subProt.toFixed(1)}g</strong> 🍗</p>
                <p class="nutrients">Gordura: <strong>${subGord.toFixed(1)}g</strong> 🧈</p>
            </div>
        </div>
    `;

    subResultDiv.html(substituteHtml).show();
}

// --- INICIALIZAÇÃO PRINCIPAL ---
$(document).ready(carregarDadosJSON);
// ...existing code...