'use client';

import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Doctor {
  did: string;
  specialization: string;
  years_of_experience: number;
  consultation_fee: number;
  city: string;
  state: string;
  user: {
    name: string;
    email: string;
  };
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          user:users(name, email)
        `)
        .eq('is_verified', true)
        .order('years_of_experience', { ascending: false });

      if (error) throw error;

      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Doctors</h1>
        <p className="text-gray-600">Connect with verified Ayurvedic practitioners</p>
      </div>

      <div className="glass-card p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, specialization..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No doctors found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.did} className="glass-card-hover p-6 rounded-2xl">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {doctor.user?.name || 'Doctor'}
                  </h3>
                  <p className="text-sm text-gray-600">{doctor.specialization}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">
                      {doctor.years_of_experience} years exp
                    </span>
                    <span className="text-primary-600 font-semibold">
                      ₹{doctor.consultation_fee || 500}
                    </span>
                    {doctor.city && doctor.state && (
                      <span className="text-gray-500">
                        {doctor.city}, {doctor.state}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toast.success('Booking feature coming soon!')}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:shadow-lg smooth-transition"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
