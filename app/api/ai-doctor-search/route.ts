import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('AI Search - Received body:', body);

        const { symptoms } = body;
        console.log('AI Search - Extracted symptoms:', symptoms);

        if (!symptoms || symptoms.trim().length < 10) {
            console.log('AI Search - Validation failed:', { symptoms: symptoms || 'undefined', length: symptoms?.trim().length });
            return NextResponse.json(
                { success: false, error: 'Please provide more detailed symptoms (at least 10 characters)' },
                { status: 400 }
            );
        }

        // Get doctors from database with specialization matching
        const doctors = await getRealDoctorsWithAI(symptoms);

        return NextResponse.json({
            success: true,
            doctors,
        });
    } catch (error) {
        console.error('AI search error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process your request' },
            { status: 500 }
        );
    }
}

async function getRealDoctorsWithAI(symptoms: string) {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Analyze symptoms to determine relevant specializations
        const relevantSpecs = analyzeSymptoms(symptoms);
        console.log('Relevant specializations:', relevantSpecs);

        // Fetch all doctors first (simpler query)
        const { data: doctors, error } = await supabase
            .from('doctors')
            .select(`
        *,
        user:users(name, email, profile_image_url)
      `)
            ;

        console.log('Database doctors:', doctors);

        if (error) {
            console.error('Database error:', error);
            return []; // Return empty array instead of mock data
        }

        if (!doctors || doctors.length === 0) {
            // No doctors in database
            console.log('No doctors in database');
            return []; // Return empty array instead of mock data
        }

        // Filter doctors in JS based on specialization overlap AND custom keywords
        const symptomKeywords = symptoms.toLowerCase().split(' ').filter(w => w.length > 3);

        const matchedDoctors = doctors.filter((doctor) => {
            const doctorSpecs = doctor.specialization || [];
            const customSpecs = doctor.custom_specializations || '';

            // Check predefined specializations
            const specsMatch = relevantSpecs.some(spec =>
                doctorSpecs.some((dSpec: string) => dSpec.toLowerCase().includes(spec.toLowerCase()) || spec.toLowerCase().includes(dSpec.toLowerCase()))
            );

            // Check custom specializations (SEO keywords) - comma separated
            const customKeywords = customSpecs.toLowerCase().split(',').map((k: string) => k.trim());
            const keywordsMatch = symptomKeywords.some(symptom =>
                customKeywords.some((keyword: string) => keyword.includes(symptom) || symptom.includes(keyword))
            );

            return specsMatch || keywordsMatch;
        });

        console.log('Matched doctors:', matchedDoctors);

        // If we have matches, use them, otherwise use any doctors
        const doctorsToUse = matchedDoctors.length > 0 ? matchedDoctors : doctors;

        return mapDoctorsToRecommendations(doctorsToUse, symptoms, relevantSpecs);
    } catch (error) {
        console.error('Database error:', error);
        return []; // Return empty array instead of mock data
    }
}

function analyzeSymptoms(symptoms: string): string[] {
    const symptomsLower = symptoms.toLowerCase();
    const specializations: string[] = [];

    // Digestive issues
    if (symptomsLower.match(/digest|stomach|bloat|constip|diarr|acid|gas|ibs/)) {
        specializations.push('Panchakarma Specialist', 'Kayachikitsa (Internal Medicine)');
    }

    // Stress/Mental health
    if (symptomsLower.match(/stress|anxiety|sleep|insomnia|depress|mental|mind/)) {
        specializations.push('Rasayana (Rejuvenation)', 'Swasthavritta (Preventive Medicine)');
    }

    // Pain/Joint issues
    if (symptomsLower.match(/pain|joint|arthrit|back|neck|muscle|inflam/)) {
        specializations.push('Panchakarma Specialist', 'Kayachikitsa (Internal Medicine)');
    }

    // Skin issues
    if (symptomsLower.match(/skin|rash|eczema|psoriasis|acne|itch/)) {
        specializations.push('Kayachikitsa (Internal Medicine)');
    }

    // Respiratory
    if (symptomsLower.match(/cough|cold|asthma|breath|lung|respirat/)) {
        specializations.push('Kayachikitsa (Internal Medicine)', 'Shalakya Tantra (ENT & Ophthalmology)');
    }

    // Women's health
    if (symptomsLower.match(/period|menstrual|pregnan|fertility|pcos/)) {
        specializations.push('Prasuti Tantra (Gynecology & Obstetrics)');
    }

    // Children
    if (symptomsLower.match(/child|baby|infant|pediatric/)) {
        specializations.push('Kaumara Bhritya (Pediatrics)');
    }

    // Default
    if (specializations.length === 0) {
        specializations.push('General Ayurveda');
    }

    return [...new Set(specializations)]; // Remove duplicates
}

function mapDoctorsToRecommendations(doctors: any[], symptoms: string, relevantSpecs: string[]) {
    return doctors.slice(0, 3).map((doctor, index) => {
        // Calculate match score based on specialization overlap
        const doctorSpecs = doctor.specialization || [];
        const matchCount = relevantSpecs.filter(spec => doctorSpecs.includes(spec)).length;
        const matchScore = Math.min(98, 85 + (matchCount * 5) + Math.random() * 3);

        // Find best matching specialization
        const primarySpec = doctorSpecs.find((spec: string) => relevantSpecs.includes(spec)) ||
            doctorSpecs[0] ||
            'General Ayurveda';

        return {
            name: doctor.user?.name || `Dr. ${doctor.qualification}`,
            specialization: primarySpec,
            experience: doctor.years_of_experience || 5,
            fee: Number(doctor.consultation_fee) || 500,
            location: doctor.city && doctor.state
                ? `${doctor.city}, ${doctor.state}`
                : 'India',
            rating: 4.5 + (Math.random() * 0.5),
            matchScore: Math.round(matchScore),
            reason: getReasonForRecommendation(primarySpec, symptoms),
            did: doctor.did, // Include doctor ID for booking
            profile_image_url: doctor.user?.profile_image_url || null, // Include profile image
        };
    }).sort((a, b) => b.matchScore - a.matchScore); // Sort by match score
}

function getReasonForRecommendation(specialization: string, symptoms: string): string {
    const reasons: { [key: string]: string } = {
        'Panchakarma Specialist': 'Panchakarma therapy is highly effective for detoxification, digestive disorders, and chronic pain management',
        'Rasayana (Rejuvenation)': 'Rasayana treatments focus on rejuvenation, stress relief, immunity building, and mental wellness',
        'Kayachikitsa (Internal Medicine)': 'Specializes in internal medicine with a holistic approach to treating various systemic conditions',
        'Shalakya Tantra (ENT & Ophthalmology)': 'Expert in treating ear, nose, throat, and eye-related disorders using Ayurvedic principles',
        'Kaumara Bhritya (Pediatrics)': 'Specialized in child health care, growth, and development using gentle Ayurvedic treatments',
        'Prasuti Tantra (Gynecology & Obstetrics)': 'Focused on women\'s health, reproductive wellness, and pregnancy care through Ayurveda',
        'General Ayurveda': 'Experienced in treating a wide range of conditions with personalized Ayurvedic care',
    };

    return reasons[specialization] || 'Comprehensive Ayurvedic treatment with proven expertise in patient care';
}

function getMockDoctorRecommendations(symptoms: string) {
    const relevantSpecs = analyzeSymptoms(symptoms);

    return [
        {
            name: 'Dr. Rajesh Kumar',
            specialization: relevantSpecs[0] || 'General Ayurveda',
            experience: 15,
            fee: 500,
            location: 'Mumbai, Maharashtra',
            rating: 4.8,
            matchScore: 95,
            reason: getReasonForRecommendation(relevantSpecs[0] || 'General Ayurveda', symptoms),
        },
        {
            name: 'Dr. Priya Sharma',
            specialization: relevantSpecs[1] || 'Kayachikitsa (Internal Medicine)',
            experience: 12,
            fee: 450,
            location: 'Delhi NCR',
            rating: 4.9,
            matchScore: 92,
            reason: getReasonForRecommendation(relevantSpecs[1] || 'Kayachikitsa (Internal Medicine)', symptoms),
        },
        {
            name: 'Dr. Amit Patel',
            specialization: 'General Ayurveda',
            experience: 10,
            fee: 400,
            location: 'Pune, Maharashtra',
            rating: 4.7,
            matchScore: 88,
            reason: getReasonForRecommendation('General Ayurveda', symptoms),
        },
    ];
}
