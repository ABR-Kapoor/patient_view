'use client';

import { useState } from 'react';
import { Activity, Sparkles, Search, Loader2, User, Award, MapPin } from 'lucide-react';
import { LoginLink } from '@kinde-oss/kinde-auth-nextjs/components';
import Link from 'next/link';

interface DoctorRecommendation {
  name: string;
  specialization: string;
  experience: number;
  fee: number;
  location: string;
  rating: number;
  matchScore: number;
  reason: string;
  did?: string;
  profile_image_url?: string;
}

export default function HomePage() {
  const [symptoms, setSymptoms] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [doctors, setDoctors] = useState<DoctorRecommendation[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  const handleAISearch = async () => {
    if (!symptoms.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/ai-doctor-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();
      if (data.success && data.doctors && data.doctors.length > 0) {
        setDoctors(data.doctors);
      } else if (data.success && data.doctors && data.doctors.length === 0) {
        alert('No doctors found matching your symptoms. Please try describing your symptoms in more detail.');
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('AI search failed:', error);
      alert('Failed to search for doctors. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-card fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold gradient-text">AuraSutra</span>
            </div>
            <LoginLink className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:shadow-lg smooth-transition">
              Sign In
            </LoginLink>
          </div>
        </div>
      </nav>

      {/* Hero Section with AI Search */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Doctor Discovery</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Find Your Perfect{' '}
              <span className="gradient-text">Ayurvedic Doctor</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-fade-in">
              Describe your symptoms and let AI recommend the best verified Ayurvedic practitioners for your needs
            </p>
          </div>

          {/* AI Symptom Search Box */}
          <div className="glass-card p-8 rounded-2xl mb-12 animate-fade-in">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                What symptoms are you experiencing?
              </h3>
            </div>

            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="E.g., I have been experiencing digestive issues, bloating after meals, and low energy levels for the past 2 weeks..."
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none smooth-transition"
              rows={6}
            />

            <button
              onClick={handleAISearch}
              disabled={isSearching || !symptoms.trim()}
              className="mt-4 w-full px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-2xl smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI is analyzing your symptoms...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Find Doctors with AI</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Our AI will analyze your symptoms and recommend the most suitable Ayurvedic specialists
            </p>
          </div>

          {/* AI Doctor Recommendations */}
          {doctors.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  🎯 Recommended Doctors for You
                </h2>
                <span className="text-sm text-gray-600">
                  {doctors.length} matches found
                </span>
              </div>

              {doctors.map((doctor, index) => (
                <div
                  key={index}
                  className="glass-card-hover p-6 rounded-2xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {doctor.profile_image_url ? (
                        <img
                          src={doctor.profile_image_url}
                          alt={doctor.name}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center">
                          <User className="w-8 h-8 text-primary-600" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                            {doctor.matchScore}% Match
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center space-x-1">
                            <Award className="w-4 h-4" />
                            <span>{doctor.specialization}</span>
                          </span>
                          <span>{doctor.experience} years exp</span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{doctor.location}</span>
                          </span>
                          <span className="text-accent-600">★ {doctor.rating}</span>
                        </div>

                        <div className="p-3 bg-secondary-50 rounded-lg mb-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-secondary-700">Why recommended:</span> {doctor.reason}
                          </p>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-bold text-primary-600">
                            ₹{doctor.fee}
                          </span>
                          <span className="text-xs text-gray-500">per consultation</span>
                        </div>
                      </div>
                    </div>

                    <LoginLink
                      postLoginRedirectURL={doctor.did ? `/dashboard/book-appointment?did=${doctor.did}` : '/dashboard'}
                      className="px-6 py-3 bg-gradient-to-r from-secondary-600 to-secondary-500 text-white rounded-xl font-semibold hover:shadow-lg smooth-transition"
                    >
                      Book Appointment
                    </LoginLink>
                  </div>
                </div>
              ))}

              <div className="text-center pt-6">
                <button
                  onClick={() => {
                    setDoctors([]);
                    setSymptoms('');
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  ← Search again
                </button>
              </div>
            </div>
          )}

          {/* Info Section */}
          {doctors.length === 0 && !isSearching && (
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              {[
                {
                  icon: <Sparkles className="w-8 h-8 text-primary-600" />,
                  title: 'AI-Powered Matching',
                  description: 'Our AI analyzes your symptoms to find the perfect specialist',
                },
                {
                  icon: <Activity className="w-8 h-8 text-secondary-600" />,
                  title: 'Verified Practitioners',
                  description: 'All doctors are certified Ayurvedic professionals',
                },
                {
                  icon: <User className="w-8 h-8 text-accent-600" />,
                  title: 'Personalized Care',
                  description: 'Get tailored treatment plans based on your unique needs',
                },
              ].map((feature, index) => (
                <div key={index} className="glass-card p-6 rounded-2xl text-center">
                  <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Activity className="w-6 h-6 text-primary-600" />
            <span className="text-xl font-bold gradient-text">AuraSutra</span>
          </div>
          <p className="text-gray-600 mb-4">
            AI-powered Ayurvedic healthcare for modern wellness
          </p>
          <p className="text-sm text-gray-500">
            © 2026 AuraSutra. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
