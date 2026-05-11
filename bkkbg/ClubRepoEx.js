const repoOwner = 'modiholodri';  // Repo Owner for the Club Repo

const clubRepos = [   // Club Repos list, put the default one first
    {
        name: 'Bangkok Backgammon',
        repo: 'bkk-bg-rating-list',
        suffix: 'bkk',
    },
    {
        name: 'Chiang Mai Backgammon',
        repo: 'cnxbg-ranking-list',
        suffix: 'cnx',
    },
    {  // The United Backgammon Merger, put it last. It has to have unitedbg in the repo name, so that we can identify it in the code and treat it differently when needed
        name: 'United Backgammon',
        repo: 'unitedbg-ranking-list',
        suffix: 'siam',
    },
];

const githubToken = '';  // Fill in the PAT before pulishing

const tournamentDay = 6; // Day of the week when the tournament is held
const initialRating = 1800; // Initial rating for new players, does not effect the rating calculation on GitHub
