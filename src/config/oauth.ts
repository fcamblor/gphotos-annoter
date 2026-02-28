function validateOAuthConfig() {
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      'Missing VITE_OAUTH_CLIENT_ID environment variable. ' +
      'Create a .env file in the project root with: ' +
      'VITE_OAUTH_CLIENT_ID=your-client-id-from-google-cloud-console'
    );
  }

  if (!clientId.endsWith('.apps.googleusercontent.com')) {
    throw new Error(
      'Invalid VITE_OAUTH_CLIENT_ID format. ' +
      'It should end with ".apps.googleusercontent.com"'
    );
  }

  return clientId;
}

export const OAUTH_CONFIG = {
  clientId: validateOAuthConfig(),
  redirectUri: `https://${chrome.runtime.id}.chromiumapp.org/`,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};
