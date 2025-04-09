import { injectable } from 'inversify';
import { type CloudAccount, CloudAccountSchema, type CloudAccountType } from '../api/cloud-account';
import type { IAMSession } from '../api/iam-session';

/**
 * Helper class to list all accounts
 */
@injectable()
export class AccountSelectHelper {
  static readonly ACCOUNT_URL = 'https://accounts.cloud.ibm.com/v1/accounts';

  async getAccounts(session: IAMSession): Promise<CloudAccount[]> {
    // Get the accounts from the given session

    const accountInfoUrl = new URL(AccountSelectHelper.ACCOUNT_URL);

    // Use the fetch API to get the accounts
    const response = await fetch(accountInfoUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const jsonBody = await response.json();
    console.log('AccountSelectHelper json is', JSON.stringify(jsonBody));
    const cloudData = this.validateJson(jsonBody);

    // Map the accounts to the CloudAccount type
    const accounts: CloudAccount[] = cloudData.resources.map(account => {
      return {
        guid: account.metadata.guid,
        name: account.entity.name,
        ibmid: account.entity.primary_owner.ibmid,
      };
    });

    return accounts;
  }

  protected validateJson(json: unknown): CloudAccountType {
    const result = CloudAccountSchema.safeParse(json);
    if (!result.success) {
      console.error('Invalid account', result.error);
      throw new Error('Invalid account');
    }
    return result.data;
  }
}
