import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, Clock, CheckCircle, XCircle, AlertTriangle, Upload } from 'lucide-react';
import RankTestModal from './RankTestModal';
import RankInfo from './RankInfo';
import { getRankInfo } from '@/utils/rankDefinitions';

interface VerificationRequest {
  id: string;
  player_id: string;
  requested_rank: string;
  status: string;
  created_at: string;
  test_result: string | null;
  club_notes: string | null;
  proof_photos: string[] | null;
  profiles?: {
    display_name?: string;
    full_name?: string;
    phone?: string;
  } | null;
}

const RankVerificationRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      // Get club profile first
      const { data: clubData, error: clubError } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clubError || !clubData) {
        console.log('No club profile found for user:', user.id);
        setLoading(false);
        return;
      }

      // Get verification requests for this club with profile information
      const { data, error } = await supabase
        .from('rank_verifications')
        .select('*')
        .eq('club_id', clubData.id)
        .in('status', ['pending', 'testing'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rank verifications:', error);
        throw error;
      }

      // Get profile information separately for each request
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone, display_name')
            .eq('user_id', request.player_id)
            .single();
          
          return {
            ...request,
            profiles: profile
          };
        })
      );

      setRequests(requestsWithProfiles || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Lỗi khi tải danh sách yêu cầu xác thực hạng');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'testing') => {
    if (processing === requestId) return; // Prevent double processing
    
    setProcessing(requestId);

    try {
      // Use the new database function to avoid ambiguous column reference issues
      const { data, error } = await supabase.rpc('update_rank_verification_simple', {
        verification_id: requestId,
        new_status: status,
        verifier_id: user?.id
      });

      if (error) {
        console.error('Error updating rank verification:', error);
        throw error;
      }

      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        console.error('Database function error:', (data as any).error);
        throw new Error((data as any).error);
      }

      toast.success('Đã chuyển sang trạng thái test');
      await fetchRequests();
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error(`Lỗi khi cập nhật: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteTest = async (requestId: string, status: 'approved' | 'rejected', testResult: any) => {
    if (processing === requestId) return; // Prevent double processing
    
    setProcessing(requestId);

    try {
      // Validate required data
      if (!testResult.notes?.trim()) {
        toast.error('Vui lòng nhập ghi chú chi tiết về kết quả test');
        setProcessing(null);
        return;
      }

      const updateData: any = {
        status,
        club_notes: testResult.notes,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        test_result: JSON.stringify({
          duration: testResult.testDuration || 0,
          score: testResult.testScore || 0,
          skillLevel: testResult.skillLevel || 'average',
          checklist: testResult.checklist || {},
          proofPhotos: testResult.proofPhotos || []
        })
      };

      if (status === 'rejected') {
        updateData.rejection_reason = testResult.notes;
      }

      // Update rank verification record
      const { error: verificationError } = await supabase
        .from('rank_verifications')
        .update(updateData)
        .eq('id', requestId);

      if (verificationError) {
        console.error('Error updating rank verification:', verificationError);
        throw verificationError;
      }

      // If approved, update player's verified rank and create feed post
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              verified_rank: request.requested_rank,
              rank_verified_at: new Date().toISOString(),
              rank_verified_by: user?.id
            })
            .eq('user_id', request.player_id);

          if (profileError) {
            console.error('Error updating profile rank:', profileError);
            // Don't throw here, just log the error
            toast.error('Cập nhật hạng thành công nhưng có lỗi khi cập nhật profile người chơi');
          } else {
            // Create a feed post about the rank verification
            try {
              // Get club info
              const { data: clubData } = await supabase
                .from('club_profiles')
                .select('id, club_name')
                .eq('user_id', user?.id)
                .single();

              // Get player name
              const playerName = request.profiles?.display_name || request.profiles?.full_name || 'Một player';
              const clubName = clubData?.club_name || 'Câu lạc bộ';
              const rankInfo = getRankInfo(request.requested_rank);

              const postContent = `🎉 Chúc mừng ${playerName} đã được ${clubName} chính thức xác nhận hạng ${rankInfo.name}!\n\n✨ ${rankInfo.description}\n\n#RankVerification #${request.requested_rank} #SABOPOOL`;

              await supabase
                .from('posts')
                .insert({
                  user_id: request.player_id, // Post as the player
                  content: postContent,
                  post_type: 'achievement',
                  metadata: {
                    type: 'rank_verification',
                    rank: request.requested_rank,
                    club_id: clubData?.id || null,
                    club_name: clubName,
                    verified_by: user?.id
                  }
                });

              console.log('Feed post created for rank verification');
            } catch (postError) {
              console.error('Error creating feed post:', postError);
              // Don't block the main flow, just log the error
            }
          }
        }
      }

      toast.success(`Đã ${status === 'approved' ? 'chấp nhận' : 'từ chối'} yêu cầu xác thực hạng`);
      
      // Refresh the requests list
      await fetchRequests();
      
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error(`Lỗi khi xử lý yêu cầu: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã duyệt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Từ chối
          </Badge>
        );
      case 'testing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Đang test
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Chờ xử lý
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Đang tải yêu cầu...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Yêu cầu xác thực hạng ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Chưa có yêu cầu xác thực nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Lưu ý quan trọng:</strong> Xác thực sai quá nhiều sẽ ảnh hưởng đến uy tín câu lạc bộ. 
                  Hãy test kỹ trước khi duyệt!
                </div>
              </div>
            </div>

            {requests.map(request => {
              const rankInfo = getRankInfo(request.requested_rank);
              
              return (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {request.profiles?.display_name || request.profiles?.full_name || `Player ${request.player_id}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Muốn xác thực {rankInfo.name}
                      </p>
                      {request.profiles?.phone && (
                        <p className="text-xs text-muted-foreground">
                          SĐT: {request.profiles.phone}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {rankInfo.description}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(request.status)}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="space-y-3">
                       <RankTestModal
                         request={{
                           id: request.id,
                           player_id: request.player_id,
                           requested_rank: request.requested_rank,
                           status: request.status,
                           profiles: request.profiles ? {
                             full_name: request.profiles.full_name || '',
                             phone: request.profiles.phone || ''
                           } : undefined
                         }}
                         onStartTest={(id) => handleStatusUpdate(id, 'testing')}
                         onCompleteTest={handleCompleteTest}
                         processing={processing === request.id}
                       />
                    </div>
                  )}

                  {request.status === 'testing' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <p className="font-medium text-blue-800">Đang trong quá trình test</p>
                          <p className="text-sm text-blue-600 mt-1">
                            Vui lòng hoàn thành test để cập nhật kết quả
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TestingActionsProps {
  request: VerificationRequest;
  onUpdate: (id: string, status: 'approved' | 'rejected', notes?: string) => void;
  processing: boolean;
}

const TestingActions = ({ request, onUpdate, processing }: TestingActionsProps) => {
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-3 mt-3">
      <Textarea
        placeholder="Ghi chú về kết quả test (bắt buộc)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[80px]"
      />
      
      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={() => onUpdate(request.id, 'approved', notes)}
          disabled={processing || !notes.trim()}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Duyệt hạng
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdate(request.id, 'rejected', notes)}
          disabled={processing || !notes.trim()}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Từ chối
        </Button>
      </div>
    </div>
  );
};

export default RankVerificationRequests;