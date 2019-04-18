import { window } from 'vscode';
import { RemotePhpUnitCommand } from './remote';

export class DockerPhpUnitCommand extends RemotePhpUnitCommand {
    /**
     * Get user's defined SSH paths mapping.
     *
     * @return {object}
     */
    get paths(): object {
        return this.extConfiguration.get('docker.paths') || {};
    }

    /**
     * Get docker command or throw an error if not provided.
     *
     * @return {string}
     */
    get dockerCommand(): string {
        if (this.extConfiguration.get('docker.command')) {
            return this.extConfiguration.get('docker.command') || '';
        }

        const msg = 'No yet-phpunit.docker.command was specified in the settings';
        window.showErrorMessage(msg);

        throw msg;
    }

    /**
     * Generate the Docker command.
     *
     * @param  {string} command
     * @return {string}
     */
    generateCommand(command: string) {
        if (this.extConfiguration.get('ssh.enable')) {
            return super.generateCommand(`${this.dockerCommand} ${command}`);
        }

        return `${this.dockerCommand} ${command}`;
    }
} 