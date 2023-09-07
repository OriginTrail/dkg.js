module.exports = {
    env: {
        es2020: true,
        es6: true,
        browser: true,
        node: true,
    },
    extends: ['airbnb/base', 'prettier'],
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
    },
    rules: {
        'linebreak-style': ['error', 'unix'],
        camelcase: 0,
        'class-methods-use-this': 0,
        'consistent-return': 1,
        'no-restricted-syntax': 0,
        'guard-for-in': 0,
        'no-console': 'warn',
        'no-continue': 1,
        'no-underscore-dangle': 0,
        'import/extensions': 0,
    },
    overrides: [
        {
            files: ['*.test.js', '*.spec.js'],
            rules: {
                'no-unused-expressions': 'off',
            },
        },
    ],
    ignorePatterns: ['/dist/*', '/examples/*'],
};
