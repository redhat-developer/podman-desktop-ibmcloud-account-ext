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

import { injectable } from 'inversify';
import { type IAMOpenIdConfiguration, IamOpenIdConfigurationSchema } from '../api/iam-openid-configuration';

/**
 * Helper class for getting the OpenId configuration from the IAM service.
 */
@injectable()
export class OpenIdConfigurationHelper {
  static readonly IAM_URL = new URL('https://iam.cloud.ibm.com');

  async getConfig(): Promise<IAMOpenIdConfiguration> {
    // Const
    const openIdConfigUrl = new URL('/identity/.well-known/openid-configuration', OpenIdConfigurationHelper.IAM_URL);

    // Use the fetch API to get the OpenID configuration
    const response = await fetch(openIdConfigUrl);

    const jsonBody = await response.json();
    return this.validateJson(jsonBody);
  }

  protected validateJson(json: unknown): IAMOpenIdConfiguration {
    // Use zod library to validate the json
    const result = IamOpenIdConfigurationSchema.safeParse(json);
    if (!result.success) {
      console.error('Invalid OpenID configuration', result.error);
      throw new Error('Invalid OpenID configuration');
    }
    return result.data;
  }
}
