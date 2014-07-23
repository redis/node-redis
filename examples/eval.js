var redis = require("../index"),
    client = redis.createClient();

redis.debug_mode = true;

client.eval("return 100.5", 0, function (err, res) {
    console.dir(err);
    console.dir(res);
});

client.eval([ "return 100.5", 0 ], function (err, res) {
    console.dir(err);
    console.dir(res);
});


client.eval("return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}", ["a", "b"], ["c", "d"], function (err, res) {
	console.dir(err);
	console.dir(res);
});

 //test {EVAL - Allow variadic KEYS and ARGS to be passed to script in array format}
client.eval(["return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}", ["a", "b"], ["c", "d"]], function (err, res) {
    console.dir(err);
    console.dir(res);
});

//test {EVAL - Script with no arguments}
client.eval("return 1", function (err, res) {
    console.dir(err);
    console.dir(res);
});

//test {EVAL - Script with no arguments in array format}
client.eval(["return 1"], function (err, res) {
    console.dir(err);
    console.dir(res);
});

//test {EVAL - Script with only KEYS}
client.eval("return {KEYS[1], KEYS[2]}", ["key1", "key2"], function (err, res) {
    console.dir(err);
    console.dir(res);
});

//test {EVAL - Script with only KEYS in array format}
client.eval(["return {KEYS[1], KEYS[2]}", ["key1", "key2"]], function (err, res) {
    console.dir(err);
    console.dir(res);
});