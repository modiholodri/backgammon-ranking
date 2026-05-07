setInterval(showSubmissionStatus, 1000);

let newSubmission = false;
let anotherSubmissionActive = false;
let previousRunID = '';

let latestRunID = '';
let latestRunConclusion = '';
let latestRunStatus = '';
let latestRunUpdatedAt = '';

// show the submission status when a submission is going on
function showSubmissionStatus() {
    // show the status of a new submission until the status is Completed
    if (newSubmission) {
        refreshRunsStatus().then(() => {
            if (latestRunID !== previousRunID) {
                setRunsInfo(`${latestRunStatus} -> ${latestRunConclusion}`);
                if (latestRunStatus === 'Completed') {
                    fetchRatingList();
                    fetchMatchList();
                    newSubmission = false;
                    document.getElementById("submit").disabled = false;
                    document.getElementById("startTournamentButton").disabled = false;
                    document.getElementById("finishTournamentButton").disabled = false;
                }
            }
        });
    }

    // show the status of other submissions until the submission is Completed
    if (anotherSubmissionActive) {
        refreshRunsStatus().then(() => {
            setRunsInfo(`${latestRunID}: ${latestRunStatus} -> ${latestRunConclusion}`);
            if (latestRunStatus === 'Completed') {
                anotherSubmissionActive = false;
                document.getElementById("submit").disabled = false;
                document.getElementById("startTournamentButton").disabled = false;
                document.getElementById("finishTournamentButton").disabled = false;
            }
        });
    }
}

// Submit a match report
let lastSubmitTime = Date.now();
document.getElementById('matchReportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // prevent spamming the submit button
    if (Date.now() - lastSubmitTime < 5000) {
        alert('Hold your horses you can only submit a match report every 5 seconds! Check the Submission Status section below...');
        return;
    }
    lastSubmitTime = Date.now();

    // check for Fake debug mode
    if (document.getElementById('debugMode').value === 'Fake' || document.getElementById('forfeitSubmittedMatches').checked === true) {
        submitFakeMatchReport();
        return;
    }

    let winnerName = document.getElementById('winnerName').value;
    let loserName = document.getElementById('loserName').value;
    let matchLength = document.getElementById('matchLength').value;

    const repoName = document.getElementById('clubSelection').value;

    if (winnerName === 'Select') {
        alert('Select the Winner name!');
    }
    else if (loserName === 'Select') {
        alert('Select the Loser name!');
    }
    else if (!githubToken) {
        alert('Add a valid GitHub token!');
    }
    else {
        await refreshRunsStatus();
        setSubmissionStatus(`Submitting ${winnerName} <> ${loserName} -> ${matchLength}`);
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
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json',
                },
                body: JSON.stringify({ 
                    event_type: 'match_report', 
                    client_payload: { 
                        winner_name: `${winnerName}`,
                        loser_name:  `${loserName}`, 
                        match_length: `${matchLength}`
                    } 
                })
            });

            newSubmission = true;
            document.getElementById("submit").disabled = true;
            document.getElementById("startTournamentButton").disabled = true;
            document.getElementById("finishTournamentButton").disabled = true;

            // reset the inputs
            document.getElementById('winnerName').value = 'Select';
            document.getElementById('loserName').value = 'Select';
        } 
        catch (error) { 
            // Error triggering GitHub Action: Failed to execute 'json' on 'Response': Unexpected end of JSON input
            alert('Error triggering GitHub Action: ' + error.message); // Handle error (e.g., notify user, retry, etc.)
        }
    }
});

// Fetch the Runs Status
async function  refreshRunsStatus() {
    const repoName = document.getElementById('clubSelection').value;

    try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?per_page=1&timestamp=${Date.now()}`, {
            method: 'GET',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            const workflowRuns = data.workflow_runs;
            if (!workflowRuns || workflowRuns.length === 0) {
                latestRunID = 'xxx';
                latestRunStatus = 'No Runs';
                latestRunConclusion = 'N/A';
                latestRunUpdatedAt = formatTimestamp(new Date());
                return;
            }
            latestRunID = workflowRuns[0].id;
            latestRunStatus = toTitleCase(workflowRuns[0].status.replaceAll('_', ' '));
            latestRunUpdatedAt = formatTimestamp(workflowRuns[0].updated_at);
            latestRunConclusion = workflowRuns[0].conclusion ? toTitleCase(workflowRuns[0].conclusion.toUpperCase()) : 'Wait...';
        } else {
            alert(`HTTP error! status: ` + response.status);
        }
    } 
    catch (error) { 
        alert('Error triggering GitHub Action: ' + error.message); // Handle error (e.g., notify user, retry, etc.)
    }
}

// Format the UTC time stamp in a nicer way
const formatTimestamp = (timestamp)=> {
    const datetime = new Date(timestamp)
    const dateString = datetime.toISOString().split('T')[0];
    const timeString = datetime.toTimeString().split(' ')[0];
    return `${dateString} ${timeString}`;
}

// Set the last Runs Info
function setRunsInfo (runsInfo) {
    document.getElementById("runsInfo").innerText = runsInfo;
    if (runsInfo.includes('Success')) {
        setSubmissionStatus(document.getElementById("submissionStatus").innerText.replace('Submitting', 'Submitted'));
        setTimeout(clearSubmissionStatus, 20000);
    }
    document.getElementById("runsInfo").style.color = runsInfo.includes('Success') ? 'green' : runsInfo.includes('Failure') ? 'red' : 'white';
}

// Set the Submission Status
function setSubmissionStatus (submissionStatus) {
    document.getElementById("submissionStatus").innerText = submissionStatus;
}

// Convert a string to Title Case
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

// Clear the Submission Status
function clearSubmissionStatus() {
    document.getElementById('submissionStatus').innerHTML = '';
    document.getElementById('runsInfo').innerHTML = '';
}

// Submit a fake match report (for debug purposes)
function submitFakeMatchReport() {
    let winnerName = document.getElementById('winnerName').value;
    let loserName = document.getElementById('loserName').value;
    let matchLength = document.getElementById('matchLength').value;

    if (winnerName === 'Select') {
        alert('Select the Winner name!');
    }
    else if (loserName === 'Select') {
        alert('Select the Loser name!');
    }
    else {
        const datetime = new Date();
        const dateString = datetime.toISOString().split('T')[0];
        const fakeMatch = `|${dateString}|${winnerName}|${loserName}|${matchLength}|`;

        setSubmissionStatus(`Forfeiting ${winnerName} <> ${loserName} -> ${matchLength}`);
        matchRecords.push(fakeMatch);
        getTodaysMatches(matchRecords);
        highlightTodaysMatches();
        beautifyTournament();
        generateTournamentSummary();
    }
}
