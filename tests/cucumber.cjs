const common = {
    paths: ['tests/features/**/*.feature'],
    import: ['tests/step-definitions/**/*.js', 'tests/support/**/*.js'],
};

module.exports = {
    default: {},
    smoke: {
        ...common,
        tags: '@smoke',
        format: ['./tests/support/pretty-formatter.js', 'html:tests/reports/smoke-report.html'],
    },
    full: {
        ...common,
        tags: 'not @wip',
        format: ['./tests/support/pretty-formatter.js', 'html:tests/reports/full-report.html'],
    },
};
