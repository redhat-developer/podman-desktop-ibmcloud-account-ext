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
import { jwtDecode } from 'jwt-decode';

import { IamSessionAccessTokenHelper } from './iam-session-access-token-helper';
import type { IAMSession, IamSessionAccessTokenJWT } from '/@/api/iam-session';
import { Container } from 'inversify';

vi.mock(import('jwt-decode'));

let iamSessionAccessTokenHelper: IamSessionAccessTokenHelper;

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Create fresh instance each time
  const container = new Container();
  container.bind(IamSessionAccessTokenHelper).toSelf().inSingletonScope();
  iamSessionAccessTokenHelper = await container.getAsync(IamSessionAccessTokenHelper);
});

test('should extract and validate JWT data successfully', () => {
  expect.assertions(2);

  const validJwt: IamSessionAccessTokenJWT = {
    id: 'id1',
    email: 'foo@bar.com',
    name: 'Foo Bar',
  };

  const session: IAMSession = {
    access_token: 'valid.jwt.token',
  } as IAMSession;

  // Mock jwtDecode and schema validation
  vi.mocked(jwtDecode).mockReturnValue(validJwt);
  const result = iamSessionAccessTokenHelper.extractData(session);

  expect(jwtDecode).toHaveBeenCalledWith('valid.jwt.token');
  expect(result).toStrictEqual(validJwt);
});

test('should throw error if JWT is invalid', () => {
  expect.assertions(1);

  const invalidJwt = { foo: 'bar' };

  const session: IAMSession = {
    access_token: 'invalid.jwt.token',
  } as IAMSession;

  vi.mocked(jwtDecode).mockReturnValue(invalidJwt);

  expect(() => iamSessionAccessTokenHelper.extractData(session)).toThrow('Invalid token');
});

test('should log error and throw when JWT validation fails', () => {
  expect.assertions(2);

  const brokenJwt = { foo: 'bar' };
  const session: IAMSession = {
    access_token: 'broken.jwt.token',
  } as IAMSession;

  vi.mocked(jwtDecode).mockReturnValue(brokenJwt);
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  expect(() => iamSessionAccessTokenHelper.extractData(session)).toThrow('Invalid token');
  expect(console.error).toHaveBeenCalledWith('Invalid token', expect.anything());

  errorSpy.mockRestore();
});
