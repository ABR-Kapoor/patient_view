import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch adherence records for patient
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const pid = searchParams.get('pid');
        const prescription_id = searchParams.get('prescription_id');

        if (!pid) {
            return NextResponse.json(
                { success: false, error: 'Patient ID required' },
                { status: 400 }
            );
        }

        let query = supabase
            .from('medication_adherence')
            .select(`
                *,
                prescriptions (
                    did,
                    medicines,
                    doctors (
                        users (
                            name
                        )
                    )
                )
            `)
            .eq('pid', pid)
            .order('scheduled_date', { ascending: true });

        if (prescription_id) {
            query = query.eq('prescription_id', prescription_id);
        }

        const { data, error } = await query;
        let finalData = data || [];

        // Transform data to include flat details
        finalData = finalData.map((record: any) => {
            const prescription = record.prescriptions;
            const doctorName = prescription?.doctors?.users?.name || 'Unknown Doctor';

            // Find medicine details from JSON
            let medicineDetails = {};
            if (prescription && prescription.medicines) {
                const meds = Array.isArray(prescription.medicines) ? prescription.medicines : [];
                const medInfo = meds.find((m: any) => m.name === record.medicine_name);
                if (medInfo) {
                    medicineDetails = {
                        dosage: medInfo.dosage,
                        frequency: medInfo.frequency,
                        notes: medInfo.notes
                    };
                }
            }

            return {
                ...record,
                doctor_name: doctorName,
                ...medicineDetails
            };
        });

        // SELF-HEALING: If no records found, generate them
        if ((!finalData || finalData.length === 0) && pid) {
            console.log('[API] No records found. Attempting auto-generation...');
            const { data: prescriptions } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('pid', pid)
                .eq('sent_to_patient', true);

            if (prescriptions && prescriptions.length > 0) {
                const newRecords = [];
                const todayDate = new Date();

                for (const p of prescriptions) {
                    if (!p.medicines) continue;
                    const list = Array.isArray(p.medicines) ? p.medicines : JSON.parse(p.medicines as any);

                    for (const med of list) {
                        let duration = 5;
                        const dStr = (med.duration || '').toLowerCase();
                        if (dStr.includes('week')) duration = (parseInt(dStr) || 1) * 7;
                        else if (dStr.includes('month')) duration = (parseInt(dStr) || 1) * 30;
                        else { const n = parseInt(dStr); if (!isNaN(n)) duration = n; }

                        for (let i = 0; i < duration; i++) {
                            const d = new Date(todayDate);
                            d.setDate(d.getDate() + i);
                            newRecords.push({
                                pid: pid,
                                prescription_id: p.prescription_id,
                                medicine_name: med.name,
                                scheduled_date: d.toISOString().split('T')[0],
                                scheduled_time: '09:00:00', // Default time to satisfy constraint
                                is_taken: false,
                                is_skipped: false
                            });
                        }
                    }
                }

                if (newRecords.length > 0) {
                    const { error: insErr } = await supabase.from('medication_adherence').insert(newRecords);
                    if (!insErr) {
                        const { data: refetched } = await supabase.from('medication_adherence').select('*').eq('pid', pid).order('scheduled_date');
                        if (refetched) finalData = refetched;
                    }
                }
            }
        }

        const todayKey = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

        // Time-aware filtering: Show medicines due NOW (within 1 hour window) or overdue
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const oneHourFromNowTime = `${oneHourFromNow.getHours().toString().padStart(2, '0')}:${oneHourFromNow.getMinutes().toString().padStart(2, '0')}:00`;

        const pending = finalData.filter((d: any) => {
            if (d.scheduled_date !== todayKey || d.is_taken || d.is_skipped) return false;

            // Show if scheduled time is NOW or in the past (overdue)
            // OR scheduled within the next hour
            return d.scheduled_time <= oneHourFromNowTime;
        });

        const dueNow = finalData.filter((d: any) => {
            if (d.scheduled_date !== todayKey || d.is_taken || d.is_skipped) return false;

            // Due RIGHT NOW: Within 1 hour window
            const medicineTime = d.scheduled_time;
            return medicineTime <= oneHourFromNowTime && medicineTime >= currentTime;
        });

        const overdue = finalData.filter((d: any) => {
            if (d.is_taken || d.is_skipped) return false;

            // Overdue: Past date OR today but past scheduled time
            if (d.scheduled_date < todayKey) return true;
            if (d.scheduled_date === todayKey && d.scheduled_time < currentTime) return true;

            return false;
        });

        const taken = finalData.filter((d: any) => d.is_taken);
        const skipped = finalData.filter((d: any) => d.is_skipped);
        const upcoming = finalData.filter((d: any) => {
            if (d.scheduled_date > todayKey) return true;
            if (d.scheduled_date === todayKey && d.scheduled_time > oneHourFromNowTime) return true;
            return false;
        });

        return NextResponse.json({
            success: true,
            adherence: {
                all: finalData,
                pending, // All pending for today (due now or in next hour)
                dueNow, // Due RIGHT NOW (within 1 hour)
                overdue, // Past scheduled time
                taken,
                skipped,
                upcoming,
                stats: {
                    total: finalData.length,
                    taken: taken.length,
                    skipped: skipped.length,
                    pending: pending.length,
                    overdue: overdue.length,
                    adherence_rate: finalData.length ? ((taken.length / finalData.length) * 100).toFixed(1) : 0
                },
                currentTime: currentTime
            }
        });
    } catch (error: any) {
        console.error('[API] Adherence fetch error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH - Update adherence record (mark taken/skipped)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { adherence_id, is_taken, is_skipped, notes } = body;

        if (!adherence_id) {
            return NextResponse.json(
                { success: false, error: 'Adherence ID required' },
                { status: 400 }
            );
        }

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (is_taken !== undefined) {
            updateData.is_taken = is_taken;
            updateData.is_skipped = false;
            if (is_taken) {
                updateData.taken_at = new Date().toISOString();
            }
        }

        if (is_skipped !== undefined) {
            updateData.is_skipped = is_skipped;
            updateData.is_taken = false;
            if (is_skipped) {
                updateData.skipped_at = new Date().toISOString();
            }
        }

        if (notes) {
            updateData.notes = notes;
        }

        const { data, error } = await supabase
            .from('medication_adherence')
            .update(updateData)
            .eq('adherence_id', adherence_id)
            .select()
            .single();

        if (error) {
            console.error('[API] Error updating adherence:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log('[API] Adherence updated:', adherence_id);

        return NextResponse.json({
            success: true,
            adherence: data,
            message: 'Adherence updated successfully'
        });
    } catch (error: any) {
        console.error('[API] Adherence update error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
