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

import type { ExtensionContext } from '@podman-desktop/api';
import { beforeEach, expect, test, vi } from 'vitest';
import type { Container } from 'inversify';
import { IBMCloudExtension } from './ibmcloud-extension';
import { AuthenticationProviderManager } from './manager/authentication-provider-manager';

let extensionContextMock: ExtensionContext;
let ibmCloudExtension: TestIBMCloudExtension;

vi.mock(import('./manager/authentication-provider-manager'));

class TestIBMCloudExtension extends IBMCloudExtension {
  public async deferActivate(): Promise<void> {
    return super.deferActivate();
  }

  public getContainer(): Container | undefined {
    return super.getContainer();
  }
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  // Create a mock for the ExtensionContext
  extensionContextMock = {} as ExtensionContext;
  ibmCloudExtension = new TestIBMCloudExtension(extensionContextMock);
});

test('should activate correctly', async () => {
  expect.assertions(1);

  await ibmCloudExtension.activate();

  expect(ibmCloudExtension.getContainer()?.get(AuthenticationProviderManager)).toBeInstanceOf(
    AuthenticationProviderManager,
  );
});

test('should call deferActivate correctly', async () => {
  expect.assertions(1);

  await ibmCloudExtension.activate();

  // Check we called the registration methods
  await vi.waitFor(() => {
    expect(AuthenticationProviderManager.prototype.registerAuthenticationProvider).toHaveBeenCalledWith();
  });
});

test('should deactivate correctly', async () => {
  expect.assertions(2);

  await ibmCloudExtension.activate();

  expect(ibmCloudExtension.getContainer()?.isBound(AuthenticationProviderManager)).toBe(true);

  await ibmCloudExtension.deactivate();

  // Check the bindings are gone
  expect(ibmCloudExtension.getContainer()?.isBound(AuthenticationProviderManager)).toBe(false);
});

test('should log error if deferActivate throws', async () => {
  expect.assertions(2);

  const error = new Error('deferActivate failure');
  const spyConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  // Mock deferActivate to throw
  const spyDeferActivate = vi.spyOn(ibmCloudExtension, 'deferActivate').mockRejectedValueOnce(error);

  await ibmCloudExtension.activate();

  await vi.waitFor(() => {
    expect(spyDeferActivate).toHaveBeenCalledWith();
    expect(spyConsoleError).toHaveBeenCalledWith('error in deferActivate', error);
  });

  spyConsoleError.mockRestore();
});
