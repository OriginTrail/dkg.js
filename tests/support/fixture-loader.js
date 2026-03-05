import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, '..', 'fixtures');
const cache = new Map();

export function loadFixture(relativePath) {
    if (cache.has(relativePath)) return structuredClone(cache.get(relativePath));
    const data = JSON.parse(readFileSync(resolve(FIXTURES_DIR, relativePath), 'utf-8'));
    cache.set(relativePath, data);
    return structuredClone(data);
}

export function loadTextFixture(relativePath) {
    const key = `text:${relativePath}`;
    if (cache.has(key)) return cache.get(key);
    const text = readFileSync(resolve(FIXTURES_DIR, relativePath), 'utf-8').trim();
    cache.set(key, text);
    return text;
}
