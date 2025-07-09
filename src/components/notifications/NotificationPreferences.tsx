import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferences {
  id: string;
  user_id: string;
  email: boolean;
  push_notification: boolean;
  in_app: boolean;
  sms: boolean;
  zalo: boolean;
  tournament_level: string;
  challenge_level: string;
  match_level: string;
  ranking_level: string;
  social_level: string;
  quiet_hours_enabled: boolean;
  quiet_start_time: string;
  quiet_end_time: string;
  timezone: string;
}

export const NotificationPreferences = () => {
  const queryClient = useQueryClient();

  // Fetch current preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as NotificationPreferences;
    }
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(updates)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Đã cập nhật cài đặt thông báo');
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast.error('Lỗi khi cập nhật cài đặt');
    }
  });

  const handleChannelToggle = (channel: string, enabled: boolean) => {
    updatePreferencesMutation.mutate({
      [channel]: enabled
    });
  };

  const handleLevelChange = (category: string, level: string) => {
    updatePreferencesMutation.mutate({
      [category]: level
    });
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    updatePreferencesMutation.mutate({
      quiet_hours_enabled: enabled
    });
  };

  const handleTimeChange = (timeType: string, time: string) => {
    updatePreferencesMutation.mutate({
      [timeType]: time
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Cài đặt thông báo
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Kênh thông báo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <Label htmlFor="in-app">Trong ứng dụng</Label>
              </div>
              <Switch
                id="in-app"
                checked={preferences?.in_app ?? true}
                onCheckedChange={(checked) => handleChannelToggle('in_app', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <Label htmlFor="email">Email</Label>
              </div>
              <Switch
                id="email"
                checked={preferences?.email ?? false}
                onCheckedChange={(checked) => handleChannelToggle('email', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-primary" />
                <Label htmlFor="push">Push notification</Label>
              </div>
              <Switch
                id="push"
                checked={preferences?.push_notification ?? false}
                onCheckedChange={(checked) => handleChannelToggle('push_notification', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <Label htmlFor="sms">SMS</Label>
              </div>
              <Switch
                id="sms"
                checked={preferences?.sms ?? false}
                onCheckedChange={(checked) => handleChannelToggle('sms', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Categories */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Mức độ thông báo theo loại</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Giải đấu</Label>
              <Select
                value={preferences?.tournament_level || 'all'}
                onValueChange={(value) => handleLevelChange('tournament_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="important">Quan trọng</SelectItem>
                  <SelectItem value="off">Tắt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Thách đấu</Label>
              <Select
                value={preferences?.challenge_level || 'all'}
                onValueChange={(value) => handleLevelChange('challenge_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="important">Quan trọng</SelectItem>
                  <SelectItem value="off">Tắt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trận đấu</Label>
              <Select
                value={preferences?.match_level || 'all'}
                onValueChange={(value) => handleLevelChange('match_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="important">Quan trọng</SelectItem>
                  <SelectItem value="off">Tắt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Xếp hạng</Label>
              <Select
                value={preferences?.ranking_level || 'all'}
                onValueChange={(value) => handleLevelChange('ranking_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="important">Quan trọng</SelectItem>
                  <SelectItem value="off">Tắt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Giờ yên tĩnh</h3>
            <Switch
              checked={preferences?.quiet_hours_enabled ?? false}
              onCheckedChange={handleQuietHoursToggle}
            />
          </div>

          {preferences?.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Từ</Label>
                <input
                  type="time"
                  value={preferences?.quiet_start_time || '22:00'}
                  onChange={(e) => handleTimeChange('quiet_start_time', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label>Đến</Label>
                <input
                  type="time"
                  value={preferences?.quiet_end_time || '07:00'}
                  onChange={(e) => handleTimeChange('quiet_end_time', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Test Notification */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Kiểm tra</h3>
          <Button
            variant="outline"
            onClick={() => {
              toast.info('Thông báo thử nghiệm', {
                description: 'Đây là thông báo thử nghiệm để kiểm tra cài đặt của bạn.',
                duration: 5000
              });
            }}
          >
            Gửi thông báo thử nghiệm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};