import { inject, injectable } from 'inversify';
import { OpenIdConfigurationHelper } from './openid-configuration-helper';
import { Uri, env, window } from '@podman-desktop/api';
import type { IAMSession } from '../api/iam-session';
import { TokenEndpointHelper } from './token-endpoint-helper';

/**
 * Helper class for the passcode endpoint.
 * This is used to authenticate the user using a passcode.
 * The passcode is obtained by opening the browser and asking the user to enter it.
 * The passcode is then sent to the token endpoint to obtain an IAM session.
 */
@injectable()
export class PasscodeEndpointHelper {
  @inject(OpenIdConfigurationHelper)
  private readonly openIdConfigurationHelper: OpenIdConfigurationHelper;

  @inject(TokenEndpointHelper)
  private readonly tokenEndpointHelper: TokenEndpointHelper;

  async authenticate(): Promise<IAMSession> {
    // Grab the link to the passcode endpoint
    const openIdConfiguration = await this.openIdConfigurationHelper.getConfig();
    const passcodeUri = Uri.parse(openIdConfiguration.passcode_endpoint);

    // Open the browser with the passcode uri
    await env.openExternal(passcodeUri);

    // And wait now for the user to enter the passcode
    const passcode = await window.showInputBox({
      prompt: 'Enter the passcode',
      placeHolder: 'Enter the passcode',
      ignoreFocusOut: true,
      validateInput: this.validateInput.bind(this),
    });

    if (!passcode) {
      // User cancelled the input
      throw new Error('Did not receive a passcode');
    }

    const body = this.createBody(passcode);
    return this.tokenEndpointHelper.getToken(body);
  }

  protected createBody(passcode: string): string {
    const body = new URLSearchParams();
    body.append('grant_type', 'urn:ibm:params:oauth:grant-type:passcode');
    body.append('passcode', passcode);
    return body.toString();
  }

  protected validateInput(value: string): string | undefined {
    if (value.length < 6) {
      return 'Passcode must be at least 6 characters';
    }
    return undefined;
  }
}
