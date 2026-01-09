## ✨ Features

### 🔍 Core Patient Features
- **AI-Powered Doctor Search**: Find Ayurvedic doctors using Gemini AI and GROQ SDK
- **Smart Recommendations**: Get personalized doctor recommendations based on symptoms
- **Appointment Booking**: Book online (video) or offline (in-person) appointments
- **Video Consultations**: HD video calls with doctors using ZegoCloud
- **Prescription Management**: View and track all your prescriptions
- **Medication Tracking**: Monitor medication adherence with reminders
- **Health Progress**: Track your health journey with visual dashboards
- **Payment Integration**: Secure payments via Razorpay
- **Multi-language Support**: English and Hindi with i18n
- **Real-time Notifications**: Instant updates on appointments and prescriptions

### 🌐 Technical Features
- **Progressive Web App (PWA)**: Install on mobile/desktop, offline support
- **Responsive Design**: Seamless experience on all devices
- **Secure Authentication**: Kinde Auth with JWT tokens
- **End-to-End Encryption**: Medical data encryption with libsodium
- **Real-time Updates**: Supabase real-time subscriptions
- **Server-Side Rendering**: Fast page loads with Next.js 14
- **Type Safety**: Full TypeScript coverage
- **Shared Library Integration**: Uses `@aurasutra/shared-lib` for consistency

### Frontend
- **Framework**: Next.js 14.0.4
- **Language**: TypeScript 5.3.3
- **Styling**: TailwindCSS 3.4.0
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend & Services
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Kinde Auth
- **AI/ML**: 
  - Google Gemini AI (doctor search)
  - GROQ SDK (inference)
- **Video**: ZegoCloud WebRTC
- **Payments**: Razorpay
- **Storage**: Appwrite
- **Monitoring**: Sentry

### Development
- **Testing**: Jest + Playwright
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Database**: Supabase CLI

## 📖 Usage Guide

### Patient Registration Flow
```
1. Visit http://localhost:3000
2. Click "Sign Up" → Register via Kinde
3. Complete profile information
4. Access patient dashboard
```

### Booking an Appointment
```
1. Go to "Find Doctors" or use AI Search
2. Browse doctor profiles
3. Click "Book Appointment"
4. Fill booking form:
   - Select appointment type (online/offline)
   - Choose date and time
   - Add symptoms/reason
5. Make payment (if required)
6. Receive confirmation
```

### Video Consultation
```
1. Go to "My Appointments"
2. Find confirmed appointment
3. Click "Join Video Call" (15 min before)
4. Allow camera/microphone permissions
5. Wait for doctor to join
6. Consult with doctor
7. Receive prescription after call
```

### Viewing Prescriptions
```
1. Navigate to "Prescriptions"
2. View all prescriptions
3. Download PDF
4. Track medication adherence
5. click on "taken" or "skipped" to update medication adherence
```