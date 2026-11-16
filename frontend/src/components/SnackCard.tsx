import { useState } from 'react';
import type { Snack } from '../types';
import {
  getStatusBadgeClass,
  getStatusLabel,
  getCategoryLabel,
  getCategoryEmoji,
  getApiErrorMessage,
  getApiErrorCode,
} from '../utils';
import { snackService } from '../services/snack.service';
import { useAuth } from '../context/AuthContext';
import { Heart, Minus, Plus, Package, Edit2, Trash2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';

interface SnackCardProps {
  snack: Snack;
  onUpdate: (updated: Snack) => void;
  onDelete: (id: string) => void;
  onOpenEdit: (snack: Snack) => void;
  onOpenRestock: (snack: Snack) => void;
}

export function SnackCard({ snack, onUpdate, onDelete, onOpenEdit, onOpenRestock }: SnackCardProps) {
  const { isAdmin } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [consumeAmount, setConsumeAmount] = useState(1);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleVote = async () => {
    setIsVoting(true);
    try {
      if (snack.hasVoted) {
        const result = await snackService.removeVote(snack.id);
        onUpdate({ ...snack, hasVoted: false, voteCount: result.voteCount });
        toast.success('Vote removed');
      } else {
        const result = await snackService.vote(snack.id);
        onUpdate({ ...snack, hasVoted: true, voteCount: result.voteCount });
        toast.success('Vote recorded! 🗳️');
      }
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'ALREADY_VOTED') {
        toast.error('You already voted for this snack');
      } else {
        toast.error(getApiErrorMessage(err));
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleConsume = async () => {
    if (consumeAmount <= 0) return;
    setIsConsuming(true);
    try {
      const result = await snackService.consumeSnack(snack.id, consumeAmount);
      onUpdate(result.snack);
      toast.success(`Enjoyed ${consumeAmount} × ${snack.name}! 😋`);
      setShowConsumeModal(false);
      setConsumeAmount(1);
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'INSUFFICIENT_STOCK') {
        toast.error("Someone beat you to the last packet! Please refresh the pantry.");
      } else {
        toast.error(getApiErrorMessage(err));
      }
    } finally {
      setIsConsuming(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await snackService.deleteSnack(snack.id);
      onDelete(snack.id);
      toast.success(`${snack.name} removed from pantry`);
      setShowDeleteConfirm(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const isGone = snack.status === 'GONE';

  return (
    <>
      <div className="card-hover p-4 flex flex-col gap-3 animate-fade-in h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{getCategoryEmoji(snack.category)}</span>
              <span className="badge-category text-xs">{getCategoryLabel(snack.category)}</span>
            </div>
            <h3 className="font-semibold text-neutral-900 text-sm leading-tight truncate">
              {snack.name}
            </h3>
          </div>
          <span className={getStatusBadgeClass(snack.status)}>
            {getStatusLabel(snack.status)}
          </span>
        </div>

        {/* Quantity bar — flex-1 pushes footer to bottom */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-500">Quantity</span>
            <div className="flex items-center gap-1">
              <Package size={12} className="text-neutral-400" />
              <span className="text-sm font-semibold text-neutral-900">{snack.quantity}</span>
              <span className="text-xs text-neutral-400">/ {snack.lowStockThreshold} threshold</span>
            </div>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                snack.status === 'STOCKED'
                  ? 'bg-green-500'
                  : snack.status === 'RUNNING_LOW'
                  ? 'bg-orange-400'
                  : 'bg-red-400'
              }`}
              style={{
                width: `${Math.min(100, (snack.quantity / (snack.lowStockThreshold * 2 + 1)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Footer — two rows */}
        <div className="flex flex-col gap-2 pt-1 border-t border-neutral-100">
          {/* Row 1: Vote (left) + Admin actions (right) */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleVote}
              disabled={isVoting}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                snack.hasVoted
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-neutral-500 hover:text-red-500 hover:bg-red-50'
              }`}
              id={`vote-btn-${snack.id}`}
              title={snack.hasVoted ? 'Remove vote' : 'Vote for this snack'}
            >
              <Heart
                size={14}
                className={snack.hasVoted ? 'fill-red-500 text-red-500' : ''}
              />
              {snack.voteCount}
            </button>

            {isAdmin && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onOpenRestock(snack)}
                  className="btn-secondary btn-sm"
                  id={`restock-btn-${snack.id}`}
                  title="Restock"
                >
                  <RefreshCcw size={12} />
                  Restock
                </button>
                <button
                  onClick={() => onOpenEdit(snack)}
                  className="btn-ghost btn-sm"
                  title="Edit"
                  id={`edit-btn-${snack.id}`}
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-ghost btn-sm text-red-500 hover:bg-red-50"
                  title="Delete"
                  id={`delete-btn-${snack.id}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Consume — full width */}
          <button
            onClick={() => setShowConsumeModal(true)}
            disabled={isGone}
            className="btn-primary btn-sm w-full"
            id={`consume-btn-${snack.id}`}
            title={isGone ? 'Out of stock' : 'Consume'}
          >
            Consume
          </button>
        </div>
      </div>

      {/* Consume Modal */}
      <Modal
        isOpen={showConsumeModal}
        onClose={() => { setShowConsumeModal(false); setConsumeAmount(1); }}
        title={`Consume – ${snack.name}`}
      >
        <p className="text-sm text-neutral-500 mb-4">
          Available: <span className="font-semibold text-neutral-900">{snack.quantity} units</span>
        </p>
        <div className="mb-5">
          <label className="label">Amount</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConsumeAmount((a) => Math.max(1, a - 1))}
              className="btn-secondary w-9 h-9 p-0"
              disabled={consumeAmount <= 1}
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min={1}
              max={snack.quantity}
              value={consumeAmount}
              onChange={(e) => setConsumeAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="input text-center w-20"
              id="consume-amount-input"
            />
            <button
              onClick={() => setConsumeAmount((a) => Math.min(snack.quantity, a + 1))}
              className="btn-secondary w-9 h-9 p-0"
              disabled={consumeAmount >= snack.quantity}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowConsumeModal(false); setConsumeAmount(1); }}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleConsume}
            disabled={isConsuming || consumeAmount > snack.quantity}
            className="btn-primary flex-1"
            id="confirm-consume-btn"
          >
            {isConsuming ? 'Consuming...' : `Consume ${consumeAmount}`}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Snack"
      >
        <p className="text-sm text-neutral-600 mb-5">
          Are you sure you want to remove{' '}
          <span className="font-semibold text-neutral-900">"{snack.name}"</span> from the pantry?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-danger flex-1"
            id="confirm-delete-btn"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </>
  );
}
