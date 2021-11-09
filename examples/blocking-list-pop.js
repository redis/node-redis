// This example shows how to use the blocking LPUSH command.

// This code shows how to run with isolation the blPop Command to block the script while waiting for a value to be pushed to the list.
// The script will be blocked until the LPUSH command is executed.
// After which we log the list and quit the client.

import { createClient, commandOptions } from 'redis';

async function blockingListPop() {
	const client = createClient();

	await client.connect();

	const keyName = 'keyName';

	const blpopPromise = client.blPop(
		commandOptions({ isolated: true }),
		keyName,
		0
	);

	await client.lPush(keyName, 'value');

	await blpopPromise;

	console.log('blpopPromise resolved');
	console.log(keyName);

	await client.quit();
}

blockingListPop();
