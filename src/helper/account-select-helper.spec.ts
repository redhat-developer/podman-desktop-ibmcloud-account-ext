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

import { AccountSelectHelper } from './account-select-helper';
import type { IAMSession } from '../api/iam-session';
import type { CloudAccountType } from '../api/cloud-account';

let accountSelectHelper: AccountSelectHelper;

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
  container.bind(AccountSelectHelper).toSelf().inSingletonScope();

  accountSelectHelper = await container.getAsync(AccountSelectHelper);
});

test('should fetch and return valid CloudAccount list', async () => {
  expect.assertions(2);

  const session: IAMSession = {
    access_token: 'mock-access-token',
  } as unknown as IAMSession;

  const validAccountResponse: CloudAccountType = {
    next_url: '',
    resources: [
      {
        metadata: { guid: 'account-1' },
        entity: {
          name: 'Account One',
          primary_owner: { ibmid: 'user1@ibm.com' },
        },
      },
      {
        metadata: { guid: 'account-2' },
        entity: {
          name: 'Account Two',
          primary_owner: { ibmid: 'user2@ibm.com' },
        },
      },
    ],
  };

  vi.mocked(fetch).mockResolvedValue({
    json: async () => validAccountResponse,
  } as Response);

  const result = await accountSelectHelper.getAccounts(session);

  expect(fetch).toHaveBeenCalledWith(new URL(AccountSelectHelper.ACCOUNT_URL), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  expect(result).toStrictEqual([
    { guid: 'account-1', name: 'Account One', ibmid: 'user1@ibm.com' },
    { guid: 'account-2', name: 'Account Two', ibmid: 'user2@ibm.com' },
  ]);
});

test('should throw error on invalid account response', async () => {
  expect.assertions(2);

  const session: IAMSession = {
    access_token: 'mock-access-token',
  } as unknown as IAMSession;

  const invalidResponse = { foo: 'bar' };

  vi.mocked(fetch).mockResolvedValue({
    json: async () => invalidResponse,
  } as Response);

  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  await expect(accountSelectHelper.getAccounts(session)).rejects.toThrow('Invalid account');

  expect(errorSpy).toHaveBeenCalledWith(
    'Invalid account',
    expect.anything(), // Zod error details
  );

  errorSpy.mockRestore();
});
