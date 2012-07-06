var assert = require('assert');
var client1 = require("../index").createClient(10000, '0.0.0.0',{
	max_attempts : 1
});
var client2 = require("../index").createClient(10000, '0.0.0.0',{
	max_attempts : 1,
	disable_offline_queue : true
});

client1.on('error', function(){

});

client2.on('error', function(){

});

setTimeout(function(){
	var client1Error = false;
	client1.subscribe('x', function(error, result){
		client1Error = error;
	});

	setTimeout(function(){
		assert.strictEqual(client1.offline_queue.length, 1);
		assert.strictEqual(client1Error, false);
		console.log('Test 1 passed');
	}, 1000);


	client2.subscribe('x', function(error, result){
		assert.strictEqual(client2.offline_queue.length, 0);
		assert.strictEqual(error instanceof Error, true);
		console.log('Test 2 passed');
	});

}, 2000);