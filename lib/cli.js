"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const bullseye = require("./index");
if (require.main === module) {
    yargs(process.argv.slice(2))
        .usage('Usage: $0 command [command-options]')
        .help();
    const argv = yargs.argv;
    if (argv._.length === 0) {
        yargs.showHelp();
    }
    else {
        const cmd = argv._.slice();
        let p = Promise.resolve();
        if (cmd.length) {
            if (cmd[0].endsWith('.js')) {
                p = bullseye.monitorModule(cmd[0], cmd.slice(1));
            }
            else {
                p = bullseye.monitor(cmd);
            }
            p.then(handle => {
                process.once('beforeExit', () => handle.stop());
                process.once('exit', () => handle.stop());
                handle.promise.catch(error => {
                    console.error(error);
                    process.exit(1);
                });
            });
        }
        process.on('SIGINT', () => process.exit());
        process.on('SIGTERM', () => process.exit());
        process.on('uncaughtException', error => {
            console.error(error);
            process.exit(1);
        });
        p.catch(error => {
            console.error(error);
            process.exit(1);
        });
    }
}
else {
    throw new Error('bullseye/cli is meant to be called at the command line.');
}
