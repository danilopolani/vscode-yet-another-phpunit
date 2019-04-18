import { workspace, WorkspaceConfiguration } from 'vscode';
import { CommandOptions } from '../types/commandOptions';
import { PhpUnitCommand } from './phpunit';
import { DockerPhpUnitCommand } from './docker';
import { RemotePhpUnitCommand } from './remote';

export default function Dispatcher (commandOptions: CommandOptions = {}) {
    const configuration: WorkspaceConfiguration = workspace.getConfiguration('yet-phpunit');
    let command = new PhpUnitCommand(commandOptions);

    if (configuration.get('docker.enable')) {
        command = new DockerPhpUnitCommand(commandOptions);
    } else if (configuration.get('ssh.enable')) {
        command = new RemotePhpUnitCommand(commandOptions);
    }

    return command;
}
