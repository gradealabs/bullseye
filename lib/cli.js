#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const bullseye = require("./index");
if (require.main === module) {
    yargs(process.argv.slice(2))
        .usage('Usage: $0 command [command-options]')
        .help();
    const argv = process.argv.slice(2);
    if (argv.length === 0) {
        yargs.showHelp();
    }
    else {
        const cmd = argv.slice();
        let p = Promise.resolve();
        if (cmd.length) {
            if (cmd[0].endsWith('.js')) {
                // server.js --arg --arg -- [execArgv] --waitForReady
                const k = cmd.indexOf('--');
                const execArgv = k > 0 ? cmd.slice(k).slice(1) : [];
                const waitForReady = execArgv.includes('--waitForReady');
                const args = k > 0 ? cmd.slice(0, k) : cmd.slice();
                p = bullseye.monitorModule(cmd[0], args, {
                    env: process.env,
                    execArgv: execArgv.filter(x => x !== '--waitForReady'),
                    waitForReady
                });
            }
            else {
                p = bullseye.monitor(cmd.join(' '));
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
