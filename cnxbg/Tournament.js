let tournamentGenerated = false;

let tournamentData = '';

function scrollToElement(element) {
    const targetElement = document.getElementById(element);

    targetElement.scrollIntoView({
        behavior: 'smooth', // Optional: for smooth scrolling animation
        block: 'start'      // Optional: aligns the element to the top of the viewport
    });
}

function generateTournament(selectedPlayers) {
    let tournamentType = document.getElementById('tournamentType').value;
    switch (tournamentType) {
        case 'Double Elimination':
            generateDoubleElimination(selectedPlayers);
            break;
        case 'Add Last Chance':
            generateSingleElimination(selectedPlayers, 'Last Chance');
            break;
        case 'Round Robin':
            generateRoundRobins(selectedPlayers);
            break;
        case 'Rigid Robin':
            generateRigidRobins(selectedPlayers);
            break;
        case 'Single Elimination':
            generateSingleElimination(selectedPlayers);
            break;
        case 'Siam Style':
            generateSiam(selectedPlayers);
            break;
        case 'Consulting Double':
            generateConsultingDouble(selectedPlayers);
            break;
        default:
            alert(tournamentType + ' tournament type is currently not supported!');
            return;
    }
    resolveByes();
    if (document.getElementById('debugMode').value === 'Fake' || document.getElementById('forfeitSubmittedMatches').checked === true) {
        highlightTodaysMatches(); // only add it again when debugging
        beautifyTournament();
    }
    else {
        beautifyTournament();
    }
    scrollToElement('tournamentManagementToggle');
}

function tournamentInfo() {
    const today = new Date().toISOString().slice(0, 10);
    const tournamentDirector = document.getElementById('yourName').value.trim() || 'Anonymous';
    return `<p id="today" style="text-align: center; color: gray;">${today} by ${tournamentDirector}</p>\n`;
}

function generateConsultingDouble(selectedPlayers) {
    const rounds = [];
    const players = fisherYatesShuffle(selectedPlayers);
    const length = document.getElementById('matchLengths').value.split(/\s+/)[0] || '5';
    if (players.length % 4 !== 0) {
        alert('Invalid number of players for Consulting Double!\nMust be a multiple of 4.');
        return;
    }

    const numTeams = players.length / 2;
    const teams = [];
    for (let i = 0; i < numTeams; i++) {
        teams.push(String.fromCharCode(65 + i)); // 65 is 'A' in ASCII
    }

    const numRounds = teams.length - 1;
    const half = teams.length / 2;

    for (let round = 0; round < numRounds; round++) {
        const matches = [];
        for (let i = 0; i < half; i++) {
            // get the team names
            const homeTeam = teams[i];
            const awayTeam = teams[teams.length - 1 - i];
            const homeTeamNumber = homeTeam.charCodeAt(0) - 65;
            const awayTeamNumber = awayTeam.charCodeAt(0) - 65;

            // get the player names
            const homeTeamPlayer1 = selectedPlayers[homeTeamNumber * 2];
            const homeTeamPlayer2 = selectedPlayers[homeTeamNumber * 2 + 1];
            const awayTeamPlayer1 = selectedPlayers[awayTeamNumber * 2];
            const awayTeamPlayer2 = selectedPlayers[awayTeamNumber * 2 + 1];
            
            // push the matches
            if (homeTeam !== 'Bye' && awayTeam !== 'Bye') {
                matches.push(`${homeTeamPlayer1} #${homeTeam}-${awayTeam}# ${awayTeamPlayer1}`);
                matches.push(`${homeTeamPlayer1} #${homeTeam}-${awayTeam}# ${awayTeamPlayer2}`);
                matches.push(`${homeTeamPlayer2} #${homeTeam}-${awayTeam}# ${awayTeamPlayer1}`);
                matches.push(`${homeTeamPlayer2} #${homeTeam}-${awayTeam}# ${awayTeamPlayer2}`);
            }
        }
        rounds.push(matches);
        // Rotate teams except the first one
        teams.splice(1, 0, teams.pop());
    }

    // generate the HTML for the tournament
    let html = `<h5>Consulting Double - ${length} points</h5>\n`;
    rounds.forEach((matches) => {
        html += `<p>\n`;
        matches.forEach(match => {
            html += `${match}<br>\n`;
        });
        html += `</p>\n`;
    });

    setTournamentData(html);
    tournamentGenerated = true;
}


function generateSingleElimination(selectedPlayers, lastChance = '') {
    const numPlayers = selectedPlayers.length;
    if (numPlayers < 3) {
        alert('Invalid number of players for Single Elimination!\nMust be at least 3.');
        return;
    }

    let html = lastChance === 'Last Chance' ? '\n' : tournamentInfo();

    const players = fisherYatesShuffle(selectedPlayers);

    // Ensure the number of participants is a power of 2
    const rounds = Math.ceil(Math.log2(players.length));
    const totalSlots = Math.pow(2, rounds);
    const byes = totalSlots - players.length;

    // Add "BYE" placeholders for empty slots
    for (let i = 0; i < byes; i++) {
        players.push("Bye");
    }
    const length = document.getElementById('matchLengths').value.split(/\s+/)[0] || '5';

    const name = lastChance === 'Last Chance' ? 'Last Chance' : 'Single Elimination';
    html += `<h5>${name} - ${length} points</h5>\n`;

    // populate the players in the first round
    let matchNumber = 101;
    let matchesPlayed = [];
    const half = players.length / 2;
    html += `<p>\n`;
    for (let i = 0; i < half; i++ ) {
        html += `${players[i]} # ${matchNumber} # ${players[players.length - 1 - i]}<br>\n`;
        matchesPlayed.push(matchNumber++);
    }
    html += `</p>\n`;

    // generate the rest of the rounds
    while ( matchesPlayed.length > 1 ) {
        let matchesPlayedLastRound = matchesPlayed;
        matchesPlayed = [];
        html += `<p>\n`;
        for (let i = 0; i < matchesPlayedLastRound.length; i += 2 ) {
            html += `~W${matchesPlayedLastRound[i]}~ _ ${matchNumber} _ ~W${matchesPlayedLastRound[i+1] || 'Bye'}~<br>\n`;
            matchesPlayed.push(matchNumber++);
        }
        html += `</p>\n`;
    }

    // fill in the players
    let i = 0;
    for ( ; i < numPlayers; i++ ) {
        html = html.replace(`~P${i + 1}~`, players[i]);
    }

    if (lastChance === 'Last Chance') {
        setTournamentData(tournamentData + html);
    } else {
        setTournamentData(html);
    }
    tournamentGenerated = true;
}

function beautifyTournament() {
    const showPastMatches = document.getElementById('showPastMatches').checked;
    const showFutureMatches = document.getElementById('showFutureMatches').checked;

    let tournamentHTML = '';
    if (!showPastMatches || !showFutureMatches) {
        let lines = tournamentData.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (!showPastMatches && lines[i].match(/(&lt;)|(&gt;)/)) ;
            else if (!showFutureMatches && lines[i].match(/~/)) ;
            else tournamentHTML += lines[i] + '\n';
        }
    }
    else {
        tournamentHTML = tournamentData;
    }

    // beautify the tournament
    if (tournamentHTML) {
        tournamentHTML = tournamentHTML.replace(/(&lt;)|(&gt;)/g, '🖤');
        tournamentHTML = tournamentHTML.replace(/_/g, '💤');
        tournamentHTML = tournamentHTML.replace(/#/g, '🎲');
        tournamentHTML = tournamentHTML.replace(/~W/g, '🥇');
        tournamentHTML = tournamentHTML.replace(/~L/g, '🥈');
        tournamentHTML = tournamentHTML.replace(/~/g, '');
    }

    tournamentHTML = highlightYourNameInTournament(tournamentHTML);
    const tournamentSummaryHTML = generateTournamentSummary();

    showTournament(tournamentHTML, tournamentSummaryHTML);
}

function showTournament(tournamentHTML, tournamentSummaryHTML) {
    if (!tournamentHTML) return;
    let lines = tournamentHTML.split('\n');

    // add tournament info
    let groupsHTML = lines[0] + '\n';

    // make the different groups/columns
    groupsHTML += '<div class="row text-center">\n';

    let group = 0;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].match(/(Round Robin)|(Siam Round)|(Main)|(Consolation)|(Last Chance)|(Single)/)) {
            if (group > 0) { // close previous group
                groupsHTML += `</div>\n</div>\n`;
            }
            group++;
            groupsHTML += `<div class="col-lg-4">\n<div id="group${group}" class="tournament">\n`;
        }
        groupsHTML += lines[i] + '\n';
    }
    groupsHTML += `</div>\n</div>\n`; // close last group 

    group++;
    groupsHTML += `<div class="col-lg-4">\n<div id="group${group}" class="tournament">${tournamentSummaryHTML}\n</div>\n</div>\n`;  // add the tournament summary

    groupsHTML += `</div>\n`;  // close the row

    document.getElementById('tournament').innerHTML = groupsHTML;
}

function setTournamentData(data) {
    tournamentData = data;
}

function generateDoubleElimination(selectedPlayers) {
    const numPlayers = selectedPlayers.length;
    if (numPlayers < 4 || numPlayers > 16) {
        alert('Invalid number of players for Double Elimination!\nMust be from 4 to 16 players.');
        return;
    }

    let html = tournamentInfo();

    if (numPlayers <= 8)
        html += make8PlayersDoubleElimination();
    else
        html += make16PlayersDoubleElimination();

    const players = fisherYatesShuffle(selectedPlayers);

    // fill in the players
    let i = 0;
    while (i < numPlayers) {
        html = html.replace(`~P${i + 1}~`, players[i]);
        i++;
    }

    // fill the rest with Byes
    const numPlayersAndByes = numPlayers <= 8 ? 8 : 16;
    while (i < numPlayersAndByes) {
        html = html.replace(`~P${i + 1}~`, 'Bye');
        i++;
    }

    setTournamentData(html);
    tournamentGenerated = true;
}

function generateSiamRound(startMatch, matchesPerRound, matchNumber) {
    let html = `<p>\n`;
    // Winner bracket matches
    for (let i = startMatch; i <= startMatch + matchesPerRound - 1; i += 2) {
        html += `~W${i}~ _ ${matchNumber++} _ ~W${i + 1}~<br>\n`;
    }
    // Loser bracket matches
    for (let i = startMatch; i <= startMatch + matchesPerRound - 1; i += 2) {
        html += `~L${i}~ _ ${matchNumber++} _ ~L${i + 1}~<br>\n`;
    }
    html += `</p>\n`;
    return { html, matchNumber };
}

function generateSiam(selectedPlayers) {
    const numPlayers = selectedPlayers.length;
    if (numPlayers < 3) {
        alert('Invalid number of players for Siam Style!\nMust be at least 3 players.');
        return;
    }

    let html = tournamentInfo();
    
    // sort the players according to their rating
    const sortedPlayers = selectedPlayers.sort((a, b) => playerRating[b]?.rating - playerRating[a]?.rating)

    // list the players
    html += `<p>${numPlayers}: `;
    sortedPlayers.forEach((player) => {
        if (typeof player === "string" && player.trim() !== "") {          // Ensure each item is a string
            html += player + ' ';
        }
    });
    html += '</p>\n';
    
    html += `<h5>Siam Style</h5>\n`;

    let reminder = 4 - numPlayers % 4;
    if (reminder === 4) reminder = 0;
    const numPlayersAndByes = numPlayers + reminder; // make it im multiple of 4
    const matchesPerRound = Math.round(numPlayersAndByes / 2);

    // Round 1 
    html += `<h5>Siam Rounds 1,2,3 - X points</h5>\n`;
    html += `<p>\n`;
    let matchNumber = 1;
    for (let i = 1; i <= matchesPerRound; i++) {
        html += `~P${i}~ # ${matchNumber++} # ~P${i + matchesPerRound}~<br>\n`;
    }
    html += `</p>\n`;

    // Generate Round 2
    const round2 = generateSiamRound(1, matchesPerRound, matchNumber);
    html += round2.html;

    // Generate Round 3
    const round3 = generateSiamRound(matchNumber, matchesPerRound, round2.matchNumber);
    html += round3.html;

    html += `<h5>Siam Round 4 - X points</h5>\n`;

    // Generate Round 4
    const round4 = generateSiamRound(round2.matchNumber, matchesPerRound, round3.matchNumber);
    html += round4.html;

    // Add the heading for additional matches
    html += `<h5>Siam Additional - X points</h5>\n`;

    // fill in the players
    let i = 1;
    while (i <= matchesPerRound) {
        html = html.replace(`~P${i}~`, sortedPlayers[i - 1] || 'Bye');
        html = html.replace(`~P${matchesPerRound + i}~`, sortedPlayers[matchesPerRound + i - 1] || 'Bye');
        i++;
    }

    setTournamentData(html);
    tournamentGenerated = true;
}

function getMatchLengths() {
    // read matchLengths input and create array of lengths (one per group)
    const matchLengthsInput = document.getElementById('matchLengths').value.trim();
    return matchLengthsInput ? matchLengthsInput.split(/\s+/).map(s => {
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : s;
    }) : [];
}

function generateRoundRobins(selectedPlayers) {
    let maximumPlayers = document.getElementById('maximumTournamentPlayers').value;
    if (isNaN(maximumPlayers) || maximumPlayers < 3) {
        alert('Invalid maximum players per group!\nNot a number or less than 3.');
        return;
    }

    let html = tournamentInfo();
    
    const players = fisherYatesShuffle(selectedPlayers);
    let tournamentPlayer = players.length;

    let groups = Math.floor(tournamentPlayer / maximumPlayers);
    if (groups * maximumPlayers < tournamentPlayer) groups += 1;

    let groupPlayers = Math.ceil(tournamentPlayer / groups);

    const matchLengths = getMatchLengths();

    let start = 0;
    let remainingPlayers = tournamentPlayer;
    let remainingGroups = groups;
    for (let group = 1; group < groups + 1; group++) {
        let end = start + groupPlayers;
        if (group === groups) end = tournamentPlayer + 1; 
        const idx = group - 1;
        const length = matchLengths[idx] !== undefined ? matchLengths[idx] : '';
        html += generateRoundRobinTournament(group, players.slice(start, end), length);

        start += groupPlayers;

        remainingPlayers -= groupPlayers;
        remainingGroups -= 1;
        groupPlayers = Math.ceil(remainingPlayers / remainingGroups);
    }

    setTournamentData(html);
    tournamentGenerated = true;
}

function generateRoundRobinTournament(groupName, selectedPlayers, length) {
    const rounds = [];
    const players = fisherYatesShuffle(selectedPlayers);
    if (players.length % 2 !== 0) {
        players.push('Bye');
    }
    const numRounds = players.length - 1;
    const half = players.length / 2;

    for (let round = 0; round < numRounds; round++) {
        const matches = [];
        for (let i = 0; i < half; i++) {
            const home = players[i];
            const away = players[players.length - 1 - i];
            if (home !== 'Bye' && away !== 'Bye') {
                matches.push(`${home} # - # ${away}`);
            }
        }
        rounds.push(matches);
        // Rotate players except the first one
        players.splice(1, 0, players.pop());
    }

    // generate the HTML for the tournament
    let html = `<h5>Round Robin ${groupName} - ${length} points</h5>\n`;
    rounds.forEach((matches) => {
        html += `<p>\n`;
        matches.forEach(match => {
            html += `${match}<br>\n`;
        });
        html += `</p>\n`;
    });

    return html;
}

function generateRigidRobins(selectedPlayers) {
    let maximumPlayers = document.getElementById('maximumTournamentPlayers').value;
    if (isNaN(maximumPlayers) || maximumPlayers < 3) {
        alert('Invalid maximum players per group!\nNot a number or less than 3.');
        return;
    }

    let html = tournamentInfo();
    
    const players = fisherYatesShuffle(selectedPlayers);
    let tournamentPlayer = players.length;

    let groups = Math.floor(tournamentPlayer / maximumPlayers);
    if (groups * maximumPlayers < tournamentPlayer) groups += 1;

    let groupPlayers = Math.ceil(tournamentPlayer / groups);

    const matchLengths = getMatchLengths();

    let start = 0;
    let remainingPlayers = tournamentPlayer;
    let remainingGroups = groups;
    for (let group = 1; group < groups + 1; group++) {
        let end = start + groupPlayers;
        if (group === groups) end = tournamentPlayer + 1; 
        const idx = group - 1;
        const length = matchLengths[idx] !== undefined ? matchLengths[idx] : '';
        html += generateRigidRobinTournament(group, players.slice(start, end), length);

        start += groupPlayers;

        remainingPlayers -= groupPlayers;
        remainingGroups -= 1;
        groupPlayers = Math.ceil(remainingPlayers / remainingGroups);
    }

    setTournamentData(html);
    tournamentGenerated = true;
}

function generateRigidRobinTournament(groupName, selectedPlayers, length) {
    const rounds = [];
    const players = fisherYatesShuffle(selectedPlayers);
    let haveBye = false;
    if (players.length % 2 !== 0) {
        players.push('Bye');
        haveBye = true;
    }
    const numRounds = players.length - 1;
    const half = players.length / 2;

    for (let round = 0; round < numRounds; round++) {
        const firstRound = round === 0; // sleeping or not, that's the question
        const matches = [];
        for (let i = 0; i < half; i++) {
            const home = players[i];
            const away = players[players.length - 1 - i];
            if (firstRound) {
                matches.push(`${home} # - # ${away}`);
            }
            else {
                const homePlayer = home === 'Bye' ? 'Bye' : haveBye ? `${home}` : `*${home}*`;  // tricky stuff to assign the first bye
                haveBye = false; // only assign the first bye, the rest should be treated as normal players
                const awayPlayer = away === 'Bye' ? 'Bye' : haveBye ? `${away}` : `*${away}*`;
                matches.push(`${homePlayer} _ - _ ${awayPlayer}`);
            }
        }
        rounds.push(matches);
        // Rotate players except the first one
        players.splice(1, 0, players.pop());
    }

    // generate the HTML for the tournament
    let html = `<h5>Round Robin ${groupName} - ${length} points</h5>\n`;
    rounds.forEach((matches) => {
        html += `<p>\n`;
        matches.forEach(match => {
            html += `${match}<br>\n`;
        });
        html += `</p>\n`;
    });

    return html;
}

function generateWinsSortedTable(winCounts, lossCounts, eloPoints) {
    // Convert to array and sort by wins descending
    const sorted = Object.entries(winCounts).sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return (eloPoints[b[0]] || 1800) - (eloPoints[a[0]] || 1800);
    });

    let ranking = [];
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
        const [name, wins] = sorted[i];
        // If not the first, and previous wins are same, keep the same rank
        if (i > 0 && sorted[i][1] === sorted[i - 1][1]) {
            ranking.push({ rank: currentRank, name, wins });
        } else {
            currentRank = i + 1;
            ranking.push({ rank: currentRank, name, wins });
        }
    }

    // Build the ranking table
    let rankingTable = '|#|Name|W|L|Elo|\n|:---:|:---:|:---:|:---:|:---:|\n';
    ranking.forEach(row => {
        rankingTable += `|${row.rank}|${row.name}|${row.wins}|${lossCounts[row.name]}|${Math.round(eloPoints[row.name] * 10) / 10}|\n`;
    });

    return highlightYourNameInTable(rankingTable);
}

function generateLossesSortedTable(winCounts, lossCounts, eloPoints) {
    // Convert to array and sort by losses ascending, then by wins descending
    const sorted = Object.entries(lossCounts)
        .sort((a, b) => {
            if (a[1] !== b[1]) return a[1] - b[1]; // Sort by losses ascending
            return (winCounts[b[0]] || 0) - (winCounts[a[0]] || 0); // Then by wins descending
        });

    let ranking = [];
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
        const [name, losses] = sorted[i];
        // If not the first, and previous wins are same, keep the same rank
        if (i > 0 && sorted[i][1] === sorted[i - 1][1]) {
            ranking.push({ rank: currentRank, name, losses });
        } else {
            currentRank = i + 1;
            ranking.push({ rank: currentRank, name, losses });
        }
    }

    // Build the ranking table
    let rankingTable = '|#|Name|L|W|Elo|\n|:---:|:---:|:---:|:---:|:---:|\n';
    ranking.forEach(row => {
        if (row.losses < 2) {
            rankingTable += `|${row.rank}|${row.name}|${row.losses}|${winCounts[row.name]}|${Math.round(eloPoints[row.name] * 10) / 10}|\n`;
        }
        else {
            rankingTable += `|${row.rank}|~${row.name}~|${row.losses}|${winCounts[row.name]}|${Math.round(eloPoints[row.name] * 10) / 10}|\n`;
        }
    });

    return rankingTable;
}

function generateEloSortedTable(winCounts, lossCounts, eloPoints) {
    // Merge players from both counts
    const players = Array.from(new Set([
        ...Object.keys(winCounts || {}),
        ...Object.keys(lossCounts || {})
    ]));

    // Build array with wins/losses and sort: wins desc, losses asc, name asc
    const rows = players.map(name => ({
        name,
        wins: winCounts[name] || 0,
        losses: lossCounts[name] || 0,
        elo: eloPoints[name] || initialRating
    })).sort((a, b) => {
        if (b.elo !== a.elo) return b.elo - a.elo;             // higher Elo first
        if (b.wins !== a.wins) return b.wins - a.wins;          // more wins first
        if (a.losses !== b.losses) return a.losses - b.losses;  // fewer losses first 
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    // Assign ranks (same rank for identical wins & losses)
    let ranking = [];
    let currentRank = 1;
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (i > 0 && (r.wins !== rows[i - 1].wins || r.losses !== rows[i - 1].losses)) {
            currentRank = i + 1;
        }
        ranking.push({ rank: currentRank, ...r });
    }

    // Build Markdown table
    let rankingTable = '|#|Name|W|L|%W|Elo|\n|:---:|:---:|:---:|:---:|:---:|:---:|\n';
    ranking.forEach(row => {
        const percentWon = Math.round((row.wins*1000)/(row.wins+row.losses))/10;
        rankingTable += `|${row.rank}|${row.name}|${row.wins}|${row.losses}|${percentWon}|${Math.round(row.elo * 10) / 10}|\n`;
    });

    return rankingTable;
}


function replayMatchesXTimes(times, playedMatches, eloPoints) {
    const elo = Object.assign({}, eloPoints || {});

    for (let t = 0; t < times; t++) {
        for (const rec of playedMatches) {
            if (!rec) continue;

            const match = rec.match(/^\s*(.+?)\s*<\s*(\d+)\s*>\s*(.+)\s*$/);
            if (match) {
                const matchLength = match[2].trim();
                const winner = match[1].trim();
                const loser = match[3].trim();

                // ignore Byes and update Elo points
                if (winner !== 'Bye' && loser !== 'Bye') {
                    elo[winner] = elo[winner] || initialRating;
                    elo[loser] = elo[loser] || initialRating;

                    const matchLengthRoot = Math.sqrt(matchLength);
                    const ratingPointsAtStake = 8 * matchLengthRoot;  // should be only 4
                    const winningProbability = 1.0 / (1.0 + Math.pow(10.0, -(elo[winner] - elo[loser]) * matchLengthRoot / 2000.0));
                    const ratingDifference = (1.0 - winningProbability) * ratingPointsAtStake;

                    elo[winner] += ratingDifference;
                    elo[loser] -= ratingDifference;
                }
            }
        }
    }

    return elo;
}


function generateTournamentSummary() {
    let tempDIV = document.createElement('div');
    tempDIV.innerHTML = tournamentData;
    const lines = tempDIV.innerText.split('\n');
    let winCounts = {};
    let lossCounts = {};
    let eloPoints = {};

    let playedMatches = [];

    let tournamentSummary = `\n`;
    
    let showWinsNext = false;
    let showLossesNext = false;
    let showEloNext = false;
    lines.forEach(line => {
        // generate the headings
        const siamTournament = line.match(/Siam Style/);
        if(siamTournament) {
            winCounts = {};
            lossCounts = {};
            eloPoints = {};
            playedMatches = [];
            showEloNext = true;
            tournamentSummary += `\n\n##### ${siamTournament[0]} Summary\n`;
        }

        const winsTournament = line.match(/(Single Elimination)|(Round Robin \d+)|(Consulting Double)|(Last Chance)/);
        if(winsTournament) {
            if (showWinsNext && Object.keys(winCounts).length > 0) {
                eloPoints = replayMatchesXTimes(13, playedMatches, eloPoints);
                tournamentSummary += generateWinsSortedTable(winCounts, lossCounts, eloPoints) + `\n\n`;
            }
            else if (showLossesNext && Object.keys(lossCounts).length > 0) {
                eloPoints = replayMatchesXTimes(13, playedMatches, eloPoints);
                tournamentSummary += generateLossesSortedTable(winCounts, lossCounts, eloPoints) + `\n\n`;
            }
            winCounts = {};
            lossCounts = {};
            eloPoints = {};
            playedMatches = [];
            showWinsNext = true;
            showLossesNext = false;
            tournamentSummary += `\n\n##### ${winsTournament[0]} Summary\n\n`;
        }
        const lossesTournament = line.match(/Double Elimination/);
        if(lossesTournament) {
            if (showWinsNext && Object.keys(winCounts).length > 0) {
                eloPoints = replayMatchesXTimes(13, playedMatches, eloPoints);
                tournamentSummary += generateWinsSortedTable(winCounts, lossCounts, eloPoints) + `\n\n`;
            }
            else if (showLossesNext && Object.keys(lossCounts).length > 0) {
                eloPoints = replayMatchesXTimes(13, playedMatches, eloPoints);
                tournamentSummary += generateLossesSortedTable(winCounts, lossCounts, eloPoints) + `\n\n`;
            }
            winCounts = {};
            lossCounts = {};
            eloPoints = {};
            playedMatches = [];
            showWinsNext = false;
            showLossesNext = true;
            tournamentSummary += `\n\n##### ${lossesTournament[0]} Summary\n`;
        }

        // count the wins and losses
        const match = line.match(/^\s*(.+?)\s*<\s*(\d+)\s*>\s*(.+)\s*$/);
        if (match) {
            playedMatches.push(line);

            const matchLength = match[2].trim();
            const winner = match[1].trim();
            const loser = match[3].trim();

            // ignore Byes and update Elo points
            if (winner !== 'Bye' && loser !== 'Bye') {
                // Initialize win/loss counts if not exist
                winCounts[winner] = winCounts[winner] || 0;
                winCounts[loser] = winCounts[loser] || 0;
                lossCounts[winner] = lossCounts[winner] || 0;
                lossCounts[loser] = lossCounts[loser] || 0;

                // Update win/loss counts
                winCounts[winner] = winCounts[winner] + 1;
                lossCounts[loser] = lossCounts[loser] + 1;

                // Initialize Elo points if not exists
                eloPoints[winner] = eloPoints[winner] || initialRating;
                eloPoints[loser] = eloPoints[loser] || initialRating;

                // Calculate Elo changes
                const matchLengthRoot = Math.sqrt(matchLength);
                const ratingPointsAtStake = 4 * matchLengthRoot;
                const winningProbability = 1.0 / (1.0 + Math.pow(10.0, -(eloPoints[winner] - eloPoints[loser] ) * matchLengthRoot / 2000.0));
                const ratingDifference = (1.0 - winningProbability) * ratingPointsAtStake;

                // Update Elo ratings
                eloPoints[winner] += ratingDifference;
                eloPoints[loser] -= ratingDifference;
            }
        }
    });

    // show the rest
    if (showEloNext) {
        eloPoints = replayMatchesXTimes(13, playedMatches, eloPoints);
        tournamentSummary += generateEloSortedTable(winCounts, lossCounts, eloPoints) + `\n</div>\n`;
    }
    if (showWinsNext && Object.keys(winCounts).length > 0) {
        eloPoints = replayMatchesXTimes(13, playedMatches, eloPoints);
        tournamentSummary += generateWinsSortedTable(winCounts, lossCounts, eloPoints) + `\n</div>\n`;
    }
    else if (showLossesNext && Object.keys(lossCounts).length > 0) {
        eloPoints = replayMatchesXTimes(13, playedMatches, eloPoints);
        tournamentSummary += generateLossesSortedTable(winCounts, lossCounts, eloPoints) + `\n</div>\n`;
    }

    return marked.parse(tournamentSummary);
}

let todaysMatches = [];

// Get today's matches
function highlightTodaysMatches() {
    const tournamentLines = tournamentData.split('\n');
    let siamAdditionalLine = -1;
    for (let i = 0; i < todaysMatches.length; i++) {
        if (todaysMatches[i].length > 0) {
            const matchInfo = todaysMatches[i].split('|');
            const winner = matchInfo[2];
            const loser = matchInfo[3];
            const matchLength = matchInfo[4];

            const roundRobinMatchRegex = new RegExp(`^(${winner}|${loser}) #.-.# (${winner}|${loser})<br>`, 'i');
            const doubleEliminationMatchRegex = new RegExp(`^(${winner}|${loser}) # (\\d+) # (${winner}|${loser})<br>`, 'i');

            // var foundAdditionalMatch = true;
            for (let j = 0; j < tournamentLines.length; j++) {
                if (tournamentLines[j][0] === '<') {
                    // check if the line matches Siam Additional
                    if (siamAdditionalLine === -1 && tournamentLines[j].match(/Siam Additional/)) {
                        siamAdditionalLine = j;
                    }
                    continue; // skip HTML tags - info and completed matches
                }
                
                if (tournamentLines[j].match(roundRobinMatchRegex)) { // Round/Rigid Robin match
                    tournamentLines[j] = tournamentLines[j].replace(
                        roundRobinMatchRegex,
                        `<span style="color: green;">${winner}</span> &lt; ${matchLength} &gt; <span style="color: red;">${loser}</span><br>`
                    );

                    // Replace Loser and Winner references in the rest of the tournament
                    const winnerRegex = new RegExp(`[*]${winner}[*]`);
                    const loserRegex = new RegExp(`[*]${loser}[*]`);
                    let foundWinner = false;
                    let foundLoser = false;
                    for (let k = 0; k < tournamentLines.length; k++) { 
                        if (!tournamentLines[k].includes("Bye") && tournamentLines[k][0] === '<') continue; // skip HTML tags - info and completed matches

                        if (!foundWinner && tournamentLines[k].match(winnerRegex)) {
                            if (!tournamentLines[k].match(`Bye`)) foundWinner = true; // only count it if it was not a Bye
                            tournamentLines[k] = tournamentLines[k].replace(winnerRegex, winner);
                        }
                        if (!foundLoser && tournamentLines[k].match(loserRegex)) {
                            if (!tournamentLines[k].match(`Bye`)) foundLoser = true; // only count it if it was not a Bye
                            tournamentLines[k] = tournamentLines[k].replace(loserRegex, loser);
                        }
                        if (!tournamentLines[k].includes("*")) { // replace future matches with current matches if there is no placeholder
                            tournamentLines[k] = tournamentLines[k].replace(/_/g, '#');
                        }

                        if (foundWinner && foundLoser) break;
                    }

                    break; // Exit the inner loop once a match is found and replaced
                }
                else if (tournamentLines[j].match(doubleEliminationMatchRegex)) { // Double Elimination match
                    const matchNumber = tournamentLines[j].match(doubleEliminationMatchRegex)[2]; // Get the match number

                    // Consider only the last played matches if we are in the Final round
                    if (j < tournamentLines.length - 5 || i > todaysMatches.length - 2) {
                        tournamentLines[j] = tournamentLines[j].replace(
                            doubleEliminationMatchRegex,
                            `<span style="color: green;">${winner}</span> &lt; ${matchLength} &gt; <span style="color: red;">${loser}</span><br>`
                        );
                    }

                    // Replace Loser and Winner references in the rest of the tournament
                    const winnerRegex = new RegExp(`~W${matchNumber}~`, 'g');
                    const loserRegex = new RegExp(`~L${matchNumber}~`, 'g');
                    for (let k = 0; k < tournamentLines.length; k++) { 
                        if (!tournamentLines[k].includes("Bye") && tournamentLines[k][0] === '<') continue; // skip HTML tags - info and completed matches
                        tournamentLines[k] = tournamentLines[k].replace(winnerRegex, winner);
                        tournamentLines[k] = tournamentLines[k].replace(loserRegex, loser);
                        if (!tournamentLines[k].includes("~")) { // replace future matches with current matches if there is no placeholder
                            tournamentLines[k] = tournamentLines[k].replace(/_/g, '#');
                        }
                    }

                    break; // Exit the inner loop once a match is found and replaced
                }
            }
        }
    }

    // figure out which additional matches have been played and add them to the tournament lines
    // very ugly implementation!!!
    if (siamAdditionalLine > -1) {
        tournamentLines.splice(siamAdditionalLine + 2);

        const today = new Date().toISOString().slice(0, 10);

        const playedMatches = [];
        for (let i = 0; i < tournamentLines.length; i++) {
            if (tournamentLines[i].startsWith('<span')) {
                let tempDIV = document.createElement('div');
                tempDIV.innerHTML = tournamentLines[i];
                const line = tempDIV.innerText;

                const match = line.match(/^\s*(.+?)\s*<\s*(\d+)\s*>\s*(.+)\s*$/);
                if (match) {
                    const matchLength = match[2].trim();
                    const winner = match[1].trim();
                    const loser = match[3].trim();

                    // ignore Byes and update Elo points
                    if (winner !== 'Bye' && loser !== 'Bye') {
                        playedMatches.push(`|${today}|${winner}|${loser}|${matchLength}|`);
                    }
                }
            }
        }

        const additionalMatches = todaysMatches;
        for(let i = 0; i < playedMatches.length; i++) {
            const index = additionalMatches.indexOf(playedMatches[i]); // Find the index of the value
            if (index !== -1) {
                additionalMatches.splice(index, 1); // Remove 1 element at that index
            }
        }
        for(let i = 0; i < additionalMatches.length; i++) {
            const matchInfo = additionalMatches[i].split('|');
            const winner = matchInfo[2];
            const loser = matchInfo[3];
            const matchLength = matchInfo[4];
            tournamentLines.push(`<span style="color: green;">${winner}</span> &lt; ${matchLength} &gt; <span style="color: red;">${loser}</span><br>\n`);
        }
    }

    tournamentData = tournamentLines.join('\n');
}

// Resolve the Byes in the tournament and update the tournament data accordingly
function resolveByes() {
    const tournamentType = document.getElementById('tournamentType').value;
    const isNotRigidRobin = tournamentType !== 'Rigid Robin';

    const tournamentLines = tournamentData.split('\n');
    // fix the Byes
    const doubleEliminationMatchRegex = new RegExp(`^(.+) [#_] ((\\d+)|-) [#_] (.+)<br>`, 'i');
    for (let j = 0; j < tournamentLines.length; j++) {
        if (tournamentLines[j].includes('Bye')) {
            const byeMatch = tournamentLines[j];
            if (tournamentLines[j].match(doubleEliminationMatchRegex)) {
                const playerA = tournamentLines[j].match(doubleEliminationMatchRegex)[1]; // Get player A
                const matchNumber = tournamentLines[j].match(doubleEliminationMatchRegex)[2]; // Get the match number
                let playerB = tournamentLines[j].match(doubleEliminationMatchRegex)[4]; // Get player B
                
                const winner = playerA === 'Bye' ? playerB : playerA;
                const loser = 'Bye';

                tournamentLines[j] = tournamentLines[j].replace(
                    doubleEliminationMatchRegex,
                    `<span style="color: gray;">${winner}</span> &lt; 0 &gt; <span style="color: gray;">${loser}</span><br>`
                );


                const winnerRegex = new RegExp(`~W${matchNumber}~`, 'g');
                const loserRegex = new RegExp(`~L${matchNumber}~`, 'g');
                for (let k = 0; k < tournamentLines.length; k++) { 
                    tournamentLines[k] = tournamentLines[k].replace(winnerRegex, winner);
                    tournamentLines[k] = tournamentLines[k].replace(loserRegex, loser);
                    if (isNotRigidRobin && !tournamentLines[k].includes("~")) { // replace future matches with current matches if there is no placeholder
                        tournamentLines[k] = tournamentLines[k].replace(/_/g, '#'); 
                        // ToDo not sure if it is needed at all
                    }
                }
            }
        }
    }

    setTournamentData(tournamentLines.join('\n'));
}

function make8PlayersDoubleElimination() {
    // get the match lengths
    const matchLengths = document.getElementById('matchLengths').value.split(/\s+/);
    const mainMatchLength = matchLengths[0] || '5';
    const consolationMatchLength = matchLengths[1] || mainMatchLength - 2;

    let html = `<h5>Double Elimination</h5>\n`;
    // Main Bracket
    html += `<h5>Main - ${mainMatchLength} points</h5>\n`;
    html += `<p>\n`;
    html += `~P1~ # 1 # ~P8~<br>\n`;
    html += `~P4~ # 2 # ~P5~<br>\n`;
    html += `~P3~ # 3 # ~P6~<br>\n`;
    html += `~P2~ # 4 # ~P7~<br>\n`;
    html += `</p><p>\n`;
    html += `~W1~ _ 7 _ ~W2~<br>\n`;
    html += `~W3~ _ 8 _ ~W4~<br>\n`;
    html += `</p><p>\n`;
    html += `~W7~ _ 11 _ ~W8~<br>\n`;
    html += `</p>\n`;
    // Consolation Bracket
    html += `<h5>Consolation - ${consolationMatchLength} points</h5>\n`;
    html += `<p>\n`;
    html += `~L1~ _ 5 _ ~L2~<br>\n`;
    html += `~L3~ _ 6 _ ~L4~<br>\n`;
    html += `</p><p>\n`;
    html += `~L8~ _ 9 _ ~W5~<br>\n`;
    html += `~L7~ _ 10 _ ~W6~<br>\n`;
    html += `</p><p>\n`;
    html += `~W9~ _ 12 _ ~W10~<br>\n`;
    html += `</p><p>\n`;
    html += `~L11~ _ 13 _ ~W12~<br>\n`;
    html += `</p>\n`;
    // Final
    html += `<h5>Final - ${mainMatchLength} points</h5>\n`;
    html += `<p>\n`;
    html += `~W11~ _ 14 _ ~W13~<br>\n`;
    html += `</p>\n`;

    return html;
}

function make16PlayersDoubleElimination() {
    // get the match lengths
    const matchLengths = document.getElementById('matchLengths').value.split(/\s+/);
    const mainMatchLength = matchLengths[0] || '5';
    const consolationMatchLength = matchLengths[1] || mainMatchLength - 2;

    let html = `<h5>Double Elimination</h5>\n`;
    // Main Bracket
    html += `<h5>Main - ${mainMatchLength} points</h5>\n`;
    html += `<p>\n`;
    html += `~P1~ # 1 # ~P16~<br>\n`;
    html += `~P8~ # 2 # ~P9~<br>\n`;
    html += `~P4~ # 3 # ~P13~<br>\n`;
    html += `~P12~ # 4 # ~P5~<br>\n`;
    html += `~P2~ # 5 # ~P15~<br>\n`;
    html += `~P10~ # 6 # ~P7~<br>\n`;
    html += `~P3~ # 7 # ~P14~<br>\n`;
    html += `~P11~ # 8 # ~P6~<br>\n`;
    html += `</p><p>\n`;
    html += `~W1~ _ 13 _ ~W2~<br>\n`;
    html += `~W3~ _ 14 _ ~W4~<br>\n`;
    html += `~W5~ _ 15 _ ~W6~<br>\n`;
    html += `~W7~ _ 16 _ ~W8~<br>\n`;
    html += `</p><p>\n`;
    html += `~W13~ _ 21 _ ~W14~<br>\n`;
    html += `~W15~ _ 22 _ ~W16~<br>\n`;
    html += `</p><p>\n`;
    html += `~W21~ _ 25 _ ~W22~<br>\n`;
    html += `</p>\n`;
    // Consolation Bracket
    html += `<h5>Consolation - ${consolationMatchLength} points</h5>\n`;
    html += `<p>\n`;
    html += `~L1~ _ 9 _ ~L2~<br>\n`;
    html += `~L3~ _ 10 _ ~L4~<br>\n`;
    html += `~L5~ _ 11 _ ~L6~<br>\n`;
    html += `~L7~ _ 12 _ ~L8~<br>\n`;
    html += `</p><p>\n`;
    html += `~L16~ _ 17 _ ~W9~<br>\n`;
    html += `~L15~ _ 18 _ ~W10~<br>\n`;
    html += `~L14~ _ 19 _ ~W11~<br>\n`;
    html += `~L13~ _ 20 _ ~W12~<br>\n`;
    html += `</p><p>\n`;
    html += `~W17~ _ 23 _ ~W18~<br>\n`;
    html += `~W19~ _ 24 _ ~W20~<br>\n`;
    html += `</p><p>\n`;
    html += `~L22~ _ 26 _ ~W23~<br>\n`;
    html += `~W24~ _ 27 _ ~L21~<br>\n`;
    html += `</p><p>\n`;
    html += `~W26~ _ 28 _ ~W27~<br>\n`;
    html += `</p><p>\n`;
    html += `~L27~ _ 29 _ ~W28~<br>\n`;
    html += `</p>\n`;
    // Final
    html += `<h5>Final - ${mainMatchLength} points</h5>\n`;
    html += `<p>\n`;
    html += `~W25~ _ 30 _ ~W29~<br>\n`;
    html += `</p>\n`;

    return html;
}



function extractFirstActiveMatchPlayers() {
    const tournamentLines = tournamentData.split('\n');
//    const combinedMatchRegex = /(\w+)\s*#\s*(?:-|\d+)\s*#\s*(\w+)/i;
//    const combinedMatchRegex = /(\w+)\s*#[ A-Za-z]*(?:-|\d+)[ A-Za-z]*#\s*(\w+)/i;
    const combinedMatchRegex = /^([^#]+)\s*#[ A-Z](?:-|\d+)[ A-Z]#\s*([^#]+)<br>/i; // don;t understand that one but it works better than the others for some reason, maybe because it captures the whole player name with spaces and special characters instead of just the first word?

    for (let line of tournamentLines) {
        if (line.match(combinedMatchRegex)) {
            const players = line.match(combinedMatchRegex);
            return { player1: players[1].trim(), player2: players[2].trim() };
        } 
    }
    return null; // No active matches found
}

let autoModeIntervalId = null;

function autoMode() {
    const btn = document.getElementById('autoModeButton');
    if (!btn) return;

    // periodic task executed every second while auto mode is active
    try {
        const activeMatch = extractFirstActiveMatchPlayers();

        if (!activeMatch) {
            // stop auto mode
            clearInterval(autoModeIntervalId);
            autoModeIntervalId = null;
            autoModeButton.dataset.autostate = 'off';
            autoModeButton.classList.remove('active');
        }

        if (activeMatch && activeMatch.player1 && activeMatch.player2) {
            const matchLength = document.getElementById('matchLengths').value.split(/\s+/)[0] || '5';

            // swap players randomly and let the luckiest bastard win
            if (generator.random() > 0.5) {
                const _tmp = activeMatch.player1;
                activeMatch.player1 = activeMatch.player2;
                activeMatch.player2 = _tmp;
            }
            const winnerName = activeMatch.player1;
            const loserName = activeMatch.player2;

            const datetime = new Date();
            const dateString = datetime.toISOString().split('T')[0];
            const autoMatch = `|${dateString}|${winnerName}|${loserName}|${matchLength}|`;

            setSubmissionStatus(`Auto ${autoMatch}`);
            matchRecords.push(autoMatch);

            getTodaysMatches(matchRecords);
            highlightTodaysMatches();
            beautifyTournament();
        }

        // initialize counter on first run
        if (!btn.dataset.counter) {
            btn.dataset.counter = '0';

            // observe the button so we can restore its label when auto mode is disabled
            const observer = new MutationObserver(() => {
                if (btn.dataset.autostate === 'off' || !btn.classList.contains('active')) {
                    btn.textContent = 'Fake';
                    delete btn.dataset.counter;
                    observer.disconnect();
                }
            });
            observer.observe(btn, {attributes: true, attributeFilter: ['data-autostate', 'class']});
        }

        // increment simple counter and update the button text
        const currentCounter = parseInt(btn.dataset.counter, 10);
        const count = Number.isFinite(currentCounter) ? Math.max(0, currentCounter) + 1 : 1;
        btn.dataset.counter = count.toString();
        btn.textContent = count.toString();
    } catch (err) {
        console.error('autoMode error:', err);
    }
}

const autoModeButton = document.getElementById('autoModeButton');
if (autoModeButton) {
    autoModeButton.addEventListener('click', () => {
        if (autoModeIntervalId === null) {
            // start auto mode: run once immediately and then every second
            autoMode();
            autoModeIntervalId = setInterval(autoMode, 1000);
            autoModeButton.dataset.autostate = 'on';
            autoModeButton.classList.add('active');
        } else {
            // stop auto mode
            clearInterval(autoModeIntervalId);
            autoModeIntervalId = null;
            autoModeButton.dataset.counter = '0';
            autoModeButton.dataset.autostate = 'off';
            autoModeButton.classList.remove('active');
        }
    });
}

// Start a new tournament after the Start button is clicked
document.getElementById('tournamentManagement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!tournamentGenerated) {
        alert('Generate the tournament first!\nWarning: Do that only if you are sure you want to overwrite the existing tournament!!!');
        return;
    }
    uploadTournament();
});

// Finish the tournament after Finish button is clicked
document.getElementById('finishTournamentButton').addEventListener('click', function () {
    if (tournamentGenerated) {
        alert('Cannot finish a generated tournament!');
        return;
    }
    uploadTournament();
});


let lastUploadTime = Date.now();

async function uploadTournament() {
    // prevent spamming GitHub
    if (Date.now() - lastUploadTime < 5000) {
        alert('Hold your horses you can only upload a tournament every 5 seconds! Check the Submission Status section above...');
        return;
    }
    lastUploadTime = Date.now();

    const repoName = document.getElementById('clubSelection').value;

    await refreshRunsStatus();
    setSubmissionStatus(`Uploading tournament...`);
    setRunsInfo('Hold on a sec...');
    previousRunID = latestRunID;
    if ( latestRunStatus === 'Submitting' || latestRunStatus === 'Queued' || latestRunStatus === 'In Progress') {
        setSubmissionStatus('Another submission in progress.\nTry again in a few seconds...');
        anotherSubmissionActive = true;
        document.getElementById("submit").disabled = true;
        document.getElementById("startTournamentButton").disabled = true;
        document.getElementById("finishTournamentButton").disabled = true;
    }
    else try {
        await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'text/html',
                'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({ 
                event_type: 'upload_tournament', 
                client_payload: { 
                    tournament_html: `${tournamentData}`,
                } 
            })
        });

        newSubmission = true;
        document.getElementById("submit").disabled = true;
        document.getElementById("startTournamentButton").disabled = true;
        document.getElementById("finishTournamentButton").disabled = true;
    } 
    catch (error) { 
        // Error triggering GitHub Action: Failed to execute 'json' on 'Response': Unexpected end of JSON input
        alert('Error uploading the tournament: ' + error.message); // Handle error (e.g., notify user, retry, etc.)
    }
}

// Fetch the last tournament
function fetchLastTournament() {
    const repoName = document.getElementById('clubSelection').value;
    if (repoName.includes('unitedbg')) return; // Not needed for the United Backgammon Merger

    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/Tournament.html?timestamp=${Date.now()}`;

    const options = {
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'text/html',
        }
    };

    fetch(url, options)
    .then(response => response.json())
    .then(data => {
        if (data.content) {
            const fileContent = decodeURIComponent(escape(window.atob( data.content )));
            setTournamentData(fileContent.replace(/\\n/g, '\n'));

            getTodaysMatches(matchRecords);
            highlightTodaysMatches();
            beautifyTournament();
        } else {
            console.log('Failed to fetch Last Tournament!');
        }
    })
    .catch(error => console.error('Error:', error));
}

function highlightYourNameInTournament(tournamentHTML) {
    const yourName = document.getElementById('yourName').value.trim();
    if (!yourName || yourName === '') {
        return tournamentHTML;
    }

    // Use regex to match yourName as a whole word, case-insensitive
    const regex = new RegExp(`\\b(${yourName})\\b`, 'gi');
    tournamentHTML = tournamentHTML.replace(
        regex,
        `<span style="background-color: blue;">${yourName}</span>`
    );
    return tournamentHTML;
}

// Get today's matches
function getTodaysMatches(matchRecords) {
    const today = new Date().toISOString().slice(0, 10);
    todaysMatches = [];
    for (let i = matchRecords.length-1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const matchDate = matchInfo[1];
            const matchLength = matchInfo[4];
            if (matchDate === today) {
                if (matchLength > 2) todaysMatches.push(matchRecords[i]); // try to get rid of short matches played before the tournament
            }
            else {
                break; // since the list is in reverse chronological order, we can stop once we reach a different date
            }
        }
    }
    todaysMatches.reverse(); // reverse to maintain original order
}

// Linear Congruential Generator (LCG) for pseudo-random number generation
class LCG {
    constructor(seed) {
        this.seed = seed;
        // Optimal parameters for a 32-bit LCG (from Numerical Recipes)
        this.m = Math.pow(2, 31); // Modulus
        this.a = 1103515245;      // Multiplier
        this.c = 12345;           // Increment
    }

    // Generates the next pseudo-random integer
    next() {
        this.seed = (this.a * this.seed + this.c) % this.m;
        return this.seed;
    }

    // Generates a pseudo-random float between 0 (inclusive) and 1 (exclusive)
    random() {
        return this.next() / this.m;
    }
}

const generator = new LCG(Date.now()); // Initialize with current time as seed

// Fisher-Yates Shuffle using the LCG
function fisherYatesShuffle(arr) {
    let n = arr.length;
    for (let i = n - 1; i > 0; i--) {
        let j = Math.floor(generator.random() * (i + 1)); // Random index from 0 to i
        [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
    return arr;
}
