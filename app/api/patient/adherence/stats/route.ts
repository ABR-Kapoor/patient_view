import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const pid = searchParams.get('pid');
        const prescription_id = searchParams.get('prescription_id');

        if (!pid || !prescription_id) {
            return NextResponse.json(
                { success: false, error: 'Missing pid or prescription_id' },
                { status: 400 }
            );
        }

        // Fetch stats from materialized view
        const { data: stats, error } = await supabase
            .from('adherence_progress_summary')
            .select('*')
            .eq('pid', pid)
            .eq('prescription_id', prescription_id);

        if (error) {
            console.error('Error fetching adherence stats:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch stats' },
                { status: 500 }
            );
        }

        // Calculate aggregated stats
        let totalDoses = 0;
        let takenDoses = 0;
        let skippedDoses = 0;

        const medicineBreakdown = stats.map(stat => {
            totalDoses += stat.total_doses;
            takenDoses += stat.taken_doses;
            skippedDoses += stat.skipped_doses;

            return {
                medicineName: stat.medicine_name,
                total: stat.total_doses,
                taken: stat.taken_doses,
                skipped: stat.skipped_doses,
                percentage: stat.adherence_percentage
            };
        });

        const overallPercentage = totalDoses > 0
            ? Math.round((takenDoses / totalDoses) * 100)
            : 0;

        return NextResponse.json({
            success: true,
            stats: {
                overallPercentage,
                totalDoses,
                takenDoses,
                skippedDoses,
                breakdown: medicineBreakdown
            }
        });

    } catch (error) {
        console.error('Error in adherence stats API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
