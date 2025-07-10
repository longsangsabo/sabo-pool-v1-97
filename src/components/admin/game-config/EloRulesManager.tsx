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
  Target,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import { useEloRules } from '@/hooks/useEloRules';

export const EloRulesManager: React.FC = () => {
  const { rules, loading, createRule, updateRule, deleteRule } = useEloRules();
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'k_factor',
    conditions: '{}',
    value_formula: 'base_value',
    base_value: 0,
    multiplier: 1.0,
    priority: 1,
    is_active: true
  });

  const ruleTypes = [
    { value: 'k_factor', label: 'K-Factor', icon: Target, color: 'bg-blue-50 text-blue-700' },
    { value: 'tournament_bonus', label: 'Tournament Bonus', icon: Trophy, color: 'bg-green-50 text-green-700' },
    { value: 'penalty', label: 'Penalty', icon: AlertTriangle, color: 'bg-red-50 text-red-700' }
  ];

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      conditions: JSON.stringify(rule.conditions, null, 2),
      value_formula: rule.value_formula,
      base_value: rule.base_value,
      multiplier: rule.multiplier,
      priority: rule.priority,
      is_active: rule.is_active
    });
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        conditions: JSON.parse(formData.conditions),
        base_value: Number(formData.base_value),
        multiplier: Number(formData.multiplier),
        priority: Number(formData.priority)
      };

      if (editingRule) {
        await updateRule(editingRule.id, data);
      } else {
        await createRule(data);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const resetForm = () => {
    setEditingRule(null);
    setIsCreating(false);
    setFormData({
      rule_name: '',
      rule_type: 'k_factor',
      conditions: '{}',
      value_formula: 'base_value',
      base_value: 0,
      multiplier: 1.0,
      priority: 1,
      is_active: true
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa rule này?')) {
      await deleteRule(id);
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
          <h2 className="text-2xl font-bold">ELO Calculation Rules</h2>
          <p className="text-muted-foreground">
            Quản lý các quy tắc tính toán ELO cho trận đấu và giải đấu
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingRule) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRule ? 'Edit ELO Rule' : 'Create New ELO Rule'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule_name">Rule Name</Label>
                <Input
                  id="rule_name"
                  value={formData.rule_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                  placeholder="e.g., New Player K-Factor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule_type">Rule Type</Label>
                <select
                  id="rule_type"
                  value={formData.rule_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, rule_type: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {ruleTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_value">Base Value</Label>
                <Input
                  id="base_value"
                  type="number"
                  value={formData.base_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_value: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="multiplier">Multiplier</Label>
                <Input
                  id="multiplier"
                  type="number"
                  step="0.1"
                  value={formData.multiplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, multiplier: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value_formula">Value Formula</Label>
                <Input
                  id="value_formula"
                  value={formData.value_formula}
                  onChange={(e) => setFormData(prev => ({ ...prev, value_formula: e.target.value }))}
                  placeholder="base_value"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions (JSON)</Label>
              <Textarea
                id="conditions"
                value={formData.conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                rows={4}
                placeholder='{"matches_played": {"<": 30}}'
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

      {/* Rules List */}
      <div className="grid gap-4">
        {ruleTypes.map(type => {
          const typeRules = rules?.filter(rule => rule.rule_type === type.value) || [];
          const Icon = type.icon;

          return (
            <Card key={type.value}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${type.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {type.label} Rules
                  <Badge variant="secondary">{typeRules.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typeRules.length > 0 ? (
                  <div className="space-y-3">
                    {typeRules.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{rule.rule_name}</span>
                            {!rule.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Base Value: {rule.base_value} | Multiplier: {rule.multiplier} | Priority: {rule.priority}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Conditions: {JSON.stringify(rule.conditions)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
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
                    No {type.label.toLowerCase()} rules configured
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