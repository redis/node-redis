// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './INSERT';

// describe('BF INSERT', () => {
//     describe('transformArguments', () => {
//         it('no options, multiple items', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', {}, 'bar', 'foo'),
//                 ['BF.INSERT', 'BLOOM', 'ITEMS', 'bar', 'foo']
//             );
//         });

//         it('with CAPACITY', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', { capacity: 100 }, 'foo'),
//                 ['BF.INSERT', 'BLOOM', 'CAPACITY', '100', 'ITEMS', 'foo']
//             );
//         });

//         it('with ERROR', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', { error: 0.01 }, 'foo'),
//                 ['BF.INSERT', 'BLOOM', 'ERROR', '0.01', 'ITEMS', 'foo']
//             );
//         });

//         it('with EXPANSION', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', { expansion: 1 }, 'foo'),
//                 ['BF.INSERT', 'BLOOM', 'EXPANSION', '1', 'ITEMS', 'foo']
//             );
//         });

//         it('with NOCREATE', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', { nocreate: true }, 'foo'),
//                 ['BF.INSERT', 'BLOOM', 'NOCREATE', 'ITEMS', 'foo']
//             );
//         });

//         it('with NONSCALING', () => {
//             assert.deepEqual(
//                 transformArguments('BLOOM', { nonScaling: true }, 'foo'),
//                 ['BF.INSERT', 'BLOOM', 'NONSCALING', 'ITEMS', 'foo']
//             );
//         });
//     });

//     testUtils.testWithClient('client.bf.insert', async client => {
//         assert.deepEqual(
//             await client.bf.insert('BLOOM', {}, 'foo', 'bar'), [1, 1] 
//         );
//     }, GLOBAL.SERVERS.OPEN);
// });
