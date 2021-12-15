// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './ADD';

// describe('BF ADD', () => {
//     describe('transformArguments', () => {
//         it('basic add', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', 'foo'),
//                 ['BF.ADD', 'BLOOM', 'foo']
//             );
//         });
//     });

//     testUtils.testWithClient('client.bf.add', async client => {
//         assert.ok(await client.bf.add('BLOOM', 'foo'));
//     }, GLOBAL.SERVERS.OPEN);
// });
