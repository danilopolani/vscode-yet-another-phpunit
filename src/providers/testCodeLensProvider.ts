import { CodeLensProvider, TextDocument, CodeLens, Range, workspace } from 'vscode';
import * as Engine from 'php-parser';

export default class TestCodeLensProvider implements CodeLensProvider {
    public METHOD_TEST_LABEL: string = 'Run test';
    public CLASS_TEST_LABEL: string = 'Run class tests';

    async provideCodeLenses (document: TextDocument): Promise<CodeLens[]> {
        // Check if CodeLens is disabled by settings
        const enabled = workspace.getConfiguration('yet-phpunit').get('codelens');

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
        let codeLens: CodeLens[] = [];

        // Loop over parsed content
        for (let node of parsed.children) {
            // Skip if not a class or namespace
            if (node.kind !== 'class' && node.kind !== 'namespace') {
                continue;
            }

            // If is a class, just parse it directly
            if (node.kind === 'class') {
                codeLens = codeLens.concat(this.parseClass(node));
            } else {
                // If it's a namespace, loop over children to find a class
                for (let namespaceNode of node.children) {
                    if (namespaceNode.kind === 'class') {
                        codeLens = codeLens.concat(this.parseClass(namespaceNode));
                    }
                }
            }
        } // parse.children

        return codeLens;
    }

    private parseClass (node: any) {
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
            const hasTestAnnotation = leadingComments.find((comment: object) => {
                return (<any>comment).kind === 'commentblock' && (<any>comment).value.indexOf('* @test') > -1;
            });

            if (!child.name.name.startsWith('test') && !hasTestAnnotation) {
                continue;
            }

            // Check if has a trailingcomment and save for the next iteration
            previousTrailingComment = child.body.trailingComments || null;

            // Assert that this class has at least one test
            classHasTests = true;

            // Build range for the method (where to put the CodeLens)
            const codeLensRange = new Range(child.loc.start.line - 1, 0, child.loc.start.line - 1, 0);

            // Append CodeLens
            codeLens.push(new CodeLens(codeLensRange, {
                command: 'yet-phpunit.run',
                title: this.METHOD_TEST_LABEL,
                arguments: [child.name.name, false], // Method name, run whole class
            }));
        } // node.body

        // If class has tests, attach the CodeLens to run the whole class
        if (classHasTests) {
            const classCodeLensRange = new Range(node.loc.start.line - 1, 0, node.loc.start.line - 1, 0);
            codeLens.push(new CodeLens(classCodeLensRange, {
                command: 'yet-phpunit.run',
                title: this.CLASS_TEST_LABEL,
                arguments: [null, true], // Method name, run whole class
            }));
        }

        return codeLens;
    }
}
