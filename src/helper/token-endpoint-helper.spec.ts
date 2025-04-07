/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Container } from 'inversify';

import { TokenEndpointHelper } from './token-endpoint-helper';
import { OpenIdConfigurationHelper } from './openid-configuration-helper';
import type { IAMOpenIdConfiguration } from '../api/iam-openid-configuration';
import type { IAMSession } from '../api/iam-session';

vi.mock(import('./openid-configuration-helper'));

let tokenEndpointHelper: TokenEndpointHelper;

const validSession = {
  access_token: 'token123',
  refresh_token: 'refresh123',
  token_type: 'Bearer',
  expires_in: 3_600,
  expiration: new Date(Date.now() + 3_600 * 1_000).getDate(),
  refresh_token_expiration: new Date(Date.now() + 3_600 * 1_000).getDate(),
  scope: 'openid profile email',
  session_id: 'session123',
} as unknown as IAMSession;

beforeAll(() => {
  // Mock the fetch function globally
  Object.defineProperty(globalThis, 'fetch', {
    writable: true,
    value: vi.fn<(input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>>(),
  });
});

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Create fresh instance each time
  const container = new Container();
  container.bind(TokenEndpointHelper).toSelf().inSingletonScope();
  container.bind(OpenIdConfigurationHelper).toSelf().inSingletonScope();

  tokenEndpointHelper = await container.getAsync(TokenEndpointHelper);
});

describe('search', () => {
  const openIdConfigurationMock = {
    token_endpoint: 'https://my-dummy-endpoint-token',
  } as unknown as IAMOpenIdConfiguration;

  beforeEach(() => {
    vi.mocked(OpenIdConfigurationHelper.prototype.getConfig).mockResolvedValue(openIdConfigurationMock);
  });

  it('should grab the session', async () => {
    expect.assertions(4);

    vi.mocked(globalThis.fetch).mockResolvedValue({
      json: vi.fn<() => Promise<unknown>>().mockResolvedValue(validSession),
      status: 200,
      ok: true,
    } as unknown as Response);

    const body = 'grant_type=passcode&passcode=abc123';
    const result = await tokenEndpointHelper.getToken(body);

    expect(result).toStrictEqual(validSession);
    // Headers should be correct
    expect(fetch).toHaveBeenCalledWith(
      openIdConfigurationMock.token_endpoint,
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Basic Yng6Yng=', // Expected bx:bx (no problem to see it publicly) user encoded in base64
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );
    // Check body
    expect(fetch).toHaveBeenCalledWith(openIdConfigurationMock.token_endpoint, expect.objectContaining({ body }));

    // Check method
    expect(fetch).toHaveBeenCalledWith(
      openIdConfigurationMock.token_endpoint,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws error when fetch response is not ok', async () => {
    expect.assertions(1);

    const errorJson = { error: 'invalid_grant' };

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      json: vi.fn<() => Promise<unknown>>().mockResolvedValue(errorJson),
    } as unknown as Response);

    await expect(tokenEndpointHelper.getToken('grant_type=passcode&passcode=wrong')).rejects.toThrow('invalid_grant');
  });

  it('throws error on invalid token response', async () => {
    expect.assertions(1);

    const invalidSession = { invalid: 'data' };

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn<() => Promise<unknown>>().mockResolvedValue(invalidSession),
    } as unknown as Response);

    await expect(tokenEndpointHelper.getToken('grant_type=passcode&passcode=abc123')).rejects.toThrow('Invalid token');
  });
});
