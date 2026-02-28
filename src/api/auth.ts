export async function getAuthToken(interactive = true): Promise<string> {
  const result = await chrome.identity.getAuthToken({ interactive });
  if (!result.token) {
    throw new Error('No token received');
  }
  return result.token;
}

export async function removeCachedToken(token: string): Promise<void> {
  await chrome.identity.removeCachedAuthToken({ token });
}
