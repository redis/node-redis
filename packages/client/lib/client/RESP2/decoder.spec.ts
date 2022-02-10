import { strict as assert } from 'assert';
import { SinonSpy, spy } from 'sinon';
import RESP2Decoder from './decoder';
import { ErrorReply } from '../../errors';

interface DecoderAndSpies {
    decoder: RESP2Decoder;
    returnStringsAsBuffersSpy: SinonSpy;
    onReplySpy: SinonSpy;
}

function createDecoderAndSpies(returnStringsAsBuffers: boolean): DecoderAndSpies {
    const returnStringsAsBuffersSpy = spy(() => returnStringsAsBuffers),
        onReplySpy = spy();

    return {
        decoder: new RESP2Decoder({
            returnStringsAsBuffers: returnStringsAsBuffersSpy,
            onReply: onReplySpy
        }),
        returnStringsAsBuffersSpy,
        onReplySpy
    };
}

function writeChunks(stream: RESP2Decoder, buffer: Buffer) {
    let i = 0;
    while (i < buffer.length) {
        stream.write(buffer.slice(i, ++i));
    }
}

type Replies = Array<Array<unknown>>;

interface TestsOptions {
    toWrite: Buffer;
    returnStringsAsBuffers: boolean;
    replies: Replies;
}

function generateTests({
    toWrite,
    returnStringsAsBuffers,
    replies
}: TestsOptions): void {
    it('single chunk', () => {
        const { decoder, returnStringsAsBuffersSpy, onReplySpy } =
            createDecoderAndSpies(returnStringsAsBuffers);
        decoder.write(toWrite);
        assert.equal(returnStringsAsBuffersSpy.callCount, replies.length);
        testReplies(onReplySpy, replies);
    });

    it('multiple chunks', () => {
        const { decoder, returnStringsAsBuffersSpy, onReplySpy } =
            createDecoderAndSpies(returnStringsAsBuffers);
        writeChunks(decoder, toWrite);
        assert.equal(returnStringsAsBuffersSpy.callCount, replies.length);
        testReplies(onReplySpy, replies);
    });
}

function testReplies(spy: SinonSpy, replies: Replies): void {
    if (!replies) {
        assert.equal(spy.callCount, 0);
        return;
    }

    assert.equal(spy.callCount, replies.length);
    for (const [i, reply] of replies.entries()) {
        assert.deepEqual(
            spy.getCall(i).args,
            reply
        );
    }
}

describe('RESP2Parser', () => {
    describe('Simple String', () => {
        describe('as strings', () => {
            generateTests({
                toWrite: Buffer.from('+OK\r\n'),
                returnStringsAsBuffers: false,
                replies: [['OK']]
            });
        });

        describe('as buffers', () => {
            generateTests({
                toWrite: Buffer.from('+OK\r\n'),
                returnStringsAsBuffers: true,
                replies: [[Buffer.from('OK')]]
            });
        });
    });

    describe('Error', () => {
        generateTests({
            toWrite: Buffer.from('-ERR\r\n'),
            returnStringsAsBuffers: false,
            replies: [[new ErrorReply('ERR')]]
        });
    });

    describe('Integer', () => {
        describe('-1', () => {
            generateTests({
                toWrite: Buffer.from(':-1\r\n'),
                returnStringsAsBuffers: false,
                replies: [[-1]]
            });
        });

        describe('0', () => {
            generateTests({
                toWrite: Buffer.from(':0\r\n'),
                returnStringsAsBuffers: false,
                replies: [[0]]
            });
        });
    });

    describe('Bulk String', () => {
        describe('null', () => {
            generateTests({
                toWrite: Buffer.from('$-1\r\n'),
                returnStringsAsBuffers: false,
                replies: [[null]]
            });
        });

        describe('as strings', () => {
            generateTests({
                toWrite: Buffer.from('$2\r\naa\r\n'),
                returnStringsAsBuffers: false,
                replies: [['aa']]
            });
        });

        describe('as buffers', () => {
            generateTests({
                toWrite: Buffer.from('$2\r\naa\r\n'),
                returnStringsAsBuffers: true,
                replies: [[Buffer.from('aa')]]
            });
        });
    });

    describe('Array', () => {
        describe('null', () => {
            generateTests({
                toWrite: Buffer.from('*-1\r\n'),
                returnStringsAsBuffers: false,
                replies: [[null]]
            });
        });

        const arrayBuffer = Buffer.from(
            '*5\r\n' +
            '+OK\r\n' +
            '-ERR\r\n' +
            ':0\r\n' +
            '$1\r\na\r\n' +
            '*0\r\n'
        );

        describe('as strings', () => {
            generateTests({
                toWrite: arrayBuffer,
                returnStringsAsBuffers: false,
                replies: [[[
                    'OK',
                    new ErrorReply('ERR'),
                    0,
                    'a',
                    []
                ]]]
            });
        });

        describe('as buffers', () => {
            generateTests({
                toWrite: arrayBuffer,
                returnStringsAsBuffers: true,
                replies: [[[
                    Buffer.from('OK'),
                    new ErrorReply('ERR'),
                    0,
                    Buffer.from('a'),
                    []
                ]]]
            });
        });
    });
});
