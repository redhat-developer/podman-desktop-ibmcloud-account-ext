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
import type { IAMSession } from '../api/iam-session';

import { Container, injectFromBase, injectable } from 'inversify';
import { IamSessionRefreshTokenHelper } from './iam-session-refresh-token-helper';
import { TokenEndpointHelper } from './token-endpoint-helper';
import type { CloudAccount } from '../api/cloud-account';

vi.mock(import('./token-endpoint-helper'));

@injectable()
@injectFromBase()
class TestIamSessionRefreshTokenHelper extends IamSessionRefreshTokenHelper {
  createBody(refreshToken: string, cloudAccount?: CloudAccount): string {
    return super.createBody(refreshToken, cloudAccount);
  }
}

let iamSessionRefreshTokenHelper: TestIamSessionRefreshTokenHelper;

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  // Create fresh instance each time
  const container = new Container();
  container.bind(TokenEndpointHelper).toSelf().inSingletonScope();
  container.bind(TestIamSessionRefreshTokenHelper).toSelf().inSingletonScope();
  iamSessionRefreshTokenHelper = await container.getAsync(TestIamSessionRefreshTokenHelper);
});

test('should refresh token successfully using the refresh token', async () => {
  expect.assertions(2);

  const mockSession: IAMSession = {
    refresh_token: 'refresh-abc',
  } as IAMSession;

  const newSession: IAMSession = {
    access_token: 'new-token',
    refresh_token: 'new-refresh-token',
  } as IAMSession;

  const expectedBody = 'grant_type=refresh_token&refresh_token=refresh-abc';

  vi.mocked(TokenEndpointHelper.prototype.getToken).mockResolvedValue(newSession);

  const result = await iamSessionRefreshTokenHelper.refreshToken(mockSession);

  expect(TokenEndpointHelper.prototype.getToken).toHaveBeenCalledWith(expectedBody);
  expect(result).toStrictEqual(newSession);
});

test('should refresh token successfully with a custom account', async () => {
  expect.assertions(3);

  const mockSession: IAMSession = {
    refresh_token: 'refresh-abc',
  } as IAMSession;

  const newSession: IAMSession = {
    access_token: 'new-token',
    refresh_token: 'new-refresh-token',
  } as IAMSession;

  const account: CloudAccount = {
    guid: 'account-guid',
    name: 'account-name',
    ibmid: 'account-ibmid',
  };

  const expectedBody = 'grant_type=refresh_token&refresh_token=refresh-abc&account=account-guid';

  vi.mocked(TokenEndpointHelper.prototype.getToken).mockResolvedValue(newSession);

  const spyCreateBody = vi.spyOn(iamSessionRefreshTokenHelper, 'createBody');

  const result = await iamSessionRefreshTokenHelper.refreshToken(mockSession, account);

  expect(TokenEndpointHelper.prototype.getToken).toHaveBeenCalledWith(expectedBody);
  expect(result).toStrictEqual(newSession);
  expect(spyCreateBody).toHaveBeenCalledWith('refresh-abc', account);
});

test('should throw error if no refresh token is present', async () => {
  expect.assertions(1);

  const invalidSession: IAMSession = {} as IAMSession;

  await expect(iamSessionRefreshTokenHelper.refreshToken(invalidSession)).rejects.toThrow('No refresh token found');
});

test('should build correct request body from refresh token', () => {
  expect.assertions(1);

  const body = iamSessionRefreshTokenHelper.createBody('refresh-xyz');

  expect(body).toBe('grant_type=refresh_token&refresh_token=refresh-xyz');
});

test('should build correct request body from refresh token and cloudAccount', () => {
  expect.assertions(1);

  const cloudAccount: CloudAccount = {
    guid: 'account-guid',
    name: 'account-name',
    ibmid: 'account-ibmid',
  };

  const body = iamSessionRefreshTokenHelper.createBody('refresh-xyz', cloudAccount);

  expect(body).toBe('grant_type=refresh_token&refresh_token=refresh-xyz&account=account-guid');
});
