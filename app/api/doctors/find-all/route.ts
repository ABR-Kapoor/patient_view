import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // Fetch all verified doctors with user details
        const { data: doctors, error } = await supabase
            .from('doctors')
            .select(`
        *,
        user:users(name, email, phone, profile_image_url)
      `)

            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            doctors: doctors || [],
            count: doctors?.length || 0,
        });
    } catch (error) {
        console.error('Find doctors error:', error);
        return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
    }
}
