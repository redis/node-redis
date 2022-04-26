import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, FilterBy } from './COMMAND_LIST';

describe('COMMAND LIST', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['COMMAND', 'LIST']
            );
        });

        describe('with FILTERBY', () => {
            it('MODULE', () => {
                assert.deepEqual(
                    transformArguments({
                        filterBy: FilterBy.MODULE,
                        value: 'json'
                    }),
                    ['COMMAND', 'LIST', 'FILTERBY', 'MODULE', 'json']
                );
            });

            it('ACLCAT', () => {
                assert.deepEqual(
                    transformArguments({
                        filterBy: FilterBy.ACLCAT,
                        value: 'admin'
                    }),
                    ['COMMAND', 'LIST', 'FILTERBY', 'ACLCAT', 'admin']
                );
            });

            it('PATTERN', () => {
                assert.deepEqual(
                    transformArguments({
                        filterBy: FilterBy.PATTERN,
                        value: 'a*'
                    }),
                    ['COMMAND', 'LIST', 'FILTERBY', 'PATTERN', 'a*']
                );
            });
        });
    });

    testUtils.testWithClient('client.commandList', async client => {
        const commandList = await client.commandList();
        assert.ok(Array.isArray(commandList));
        for (const command of commandList) {
            assert.ok(typeof command === 'string');
        }
    }, GLOBAL.SERVERS.OPEN);
});
