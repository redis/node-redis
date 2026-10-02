/**
 * Compile-time checks for the multi-db controller's addDatabase config typing:
 * each factory kind's controller accepts only its own member-config shape.
 * Nonsense options, cross-kind options, and poolOptions on non-pool
 * controllers were accepted as `unknown` before and failed only at runtime
 * inside the member factory.
 *
 * Lives outside `lib/` so it is not picked up by the production build.
 * Checked with `npm run test:types -w @redis/client`.
 */
import {
  createMultiDbClient,
  createMultiDbClientPool,
  createMultiDbCluster,
  createMultiDbSentinel
} from '../index';

const socket = { host: '127.0.0.1', port: 6379 };

/* ------------------------------- standalone ------------------------------ */
{
  const { controller } = createMultiDbClient({ databases: [{ options: { socket } }] });

  // valid shapes compile
  void controller.addDatabase({ options: { socket }, weight: 0.5 });

  // @ts-expect-error nonsense options must not compile
  void controller.addDatabase({ options: 42 });

  // @ts-expect-error cluster options on a standalone controller must not compile
  void controller.addDatabase({ options: { rootNodes: [{ socket }] } });

  // @ts-expect-error poolOptions belong to the pool factory only
  void controller.addDatabase({ options: { socket }, poolOptions: { minimum: 1, maximum: 2 } });
}

/* ---------------------------------- pool ---------------------------------- */
{
  const { controller } = createMultiDbClientPool({ databases: [{ options: { socket } }] });

  // poolOptions is valid here
  void controller.addDatabase({ options: { socket }, poolOptions: { minimum: 1, maximum: 2 } });

  // @ts-expect-error nonsense options must not compile
  void controller.addDatabase({ options: 'redis://x' });
}

/* --------------------------------- cluster -------------------------------- */
{
  const { controller } = createMultiDbCluster({ databases: [{ options: { rootNodes: [{ socket }] } }] });

  void controller.addDatabase({ options: { rootNodes: [{ socket }] } });

  // @ts-expect-error standalone url-only options are not cluster options
  void controller.addDatabase({ options: 42 });
}

/* -------------------------------- sentinel -------------------------------- */
{
  const { controller } = createMultiDbSentinel({
    databases: [{ options: { name: 'mymaster', sentinelRootNodes: [socket] } }]
  });

  void controller.addDatabase({ options: { name: 'mymaster', sentinelRootNodes: [socket] } });

  // @ts-expect-error sentinel options require name and sentinelRootNodes
  void controller.addDatabase({ options: { socket } });
}
