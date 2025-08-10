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

// Cache loaded pokemon data
let allPokemonData = null;
// Cache loaded abilities data
let allAbilitiesData = null;

// Render type filter checkboxes inside a dropdown
function renderTypeFilters() {
    const typeFiltersEl = document.getElementById('type-filters');
    if (!typeFiltersEl) return;
    typeFiltersEl.innerHTML = `
        <div style="display:inline-block;position:relative;text-align:left;">
            <button id="type-filter-btn" style="padding:7px 16px;border-radius:8px;border:1px solid #bbb;background:#f8f8f8;cursor:pointer;font-size:1em;">
                Filter Types
            </button>
            <div id="type-filter-dropdown" style="display:none;position:absolute;left:0;top:110%;background:#fff;border:1px solid #bbb;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.10);padding:12px 18px;z-index:20;min-width:220px;text-align:left;">
                <div style="margin-bottom:10px;">
                    <button id="type-filter-select-all" style="margin-right:8px;padding:3px 10px;border-radius:6px;border:1px solid #bbb;background:#e3f2fd;cursor:pointer;font-size:0.95em;">Select All</button>
                    <button id="type-filter-deselect-all" style="padding:3px 10px;border-radius:6px;border:1px solid #bbb;background:#f8bbd0;cursor:pointer;font-size:0.95em;">Deselect All</button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:0 10px;">
                ${Object.keys(TYPE_COLORS).map(type =>
                    `<label style="margin-right:10px;display:inline-flex;align-items:center;gap:2px;margin-bottom:6px;">
                        <input type="checkbox" class="type-filter-checkbox" value="${type}" checked>
                        <span style="background:${getTypeColor(type)};color:#fff;padding:2px 10px;border-radius:12px;font-size:0.95em;">${type}</span>
                    </label>`
                ).join('')}
                </div>
            </div>
        </div>
    `;
}

// Fetch first 151 Pokémon (now supports search and type filter)
async function fetchPokemonList(filter = '', typeFilterArr = null) {
    if (!allPokemonData) {
        const res = await fetch('/api/pokemon.json');
        allPokemonData = await res.json();
    }
    pokemonListEl.innerHTML = '';
    let filtered = allPokemonData.filter(pokemon =>
        pokemon.name.toLowerCase().includes(filter.toLowerCase())
    );
    if (typeFilterArr && typeFilterArr.length > 0 && typeFilterArr.length < Object.keys(TYPE_COLORS).length) {
        filtered = filtered.filter(pokemon =>
            pokemon.type.some(t => typeFilterArr.includes(t))
        );
    }
    filtered.slice(0, 151).forEach(pokemon => {
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
        nameSpan.textContent = capitalize(pokemon.name);
        btn.appendChild(nameSpan);
        
        const typeContainer = document.createElement('div');
        typeContainer.className = 'type-container';
        pokemon.type.forEach(type => {
            const typeSpan = document.createElement('span');
            typeSpan.className = 'type-pill';
            typeSpan.textContent = type;
            typeSpan.style.backgroundColor = getTypeColor(type);
            typeContainer.appendChild(typeSpan);
        });
        btn.appendChild(typeContainer);
        
        pokemonListEl.appendChild(btn);
    });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function showPokemonDetails(name) {
    // Ensure data is loaded
    if (!allPokemonData) {
        const res = await fetch('/api/pokemon.json');
        allPokemonData = await res.json();
    }
    // Ensure abilities data is loaded
    if (!allAbilitiesData) {
        const res = await fetch('/api/abilities.json');
        allAbilitiesData = await res.json();
    }
    // First try to find the base Pokemon
    let baseData = allPokemonData.find(p => p.name === name);
    
    // If not found, try to find the Pokemon that has this form
    if (!baseData) {
        baseData = allPokemonData.find(p => 
            p.forms && Object.values(p.forms).some(form => form.name === name)
        );
    }

    if (!baseData) {
        modalBody.innerHTML = '<p>Pokémon not found.</p>';
        return;
    }

    // If it's a form, merge the base data with the form data
    let data = baseData;
    if (name !== baseData.name) {
        const formData = Object.values(baseData.forms).find(form => form.name === name);
        if (formData) {
            data = {
                ...baseData,
                ...formData,
                formType: Object.keys(baseData.forms).find(key => baseData.forms[key].name === name)
            };
        }
    }
    const imgUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + data.id + '.png';
    // Conversion helpers
    function mToFtIn(m) {
        const totalInches = m * 39.3701;
        const ft = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        return `${ft}' ${inches}"`;
    }
    function kgToLbs(kg) {
        return (kg * 2.20462).toFixed(1);
    }
    const YIELD_NAMES = ['XP', 'HP', 'Atk', 'Def', 'Sp.Atk', 'Sp.Def', 'Spd'];
    modal.classList.add('active');
    
    // Find the base Pokemon data if we're looking at a form
    const basePokemon = allPokemonData.find(p => 
        p.name === name || (p.forms && Object.values(p.forms).some(form => form.name === name))
    );
    
    // Get all forms from the pokemon data
    const forms = [{ ...basePokemon, formType: 'base' }]; // Start with base form
    
    // Add forms from the forms object if they exist
    if (basePokemon.forms) {
        Object.entries(basePokemon.forms).forEach(([formType, formData]) => {
            // Merge base form data with form-specific data
            const fullFormData = {
                ...basePokemon,
                ...formData,
                formType,
                // Make sure to keep the form's specific properties
                name: formData.name,
                type: formData.type || basePokemon.type,
                abilities: formData.abilities || basePokemon.abilities,
                hability: formData.hability || basePokemon.hability,
                baseStats: formData.baseStats || basePokemon.baseStats,
                height: formData.height || basePokemon.height,
                weight: formData.weight || basePokemon.weight
            };
            forms.push(fullFormData);
        });
    }
    
    // Sort forms to ensure consistent order (base form first, then others)
    forms.sort((a, b) => {
        if (a.formType === 'base') return -1;
        if (b.formType === 'base') return 1;
        return 0;
    });
    
    // Helper function to get display name for form type
    function getFormDisplayName(pokemon) {
        if (pokemon.formType === 'base') return capitalize(basePokemon.name);
        if (pokemon.formType === 'mega') return `Mega ${capitalize(basePokemon.name)}`;
        if (pokemon.formType === 'mega-x') return `Mega ${capitalize(basePokemon.name)} X`;
        if (pokemon.formType === 'mega-y') return `Mega ${capitalize(basePokemon.name)} Y`;
        if (pokemon.formType === 'gigantamax') return `Gigantamax ${capitalize(basePokemon.name)}`;
        return pokemon.name;
    }

    // Always show the form switcher
    const formSwitcherHtml = `
        <div style="
            background: #f5f5f5;
            border-radius: 8px;
            padding: 6px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
            display: inline-flex;
            gap: 2px;
            margin-bottom: 8px;
            position: relative;
            left: -6px;
        ">
            ${forms.map(form => {
                const displayName = getFormDisplayName(form);
                return `
                    <button onclick="showPokemonDetails('${form.formType === 'base' ? basePokemon.name : form.name}')" style="
                        padding: 6px 12px;
                        border-radius: 6px;
                        border: none;
                        background: ${form.name === name ? '#ef5350' : 'transparent'};
                        color: ${form.name === data.name ? 'white' : '#666'};
                        font-weight: bold;
                        cursor: ${forms.length > 1 ? 'pointer' : 'default'};
                        transition: all 0.2s ease;
                        font-size: 0.9em;
                        min-width: 80px;
                    ">
                        ${displayName}
                    </button>
                `;
            }).join('')}
        </div>
    `;

    modalBody.innerHTML = `
        ${formSwitcherHtml}
        <div style="margin-top:20px;">
            <h2>
                ${capitalize(data.name)}
                <span style="font-size:0.7em;font-weight:normal;color:#888;margin-left:8px;">
                    (${data.classification} Pokémon)
                </span>
            </h2>
        </div>
        <div style="margin-bottom:12px;">
            ${data.type.map(type => `
                <span style="
                    display:inline-block;
                    background:${getTypeColor(type)};
                    color:#fff;
                    border-radius:16px;
                    padding:4px 14px;
                    margin-right:6px;
                    font-size:0.95em;
                    font-weight:bold;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);
                    border:none;
                ">${type}</span>
            `).join('')}
        </div>
        <div class="modal-grid">
            <div class="modal-left">
                <div style="margin-bottom:32px;">
                    <img src="${imgUrl}" alt="${data.name}" onerror="this.onerror=null;this.src='/images/placeholder.png'" style="width:140px;height:140px;object-fit:contain;flex-shrink:0;">
                </div>
                
                <h3>Abilities</h3>
                <div style="margin-bottom:32px;">
                    ${data.abilities.map(ability => {
                        const abilityObj = allAbilitiesData[ability];
                        const desc = abilityObj ? abilityObj.description : 'No description found.';
                        return `
                        <span class="ability-btn" tabindex="0" style="
                            display:inline-block;
                            background:#607d8b;
                            color:#fff;
                            border-radius:16px;
                            padding:4px 14px;
                            margin-right:6px;
                            font-size:0.95em;
                            font-weight:bold;
                            box-shadow:0 1px 3px rgba(0,0,0,0.08);
                            border:none;
                            cursor:pointer;
                            position:relative;
                        " data-desc="${desc.replace(/"/g, '&quot;')}">${ability}
                            <span class="ability-popup" style="
                                display:none;
                                position:absolute;
                                left:0;
                                top:110%;
                                background:#fff;
                                color:#222;
                                border:1px solid #ccc;
                                border-radius:8px;
                                padding:8px 12px;
                                min-width:180px;
                                z-index:10;
                                box-shadow:0 2px 8px rgba(0,0,0,0.12);
                                font-size:0.95em;
                                white-space:normal;
                            "></span>
                        </span>
                        `;
                    }).join('')}
                    ${data.hability && data.hability[0] && data.hability[0].trim() !== "" ? `
                        <span class="ability-btn" tabindex="0" style="
                            display:inline-block;
                            background:#8e24aa;
                            color:#fff;
                            border-radius:16px;
                            padding:4px 14px;
                            margin-right:6px;
                            font-size:0.95em;
                            font-weight:bold;
                            box-shadow:0 1px 3px rgba(0,0,0,0.08);
                            border:none;
                            cursor:pointer;
                            position:relative;
                        " data-desc="${(allAbilitiesData[data.hability[0]] ? allAbilitiesData[data.hability[0]].description : 'No description found.').replace(/"/g, '&quot;')}">${data.hability[0]} <span style="font-size:0.85em;font-weight:normal;">(Hidden)</span>
                            <span class="ability-popup" style="
                                display:none;
                                position:absolute;
                                left:0;
                                top:110%;
                                background:#fff;
                                color:#222;
                                border:1px solid #ccc;
                                border-radius:8px;
                                padding:8px 12px;
                                min-width:180px;
                                z-index:10;
                                box-shadow:0 2px 8px rgba(0,0,0,0.12);
                                font-size:0.95em;
                                white-space:normal;
                            "></span>
                        </span>
                    ` : ''}
                </div>

                <h3>Catch Information</h3>
                <div style="margin-bottom:32px;">
                    <div style="margin-bottom:8px;">
                        <strong>Catch Rate:</strong> ${data.catchRate}
                    </div>
                    <div>
                        <strong>Level Rate:</strong> ${data.levelRate}
                    </div>
                </div>

                <h3>Breeding Information</h3>
                <div style="margin-bottom:32px;">
                    <div style="margin-bottom:12px;">
                        <strong>Egg Groups:</strong><br>
                        ${data.eggGroup.map(group => `
                            <span style="
                                display:inline-block;
                                background:#90caf9;
                                color:#222;
                                border-radius:16px;
                                padding:4px 14px;
                                margin-right:6px;
                                font-size:0.95em;
                                font-weight:bold;
                                border:none;
                            ">${group}</span>
                        `).join('')}
                    </div>
                    <div>
                        <strong>Egg Cycle:</strong> ${data.eggCycle}
                        <span style="margin-left:16px;"><strong>Egg Steps:</strong> ${data.eggCycle * 128}</span>
                    </div>
                </div>

                <h3>Physical Characteristics</h3>
                <div style="margin-bottom:32px;">
                    <div style="margin-bottom:8px;">
                        <strong>Height:</strong> ${data.height} m (${mToFtIn(data.height)})
                    </div>
                    <div>
                        <strong>Weight:</strong> ${data.weight} kg (${kgToLbs(data.weight)} lbs)
                    </div>
                </div>
            </div>
            <div class="modal-right">
                <h3>Base Stats</h3>
                <div class="stats-container base-stats">
                    ${data.baseStats.map((stat, i) => {
                        const percent = Math.round((stat / 255) * 100);
                        let barColor = '#357ecc'; // blue
                        if (stat < 30) {
                            barColor = '#ff0000'; // red
                        } else if (stat < 60) {
                            barColor = '#d1aa36'; // orange
                        } else if (stat < 90) {
                            barColor = '#cccf27'; // yellow
                        } else if (stat < 120) {
                            barColor = '#54cf27'; // green
                        } else if (stat < 150) {
                            barColor = '#338041'; // dark green
                        }
                        return `
                        <li style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                            <span style="min-width:80px;"><strong>${STAT_NAMES[i]}</strong></span>
                            <div style="background:#eee;width:160px;height:16px;border-radius:8px;overflow:hidden;flex-shrink:0;">
                                <div style="background:${barColor};width:${percent}%;height:100%;"></div>
                            </div>
                            <span style="min-width:40px;text-align:right;flex-shrink:0;">${stat}</span>
                        </li>
                        `;
                    }).join('')}
                    <li style="display:flex;align-items:center;gap:10px;margin-top:18px;">
                        <span style="min-width:80px;"><strong>Gender</strong></span>
                        ${
                            (() => {
                                const male = data.gender && data.gender[0] !== undefined ? data.gender[0] : 0;
                                const female = data.gender && data.gender[1] !== undefined ? data.gender[1] : 0;
                                if (male === 0 && female === 0) {
                                    // Gender unknown
                                    return `
                                        <div style="background:#222;width:160px;height:16px;border-radius:8px;overflow:hidden;flex-shrink:0;"></div>
                                        <span style="min-width:120px;text-align:right;flex-shrink:0;color:#222;font-weight:bold;">Gender Unknown</span>
                                    `;
                                } else {
                                    const malePercent = Math.round((male / (male + female || 1)) * 100);
                                    const femalePercent = 100 - malePercent;
                                    return `
                                        <div style="background:#eee;width:160px;height:16px;border-radius:8px;overflow:hidden;display:flex;flex-shrink:0;position:relative;">
                                            <div style="background:#42a5f5;width:${malePercent}%;height:100%;"></div>
                                            <div style="background:#ec407a;width:${femalePercent}%;height:100%;"></div>
                                        </div>
                                        <span style="min-width:40px;text-align:right;flex-shrink:0;">
                                            ${male}% - ${female}%
                                        </span>
                                    `;
                                }
                            })()
                        }
                    </li>
                    <li style="margin-bottom:6px;margin-top:18px;"><strong>Yield</strong></li>
                    ${data.yield.map((val, i) => {
                        let percent, barColor;
                        if (i === 0) {
                            // XP yield: out of 800
                            percent = Math.min(val / 800, 1) * 100;
                            if (val < 94) {
                                barColor = '#ff0000';
                            } else if (val < 188) {
                                barColor = '#d1aa36';
                            } else if (val < 282) {
                                barColor = '#cccf27';
                            } else if (val < 376) {
                                barColor = '#54cf27';
                            } else if (val < 470) {
                                barColor = '#338041';
                            } else {
                                barColor = '#357ecc';
                            }
                        } else {
                            // Other yields: out of 3
                            percent = Math.min(val, 3) / 3 * 100;
                            if (val < 1) {
                                barColor = '#ff0000';
                            } else if (val < 1.5) {
                                barColor = '#d1aa36';
                            } else if (val < 2) {
                                barColor = '#cccf27';
                            } else if (val < 2.5) {
                                barColor = '#54cf27';
                            } else if (val < 3) {
                                barColor = '#338041';
                            } else {
                                barColor = '#357ecc';
                            }
                        }
                        return `
                        <li style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                            <span style="min-width:80px;">${YIELD_NAMES[i]}</span>
                            <div style="background:#eee;width:160px;height:14px;border-radius:7px;overflow:hidden;flex-shrink:0;">
                                <div style="background:${barColor};width:${percent}%;height:100%;"></div>
                            </div>
                            <span style="min-width:40px;text-align:right;flex-shrink:0;">${val}</span>
                        </li>
                        `;
                    }).join('')}
                    <li style="display:flex;align-items:center;gap:10px;margin-top:8px;">
                        <strong style="min-width:80px;">Base Friendship</strong>
                        <div style="background:#eee;width:160px;height:14px;border-radius:7px;overflow:hidden;display:inline-block;vertical-align:middle;">
                            <div style="background:#f06292;width:${Math.round((data.baseFriendship/255)*100)}%;height:100%;"></div>
                        </div>
                        <span style="min-width:40px;text-align:right;flex-shrink:0;">${data.baseFriendship}</span>
                    </li>
                </ul>
            </div>
        </div>
    `;

    // Add popup event listeners for ability buttons (regular + hidden)
    Array.from(modalBody.querySelectorAll('.ability-btn')).forEach(btn => {
        const popup = btn.querySelector('.ability-popup');
        const desc = btn.getAttribute('data-desc');
        popup.textContent = desc;

        // Show on hover
        btn.addEventListener('mouseenter', () => { popup.style.display = 'block'; });
        btn.addEventListener('mouseleave', () => { popup.style.display = 'none'; });
        // Show on focus/click (for accessibility/mobile)
        btn.addEventListener('focus', () => { popup.style.display = 'block'; });
        btn.addEventListener('blur', () => { popup.style.display = 'none'; });
        btn.addEventListener('click', e => {
            e.stopPropagation();
            popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
        });
    });
}

function closeModal() {
    modal.classList.remove('active');
    // Remove the form switcher if it exists
    const switcher = modal.querySelector('div[style*="position:fixed"]');
    if (switcher) {
        switcher.remove();
    }
}

closeBtn.onclick = closeModal;
modal.onclick = e => { if (e.target === modal) closeModal(); };

// Add search bar and type filter events
document.addEventListener('DOMContentLoaded', () => {
    renderTypeFilters();
    const searchInput = document.getElementById('pokemon-search');
    const typeFiltersEl = document.getElementById('type-filters');
    function getCheckedTypes() {
        const dropdown = typeFiltersEl.querySelector('#type-filter-dropdown');
        if (!dropdown) return Object.keys(TYPE_COLORS);
        return Array.from(dropdown.querySelectorAll('.type-filter-checkbox'))
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }
    function updateList() {
        fetchPokemonList(
            searchInput ? searchInput.value : '',
            getCheckedTypes()
        );
    }
    if (searchInput) {
        searchInput.addEventListener('input', updateList);
    }
    if (typeFiltersEl) {
        typeFiltersEl.addEventListener('change', e => {
            if (e.target.classList.contains('type-filter-checkbox')) updateList();
        });
        // Dropdown show/hide logic
        const btn = typeFiltersEl.querySelector('#type-filter-btn');
        const dropdown = typeFiltersEl.querySelector('#type-filter-dropdown');
        if (btn && dropdown) {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            });
            document.addEventListener('click', e => {
                dropdown.style.display = 'none';
            });
            dropdown.addEventListener('click', e => e.stopPropagation());
            // Select all / Deselect all logic
            const selectAllBtn = dropdown.querySelector('#type-filter-select-all');
            const deselectAllBtn = dropdown.querySelector('#type-filter-deselect-all');
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', e => {
                    e.preventDefault();
                    dropdown.querySelectorAll('.type-filter-checkbox').forEach(cb => { cb.checked = true; });
                    updateList();
                });
            }
            if (deselectAllBtn) {
                deselectAllBtn.addEventListener('click', e => {
                    e.preventDefault();
                    dropdown.querySelectorAll('.type-filter-checkbox').forEach(cb => { cb.checked = false; });
                    updateList();
                });
            }
        }
    }
    updateList();
});

fetchPokemonList();
// No JS changes needed for grid scaling, just ensure .pokemon-grid and .pokemon-btn classes are used.