// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './INFO';

// describe('CMS INFO', () => {
//     it('transformArguments', () => {
//         assert.deepEqual(
//             transformArguments('test'),
//             ['CMS.INFO', 'test']
//         );
//     });

//     testUtils.testWithClient('client.bf.info', async client => {
//         await client.bf.initByDim('A', 1000, 5);

//         assert.deepEqual(
//             await client.bf.info('A'),
//             {
//                 width: 1000,
//                 depth: 5,
//                 count: 0
//             }
//         );
//     }, GLOBAL.SERVERS.OPEN);
// });
