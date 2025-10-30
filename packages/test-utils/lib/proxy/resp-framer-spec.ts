import { strict as assert } from 'node:assert';
import RespFramer from './resp-framer';

describe('RespFramer - RESP2', () => {
  it('should emit a simple string message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('+OK\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit an error message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('-ERR unknown command\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit an integer message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from(':1000\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a bulk string message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('$6\r\nfoobar\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a null bulk string', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('$-1\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit an array message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a null array', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('*-1\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit nested arrays', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('*2\r\n*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n*1\r\n$3\r\nbaz\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle multiple complete messages', async () => {
    const framer = new RespFramer();
    const messages = [
      Buffer.from('+OK\r\n'),
      Buffer.from(':42\r\n'),
      Buffer.from('$3\r\nfoo\r\n')
    ];
    const combined = Buffer.concat(messages);
    const received: Buffer[] = [];

    const messagesPromise = new Promise<Buffer[]>((resolve) => {
      framer.on('message', (message) => {
        received.push(message);
        if (received.length === 3) {
          resolve(received);
        }
      });
    });

    framer.write(combined);
    const result = await messagesPromise;
    assert.equal(result.length, messages.length);
    messages.forEach((expected, i) => {
      assert.deepEqual(result[i], expected);
    });
  });

  it('should handle partial messages across multiple writes', async () => {
    const framer = new RespFramer();
    const fullMessage = Buffer.from('$6\r\nfoobar\r\n');
    const part1 = fullMessage.subarray(0, 5);
    const part2 = fullMessage.subarray(5);

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(part1);
    framer.write(part2);
    const message = await messagePromise;
    assert.deepEqual(message, fullMessage);
  });

  it('should handle array split across multiple writes', async () => {
    const framer = new RespFramer();
    const fullMessage = Buffer.from('*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');
    const part1 = fullMessage.subarray(0, 10);
    const part2 = fullMessage.subarray(10);

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(part1);
    framer.write(part2);
    const message = await messagePromise;
    assert.deepEqual(message, fullMessage);
  });

  it('should handle empty array', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('*0\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle empty bulk string', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('$0\r\n\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle mixed message types in sequence', async () => {
    const framer = new RespFramer();
    const messages = [
      Buffer.from('+PONG\r\n'),
      Buffer.from('$3\r\nGET\r\n'),
      Buffer.from('*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n'),
      Buffer.from(':123\r\n'),
      Buffer.from('-Error\r\n')
    ];
    const received: Buffer[] = [];

    const messagesPromise = new Promise<Buffer[]>((resolve) => {
      framer.on('message', (message) => {
        received.push(message);
        if (received.length === messages.length) {
          resolve(received);
        }
      });
    });

    messages.forEach(msg => framer.write(msg));
    const result = await messagesPromise;
    assert.equal(result.length, messages.length);
    messages.forEach((expected, i) => {
      assert.deepEqual(result[i], expected);
    });
  });

  it('should handle bulk string containing \\r\\n in the data', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('$12\r\nhello\r\nworld\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle bulk string with binary data including null bytes', async () => {
    const framer = new RespFramer();
    const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);
    const expected = Buffer.concat([
      Buffer.from('$5\r\n'),
      binaryData,
      Buffer.from('\r\n')
    ]);

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle array with bulk strings containing \\r\\n', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('*2\r\n$5\r\nfoo\r\n\r\n$5\r\nbar\r\n\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });
});

describe('RespFramer - RESP3', () => {
  it('should emit a null message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('_\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a boolean true message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('#t\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a boolean false message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('#f\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a double message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from(',3.14159\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a double infinity message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from(',inf\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a double negative infinity message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from(',-inf\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a big number message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('(3492890328409238509324850943850943825024385\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a bulk error message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('!21\r\nSYNTAX invalid syntax\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a verbatim string message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('=15\r\ntxt:Some string\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a map message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('%2\r\n+first\r\n:1\r\n+second\r\n:2\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a set message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('~3\r\n+apple\r\n+banana\r\n+cherry\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit a push message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('>3\r\n+pubsub\r\n+message\r\n+channel\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should emit an attribute message', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('|1\r\n+key-popularity\r\n%2\r\n$1\r\na\r\n,0.1923\r\n$1\r\nb\r\n,0.0012\r\n*2\r\n:2039123\r\n:9543892\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle nested RESP3 structures', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('%2\r\n$4\r\nname\r\n$5\r\nAlice\r\n$3\r\nage\r\n:30\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle empty map', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('%0\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle empty set', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('~0\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle map with nested arrays', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('%1\r\n$4\r\ndata\r\n*2\r\n:1\r\n:2\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle set with mixed types', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('~4\r\n+string\r\n:42\r\n#t\r\n_\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle RESP3 split across multiple writes', async () => {
    const framer = new RespFramer();
    const fullMessage = Buffer.from('%2\r\n+key1\r\n:100\r\n+key2\r\n:200\r\n');
    const part1 = fullMessage.subarray(0, 10);
    const part2 = fullMessage.subarray(10);

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(part1);
    framer.write(part2);
    const message = await messagePromise;
    assert.deepEqual(message, fullMessage);
  });

  it('should handle mixed RESP2 and RESP3 messages', async () => {
    const framer = new RespFramer();
    const messages = [
      Buffer.from('*2\r\n$3\r\nGET\r\n$3\r\nkey\r\n'),
      Buffer.from('%1\r\n+result\r\n$5\r\nvalue\r\n'),
      Buffer.from('#t\r\n'),
      Buffer.from('_\r\n'),
      Buffer.from(',3.14\r\n')
    ];
    const received: Buffer[] = [];

    const messagesPromise = new Promise<Buffer[]>((resolve) => {
      framer.on('message', (message) => {
        received.push(message);
        if (received.length === messages.length) {
          resolve(received);
        }
      });
    });

    messages.forEach(msg => framer.write(msg));
    const result = await messagesPromise;
    assert.equal(result.length, messages.length);
    messages.forEach((expected, i) => {
      assert.deepEqual(result[i], expected);
    });
  });

  it('should handle array with attribute metadata', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('*3\r\n:1\r\n:2\r\n|1\r\n+ttl\r\n:3600\r\n:3\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle null map', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('%-1\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle null set', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('~-1\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle null push', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('>-1\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle attribute with empty metadata', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('|0\r\n:42\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle blob error with binary data', async () => {
    const framer = new RespFramer();
    const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);
    const expected = Buffer.concat([
      Buffer.from('!5\r\n'),
      binaryData,
      Buffer.from('\r\n')
    ]);

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle verbatim string with different encoding', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('=17\r\nmkd:# Hello World\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle double NaN', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from(',nan\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle deeply nested structures', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('*2\r\n%1\r\n+key\r\n*2\r\n:1\r\n:2\r\n~2\r\n+a\r\n+b\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle push with nested map', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('>2\r\n+pubsub\r\n%1\r\n+channel\r\n+news\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle attribute split across multiple writes', async () => {
    const framer = new RespFramer();
    const fullMessage = Buffer.from('|1\r\n+ttl\r\n:3600\r\n+value\r\n');
    const part1 = fullMessage.subarray(0, 10);
    const part2 = fullMessage.subarray(10);

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(part1);
    framer.write(part2);
    const message = await messagePromise;
    assert.deepEqual(message, fullMessage);
  });

  it('should handle map with null values', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('%2\r\n+key1\r\n_\r\n+key2\r\n$-1\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle nested maps', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('%1\r\n+outer\r\n%2\r\n+inner1\r\n:1\r\n+inner2\r\n:2\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });

  it('should handle set containing arrays', async () => {
    const framer = new RespFramer();
    const expected = Buffer.from('~2\r\n*2\r\n:1\r\n:2\r\n*2\r\n:3\r\n:4\r\n');

    const messagePromise = new Promise<Buffer>((resolve) => {
      framer.once('message', resolve);
    });

    framer.write(expected);
    const message = await messagePromise;
    assert.deepEqual(message, expected);
  });
});
