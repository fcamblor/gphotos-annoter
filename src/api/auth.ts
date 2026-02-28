export async function getAuthToken(interactive = true): Promise<string> {
  const result = await chrome.runtime.sendMessage({
    type: 'LAUNCH_WEB_AUTH_FLOW',
    interactive,
  });
  if (!result.token) {
    throw new Error(result.error || 'No token received');
  }
  return result.token;
}
