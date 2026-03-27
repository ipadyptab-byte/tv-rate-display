import type { 
  GoldRate, 
  InsertGoldRate, 
  DisplaySettings, 
  InsertDisplaySettings,
  MediaItem,
  PromoImage,
  BannerSettings 
} from "@shared/schema";
import { apiUrl } from "./config";

// Helper function for API requests
const apiRequest = async (method: string, url: string, data?: any): Promise<Response> => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(apiUrl(url), options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error (${response.status}):`, errorText);
    
    // Try to parse error as JSON, otherwise use text
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  return response;
};

// Gold Rates API
export const ratesApi = {
  getCurrent: async (): Promise<GoldRate | null> => {
    const response = await apiRequest("GET", "/api/rates/current");
    return response.json();
  },

  create: async (rates: InsertGoldRate): Promise<GoldRate> => {
    const response = await apiRequest("POST", "/api/rates", rates);
    return response.json();
  },

  update: async (id: number, rates: Partial<InsertGoldRate>): Promise<GoldRate> => {
    const response = await apiRequest("PUT", `/api/rates/${id}`, rates);
    return response.json();
  }
};

// Display Settings API - Improved Error Handling
export const settingsApi = {
  getDisplay: async (): Promise<DisplaySettings | null> => {
    try {
      const response = await apiRequest("GET", "/api/settings/display");
      const data = await response.json();

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return data as DisplaySettings;
    } catch (error: any) {
      console.error("Failed to fetch display settings:", error);
      return null;
    }
  },

  createDisplay: async (settings: InsertDisplaySettings): Promise<DisplaySettings> => {
    const response = await apiRequest("POST", "/api/settings/display", settings);
    return (await response.json()) as DisplaySettings;
  },

  updateDisplay: async (id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings> => {
    if (!id || isNaN(id)) {
      throw new Error("Invalid settings ID");
    }
    const response = await apiRequest("PUT", `/api/settings/display/${id}`, settings);
    return (await response.json()) as DisplaySettings;
  }
};
// Media API
export const mediaApi = {
  getAll: async (activeOnly = false): Promise<MediaItem[]> => {
    const response = await apiRequest("GET", `/api/media?active=${activeOnly}`);
    return response.json();
  },

  upload: async (files: FileList, options: { duration_seconds: number; autoActivate: boolean }): Promise<MediaItem[]> => {
    const formData = new FormData();
    const filesArray = Array.from(files);
    
    // Validate file sizes before upload (50MB limit for cloud deployment)
    for (const file of filesArray) {
      if (file.size > 50 * 1024 * 1024) {
        throw new Error(`File ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 50MB.`);
      }
    }
    
    filesArray.forEach(file => formData.append('files', file));
    formData.append('duration_seconds', options.duration_seconds.toString());
    formData.append('autoActivate', options.autoActivate.toString());

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    try {
      const response = await fetch(apiUrl("/api/media/upload"), {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || `Upload failed: ${response.status}`;
        } catch {
          errorMessage = `Upload failed: ${response.status} - ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timed out. Please try uploading smaller files or fewer files at once.');
      }
      throw error;
    }
  },

  update: async (id: number, updates: Partial<MediaItem>): Promise<MediaItem> => {
    const response = await apiRequest("PUT", `/api/media/${id}`, updates);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/media/${id}`);
  }
};

// Promo API
export const promoApi = {
  getAll: async (activeOnly = false): Promise<PromoImage[]> => {
    const response = await apiRequest("GET", `/api/promo?active=${activeOnly}`);
    return response.json();
  },

  upload: async (files: FileList, options: { duration_seconds: number; transition: string; autoActivate: boolean }): Promise<PromoImage[]> => {
    const formData = new FormData();
    const filesArray = Array.from(files);
    
    // Validate file sizes before upload (10MB limit for promo images)
    for (const file of filesArray) {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`Image ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 10MB.`);
      }
    }
    
    filesArray.forEach(file => formData.append('files', file));
    formData.append('duration_seconds', options.duration_seconds.toString());
    formData.append('transition', options.transition);
    formData.append('autoActivate', options.autoActivate.toString());

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for images
    
    try {
      const response = await fetch(apiUrl("/api/promo/upload"), {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || `Upload failed: ${response.status}`;
        } catch {
          errorMessage = `Upload failed: ${response.status} - ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timed out. Please try uploading smaller images or fewer images at once.');
      }
      throw error;
    }
  },

  update: async (id: number, updates: Partial<PromoImage>): Promise<PromoImage> => {
    const response = await apiRequest("PUT", `/api/promo/${id}`, updates);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/promo/${id}`);
  }
};

// Banner API
export const bannerApi = {
  getCurrent: async (): Promise<BannerSettings | null> => {
    const response = await apiRequest("GET", "/api/banner");
    return response.json();
  },

  upload: async (file: File): Promise<{ banner_image_url: string; message: string }> => {
    const formData = new FormData();
    formData.append('banner', file);

    const response = await fetch(apiUrl("/api/banner/upload"), {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return response.json();
  }
};

// System API
export const systemApi = {
  getInfo: async () => {
    const response = await apiRequest("GET", "/api/system/info");
    return response.json();
  }
};
