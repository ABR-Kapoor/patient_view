import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();

        if (!kindeUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get request body
        const body = await request.json();
        const {
            did,
            scheduled_date,
            scheduled_time,
            mode,
            chief_complaint,
            symptoms = [],
        } = body;

        // Validate required fields
        if (!did || !scheduled_date || !scheduled_time || !mode || !chief_complaint) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate mode
        if (!['online', 'offline'].includes(mode)) {
            return NextResponse.json(
                { error: 'Invalid appointment mode. Must be "online" or "offline"' },
                { status: 400 }
            );
        }

        // Validate date is in future (disabled for testing)
        // const appointmentDate = new Date(`${scheduled_date}T${scheduled_time}`);
        // if (appointmentDate <= new Date()) {
        //   return NextResponse.json(
        //     { error: 'Appointment must be scheduled for a future date/time' },
        //     { status: 400 }
        //   );
        // }
        // Get user's UID from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('uid')
            .eq('auth_id', kindeUser.id)
            .single();

        if (userError || !userData) {
            console.error('User not found:', userError);
            return NextResponse.json(
                { error: 'User not found in database' },
                { status: 404 }
            );
        }

        const uid = userData.uid;

        // Get patient ID (pid) from uid
        const { data: patientData, error: patientError } = await supabase
            .from('patients')
            .select('pid')
            .eq('uid', uid)
            .single();

        if (patientError || !patientData) {
            console.error('Patient record not found:', patientError);
            return NextResponse.json(
                { error: 'Patient record not found. Please complete your profile first.' },
                { status: 404 }
            );
        }

        const pid = patientData.pid;

        // Verify doctor exists
        const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('did')
            .eq('did', did)
            .single();

        if (doctorError || !doctorData) {
            return NextResponse.json(
                { error: 'Doctor not found' },
                { status: 404 }
            );
        }

        // Create appointment
        const { data: appointment, error: appointmentError } = await supabase
            .from('appointments')
            .insert({
                pid,
                did,
                mode,
                status: 'scheduled',
                scheduled_date,
                scheduled_time,
                chief_complaint,
                symptoms: symptoms.length > 0 ? symptoms : null,
            })
            .select()
            .single();

        if (appointmentError) {
            console.error('Error creating appointment:', appointmentError);
            return NextResponse.json(
                { error: 'Failed to create appointment' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            appointment,
            message: 'Appointment booked successfully!',
        });
    } catch (error) {
        console.error('Appointment creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create appointment' },
            { status: 500 }
        );
    }
}
