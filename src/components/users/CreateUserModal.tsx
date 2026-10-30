import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { User, UserRole } from '../../types';
import {
  UserPlusIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldIcon,
  MailIcon,
  UserIcon,
  AlertCircleIcon,
  CheckCircle2Icon
} from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setRole('CASHIER');
    setFirstName('');
    setLastName('');
    setEmail('');
    setIsActive(true);
    setShowPassword(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Username is required.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await api.createUser({
        username: username.trim(),
        password,
        role,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        email: email.trim() || undefined,
        is_active: isActive
      });

      onSuccess(newUser);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user. Please check if the username is already taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Employee Account" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            System Role & Permissions <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-start p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                role === 'CASHIER'
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
              <input
                type="radio"
                name="role"
                value="CASHIER"
                checked={role === 'CASHIER'}
                onChange={() => setRole('CASHIER')}
                className="sr-only"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-blue-900">Cashier (CASHIER)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  POS sales, customer credit collection, product catalog lookups.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                role === 'ADMIN'
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
              <input
                type="radio"
                name="role"
                value="ADMIN"
                checked={role === 'ADMIN'}
                onChange={() => setRole('ADMIN')}
                className="sr-only"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldIcon className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">Administrator (ADMIN)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Full CRUD permissions, stock, sales history, suppliers & users.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Username & Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. cashier_john"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-3 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. John"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Silva"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@pharmacy.com"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Active status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-800">Account Status</p>
            <p className="text-[11px] text-slate-500">
              Active accounts can log in immediately upon creation.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            <UserPlusIcon className="h-4 w-4 mr-1.5" />
            Create Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
