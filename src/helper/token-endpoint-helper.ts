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

import { inject } from 'inversify';
import { type IAMSession, IamSessionSchema } from '../api/iam-session';
import { OpenIdConfigurationHelper } from './openid-configuration-helper';

/**
 * Helper class for getting a new IAM session using the given configuration.
 * like the passcode or the refresh token.
 */
export class TokenEndpointHelper {
  @inject(OpenIdConfigurationHelper)
  private readonly openIdConfigurationHelper: OpenIdConfigurationHelper;

  async getToken(body: string): Promise<IAMSession> {
    // Grab the link to the passcode endpoint
    const openIdConfiguration = await this.openIdConfigurationHelper.getConfig();

    // Now we need to call the token endpoint with the passcode
    const tokenEndpoint = openIdConfiguration.token_endpoint;

    // Post the passcode to the token endpoint
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        // Default dummy credentials for the passcode endpoint (bx/bx)
        Authorization: `Basic ${Buffer.from('bx:bx').toString('base64')}`,
      },
      body,
    });

    // Now validate the response
    if (!response.ok) {
      // Handle the error
      const errorBody = await response.json();
      throw new Error(`Error in token authentication: ${errorBody.error}`);
    }

    // Now we have the token, get the JSON value
    const tokenBody = await response.json();
    return this.validateJson(tokenBody);
  }

  protected validateJson(json: unknown): IAMSession {
    const result = IamSessionSchema.safeParse(json);
    if (!result.success) {
      console.error('Invalid token', result.error);
      throw new Error('Invalid token');
    }
    return result.data;
  }
}
