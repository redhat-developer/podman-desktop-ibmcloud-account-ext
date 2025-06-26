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

import { Container } from 'inversify';
import { helpersModule } from './helper-module';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExtensionContextSymbol, TelemetryLoggerSymbol } from '/@/inject/symbol';
import type { ExtensionContext, TelemetryLogger } from '@podman-desktop/api';
import { IamSessionAccessTokenHelper } from './iam-session-access-token-helper';

describe('helper-module', () => {
  let container: Container;

  beforeEach(async () => {
    vi.resetAllMocks();
    container = new Container();

    // Bind other dependencies used by the helpers
    container.bind(ExtensionContextSymbol).toConstantValue({} as ExtensionContext);
    container.bind(TelemetryLoggerSymbol).toConstantValue({} as TelemetryLogger);

    // Load the helpersModule bindings into the container
    await container.load(helpersModule);
  });

  it('should bind ClusterSearchHelper as a singleton', () => {
    expect.assertions(1);

    const helper1 = container.get<IamSessionAccessTokenHelper>(IamSessionAccessTokenHelper);
    const helper2 = container.get<IamSessionAccessTokenHelper>(IamSessionAccessTokenHelper);

    // Ensure that both instances are the same (singleton behavior)
    expect(helper1).toBe(helper2);
  });
});
