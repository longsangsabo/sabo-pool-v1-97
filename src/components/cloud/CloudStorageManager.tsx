import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  Download, 
  Trash2, 
  FolderOpen, 
  Image, 
  Video, 
  FileText,
  Cloud,
  HardDrive,
  Share2,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CloudFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: number;
  uploadDate: string;
  url: string;
  shared: boolean;
  thumbnail?: string;
}

interface StorageStats {
  used: number;
  total: number;
  files: number;
  bandwidth: number;
}

export function CloudStorageManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<CloudFile[]>([
    {
      id: '1',
      name: 'match_highlight_1.mp4',
      type: 'video',
      size: 25600000, // 25.6MB
      uploadDate: '2024-01-15',
      url: '/videos/match1.mp4',
      shared: true
    },
    {
      id: '2',
      name: 'tournament_poster.jpg',
      type: 'image',
      size: 2048000, // 2MB
      uploadDate: '2024-01-14',
      url: '/images/poster.jpg',
      shared: false
    },
    {
      id: '3',
      name: 'results_report.pdf',
      type: 'document',
      size: 1536000, // 1.5MB
      uploadDate: '2024-01-13',
      url: '/documents/report.pdf',
      shared: true
    }
  ]);

  const [storageStats] = useState<StorageStats>({
    used: 2.5, // GB
    total: 10, // GB
    files: 156,
    bandwidth: 45.2 // GB this month
  });

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        // Initialize progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('user-files')
          .upload(filePath, file);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.name] || 0;
            const next = Math.min(current + 10, 90);
            return { ...prev, [file.name]: next };
          });
        }, 100);

        // Clear interval when upload completes
        setTimeout(() => {
          clearInterval(interval);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        }, 1000);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('user-files')
          .getPublicUrl(filePath);

        // Add to files list
        const newFile: CloudFile = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'document',
          size: file.size,
          uploadDate: new Date().toISOString().split('T')[0],
          url: urlData.publicUrl,
          shared: false
        };

        setFiles(prev => [newFile, ...prev]);

        // Remove from progress
        setUploadProgress(prev => {
          const { [file.name]: removed, ...rest } = prev;
          return rest;
        });

        toast({
          title: "Upload thành công",
          description: `Đã upload ${file.name}`
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Lỗi upload",
          description: `Không thể upload ${file.name}`,
          variant: "destructive"
        });
      }
    }
  }, [user, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.avi', '.mov'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleDownload = async (file: CloudFile) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download thành công",
        description: `Đã tải xuống ${file.name}`
      });
    } catch (error) {
      toast({
        title: "Lỗi download",
        description: "Không thể tải xuống file",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      // Delete from Supabase Storage
      const filePath = file.url.split('/').pop();
      if (filePath) {
        const { error } = await supabase.storage
          .from('user-files')
          .remove([`${user?.id}/${filePath}`]);

        if (error) throw error;
      }

      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      toast({
        title: "Đã xóa",
        description: `Đã xóa ${file.name}`
      });
    } catch (error) {
      toast({
        title: "Lỗi xóa file",
        description: "Không thể xóa file",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    // Copy share URL to clipboard
    await navigator.clipboard.writeText(file.url);
    
    // Toggle shared status
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, shared: !f.shared } : f
    ));

    toast({
      title: file.shared ? "Hủy chia sẻ" : "Đã chia sẻ",
      description: file.shared ? "File không còn được chia sẻ" : "Link chia sẻ đã được sao chép"
    });
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const deleteSelectedFiles = () => {
    selectedFiles.forEach(handleDelete);
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Dung lượng</p>
                <p className="text-2xl font-bold">
                  {storageStats.used}GB/{storageStats.total}GB
                </p>
                <Progress 
                  value={(storageStats.used / storageStats.total) * 100} 
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Số file</p>
                <p className="text-2xl font-bold">{storageStats.files}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Băng thông</p>
                <p className="text-2xl font-bold">{storageStats.bandwidth}GB</p>
                <p className="text-xs text-muted-foreground">Tháng này</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Share2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Đã chia sẻ</p>
                <p className="text-2xl font-bold">
                  {files.filter(f => f.shared).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload files</CardTitle>
          <CardDescription>
            Kéo thả file vào đây hoặc click để chọn file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p>Thả file vào đây...</p>
            ) : (
              <div>
                <p className="text-lg font-medium">Kéo thả file vào đây</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hỗ trợ: Ảnh (PNG, JPG), Video (MP4, AVI), Tài liệu (PDF, DOC)
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{fileName}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* File List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>File của bạn</CardTitle>
              <CardDescription>
                Quản lý các file đã upload
              </CardDescription>
            </div>
            {selectedFiles.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {selectedFiles.length} file được chọn
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedFiles}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  selectedFiles.includes(file.id) ? 'bg-primary/5 border-primary' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="rounded"
                  />
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.uploadDate}</span>
                      {file.shared && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            Đã chia sẻ
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(file.id)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}