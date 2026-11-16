import { useState } from 'react';
import type { Snack } from '../types';
import { Modal } from './Modal';
import { snackService } from '../services/snack.service';
import { getApiErrorMessage } from '../utils';
import toast from 'react-hot-toast';

const CATEGORIES = ['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH'] as const;

interface AddSnackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (snack: Snack) => void;
}

export function AddSnackModal({ isOpen, onClose, onAdded }: AddSnackModalProps) {
  const [form, setForm] = useState({
    name: '',
    category: 'SWEET' as typeof CATEGORIES[number],
    quantity: 0,
    lowStockThreshold: 5,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.quantity < 0) errs.quantity = 'Quantity must be non-negative';
    if (form.lowStockThreshold < 0) errs.lowStockThreshold = 'Threshold must be non-negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { snack } = await snackService.createSnack(form);
      onAdded(snack);
      toast.success(`${snack.name} added to pantry! 🎉`);
      setForm({ name: '', category: 'SWEET', quantity: 0, lowStockThreshold: 5 });
      setErrors({});
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Snack">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="add-snack-name">Name</label>
          <input
            id="add-snack-name"
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="e.g. Dark Chocolate"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="add-snack-category">Category</label>
          <select
            id="add-snack-category"
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as typeof CATEGORIES[number] })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="add-snack-quantity">Quantity</label>
            <input
              id="add-snack-quantity"
              type="number"
              min={0}
              className={`input ${errors.quantity ? 'input-error' : ''}`}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
            />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
          </div>
          <div>
            <label className="label" htmlFor="add-snack-threshold">Low Stock Threshold</label>
            <input
              id="add-snack-threshold"
              type="number"
              min={0}
              className={`input ${errors.lowStockThreshold ? 'input-error' : ''}`}
              value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1" id="submit-add-snack">
            {isSubmitting ? 'Adding...' : 'Add Snack'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface EditSnackModalProps {
  snack: Snack | null;
  onClose: () => void;
  onUpdated: (snack: Snack) => void;
}

export function EditSnackModal({ snack, onClose, onUpdated }: EditSnackModalProps) {
  const [form, setForm] = useState({
    name: snack?.name ?? '',
    category: snack?.category ?? 'SWEET',
    quantity: snack?.quantity ?? 0,
    lowStockThreshold: snack?.lowStockThreshold ?? 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!snack) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { snack: updated } = await snackService.updateSnack(snack.id, form);
      onUpdated(updated);
      toast.success('Snack updated successfully');
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={!!snack} onClose={onClose} title={`Edit – ${snack.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="edit-snack-name">Name</label>
          <input
            id="edit-snack-name"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="edit-snack-category">Category</label>
          <select
            id="edit-snack-category"
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as typeof CATEGORIES[number] })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="edit-snack-quantity">Quantity</label>
            <input
              id="edit-snack-quantity"
              type="number"
              min={0}
              className="input"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label" htmlFor="edit-snack-threshold">Low Stock Threshold</label>
            <input
              id="edit-snack-threshold"
              type="number"
              min={0}
              className="input"
              value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1" id="submit-edit-snack">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface RestockModalProps {
  snack: Snack | null;
  onClose: () => void;
  onRestocked: (snack: Snack) => void;
}

export function RestockModal({ snack, onClose, onRestocked }: RestockModalProps) {
  const [amount, setAmount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!snack) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    setIsSubmitting(true);
    try {
      const { snack: updated } = await snackService.restockSnack(snack.id, amount);
      onRestocked(updated);
      toast.success(`Restocked ${amount} units of ${snack.name}!`);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={!!snack} onClose={onClose} title={`Restock – ${snack.name}`}>
      <p className="text-sm text-neutral-500 mb-4">
        Current quantity: <span className="font-semibold text-neutral-900">{snack.quantity} units</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="restock-amount">Amount to Add</label>
          <input
            id="restock-amount"
            type="number"
            min={1}
            className="input"
            value={amount}
            onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={isSubmitting || amount <= 0} className="btn-primary flex-1" id="submit-restock">
            {isSubmitting ? 'Restocking...' : `Add ${amount} Units`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
