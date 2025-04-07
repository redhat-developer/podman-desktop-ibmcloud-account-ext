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
 * Configuration schema of the OpenId configuration file
 * example of such configuration can be found at
 * https://iam.cloud.ibm.com/identity/.well-known/openid-configuration
 */
export const IamOpenIdConfigurationSchema = z.object({
  passcode_endpoint: z.string(),
  authorization_endpoint: z.string(),
  token_endpoint: z.string(),
  userinfo_endpoint: z.string(),
  jwks_uri: z.string(),
  scopes_supported: z.array(z.string()),
  public_hosts: z.array(z.string()),
  response_types_supported: z.array(z.string()),
  grant_types_supported: z.array(z.string()),
});

// Type based from this schema
export type IAMOpenIdConfiguration = z.infer<typeof IamOpenIdConfigurationSchema>;
