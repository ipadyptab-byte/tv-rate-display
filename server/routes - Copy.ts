import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import path from "path";
import { mkdirSync, existsSync } from "fs";
import {
  insertGoldRateSchema,
  insertDisplaySettingsSchema,
  insertMediaItemSchema,
  insertPromoImageSchema,
  insertBannerSettingsSchema
} from "@shared/schema";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const mediaDir = path.join(uploadsDir, "media");
const promoDir = path.join(uploadsDir, "promo");
const bannerDir = path.join(uploadsDir, "banner");

[mediaDir, promoDir, bannerDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, mediaDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const promoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, promoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bannerDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMedia = multer({ 
  storage: mediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

const uploadPromo = multer({ 
  storage: promoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG and PNG images are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

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
        res.status(500).json({ message: "Failed to create rates" });
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

  app.put("/api/settings/display/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDisplaySettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateDisplaySettings(id, validatedData);
      if (updatedSettings) {
        res.json(updatedSettings);
      } else {
        res.status(404).json({ message: "Settings not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  // Media Items Routes
  app.get("/api/media", async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const media = await storage.getMediaItems(activeOnly);
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media items" });
    }
  });

  app.post("/api/media/upload", uploadMedia.array('files', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const createdItems = [];
      for (const file of files) {
        const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        const fileUrl = `/uploads/media/${file.filename}`;
        
        const mediaItem = await storage.createMediaItem({
          name: file.originalname,
          file_url: fileUrl,
          media_type: mediaType,
          duration_seconds: parseInt(req.body.duration) || 30,
          order_index: 0,
          is_active: req.body.autoActivate === 'true',
          file_size: file.size,
          mime_type: file.mimetype
        });
        
        createdItems.push(mediaItem);
      }

      res.status(201).json(createdItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload media files" });
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
      const activeOnly = req.query.active === 'true';
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

      const createdItems = [];
      for (const file of files) {
        const imageUrl = `/uploads/promo/${file.filename}`;
        
        const promoImage = await storage.createPromoImage({
          name: file.originalname,
          image_url: imageUrl,
          duration_seconds: parseInt(req.body.duration) || 5,
          transition_effect: req.body.transition || 'fade',
          order_index: 0,
          is_active: req.body.autoActivate === 'true',
          file_size: file.size
        });
        
        createdItems.push(promoImage);
      }

      res.status(201).json(createdItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload promotional images" });
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

  app.post("/api/banner/upload", uploadBanner.single('banner'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No banner file uploaded" });
      }

      const bannerUrl = `/uploads/banner/${file.filename}`;
      
      // Deactivate existing banners and create new one
      // This would require additional implementation to deactivate existing banners
      
      res.status(201).json({ 
        banner_image_url: bannerUrl,
        message: "Banner uploaded successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });

  // System Info Route
  app.get("/api/system/info", (req, res) => {
    res.json({
      status: "online",
      local_ip: "192.168.31.177:3000",
      connected_devices: 3,
      storage_used: "245 MB",
      storage_total: "2 GB",
      last_sync: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
