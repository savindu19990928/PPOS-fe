import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ShieldCheckIcon,
  UserIcon
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!oldPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword === oldPassword) {
      setErrorMessage('New password cannot be the same as your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setSuccessMessage(response?.detail || 'Password has been changed successfully.');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="User Profile & Security"
      size="md">
      <div>
        {/* User Profile Card Header */}
        <div className="flex items-center gap-3.5 p-3.5 mb-5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="h-11 w-11 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : <UserIcon className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  user?.role === 'ADMIN'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                {user?.role || 'User'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono truncate">@{user?.username}</p>
            {user?.email && <p className="text-xs text-slate-400 truncate">{user.email}</p>}
          </div>
        </div>

        {/* Informational Banner */}
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>
            Change your password securely. After updating, use your new password for your next login.
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
            <CheckCircle2Icon className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                disabled={isLoading || Boolean(successMessage)}
                className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showOldPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                disabled={isLoading || Boolean(successMessage)}
                className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNewPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                disabled={isLoading || Boolean(successMessage)}
                className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading || Boolean(successMessage)}>
              <KeyIcon className="h-4 w-4 mr-1.5" />
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
