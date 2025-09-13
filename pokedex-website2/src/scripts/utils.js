import { TYPE_COLORS } from './constants.js';
import { GENERATION_RANGES } from './constants.js';

// Get generation for a pokemon ID
export function getPokemonGeneration(pokemonId) {
    for (const [gen, [min, max]] of Object.entries(GENERATION_RANGES)) {
        if (pokemonId >= min && pokemonId <= max) {
            return gen;
        }
    }
    return null;
}