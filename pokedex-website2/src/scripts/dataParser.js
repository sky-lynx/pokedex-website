// dataLoader.js
let pokemonData = null; // cached Pokémon data
let movesData = null;   // cached Moves data
const dataTsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwDxqxofxdx7M2HU-pMFBFBcMDI6mIVBeVim1sxIC_zalARL4Z7DVNiPkhGwY4ZKmVpC9FETrjZtOH/pub?gid=1685697799&output=tsv';
const movesTsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwDxqxofxdx7M2HU-pMFBFBcMDI6mIVBeVim1sxIC_zalARL4Z7DVNiPkhGwY4ZKmVpC9FETrjZtOH/pub?gid=1813387196&output=tsv';
const controlPanelUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT91AhjLXEf0LGvk-ck5jcQJOzEHIaBajUKI92zfHkrg1I4SrTnABPLXyveLTNRKegrImW49xxmY8L3/pub?output=tsv&gid=1239106350';

// Function to check control panel setting
async function shouldUseThirdParty() {
    try {
        const response = await fetch(controlPanelUrl);
        if (!response.ok) throw new Error('Failed to fetch control panel data');
        const tsvText = await response.text();
        const lines = tsvText.trim().split('\n');
        if (lines.length > 0) {
            const cells = lines[0].split('\t');
            if (cells.length > 1) {
                const useThirdParty = cells[1].trim().toLowerCase() === 'true';
                currentDataSource = useThirdParty ? 'Third Party TSV' : 'Local TSV';
                return useThirdParty;
            }
        }
        currentDataSource = 'Local TSV';
        return false;
    } catch (error) {
        console.error('Error checking control panel:', error);
        currentDataSource = 'Local TSV';
        return false;
    }
}

// -----------------------------
// Pokémon Data
// -----------------------------
// Variable to track data source
export let currentDataSource = '';

export async function parseTSVData() {
    // If cached, return immediately
    if (pokemonData) return pokemonData;

    try {
        const useThirdParty = await shouldUseThirdParty();
        let response;
        
        if (useThirdParty) {
            response = await fetch(dataTsvUrl);
            if (!response.ok) throw new Error('Failed to fetch third-party data.tsv');
        } else {
            const isGitHubPages = window.location.hostname === 'sky-lynx.github.io' || window.location.pathname.includes('/pokedex-website/');
            const baseUrl = isGitHubPages ? '/pokedex-website' : '';
            response = await fetch(`${baseUrl}/api/data.tsv`);
            if (!response.ok) throw new Error('Failed to fetch local data.tsv');
        }
        
        const tsvText = await response.text();

    const lines = tsvText.trim().split('\n');
    const headers = lines[1].split('\t');

    const data = lines.slice(2).map(line => {
        const values = line.split('\t');
        if (!values || values.length < 79 || !values[0]) return null;

        return {
            id: parseInt(values[0], 10) || 0,
            noformid: parseInt(values[1], 10) || 0,
            name: values[2] || 'Unknown',
            classification: values[3],
            type: [values[4], values[5]].filter(t => t && t.trim()),
            availability: values.slice(6, 52),
            baseStats: [
                parseInt(values[52], 10),
                parseInt(values[53], 10),
                parseInt(values[54], 10),
                parseInt(values[55], 10),
                parseInt(values[56], 10),
                parseInt(values[57], 10)
            ],
            color: values[59],
            shape: values[60],
            abilities: [values[62], values[63]].filter(a => a && a.trim()),
            hability: [values[64]].filter(h => h && h.trim()),
            catchRate: parseInt(values[66], 10),
            eggGroup: [values[68], values[69]].filter(e => e && e.trim()),
            eggCycle: parseInt(values[70], 10),
            levelRate: values[72],
            height: parseFloat(values[74]),
            weight: parseFloat(values[76]),
            baseFriendship: parseInt(values[78], 10),
            yield: [
                parseInt(values[79], 10),
                parseInt(values[80], 10),
                parseInt(values[81], 10),
                parseInt(values[82], 10),
                parseInt(values[83], 10),
                parseInt(values[84], 10),
                parseInt(values[85], 10)
            ],
            gender: [
                parseFloat(values[87]) || 0,
                parseFloat(values[88]) || 0
            ],
            moves: {
                levelUp: values[107],
                tm: values[108],
                egg: values[109],
                evolution: values[110],
                reminder: values[111]
            }
        };
    });

        pokemonData = data.filter(item => item !== null);
        return pokemonData;
    } catch (error) {
        console.error('Error parsing TSV data:', error);
        return [];
    }
}

// -----------------------------
// Moves Data
// -----------------------------
export async function parseMovesData() {
    if (movesData) return movesData;

    try {
        const useThirdParty = await shouldUseThirdParty();
        let response;
        
        if (useThirdParty) {
            response = await fetch(movesTsvUrl);
            if (!response.ok) throw new Error('Failed to fetch third-party moves.tsv');
        } else {
            const isGitHubPages = window.location.hostname === 'sky-lynx.github.io' || window.location.pathname.includes('/pokedex-website/');
            const baseUrl = isGitHubPages ? '/pokedex-website' : '';
            response = await fetch(`${baseUrl}/api/moves.tsv`);
            if (!response.ok) throw new Error('Failed to fetch local moves.tsv');
        }
        
        const tsvText = await response.text();

        const lines = tsvText.trim().split('\n');
    const headers = lines[1].split('\t');

    const data = lines.slice(2).map(line => {
        const values = line.split('\t');
        if (!values || values.length < 12 || !values[0]) return null;

        return {
            name: values[0],
            id: values[1],
            type: values[2],
            category: values[3],
            pp: values[4] + "-" + values[5],
            power: values[6] || '-',
            accuracy: values[7] || '-',
            critRate: values[8] || '-',
            priority: values[9] || '0',
            target: values[10] || '-',
            effect: values[11] || '-',
            chance: values[13] || '-'
        };
    });

        movesData = data.filter(item => item !== null);
        return movesData;
    } catch (error) {
        console.error('Error parsing moves data:', error);
        return [];
    }
}

// -----------------------------
// Optional: export cached arrays directly
// -----------------------------
export { pokemonData, movesData };

// -----------------------------
// Auto-fetch on page load
// -----------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await parseTSVData();
    await parseMovesData();
});
