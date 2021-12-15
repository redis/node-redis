// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './RESERVE';

// describe('TOPK RESERVE', () => {
//     describe('transformArguments', () => {
//         it('mandatory options', () => {
//             assert.deepEqual(
//                 transformArguments('topK', 3),
//                 ['TOPK.RESERVE', 'topK', '3']
//             );
//         });

//         it('with optional parameters', () => {
//             assert.deepEqual(
//                 transformArguments('topK', 3, [50, 3, 0.9]),
//                 ['TOPK.RESERVE', 'topK', '3', '50', '3', '0.9']
//             );
//         });
//     });

//     testUtils.testWithClient('client.topk.reserve', async client => {
//         assert.equal(
//             await client.bf.reserve('topK', 3), 'OK'
//         );

//         assert.equal(
//             await client.bf.reserve('topKnew', 3, [50, 3, 0.9]), 'OK'
//         );
//     }, GLOBAL.SERVERS.OPEN);
// });
