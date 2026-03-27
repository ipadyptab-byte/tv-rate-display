// In media-manager.tsx - Updated component
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { mediaApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { MediaItem } from "@shared/schema";
import { Trash2, Edit, Play, Pause, Eye, EyeOff } from "lucide-react";

export default function MediaManager() {
  const { toast } = useToast();
  const [uploadSettings, setUploadSettings] = useState({
    duration_seconds: 30,
    autoActivate: true
  });

  // Get media items
  const { data: mediaItems = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/media"],
    queryFn: () => mediaApi.getAll()
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ files, settings }: { files: File[]; settings: typeof uploadSettings }) => {
      // Convert File[] to FileList for API compatibility
      const fileList = {
        length: files.length,
        item: (index: number) => files[index] || null,
        [Symbol.iterator]: function* () {
          for (const file of files) {
            yield file;
          }
        }
      } as FileList;
      
      // Use the enhanced mediaApi.upload with better error handling
      return await mediaApi.upload(fileList, {
        duration_seconds: settings.duration_seconds,
        autoActivate: settings.autoActivate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media files uploaded successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to upload media files: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<MediaItem> }) =>
      mediaApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media item updated successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update media item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: mediaApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media item deleted successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete media item: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      uploadMutation.mutate({ files, settings: uploadSettings });
    }
  };

  const handleUpdateItem = (id: number, field: string, value: any) => {
    updateMutation.mutate({ id, updates: { [field]: value } });
  };

  const handleDeleteItem = (id: number) => {
    if (window.confirm("Are you sure you want to delete this media item?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-0">
      {/* Match MobileControl header */}
      <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-black p-4 flex justify-center">
        <img
          src="/logo.png"
          alt="Devi Jewellers Logo"
          className="h-40 w-[350px] object-contain"
        />
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Title and subtitle */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-700">Media Manager</h2>
          <p className="text-gray-600">Upload and manage promotional videos and images for TV ads</p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <CardTitle className="flex items-center">
              <i className="fas fa-cloud-upload-alt mr-2"></i>Upload New Media
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload
                onDrop={handleFileUpload}
                accept="image/*,video/*"
                multiple={true}
                data-testid="media-upload-dropzone"
              >
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors">
                  <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                  <p className="text-lg font-semibold text-gray-700">Drop files here or click to upload</p>
                  <p className="text-gray-500 mb-4">Support for images (JPG, PNG) and videos (MP4, AVI)</p>
                  {uploadMutation.isPending && (
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  )}
                </div>
              </FileUpload>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default duration_seconds (seconds)</label>
                  <Input
                    type="number"
                    min="5"
                    max="120"
                    value={uploadSettings.duration_seconds}
                    onChange={(e) => setUploadSettings(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) }))}
                    data-testid="input-default-duration_seconds"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-activate"
                    checked={uploadSettings.autoActivate}
                    onCheckedChange={(checked) => setUploadSettings(prev => ({ ...prev, autoActivate: checked }))}
                  />
                  <Label htmlFor="auto-activate">Auto activate after upload</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Items List */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <CardTitle className="flex items-center">
              <i className="fas fa-list mr-2"></i>Media Library ({mediaItems.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading media items...</p>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-inbox text-4xl mb-2"></i>
                <p>No media items found. Upload some files to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaItems.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="relative">
                      {item.media_type === 'image' ? (
                        <img 
                          src={item.file_url || ""} 
                          alt={item.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <video 
                          src={item.file_url || ""}
                          className="w-full h-48 object-cover"
                          controls
                          preload="metadata"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <Button
                          size="sm"
                          variant={item.is_active ? "default" : "secondary"}
                          onClick={() => handleUpdateItem(item.id, 'is_active', !item.is_active)}
                        >
                          {item.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {item.media_type} • {formatFileSize(item.file_size || 0)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.duration_seconds}s
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <Input
                          type="number"
                          min="0"
                          value={item.order_index || 0}
                          onChange={(e) => handleUpdateItem(item.id, 'order_index', parseInt(e.target.value))}
                          className="w-16 h-8"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
