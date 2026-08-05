import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ratesApi, promoApi, mediaApi, bannerApi, settingsApi } from "@/lib/api";

// Utility function to calculate relative luminance
const getLuminance = (hex: string): number => {
  const rgb = hex.replace('#', '').match(/.{2}/g);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(c => {
    const val = parseInt(c, 16) / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Function to determine if a color is light or dark
const isLightColor = (hex: string): boolean => {
  return getLuminance(hex) > 0.5;
};

// Get contrasting rate number color based on background (fallback if text_color not set)
const getRateNumberColor = (backgroundColor: string, textColor?: string): string => {
  return textColor || (isLightColor(backgroundColor) ? "#1a365d" : "#ffffff");
};

// Get contrasting label color based on background
const getRateLabelColor = (backgroundColor: string, textColor?: string): string => {
  return textColor || (isLightColor(backgroundColor) ? "#2c5282" : "#e2e8f0");
};

// Get contrasting box background color based on background
const getRateBoxBg = (backgroundColor: string): string => {
  return isLightColor(backgroundColor) ? "#edf2f7" : "#2d3748";
};

export default function TVDisplay() {
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showingRates, setShowingRates] = useState(true);
  // Create a function to get Indian time
  const getIndianTime = () => {
    const now = new Date();
    // Convert to Indian timezone (Asia/Kolkata)
    const indianTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    return indianTime;
  };
  
  const [currentTime, setCurrentTime] = useState(getIndianTime());
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'tv'>('desktop');

  // Enhanced screen size detection for TV, tablet, mobile, and desktop
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = width / height;
      
      // Consider it a TV if: width >= 1280 and either aspect ratio > 1.5 OR height < 900
      // This helps identify 42"+ TVs which typically have 16:9 or wider aspect ratios
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024 || (width < 1280 && aspectRatio < 1.5)) {
        setScreenSize('tablet');
      } else if (width < 1600 || (width < 1920 && height > 900)) {
        setScreenSize('desktop');
      } else {
        setScreenSize('tv');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Data queries
  const { data: currentRates } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    refetchInterval: 30000
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings/display"],
    queryFn: settingsApi.getDisplay,
    refetchInterval: 30000
  });

  const { data: mediaItems = [] } = useQuery({
    queryKey: ["/api/media"],
    queryFn: () => mediaApi.getAll(true),
    refetchInterval: 30000
  });

  const { data: promoImages = [] } = useQuery({
    queryKey: ["/api/promo"],
    queryFn: () => promoApi.getAll(true),
    refetchInterval: 30000
  });

  const { data: bannerSettings } = useQuery({
    queryKey: ["/api/banner"],
    queryFn: bannerApi.getCurrent,
    refetchInterval: 30000
  });

  // Effect for the live clock
  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(getIndianTime()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Effect for rotating between rates and media
  useEffect(() => {
    if (!settings?.show_media || mediaItems.length === 0) return;

    const ratesDisplayTime = (settings?.rates_display_duration_seconds || 15) * 1000;
    const currentMedia = mediaItems[currentMediaIndex];
    const mediaDisplayTime = (currentMedia?.duration_seconds || 30) * 1000;

    const interval = setInterval(() => {
      if (showingRates) {
        setShowingRates(false);
      } else {
        setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
        setShowingRates(true);
      }
    }, showingRates ? ratesDisplayTime : mediaDisplayTime);

    return () => clearInterval(interval);
  }, [showingRates, currentMediaIndex, mediaItems, settings]);

  // Effect for the promotional image slideshow
  useEffect(() => {
    if (promoImages.length <= 1) return;

    const currentPromo = promoImages[currentPromoIndex];
    const duration_seconds = (currentPromo?.duration_seconds || 5) * 1000;

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoImages.length);
    }, duration_seconds);

    return () => clearInterval(interval);
  }, [currentPromoIndex, promoImages]);

  // Reset indices when arrays change
  useEffect(() => {
    if (mediaItems.length > 0 && currentMediaIndex >= mediaItems.length) {
      setCurrentMediaIndex(0);
    }
  }, [mediaItems, currentMediaIndex]);

  useEffect(() => {
    if (promoImages.length > 0 && currentPromoIndex >= promoImages.length) {
      setCurrentPromoIndex(0);
    }
  }, [promoImages, currentPromoIndex]);

  const isVertical = settings?.orientation === "vertical";
  const currentPromo = promoImages[currentPromoIndex];
  
  // Enhanced responsive font sizing - optimized for all screens
  const getRateFontSize = () => {
    if (screenSize === 'mobile') return "text-lg";
    if (screenSize === 'tablet') return "text-2xl";
    if (screenSize === 'tv') return "text-5xl";
    return settings?.rate_number_font_size || "text-3xl";
  };
  
  // Get spacing based on screen size
  const getSpacing = () => {
    if (screenSize === 'mobile') return { container: "p-1", card: "p-2", gap: "gap-2" };
    if (screenSize === 'tablet') return { container: "p-3", card: "p-4", gap: "gap-4" };
    if (screenSize === 'tv') return { container: "p-4", card: "p-6", gap: "gap-6" };
    return { container: "p-3", card: "p-4", gap: "gap-4" };
  };
  const spacing = getSpacing();
  const rateFontSize = getRateFontSize();

  const getAnimationVariants = (effect: string) => {
    const transitions = {
      fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
      'slide-left': { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
      'slide-right': { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '100%' } },
      'zoom-in': { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.8, opacity: 0 } },
      'zoom-out': { initial: { scale: 1.2, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 } },
      'flip-x': { initial: { rotateX: -90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 }, exit: { rotateX: 90, opacity: 0 } },
      'flip-y': { initial: { rotateY: -90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 }, exit: { rotateY: 90, opacity: 0 } },
      'rotate-in': { initial: { rotate: -90, scale: 0.8, opacity: 0 }, animate: { rotate: 0, scale: 1, opacity: 1 }, exit: { rotate: 90, scale: 0.8, opacity: 0 } },
      'rotate-out': { initial: { rotate: 90, scale: 0.8, opacity: 0 }, animate: { rotate: 0, scale: 1, opacity: 1 }, exit: { rotate: -90, scale: 0.8, opacity: 0 } },
      bounce: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.5, opacity: 0 } },
    };
    return transitions[effect as keyof typeof transitions] || transitions.fade;
  };

  const animationVariants = currentPromo ? getAnimationVariants(currentPromo.transition_effect || 'fade') : getAnimationVariants('fade');
  const transitionProps = {
    duration: 0.8,
    ease: currentPromo?.transition_effect === 'bounce' ? [0.34, 1.56, 0.64, 1] : "easeInOut" as const,
  };

  if (!currentRates) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-jewelry-primary to-jewelry-secondary">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-semibold">Loading Rates...</p>
        </div>
      </div>
    );
  }

  const currentMedia = mediaItems[currentMediaIndex];

  return (
    <div 
      className={`w-full h-screen overflow-hidden flex flex-col`}
      style={{ 
        backgroundColor: settings?.background_color || "#FFF8E1",
        color: settings?.text_color || "#212529"
      }}
    >
      <AnimatePresence mode="wait">
        {showingRates ? (
          <motion.div
            key="rates"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {/* Common Header - matches Mobile Control page, with date/time on top-right */}
            <div className={`relative bg-gradient-to-r from-gold-600 to-gold-700 text-black ${spacing.container} flex justify-center flex-shrink-0`}>
              <img 
                src="/logo.png" 
                alt="Devi Jewellers Logo"
                className={screenSize === 'tv' ? 'h-24 w-[280px]' : screenSize === 'tablet' ? 'h-16 w-[200px]' : 'h-12 w-[150px]'}
              />
              {/* Date & Time - top-right */}
              <div className={`absolute ${screenSize === 'tv' ? 'top-2 right-4' : screenSize === 'tablet' ? 'top-2 right-3' : 'top-1 right-2'} text-right`}>
                <p className={`font-semibold ${screenSize === 'tv' ? 'text-2xl' : screenSize === 'tablet' ? 'text-base' : 'text-xs'} text-gray-800`}>
                  {format(currentTime, "EEEE, MMMM d, yyyy")}
                </p>
                <p className={`font-bold ${screenSize === 'tv' ? 'text-3xl' : screenSize === 'tablet' ? 'text-lg' : 'text-sm'} text-blue-700`}>
                  {format(currentTime, "hh:mm:ss a")}
                </p>
              </div>
            </div>

            {/* Today's Rate Header */}
            <div className={`bg-gradient-to-r from-gold-600 to-gold-700 text-black text-center flex-shrink-0 ${screenSize === 'tv' ? 'py-2' : screenSize === 'tablet' ? 'py-2' : 'py-1'}`}>
              <h2 className={`font-display font-bold ${screenSize === 'tv' ? 'text-4xl' : screenSize === 'tablet' ? 'text-xl' : 'text-lg'}`}>TODAY'S RATES</h2>
            </div>

            {/* Rates Display - Main Content */}
            <div className={`flex-1 container mx-auto ${screenSize === 'tv' ? 'px-4 py-2' : screenSize === 'tablet' ? 'px-3 py-3' : 'px-2 py-2'}`}>
              <div className={`grid ${spacing.gap} ${screenSize === 'mobile' || isVertical ? 'grid-cols-1' : 'grid-cols-2'} h-full`}>
                {/* Gold Rates */}
                <div className={`space-y-${screenSize === 'tv' ? '3' : screenSize === 'tablet' ? '2' : '2'}`}>
                  <h3 className={`font-display font-bold text-center text-jewelry-primary ${screenSize === 'tv' ? 'text-xl' : screenSize === 'tablet' ? 'text-lg' : 'text-sm'}`}>GOLD RATES (Per 10 GMS)</h3>
                  
                  {/* 24K Gold */}
                  <div className={`rate-card bg-white rounded-lg shadow-md ${spacing.card} border-l-4 border-jewelry-primary fade-in`}>
                    <div className={`flex justify-between items-center ${screenSize === 'tv' ? 'mb-2' : 'mb-1'}`}>
                      <h4 className={`font-bold ${screenSize === 'tv' ? 'text-2xl' : screenSize === 'tablet' ? 'text-xl' : 'text-base'}`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>24K GOLD</h4>
                      <div className={`bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center ${screenSize === 'tv' ? 'w-8 h-8' : screenSize === 'tablet' ? 'w-6 h-6' : 'w-5 h-5'}`}>
                        <i className="fas fa-star text-white"></i>
                      </div>
                    </div>
                    <div className={`grid grid-cols-2 gap-${screenSize === 'tv' ? '3' : '2'}`}>
                      <div className="text-center p-1 rounded-lg border" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1"), borderColor: isLightColor(settings?.background_color || "#FFF8E1") ? "#cbd5e0" : "#4a5568" }}>
                        <p className={`font-semibold ${screenSize === 'tv' ? 'text-base' : screenSize === 'tablet' ? 'text-xs' : 'text-[10px]'}`} style={{ color: getRateLabelColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>SALE RATE</p>
                        <p className={`${rateFontSize} font-bold`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>₹{currentRates.gold_24k_sale}</p>
                      </div>
                      <div className="text-center p-1 rounded-lg border" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1"), borderColor: isLightColor(settings?.background_color || "#FFF8E1") ? "#cbd5e0" : "#4a5568" }}>
                        <p className={`font-semibold ${screenSize === 'tv' ? 'text-base' : screenSize === 'tablet' ? 'text-xs' : 'text-[10px]'}`} style={{ color: getRateLabelColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>PURCHASE RATE</p>
                        <p className={`${rateFontSize} font-bold`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>₹{currentRates.gold_24k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 22K Gold */}
                  <div className={`rate-card bg-white rounded-lg shadow-md ${spacing.card} border-l-4 border-jewelry-primary fade-in`}>
                    <div className={`flex justify-between items-center ${screenSize === 'tv' ? 'mb-2' : 'mb-1'}`}>
                      <h4 className={`font-bold ${screenSize === 'tv' ? 'text-2xl' : screenSize === 'tablet' ? 'text-xl' : 'text-base'}`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>22K GOLD</h4>
                      <div className={`bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center ${screenSize === 'tv' ? 'w-8 h-8' : screenSize === 'tablet' ? 'w-6 h-6' : 'w-5 h-5'}`}>
                        <i className="fas fa-crown text-white"></i>
                      </div>
                    </div>
                    <div className={`grid grid-cols-2 gap-${screenSize === 'tv' ? '3' : '2'}`}>
                      <div className="text-center p-1 rounded-lg border" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1"), borderColor: isLightColor(settings?.background_color || "#FFF8E1") ? "#cbd5e0" : "#4a5568" }}>
                        <p className={`font-semibold ${screenSize === 'tv' ? 'text-base' : screenSize === 'tablet' ? 'text-xs' : 'text-[10px]'}`} style={{ color: getRateLabelColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>SALE RATE</p>
                        <p className={`${rateFontSize} font-bold`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>₹{currentRates.gold_22k_sale}</p>
                      </div>
                      <div className="text-center p-1 rounded-lg border" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1"), borderColor: isLightColor(settings?.background_color || "#FFF8E1") ? "#cbd5e0" : "#4a5568" }}>
                        <p className={`font-semibold ${screenSize === 'tv' ? 'text-base' : screenSize === 'tablet' ? 'text-xs' : 'text-[10px]'}`} style={{ color: getRateLabelColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>PURCHASE RATE</p>
                        <p className={`${rateFontSize} font-bold`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>₹{currentRates.gold_22k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 18K Gold */}
                  <div className={`rate-card bg-white rounded-lg shadow-md ${spacing.card} border-l-4 border-jewelry-primary fade-in`}>
                    <div className={`flex justify-between items-center ${screenSize === 'tv' ? 'mb-2' : 'mb-1'}`}>
                      <h4 className={`font-bold ${screenSize === 'tv' ? 'text-2xl' : screenSize === 'tablet' ? 'text-xl' : 'text-base'}`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>18K GOLD</h4>
                      <div className={`bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center ${screenSize === 'tv' ? 'w-8 h-8' : screenSize === 'tablet' ? 'w-6 h-6' : 'w-5 h-5'}`}>
                        <i className="fas fa-gem text-white"></i>
                      </div>
                    </div>
                    <div className={`grid grid-cols-2 gap-${screenSize === 'tv' ? '3' : '2'}`}>
                      <div className="text-center p-1 rounded-lg border" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1"), borderColor: isLightColor(settings?.background_color || "#FFF8E1") ? "#cbd5e0" : "#4a5568" }}>
                        <p className={`font-semibold ${screenSize === 'tv' ? 'text-base' : screenSize === 'tablet' ? 'text-xs' : 'text-[10px]'}`} style={{ color: getRateLabelColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>SALE RATE</p>
                        <p className={`${rateFontSize} font-bold`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>₹{currentRates.gold_18k_sale}</p>
                      </div>
                      <div className="text-center p-1 rounded-lg border" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1"), borderColor: isLightColor(settings?.background_color || "#FFF8E1") ? "#cbd5e0" : "#4a5568" }}>
                        <p className={`font-semibold ${screenSize === 'tv' ? 'text-base' : screenSize === 'tablet' ? 'text-xs' : 'text-[10px]'}`} style={{ color: getRateLabelColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>PURCHASE RATE</p>
                        <p className={`${rateFontSize} font-bold`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>₹{currentRates.gold_18k_purchase}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Silver Rates & Promo Column */}
                <div className={`space-y-${screenSize === 'tv' ? '3' : '2'}`}>
                  {/* Silver Rates */}
                  <div>
                    <h3 className={`font-display font-bold text-center ${screenSize === 'tv' ? 'text-xl' : screenSize === 'tablet' ? 'text-lg' : 'text-sm'}`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>SILVER RATES (Per KG)</h3>
                    
                    <div className={`rate-card bg-white rounded-lg shadow-md ${spacing.card} border-l-4 border-jewelry-primary fade-in`}>
                      <div className={`flex justify-between items-center ${screenSize === 'tv' ? 'mb-2' : 'mb-1'}`}>
                        <h4 className={`font-bold ${screenSize === 'tv' ? 'text-2xl' : screenSize === 'tablet' ? 'text-xl' : 'text-base'}`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>SILVER</h4>
                        <div className={`bg-jewelry-primary rounded-full shadow-lg flex items-center justify-center ${screenSize === 'tv' ? 'w-8 h-8' : screenSize === 'tablet' ? 'w-6 h-6' : 'w-5 h-5'}`}>
                          <i className="fas fa-circle text-white"></i>
                        </div>
                      </div>
                      <div className={`grid grid-cols-2 gap-${screenSize === 'tv' ? '3' : '2'}`}>
                        <div className="text-center p-1 rounded-lg border" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1"), borderColor: isLightColor(settings?.background_color || "#FFF8E1") ? "#cbd5e0" : "#4a5568" }}>
                          <p className={`font-semibold ${screenSize === 'tv' ? 'text-base' : screenSize === 'tablet' ? 'text-xs' : 'text-[10px]'}`} style={{ color: getRateLabelColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>SALE RATE</p>
                          <p className={`${rateFontSize} font-bold`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>₹{currentRates.silver_per_kg_sale}</p>
                        </div>
                        <div className="text-center p-1 rounded-lg border" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1"), borderColor: isLightColor(settings?.background_color || "#FFF8E1") ? "#cbd5e0" : "#4a5568" }}>
                          <p className={`font-semibold ${screenSize === 'tv' ? 'text-base' : screenSize === 'tablet' ? 'text-xs' : 'text-[10px]'}`} style={{ color: getRateLabelColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>PURCHASE RATE</p>
                          <p className={`${rateFontSize} font-bold`} style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>₹{currentRates.silver_per_kg_purchase}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promotional Slideshow */}
                  {promoImages.length > 0 && (
                    <div className={`bg-gradient-to-br from-gold-100 to-gold-200 rounded-lg shadow-md overflow-hidden fade-in flex-1 ${screenSize === 'tv' ? 'min-h-[200px]' : ''}`}>
                      <div className="relative bg-gradient-to-br from-gold-100 to-gold-200 h-full">
                        <AnimatePresence mode="wait">
                          {currentPromo && (
                            <motion.img
                              key={currentPromo.id}
                              src={currentPromo.image_url || ""}
                              alt={currentPromo.name || "Promotional Image"}
                              className="w-full h-full object-contain"
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              variants={animationVariants}
                              transition={transitionProps}
                            />
                          )}
                        </AnimatePresence>
                        
                        {/* Slideshow Indicators */}
                        {promoImages.length > 1 && (
                          <div className={`absolute left-1/2 transform -translate-x-1/2 flex ${screenSize === 'tv' ? 'bottom-2 space-x-2' : 'bottom-1 space-x-1'}`}>
                            {promoImages.map((_, index) => (
                              <div
                                key={index}
                                className={`rounded-full transition-colors ${screenSize === 'tv' ? 'w-2 h-2' : 'w-1.5 h-1.5'} ${
                                  index === currentPromoIndex ? 'bg-gold-600' : 'bg-gold-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Banner */}
            {bannerSettings?.banner_image_url && (
              <div 
                className="flex-shrink-0 bg-white border-t-2 md:border-t-4 border-jewelry-primary shadow-md md:shadow-lg"
                style={{ 
                  height: `${screenSize === 'mobile' ? (bannerSettings.banner_height || 120) * 0.6 : bannerSettings.banner_height || 120}px`
                }}
              >
                <div className="h-full flex items-center justify-center p-1 md:p-2">
                  <img 
                    src={bannerSettings.banner_image_url} 
                    alt="Banner" 
                    className="max-h-full max-w-full object-contain rounded md:rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          currentMedia && (
            <motion.div
              key={`media-${currentMediaIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full flex items-center justify-center bg-black"
            >
              {currentMedia.media_type === "image" ? (
                <img 
                  src={currentMedia.file_url || ""} 
                  alt={currentMedia.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video 
                  src={currentMedia.file_url || ""} 
                  autoPlay 
                  muted 
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
