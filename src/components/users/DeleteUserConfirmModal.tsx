import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Trash2Icon,
  AlertTriangleIcon,
  AlertCircleIcon,
  ShieldAlertIcon,
  InfoIcon
} from 'lucide-react';

interface DeleteUserConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: (userId: number, message: string) => void;
}

export function DeleteUserConfirmModal({
  isOpen,
  onClose,
  user,
  onSuccess
}: DeleteUserConfirmModalProps) {
  const { user: currentUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const isTargetAdmin = user.role === 'ADMIN';
  const isSelf = currentUser?.id === user.id || currentUser?.username === user.username;

  const handleDelete = async () => {
    if (isTargetAdmin) {
      setErrorMessage('Admin accounts cannot be deleted.');
      return;
    }
    if (isSelf) {
      setErrorMessage('You cannot delete your own account.');
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await api.deleteUser(user.id!);
      onSuccess(user.id!, `User '${user.username}' was permanently deleted.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Cannot delete user with transaction records. Please block the user instead.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Employee Account" size="md">
      <div className="space-y-4">
        {/* Admin Warning */}
        {isTargetAdmin && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
            <ShieldAlertIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Admin Account Protected</p>
              <p className="text-red-800">
                Admin accounts cannot be deleted under system security policies.
              </p>
            </div>
          </div>
        )}

        {/* Self Delete Warning */}
        {isSelf && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Self-Action Restriction</p>
              <p className="text-amber-800">You cannot delete your own active account.</p>
            </div>
          </div>
        )}

        {/* Transaction History Integrity Notice */}
        {!isTargetAdmin && !isSelf && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Transaction History Integrity</p>
              <p className="text-amber-800 leading-relaxed">
                Users who have performed sales, cash drawer operations, or stock movements cannot be hard deleted.
                If this user has records, the system will prompt you to block them instead.
              </p>
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
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 mb-0.5">Account to Delete</p>
          <p className="text-sm font-bold text-slate-900">
            {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
            <span>@{user.username}</span>
            <span>•</span>
            <span>Role: {user.role}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={isTargetAdmin || isSelf}>
            <Trash2Icon className="h-4 w-4 mr-1.5" />
            Permanently Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
