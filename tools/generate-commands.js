'use strict';

var fs = require('fs');
var commands = require('redis-commands');
var commandNotes = require('./commandNotes.json');

var README_PATH = './README.md';
var DOC_BEFORE = '| Command  | Supported | Notes |\n|----------|-----------|-------|';
var DOC_AFTER = '## Contributors';

// Create table rows for each supported command + notes if any
var commandsList = commands.list
    .map(function (cmd) {
        return [cmd, ':white_check_mark:', commandNotes[cmd] || ' '].join(' | ');
    })
    .join('\n');

// Replace old commands list in README and write to disk
var readme = fs.readFileSync(README_PATH, 'utf8');
var readmeBefore = readme.substr(0, readme.indexOf(DOC_BEFORE) + DOC_BEFORE.length);
var readmeAfter = readme.substr(readme.indexOf(DOC_AFTER));
fs.writeFileSync(README_PATH, readmeBefore + '\n' + commandsList + '\n\n' + readmeAfter, 'utf8');

console.log('Done!');
