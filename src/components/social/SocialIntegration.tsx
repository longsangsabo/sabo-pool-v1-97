import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Share, 
  Link2, 
  Copy, 
  CheckCircle,
  Users,
  Heart,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  followers?: number;
  lastPost?: string;
  engagement?: number;
}

interface ShareableContent {
  id: string;
  type: 'achievement' | 'match_result' | 'tournament' | 'ranking';
  title: string;
  description: string;
  image?: string;
  url: string;
}

export function SocialIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      connected: true,
      followers: 1250,
      lastPost: '2 giờ trước',
      engagement: 85
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram className="h-5 w-5" />,
      connected: false,
      followers: 850,
      lastPost: '1 ngày trước',
      engagement: 92
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Youtube className="h-5 w-5" />,
      connected: true,
      followers: 320,
      lastPost: '3 ngày trước',
      engagement: 78
    }
  ]);

  const [autoShare, setAutoShare] = useState({
    achievements: true,
    matchResults: false,
    tournaments: true,
    rankings: false
  });

  const [shareableContent] = useState<ShareableContent[]>([
    {
      id: '1',
      type: 'achievement',
      title: 'Đạt được thành tích mới!',
      description: 'Vừa thắng 10 trận liên tiếp và lên hạng Cao thủ!',
      url: '/achievements/winning-streak'
    },
    {
      id: '2',
      type: 'match_result',
      title: 'Chiến thắng ấn tượng',
      description: 'Thắng trận với tỷ số 5-0 trong giải đấu cuối tuần',
      url: '/matches/latest-victory'
    },
    {
      id: '3',
      type: 'tournament',
      title: 'Đăng ký giải đấu mới',
      description: 'Tham gia Giải vô địch SABO Pool Arena 2024',
      url: '/tournaments/championship-2024'
    }
  ]);

  const handleConnect = async (platformId: string) => {
    try {
      // Simulate OAuth connection
      toast({
        title: "Đang kết nối...",
        description: `Đang kết nối với ${platforms.find(p => p.id === platformId)?.name}`
      });

      // In real implementation, this would redirect to OAuth provider
      setTimeout(() => {
        setPlatforms(prev => prev.map(p => 
          p.id === platformId ? { ...p, connected: true } : p
        ));
        
        toast({
          title: "Kết nối thành công!",
          description: `Đã kết nối với ${platforms.find(p => p.id === platformId)?.name}`
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối với mạng xã hội",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, connected: false } : p
    ));
    
    toast({
      title: "Đã ngắt kết nối",
      description: `Đã ngắt kết nối với ${platforms.find(p => p.id === platformId)?.name}`
    });
  };

  const handleShare = async (content: ShareableContent, platformId?: string) => {
    try {
      const shareData = {
        title: content.title,
        text: content.description,
        url: `${window.location.origin}${content.url}`
      };

      if (navigator.share && !platformId) {
        await navigator.share(shareData);
        toast({
          title: "Chia sẻ thành công",
          description: "Đã chia sẻ nội dung"
        });
      } else {
        // Copy to clipboard as fallback
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        toast({
          title: "Đã sao chép",
          description: "Nội dung đã được sao chép vào clipboard"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi chia sẻ",
        description: "Không thể chia sẻ nội dung",
        variant: "destructive"
      });
    }
  };

  const generateShareUrl = (content: ShareableContent) => {
    return `${window.location.origin}${content.url}?utm_source=social&utm_medium=share&utm_campaign=user_${user?.id}`;
  };

  return (
    <div className="space-y-6">
      {/* Connected Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Kết nối mạng xã hội</CardTitle>
          <CardDescription>
            Kết nối các tài khoản mạng xã hội để chia sẻ thành tích và kết quả
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {platform.icon}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{platform.name}</span>
                    {platform.connected && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {platform.connected && (
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{platform.followers?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{platform.engagement}%</span>
                      </div>
                      <span>Hoạt động: {platform.lastPost}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={platform.connected ? "default" : "secondary"}>
                  {platform.connected ? "Đã kết nối" : "Chưa kết nối"}
                </Badge>
                {platform.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(platform.id)}
                  >
                    Ngắt kết nối
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(platform.id)}
                  >
                    Kết nối
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Auto-Share Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt chia sẻ tự động</CardTitle>
          <CardDescription>
            Tự động chia sẻ các hoạt động và thành tích lên mạng xã hội
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-achievements">Thành tích mới</Label>
              <p className="text-sm text-muted-foreground">
                Tự động chia sẻ khi đạt được thành tích mới
              </p>
            </div>
            <Switch
              id="auto-achievements"
              checked={autoShare.achievements}
              onCheckedChange={(checked) => 
                setAutoShare(prev => ({ ...prev, achievements: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-matches">Kết quả trận đấu</Label>
              <p className="text-sm text-muted-foreground">
                Chia sẻ các trận thắng đặc biệt
              </p>
            </div>
            <Switch
              id="auto-matches"
              checked={autoShare.matchResults}
              onCheckedChange={(checked) => 
                setAutoShare(prev => ({ ...prev, matchResults: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-tournaments">Giải đấu</Label>
              <p className="text-sm text-muted-foreground">
                Chia sẻ khi tham gia hoặc thắng giải đấu
              </p>
            </div>
            <Switch
              id="auto-tournaments"
              checked={autoShare.tournaments}
              onCheckedChange={(checked) => 
                setAutoShare(prev => ({ ...prev, tournaments: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-rankings">Thứ hạng</Label>
              <p className="text-sm text-muted-foreground">
                Chia sẻ khi lên hạng cao hơn
              </p>
            </div>
            <Switch
              id="auto-rankings"
              checked={autoShare.rankings}
              onCheckedChange={(checked) => 
                setAutoShare(prev => ({ ...prev, rankings: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Shareable Content */}
      <Card>
        <CardHeader>
          <CardTitle>Nội dung có thể chia sẻ</CardTitle>
          <CardDescription>
            Các thành tích và hoạt động gần đây bạn có thể chia sẻ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {shareableContent.map((content) => (
            <div
              key={content.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium">{content.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {content.description}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline">
                    {content.type === 'achievement' && 'Thành tích'}
                    {content.type === 'match_result' && 'Kết quả'}
                    {content.type === 'tournament' && 'Giải đấu'}
                    {content.type === 'ranking' && 'Xếp hạng'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generateShareUrl(content));
                      toast({
                        title: "Đã sao chép link",
                        description: "Link chia sẻ đã được sao chép"
                      });
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Sao chép link
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {platforms.filter(p => p.connected).map((platform) => (
                  <Button
                    key={platform.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(content, platform.id)}
                  >
                    {platform.icon}
                  </Button>
                ))}
                <Button
                  size="sm"
                  onClick={() => handleShare(content)}
                >
                  <Share className="h-4 w-4 mr-1" />
                  Chia sẻ
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}