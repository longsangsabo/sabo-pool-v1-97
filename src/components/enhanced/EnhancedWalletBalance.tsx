import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface WalletData {
  balance: number;
  total_earned: number;
  total_spent: number;
}

interface RecentTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

// Skeleton component for loading state
const WalletSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <Skeleton className="w-5 h-5 mr-2" />
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center mb-3">
          <Skeleton className="w-4 h-4 mr-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const EnhancedWalletBalance: React.FC = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    total_earned: 0,
    total_spent: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching wallet data for user:', user.id);

        // Show skeleton for minimum 500ms for better perceived performance
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 500));

        // Fetch wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, points_balance, total_earned, total_spent')
          .eq('user_id', user.id)
          .single();

        if (walletError && walletError.code !== 'PGRST116') {
          console.error('Error fetching wallet:', walletError);
        } else if (walletData) {
          setWalletData({
            balance: walletData.points_balance || 0,
            total_earned: walletData.total_earned || 0,
            total_spent: walletData.total_spent || 0
          });
        }

        // Fetch recent transactions via wallet_id
        if (walletData?.id) {
          const { data: transactions, error: transError } = await supabase
            .from('wallet_transactions')
            .select('id, points_amount, transaction_type, description, created_at')
            .eq('wallet_id', walletData.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (transError) {
            console.error('Error fetching transactions:', transError);
          } else {
            // Map points_amount to amount for component consistency
            const mappedTransactions = (transactions || []).map(t => ({
              ...t,
              amount: t.points_amount
            }));
            setRecentTransactions(mappedTransactions);
          }
        }

        // Wait for minimum load time before showing content
        await minLoadTime;
        setDataLoaded(true);
        
        // Small delay for smooth transition
        setTimeout(() => setLoading(false), 100);

      } catch (error) {
        console.error('Error fetching wallet data:', error);
        setLoading(false);
      }
    };

    fetchWalletData();

    // Set up real-time subscription
    const channel = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Wallet updated via realtime:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            if ('points_balance' in newData) {
              setWalletData(prev => ({
                ...prev,
                balance: newData.points_balance as number,
                total_earned: (newData.total_earned as number) || prev.total_earned,
                total_spent: (newData.total_spent as number) || prev.total_spent
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading || !dataLoaded) {
    return <WalletSkeleton />;
  }

  return (
    <div className="animate-fade-in">
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coins className="w-5 h-5 mr-2 text-primary" />
            Ví SPA Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Current Balance */}
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl font-bold text-green-700 animate-scale-in">{walletData.balance}</div>
              <div className="text-sm text-green-600">Số dư hiện tại</div>
            </div>

            {/* Total Earned */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl font-bold text-blue-700 animate-scale-in">{walletData.total_earned}</div>
              <div className="text-sm text-blue-600">Tổng đã kiếm</div>
            </div>

            {/* Total Spent */}
            <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg transition-all duration-300 hover:scale-105">
              <div className="text-2xl font-bold text-orange-700 animate-scale-in">{walletData.total_spent}</div>
              <div className="text-sm text-orange-600">Tổng đã chi</div>
            </div>
          </div>

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <h4 className="font-semibold mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Giao dịch gần đây
              </h4>
              <div className="space-y-2">
                {recentTransactions.map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-2 bg-gray-50 rounded transition-all duration-200 hover:bg-gray-100 animate-slide-in-right"
                    style={{ animationDelay: `${index * 100 + 300}ms` }}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{transaction.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div className={`flex items-center ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 mr-1 rotate-45" />
                      )}
                      <span className="font-medium">
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentTransactions.length === 0 && (
            <div className="text-center py-4 text-gray-500 animate-fade-in">
              <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chưa có giao dịch nào</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedWalletBalance;