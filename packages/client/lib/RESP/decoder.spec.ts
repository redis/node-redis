// import { strict as assert } from 'node:assert';
// import { SinonSpy, spy } from 'sinon';
// import { Decoder, RESP_TYPES } from './decoder';
// import { ErrorReply } from '../errors';
// import { TypeMapping } from './types';

// function createDecoderAndSpies(typeMapping: TypeMapping = {}) {
//   const typeMappingSpy = spy(() => typeMapping),
//     onReplySpy = spy(),
//     onErrorReplySpy = spy(),
//     onPushSpy = spy();

//   return {
//     decoder: new Decoder({
//       getTypeMapping: typeMappingSpy,
//       onReply: onReplySpy,
//       onErrorReply: onErrorReplySpy,
//       onPush: onPushSpy
//     }),
//     typeMappingSpy,
//     onReplySpy,
//     onErrorReplySpy,
//     onPushSpy
//   };
// }

// function writeChunks(stream: Decoder, buffer: Buffer) {
//   let i = 0;
//   while (i < buffer.length) {
//     stream.write(buffer.subarray(i, ++i));
//   }
// }

// type Replies = Array<Array<unknown>>;

// function generateTests(toWrite: Buffer, tests: Array<Test & { name: string }>): void {
//   for (const test of tests) {
//     describe(test.name, () => {
//       generateTests(toWrite, test);
//     });
//   }
// }

// interface Test {
//   typeMapping?: TypeMapping;
//   replies?: Replies;
//   errorReplies?: Replies;
//   pushReplies?: Replies;
// }

// function genetareTypeTests(toWrite: Buffer, { typeMapping, replies, errorReplies, pushReplies }: Test) {
//   const total = (replies?.length ?? 0) + (errorReplies?.length ?? 0) + (pushReplies?.length ?? 0);
//   it('single chunk', () => {
//     const { decoder, typeMappingSpy, onReplySpy, onErrorReplySpy, onPushSpy } = createDecoderAndSpies(typeMapping);
//     decoder.write(toWrite);
//     assert.equal(typeMappingSpy.callCount, total);
//     testReplies(onReplySpy, replies);
//     testReplies(onErrorReplySpy, errorReplies);
//     testReplies(onPushSpy, pushReplies);
//   });

//   it('multiple chunks', () => {
//     const { decoder, typeMappingSpy, onReplySpy, onErrorReplySpy, onPushSpy } = createDecoderAndSpies(typeMapping);
//     writeChunks(decoder, toWrite);
//     assert.equal(typeMappingSpy.callCount, total);
//     testReplies(onReplySpy, replies);
//     testReplies(onErrorReplySpy, errorReplies);
//     testReplies(onPushSpy, pushReplies);
//   });
// }

// function testReplies(spy: SinonSpy, replies?: Replies): void {
//   if (!replies) {
//     assert.equal(spy.callCount, 0);
//     return;
//   }

//   assert.equal(spy.callCount, replies.length);
//   for (const [i, reply] of replies.entries()) {
//     assert.deepEqual(
//       spy.getCall(i).args,
//       reply
//     );
//   }
// }

// describe('RESP2Parser', () => {
//   describe('Null', () => {
//     genetareTypeTests(Buffer.from('_\r\n'), {
//       replies: [[null]]
//     });
//   });

//   describe('Boolean', () => {
//     genetareTypeTests(Buffer.from('#t\r\n'), {
//       replies: [[null]]
//     });
//   });

//   describe('Number', () => {
//     generateTests(Buffer.from(':-1\r\n'))
//     describe('as number', () => {
//       describe('-1', () => {
//         generateTests({
//           toWrite: ,
//           replies: [[-1]]
//         });
//       });
  
//       describe('0', () => {
//         generateTests({
//           toWrite: Buffer.from(':0\r\n'),
//           replies: [[0]]
//         });
//       });
  
//       describe('+1', () => {
//         generateTests({
//           toWrite: Buffer.from(':+1\r\n'),
//           replies: [[1]]
//         });
//       });
//     });
//   });
  
//   describe('Simple String', () => {
//     describe('as strings', () => {
//       generateTests({
//         toWrite: Buffer.from('+OK\r\n'),
//         replies: [['OK']]
//       });
//     });

//     describe('as buffers', () => {
//       generateTests({
//         toWrite: Buffer.from('+OK\r\n'),
//         typeMapping: {
//           [RESP_TYPES.SIMPLE_STRING]: Buffer
//         },
//         replies: [[Buffer.from('OK')]]
//       });
//     });
//   });

//   describe('Error', () => {
//     generateTests({
//       toWrite: Buffer.from('-ERR\r\n'),
//       errorReplies: [[new ErrorReply('ERR')]]
//     });
//   });

  

//   describe('Bulk String', () => {
//     describe('null', () => {
//       generateTests({
//         toWrite: Buffer.from('$-1\r\n'),
//         returnStringsAsBuffers: false,
//         replies: [[null]]
//       });
//     });

//     describe('as strings', () => {
//       generateTests({
//         toWrite: Buffer.from('$2\r\naa\r\n'),
//         returnStringsAsBuffers: false,
//         replies: [['aa']]
//       });
//     });

//     describe('as buffers', () => {
//       generateTests({
//         toWrite: Buffer.from('$2\r\naa\r\n'),
//         returnStringsAsBuffers: true,
//         replies: [[Buffer.from('aa')]]
//       });
//     });
//   });

//   describe('Array', () => {
//     describe('null', () => {
//       generateTests({
//         toWrite: Buffer.from('*-1\r\n'),
//         returnStringsAsBuffers: false,
//         replies: [[null]]
//       });
//     });

//     const arrayBuffer = Buffer.from(
//       '*5\r\n' +
//       '+OK\r\n' +
//       '-ERR\r\n' +
//       ':0\r\n' +
//       '$1\r\na\r\n' +
//       '*0\r\n'
//     );

//     describe('as strings', () => {
//       generateTests({
//         toWrite: arrayBuffer,
//         returnStringsAsBuffers: false,
//         replies: [[[
//           'OK',
//           new ErrorReply('ERR'),
//           0,
//           'a',
//           []
//         ]]]
//       });
//     });

//     describe('as buffers', () => {
//       generateTests({
//         toWrite: arrayBuffer,
//         returnStringsAsBuffers: true,
//         replies: [[[
//           Buffer.from('OK'),
//           new ErrorReply('ERR'),
//           0,
//           Buffer.from('a'),
//           []
//         ]]]
//       });
//     });
//   });
// });
