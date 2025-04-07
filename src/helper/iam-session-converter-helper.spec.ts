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
import { beforeEach, expect, test, vi } from 'vitest';
import { IamSessionConverterHelper } from './iam-session-converter-helper';
import type { IAMSession, IamSessionAccessTokenJWT } from '/@/api/iam-session';
import type { AuthenticationSession } from '@podman-desktop/api';

import { Container } from 'inversify';
import { IamSessionAccessTokenHelper } from './iam-session-access-token-helper';

vi.mock(import('./iam-session-access-token-helper'));

let iamSessionConverterHelper: IamSessionConverterHelper;

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  // Create fresh instance each time
  const container = new Container();
  container.bind(IamSessionConverterHelper).toSelf().inSingletonScope();
  container.bind(IamSessionAccessTokenHelper).toSelf().inSingletonScope();
  iamSessionConverterHelper = await container.getAsync(IamSessionConverterHelper);
});

test('should convert IAMSession to AuthenticationSession correctly', () => {
  expect.assertions(2);

  const jwt: IamSessionAccessTokenJWT = {
    id: 'user-123',
    email: 'john@doe',
    name: 'John Doe',
  };

  const session: IAMSession = {
    access_token: 'access-token-abc',
    refresh_token: 'refresh-token-xyz',
    token_type: 'Bearer',
    expires_in: 3600,
    expiration: Date.now() + 3600 * 1000,
    refresh_token_expiration: Date.now() + 7200 * 1000,
    scope: 'openid profile email',
    session_id: 'sess-789',
  };

  vi.mocked(IamSessionAccessTokenHelper.prototype.extractData).mockReturnValue(jwt);

  const result: AuthenticationSession = iamSessionConverterHelper.convertToAuthenticationSession(session);

  expect(IamSessionAccessTokenHelper.prototype.extractData).toHaveBeenCalledWith(session);
  expect(result).toStrictEqual({
    id: 'sess-789',
    accessToken: 'access-token-abc',
    scopes: ['openid', 'profile', 'email'],
    account: {
      id: 'user-123',
      label: 'John Doe',
    },
  });
});
