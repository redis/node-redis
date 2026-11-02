import { NetworkError, AuthError } from '@azure/msal-common';
import { strict as assert } from 'node:assert';
import { DEFAULT_RETRY_POLICY } from './entra-id-credentials-provider-factory';

describe('DEFAULT_RETRY_POLICY', () => {
  it('retries a NetworkError', () => {
    const error = new NetworkError(new AuthError('network_error'));
    assert.equal(DEFAULT_RETRY_POLICY.isRetryable!(error, 1), true);
  });

  it('retries a NetworkError from another copy of msal-common', () => {
    class OtherCopyNetworkError extends Error {
      constructor() {
        super('network_error');
        this.name = 'NetworkError';
      }
    }
    assert.equal(DEFAULT_RETRY_POLICY.isRetryable!(new OtherCopyNetworkError(), 1), true);
  });

  it('does not retry other errors', () => {
    assert.equal(DEFAULT_RETRY_POLICY.isRetryable!(new AuthError('invalid_grant'), 1), false);
    assert.equal(DEFAULT_RETRY_POLICY.isRetryable!(new Error('boom'), 1), false);
    assert.equal(DEFAULT_RETRY_POLICY.isRetryable!({ name: 'NetworkError' }, 1), false);
  });
});
