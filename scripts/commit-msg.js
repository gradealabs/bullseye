/**
 * Command line tool that will check a commit message from a file to
 * ensure it follows our commit message format.
 *
 * Usage:
 * node commit-msg {commit-message-file-name}
 *
 * Our format is based on the guidelines the AngularJS team follows.
 * See: https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit
 */
const fs = require('fs')

// Settings
// NOTE: Could put this in a .json or .js file

const SETTINGS = {
  summaryMaxLength: 50,
  lineMaxLength: 70,
  // If true, will truncate long summaries so they conform to the
  // summaryMaxLength setting and then extract the summary detail and make it
  // the first line in the commit message body.
  extractLongSummaries: true,
  // If true, will automatically insert newlines so that long lines will conform
  // to the lineMaxLength setting.
  autoInsertNewLines: true,
  patterns: {
    short: /^(refactor|feat|test|fix|style|docs|chore|perf)\(.*?\): .*?\n?$/,
    extended: /^(refactor|feat|test|fix|style|docs|chore|perf)\(.*?\): .*?\n*(?:.*?\n*)*$/
  },
  examples: {
    short: [
      'refactor|feat|test|fix|style|docs|chore|perf(<Scope>): <Subject>'
    ],
    extended: [
      'refactor|feat|test|fix|style|docs|chore|perf:(<Scope>): <Subject>',
      '<BLANK LINE>',
      '<Body>',
      '<BLANK LINE>',
      '<Footer>'
    ]
  }
}

// Entry point

if (require.main === module) {
  const args = process.argv.slice(2)
  const fileName = args[0] || null

  if (fileName) {
    const { isValid, errors } = commitMsgHook(fileName, SETTINGS)
    if (isValid) {
      console.log('Commit message OK')
      process.exit(0)
    } else {
      console.error(errors.join('\n'))
      process.exit(1)
    }
  } else {
    console.info([
      'Usage:',
      '',
      'node commit-msg {commit-message-file-name}'
    ])
  }
} else {
  console.error('This script is meant to be used at the command line.')
  process.exit(1)
}

// Helper functions

/*
interface Settings {
  summaryMaxLength: number
  lineMaxLength: number
  extractLongSummaries: boolean
  autoInsertNewLines: boolean,
  patterns?: {
    [name: string]: RegExp
  },
  examples?: {
    [name: string]: string | string[]
  }
}
*/

// commitMsgHook (fileName: string, settings: Settings): { isValid: boolean, errors: Error[] }
function commitMsgHook (fileName, settings) {
  // Commit message can be a file or the actual commit message
  let message = fs.readFileSync(fileName, 'utf8')
  const { isValid, errors } = checkCommitMessage(message, settings)
  const {
    summaryMaxLength,
    lineMaxLength,
    extractLongSummaries,
    autoInsertNewLines
  } = settings

  if (isValid) {
    return { isValid, errors }
  } else {
    // Attempt to fix the commit message.
    if (extractLongSummaries && errors.some(e => e.code === 'ESUMRY')) {
      message = message.split('\n').reduce((message, line, l) => {
        if (l === 0) {
          message +=
            line.substr(0, summaryMaxLength - 3) +
            '...\n\n'
          let detail = line.split(':').slice(1).join(' ').trim()
          if (!detail.endsWith('.')) detail += '.'
          return message + detail
        } else {
          return message + '\n' + line
        }
      }, '')
      // Re-write the commit message file and re-evaluate.
      fs.writeFileSync(fileName, message, 'utf8')
      return commitMsgHook(fileName, settings)
    } else if (autoInsertNewLines && errors.some(e => e.code === 'ELINES')) {
      message = message
        .split('\n')
        .reduce((message, line, l) => {
          // Leave the summary line untouched.
          // (it's skipped by the check as well)
          if (l === 0) {
            return line
          } else if (line.length > lineMaxLength) {
            return message + '\n' + breakLine(line, lineMaxLength).join('\n')
          } else {
            return message + '\n' + line
          }
        }, '')
      // Re-write the commit message file and re-evaluate.
      fs.writeFileSync(fileName, message, 'utf8')
      return commitMsgHook(fileName, settings)
    } else {
      return { isValid, errors }
    }
  }
}

// checkCommitMessage (commitMessage: string, settings: Settings): { isValid:boolean, errors: Error[] }
function checkCommitMessage (commitMessage, settings) {
  const {
    summaryMaxLength,
    lineMaxLength,
    patterns = {},
    examples = {}
  } = settings

  const isSummaryValid = commitMessage
    ? commitMessage.split('\n')[0].length <= summaryMaxLength
    : true
  const linesExceedingMaxLength = commitMessage
    .split('\n')
    .slice(1) // skip the summary line
    .reduce((a, l, k) => {
      return l.length > lineMaxLength
        ? a.concat({ n: k + 2, text: l })
        : a
    }, [])
  const isLineLengthValid = linesExceedingMaxLength.length === 0
  const isPatternValid = Object.keys(patterns || {}).some(key => {
    return patterns[key].test(commitMessage)
  })

  let errors = []

  if (!isSummaryValid) {
    errors = errors.concat(
      Object.assign(new Error(`Summary is more than ${summaryMaxLength} characters.`), {
        code: 'ESUMRY'
      })
    )
  }

  if (!isLineLengthValid) {
    errors = errors.concat(
      Object.assign(new Error([
        `The following lines have more than ${lineMaxLength} characters :`,
        `${linesExceedingMaxLength.map(l => 'line ' + l.n + ' : ' + l.text).join('\n')}`
      ].join('\n')), { code: 'ELINES', lines: linesExceedingMaxLength })
    )
  }

  if (!isPatternValid) {
    errors = errors.concat(
      Object.assign(new Error([
        'Commit message doesn\'t follow any message pattern.'
      ].concat(
        Object.keys(examples || {})
          .map(key => ['', `${key}:`].concat(examples[key]))
          .reduce((a, b) => a.concat(b), [])
      ).join('\n')), { code: 'EFRMT' })
    )
  }

  return {
    isSummaryValid,
    isLineLengthValid,
    linesExceedingMaxLength,
    isPatternValid,
    isValid: isSummaryValid && isLineLengthValid && isPatternValid,
    errors
  }
}

// breakLine (lineOfText: string, maxLength: number): string[]
function breakLine (lineOfText, maxLength) {
  const lines = []
  let currText = lineOfText

  while (currText) {
    if (currText.length <= maxLength) {
      lines.push(currText)
      break
    } else {
      let line = ''
      const words = currText.split(/\b/g)
      while (words.length && line.length + words[0].length < maxLength) {
        line += words.shift()
      }
      if (line) lines.push(line.trim())
      currText = words.join('')
    }
  }

  return lines
}
