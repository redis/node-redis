// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './EXISTS';

// describe('BF EXISTS', () => {
//     describe('transformArguments', () => {
//         it('basic add', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', 'foo'),
//                 ['BF.EXISTS', 'BLOOM', 'foo']
//             );
//         });
//     });

//     testUtils.testWithClient('client.bf.exists', async client => {
//         await client.bf.add('BLOOM', 'foo'); 
//         assert.ok(await client.bf.exists('BLOOM', 'foo'));
//     }, GLOBAL.SERVERS.OPEN);
// });
