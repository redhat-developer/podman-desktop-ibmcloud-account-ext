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
import type { IAMSession } from '../api/iam-session';
import { TokenEndpointHelper } from './token-endpoint-helper';
import type { CloudAccount } from '../api/cloud-account';

/**
 * Helper class for getting a new IAM sessions using the refresh token.
 */
export class IamSessionRefreshTokenHelper {
  @inject(TokenEndpointHelper)
  private readonly tokenEndpointHelper: TokenEndpointHelper;

  async refreshToken(session: IAMSession, cloudAccount?: CloudAccount): Promise<IAMSession> {
    const refreshToken = session.refresh_token;
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }
    const body = this.createBody(refreshToken, cloudAccount);

    // Call the token endpoint with the refresh token
    return this.tokenEndpointHelper.getToken(body);
  }

  protected createBody(refreshToken: string, cloudAccount?: CloudAccount): string {
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', refreshToken);
    // Add the account guid if any
    if (cloudAccount) {
      body.append('account', cloudAccount.guid);
    }
    return body.toString();
  }
}
