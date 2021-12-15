// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './DEL';

// describe('CF DEL', () => {
//     it('transformArguments', () => {
//         assert.deepEqual(
//             transformArguments('cuckoo', 'foo'),
//             ['CF.DEL', 'cuckoo', 'foo']
//         );
//     });

//     testUtils.testWithClient('client.cf.del', async client => {
//         await client.bf.add('cuckoo', 'foo');
//         assert.ok(await client.bf.del('cuckoo', 'foo'));
//     }, GLOBAL.SERVERS.OPEN);
// });
