import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './GET';

describe('GET', () => {
    describe('transformArguments', () => {
        describe('path', () => {
            it('string', () => {
                assert.deepEqual(
                    transformArguments('key', { path: '$' }),
                    ['JSON.GET', 'key', '$']
                );
            });

            it('array', () => {
                assert.deepEqual(
                    transformArguments('key', { path: ['$.1', '$.2'] }),
                    ['JSON.GET', 'key', '$.1', '$.2']
                );
            });
        });

        it('key', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['JSON.GET', 'key']
            );
        });

        it('INDENT', () => {
            assert.deepEqual(
                transformArguments('key', { INDENT: 'indent' }),
                ['JSON.GET', 'key', 'INDENT', 'indent']
            );
        });

        it('NEWLINE', () => {
            assert.deepEqual(
                transformArguments('key', { NEWLINE: 'newline' }),
                ['JSON.GET', 'key', 'NEWLINE', 'newline']
            );
        });

        it('SPACE', () => {
            assert.deepEqual(
                transformArguments('key', { SPACE: 'space' }),
                ['JSON.GET', 'key', 'SPACE', 'space']
            );
        });

        it('NOESCAPE', () => {
            assert.deepEqual(
                transformArguments('key', { NOESCAPE: true }),
                ['JSON.GET', 'key', 'NOESCAPE']
            );
        });

        it('INDENT, NEWLINE, SPACE, NOESCAPE, path', () => {
            assert.deepEqual(
                transformArguments('key', {
                    path: '$.path',
                    INDENT: 'indent',
                    NEWLINE: 'newline',
                    SPACE: 'space',
                    NOESCAPE: true
                }),
                ['JSON.GET', 'key', '$.path', 'INDENT', 'indent', 'NEWLINE', 'newline', 'SPACE', 'space', 'NOESCAPE']
            );
        });
    });

    testUtils.testWithClient('client.json.get', async client => {
        assert.equal(
            await client.json.get('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
