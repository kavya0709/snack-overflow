import { useEffect, useState, useCallback } from 'react';
import { snackService } from '../services/snack.service';
import type { Snack, Pagination } from '../types';
import { SnackCard } from '../components/SnackCard';
import { AddSnackModal, EditSnackModal, RestockModal } from '../components/SnackModals';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Cookie,
  RefreshCw,
} from 'lucide-react';
import { getApiErrorMessage } from '../utils';

const CATEGORIES = ['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH'] as const;
const STATUSES = ['STOCKED', 'RUNNING_LOW', 'GONE'] as const;

export function SnacksPage() {
  const { isAdmin } = useAuth();

  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [restockingSnack, setRestockingSnack] = useState<Snack | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSnacks = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await snackService.getSnacks({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        category: category || undefined,
        status: status || undefined,
        sortBy: sortBy || undefined,
        sortOrder,
      });
      setSnacks(result.snacks);
      setPagination(result.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, category, status, sortBy, sortOrder]);

  useEffect(() => { fetchSnacks(); }, [fetchSnacks]);

  const hasFilters = !!(search || category || status);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setPage(1);
    setSortBy('');
  };

  const handleUpdate = (updated: Snack) => {
    setSnacks((s) => s.map((sn) => (sn.id === updated.id ? updated : sn)));
  };

  const handleDelete = (id: string) => {
    setSnacks((s) => s.filter((sn) => sn.id !== id));
    if (pagination) {
      setPagination({ ...pagination, total: pagination.total - 1 });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Pantry</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {pagination ? `${pagination.total} snack${pagination.total !== 1 ? 's' : ''} available` : 'Loading...'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            id="add-snack-btn"
          >
            <Plus size={15} />
            Add Snack
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search snacks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
              id="search-snacks"
            />
          </div>

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="input sm:w-40"
            id="filter-category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="input sm:w-40"
            id="filter-status"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split(':');
              setSortBy(by);
              setSortOrder(order as 'asc' | 'desc');
              setPage(1);
            }}
            className="input sm:w-40"
            id="sort-snacks"
          >
            <option value=":asc">Sort: Name A-Z</option>
            <option value="name:desc">Sort: Name Z-A</option>
            <option value="quantity:asc">Sort: Qty Low-High</option>
            <option value="quantity:desc">Sort: Qty High-Low</option>
            <option value="votes:desc">Sort: Most Voted</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost btn-sm flex-shrink-0" id="clear-filters">
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-4 h-52 animate-pulse bg-neutral-100" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-neutral-600 mb-4">{error}</p>
          <button onClick={fetchSnacks} className="btn-secondary">
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      ) : snacks.length === 0 ? (
        <div className="card p-12 text-center">
          <Cookie size={40} className="text-neutral-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-600">
            {hasFilters ? 'No snacks match your filters' : 'The pantry is empty!'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {hasFilters ? (
              <button onClick={clearFilters} className="text-green-600 hover:underline">Clear filters</button>
            ) : isAdmin ? (
              <button onClick={() => setShowAddModal(true)} className="text-green-600 hover:underline">Add the first snack</button>
            ) : (
              'Ask an admin to stock the pantry'
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          {snacks.map((snack) => (
            <SnackCard
              key={snack.id}
              snack={snack}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onOpenEdit={setEditingSnack}
              onOpenRestock={setRestockingSnack}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPrev}
              className="btn-secondary btn-sm"
              id="prev-page"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext}
              className="btn-secondary btn-sm"
              id="next-page"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Admin modals */}
      {isAdmin && (
        <>
          <AddSnackModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdded={(snack) => {
              setSnacks((s) => [snack, ...s]);
              setShowAddModal(false);
            }}
          />
          <EditSnackModal
            snack={editingSnack}
            onClose={() => setEditingSnack(null)}
            onUpdated={(updated) => {
              handleUpdate(updated);
              setEditingSnack(null);
            }}
          />
          <RestockModal
            snack={restockingSnack}
            onClose={() => setRestockingSnack(null)}
            onRestocked={(updated) => {
              handleUpdate(updated);
              setRestockingSnack(null);
            }}
          />
        </>
      )}
    </div>
  );
}
