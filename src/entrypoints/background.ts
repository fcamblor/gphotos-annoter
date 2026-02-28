import { OAUTH_CONFIG } from '~/config/oauth';

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('GPhotos Estate Annotator installed');
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'LAUNCH_WEB_AUTH_FLOW') {
      const url = new URL(OAUTH_CONFIG.authEndpoint);
      url.searchParams.set('client_id', OAUTH_CONFIG.clientId);
      url.searchParams.set('redirect_uri', OAUTH_CONFIG.redirectUri);
      url.searchParams.set('response_type', 'token');
      url.searchParams.set('scope', OAUTH_CONFIG.scopes.join(' '));

      chrome.identity.launchWebAuthFlow({
        url: url.toString(),
        interactive: message.interactive,
      }, (responseUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }

        if (!responseUrl) {
          sendResponse({ error: 'No response URL received' });
          return;
        }

        try {
          const token = new URL(responseUrl).hash.match(/access_token=([^&]+)/)?.[1];
          if (token) {
            sendResponse({ token });
          } else {
            sendResponse({ error: 'No access token in response' });
          }
        } catch (err) {
          sendResponse({ error: `Failed to parse response: ${err}` });
        }
      });
      return true; // Async response
    }
  });
});
