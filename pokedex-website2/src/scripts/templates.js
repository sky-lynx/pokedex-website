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
    EGG_GROUPS
} from './constants.js';

export function renderTypeFilters() {
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