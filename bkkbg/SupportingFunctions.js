// Populate Time Span List
function populateTimeSpanSelectionList(matchRecords) {
    let interval = document.getElementById("intervalSelection").value;
    const weekday = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const intervalLengths = {"Daily":10, "Monthly":7, "Quarterly":7, "Yearly":4, "ET":0};
    const selectedIntervalLength = intervalLengths[interval];

    let matchDays = 0;
    let matchTimeSpanOptions = '';

    let lastMatchID = -1;
    let lastQuarter = -1;
    let timeSpanSuffix = '';
    let matchIdRegex = '';
    let timeSpanPrefix = '';
    for (let i = matchRecords.length-1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const matchDate = matchInfo[1];
            const matchID = matchDate.substring(0,selectedIntervalLength);
            if (matchID !== lastMatchID) {
                matchDays++;
                const datetime = new Date(matchDate);

                matchIdRegex = '^' + matchID;
                timeSpanPrefix = matchID;
                if (interval === "Daily") {
                    timeSpanSuffix = `${weekday[datetime.getDay()]}`;
                }
                else if (interval === "Monthly") {
                    timeSpanPrefix = matchID.substring(0,4); // just show the year
                    timeSpanSuffix = `${month[datetime.getMonth()]}`;
                }
                else if (interval === "Quarterly") {
                    let quarter = Math.floor(datetime.getMonth() / 3) + 1;
                    if (quarter === lastQuarter) continue;
                    lastQuarter = quarter;
                    timeSpanPrefix = matchID.substring(0,4); // just show the year
                    timeSpanSuffix = `Q${quarter}`;

                    // Extract year and quarter from the date string (yyyy-mm-dd)
                    switch (quarter) {
                        case 1: matchIdRegex = '^' + timeSpanPrefix + '-0[1-3]'; break;
                        case 2: matchIdRegex = '^' + timeSpanPrefix + '-0[4-6]'; break;
                        case 3: matchIdRegex = '^' + timeSpanPrefix + '-0[7-9]'; break;
                        case 4: matchIdRegex = '^' + timeSpanPrefix + '-1[0-2]'; break;
                    }
                }
                matchTimeSpanOptions += `<option class="centered" value="${matchIdRegex}">${timeSpanPrefix} ${timeSpanSuffix}</option>\n`;
            }
            lastMatchID = matchID;
        }
    }
    document.getElementById("timeSpanSelection").innerHTML = matchTimeSpanOptions;

    return matchDays;
}

function populateClubSelection() {
    let clubRepoOptions = '';
    clubRepos.forEach(club => {
        clubRepoOptions += `<option class="centered" value="${club.repo}">${club.name}</option>\n`;
    });
    document.getElementById('clubSelection').innerHTML = clubRepoOptions;
}

function selectDefaultPlayer() {
    const yourName = document.getElementById('yourName').value;
    if (yourName) {
        const playerOptions = document.getElementById("playerName").options;
        for (let i = 0; i < playerOptions.length; i++) {
            if (playerOptions[i].value === yourName) {
                playerOptions[i].selected = true;
                break;
            }
        }
        const rankingListSelection = document.getElementById('rankingListSelection').value;
        if ( rankingListSelection === 'playerInfoPercent' || rankingListSelection === 'playerInfoMatches') {
            playerSelectionChanged();
        }
    }
}

function highlightYourNameInTable(tableHTML) {
    const yourName = document.getElementById('yourName').value.trim();
    if (!yourName || yourName === '') {
        return tableHTML;
    }

    // Use regex to match yourName as a whole word, case-insensitive
    const regex = new RegExp(`\\b(${yourName})\\b`, 'gi');
    tableHTML = tableHTML.replace(
        regex,
        `<span style="color: yellow;"><b>${yourName}</b></span>`
    );
    return tableHTML;
}

// Fetch the Frequent Players
function fetchFrequentPlayers() {
    const repoName = document.getElementById('clubSelection').value;
    if (repoName === 'siambg-ranking-list') return; // Not needed for the Siam Backgammon Merger

    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/FrequentPlayers.md?timestamp=${Date.now()}`;

    const options = {
        headers: {
            'Authorization': `token ${githubToken}`
        }
    };

    fetch(url, options)
    .then(response => response.json())
    .then(data => {
        if (data.content) {
            const fileContent = decodeURIComponent(escape(window.atob( data.content )));

            const frequentPlayers = fileContent.split("\n");
            let playersList = '';

            for (let i = 0; i < frequentPlayers.length; i++) {
                if (frequentPlayers[i].length > 0) {
                    playersList += `<option class="centered" value="${frequentPlayers[i]}">${frequentPlayers[i]}</option>\n`;
                }
            }
            const playerOptions = '<option class="centered" value="Select">Select</option>\n' + playersList;

            document.getElementById("winnerName").innerHTML = playerOptions;
            document.getElementById("loserName").innerHTML = playerOptions;

            document.getElementById("playerName").innerHTML = playerOptions;
            selectDefaultPlayer();

            document.getElementById("playersList").innerHTML = playersList;
            const playersListEl = document.getElementById('playersList');   
            if (playersListEl) {
                const playersListSelection = JSON.parse(localStorage.getItem('playersListSelection') || '[]');
                for (let option of playersListEl.options) {
                    option.selected = playersListSelection.includes(option.value);
                }
                const selected = playersListEl.selectedOptions.length;
                const document_style = document.documentElement.style;
                if (selected > 0)
                    document_style.setProperty('--text', "'" + selected + " Players Selected...'");
                else
                    document_style.setProperty('--text', "'Select Players...'");

            }

        } else {
            console.log('Failed to fetch Frequent Players!');
        }
    })
    .catch(error => console.error('Error:', error));
}

// Synchronously fetch the RatingList Markdown file and return its content
function fetchMarkDownFromRepoSync(fileName, elementName) {
    const repoName = document.getElementById('clubSelection').value;
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}.md?timestamp=${Date.now()}`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); // false for synchronous request
    xhr.setRequestHeader('Authorization', `token ${githubToken}`);
    xhr.setRequestHeader('Content-Type', 'text/markdown');
    xhr.send(null);

    if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.content) {
            const fileContent = decodeURIComponent(escape(window.atob(data.content)));
            const element = document.getElementById(elementName);
            if (element) {
                element.innerHTML = marked.parse(highlightYourNameInTable(fileContent));
            }
            return fileContent;
        }
    }
    console.log(`Failed to fetch file ${fileName}.md!`);
    return '';
}

// Fetch a Markdown file from the repository
function fetchMarkDownFromRepo(fileName, elementName) {
    const repoName = document.getElementById('clubSelection').value;
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}.md?timestamp=${Date.now()}`;

    const options = {
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'text/markdown',
        }
    };

    fetch(url, options)
    .then(response => response.json())
    .then(data => {
        if (data.content) {
            const fileContent = decodeURIComponent(escape(window.atob( data.content )));
            const element = document.getElementById(elementName);
            if (element) {
                element.innerHTML = marked.parse(fileContent);
            }
            return fileContent;
        } else {
            console.log(`Failed to fetch file ${fileName}.md!`);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Refresh the Backgammon Club Title
function refreshWebPageTitle () {
    const sel = document.getElementById('clubSelection');
    document.getElementById('webPageTitle').innerText = sel.options[sel.selectedIndex].text;
    document.title = sel.options[sel.selectedIndex].text;
}

// Fetch the Match List
function fetchMatchList() {
    const repoName = document.getElementById('clubSelection').value;
    if (repoName === 'siambg-ranking-list') {
        fetchAllMatchLists();
        return; 
    }

    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/MatchList.md?timestamp=${Date.now()}`;

    const options = {
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'text/markdown',
        }
    };

    fetch(url, options)
    .then(response => response.json())
    .then(data => {
        if (data.content) {
            totalMatchList = decodeURIComponent(escape(window.atob( data.content )));

            matchRecords = totalMatchList.split("\n");
            
            fetchLastTournament();
            if (populateTimeSpanSelectionList(matchRecords) > 0) {
                if(populatePlayedTimeSpanMatchList()) {
                    rankingListSelectionChanged();
                }
            }
        } else {
            console.log('Failed to fetch Match List!');
        }
    })
    .catch(error => console.error('Error:', error));
}

// Fetch the All Match List
function fetchAllMatchLists() {
    const doublePlayersList = fetchMarkDownFromRepoSync('DoublePlayers');

    const repoNames = clubRepos.map(club => club.repo);

    // add the header for the match list
    matchRecords = ["|Date|Winner|Loser|Points|"];
    matchRecords.push("|---|---|---|---|");

    totalMatchList = ""; // reset totalMatchList before fetching

    Promise.all(repoNames.filter(repoName => repoName !== 'siambg-ranking-list').map(repoName => {
        // filter out the Siam Backgammon repo
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/MatchList.md?timestamp=${Date.now()}`;
        return fetch(url, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'text/markdown',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.content) {
                const matchList = decodeURIComponent(escape(window.atob(data.content)));

                // prepare the replacement map and regex for the player names
                const suffix = repoName.substring(0, 3);

                // add a suffix to all double players                
                const doublePlayersMap = {};
                doublePlayersList.split('\n').forEach(name => {
                    const trimmedName = name.trim();
                    if (trimmedName) {
                        doublePlayersMap[trimmedName] = `${trimmedName} ${suffix}`;
                    }
                });

                const regex = new RegExp(`^(${Object.keys(doublePlayersMap).join('|')})$`);

                const modifiedLines = matchList.split("\n").slice(2).map(line => {
                    if (line.length > 0) {
                        const parts = line.split('|');
                        parts[2] = parts[2].replace(regex, match => doublePlayersMap[match]);
                        parts[3] = parts[3].replace(regex, match => doublePlayersMap[match]);
                        return parts.join('|');
                    }
                    return line;
                });
                return modifiedLines;  // Remove the first two lines before splitting
            }
            return [];
        })
        .catch(() => []);
    })).then(results => {

        // Flatten the results, sort descending by date, then push them
        const flatResults = results.flat();
        flatResults.sort((a, b) => {
            const dateA = a.split('|')[1] || '';
            const dateB = b.split('|')[1] || '';
            return dateA.localeCompare(dateB);
        });
        matchRecords.push(...flatResults);

        totalMatchList = matchRecords.join("\n");

        calculatePlayerRating(matchRecords); // calculate the current player ratings based on the match records
        setPlayerListFromPlayerRating();
        generateRatingListFromPlayerRating();
        
        // You can now use allMatchRecords as needed
        if (populateTimeSpanSelectionList(matchRecords) > 0) {
            if(populatePlayedTimeSpanMatchList()) {
                rankingListSelectionChanged();
            }
        }
    });
}

function generateRatingListFromPlayerRating() {
    let ratingList = '| |Name|Rating|+/-|Exp|\n|-|:---|:----:|:-:|--:|\n';

    const players = Object.keys(playerRating).sort((a, b) => playerRating[b].rating - playerRating[a].rating);

    for (let i = 0; i < players.length; i++) {
        if (players[i].length > 0) {
            let difference = playerRating[players[i]].difference;
            if (difference > 0) difference = '+' + difference; // add a plus sign for positive differences
            ratingList += `|${i + 1}|${players[i]}|${Math.round(playerRating[players[i]].rating)}|${difference}|${playerRating[players[i]].experience}|\n`;
        }
    }
 
    displayListWithHighlighting('ratingList', ratingList);
}


// Set the Player Name Selection List based on the players in the player ranking list, sorted alphabetically
function setPlayerListFromPlayerRating() {
    const frequentPlayers = Object.keys(playerRating).sort((a, b) => a.localeCompare(b));
    let playersList = '';

    for (let i = 0; i < frequentPlayers.length; i++) {
        if (frequentPlayers[i].length > 0) {
            playersList += `<option class="centered" value="${frequentPlayers[i]}">${frequentPlayers[i]}</option>\n`;
        }
    }
    const playerOptions = '<option class="centered" value="Select">Select</option>\n' + playersList;

    document.getElementById("playerName").innerHTML = playerOptions;
    selectDefaultPlayer();
}

// Calculate the Player Rating
function calculatePlayerRating(matchRecords) {
    // reset playerRating before calculating
    Object.keys(playerRating).forEach(key => delete playerRating[key]);

    // Start from the third line (skip headers), process in chronological order
    for (let i = 2; i < matchRecords.length; i++) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const winner = matchInfo[2];
            const loser = matchInfo[3];
            const matchLength = Number(matchInfo[4]);

            // Initialize ratings if not present
            if (!playerRating[winner]) playerRating[winner] = { rating: initialRating, difference: 0, experience: 0 };
            if (!playerRating[loser]) playerRating[loser] = { rating: initialRating, difference: 0, experience: 0 };

            const matchLengthRoot = Math.sqrt(matchLength);
            const ratingPointsAtStake = 4 * matchLengthRoot;
            const winningProbability = 1.0 / (1.0 + Math.pow(10.0, -(playerRating[winner].rating - playerRating[loser].rating) * matchLengthRoot / 2000.0));
            const ratingDifference = (1.0 - winningProbability) * ratingPointsAtStake;

            // Update ratings
            playerRating[winner].rating += ratingDifference;
            playerRating[winner].difference = ratingDifference;
            playerRating[winner].experience += matchLength;
            playerRating[loser].rating -= ratingDifference;
            playerRating[loser].difference = -ratingDifference;
            playerRating[loser].experience += matchLength;
        }
    }
    // Round ratings and differences
    for (let player in playerRating) {
        playerRating[player].rating = Math.round(playerRating[player].rating);
        playerRating[player].difference = Math.round(playerRating[player].difference * 10) / 10;
    }
}

//* Theme Handling

// Theme Selection Changed
function themeSelectionChanged() {
    let theme = document.getElementById('themeSelection').value;

    if (theme === 'system-theme') { // Check the system theme
        const isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches;
        if (isLightMode) theme = 'light-theme';
        else theme = 'dark-theme';
    }
    document.body.classList.toggle('light-theme', theme === 'light-theme');
}

