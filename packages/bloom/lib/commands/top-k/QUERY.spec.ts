// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './QUERY';

// describe('TOPK QUERY', () => {
//     it('transformArguments', () => {
//         assert.deepEqual(
//             transformArguments('test', 'foo', 'bar'),
//             ['TOPK.QUERY', 'test', 'foo', 'bar']
//         );
//     });

//     testUtils.testWithClient('client.cms.query', async client => {
//         await Promise.all([
//             client.bf.reserve('A', 3),
//             client.bf.incrBy('A', { foo: 10 })
//         ]);

//         assert.deepEqual(await client.bf.query('A', 'foo', 'bar'), [1, 0]);

//     }, GLOBAL.SERVERS.OPEN);
// });
