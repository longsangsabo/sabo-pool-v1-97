import React from 'react';
import { TournamentRewards } from './TournamentRewards';
import { TournamentRewards as TournamentRewardsType } from '@/types/tournament-extended';
import { RankCode } from '@/utils/eloConstants';

interface TournamentRewardsTableProps {
  rewards: TournamentRewardsType;
  rank?: RankCode;
  showElo?: boolean;
  showSpa?: boolean;
  className?: string;
  entryFee?: number;
  maxParticipants?: number;
  onEdit?: () => void;
  isEditable?: boolean;
}

export const TournamentRewardsTable: React.FC<TournamentRewardsTableProps> = (props) => {
  return <TournamentRewards {...props} />;
};