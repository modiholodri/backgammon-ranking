// Populate the Played Time Span List
function populatePlayedTimeSpanMatchList() {
    if (matchRecords.length === 0) return false;

    const timeSpanRegex = new RegExp(document.getElementById("timeSpanSelection").value);
    let gotMatches = false;
    let gotRanglistenMatches = false;

    // global variable, do not add let
    matchList = matchRecords[0] + '\n' + matchRecords[1] + '\n'; // add the table header
    ranglistenMatchList = matchRecords[0] + '\n' + matchRecords[1] + '\n'; // add the table header

    for (let i = matchRecords.length - 1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const matchDate = matchInfo[1];
            if (timeSpanRegex.test(matchDate)) {
                matchList += `${matchRecords[i]}\n`;
                gotMatches = true
                const datetime = new Date(matchDate);
                const isTournamentDay = datetime.getDay() === tournamentDay;
                if (isTournamentDay) {
                    ranglistenMatchList += `${matchRecords[i]}\n`;
                    gotRanglistenMatches = true;
                }
            } else if (gotMatches) break;
        }
    }

    rankingSummary = summarizeMatchList(matchList);
    if(gotRanglistenMatches) {
        ranglistenSummary = summarizeMatchList(ranglistenMatchList);
    }
    else {
        ranglistenSummary = {};
    }
    
    return true;
}

// Populate the Player Match List
function populatePlayerMatchList() {
    if (matchRecords.length === 0) return;

    let playerName = document.getElementById('playerName').value;
    if (playerName === 'Select or Edit') {
        document.getElementById('rankingSummary').innerHTML = '';
        document.getElementById('matchList').innerHTML = '';
        return;
    }

    const timeSpanRegex = new RegExp(document.getElementById("timeSpanSelection").value);

    let matchesPlayed = 0;
    let playerMatchList = matchRecords[0] + '\n' + matchRecords[1] + '\n'; // add the table header
    for (let i = matchRecords.length-1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const matchDate = matchInfo[1];
            if (timeSpanRegex.test(matchDate)) {
                const winnerName = matchInfo[2];
                const loserName = matchInfo[3];
                if (winnerName === playerName || loserName === playerName) {
                    matchesPlayed++;
                    playerMatchList += `${matchRecords[i]}\n`;
                }
            }
        }
    }

    if (matchesPlayed > 0 ) {
        playerSummary = summarizeMatchList(playerMatchList);
        createPlayerInfoList('rankingSummary', playerSummary, playerName);
        document.getElementById('matchList').innerHTML = marked.parse(playerMatchList);
    }
    else {
        document.getElementById('rankingSummary').innerHTML = `<div><p class="centered">${playerName} didn't play...</p></div>`;
        document.getElementById('matchList').innerHTML = '';
    }
}

// Summarize the Match List
function summarizeRatingList(matchList) {
    const ratingListSummary = {};
    const matchRecords = matchList.split("\n");

    for (let i = matchRecords.length-1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const winner = matchInfo[2];
            const loser = matchInfo[3];

            // Initialize player ratingListSummary if not already present
            if (!ratingListSummary[winner]) {
                ratingListSummary[winner] = { matchesPlayed: 0, matchesWon: 0, matchesLost: 0,
                                                rating: 0, futureRating: 0,
                                                percentMatchesWon: 0, expectedMatchesWon: 0 };
            }
            if (!ratingListSummary[loser]) {
                ratingListSummary[loser] = { matchesPlayed: 0, matchesWon: 0, matchesLost: 0,
                                                rating: 0, futureRating: 0,
                                                percentMatchesWon: 0, expectedMatchesWon: 0 };
            }
            
            // winner
            ratingListSummary[winner].matchesPlayed++;
            ratingListSummary[winner].matchesWon++;

            // loser
            ratingListSummary[loser].matchesPlayed++;
            ratingListSummary[loser].matchesLost++;
        }
    }

    const matchLengthRoot = Math.sqrt(Number(document.getElementById('matchLength').value));

    for (const [player, stats] of Object.entries(ratingListSummary)) {
        if (typeof playerRating[player] !== 'undefined') {
            stats.percentMatchesWon = Math.round(stats.matchesWon*1000/stats.matchesPlayed)/10;
            stats.expectedMatchesWon = Math.round(1000 * (1 / (1 + Math.pow(10, -(playerRating[player].rating - initialRating) * matchLengthRoot / 2000))))/10;
            stats.rating = playerRating[player].rating;
            stats.futureRating = stats.rating;
        }
        else {
            alert ( player + ' rating not found!');
        }
    }

    return ratingListSummary;
}

// Summarize the Match List
function summarizeMatchList(matchList) {
    const matchListSummary = {};
    const matchRecords = matchList.split("\n");

    const rankingListSelection = document.getElementById('rankingListSelection').value;
    const isStreakSelected = rankingListSelection.includes('Streak');
    const isRanglisteSelected = /rangliste|daysInactive/.test(rankingListSelection);

    for (let i = matchRecords.length-1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const matchDate = matchInfo[1];
            const winner = matchInfo[2];
            const loser = matchInfo[3];
            const matchLength = matchInfo[4];

            // Initialize player matchListSummary if not already present
            if (!matchListSummary[winner]) {
                matchListSummary[winner] = { lastDateActive: '-',
                                             matchesPlayed: 0, matchesWon: 0, matchesLost: 0, 
                                             punkte: 0, punkteWon: 0, punkteLost: 0, punkteBonus: 0,
                                             punkteMatchesWon: 0, punkteMatchesLost: 0,
                                             currentStreak: 0,
                                             currentWon: 0, longestWon: 0, 
                                             currentLost: 0, longestLost: 0 
                };
            }
            if (!matchListSummary[loser]) {
                matchListSummary[loser] = { lastDateActive: '-',
                                            matchesPlayed: 0, matchesWon: 0, matchesLost: 0, 
                                            punkte: 0, punkteWon: 0, punkteLost: 0, punkteBonus: 0,
                                            punkteMatchesWon: 0, punkteMatchesLost: 0,
                                            currentStreak: 0,
                                            currentWon: 0, longestWon: 0, 
                                            currentLost: 0, longestLost: 0 };
            }
            
            // Increment played/won/lost counts
            const datetime = new Date(matchDate);
            const isTournamentDay = datetime.getDay() === tournamentDay;
            let bonusPunkte = isTournamentDay ? 5 : 0;  // for playing on Saturday

            // winner
            matchListSummary[winner].matchesPlayed++;
            matchListSummary[winner].matchesWon++;

            if (isRanglisteSelected) {  // only if Rangliste or Days Inactive is selected
                if (isTournamentDay) {
                    matchListSummary[winner].punkteMatchesWon++;
                    matchListSummary[winner].punkte += +matchLength;
                    matchListSummary[winner].punkteWon += +matchLength;
                    if (matchListSummary[winner].lastDateActive !== matchDate) {
                        matchListSummary[winner].punkte += bonusPunkte;
                        matchListSummary[winner].punkteBonus += bonusPunkte;
                    }
                }
                matchListSummary[winner].lastDateActive = matchDate;
            }

            if (isStreakSelected) {  // calculate only if any of the streaks is selected
                matchListSummary[winner].currentLost = 0;
                matchListSummary[winner].currentWon++;
                matchListSummary[winner].currentStreak = matchListSummary[winner].currentWon;
                if (matchListSummary[winner].currentWon > matchListSummary[winner].longestWon) {
                    matchListSummary[winner].longestWon = matchListSummary[winner].currentWon;
                }
            }

            // loser
            matchListSummary[loser].matchesPlayed++;
            matchListSummary[loser].matchesLost++;

            if (isRanglisteSelected) {  // only if Rangliste or Days Inactive is selected
                if (isTournamentDay) {
                    matchListSummary[loser].punkteMatchesLost++;
                    matchListSummary[loser].punkteLost += +matchLength;
                    if (matchListSummary[loser].lastDateActive !== matchDate) {
                        matchListSummary[loser].punkte += bonusPunkte;
                        matchListSummary[loser].punkteBonus += bonusPunkte;
                    }
                }
                matchListSummary[loser].lastDateActive = matchDate;
            }

            if (isStreakSelected) {  //calculate only if any of the streaks is selected
                matchListSummary[loser].currentWon = 0;
                matchListSummary[loser].currentLost--;
                matchListSummary[loser].currentStreak = matchListSummary[loser].currentLost;
                if (matchListSummary[loser].currentLost < matchListSummary[loser].longestLost) {
                    matchListSummary[loser].longestLost = matchListSummary[loser].currentLost;
                }
            }
        }
    }
    return matchListSummary;
}

// Adjust the Expected Rating based on the Match List
function adjustExpectedRatingList(matchList) {
    const matchRecords = matchList.split("\n");

    for (let i = matchRecords.length-1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const winner = matchInfo[2];
            const loser = matchInfo[3];
            const matchLength = Number(matchInfo[4]);

            const matchLengthRoot = Math.sqrt(matchLength);
            const ratingPointsAtStake = 4 * matchLengthRoot;
            const winningProbability = 1.0 / (1.0 + Math.pow(10.0, -(ratingSummary[winner].futureRating - ratingSummary[loser].futureRating ) * matchLengthRoot / 2000.0));

            const ratingDifference = (1.0 - winningProbability) * ratingPointsAtStake;

            // winner
            ratingSummary[winner].futureRating += ratingDifference;
            ratingSummary[winner].matchesPlayed++;
            ratingSummary[winner].matchesWon++;

            // loser
            ratingSummary[loser].futureRating -= ratingDifference;
            ratingSummary[loser].matchesPlayed++;
            ratingSummary[loser].matchesLost++;
        }
    }

    const matchLengthRoot = Math.sqrt(Number(document.getElementById('matchLength').value));

    for (const [player] of Object.entries(ratingSummary)) {
            ratingSummary[player].expectedMatchesWon = Math.round(1000 * (1 / (1 + Math.pow(10, -(ratingSummary[player].futureRating - initialRating) * matchLengthRoot / 2000))))/10;
    }   
}


function populatePlayerRating(ratingList) {
    const ratingEntries = ratingList.split("\n");

    for (let i = 0; i < ratingEntries.length; i++) {  // ? Should it start from 2?
        if (ratingEntries[i].length > 0) {
            const ratingEntry = ratingEntries[i].split('|');
            const name = ratingEntry[2];
            const rating = Number(ratingEntry[3].replace(',', ''));
            const experience = Number(ratingEntry[5]);

            // Create a new playerRating if not already present
            if (!playerRating[name]) {
                playerRating[name] = { rating: rating, experience: experience };
            }
        }
    }
    return playerRating;            
}

// Summarize the Player Progress
// This function calculates the rating changes for each player based on match results
function summarizePlayerProgress(matchList) {
    // Returns an array of objects: { player, date, rating }
    const playerRatings = {};
    const progressList = [];
    const matchRecords = matchList.split("\n");

    // Start from the third line (skip headers), process in chronological order
    for (let i = 2; i < matchRecords.length; i++) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const matchDateStr = matchInfo[1];
            const winner = matchInfo[2];
            const loser = matchInfo[3];
            const matchLength = Number(matchInfo[4]);

            // Initialize ratings if not present
            if (!(winner in playerRatings)) playerRatings[winner] = initialRating;
            if (!(loser in playerRatings)) playerRatings[loser] = initialRating;

            const matchLengthRoot = Math.sqrt(matchLength);
            const ratingPointsAtStake = 4 * matchLengthRoot;
            const winningProbability = 1.0 / (1.0 + Math.pow(10.0, -(playerRatings[winner] - playerRatings[loser]) * matchLengthRoot / 2000.0));
            const ratingDifference = (1.0 - winningProbability) * ratingPointsAtStake;

            // Update ratings
            playerRatings[winner] += ratingDifference;
            playerRatings[loser] -= ratingDifference;

            // Record progress for both players after this match
            progressList.push({
                match: i-2,
                player: winner,
                date: matchDateStr,
                rating: playerRatings[winner]
            });
            progressList.push({
                match: i-2,
                player: loser,
                date: matchDateStr,
                rating: playerRatings[loser]
            });
        }
    }

    return progressList;
}

// Summarize High and Low Scores
function summarizeScores(playerProgressList) {
    const scoresSummary = {};
    const timeSpanRegex = new RegExp(document.getElementById("timeSpanSelection").value);

    for (const entry of playerProgressList) {
        if (timeSpanRegex.test(entry.date)) {
            const player = entry.player;
            const rating = entry.rating;

            if (!scoresSummary[player]) {
                scoresSummary[player] = {
                    highScore: rating,
                    currentScore: rating,
                    lowScore: rating,
                    highScoreDate: entry.date,
                    lowScoreDate: entry.date
                };
            } else {
                scoresSummary[player].currentScore = rating;
                if (rating > scoresSummary[player].highScore) {
                    scoresSummary[player].highScore = rating;
                    scoresSummary[player].highScoreDate = entry.date;
                }
                if (rating < scoresSummary[player].lowScore) {
                    scoresSummary[player].lowScore = rating;
                    scoresSummary[player].lowScoreDate = entry.date;
                }
            }
        }
    }

    return scoresSummary;
}
