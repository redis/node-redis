# F.A.Q.

Nobody has *actually* asked these questions. But, we needed somewhere to put all the important bits and bobs that didn't fit anywhere else. So, here you go!

## What happens when the network goes down?

When a socket closed unexpectedly, all the commands that were already sent will reject as they might have been executed on the server. The rest will remain queued in memory until a new socket is established. If the client is closed—either by returning an error from [`reconnectStrategy`](./client-configuration.md#reconnect-strategy) or by manually calling `.disconnect()`—they will be rejected.

## How are commands batched?

Commands are pipelined using [`queueMicrotask`](https://nodejs.org/api/globals.html#globals_queuemicrotask_callback). Commands from the same "tick" will be sent in batches and respect the [`writableHighWaterMark`](https://nodejs.org/api/stream.html#stream_new_stream_writable_options).

If `socket.write()` returns `false`—meaning that ["all or part of the data was queued in user memory"](https://nodejs.org/api/net.html#net_socket_write_data_encoding_callback:~:text=all%20or%20part%20of%20the%20data%20was%20queued%20in%20user%20memory)—the commands will stack in memory until the [`drain`](https://nodejs.org/api/net.html#net_event_drain) event is fired.
