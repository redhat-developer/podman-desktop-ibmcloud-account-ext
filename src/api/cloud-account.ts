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

const CloudAccountResourceSchema = z.object({
  metadata: z.object({
    guid: z.string(),
  }),
  entity: z.object({
    name: z.string(),
    primary_owner: z.object({
      ibmid: z.string(),
    }),
  }),
});

/**
 * Schema for validating account data.
 */
export const CloudAccountSchema = z.object({
  next_url: z.string().nullable(),
  resources: z.array(CloudAccountResourceSchema),
});

export type CloudAccountType = z.infer<typeof CloudAccountSchema>;

export interface CloudAccount {
  guid: string;
  name: string;
  ibmid: string;
}
