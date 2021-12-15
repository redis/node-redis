// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './LIST';

// describe('TOPK LIST', () => {
//     it('transformArguments', () => {
//         assert.deepEqual(
//             transformArguments('test'),
//             ['TOPK.LIST', 'test']
//         );
//     });

//     testUtils.testWithClient('client.topk.list', async client => {
//         await Promise.all([
//             client.bf.reserve('topK', 3, [50, 3, 0.9]),
//             client.bf.add('topK', 'A', 'B', 'C', 'D', 'E','A', 'A', 'B', 'C',
//             'G', 'D', 'B', 'D', 'A', 'E', 'E')
//         ]);

//         assert.deepEqual(await client.bf.list('topK'), ['A', 'B', 'E']);
//     }, GLOBAL.SERVERS.OPEN);
// });
