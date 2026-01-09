'use client';

import { useEffect, useState } from 'react';
import { Search, User, Award, MapPin, Star, Sparkles, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Doctor {
  did: string;
  specialization: string[];
  custom_specializations: string;
  qualification: string;
  years_of_experience: number;
  consultation_fee: number;
  city: string;
  state: string;
  bio: string;
  languages: string[];
  user: {
    name: string;
    email: string;
    profile_image_url?: string;
  };
}

export default function FindDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchTerm, selectedSpecialization, selectedCity, doctors]);

  async function fetchDoctors() {
    try {
      const response = await fetch('/api/doctors/find-all');
      const data = await response.json();

      if (data.success) {
        setDoctors(data.doctors || []);
        setFilteredDoctors(data.doctors || []);
      } else {
        toast.error('Failed to load doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }

  function filterDoctors() {
    let filtered = [...doctors];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((doctor) => {
        const name = doctor.user?.name?.toLowerCase() || '';
        const specs = doctor.specialization?.join(' ').toLowerCase() || '';
        const customSpecs = doctor.custom_specializations?.toLowerCase() || '';
        const city = doctor.city?.toLowerCase() || '';
        const bio = doctor.bio?.toLowerCase() || '';

        return (
          name.includes(term) ||
          specs.includes(term) ||
          customSpecs.includes(term) ||
          city.includes(term) ||
          bio.includes(term)
        );
      });
    }

    // Specialization filter
    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter((doctor) =>
        doctor.specialization?.some((spec) =>
          spec.toLowerCase().includes(selectedSpecialization.toLowerCase())
        )
      );
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter((doctor) => doctor.city === selectedCity);
    }

    setFilteredDoctors(filtered);
  }

  // Get unique specializations and cities for filters
  const allSpecializations = Array.from(
    new Set(doctors.flatMap((d) => d.specialization || []))
  ).sort();
  const allCities = Array.from(new Set(doctors.map((d) => d.city).filter(Boolean))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-primary-600" />
            <span>Find Ayurvedic Doctors</span>
          </h1>
          <p className="text-gray-600">
            Browse verified Ayurvedic practitioners and find the perfect match for your health needs
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, specialization, location, or condition..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Specialization Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <Filter className="w-4 h-4" />
              <span>Specialization</span>
            </label>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            >
              <option value="all">All Specializations</option>
              {allSpecializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>City</span>
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            >
              <option value="all">All Cities</option>
              {allCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="w-full px-4 py-2 bg-primary-50 rounded-lg text-center">
              <span className="text-2xl font-bold text-primary-600">{filteredDoctors.length}</span>
              <p className="text-xs text-gray-600">Doctors Found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors List */}
      {filteredDoctors.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedSpecialization !== 'all' || selectedCity !== 'all'
              ? 'Try adjusting your filters to see more results'
              : 'No doctors are currently available in the database'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.did} className="glass-card-hover p-6 rounded-2xl">
              <div className="flex items-start space-x-4">
                {doctor.user?.profile_image_url ? (
                  <img
                    src={doctor.user.profile_image_url}
                    alt={doctor.user?.name || 'Doctor'}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {doctor.user?.name || 'Doctor'}
                  </h3>

                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Award className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{doctor.qualification}</span>
                  </div>

                  {/* Specializations */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doctor.specialization?.slice(0, 2).map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                    {doctor.specialization?.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        +{doctor.specialization.length - 2} more
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-2">
                      <span>📍</span>
                      <span>
                        {doctor.city && doctor.state
                          ? `${doctor.city}, ${doctor.state}`
                          : 'Location not specified'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>💼</span>
                      <span>{doctor.years_of_experience} years experience</span>
                    </div>
                    {doctor.languages && doctor.languages.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span>🗣️</span>
                        <span>{doctor.languages.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Fee and Book Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{doctor.consultation_fee}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">/ consultation</span>
                    </div>
                    <Link
                      href={`/dashboard/book-appointment?did=${doctor.did}`}
                      className="px-4 py-2 bg-gradient-to-r from-secondary-600 to-secondary-500 text-white rounded-lg font-semibold hover:shadow-lg smooth-transition"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
