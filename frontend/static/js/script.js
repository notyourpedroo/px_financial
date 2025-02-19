let chartInstance = null;
let timeFrame = 'day';
let accumulated = false;

async function fetchData() {
    const response = await fetch('http://127.0.0.1:5000/load');
    const data = await response.json();

    const labelsByDay = data.map(item => formatDate(item.date));
    const grossValues = data.map(item => item.gross_value);
    const netValues = data.map(item => item.net_value);

    const labelsByMonth = getMonthlyLabels(data);
    const monthlyGrossValues = getMonthlyValues(data, 'gross_value');
    const monthlyNetValues = getMonthlyValues(data, 'net_value');

    const labelsByYear = getAnnualLabels(data);
    const annualGrossValues = getAnnualValues(data, 'gross_value');
    const annualNetValues = getAnnualValues(data, 'net_value');

    const accumulatedGrossByDay = getAccumulatedValuesByDay(data, 'gross_value');
    const accumulatedNetByDay = getAccumulatedValuesByDay(data, 'net_value');

    const accumulatedGrossByMonth = getAccumulatedValuesByMonth(data, 'gross_value');
    const accumulatedNetByMonth = getAccumulatedValuesByMonth(data, 'net_value');

    const accumulatedGrossByYear = getAccumulatedValuesByYear(data, 'gross_value');
    const accumulatedNetByYear = getAccumulatedValuesByYear(data, 'net_value');

    createChart(
        labelsByDay, grossValues, netValues,
        labelsByMonth, monthlyGrossValues, monthlyNetValues,
        labelsByYear, annualGrossValues, annualNetValues,
        accumulatedGrossByDay, accumulatedNetByDay,
        accumulatedGrossByMonth, accumulatedNetByMonth,
        accumulatedGrossByYear, accumulatedNetByYear
    );
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
}

function getMonthlyLabels(data) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const uniqueMonths = new Set();

    data.forEach(item => {
        const month = new Date(item.date).getMonth();
        uniqueMonths.add(month);
    });

    return Array.from(uniqueMonths).sort().map(monthIndex => months[monthIndex]);
}

function getAnnualLabels(data) {
    const uniqueYears = new Set();

    data.forEach(item => {
        const year = new Date(item.date).getFullYear();
        uniqueYears.add(year);
    });

    return Array.from(uniqueYears).sort();
}

function getMonthlyValues(data, columnName) {
    const monthlyValues = new Array(12).fill(0);

    data.forEach(item => {
        const month = new Date(item.date).getMonth();
        const value = item[columnName];
        monthlyValues[month] += value;
    });

    return monthlyValues;
}

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

function getAccumulatedValuesByDay(data, columnName) {
    let accumulated = 0;
    return data.map(item => {
        accumulated += item[columnName];
        return accumulated;
    });
}

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

function getMinValue(values) {
    return Math.min(...values);
}

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

function switchGraph(newTimeFrame) {
    timeFrame = newTimeFrame;
    fetchData();
}

function toggleAccumulated() {
    accumulated = !accumulated;
    fetchData();
}

fetchData();
