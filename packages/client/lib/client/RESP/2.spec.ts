import { SinonSpy, spy } from 'sinon';
import RESP2 from './2';
import { strict as assert } from 'assert';
import { ErrorReply } from '../../errors';

function generateTests(
    returnStringsAsBuffers: boolean,
    toWrite: Buffer,
    validateReply: (replySpy: SinonSpy, errorReplySpy: SinonSpy) => void
) {
    generateTest(
        'should handle single chunk',
        returnStringsAsBuffers,
        codec => codec.write(toWrite),
        validateReply
    );

    generateTest(
        'should handle chunked string',
        returnStringsAsBuffers,
        codec => {
            for (let i = 0; i < toWrite.length;) {
                codec.write(toWrite.slice(i, ++i));
            }
        },
        validateReply
    );
}

function generateTest(
    title: string,
    returnStringsAsBuffers: boolean,
    write: (codec: RESP2) => void,
    validateReply: (replySpy: SinonSpy, errorReplySpy: SinonSpy) => void
): void {
    it(title, () => {
        const replySpy = spy(),
            errorReplySpy = spy(),
            codec = new RESP2({
                reply: replySpy,
                errorReply: errorReplySpy,
                returnStringsAsBuffers: () => returnStringsAsBuffers
            });
        write(codec);
        validateReply(replySpy, errorReplySpy);
    });
}

describe.only('RESP 2', () => {
    describe('Simple String', () => {
        describe('as strings', () => {
            generateTests(
                false,
                Buffer.from('+OK\r\n'),
                (replySpy, errorReplySpy) => {
                    assert.equal(replySpy.callCount, 1);
                    assert.deepEqual(
                        replySpy.getCall(0).args,
                        ['OK']
                    );
                    assert.equal(errorReplySpy.callCount, 0);
                }
            );
        });

        describe('as buffers', () => {
            generateTests(
                true,
                Buffer.from('+OK\r\n'),
                (replySpy, errorReplySpy) => {
                    assert.equal(replySpy.callCount, 1);
                    assert.deepEqual(
                        replySpy.getCall(0).args,
                        [Buffer.from('OK')]
                    );
                    assert.equal(errorReplySpy.callCount, 0);
                }
            );
        });
    });

    describe('Error', () => {
        generateTests(
            false,
            Buffer.from('-ERR\r\n'),
            (replySpy, errorReplySpy) => {
                assert.equal(replySpy.callCount, 0);
                assert.equal(errorReplySpy.callCount, 1);
                assert.deepEqual(
                    errorReplySpy.getCall(0).args,
                    [new ErrorReply('ERR')]
                );
            }
        );
    });

    describe('Integer', () => {
        generateTests(
            false,
            Buffer.from(':0\r\n'),
            (replySpy, errorReplySpy) => {
                assert.equal(replySpy.callCount, 1);
                assert.deepEqual(
                    replySpy.getCall(0).args,
                    [0]
                );
                assert.equal(errorReplySpy.callCount, 0);
            }
        );
    });

    describe('Bulk String', () => {
        describe('as strings', () => {
            generateTests(
                false,
                Buffer.from('$6\r\nstring\r\n'),
                (replySpy, errorReplySpy) => {
                    assert.equal(replySpy.callCount, 1);
                    assert.deepEqual(
                        replySpy.getCall(0).args,
                        ['string']
                    );
                    assert.equal(errorReplySpy.callCount, 0);
                }
            );
        });

        describe('as buffers', () => {
            generateTests(
                true,
                Buffer.from('$6\r\nstring\r\n'),
                (replySpy, errorReplySpy) => {
                    assert.equal(replySpy.callCount, 1);
                    assert.deepEqual(
                        replySpy.getCall(0).args,
                        [Buffer.from('string')]
                    );
                    assert.equal(errorReplySpy.callCount, 0);
                }
            );
        });
    });

    describe('Array', () => {
        describe('null', () => {
            generateTests(
                false,
                Buffer.from('*-1\r\n'),
                (replySpy, errorReplySpy) => {
                    assert.equal(replySpy.callCount, 1);
                    assert.deepEqual(
                        replySpy.getCall(0).args,
                        [null]
                    );
                    assert.equal(errorReplySpy.callCount, 0);
                }
            );
        });

        describe('empty array', () => {
            generateTests(
                false,
                Buffer.from('*0\r\n'),
                (replySpy, errorReplySpy) => {
                    assert.equal(replySpy.callCount, 1);
                    assert.deepEqual(
                        replySpy.getCall(0).args,
                        [[]]
                    );
                    assert.equal(errorReplySpy.callCount, 0);
                }
            );
        });

        describe.only('as strings', () => {
            generateTests(
                false,
                Buffer.from([
                    '*7\r\n',
                    '+OK\r\n',
                    '-ERR\r\n',
                    ':0\r\n',
                    '$6\r\nstring\r\n',
                    '$-1\r\n',
                    '*-1\r\n',
                    '*0\r\n'
                ].join('')),
                (replySpy, errorReplySpy) => {
                    console.log(replySpy.getCalls().map(call => call.args));
                    assert.equal(replySpy.callCount, 1);
                    assert.deepEqual(
                        replySpy.getCall(0).args,
                        [[
                            'OK',
                            new ErrorReply('ERR'),
                            0,
                            'string',
                            null,
                            null,
                            []
                        ]]
                    );
                    assert.equal(errorReplySpy.callCount, 0);
                }
            );
        });

        describe.skip('as buffers', () => {
            generateTests(
                true,
                Buffer.from([
                    '*7\r\n',
                    '+OK\r\n',
                    '-ERR\r\n',
                    ':0\r\n',
                    '$6\r\nstring\r\n',
                    '$-1\r\n',
                    '*-1\r\n',
                    '*0\r\n'
                ].join('')),
                (replySpy, errorReplySpy) => {
                    assert.ok(
                        replySpy.calledOnceWithExactly([])
                    );
                    assert.equal(errorReplySpy.callCount, 0);
                }
            );
        });
    });
});