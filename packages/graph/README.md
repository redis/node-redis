# @redis/graph

Example usage:
```javascript
import { createClient } from 'redis';

const client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

await client.graph.query(
  'graph',
  "CREATE (:Rider { name: 'Buzz Aldrin' })-[:rides]->(:Team { name: 'Apollo' })"
);

const result = await client.graph.query(
  'graph',
  `MATCH (r:Rider)-[:rides]->(t:Team) WHERE t.name = 'Apollo' RETURN r.name, t.name`
);

console.log(result);
```

Output from console log:
```json
{
  headers: [ 'r.name', 't.name' ],
  data: [ [ 'Buzz Aldrin', 'Apollo' ] ],
  metadata: [
    'Cached execution: 0',
    'Query internal execution time: 0.431700 milliseconds'
  ]
}
```
