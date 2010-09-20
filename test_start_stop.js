var redis = require("redis"),
    client = redis.createClient();

redis.debug_mode = true;
client.quit();
