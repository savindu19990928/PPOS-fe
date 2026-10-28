import { UpdateStatusData } from '../types';

const GITHUB_OWNER = 'savindu19990928';
const GITHUB_REPO = 'PPOS-fe';
const FALLBACK_VERSION = '0.0.1';

export const isElectronApp = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
};

export const getAppVersion = async (): Promise<string> => {
  if (isElectronApp() && window.electronAPI?.getAppVersion) {
    try {
      return await window.electronAPI.getAppVersion();
    } catch {
      return FALLBACK_VERSION;
    }
  }
  return FALLBACK_VERSION;
};

export const checkForUpdates = async (): Promise<void> => {
  if (isElectronApp() && window.electronAPI?.checkForUpdates) {
    await window.electronAPI.checkForUpdates();
    return;
  }

  // Browser Fallback (e.g. during web testing or browser deployment)
  const metaEnv = (import.meta as any).env || {};
  const token = metaEnv.GITHUB_TOKEN || metaEnv.VITE_GITHUB_TOKEN;
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json'
    };
    if (token) {
      headers.Authorization = `token ${token}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      { headers }
    );

    if (res.ok) {
      const data = await res.json();
      const latestVersion = (data.tag_name || '').replace(/^v/, '');
      const current = FALLBACK_VERSION;

      if (latestVersion && latestVersion !== current) {
        window.dispatchEvent(
          new CustomEvent('app-update-status', {
            detail: {
              status: 'available',
              version: latestVersion,
              releaseDate: data.published_at,
              releaseNotes: data.body,
              isDev: true
            }
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('app-update-status', {
            detail: {
              status: 'not-available',
              version: current,
              isDev: true
            }
          })
        );
      }
    } else {
      window.dispatchEvent(
        new CustomEvent('app-update-status', {
          detail: {
            status: 'not-available',
            version: FALLBACK_VERSION,
            isDev: true
          }
        })
      );
    }
  } catch (err: any) {
    window.dispatchEvent(
      new CustomEvent('app-update-status', {
        detail: {
          status: 'error',
          error: err?.message || 'Could not connect to GitHub updates server.'
        }
      })
    );
  }
};

export const downloadUpdate = async (): Promise<{ success: boolean; error?: string }> => {
  if (isElectronApp() && window.electronAPI?.downloadUpdate) {
    return await window.electronAPI.downloadUpdate();
  }
  // If in browser, open GitHub releases page
  window.open(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`, '_blank');
  return { success: true };
};

export const installUpdate = async (): Promise<{ success: boolean; error?: string }> => {
  if (isElectronApp() && window.electronAPI?.installUpdate) {
    return await window.electronAPI.installUpdate();
  }
  return { success: false, error: 'Installation is only supported in desktop app mode.' };
};

export const subscribeToUpdateStatus = (
  callback: (data: UpdateStatusData) => void
): (() => void) => {
  if (isElectronApp() && window.electronAPI?.onUpdateStatus) {
    return window.electronAPI.onUpdateStatus(callback);
  }

  // Browser CustomEvent listener
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<UpdateStatusData>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener('app-update-status', handler);
  return () => {
    window.removeEventListener('app-update-status', handler);
  };
};
