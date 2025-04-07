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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Container } from 'inversify';

import type { IAMSession } from '../api/iam-session';
import { PersistentSessionHelper } from './persistent-session-helper';
import { ExtensionContextSymbol } from '../inject/symbol';
import type { ExtensionContext } from '@podman-desktop/api';

const extensionContextMock = {
  secrets: {
    get: vi.fn<(key: string) => Promise<string | undefined>>(),
    store: vi.fn<(key: string, value: string) => Promise<void>>(),
  },
} as unknown as ExtensionContext;

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

let persistentSessionHelper: PersistentSessionHelper;

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Create fresh instance each time
  const container = new Container();
  container.bind(PersistentSessionHelper).toSelf().inSingletonScope();
  container.bind(ExtensionContextSymbol).toConstantValue(extensionContextMock);
  persistentSessionHelper = await container.getAsync(PersistentSessionHelper);
});

describe('restoreSessions', () => {
  it('should return parsed and validated sessions if stored data exists', async () => {
    expect.assertions(2);

    const parsedData = [validSession];

    const stored = JSON.stringify(parsedData);
    vi.mocked(extensionContextMock.secrets).get.mockResolvedValue(stored);

    const result = await persistentSessionHelper.restoreSessions();

    expect(extensionContextMock.secrets.get).toHaveBeenCalledWith('ibmcloud-auth-sessions');
    expect(result).toStrictEqual(parsedData);
  });

  it('should return an empty array if no stored data found', async () => {
    expect.assertions(1);

    vi.mocked(extensionContextMock.secrets).get.mockResolvedValue(undefined);

    const result = await persistentSessionHelper.restoreSessions();

    expect(result).toStrictEqual([]);
  });

  it('should return empty if invalid JSON', async () => {
    expect.assertions(1);

    vi.mocked(extensionContextMock.secrets).get.mockResolvedValue('INVALID_JSON');

    const result = await persistentSessionHelper.restoreSessions();

    expect(result).toStrictEqual([]);
  });

  it('should return empty if partial data', async () => {
    expect.assertions(1);

    vi.mocked(extensionContextMock.secrets).get.mockResolvedValue(JSON.stringify({}));

    const result = await persistentSessionHelper.restoreSessions();

    expect(result).toStrictEqual([]);
  });
});

describe('save', () => {
  it('should stringify and store the sessions', async () => {
    expect.assertions(1);

    const sessions = [validSession];

    await persistentSessionHelper.save(sessions);

    expect(extensionContextMock.secrets.store).toHaveBeenCalledWith('ibmcloud-auth-sessions', JSON.stringify(sessions));
  });
});
