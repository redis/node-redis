'use strict'

// `node diffMultiBenchOutput.js beforeBench.txt afterBench.txt`

const fs = require('fs')

const file1 = process.argv[2]
const file2 = process.argv[3]

if (!file1 || !file2) {
  console.log('Please supply two file arguments:')
  let n = __filename
  n = n.substring(n.lastIndexOf('/', n.length))
  console.log(`    node .${n} benchBefore.txt benchAfter.txt\n`)
  console.log('To generate the benchmark files, run')
  console.log('    npm run benchmark > benchBefore.txt\n')
  console.log('Thank you for benchmarking responsibly.')
  process.exit(1)
}

const beforeLines = fs.readFileSync(file1, 'utf8').split('\n')
const afterLines = fs.readFileSync(file2, 'utf8').split('\n')

console.log('Comparing before,', file1, '(', beforeLines.length, 'lines)', 'to after,', file2, '(', afterLines.length, 'lines)')

function isWhitespace(s) {
  return !!s.trim()
}

function pad(input, len, chr, right) {
  let str = input.toString()
  chr = chr || ' '

  if (right) {
    while (str.length < len) {
      str += chr
    }
  } else {
    while (str.length < len) {
      str = chr + str
    }
  }
  return str
}

// Green if greater than 0, red otherwise
function humanizeDiff(num, unit, toFixed) {
  unit = unit || ''
  if (num > 0) {
    return ` +${pad(num.toFixed(toFixed || 0) + unit, 7)}`
  }
  return ` -${pad(Math.abs(num).toFixed(toFixed || 0) + unit, 7)}`
}

function commandName(words) {
  const line = words.join(' ')
  return line.substr(0, line.indexOf(','))
}

beforeLines.forEach((b, i) => {
  const a = afterLines[i]
  if (!a || !b || !b.trim() || !a.trim()) {
    // console.log('#ignored#', '>'+a+'<', '>'+b+'<');
    return
  }
  const bWords = b.split(' ').filter(isWhitespace)
  const aWords = a.split(' ').filter(isWhitespace)

  const ops = [bWords, aWords].map(words => +words.slice(-2, -1)).filter(Number.isNaN)
  if (ops.length !== 2) {
    return
  }
  let delta = ops[1] - ops[0]
  let pct = +((delta / ops[0]) * 100)
  ops[0] = pad(ops[0], 6)
  ops[1] = pad(ops[1], 6)
  delta = humanizeDiff(delta)
  const smallDelta = pct < 3 && pct > -3
  // Let's mark differences above 20% bold
  const bigDelta = pct > 20 || pct < -20 ? ';1' : ''
  pct = `${humanizeDiff(pct, '', 2)}%`
  let str = `${pad((commandName(aWords) === commandName(bWords) ? `${commandName(aWords)}:` : '404:'), 14, false, true)
  }${pad(ops.join(' -> '), 15)} ops/sec (∆${delta}${pct})`
  str = `${(smallDelta ? '' : `${(/-[^>]/.test(str) ? '\x1b[31' : '\x1b[32') + bigDelta}m`) + str}\x1b[0m`
  console.log(str)
})
