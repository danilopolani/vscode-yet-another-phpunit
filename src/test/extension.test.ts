import * as assert from 'assert';
import * as vscode from 'vscode';
import { join as pathJoin } from 'path';
import { _getLastCommand } from '../extension';

const waitToAssertInSeconds = 5;

// This is a little helper function to promisify setTimeout, so we can 'await' setTimeout.
function timeout(seconds: number, callback: any) {
    return new Promise(resolve => {
        setTimeout(() => {
            callback();
            resolve();
        }, seconds * 5);
    });
}

describe('Yet Another PHPUnit Test Suite', () => {
    const configuration = vscode.workspace.getConfiguration('yet-phpunit');
    let workspaceRootPath = vscode.workspace.rootPath || '';
    let isCI = false;

    // Fix CI tests path
    if (!workspaceRootPath.endsWith('/project-stub')) {
        workspaceRootPath = pathJoin(workspaceRootPath, 'project-stub');
        isCI = true;
    }

    beforeEach(async () => {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        await configuration.update('commandSuffix', null);
        await configuration.update('phpunitBinary', null);
        await configuration.update('ssh.enable', false);
        await configuration.update('xmlConfigFilepath', null);
        await configuration.update('docker.enable', false);
    });

    afterEach(async () => {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        await configuration.update('commandSuffix', null);
        await configuration.update('phpunitBinary', null);
        await configuration.update('ssh.enable', false);
        await configuration.update('xmlConfigFilepath', null);
        await configuration.update('docker.enable', false);
    });

    it('Run file outside of method', async () => {
        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {
            assert.ok(_getLastCommand().method === '');
        });
    });

    it('Run from within first method', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().method,
                'test_first'
            );
        });
    });

    it('Run from within second method', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(12, 0, 12, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().method,
                'test_second'
            );
        });
    });

    it('Detect filename', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().file,
                pathJoin(workspaceRootPath, '/tests/SampleTest.php')
            );
        });
    });

    it('Detect filename with a space', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'File With Spaces Test.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().file.replace(/\\/g, 'XX'),
                pathJoin(workspaceRootPath, '/tests/FileXX WithXX SpacesXX Test.php')
            );
        });
    });

    it('Detect executable', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().binary,
                pathJoin(workspaceRootPath, '/vendor/bin/phpunit')
            );
        });
    });

    it('Detect executable in sub-directory', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'sub-directory', 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().binary,
                pathJoin(workspaceRootPath, '/sub-directory/vendor/bin/phpunit')
            );
        });
    });

    it('Detect configuration in sub-directory', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'sub-directory', 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().configuration,
                ` --configuration ${pathJoin(workspaceRootPath, '/sub-directory/phpunit.xml')}`
            );
        });
    });

    it('Uses configuration found in path supplied in settings', async () => {
        await configuration.update('xmlConfigFilepath', '/var/log/phpunit.xml');
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'sub-directory', 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().configuration,
                ` --configuration /var/log/phpunit.xml`
            );
        });
    });

    it('Check full command', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run');

        let expectedCommand = pathJoin(workspaceRootPath, '/vendor/bin/phpunit ') + pathJoin(workspaceRootPath, '/tests/SampleTest.php') + " --filter '^.*::test_first( .*)?$'";
        if (isCI) {
            expectedCommand += `--configuration ${workspaceRootPath}/phpunit.xml`;
        }

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().output.trim(),
                expectedCommand
            );
        });
    });

    it('Run previous', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'OtherTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(12, 0, 12, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run-previous');

        let expectedCommand = pathJoin(workspaceRootPath, '/vendor/bin/phpunit ') + pathJoin(workspaceRootPath, '/tests/SampleTest.php') + " --filter '^.*::test_first( .*)?$'";
        if (isCI) {
            expectedCommand += `--configuration ${workspaceRootPath}/phpunit.xml`;
        }

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().output.trim(),
                expectedCommand
            );
        });
    });

    it('Run all tests', async () => {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run-all');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().output.trim(),
                pathJoin(workspaceRootPath, '/vendor/bin/phpunit')
            );
        });
    });

    it('Run with commandSuffix config', async () => {
        await configuration.update('commandSuffix', '--foo=bar');

        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run-all');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().output.trim(),
                pathJoin(workspaceRootPath, '/vendor/bin/phpunit') + '  --foo=bar'
            );
        });
    });

    it('Run with phpunitBinary config', async () => {
        await configuration.update('phpunitBinary', 'vendor/foo/bar');

        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run-all');

        await timeout(waitToAssertInSeconds, () => {
            assert.equal(
                _getLastCommand().output.trim(),
                'vendor/foo/bar'
            );
        });
    });
});
