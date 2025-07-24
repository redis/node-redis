// EXAMPLE: vecset_tutorial
// REMOVE_START
/**
 * Code samples for Vector set doc pages:
 *     https://redis.io/docs/latest/develop/data-types/vector-sets/
 */

import assert from 'assert';
// REMOVE_END
// HIDE_START
import { createClient } from 'redis';

const client = createClient({
  RESP: 3  // Required for vector set commands
});

await client.connect();
// HIDE_END

// REMOVE_START
await client.del([
  "points", "quantSetQ8", "quantSetNoQ",
  "quantSetBin", "setNotReduced", "setReduced"
]);
// REMOVE_END

// STEP_START vadd
const res1 = await client.vAdd("points", [1.0, 1.0], "pt:A");
console.log(res1);  // >>> true

const res2 = await client.vAdd("points", [-1.0, -1.0], "pt:B");
console.log(res2);  // >>> true

const res3 = await client.vAdd("points", [-1.0, 1.0], "pt:C");
console.log(res3);  // >>> true

const res4 = await client.vAdd("points", [1.0, -1.0], "pt:D");
console.log(res4);  // >>> true

const res5 = await client.vAdd("points", [1.0, 0], "pt:E");
console.log(res5);  // >>> true

const res6 = await client.type("points");
console.log(res6);  // >>> vectorset
// STEP_END
// REMOVE_START
assert.equal(res1, true);
assert.equal(res2, true);
assert.equal(res3, true);
assert.equal(res4, true);
assert.equal(res5, true);
assert.equal(res6, "vectorset");
// REMOVE_END

// STEP_START vcardvdim
const res7 = await client.vCard("points");
console.log(res7);  // >>> 5

const res8 = await client.vDim("points");
console.log(res8);  // >>> 2
// STEP_END
// REMOVE_START
assert.equal(res7, 5);
assert.equal(res8, 2);
// REMOVE_END

// STEP_START vemb
const res9 = await client.vEmb("points", "pt:A");
console.log(res9);  // >>> [0.9999999403953552, 0.9999999403953552]

const res10 = await client.vEmb("points", "pt:B");
console.log(res10);  // >>> [-0.9999999403953552, -0.9999999403953552]

const res11 = await client.vEmb("points", "pt:C");
console.log(res11);  // >>> [-0.9999999403953552, 0.9999999403953552]

const res12 = await client.vEmb("points", "pt:D");
console.log(res12);  // >>> [0.9999999403953552, -0.9999999403953552]

const res13 = await client.vEmb("points", "pt:E");
console.log(res13);  // >>> [1, 0]
// STEP_END
// REMOVE_START
assert(Math.abs(1 - res9[0]) < 0.001);
assert(Math.abs(1 - res9[1]) < 0.001);
assert(Math.abs(1 + res10[0]) < 0.001);
assert(Math.abs(1 + res10[1]) < 0.001);
assert(Math.abs(1 + res11[0]) < 0.001);
assert(Math.abs(1 - res11[1]) < 0.001);
assert(Math.abs(1 - res12[0]) < 0.001);
assert(Math.abs(1 + res12[1]) < 0.001);
assert.deepEqual(res13, [1, 0]);
// REMOVE_END

// STEP_START attr
const res14 = await client.vSetAttr("points", "pt:A", {
  name: "Point A",
  description: "First point added"
});
console.log(res14);  // >>> true

const res15 = await client.vGetAttr("points", "pt:A");
console.log(res15);
// >>> {name: 'Point A', description: 'First point added'}

const res16 = await client.vSetAttr("points", "pt:A", "");
console.log(res16);  // >>> true

const res17 = await client.vGetAttr("points", "pt:A");
console.log(res17);  // >>> null
// STEP_END
// REMOVE_START
assert.equal(res14, true);
assert.deepEqual(res15, {name: "Point A", description: "First point added"});
assert.equal(res16, true);
assert.equal(res17, null);
// REMOVE_END

// STEP_START vrem
const res18 = await client.vAdd("points", [0, 0], "pt:F");
console.log(res18);  // >>> true

const res19 = await client.vCard("points");
console.log(res19);  // >>> 6

const res20 = await client.vRem("points", "pt:F");
console.log(res20);  // >>> true

const res21 = await client.vCard("points");
console.log(res21);  // >>> 5
// STEP_END
// REMOVE_START
assert.equal(res18, true);
assert.equal(res19, 6);
assert.equal(res20, true);
assert.equal(res21, 5);
// REMOVE_END

// STEP_START vsim_basic
const res22 = await client.vSim("points", [0.9, 0.1]);
console.log(res22);
// >>> ['pt:E', 'pt:A', 'pt:D', 'pt:C', 'pt:B']
// STEP_END
// REMOVE_START
assert.deepEqual(res22, ["pt:E", "pt:A", "pt:D", "pt:C", "pt:B"]);
// REMOVE_END

// STEP_START vsim_options
const res23 = await client.vSimWithScores("points", "pt:A", { COUNT: 4 });
console.log(res23);
// >>> {pt:A: 1.0, pt:E: 0.8535534143447876, pt:D: 0.5, pt:C: 0.5}
// STEP_END
// REMOVE_START
assert.equal(res23["pt:A"], 1.0);
assert.equal(res23["pt:C"], 0.5);
assert.equal(res23["pt:D"], 0.5);
assert(Math.abs(res23["pt:E"] - 0.85) < 0.005);
// REMOVE_END

// STEP_START vsim_filter
const res24 = await client.vSetAttr("points", "pt:A", {
  size: "large",
  price: 18.99
});
console.log(res24);  // >>> true

const res25 = await client.vSetAttr("points", "pt:B", {
  size: "large",
  price: 35.99
});
console.log(res25);  // >>> true

const res26 = await client.vSetAttr("points", "pt:C", {
  size: "large",
  price: 25.99
});
console.log(res26);  // >>> true

const res27 = await client.vSetAttr("points", "pt:D", {
  size: "small",
  price: 21.00
});
console.log(res27);  // >>> true

const res28 = await client.vSetAttr("points", "pt:E", {
  size: "small",
  price: 17.75
});
console.log(res28);  // >>> true

// Return elements in order of distance from point A whose
// `size` attribute is `large`.
const res29 = await client.vSim("points", "pt:A", {
  FILTER: '.size == "large"'
});
console.log(res29);  // >>> ['pt:A', 'pt:C', 'pt:B']

// Return elements in order of distance from point A whose size is
// `large` and whose price is greater than 20.00.
const res30 = await client.vSim("points", "pt:A", {
  FILTER: '.size == "large" && .price > 20.00'
});
console.log(res30);  // >>> ['pt:C', 'pt:B']
// STEP_END
// REMOVE_START
assert.equal(res24, true);
assert.equal(res25, true);
assert.equal(res26, true);
assert.equal(res27, true);
assert.equal(res28, true);
assert.deepEqual(res29, ['pt:A', 'pt:C', 'pt:B']);
assert.deepEqual(res30, ['pt:C', 'pt:B']);
// REMOVE_END

// STEP_START add_quant
const res31 = await client.vAdd("quantSetQ8", [1.262185, 1.958231], "quantElement", {
  QUANT: 'Q8'
});
console.log(res31);  // >>> true

const res32 = await client.vEmb("quantSetQ8", "quantElement");
console.log(`Q8: ${res32}`);
// >>> Q8: [1.2643694877624512, 1.958230972290039]

const res33 = await client.vAdd("quantSetNoQ", [1.262185, 1.958231], "quantElement", {
  QUANT: 'NOQUANT'
});
console.log(res33);  // >>> true

const res34 = await client.vEmb("quantSetNoQ", "quantElement");
console.log(`NOQUANT: ${res34}`);
// >>> NOQUANT: [1.262184977531433, 1.958230972290039]

const res35 = await client.vAdd("quantSetBin", [1.262185, 1.958231], "quantElement", {
  QUANT: 'BIN'
});
console.log(res35);  // >>> true

const res36 = await client.vEmb("quantSetBin", "quantElement");
console.log(`BIN: ${res36}`);
// >>> BIN: [1, 1]
// STEP_END
// REMOVE_START
assert.equal(res31, true);
assert(Math.abs(res32[0] - 1.2643694877624512) < 0.001);
assert(Math.abs(res32[1] - 1.958230972290039) < 0.001);
assert.equal(res33, true);
assert(Math.abs(res34[0] - 1.262184977531433) < 0.001);
assert(Math.abs(res34[1] - 1.958230972290039) < 0.001);
assert.equal(res35, true);
assert.deepEqual(res36, [1, 1]);
// REMOVE_END

// STEP_START add_reduce
// Create a list of 300 arbitrary values.
const values = Array.from({length: 300}, (_, x) => x / 299);

const res37 = await client.vAdd("setNotReduced", values, "element");
console.log(res37);  // >>> true

const res38 = await client.vDim("setNotReduced");
console.log(res38);  // >>> 300

const res39 = await client.vAdd("setReduced", values, "element", {
  REDUCE: 100
});
console.log(res39);  // >>> true

const res40 = await client.vDim("setReduced");
console.log(res40);  // >>> 100
// STEP_END
// REMOVE_START
assert.equal(res37, true);
assert.equal(res38, 300);
assert.equal(res39, true);
assert.equal(res40, 100);
// REMOVE_END

// HIDE_START
await client.quit();
// HIDE_END
