import { SummaryFormatter } from '@cucumber/cucumber';

const STATUS_ICONS = {
    PASSED: '\x1b[32m✓\x1b[0m',
    FAILED: '\x1b[31m✗\x1b[0m',
    SKIPPED: '\x1b[36m-\x1b[0m',
    PENDING: '\x1b[33m?\x1b[0m',
    UNDEFINED: '\x1b[33m?\x1b[0m',
    AMBIGUOUS: '\x1b[31m!\x1b[0m',
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
                    this.log(`\n\x1b[1mFeature:\x1b[0m ${name}\n`);
                }

                this.log(`\n  \x1b[1mScenario:\x1b[0m ${pickle.name}\n`);
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
                const icon = STATUS_ICONS[status] || ' ';

                this.log(`    ${icon} ${keyword}${pickleStep.text}\n`);
            }
        });
    }
}
