// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './MADD';

// describe('BF MADD', () => {
//     describe('transformArguments', () => {
//         it('single item', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', 'foo'),
//                 ['BF.MADD', 'BLOOM', 'foo']
//             );
//         });

//         it('multiple items', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', 'foo', 'bar'),
//                 ['BF.MADD', 'BLOOM', 'foo', 'bar']
//             );
//         });
//     });

//     testUtils.testWithClient('client.ts.madd', async client => {
//         await client.bf.reserve('BLOOM', {
//             errorRate: 0.01,
//             capacity: 100
//         });

//         assert.ok(await client.bf.mAdd('BLOOM', 'foo'));
//     }, GLOBAL.SERVERS.OPEN);
// });
