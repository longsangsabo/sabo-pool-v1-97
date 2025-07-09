import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Plus, 
  Minus, 
  RotateCcw, 
  Users, 
  History,
  AlertTriangle,
  CheckCircle,
  Search
} from 'lucide-react';
import { useAdminSPAManagement } from '@/hooks/useAdminSPAManagement';
import { toast } from 'sonner';

export function AdminSPAManager() {
  const {
    isAdmin,
    playersWithSPA,
    adjustmentHistory,
    isLoadingPlayers,
    adjustSPA,
    resetPlayerSPA,
    isAdjusting,
    isResetting
  } = useAdminSPAManagement();

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-red-600">Truy cập bị từ chối</p>
            <p className="text-muted-foreground">Bạn không có quyền truy cập tính năng này</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredPlayers = playersWithSPA?.filter(player =>
    player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAdjustSPA = async () => {
    if (!selectedPlayer || adjustmentAmount === 0 || !adjustmentReason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await adjustSPA({
        user_id: selectedPlayer,
        amount: adjustmentAmount,
        reason: adjustmentReason.trim()
      });
      
      setShowAdjustDialog(false);
      setSelectedPlayer('');
      setAdjustmentAmount(0);
      setAdjustmentReason('');
    } catch (error) {
      console.error('Error adjusting SPA:', error);
    }
  };

  const handleResetSPA = async () => {
    if (!selectedPlayer || !adjustmentReason.trim()) {
      toast.error('Vui lòng chọn người chơi và nhập lý do');
      return;
    }

    try {
      await resetPlayerSPA({
        user_id: selectedPlayer,
        reason: adjustmentReason.trim()
      });
      
      setShowResetDialog(false);
      setSelectedPlayer('');
      setAdjustmentReason('');
    } catch (error) {
      console.error('Error resetting SPA:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Quản lý SPA Points</h2>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Admin Tools
        </Badge>
      </div>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="players">Người chơi</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-6">
          {/* Search and Actions */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm người chơi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Điều chỉnh SPA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Điều chỉnh SPA Points</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="player-select">Chọn người chơi</Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn người chơi" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPlayers.map((player) => (
                          <SelectItem key={player.player_id} value={player.player_id}>
                            {player.full_name} ({player.spa_points.toLocaleString()} SPA)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Số điểm (+ để thêm, - để trừ)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                      placeholder="Nhập số điểm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Lý do điều chỉnh</Label>
                    <Textarea
                      id="reason"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder="Nhập lý do điều chỉnh..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAdjustSPA}
                      disabled={isAdjusting}
                      className="flex-1"
                    >
                      {isAdjusting ? 'Đang xử lý...' : 'Điều chỉnh'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAdjustDialog(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset SPA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset SPA Points</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">
                      ⚠️ Cảnh báo: Hành động này sẽ reset SPA points về 0 và không thể hoàn tác!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-player-select">Chọn người chơi</Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn người chơi" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPlayers.map((player) => (
                          <SelectItem key={player.player_id} value={player.player_id}>
                            {player.full_name} ({player.spa_points.toLocaleString()} SPA)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-reason">Lý do reset</Label>
                    <Textarea
                      id="reset-reason"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder="Nhập lý do reset..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleResetSPA}
                      disabled={isResetting}
                      className="flex-1"
                    >
                      {isResetting ? 'Đang reset...' : 'Xác nhận Reset'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowResetDialog(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Players Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Danh sách người chơi có SPA
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPlayers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên người chơi</TableHead>
                      <TableHead>Hạng</TableHead>
                      <TableHead className="text-right">SPA Points</TableHead>
                      <TableHead className="text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.map((player) => (
                      <TableRow key={player.player_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{player.full_name}</p>
                            <p className="text-sm text-muted-foreground">{player.display_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{player.current_rank}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {player.spa_points.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPlayer(player.player_id);
                                setShowAdjustDialog(true);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPlayer(player.player_id);
                                setAdjustmentAmount(-50);
                                setShowAdjustDialog(true);
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPlayer(player.player_id);
                                setShowResetDialog(true);
                              }}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Lịch sử điều chỉnh SPA
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adjustmentHistory && adjustmentHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Người chơi</TableHead>
                      <TableHead>Thay đổi</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentHistory.map((adjustment, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(adjustment.created_at).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>Player {adjustment.player_id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {adjustment.old_amount.toLocaleString()} → {adjustment.new_amount.toLocaleString()}
                            </span>
                            <span className={`text-xs font-semibold ${
                              adjustment.difference > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {adjustment.difference > 0 ? '+' : ''}{adjustment.difference}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {adjustment.reason}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Hoàn thành
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có lịch sử điều chỉnh nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}