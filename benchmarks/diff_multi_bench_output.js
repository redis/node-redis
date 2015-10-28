'use strict';

var fs = require('fs');
var metrics = require('metrics');
    // `node diff_multi_bench_output.js beforeBench.txt afterBench.txt`
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

var before_lines = fs.readFileSync(file1, 'utf8').split('\n');
var after_lines = fs.readFileSync(file2, 'utf8').split('\n');
var total_ops = new metrics.Histogram.createUniformHistogram();

console.log('Comparing before,', file1, '(', before_lines.length, 'lines)', 'to after,', file2, '(', after_lines.length, 'lines)');

function is_whitespace(s) {
    return !!s.trim();
}

function pad(input, len, chr, right) {
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
function humanize_diff(num, unit, toFixed) {
    unit = unit || '';
    if (num > 0) {
        return ' +' + pad(num.toFixed(toFixed || 0) + unit, 7);
    }
    return ' -' + pad(Math.abs(num).toFixed(toFixed || 0) + unit, 7);
}

function command_name(words) {
    var line = words.join(' ');
    return line.substr(0, line.indexOf(','));
}

before_lines.forEach(function(b, i) {
    var a = after_lines[i];
    if (!a || !b || !b.trim() || !a.trim()) {
        // console.log('#ignored#', '>'+a+'<', '>'+b+'<');
        return;
    }
    var b_words = b.split(' ').filter(is_whitespace);
    var a_words = a.split(' ').filter(is_whitespace);

    var ops = [b_words, a_words].map(function(words) {
        // console.log(words);
        return words.slice(-2, -1) | 0;
    }).filter(function(num) {
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
    total_ops.update(delta);
    delta = humanize_diff(delta);
    var small_delta = pct < 3 && pct > -3;
    // Let's mark differences above 20% bold
    var big_delta = pct > 20 || pct < -20 ? ';1' : '';
    pct = humanize_diff(pct, '', 2) + '%';
    var str = pad((command_name(a_words) === command_name(b_words) ? command_name(a_words) + ':' : '404:'), 14, false, true) +
        (pad(ops.join(' -> '), 15) + ' ops/sec (∆' + delta + pct + ')');
    str = (small_delta ? '' : (/-[^>]/.test(str) ? '\x1b[31' : '\x1b[32') + big_delta + 'm') + str + '\x1b[0m';
    console.log(str);
});

console.log('Mean difference in ops/sec:', humanize_diff(total_ops.mean(), '', 1));
