import { createClient } from 'redis';
async function setScan() {
	const client = createClient();
	await client.connect();
	const setName = 'setName';
    for await (const member of client.sScanIterator(setName)) {
        console.log(member);
    }
	await client.quit();
}
setScan();