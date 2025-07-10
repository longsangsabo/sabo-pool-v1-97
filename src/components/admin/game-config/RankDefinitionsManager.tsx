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
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useRankDefinitions } from '@/hooks/useRankDefinitions';

export const RankDefinitionsManager: React.FC = () => {
  const { ranks, loading, createRank, updateRank, deleteRank, reorderRanks } = useRankDefinitions();
  const [editingRank, setEditingRank] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    rank_code: '',
    rank_name: '',
    elo_requirement: 1000,
    spa_requirement: 0,
    match_requirement: 0,
    rank_order: 1,
    rank_color: '#64748b',
    rank_description: '',
    is_active: true
  });

  const handleEdit = (rank: any) => {
    setEditingRank(rank);
    setFormData({
      rank_code: rank.rank_code,
      rank_name: rank.rank_name,
      elo_requirement: rank.elo_requirement,
      spa_requirement: rank.spa_requirement || 0,
      match_requirement: rank.match_requirement || 0,
      rank_order: rank.rank_order,
      rank_color: rank.rank_color || '#64748b',
      rank_description: rank.rank_description || '',
      is_active: rank.is_active
    });
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        elo_requirement: Number(formData.elo_requirement),
        spa_requirement: Number(formData.spa_requirement),
        match_requirement: Number(formData.match_requirement),
        rank_order: Number(formData.rank_order)
      };

      if (editingRank) {
        await updateRank(editingRank.id, data);
      } else {
        await createRank(data);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving rank:', error);
    }
  };

  const resetForm = () => {
    setEditingRank(null);
    setIsCreating(false);
    setFormData({
      rank_code: '',
      rank_name: '',
      elo_requirement: 1000,
      spa_requirement: 0,
      match_requirement: 0,
      rank_order: 1,
      rank_color: '#64748b',
      rank_description: '',
      is_active: true
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa rank này?')) {
      await deleteRank(id);
    }
  };

  const handleMoveUp = async (rank: any) => {
    if (rank.rank_order > 1) {
      await reorderRanks(rank.id, rank.rank_order - 1);
    }
  };

  const handleMoveDown = async (rank: any) => {
    const maxOrder = Math.max(...(ranks?.map(r => r.rank_order) || [0]));
    if (rank.rank_order < maxOrder) {
      await reorderRanks(rank.id, rank.rank_order + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sortedRanks = ranks?.sort((a, b) => a.rank_order - b.rank_order) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rank Definitions</h2>
          <p className="text-muted-foreground">
            Quản lý các hạng từ K đến E+ và yêu cầu thăng hạng
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rank
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingRank) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRank ? 'Edit Rank' : 'Create New Rank'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rank_code">Rank Code</Label>
                <Input
                  id="rank_code"
                  value={formData.rank_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, rank_code: e.target.value }))}
                  placeholder="e.g., K, K+, I"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank_name">Rank Name</Label>
                <Input
                  id="rank_name"
                  value={formData.rank_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, rank_name: e.target.value }))}
                  placeholder="e.g., Hạng K"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank_order">Order</Label>
                <Input
                  id="rank_order"
                  type="number"
                  value={formData.rank_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, rank_order: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="elo_requirement">ELO Requirement</Label>
                <Input
                  id="elo_requirement"
                  type="number"
                  value={formData.elo_requirement}
                  onChange={(e) => setFormData(prev => ({ ...prev, elo_requirement: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spa_requirement">SPA Requirement</Label>
                <Input
                  id="spa_requirement"
                  type="number"
                  value={formData.spa_requirement}
                  onChange={(e) => setFormData(prev => ({ ...prev, spa_requirement: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="match_requirement">Match Requirement</Label>
                <Input
                  id="match_requirement"
                  type="number"
                  value={formData.match_requirement}
                  onChange={(e) => setFormData(prev => ({ ...prev, match_requirement: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank_color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="rank_color"
                    type="color"
                    value={formData.rank_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, rank_color: e.target.value }))}
                    className="w-16 h-9"
                  />
                  <Input
                    value={formData.rank_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, rank_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rank_description">Description</Label>
              <Input
                id="rank_description"
                value={formData.rank_description}
                onChange={(e) => setFormData(prev => ({ ...prev, rank_description: e.target.value }))}
                placeholder="Description of this rank..."
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

      {/* Ranks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Current Rank System
            <Badge variant="secondary">{sortedRanks.length} ranks</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRanks.length > 0 ? (
            <div className="space-y-2">
              {sortedRanks.map((rank, index) => (
                <div key={rank.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(rank)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-mono">{rank.rank_order}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(rank)}
                        disabled={index === sortedRanks.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div 
                      className="w-6 h-6 rounded-full border-2"
                      style={{ backgroundColor: rank.rank_color }}
                    />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{rank.rank_code}</span>
                        <span className="font-medium">{rank.rank_name}</span>
                        {!rank.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ELO: {rank.elo_requirement} | SPA: {rank.spa_requirement} | Matches: {rank.match_requirement}
                      </div>
                      {rank.rank_description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {rank.rank_description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rank)}
                      className="gap-1"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rank.id)}
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
              No ranks configured yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};