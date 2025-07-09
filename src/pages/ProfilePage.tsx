import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/contexts/AvatarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, MapPin, User, Phone, Calendar, Trophy, Save, RotateCcw, Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileHeader from '@/components/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import BasicProfileTab from '@/components/profile/BasicProfileTab';
import PerformanceTab from '@/components/profile/PerformanceTab';
import ActivitiesTab from '@/components/profile/ActivitiesTab';
import ClubManagementTab from '@/components/profile/ClubManagementTab';
import { isAdminUser } from '@/utils/adminHelpers';

// Export types for other components
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  cover_image_url?: string;
  bio?: string;
  location?: string;
  rank: string;
  rating: number;
  join_date: Date;
  is_verified: boolean;
  is_online: boolean;
  last_seen: Date;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_earnings: number;
  achievements_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_friend: boolean;
  privacy_level: 'public' | 'friends' | 'private';
  notifications_enabled: boolean;
}

export interface ProfilePost {
  id: string;
  type: 'post' | 'achievement' | 'match_result' | 'event';
  content: string;
  created_at: Date;
  likes_count: number;
  comments_count: number;
  images?: string[];
  achievement?: {
    title: string;
    description: string;
    icon: string;
    points: number;
  };
  match_result?: {
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    score: string;
    rating_change: number;
  };
  event?: {
    title: string;
    date: Date;
    location: string;
  };
}

interface ProfileData {
  user_id: string;
  display_name: string;
  phone: string;
  bio: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  city: string;
  district: string;
  avatar_url: string;
  member_since: string;
  role: 'player' | 'club_owner' | 'both';
  active_role: 'player' | 'club_owner';
  verified_rank: string | null;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const { avatarUrl, updateAvatar } = useAvatar();
  const [profile, setProfile] = useState<ProfileData>({
    user_id: '',
    display_name: '',
    phone: '',
    bio: '',
    skill_level: 'beginner',
    city: '',
    district: '',
    avatar_url: '',
    member_since: '',
    role: 'player',
    active_role: 'player',
    verified_rank: null,
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileData>({
    user_id: '',
    display_name: '',
    phone: '',
    bio: '',
    skill_level: 'beginner',
    city: '',
    district: '',
    avatar_url: '',
    member_since: '',
    role: 'player',
    active_role: 'player',
    verified_rank: null,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const skillLevels = {
    beginner: { label: 'Người mới', color: 'bg-green-100 text-green-800' },
    intermediate: { label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
    advanced: { label: 'Khá', color: 'bg-purple-100 text-purple-800' },
    pro: { label: 'Chuyên nghiệp', color: 'bg-gold-100 text-gold-800' },
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Track changes to enable/disable update button
  useEffect(() => {
    const hasProfileChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    setHasChanges(hasProfileChanges);
  }, [profile, originalProfile]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        const profileData = {
          user_id: data.user_id || user.id,
          display_name: data.display_name || data.full_name || '',
          phone: data.phone || user.phone || '',
          bio: data.bio || '',
          skill_level: (data.skill_level || 'beginner') as 'beginner' | 'intermediate' | 'advanced' | 'pro',
          city: data.city || '',
          district: data.district || '',
          avatar_url: data.avatar_url || '',
          member_since: data.member_since || data.created_at || '',
          role: (data.role || 'player') as 'player' | 'club_owner' | 'both',
          active_role: (data.active_role || 'player') as 'player' | 'club_owner',
          verified_rank: data.verified_rank || null,
        };
        setProfile(profileData);
        setOriginalProfile(profileData);

        // Update admin status if needed for existing users
        const shouldBeAdmin = isAdminUser(user.email, data.phone);
        if (shouldBeAdmin && !data.is_admin) {
          await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('user_id', user.id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (field: string, value: string) => {
    if (!user) return;

    try {
      const updateData = { [field]: value };
      if (field === 'display_name') {
        updateData.full_name = value; // Also update full_name for compatibility
      }

      // Try update first, if no rows affected then insert
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // If no rows were updated (profile doesn't exist), create new profile
      if (!updateResult || updateResult.length === 0) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...updateData,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      toast.success('Đã lưu thay đổi!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message.includes('duplicate key')) {
        toast.error('❌ Lỗi: Hồ sơ đã tồn tại. Vui lòng tải lại trang và thử lại.');
      } else {
        toast.error('Lỗi khi lưu: ' + error.message);
      }
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    if (profile[field as keyof ProfileData] !== value) {
      updateProfile(field, value);
    }
  };

  // Update all profile information at once
  const updateAllProfile = async () => {
    if (!user || !hasChanges) return;

    setUpdating(true);
    try {
      const updateData = {
        display_name: profile.display_name,
        full_name: profile.display_name, // For compatibility
        phone: profile.phone,
        bio: profile.bio,
        skill_level: profile.skill_level,
        city: profile.city,
        district: profile.district,
      };

      // Try update first, if no rows affected then insert
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // If no rows were updated (profile doesn't exist), create new profile
      if (!updateResult || updateResult.length === 0) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...updateData,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      // Update original profile to match current
      setOriginalProfile(profile);
      toast.success('🎉 Đã cập nhật thông tin thành công!');
    } catch (error: any) {
      console.error('Error updating all profile:', error);
      if (error.message.includes('duplicate key')) {
        toast.error('❌ Lỗi: Hồ sơ đã tồn tại. Vui lòng tải lại trang và thử lại.');
      } else {
        toast.error('❌ Lỗi khi cập nhật: ' + error.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  // Reset changes to original values
  const resetChanges = () => {
    setProfile(originalProfile);
    toast.info('Đã hủy thay đổi');
  };

  // Function to compress image by cropping to square
  const compressImage = (file: File, maxSizeKB: number = 500): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Set target size (square)
        const targetSize = 400;
        canvas.width = targetSize;
        canvas.height = targetSize;
        
        // Calculate crop dimensions (center crop to square)
        const { width, height } = img;
        const size = Math.min(width, height);
        const offsetX = (width - size) / 2;
        const offsetY = (height - size) / 2;
        
        // Draw cropped and resized image
        ctx.drawImage(
          img,
          offsetX, offsetY, size, size, // Source crop
          0, 0, targetSize, targetSize // Destination
        );
        
        // Try different quality levels until we get under maxSizeKB
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (blob && (blob.size <= maxSizeKB * 1024 || quality <= 0.1)) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          }, 'image/jpeg', quality);
        };
        
        tryCompress();
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    setUploading(true);

    try {
      // Compress image if it's larger than 500KB
      let uploadFile = file;
      if (file.size > 500 * 1024) {
        toast.info('Đang nén ảnh để tối ưu...');
        uploadFile = await compressImage(file);
      }

      const fileExt = 'jpg'; // Always use jpg after compression
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl + '?t=' + new Date().getTime(); // Add timestamp to force refresh

      // Update profiles table
      await updateProfile('avatar_url', avatarUrl);
      
      // Update user metadata to sync with header
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });

      if (updateUserError) {
        console.error('Error updating user metadata:', updateUserError);
      }

      // Update local state and context
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      updateAvatar(avatarUrl);

      toast.success('Đã cập nhật ảnh đại diện thành công!');

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Lỗi khi tải ảnh: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin của bạn</p>
        </div>

        {/* Profile Header with Stats */}
        <ProfileHeader 
          profile={profile}
          avatarUrl={avatarUrl}
          uploading={uploading}
          onAvatarUpload={handleAvatarUpload}
          skillLevels={skillLevels}
        />

        {/* New Profile Tabs */}
        <ProfileTabs
          activeTab="basic"
          onTabChange={() => {}}
          userRole={profile.role}
        >
          <TabsContent value="basic">
            <BasicProfileTab
              profile={profile}
              setProfile={setProfile}
              hasChanges={hasChanges}
              updating={updating}
              onUpdateAll={updateAllProfile}
              onReset={resetChanges}
              onFieldBlur={handleFieldBlur}
              skillLevels={skillLevels}
            />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceTab />
          </TabsContent>

          <TabsContent value="activities">
            <ActivitiesTab />
          </TabsContent>

          {(profile.role === 'club_owner' || profile.role === 'both') && (
            <TabsContent value="club">
              <ClubManagementTab userRole={profile.role} />
            </TabsContent>
          )}
        </ProfileTabs>
      </div>
    </div>
  );
};

export default ProfilePage;