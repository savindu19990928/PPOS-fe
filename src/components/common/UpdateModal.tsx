import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UpdateStatusData } from '../../types';
import {
  getAppVersion,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  subscribeToUpdateStatus,
  isElectronApp
} from '../../lib/updater';
import {
  DownloadCloudIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  SparklesIcon,
  MonitorCheckIcon,
  ArrowRightIcon,
  LayersIcon,
  HardDriveIcon
} from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: UpdateStatusData | null;
}

export function UpdateModal({ isOpen, onClose, initialStatus }: UpdateModalProps) {
  const [currentVersion, setCurrentVersion] = useState('0.0.1');
  const [statusData, setStatusData] = useState<UpdateStatusData>(
    initialStatus || { status: 'checking' }
  );
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    getAppVersion().then((v) => setCurrentVersion(v));
  }, []);

  useEffect(() => {
    if (initialStatus) {
      setStatusData(initialStatus);
    }
  }, [initialStatus]);

  useEffect(() => {
    const unsubscribe = subscribeToUpdateStatus((data) => {
      setStatusData(data);
      setIsActionLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOpen && (!initialStatus || initialStatus.status === 'checking')) {
      handleCheck();
    }
  }, [isOpen]);

  const handleCheck = async () => {
    setStatusData({ status: 'checking' });
    setIsActionLoading(true);
    try {
      await checkForUpdates();
    } catch (err: any) {
      setStatusData({
        status: 'error',
        error: err?.message || 'Failed to check for updates'
      });
      setIsActionLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsActionLoading(true);
    try {
      const res = await downloadUpdate();
      if (!res.success && res.error) {
        setStatusData({
          status: 'error',
          error: res.error
        });
        setIsActionLoading(false);
      }
    } catch (err: any) {
      setStatusData({
        status: 'error',
        error: err?.message || 'Failed to start download'
      });
      setIsActionLoading(false);
    }
  };

  const handleInstall = async () => {
    setIsActionLoading(true);
    try {
      await installUpdate();
    } catch (err: any) {
      setStatusData({
        status: 'error',
        error: err?.message || 'Failed to install update'
      });
      setIsActionLoading(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatSpeed = (bytesPerSec?: number) => {
    if (!bytesPerSec || bytesPerSec <= 0) return '';
    const kb = bytesPerSec / 1024;
    if (kb > 1024) {
      return `${(kb / 1024).toFixed(1)} MB/s`;
    }
    return `${kb.toFixed(0)} KB/s`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mediflex POS System Updates"
      size="lg">
      <div className="space-y-6">
        {/* Version & OS Compatibility Header */}
        <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">Mediflex Pharmacy POS</span>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-[10px]">
                  v{currentVersion}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official release channel via GitHub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/40">
            <MonitorCheckIcon className="h-3.5 w-3.5" />
            <span>Windows 7 / 8 / 10 / 11 Compatible</span>
          </div>
        </div>

        {/* State 1: Checking for updates */}
        {statusData.status === 'checking' && (
          <div className="py-8 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Checking for Latest Updates...
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Connecting to GitHub releases repository to verify available versions.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Update Available */}
        {statusData.status === 'available' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <SparklesIcon className="h-4 w-4 text-emerald-600" />
                  New Version Available
                </span>
                <Badge variant="success" className="text-xs font-bold">
                  v{statusData.version}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-700 pt-1">
                <span className="text-slate-500">Current: v{currentVersion}</span>
                <ArrowRightIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-bold text-emerald-700">Latest: v{statusData.version}</span>
              </div>

              {statusData.releaseDate && (
                <p className="text-[11px] text-slate-500">
                  Published: {new Date(statusData.releaseDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Release Notes */}
            {statusData.releaseNotes && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  What's New in Version {statusData.version}:
                </label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 max-h-40 overflow-y-auto whitespace-pre-line font-mono">
                  {typeof statusData.releaseNotes === 'string'
                    ? statusData.releaseNotes
                    : JSON.stringify(statusData.releaseNotes, null, 2)}
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Seamless POS Update:</p>
              <p className="mt-0.5">
                Clicking Download will fetch the NSIS installer package in the background without interrupting your current POS transactions.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose}>
                Later
              </Button>
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleDownload}
                isLoading={isActionLoading}>
                <DownloadCloudIcon className="h-4 w-4 mr-1.5" />
                Download Update
              </Button>
            </div>
          </div>
        )}

        {/* State 3: Downloading update */}
        {statusData.status === 'downloading' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                <span className="flex items-center gap-2">
                  <DownloadCloudIcon className="h-4 w-4 text-emerald-600 animate-bounce" />
                  Downloading Update (v{statusData.version || 'latest'})...
                </span>
                <span className="text-emerald-600 font-mono text-base font-bold">
                  {statusData.percent ?? 0}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(3, statusData.percent ?? 0)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>
                  {formatBytes(statusData.transferred)} of {formatBytes(statusData.total)}
                </span>
                <span>{formatSpeed(statusData.bytesPerSecond)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Please wait while the update files are downloaded and verified. You may continue using the POS system.
            </p>
          </div>
        )}

        {/* State 4: Downloaded & Ready to Install */}
        {statusData.status === 'downloaded' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3">
              <CheckCircle2Icon className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-emerald-900">
                  Update Ready to Install!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Version <strong>v{statusData.version}</strong> has been downloaded and verified. The application will restart and install the update automatically.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-800 block mb-1">
                Safe Restart Notice:
              </span>
              <p>
                Ensure any active sale or invoice transaction has been completed or saved before restarting. All database and user settings will be preserved.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose}>
                Install on Next App Launch
              </Button>
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleInstall}
                isLoading={isActionLoading}>
                <HardDriveIcon className="h-4 w-4 mr-1.5" />
                Restart & Install Now
              </Button>
            </div>
          </div>
        )}

        {/* State 5: Up to date */}
        {statusData.status === 'not-available' && (
          <div className="py-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2Icon className="h-6 w-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">
                You're Up to Date!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Mediflex POS <strong>v{currentVersion}</strong> is currently the latest release.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={handleCheck} isLoading={isActionLoading}>
                <RefreshCwIcon className="h-3.5 w-3.5 mr-1.5" />
                Check Again
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* State 6: Error */}
        {statusData.status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-900">Update Check Notice</h4>
                <p className="text-xs text-red-700 mt-1">
                  {statusData.error || 'Unable to reach the GitHub update server.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Please check your internet connection or verify your GitHub release configuration in the <code className="bg-slate-100 px-1 py-0.5 rounded">.env</code> file.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" onClick={handleCheck} isLoading={isActionLoading}>
                <RefreshCwIcon className="h-4 w-4 mr-1.5" />
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
