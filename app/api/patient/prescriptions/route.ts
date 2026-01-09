import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const pid = searchParams.get('pid');

        if (!pid) {
            return NextResponse.json(
                { success: false, error: 'Patient ID required' },
                { status: 400 }
            );
        }

        // Get all prescriptions for patient (without complex joins)
        const { data: prescriptions, error } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('pid', pid)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching patient prescriptions:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Add doctor info to each prescription
        const prescriptionsWithDoctors = await Promise.all(
            (prescriptions || []).map(async (prescription) => {
                const { data: doctor } = await supabase
                    .from('doctors')
                    .select('did, users(name, profile_image_url)')
                    .eq('did', prescription.did)
                    .single();

                return {
                    ...prescription,
                    doctors: doctor || null
                };
            })
        );

        // Separate sent and unsent
        const sent = prescriptionsWithDoctors.filter(p => p.sent_to_patient) || [];
        const drafts = prescriptionsWithDoctors.filter(p => !p.sent_to_patient) || [];

        return NextResponse.json({
            success: true,
            prescriptions: {
                sent,
                drafts,
                all: prescriptions || [],
            },
        });
    } catch (error: any) {
        console.error('[API] Patient prescriptions fetch error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
