// the "new Array(len)" syntax is legal and optimized by V8, but JSHint is utterly confused by it.
function to_array(args) {
    var len = args.length,
        arr = new Array(len), i;

    for (i = 0; i < len; i += 1) {
        arr[i] = args[i];
    }

    return arr;
};

module.exports = to_array;
