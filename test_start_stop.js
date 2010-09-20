var redis  = require("./index"),
    client = redis.createClient();

redis.debug_mode = true;
client.quit();
