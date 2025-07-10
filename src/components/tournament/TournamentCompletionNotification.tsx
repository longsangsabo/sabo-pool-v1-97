import React, { useEffect } from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface TournamentCompletionNotificationProps {
  tournamentName: string;
  isChampion?: boolean;
  position?: number;
  spaPointsEarned?: number;
  eloChange?: number;
  onClose?: () => void;
}

export const TournamentCompletionNotification: React.FC<TournamentCompletionNotificationProps> = ({
  tournamentName,
  isChampion = false,
  position,
  spaPointsEarned = 0,
  eloChange = 0,
  onClose
}) => {
  useEffect(() => {
    // Show different notifications based on achievement
    if (isChampion) {
      // Confetti for champion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });
      
      toast.success(
        `🏆 Chúc mừng! Bạn đã vô địch giải đấu "${tournamentName}"!`,
        {
          description: `Nhận ${spaPointsEarned} SPA points và ${eloChange > 0 ? '+' : ''}${eloChange} ELO`,
          duration: 10000,
          action: {
            label: 'Xem kết quả',
            onClick: onClose
          }
        }
      );
    } else if (position === 2) {
      toast.success(
        `🥈 Á quân giải đấu "${tournamentName}"!`,
        {
          description: `Nhận ${spaPointsEarned} SPA points và ${eloChange > 0 ? '+' : ''}${eloChange} ELO`,
          duration: 8000
        }
      );
    } else if (position === 3) {
      toast.success(
        `🥉 Hạng 3 giải đấu "${tournamentName}"!`,
        {
          description: `Nhận ${spaPointsEarned} SPA points và ${eloChange > 0 ? '+' : ''}${eloChange} ELO`,
          duration: 6000
        }
      );
    } else {
      toast.info(
        `⚡ Giải đấu "${tournamentName}" đã kết thúc`,
        {
          description: `Nhận ${spaPointsEarned} SPA points và ${eloChange > 0 ? '+' : ''}${eloChange} ELO`,
          duration: 5000
        }
      );
    }
  }, [isChampion, position, tournamentName, spaPointsEarned, eloChange, onClose]);

  return null; // This component only triggers side effects
};

// Hook to show tournament completion notifications
export const useTournamentCompletionNotification = () => {
  const showCompletionNotification = (
    tournamentName: string,
    userResults: {
      isChampion?: boolean;
      position?: number;
      spaPointsEarned?: number;
      eloChange?: number;
    }
  ) => {
    // Create a temporary component to trigger the notification
    const notificationElement = document.createElement('div');
    document.body.appendChild(notificationElement);
    
    // Use React to render the notification component
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(notificationElement);
      root.render(
        React.createElement(TournamentCompletionNotification, {
          tournamentName,
          ...userResults,
          onClose: () => {
            root.unmount();
            document.body.removeChild(notificationElement);
          }
        })
      );
    });
  };

  return { showCompletionNotification };
};

export default TournamentCompletionNotification;