// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './SCANDUMP';

// describe('BF SCANDUMP', () => {
//     describe('transformArguments', () => {
//         it('basic add', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', 0),
//                 ['BF.SCANDUMP', 'BLOOM', '0']
//             );
//         });
//     });

//     testUtils.testWithClient('client.bf.scandump', async client => {
//         await client.bf.add('BLOOM', 'foo'); 
//         assert.equal((await client.bf.scanDump('BLOOM', 0))[0], 1); // checks the iterator
//         // TODO: should we check the data too?
//         // assert.equal((await client.bf.scanDump('BLOOM', 0))[1], 'foo');
//     }, GLOBAL.SERVERS.OPEN);
// });
