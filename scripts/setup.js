import * as fs from 'fs'
import { exec } from 'child_process'

// NOTE: Can run this command manually with the --force flag to overwrite
// the existing commit-msg hook.

// If we're not in development mode then we exit.
if (process.env.NODE_ENV !== 'development' &&
    process.env.NODE_ENV !== undefined) {
  process.exit(0)
}

function setCommitTemplate () {
  exec('git config commit.template commit.template', (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(stderr || error)
    } else {
      console.log('Successfully set commit template!')
    }
  })
}

function instlalCommitHook ({ force = false } = {}) {
  // If the commit-msg hook does not exist yet then we create one.
  fs.stat('.git/hooks/commit-msg', (error, stats) => {
    const hookSource = getHookSource()
    const options = { encoding: 'utf8', mode: 0o755 }

    if (force || error) {
      fs.writeFile('.git/hooks/commit-msg', hookSource, options, error => {
        if (error) {
          console.error('Failed to create commit-msg hook:' + error)
        } else {
          console.info('Successfully installed commit-msg hook!')
        }
      })
    } else {
      console.info('Skipping creating commit-msg hook since it already exists.')
    }
  })
}

function getHookSource () {
  return [
    '#!/bin/sh',
    '',
    'node scripts/commit-msg "$1"'
  ].join('\n')
}

// Entry
instlalCommitHook({ force: process.argv.slice(2).includes('--force') })
setCommitTemplate()
