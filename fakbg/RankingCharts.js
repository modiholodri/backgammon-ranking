// default colors
const wonForeColor = 'rgba(0, 255, 0, 1)';
const wonBackColor = 'rgba(0, 255, 0, 0.3)';

const lostForeColor = 'rgba(255, 0, 255, 1)';
const lostBackColor = 'rgba(255, 0, 255, 0.3)';

const neutralForeColor = 'rgba(54, 162, 255, 1)';
const neutralBackColor = 'rgba(54, 162, 255, 0.3)';

const highColor = 'rgba(0, 255, 0, 1)';
const lowColor = 'rgba(255, 0, 255, 1)';

const expectedColor = 'rgba(255, 255, 0, 0.7)';

const playerLineColor = 'rgba(255, 255, 0, 1)';
const middleLineColor = 'rgba(0, 255, 255, 1)';

const chartColor = 'rgba(255, 255, 0, 0.7)';
const gridColor = { color: 'rgba(255, 255, 0, 0.3)' };

Chart.defaults.color = 'white';  // default text color
Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.0)';  // don't show the default grid
Chart.defaults.plugins.legend.labels.color = chartColor;
Chart.defaults.scale.title.font = { size: 16, weight: 'bold' };
Chart.defaults.scale.title.color = chartColor;
Chart.defaults.layout.padding.top = 7;


let rankingChart;

let hiddenStates;
let defaultHiddenStates = {
    'ratingList': [false, false],
    'winningPercent': [false, false],
    'matchesPlayed': [false, false],
    'currentScores': [false, false, false],
    'highScores': [false, false, false],
    'lowScores': [false, false, false],
    'percentMatchesWon': [false, false],
    'rangliste': [false, false, true],
    'playerInfoPercent': [false, false],
    'playerInfoMatches': [false, false],
};

// get the selected time span and puts it in a format so that it can be added to the chart title
function getSelectedTimeInterval() {
    const timeSpanSelectionElement = document.getElementById("timeSpanSelection");
    const selectedIndex = timeSpanSelectionElement.selectedIndex;
    const timeSpanSelection = timeSpanSelectionElement.options[selectedIndex].text;

    if (timeSpanSelection === '') return ' (Eternally)';
    return ' (' + timeSpanSelection + ')';
}

// If the Ranking chart already exists, destroy it before creating a new one
function destroyRankingChart(message) {
    if (rankingChart) {
        rankingChart.destroy();
        rankingChart = null;
    }
    document.getElementById('rankingChartCanvas').height = 0;
    document.getElementById('rankingChartMessage').innerText = message;
}

// Dynamically adjust canvas height based on the number of players
function optimizeChartCanvasHeight(rankingChartCanvas, numberOfPlayers) {
    const heightPerPlayer = 20; // Height per player in pixels
    const additionalHeight = 120;
    const minHeight = additionalHeight + heightPerPlayer; // Minimum height for the canvas
    document.getElementById(rankingChartCanvas).height = Math.max(numberOfPlayers * heightPerPlayer + additionalHeight, minHeight);
}

// Remember the hidden state of the datasets and set them again
function setRememberedHiddenStates() {
    const rankingListSelection = document.getElementById('rankingListSelection').value;
    if(manuallyChangedChart) {
        hiddenStates = defaultHiddenStates[rankingListSelection];
        manuallyChangedChart = false;
    }
    else hiddenStates = rankingChart?.data?.datasets.map((_, index) => !rankingChart.isDatasetVisible(index)) || defaultHiddenStates[rankingListSelection];
}

// Function to create or update the Matches chart
function updateMatchesPlayedChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    let matchesPlayedRankingList =  document.getElementById('rankingListSelection').value === 'matchesPlayed';
    
    const players = matchesPlayedRankingList ?
                    Object.keys(matchListSummary).sort((a, b) => matchListSummary[b].matchesPlayed - matchListSummary[a].matchesPlayed || matchListSummary[b].matchesWon - matchListSummary[a].matchesWon) :
                    Object.keys(matchListSummary).sort((a, b) => (matchListSummary[b].matchesWon/matchListSummary[b].matchesPlayed)-(matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed));
    
    if (players.length < 1) return;
    
    const matchesWon = matchesPlayedRankingList ?
                        players.map(player => matchListSummary[player].matchesWon):
                        players.map(player => 100*matchListSummary[player].matchesWon/matchListSummary[player].matchesPlayed);
    
    const matchesLost = matchesPlayedRankingList ?
                        players.map(player => matchListSummary[player].matchesLost):
                        players.map(player => 100*matchListSummary[player].matchesLost/matchListSummary[player].matchesPlayed);

    const chartTitle = matchesPlayedRankingList ? 'Matches Played' : '% Matches Won';

    const yourName = document.getElementById('yourName').value.trim();
    const playerValue = matchesPlayedRankingList ? 0 : 100*matchListSummary[yourName]?.matchesWon/matchListSummary[yourName]?.matchesPlayed;

    setRememberedHiddenStates();
    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart if it doesn't exist
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Won',
                    hidden: hiddenStates[0],
                    data: matchesWon,
                    backgroundColor: wonBackColor,
                    borderColor: wonForeColor,
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[1],
                    data: matchesLost,
                    backgroundColor: lostBackColor,
                    borderColor: lostForeColor,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            if (matchesPlayedRankingList) { // show the real matches won/lost   
                                const totalMatches = context.chart.data.datasets
                                    .reduce((sum, ds) => sum + Number(ds.data[context.dataIndex] || 0), 0);
                                return [` ${totalMatches} matches`, ` ${context.dataset.label} ${context.raw}`];
                            }
                            return [` ${context.dataset.label} ${context.raw.toFixed(1)}%`, ` of matches`];
                        }
                    }
                },
                legend: { position: 'bottom' },
                ...(matchesPlayedRankingList ? {} : {
                    annotation: {
                        annotations: {
                            fiftyPercentLine: {
                                type: 'line',
                                xMin: 50, // Y-axis value where the line starts
                                xMax: 50, // Y-axis value where the line ends
                                borderColor: middleLineColor,
                                borderDash: [5, 5],
                                borderWidth: 2,
                            },
                            playerValueLine: {
                                type: 'line',
                                display: playerValue,
                                xMin: playerValue, // Y-axis value where the line starts
                                xMax: playerValue, // Y-axis value where the line ends
                                borderColor: playerLineColor,
                                borderDash: [5, 5],
                                borderWidth: 2,
                            }
                        }
                    }
                })                    
            },
            scales: {
                x: {
                    title: {
                        text: chartTitle + getSelectedTimeInterval(),
                        display: true,
                    },
                    beginAtZero: true,
                    stacked: true,
                    position: 'top',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

// Function to create or update the Ranglisten chart
function updateRanglistenChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => matchListSummary[b].punkte - matchListSummary[a].punkte);
    if (players.length < 1) return;
    const punkteWon = players.map(player => matchListSummary[player].punkteWon);
    const punkteBonus = players.map(player => matchListSummary[player].punkteBonus);
    const punkteLost = players.map(player => matchListSummary[player].punkteLost);

    setRememberedHiddenStates();
    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Won',
                    hidden: hiddenStates[0],
                    data: punkteWon,
                    backgroundColor: wonBackColor,
                    borderColor: wonForeColor,
                    borderWidth: 1
                },
                {
                    label: 'Bonus',
                    hidden: hiddenStates[1],
                    data: punkteBonus,
                    backgroundColor: neutralBackColor,
                    borderColor: neutralForeColor,
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[2],
                    data: punkteLost,
                    backgroundColor: lostBackColor,
                    borderColor: lostForeColor,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            const totalPunkte = context.chart.data.datasets
                                .filter(ds => ds.label !== 'Lost')
                                .reduce((sum, ds) => sum + Number(ds.data[context.dataIndex] || 0), 0);
                            return [` ${totalPunkte.toLocaleString()} Punkte`, ` ${context.dataset.label} ${context.raw.toLocaleString()}`];
                        }
                    }
                },
                legend: { position: 'bottom' },
            },
            scales: {
                x: {
                    title: {
                        text: 'Ranglisten Punkte' + getSelectedTimeInterval(),
                        display: true,
                    },
                    beginAtZero: true,
                    stacked: true,
                    position: 'top',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

function updatePlayerInfoPercentChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => {
        const diff = matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed - matchListSummary[b].matchesWon/matchListSummary[b].matchesPlayed;
        if (diff !== 0 ) return diff;
        return matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed > 0.5 ? 
               matchListSummary[a].matchesWon - matchListSummary[b].matchesWon :
               matchListSummary[b].matchesLost - matchListSummary[a].matchesLost;
    });
    if (players.length < 1) return;
    const matchesWon = players.map(player => 100*matchListSummary[player].matchesLost/matchListSummary[player].matchesPlayed);
    const matchesLost = players.map(player => 100*matchListSummary[player].matchesWon/matchListSummary[player].matchesPlayed);

    // Move the selected player to the top of the list and show the real percentage won/lost
    const selectedPlayer = document.getElementById('playerName').value;
    if (players.includes(selectedPlayer)) {
        const selectedPlayerIndex = players.indexOf(selectedPlayer);
        players.splice(selectedPlayerIndex, 1); // Remove the selected player
        players.unshift(selectedPlayer); // Add the selected player to the top
        matchesWon.splice(selectedPlayerIndex, 1);
        matchesLost.splice(selectedPlayerIndex, 1);
        matchesWon.unshift(matchListSummary[selectedPlayer].matchesWon / matchListSummary[selectedPlayer].matchesPlayed * 100);
        matchesLost.unshift(matchListSummary[selectedPlayer].matchesLost / matchListSummary[selectedPlayer].matchesPlayed * 100);
    }
    else {
        destroyRankingChart(selectedPlayer + " didn't play...");
        return;
    }

    setRememberedHiddenStates();
    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart if it doesn't exist
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Won',
                    hidden: hiddenStates[0],
                    data: matchesWon,
                    backgroundColor: wonBackColor,
                    borderColor: wonForeColor,
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[1],
                    data: matchesLost,
                    backgroundColor: lostBackColor,
                    borderColor: lostForeColor,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex;
                            if (rank === 0) {
                                return `${context[0].label}`;
                            }
                            return ` #${rank} Opponent ${context[0].label}`;
                        },
                        label: function(context) {
                            return [` ${selectedPlayer} ${context.dataset.label} ${context.raw.toFixed(1)}%`, ` of matches`];
                        }
                    }
                },
                legend: { position: 'bottom' },                
                annotation: {
                    annotations: {
                        fiftyPercentLine: {
                            type: 'line',
                            xMin: 50, // Y-axis value where the line starts
                            xMax: 50, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        playerValueLine: {
                            type: 'line',
                            xMin: matchesWon[0], // Y-axis value where the line starts
                            xMax: matchesWon[0], // Y-axis value where the line ends
                            borderColor: playerLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        }
                    }
                }                    
            },
            scales: {
                x: {
                    title: {
                        text: selectedPlayer + "'s % Matches Won/Lost" + getSelectedTimeInterval(),
                        display: true,
                    },
                    beginAtZero: true,
                    stacked: true,
                    position: 'top',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

// update the Player Info chart based on the Matches
function updatePlayerInfoMatchesChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => {
        const diff = matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed - matchListSummary[b].matchesWon/matchListSummary[b].matchesPlayed;
        if (diff !== 0 ) return diff;
        return matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed > 0.5 ? 
               matchListSummary[a].matchesWon - matchListSummary[b].matchesWon :
               matchListSummary[b].matchesLost - matchListSummary[a].matchesLost;
    });
    if (players.length < 1) return;

    // Calculate the percentage of matches won/lost for each player, note that it is seem from the opponents perspective
    const matchesWon = players.map(player => matchListSummary[player].matchesLost);
    const matchesLost = players.map(player => matchListSummary[player].matchesWon);

    // Move the selected player to the top of the list and show the real percentage won/lost
    const selectedPlayer = document.getElementById('playerName').value;
    if (players.includes(selectedPlayer)) {
        const selectedPlayerIndex = players.indexOf(selectedPlayer);
        players.splice(selectedPlayerIndex, 1); // Remove the selected player
        matchesWon.splice(selectedPlayerIndex, 1);
        matchesLost.splice(selectedPlayerIndex, 1);
    }
    else {
        destroyRankingChart(selectedPlayer + " didn't play...");
        return;
    }

    setRememberedHiddenStates();
    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart if it doesn't exist
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Won',
                    hidden: hiddenStates[0],
                    data: matchesWon,
                    backgroundColor: wonBackColor,
                    borderColor: wonForeColor,
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[1],
                    data: matchesLost,
                    backgroundColor: lostBackColor,
                    borderColor: lostForeColor,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} Opponent ${context[0].label}`;
                        },
                        label: function(context) {
                            const totalMatches = context.chart.data.datasets
                                .reduce((sum, ds) => sum + Number(ds.data[context.dataIndex] || 0), 0);
                            return [` ${selectedPlayer} ${context.dataset.label} ${context.raw}`, ` of ${totalMatches} matches`];
                        }
                    }
                },
                legend: { position: 'bottom' },
            },
            scales: {
                x: {
                    title: {
                        text: selectedPlayer + "'s Matches Won/Lost" + getSelectedTimeInterval(),
                        display: true,
                    },
                    beginAtZero: true,
                    stacked: true,
                    position: 'top',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

function wholeNumbersOnly(value) {
    return Number.isInteger(value) ? value.toLocaleString() : null;
}

setInterval(playRatingList, 200);

let remainingReplayTimes = 0;
function startPlayingRatingList() {
    remainingReplayTimes = document.getElementById('replayTimes').value;
}

function resetPlayingRatingList() {
    remainingReplayTimes = 0;
    rankingListSelectionManuallyChanged();
}

function playRatingList() {
    if (remainingReplayTimes > 0) {
        adjustExpectedRatingList(matchList);
        
        if (document.getElementById('rankingListSelection').value === 'ratingList') {
            createRatingListRankingList('rankingSummary', ratingSummary);
            updateRatingListChart(ratingSummary);
        }
        else if (document.getElementById('rankingListSelection').value === 'winningPercent') {
            createWinningPercentRankingList('rankingSummary', ratingSummary);
            updateWinningPercentChart(ratingSummary);
        }
        
        remainingReplayTimes--;
        document.getElementById('replayPlayButton').innerText = `▶︎ ${remainingReplayTimes}`;
    }
    else {
        document.getElementById('replayPlayButton').innerText = `▶︎`;
    }
}

// Function to create or update the Rating List chart
function updateRatingListChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');
    const yourName = document.getElementById('yourName').value.trim();

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => matchListSummary[b].futureRating - matchListSummary[a].futureRating);
    if (players.length < 1) return;
    const rating = players.map(player => Math.round(matchListSummary[player].rating));
    const futureRating = players.map(player => Math.round(matchListSummary[player].futureRating));
    
    // Only destroy and recreate the chart if the number of players changed
    if (remainingReplayTimes < 1 || manuallyChangedChart || !rankingChart || rankingChart.data.labels.length !== players.length) {
        setRememberedHiddenStates();
        destroyRankingChart('');
        optimizeChartCanvasHeight('rankingChartCanvas', players.length);
    }
    else if (rankingChart) {
        // Update data and labels if chart exists
        rankingChart.data.labels = players;
        rankingChart.data.datasets[0].data = rating;
        rankingChart.data.datasets[1].data = futureRating;

        const playerValue = Math.round(matchListSummary[yourName]?.futureRating);
        rankingChart.options.plugins.annotation.annotations.playerValueLine.xMin = playerValue;
        rankingChart.options.plugins.annotation.annotations.playerValueLine.xMax = playerValue;
        rankingChart.update();
        return;
    }

    const playerValue = Math.round(matchListSummary[yourName]?.futureRating);

    // Create the chart
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Current Rating',
                    type: 'scatter',
                    pointStyle: 'star',
                    hidden: hiddenStates[0],
                    data: rating,
                    borderColor: expectedColor,
                    pointHoverRadius: 18,
                    pointHitRadius: 24,
                    borderWidth: 1,
                },
                {
                    label: 'Future Rating',
                    hidden: hiddenStates[1],
                    data: futureRating,
                    backgroundColor: neutralBackColor,
                    borderColor: neutralForeColor,
                    borderWidth: 1,
                },
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            return ` ${context.dataset.label} ${context.raw.toLocaleString()} Elo`;
                        }
                    }
                },
                legend: { position: 'bottom' },
                annotation: {
                    annotations: {
                        startingEloLine: {
                            type: 'line',
                            xMin: 1800, // Y-axis value where the line starts
                            xMax: 1800, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        playerValueLine: {
                            type: 'line',
                            display: playerValue,
                            xMin: playerValue, // Y-axis value where the line starts
                            xMax: playerValue, // Y-axis value where the line ends
                            borderColor: playerLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        }
                    }
                }                    
            },
            scales: {
                x: {
                    title: {
                        text: 'Rating List Elo' + getSelectedTimeInterval(),
                        display: true,
                    },
                    beginAtZero: false,
                    position: 'top',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

// Create or update the Winning % chart
function updateWinningPercentChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');
    const yourName = document.getElementById('yourName').value.trim();

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => matchListSummary[b].expectedMatchesWon - matchListSummary[a].expectedMatchesWon);
    if (players.length < 1) return;
    const percentMatchesWon = players.map(player => matchListSummary[player].percentMatchesWon.toFixed(1));
    const expectedMatchesWon = players.map(player => matchListSummary[player].expectedMatchesWon.toFixed(1));

    // Only destroy and recreate the chart if the number of players changed
    if (remainingReplayTimes < 1 || manuallyChangedChart || !rankingChart || rankingChart.data.labels.length !== players.length) {
        setRememberedHiddenStates();
        destroyRankingChart('');
        optimizeChartCanvasHeight('rankingChartCanvas', players.length);
    }
    else if (rankingChart) {
        // Update data and labels if chart exists
        rankingChart.data.labels = players;
        rankingChart.data.datasets[0].data = percentMatchesWon;
        rankingChart.data.datasets[1].data = expectedMatchesWon;

        const playerValue = Math.round(matchListSummary[yourName]?.expectedMatchesWon);
        rankingChart.options.plugins.annotation.annotations.playerValueLine.xMin = playerValue;
        rankingChart.options.plugins.annotation.annotations.playerValueLine.xMax = playerValue;

        rankingChart.update();
        return;
    }

    const playerValue = Math.round(matchListSummary[yourName]?.expectedMatchesWon);

    // Create the chart
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: '% Matches Won',
                    data: percentMatchesWon,
                    type: 'scatter',
                    pointStyle: 'star',
                    hidden: hiddenStates[0],
                    borderColor: expectedColor,
                    pointHoverRadius: 18,
                    pointHitRadius: 24,
                    borderWidth: 1,
                },
                {
                    label: '% Expected to Win',
                    data: expectedMatchesWon,
                    hidden: hiddenStates[1],
                    backgroundColor: neutralBackColor,
                    borderColor: neutralForeColor,
                    borderWidth: 1,
                },
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            return ` ${context.raw} ${context.dataset.label}`;
                        }
                    }
                },
                legend: { position: 'bottom' },
                annotation: {
                    annotations: {
                        startingEloLine: {
                            type: 'line',
                            xMin: 50, // Y-axis value where the line starts
                            xMax: 50, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        playerValueLine: {
                            type: 'line',
                            display: playerValue,
                            xMin: playerValue, // Y-axis value where the line starts
                            xMax: playerValue, // Y-axis value where the line ends
                            borderColor: playerLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        }
                    }
                }                    
            },
            scales: {
                x: {
                    title: {
                        text: 'Match Winning %' + getSelectedTimeInterval(),
                        display: true,
                    },
                    min: 0,
                    max: 100,
                    beginAtZero: false,
                    position: 'top',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

function updatePlayerProgressChart(progressList) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // figure out the time span to display and the active players in that time span
    // the time span is defined by the selected option in the time span selection dropdown
    let timeSpanRegex = new RegExp (document.getElementById("timeSpanSelection").value);
    let foundTimeSpan = false;
    let lastMatchInTimeSpan = 1000;
    let firstMatchInTimeSpan = 0;
    let activePlayers = new Set(); 
    for (let i = progressList.length-1; i > 1; i--) {
        if (timeSpanRegex.test(progressList[i].date)) {
            if (!foundTimeSpan) {
                lastMatchInTimeSpan = progressList[i].match;
                foundTimeSpan = true;
            }
            activePlayers.add(progressList[i].player); 
        }
        else if (foundTimeSpan) {
            firstMatchInTimeSpan = progressList[i].match;
            break;
        }
    }

    // Group progress by player
    const playerProgress = {};
    progressList.forEach(entry => {
        if (!playerProgress[entry.player]) {
            playerProgress[entry.player] = [];
        }
        else {
            // add a NaN entry if the player didn't play for more than xxx days to create a gap in the chart
            const currentDate = new Date(entry.date);
            const previousEntry = playerProgress[entry.player][playerProgress[entry.player].length - 1];
            const previousDate = new Date(previousEntry.date);
            const differentDays = Math.abs(currentDate.getTime() - previousDate.getTime()) / 86400000;
            if (differentDays > 181) {
                playerProgress[entry.player].push({ matchNumber: entry.match, date: entry.date, rating: NaN });
            }
        }

        playerProgress[entry.player].push({ matchNumber: entry.match, date: entry.date, rating: entry.rating });
    });

    // Prepare datasets for Chart.js
    // Sort players by their last rating (highest first)
    const sortedPlayers = Object.keys(playerProgress).sort((a, b) => {
        const aLast = playerProgress[a][playerProgress[a].length - 1].rating;
        const bLast = playerProgress[b][playerProgress[b].length - 1].rating;
        return bLast - aLast;
    });

    // get your current player value
    const yourName = document.getElementById('yourName').value.trim();
    const playerValue = Math.round(playerProgress[yourName]?.[playerProgress[yourName].length-1].rating);

    // Only include datasets for players active in the selected time span
    const datasets = sortedPlayers
        .filter(player => activePlayers.has(player))
        .map((player, idx) => {
            let data = [];
            playerProgress[player].forEach(entry => {
                data.push({x: Number(entry.matchNumber), y: entry.rating});
            });

            // Assign a color (simple palette)
            const colors = [
                'rgba(255,0,0,1)',      // bright red
                'rgba(0,0,255,1)',      // bright blue
                'rgba(255,215,0,1)',    // gold
                'rgba(128,0,255,1)',    // vivid purple
                'rgba(255,140,0,1)',    // deep orange
                'rgba(0,255,0,1)',      // bright green
                'rgba(255,20,147,1)',   // deep pink
                'rgba(75,0,130,1)',     // indigo
                'rgba(0,0,200,1)',      // dark blue
                'rgba(255,69,0,1)',     // red-orange
                'rgba(139,0,0,1)',      // dark red
                'rgba(0,206,209,1)',    // dark turquoise
                'rgba(128,128,0,1)',    // olive
                'rgba(220,20,60,1)',    // crimson
                'rgba(0,128,0,1)',      // dark green
                'rgba(0,255,255,1)',    // cyan
                'rgba(255,255,0,1)'     // yellow
            ];
            const color = colors[idx % colors.length];

            // Rank starts at 1
            const rank = idx + 1;
            return {
                label: rank + " " + player,
                hidden: false,
                data: data,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.2)'),
                fill: false,
                spanGaps: false,
                tension: 0.2,
                pointRadius: 0,
                pointBorderWidth: 0,
                pointHoverRadius: 18,
                pointHitRadius: 24,
                hoverBorderWidth: 2,
                borderWidth: 1,
            };
        });

    const playerAnnotations = {};
    const activeSortedPlayers = sortedPlayers.filter(player => activePlayers.has(player));

    // create the annotations for the players who played in the last 14 days
    activeSortedPlayers.forEach((player, idx) => {
        const lastPlayedDate = playerProgress[player][playerProgress[player].length - 1].date;
        const daysSinceLastPlayed = Math.floor((new Date() - new Date(lastPlayedDate)) / (1000 * 60 * 60 * 24));
        if (daysSinceLastPlayed > 14) return;

        const lastRating = playerProgress[player][playerProgress[player].length - 1].rating;
        
        playerAnnotations[`player_${idx}`] = {
            type: 'label',
            xValue: lastMatchInTimeSpan + 2,
            yValue: lastRating + 5,
            position: 'start',
            content: [player],
            color: datasets[idx].borderColor,
            font: { size: 12 },
            padding: 2,
            borderRadius: 4
        };
    });

    destroyRankingChart('');
    document.getElementById('rankingChartCanvas').height = window.innerHeight * 0.6 + sortedPlayers.length * 10; // Adjust height based on number of players

    rankingChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return ` Current #${context[0].dataset.label}`;
                        },
                        label: function(context) {
                            const elo = context.parsed.y.toFixed(1);
                            const matchNumber = context.parsed.x;
                            const date = progressList.find(entry => entry.match === matchNumber)?.date || '';
                            return [` ${parseFloat(elo).toLocaleString()} Elo`, ` ${date}`];
                        }

                    }
                },
                legend: { position: 'bottom' },
                annotation: {
                    clip: false,
                    annotations: {
                        startingEloLine: {
                            type: 'line',
                            yMin: 1800, // Y-axis value where the line starts
                            yMax: 1800, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        playerValueLine: {
                            type: 'line',
                            display: playerValue,
                            yMin: playerValue, // Y-axis value where the line starts
                            yMax: playerValue, // Y-axis value where the line ends
                            borderColor: playerLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        ...playerAnnotations,
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        text: 'Player Progress - Match # - Elo' + getSelectedTimeInterval(),
                        display: true,
                    },
                    position: 'top',
                    type: 'linear',
                    min: firstMatchInTimeSpan,
                    max: lastMatchInTimeSpan,
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    grid: gridColor
                },
                y: {
                    position: 'right',
                    beginAtZero: false,
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    grid: gridColor
                },
            }
        }
    });
}

// apply a lens effect around 1800 so that the players are easier to read
function applyLens(x, center=1800, radius=100, X = 2.0) {
    const dist = Math.abs(x - center);
    if (dist >= radius) return x;
    
    // Calculate local magnification factor
    // This fades from X (at center) to 1.0 (at radius)
    const interpolation = 1 - (dist / radius);
    const currentMagnification = 1 + (X - 1) * interpolation;
    
    return center + (x - center) * currentMagnification;
}

// reverse the lens effect to get the original value from the transformed value
function reverseLens(y, center = 1800, radius = 100, X = 2.0) {
    const distY = Math.abs(y - center);
    
    // The maximum displacement the lens can produce is radius * X  // Modi: I don't think so
    // If it's outside this transformed range, it's outside the original radius
    if (distY > radius) return y;

    const sign = Math.sign(y - center);
    const k = X - 1;

    /**
     * Solving the quadratic: y = c + d * (1 + k * (1 - |d|/R))
     * For d > 0: y - c = d + kd - (k/R)d^2
     * (k/R)d^2 - (1+k)d + (y-c) = 0
     */
    const a = k / radius;
    const b = -(1 + k);

    // Use quadratic formula: d = (-b - sqrt(b^2 - 4ac)) / 2a
    // We subtract the discriminant because we need the solution within [0, radius]
    const d = (-b - Math.sqrt(b * b - 4 * a * distY)) / (2 * a);

    return center + (d * sign);
}

function reverseLensToAxis(value) {
    const axisValue = reverseLens(value);
    const formattedValue = axisValue.toLocaleString('en-US', { maximumFractionDigits: 0 })
    return formattedValue;
}

// Create or update the Player Progress chart
function updatePlayerPositionChart(progressList) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    const maximumSlots = 5;

    // figure out the time span to display and the active players in that time span
    // Group progress by player
    let timeSpanRegex = new RegExp (document.getElementById("timeSpanSelection").value);
    let foundTimeSpan = false;
    const playerProgress = {};
    for (let i = progressList.length-1; i > 1; i--) {
        if (timeSpanRegex.test(progressList[i].date)) {
            if (!foundTimeSpan) {
                foundTimeSpan = true;
            }
            if (!playerProgress[progressList[i].player]) {
                playerProgress[progressList[i].player] = [];
                playerProgress[progressList[i].player].push({ date: progressList[i].date, rating: progressList[i].rating });
            }
        }
        else if (foundTimeSpan) {
            break;
        }
    }

    // Sort players by their rating (highest first)
    const sortedPlayers = Object.keys(playerProgress).sort((a, b) => {
        return playerProgress[b][0].rating - playerProgress[a][0].rating;;
    });

    // put the players into slots so that they are distributed nicely
    let playerSlot = 1;
    let round = 1;
    let lastPlayerElo = 10000;
    let lastPlayer = '';
    let wasCenteredPlayer = false;
    sortedPlayers.forEach(player => {
        // shift the player a little to the left if there is another player following
        const currentPlayerElo = playerProgress[player][0].rating;
        if (Math.abs(currentPlayerElo - lastPlayerElo) > 5) {
            wasCenteredPlayer = true;
            playerSlot = 3;
            round = 1;
        }
        else if (wasCenteredPlayer) {
            playerSlot = 2;
            playerProgress[lastPlayer][0].slotNumber = playerSlot++ + 0.5 * (round%2);    
            wasCenteredPlayer = false;
        }
        lastPlayerElo = currentPlayerElo;
        lastPlayer = player;

        // just shift the player in sequence
        playerProgress[player][0].slotNumber = playerSlot++ + 0.5 * (round%2);
        if (playerSlot > maximumSlots) {
            playerSlot = 1;
            round++;
        }
    });

    // Only include datasets for players active in the selected time span
    const datasets = sortedPlayers
        .map((player, idx) => {
            let data = [];
            playerProgress[player].forEach(entry => {
                data.push({x: Number(entry.slotNumber) - 0.25, y: applyLens(entry.rating)});
            });

            // Assign a color (simple palette)
            const colors = [
                'rgba(255,0,0,1)',      // bright red
                'rgba(0,0,255,1)',      // bright blue
                'rgba(255,215,0,1)',    // gold
                'rgba(128,0,255,1)',    // vivid purple
                'rgba(255,140,0,1)',    // deep orange
                'rgba(0,255,0,1)',      // bright green
                'rgba(255,20,147,1)',   // deep pink
                'rgba(111,0,199,1)',     // indigo
                'rgba(0,0,222,1)',      // dark blue
                'rgba(255,69,0,1)',     // red-orange
                'rgba(139,0,0,1)',      // dark red
                'rgba(0,206,209,1)',    // dark turquoise
                'rgba(128,128,0,1)',    // olive
                'rgba(220,20,60,1)',    // crimson
                'rgba(0,128,0,1)',      // dark green
                'rgba(0,255,255,1)',    // cyan
                'rgba(255,255,0,1)'     // yellow
            ];
            const color = colors[idx % colors.length];

            // Rank starts at 1
            const rank = idx + 1;
            return {
                label: rank + " " + player,  // not used at the moment
                data: data,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.2)'),
                tension: 0.2,
                pointRadius: 0,
                pointBorderWidth: 1,
                pointHoverRadius: 2,
                pointHitRadius: 8,
                borderWidth: 1,
            };
        });

    const playerAnnotations = {};

    // create the annotations for the players who played in the last 14 days
    sortedPlayers.forEach((player, idx) => {
        // const lastPlayedDate = playerProgress[player][playerProgress[player].length - 1].date;
        // const daysSinceLastPlayed = Math.floor((new Date() - new Date(lastPlayedDate)) / (1000 * 60 * 60 * 24));
        // if (daysSinceLastPlayed > 60) return;

        const lastRating = applyLens(playerProgress[player][0].rating);
        
        playerAnnotations[`player_${idx}`] = {
            type: 'label',
            xValue: playerProgress[player][0].slotNumber - 0.25,
            yValue: lastRating,
            position: 'center',
            content: [player],
            color: datasets[idx].borderColor,
            font: { size: 12 },
        };
    });

    destroyRankingChart('');
    document.getElementById('rankingChartCanvas').height = window.innerHeight * 0.7;

    rankingChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return ` #${context[0].dataset.label}`;
                        },
                        label: function(context) {
                            const player = context.dataset.label.split(" ").slice(1).join(" ");
                            const elo = playerProgress[player][0].rating;
                            const date = playerProgress[player][0].date;
                            return [` ${parseFloat(elo).toLocaleString('en-US', { maximumFractionDigits: 1 })} Elo`, ` ${date}`];
                        }

                    }
                },
                legend: { display: false },
                annotation: {
                    clip: false,
                    annotations: {
                        startingEloLine: {
                            type: 'line',
                            yMin: 1800, // Y-axis value where the line starts
                            yMax: 1800, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        ...playerAnnotations,
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        text: 'Player Position - Elo' + getSelectedTimeInterval(),
                        display: true,
                    },
                    position: 'top',
                    type: 'linear',
                    min: 0.5,
                    max: maximumSlots + 0.5,
                    ticks: {
                        color: chartColor,
                        callback: function(value) {return null;}
                    },                            
                    grid: gridColor
                },
                y: {
                    position: 'right',
                    beginAtZero: false,
                    ticks: {
                        color: chartColor,
                        callback: reverseLensToAxis,
                    },                            
                    grid: gridColor
                },
            }
        }
    });
}



// Function to create or update the Scores chart
function updateScoresChart(scoresSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');
    const rankingListSelection = document.getElementById('rankingListSelection').value;
    const yourName = document.getElementById('yourName').value.trim();

    // Extract data for the chart
    let scoresChartTitle = '';
    let players;
    if (rankingListSelection === 'highScores') {
        scoresChartTitle = 'High Scores - Elo';
        players = Object.keys(scoresSummary).sort((a, b) => scoresSummary[b].highScore - scoresSummary[a].highScore);
    } else if (rankingListSelection === 'lowScores') {
        scoresChartTitle = 'Low Scores - Elo';
        players = Object.keys(scoresSummary).sort((a, b) => scoresSummary[a].lowScore - scoresSummary[b].lowScore);
    } else {
        scoresChartTitle = 'Current Scores - Elo';
        players = Object.keys(scoresSummary).sort((a, b) => scoresSummary[b].currentScore - scoresSummary[a].currentScore);
    }
    if (players.length < 1) return;

    const highScore = players.map(player => Math.round(scoresSummary[player].highScore));
    const currentScore = players.map(player => Math.round(scoresSummary[player].currentScore));
    const lowScore = players.map(player => Math.round(scoresSummary[player].lowScore));
    const playerValue = Math.round(scoresSummary[yourName]?.currentScore);

    // Only destroy and recreate the chart if the number of players changed
    if (remainingReplayTimes < 1 || manuallyChangedChart || !rankingChart || rankingChart.data.labels.length !== players.length) {
        setRememberedHiddenStates();
        destroyRankingChart('');
        optimizeChartCanvasHeight('rankingChartCanvas', players.length);
    }
    else if (rankingChart) {
        // Update data and labels if chart exists
        rankingChart.data.labels = players;
        rankingChart.data.datasets[0].data = highScore;
        rankingChart.data.datasets[1].data = currentScore;
        rankingChart.data.datasets[2].data = lowScore;
        rankingChart.update();
        return;
    }


    // Create the chart
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Low',
                    type: 'scatter',
                    pointStyle: 'star',
                    hidden: hiddenStates[2],
                    data: lowScore,
                    borderColor: lowColor,
                    pointHoverRadius: 18,
                    pointHitRadius: 24,
                    borderWidth: 1,
                },
                {
                    label: 'Current',
                    hidden: hiddenStates[1],
                    data: currentScore,
                    backgroundColor: neutralBackColor,
                    borderColor: neutralForeColor,
                    borderWidth: 1
                },
                {
                    label: 'High',
                    type: 'scatter',
                    pointStyle: 'star',
                    hidden: hiddenStates[0],
                    data: highScore,
                    borderColor: highColor,
                    pointHoverRadius: 18,
                    pointHitRadius: 24,
                    borderWidth: 1,
                },
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            return ` ${context.dataset.label} ${parseFloat(context.raw).toLocaleString()} Elo`;
                        }
                    }
                },
                legend: { position: 'bottom' },
                annotation: {
                    annotations: {
                        startingEloLine: {
                            type: 'line',
                            xMin: 1800, // Y-axis value where the line starts
                            xMax: 1800, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        playerValueLine: {
                            type: 'line',
                            display: playerValue,
                            xMin: playerValue, // Y-axis value where the line starts
                            xMax: playerValue, // Y-axis value where the line ends
                            borderColor: playerLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        }
                    }
                }                    
            },
            scales: {
                x: {
                    title: {
                        text: scoresChartTitle + getSelectedTimeInterval(),
                        display: true,
                    },
                    beginAtZero: false,
                    position: 'top',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        color: chartColor,
                        callback: wholeNumbersOnly,
                    },                            
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

// Function to create or update the Streak chart
function updateStreakChart(rankingSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');
    const yourName = document.getElementById('yourName').value.trim();

    // Extract data for the chart
    const rankingListSelection = document.getElementById('rankingListSelection').value;

    let players, streak, title, playerValue;
    
    if (rankingListSelection === 'currentStreak') {
        players = Object.keys(rankingSummary).sort((a, b) => rankingSummary[b].currentStreak - rankingSummary[a].currentStreak || rankingSummary[b].matchesPlayed - rankingSummary[a].matchesPlayed);
        streak = players.map(player => rankingSummary[player].currentStreak);
        playerValue = rankingSummary[yourName]?.currentStreak;
        title = "Current Streak";
    } 
    else if (rankingListSelection === 'longestWinningStreak') {
        players = Object.keys(rankingSummary).sort((a, b) => rankingSummary[b].longestWon - rankingSummary[a].longestWon || rankingSummary[a].matchesPlayed - rankingSummary[b].matchesPlayed);
        streak = players.map(player => rankingSummary[player].longestWon);
        playerValue = rankingSummary[yourName]?.longestWon;
        title = "Longest Winning Streak";
    } 
    else if (rankingListSelection === 'longestLosingStreak') {
        players = Object.keys(rankingSummary).sort((a, b) => rankingSummary[a].longestLost - rankingSummary[b].longestLost || rankingSummary[a].matchesPlayed - rankingSummary[b].matchesPlayed);
        streak = players.map(player => rankingSummary[player].longestLost);
        playerValue = rankingSummary[yourName]?.longestLost;
        setRememberedHiddenStates();
        title = "Longest Losing Streak";
    }
    else return;
    
    if (players.length < 1) return;

    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart
    const chartOptions = {
        indexAxis: 'y', // Set the chart to horizontal
        responsive: true,
        maintainAspectRatio: false, // Allow the chart to resize freely
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(context) {
                        const rank = context[0].dataIndex + 1;
                        return ` #${rank} ${context[0].label}`;
                    },
                    label: function(context) {
                        return `${context.dataset.label} ${context.raw}`;
                    }
                }
            },
            legend: { position: 'bottom' },
            annotation: {
                annotations: {
                    zeroLine: {
                        type: 'line',
                        xMin: 0, // Y-axis value where the line starts
                        xMax: 0, // Y-axis value where the line ends
                        borderColor: middleLineColor,
                        borderDash: [5, 5],
                        borderWidth: 2,
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    text: title + ' Matches' + getSelectedTimeInterval(),
                    display: true,
                },
                beginAtZero: true,
                position: 'top',
                ticks: {
                    color: chartColor,
                    callback: wholeNumbersOnly,
                },                            
                grid: gridColor,
            },
            x2: {
                position: 'bottom',
                ticks: {
                    color: chartColor,
                    callback: wholeNumbersOnly,
                },                            
                afterDataLimits(scale) {
                    const xScale = scale.chart.scales.x;
                    if (xScale) {
                        scale.min = xScale.min;
                        scale.max = xScale.max;
                    }
                }
            },
            y: {
                beginAtZero: true,
                ticks: { autoSkip: false } // show all the names
            }
        }
    };

    // Only add annotations if yourName is found in rankingSummary
    if (rankingSummary[yourName]) {
        chartOptions.plugins.annotation = {
            annotations: {
                zeroLine: {
                    type: 'line',
                    xMin: 0, // Y-axis value where the line starts
                    xMax: 0, // Y-axis value where the line ends
                    borderColor: middleLineColor,
                    borderDash: [5, 5],
                    borderWidth: 2,
                },
                playerValueLine: {
                    type: 'line',
                    xMin: playerValue, // Y-axis value where the line starts
                    xMax: playerValue, // Y-axis value where the line ends
                    borderColor: playerLineColor,
                    borderDash: [5, 5],
                    borderWidth: 2,
                }
            }
        };
    }

    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: title,
                    data: streak,
                    backgroundColor: function(context) {
                                        const value = context.raw; // Get the raw data value
                                        if (value > 0) return wonBackColor;
                                        else           return lostBackColor;
                                    },
                    borderColor: function(context) {
                                    const value = context.raw; // Get the raw data value
                                    if (value > 0) return wonForeColor;
                                    else           return lostForeColor;
                                },
                    borderWidth: 1
                },
            ]
        },
        options: chartOptions
    });
}

// Function to create or update the Last Active chart
function updateLastActiveChart(rankingSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(rankingSummary).sort((a, b) => new Date(rankingSummary[b].lastDateActive) - new Date(rankingSummary[a].lastDateActive));
    const lastDatesActive = players.map(player => new Date(rankingSummary[player].lastDateActive));
    
    if (players.length < 1) return;

    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart
    rankingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Last Active Date',
                    data: lastDatesActive,
                    backgroundColor: neutralBackColor,
                    borderColor: neutralForeColor,
                    pointHoverRadius: 18,
                    pointHitRadius: 24,
                    borderWidth: 1,
                },
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return ` #${rank} ${context.dataset.label} ${context.raw}`;
                    }
                }
            },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            const date = new Date(context.raw);
                            const today = new Date();
                            const diffTime = Math.abs(today - date);
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            const diffDaysString = diffDays === 0 ? 'today' : (diffDays === 1 ? '1 day ago' : `${diffDays} days ago`);
                            return [` ${diffDaysString}`, ` ${date.toISOString().split('T')[0]}`];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        text: 'Days Inactive - Date' + getSelectedTimeInterval(),
                        display: true,
                    },
                    position: 'top',
                    ticks: {
                        color: chartColor,
                        callback: function(value) {
                            return new Date(value).toISOString().split('T')[0];
                        }
                    },
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        color: chartColor,
                        callback: function(value) {
                            return new Date(value).toISOString().split('T')[0];
                        }
                    },
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

