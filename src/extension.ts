import * as vscode from 'vscode';
import TestCodeLensProvider from './providers/testCodeLensProvider';
import Dispatcher from './commands/dispatcher';

// Last command executed
var lastCommand: any;

export function activate(context: vscode.ExtensionContext) {
    // Single test command
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run', async (methodName?: string, runClass?: boolean) => {
        executeCommand(Dispatcher({
            method: methodName,
            runClass,
        }));
    }));

    // Full all tests command
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run-all', async () => {
        executeCommand(Dispatcher({
            runAll: true,
        }));
    }));

    // Run previous test command
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run-previous', async () => {
        await vscode.commands.executeCommand('workbench.action.terminal.clear');
        await vscode.commands.executeCommand('workbench.action.tasks.runTask', 'phpunit: run');
    }));

    // Run folder tests command (from Explorer)
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run-explorer-folder', async (uri: vscode.Uri) => {
        executeCommand(Dispatcher({
            uri: uri.fsPath,
        }));
    }));

    // Run single file command (from Explorer)
    context.subscriptions.push(vscode.commands.registerCommand('yet-phpunit.run-explorer-file', async (uri: vscode.Uri) => {
        executeCommand(Dispatcher({
            uri: uri.fsPath,
        }));
    }));

    // Register PHPUnit task
    context.subscriptions.push(vscode.tasks.registerTaskProvider('phpunit', {
        provideTasks: () => {
            return [new vscode.Task(
                { type: 'phpunit', task: 'run' },
                2,
                'run',
                'phpunit',
                new vscode.ShellExecution(lastCommand.output),
                '$phpunit'
            )];
        },
        resolveTask: () => {
			return undefined;
		}
    }));

    // Register CodeLens provider
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({
        language: 'php',
        scheme: 'file'
    }, new TestCodeLensProvider));
}

// this method is called when your extension is deactivated
export function deactivate() {}


/**
 * Get last command - used for testing purposes only.
 *
 * @return {any}
 */
export function _getLastCommand(): any {
    return lastCommand;
}

/**
 * Run a command.
 *
 * @param {any} command 
 */
async function executeCommand(command: any) {
    lastCommand = command;

    if (!vscode.window.activeTextEditor) {
        return vscode.window.showErrorMessage('Yet Another PHPUnit: open a file to run this command');
    }

    await vscode.commands.executeCommand('workbench.action.terminal.clear');
    await vscode.commands.executeCommand('workbench.action.tasks.runTask', 'phpunit: run');
}
