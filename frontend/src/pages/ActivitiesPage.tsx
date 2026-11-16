import { useEffect, useState, useCallback } from 'react';
import { activityService } from '../services/activity.service';
import type { Activity, Pagination } from '../types';
import { formatDate } from '../utils';
import { ClipboardList, RefreshCw, ChevronLeft, ChevronRight, Package, Zap } from 'lucide-react';
import { getApiErrorMessage } from '../utils';

export function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await activityService.getActivities({
        page,
        limit: 20,
        action: actionFilter || undefined,
      });
      setActivities(result.activities);
      setPagination(result.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Activity Log</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {pagination ? `${pagination.total} records` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="input text-sm w-40"
            id="filter-action"
          >
            <option value="">All Actions</option>
            <option value="CONSUMED">Consumed</option>
            <option value="RESTOCKED">Restocked</option>
          </select>
          <button onClick={fetchActivities} className="btn-secondary btn-sm">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-neutral-100">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse">
                <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-neutral-50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-neutral-600 mb-4">{error}</p>
            <button onClick={fetchActivities} className="btn-secondary">
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList size={40} className="text-neutral-200 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No activity records yet</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {activities.map((activity) => (
              <div key={activity.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.action === 'CONSUMED' ? 'bg-orange-50' : 'bg-green-50'
                  }`}
                >
                  {activity.action === 'CONSUMED' ? (
                    <Zap size={14} className="text-orange-500" />
                  ) : (
                    <Package size={14} className="text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900">
                    <span className="font-medium">
                      {activity.user?.name ?? 'Deleted User'}
                    </span>{' '}
                    <span className={activity.action === 'CONSUMED' ? 'text-orange-600' : 'text-green-600'}>
                      {activity.action === 'CONSUMED' ? 'consumed' : 'restocked'}
                    </span>{' '}
                    <span className="font-medium text-neutral-700">
                      {activity.amount}×
                    </span>{' '}
                    <span className="text-neutral-600">
                      {activity.snack?.name ?? 'Deleted Snack'}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{formatDate(activity.createdAt)}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    activity.action === 'CONSUMED'
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  {activity.action === 'CONSUMED' ? `-${activity.amount}` : `+${activity.amount}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPrev}
              className="btn-secondary btn-sm"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext}
              className="btn-secondary btn-sm"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
