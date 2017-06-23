# Bullseye

A simple process monitor for fast dev-reload cycles.

## Quick Start

    npm install @gradealabs/bullseye -D

To use the API:

    import * as bullseye from '@gradealabs/bullseye'

    let serverHandle = null
    bullseye.monitorModule('./server.js', {
      waitForReady: true,
      env: process.env,
      execArgv: '-r babel/register'
    }).then(handle => {
      serverHandle = handle
    })

    // Somewhere else in the code after source code has changed...
    if (serverHandle) {
      serverHandle.restart()
        .then(handle => {
           serverHandle = handle
        })
    }

To use the CLI (spawned process):

    {
      "scripts": {
        "dev": "bullseye node -r babel/register ./server"
      }
    }

To use the CLI (forked module):

    {
      "scripts": {
        "dev": "bullseye ./server.js --arg value --arg2 -- -r babel/register --waitForReady"
      }
    }

When specifying a `.js` file as the command, arguments are parsed a bit
differently. All arguments before `--` are passed to the forked process whereas
all arguments after `--` are assumed to be `execArgv` arguments, except for
`--waitForReady`.

## Graceful Shutdown

A module being monitored by `bullseye` needs to respond to `shutdown` message to
gracefully shutdown.

Example:

    const http = require('http');

    const hostname = '127.0.0.1';
    const port = 3000;

    // Handle the 'shutdown' message.
    process.on('message', msg => {
      if (msg === 'shutdown') {
        process.exit()
      }
    })

    const server = http.createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Hello World\n');
    });

    server.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}/`);
    });

Normal processes (i.e. not modules) are terminated/restarted by sending the
signal `SIGINT`.

## CLI

Usage: bullseye command [command-options]

Options:
  --help  Show help                                                    [boolean]

Example:

    ./node_modules/.bin/bullseye ./server.js --port 8080 -- -r babel/register --waitForReady

Or in a `package.json` (installed locally):

    {
      "scripts": {
        "dev": "bullseye ./server.js --port 8080 -- -r babel/register --waitForReady"
      }
    }

## API

**monitor(cmd, options)**

Monitor a child process by spawning it.

Supported options:

- `env` Envionrment variables to pass to the child process
- `silent` Determines if the stdout/stderr is piped (`true`) or inherited (`false`)

Returns a Promise that resolves to a process handle that has the following shape

    {
      promise,
      get stopped () {},
      get started () {},
      stop (): Promise<void>,
      restart (): Promise<Handle>
    }

Where `handle.promise` is a promise that will be resolved/rejected when the
child process exits or encounters an error.

Example:

    import { monitor } from '@gradealabs/bullseye'

    monitor('node -r babel/register server.js', { env: process.env })
      .then(handle => {
        ...
      })

**monitorModule(moduleName, args, options)**

Moniors a forked child process that runs a node module.

Supported options:

- `env` Envionrment variables to pass to the child process
- `silent` Determines if the stdout/stderr is piped (`true`) or inherited (`false`)
- `waitForReady` Determines if bullseye should wait for the `ready` message before deeming the process ready
- `execPath` Executable used to create the child process
- `execArgv` List of string arguments passed to the executable (can also be a string)

Returns a Promise that resolves to a process handle that has the following shape

    {
      promise,
      get stopped () {},
      get started () {},
      stop (): Promise<void>,
      restart (): Promise<Handle>
    }

Where `handle.promise` is a promise that will be resolved/rejected when the
child process exits or encounters an error.

Example:

    import { monitorModule } from '@gradealabs/bullseye'

    monitorModule('server.js', [], {
      env: process.env,
      waitForReady: true,
      execArgv: '-r babel/register'
    }).then(handle => {
      ...
    })

**Ready Message**

When `waitReady` is `true`, a module must signal it's ready by sending the
`ready` message like the following:

    if (process.connected) {
      process.send('ready')
    }

Modules have 5 seconds to send this message before bullseye will assume the
module is ready.

## Building

To build the source

    npm run build
    npm run build:node

To clean all generated folders

    npm run clean

## Testing

Unit tests are expected to be colocated next to the module/file they are testing
and have the following suffix `.test.js`.

To run unit tests through [istanbul](https://istanbul.js.org/) and
[mocha](http://mochajs.org/)

    npm test

## Maintainence

To check what modules in `node_modules` is outdated

    npm run audit

To update outdated modules while respecting the semver rules in the package.json

    npm update

To update a module to the latest major version (replacing what you have)

    npm install themodule@latest -S (if to save in dependencies)
    npm install themodule@latest -D (if to save in devDependencies)
