import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  data: {
    max_participants: number;
    tournament_type: string;
    game_format: string;
    entry_fee: number;
    prize_pool: number;
  };
}

interface TournamentTemplateSelectorProps {
  templates: TournamentTemplate[];
  onSelectTemplate: (template: TournamentTemplate) => void;
}

export const TournamentTemplateSelector: React.FC<TournamentTemplateSelectorProps> = ({
  templates,
  onSelectTemplate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Templates giải đấu</CardTitle>
        <p className="text-sm text-muted-foreground">
          Chọn template có sẵn để tạo giải đấu nhanh chóng
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="relative border rounded-lg p-4 hover:bg-accent transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">{template.name}</h4>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {template.description}
                  </p>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Phí tham gia:</span>
                      <Badge variant="outline" className="text-xs">
                        {template.data.entry_fee.toLocaleString('vi-VN')}đ
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Giải thưởng:</span>
                      <Badge variant="secondary" className="text-xs">
                        {template.data.prize_pool.toLocaleString('vi-VN')}đ
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Áp dụng template
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};