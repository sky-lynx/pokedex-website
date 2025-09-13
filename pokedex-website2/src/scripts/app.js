// Import constants from constants.js
import {
    STAT_NAMES,
    CATEGORY_COLORS,
    TYPE_COLORS,
    GENERATION_RANGES,
    getTypeColor,
    isColorDark,
    POKEMON_SHAPES,
    POKEMON_COLORS,
    YIELD_NAMES,
    EGG_GROUPS,
    gameHeadersWithColors
} from './constants.js';

import { parseTSVData, parseMovesData } from './dataParser.js';
import { getPokemonGeneration } from './utils.js';
import { moveTableStates, toggleMoveTable, setupMoveTables } from './moveTable.js';
import { renderTypeFilters } from './templates.js';

/******************************************************************************
 * SECTION 1: DOM Elements and Basic Setup
 ******************************************************************************/

// DOM Elements
const pokemonListEl = document.getElementById('pokemon-list');
const modal = document.getElementById('pokemon-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');

// Initial DOM setup
pokemonListEl.classList.add('pokemon-grid');

// Links to tsv files
const dataTsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwDxqxofxdx7M2HU-pMFBFBcMDI6mIVBeVim1sxIC_zalARL4Z7DVNiPkhGwY4ZKmVpC9FETrjZtOH/pub?gid=1685697799&output=tsv';
const movesTsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwDxqxofxdx7M2HU-pMFBFBcMDI6mIVBeVim1sxIC_zalARL4Z7DVNiPkhGwY4ZKmVpC9FETrjZtOH/pub?gid=1813387196&output=tsv';

/******************************************************************************
 * SECTION 2: Global State Variables
 ******************************************************************************/

// Data Cache
let allPokemonData = null;       // Pokemon data from data.tsv
let allAbilitiesData = null;     // Pokemon abilities from abilities.tsv
let allMovesData = null;         // Pokemon moves from moves.tsv

// Track UI state 
let filtersEnabled = false;      // Track if filters are in use

/******************************************************************************
 * SECTION 3: Data Loading Functions
 ******************************************************************************/

// Duplicate declarations removed to avoid errors

/******************************************************************************
 * SECTION 5: UI Functions
 ******************************************************************************/

window.toggleMoveTable = toggleMoveTable;

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

/******************************************************************************
 * SECTION 4: Data Processing Functions
 ******************************************************************************/

/**
 * Parses TSV data into an array of Pokemon objects
 * @param {string} tsvText - Raw TSV file content
 * @returns {Array} Array of Pokemon objects
 */

// Fetch Pokemon data from TSV filedata
async function fetchPokemonList(filter = '', typeFilterArr = null, typingFilterArr = null, genFilterArr = null, shapeFilterArr = null, colorFilterArr = null, baseStatsFilter = null, yieldsFilter = null) {
    let filtered = [];
    try {
        if (!allPokemonData) {
            const res = await fetch(dataTsvUrl);
            if (!res.ok) {
                throw new Error(`Failed to fetch data.tsv: ${res.status}`);
            }
            allPokemonData = await parseTSVData();
            if (!Array.isArray(allPokemonData) || allPokemonData.length === 0) {
                throw new Error('No Pokemon data found or invalid data format');
            }
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
            const res = await fetch('../../api/abilities.tsv');
            if (!res.ok) {
                throw new Error(`Failed to fetch abilities.tsv: ${res.status}`);
            }
            allAbilitiesData = await parseTSVData();
            console.log('Loaded abilities data:', allAbilitiesData); // Debug log
        } catch (error) {
            console.error('Error loading abilities data:', error);
            allAbilitiesData = [];
        }
    }
    return allAbilitiesData;
}

// Show Pokemon details in modal
// Fetch moves data from TSV
async function fetchMovesData() {
    if (!allMovesData) {
        try {
            const isGitHubPages = window.location.hostname === 'sky-lynx.github.io' || window.location.pathname.includes('/pokedex-website/');
            const baseUrl = isGitHubPages ? '/pokedex-website' : '';
            const res = await fetch(movesTsvUrl);
            if (!res.ok) {
                throw new Error(`Failed to fetch moves.tsv: ${res.status}`);
            }
            const tsvText = await res.text();
            allMovesData = await parseMovesData();
        } catch (error) {
            console.error('Error loading moves data:', error);
            return [];
        }
    }
    return allMovesData;
}

async function showPokemonDetails(pokemonName) {
    if (!allPokemonData || !allAbilitiesData || !allMovesData) {
        await Promise.all([
            fetchPokemonList(
                currentFilters.search,
                currentFilters.types,
                currentFilters.typing,
                currentFilters.generations
            ),
            fetchAbilitiesData(),
            fetchMovesData()
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

    // Game headers for availability section
    const gameHeadersWithColors = [
        { text: 'R', color: '#FF1111' },     // Red
        { text: 'G', color: '#1111FF' },     // Blue
        { text: 'B', color: '#11FF11' },     // Green
        { text: 'Y', color: '#FFD733' },     // Yellow
        { text: 'G', color: '#DAA520' },     // Gold
        { text: 'S', color: '#C0C0C0' },     // Silver
        { text: 'C', color: '#4FD9FF' },     // Crystal
        { text: 'R', color: '#A00000' },     // Ruby
        { text: 'S', color: '#0000A0' },     // Sapphire
        { text: 'E', color: '#00A000' },     // Emerald
        { text: 'FR', color: '#FF7327' },    // FireRed
        { text: 'LG', color: '#00DD00' },    // LeafGreen
        { text: 'D', color: '#5060B0' },     // Diamond
        { text: 'P', color: '#FF99CC' },     // Pearl
        { text: 'PL', color: '#999999' },    // Platinum
        { text: 'HG', color: '#B69E00' },    // HeartGold
        { text: 'SS', color: '#C0C0E1' },    // SoulSilver
        { text: 'B', color: '#444444' },     // Black
        { text: 'W', color: '#E1E1E1' },     // White
        { text: 'B2', color: '#444444' },    // Black 2
        { text: 'W2', color: '#E1E1E1' },    // White 2
        { text: 'X', color: '#87CEEB' },     // Sky Blue
        { text: 'Y', color: '#B22222' },     // Blood Red
        { text: 'OA', color: '#A00000' },    // Omega Ruby
        { text: 'AS', color: '#0000A0' },    // Alpha Sapphire
        { text: 'S', color: '#FF8C00' },     // Sun
        { text: 'M', color: '#4169E1' },     // Moon
        { text: 'US', color: '#FF8C00' },    // Ultra Sun
        { text: 'UM', color: '#4169E1' },    // Ultra Moon
        { text: 'LGP', color: '#FFD700' },   // Pikachu Yellow
        { text: 'LGE', color: '#D2B48C' },   // Eevee Tan
        { text: 'SW', color: '#1E90FF' },    // Whirlpool Blue
        { text: 'SH', color: '#CD5C5C' },    // Ruby Red
        { text: 'SW\nIoA', color: '#F4A460' }, // Sandy Yellow
        { text: 'SH\nIoA', color: '#F4A460' }, // Sandy Yellow
        { text: 'SW\nCT', color: '#90EE90' }, // Desaturated Green
        { text: 'SH\nCT', color: '#90EE90' }, // Desaturated Green
        { text: 'BD', color: '#4F97D3' },    // Brilliant Diamond
        { text: 'SP', color: '#F2A2E8' },    // Shining Pearl
        { text: 'PLA', color: '#4682B4' },   // Old Blue
        { text: 'S', color: '#FF2400' },     // Scarlet
        { text: 'V', color: '#8F00FF' },     // Violet
        { text: 'S\nTM', color: '#008080' }, // Teal
        { text: 'V\nTM', color: '#008080' }, // Teal
        { text: 'S\nID', color: '#4B0082' }, // Indigo
        { text: 'T\nID', color: '#4B0082' }  // Indigo
    ];

    const gameHeaders = gameHeadersWithColors.map(h => h.text);

    const availabilityHTML = `
        <div class="info-section" style="grid-column: 1 / -1; margin-top: 16px;">
            <h4>Game Availability</h4>
            <h5>TFO: Transfer Only</h5>
            <div style="overflow-x: auto;">
                <div style="margin-bottom: 8px;">
                    <div style="display: grid; grid-template-columns: repeat(23, minmax(24px, 1fr)); gap: 2px; font-size: 0.8em; text-align: center;">
                        ${gameHeadersWithColors.slice(0, 23).map(({ text, color }) => `
                            <div style="padding: 4px 2px; background: ${color}; color: ${isColorDark(color) ? '#fff' : '#000'}; white-space: pre-line; border-radius: 4px; height: 32px; display: flex; align-items: center; justify-content: center;" title="${text}">${text}</div>
                        `).join('')}
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(23, minmax(24px, 1fr)); gap: 2px; font-size: 0.8em; text-align: center; margin-top: 1px;">
                        ${pokemon.availability.slice(0, 23).map(available => `
                            <div style="padding: 4px 2px; background: ${
                                available === 'TRUE' ? '#e8f5e9' : 
                                available === 'FALSE' ? '#fff3e0' : 
                                '#ffebee'
                            }; border-radius: 4px;">
                                ${available === 'TRUE' ? '✔' : 
                                  available === 'FALSE' ? 'TFO' : 
                                  '✖'}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <div style="display: grid; grid-template-columns: repeat(23, minmax(24px, 1fr)); gap: 2px; font-size: 0.8em; text-align: center;">
                        ${gameHeadersWithColors.slice(23).map(({ text, color }) => `
                            <div style="padding: 4px 2px; background: ${color}; color: ${isColorDark(color) ? '#fff' : '#000'}; white-space: pre-line; border-radius: 4px; height: 32px; display: flex; align-items: center; justify-content: center;" title="${text}">${text}</div>
                        `).join('')}
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(23, minmax(24px, 1fr)); gap: 2px; font-size: 0.8em; text-align: center; margin-top: 1px;">
                        ${pokemon.availability.slice(23, 46).map(available => `
                            <div style="padding: 4px 2px; background: ${
                                available === 'TRUE' ? '#e8f5e9' : 
                                available === 'FALSE' ? '#fff3e0' : 
                                '#ffebee'
                            }; border-radius: 4px;">
                                ${available === 'TRUE' ? '✔' : 
                                  available === 'FALSE' ? 'TFO' : 
                                  '✖'}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

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
            ${availabilityHTML}

            <div class="info-section" style="grid-column: 1 / -1; margin-top: 24px;">
                <style>
                    .moves-table th {
                        padding: 8px;
                        border-bottom: 2px solid #ddd;
                    }
                    .move-category-btn.active {
                        background: #4CAF50 !important;
                        color: white;
                        border-color: #45a049 !important;
                    }
                    .move-category-btn:hover {
                        background: #f8f8f8;
                    }
                    .move-category-btn.active:hover {
                        background: #45a049 !important;
                    }
                    .moves-table th:nth-child(1) { width: 8%; }  /* Level */
                    .moves-table th:nth-child(2) { width: 15%; } /* Move */
                    .moves-table th:nth-child(3) { width: 10%; } /* Type */
                    .moves-table th:nth-child(4) { width: 10%; } /* Category */
                    .moves-table th:nth-child(5) { width: 7%; }  /* PP */
                    .moves-table th:nth-child(6) { width: 10%; } /* Power */
                    .moves-table th:nth-child(7) { width: 10%; } /* Accuracy */
                    .moves-table th:nth-child(8) { width: 10%; } /* Crit Rate */
                    .moves-table th:nth-child(9) { width: 10%; } /* Priority */
                    .moves-table th:nth-child(10) { width: 10%; } /* Target */
                    .moves-table td {
                        padding: 8px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                </style>
                <div style="display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 16px;">
                    <h3 style="margin-bottom: 8px;">Moves</h3>
                    <div class="moves-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button id="level-up-btn" class="move-category-btn active" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; font-size: 0.9em;">Level Moves</button>
                        <button id="tm-btn" class="move-category-btn" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; font-size: 0.9em;">TM Moves</button>
                        <button id="egg-btn" class="move-category-btn" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; font-size: 0.9em;">Egg Moves</button>
                        <button id="evolution-btn" class="move-category-btn" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; font-size: 0.9em;">Evolution Moves</button>
                        <button id="reminder-btn" class="move-category-btn" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; font-size: 0.9em;">Reminder Moves</button>
                    </div>
                </div>


                <div id="level-up-section">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <h4 style="margin: 0;">Level-up Moves</h4>
                        <button onclick="window.toggleMoveTable('levelUp')" style="padding: 4px 8px; background: none; border: none; cursor: pointer; font-size: 1.2em;">
                            <span id="levelUp-collapse-icon">${moveTableStates.levelUp ? '▼' : '▲'}</span>
                        </button>
                    </div>
                    <div id="levelUp-table-container" style="overflow-x: auto; display: ${moveTableStates.levelUp ? 'none' : 'block'};">
                        <table class="moves-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9em;">
                        <style>
                            tr {
                                transition: background-color 0.1s ease-out;
                                background-color: transparent;
                            }
                            tr:hover {
                                background-color: #f0f0f0;
                            }
                        </style>
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Level</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Move</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Type</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Category</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">PP</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Power</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Accuracy</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Crit Rate</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Priority</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                const levelMoves = pokemon.moves.levelUp?.split('|').filter(move => move) || [];
                                console.log('Parsed moves:', levelMoves); // Debug log

                                if (levelMoves.length === 0) {
                                    return `
                                        <tr>
                                            <td colspan="10" style="padding: 12px; text-align: center; color: #888;">
                                                No moves found
                                            </td>
                                        </tr>
                                    `;
                                }

                                return levelMoves.map(moveData => {
                                    const [moveId, level] = moveData.split('-');
                                    const move = allMovesData?.find(m => m.id === moveId);
                                    if (!move) return '';
                                    
                                    // Helper function to format move values
                                    const formatMoveValue = (value) => {
                                        return (!value) ? '-' : value;
                                    };
                                    
                                    const encodedMoveName = encodeURIComponent(move.name);
                                    return `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 8px;">${level}</td>
                                            <td style="padding: 8px;"><a href="moveDex.html?name=${encodedMoveName}" style="color: #2196F3; text-decoration: none; cursor: pointer; hover: { text-decoration: underline; }">${move.name}</a></td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${getTypeColor(move.type)}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.type}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${CATEGORY_COLORS[move.category]}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.category}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">${move.pp}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.power))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.accuracy))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseFloat(move.critRate))}</td>
                                            <td style="padding: 8px;">${move.priority}</td>
                                            <td style="padding: 8px;">${move.target}</td>
                                        </tr>
                                    `;
                                }).join('');
                            })()}
                        </tbody>
                    </table>
                </div>
                </div>

                <div id="tm-section">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <h4 style="margin: 0;">TM Moves</h4>
                        <button onclick="window.toggleMoveTable('tm')" style="padding: 4px 8px; background: none; border: none; cursor: pointer; font-size: 1.2em;">
                            <span id="tm-collapse-icon">${moveTableStates.tm ? '▼' : '▲'}</span>
                        </button>
                    </div>
                    <div id="tm-table-container" style="overflow-x: auto; display: ${moveTableStates.tm ? 'none' : 'block'};">
                        <table class="moves-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9em;">
                        <style>
                            tr {
                                transition: background-color 0.1s ease-out;
                                background-color: transparent;
                            }
                            tr:hover {
                                background-color: #f0f0f0;
                            }
                        </style>
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Level</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Move</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Type</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Category</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">PP</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Power</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Accuracy</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Crit Rate</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Priority</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                const tmMoves = pokemon.moves.tm?.split('|').filter(move => move) || [];
                                console.log('Parsed moves:', tmMoves); // Debug log

                                if (tmMoves.length === 0) {
                                    return `
                                        <tr>
                                            <td colspan="10" style="padding: 12px; text-align: center; color: #888;">
                                                No moves found
                                            </td>
                                        </tr>
                                    `;
                                }

                                return tmMoves.map(moveData => {
                                    const [moveId, level] = moveData.split('-');
                                    const move = allMovesData?.find(m => m.id === moveId);
                                    if (!move) return '';
                                    
                                    // Helper function to format move values
                                    const formatMoveValue = (value) => {
                                        return (!value) ? '-' : value;
                                    };
                                    
                                    const encodedMoveName = encodeURIComponent(move.name);
                                    return `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 8px;">${level}</td>
                                            <td style="padding: 8px;"><a href="moveDex.html?name=${encodedMoveName}" style="color: #2196F3; text-decoration: none; cursor: pointer; hover: { text-decoration: underline; }">${move.name}</a></td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${getTypeColor(move.type)}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.type}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${CATEGORY_COLORS[move.category]}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.category}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">${move.pp}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.power))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.accuracy))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseFloat(move.critRate))}</td>
                                            <td style="padding: 8px;">${move.priority}</td>
                                            <td style="padding: 8px;">${move.target}</td>
                                        </tr>
                                    `;
                                }).join('');
                            })()}
                        </tbody>
                    </table>
                </div>
                </div>

                <div id="egg-section">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <h4 style="margin: 0;">Egg Moves</h4>
                        <button onclick="window.toggleMoveTable('egg')" style="padding: 4px 8px; background: none; border: none; cursor: pointer; font-size: 1.2em;">
                            <span id="egg-collapse-icon">${moveTableStates.egg ? '▼' : '▲'}</span>
                        </button>
                    </div>
                    <div id="egg-table-container" style="overflow-x: auto; display: ${moveTableStates.egg ? 'none' : 'block'};">
                        <table class="moves-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9em;">
                        <style>
                            tr {
                                transition: background-color 0.1s ease-out;
                                background-color: transparent;
                            }
                            tr:hover {
                                background-color: #f0f0f0;
                            }
                        </style>
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Level</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Move</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Type</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Category</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">PP</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Power</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Accuracy</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Crit Rate</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Priority</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                const eggMoves = pokemon.moves.egg?.split('|').filter(move => move) || [];
                                console.log('Parsed moves:', eggMoves); // Debug log

                                if (eggMoves.length === 0) {
                                    return `
                                        <tr>
                                            <td colspan="10" style="padding: 12px; text-align: center; color: #888;">
                                                No moves found
                                            </td>
                                        </tr>
                                    `;
                                }

                                return eggMoves.map(moveData => {
                                    const [moveId, level] = moveData.split('-');
                                    const move = allMovesData?.find(m => m.id === moveId);
                                    if (!move) return '';
                                    
                                    // Helper function to format move values
                                    const formatMoveValue = (value) => {
                                        return (!value) ? '-' : value;
                                    };
                                    
                                    const encodedMoveName = encodeURIComponent(move.name);
                                    return `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 8px;">${level}</td>
                                            <td style="padding: 8px;"><a href="moveDex.html?name=${encodedMoveName}" style="color: #2196F3; text-decoration: none; cursor: pointer; hover: { text-decoration: underline; }">${move.name}</a></td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${getTypeColor(move.type)}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.type}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${CATEGORY_COLORS[move.category]}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.category}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">${move.pp}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.power))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.accuracy))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseFloat(move.critRate))}</td>
                                            <td style="padding: 8px;">${move.priority}</td>
                                            <td style="padding: 8px;">${move.target}</td>
                                        </tr>
                                    `;
                                }).join('');
                            })()}
                        </tbody>
                    </table>
                </div>
                </div>

                <div id="evolution-section">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <h4 style="margin: 0;">Evolution Moves</h4>
                        <button onclick="window.toggleMoveTable('evolution')" style="padding: 4px 8px; background: none; border: none; cursor: pointer; font-size: 1.2em;">
                            <span id="evolution-collapse-icon">${moveTableStates.evolution ? '▼' : '▲'}</span>
                        </button>
                    </div>
                    <div id="evolution-table-container" style="overflow-x: auto; display: ${moveTableStates.evolution ? 'none' : 'block'};">
                        <table class="moves-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9em;">
                        <style>
                            tr {
                                transition: background-color 0.1s ease-out;
                                background-color: transparent;
                            }
                            tr:hover {
                                background-color: #f0f0f0;
                            }
                        </style>
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Level</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Move</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Type</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Category</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">PP</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Power</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Accuracy</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Crit Rate</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Priority</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                const evoMoves = pokemon.moves.evolution?.split('|').filter(move => move) || [];
                                console.log('Parsed moves:', evoMoves); // Debug log

                                if (evoMoves.length === 0) {
                                    return `
                                        <tr>
                                            <td colspan="10" style="padding: 12px; text-align: center; color: #888;">
                                                No moves found
                                            </td>
                                        </tr>
                                    `;
                                }

                                return evoMoves.map(moveData => {
                                    const [moveId, level] = moveData.split('-');
                                    const move = allMovesData?.find(m => m.id === moveId);
                                    if (!move) return '';
                                    
                                    // Helper function to format move values
                                    const formatMoveValue = (value) => {
                                        return (!value) ? '-' : value;
                                    };
                                    
                                    return `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 8px;">${level}</td>
                                            <td style="padding: 8px;">${move.name}</td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${getTypeColor(move.type)}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.type}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${CATEGORY_COLORS[move.category]}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.category}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">${move.pp}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.power))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.accuracy))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseFloat(move.critRate))}</td>
                                            <td style="padding: 8px;">${move.priority}</td>
                                            <td style="padding: 8px;">${move.target}</td>
                                        </tr>
                                    `;
                                }).join('');
                            })()}
                        </tbody>
                    </table>
                </div>
                </div>

                <div id="reminder-section">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <h4 style="margin: 0;">Reminder Moves</h4>
                        <button onclick="window.toggleMoveTable('reminder')" style="padding: 4px 8px; background: none; border: none; cursor: pointer; font-size: 1.2em;">
                            <span id="reminder-collapse-icon">${moveTableStates.reminder ? '▼' : '▲'}</span>
                        </button>
                    </div>
                    <div id="reminder-table-container" style="overflow-x: auto; display: ${moveTableStates.reminder ? 'none' : 'block'};">
                        <table class="moves-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9em;">
                        <style>
                            tr {
                                transition: background-color 0.1s ease-out;
                                background-color: transparent;
                            }
                            tr:hover {
                                background-color: #f0f0f0;
                            }
                        </style>
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Level</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Move</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Type</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Category</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">PP</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Power</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Accuracy</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Crit Rate</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Priority</th>
                                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                const reminderMoves = pokemon.moves.reminder?.split('|').map(move => move.trim()).filter(move => move) || [];
                                console.log('Parsed moves:', reminderMoves); // Debug log

                                if (reminderMoves.length === 0) {
                                    return `
                                        <tr>
                                            <td colspan="10" style="padding: 12px; text-align: center; color: #888;">
                                                No moves found
                                            </td>
                                        </tr>
                                    `;
                                }

                                return reminderMoves.map(moveData => {
                                    const [moveId, level] = moveData.split('-');
                                    const move = allMovesData?.find(m => m.id === moveId);
                                    if (!move) return '';
                                    
                                    // Helper function to format move values
                                    const formatMoveValue = (value) => {
                                        return (!value) ? '-' : value;
                                    };
                                    
                                    const encodedMoveName = encodeURIComponent(move.name);
                                    return `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 8px;">${level}</td>
                                            <td style="padding: 8px;"><a href="moveDex.html?name=${encodedMoveName}" style="color: #2196F3; text-decoration: none; cursor: pointer; hover: { text-decoration: underline; }">${move.name}</a></td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${getTypeColor(move.type)}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.type}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">
                                                <div class="type-pill" style="background-color: ${CATEGORY_COLORS[move.category]}; margin: 0 auto; display: flex; justify-content: center; align-items: center; min-width: 40px;">
                                                    ${move.category}
                                                </div>
                                            </td>
                                            <td style="padding: 8px;">${move.pp}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.power))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseInt(move.accuracy))}</td>
                                            <td style="padding: 8px;">${formatMoveValue(parseFloat(move.critRate))}</td>
                                            <td style="padding: 8px;">${move.priority}</td>
                                            <td style="padding: 8px;">${move.target}</td>
                                        </tr>
                                    `;
                                }).join('');
                            })()}
                        </tbody>
                    </table>
                </div>
                </div>
            </div>
        </div>

    `;
    modal.style.display = 'flex';

    // Set up moves toggle functionality
    setupMoveTables();
    
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

/******************************************************************************
 * SECTION 6: Event Handlers
 ******************************************************************************/

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

// Check URL for pokemon name parameter
function checkUrlForPokemon() {
    const urlParams = new URLSearchParams(window.location.search);
    const pokemonName = urlParams.get('name');
    if (pokemonName) {
        // Decode the URL-encoded name and format it
        const decodedName = decodeURIComponent(pokemonName);
        // Format each word to have first letter uppercase
        const formattedName = decodedName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        // Wait for data to be loaded before showing details
        const checkDataAndShow = async () => {
            if (!allPokemonData) {
                await new Promise(resolve => setTimeout(resolve, 100));
                await checkDataAndShow();
            } else {
                const pokemon = allPokemonData.find(p => p.name === formattedName);
                if (pokemon) {
                    showPokemonDetails(formattedName);
                }
            }
        };
        checkDataAndShow();
    }
}

/******************************************************************************
 * SECTION 7: Initialization
 ******************************************************************************/

// Initialize the page
function init() {
    renderTypeFilters();
    initTypeFilter();
    initSearch();
    fetchPokemonList().then(() => {
        // Check for pokemon name in URL after data is loaded
        checkUrlForPokemon();
    });
}

init();
