import { RESP_TYPES } from 'redis-local';
import { createCachedClient } from './index.js';

export default (host, metadata) => createCachedClient(host, metadata, {
  commandOptions: {
    typeMapping: {
      [RESP_TYPES.BLOB_STRING]: Buffer
    }
  }
});
