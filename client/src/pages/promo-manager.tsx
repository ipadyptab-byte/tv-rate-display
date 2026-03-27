import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { promoApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { PromoImage } from "@shared/schema";

export default function PromoManager() {
  const { toast } = useToast();
  const [uploadSettings, setUploadSettings] = useState({
    duration_seconds: 5,
    transition: "fade",
    autoActivate: true
  });
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Get promo images
  const { data: promoImages = [], isLoading } = useQuery({
    queryKey: ["/api/promo"],
    queryFn: () => promoApi.getAll()
  });

  const activePromos = promoImages.filter(p => p.is_active);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ files, settings }: { files: FileList; settings: typeof uploadSettings }) =>
      promoApi.upload(files, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo"] });
      toast({
        title: "Success",
        description: "Promotional images uploaded successfully!"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload promotional images. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<PromoImage> }) =>
      promoApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo"] });
      toast({
        title: "Success",
        description: "Promotional image updated successfully!"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: promoApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo"] });
      toast({
        title: "Success",
        description: "Promotional image deleted successfully!"
      });
    }
  });

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      const fileList = files.reduce((acc, file) => {
        const dt = new DataTransfer();
        Array.from(acc).forEach(f => dt.items.add(f));
        dt.items.add(file);
        return dt.files;
      }, new DataTransfer().files);
      
      uploadMutation.mutate({ files: fileList, settings: uploadSettings });
    }
  };

  const handleUpdateItem = (id: number, field: string, value: any) => {
    updateMutation.mutate({ id, updates: { [field]: value } });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const transitionOptions = [
    { value: "fade", label: "Fade" },
    { value: "slide-left", label: "Slide Left" },
    { value: "slide-right", label: "Slide Right" },
    { value: "zoom-in", label: "Zoom In" },
    { value: "zoom-out", label: "Zoom Out" },
    { value: "flip-x", label: "Flip (X-axis)" },
    { value: "flip-y", label: "Flip (Y-axis)" },
    { value: "rotate-in", label: "Rotate In" },
    { value: "rotate-out", label: "Rotate Out" },
    { value: "bounce", label: "Bounce" }
  ];

  const totalDuration = activePromos.reduce((sum, promo) => sum + (promo.duration_seconds || 0), 0);

  // Slideshow preview timer
  React.useEffect(() => {
    if (!previewPlaying || activePromos.length <= 1) return;

    const currentPromo = activePromos[currentPreviewIndex];
    const duration = (currentPromo?.duration_seconds || 5) * 1000;

    const timer = setInterval(() => {
      setCurrentPreviewIndex((prev) => (prev + 1) % activePromos.length);
    }, duration);

    return () => clearInterval(timer);
  }, [previewPlaying, currentPreviewIndex, activePromos]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading promotional images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-bullhorn text-white text-xl"></i>
            </div>
            {/* Logo-only branding */}
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Promotional Manager</h2>
          <p className="text-gray-600">Manage slideshow images displayed below silver rates on TV</p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
            <CardTitle className="flex items-center">
              <i className="fas fa-upload mr-2"></i>Upload New Promotional Images
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload
                onDrop={handleFileUpload}
                accept="image/*"
                multiple={true}
                className="border-purple-300 hover:border-purple-400"
                data-testid="promo-upload-dropzone"
              >
                <div>
                  <i className="fas fa-images text-3xl text-purple-400 mb-3"></i>
                  <p className="text-lg font-semibold text-gray-700">Drop images here</p>
                  <p className="text-gray-500 mb-3">Support for JPG, PNG files</p>
                </div>
              </FileUpload>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Duration (seconds)</label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={uploadSettings.duration_seconds}
                    onChange={(e) => setUploadSettings(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) }))}
                    data-testid="input-default-duration"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Transition</label>
                  <Select 
                    value={uploadSettings.transition} 
                    onValueChange={(value) => setUploadSettings(prev => ({ ...prev, transition: value }))}
                  >
                    <SelectTrigger data-testid="select-default-transition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transitionOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Auto-activate uploads</h4>
                    <p className="text-sm text-gray-600">Start displaying immediately after upload</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={uploadSettings.autoActivate}
                      onChange={(e) => setUploadSettings(prev => ({ ...prev, autoActivate: e.target.checked }))}
                      data-testid="checkbox-auto-activate"
                    />
                    <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${uploadSettings.autoActivate ? 'bg-purple-500' : 'bg-gray-300'}`}>
                      <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform transform top-1 left-1 ${uploadSettings.autoActivate ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promotional Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {promoImages.map((item) => (
            <Card key={item.id} className={`overflow-hidden ${item.is_active ? 'border-2 border-purple-500' : 'border border-gray-200 opacity-75'}`}>
              <div className="relative aspect-video bg-black">
                <img 
                  src={item.image_url || ""} 
                  alt={item.name}
                  className="w-full h-full object-contain"
                  data-testid={`promo-image-${item.id}`}
                />
                
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button 
                    className={`w-8 h-8 text-white rounded-full flex items-center justify-center hover:opacity-80 ${item.is_active ? 'bg-purple-500' : 'bg-gray-500'}`}
                    onClick={() => handleUpdateItem(item.id, 'is_active', !item.is_active)}
                    data-testid={`button-toggle-promo-${item.id}`}
                  >
                    <i className={`fas fa-${item.is_active ? 'eye' : 'eye-slash'} text-xs`}></i>
                  </button>
                  <button 
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    onClick={() => deleteMutation.mutate(item.id)}
                    data-testid={`button-delete-promo-${item.id}`}
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
                
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {item.duration_seconds}s
                </div>
                
                <div className="absolute bottom-2 right-2 bg-purple-600 bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {transitionOptions.find(t => t.value === item.transition_effect)?.label || 'Fade'}
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-800 mb-3" data-testid={`promo-name-${item.id}`}>
                  {item.name}
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-xs text-gray-600">Duration (sec)</label>
                    <Input 
                      type="number" 
                      min="1"
                      max="30"
                      value={item.duration_seconds || 5} 
                      onChange={(e) => handleUpdateItem(item.id, 'duration_seconds', parseInt(e.target.value))}
                      className="text-sm"
                      data-testid={`input-promo-duration-${item.id}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Order</label>
                    <Input 
                      type="number" 
                      value={item.order_index || 0} 
                      onChange={(e) => handleUpdateItem(item.id, 'order_index', parseInt(e.target.value))}
                      className="text-sm"
                      data-testid={`input-promo-order-${item.id}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Transition</label>
                  <Select 
                    value={item.transition_effect || "fade"} 
                    onValueChange={(value) => handleUpdateItem(item.id, 'transition_effect', value)}
                  >
                    <SelectTrigger className="text-sm" data-testid={`select-transition-${item.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transitionOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-sm font-medium flex items-center ${item.is_active ? 'text-purple-600' : 'text-gray-500'}`}>
                    <i className="fas fa-circle text-xs mr-1"></i>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="text-xs text-gray-500">
                    {item.file_size ? formatFileSize(item.file_size) : 'Unknown size'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Placeholder */}
          <div 
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-dashed border-purple-300 flex items-center justify-center aspect-video cursor-pointer hover:border-purple-400 transition-colors"
            onClick={() => (document.querySelector('[data-testid="promo-upload-dropzone"] input') as HTMLInputElement)?.click()}
            data-testid="add-new-promo-placeholder"
          >
            <div className="text-center">
              <i className="fas fa-plus-circle text-4xl text-purple-400 mb-2"></i>
              <p className="text-purple-700 font-medium">Add New Promo</p>
              <p className="text-purple-500 text-sm">Upload promotional image</p>
            </div>
          </div>
        </div>

        {/* Slideshow Preview */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center">
              <i className="fas fa-play-circle mr-2"></i>Slideshow Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview Window */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {activePromos.length > 0 ? (
                  <>
                    <img 
                      src={activePromos[currentPreviewIndex]?.image_url || ""} 
                      alt="Slideshow preview" 
                      className="w-full h-full object-contain"
                      data-testid="slideshow-preview-image"
                    />
                    
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <div className="text-center text-white">
                        <i className="fas fa-play-circle text-4xl mb-2"></i>
                        <p className="font-semibold">Slideshow Preview</p>
                        <p className="text-sm text-gray-200">
                          Current: {activePromos[currentPreviewIndex]?.name} ({currentPreviewIndex + 1} of {activePromos.length})
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-50">
                      <div className="h-full bg-purple-500" style={{ width: '60%', transition: 'width 0.1s' }}></div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <i className="fas fa-image text-4xl mb-2"></i>
                      <p>No active promotional images</p>
                      <p className="text-sm">Upload and activate images to see preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls and Info */}
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Slideshow Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between" data-testid="slideshow-total-images">
                      <span>Total Images:</span>
                      <span className="font-semibold">{activePromos.length} active</span>
                    </div>
                    <div className="flex justify-between" data-testid="slideshow-total-duration">
                      <span>Total Duration:</span>
                      <span className="font-semibold">{totalDuration} seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loop Mode:</span>
                      <span className="font-semibold">Continuous</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800">Preview Controls</h4>
                  <div className="flex space-x-2">
                    <Button 
                      className="bg-purple-500 hover:bg-purple-600 text-white flex-1"
                      onClick={() => setPreviewPlaying(!previewPlaying)}
                      data-testid="button-preview-play"
                    >
                      <i className={`fas fa-${previewPlaying ? 'pause' : 'play'} mr-2`}></i>
                      {previewPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCurrentPreviewIndex((prev) => (prev + 1) % activePromos.length)}
                      disabled={activePromos.length === 0}
                      data-testid="button-preview-next"
                    >
                      <i className="fas fa-step-forward mr-2"></i>Next
                    </Button>
                  </div>
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    data-testid="button-preview-tv"
                  >
                    <i className="fas fa-tv mr-2"></i>Preview on TV Display
                  </Button>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-info-circle text-yellow-600 mt-0.5"></i>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Display Location</p>
                      <p>Images appear below silver rates on the TV display in a continuous slideshow.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
