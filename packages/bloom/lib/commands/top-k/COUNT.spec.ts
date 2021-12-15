// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './COUNT';

// describe('TOPK COUNT', () => {
//     describe('transformArguments', () => {
//         it('basic add', () => {
//             assert.deepEqual(
//                 transformArguments('test', 'foo', 'bar'),
//                 ['TOPK.COUNT', 'test', 'foo', 'bar']
//             );
//         });
//     });

//     testUtils.testWithClient('client.topk.count', async client => {
//         await Promise.all([
//             client.bf.reserve('topK', 3, [50, 3, 0.9]),
//             client.bf.add('topK', 'A', 'B', 'C', 'A')
//         ]);

//         assert.deepEqual(await client.bf.count('topK', 'A', 'B', 'C'), [2, 1, 1]);
//     }, GLOBAL.SERVERS.OPEN);
// });
