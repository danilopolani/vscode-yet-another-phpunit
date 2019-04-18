"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const remote_1 = require("./remote");
class DockerPhpUnitCommand extends remote_1.RemotePhpUnitCommand {
    /**
     * Get user's defined SSH paths mapping.
     *
     * @return {object}
     */
    get paths() {
        return this.extConfiguration.get('docker.paths') || {};
    }
    /**
     * Get docker command or throw an error if not provided.
     *
     * @return {string}
     */
    get dockerCommand() {
        if (this.extConfiguration.get('docker.command')) {
            return this.extConfiguration.get('docker.command') || '';
        }
        const msg = 'No yet-phpunit.docker.command was specified in the settings';
        vscode_1.window.showErrorMessage(msg);
        throw msg;
    }
    /**
     * Generate the Docker command.
     *
     * @param  {string} command
     * @return {string}
     */
    generateCommand(command) {
        if (this.extConfiguration.get('ssh.enable')) {
            return super.generateCommand(`${this.dockerCommand} ${command}`);
        }
        return `${this.dockerCommand} ${command}`;
    }
}
exports.DockerPhpUnitCommand = DockerPhpUnitCommand;
//# sourceMappingURL=docker.js.map