import * as findUp from 'find-up';
import { workspace, window, WorkspaceConfiguration }  from 'vscode';
import { join as joinPath, dirname as dirnamePath } from 'path';
import { CommandOptions } from '../types/commandOptions';

export class PhpUnitCommand {
    public lastOutput: string = '';

    private runAll: boolean;
    private runClass: boolean;
    private methodToTest: string | null;
    private pathOfTests: string | null;

    protected extConfiguration: WorkspaceConfiguration;

    constructor (options: CommandOptions = {}) {
        this.runAll = options.runAll || false;
        this.runClass = options.runClass || false;
        this.methodToTest = options.method || null;
        this.pathOfTests = options.uri || null;

        // Load extension configuration
        this.extConfiguration = workspace.getConfiguration('yet-phpunit');
    }

    /**
     * Get actual command to run.
     *
     * @return {string}
     */
    get output() {
        if (this.lastOutput) {
            return this.lastOutput;
        }

        this.lastOutput = this.runAll
            ? `${this.binary} ${this.suffix}`
            : `${this.binary} ${this.file}${this.filter}${this.configuration}${this.suffix}`;

        return this.lastOutput;
    }

    /**
     * Get file/folder of test(s) to run.
     *
     * @return {string}
     */
    get file(): string {
        // If there's a path of file or folder to test, return it
        if (this.pathOfTests !== null) {
            return this.pathOfTests;
        }

        return this._normalizePath(window.activeTextEditor ? window.activeTextEditor.document.fileName : '');
    }

    /**
     * Generate additional filter for PHPUnit.
     *
     * @return {string}
     */
    get filter(): string {
        return process.platform === 'win32'
            ? (this.method ? ` --filter '^.*::${this.method}$'` : '')
            : (this.method ? ` --filter '^.*::${this.method}( .*)?$'` : '');
    }

    /**
     * Get PHPUnit configuration file path.
     *
     * @return {string}
     */
    get configuration(): string {
        let configFilepath = this.extConfiguration.get('xmlConfigFilepath');
        if (configFilepath !== null) {
            return ` --configuration ${configFilepath}`;
        }

        return this.subDirectory
            ? ` --configuration ${this._normalizePath(joinPath(this.subDirectory, 'phpunit.xml'))}`
            : '';
    }

    /**
     * Get user's desired command suffix.
     *
     * @return {string}
     */
    get suffix(): string {
        let suffix = this.extConfiguration.get('commandSuffix') || '';

        return ' ' + suffix; // Add a space before the suffix
    }

    /**
     * Get PHPUnit bin file.
     *
     * @return {string}
     */
    get binary(): string {
        if (this.extConfiguration.get('phpunitBinary')) {
            return this.extConfiguration.get('phpunitBinary') || '';
        }

        return this.subDirectory
            ? this._normalizePath(joinPath(this.subDirectory, 'vendor', 'bin', 'phpunit'))
            : this._normalizePath(joinPath(workspace.rootPath || '', 'vendor', 'bin', 'phpunit'));
    }

    /**
     * Get the subdirectory path of PHPUnit configuration file if not in the project root.
     *
     * @return {string|null}
     */
    get subDirectory(): string | null {
        // Find the closest phpunit.xml file in the project (for projects with multiple 'vendor/bin/phpunit's).
        const phpunitDotXml = findUp.sync(['phpunit.xml', 'phpunit.xml.dist'], {
            cwd: window.activeTextEditor ? window.activeTextEditor.document.fileName : '',
        });

        return dirnamePath(phpunitDotXml) !== workspace.rootPath
            ? dirnamePath(phpunitDotXml)
            : null;
    }

    /**
     * Get the nearest method from the cursor position.
     *
     * @return {string}
     */
    get method(): string {
        // Return if user wants to test the full class (from CodeLens) or a path is provided
        if (this.runClass || this.pathOfTests !== null) {
            return '';
        }

        // If there's a method passed as arg from CodeLens, run it
        if (this.methodToTest !== null) {
            return this.methodToTest;
        }

        let line: number = window.activeTextEditor ? window.activeTextEditor.selection.active.line : 0;
        let method: string = '';

        while (line > 0) {
            const lineText: string = window.activeTextEditor ? window.activeTextEditor.document.lineAt(line).text : '';
            const match = lineText.match(/^\s*(?:public|private|protected)?\s*function\s*(\w+)\s*\(.*$/);
            if (match) {
                method = match[1];
                break;
            }

            line = line - 1;
        }

        return method;
    }

    /**
     * Normalize a path.
     *
     * @param  {string} path
     * @return {string} 
     */
    protected _normalizePath(path: string) {
        return path
            .replace(/\\/g, '/') // Convert backslashes from windows paths to forward slashes, otherwise the shell will ignore them.
            .replace(/ /g, '\\ '); // Escape spaces.
    }
}
