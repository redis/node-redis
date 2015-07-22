'use strict';

var assert = require("assert");
var Queue = require('../lib/queue');

module.exports = function (tests, next) {
  var q = new Queue();

  tests.push = function () {
    q.push('a');
    q.push(3);
    assert.equal(q.length, 2);
    return next();
  };

  tests.shift = function () {
    assert.equal(q.shift(), 'a');
    return next();
  };

  tests.forEach = function () {
    q.forEach(function (v) {
      assert.equal(v, 3);
    });

    return next();
  };

  tests.forEachWithScope = function () {
    q.forEach(function (v) {
      assert.equal(this.foo, 'bar');
      assert.equal(v, 3);
    }, {foo: 'bar'});

    return next();
  };
};
