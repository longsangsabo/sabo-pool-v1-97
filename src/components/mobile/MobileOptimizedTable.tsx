import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { Eye, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  mobileHidden?: boolean;
}

interface MobileOptimizedTableProps {
  data: any[];
  columns: TableColumn[];
  onRowAction?: (action: string, row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const MobileOptimizedTable: React.FC<MobileOptimizedTableProps> = ({
  data,
  columns,
  onRowAction,
  loading = false,
  emptyMessage = 'No data available'
}) => {
  const { isMobile } = useMobileOptimization();

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    // Mobile card layout
    return (
      <div className="space-y-3">
        {data.map((row, index) => (
          <Card key={index} className="mobile-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  {columns
                    .filter(col => !col.mobileHidden)
                    .slice(0, 2)
                    .map(column => (
                      <div key={column.key} className="mb-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {column.label}:
                        </span>
                        <span className="ml-2 text-sm">
                          {column.render 
                            ? column.render(row[column.key], row)
                            : row[column.key]
                          }
                        </span>
                      </div>
                    ))}
                </div>
                {onRowAction && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onRowAction('view', row)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {/* Additional info in collapsed form */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {columns
                  .filter(col => !col.mobileHidden)
                  .slice(2)
                  .map(column => (
                    <div key={column.key}>
                      <span>{column.label}:</span>
                      <div className="font-medium text-foreground">
                        {column.render 
                          ? column.render(row[column.key], row)
                          : row[column.key]
                        }
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map(column => (
                <th key={column.key} className="px-4 py-3 text-left text-sm font-medium">
                  {column.label}
                </th>
              ))}
              {onRowAction && <th className="px-4 py-3 w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-muted/30 transition-colors">
                {columns.map(column => (
                  <td key={column.key} className="px-4 py-3 text-sm">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
                {onRowAction && (
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRowAction('view', row)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MobileOptimizedTable;