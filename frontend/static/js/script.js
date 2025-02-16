let chartInstance = null;  // Variável para armazenar a instância do gráfico
let timeFrame = 'day';  // Estado inicial como 'day' (por padrão, gráfico por dia)
let accumulated = false;  // Variável de estado para alternar entre normal e acumulado


// Função para fazer a requisição e obter os dados
async function fetchData() {
    const response = await fetch('http://127.0.0.1:5000/load');
    const data = await response.json();

    // Extrair os dados para os três gráficos
    const labelsByDay = data.map(item => formatDate(item.date));  // Formata a data para 'dd/mm/yyyy'
    const values = data.map(item => item.value);  // Coluna 'value'

    const labelsByMonth = getMonthlyLabels(data);  // Obtém os meses do ano com dados
    const monthlyValues = getMonthlyValues(data);  // Soma os valores por mês

    const labelsByYear = getAnnualLabels(data);  // Obtém os anos com dados
    const annualValues = getAnnualValues(data);  // Soma os valores por ano

    // Cálculo dos valores acumulados
    const accumulatedValuesByDay = getAccumulatedValuesByDay(data);
    const accumulatedValuesByMonth = getAccumulatedValuesByMonth(data);
    const accumulatedValuesByYear = getAccumulatedValuesByYear(data);

    // Criar o gráfico com base no estado do 'timeFrame' e 'accumulated'
    createChart(
        labelsByDay,
        values,
        labelsByMonth,
        monthlyValues,
        labelsByYear,
        annualValues,
        accumulatedValuesByDay,
        accumulatedValuesByMonth, 
        accumulatedValuesByYear
    );
}


// Função para formatar a data no formato 'dd/mm/yyyy'
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');  // Usar getUTCDate() para evitar problemas de fuso horário
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');  // Usar getUTCMonth() para evitar problemas de fuso horário
    const year = date.getUTCFullYear();  // Usar getUTCFullYear() para evitar problemas de fuso horário

    return `${day}/${month}/${year}`;
}


// Função para extrair os meses do último ano
function getMonthlyLabels(data) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const uniqueMonths = new Set();  // Para garantir que temos meses únicos

    data.forEach(item => {
        const month = new Date(item.date).getMonth();  // Obtém o mês (0-11)
        uniqueMonths.add(month);
    });

    // Ordena os meses em ordem crescente e os converte para nomes
    return Array.from(uniqueMonths).sort().map(monthIndex => months[monthIndex]);
}


// Função para extrair os anos dos dados
function getAnnualLabels(data) {
    const uniqueYears = new Set();  // Para garantir que temos anos únicos

    data.forEach(item => {
        const year = new Date(item.date).getFullYear();  // Obtém o ano
        uniqueYears.add(year);
    });

    // Ordena os anos em ordem crescente
    return Array.from(uniqueYears).sort();
}


// Função para calcular os valores agregados por mês
function getMonthlyValues(data) {
    const monthlyValues = new Array(12).fill(0);  // 12 meses do ano (inicializa todos os valores como 0)

    data.forEach(item => {
        const month = new Date(item.date).getMonth();  // Obtém o mês (0-11)
        const value = item.value;  // Valor associado ao item
        monthlyValues[month] += value;  // Soma os valores para o mês correspondente
    });

    return monthlyValues;
}


// Função para calcular os valores agregados por ano
function getAnnualValues(data) {
    const annualValues = {};  // Objeto para armazenar valores por ano

    data.forEach(item => {
        const year = new Date(item.date).getFullYear();  // Obtém o ano
        const value = item.value;  // Valor associado ao item

        if (!annualValues[year]) {
            annualValues[year] = 0;
        }

        annualValues[year] += value;  // Soma os valores para o ano correspondente
    });

    // Retorna os valores por ano em uma ordem correspondente aos anos
    return Object.keys(annualValues).sort().map(year => annualValues[year]);
}


// Função para calcular os valores acumulados por dia
function getAccumulatedValuesByDay(data) {
    let accumulated = 0;
    return data.map(item => {
        accumulated += item.value;
        return accumulated;
    });
}


// Função para calcular os valores acumulados por mês
function getAccumulatedValuesByMonth(data) {
    const monthlyValues = new Array(12).fill(0);  // 12 meses do ano (inicializa todos os valores como 0)
    let accumulated = 0;

    data.forEach(item => {
        const month = new Date(item.date).getMonth();  // Obtém o mês (0-11)
        const value = item.value;  // Valor associado ao item
        monthlyValues[month] += value;  // Soma os valores para o mês correspondente
    });

    // Acumula os valores mensais
    return monthlyValues.map(value => {
        accumulated += value;
        return accumulated;
    });
}


// Função para calcular os valores acumulados por ano
function getAccumulatedValuesByYear(data) {
    const annualValues = {};  // Objeto para armazenar valores por ano
    let accumulated = 0;

    data.forEach(item => {
        const year = new Date(item.date).getFullYear();  // Obtém o ano
        const value = item.value;  // Valor associado ao item

        if (!annualValues[year]) {
            annualValues[year] = 0;
        }

        annualValues[year] += value;  // Soma os valores para o ano correspondente
    });

    // Retorna os valores acumulados por ano
    const accumulatedValues = Object.keys(annualValues).sort().map(year => {
        accumulated += annualValues[year];
        return accumulated;
    });

    return accumulatedValues;
}


// Função para calcular o valor mínimo dos dados
function getMinValue(values) {
    return Math.min(...values);
}


// Função para criar o gráfico
function createChart(
    labelsByDay,
    values,
    labelsByMonth,
    monthlyValues,
    labelsByYear,
    annualValues,
    accumulatedValuesByDay,
    accumulatedValuesByMonth,
    accumulatedValuesByYear
) {
    const ctx = document.getElementById('lineChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();  // Destrói o gráfico anterior
    }

    // Obter os dados corretos (normal ou acumulado)
    const dataValues = accumulated ? 
        (timeFrame === 'day' ? accumulatedValuesByDay : 
            (timeFrame === 'month' ? accumulatedValuesByMonth : accumulatedValuesByYear)) 
        : 
        (timeFrame === 'day' ? values : 
            (timeFrame === 'month' ? monthlyValues : annualValues));

    // Calcular o valor mínimo
    const minValue = getMinValue(dataValues);

    // Criar o gradiente para o fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);  // Gradiente do topo para a base (do 0 ao 400)
    gradient.addColorStop(0, 'rgba(202, 126, 255, 1)');  // Cor sólida no topo
    gradient.addColorStop(1, 'rgba(202, 126, 255, 0)');  // Transparente na base

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeFrame === 'day' ? labelsByDay : (timeFrame === 'month' ? labelsByMonth : labelsByYear),
            datasets: [{
                label: 'Valor',
                data: dataValues,
                borderColor: 'rgb(202, 126, 255)',
                backgroundColor: gradient,
                tension: 0.1,
                fill: true  // Preencher abaixo da linha
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `R$ ${tooltipItem.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: timeFrame === 'day' ? 'Data' : (timeFrame === 'month' ? 'Meses' : 'Anos')
                    }
                },
                y: {
                    beginAtZero: minValue >= 0,  // Se não houver valores negativos, começa do 0
                    min: minValue < 0 ? minValue : 0,  // Caso haja valores negativos, começa no menor valor negativo
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}


// Função para alternar entre gráficos de dia, mês e ano
function switchGraph(newTimeFrame) {
    timeFrame = newTimeFrame;  // Atualiza o estado global
    fetchData();  // Refaz a requisição com base no novo tipo de gráfico
}


// Função para alternar entre gráfico normal e acumulado
function toggleAccumulated() {
    accumulated = !accumulated;  // Alterna o estado
    fetchData();  // Refaz a requisição com base no novo estado
}


// Inicializa o gráfico ao carregar
fetchData();
