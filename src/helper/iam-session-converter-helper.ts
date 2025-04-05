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

import type { AuthenticationSession, AuthenticationSessionAccountInformation } from '@podman-desktop/api';
import type { IAMSession } from '/@/api/iam-session';
import { IamSessionAccessTokenHelper } from './iam-session-access-token-helper';
import { inject, injectable } from 'inversify';

/**
 * Helper class for converting IAM sessions to Podman Desktop authentication sessions.
 */
@injectable()
export class IamSessionConverterHelper {
  @inject(IamSessionAccessTokenHelper)
  private readonly iamSessionAccessTokenHelper: IamSessionAccessTokenHelper;

  convertToAuthenticationSession(session: IAMSession): AuthenticationSession {
    // Extract the jwt from the session
    const jwt = this.iamSessionAccessTokenHelper.extractData(session);

    // Add account part using the name as the label
    const account: AuthenticationSessionAccountInformation = {
      id: jwt.id,
      label: jwt.name,
    };

    const scopes = session.scope.split(' ');

    // Convert the session to a public session
    return {
      id: session.session_id,
      accessToken: session.access_token,
      account,
      scopes,
    };
  }
}
