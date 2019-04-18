import { PhpUnitCommand } from './phpunit';

export class RemotePhpUnitCommand extends PhpUnitCommand {
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
    get binary(): string {
        return this.remapLocalPath(super.binary);
    }

    /**
     * Get actual command to run.
     *
     * @return {string}
     */
    get output(): string {
        return this.generateCommand(super.output);
    }

    /**
     * Get user's defined SSH paths mapping.
     *
     * @return {object}
     */
    get paths(): object {
        return this.extConfiguration.get('ssh.paths') || {};
    }

    /**
     * Get SSH agent binary.
     *
     * @return {string}
     */
    get sshBinary(): string {
        return this.extConfiguration.get('ssh.binary') || 'ssh';
    }

    /**
     * Get remote file based on local path.
     *
     * @param  {string} actualPath
     * @return {string} 
     */
    remapLocalPath(actualPath: string): string {
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
    generateCommand(command: string): string {
        const user = this.extConfiguration.get('ssh.user');
        const port = this.extConfiguration.get('ssh.port');
        const host = this.extConfiguration.get('ssh.host');
        const options = this.extConfiguration.get('ssh.options') || '';

        // Build options string    
        const optionsString = `-tt -p${port} ${user}@${host} ${options}`;

        return `${this.sshBinary} ${optionsString}"${command}"`;
    }
}
