let chartInstance = null;  // Variável para armazenar a instância do gráfico
let timeFrame = 'day';  // Estado inicial como 'day' (por padrão, gráfico por dia)
let accumulated = false;  // Variável de estado para alternar entre normal e acumulado


// Função para fazer a requisição e obter os dados
async function fetchData() {
    const response = await fetch('http://127.0.0.1:5000/load');
    const data = await response.json();

    // Extrair os dados para os três gráficos
    const labelsByDay = data.map(item => formatDate(item.date));

    // Extrair os valores de ambas as colunas
    const grossValues = data.map(item => item.gross_value);
    const netValues = data.map(item => item.net_value);

    const labelsByMonth = getMonthlyLabels(data);
    const monthlyGrossValues = getMonthlyValues(data, 'gross_value');
    const monthlyNetValues = getMonthlyValues(data, 'net_value');

    const labelsByYear = getAnnualLabels(data);
    const annualGrossValues = getAnnualValues(data, 'gross_value');
    const annualNetValues = getAnnualValues(data, 'net_value');

    // Cálculo dos valores acumulados
    const accumulatedGrossByDay = getAccumulatedValuesByDay(data, 'gross_value');
    const accumulatedNetByDay = getAccumulatedValuesByDay(data, 'net_value');

    const accumulatedGrossByMonth = getAccumulatedValuesByMonth(data, 'gross_value');
    const accumulatedNetByMonth = getAccumulatedValuesByMonth(data, 'net_value');

    const accumulatedGrossByYear = getAccumulatedValuesByYear(data, 'gross_value');
    const accumulatedNetByYear = getAccumulatedValuesByYear(data, 'net_value');

    // Criar o gráfico com os novos dados
    createChart(
        labelsByDay, grossValues, netValues,
        labelsByMonth, monthlyGrossValues, monthlyNetValues,
        labelsByYear, annualGrossValues, annualNetValues,
        accumulatedGrossByDay, accumulatedNetByDay,
        accumulatedGrossByMonth, accumulatedNetByMonth,
        accumulatedGrossByYear, accumulatedNetByYear
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
function getMonthlyValues(data, columnName) {
    const monthlyValues = new Array(12).fill(0);

    data.forEach(item => {
        const month = new Date(item.date).getMonth();
        const value = item[columnName];  // Usa a coluna correta
        monthlyValues[month] += value;
    });

    return monthlyValues;
}


// Função para calcular os valores agregados por ano
function getAnnualValues(data, columnName) {
    const annualValues = {};

    data.forEach(item => {
        const year = new Date(item.date).getFullYear();
        const value = item[columnName];

        if (!annualValues[year]) {
            annualValues[year] = 0;
        }

        annualValues[year] += value;
    });

    return Object.keys(annualValues).sort().map(year => annualValues[year]);
}


// Função para calcular os valores acumulados por dia
function getAccumulatedValuesByDay(data, columnName) {
    let accumulated = 0;
    return data.map(item => {
        accumulated += item[columnName];
        return accumulated;
    });
}


// Função para calcular os valores acumulados por mês
function getAccumulatedValuesByMonth(data, columnName) {
    const monthlyValues = new Array(12).fill(0);
    let accumulated = 0;

    data.forEach(item => {
        const month = new Date(item.date).getMonth();
        const value = item[columnName];
        monthlyValues[month] += value;
    });

    return monthlyValues.map(value => {
        accumulated += value;
        return accumulated;
    });
}


// Função para calcular os valores acumulados por ano
function getAccumulatedValuesByYear(data, columnName) {
    const annualValues = {};
    let accumulated = 0;

    data.forEach(item => {
        const year = new Date(item.date).getFullYear();
        const value = item[columnName];

        if (!annualValues[year]) {
            annualValues[year] = 0;
        }

        annualValues[year] += value;
    });

    return Object.keys(annualValues).sort().map(year => {
        accumulated += annualValues[year];
        return accumulated;
    });
}


// Função para calcular o valor mínimo dos dados
function getMinValue(values) {
    return Math.min(...values);
}


// Função para criar o gráfico
function createChart(
    labelsByDay,
    grossValues,
    netValues,
    labelsByMonth,
    monthlyGrossValues,
    monthlyNetValues,
    labelsByYear,
    annualGrossValues,
    annualNetValues,
    accumulatedGrossByDay,
    accumulatedNetByDay,
    accumulatedGrossByMonth,
    accumulatedNetByMonth,
    accumulatedGrossByYear,
    accumulatedNetByYear
) {
    const ctx = document.getElementById('lineChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Seleciona os valores corretos conforme os estados
    const selectedGrossValues = accumulated ?
        (timeFrame === 'day' ? accumulatedGrossByDay : 
            (timeFrame === 'month' ? accumulatedGrossByMonth : accumulatedGrossByYear)) 
        :
        (timeFrame === 'day' ? grossValues : 
            (timeFrame === 'month' ? monthlyGrossValues : annualGrossValues));

    const selectedNetValues = accumulated ?
        (timeFrame === 'day' ? accumulatedNetByDay : 
            (timeFrame === 'month' ? accumulatedNetByMonth : accumulatedNetByYear)) 
        :
        (timeFrame === 'day' ? netValues : 
            (timeFrame === 'month' ? monthlyNetValues : annualNetValues));

    // Define os rótulos
    const labels = timeFrame === 'day' ? labelsByDay : (timeFrame === 'month' ? labelsByMonth : labelsByYear);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Gross Value',
                    data: selectedGrossValues,
                    borderColor: 'rgb(140, 140, 140)',
                    backgroundColor: 'rgba(140, 140, 140, 0.5)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Net Value',
                    data: selectedNetValues,
                    borderColor: 'rgb(202, 126, 255)',
                    backgroundColor: 'rgba(202, 126, 255, 0.5)',
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
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
                    beginAtZero: true,
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
