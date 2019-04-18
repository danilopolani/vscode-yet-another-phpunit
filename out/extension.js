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
const vscode = require("vscode");
const testCodeLensProvider_1 = require("./providers/testCodeLensProvider");
const dispatcher_1 = require("./commands/dispatcher");
// Last command executed
var lastCommand;
function activate(context) {
    // Single test command
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run', (methodName, runClass) => __awaiter(this, void 0, void 0, function* () {
        executeCommand(dispatcher_1.default({
            method: methodName,
            runClass,
        }));
    })));
    // Full all tests command
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run-all', () => __awaiter(this, void 0, void 0, function* () {
        executeCommand(dispatcher_1.default({
            runAll: true,
        }));
    })));
    // Run previous test command
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run-previous', () => __awaiter(this, void 0, void 0, function* () {
        yield vscode.commands.executeCommand('workbench.action.terminal.clear');
        yield vscode.commands.executeCommand('workbench.action.tasks.runTask', 'phpunit: run');
    })));
    // Run folder tests command (from Explorer)
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run-explorer-folder', (uri) => __awaiter(this, void 0, void 0, function* () {
        executeCommand(dispatcher_1.default({
            uri: uri.fsPath,
        }));
    })));
    // Run single file command (from Explorer)
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run-explorer-file', (uri) => __awaiter(this, void 0, void 0, function* () {
        executeCommand(dispatcher_1.default({
            uri: uri.fsPath,
        }));
    })));
    // Register PHPUnit task
    context.subscriptions.push(vscode.tasks.registerTaskProvider('phpunit', {
        provideTasks: () => {
            return [new vscode.Task({ type: 'phpunit', task: 'run' }, 2, 'run', 'phpunit', new vscode.ShellExecution(lastCommand.output), '$phpunit')];
        },
        resolveTask: () => {
            return undefined;
        }
    }));
    // Register CodeLens provider
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({
        language: 'php',
        scheme: 'file'
    }, new testCodeLensProvider_1.default));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
/**
 * Get last command - used for testing purposes only.
 *
 * @return {any}
 */
function _getLastCommand() {
    return lastCommand;
}
exports._getLastCommand = _getLastCommand;
/**
 * Run a command.
 *
 * @param {any} command
 */
function executeCommand(command) {
    return __awaiter(this, void 0, void 0, function* () {
        lastCommand = command;
        if (!vscode.window.activeTextEditor) {
            return vscode.window.showErrorMessage('Yet Another PHPUnit: open a file to run this command');
        }
        yield vscode.commands.executeCommand('workbench.action.terminal.clear');
        yield vscode.commands.executeCommand('workbench.action.tasks.runTask', 'phpunit: run');
    });
}
//# sourceMappingURL=extension.js.map