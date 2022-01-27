const parser = new (require('redis-parser'))({
    returnReply(reply) {
        console.log(reply);
    },
    returnError(err) {
        console.error(err);
    }
});

parser.execute(
    Buffer.from('*1\r\n*1\r\n*1\r\n$-1\r\n$-1\r\n')
);
