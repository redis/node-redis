// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './ADD';

// describe('TOPK ADD', () => {
//     describe('transformArguments', () => {
//         it('basic add', () => {
//             assert.deepEqual(
//                 transformArguments('test', 'foo', 'bar'),
//                 ['TOPK.ADD', 'test', 'foo', 'bar']
//             );
//         });
//     });

//     testUtils.testWithClient('client.bf.add', async client => {
//         await client.bf.reserve('topK', 3, [50, 3, 0.9]),
//         assert.deepEqual(await client.bf.add('topK', 'A', 'B'), [null, null]);
//     }, GLOBAL.SERVERS.OPEN);
// });
