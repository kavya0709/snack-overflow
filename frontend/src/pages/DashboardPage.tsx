import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { snackService } from '../services/snack.service';
import type { SnackSummary } from '../types';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trophy,
  RefreshCw,
  TrendingUp,
  Heart,
} from 'lucide-react';
import {
  getCategoryEmoji,
  getCategoryLabel,
  getStatusBadgeClass,
  getStatusLabel,
} from '../utils';

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}

function SummaryCard({ label, value, icon, colorClass }: SummaryCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<SnackSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { summary } = await snackService.getSummary();
      setSummary(summary);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-28 bg-neutral-100" />
          ))}
        </div>
        <div className="card p-5 h-40 bg-neutral-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <XCircle size={36} className="text-red-400 mx-auto mb-3" />
        <p className="text-sm text-neutral-600 mb-4">{error}</p>
        <button onClick={fetchSummary} className="btn-secondary">
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Your office pantry at a glance</p>
        </div>
        <button onClick={fetchSummary} className="btn-secondary btn-sm">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Snacks"
          value={summary.total}
          icon={<Package size={16} className="text-neutral-600" />}
          colorClass="bg-neutral-100"
        />
        <SummaryCard
          label="Stocked"
          value={summary.stocked}
          icon={<CheckCircle2 size={16} className="text-green-600" />}
          colorClass="bg-green-50"
        />
        <SummaryCard
          label="Running Low"
          value={summary.runningLow}
          icon={<AlertTriangle size={16} className="text-orange-500" />}
          colorClass="bg-orange-50"
        />
        <SummaryCard
          label="Gone"
          value={summary.gone}
          icon={<XCircle size={16} className="text-red-500" />}
          colorClass="bg-red-50"
        />
      </div>

      {/* Snack of the week + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Snack of the week */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-yellow-500" />
            <h2 className="font-semibold text-neutral-900 text-sm">Snack of the Week</h2>
            <span className="ml-auto text-xs text-neutral-400">Most votes this week</span>
          </div>

          {summary.snackOfTheWeek ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100 flex items-center justify-center text-3xl flex-shrink-0">
                {getCategoryEmoji(summary.snackOfTheWeek.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 text-base truncate">
                  {summary.snackOfTheWeek.name}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {getCategoryLabel(summary.snackOfTheWeek.category)}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                    <Heart size={12} className="fill-red-500" />
                    {summary.snackOfTheWeek.weeklyVotes} votes this week
                  </span>
                  <span className={getStatusBadgeClass(summary.snackOfTheWeek.status)}>
                    {getStatusLabel(summary.snackOfTheWeek.status)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Trophy size={32} className="text-neutral-200 mb-2" />
              <p className="text-sm text-neutral-500">No votes yet this week</p>
              <p className="text-xs text-neutral-400 mt-1">
                Head to the <Link to="/snacks" className="text-green-600 hover:underline">Pantry</Link> and vote for your favourites!
              </p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green-600" />
            <h2 className="font-semibold text-neutral-900 text-sm">Pantry Health</h2>
          </div>
          <div className="space-y-3">
            {summary.total > 0 ? (
              <>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">Stocked</span>
                    <span className="font-medium text-green-600">
                      {Math.round((summary.stocked / summary.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{ width: `${(summary.stocked / summary.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">Running Low</span>
                    <span className="font-medium text-orange-500">
                      {Math.round((summary.runningLow / summary.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className="bg-orange-400 h-full rounded-full transition-all"
                      style={{ width: `${(summary.runningLow / summary.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">Gone</span>
                    <span className="font-medium text-red-500">
                      {Math.round((summary.gone / summary.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className="bg-red-400 h-full rounded-full transition-all"
                      style={{ width: `${(summary.gone / summary.total) * 100}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-4">No snacks in pantry</p>
            )}
          </div>
          <Link to="/snacks" className="btn-secondary btn-sm w-full mt-4">
            View Pantry →
          </Link>
        </div>
      </div>
    </div>
  );
}
