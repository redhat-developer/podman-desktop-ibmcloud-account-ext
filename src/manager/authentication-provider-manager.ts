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

import { inject, injectable, postConstruct, preDestroy } from 'inversify';
import { ExtensionContextSymbol } from '/@/inject/symbol';
import {
  authentication,
  type AuthenticationProviderAuthenticationSessionsChangeEvent,
  type AuthenticationSession,
  EventEmitter,
  type ExtensionContext,
  type AuthenticationProvider,
} from '@podman-desktop/api';
import { PasscodeEndpointHelper } from '/@/helper/passcode-endpoint-helper';
import { IamSessionConverterHelper } from '/@/helper/iam-session-converter-helper';
import type { IAMSession } from '/@/api/iam-session';
import { PersistentSessionHelper } from '/@/helper/persistent-session-helper';
import { IamSessionRefreshTokenHelper } from '/@/helper/iam-session-refresh-token-helper';

/**
 * Manager for the authentication provider.
 * This class is responsible for creating and managing authentication sessions.
 */
@injectable()
export class AuthenticationProviderManager {
  public static readonly AUTH_ID = 'ibmcloud-account';

  static readonly CHECK_TOKEN_INTERVAL = 60 * 1_000;

  @inject(ExtensionContextSymbol)
  private readonly extensionContext: ExtensionContext;

  @inject(PasscodeEndpointHelper)
  private readonly passcodeEndpointHelper: PasscodeEndpointHelper;

  @inject(IamSessionConverterHelper)
  private readonly iamSessionConverterHelper: IamSessionConverterHelper;

  @inject(PersistentSessionHelper)
  private readonly persistentSessionHelper: PersistentSessionHelper;

  @inject(IamSessionRefreshTokenHelper)
  private readonly iamSessionRefreshTokenHelper: IamSessionRefreshTokenHelper;

  protected _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();

  protected iamSessions: IAMSession[] = [];

  protected checkTimeout: NodeJS.Timeout | undefined;

  // Restore sessions from the persistent storage and check for tokens
  @postConstruct()
  protected async init(): Promise<void> {
    // Restore sessions from the persistent storage
    this.iamSessions = await this.persistentSessionHelper.restoreSessions();

    // Monitor the token expiration
    try {
      await this.monitorTokens();
    } catch (error: unknown) {
      console.error('Error while the initial monitoring of tokens', error);
    }

    this.checkTimeout = setInterval(() => {
      this.monitorTokens().catch((error: unknown) => {
        console.error('Error monitoring tokens', error);
      });
    }, AuthenticationProviderManager.CHECK_TOKEN_INTERVAL);
  }

  // This is called when the extension is deactivated
  // Remove all timers and save the sessions to the persistent storage
  @preDestroy()
  protected async dispose(): Promise<void> {
    clearInterval(this.checkTimeout);
    this.checkTimeout = undefined;

    // Save sessions to the persistent storage
    await this.persistentSessionHelper.save(this.iamSessions);
  }

  protected async monitorTokens(): Promise<void> {
    // Monitor the token expiration
    const now = Math.round(new Date().getTime() / 1000);
    // Check if the token is expired or within 60 seconds of expiration
    for (const session of this.iamSessions) {
      const delta = session.expiration - now;
      if (delta < 60) {
        let updatedSession: IAMSession;
        try {
          updatedSession = await this.iamSessionRefreshTokenHelper.refreshToken(session);
        } catch (error: unknown) {
          console.error('Error refreshing token', error);
          // Remove this session from the list
          const sessionIndex = this.iamSessions.findIndex(s => s.session_id === session.session_id);
          if (sessionIndex !== -1) {
            this.iamSessions.splice(sessionIndex, 1);
          }
          // Fire the event to notify the change
          const authenticationSession = this.iamSessionConverterHelper.convertToAuthenticationSession(session);
          this._onDidChangeSessions.fire({ removed: [authenticationSession] });
          continue;
        }
        // Update the session in the list
        const sessionIndex = this.iamSessions.findIndex(s => s.session_id === session.session_id);
        if (sessionIndex !== -1) {
          this.iamSessions[sessionIndex] = updatedSession;
        }
        // Fire the event to notify the change
        const authenticationSession = this.iamSessionConverterHelper.convertToAuthenticationSession(updatedSession);
        this._onDidChangeSessions.fire({ changed: [authenticationSession] });
      }
    }

    await this.persistentSessionHelper.save(this.iamSessions);
  }

  // Do not use provided scopes for creating a session
  protected async createSession(_scopes: string[]): Promise<AuthenticationSession> {
    // Open the browser with the passcode URL
    const iamSession = await this.passcodeEndpointHelper.authenticate();

    const authenticationSession = this.iamSessionConverterHelper.convertToAuthenticationSession(iamSession);

    this.iamSessions.push(iamSession);
    this._onDidChangeSessions.fire({ added: [authenticationSession] });

    return authenticationSession;
  }

  public async getSessions(scopes?: string[]): Promise<readonly AuthenticationSession[]> {
    if (!scopes) {
      return this.iamSessions.map(iamSession =>
        this.iamSessionConverterHelper.convertToAuthenticationSession(iamSession),
      );
    }

    const matchingSessions = this.iamSessions.filter(session =>
      scopes.every(scope => session.scope.split(' ').includes(scope)),
    );
    return matchingSessions.map(iamSession =>
      this.iamSessionConverterHelper.convertToAuthenticationSession(iamSession),
    );
  }

  async removeSession(sessionId: string): Promise<void> {
    const sessionIndex = this.iamSessions.findIndex(session => session.session_id === sessionId);
    if (sessionIndex === -1) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    const removedSession = this.iamSessions.splice(sessionIndex, 1)[0];
    this._onDidChangeSessions.fire({
      removed: [this.iamSessionConverterHelper.convertToAuthenticationSession(removedSession)],
    });
  }

  async registerAuthenticationProvider(): Promise<void> {
    const authenticationProvider: AuthenticationProvider = {
      onDidChangeSessions: this._onDidChangeSessions.event,
      createSession: this.createSession.bind(this),
      getSessions: this.getSessions.bind(this),
      removeSession: this.removeSession.bind(this),
    };

    const authDisposable = authentication.registerAuthenticationProvider(
      AuthenticationProviderManager.AUTH_ID,
      'IBM Cloud Account',
      authenticationProvider,
    );

    this.extensionContext.subscriptions.push(authDisposable);
  }

  // Create a session entry without createIfNone for the authentication provider so people can click on a sign in button
  // And trigger the creation of the session
  async createSessionEntry(): Promise<void> {
    await authentication.getSession(AuthenticationProviderManager.AUTH_ID, ['ibm openid'], { createIfNone: false });
  }
}
