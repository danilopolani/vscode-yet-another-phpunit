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
const php_parser_1 = require("php-parser");
class MyCodeLensProvider {
    constructor() {
        this.METHOD_TEST_LABEL = 'Run test';
        this.CLASS_TEST_LABEL = 'Run class tests';
    }
    // Each provider requires a provideCodeLenses function which will give the various documents
    // the code lenses
    provideCodeLenses(document) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if file ends in *Test.php
            if (!document.fileName.endsWith('Test.php')) {
                return [];
            }
            // Parse PHP file
            const parsed = php_parser_1.default.parseCode(document.getText(), {
                ast: {
                    withPositions: true,
                    withSource: true,
                },
                parser: {
                    debug: false,
                    extractDoc: true,
                    suppressErrors: true,
                },
                lexer: {
                    all_tokens: true,
                    comment_tokens: true,
                    mode_eval: true,
                    asp_tags: true,
                    short_tags: true,
                },
            });
            // CodeLens (aka "Run test" label) to be pushed
            const codeLens = [];
            // PHPUnit command triggered by click the CodeLens
            const methodRunTest = {
                command: 'better-phpunit.run',
                title: this.METHOD_TEST_LABEL
            };
            const classRunTests = {
                command: 'better-phpunit.run',
                title: this.CLASS_TEST_LABEL
            };
            console.log(parsed.children);
            // Loop over parsed content
            for (let node of parsed.children) {
                let classHasTests = false;
                // Skip if not a class
                if (node.kind !== 'class') {
                    continue;
                }
                // Loop over class children
                for (let child of node.body) {
                    // Take only methods, it could be also constant and so on
                    if (child.kind !== 'method') {
                        continue;
                    }
                    // Skip if name starts with test and if in the docBlock there is not a @test
                    const leadingComments = child.leadingComments || [];
                    const hasTestAnnotation = leadingComments.find((comment) => {
                        return comment['kind'] === 'commentblock' && comment['value'].indexOf('* @test') > -1;
                    });
                    if (!child.name.name.startsWith('test') && !hasTestAnnotation) {
                        continue;
                    }
                    // Set true the fact that the current class has tests
                    classHasTests = true;
                    // Build range for the method (where to put the CodeLens)
                    const codeLensRange = new vscode_1.Range(child.loc.start.line - 1, 0, child.loc.start.line - 1, 0);
                    codeLens.push(new vscode_1.CodeLens(codeLensRange, methodRunTest));
                } // node.body
                // If class has tests, attach the CodeLens to run the whole class
                if (classHasTests) {
                    const classCodeLensRange = new vscode_1.Range(node.loc.start.line - 1, 0, node.loc.start.line - 1, 0);
                    codeLens.push(new vscode_1.CodeLens(classCodeLensRange, classRunTests));
                }
            } // parse.children
            return codeLens;
        });
    }
}
exports.default = MyCodeLensProvider;
//# sourceMappingURL=myCodeLensProvider.js.map