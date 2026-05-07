const repoOwner = 'modiholodri';  // Repo Owner for the Club Repo

const clubRepos = [   // Club Repos list, put the default one first
    {
        name: 'Chiang Mai Backgammon',
        tpye: 'Club',
        repo: 'cnxbg-ranking-list',
        suffix: 'cnx',
    },
    {
        name: 'Siam Backgammon',
        tpye: 'Merger',
        repo: 'siambg-ranking-list',
        suffix: 'siam',
    },
    {
        name: 'Bangkok Backgammon',
        tpye: 'Club',
        repo: 'bkk-bg-rating-list',
        suffix: 'bkk',
    },
];

const githubToken = '';  // Fill in the PAT before publishing

const tournamentDay = 6; // Day of the week when the tournament is held
const initialRating = 1800; // Initial rating for new players, does not effect the rating calculation on GitHub
