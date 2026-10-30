import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  BanIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ShieldAlertIcon,
  UserCheckIcon,
  LockIcon,
  UnlockIcon
} from 'lucide-react';

interface BlockUserConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: (updatedUser: User, message: string) => void;
}

export function BlockUserConfirmModal({
  isOpen,
  onClose,
  user,
  onSuccess
}: BlockUserConfirmModalProps) {
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const isCurrentBlocked = user.is_active === false;
  const isTargetAdmin = user.role === 'ADMIN';
  const isSelf = currentUser?.id === user.id || currentUser?.username === user.username;

  const handleAction = async () => {
    if (isTargetAdmin) {
      setErrorMessage('Admin accounts cannot be blocked.');
      return;
    }
    if (isSelf) {
      setErrorMessage('You cannot block your own account.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (isCurrentBlocked) {
        const res = await api.unblockUser(user.id!);
        onSuccess(
          { ...user, is_active: true },
          res.detail || `User '${user.username}' unblocked successfully.`
        );
      } else {
        const res = await api.blockUser(user.id!);
        onSuccess(
          { ...user, is_active: false },
          res.detail || `User '${user.username}' blocked successfully.`
        );
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCurrentBlocked ? 'Activate Employee Account' : 'Deactivate Employee Account'}
      size="md">
      <div className="space-y-4">
        {isTargetAdmin && !isCurrentBlocked && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <ShieldAlertIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Administrative Account Protection</p>
              <p className="text-amber-800">
                Admin accounts cannot be deactivated. Administrators must retain continuous system access.
              </p>
            </div>
          </div>
        )}

        {isSelf && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Self-Action Restriction</p>
              <p className="text-amber-800">You cannot deactivate or restrict your own logged-in account.</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* User Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
              user.role === 'ADMIN'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 truncate">
                {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
              </p>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  user.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">Account Status Policy:</p>
          <p className="leading-relaxed">
            {isCurrentBlocked
              ? `Activating will immediately restore ${user.username}'s access to log in and perform POS operations.`
              : `Deactivating will immediately revoke login access for ${user.username}. Users cannot be deleted from the system in order to preserve transaction records, cash logs, and audit trails.`}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isCurrentBlocked ? 'primary' : 'destructive'}
            onClick={handleAction}
            isLoading={isSubmitting}
            disabled={isTargetAdmin || isSelf}>
            {isCurrentBlocked ? (
              <>
                <UnlockIcon className="h-4 w-4 mr-1.5" />
                Activate Account
              </>
            ) : (
              <>
                <BanIcon className="h-4 w-4 mr-1.5" />
                Deactivate Account
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
