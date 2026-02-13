# AGENTS.md

## Purpose

-   Practical guide for coding agents working in `dkg.js`.
-   Summarizes build/lint/test commands and repository coding conventions.
-   Follow this file first, then mirror patterns in nearby source files.

## Cursor/Copilot Rule Discovery

-   `.cursorrules`: not found.
-   `.cursor/rules/`: not found.
-   `.github/copilot-instructions.md`: not found.
-   No additional Cursor/Copilot instruction files currently apply.

## Project Overview

-   Stack: JavaScript on Node.js, ESM (`"type": "module"`).
-   Package manager: npm with checked-in `package-lock.json`.
-   Runtime baseline: Node >= 16 (README/workflows).
-   Entry point: `index.js`.
-   Generated artifacts in repo: `index.cjs`, `constants/index.cjs`, `dist/dkg.min.js`.

## Important Paths

-   `managers/`: user-facing operation managers.
-   `services/`: input normalization, validation, transport, blockchain logic.
-   `constants/constants.js`: enums, defaults, chain configs, statuses.
-   `examples/`: manual integration examples.
-   `.github/workflows/`: CI checks and release workflows.

## Command Reference

### Install

-   Clean install: `npm ci`
-   Standard install: `npm install`

### Build

-   Regenerate CJS outputs: `npm run cjs-compat`
-   Regenerate only `index.cjs`: `npm run cjs:main`
-   Regenerate only `constants/index.cjs`: `npm run cjs:constants`
-   Full production build: `npm run build`
-   Watch build: `npm run watch`

### Lint / Format

-   Lint everything: `npm run lint`
-   Lint one file: `npx eslint services/validation-service.js`
-   Prettier check: `npx prettier --check .`
-   Prettier write: `npx prettier --write "**/*.js"`

### Tests (Current Reality)

-   There is no `npm test` script.
-   There is no first-party `test/` or `tests/` directory.
-   There is no Jest/Mocha/Vitest config in repository root.
-   Current validation strategy: lint + build + targeted example runs.

### Running a Single Test (Best Available Equivalent)

-   There is no canonical single-test command yet.
-   Use one focused example script:
-   `node examples/demo.js`
-   `node examples/sockets-demo.js`
-   These examples require local OT node/blockchain and env values (for example `PRIVATE_KEY`).
-   If tests are introduced, use `*.test.js` or `*.spec.js` naming.
-   If Node test runner is introduced, run one test file with `node --test path/to/file.test.js`.

## CI Expectations

-   PR workflow runs `npm run build`.
-   Publish workflow runs `npm run lint`.
-   Lockfile workflow enforces existence, non-empty lockfile, and package sync.
-   Commit `package-lock.json` whenever dependencies change.

## Code Style Guide

### Imports and Module Pattern

-   Use ESM `import` / `export` in source files.
-   Keep `.js` extension on local relative imports.
-   Import order: external packages, then internal modules, then constants/utilities.
-   Manager/service modules usually default-export a single class.
-   Interface modules are small implementation maps (`*-interface.js`).

### Formatting

-   Prettier (`.prettierrc`) is the formatting authority.
-   Enforced options: semicolons on, single quotes, trailing commas `all`.
-   Also enforced: `printWidth: 100`, `tabWidth: 4`, `arrowParens: always`.
-   Use Unix line endings.

### ESLint Nuances

-   Config extends `airbnb/base` and `prettier`.
-   `no-console` and `consistent-return` are warnings, not hard errors.
-   `camelcase`, `class-methods-use-this`, `import/extensions` are relaxed.
-   `*.test.js` / `*.spec.js` override disables `no-unused-expressions`.

### Types and Data Handling

-   Codebase is JavaScript-only (no TS compile step).
-   Keep JSDoc on public methods.
-   Use `ValidationService` for runtime argument checks.
-   Use `BigInt` for Wei-scale arithmetic.
-   Use `parseInt(value, 10)` for decimal parsing.
-   Preserve defaulting/null patterns (`??`, optional chaining).

### Naming Conventions

-   Classes: `PascalCase`.
-   Methods and variables: `camelCase`.
-   Constants: `UPPER_SNAKE_CASE`.
-   Filenames: kebab-case with role suffixes (`*-operations-manager.js`, `*-service.js`).
-   Keep domain identifiers consistent (`UAL`, `kcTokenId`, `kaTokenId`, `paranetUAL`).

### Standard Operation Flow

-   Existing manager methods typically do this in order:
-   normalize input via `InputService`;
-   validate via `ValidationService`;
-   call node/blockchain services;
-   return normalized response object.
-   Preserve this ordering in new code.

### Error Handling

-   Throw `new Error(...)` with clear context.
-   Wrap lower-level failures with operation-specific messages.
-   Do not swallow errors except intentional retry/fallback paths.
-   Preserve retry semantics (`maxNumberOfRetries`, `frequency`) where used.
-   Keep existing structured error payload patterns (for example `DKG_CLIENT_ERROR`).

### Response Shape Stability

-   Avoid breaking response keys expected by SDK consumers.
-   Common response fields: `operation`, `transactionHash`, `status`.

### Generated File Policy

-   Do not hand-edit generated files unless explicitly requested:
-   `index.cjs`
-   `constants/index.cjs`
-   `dist/dkg.min.js`
-   Edit ESM source and regenerate artifacts via scripts.
-   `postinstall` runs `cjs-compat`, so installs can update generated CJS files.
