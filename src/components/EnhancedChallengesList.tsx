import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useEnhancedChallenges } from '@/hooks/useEnhancedChallenges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserAvatar from './UserAvatar';
import ChallengeResponseModal from './ChallengeResponseModal';
import { Challenge, ChallengeProposal } from '@/types/common';

const EnhancedChallengesList = () => {
  const {
    receivedChallenges,
    sentChallenges,
    loadingReceived,
    loadingSent,
    respondToChallenge,
    acceptChallenge,
    declineChallenge,
  } = useEnhancedChallenges();

  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ phản hồi';
      case 'accepted':
        return 'Đã chấp nhận';
      case 'declined':
        return 'Đã từ chối';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Hoàn thành';
      default:
        return 'Không xác định';
    }
  };

  const handleRespond = async (
    status: 'accepted' | 'declined',
    message?: string
  ) => {
    if (!selectedChallenge) return;

    try {
      await respondToChallenge.mutateAsync({
        challengeId: selectedChallenge.id,
        status,
        message,
      });
      setShowResponseModal(false);
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Error responding to challenge:', error);
    }
  };

  const handleAccept = async (challengeId: string) => {
    try {
      await acceptChallenge(challengeId);
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const handleDecline = async (challengeId: string) => {
    try {
      await declineChallenge(challengeId);
    } catch (error) {
      console.error('Error declining challenge:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-4'>
      <Tabs defaultValue='received' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='received'>
            Nhận được ({receivedChallenges.length})
          </TabsTrigger>
          <TabsTrigger value='sent'>
            Đã gửi ({sentChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='received' className='space-y-4'>
          {loadingReceived ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
              <p className='text-gray-500'>Đang tải...</p>
            </div>
          ) : receivedChallenges.length === 0 ? (
            <Card>
              <CardContent className='p-6 text-center'>
                <Trophy className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Chưa có thách đấu nào</p>
              </CardContent>
            </Card>
          ) : (
            receivedChallenges.map(challenge => (
              <Card key={challenge.id} className='overflow-hidden'>
                <CardHeader className='pb-3'>
                  <div className='flex justify-between items-start'>
                    <div className='flex items-center space-x-3'>
                      <UserAvatar
                        user={{
                          name: challenge.challenger.full_name,
                          avatar:
                            challenge.challenger.avatar_url ||
                            '/placeholder.svg',
                          rank: challenge.challenger.current_rank,
                        }}
                        size='md'
                      />
                      <div>
                        <CardTitle className='text-lg'>
                          {challenge.challenger.full_name}
                        </CardTitle>
                        <p className='text-sm text-gray-600'>
                          Hạng: {challenge.challenger.current_rank}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(challenge.status)}>
                      {getStatusText(challenge.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className='space-y-4'>
                  {/* Challenge Details */}
                  <div className='bg-blue-50 rounded-lg p-3'>
                    <div className='flex justify-between items-center mb-2'>
                      <span className='text-sm font-semibold'>Mức cược:</span>
                      <span className='font-bold text-blue-600'>
                        {challenge.bet_points} điểm
                      </span>
                    </div>
                    {challenge.message && (
                      <div>
                        <span className='text-sm font-semibold'>Lời nhắn:</span>
                        <p className='text-sm mt-1 italic'>
                          "{challenge.message}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Proposed Match Details */}
                  {challenge.status === 'accepted' &&
                    challenge.proposed_datetime && (
                      <div className='bg-green-50 rounded-lg p-3'>
                        <div className='flex items-center space-x-2 mb-2'>
                          <Calendar className='w-4 h-4 text-green-600' />
                          <span className='text-sm font-semibold text-green-800'>
                            Lịch đề xuất
                          </span>
                        </div>
                        <p className='text-sm text-green-700'>
                          {formatDateTime(challenge.proposed_datetime)}
                        </p>
                      </div>
                    )}

                  {/* Action Buttons */}
                  {challenge.status === 'pending' && (
                    <div className='flex space-x-2'>
                      <Button
                        size='sm'
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          setShowResponseModal(true);
                        }}
                        className='flex-1 bg-green-500 hover:bg-green-600'
                      >
                        <CheckCircle className='w-4 h-4 mr-2' />
                        Chấp nhận
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleRespond('declined')}
                        className='flex-1 text-red-600 border-red-300 hover:bg-red-50'
                      >
                        <XCircle className='w-4 h-4 mr-2' />
                        Từ chối
                      </Button>
                    </div>
                  )}

                  {challenge.status === 'accepted' && (
                    <Button
                      size='sm'
                      onClick={() => handleAccept(challenge.id)}
                      className='w-full bg-blue-500 hover:bg-blue-600'
                    >
                      <CheckCircle className='w-4 h-4 mr-2' />
                      Xác nhận trận đấu
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value='sent' className='space-y-4'>
          {loadingSent ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
              <p className='text-gray-500'>Đang tải...</p>
            </div>
          ) : sentChallenges.length === 0 ? (
            <Card>
              <CardContent className='p-6 text-center'>
                <Trophy className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Chưa gửi thách đấu nào</p>
              </CardContent>
            </Card>
          ) : (
            sentChallenges.map(challenge => (
              <Card key={challenge.id} className='overflow-hidden'>
                <CardHeader className='pb-3'>
                  <div className='flex justify-between items-start'>
                    <div className='flex items-center space-x-3'>
                      <UserAvatar
                        user={{
                          name: challenge.challenged.full_name,
                          avatar:
                            challenge.challenged.avatar_url ||
                            '/placeholder.svg',
                          rank: challenge.challenged.current_rank,
                        }}
                        size='md'
                      />
                      <div>
                        <CardTitle className='text-lg'>
                          {challenge.challenged.full_name}
                        </CardTitle>
                        <p className='text-sm text-gray-600'>
                          Hạng: {challenge.challenged.current_rank}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(challenge.status)}>
                      {getStatusText(challenge.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <div className='flex justify-between items-center mb-2'>
                      <span className='text-sm font-semibold'>Mức cược:</span>
                      <span className='font-bold text-blue-600'>
                        {challenge.bet_points} điểm
                      </span>
                    </div>
                    {challenge.message && (
                      <div>
                        <span className='text-sm font-semibold'>Lời nhắn:</span>
                        <p className='text-sm mt-1 italic'>
                          "{challenge.message}"
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Challenge Response Modal */}
      <ChallengeResponseModal
        challenge={selectedChallenge}
        suggestedClubs={[]}
        isOpen={showResponseModal}
        onClose={() => {
          setShowResponseModal(false);
          setSelectedChallenge(null);
        }}
        onRespond={(status: 'accepted' | 'declined', proposalData?: ChallengeProposal) => 
          handleRespond(status, proposalData?.message)
        }
      />
    </div>
  );
};

export default EnhancedChallengesList;
