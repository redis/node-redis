// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './LOADCHUNK';

// describe('BF LOADCHUNK', () => {
//     describe('transformArguments', () => {
//         it('basic add', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', 0, 'foo'),
//                 ['BF.LOADCHUNK', 'BLOOM', '0', 'foo']
//             );
//         });
//     });

//     testUtils.testWithClient('client.bf.loadchunk', async client => {
//         await client.bf.add('BLOOM', 'foo');
//         const res = await client.bf.scanDump('BLOOM', 0)
//         // TODO
//         // assert.equal((await client.bf.loadChunk('BLOOM', res[0], res[1])), 'OK');
//     }, GLOBAL.SERVERS.OPEN);
// });
