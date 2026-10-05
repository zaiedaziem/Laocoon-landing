// Asset base URL, and a visible banner for any asset that fails to load.
export const ASSET_BASE_URL = "assets";

export function reportAssetError(url) {
    const line = document.createElement('div');
    line.textContent = `Asset failed to load: ${url}`;
    document.getElementById('asset-errors')?.appendChild(line);
    console.error(`[asset] failed: ${url}`);
}

// The editorial image is plain markup — report it too if it never arrives.
const editorial = document.querySelector('#slide-2-img img');
if (editorial) {
    editorial.addEventListener('error', () => reportAssetError(editorial.src), { once: true });
}
