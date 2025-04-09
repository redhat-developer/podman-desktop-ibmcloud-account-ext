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

import { ContainerModule } from 'inversify';
import { OpenIdConfigurationHelper } from './openid-configuration-helper';
import { IamSessionAccessTokenHelper } from './iam-session-access-token-helper';
import { IamSessionConverterHelper } from './iam-session-converter-helper';
import { IamSessionRefreshTokenHelper } from './iam-session-refresh-token-helper';
import { PasscodeEndpointHelper } from './passcode-endpoint-helper';
import { PersistentSessionHelper } from './persistent-session-helper';
import { TokenEndpointHelper } from './token-endpoint-helper';
import { AccountSelectHelper } from './account-select-helper';

const helpersModule = new ContainerModule(options => {
  options.bind<AccountSelectHelper>(AccountSelectHelper).toSelf().inSingletonScope();
  options.bind<IamSessionAccessTokenHelper>(IamSessionAccessTokenHelper).toSelf().inSingletonScope();
  options.bind<IamSessionConverterHelper>(IamSessionConverterHelper).toSelf().inSingletonScope();
  options.bind<IamSessionRefreshTokenHelper>(IamSessionRefreshTokenHelper).toSelf().inSingletonScope();
  options.bind<OpenIdConfigurationHelper>(OpenIdConfigurationHelper).toSelf().inSingletonScope();
  options.bind<PasscodeEndpointHelper>(PasscodeEndpointHelper).toSelf().inSingletonScope();
  options.bind<PersistentSessionHelper>(PersistentSessionHelper).toSelf().inSingletonScope();
  options.bind<TokenEndpointHelper>(TokenEndpointHelper).toSelf().inSingletonScope();
});

export { helpersModule };
