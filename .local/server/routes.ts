import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import path from "path";
import {
  insertGoldRateSchema,
  insertDisplaySettingsSchema,
  insertMediaItemSchema,
  insertPromoImageSchema,
  insertBannerSettingsSchema,
} from "@shared/schema";

// Configure multer for memory storage (no file system)
const memoryStorage = multer.memoryStorage();

const uploadMedia = multer({ 
  storage: memoryStorage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10, // Maximum 10 files per upload
    fieldSize: 10 * 1024 * 1024, // 10MB per field
    fields: 20 // Maximum fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/avi",
      "video/mov"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and videos are allowed."));
    }
  },
});

const uploadPromo = multer({ 
  storage: memoryStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // Maximum 10 files per upload
    fieldSize: 5 * 1024 * 1024, // 5MB per field
    fields: 15 // Maximum fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

const uploadBanner = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG and PNG images are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve binary data from database
  app.get("/api/media/:id/file", async (req, res) => {
    try {
      const media = await storage.getMediaItems(false);
      const item = media.find(m => m.id === parseInt(req.params.id));
      if (!item || (!item.file_data && !item.file_url)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Set appropriate headers
      res.set({
        'Content-Type': item.mime_type || 'application/octet-stream',
        'Content-Length': item.file_size?.toString() || '0'
      });
      
      if (item.file_data) {
        // Serve from database (base64 decode)
        const buffer = Buffer.from(item.file_data, 'base64');
        res.send(buffer);
      } else if (item.file_url) {
        // Fallback to old file system approach for existing data
        res.redirect(item.file_url);
      } else {
        res.status(404).json({ message: "File data not available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve file" });
    }
  });
  
  app.get("/api/promo/:id/file", async (req, res) => {
    try {
      const promos = await storage.getPromoImages(false);
      const item = promos.find(p => p.id === parseInt(req.params.id));
      if (!item || (!item.image_data && !item.image_url)) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.set({
        'Content-Type': item.file_size ? 'image/jpeg' : 'application/octet-stream'
      });
      
      if (item.image_data) {
        const buffer = Buffer.from(item.image_data, 'base64');
        res.send(buffer);
      } else if (item.image_url) {
        res.redirect(item.image_url);
      } else {
        res.status(404).json({ message: "Image data not available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve image" });
    }
  });
  
  app.get("/api/banner/:id/file", async (req, res) => {
    try {
      const banner = await storage.getBannerSettings();
      if (!banner || (!banner.banner_image_data && !banner.banner_image_url)) {
        return res.status(404).json({ message: "Banner image not found" });
      }
      
      res.set({ 'Content-Type': 'image/jpeg' });
      
      if (banner.banner_image_data) {
        const buffer = Buffer.from(banner.banner_image_data, 'base64');
        res.send(buffer);
      } else if (banner.banner_image_url) {
        res.redirect(banner.banner_image_url);
      } else {
        res.status(404).json({ message: "Banner image data not available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve banner image" });
    }
  });

  // Gold Rates Routes
  app.get("/api/rates/current", async (req, res) => {
    try {
      const rates = await storage.getCurrentRates();
      res.json(rates || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current rates" });
    }
  });

  app.post("/api/rates", async (req, res) => {
    try {
      const validatedData = insertGoldRateSchema.parse(req.body);
      const newRates = await storage.createGoldRate(validatedData);
      res.status(201).json(newRates);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid rate data", errors: error.errors });
      } else {
        console.error("Create rates error:", error);
        res.status(500).json({ message: "Failed to create rates" });
      }
    }
  });

  // Update existing rate row
  app.put("/api/rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid rate ID" });
      }
      // Allow partial updates
      const partialSchema = insertGoldRateSchema.partial();
      const validated = partialSchema.parse(req.body);
      const updated = await storage.updateGoldRate(id, validated);
      if (!updated) {
        return res.status(404).json({ message: "Rate not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid rate data", errors: error.errors });
      } else {
        console.error("Update rates error:", error);
        res.status(500).json({ message: "Failed to update rates" });
      }
    }
  });

  // Display Settings Routes
  app.get("/api/settings/display", async (req, res) => {
    try {
      const settings = await storage.getDisplaySettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch display settings" });
    }
  });

  // Create display settings
  app.post("/api/settings/display", async (req, res) => {
    try {
      const validatedData = insertDisplaySettingsSchema.parse(req.body);
      const newSettings = await storage.createDisplaySettings(validatedData);
      res.status(201).json(newSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create settings" });
      }
    }
  });

  // Update or create display settings if not exist
  app.put("/api/settings/display/:id?", async (req, res) => {
    try {
      const validatedData = insertDisplaySettingsSchema
        .partial()
        .parse(req.body);

      // Check if we have existing settings
      const existingSettings = await storage.getDisplaySettings();

      if (existingSettings && existingSettings.id) {
        // Update existing settings
        const updatedSettings = await storage.updateDisplaySettings(
          existingSettings.id,
          validatedData,
        );
        res.json(updatedSettings);
      } else {
        // Create new settings if none exist
        const newSettings = await storage.createDisplaySettings({
          ...validatedData,
          orientation: validatedData.orientation || "horizontal",
          background_color: validatedData.background_color || "#FFF8E1",
          text_color: validatedData.text_color || "#212529",
          rate_number_font_size:
            validatedData.rate_number_font_size || "text-4xl",
          show_media:
            validatedData.show_media !== undefined
              ? validatedData.show_media
              : true,
          rates_display_duration_seconds:
            validatedData.rates_display_duration_seconds || 15,
          refresh_interval: validatedData.refresh_interval || 30,
        });
        res.json(newSettings);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid settings data", errors: error.errors });
      } else {
        console.error("Settings update error:", error);
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  // Media Items Routes
  app.get("/api/media", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const media = await storage.getMediaItems(activeOnly);
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media items" });
    }
  });

  app.post("/api/media/upload", uploadMedia.array("files", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    console.log(`Processing ${files.length} media files for upload`);
    const createdItems = [];
    
    // Get the highest order index to place new items at the end
    const allMedia = await storage.getMediaItems(false);
    const highestOrder = allMedia.reduce((max, item) => 
      Math.max(max, item.order_index || 0), 0);
    
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      console.log(`Processing file ${index + 1}/${files.length}: ${file.originalname} (${file.size} bytes)`);
      
      // Validate file size (50MB limit for cloud deployment)
      if (file.size > 50 * 1024 * 1024) {
        console.warn(`File ${file.originalname} too large: ${file.size} bytes`);
        continue;
      }
      
      const mediaType = file.mimetype.startsWith("image/") ? "image" : "video";
      
      try {
        // Convert file buffer to base64
        const fileData = file.buffer.toString('base64');
        console.log(`File ${file.originalname} converted to base64, length: ${fileData.length}`);
        
        const mediaItem = await storage.createMediaItem({
          name: file.originalname,
          file_url: `/api/media/${Date.now()}/file`, // Placeholder URL, will be updated with real ID
          file_data: fileData,
          media_type: mediaType,
          duration_seconds: parseInt(req.body.duration_seconds) || 30,
          order_index: highestOrder + index + 1,
          is_active: req.body.autoActivate === "true",
          file_size: file.size,
          mime_type: file.mimetype,
        });
        
        console.log(`Created media item with ID: ${mediaItem.id}`);
        
        // Update with correct file URL based on created item ID
        await storage.updateMediaItem(mediaItem.id, {
          file_url: `/api/media/${mediaItem.id}/file`
        });
        
        createdItems.push(mediaItem);
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        // Continue with other files
      }
    }

    console.log(`Successfully created ${createdItems.length} media items`);
    res.status(201).json(createdItems);
  } catch (error) {
    console.error("Media upload error details:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      filesCount: req.files ? (req.files as Express.Multer.File[]).length : 0
    });
    res.status(500).json({ 
      message: "Failed to upload media files",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

  app.put("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMediaItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateMediaItem(id, validatedData);
      if (updatedItem) {
        res.json(updatedItem);
      } else {
        res.status(404).json({ message: "Media item not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid media data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update media item" });
      }
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMediaItem(id);
      if (deleted) {
        res.json({ message: "Media item deleted successfully" });
      } else {
        res.status(404).json({ message: "Media item not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media item" });
    }
  });

  // Promo Images Routes
  app.get("/api/promo", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const promos = await storage.getPromoImages(activeOnly);
      res.json(promos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotional images" });
    }
  });

  app.post("/api/promo/upload", uploadPromo.array('files', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      console.log(`Processing ${files.length} promo images for upload`);
      const createdItems = [];
      for (const file of files) {
        console.log(`Processing promo image: ${file.originalname} (${file.size} bytes)`);
        
        // Validate file size (10MB limit for images)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`Promo image ${file.originalname} too large: ${file.size} bytes`);
          continue;
        }
        
        try {
          // Convert file buffer to base64
          const imageData = file.buffer.toString('base64');
          console.log(`Promo image ${file.originalname} converted to base64, length: ${imageData.length}`);
          
          const promoImage = await storage.createPromoImage({
            name: file.originalname,
            image_url: `/api/promo/${Date.now()}/file`, // Placeholder
            image_data: imageData,
            duration_seconds: parseInt(req.body.duration_seconds) || 5,
            transition_effect: req.body.transition || "fade",
            order_index: 0,
            is_active: req.body.autoActivate === "true",
            file_size: file.size
          });
          
          console.log(`Created promo image with ID: ${promoImage.id}`);
          
          // Update with correct URL
          await storage.updatePromoImage(promoImage.id, {
            image_url: `/api/promo/${promoImage.id}/file`
          });
          
          createdItems.push(promoImage);
        } catch (fileError) {
          console.error(`Error processing promo image ${file.originalname}:`, fileError);
          // Continue with other files
        }
      }

      console.log(`Successfully created ${createdItems.length} promo images`);
      res.status(201).json(createdItems);
    } catch (error) {
      console.error("Promo upload error details:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        filesCount: req.files ? (req.files as Express.Multer.File[]).length : 0
      });
      res.status(500).json({ 
        message: "Failed to upload promotional images",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/promo/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPromoImageSchema.partial().parse(req.body);
      const updatedItem = await storage.updatePromoImage(id, validatedData);
      if (updatedItem) {
        res.json(updatedItem);
      } else {
        res.status(404).json({ message: "Promotional image not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid promo data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update promotional image" });
      }
    }
  });

  app.delete("/api/promo/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePromoImage(id);
      if (deleted) {
        res.json({ message: "Promotional image deleted successfully" });
      } else {
        res.status(404).json({ message: "Promotional image not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promotional image" });
    }
  });

  // Banner Settings Routes
  app.get("/api/banner", async (req, res) => {
    try {
      const banner = await storage.getBannerSettings();
      res.json(banner || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch banner settings" });
    }
  });

  app.post("/api/banner/upload", uploadBanner.single("banner"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No banner file uploaded" });
      }

      // Convert file buffer to base64
      const imageData = file.buffer.toString('base64');
      
      // Get existing banner settings or create new one
      const existingBanner = await storage.getBannerSettings();
      
      if (existingBanner && existingBanner.id) {
        // Update existing banner
        const updatedBanner = await storage.updateBannerSettings(existingBanner.id, {
          banner_image_data: imageData,
          banner_image_url: `/api/banner/${existingBanner.id}/file`,
          is_active: true
        });
        
        res.status(201).json({ 
          banner_image_url: updatedBanner?.banner_image_url,
          message: "Banner updated successfully",
        });
      } else {
        // Create new banner settings - need to implement this in storage
        res.status(201).json({ 
          banner_image_url: `/api/banner/1/file`,
          message: "Banner uploaded successfully",
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });

  // System Info Route
  app.get("/api/system/info", async (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Get database statistics
      const mediaCount = await storage.getMediaItems(false).then(items => items.length);
      const promoCount = await storage.getPromoImages(false).then(items => items.length);
      const ratesData = await storage.getCurrentRates();
      
      // Get current IST time
      const istTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      res.json({
        status: "online",
        server_time: istTime,
        uptime_hours: Math.floor(uptime / 3600),
        memory_used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        memory_total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        database_status: "connected",
        media_files: mediaCount,
        promo_images: promoCount,
        rates_last_updated: ratesData?.created_date || null,
        node_version: process.version,
        last_sync: new Date().toISOString(),
      });
    } catch (error) {
      console.error('System info error:', error);
      res.status(500).json({
        status: "error",
        message: "Failed to fetch system information"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
