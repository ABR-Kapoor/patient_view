'use client';

import { useEffect, useState } from 'react';
import { Pill, CheckCircle2, X, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface AdherenceRecord {
  adherence_id: string;
  medicine_name: string;
  scheduled_date: string;
  scheduled_time: string;
  is_taken: boolean;
  is_skipped: boolean;
  prescription_id: string;
  doctor_name?: string;
  dosage?: string;
  frequency?: string;
  notes?: string;
}

export default function DailyMedicinePopup() {
  const [todayMedicines, setTodayMedicines] = useState<AdherenceRecord[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [dismissedToday, setDismissedToday] = useState(false);

  useEffect(() => {
    fetchTodaysMedicines();
    // Check every minute
    const interval = setInterval(fetchTodaysMedicines, 60000);
    return () => clearInterval(interval);
  }, [dismissedToday]);

  const fetchTodaysMedicines = async () => {
    try {
      // Fetch only medicines due now or overdue
      const response = await fetch('/api/patient/adherence?filter=due_now');
      const data = await response.json();
      
      if (data.success && data.adherence) {
         setTodayMedicines(data.adherence);
         // Open popup if there are pending medicines and not dismissed
         const pending = data.adherence.filter((m: AdherenceRecord) => !m.is_taken);
         if (pending.length > 0 && !dismissedToday) {
             setShowPopup(true);
         }
      }
    } catch (error) {
       console.error("Failed to fetch medicines", error);
    } finally {
       setLoading(false);
    }
  };

  const toggleMedicine = async (id: string, currentStatus: boolean) => {
    if (updating) return;
    setUpdating(id);
    try {
      const res = await fetch('/api/patient/adherence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adherence_id: id, is_taken: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(currentStatus ? 'Marked as skipped' : 'Marked as taken');
        fetchTodaysMedicines();
      } else {
        toast.error('Failed to update');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setUpdating(null);
    }
  };

  if (!showPopup || todayMedicines.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 mx-4">
        
         {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Pill className="w-24 h-24 transform rotate-12" />
           </div>
           <div className="relative z-10">
             <div className="flex items-center space-x-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-semibold mb-3 backdrop-blur-md border border-white/10">
                <Clock className="w-3 h-3" />
                <span>Ideally taken at {todayMedicines[0]?.scheduled_time?.slice(0,5)}</span>
             </div>
             <h2 className="text-2xl font-bold">It's Medicine Time!</h2>
             <p className="text-primary-100 mt-1 text-sm">You have {todayMedicines.filter(m => !m.is_taken).length} pending medicines.</p>
           </div>
        </div>

        {/* Medicine List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-gray-50/50">
          {todayMedicines.map((med) => (
             <div key={med.adherence_id} className={`group bg-white rounded-2xl p-4 border transition-all duration-300 ${med.is_taken ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:shadow-lg hover:border-primary-200'}`}>
                <div className="flex items-start justify-between">
                   <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                         <h3 className={`font-bold text-lg ${med.is_taken ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{med.medicine_name}</h3>
                         {med.is_taken && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      </div>
                      
                      {/* Doctor & Details */}
                      <div className="mb-3 space-y-1">
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                             <span className="font-bold text-gray-700">Dr. {med.doctor_name || 'Assigned'}</span>
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                             <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-semibold">{med.dosage || '1 Pill'}</span>
                             <span className="w-px h-3 bg-gray-300"></span>
                             <span>{med.frequency || 'Daily'}</span>
                          </div>
                      </div>

                      {med.notes && (
                        <p className="text-xs text-gray-500 italic mt-2 border-l-2 border-primary-200 pl-2">
                           "{med.notes}"
                        </p>
                      )}
                   </div>

                   {/* Action Button */}
                   <button
                     onClick={() => toggleMedicine(med.adherence_id, med.is_taken)}
                     disabled={updating === med.adherence_id}
                     className={`ml-3 p-3 rounded-xl transition-all duration-200 flex-shrink-0 ${
                        med.is_taken 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-105 shadow-md hover:shadow-xl'
                     }`}
                   >
                     {updating === med.adherence_id ? (
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                     ) : med.is_taken ? (
                        <span className="text-xs font-bold">TAKEN</span>
                     ) : (
                        <span className="text-xs font-bold px-1">TAKE</span>
                     )}
                   </button>
                </div>
             </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center">
             <p className="text-xs text-gray-400 italic">Stay healthy, stay consistent!</p>
             <button
               onClick={() => {
                  setDismissedToday(true);
                  setShowPopup(false);
               }}
               className="text-gray-400 hover:text-gray-600 text-sm font-medium px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
             >
               Dismiss
             </button>
        </div>
      </div>
    </div>
  );
}
