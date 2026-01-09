'use client';

import { useEffect, useState } from 'react';
import { Pill, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdherenceRecord {
  adherence_id: string;
  medicine_name: string;
  scheduled_date: string;
  is_taken: boolean;
  is_skipped: boolean;
  taken_at: string;
}

export default function MedicationsPage() {
  const [pending, setPending] = useState<AdherenceRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchAdherence();
  }, []);

  async function fetchAdherence() {
    try {
      // Sync user
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      // Get patient profile
      const profileResponse = await fetch(`/api/patient/profile?uid=${user.uid}`);
      const profileData = await profileResponse.json();

      if (!profileData.success) {
        toast.error('Failed to load profile');
        return;
      }

      // Fetch adherence
      const response = await fetch(`/api/patient/adherence?pid=${profileData.patient.pid}`);
      const data = await response.json();

      if (data.success) {
        setPending(data.adherence.pending || []);
        setStats(data.adherence.stats);
      }
    } catch (error) {
      console.error('Error fetching adherence:', error);
      toast.error('Failed to load medications');
    } finally {
      setLoading(false);
    }
  }

  async function markMedicine(adherence_id: string, action: 'taken' | 'skipped') {
    setUpdating(adherence_id);
    try {
      const response = await fetch('/api/patient/adherence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adherence_id,
          is_taken: action === 'taken',
          is_skipped: action === 'skipped'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(action === 'taken' ? '✅ Marked as taken!' : '⏭️ Marked as skipped');
        fetchAdherence(); // Refresh
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating adherence:', error);
      toast.error('Failed to update');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Medications</h1>
        <p className="text-gray-600 mt-1">Track your daily medicine adherence</p>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Pill className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600">Total Doses</p>
          </div>
          <div className="glass-card p-4 rounded-xl bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-green-700">{stats.taken}</span>
            </div>
            <p className="text-sm text-gray-600">Taken</p>
          </div>
          <div className="glass-card p-4 rounded-xl bg-red-50">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-600" />
              <span className="text-2xl font-bold text-red-700">{stats.skipped}</span>
            </div>
            <p className="text-sm text-gray-600">Skipped</p>
          </div>
          <div className="glass-card p-4 rounded-xl bg-primary-50">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold text-primary-700">{stats.adherence_rate}%</span>
            </div>
            <p className="text-sm text-gray-600">Adherence Rate</p>
          </div>
        </div>
      )}

      {/* Today's Medicines */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">Today's Medicines ({pending.length})</h2>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">All Done for Today!</h3>
            <p className="text-gray-500">You've taken all your medicines. Great job! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((med) => (
              <div
                key={med.adherence_id}
                className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{med.medicine_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Scheduled for today</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => markMedicine(med.adherence_id, 'taken')}
                      disabled={updating === med.adherence_id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{updating === med.adherence_id ? 'Updating...' : 'Mark Taken'}</span>
                    </button>
                    <button
                      onClick={() => markMedicine(med.adherence_id, 'skipped')}
                      disabled={updating === med.adherence_id}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Skip</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Message */}
      {stats && stats.pending === 0 && stats.total > 0 && (
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Excellent Adherence!</h3>
              <p className="text-gray-600 mt-1">
                You've maintained {stats.adherence_rate}% adherence. Keep up the great work!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
