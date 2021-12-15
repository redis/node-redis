// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './INITBYPROB';

// describe('CMS INITBYPROB', () => {
//     it('transformArguments', () => {
//         assert.deepEqual(
//             transformArguments('prob', 0.001, 0.01),
//             ['CMS.INITBYPROB', 'prob', '0.001', '0.01']
//         );
//     });

//     testUtils.testWithClient('client.cms.initbyprob', async client => {
//         assert.equal(await client.bf.initByProb('prob', 0.001, 0.01), 'OK');
//     }, GLOBAL.SERVERS.OPEN);
// });
