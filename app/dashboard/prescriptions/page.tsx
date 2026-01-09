'use client';

import { useEffect, useState } from 'react';
import { Pill, FileText, Calendar, CheckCircle2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import AdherenceCheckbox from '@/app/components/AdherenceCheckbox';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface Prescription {
  prescription_id: string;
  diagnosis: string;
  symptoms: string[];
  medicines: Medicine[];
  instructions: string;
  diet_advice: string;
  follow_up_date: string;
  created_at: string;
  sent_at: string;
  doctors: {
    users: {
      name: string;
      profile_image_url: string;
    };
  };
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

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [adherenceMap, setAdherenceMap] = useState<Map<string, AdherenceRecord[]>>(new Map());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'schedule' | 'progress'>>({});
  const [stats, setStats] = useState<Record<string, any>>({});
  const [profileId, setProfileId] = useState<string | null>(null);

  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);

  // ... (keep fetchAdherenceStats, useEffect, fetchData, toggleMedicine, getTodayAdherence - verify toggleCard is removed/unused)

  // NOTE: toggleCard and expandedCards are no longer needed for Grid View, 
  // but keeping them in state definitions if we don't want to break existing logic elsewhere 
  // until fully refactored. For this replacement, we focus on the return JSX.

  async function fetchAdherenceStats(prescriptionId: string) {
     if (!profileId) return;
     try {
       const res = await fetch(`/api/patient/adherence/stats?pid=${profileId}&prescription_id=${prescriptionId}`);
       const data = await res.json();
       if (data.success) {
         setStats(prev => ({...prev, [prescriptionId]: data.stats}));
       }
     } catch (err) {
       console.error("Failed to fetch stats", err);
     }
  }

  useEffect(() => {
    fetchData();
    
    // Poll for real-time adherence updates every 10 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
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

      const pid = profileData.patient.pid;
      setProfileId(pid);

      // Fetch prescriptions
      const rxResponse = await fetch(`/api/patient/prescriptions?pid=${pid}`);
      const rxData = await rxResponse.json();

      if (rxData.success) {
        const sent = rxData.prescriptions.sent || [];
        setPrescriptions(sent);

        // Fetch adherence for all prescriptions
        const adherenceResponse = await fetch(`/api/patient/adherence?pid=${pid}`);
        const adherenceData = await adherenceResponse.json();

        if (adherenceData.success) {
          // Group adherence by prescription_id and medicine_name
          const map = new Map<string, AdherenceRecord[]>();
          adherenceData.adherence.all.forEach((record: AdherenceRecord & { prescription_id: string }) => {
            const key = `${record.prescription_id}_${record.medicine_name}`;
            if (!map.has(key)) {
              map.set(key, []);
            }
            map.get(key)!.push(record);
          });
          setAdherenceMap(map);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
        <p className="text-gray-600 mt-1">Track your daily medicine adherence</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Prescriptions Yet</h3>
          <p className="text-gray-500">
            Your doctor will send prescriptions here after your consultations
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prescriptions.map((prescription) => (
            <div
              key={prescription.prescription_id}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 aspect-square flex flex-col transition-all duration-300 hover:shadow-xl"
            >
               {/* Main Visual - Full Cover Image */}
               <div className="absolute inset-0 bg-gray-100">
                  {prescription.doctors?.users?.profile_image_url ? (
                     <img
                       src={prescription.doctors.users.profile_image_url}
                       alt={prescription.doctors.users.name}
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     />
                  ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 text-indigo-300">
                        <Pill className="w-24 h-24 opacity-20 transform -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                     </div>
                  )}
               </div>

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 transition-opacity duration-300"></div>

                {/* Bottom Label (Always Visible) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white translate-y-2 group-hover:translate-y-full transition-transform duration-300 flex flex-col justify-end h-full">
                   <p className="text-white/90 text-xl font-bold mb-1 drop-shadow-sm">Dr. {prescription.doctors?.users?.name || 'Unknown'}</p>
                   <h3 className="font-medium text-base text-gray-200 leading-snug break-words drop-shadow-md">{prescription.diagnosis}</h3>
                </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center transform scale-95 group-hover:scale-100">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/20 shadow-lg">
                     {prescription.doctors?.users?.profile_image_url ? (
                        <img src={prescription.doctors.users.profile_image_url} className="w-full h-full object-cover rounded-full" />
                     ) : (
                        <FileText className="w-8 h-8 text-white" />
                     )}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Dr. {prescription.doctors?.users?.name}</h3>
                  <p className="text-gray-300 text-sm mb-6 line-clamp-2">{prescription.diagnosis}</p>
                  
                  <button
                    onClick={() => {
                        setSelectedPrescription(prescription);
                        // Default to schedule tab
                         setActiveTab(prev => ({...prev, [prescription.prescription_id]: 'schedule'}));
                    }}
                    className="py-3 px-8 bg-white text-primary-900 rounded-full font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <span>Open Details</span>
                    <ChevronDown className="w-4 h-4 rotate-270" />
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-100 p-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
                 <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary-50 rounded-xl">
                       <Pill className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-gray-900">{selectedPrescription.diagnosis}</h2>
                       <p className="text-gray-500 text-sm">Prescribed by Dr. {selectedPrescription.doctors?.users?.name}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedPrescription(null)}
                   className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                 >
                    <ChevronDown className="w-6 h-6 text-gray-500" />
                 </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                  
                 {/* Tabs Navigation */}
                  <div className="flex justify-center mb-8">
                    <div className="flex space-x-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                        <button
                          onClick={() => setActiveTab(prev => ({...prev, [selectedPrescription.prescription_id]: 'schedule'}))}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                            (activeTab[selectedPrescription.prescription_id] || 'schedule') === 'schedule'
                              ? 'bg-primary-600 text-white shadow-md'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Today's Schedule
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab(prev => ({...prev, [selectedPrescription.prescription_id]: 'progress'}));
                            fetchAdherenceStats(selectedPrescription.prescription_id);
                          }}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                            activeTab[selectedPrescription.prescription_id] === 'progress'
                              ? 'bg-primary-600 text-white shadow-md'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          Progress & Stats
                        </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {(activeTab[selectedPrescription.prescription_id] || 'schedule') === 'schedule' ? (
                      <div className="max-w-2xl mx-auto space-y-6">
                          {/* Schedule List */}
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                             <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                   <Calendar className="w-5 h-5 text-primary-500" />
                                   Checklist for {new Date().toLocaleDateString()}
                                </h3>
                             </div>

                             <div className="space-y-3">
                                {(() => {
                                   const today = new Date().toISOString().split('T')[0];
                                   const todayRecords: AdherenceRecord[] = [];
                                   selectedPrescription.medicines.forEach((med: any) => {
                                     const key = `${selectedPrescription.prescription_id}_${med.name}`;
                                     const records = adherenceMap.get(key) || [];
                                     const todays = records.filter(r => r.scheduled_date === today);
                                     todayRecords.push(...todays);
                                   });
                                   
                                   // SORT STRICTLY BY TIME
                                   todayRecords.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

                                   if (todayRecords.length === 0) {
                                      return (
                                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                                           </div>
                                           <p className="font-medium text-gray-600">No medicines scheduled for today</p>
                                           <p className="text-sm">You are all caught up!</p>
                                        </div>
                                      );
                                   }

                                   return todayRecords.map(record => (
                                      <div key={record.adherence_id} className="bg-white border border-gray-100 rounded-xl p-1 hover:shadow-md transition-shadow">
                                        <AdherenceCheckbox
                                          adherenceId={record.adherence_id}
                                          medicineName={record.medicine_name}
                                          scheduledTime={record.scheduled_time}
                                          scheduledDate={record.scheduled_date}
                                          isTaken={record.is_taken}
                                          onUpdate={fetchData}
                                          size="large"
                                        />
                                      </div>
                                   ));
                                })()}
                             </div>
                          </div>

                          {/* Instructions Block */}
                          {selectedPrescription.instructions && (
                             <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-100">
                                <h4 className="font-bold text-yellow-800 mb-2 text-sm uppercase tracking-wide">Doctor's Instructions</h4>
                                <p className="text-yellow-900 leading-relaxed">{selectedPrescription.instructions}</p>
                             </div>
                          )}
                      </div>
                  ) : (
                      <div className="max-w-3xl mx-auto space-y-6">
                        {stats[selectedPrescription.prescription_id] ? (
                           <div className="grid md:grid-cols-2 gap-6">
                              {/* Overall Chart */}
                              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                 <div className="relative w-48 h-48 mb-6">
                                    <svg className="w-full h-full transform -rotate-90">
                                      <circle cx="96" cy="96" r="80" className="stroke-gray-100 fill-none" strokeWidth="16" />
                                      <circle
                                        cx="96" cy="96" r="80"
                                        className="stroke-primary-500 fill-none transition-all duration-1000 ease-out"
                                        strokeWidth="16"
                                        strokeDasharray="502"
                                        strokeDashoffset={502 - (502 * (stats[selectedPrescription.prescription_id]?.adherence_rate || 0)) / 100}
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                       <span className="text-5xl font-black text-gray-900 tracking-tight">{stats[selectedPrescription.prescription_id]?.adherence_rate}%</span>
                                       <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Adherence</span>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-3 gap-4 w-full text-center">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                       <div className="text-2xl font-bold text-gray-900">{stats[selectedPrescription.prescription_id]?.total_doses}</div>
                                       <div className="text-xs text-gray-500 font-medium">Total Doses</div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-xl text-green-700">
                                       <div className="text-2xl font-bold">{stats[selectedPrescription.prescription_id]?.taken}</div>
                                       <div className="text-xs font-medium opacity-80">Taken</div>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-xl text-red-700">
                                       <div className="text-2xl font-bold">{stats[selectedPrescription.prescription_id]?.skipped}</div>
                                       <div className="text-xs font-medium opacity-80">Skipped</div>
                                    </div>
                                 </div>
                              </div>

                              {/* Medicine Breakdown */}
                              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                 <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-gray-400" />
                                    Medicine Breakdown
                                 </h3>
                                 <div className="space-y-6">
                                     {stats[selectedPrescription.prescription_id]?.medicine_breakdown?.map((med: any, idx: number) => (
                                        <div key={idx} className="group">
                                           <div className="flex justify-between items-end mb-2">
                                              <div>
                                                 <span className="font-bold text-gray-700 block text-sm">{med.medicine_name}</span>
                                                 <span className="text-xs text-gray-400 font-medium">{med.taken}/{med.total} doses</span>
                                              </div>
                                              <span className="font-bold text-primary-600 text-lg">{med.adherence_rate}%</span>
                                           </div>
                                           <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                              <div 
                                                className="bg-primary-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                                                style={{ width: `${med.adherence_rate}%` }}
                                              >
                                                 <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                              </div>
                                           </div>
                                        </div>
                                     ))}
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="text-center py-24">
                              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-gray-500 font-medium">Calculating progress...</p>
                           </div>
                        )}
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
