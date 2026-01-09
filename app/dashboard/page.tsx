'use client';

import { useEffect, useState } from 'react';
import DailyMedicinePopup from '../components/DailyMedicinePopup';
import DashboardAdherenceWidget from '../components/DashboardAdherenceWidget';
import { Calendar, Pill, FileText, TrendingUp, Activity, User, Video, Heart } from 'lucide-react';
import Link from 'next/link';
import {
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Appointment {
  aid: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctor?: {
    users?: {
    };
  };
}
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function PatientDashboardPage() {
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    activePrescriptions: 0,
    totalAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [greeting, setGreeting] = useState('Welcome');
  const [adherenceData, setAdherenceData] = useState<any[]>([]); // Re-added adherenceData
  const [medicineData, setMedicineData] = useState<any[]>([]);


  useEffect(() => {
    // Generate dynamic greeting
    const greetings = [
      "Welcome back",
      "Great to see you",
      "Hello",
      "Good to have you here",
      "Welcome",
      "Hey there",
      "Greetings",
      "Nice to see you",
    ];
    
    const hour = new Date().getHours();
    let timeGreeting = "";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else if (hour < 21) timeGreeting = "Good evening";
    else timeGreeting = "Good night";
    
    const selectedGreeting = Math.random() > 0.5 
      ? timeGreeting 
      : greetings[Math.floor(Math.random() * greetings.length)];
    
    setGreeting(selectedGreeting);
    
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const syncResponse = await fetch('/api/sync-user');
      const { user } = await syncResponse.json();
      
      if (user) {
        setUserName(user.name || '');
        if (user.profile_image_url) {
          setProfileImage(user.profile_image_url);
        }
        
        const response = await fetch(`/api/patient/dashboard?uid=${user.uid}`);
        const data = await response.json();

        if (data.success) {
          setStats({
            upcomingAppointments: data.upcomingAppointments || 0,
            activePrescriptions: data.activePrescriptions || 0,
            totalAppointments: data.totalAppointments || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const colors = ['#6366F1', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Daily Medicine Reminder Popup */}
      <DailyMedicinePopup />

      {/* Welcome Header with Profile */}
      <div className="glass-card p-8 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-primary-600" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-gray-600 mt-1">We hope you're feeling well today</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-2xl font-bold text-primary-600">
              {stats.upcomingAppointments}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Upcoming Appointments
          </h3>
          <Link
            href="/dashboard/appointments"
            className="text-sm text-primary-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center">
              <Pill className="w-6 h-6 text-secondary-600" />
            </div>
            <span className="text-2xl font-bold text-secondary-600">
              {stats.activePrescriptions}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Active Prescriptions
          </h3>
          <Link
            href="/dashboard/prescriptions"
            className="text-sm text-secondary-600 hover:underline"
          >
            Manage →
          </Link>
        </div>

        <div className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent-600" />
            </div>
            <span className="text-2xl font-bold text-accent-600">
              {stats.adherenceRate}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Medication Adherence
          </h3>
          <p className="text-sm text-accent-600">
            {stats.adherenceRate >= 80 ? 'Excellent! Keep it up' : 'Keep improving!'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      {adherenceData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Medication Adherence Trend */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Weekly Medication Trend
              </h2>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={adherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="taken"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 4 }}
                  name="Taken"
                />
                <Line
                  type="monotone"
                  dataKey="skipped"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', r: 4 }}
                  name="Skipped"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Medicine-wise Adherence */}
          {medicineData.length > 0 && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Medicine-wise Progress
                </h2>
                <Pill className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={medicineData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {medicineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {medicineData.map((med, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="text-sm text-gray-700">{med.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {med.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/"
            className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 hover:shadow-lg smooth-transition group"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 smooth-transition">
              <Activity className="w-5 h-5 text-primary-600" />
            </div>
            <span className="font-medium text-gray-900">AI Doctor Search</span>
          </Link>

          <Link
            href="/dashboard/find-doctors"
            className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-br from-secondary-50 to-secondary-100/50 hover:shadow-lg smooth-transition group"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 smooth-transition">
              <Calendar className="w-5 h-5 text-secondary-600" />
            </div>
            <span className="font-medium text-gray-900">Find Doctors</span>
          </Link>

          <Link
            href="/dashboard/prescriptions"
            className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100/50 hover:shadow-lg smooth-transition group"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 smooth-transition">
              <FileText className="w-5 h-5 text-accent-600" />
            </div>
            <span className="font-medium text-gray-900">View Prescriptions</span>
          </Link>

          <Link
            href="/dashboard/profile"
            className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 hover:shadow-lg smooth-transition group"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 smooth-transition">
              <FileText className="w-5 h-5 text-rose-600" />
            </div>
            <span className="font-medium text-gray-900">Update Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
