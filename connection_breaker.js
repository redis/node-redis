var net = require('net');

var proxyPort = 6379;
var counter = 0;

function breaker(conn) {
    conn.end();
    conn.destroy();
}

var server = net.createServer(function(conn) {
    counter++;
    var proxyConn = net.createConnection({
        port: proxyPort
    });
    conn.pipe(proxyConn);
    proxyConn.pipe(conn);
    proxyConn.on('end', function() {
        conn.end();
    });
    conn.on('end', function() {
        proxyConn.end();
    });
    conn.on('close', function() {
        proxyConn.end();
    });
    proxyConn.on('close', function() {
        conn.end();
    });
    proxyConn.on('error', function() {
        conn.end();
    });
    conn.on('error', function() {
        proxyConn.end();
    });

    setTimeout(breaker.bind(null, conn), Math.floor(Math.random() * 2000));
});
server.listen(6479);

var redis = require('./');

var port = 6479;

var client = redis.createClient(6479, 'localhost');

function iter() {
    var k = "k" + Math.floor(Math.random() * 10);
    var coinflip = Math.random() > 0.5;
    if (coinflip) {
        client.set(k, k, function(err, resp) {
            if (!err && resp !== "OK") {
                console.log("Unexpected set response " + resp);
            }
        });
    } else {
        client.get(k, function(err, resp) {
            if (!err) {
                if (k !== resp) {
                    console.log("Key response mismatch: " + k + " " + resp);
                }
            }
        });
    }
}

function iters() {
    for (var i = 0; i < 100; ++i) {
        iter();
    }
    setTimeout(iters, 10);
}

client.on("connect", function () {
    iters();
});

client.on("error", function (err) {
    console.log("Client error " + err);
});
