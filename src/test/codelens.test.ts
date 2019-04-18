import * as assert from 'assert';
import * as vscode from 'vscode';
import { join as pathJoin } from 'path';
import TestCodeLensProvider from '../providers/testCodeLensProvider';

describe('Yet Another PHPUnit CodeLens Test', () => {
    const configuration = vscode.workspace.getConfiguration('yet-phpunit');
    const workspaceRootPath = vscode.workspace.rootPath || '';

    beforeEach(async () => {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        await configuration.update('commandSuffix', null);
        await configuration.update('phpunitBinary', null);
        await configuration.update('ssh.enable', false);
        await configuration.update('xmlConfigFilepath', null);
        await configuration.update('docker.enable', false);
        await configuration.update('codelens', true);
    });

    afterEach(async () => {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        await configuration.update('commandSuffix', null);
        await configuration.update('phpunitBinary', null);
        await configuration.update('ssh.enable', false);
        await configuration.update('xmlConfigFilepath', null);
        await configuration.update('docker.enable', false);
        await configuration.update('codelens', true);
    });

    it('Does not show CodeLens if disabled', async () => {
        // Update settings
        await configuration.update('codelens', false);

        const codeLensProvider = new TestCodeLensProvider;
        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'CodeLensTest.php'));

        // Retrieve fetched test by provider
        const fetchedTests = await codeLensProvider.provideCodeLenses(document);

        assert.strictEqual(fetchedTests.length, 0);
    });

    it('Detect methods with test prefix or decorator', async () => {
        const codeLensProvider = new TestCodeLensProvider;
        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'CodeLensTest.php'));

        // Retrieve fetched test by provider
        const fetchedTests = await codeLensProvider.provideCodeLenses(document);

        assert.strictEqual(fetchedTests.length, 4); // 3 methods + the last one is the class
    });

    it('Allows to run the class tests', async () => {
        const codeLensProvider = new TestCodeLensProvider;
        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'CodeLensTest.php'));

        // Retrieve fetched test by provider
        const fetchedTests = await codeLensProvider.provideCodeLenses(document);

        // Retrieve last, we append class at the end
        const lastCodeLens: vscode.CodeLens = fetchedTests[fetchedTests.length - 1];

        assert.strictEqual(fetchedTests.length, 4); // 3 methods + the last one is the class
        // @ts-ignore
        assert.strictEqual(lastCodeLens.command.title, codeLensProvider.CLASS_TEST_LABEL);
        // @ts-ignore
        assert.ok(lastCodeLens.command.arguments[0] === null);
        // @ts-ignore
        assert.ok(lastCodeLens.command.arguments[1]);
    });
});
