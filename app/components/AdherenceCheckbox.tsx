'use client';

import { useState } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdherenceCheckboxProps {
  adherenceId: string;
  medicineName: string;
  scheduledTime: string;
  isTaken: boolean;
  scheduledDate: string;
  onUpdate?: () => void;
  showTime?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function AdherenceCheckbox({
  adherenceId,
  medicineName,
  scheduledTime,
  isTaken: initialTaken,
  scheduledDate,
  onUpdate,
  showTime = true,
  size = 'medium'
}: AdherenceCheckboxProps) {
  const [isTaken, setIsTaken] = useState(initialTaken);
  const [isUpdating, setIsUpdating] = useState(false);

  const isOverdue = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (scheduledDate < today) return true;
    if (scheduledDate === today) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
      return scheduledTime < currentTime;
    }
    return false;
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleToggle = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    const newStatus = !isTaken;

    try {
      const response = await fetch('/api/patient/adherence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adherence_id: adherenceId,
          is_taken: newStatus,
          is_skipped: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsTaken(newStatus);
        toast.success(newStatus ? '✅ Marked as taken!' : 'Unmarked');
        if (onUpdate) onUpdate();
      } else {
        toast.error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating adherence:', error);
      toast.error('Network error');
    } finally {
      setIsUpdating(false);
    }
  };

  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-7 h-7'
  };

  const overdueStatus = !isTaken && isOverdue();

  return (
    <div className={`flex items-center space-x-3 ${
      isTaken ? 'opacity-75' : ''
    }`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={isTaken}
          disabled={isUpdating}
          onChange={handleToggle}
          className={`${sizeClasses[size]} rounded-lg border-2 ${
            overdueStatus ? 'border-red-400' : 'border-gray-300'
          } text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer disabled:cursor-not-allowed transition-all`}
        />
      </div>
      
      <div className="flex-1">
        <p className={`font-medium ${
          isTaken ? 'text-green-900 line-through' : 
          overdueStatus ? 'text-red-900' : 'text-gray-900'
        }`}>
          {medicineName}
        </p>
        
        {showTime && (
          <div className="flex items-center space-x-1 mt-0.5">
            <Clock className={`w-3 h-3 ${
              overdueStatus ? 'text-red-500' : 'text-gray-400'
            }`} />
            <span className={`text-xs ${
              isTaken ? 'text-gray-500' :
              overdueStatus ? 'text-red-600 font-semibold' : 'text-gray-600'
            }`}>
              {formatTime(scheduledTime)}
              {overdueStatus && <span className="ml-1">• OVERDUE</span>}
            </span>
          </div>
        )}
      </div>

      {isTaken && (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 animate-bounce" />
      )}
    </div>
  );
}
