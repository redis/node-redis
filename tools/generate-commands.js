'use strict';

var fs = require('fs');
var commands = require('redis-commands');
var commandNotes = require('./commandNotes.json');

var DOCUMENT_PATH = './COMMANDS.md';
var DOC_BEFORE = '| Command  | Supported | Notes |\n|----------|-----------|-------|';

// Create table rows for each supported command + notes if any
var commandsList = commands.list
    .map(function (cmd) {
        return [cmd, ':white_check_mark:', commandNotes[cmd] || ' '].join(' | ');
    })
    .join('\n');

// Replace old commands list in README and write to disk
var readme = fs.readFileSync(DOCUMENT_PATH, 'utf8');
var readmeBefore = readme.substr(0, readme.indexOf(DOC_BEFORE) + DOC_BEFORE.length);
fs.writeFileSync(DOCUMENT_PATH, readmeBefore + '\n' + commandsList, 'utf8');

console.log('Done!');
