import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Trophy,
  Target,
  Zap,
  Star
} from 'lucide-react';
import { useSPARewards } from '@/hooks/useSPARewards';

export const SPARewardsManager: React.FC = () => {
  const { rewards, loading, createReward, updateReward, deleteReward } = useSPARewards();
  const [editingReward, setEditingReward] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    milestone_name: '',
    milestone_type: 'matches_won',
    requirement_value: 0,
    spa_reward: 0,
    bonus_conditions: {},
    is_active: true,
    is_repeatable: false
  });

  const milestoneTypes = [
    { value: 'matches_won', label: 'Matches Won', icon: Trophy, color: 'bg-green-50 text-green-700' },
    { value: 'win_streak', label: 'Win Streak', icon: Zap, color: 'bg-yellow-50 text-yellow-700' },
    { value: 'total_matches', label: 'Total Matches', icon: Target, color: 'bg-blue-50 text-blue-700' },
    { value: 'elo_achievement', label: 'ELO Achievement', icon: Star, color: 'bg-purple-50 text-purple-700' }
  ];

  const handleEdit = (reward: any) => {
    setEditingReward(reward);
    setFormData({
      milestone_name: reward.milestone_name,
      milestone_type: reward.milestone_type,
      requirement_value: reward.requirement_value,
      spa_reward: reward.spa_reward,
      bonus_conditions: reward.bonus_conditions || {},
      is_active: reward.is_active,
      is_repeatable: reward.is_repeatable
    });
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        requirement_value: Number(formData.requirement_value),
        spa_reward: Number(formData.spa_reward)
      };

      if (editingReward) {
        await updateReward(editingReward.id, data);
      } else {
        await createReward(data);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving reward:', error);
    }
  };

  const resetForm = () => {
    setEditingReward(null);
    setIsCreating(false);
    setFormData({
      milestone_name: '',
      milestone_type: 'matches_won',
      requirement_value: 0,
      spa_reward: 0,
      bonus_conditions: {},
      is_active: true,
      is_repeatable: false
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa milestone này?')) {
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
          <h2 className="text-2xl font-bold">SPA Rewards Management</h2>
          <p className="text-muted-foreground">
            Quản lý các cột mốc và phần thưởng SPA points cho người chơi
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingReward) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingReward ? 'Edit SPA Milestone' : 'Create New SPA Milestone'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="milestone_name">Milestone Name</Label>
                <Input
                  id="milestone_name"
                  value={formData.milestone_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, milestone_name: e.target.value }))}
                  placeholder="e.g., First Victory"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="milestone_type">Milestone Type</Label>
                <select
                  id="milestone_type"
                  value={formData.milestone_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, milestone_type: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {milestoneTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirement_value">Requirement Value</Label>
                <Input
                  id="requirement_value"
                  type="number"
                  value={formData.requirement_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirement_value: parseInt(e.target.value) }))}
                />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus_conditions">Bonus Conditions (JSON)</Label>
              <Textarea
                id="bonus_conditions"
                value={JSON.stringify(formData.bonus_conditions, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData(prev => ({ ...prev, bonus_conditions: JSON.parse(e.target.value) }));
                  } catch {
                    // Invalid JSON, keep typing
                  }
                }}
                rows={3}
                placeholder='{"min_elo": 1200}'
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_repeatable"
                  checked={formData.is_repeatable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_repeatable: checked }))}
                />
                <Label htmlFor="is_repeatable">Repeatable</Label>
              </div>
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
        {milestoneTypes.map(type => {
          const typeRewards = rewards?.filter(reward => reward.milestone_type === type.value) || [];
          const Icon = type.icon;

          return (
            <Card key={type.value}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${type.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {type.label} Milestones
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
                            <span className="font-medium">{reward.milestone_name}</span>
                            {!reward.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {reward.is_repeatable && (
                              <Badge variant="outline">Repeatable</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Requirement: {reward.requirement_value} | Reward: {reward.spa_reward} SPA points
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Conditions: {JSON.stringify(reward.bonus_conditions || {})}
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
                    No {type.label.toLowerCase()} milestones configured
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