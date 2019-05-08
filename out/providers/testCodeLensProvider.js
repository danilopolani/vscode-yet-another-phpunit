"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const Engine = require("php-parser");
class TestCodeLensProvider {
    constructor() {
        this.METHOD_TEST_LABEL = 'Run test';
        this.CLASS_TEST_LABEL = 'Run class tests';
    }
    provideCodeLenses(document) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if CodeLens is disabled by settings
            const enabled = vscode_1.workspace.getConfiguration('yet-phpunit').get('codelens');
            // Stop if CodeLens disabled
            if (!enabled) {
                return [];
            }
            // Parse PHP file
            const parsed = Engine.parseCode(document.getText(), {
                ast: {
                    withPositions: true,
                },
                parser: {
                    debug: false,
                    extractDoc: true,
                    suppressErrors: true,
                },
                lexer: {
                    all_tokens: false,
                    comment_tokens: true,
                    mode_eval: false,
                    asp_tags: false,
                    short_tags: true,
                },
            });
            // CodeLens (aka "Run test" label) to be pushed
            let codeLens = [];
            // Loop over parsed content
            for (let node of parsed.children) {
                // Skip if not a class or namespace
                if (node.kind !== 'class' && node.kind !== 'namespace') {
                    continue;
                }
                // If is a class, just parse it directly
                if (node.kind === 'class') {
                    codeLens = codeLens.concat(this.parseClass(node));
                }
                else {
                    // If it's a namespace, loop over children to find a class
                    for (let namespaceNode of node.children) {
                        if (namespaceNode.kind === 'class') {
                            codeLens = codeLens.concat(this.parseClass(namespaceNode));
                        }
                    }
                }
            } // parse.children
            return codeLens;
        });
    }
    parseClass(node) {
        const codeLens = [];
        let classHasTests = false;
        // Temporary fix for https://github.com/glayzzle/php-parser/issues/250
        // Sometimes a method "docblock" (here namely "leading comment") goes to previous one as "trailing comment"
        let previousTrailingComment = null;
        // Loop over class children
        for (let child of node.body) {
            // Take only methods, it could be also constant and so on
            if (child.kind !== 'method') {
                continue;
            }
            // Skip if name starts with test and if in the docBlock there is not a @test
            const leadingComments = child.leadingComments || previousTrailingComment || [];
            const hasTestAnnotation = leadingComments.find((comment) => {
                return comment.kind === 'commentblock' && comment.value.indexOf('* @test') > -1;
            });
            // Check if has a trailingcomment and save for the next iteration
            previousTrailingComment = child.body.trailingComments || null;
            if (!child.name.name.startsWith('test') && !hasTestAnnotation) {
                continue;
            }
            // Assert that this class has at least one test
            classHasTests = true;
            // Build range for the method (where to put the CodeLens)
            const codeLensRange = new vscode_1.Range(child.loc.start.line - 1, 0, child.loc.start.line - 1, 0);
            // Append CodeLens
            codeLens.push(new vscode_1.CodeLens(codeLensRange, {
                command: 'yet-phpunit.run',
                title: this.METHOD_TEST_LABEL,
                arguments: [child.name.name, false],
            }));
        } // node.body
        // If class has tests, attach the CodeLens to run the whole class
        if (classHasTests) {
            const classCodeLensRange = new vscode_1.Range(node.loc.start.line - 1, 0, node.loc.start.line - 1, 0);
            codeLens.push(new vscode_1.CodeLens(classCodeLensRange, {
                command: 'yet-phpunit.run',
                title: this.CLASS_TEST_LABEL,
                arguments: [null, true],
            }));
        }
        return codeLens;
    }
}
exports.default = TestCodeLensProvider;
//# sourceMappingURL=testCodeLensProvider.js.map