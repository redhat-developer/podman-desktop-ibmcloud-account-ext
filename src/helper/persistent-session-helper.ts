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

import { inject, injectable } from 'inversify';
import { ExtensionContextSymbol } from '../inject/symbol';
import type { ExtensionContext } from '@podman-desktop/api';
import { type IAMSession, type IAMSessions, IamSessionsSchema } from '../api/iam-session';

/*
Handle the storage/retrieval of the authentication sessions
*/
@injectable()
export class PersistentSessionHelper {
  static readonly KEY_AUTH_SESSIONS = 'ibmcloud-auth-sessions';

  @inject(ExtensionContextSymbol)
  private readonly extensionContext: ExtensionContext;

  async restoreSessions(): Promise<IAMSession[]> {
    const storedData = await this.extensionContext.secrets.get(PersistentSessionHelper.KEY_AUTH_SESSIONS);
    if (storedData) {
      try {
        return this.validateJson(JSON.parse(storedData));
      } catch (error: unknown) {
        console.error('Error parsing stored sessions', error);
        return [];
      }
    }
    return [];
  }

  async save(sessions: IAMSessions): Promise<void> {
    const jsonBody = JSON.stringify(sessions);
    await this.extensionContext.secrets.store(PersistentSessionHelper.KEY_AUTH_SESSIONS, jsonBody);
  }

  protected validateJson(json: unknown): IAMSession[] {
    // Use zod library to validate the json
    const result = IamSessionsSchema.safeParse(json);
    if (!result.success) {
      console.error('Invalid sessions', result.error);
      throw new Error('Invalid sessions');
    }
    return result.data;
  }
}
