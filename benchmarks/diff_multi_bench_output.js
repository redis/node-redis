'use strict';

var fs = require('fs');
var metrics = require('metrics');
    // `node diffMultiBenchOutput.js beforeBench.txt afterBench.txt`
var file1 = process.argv[2];
var file2 = process.argv[3];

if (!file1 || !file2) {
    console.log('Please supply two file arguments:');
    var n = __filename;
    n = n.substring(n.lastIndexOf('/', n.length));
    console.log('    node .' + n + ' benchBefore.txt benchAfter.txt\n');
    console.log('To generate the benchmark files, run');
    console.log('    npm run benchmark > benchBefore.txt\n');
    console.log('Thank you for benchmarking responsibly.');
    return;
}

var beforeLines = fs.readFileSync(file1, 'utf8').split('\n');
var afterLines = fs.readFileSync(file2, 'utf8').split('\n');
var totalOps = new metrics.Histogram.createUniformHistogram();

console.log('Comparing before,', file1, '(', beforeLines.length, 'lines)', 'to after,', file2, '(', afterLines.length, 'lines)');

function isWhitespace (s) {
    return !!s.trim();
}

function pad (input, len, chr, right) {
    var str = input.toString();
    chr = chr || ' ';

    if (right) {
        while (str.length < len) {
            str += chr;
        }
    } else {
        while (str.length < len) {
            str = chr + str;
        }
    }
    return str;
}

// green if greater than 0, red otherwise
function humanizeDiff (num, unit, toFixed) {
    unit = unit || '';
    if (num > 0) {
        return ' +' + pad(num.toFixed(toFixed || 0) + unit, 7);
    }
    return ' -' + pad(Math.abs(num).toFixed(toFixed || 0) + unit, 7);
}

function commandName (words) {
    var line = words.join(' ');
    return line.substr(0, line.indexOf(','));
}

beforeLines.forEach(function (b, i) {
    var a = afterLines[i];
    if (!a || !b || !b.trim() || !a.trim()) {
        // console.log('#ignored#', '>'+a+'<', '>'+b+'<');
        return;
    }
    var bWords = b.split(' ').filter(isWhitespace);
    var aWords = a.split(' ').filter(isWhitespace);

    var ops = [bWords, aWords].map(function (words) {
        // console.log(words);
        return words.slice(-2, -1) | 0;
    }).filter(function (num) {
        var isNaN = !num && num !== 0;
        return !isNaN;
    });
    if (ops.length !== 2) {
        return;
    }
    var delta = ops[1] - ops[0];
    var pct = +((delta / ops[0]) * 100);
    ops[0] = pad(ops[0], 6);
    ops[1] = pad(ops[1], 6);
    totalOps.update(delta);
    delta = humanizeDiff(delta);
    var smallDelta = pct < 3 && pct > -3;
    // Let's mark differences above 20% bold
    var bigDelta = pct > 20 || pct < -20 ? ';1' : '';
    pct = humanizeDiff(pct, '', 2) + '%';
    var str = pad((commandName(aWords) === commandName(bWords) ? commandName(aWords) + ':' : '404:'), 14, false, true) +
        (pad(ops.join(' -> '), 15) + ' ops/sec (∆' + delta + pct + ')');
    str = (smallDelta ? '' : (/-[^>]/.test(str) ? '\x1b[31' : '\x1b[32') + bigDelta + 'm') + str + '\x1b[0m';
    console.log(str);
});

console.log('Mean difference in ops/sec:', humanizeDiff(totalOps.mean(), '', 1));
