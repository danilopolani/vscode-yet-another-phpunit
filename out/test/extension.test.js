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
describe('Yet Another PHPUnit Test Suite', () => {
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
        yield configuration.update('commandSuffix', null);
        yield configuration.update('phpunitBinary', null);
        yield configuration.update('ssh.enable', false);
        yield configuration.update('xmlConfigFilepath', null);
        yield configuration.update('docker.enable', false);
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        // Reset the test/project-stub/.vscode/settings.json settings for each test.
        // This allows us to test config options in tests and not harm other tests.
        yield configuration.update('commandSuffix', null);
        yield configuration.update('phpunitBinary', null);
        yield configuration.update('ssh.enable', false);
        yield configuration.update('xmlConfigFilepath', null);
        yield configuration.update('docker.enable', false);
    }));
    it('Run file outside of method', () => __awaiter(this, void 0, void 0, function* () {
        const document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document);
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => {
            assert.ok(extension_1._getLastCommand().method === '');
        });
    }));
    it('Run from within first method', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().method, 'test_first');
        });
    }));
    it('Run from within second method', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document, { selection: new vscode.Range(12, 0, 12, 0) });
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().method, 'test_second');
        });
    }));
    it('Detect filename', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document);
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().file, path_1.join(workspaceRootPath, '/tests/SampleTest.php'));
        });
    }));
    it('Detect filename with a space', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'File With Spaces Test.php'));
        yield vscode.window.showTextDocument(document);
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().file.replace(/\\/g, 'XX'), path_1.join(workspaceRootPath, '/tests/FileXX WithXX SpacesXX Test.php'));
        });
    }));
    it('Detect executable', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document);
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().binary, path_1.join(workspaceRootPath, '/vendor/bin/phpunit'));
        });
    }));
    it('Detect executable in sub-directory', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'sub-directory', 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document);
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().binary, path_1.join(workspaceRootPath, '/sub-directory/vendor/bin/phpunit'));
        });
    }));
    it('Detect configuration in sub-directory', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'sub-directory', 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document);
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().configuration, ` --configuration ${path_1.join(workspaceRootPath, '/sub-directory/phpunit.xml')}`);
        });
    }));
    it('Uses configuration found in path supplied in settings', () => __awaiter(this, void 0, void 0, function* () {
        yield configuration.update('xmlConfigFilepath', '/var/log/phpunit.xml');
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'sub-directory', 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document);
        yield vscode.commands.executeCommand('yet-phpunit.run');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().configuration, ` --configuration /var/log/phpunit.xml`);
        });
    }));
    it('Check full command', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        yield vscode.commands.executeCommand('yet-phpunit.run');
        let expectedCommand = path_1.join(workspaceRootPath, '/vendor/bin/phpunit ') + path_1.join(workspaceRootPath, '/tests/SampleTest.php') + " --filter '^.*::test_first( .*)?$'";
        if (isCI) {
            expectedCommand += ` --configuration ${workspaceRootPath}/phpunit.xml`;
        }
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().output.trim(), expectedCommand);
        });
    }));
    it('Run previous', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'OtherTest.php'));
        yield vscode.window.showTextDocument(document, { selection: new vscode.Range(12, 0, 12, 0) });
        yield vscode.commands.executeCommand('yet-phpunit.run-previous');
        let expectedCommand = path_1.join(workspaceRootPath, '/vendor/bin/phpunit ') + path_1.join(workspaceRootPath, '/tests/SampleTest.php') + " --filter '^.*::test_first( .*)?$'";
        if (isCI) {
            expectedCommand += ` --configuration ${workspaceRootPath}/phpunit.xml`;
        }
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().output.trim(), expectedCommand);
        });
    }));
    it('Run all tests', () => __awaiter(this, void 0, void 0, function* () {
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        yield vscode.commands.executeCommand('yet-phpunit.run-all');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().output.trim(), path_1.join(workspaceRootPath, '/vendor/bin/phpunit'));
        });
    }));
    it('Run with commandSuffix config', () => __awaiter(this, void 0, void 0, function* () {
        yield configuration.update('commandSuffix', '--foo=bar');
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        yield vscode.commands.executeCommand('yet-phpunit.run-all');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().output.trim(), path_1.join(workspaceRootPath, '/vendor/bin/phpunit') + '  --foo=bar');
        });
    }));
    it('Run with phpunitBinary config', () => __awaiter(this, void 0, void 0, function* () {
        yield configuration.update('phpunitBinary', 'vendor/foo/bar');
        let document = yield vscode.workspace.openTextDocument(path_1.join(workspaceRootPath, 'tests', 'SampleTest.php'));
        yield vscode.window.showTextDocument(document, { selection: new vscode.Range(7, 0, 7, 0) });
        yield vscode.commands.executeCommand('yet-phpunit.run-all');
        yield timeout(waitToAssertInSeconds, () => {
            assert.equal(extension_1._getLastCommand().output.trim(), 'vendor/foo/bar');
        });
    }));
});
//# sourceMappingURL=extension.test.js.map