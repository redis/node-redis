'use strict';

// Read a file from disk, store it in Redis, then read it back from Redis.

var redis = require('redis');
var client = redis.createClient({
    return_buffers: true
});
var fs = require('fs');
var assert = require('assert');
var filename = 'grumpyCat.jpg';

// Get the file I use for testing like this:
//    curl http://media4.popsugar-assets.com/files/2014/08/08/878/n/1922507/caef16ec354ca23b_thumb_temp_cover_file32304521407524949.xxxlarge/i/Funny-Cat-GIFs.jpg -o grumpyCat.jpg
// or just use your own file.

// Read a file from fs, store it in Redis, get it back from Redis, write it back to fs.
fs.readFile(filename, function (err, data) {
    if (err) throw err;
    console.log('Read ' + data.length + ' bytes from filesystem.');

    client.set(filename, data, redis.print); // set entire file
    client.get(filename, function (err, reply) { // get entire file
        if (err) {
            console.log('Get error: ' + err);
        } else {
            assert.strictEqual(data.inspect(), reply.inspect());
            fs.writeFile('duplicate_' + filename, reply, function (err) {
                if (err) {
                    console.log('Error on write: ' + err);
                } else {
                    console.log('File written.');
                }
                client.end();
            });
        }
    });
});
