"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const findUp = require("find-up");
const vscode_1 = require("vscode");
const path_1 = require("path");
class PhpUnitCommand {
    constructor(options = {}) {
        this.lastOutput = '';
        this.runAll = options.runAll || false;
        this.runClass = options.runClass || false;
        this.methodToTest = options.method || null;
        this.pathOfTests = options.uri || null;
        // Load extension configuration
        this.extConfiguration = vscode_1.workspace.getConfiguration('yet-phpunit');
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
    get file() {
        // If there's a path of file or folder to test, return it
        if (this.pathOfTests !== null) {
            return this.pathOfTests;
        }
        return this._normalizePath(vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.document.fileName : '');
    }
    /**
     * Generate additional filter for PHPUnit.
     *
     * @return {string}
     */
    get filter() {
        return process.platform === 'win32'
            ? (this.method ? ` --filter '^.*::${this.method}$'` : '')
            : (this.method ? ` --filter '^.*::${this.method}( .*)?$'` : '');
    }
    /**
     * Get PHPUnit configuration file path.
     *
     * @return {string}
     */
    get configuration() {
        let configFilepath = this.extConfiguration.get('xmlConfigFilepath');
        if (configFilepath !== null) {
            return ` --configuration ${configFilepath}`;
        }
        return this.subDirectory
            ? ` --configuration ${this._normalizePath(path_1.join(this.subDirectory, 'phpunit.xml'))}`
            : '';
    }
    /**
     * Get user's desired command suffix.
     *
     * @return {string}
     */
    get suffix() {
        let suffix = this.extConfiguration.get('commandSuffix') || '';
        return ' ' + suffix; // Add a space before the suffix
    }
    /**
     * Get PHPUnit bin file.
     *
     * @return {string}
     */
    get binary() {
        if (this.extConfiguration.get('phpunitBinary')) {
            return this.extConfiguration.get('phpunitBinary') || '';
        }
        return this.subDirectory
            ? this._normalizePath(path_1.join(this.subDirectory, 'vendor', 'bin', 'phpunit'))
            : this._normalizePath(path_1.join(vscode_1.workspace.rootPath || '', 'vendor', 'bin', 'phpunit'));
    }
    /**
     * Get the subdirectory path of PHPUnit configuration file if not in the project root.
     *
     * @return {string|null}
     */
    get subDirectory() {
        // Find the closest phpunit.xml file in the project (for projects with multiple 'vendor/bin/phpunit's).
        const phpunitDotXml = findUp.sync(['phpunit.xml', 'phpunit.xml.dist'], {
            cwd: vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.document.fileName : '',
        });
        return path_1.dirname(phpunitDotXml) !== vscode_1.workspace.rootPath
            ? path_1.dirname(phpunitDotXml)
            : null;
    }
    /**
     * Get the nearest method from the cursor position.
     *
     * @return {string}
     */
    get method() {
        // Return if user wants to test the full class (from CodeLens) or a path is provided
        if (this.runClass || this.pathOfTests !== null) {
            return '';
        }
        // If there's a method passed as arg from CodeLens, run it
        if (this.methodToTest !== null) {
            return this.methodToTest;
        }
        let line = vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.selection.active.line : 0;
        let method = '';
        while (line > 0) {
            const lineText = vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.document.lineAt(line).text : '';
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
    _normalizePath(path) {
        return path
            .replace(/\\/g, '/') // Convert backslashes from windows paths to forward slashes, otherwise the shell will ignore them.
            .replace(/ /g, '\\ '); // Escape spaces.
    }
}
exports.PhpUnitCommand = PhpUnitCommand;
//# sourceMappingURL=phpunit.js.map