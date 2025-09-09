export async function parseTSVData(tsvText) {
    const lines = tsvText.trim().split('\n');
    // Skip first line, use second line as headers
    const headers = lines[1].split('\t');

    // Start from line 3 (index 2)
    const data = lines.slice(2).map(line => {
        const values = line.split('\t');
        // Skip empty lines or lines with insufficient data
        if (!values || values.length < 79 || !values[0]) {
            return null;
        }
        const obj = {
            id: parseInt(values[0], 10) || 0, // Column A - Dex #
            noformid: parseInt(values[1], 10) || 0,
            name: values[2] || 'Unknown', // Column B - Pokemon
            classification: values[3], // Column C - Classification
            type: [values[4], values[5]].filter(t => t && t.trim()), // Column D, E - Types
            availability: values.slice(6, 52), // Column F-AY - Availability
            baseStats: [ // Column AZ-BE - Stats
                parseInt(values[52], 10), // HP
                parseInt(values[53], 10), // ATK
                parseInt(values[54], 10), // DEF
                parseInt(values[55], 10), // SP. ATK
                parseInt(values[56], 10), // SP. DEF
                parseInt(values[57], 10)  // SPD
            ],
            color: values[59], // Column BG - Color
            shape: values[60], // Column BH - Shape
            abilities: [values[62], values[63]].filter(a => a && a.trim()), // Column BJ, BK - Abilities
            hability: [values[64]].filter(h => h && h.trim()), // Column BL - Hidden Ability
            catchRate: parseInt(values[66], 10), // Column BN - Catch Rate
            eggGroup: [values[68], values[69]].filter(e => e && e.trim()), // Column BP, BQ - Egg Groups
            eggCycle: parseInt(values[70], 10), // Column BR - Egg Cycles
            levelRate: values[72], // Column BT - Level Rate
            height: parseFloat(values[74]), // Column BV - Height
            weight: parseFloat(values[76]), // Column BX - Weight
            baseFriendship: parseInt(values[78], 10), // Column BZ - Base Friendship
            yield: [ // Column CA-CG - Yields
                parseInt(values[79], 10), // XP
                parseInt(values[80], 10), // HP
                parseInt(values[81], 10), // ATK
                parseInt(values[82], 10), // DEF
                parseInt(values[83], 10), // SP. ATK
                parseInt(values[84], 10), // SP. DEF
                parseInt(values[85], 10)  // SPE
            ],
            gender: [ // Column CI, CJ - Gender ratios
                parseFloat(values[87]) || 0, // Male
                parseFloat(values[88]) || 0  // Female
            ],
            moves: {
                levelUp: values[107],
                tm: values[108],
                egg: values[109],
                evolution: values[110],
                reminder: values[111]
            }
        };
        return obj;
    });

    // Filter out any null entries and ensure we have valid data
    return data.filter(item => item !== null);
}