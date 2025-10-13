import { strict as assert } from 'node:assert';
import { SinonSpy, spy } from 'sinon';
import { Decoder, RESP_TYPES } from './decoder';
import { BlobError, SimpleError } from '../errors';
import { TypeMapping } from './types';
import { VerbatimString } from './verbatim-string';

interface Test {
  toWrite: Buffer;
  typeMapping?: TypeMapping;
  replies?: Array<unknown>;
  errorReplies?: Array<unknown>;
  pushReplies?: Array<unknown>;
}

function test(name: string, config: Test) {
  describe(name, () => {
    it('single chunk', () => {
      const setup = setupTest(config);
      setup.decoder.write(config.toWrite);
      assertSpiesCalls(config, setup);
    });

    it('byte by byte', () => {
      const setup = setupTest(config);
      for (let i = 0; i < config.toWrite.length; i++) {
        setup.decoder.write(config.toWrite.subarray(i, i + 1));
      }
      assertSpiesCalls(config, setup);
    });
  })
}

function setupTest(config: Test) {
  const onReplySpy = spy(),
    onErrorReplySpy = spy(),
    onPushSpy = spy();

  return {
    decoder: new Decoder({
      getTypeMapping: () => config.typeMapping ?? {},
      onReply: onReplySpy,
      onErrorReply: onErrorReplySpy,
      onPush: onPushSpy
    }),
    onReplySpy,
    onErrorReplySpy,
    onPushSpy
  };
}

function assertSpiesCalls(config: Test, spies: ReturnType<typeof setupTest>) {
  assertSpyCalls(spies.onReplySpy, config.replies);
  assertSpyCalls(spies.onErrorReplySpy, config.errorReplies);
  assertSpyCalls(spies.onPushSpy, config.pushReplies);
}

function assertSpyCalls(spy: SinonSpy, replies?: Array<unknown>) {
  if (!replies) {
    assert.equal(spy.callCount, 0);
    return;
  }

  assert.equal(spy.callCount, replies.length);
  for (const [i, reply] of replies.entries()) {
    assert.deepEqual(
      spy.getCall(i).args,
      [reply]
    );
  }
}

describe('RESP Decoder', () => {
  test('Null', {
    toWrite: Buffer.from('_\r\n'),
    replies: [null]
  });
  
  describe('Boolean', () => {
    test('true', {
      toWrite: Buffer.from('#t\r\n'),
      replies: [true]
    });
  
    test('false', {
      toWrite: Buffer.from('#f\r\n'),
      replies: [false]
    });
  });

  describe('Number', () => {
    test('0', {
      toWrite: Buffer.from(':0\r\n'),
      replies: [0]
    });

    test('1', {
      toWrite: Buffer.from(':+1\r\n'),
      replies: [1]
    });

    test('+1', {
      toWrite: Buffer.from(':+1\r\n'),
      replies: [1]
    });

    test('-1', {
      toWrite: Buffer.from(':-1\r\n'),
      replies: [-1]
    });

    test('1 as string', {
      typeMapping: {
        [RESP_TYPES.NUMBER]: String
      },
      toWrite: Buffer.from(':1\r\n'),
      replies: ['1']
    });
  });

  describe('BigNumber', () => {
    test('0', {
      toWrite: Buffer.from('(0\r\n'),
      replies: [0n]
    });

    test('1', {
      toWrite: Buffer.from('(1\r\n'),
      replies: [1n]
    });

    test('+1', {
      toWrite: Buffer.from('(+1\r\n'),
      replies: [1n]
    });

    test('-1', {
      toWrite: Buffer.from('(-1\r\n'),
      replies: [-1n]
    });

    test('1 as string', {
      typeMapping: {
        [RESP_TYPES.BIG_NUMBER]: String
      },
      toWrite: Buffer.from('(1\r\n'),
      replies: ['1']
    });
  });

  describe('Double', () => {
    test('0', {
      toWrite: Buffer.from(',0\r\n'),
      replies: [0]
    });

    test('1', {
      toWrite: Buffer.from(',1\r\n'),
      replies: [1]
    });

    test('+1', {
      toWrite: Buffer.from(',+1\r\n'),
      replies: [1]
    });

    test('-1', {
      toWrite: Buffer.from(',-1\r\n'),
      replies: [-1]
    });

    test('1.1', {
      toWrite: Buffer.from(',1.1\r\n'),
      replies: [1.1]
    });

    test('nan', {
      toWrite: Buffer.from(',nan\r\n'),
      replies: [NaN]
    });

    test('inf', {
      toWrite: Buffer.from(',inf\r\n'),
      replies: [Infinity]
    });

    test('+inf', {
      toWrite: Buffer.from(',+inf\r\n'),
      replies: [Infinity]
    });

    test('-inf', {
      toWrite: Buffer.from(',-inf\r\n'),
      replies: [-Infinity]
    });

    test('1e1', {
      toWrite: Buffer.from(',1e1\r\n'),
      replies: [1e1]
    });

    test('-1.1E+1', {
      toWrite: Buffer.from(',-1.1E+1\r\n'),
      replies: [-1.1E+1]
    });

    test('1 as string', {
      typeMapping: {
        [RESP_TYPES.DOUBLE]: String
      },
      toWrite: Buffer.from(',1\r\n'),
      replies: ['1']
    });
  });

  describe('SimpleString', () => {
    test("'OK'", {
      toWrite: Buffer.from('+OK\r\n'),
      replies: ['OK']
    });

    test("'OK' as Buffer", {
      typeMapping: {
        [RESP_TYPES.SIMPLE_STRING]: Buffer
      },
      toWrite: Buffer.from('+OK\r\n'),
      replies: [Buffer.from('OK')]
    });

    test("'é'", {
      toWrite: Buffer.from('+é\r\n'),
      replies: ['é']
    });
  });

  describe('BlobString', () => {
    test("''", {
      toWrite: Buffer.from('$0\r\n\r\n'),
      replies: ['']
    });

    test("'1234567890'", {
      toWrite: Buffer.from('$10\r\n1234567890\r\n'),
      replies: ['1234567890']
    });

    test('null (RESP2 backwards compatibility)', {
      toWrite: Buffer.from('$-1\r\n'),
      replies: [null]
    });

    test("'OK' as Buffer", {
      typeMapping: {
        [RESP_TYPES.BLOB_STRING]: Buffer
      },
      toWrite: Buffer.from('$2\r\nOK\r\n'),
      replies: [Buffer.from('OK')]
    });

    test("'é'", {
      toWrite: Buffer.from('$2\r\né\r\n'),
      replies: ['é']
    });
  });

  describe('VerbatimString', () => {
    test("''", {
      toWrite: Buffer.from('=4\r\ntxt:\r\n'),
      replies: ['']
    });

    test("'123456'", {
      toWrite: Buffer.from('=10\r\ntxt:123456\r\n'),
      replies: ['123456']
    });

    test("'OK' as VerbatimString", {
      typeMapping: {
        [RESP_TYPES.VERBATIM_STRING]: VerbatimString
      },
      toWrite: Buffer.from('=6\r\ntxt:OK\r\n'),
      replies: [new VerbatimString('txt', 'OK')]
    });

    test("'OK' as Buffer", {
      typeMapping: {
        [RESP_TYPES.VERBATIM_STRING]: Buffer
      },
      toWrite: Buffer.from('=6\r\ntxt:OK\r\n'),
      replies: [Buffer.from('OK')]
    });

    test("'é'", {
      toWrite: Buffer.from('=6\r\ntxt:é\r\n'),
      replies: ['é']
    });
  });

  test('SimpleError', {
    toWrite: Buffer.from('-ERROR\r\n'),
    errorReplies: [new SimpleError('ERROR')]
  });

  test('BlobError', {
    toWrite: Buffer.from('!5\r\nERROR\r\n'),
    errorReplies: [new BlobError('ERROR')]
  });

  describe('Array', () => {
    test('[]', {
      toWrite: Buffer.from('*0\r\n'),
      replies: [[]]
    });

    test('[0..9]', {
      toWrite: Buffer.from(`*10\r\n:0\r\n:1\r\n:2\r\n:3\r\n:4\r\n:5\r\n:6\r\n:7\r\n:8\r\n:9\r\n`),
      replies: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]
    });

    test('with all types', {
      toWrite: Buffer.from([
        '*13\r\n',
        '_\r\n',
        '#f\r\n',
        ':0\r\n',
        '(0\r\n',
        ',0\r\n',
        '+\r\n',
        '$0\r\n\r\n',
        '=4\r\ntxt:\r\n',
        '-\r\n',
        '!0\r\n\r\n',
        '*0\r\n',
        '~0\r\n',
        '%0\r\n'
      ].join('')),
      replies: [[
        null,
        false,
        0,
        0n,
        0,
        '',
        '',
        '',
        new SimpleError(''),
        new BlobError(''),
        [],
        [],
        Object.create(null)
      ]]
    });

    test('null (RESP2 backwards compatibility)', {
      toWrite: Buffer.from('*-1\r\n'),
      replies: [null]
    });
  });

  describe('Set', () => {
    test('empty', {
      toWrite: Buffer.from('~0\r\n'),
      replies: [[]]
    });

    test('of 0..9', {
      toWrite: Buffer.from(`~10\r\n:0\r\n:1\r\n:2\r\n:3\r\n:4\r\n:5\r\n:6\r\n:7\r\n:8\r\n:9\r\n`),
      replies: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]
    });

    test('0..9 as Set', {
      typeMapping: {
        [RESP_TYPES.SET]: Set
      },
      toWrite: Buffer.from(`~10\r\n:0\r\n:1\r\n:2\r\n:3\r\n:4\r\n:5\r\n:6\r\n:7\r\n:8\r\n:9\r\n`),
      replies: [new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])]
    });
  });

  describe('Map', () => {
    test('{}', {
      toWrite: Buffer.from('%0\r\n'),
      replies: [Object.create(null)]
    });

    test("{ '0'..'9': <key> }", {
      toWrite: Buffer.from(`%10\r\n+0\r\n+0\r\n+1\r\n+1\r\n+2\r\n+2\r\n+3\r\n+3\r\n+4\r\n+4\r\n+5\r\n+5\r\n+6\r\n+6\r\n+7\r\n+7\r\n+8\r\n+8\r\n+9\r\n+9\r\n`),
      replies: [Object.create(null, {
        0: { value: '0', enumerable: true },
        1: { value: '1', enumerable: true },
        2: { value: '2', enumerable: true },
        3: { value: '3', enumerable: true },
        4: { value: '4', enumerable: true },
        5: { value: '5', enumerable: true },
        6: { value: '6', enumerable: true },
        7: { value: '7', enumerable: true },
        8: { value: '8', enumerable: true },
        9: { value: '9', enumerable: true }
      })]
    });

    test("{ '0'..'9': <key> } as Map", {
      typeMapping: {
        [RESP_TYPES.MAP]: Map
      },
      toWrite: Buffer.from(`%10\r\n+0\r\n+0\r\n+1\r\n+1\r\n+2\r\n+2\r\n+3\r\n+3\r\n+4\r\n+4\r\n+5\r\n+5\r\n+6\r\n+6\r\n+7\r\n+7\r\n+8\r\n+8\r\n+9\r\n+9\r\n`),
      replies: [new Map([
        ['0', '0'],
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
        ['4', '4'],
        ['5', '5'],
        ['6', '6'],
        ['7', '7'],
        ['8', '8'],
        ['9', '9']
      ])]
    });

    test("{ '0'..'9': <key> } as Array", {
      typeMapping: {
        [RESP_TYPES.MAP]: Array
      },
      toWrite: Buffer.from(`%10\r\n+0\r\n+0\r\n+1\r\n+1\r\n+2\r\n+2\r\n+3\r\n+3\r\n+4\r\n+4\r\n+5\r\n+5\r\n+6\r\n+6\r\n+7\r\n+7\r\n+8\r\n+8\r\n+9\r\n+9\r\n`),
      replies: [['0', '0', '1', '1', '2', '2', '3', '3', '4', '4', '5', '5', '6', '6', '7', '7', '8', '8', '9', '9']]
    });
  });

  describe('Push', () => {
    test('[]', {
      toWrite: Buffer.from('>0\r\n'),
      pushReplies: [[]]
    });

    test('[0..9]', {
      toWrite: Buffer.from(`>10\r\n:0\r\n:1\r\n:2\r\n:3\r\n:4\r\n:5\r\n:6\r\n:7\r\n:8\r\n:9\r\n`),
      pushReplies: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]
    });
  });
});
