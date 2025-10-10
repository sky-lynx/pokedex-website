// Global state for filters
export const currentFilters = {
    search: '',
    types: Object.keys(TYPE_COLORS),  // start with all types selected
    typeLogic: 'or',  // default to OR logic
    typing: ['monotype', 'dualtype'],  // start with all typing options selected
    generations: Object.keys(GENERATION_RANGES),  // start with all generations selected
    shapes: POKEMON_SHAPES.slice(),  // start with all shapes selected
    colors: POKEMON_COLORS.slice(),  // start with all colors selected
    abilities: [],  // start with no ability filter
    eggGroups: EGG_GROUPS.slice(),  // start with all egg groups selected
    stats: {
        hp: { min: '', max: '' },
        atk: { min: '', max: '' },
        def: { min: '', max: '' },
        spa: { min: '', max: '' },
        spd: { min: '', max: '' },
        spe: { min: '', max: '' },
        total: { min: '', max: '' }
    }
};

export let filtersEnabled = false;

// Update filters based on user input
export function updateFilters(filterType, value) {
    currentFilters[filterType] = value;
    filtersEnabled = true;
}

// Check if a pokemon matches current filters
export function matchesFilters(pokemon) {
    if (!filtersEnabled) return true;

    // Search filter
    if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        const matchesSearch = 
            pokemon.name.toLowerCase().includes(searchLower) ||
            pokemon.dexNum.toString().includes(searchLower);
        if (!matchesSearch) return false;
    }

    // Type filter
    if (currentFilters.types.length > 0) {
        const hasType = currentFilters.typeLogic === 'or' 
            ? currentFilters.types.some(t => pokemon.type1 === t || pokemon.type2 === t)
            : currentFilters.types.every(t => pokemon.type1 === t || pokemon.type2 === t);
        if (!hasType) return false;
    }

    // Generation filter
    const gen = getPokemonGeneration(parseInt(pokemon.dexNum));
    if (currentFilters.generations.length > 0 && !currentFilters.generations.includes(gen)) {
        return false;
    }

    // Shape filter
    if (currentFilters.shapes.length > 0 && !currentFilters.shapes.includes(pokemon.shape)) {
        return false;
    }

    // Color filter
    if (currentFilters.colors.length > 0 && !currentFilters.colors.includes(pokemon.color)) {
        return false;
    }

    // Ability filter
    if (currentFilters.abilities.length > 0) {
        const hasAbility = currentFilters.abilities.some(a => 
            pokemon.abilities.includes(a) || pokemon.hability.includes(a)
        );
        if (!hasAbility) return false;
    }

    // Egg group filter
    if (currentFilters.eggGroups.length > 0) {
        const hasEggGroup = currentFilters.eggGroups.some(g => 
            pokemon.eggGroup.includes(g)
        );
        if (!hasEggGroup) return false;
    }

    // Stat filters
    for (const [stat, range] of Object.entries(currentFilters.stats)) {
        if (range.min !== '' && pokemon.stats[stat] < parseInt(range.min)) return false;
        if (range.max !== '' && pokemon.stats[stat] > parseInt(range.max)) return false;
    }

    return true;
}