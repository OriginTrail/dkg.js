const REPORT_DIR = 'tests/reports';

const common = {
    paths: ['tests/features/**/*.feature'],
    import: ['tests/step-definitions/**/*.js', 'tests/support/**/*.js'],
};

module.exports = {
    default: {},
    smoke: {
        ...common,
        tags: '@smoke',
        format: [
            './tests/support/pretty-formatter.js',
            `html:${REPORT_DIR}/smoke-report.html`,
        ],
    },
    full: {
        ...common,
        tags: 'not @wip',
        format: [
            './tests/support/pretty-formatter.js',
            `html:${REPORT_DIR}/full-report.html`,
        ],
    },
};
