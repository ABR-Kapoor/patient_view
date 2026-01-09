import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Get patient record
        const { data: patient } = await supabase
            .from('patients')
            .select('*')
            .eq('uid', uid)
            .single();

        if (!patient) {
            return NextResponse.json({
                success: true,
                upcomingAppointments: 0,
                activePrescriptions: 0,
                adherenceRate: 0,
                adherenceData: [],
                medicineData: [],
            });
        }

        // Get upcoming appointments
        const { data: appointments } = await supabase
            .from('appointments')
            .select('*')
            .eq('pid', patient.pid)
            .in('status', ['scheduled', 'confirmed'])
            .gte('scheduled_date', new Date().toISOString().split('T')[0])
            .order('scheduled_date', { ascending: true });

        // Get active prescriptions
        const { data: prescriptions } = await supabase
            .from('prescriptions')
            .select('*, prescription_items(*)')
            .eq('pid', patient.pid)
            .eq('is_active', true);

        // Get medication adherence data (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: adherenceRecords } = await supabase
            .from('medication_adherence')
            .select('*')
            .eq('pid', patient.pid)
            .gte('scheduled_time', sevenDaysAgo.toISOString())
            .order('scheduled_time', { ascending: true });

        // Process adherence data for charts
        const adherenceByDay: { [key: string]: { taken: number; skipped: number } } = {};
        const adherenceByMedicine: { [key: string]: { taken: number; total: number } } = {};

        adherenceRecords?.forEach((record) => {
            const date = new Date(record.scheduled_time).toLocaleDateString('en-US', { weekday: 'short' });

            if (!adherenceByDay[date]) {
                adherenceByDay[date] = { taken: 0, skipped: 0 };
            }

            if (record.is_taken) {
                adherenceByDay[date].taken++;
            } else {
                adherenceByDay[date].skipped++;
            }

            // Track by medicine
            const medicineName = record.medicine_name || 'Unknown';
            if (!adherenceByMedicine[medicineName]) {
                adherenceByMedicine[medicineName] = { taken: 0, total: 0 };
            }
            adherenceByMedicine[medicineName].total++;
            if (record.is_taken) {
                adherenceByMedicine[medicineName].taken++;
            }
        });

        const adherenceData = Object.entries(adherenceByDay).map(([date, data]) => ({
            date,
            taken: data.taken,
            skipped: data.skipped,
        }));

        const medicineData = Object.entries(adherenceByMedicine)
            .slice(0, 3) // Top 3 medicines
            .map(([name, data]) => ({
                name,
                value: data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0,
            }));

        // Calculate overall adherence rate
        const totalDoses = adherenceRecords?.length || 0;
        const takenDoses = adherenceRecords?.filter((r) => r.is_taken).length || 0;
        const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

        return NextResponse.json({
            success: true,
            upcomingAppointments: appointments?.length || 0,
            activePrescriptions: prescriptions?.length || 0,
            adherenceRate,
            adherenceData,
            medicineData,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
