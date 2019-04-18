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

describe('Yet Another PHPUnit SSH Test', () => {
    const configuration = vscode.workspace.getConfiguration('yet-phpunit');
    const workspaceRootPath = vscode.workspace.rootPath || '';

    beforeEach(async () => {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        await configuration.update('ssh.enable', true);
        await configuration.update('ssh.user', 'auser');
        await configuration.update('ssh.host', 'ahost');
        await configuration.update('ssh.port', '2222');
        await configuration.update('docker.enable', false);
        await configuration.update('docker.command', null);
        await configuration.update('docker.paths', null);

        const paths: {[key: string]: string} = {};
        paths[workspaceRootPath] = '/some/remote/path';
        paths['/some/other_local/path'] = '/some/other_remote/path';

        await configuration.update('ssh.paths', paths);
    });

    afterEach(async () => {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        await configuration.update('ssh.enable', false);
        await configuration.update('ssh.user', 'auser');
        await configuration.update('ssh.host', 'ahost');
        await configuration.update('ssh.port', '2222');
        await configuration.update('ssh.binary', null);
        await configuration.update('ssh.paths', {});
        await configuration.update('docker.enable', false);
        await configuration.update('docker.command', null);
        await configuration.update('docker.paths', null);
    });

    it('Commands are not wrapped when SSH is disabled', async () => {
        await configuration.update('ssh.enable', false);

        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {});

        assert.equal(
            _getLastCommand().output.trim(),
            pathJoin(workspaceRootPath, '/vendor/bin/phpunit ') + pathJoin(workspaceRootPath, '/tests/SampleTest.php') + ` --filter '^.*::test_first( .*)?$'`
        );
    });

    it('The correct SSH command is run when triggering Yet Another PHPUnit', async function () {
        let document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {});

        assert.equal(
            _getLastCommand().output.trim(),
            `ssh -tt -p2222 auser@ahost "/some/remote/path/vendor/bin/phpunit /some/remote/path/tests/SampleTest.php --filter '^.*::test_first( .*)?$' "`
        );
    });

    it('The correct Docker command is run when triggering Better PHPUnit', async function () {
        await configuration.update('ssh.enable', false);
        await configuration.update('docker.enable', true);
        await configuration.update('docker.command', 'docker exec CONTAINER');

        const paths: {[key: string]: string} = {};
        paths[pathJoin(workspaceRootPath)] = '/some/remote/path';
        paths['/some/other_local/path'] = '/some/other_remote/path';

        await configuration.update('docker.paths', paths);

        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {});

        assert.equal(
            _getLastCommand().output.trim(),
            `docker exec CONTAINER /some/remote/path/vendor/bin/phpunit /some/remote/path/tests/SampleTest.php --filter '^.*::test_first( .*)?$'`
        );
    });

    it('The correct Docker suite command is run when triggering Yet Another PHPUnit', async function () {
        await configuration.update('ssh.enable', false);
        await configuration.update('docker.enable', true);
        await configuration.update('docker.command', 'docker exec CONTAINER');

        const paths: {[key: string]: string} = {};
        paths[pathJoin(workspaceRootPath)] = '/some/remote/path';
        paths['/some/other_local/path'] = '/some/other_remote/path';

        await configuration.update('docker.paths', paths);

        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run-all');

        await timeout(waitToAssertInSeconds, () => {});

        assert.equal(
            _getLastCommand().output.trim(),
            'docker exec CONTAINER /some/remote/path/vendor/bin/phpunit'
        );
    });

    it('The correct Docker command is run via SSH when triggering Yet Another PHPUnit', async function () {
        await configuration.update('docker.enable', true);
        await configuration.update('docker.command', 'docker exec CONTAINER');

        const paths: {[key: string]: string} = {};
        paths[pathJoin(workspaceRootPath)] = '/some/remote/path';
        paths['/some/other_local/path'] = '/some/other_remote/path';

        await configuration.update('docker.paths', paths);

        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {});

        assert.equal(
            _getLastCommand().output.trim(),
            `ssh -tt -p2222 auser@ahost "docker exec CONTAINER /some/remote/path/vendor/bin/phpunit /some/remote/path/tests/SampleTest.php --filter '^.*::test_first( .*)?$' "`
        );
    });

    it('The correct Docker suite command is run via SSH when triggering Yet Another PHPUnit', async function () {
        await configuration.update('docker.enable', true);
        await configuration.update('docker.command', 'docker exec CONTAINER');

        const paths: {[key: string]: string} = {};
        paths[pathJoin(workspaceRootPath)] = '/some/remote/path';
        paths['/some/other_local/path'] = '/some/other_remote/path';

        await configuration.update('docker.paths', paths);

        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run-all');

        await timeout(waitToAssertInSeconds, () => {});

        assert.equal(
            _getLastCommand().output.trim(),
            `ssh -tt -p2222 auser@ahost "docker exec CONTAINER /some/remote/path/vendor/bin/phpunit  "`
        );
    });

    it('Can use a custom ssh binary', async function () {
        await configuration.update('ssh.binary', "putty -ssh");

        const document = await vscode.workspace.openTextDocument(pathJoin(workspaceRootPath, 'tests', 'SampleTest.php'));
        await vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        await vscode.commands.executeCommand('yet-phpunit.run');

        await timeout(waitToAssertInSeconds, () => {});

        assert.equal(
            _getLastCommand().output.trim(),
            `putty -ssh -tt -p2222 auser@ahost "/some/remote/path/vendor/bin/phpunit /some/remote/path/tests/SampleTest.php --filter '^.*::test_first( .*)?$' "`
        );
    });
});
