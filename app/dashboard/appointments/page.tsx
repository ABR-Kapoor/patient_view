'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Video, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Appointment {
  aid: string;
  scheduled_date: string;
  scheduled_time: string;
  mode: string;
  status: string;
  complaint_description: string;
  duration_minutes?: number;
  start_time?: string;
  end_time?: string;
  doctor: {
    specialization: string;
    user: {
      name: string;
      profile_image_url?: string;
    };
  };
}

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Check URL parameter for tab, default to upcoming
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>(
    tabParam === 'completed' ? 'completed' : tabParam === 'cancelled' ? 'cancelled' : 'upcoming'
  );

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Refetch when switching to completed tab
  useEffect(() => {
    if (activeTab === 'completed') {
      fetchAppointments();
    }
  }, [activeTab]);

  async function fetchAppointments() {
    try {
      // Sync user
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch appointments
      const response = await fetch(`/api/patient/appointments?uid=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }

  function formatTime(isoString: string | undefined): string {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'scheduled' || apt.status === 'confirmed'
  );

  const completedAppointments = appointments.filter(
    (apt) => apt.status === 'completed'
  );

  const cancelledAppointments = appointments.filter(
    (apt) => apt.status === 'cancelled'
  );

  const displayedAppointments = 
    activeTab === 'upcoming' ? upcomingAppointments : 
    activeTab === 'completed' ? completedAppointments :
    cancelledAppointments;

  const tabs = [
    { id: 'upcoming' as const, label: 'Upcoming', count: upcomingAppointments.length },
    { id: 'completed' as const, label: 'Completed', count: completedAppointments.length },
    { id: 'cancelled' as const, label: 'Cancelled', count: cancelledAppointments.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
        <p className="text-gray-600">Manage your upcoming and past consultations</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'upcoming'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'completed'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'cancelled'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Appointments List */}
      {displayedAppointments.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No {activeTab} appointments
          </h3>
          <p className="text-gray-600">
            {activeTab === 'upcoming' 
              ? 'You don\'t have any upcoming appointments scheduled.'
              : 'You haven\'t completed any appointments yet.'}
          </p>
          {activeTab === 'upcoming' && (
            <a
              href="/dashboard/find-doctors"
              className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:shadow-lg smooth-transition"
            >
              Book an Appointment
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedAppointments.map((apt: Appointment) => (
              <div key={apt.aid} className="glass-card-hover p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Doctor Profile Image */}
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {apt.doctor?.user?.profile_image_url ? (
                        <img
                          src={apt.doctor.user.profile_image_url}
                          alt={apt.doctor.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : apt.mode === 'online' ? (
                        <Video className="w-6 h-6 text-primary-600" />
                      ) : (
                        <MapPin className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {apt.doctor?.user?.name || 'Doctor'}
                      </h3>
                      <p className="text-sm text-gray-600">{apt.doctor?.specialization}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(apt.scheduled_date).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{apt.scheduled_time}</span>
                        </span>
                        <span className="capitalize px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                          {apt.mode}
                        </span>
                      </div>
                      {apt.complaint_description && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Reason:</span> {apt.complaint_description}
                        </p>
                      )}
                      
                      {/* Detailed timing for completed appointments */}
                      {activeTab === 'completed' && apt.duration_minutes && (
                        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">Start Time</p>
                              <p className="text-sm text-gray-900 font-bold">{formatTime(apt.start_time)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">End Time</p>
                              <p className="text-sm text-gray-900 font-bold">{formatTime(apt.end_time)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">Call Duration</p>
                              <p className="text-sm text-green-700 font-bold">
                                {Math.floor(apt.duration_minutes)} min {Math.round((apt.duration_minutes % 1) * 60)} sec
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Join Video Call Button - Only for upcoming today's confirmed appointments */}
                      {activeTab === 'upcoming' && 
                       apt.mode === 'online' && 
                       apt.status === 'confirmed' && 
                       new Date(apt.scheduled_date).toDateString() === new Date().toDateString() && (
                        <button
                          onClick={() => window.location.href = `/dashboard/video-call/${apt.aid}`}
                          className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg smooth-transition flex items-center space-x-2"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Video Call</span>
                        </button>
                      )}
                      
                      {/* Show message for completed calls */}
                      {activeTab === 'completed' && apt.mode === 'online' && apt.status === 'completed' && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          Call completed • Cannot reconnect to this session
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        apt.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : apt.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : apt.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
