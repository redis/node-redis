// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './MEXISTS';

// describe('BF MEXISTS', () => {
//     describe('transformArguments', () => {
//         it('basic add', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', 'foo', 'bar'),
//                 ['BF.MEXISTS', 'BLOOM', 'foo', 'bar']
//             );
//         });
//     });

//     testUtils.testWithClient('client.bf.exists', async client => {
//         await client.bf.add('BLOOM', 'foo'); 
//         assert.deepEqual(await client.bf.mExists('BLOOM', 'foo', 'bar'), [1,0]);
//     }, GLOBAL.SERVERS.OPEN);
// });
