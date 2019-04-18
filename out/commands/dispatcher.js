"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const phpunit_1 = require("./phpunit");
const docker_1 = require("./docker");
const remote_1 = require("./remote");
function Dispatcher(commandOptions = {}) {
    const configuration = vscode_1.workspace.getConfiguration('yet-phpunit');
    let command = new phpunit_1.PhpUnitCommand(commandOptions);
    if (configuration.get('docker.enable')) {
        command = new docker_1.DockerPhpUnitCommand(commandOptions);
    }
    else if (configuration.get('ssh.enable')) {
        command = new remote_1.RemotePhpUnitCommand(commandOptions);
    }
    return command;
}
exports.default = Dispatcher;
//# sourceMappingURL=dispatcher.js.map