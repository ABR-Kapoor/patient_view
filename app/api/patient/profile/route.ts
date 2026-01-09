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

        // Get user and patient data
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('uid', uid)
            .single();

        const { data: patient } = await supabase
            .from('patients')
            .select('*')
            .eq('uid', uid)
            .single();

        return NextResponse.json({
            success: true,
            user,
            patient: patient || null,
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { uid, user, patient } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Update user table
        if (user) {
            const { error: userError } = await supabase
                .from('users')
                .update({
                    name: user.name,
                    phone: user.phone,
                })
                .eq('uid', uid);

            if (userError) throw userError;
        }

        // Update or create patient record
        if (patient) {
            const { data: existingPatient } = await supabase
                .from('patients')
                .select('pid')
                .eq('uid', uid)
                .single();

            if (existingPatient) {
                // Update existing patient
                const { error: patientError } = await supabase
                    .from('patients')
                    .update({
                        date_of_birth: patient.date_of_birth,
                        gender: patient.gender,
                        blood_group: patient.blood_group,
                        address_line1: patient.address_line1,
                        address_line2: patient.address_line2,
                        city: patient.city,
                        state: patient.state,
                        postal_code: patient.postal_code,
                        emergency_contact_name: patient.emergency_contact_name,
                        emergency_contact_phone: patient.emergency_contact_phone,
                        allergies: patient.allergies,
                        chronic_conditions: patient.chronic_conditions,
                    })
                    .eq('uid', uid);

                if (patientError) throw patientError;
            } else {
                // Create new patient record
                const { error: createError } = await supabase
                    .from('patients')
                    .insert({
                        uid,
                        ...patient,
                    });

                if (createError) throw createError;
            }
        }

        return NextResponse.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
