import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load a fixture file by category and name
 * @param {string} category - 'valid' or 'invalid'
 * @param {string} name - Filename without .json extension
 * @returns {Object} Parsed JSON content
 */
export function loadFixture(category, name) {
    const filePath = path.join(__dirname, category, `${name}.json`);
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
}

/**
 * Load all fixtures in a category
 * @param {string} category - 'valid' or 'invalid'
 * @returns {Array} Array of { name, content } objects
 */
export function loadAllFixtures(category) {
    const dirPath = path.join(__dirname, category);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));

    return files.map((file) => {
        const name = file.replace('.json', '');
        return {
            name,
            content: loadFixture(category, name),
        };
    });
}

/**
 * Edge case descriptions for reporting
 */
export const EDGE_CASE_DESCRIPTIONS = {
    minimal: 'Smallest valid asset (only required fields)',
    'utf8-special-chars': 'UTF-8, emojis, escape sequences, international text',
    'large-payload': 'Deep nested structure with multiple levels',
    'graph-multiple-entities': '@graph with interconnected entities',
    'context-variations': 'Different @context formats (string, object, array)',
    'numeric-values': 'Various numeric types and edge values',
    'empty-arrays': 'Empty arrays in properties',
    'long-strings': 'Very long string values',
};

/**
 * Invalid edge-case descriptions for reporting
 */
export const INVALID_EDGE_CASE_DESCRIPTIONS = {
    'missing-public': 'Missing top-level public assertion object',
    'public-not-object': 'Public assertion is not an object',
    'missing-context': 'Public assertion is missing @context',
    'invalid-context-type': '@context has an invalid type',
    'invalid-id-type': '@id has an invalid type',
    'graph-not-array': '@graph is not an array/object structure',
};

/**
 * Expected error message fragments for invalid fixtures.
 * These are intentionally broad because validation messages may vary across nodes/versions.
 */
export const INVALID_EDGE_CASE_ERROR_PATTERNS = {
    'missing-public': [
        'public',
        'assertion',
        'invalid',
        'validation',
        'failed',
    ],
    'public-not-object': [
        'public',
        'object',
        'invalid',
        'validation',
        'failed',
    ],
    'missing-context': [
        'context',
        'jsonld',
        'invalid',
        'validation',
        'failed',
    ],
    'invalid-context-type': [
        'context',
        'jsonld',
        'invalid',
        'validation',
        'failed',
    ],
    'invalid-id-type': [
        '@id',
        'id',
        'invalid',
        'validation',
        'failed',
    ],
    'graph-not-array': [
        'graph',
        'invalid',
        'validation',
        'failed',
        'jsonld',
    ],
};
