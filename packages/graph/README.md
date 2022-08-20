# @redis/graph

Example usage:
```
import { createClient } from 'redis';

const client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

const create = "CREATE (:Rider {name:'Buzz Aldrin'})-[:rides]->(:Team {name: 'Apollo'})"
await client.graph.QUERY('noderedis:graphy', create)

const query = `MATCH (r:Rider)-[:rides]->(t:Team) WHERE t.name = 'Apollo' RETURN r.name, t.name`
const res = await client.graph.query("noderedis:graphy", query)
console.log(res)
```

Output from console log:
```
{
  headers: [ 'r.name', 't.name' ],
  data: [ [ 'Buzz Aldrin', 'Apollo' ] ],
  metadata: [
    'Cached execution: 0',
    'Query internal execution time: 0.431700 milliseconds'
  ]
}
```
