'use strict';

function prepareOptions(client) {
    var connections = [ { connection_option: client.connection_option, auth_pass: [client.options.auth_pass] } ];

    client._failover = {
        connections: connections,
        cycle: 0,
        retry_backoff: client.options.failover.retry_backoff || 1.7,
        connectionIndex: 0
    };

    client.options.failover.connections.forEach(function (cnct) {
        var cnxOption = optionsWithoutAuth(cnct);
        var keys = Object.keys(cnxOption);
        if (keys.length === 0 && cnct.auth_pass) {
            addAuth(cnct.auth_pass, connections[0]);
            return;
        }

        var sameConnection, _cnxOption;
        connections.some(function (_cnct) {
            _cnxOption = optionsWithoutAuth(_cnct.connection_option);
            if (equal(cnxOption, _cnxOption)) {
                sameConnection = _cnct;
                return true;
            }
        });

        if (sameConnection && cnct.auth_pass) {
            addAuth(cnct.auth_pass, sameConnection);
        } else {
            connections.push({ connection_option: cnxOption, auth_pass: [cnct.auth_pass]});
        }
    });

    function optionsWithoutAuth(opts) {
        var options = {};
        for (var opt in opts) {
            if (opt !== 'auth_pass') {
                options[opt] = opts[opt];
            }
        }
        return options;
    }

    function addAuth(auth_pass, toConnection) {
        if (toConnection.auth_pass.indexOf(auth_pass) === -1) {
            toConnection.auth_pass.push(auth_pass);
        } else {
            console.error('Same password used more than once');
        }
    }

    function equal(a, b) {
        var keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) return false;
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i]; 
            if (a[key] !== b[key]) return false;
        }
        return true;
    }
}


function nextConnection(client) {
    var fo = client._failover;
    fo.connectionIndex++;
    if (fo.connectionIndex === fo.connections.length) {
        fo.connectionIndex = 0;
        fo.cycle++;
        client.retry_delay = Math.round(client.retry_delay * fo.retry_backoff);
    }
    var connection = fo.connections[fo.connectionIndex];
    client.connection_option = connection.connection_option;
    client.auth_pass = connection.auth_pass[0];
}


function getPasswords(client) {
    var fo = client._failover;
    var connection = fo.connections[fo.connectionIndex];
    var passwords = connection.auth_pass;
    return passwords.filter(function(p) {return p;});
}


exports.prepareOptions = prepareOptions;
exports.nextConnection = nextConnection;
exports.getPasswords = getPasswords;
