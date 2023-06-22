# Client

- Does `close`/`destory` actually close the connection from the Redis POV? Works with OSS, but what about Redis Enterprie?

Docs:
- [v4 to v5](./v4-to-v5.md) - Legacy mode
- [Command Options](./command-options.md)
- [RESP](./RESP.md)

# Server

- `HEXISTS`: accepts one field only, should be the same as `EXISTS`

`String` -> `Double`:
- `INCRBYFLOAT`
- `HINCRBYFLOAT`
- `GEODIST`

`Number` -> `Boolean`:
- `HSETNX` (deprecated)
- `SCRIPT EXISTS`
