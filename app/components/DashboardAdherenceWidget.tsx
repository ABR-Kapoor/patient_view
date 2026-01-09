'use client';

import { useEffect, useState } from 'react';
import { Pill, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import AdherenceCheckbox from './AdherenceCheckbox';

interface AdherenceStats {
  total: number;
  taken: number;
  pending: number;
  overdue: number;
  adherence_rate: number;
}

interface AdherenceRecord {
  adherence_id: string;
  medicine_name: string;
  scheduled_date: string;
  scheduled_time: string;
  is_taken: boolean;
  is_skipped: boolean;
  prescription_id: string;
}

export default function DashboardAdherenceWidget() {
  const [loading, setLoading] = useState(true);
  const [dueNow, setDueNow] = useState<AdherenceRecord[]>([]);
  const [overdue, setOverdue] = useState<AdherenceRecord[]>([]);
  const [stats, setStats] = useState<AdherenceStats | null>(null);

  useEffect(() => {
    fetchAdherence();

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchAdherence, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAdherence() {
    try {
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      const profileResponse = await fetch(`/api/patient/profile?uid=${user.uid}`);
      const profileData = await profileResponse.json();

      if (!profileData.success) return;

      const response = await fetch(`/api/patient/adherence?pid=${profileData.patient.pid}`);
      const data = await response.json();

      if (data.success) {
        setDueNow(data.adherence.dueNow || []);
        setOverdue(data.adherence.overdue || []);
        setStats(data.adherence.stats);
      }
    } catch (error) {
      console.error('Error fetching adherence:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const allMedicines = [...overdue, ...dueNow];

  if (allMedicines.length === 0 && (!stats || stats.total === 0)) {
    return null; // Don't show widget if no medicines
  }

  const completionRate = stats?.adherence_rate || 0;

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-xl levitating-card">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Today's Medicines</h3>
              <p className="text-white/90 text-sm">
                {allMedicines.length} {allMedicines.length === 1 ? 'medicine' : 'medicines'} to take
              </p>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="white"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionRate / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{Math.round(completionRate)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Medicine List */}
      <div className="p-6">
        {allMedicines.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3 animate-bounce" />
            <p className="text-lg font-semibold text-green-900">All Done!</p>
            <p className="text-sm text-gray-600 mt-1">You've taken all your medicines for now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdue.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <h4 className="text-sm font-bold text-red-900">Overdue</h4>
                </div>
                {overdue.map((record) => (
                  <div key={record.adherence_id} className="mb-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AdherenceCheckbox
                      adherenceId={record.adherence_id}
                      medicineName={record.medicine_name}
                      scheduledTime={record.scheduled_time}
                      scheduledDate={record.scheduled_date}
                      isTaken={record.is_taken}
                      onUpdate={fetchAdherence}
                    />
                  </div>
                ))}
              </div>
            )}

            {dueNow.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-primary-600" />
                  <h4 className="text-sm font-bold text-gray-900">Due Now</h4>
                </div>
                {dueNow.map((record) => (
                  <div key={record.adherence_id} className="mb-2 p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <AdherenceCheckbox
                      adherenceId={record.adherence_id}
                      medicineName={record.medicine_name}
                      scheduledTime={record.scheduled_time}
                      scheduledDate={record.scheduled_date}
                      isTaken={record.is_taken}
                      onUpdate={fetchAdherence}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Stats */}
        {stats && stats.total > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.taken}</p>
              <p className="text-xs text-gray-600">Taken</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-xs text-gray-600">Overdue</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
