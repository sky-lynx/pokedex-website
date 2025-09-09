// Stat names in order
export const STAT_NAMES = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];

// Move category colors
export const CATEGORY_COLORS = {
    Physical: '#C92112',
    Special: '#4F5870',
    Status: '#8C888C'
};

// Type color mapping
export const TYPE_COLORS = {
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

// Generation ranges
export const GENERATION_RANGES = {
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

/**
 * Gets the color for a given Pokemon type
 * @param {string} type - The Pokemon type
 * @returns {string} - The hex color code for the type
 */
export function getTypeColor(type) {
    return TYPE_COLORS[type] || '#AAA';
}

// Helper function to determine if a color is dark (needs white text)
export function isColorDark(color) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate YIQ ratio
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 128; // Return true if color is dark
}

// All possible shapes
export const POKEMON_SHAPES = [
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
export const POKEMON_COLORS = [
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
export const YIELD_NAMES = ['XP', 'HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed', 'Friendship'];

// All possible egg groups
export const EGG_GROUPS = [
    'Monster', 'Human-Like',
    'Water 1', 'Water 3',
    'Bug', 'Mineral',
    'Flying', 'Amorphous',
    'Field', 'Water 2',
    'Fairy', 'Ditto',
    'Grass', 'Dragon',
    'No Eggs Discovered'
];

export const gameHeadersWithColors = [
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