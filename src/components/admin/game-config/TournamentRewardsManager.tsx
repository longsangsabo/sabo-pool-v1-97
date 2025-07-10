import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Trophy,
  Medal,
  Award,
  Crown
} from 'lucide-react';
import { useTournamentRewards } from '@/hooks/useTournamentRewards';

export const TournamentRewardsManager: React.FC = () => {
  const { rewards, loading, createReward, updateReward, deleteReward } = useTournamentRewards();
  const [editingReward, setEditingReward] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    position_name: '',
    tournament_type: 'single_elimination',
    rank_category: 'bronze',
    spa_reward: 100,
    elo_reward: 50,
    additional_rewards: {},
    is_active: true
  });

  const tournamentTypes = [
    { value: 'single_elimination', label: 'Single Elimination', icon: Trophy, color: 'bg-blue-50 text-blue-700' },
    { value: 'double_elimination', label: 'Double Elimination', icon: Medal, color: 'bg-green-50 text-green-700' },
    { value: 'round_robin', label: 'Round Robin', icon: Award, color: 'bg-yellow-50 text-yellow-700' },
    { value: 'swiss', label: 'Swiss System', icon: Crown, color: 'bg-purple-50 text-purple-700' }
  ];

  const handleEdit = (reward: any) => {
    setEditingReward(reward);
    setFormData({
      position_name: reward.position_name,
      tournament_type: reward.tournament_type,
      rank_category: reward.rank_category,
      spa_reward: reward.spa_reward,
      elo_reward: reward.elo_reward,
      additional_rewards: reward.additional_rewards || {},
      is_active: reward.is_active
    });
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        spa_reward: Number(formData.spa_reward),
        elo_reward: Number(formData.elo_reward)
      };

      if (editingReward) {
        await updateReward(editingReward.id, data);
      } else {
        await createReward(data);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving tournament reward:', error);
    }
  };

  const resetForm = () => {
    setEditingReward(null);
    setIsCreating(false);
    setFormData({
      position_name: '',
      tournament_type: 'single_elimination',
      rank_category: 'bronze',
      spa_reward: 100,
      elo_reward: 50,
      additional_rewards: {},
      is_active: true
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa cấu trúc thưởng này?')) {
      await deleteReward(id);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tournament Rewards Management</h2>
          <p className="text-muted-foreground">
            Quản lý cấu trúc thưởng cho các giải đấu theo tier và số người tham gia
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Structure
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingReward) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingReward ? 'Edit Tournament Reward Structure' : 'Create New Tournament Reward Structure'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position_name">Position Name</Label>
                <Input
                  id="position_name"
                  value={formData.position_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, position_name: e.target.value }))}
                  placeholder="e.g., Winner, Runner-up, 3rd Place"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament_type">Tournament Type</Label>
                <select
                  id="tournament_type"
                  value={formData.tournament_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, tournament_type: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {tournamentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank_category">Rank Category</Label>
                <select
                  id="rank_category"
                  value={formData.rank_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, rank_category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="elite">Elite</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spa_reward">SPA Reward</Label>
                <Input
                  id="spa_reward"
                  type="number"
                  value={formData.spa_reward}
                  onChange={(e) => setFormData(prev => ({ ...prev, spa_reward: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="elo_reward">ELO Reward</Label>
                <Input
                  id="elo_reward"
                  type="number"
                  value={formData.elo_reward}
                  onChange={(e) => setFormData(prev => ({ ...prev, elo_reward: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_rewards">Additional Rewards (JSON)</Label>
              <Input
                id="additional_rewards"
                value={JSON.stringify(formData.additional_rewards)}
                onChange={(e) => {
                  try {
                    setFormData(prev => ({ ...prev, additional_rewards: JSON.parse(e.target.value) }));
                  } catch {
                    // Invalid JSON, keep typing
                  }
                }}
                placeholder='{"badge_unlocked": true}'
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" onClick={resetForm} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards List */}
      <div className="grid gap-4">
        {tournamentTypes.map(type => {
          const typeRewards = rewards?.filter(reward => reward.tournament_type === type.value) || [];
          const Icon = type.icon;

          return (
            <Card key={type.value}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${type.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {type.label} Rewards
                  <Badge variant="secondary">{typeRewards.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typeRewards.length > 0 ? (
                  <div className="space-y-3">
                    {typeRewards.map(reward => (
                      <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{reward.position_name}</span>
                            {!reward.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Category: {reward.rank_category} | SPA: {reward.spa_reward} | ELO: {reward.elo_reward}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Additional: {JSON.stringify(reward.additional_rewards || {})}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(reward)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(reward.id)}
                            className="gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No {type.label.toLowerCase()} rewards configured
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};