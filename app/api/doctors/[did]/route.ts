import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: { did: string } }
) {
    try {
        const { did } = params;

        if (!did) {
            return NextResponse.json(
                { error: 'Doctor ID is required' },
                { status: 400 }
            );
        }

        // Fetch doctor with user details
        const { data: doctor, error } = await supabase
            .from('doctors')
            .select(`
        *,
        user:users(name, email, phone, profile_image_url)
      `)
            .eq('did', did)
            .single();

        if (error || !doctor) {
            console.error('Doctor not found:', error);
            return NextResponse.json(
                { error: 'Doctor not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            doctor,
        });
    } catch (error) {
        console.error('Error fetching doctor:', error);
        return NextResponse.json(
            { error: 'Failed to fetch doctor details' },
            { status: 500 }
        );
    }
}
