const BANNER_ID = 'annotator-error-banner';

export function showErrorBanner(message: string): void {
  hideErrorBanner();

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #dc2626;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-family: 'Google Sans', 'Segoe UI', sans-serif;
    font-size: 14px;
    z-index: 1000003;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  banner.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button style="background:none;border:none;color:white;font-size:18px;cursor:pointer;padding:0;">&times;</button>
  `;

  banner.querySelector('button')!.addEventListener('click', hideErrorBanner);

  // Auto-dismiss after 8 seconds
  setTimeout(hideErrorBanner, 8000);

  document.body.appendChild(banner);
}

export function hideErrorBanner(): void {
  document.getElementById(BANNER_ID)?.remove();
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
