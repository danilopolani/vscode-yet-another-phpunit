"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const phpunit_1 = require("./phpunit");
class RemotePhpUnitCommand extends phpunit_1.PhpUnitCommand {
    /**
     * Get current path of file/folder on remote host.
     *
     * @return {string}
     */
    get file() {
        return this.remapLocalPath(super.file);
    }
    /**
     * Get PHPUnit binary file on remote host.
     *
     * @return {string}
     */
    get binary() {
        return this.remapLocalPath(super.binary);
    }
    /**
     * Get actual command to run.
     *
     * @return {string}
     */
    get output() {
        return this.generateCommand(super.output);
    }
    /**
     * Get user's defined SSH paths mapping.
     *
     * @return {object}
     */
    get paths() {
        return this.extConfiguration.get('ssh.paths') || {};
    }
    /**
     * Get SSH agent binary.
     *
     * @return {string}
     */
    get sshBinary() {
        return this.extConfiguration.get('ssh.binary') || 'ssh';
    }
    /**
     * Get remote file based on local path.
     *
     * @param  {string} actualPath
     * @return {string}
     */
    remapLocalPath(actualPath) {
        for (const [localPath, remotePath] of Object.entries(this.paths)) {
            if (actualPath.startsWith(localPath)) {
                return actualPath.replace(localPath, remotePath);
            }
        }
        return actualPath;
    }
    /**
     * Generate the SSH command.
     *
     * @param  {string} command
     * @return {string}
     */
    generateCommand(command) {
        const user = this.extConfiguration.get('ssh.user');
        const port = this.extConfiguration.get('ssh.port');
        const host = this.extConfiguration.get('ssh.host');
        const options = this.extConfiguration.get('ssh.options') || '';
        const shellAppend = this.extConfiguration.get('ssh.shellAppend');
        // Build options string
        let optionsString = '';
        // If not plink (PuTTy), run standard SSH command
        if (this.sshBinary.indexOf('plink') === -1) {
            optionsString = `-tt -p${port} ${user}@${host} ${options}`;
        }
        else {
            optionsString = `${user}@${host} ${port ? '-P ' + port : ''} ${options}`;
        }
        return `${this.sshBinary} ${optionsString}"${command}"${shellAppend ? ' ' + shellAppend : ''}`;
    }
}
exports.RemotePhpUnitCommand = RemotePhpUnitCommand;
//# sourceMappingURL=remote.js.map