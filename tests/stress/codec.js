var json = {
	encode: JSON.stringify,
	decode: JSON.parse
};

/*var msgpack = require('node-msgpack');
msgpack = {
	encode: msgpack.pack,
	decode: msgpack.unpack
};*/

bison = require('bison');

module.exports = json;
