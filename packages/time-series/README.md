# @node-redis/time-series

This package provides support for the [RedisTimeSeries](https://redistimeseries.io) module, which adds a time series data structure to Redis. It extends the [Node Redis client](https://github.com/redis/node-redis) to include functions for each of the RedisTimeSeries commands.

To use these extra commands, your Redis server must have the RedisTimeSeries module installed.

For an example of how to add values to a time series, query a time series, and perform aggregated queries against a time series, see `time-series.js` in the Node Redis examples folder.
