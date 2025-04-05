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
import { TokenEndpointHelper } from './token-endpoint-helper';
import { PasscodeEndpointHelper } from './passcode-endpoint-helper';
import { Uri, env, window } from '@podman-desktop/api';
import { OpenIdConfigurationHelper } from './openid-configuration-helper';
import type { IAMOpenIdConfiguration } from '../api/iam-openid-configuration';

vi.mock(import('./token-endpoint-helper'));
vi.mock(import('./openid-configuration-helper'));

@injectable()
@injectFromBase()
class TestPasscodeEndpointHelper extends PasscodeEndpointHelper {
  createBody(refreshToken: string): string {
    return super.createBody(refreshToken);
  }

  validateInput(value: string): string | undefined {
    return super.validateInput(value);
  }
}

let passcodeEndpointHelper: TestPasscodeEndpointHelper;

const passcodeEndpointValue = 'https://iam.cloud.ibm.com/passcode';

const dummySession: IAMSession = {
  access_token: 'access-123',
  refresh_token: 'refresh-456',
} as IAMSession;

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  // Create fresh instance each time
  const container = new Container();
  container.bind(TokenEndpointHelper).toSelf().inSingletonScope();
  container.bind(OpenIdConfigurationHelper).toSelf().inSingletonScope();
  container.bind(TestPasscodeEndpointHelper).toSelf().inSingletonScope();
  passcodeEndpointHelper = await container.getAsync(TestPasscodeEndpointHelper);

  vi.mocked(TokenEndpointHelper.prototype.getToken).mockResolvedValue(dummySession);
  vi.mocked(OpenIdConfigurationHelper.prototype.getConfig).mockResolvedValue({
    passcode_endpoint: passcodeEndpointValue,
  } as unknown as IAMOpenIdConfiguration);
  vi.mocked(Uri.parse).mockImplementation((uri: string) => new URL(uri) as unknown as Uri);
});

test('should perform authentication flow successfully', async () => {
  expect.assertions(5);

  vi.mocked(window.showInputBox).mockResolvedValue('secure-passcode');

  vi.mocked(TokenEndpointHelper.prototype.getToken).mockResolvedValue(dummySession);
  vi.mocked(window.showInputBox).mockResolvedValue('secure-passcode');
  vi.mocked(OpenIdConfigurationHelper.prototype.getConfig).mockResolvedValue({
    passcode_endpoint: passcodeEndpointValue,
  } as unknown as IAMOpenIdConfiguration);

  const result = await passcodeEndpointHelper.authenticate();

  expect(OpenIdConfigurationHelper.prototype.getConfig).toHaveBeenCalledWith();
  expect(env.openExternal).toHaveBeenCalledWith(expect.objectContaining({ href: passcodeEndpointValue }));
  expect(window.showInputBox).toHaveBeenCalledWith({
    ignoreFocusOut: true,
    placeHolder: 'Enter the passcode',
    prompt: 'Enter the passcode',
    validateInput: expect.any(Function),
  });
  expect(TokenEndpointHelper.prototype.getToken).toHaveBeenCalledWith(
    'grant_type=urn%3Aibm%3Aparams%3Aoauth%3Agrant-type%3Apasscode&passcode=secure-passcode',
  );
  expect(result).toStrictEqual(dummySession);
});

test('should throw if user cancels input box', async () => {
  expect.assertions(1);

  vi.mocked(window.showInputBox).mockResolvedValue(undefined);

  await expect(passcodeEndpointHelper.authenticate()).rejects.toThrow('Did not receive a passcode');
});

test('should return validation message if passcode is too short', async () => {
  expect.assertions(2);

  const result = passcodeEndpointHelper.validateInput('123');

  expect(result).toBe('Passcode must be at least 6 characters');

  const validResult = passcodeEndpointHelper.validateInput('123456');

  expect(validResult).toBeUndefined();
});

test('should create correct body for passcode', () => {
  expect.assertions(1);

  const body = passcodeEndpointHelper.createBody('mypass');

  expect(body).toBe('grant_type=urn%3Aibm%3Aparams%3Aoauth%3Agrant-type%3Apasscode&passcode=mypass');
});
