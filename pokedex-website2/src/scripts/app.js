const pokemonListEl = document.getElementById('pokemon-list');
const modal = document.getElementById('pokemon-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');

// Apply grid layout to the pokemon list container
pokemonListEl.classList.add('pokemon-grid');

// Stat names in order for your API
const STAT_NAMES = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];

// Type color mapping
const TYPE_COLORS = {
    Normal: '#A8A77A',
    Fire: '#EE8130',
    Water: '#6390F0',
    Electric: '#F7D02C',
    Grass: '#7AC74C',
    Ice: '#96D9D6',
    Fighting: '#C22E28',
    Poison: '#A33EA1',
    Ground: '#E2BF65',
    Flying: '#A98FF3',
    Psychic: '#F95587',
    Bug: '#A6B91A',
    Rock: '#B6A136',
    Ghost: '#735797',
    Dragon: '#6F35FC',
    Dark: '#705746',
    Steel: '#B7B7CE',
    Fairy: '#D685AD'
};

function getTypeColor(type) {
    return TYPE_COLORS[type] || '#AAA';
}

// Generation ranges
const GENERATION_RANGES = {
    gen1: [1, 151],
    gen2: [152, 251],
    gen3: [252, 386],
    gen4: [387, 493],
    gen5: [494, 649],
    gen6: [650, 721],
    gen7: [722, 809],
    gen8: [810, 905],
    gen9: [906, 1025]
};

function getPokemonGeneration(pokemonId) {
    for (const [gen, [min, max]] of Object.entries(GENERATION_RANGES)) {
        if (pokemonId >= min && pokemonId <= max) {
            return gen;
        }
    }
    return null;
}

// Cache loaded pokemon data
let allPokemonData = null;
// Cache loaded abilities data
let allAbilitiesData = null;
// Cache current filter state
let filtersEnabled = false; // Track if filters have been used

// All possible shapes
const POKEMON_SHAPES = [
    'Bipedal+Tail',
    'Bipedal+Tailless',
    'Quadruped',
    'Head',
    'Head+Arms',
    'Head+Base',
    'Head+Legs',
    '1 Pair of Wings',
    '2+ Pair of Wings',
    'Insectoid',
    'Serpentine',
    'Tentacles',
    'Multiple Bodies',
    'Fins'
];

// All possible colors
const POKEMON_COLORS = [
    'Red',
    'Blue',
    'Yellow',
    'Green',
    'Black',
    'Brown',
    'Purple',
    'Gray',
    'White',
    'Pink'
];

// Names for yield stats
const YIELD_NAMES = ['XP', 'HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed', 'Friendship'];

// All possible egg groups
const EGG_GROUPS = [
    'Monster', 'Human-Like',
    'Water 1', 'Water 3',
    'Bug', 'Mineral',
    'Flying', 'Amorphous',
    'Field', 'Water 2',
    'Fairy', 'Ditto',
    'Grass', 'Dragon',
    'No Eggs Discovered'
];

let currentFilters = {
    search: '',
    types: Object.keys(TYPE_COLORS),  // start with all types selected
    typeLogic: 'or',  // default to OR logic
    typing: ['monotype', 'dualtype'],  // start with all typing options selected
    generations: Array.from({length: 9}, (_, i) => `gen${i + 1}`),  // start with all generations selected
    shapes: POKEMON_SHAPES,  // start with all shapes selected
    colors: POKEMON_COLORS,  // start with all colors selected
    baseStats: {
        hp: { min: '', max: '' },
        attack: { min: '', max: '' },
        defense: { min: '', max: '' },
        spAtk: { min: '', max: '' },
        spDef: { min: '', max: '' },
        speed: { min: '', max: '' }
    },
    yields: {
        xp: { min: '', max: '' },
        hp: { min: '', max: '' },
        attack: { min: '', max: '' },
        defense: { min: '', max: '' },
        spAtk: { min: '', max: '' },
        spDef: { min: '', max: '' },
        speed: { min: '', max: '' },
        friendship: { min: '', max: '' }
    },
    additionalInfo: {
        height: { min: '', max: '' },
        weight: { min: '', max: '' },
        catchRate: { min: '', max: '' },
        dexNumber: { min: '', max: '' }
    },
    breeding: {
        eggGroups: EGG_GROUPS,  // start with all egg groups selected
        eggCycles: { min: '', max: '' }
    }
};

// Function to parse TSV data into an array of objects
async function parseTSVData(tsvText) {
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
            ]
        };
        return obj;
    });

    // Filter out any null entries and ensure we have valid data
    return data.filter(item => item !== null);
}

// Render type filter checkboxes inside a dropdown
function renderTypeFilters() {
    const typeFiltersEl = document.getElementById('type-filters');
    if (!typeFiltersEl) return;
    typeFiltersEl.innerHTML = `
        <div style="display:inline-block;position:relative;text-align:left;">
            <button id="type-filter-btn" style="padding:7px 16px;border-radius:8px;border:1px solid #bbb;background:#f8f8f8;cursor:pointer;font-size:1em;">
                Filters
            </button>
            <div id="type-filter-dropdown" style="display:none;position:absolute;left:0;top:110%;background:#fff;border:1px solid #bbb;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.10);padding:16px;z-index:20;min-width:300px;text-align:left;">
                <div id="filter-buttons" style="display:flex;gap:12px;margin-bottom:16px;">
                    <button id="type-filter-select-all" style="padding:4px 12px;border-radius:6px;border:1px solid #bbb;background:#e3f2fd;cursor:pointer;font-size:0.95em;flex:1;">Select All</button>
                    <button id="type-filter-deselect-all" style="padding:4px 12px;border-radius:6px;border:1px solid #bbb;background:#f8bbd0;cursor:pointer;font-size:0.95em;flex:1;">Deselect All</button>
                </div>

                <div id="basestat-buttons" style="display:none;margin-bottom:16px;">
                    <button id="basestat-clear" style="width:100%;padding:4px 12px;border-radius:6px;border:1px solid #bbb;background:#f8bbd0;cursor:pointer;font-size:0.95em;">Clear All Stats</button>
                </div>
                
                <div style="display:flex;gap:10px;margin-bottom:16px;">
                    <select id="filter-category" style="padding:4px 12px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;font-size:0.95em;flex:1;">
                        <option value="types">Types</option>
                        <option value="typing">Typing</option>
                        <option value="generation">Generation</option>
                        <option value="shape">Shape</option>
                        <option value="color">Color</option>
                        <option value="basestats">Base Stats</option>
                        <option value="yields">Yields & Friendship</option>
                        <option value="breeding">Breeding</option>
                        <option value="additionalInfo">Additional Information</option>
                    </select>
                </div>

                <div id="types-section" class="filter-section" style="display:block;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <div style="font-weight:600;color:#666;">Types</div>
                        <button id="type-logic-toggle" style="padding:4px 12px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;font-size:0.9em;color:#666;display:flex;align-items:center;gap:4px;">
                            <span>AND</span>
                            <div style="width:32px;height:16px;background:#ccc;border-radius:8px;position:relative;transition:background 0.3s">
                                <div style="width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;left:1px;top:1px;transition:left 0.3s"></div>
                            </div>
                        </button>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    ${Object.keys(TYPE_COLORS).map(type =>
                        `<label style="display:inline-flex;align-items:center;gap:2px;margin-bottom:4px;">
                            <input type="checkbox" class="type-filter-checkbox" value="${type}" checked>
                            <span style="background:${getTypeColor(type)};color:#fff;padding:2px 10px;border-radius:12px;font-size:0.95em;">${type}</span>
                        </label>`
                    ).join('')}
                    </div>
                </div>

                <div id="typing-section" class="filter-section" style="display:none;">
                    <div style="font-weight:600;margin-bottom:8px;color:#666;">Typing</div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <label style="display:flex;align-items:center;gap:8px;">
                            <input type="checkbox" class="typing-filter-checkbox" value="monotype" checked>
                            <span style="color:#666;">Monotype</span>
                        </label>
                        <label style="display:flex;align-items:center;gap:8px;">
                            <input type="checkbox" class="typing-filter-checkbox" value="dualtype" checked>
                            <span style="color:#666;">Dual-type</span>
                        </label>
                    </div>
                </div>

                <div id="generation-section" class="filter-section" style="display:none;">
                    <div style="font-weight:600;margin-bottom:8px;color:#666;">Generation</div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;">
                        ${Array.from({length: 9}, (_, i) => i + 1).map(gen =>
                        `<label style="display:flex;align-items:center;gap:4px;min-width:45%;">
                            <input type="checkbox" class="gen-filter-checkbox" value="gen${gen}" checked>
                            <span style="color:#666;">Gen ${gen}</span>
                        </label>`
                        ).join('')}
                    </div>
                </div>

                <div id="shape-section" class="filter-section" style="display:none;">
                    <div style="font-weight:600;margin-bottom:8px;color:#666;">Shape</div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;">
                        ${POKEMON_SHAPES.map(shape =>
                        `<label style="display:flex;align-items:center;gap:4px;min-width:45%;">
                            <input type="checkbox" class="shape-filter-checkbox" value="${shape}" checked>
                            <span style="color:#666;">${shape.replace(/\+/g, ' + ')}</span>
                        </label>`
                        ).join('')}
                    </div>
                </div>

                <div id="color-section" class="filter-section" style="display:none;">
                    <div style="font-weight:600;margin-bottom:8px;color:#666;">Color</div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;">
                        ${POKEMON_COLORS.map(color =>
                        `<label style="display:flex;align-items:center;gap:4px;min-width:45%;">
                            <input type="checkbox" class="color-filter-checkbox" value="${color}" checked>
                            <span style="color:#666;">${color}</span>
                        </label>`
                        ).join('')}
                    </div>
                </div>

                <div id="basestats-section" class="filter-section" style="display:none;">
                    <div style="font-weight:600;margin-bottom:12px;color:#666;">Base Stats</div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        ${STAT_NAMES.map((stat, index) =>
                        `<div style="display:flex;flex-direction:column;gap:4px;">
                            <div style="color:#666;font-size:0.9em;">${stat}</div>
                            <div style="display:flex;gap:8px;">
                                <div style="display:flex;flex:1;gap:4px;align-items:center;">
                                    <input type="number" min="0" max="255" 
                                           class="basestat-filter-input" 
                                           data-stat-index="${index}"
                                           data-minmax="min"
                                           placeholder="Min"
                                           style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                </div>
                                <div style="display:flex;flex:1;gap:4px;align-items:center;">
                                    <input type="number" min="0" max="255"
                                           class="basestat-filter-input"
                                           data-stat-index="${index}"
                                           data-minmax="max"
                                           placeholder="Max"
                                           style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                </div>
                            </div>
                        </div>`
                        ).join('')}
                    </div>
                </div>

                <div id="yields-section" class="filter-section" style="display:none;">
                    <div style="font-weight:600;margin-bottom:12px;color:#666;">Yields & Friendship</div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        ${YIELD_NAMES.map((stat, index) =>
                        `<div style="display:flex;flex-direction:column;gap:4px;">
                            <div style="color:#666;font-size:0.9em;">${stat}</div>
                            <div style="display:flex;gap:8px;">
                                <div style="display:flex;flex:1;gap:4px;align-items:center;">
                                    <input type="number" min="0" 
                                           class="yields-filter-input" 
                                           data-stat-index="${index}"
                                           data-minmax="min"
                                           placeholder="Min"
                                           style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                </div>
                                <div style="display:flex;flex:1;gap:4px;align-items:center;">
                                    <input type="number" min="0"
                                           class="yields-filter-input"
                                           data-stat-index="${index}"
                                           data-minmax="max"
                                           placeholder="Max"
                                           style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                </div>
                            </div>
                        </div>`
                        ).join('')}
                    </div>
                </div>

                <div id="additionalInfo-section" class="filter-section" style="display:none;">
                    <div style="font-weight:600;margin-bottom:12px;color:#666;">Additional Information</div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        ${[
                            { label: 'Height (m)', field: 'height', decimal: true },
                            { label: 'Weight (kg)', field: 'weight', decimal: true },
                            { label: 'Catch Rate', field: 'catchRate', decimal: false },
                            { label: 'National Dex #', field: 'dexNumber', decimal: false }
                        ].map(({ label, field, decimal }) =>
                        `<div style="display:flex;flex-direction:column;gap:4px;">
                            <div style="color:#666;font-size:0.9em;">${label}</div>
                            <div style="display:flex;gap:8px;">
                                <div style="display:flex;flex:1;gap:4px;align-items:center;">
                                    <input type="number" min="0" ${decimal ? 'step="any"' : ''} 
                                           class="additionalInfo-filter-input" 
                                           data-field="${field}"
                                           data-minmax="min"
                                           placeholder="Min"
                                           style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                </div>
                                <div style="display:flex;flex:1;gap:4px;align-items:center;">
                                    <input type="number" min="0" ${decimal ? 'step="any"' : ''}
                                           class="additionalInfo-filter-input"
                                           data-field="${field}"
                                           data-minmax="max"
                                           placeholder="Max"
                                           style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                </div>
                            </div>
                        </div>`
                        ).join('')}
                    </div>
                </div>

                <div id="breeding-section" class="filter-section" style="display:none;">
                    <div style="font-weight:600;margin-bottom:12px;color:#666;">Breeding</div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div style="display:flex;flex-wrap:wrap;gap:8px;">
                            ${EGG_GROUPS.map(group =>
                            `<label style="display:flex;align-items:center;gap:4px;min-width:45%;">
                                <input type="checkbox" class="eggGroup-filter-checkbox" value="${group}" checked>
                                <span style="color:#666;">${group}</span>
                            </label>`
                            ).join('')}
                        </div>
                        <hr style="border:none;border-top:1px solid #ddd;margin:8px 0;">
                        <div style="display:flex;flex-direction:column;gap:4px;">
                            <div style="color:#666;font-size:0.9em;">Egg Cycles</div>
                            <div style="display:flex;gap:8px;">
                                <div style="display:flex;flex:1;gap:4px;align-items:center;">
                                    <input type="number" min="0" 
                                           class="breeding-filter-input" 
                                           data-field="eggCycles"
                                           data-minmax="min"
                                           placeholder="Min"
                                           style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                </div>
                                <div style="display:flex;flex:1;gap:4px;align-items:center;">
                                    <input type="number" min="0"
                                           class="breeding-filter-input"
                                           data-field="eggCycles"
                                           data-minmax="max"
                                           placeholder="Max"
                                           style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Fetch Pokemon data from TSV file
async function fetchPokemonList(filter = '', typeFilterArr = null, typingFilterArr = null, genFilterArr = null, shapeFilterArr = null, colorFilterArr = null, baseStatsFilter = null, yieldsFilter = null) {
    let filtered = [];
    try {
        if (!allPokemonData) {
            // Check if we're running on GitHub Pages
            const baseUrl = window.location.hostname === 'sky-lynx.github.io' ? '/pokedex-website' : '';
            const res = await fetch(`${baseUrl}/api/data.tsv`);
            if (!res.ok) {
                throw new Error(`Failed to fetch data.tsv: ${res.status}`);
            }
            const tsvText = await res.text();
            allPokemonData = await parseTSVData(tsvText);
            if (!Array.isArray(allPokemonData) || allPokemonData.length === 0) {
                throw new Error('No Pokemon data found or invalid data format');
            }
            console.log('Loaded Pokemon data:', allPokemonData[0]); // Debug log
        }

        // Clear the list before filtering
        // Add grid style
        pokemonListEl.innerHTML = `
            <style>
                .pokemon-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 180px));
                    gap: 16px;
                    justify-content: start;
                    padding: 16px;
                }
            </style>
        `;

        // Apply base name filter
        filtered = allPokemonData.filter(pokemon =>
            pokemon && pokemon.name && pokemon.name.toLowerCase().includes(filter.toLowerCase())
        );

        // Only apply other filters if they've been used
        if (filtersEnabled) {
            // Apply type filter if specified
            if (typeFilterArr && typeFilterArr.length > 0) {
                // Get deselected types
                const deselectedTypes = Object.keys(TYPE_COLORS).filter(type => !typeFilterArr.includes(type));
                
                // Apply type filtering based on selected logic
                filtered = filtered.filter(pokemon => {
                    if (currentFilters.typeLogic === 'or') {
                        // Normal mode: Pokemon should not have any deselected types
                        return !pokemon.type.some(t => deselectedTypes.includes(t));
                    } else {
                        // AND mode: Pokemon must have all selected types
                        return typeFilterArr.every(t => pokemon.type.includes(t));
                    }
                });
            }

            // Apply typing filter (monotype/dualtype)
            if (typingFilterArr && typingFilterArr.length > 0) {
                const typingFilter = typingFilterArr;
                filtered = filtered.filter(pokemon => {
                    const isMonotype = pokemon.type.length === 1;
                    return (typingFilter.includes('monotype') && isMonotype) || 
                           (typingFilter.includes('dualtype') && !isMonotype);
                });
            }

            // Apply generation filter
            if (genFilterArr && genFilterArr.length > 0) {
                filtered = filtered.filter(pokemon => {
                    const gen = getPokemonGeneration(pokemon.id);
                    return gen && genFilterArr.includes(gen);
                });
            }

            // Apply shape filter
            if (currentFilters.shapes && currentFilters.shapes.length > 0) {
                filtered = filtered.filter(pokemon => {
                    return pokemon.shape && currentFilters.shapes.includes(pokemon.shape);
                });
            }

            // Apply color filter
            if (currentFilters.colors && currentFilters.colors.length > 0) {
                filtered = filtered.filter(pokemon => {
                    return pokemon.color && currentFilters.colors.includes(pokemon.color);
                });
            }

            // Apply base stats filter
            if (currentFilters.baseStats) {
                const stats = currentFilters.baseStats;
                filtered = filtered.filter(pokemon => {
                    const checkStat = (value, min, max) => {
                        if (min !== '' && value < min) return false;
                        if (max !== '' && value > max) return false;
                        return true;
                    };

                    return (
                        checkStat(pokemon.baseStats[0], stats.hp.min, stats.hp.max) &&
                        checkStat(pokemon.baseStats[1], stats.attack.min, stats.attack.max) &&
                        checkStat(pokemon.baseStats[2], stats.defense.min, stats.defense.max) &&
                        checkStat(pokemon.baseStats[3], stats.spAtk.min, stats.spAtk.max) &&
                        checkStat(pokemon.baseStats[4], stats.spDef.min, stats.spDef.max) &&
                        checkStat(pokemon.baseStats[5], stats.speed.min, stats.speed.max)
                    );
                });
            }

            // Apply yields filter
            if (currentFilters.yields) {
                const yields = currentFilters.yields;
                filtered = filtered.filter(pokemon => {
                    const checkYield = (value, min, max) => {
                        if (min !== '' && value < min) return false;
                        if (max !== '' && value > max) return false;
                        return true;
                    };

                    return (
                        // Column indices: xp=79, hp=80, atk=81, def=82, spatk=83, spdef=84, speed=85, friendship=78
                        checkYield(parseInt(pokemon.yield[0]), yields.xp.min, yields.xp.max) &&
                        checkYield(parseInt(pokemon.yield[1]), yields.hp.min, yields.hp.max) &&
                        checkYield(parseInt(pokemon.yield[2]), yields.attack.min, yields.attack.max) &&
                        checkYield(parseInt(pokemon.yield[3]), yields.defense.min, yields.defense.max) &&
                        checkYield(parseInt(pokemon.yield[4]), yields.spAtk.min, yields.spAtk.max) &&
                        checkYield(parseInt(pokemon.yield[5]), yields.spDef.min, yields.spDef.max) &&
                        checkYield(parseInt(pokemon.yield[6]), yields.speed.min, yields.speed.max) &&
                        checkYield(parseInt(pokemon.baseFriendship), yields.friendship.min, yields.friendship.max)
                    );
                });
            }

            // Apply additional info filter
            if (currentFilters.additionalInfo) {
                const info = currentFilters.additionalInfo;
                filtered = filtered.filter(pokemon => {
                    const checkValue = (value, min, max) => {
                        if (min !== '' && value < min) return false;
                        if (max !== '' && value > max) return false;
                        return true;
                    };

                    return (
                        checkValue(pokemon.height, info.height.min, info.height.max) &&
                        checkValue(pokemon.weight, info.weight.min, info.weight.max) &&
                        checkValue(pokemon.catchRate, info.catchRate.min, info.catchRate.max) &&
                        checkValue(pokemon.id, info.dexNumber.min, info.dexNumber.max)
                    );
                });
            }

            // Apply breeding filters
            if (currentFilters.breeding) {
                const breeding = currentFilters.breeding;
                filtered = filtered.filter(pokemon => {
                    // Check egg groups
                    const hasSelectedEggGroup = breeding.eggGroups.length === 0 || 
                        pokemon.eggGroup.some(group => breeding.eggGroups.includes(group));

                    // Check egg cycles
                    const cyclesInRange = (value) => {
                        if (breeding.eggCycles.min !== '' && value < breeding.eggCycles.min) return false;
                        if (breeding.eggCycles.max !== '' && value > breeding.eggCycles.max) return false;
                        return true;
                    };

                    return hasSelectedEggGroup && cyclesInRange(pokemon.eggCycle);
                });
            }
        }

    } catch (error) {
        console.error('Error loading Pokemon data:', error);
        pokemonListEl.innerHTML = '<div style="text-align: center; color: red;">Error loading Pokemon data. Please try again later.</div>';
        return;
    }

    // Filter to show only base forms (where noformid is not 0)
    const baseForms = filtered.filter(pokemon => pokemon.noformid !== 0);
    console.log('Base forms:', baseForms);

    // Render base forms
    baseForms.forEach(pokemon => {
        const btn = document.createElement('button');
        btn.className = 'pokemon-btn';
        btn.onclick = () => showPokemonDetails(pokemon.name);

        const idSpan = document.createElement('div');
        idSpan.style.position = 'absolute';
        idSpan.style.top = '8px';
        idSpan.style.left = '8px';
        idSpan.style.fontSize = '0.85em';
        idSpan.style.color = '#666';
        idSpan.textContent = `#${pokemon.id}`;
        btn.appendChild(idSpan);

        const nameSpan = document.createElement('div');
        nameSpan.className = 'pokemon-name';
        nameSpan.textContent = pokemon.name;
        btn.appendChild(nameSpan);

        const typeContainer = document.createElement('div');
        typeContainer.className = 'type-container';
        pokemon.type.forEach(type => {
            const typePill = document.createElement('div');
            typePill.className = 'type-pill';
            typePill.textContent = type;
            typePill.style.backgroundColor = getTypeColor(type);
            typeContainer.appendChild(typePill);
        });
        btn.appendChild(typeContainer);

        pokemonListEl.appendChild(btn);
    });
}

// Fetch abilities data from TSV
async function fetchAbilitiesData() {
    if (!allAbilitiesData) {
        try {
            // Check if we're running on GitHub Pages
            const baseUrl = window.location.hostname === 'sky-lynx.github.io' ? '/pokedex-website' : '';
            const res = await fetch(`${baseUrl}/api/abilities.tsv`);
            if (!res.ok) {
                throw new Error(`Failed to fetch abilities.tsv: ${res.status}`);
            }
            const tsvText = await res.text();
            allAbilitiesData = await parseTSVData(tsvText);
            console.log('Loaded abilities data:', allAbilitiesData); // Debug log
        } catch (error) {
            console.error('Error loading abilities data:', error);
            allAbilitiesData = [];
        }
    }
    return allAbilitiesData;
}

// Show Pokemon details in modal
async function showPokemonDetails(pokemonName) {
    if (!allPokemonData || !allAbilitiesData) {
        await Promise.all([
            fetchPokemonList(
                currentFilters.search,
                currentFilters.types,
                currentFilters.typing,
                currentFilters.generations
            ),
            fetchAbilitiesData()
        ]);
    }

    console.log('Looking for pokemon:', pokemonName); // Debug log
    const pokemon = allPokemonData.find(p => p.name === pokemonName);
    if (!pokemon) {
        console.error('Pokemon not found:', pokemonName);
        return;
    }
    console.log('Found pokemon:', pokemon); // Debug log

    // Find all related forms
    const currentId = pokemon.id;
    let baseFormId;
    let allForms;
    
    if (pokemon.noformid === 0) {
        // This is a form, get the base form's id
        const baseForm = allPokemonData.find(p => p.id === currentId && p.noformid !== 0);
        if (baseForm) {
            baseFormId = baseForm.id;
        }
    } else {
        // This is a base form
        baseFormId = pokemon.id;
    }
    
    // Get all forms including base form (where forms have noformid = 0)
    allForms = allPokemonData.filter(p => 
        p.id === baseFormId || // base form
        (p.noformid === 0 && p.id === currentId) // alternate forms
    );
    
    // Sort forms - base form first, then alternate forms
    allForms.sort((a, b) => {
        if (a.noformid !== 0 && b.noformid === 0) return -1;
        if (a.noformid === 0 && b.noformid !== 0) return 1;
        return a.id - b.id;
    });
    
    const hasMultipleForms = allForms.length > 1;
    console.log('Current Pokemon:', pokemon.name, '(id:', pokemon.id, 'noformid:', pokemon.noformid, ')');
    console.log('Base form ID:', baseFormId);
    console.log('All forms:', allForms.map(function(f) { return f.name + ' (id: ' + f.id + ', noformid: ' + f.noformid + ')'; }));
    console.log('All forms:', allForms);
    console.log('Has multiple forms:', hasMultipleForms);

    const regularAbilities = pokemon.abilities.map(ability => {
        return `<button class="ability-btn" tabindex="0" data-ability="${ability}" data-hidden="false">${ability}</button>`;
    });
    const hiddenAbilities = pokemon.hability.map(ability => {
        return `<button class="ability-btn" tabindex="0" style="background: #fff3e0; color: #ef6c00;" data-ability="${ability}" data-hidden="true">${ability}</button>`;
    });

    const abilityDescriptions = [...regularAbilities, ...hiddenAbilities].join('');

    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-bottom: 16px;">
                <h2 style="margin: 0;">${pokemon.name} <span style="color: #666; font-weight: normal;">#${String(pokemon.id).padStart(3, '0')}</span></h2>
                ${hasMultipleForms ? `
                    <div class="form-switcher" style="display: flex; gap: 8px; align-items: center;">
                        <span style="color: #666;">Form:</span>
                        <select class="form-select" style="padding: 4px 12px; border-radius: 12px; border: 1px solid #ccc; background: #fff; cursor: pointer; font-size: 0.9em;">
                            ${allForms.map(form => `
                                <option value="${form.name}" ${form.name === pokemon.name ? 'selected' : ''}>
                                    ${form.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                ` : ''}
            </div>
            <div class="type-container" style="justify-content: center; margin-bottom: 8px;">
                ${pokemon.type.map(type =>
                    `<div class="type-pill" style="background-color:${getTypeColor(type)}">${type}</div>`
                ).join('')}
            </div>
            <div style="color: #666; font-size: 1.1em;">${pokemon.classification}</div>
        </div>
        <hr>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0;">Physical Traits</h3>
                    <button id="unit-toggle" style="padding: 4px 12px; border-radius: 12px; border: 1px solid #ccc; background: #fff; cursor: pointer; font-size: 0.9em;">
                        Switch to Imperial
                    </button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: #f8f9fa; padding: 16px; border-radius: 12px;">
                        <div style="color: #666;">Height</div>
                        <div class="height-value" style="font-size: 1.2em; font-weight: 600;" 
                            data-metric="${pokemon.height}" 
                            data-imperial="${(pokemon.height * 3.28084).toFixed(1)}">
                            ${pokemon.height}m
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 16px; border-radius: 12px;">
                        <div style="color: #666;">Weight</div>
                        <div class="weight-value" style="font-size: 1.2em; font-weight: 600;"
                            data-metric="${pokemon.weight}" 
                            data-imperial="${(pokemon.weight * 2.20462).toFixed(1)}">
                            ${pokemon.weight}kg
                        </div>
                    </div>
                </div>

                <hr>

                <h3>Abilities</h3>
                <div class="abilities-container" style="margin: 0;">
                    ${abilityDescriptions}
                </div>
                <div id="ability-description" style="max-height: 0; overflow: hidden; margin-top: 12px; padding: 0 12px; background: #f5f5f5; border-radius: 8px; position: relative; opacity: 0; transition: all 0.3s ease-out;">
                    <button class="close-description" style="position: absolute; top: 8px; right: 8px; border: none; background: none; cursor: pointer; font-size: 18px; color: #666;">×</button>
                    <span style="display: block; padding: 12px 0;"></span>
                </div>

                <hr>

                <h3>Breeding Information</h3>
                <div class="breeding-info">
                    <div class="egg-groups">
                        ${pokemon.eggGroup.map(group => `
                            <button class="egg-group-btn" tabindex="0" style="padding: 6px 12px; border-radius: 12px; border: none; cursor: pointer; margin-right: 8px; margin-bottom: 8px; background: #e8f5e9; font-size: 1em;" data-egg-group="${group}">
                                ${group}
                            </button>
                        `).join('')}
                    </div>
                    <div id="egg-group-description" style="max-height: 0; overflow: hidden; margin-top: 12px; padding: 0 12px; background: #f5f5f5; border-radius: 8px; position: relative; opacity: 0; transition: all 0.3s ease-out;">
                        <button class="close-description" style="position: absolute; top: 8px; right: 8px; border: none; background: none; cursor: pointer; font-size: 18px; color: #666;">×</button>
                        <span style="display: block; padding: 12px 0;"></span>
                    </div>
                    <div style="margin-top: 16px; padding: 16px; background: #f8f9fa; border-radius: 12px;">
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #666;">Egg Cycles:</strong> 
                            <span style="font-size: 1.1em;">${pokemon.eggCycle}</span>
                        </div>
                        <div>
                            <strong style="color: #666;">Steps to Hatch:</strong> 
                            <span style="font-size: 1.1em;">${pokemon.eggCycle * 128}</span>
                        </div>
                    </div>
                </div>

                <hr>

                <h3>Additional Information</h3>
                <div style="margin-top: 16px; padding: 16px; background: #f8f9fa; border-radius: 12px;">
                    <div style="margin-bottom: 16px;">
                        <strong style="color: #666;">Color:</strong> 
                        <span style="font-size: 1.1em;">${pokemon.color}</span>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <strong style="color: #666;">Shape:</strong> 
                        <span style="font-size: 1.1em;">${pokemon.shape}</span>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <strong style="color: #666;">Catch Rate:</strong> 
                        <span style="font-size: 1.1em;">${pokemon.catchRate}</span>
                    </div>
                    <div>
                        <strong style="color: #666;">Gender Ratio:</strong> 
                        <span style="font-size: 1.1em;">${pokemon.gender[0]}% ♂ / ${pokemon.gender[1]}% ♀</span>
                    </div>
                </div>
            </div>

            <div>
                <div class="stats-container">
                <h3>Base Stats</h3>
                    ${STAT_NAMES.map((statName, index) => `
                        <div class="stat">
                            <div class="stat-name">${statName}</div>
                            <div class="stat-bar">
                                ${pokemon.baseStats[index] > 0 ?
                            `<div class="stat-fill" style="width: 0%; transition: width 1s ease-out;" data-width="${(pokemon.baseStats[index] / 280) * 100}">
                                        ${pokemon.baseStats[index]}
                                    </div>` :
                            `<div style="padding: 4px 8px; color: #000;">${pokemon.baseStats[index]}</div>`
                        }
                            </div>
                        </div>
                    `).join('')}
                </div>

                <hr>

                <div class="stats-container">
                <h3>Yield Information</h3>
                    <div class="stat">
                        <div class="stat-name">Base Experience</div>
                        <div class="stat-bar">
                            ${pokemon.yield[0] > 0 ?
                            `<div class="stat-fill" style="width: 0%; transition: width 1s ease-out; background: linear-gradient(to right, #9575cd, #5e35b1); text-align: left; padding-left: 8px;" data-width="${(pokemon.yield[0] / 700) * 100}">
                                    ${pokemon.yield[0]}
                            </div>` :
                            `<div style="padding: 4px 8px; color: #000; text-align: left;">${pokemon.yield[0]}</div>`
                            }
                        </div>
                    </div>

                    ${['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'].map((stat, index) => `
                        <div class="stat">
                            <div class="stat-name">${stat} EV</div>
                            <div class="stat-bar">
                                ${pokemon.yield[index + 1] > 0 ?
                                `<div class="stat-fill" style="width: 0%; transition: width 1s ease-out; background: linear-gradient(to right, #81c784, #43a047);" data-width="${(pokemon.yield[index + 1] / 4) * 100}">
                                     ${pokemon.yield[index + 1]}
                                </div>` :
                                `<div style="padding: 4px 8px; color: #000;">${pokemon.yield[index + 1]}</div>`
                                }
                            </div>
                        </div>
                    `).join('')}

                    <div class="stat">
                        <div class="stat-name">Base Friendship</div>
                        <div class="stat-bar">
                            ${pokemon.baseFriendship > 0 ?
                            `<div class="stat-fill" style="width: 0%; transition: width 1s ease-out; background: linear-gradient(to right, #cd75aeff, #b13579ff); text-align: left; padding-left: 8px;" data-width="${(pokemon.baseFriendship / 255) * 100}">
                                    ${pokemon.baseFriendship}
                            </div>` :
                            `<div style="padding: 4px 8px; color: #000; text-align: left;">${pokemon.baseFriendship}</div>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>

    `;
    modal.style.display = 'flex';
    
    // Trigger stat bar animations after a short delay to ensure elements are rendered
    setTimeout(() => {
        const statFills = document.querySelectorAll('.stat-fill');
        statFills.forEach(fill => {
            const targetWidth = fill.getAttribute('data-width');
            fill.style.width = targetWidth + '%';
        });

        // Set up form switcher after elements are rendered
        if (hasMultipleForms) {
            const formSelect = modalBody.querySelector('.form-select');
            if (formSelect) {
                formSelect.addEventListener('change', (e) => {
                    const selectedForm = allForms.find(p => p.name === e.target.value);
                    if (selectedForm) {
                        console.log('Switching to form:', selectedForm.name);
                        showPokemonDetails(selectedForm.name);
                    }
                });
            }
        }
    }, 100);

    // Set up unit toggle functionality
    const unitToggle = document.getElementById('unit-toggle');
    const heightValue = document.querySelector('.height-value');
    const weightValue = document.querySelector('.weight-value');
    let isMetric = true;

    if (unitToggle) {
        unitToggle.addEventListener('click', () => {
            isMetric = !isMetric;
            
            // Update button text
            unitToggle.textContent = isMetric ? 'Switch to Imperial' : 'Switch to Metric';
            
            // Update height
            const height = isMetric ? 
                heightValue.getAttribute('data-metric') + 'm' :
                heightValue.getAttribute('data-imperial') + 'ft';
            heightValue.textContent = height;
            
            // Update weight
            const weight = isMetric ? 
                weightValue.getAttribute('data-metric') + 'kg' :
                weightValue.getAttribute('data-imperial') + 'lbs';
            weightValue.textContent = weight;
        });
    }

    // Set up ability button click handlers
    const abilityButtons = document.querySelectorAll('.ability-btn');
    const abilityDescription = document.getElementById('ability-description');
    const descriptionText = abilityDescription.querySelector('span');
    const closeDescription = abilityDescription.querySelector('.close-description');

    // Add click handlers to each ability button (excluding egg group buttons)
    abilityButtons.forEach(button => {
        // Skip if this is an egg group button
        if (!button.hasAttribute('data-ability')) return;
        button.addEventListener('click', async () => {
            const abilityName = button.getAttribute('data-ability');
            const isHidden = button.getAttribute('data-hidden') === 'true';
            
            console.log('Button clicked:', abilityName, 'Hidden:', isHidden);
            console.log('Available abilities data:', allAbilitiesData);
            
            // Ensure allAbilitiesData is an array before using find
            if (Array.isArray(allAbilitiesData)) {
                const ability = allAbilitiesData.find(a => a && a.name === abilityName);
                console.log('Found ability:', ability);
                
                if (ability) {
                    descriptionText.textContent = `${abilityName}${isHidden ? ' (Hidden Ability)' : ''}: ${ability.description || 'No description available.'}`;
                    abilityDescription.style.maxHeight = '200px';
                    abilityDescription.style.opacity = '1';
                    abilityDescription.style.padding = '12px';
                } else {
                    console.log('No ability data found for:', abilityName);
                    descriptionText.textContent = `${abilityName}${isHidden ? ' (Hidden Ability)' : ''}: Description not available.`;
                    abilityDescription.style.maxHeight = '200px';
                    abilityDescription.style.opacity = '1';
                    abilityDescription.style.padding = '12px';
                }
            } else {
                console.log('Abilities data not loaded properly');
                descriptionText.textContent = `${abilityName}${isHidden ? ' (Hidden Ability)' : ''}: Loading ability data...`;
                abilityDescription.style.maxHeight = '200px';
                abilityDescription.style.opacity = '1';
                abilityDescription.style.padding = '12px';
            }
        });
    });

    // Add click handler to close button
    closeDescription.addEventListener('click', () => {
        abilityDescription.style.maxHeight = '0';
        abilityDescription.style.opacity = '0';
        abilityDescription.style.padding = '0 12px';
    }); 

    // Set up egg group button click handlers
    const eggGroupButtons = document.querySelectorAll('.egg-group-btn');
    const eggGroupDescription = document.getElementById('egg-group-description');
    const eggGroupDescriptionText = eggGroupDescription.querySelector('span');
    const closeEggDescription = eggGroupDescription.querySelector('.close-description');

    // Add click handlers to each egg group button
    eggGroupButtons.forEach(button => {
        button.addEventListener('click', () => {
            const groupName = button.getAttribute('data-egg-group');
            eggGroupDescriptionText.textContent = `Can breed with Pokémon in the ${groupName} egg group`;
            eggGroupDescription.style.maxHeight = '200px';
            eggGroupDescription.style.opacity = '1';
            eggGroupDescription.style.padding = '12px';
        });
    });

    // Add click handler to close button for egg group description
    closeEggDescription.addEventListener('click', () => {
        eggGroupDescription.style.maxHeight = '0';
        eggGroupDescription.style.opacity = '0';
        eggGroupDescription.style.padding = '0 12px';
    });
}

// Close modal when clicking X or outside
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
};

// Handle filters dropdown
function initTypeFilter() {
    const typeFilterBtn = document.getElementById('type-filter-btn');
    const typeFilterDropdown = document.getElementById('type-filter-dropdown');
    const selectAllBtn = document.getElementById('type-filter-select-all');
    const deselectAllBtn = document.getElementById('type-filter-deselect-all');
    const filterCategory = document.getElementById('filter-category');
    
    const sections = [
        {
            id: 'types',
            element: document.getElementById('types-section'),
            checkboxes: document.querySelectorAll('.type-filter-checkbox')
        },
        {
            id: 'typing',
            element: document.getElementById('typing-section'),
            checkboxes: document.querySelectorAll('.typing-filter-checkbox')
        },
        {
            id: 'generation',
            element: document.getElementById('generation-section'),
            checkboxes: document.querySelectorAll('.gen-filter-checkbox')
        },
        {
            id: 'shape',
            element: document.getElementById('shape-section'),
            checkboxes: document.querySelectorAll('.shape-filter-checkbox')
        },
        {
            id: 'color',
            element: document.getElementById('color-section'),
            checkboxes: document.querySelectorAll('.color-filter-checkbox')
        },
        {
            id: 'basestats',
            element: document.getElementById('basestats-section'),
            inputs: document.querySelectorAll('.basestat-filter-input')
        },
        {
            id: 'yields',
            element: document.getElementById('yields-section'),
            inputs: document.querySelectorAll('.yields-filter-input')
        },
        {
            id: 'additionalInfo',
            element: document.getElementById('additionalInfo-section'),
            inputs: document.querySelectorAll('.additionalInfo-filter-input')
        },
        {
            id: 'breeding',
            element: document.getElementById('breeding-section'),
            checkboxes: document.querySelectorAll('.eggGroup-filter-checkbox'),
            inputs: document.querySelectorAll('.breeding-filter-input')
        },
        {
            id: 'yields',
            element: document.getElementById('yields-section'),
            inputs: document.querySelectorAll('.yields-filter-input')
        }
    ];

    // Toggle dropdown
    typeFilterBtn.onclick = (e) => {
        e.stopPropagation();
        typeFilterDropdown.style.display = typeFilterDropdown.style.display === 'none' ? 'block' : 'none';
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!typeFilterDropdown.contains(e.target) && e.target !== typeFilterBtn) {
            typeFilterDropdown.style.display = 'none';
        }
    });

    // Prevent dropdown from closing when clicking inside
    typeFilterDropdown.onclick = (e) => e.stopPropagation();

    // Handle category switching
    filterCategory.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        
        // Toggle button visibility
        const filterButtons = document.getElementById('filter-buttons');
        const basestatButtons = document.getElementById('basestat-buttons');
        
        // Show/hide appropriate buttons based on section type
        const hasCheckboxes = ['types', 'typing', 'generation', 'shape', 'color', 'breeding'].includes(selectedValue);
        const hasInputs = ['basestats', 'yields', 'additionalInfo', 'breeding'].includes(selectedValue);

        filterButtons.style.display = hasCheckboxes ? 'flex' : 'none';
        basestatButtons.style.display = hasInputs ? 'block' : 'none';

        // Show selected section
        sections.forEach(section => {
            section.element.style.display = section.id === selectedValue ? 'block' : 'none';
        });
    });

    // Handle clear base stats button
    const basestatClear = document.getElementById('basestat-clear');
    if (basestatClear) {
        basestatClear.addEventListener('click', () => {
            const currentSection = filterCategory.value;
            const inputSelectors = {
                'basestats': '.basestat-filter-input',
                'yields': '.yields-filter-input',
                'additionalInfo': '.additionalInfo-filter-input',
                'breeding': '.breeding-filter-input'
            };
            
            const selector = inputSelectors[currentSection];
            if (selector) {
                document.querySelectorAll(selector).forEach(input => {
                    input.value = '';
                });
            }
            updateFilters();
        });
    }

    // Select/Deselect all (only affects visible section)
    selectAllBtn.onclick = () => {
        const currentSection = sections.find(s => s.id === filterCategory.value);
        if (currentSection) {
            console.log('Selecting all in section:', currentSection.id);
            Array.from(currentSection.checkboxes).forEach(cb => {
                cb.checked = true;
                console.log('Checked:', cb.value);
            });
            updateFilters();
        }
    };
    
    deselectAllBtn.onclick = () => {
        const currentSection = sections.find(s => s.id === filterCategory.value);
        if (currentSection) {
            console.log('Deselecting all in section:', currentSection.id);
            Array.from(currentSection.checkboxes).forEach(cb => {
                cb.checked = false;
                console.log('Unchecked:', cb.value);
            });
            updateFilters();
        }
    };

    // Update on any checkbox change or input change
    sections.forEach(section => {
        if (section.checkboxes) {
            section.checkboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    if (!filtersEnabled) filtersEnabled = true;
                    updateFilters();
                });
            });
        }
        if (section.inputs) {
            section.inputs.forEach(input => {
                input.addEventListener('input', () => {
                    if (!filtersEnabled) filtersEnabled = true;
                    updateFilters();
                });
            });
        }
    });

    // Handle AND filter toggle
    const typeLogicToggle = document.getElementById('type-logic-toggle');
    if (typeLogicToggle) {
        const switchBg = typeLogicToggle.querySelector('div');
        const switchHandle = switchBg.querySelector('div');
        
        const updateToggleAppearance = (isAnd) => {
            switchBg.style.background = isAnd ? '#4CAF50' : '#ccc';
            switchHandle.style.left = isAnd ? '17px' : '1px';
        };
        
        typeLogicToggle.addEventListener('click', () => {
            currentFilters.typeLogic = currentFilters.typeLogic === 'or' ? 'and' : 'or';
            updateToggleAppearance(currentFilters.typeLogic === 'and');
            updateFilters();
        });
    }
}

// Handle search input
function initSearch() {
    const searchInput = document.getElementById('pokemon-search');
    let debounceTimeout;

    searchInput.oninput = () => {
        clearTimeout(debounceTimeout);
        if (!filtersEnabled) filtersEnabled = true;
        debounceTimeout = setTimeout(updateFilters, 300);
    };
}

// Update pokemon list based on filters
function updateFilters() {
    // Get all current filter values
    const previousTypeLogic = currentFilters.typeLogic;
    // Get filter input values
    const baseStatInputs = document.querySelectorAll('.basestat-filter-input');
    const yieldsInputs = document.querySelectorAll('.yields-filter-input');
    const additionalInfoInputs = document.querySelectorAll('.additionalInfo-filter-input');
    const breedingInputs = document.querySelectorAll('.breeding-filter-input');

    const baseStats = {
        hp: { min: '', max: '' },
        attack: { min: '', max: '' },
        defense: { min: '', max: '' },
        spAtk: { min: '', max: '' },
        spDef: { min: '', max: '' },
        speed: { min: '', max: '' }
    };

    const yields = {
        xp: { min: '', max: '' },
        hp: { min: '', max: '' },
        attack: { min: '', max: '' },
        defense: { min: '', max: '' },
        spAtk: { min: '', max: '' },
        spDef: { min: '', max: '' },
        speed: { min: '', max: '' },
        friendship: { min: '', max: '' }
    };

    const additionalInfo = {
        height: { min: '', max: '' },
        weight: { min: '', max: '' },
        catchRate: { min: '', max: '' },
        dexNumber: { min: '', max: '' }
    };

    const breeding = {
        eggGroups: Array.from(document.querySelectorAll('.eggGroup-filter-checkbox:checked')).map(cb => cb.value),
        eggCycles: { min: '', max: '' }
    };

    baseStatInputs.forEach(input => {
        const statIndex = parseInt(input.getAttribute('data-stat-index'));
        const minMax = input.getAttribute('data-minmax');
        const statName = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'][statIndex];
        const value = input.value.trim();
        if (value) {
            baseStats[statName][minMax] = parseInt(value);
        }
    });

    yieldsInputs.forEach(input => {
        const statIndex = parseInt(input.getAttribute('data-stat-index'));
        const minMax = input.getAttribute('data-minmax');
        const statName = ['xp', 'hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed', 'friendship'][statIndex];
        const value = input.value.trim();
        if (value) {
            yields[statName][minMax] = parseInt(value);
        }
    });

    // Process additional info inputs
    additionalInfoInputs.forEach(input => {
        const field = input.getAttribute('data-field');
        const minMax = input.getAttribute('data-minmax');
        const value = input.value.trim();
        if (value) {
            // Use parseFloat for height and weight, parseInt for others
            if (field === 'height' || field === 'weight') {
                additionalInfo[field][minMax] = parseFloat(value);
            } else {
                additionalInfo[field][minMax] = parseInt(value);
            }
        }
    });

    // Process breeding inputs
    breedingInputs.forEach(input => {
        const field = input.getAttribute('data-field');
        const minMax = input.getAttribute('data-minmax');
        const value = input.value.trim();
        if (value) {
            breeding[field][minMax] = parseInt(value);
        }
    });

    currentFilters = {
        search: document.getElementById('pokemon-search').value,
        types: Array.from(document.querySelectorAll('.type-filter-checkbox:checked')).map(cb => cb.value),
        typeLogic: previousTypeLogic,  // preserve the current type logic state
        typing: Array.from(document.querySelectorAll('.typing-filter-checkbox:checked')).map(cb => cb.value),
        shapes: Array.from(document.querySelectorAll('.shape-filter-checkbox:checked')).map(cb => cb.value),
        colors: Array.from(document.querySelectorAll('.color-filter-checkbox:checked')).map(cb => cb.value),
        generations: Array.from(document.querySelectorAll('.gen-filter-checkbox:checked'))
            .map(cb => cb.value)
            .filter(gen => gen.startsWith('gen')),
        baseStats: baseStats,
        yields: yields,
        additionalInfo: additionalInfo,
        breeding: breeding
    };
    
    console.log('Active filters:', currentFilters);
    
    // Apply all filters
    fetchPokemonList(
        currentFilters.search,
        currentFilters.types,
        currentFilters.typing,
        currentFilters.generations,
        currentFilters.shapes,
        currentFilters.colors,
        currentFilters.baseStats,
        currentFilters.yields
    );
}

// Initialize the page
function init() {
    renderTypeFilters();
    initTypeFilter();
    initSearch();
    fetchPokemonList();
}

init();
