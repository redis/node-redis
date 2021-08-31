import { add, suite, cycle, complete } from 'benny';
import v4 from 'v4';
import v3 from 'v3';
import { once } from 'events';

const v4Client = v4.createClient(),
    v4LegacyClient = v4.createClient({
        legacyMode: true
    }),
    v3Client = v3.createClient();

await Promise.all([
    v4Client.connect(),
    v4LegacyClient.connect(),
    once(v3Client, 'connect')
]);

const key = random(100),
    value = random(100);

function random(size) {
    const result = [];

    for (let i = 0; i < size; i++) {
        result.push(Math.floor(Math.random() * 10));
    }

    return result.join('');
}

suite(
    'SET GET',
    add('v4', async () => {
        await Promise.all([
            v4Client.set(key, value),
            v4Client.get(key)
        ]);
    }),
    add('v4 - legacy mode', () => {
        return new Promise((resolve, reject) => {
            v4LegacyClient.set(key, value);
            v4LegacyClient.get(key, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply);
                }
            });
        });
    }),
    add('v3', () => {
        return new Promise((resolve, reject) => {
            v3Client.set(key, value);
            v3Client.get(key, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply);
                }
            });
        });
    }),
    cycle(),
    complete(),
    complete(() => {
        return Promise.all([
            v4Client.disconnect(),
            v4LegacyClient.disconnect(),
            new Promise((resolve, reject) => {
                v3Client.quit((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(err);
                    }
                });
            })
        ]);
    })
);

