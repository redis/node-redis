// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './EXISTS';

// describe('CF EXISTS', () => {
//     describe('transformArguments', () => {
//         it('basic add', () => {
//             assert.deepEqual(
//                 transformArguments('cuckoo', 'foo'),
//                 ['CF.EXISTS', 'cuckoo', 'foo']
//             );
//         });
//     });

//     testUtils.testWithClient('client.cf.exists', async client => {
//         await client.bf.add('cuckoo', 'foo'); 
//         assert.ok(await client.bf.exists('cuckoo', 'foo'));
//     }, GLOBAL.SERVERS.OPEN);
// });
