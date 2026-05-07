// Display list and highlight your name in the list
function displayListWithHighlighting(elementName, listContent) {
    const highlightedContent = highlightYourNameInTable(listContent);
    document.getElementById(elementName).innerHTML = marked.parse(highlightedContent);
}

// Rating List
function createRatingListRankingList(summaryElement, rankingSummary) {
    let ratingListList = '|   |   |Rat|fRat|Matches|Result|\n|:---:|:---:|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    let totalMatchesPlayed = 0;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].futureRating - a[1].futureRating)) {
        const futureRating = Math.round(stats.futureRating);
        totalMatchesPlayed += stats.matchesPlayed;
        ratingListList += `|${rank++}|${player}|${stats.rating.toLocaleString()}|${futureRating.toLocaleString()}|${stats.matchesPlayed.toLocaleString()}|${stats.matchesWon.toLocaleString()} - ${stats.matchesLost.toLocaleString()}|\n`;    
    }   
    ratingListList += `||∑|||${(totalMatchesPlayed/2).toLocaleString()}||\n`;    

    displayListWithHighlighting(summaryElement, ratingListList);
}

// Winning %
function createWinningPercentRankingList(summaryElement, rankingSummary) {
    let ratingListList = '|   |   |% Won|% Exp|Matches|Result|\n|:---:|:---:|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    let totalMatchesPlayed = 0;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].percentMatchesWon - a[1].percentMatchesWon)) {
        totalMatchesPlayed += stats.matchesPlayed;
        ratingListList += `|${rank++}|${player}|${stats.percentMatchesWon}|${stats.expectedMatchesWon}|${stats.matchesPlayed.toLocaleString()}|${stats.matchesWon.toLocaleString()} - ${stats.matchesLost.toLocaleString()}|\n`;    
    }   
    ratingListList += `||∑|||${(totalMatchesPlayed/2).toLocaleString()}||\n`;    

    displayListWithHighlighting(summaryElement, ratingListList);
}

// Player Info
function createPlayerInfoList(summaryElement, playerSummary, vipPlayerName) {
    let opponentsList = '';
    let vipPlayer = '';
    const opponents = {};
    let vipPlayerMatchesPlayed = 0;

    const vipRating = playerRating[vipPlayerName].rating;
    const matchLengthRoot = Math.sqrt(Number(document.getElementById('matchLength').value));


    for (const [player, stats] of Object.entries(playerSummary).sort()) {
        if (player === vipPlayerName) {
            const winPercentage = Math.round(stats.matchesWon*1000/stats.matchesPlayed)/10;
            const winningProbability = Math.round(1000 * (1 / (1 + Math.pow(10, -(vipRating - initialRating) * matchLengthRoot / 2000))))/10;
            vipPlayerMatchesPlayed = stats.matchesPlayed;
            vipPlayer += `|${player}|${stats.matchesWon} - ${stats.matchesLost}|${winPercentage}|${winningProbability}|${playerRating[player].rating.toLocaleString()}|${stats.matchesPlayed.toLocaleString()}|\n`;    
        }
        else {
            opponents[player] = stats;
        }
    }   

    let opponentsRating = 0;
    for (const [player, stats] of Object.entries(opponents).sort((a,b) => {
        const diff = ((a[1].matchesWon/a[1].matchesPlayed)-(b[1].matchesWon/b[1].matchesPlayed));
        if (diff !== 0) return diff;
        return a[1].matchesWon/a[1].matchesPlayed > 0.5 ? a[1].matchesWon - b[1].matchesWon : b[1].matchesLost - a[1].matchesLost;
    })) {
        const winPercentage = Math.round(stats.matchesLost * 1000 / stats.matchesPlayed)/10;
        const winningProbability = Math.round(1000 * (1 / (1 + Math.pow(10, -(vipRating - playerRating[player].rating) * matchLengthRoot / 2000))))/10;
        opponentsRating += Number(playerRating[player].rating) * stats.matchesPlayed;
        opponentsList += `|${stats.matchesLost} - ${stats.matchesWon}|${player}|${winPercentage}|${winningProbability}|${playerRating[player].rating.toLocaleString()}|${stats.matchesPlayed}|\n`;
    }

    let playerInfoList = '|   |    |% Won|% Exp|Rat|Matches|\n|:---:|:---:|:---:|:---:|:---:|:---:|\n';
    playerInfoList += vipPlayer;
    playerInfoList += `|--------|--------|--------|------|-----|---------|\n`;
    playerInfoList += opponentsList;

    const opponentsMeanRating = Math.round(opponentsRating / vipPlayerMatchesPlayed);
    playerInfoList += `||x̄|||${opponentsMeanRating.toLocaleString()}||\n`;

    displayListWithHighlighting(summaryElement, playerInfoList);
}

// Percent Matches Won
function createPercentMatchesWonRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |% Won|% Exp|Matches|Result|\n|:---:|:---:|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    const matchLengthRoot = Math.sqrt(5); // Assuming a default match length of 5 for expected win percentage calculation
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => (b[1].matchesWon/b[1].matchesPlayed)-(a[1].matchesWon/a[1].matchesPlayed))) {
        const winPercentage = Math.round(stats.matchesWon*1000/stats.matchesPlayed)/10;
        const winningProbability = Math.round(1000 * (1 / (1 + Math.pow(10, -(playerRating[player].rating - 1800) * matchLengthRoot / 2000))))/10;
        rankingList += `|${rank++}|${player}|${winPercentage}|${winningProbability}|${stats.matchesPlayed}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }   
    
    displayListWithHighlighting(summaryElement, rankingList);
}

// Current Streak
function createCurrentStreakRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Current Streak|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].currentStreak-a[1].currentStreak || b[1].matchesPlayed-a[1].matchesPlayed)) {
        rankingList += `|${rank++}|${player}|${stats.currentStreak}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }   
    
    displayListWithHighlighting(summaryElement, rankingList);
}


// Longest Winning Streak
function createLongestWinningStreakRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Winning Streak|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].longestWon-a[1].longestWon || a[1].matchesPlayed-b[1].matchesPlayed)) {
        rankingList += `|${rank++}|${player}|${stats.longestWon}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }

    displayListWithHighlighting(summaryElement, rankingList);
}

// Longest Losing Streak
function createLongestLosingStreakRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Losing Streak|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => a[1].longestLost-b[1].longestLost || a[1].matchesPlayed-b[1].matchesPlayed)) {
        rankingList += `|${rank++}|${player}|${stats.longestLost}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }
    
    displayListWithHighlighting(summaryElement, rankingList);
}

// Matches Played
function createMatchesPlayedRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Matches|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    let totalMatchesPlayed = 0;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].matchesPlayed-a[1].matchesPlayed || b[1].matchesWon-a[1].matchesWon)) {
        totalMatchesPlayed += stats.matchesPlayed;
        rankingList += `|${rank++}|${player}|${stats.matchesPlayed}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }   
    rankingList += `||∑|${parseFloat(totalMatchesPlayed/2).toLocaleString()}||\n`;    

    displayListWithHighlighting(summaryElement, rankingList);
}

// Last Time Active Ranking List
function createLastTimeActiveRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Idle Days|Date|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => a[1].lastDateActive>b[1].lastDateActive ? -1 : 1)) {
        let today = new Date();
        let lastDateActive = new Date(stats.lastDateActive);
        let timeInMS = today.getTime() - lastDateActive.getTime();
        const inactiveDays = Math.ceil(timeInMS / (1000 * 60 * 60 * 24)) - 1;

        rankingList += `|${rank++}|${player}|${inactiveDays}|${stats.lastDateActive}|\n`;
    }   

    displayListWithHighlighting(summaryElement, rankingList);
}

// Rangliste Ranking List
function createRanglisteRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Punkte|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    let totalPunkte = 0;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].punkte-a[1].punkte)) {
        totalPunkte += stats.punkte;
        rankingList += `|${rank++}|${player}|${stats.punkte.toLocaleString()}|${stats.punkteMatchesWon} - ${stats.punkteMatchesLost}|\n`;
    }   
    rankingList += `||∑|${totalPunkte.toLocaleString()}||\n`;

    displayListWithHighlighting(summaryElement, rankingList);
}

// Rangliste Ranking List
function createPlayerProgressList(summaryElement, playerProgressList) {
    let progressList = '|#|Date|Player|Rating|\n|:---:|:---:|:---:|:---:|\n';
    let counter = 2;

    for (const entry of playerProgressList) {
        progressList += `|${Math.floor(counter/2)} ${counter%2?'L':'w'}|${entry.date}|${entry.player}|${Math.round(entry.rating)}|\n`;
        counter++;
    }

    displayListWithHighlighting(summaryElement, progressList);
}

// Scores List
function createScoresList(summaryElement, scoresSummary) {
    const rankingListSelection = document.getElementById('rankingListSelection').value;

    let rank = 1;
    let scoresList;

    if (rankingListSelection === 'highScores') {
        scoresList = '|   |   |High|Date|\n|:---:|:---:|:---:|:---:|\n';

        for (const [player, stats] of Object.entries(scoresSummary).sort((a,b) => b[1].highScore - a[1].highScore)) {
            scoresList += `|${rank++}|${player}|${Math.round(stats.highScore).toLocaleString()}|${stats.highScoreDate}|\n`;
        }
    } else {
        scoresList = '|   |   |Low|Date|\n|:---:|:---:|:---:|:---:|\n';

        for (const [player, stats] of Object.entries(scoresSummary).sort((a,b) => a[1].lowScore - b[1].lowScore)) {
            scoresList += `|${rank++}|${player}|${Math.round(stats.lowScore).toLocaleString()}|${stats.lowScoreDate}|\n`;
        }
    }

    displayListWithHighlighting(summaryElement, scoresList);
}