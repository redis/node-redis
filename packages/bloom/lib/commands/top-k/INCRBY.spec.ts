// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './INCRBY';

// describe('TOPK INCRBY', () => {
//     it('transformArguments', () => {
//         assert.deepEqual(
//             transformArguments('test', { foo: 10, bar: 42 }),
//             ['TOPK.INCRBY', 'test', 'foo', '10', 'bar', '42']
//         );
//     });

//     testUtils.testWithClient('client.cms.incrby', async client => {
//         await client.bf.reserve('A', 5);
//         assert.deepEqual(await client.bf.incrBy('A', { foo: 10 }), [null]);
//     }, GLOBAL.SERVERS.OPEN);
// });
