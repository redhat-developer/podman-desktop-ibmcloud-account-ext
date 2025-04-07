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

import { z } from 'zod';

/**
 * Schema for validating IAM session data.
 * This schema defines the structure of an IAM session object, including
 * properties like access_token, refresh_token, token_type, expires_in,
 * expiration, refresh_token_expiration, scope, and session_id.
 */
export const IamSessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  expiration: z.number(),
  refresh_token_expiration: z.number(),
  scope: z.string(),
  session_id: z.string(),
});

export type IAMSession = z.infer<typeof IamSessionSchema>;

// Array of sessions
export const IamSessionsSchema = z.array(IamSessionSchema);
export type IAMSessions = z.infer<typeof IamSessionsSchema>;

// Token content
export const IamSessionAccessTokenJWTSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});
export type IamSessionAccessTokenJWT = z.infer<typeof IamSessionAccessTokenJWTSchema>;
