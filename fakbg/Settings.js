// load the settings once the DOM is ready
document.addEventListener('DOMContentLoaded', loadSettings);

// Save settings to localStorage before the page is unloaded
window.addEventListener('beforeunload', saveSettings);

// load the toggle settings of a specific toggle element
function loadToggleSetting(elementName) {
    const toggleState = localStorage.getItem(elementName + 'State') || 'collapsed';
    const element = document.getElementById(elementName);
    toggleState === 'expanded' ? element.classList.add('show') : element.classList.remove('show');
}

function loadCheckedSetting(elementName, defaultValue) {
    const checked = localStorage.getItem(elementName) || defaultValue;
    document.getElementById(elementName).checked = checked === 'true';
}

function loadValueSetting(elementName, defaultValue) {
    document.getElementById(elementName).value = localStorage.getItem(elementName) || defaultValue;
}

// Load settings from localStorage
function loadSettings() {
    loadToggleSetting('matchReportForm');

    loadToggleSetting('tournamentManagement');
    loadToggleSetting('tournamentDirector');

    // Tournament Management
    loadCheckedSetting('showPastMatches', 'true');
    loadCheckedSetting('showFutureMatches', 'true');

    loadValueSetting('debugMode', '');
    loadValueSetting('tournamentType', 'Double Elimination');
    loadValueSetting('maximumTournamentPlayers', '7');
    loadValueSetting('matchLengths', '5 5 5 5 5');

    loadToggleSetting('ratingList');
    loadToggleSetting('rankingLists');

    // Ranking List Selection
    loadValueSetting('rankingListSelection', 'matchesPlayed');
    const rankingListSelection = document.getElementById('rankingListSelection').value;

    // Player Name Selection
    loadValueSetting('yourName', '');
    // Players List Selection (multi-select)
    // loaded after the Frequent Players have been fetched

    // Expand/Collapse the Player Name Selection depending on the Ranking List Selection
    const playerNameSelection = document.getElementById("playerNameSelection");
    playerNameSelection.style.display = rankingListSelection === "playerInfoPercent" || rankingListSelection === "playerInfoMatches" ? "flex" : "none";

    // Expand/Collapse the Replay section depending on the Ranking List Selection
    const replaySection = document.getElementById("replaySection");
    replaySection.style.display = rankingListSelection === "ratingList" || rankingListSelection === "winningPercent" ? "flex" : "none"; // Hide the element

    // Interval Selection
    loadValueSetting('intervalSelection', 'Daily');

    loadToggleSetting('rankingChart');
    loadToggleSetting('rankingSummary');
    loadToggleSetting('matchList');

    // Club Selection
    const clubSelectionElement = document.getElementById('clubSelection');
    let clubSelection = localStorage.getItem('clubSelection');
    if (clubSelection === null) {
        clubSelection = (clubSelectionElement && clubSelectionElement.options && clubSelectionElement.options.length > 0)
            ? clubSelectionElement.options[0].value
            : '';
    }
    clubSelectionElement.value = clubSelection;
    if (clubSelection === 'siambg-ranking-list') {
        document.getElementById('matchReportSection').style.display = 'none';
        document.getElementById('tournamentManagementSection').style.display = 'none';
    }

    // Theme Selection
    loadValueSetting('themeSelection', 'system-theme');
    themeSelectionChanged();
}

// save the settings of a toggle element to localStorage
function saveToggleSetting(elementName) {
    const matchReportFormCollapsed = document.getElementById(elementName).classList.contains('show') ? 'expanded' : 'collapsed';
    localStorage.setItem(elementName + 'State', matchReportFormCollapsed);
}

// save the value of a specific element to localStorage
function saveValueSetting(elementName) {
    const elementValue = document.getElementById(elementName).value;
    localStorage.setItem(elementName, elementValue);
}

// save the value of a specific element to localStorage
function saveCheckedSetting(elementName) {
    const checked = document.getElementById(elementName).checked;
    localStorage.setItem(elementName, checked);
}

// Save settings to localStorage
function saveSettings() {
    // Match Report Form
    saveToggleSetting('matchReportForm');

    // Tournament Management
    saveToggleSetting('tournamentManagement');
    saveToggleSetting('tournamentDirector');

    saveCheckedSetting('showPastMatches');
    saveCheckedSetting('showFutureMatches');

    saveValueSetting('debugMode');
    saveValueSetting('tournamentType');
    saveValueSetting('maximumTournamentPlayers')
    saveValueSetting('matchLengths');
    // Save selected players from multi-select with id 'playersList'
    const playersListEl = document.getElementById('playersList');
    if (playersListEl) {
        const selectedValues = Array.from(playersListEl.selectedOptions).map(opt => opt.value);
        localStorage.setItem('playersListSelection', JSON.stringify(selectedValues));
    }

    // Rating/Ranking List Selection
    saveToggleSetting('ratingList');
    saveToggleSetting('rankingLists');

    saveValueSetting('rankingListSelection');
    saveValueSetting('intervalSelection');

    saveToggleSetting('rankingChart');
    saveToggleSetting('rankingSummary');
    saveToggleSetting('matchList');

    // Settings
    saveValueSetting('yourName');
    saveValueSetting('clubSelection');
    saveValueSetting('themeSelection');
}