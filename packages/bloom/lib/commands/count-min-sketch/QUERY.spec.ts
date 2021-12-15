// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './QUERY';

// describe('CMS QUERY', () => {
//     it('transformArguments', () => {
//         assert.deepEqual(
//             transformArguments('test', 'foo', 'bar'),
//             ['CMS.QUERY', 'test', 'foo', 'bar']
//         );
//     });

//     testUtils.testWithClient('client.cms.query', async client => {
//         await Promise.all([
//             client.bf.initByDim('A', 1000, 5),
//             client.bf.incrBy('A', { foo: 10, bar: 42 })
//         ]);

//         assert.deepEqual(await client.bf.query('A', 'foo', 'bar'), [10, 42]);

//     }, GLOBAL.SERVERS.OPEN);
// });
