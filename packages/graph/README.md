# @redis/graph

Example usage:
```javascript
import { createClient, Graph } from 'redis';

const client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

const graph = new Graph('graph', client);

await graph.query(
  'graph',
  'CREATE (:Rider { name: "Buzz Aldrin" })-[:rides]->(:Team { name: "Apollo" })'
);

const result = await graph.roQuery(
  'MATCH (r:Rider)-[:rides]->(t:Team { name: "Apollo" }) RETURN r.name AS riderName, t.name AS teamName'
);

console.log(result.data);
// [{
//   riderName: 'Buzz Aldrin',
//   teamName: 'Apollo'
// }]
```
