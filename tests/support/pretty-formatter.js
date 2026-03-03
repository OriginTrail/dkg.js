import { SummaryFormatter } from '@cucumber/cucumber';

const NO_COLOR = !!process.env.NO_COLOR;

function color(code, text) {
    return NO_COLOR ? text : `\x1b[${code}m${text}\x1b[0m`;
}

const STATUS_ICONS = {
    PASSED: () => color(32, '✓'),
    FAILED: () => color(31, '✗'),
    SKIPPED: () => color(36, '-'),
    PENDING: () => color(33, '?'),
    UNDEFINED: () => color(33, '?'),
    AMBIGUOUS: () => color(31, '!'),
};

export default class PrettyConsoleFormatter extends SummaryFormatter {
    constructor(options) {
        super(options);

        const gherkinSteps = new Map();
        const pickles = new Map();
        const testCases = new Map();
        const testCaseStarteds = new Map();
        let currentFeatureUri = null;

        options.eventBroadcaster.on('envelope', (envelope) => {
            if (envelope.gherkinDocument?.feature) {
                for (const child of envelope.gherkinDocument.feature.children) {
                    const container = child.scenario || child.background;
                    if (container) {
                        for (const step of container.steps) {
                            gherkinSteps.set(step.id, step.keyword);
                        }
                    }
                }
            }

            if (envelope.pickle) {
                pickles.set(envelope.pickle.id, envelope.pickle);
            }

            if (envelope.testCase) {
                testCases.set(envelope.testCase.id, envelope.testCase);
            }

            if (envelope.testCaseStarted) {
                testCaseStarteds.set(envelope.testCaseStarted.id, envelope.testCaseStarted);
                const tc = testCases.get(envelope.testCaseStarted.testCaseId);
                const pickle = pickles.get(tc.pickleId);

                if (pickle.uri !== currentFeatureUri) {
                    currentFeatureUri = pickle.uri;
                    const doc = options.eventDataCollector
                        .getGherkinDocument(pickle.uri);
                    const name = doc?.feature?.name || pickle.uri;
                    this.log(`\n${color(1, 'Feature:')} ${name}\n`);
                }

                this.log(`\n  ${color(1, 'Scenario:')} ${pickle.name}\n`);
            }

            if (envelope.testStepFinished) {
                const tcs = testCaseStarteds.get(
                    envelope.testStepFinished.testCaseStartedId,
                );
                const tc = testCases.get(tcs.testCaseId);
                const testStep = tc.testSteps.find(
                    (s) => s.id === envelope.testStepFinished.testStepId,
                );

                if (!testStep?.pickleStepId) return;

                const pickle = pickles.get(tc.pickleId);
                const pickleStep = pickle.steps.find(
                    (s) => s.id === testStep.pickleStepId,
                );

                let keyword = '';
                if (pickleStep.astNodeIds?.length) {
                    keyword = gherkinSteps.get(pickleStep.astNodeIds[0]) || '';
                }

                const status = envelope.testStepFinished.testStepResult.status;
                const icon = (STATUS_ICONS[status] || (() => ' '))();

                this.log(`    ${icon} ${keyword}${pickleStep.text}\n`);
            }
        });
    }
}
