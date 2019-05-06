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
const assert = require("assert");
const vscode = require("vscode");
const path_1 = require("path");
const extension_1 = require("../extension");
const waitToAssertInSeconds = 5;
// This is a little helper function to promisify setTimeout, so we can 'await' setTimeout.
function timeout(seconds, callback) {
    return new Promise(resolve => {
        setTimeout(() => {
            callback();
            resolve();
        }, seconds * 5);
    });
}
describe('Yet Another PHPUnit SSH Test', () => {
    const configuration = vscode.workspace.getConfiguration('yet-phpunit');
    let workspaceRootPath = vscode.workspace.rootPath || '';
    let isCI = false;
    // Fix CI tests path
    if (!workspaceRootPath.endsWith('/project-stub')) {
        workspaceRootPath = path_1.join(workspaceRootPath, 'project-stub');
        isCI = true;
    }
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        yield configuration.update('ssh.enable', true);
        yield configuration.update('ssh.user', 'auser');
        yield configuration.update('ssh.host', 'ahost');
        yield configuration.update('ssh.port', '2222');
        yield configuration.update('ssh.binary', null);
        yield configuration.update('ssh.shellAppend', null);
        yield configuration.update('docker.enable', false);
        yield configuration.update('docker.command', null);
        yield configuration.update('docker.paths', null);
        const paths = {};
        paths[workspaceRootPath] = '/some/remote/path';
        paths['/some/other_local/path'] = '/some/other_remote/path';
        yield configuration.update('ssh.paths', paths);
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        yield configuration.update('ssh.enable', false);
        yield configuration.update('ssh.user', 'auser');
        yield configuration.update('ssh.host', 'ahost');
        yield configuration.update('ssh.port', '2222');
        yield configuration.update('ssh.binary', null);
        yield configuration.update('ssh.shellAppend', null);
        yield configuration.update('ssh.paths', {});
        yield configuration.update('docker.enable', false);
        yield configuration.update('docker.command', null);
        yield configuration.update('docker.paths', null);
    }));
    it('Commands are not wrapped when SSH is disabled', () => __awaiter(this, void 0, void 0, function* () {
        yield configuration.update('ssh.enable', false);
        const document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => { });
        let expectedCommand = path_1.join(workspaceRootPath, '/vendor/bin/phpunit ') + path_1.join(workspaceRootPath, '/tests/SampleTest.php') + ` --filter '^.*::test_first( .*)?$'`;
        if (isCI) {
            expectedCommand += ` --configuration ${workspaceRootPath}/phpunit.xml`;
        }
        assert.equal(extension_1._getLastCommand().output.trim(), expectedCommand);
    }));
    it('The correct SSH command is run when triggering Yet Another PHPUnit', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
            yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
            yield vscode.commands.executeCommand('yet-phpunit.run');
            yield timeout(waitToAssertInSeconds, () => { });
            assert.equal(extension_1._getLastCommand().output.trim(), `ssh -tt -p2222 auser@ahost "/some/remote/path/vendor/bin/phpunit /some/remote/path/tests/SampleTest.php --filter '^.*::test_first( .*)?$' ${isCI ? `--configuration ${workspaceRootPath}/phpunit.xml ` : ''}"`);
        });
    });
    it('The correct Docker command is run when triggering Better PHPUnit', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield configuration.update('ssh.enable', false);
            yield configuration.update('docker.enable', true);
            yield configuration.update('docker.command', 'docker exec CONTAINER');
            const paths = {};
            paths[path_1.join(workspaceRootPath)] = '/some/remote/path';
            paths['/some/other_local/path'] = '/some/other_remote/path';
            yield configuration.update('docker.paths', paths);
            const document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
            yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
            yield vscode.commands.executeCommand('yet-phpunit.run');
            yield timeout(waitToAssertInSeconds, () => { });
            assert.equal(extension_1._getLastCommand().output.trim(), `docker exec CONTAINER /some/remote/path/vendor/bin/phpunit /some/remote/path/tests/SampleTest.php --filter '^.*::test_first( .*)?$'${isCI ? ` --configuration ${workspaceRootPath}/phpunit.xml` : ''}`);
        });
    });
    it('The correct Docker suite command is run when triggering Yet Another PHPUnit', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield configuration.update('ssh.enable', false);
            yield configuration.update('docker.enable', true);
            yield configuration.update('docker.command', 'docker exec CONTAINER');
            const paths = {};
            paths[path_1.join(workspaceRootPath)] = '/some/remote/path';
            paths['/some/other_local/path'] = '/some/other_remote/path';
            yield configuration.update('docker.paths', paths);
            const document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
            yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
            yield vscode.commands.executeCommand('yet-phpunit.run-all');
            yield timeout(waitToAssertInSeconds, () => { });
            assert.equal(extension_1._getLastCommand().output.trim(), 'docker exec CONTAINER /some/remote/path/vendor/bin/phpunit');
        });
    });
    it('The correct Docker command is run via SSH when triggering Yet Another PHPUnit', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield configuration.update('docker.enable', true);
            yield configuration.update('docker.command', 'docker exec CONTAINER');
            const paths = {};
            paths[path_1.join(workspaceRootPath)] = '/some/remote/path';
            paths['/some/other_local/path'] = '/some/other_remote/path';
            yield configuration.update('docker.paths', paths);
            const document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
            yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
            yield vscode.commands.executeCommand('yet-phpunit.run');
            yield timeout(waitToAssertInSeconds, () => { });
            assert.equal(extension_1._getLastCommand().output.trim(), `ssh -tt -p2222 auser@ahost "docker exec CONTAINER /some/remote/path/vendor/bin/phpunit /some/remote/path/tests/SampleTest.php --filter '^.*::test_first( .*)?$' ${isCI ? `--configuration ${workspaceRootPath}/phpunit.xml ` : ''}"`);
        });
    });
    it('The correct Docker suite command is run via SSH when triggering Yet Another PHPUnit', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield configuration.update('docker.enable', true);
            yield configuration.update('docker.command', 'docker exec CONTAINER');
            const paths = {};
            paths[path_1.join(workspaceRootPath)] = '/some/remote/path';
            paths['/some/other_local/path'] = '/some/other_remote/path';
            yield configuration.update('docker.paths', paths);
            const document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
            yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
            yield vscode.commands.executeCommand('yet-phpunit.run-all');
            yield timeout(waitToAssertInSeconds, () => { });
            assert.equal(extension_1._getLastCommand().output.trim(), `ssh -tt -p2222 auser@ahost "docker exec CONTAINER /some/remote/path/vendor/bin/phpunit  "`);
        });
    });
    it('Can use a custom ssh binary', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield configuration.update('ssh.binary', 'plink.exe');
            const document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
            yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
            yield vscode.commands.executeCommand('yet-phpunit.run');
            yield timeout(waitToAssertInSeconds, () => { });
            assert.equal(extension_1._getLastCommand().output.trim(), `plink.exe auser@ahost -P 2222 "/some/remote/path/vendor/bin/phpunit /some/remote/path/tests/SampleTest.php --filter '^.*::test_first( .*)?$' ${isCI ? `--configuration ${workspaceRootPath}/phpunit.xml ` : ''}"`);
        });
    });
    it('Can append stuff to shell when using SSH', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield configuration.update('ssh.shellAppend', '--color=always');
            const document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
            yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
            yield vscode.commands.executeCommand('yet-phpunit.run');
            yield timeout(waitToAssertInSeconds, () => { });
            assert.equal(extension_1._getLastCommand().output.trim(), `ssh -tt -p2222 auser@ahost "/some/remote/path/vendor/bin/phpunit /some/remote/path/tests/SampleTest.php --filter '^.*::test_first( .*)?$' ${isCI ? `--configuration ${workspaceRootPath}/phpunit.xml ` : ''}" --color=always`);
        });
    });
});
//# sourceMappingURL=ssh.test.js.map