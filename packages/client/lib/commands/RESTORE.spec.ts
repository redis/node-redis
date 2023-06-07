import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RESTORE';

describe('RESTORE', () => {
    describe('transformArguments', () => {
        it('parses ttl and value', () => {
            assert.deepEqual(
                transformArguments('KeyName', 0, '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"'),
                ['RESTORE', 'KeyName', '0', '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"']
            );
        });

        it('parses REPLACE', () => {
            assert.deepEqual(
                transformArguments('KeyName', 0, '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', {
                    REPLACE: true
                }),
                ['RESTORE', 'KeyName', '0', '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', 'REPLACE']
            );
        });

        it('parses ABSTTL', () => {
            assert.deepEqual(
                transformArguments('KeyName', 2693098555000, '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', {
                    ABSTTL: true
                }),
                ['RESTORE', 'KeyName', '2693098555000', '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', 'ABSTTL']
            );
        });

        it('parses IDLETIME', () => {
            assert.deepEqual(
                transformArguments('KeyName', 0, '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', {
                    IDLETIME: 5
                }),
                ['RESTORE', 'KeyName', '0', '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', 'IDLETIME', '5']
            );
        });

        it('parses FREQ', () => {
            assert.deepEqual(
                transformArguments('KeyName', 0, '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', {
                    FREQ: 5
                }),
                ['RESTORE', 'KeyName', '0', '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', 'FREQ', '5']
            );
        });

        it('parses REPLACE and ABSTTL', () => {
            assert.deepEqual(
                transformArguments('KeyName', 2693098555000, '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', {
                    REPLACE: true,
                    ABSTTL: true
                }),
                ['RESTORE', 'KeyName', '2693098555000', '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', 'REPLACE', 'ABSTTL']
            );
        });

        it('parses REPLACE and IDLETIME', () => {
            assert.deepEqual(
                transformArguments('KeyName', 0, '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', {
                    REPLACE: true,
                    IDLETIME: 5
                }),
                ['RESTORE', 'KeyName', '0', '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', 'REPLACE', 'IDLETIME', '5']
            );
        });

        it('parses REPLACE, ABSTTL, IDLETIME and FREQ', () => {
            assert.deepEqual(
                transformArguments('KeyName', 2693098555000, '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', {
                    REPLACE: true,
                    ABSTTL: true,
                    IDLETIME: 5,
                    FREQ: 50
                }),
                ['RESTORE', 'KeyName', '2693098555000', '"\x00\x0bStringValue\n\x00\b\xebpW1H\x0c,"', 'REPLACE', 'ABSTTL', 'IDLETIME', '5', 'FREQ', '50']
            );
        });
    });

    describe('client.restore', () => {
        testUtils.testWithClient('new key', async client => {
            await client.set('oldKey', 'oldValue')
            const dumpValue = await client.dump('oldKey');
            assert.equal(
                await client.restore('newKey', 0, dumpValue),
                'OK'
            );
            assert.equal(
                await client.get('newKey'),
                'oldValue'
            )
        }, GLOBAL.SERVERS.OPEN);

        
        testUtils.testWithClient('crash on RESTORE for existing key', async client => {
            await client.set('oldKey', 'oldValue')
            await client.set('newKey', 'newValue')
            const dumpValue = await client.dump('oldKey');
            assert.rejects(
                client.restore('newKey', 0, dumpValue),
                {
                    name: 'ErrorReply',
                    message: 'BUSYKEY Target key name already exists.'
                }
            )
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('replace existing key', async client => {
            await client.set('oldKey', 'oldValue')
            await client.set('newKey', 'newValue')
            const dumpValue = await client.dump('oldKey');
            assert.equal(
                await client.restore('newKey', 0, dumpValue, {
                    REPLACE: true
                }),
                'OK'
            );
            assert.equal(
                await client.get('newKey'),
                'oldValue'
            )
        }, GLOBAL.SERVERS.OPEN);
    })
});
