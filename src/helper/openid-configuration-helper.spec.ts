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

import { beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { Container } from 'inversify';

import { OpenIdConfigurationHelper } from './openid-configuration-helper';
import type { IAMOpenIdConfiguration } from '../api/iam-openid-configuration';

let openIdConfigurationHelper: OpenIdConfigurationHelper;

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

  // Create fresh instance each time
  const container = new Container();
  container.bind(OpenIdConfigurationHelper).toSelf().inSingletonScope();

  openIdConfigurationHelper = await container.getAsync(OpenIdConfigurationHelper);
});

test('should fetch and return valid OpenID configuration', async () => {
  expect.assertions(2);

  const validConfig: IAMOpenIdConfiguration = {
    passcode_endpoint: 'https://iam.cloud.ibm.com/foo',
    authorization_endpoint: 'https://iam.cloud.ibm.com/foo',
    token_endpoint: 'https://iam.cloud.ibm.com/foo',
    userinfo_endpoint: 'https://iam.cloud.ibm.com/foo',
    jwks_uri: 'https://iam.cloud.ibm.com/foo',
    scopes_supported: ['openid', 'profile', 'email'],
    public_hosts: ['https://iam.cloud.ibm.com'],

    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
  };

  vi.mocked(fetch).mockResolvedValue({
    json: async () => validConfig,
  } as Response);

  const result = await openIdConfigurationHelper.getConfig();

  expect(fetch).toHaveBeenCalledWith(
    new URL('/identity/.well-known/openid-configuration', OpenIdConfigurationHelper.IAM_URL),
  );
  expect(result).toStrictEqual(validConfig);
});

test('should throw an error on invalid OpenID configuration', async () => {
  expect.assertions(2);

  const invalidConfig = { foo: 'bar' };

  vi.mocked(fetch).mockResolvedValue({
    json: async () => invalidConfig,
  } as Response);

  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  await expect(openIdConfigurationHelper.getConfig()).rejects.toThrow('Invalid OpenID configuration');
  expect(errorSpy).toHaveBeenCalledWith(
    'Invalid OpenID configuration',
    expect.anything(), // Zod error object
  );

  errorSpy.mockRestore();
});
