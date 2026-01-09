'use client';

import { useEffect, useState } from 'react';

export default function PatientProfilePicture({ uid }: { uid?: string }) {
  const [profileImage, setProfileImage] = useState<string>('');

  useEffect(() => {
    if (uid) {
      fetchProfileImage();
    }
  }, [uid]);

  async function fetchProfileImage() {
    try {
      const response = await fetch('/api/sync-user');
      const { user } = await response.json();
      
      if (user?.profile_image_url) {
        setProfileImage(user.profile_image_url);
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  }

  if (!profileImage) return null;

  return (
    <img
      src={profileImage}
      alt="Profile"
      className="w-full h-full object-cover"
    />
  );
}
