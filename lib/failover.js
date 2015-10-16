'use strict';


module.exports = {
    prepareOptions: prepareOptions
};


function prepareOptions(client) {
    var connections = [ { connectionOption: client.connectionOption, auth_pass: [client.options.auth_pass] } ];

    client._failover = {
        connections: connections,
        currentConnection: 0,
        currentPass: 0
    };

    client.options.failover.connections.forEach(function (cnct) {
        var cnxOption = optionsWithoutAuth(cnct);
        var keys = Object.keys(cnxOption);
        if (keys.length === 0 && cnct.auth_pass) {
            connections[0].auth_pass.push(cnct.auth_pass);
            return;
        }

        var sameConnection, _cnxOption;
        connections.some(function (_cnct) {
            _cnxOption = optionsWithoutAuth(_cnct.connectionOption);
            if (equal(cnxOption, _cnxOption)) {
                sameConnection = _cnct;
                return true;
            }
        });

        if (sameConnection && cnct.auth_pass) {
            sameConnection.auth_pass.push(cnct.auth_pass);
        } else {
            connections.push({ connectionOption: cnxOption, auth_pass: [cnct.auth_pass]});
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
