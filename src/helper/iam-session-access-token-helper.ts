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
import { type IAMSession, type IamSessionAccessTokenJWT, IamSessionAccessTokenJWTSchema } from '/@/api/iam-session';
import { jwtDecode } from 'jwt-decode';

/**
 * Helper class for extracting and validating IAM session access tokens.
 */
@injectable()
export class IamSessionAccessTokenHelper {
  extractData(session: IAMSession): IamSessionAccessTokenJWT {
    // Read the jwt from the session using jwt-decode
    return this.validateJwt(jwtDecode<IamSessionAccessTokenJWT>(session.access_token));
  }

  validateJwt(jwt: unknown): IamSessionAccessTokenJWT {
    const result = IamSessionAccessTokenJWTSchema.safeParse(jwt);
    if (!result.success) {
      console.error('Invalid token', result.error);
      throw new Error('Invalid token');
    }
    return result.data;
  }
}
