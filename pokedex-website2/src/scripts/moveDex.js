
import { TYPE_COLORS, getTypeColor, isColorDark, CATEGORY_COLORS} from './constants.js';
import { parseTSVData, parseMovesData, currentDataSource } from './dataParser.js';

// Function to display data source
function displayDataSource() {
    const dataSourceDiv = document.createElement('div');
    dataSourceDiv.style.textAlign = 'center';
    dataSourceDiv.style.padding = '8px';
    dataSourceDiv.style.backgroundColor = '#f0f0f0';
    dataSourceDiv.style.borderBottom = '1px solid #ccc';
    dataSourceDiv.textContent = `Current Data Source: ${currentDataSource}`;
    document.body.insertBefore(dataSourceDiv, document.body.firstChild);
}

// Column configurations
const COLUMN_CONFIG = [
    { id: 'name', header: 'Name', width: '1%' },
    { id: 'type', header: 'Type', width: '8%' },
    { id: 'category', header: 'Category', width: '8%' },
    { id: 'pp', header: 'PP', width: '7%', align: 'center' },
    { id: 'power', header: 'Power', width: '7%', align: 'center' },
    { id: 'accuracy', header: 'Accuracy', width: '7%', align: 'center' },
    { id: 'critRate', header: 'Crit Rate', width: '7%', align: 'center' },
    { id: 'priority', header: 'Priority', width: '7%', align: 'center' },
    { id: 'target', header: 'Target', width: '10%' },
    { id: 'effect', header: 'Effect', width: '20%' },
    { id: 'chance', header: 'Chance', width: '4%', align: 'center' }
];

// DOM Elements
const movesList = document.getElementById('moves-list');
const searchBox = document.getElementById('search-box');
const modal = document.getElementById('move-modal');
const modalBody = document.getElementById('move-modal-body');
const closeBtn = document.querySelector('.close-btn');

let allMovesData = null;
let filtersEnabled = false;

// Track collapsed state of the pokemon list
let pokemonTableCollapsed = false;

let currentFilters = {
    search: '',
    types: Object.keys(TYPE_COLORS),  // start with all types selected
    categories: Object.keys(CATEGORY_COLORS),  // start with all categories selected
    power: { min: '', max: '' },
    accuracy: { min: '', max: '' },
    priority: { min: '', max: '' }
};

// Function to toggle pokemon table visibility
window.togglePokemonTable = function() {
    pokemonTableCollapsed = !pokemonTableCollapsed;
    const container = document.getElementById('pokemon-table-container');
    const icon = document.getElementById('pokemon-table-collapse-icon');
    if (container && icon) {
        container.style.display = pokemonTableCollapsed ? 'none' : 'block';
        icon.textContent = pokemonTableCollapsed ? '▼' : '▲';
    }
};

// Fetch moves data from TSV
async function fetchMovesData() {
    if (allMovesData) {
        return allMovesData;
    }

    try {
        const isGitHubPages = window.location.hostname === 'sky-lynx.github.io' || window.location.pathname.includes('/pokedex-website/');
        const baseUrl = isGitHubPages ? '/pokedex-website' : '';
        const res = await fetch(`${baseUrl}/api/moves.tsv`);
        if (!res.ok) {
            throw new Error(`Failed to fetch moves.tsv: ${res.status}`);
        }
        const tsvText = await res.text();
        allMovesData = await parseMovesData();
        return allMovesData;
    } catch (error) {
        console.error('Error loading moves data:', error);
        return [];
    }
}

// Render move filters - following the same pattern as renderTypeFilters
function renderMoveFilters() {
    const moveFiltersEl = document.getElementById('move-filters');
    if (!moveFiltersEl) return;
    moveFiltersEl.innerHTML = `
        <div style="display:inline-block;position:relative;text-align:left;">

            <button id="move-filter-btn" style="padding:7px 16px;border-radius:8px;border:1px solid #bbb;background:#f8f8f8;cursor:pointer;font-size:1em;">
                Filters
            </button>
            <div id="move-filter-dropdown" style="display:none;position:absolute;left:0;top:110%;background:#fff;border:1px solid #bbb;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.10);padding:16px;z-index:20;min-width:300px;text-align:left;">
                <div id="filter-buttons" style="display:flex;gap:12px;margin-bottom:16px;">
                    <button id="move-filter-select-all" style="padding:4px 12px;border-radius:6px;border:1px solid #bbb;background:#e3f2fd;cursor:pointer;font-size:0.95em;flex:1;">Select All</button>
                    <button id="move-filter-deselect-all" style="padding:4px 12px;border-radius:6px;border:1px solid #bbb;background:#f8bbd0;cursor:pointer;font-size:0.95em;flex:1;">Deselect All</button>
                </div>

                <div style="margin-bottom:16px;">
                    <button id="move-clear-filters" style="width:100%;padding:4px 12px;border-radius:6px;border:1px solid #bbb;background:#f8bbd0;cursor:pointer;font-size:0.95em;">Clear All Filters</button>
                </div>

                <div id="types-section" class="filter-section" style="display:block;">
                    <div style="font-weight:600;margin-bottom:12px;color:#666;">Types</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    ${Object.keys(TYPE_COLORS).map(type =>
                        `<label style="display:inline-flex;align-items:center;gap:2px;margin-bottom:4px;">
                            <input type="checkbox" class="type-filter-checkbox" value="${type}" checked>
                            <span style="background:${getTypeColor(type)};color:#fff;padding:2px 10px;border-radius:12px;font-size:0.95em;">${type}</span>
                        </label>`
                    ).join('')}
                    </div>
                </div>

                <div id="categories-section" class="filter-section" style="margin-top:16px;">
                    <div style="font-weight:600;margin-bottom:12px;color:#666;">Categories</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    ${Object.keys(CATEGORY_COLORS).map(category =>
                        `<label style="display:inline-flex;align-items:center;gap:2px;margin-bottom:4px;">
                            <input type="checkbox" class="category-filter-checkbox" value="${category}" checked>
                            <span style="background:${CATEGORY_COLORS[category]};color:#fff;padding:2px 10px;border-radius:12px;font-size:0.95em;">${category}</span>
                        </label>`
                    ).join('')}
                    </div>
                </div>

                <div id="stats-section" class="filter-section" style="margin-top:16px;">
                    <div style="font-weight:600;margin-bottom:12px;color:#666;">Stats</div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div style="display:flex;flex-direction:column;gap:4px;">
                            <div style="color:#666;font-size:0.9em;">Power</div>
                            <div style="display:flex;gap:8px;">
                                <input type="number" id="min-power" min="0" max="255" placeholder="Min"
                                       style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                <input type="number" id="max-power" min="0" max="255" placeholder="Max"
                                       style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:4px;">
                            <div style="color:#666;font-size:0.9em;">Accuracy</div>
                            <div style="display:flex;gap:8px;">
                                <input type="number" id="min-accuracy" min="0" max="100" placeholder="Min"
                                       style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                <input type="number" id="max-accuracy" min="0" max="100" placeholder="Max"
                                       style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:4px;">
                            <div style="color:#666;font-size:0.9em;">Priority</div>
                            <div style="display:flex;gap:8px;">
                                <input type="number" id="min-priority" min="-7" max="7" placeholder="Min"
                                       style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                                <input type="number" id="max-priority" min="-7" max="7" placeholder="Max"
                                       style="width:60px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Apply filters to moves list
function filterMoves(moves) {
    return moves.filter(move => {
        // Search filter
        if (currentFilters.search && !move.name.toLowerCase().includes(currentFilters.search.toLowerCase())) {
            return false;
        }

        // Type filter
        if (currentFilters.types.length > 0 && !currentFilters.types.includes(move.type)) {
            return false;
        }

        // Category filter
        if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(move.category)) {
            return false;
        }

        // Power range filter
        const power = parseInt(move.power);
        if (!isNaN(power)) {
            if (currentFilters.power.min && power < parseInt(currentFilters.power.min)) return false;
            if (currentFilters.power.max && power > parseInt(currentFilters.power.max)) return false;
        }

        // Accuracy range filter
        const accuracy = parseInt(move.accuracy);
        if (!isNaN(accuracy)) {
            if (currentFilters.accuracy.min && accuracy < parseInt(currentFilters.accuracy.min)) return false;
            if (currentFilters.accuracy.max && accuracy > parseInt(currentFilters.accuracy.max)) return false;
        }

        // Priority range filter
        const priority = parseInt(move.priority);
        if (!isNaN(priority)) {
            if (currentFilters.priority.min && priority < parseInt(currentFilters.priority.min)) return false;
            if (currentFilters.priority.max && priority > parseInt(currentFilters.priority.max)) return false;
        }

        return true;
    });
}

// Show move details in modal
function showMoveDetails(moveName) {
    const move = allMovesData.find(m => m.name === moveName);
    if (!move) return;

    modalBody.innerHTML = `
        <div class="move-header">
            <h2>${move.name}</h2>
            <div class="move-header-details">
                <div class="type-pill" style="background-color: ${getTypeColor(move.type)};">
                    ${move.type}
                </div>
                <div class="type-pill" style="background-color: ${CATEGORY_COLORS[move.category]};">
                    ${move.category}
                </div>
            </div>
        </div>
        <hr>
        <div class="move-details">
            <div class="modal-grid">
                <div class="modal-left">
                    <div class="move-stats">
                        <div class="move-stat-item">
                            <span class="move-stat-label">PP:</span>
                            <span class="move-stat-value">${move.pp}</span>
                        </div>
                        <div class="move-stat-item">
                            <span class="move-stat-label">Power:</span>
                            <span class="move-stat-value">${move.power}</span>
                        </div>
                        <div class="move-stat-item">
                            <span class="move-stat-label">Accuracy:</span>
                            <span class="move-stat-value">${move.accuracy}</span>
                        </div>
                        <div class="move-stat-item">
                            <span class="move-stat-label">Crit Rate:</span>
                            <span class="move-stat-value">${move.critRate}</span>
                        </div>
                        <div class="move-stat-item">
                            <span class="move-stat-label">Priority:</span>
                            <span class="move-stat-value">${move.priority}</span>
                        </div>
                        <div class="move-stat-item">
                            <span class="move-stat-label">Target:</span>
                            <span class="move-stat-value">${move.target}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-right">
                    <h3>Effect</h3>
                    ${move.effect && move.effect !== '-' ? 
                        `<p>${move.effect}</p>` : 
                        `<p class="no-effect">No Secondary Effect</p>`}
                    ${move.chance !== '-' ? `<p><strong>Effect Chance:</strong> ${move.chance}</p>` : ''}
                </div>
            </div>
            <hr>
            <div class="pokemon-list">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <h3 style="margin: 0;">Pokémon that can learn ${move.name}</h3>
                    <button onclick="window.togglePokemonTable()" style="background: none; border: none; cursor: pointer; font-size: 1.2em; display: inline-flex; align-items: center; padding: 0 8px; height: 24px;">
                        <span id="pokemon-table-collapse-icon" style="line-height: 1;">${pokemonTableCollapsed ? '▼' : '▲'}</span>
                    </button>
                </div>
                <div id="pokemon-table-container" class="pokemon-table-container" style="display: ${pokemonTableCollapsed ? 'none' : 'block'};">
                    <table class="pokemon-table">
                        <thead>
                            <tr>
                                <th>Dex #</th>
                                <th>Pokémon</th>
                                <th>Type</th>
                                <th>Learn Method</th>
                                <th>HP</th>
                                <th>Atk</th>
                                <th>Def</th>
                                <th>SpA</th>
                                <th>SpD</th>
                                <th>Spe</th>
                            </tr>
                        </thead>
                        <tbody id="pokemon-list-body">
                            <tr>
                                <td colspan="10" style="text-align: center; padding: 20px;">Loading Pokémon data...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    loadPokemonForMove(move.name);
}

async function loadPokemonForMove(moveName) {
    try {
        const data = await parseTSVData();
        if (!data || !data.length) throw new Error('No Pokémon data found');
        
        const pokemonList = [];
        const moveId = allMovesData.find(m => m.name === moveName)?.id;
        if (!moveId) throw new Error('Move ID not found');

        for (const pokemon of data) {
            // Check each move source (Level Up, TM, Egg Move, Evolution, Move Reminder)
            const moveInfo = [
                { moves: pokemon.moves.levelUp || '', type: 'Level' },
                { moves: pokemon.moves.tm || '', type: 'TM' },
                { moves: pokemon.moves.egg || '', type: 'EM' },
                { moves: pokemon.moves.evolution || '', type: 'EV' },
                { moves: pokemon.moves.reminder || '', type: 'RE' }
            ];

            let foundMethod = '';
            for (const source of moveInfo) {
                const moves = source.moves.split('|').filter(m => m); // Filter out empty strings
                const moveData = moves.find(move => {
                    const [id] = move.split('-');
                    return id === moveId;
                });

                if (moveData) {
                    const [_, methodInfo] = moveData.split('-');
                    switch (source.type) {
                        case 'Level': 
                            foundMethod = `Level ${methodInfo}`;
                            break;
                        case 'TM': foundMethod = 'TM'; break;
                        case 'EM': foundMethod = 'Egg Move'; break;
                        case 'EV': foundMethod = 'Evolution'; break;
                        case 'RE': foundMethod = 'Reminder'; break;
                    }
                    break;
                }
            }

            if (foundMethod) {
                pokemonList.push({
                    id: pokemon.id,
                    name: pokemon.name,
                    type: pokemon.type,
                    hp: pokemon.baseStats[0],
                    atk: pokemon.baseStats[1],
                    def: pokemon.baseStats[2],
                    spa: pokemon.baseStats[3],
                    spd: pokemon.baseStats[4],
                    spe: pokemon.baseStats[5],
                    learnMethod: foundMethod
                });
            }
        }
        
        // Update the table with the found Pokémon
        const tableBody = document.getElementById('pokemon-list-body');
        if (pokemonList.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">No Pokémon found that can learn this move.</td></tr>';
            return;
        }
        
        // Sort Pokémon by Dex number
        pokemonList.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        
        tableBody.innerHTML = pokemonList.map(pokemon => {
            const encodedPokemonName = encodeURIComponent(pokemon.name);
            return `
            <tr>
                <td>#${String(pokemon.id).padStart(3, '0')}</td>
                <td><a href="index.html?name=${encodedPokemonName}" style="color: #2196F3; text-decoration: none; cursor: pointer; hover: { text-decoration: underline; }">${pokemon.name}</a></td>
                <td>
                    ${pokemon.type.map(type => `<div class="type-pill" style="background-color: ${getTypeColor(type)};">${type}</div>`).join('')}
                </td>
                <td>${pokemon.learnMethod}</td>
                <td>${pokemon.hp}</td>
                <td>${pokemon.atk}</td>
                <td>${pokemon.def}</td>
                <td>${pokemon.spa}</td>
                <td>${pokemon.spd}</td>
                <td>${pokemon.spe}</td>
            </tr>
        `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading Pokémon data:', error);
        const tableBody = document.getElementById('pokemon-list-body');
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Error loading Pokémon data.</td></tr>';
    }
}

// Display moves in the table
function displayMoves(moves) {
    const table = `
        <table class="moves-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>PP</th>
                    <th>Power</th>
                    <th>Accuracy</th>
                    <th>Crit Rate</th>
                    <th>Priority</th>
                    <th>Target</th>
                    <th>Effect</th>
                    <th>Chance</th>
                </tr>
            </thead>
            <tbody>
                ${moves.length === 0 ? `
                    <tr>
                        <td colspan="11" style="padding: 12px; text-align: center; color: #888;">
                            No moves found
                        </td>
                    </tr>
                ` : moves.map(move => `
                    <tr onclick="showMoveDetails('${move.name.replace(/'/g, "\\'")}')">
                        <td>${move.name}</td>
                        <td>
                            <div class="type-pill" style="background-color: ${getTypeColor(move.type)};">
                                ${move.type}
                            </div>
                        </td>
                        <td>
                            <div class="type-pill" style="background-color: ${CATEGORY_COLORS[move.category]};">
                                ${move.category}
                            </div>
                        </td>
                        <td>${move.pp}</td>
                        <td>${move.power}</td>
                        <td>${move.accuracy}</td>
                        <td>${move.critRate}</td>
                        <td>${move.priority}</td>
                        <td>${move.target}</td>
                        <td title="${move.effect}">
                            ${move.effect.length > 30 ? move.effect.substring(0, 27) + '...' : move.effect}
                        </td>
                        <td>${move.chance !== '-' ? move.chance : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    movesList.innerHTML = table;
}

// Setup event listeners
function setupEventListeners() {
    // Make showMoveDetails available globally
    window.showMoveDetails = showMoveDetails;

    // Close modal when clicking X or outside
    closeBtn.onclick = () => modal.classList.remove('active');
    window.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    };

    // Search box
    searchBox.addEventListener('input', () => {
        currentFilters.search = searchBox.value.toLowerCase();
        filtersEnabled = true;
        applyFilters();
    });

    // Filter button
    const filterBtn = document.getElementById('move-filter-btn');
    const filterDropdown = document.getElementById('move-filter-dropdown');
    
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!filterDropdown.contains(e.target) && e.target !== filterBtn) {
            filterDropdown.style.display = 'none';
        }
    });

    // Prevent dropdown from closing when clicking inside
    filterDropdown.addEventListener('click', (e) => e.stopPropagation());

    // Select/Deselect all
    document.getElementById('move-filter-select-all').addEventListener('click', () => {
        document.querySelectorAll('.type-filter-checkbox, .category-filter-checkbox').forEach(cb => cb.checked = true);
        updateFilters();
    });

    document.getElementById('move-filter-deselect-all').addEventListener('click', () => {
        document.querySelectorAll('.type-filter-checkbox, .category-filter-checkbox').forEach(cb => cb.checked = false);
        updateFilters();
    });

    // Clear filters
    document.getElementById('move-clear-filters').addEventListener('click', () => {
        document.querySelectorAll('.type-filter-checkbox, .category-filter-checkbox').forEach(cb => cb.checked = true);
        document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
        updateFilters();
    });

    // Type and category checkboxes
    document.querySelectorAll('.type-filter-checkbox, .category-filter-checkbox').forEach(cb => {
        cb.addEventListener('change', updateFilters);
    });

    // Stat inputs
    ['min-power', 'max-power', 'min-accuracy', 'max-accuracy', 'min-priority', 'max-priority'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateFilters);
        }
    });
}

// Update filters from form values
function updateFilters() {
    currentFilters.types = [...document.querySelectorAll('.type-filter-checkbox:checked')].map(cb => cb.value);
    currentFilters.categories = [...document.querySelectorAll('.category-filter-checkbox:checked')].map(cb => cb.value);
    
    currentFilters.power = {
        min: document.getElementById('min-power').value,
        max: document.getElementById('max-power').value
    };
    
    currentFilters.accuracy = {
        min: document.getElementById('min-accuracy').value,
        max: document.getElementById('max-accuracy').value
    };
    
    currentFilters.priority = {
        min: document.getElementById('min-priority').value,
        max: document.getElementById('max-priority').value
    };
    
    filtersEnabled = true;
    applyFilters();
}

// Apply filters and display moves
function applyFilters() {
    if (!allMovesData) return;
    const filteredMoves = filterMoves(allMovesData);
    displayMoves(filteredMoves);
}

// Check URL for move name parameter
function checkUrlForMove() {
    const urlParams = new URLSearchParams(window.location.search);
    const moveName = urlParams.get('name');
    if (moveName) {
        // Decode the URL-encoded name and format it
        const decodedName = decodeURIComponent(moveName);
        // Format each word to have first letter uppercase
        const formattedName = decodedName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        // Wait for data to be loaded before showing details
        const checkDataAndShow = async () => {
            if (!allMovesData) {
                await new Promise(resolve => setTimeout(resolve, 100));
                await checkDataAndShow();
            } else {
                const move = allMovesData.find(m => m.name === formattedName);
                if (move) {
                    showMoveDetails(formattedName);
                }
            }
        };
        checkDataAndShow();
    }
}

// Initialize page
async function init() {
    allMovesData = await fetchMovesData();
    displayDataSource();
    renderMoveFilters();
    setupEventListeners();
    displayMoves(allMovesData);
    checkUrlForMove();
}

// Start the application
init();
