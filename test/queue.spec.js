var assert = require("assert");
var Queue = require('../lib/queue');

describe('queue', function () {
  var q = new Queue();

  describe('push', function () {
    it('places values on end of queue', function () {
      q.push('a');
      q.push(3);
      assert.equal(q.length, 2);
    });
  });

  describe('shift', function () {
    it('removes values from front of queue', function () {
      assert.equal(q.shift(), 'a');
    });
  });

  describe('forEach', function () {
    it('iterates over values in queue', function () {
      q.forEach(function (v) {
        assert.equal(v, 3);
      });
    });
  });

  describe('forEachWithScope', function () {
    it('provides a scope to the iteration function', function () {
      q.forEach(function (v) {
        assert.equal(this.foo, 'bar');
        assert.equal(v, 3);
      }, {foo: 'bar'});
    });
  });
});
