import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ratesApi, promoApi, mediaApi, bannerApi, settingsApi } from "@/lib/api";

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
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width >= 768 && width < 1024) {
        setScreenSize('tablet');
      } else if (width >= 1024 && width < 1920) {
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
  
  // Dynamic font sizing based on settings and screen size
  const getRateFontSize = () => {
    const baseSize = settings?.rate_number_font_size || 36;
    if (screenSize === 'mobile') return Math.round(baseSize * 0.7);
    if (screenSize === 'tablet') return Math.round(baseSize * 1.2);
    if (screenSize === 'tv') return Math.round(baseSize * 1.5);
    return baseSize;
  };
  const rateFontSize = getRateFontSize();

  // Get colors from settings
  const rateNumberColor = settings?.rate_number_color || "#1e40af";
  const goldLabelColor = settings?.gold_rate_label_color || "#1f2937";
  const silverLabelColor = settings?.silver_rate_label_color || "#1f2937";
  const headerColor = settings?.header_color || "#000000";

  // Get label font sizes
  const getLabelFontSize = (isGold: boolean) => {
    const baseSize = isGold 
      ? (settings?.gold_rate_label_font_size || 18) 
      : (settings?.silver_rate_label_font_size || 18);
    if (screenSize === 'mobile') return Math.round(baseSize * 0.8);
    if (screenSize === 'tablet') return Math.round(baseSize * 1.1);
    if (screenSize === 'tv') return Math.round(baseSize * 1.3);
    return baseSize;
  };
  const goldLabelFontSize = getLabelFontSize(true);
  const silverLabelFontSize = getLabelFontSize(false);

  // Get header font size
  const getHeaderFontSize = () => {
    const baseSize = settings?.header_font_size || 28;
    if (screenSize === 'mobile') return Math.round(baseSize * 0.7);
    if (screenSize === 'tablet') return Math.round(baseSize * 1.1);
    if (screenSize === 'tv') return Math.round(baseSize * 1.5);
    return baseSize;
  };
  const headerFontSize = getHeaderFontSize();

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
      className={`w-full h-screen overflow-y-auto flex flex-col ${screenSize === 'mobile' ? 'p-2' : ''}`}
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
            <div className="relative bg-gradient-to-r from-gold-600 to-gold-700 text-black p-4 flex justify-center flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Devi Jewellers Logo"
                className="h-40 w-[350px] object-contain"
              />
              {/* Date & Time - top-right */}
              <div className="absolute top-2 right-2 md:top-4 md:right-4 text-right">
                <p className={`font-semibold ${screenSize === 'tv' ? 'text-3xl' : screenSize === 'tablet' ? 'text-lg' : 'text-xs md:text-sm'} text-gray-800`}>
                  {format(currentTime, "EEEE, MMMM d, yyyy")}
                </p>
                <p className={`font-bold ${screenSize === 'tv' ? 'text-4xl' : screenSize === 'tablet' ? 'text-xl' : 'text-sm md:text-lg'} text-blue-700`}>
                  {format(currentTime, "hh:mm:ss a")}
                </p>
              </div>
            </div>

            {/* Today's Rate Header */}
            <div className={`bg-gradient-to-r from-gold-600 to-gold-700 text-black text-center flex-shrink-0 ${screenSize === 'tv' ? 'py-4' : 'py-2 md:py-3'}`}>
              <h2 
                className="font-display font-bold"
                style={{ fontSize: `${headerFontSize}px`, color: headerColor }}
              >TODAY'S RATES</h2>
            </div>

            {/* Rates Display - Main Content */}
            <div className={`flex-1 container mx-auto ${screenSize === 'tv' ? 'px-12 py-12' : screenSize === 'tablet' ? 'px-4 py-6' : 'px-2 md:px-6 py-4 md:py-8'}`}>
              <div className={`grid ${screenSize === 'tv' ? 'gap-12' : screenSize === 'tablet' ? 'gap-6' : 'gap-4 md:gap-8'} ${screenSize === 'mobile' || isVertical ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {/* Gold Rates */}
                <div className="space-y-4 md:space-y-6">
                  <h3 className="font-display font-bold text-center text-jewelry-primary mb-4 md:mb-6" style={{ fontSize: `${goldLabelFontSize + 8}px`, color: goldLabelColor }}>GOLD RATES (Per 10 GMS)</h3>
                  
                  {/* 24K Gold */}
                  <div className="rate-card bg-white rounded-lg md:rounded-xl shadow-md md:shadow-xl p-3 md:p-6 border-l-4 md:border-l-8 border-jewelry-primary fade-in">
                    <div className="flex justify-between items-center mb-2 md:mb-4">
                      <h4 className="font-bold" style={{ fontSize: `${goldLabelFontSize + 4}px`, color: goldLabelColor }}>24K GOLD</h4>
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-star text-white text-sm md:text-base"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div className="text-center p-2 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-semibold mb-1" style={{ fontSize: `${goldLabelFontSize - 2}px`, color: goldLabelColor }}>SALE RATE</p>
                        <p className="font-bold" style={{ fontSize: `${rateFontSize}px`, color: rateNumberColor }}>₹{currentRates.gold_24k_sale}</p>
                      </div>
                      <div className="text-center p-2 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-semibold mb-1" style={{ fontSize: `${goldLabelFontSize - 2}px`, color: goldLabelColor }}>PURCHASE RATE</p>
                        <p className="font-bold" style={{ fontSize: `${rateFontSize}px`, color: rateNumberColor }}>₹{currentRates.gold_24k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 22K Gold */}
                  <div className="rate-card bg-white rounded-lg md:rounded-xl shadow-md md:shadow-xl p-3 md:p-6 border-l-4 md:border-l-8 border-jewelry-primary fade-in">
                    <div className="flex justify-between items-center mb-2 md:mb-4">
                      <h4 className="font-bold" style={{ fontSize: `${goldLabelFontSize + 4}px`, color: goldLabelColor }}>22K GOLD</h4>
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-crown text-white text-sm md:text-base"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div className="text-center p-2 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-semibold mb-1" style={{ fontSize: `${goldLabelFontSize - 2}px`, color: goldLabelColor }}>SALE RATE</p>
                        <p className="font-bold" style={{ fontSize: `${rateFontSize}px`, color: rateNumberColor }}>₹{currentRates.gold_22k_sale}</p>
                      </div>
                      <div className="text-center p-2 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-semibold mb-1" style={{ fontSize: `${goldLabelFontSize - 2}px`, color: goldLabelColor }}>PURCHASE RATE</p>
                        <p className="font-bold" style={{ fontSize: `${rateFontSize}px`, color: rateNumberColor }}>₹{currentRates.gold_22k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 18K Gold */}
                  <div className="rate-card bg-white rounded-lg md:rounded-xl shadow-md md:shadow-xl p-3 md:p-6 border-l-4 md:border-l-8 border-jewelry-primary fade-in">
                    <div className="flex justify-between items-center mb-2 md:mb-4">
                      <h4 className="font-bold" style={{ fontSize: `${goldLabelFontSize + 4}px`, color: goldLabelColor }}>18K GOLD</h4>
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-crown text-white text-sm md:text-base"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div className="text-center p-2 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-semibold mb-1" style={{ fontSize: `${goldLabelFontSize - 2}px`, color: goldLabelColor }}>SALE RATE</p>
                        <p className="font-bold" style={{ fontSize: `${rateFontSize}px`, color: rateNumberColor }}>₹{currentRates.gold_18k_sale}</p>
                      </div>
                      <div className="text-center p-2 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-semibold mb-1" style={{ fontSize: `${goldLabelFontSize - 2}px`, color: goldLabelColor }}>PURCHASE RATE</p>
                        <p className="font-bold" style={{ fontSize: `${rateFontSize}px`, color: rateNumberColor }}>₹{currentRates.gold_18k_purchase}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Silver Rates & Promo Column */}
                <div className="space-y-4 md:space-y-6">
                  {/* Silver Rates */}
                  <div>
                    <h3 className="font-display font-bold text-center text-jewelry-primary mb-4 md:mb-6" style={{ fontSize: `${silverLabelFontSize + 8}px`, color: silverLabelColor }}>SILVER RATES (Per KG)</h3>
                    
                    <div className="rate-card bg-white rounded-lg md:rounded-xl shadow-md md:shadow-xl p-3 md:p-6 border-l-4 md:border-l-8 border-jewelry-primary fade-in">
                      <div className="flex justify-between items-center mb-2 md:mb-4">
                        <h4 className="font-bold" style={{ fontSize: `${silverLabelFontSize + 4}px`, color: silverLabelColor }}>SILVER</h4>
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-jewelry-primary rounded-full shadow-lg flex items-center justify-center">
                          <i className="fas fa-circle text-white text-sm md:text-base"></i>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:gap-4">
                        <div className="text-center p-2 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="font-semibold mb-1" style={{ fontSize: `${silverLabelFontSize - 2}px`, color: silverLabelColor }}>SALE RATE</p>
                          <p className="font-bold" style={{ fontSize: `${rateFontSize}px`, color: rateNumberColor }}>₹{currentRates.silver_per_kg_sale}</p>
                        </div>
                        <div className="text-center p-2 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="font-semibold mb-1" style={{ fontSize: `${silverLabelFontSize - 2}px`, color: silverLabelColor }}>PURCHASE RATE</p>
                          <p className="font-bold" style={{ fontSize: `${rateFontSize}px`, color: rateNumberColor }}>₹{currentRates.silver_per_kg_purchase}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promotional Slideshow */}
                  {promoImages.length > 0 && (
                    <div className="bg-gradient-to-br from-gold-100 to-gold-200 rounded-lg md:rounded-xl shadow-md md:shadow-xl overflow-hidden fade-in flex-1">
                      <div className="relative aspect-video bg-gradient-to-br from-gold-100 to-gold-200 h-full">
                        <AnimatePresence mode="wait">
                          {currentPromo && (
                            <motion.img
                              key={currentPromo.id}
                              src={currentPromo.image_url || ""}
                              alt={currentPromo.name || "Promotional Image"}
                              className="w-full h-full object-cover"
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
                          <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 md:space-x-2">
                            {promoImages.map((_, index) => (
                              <div
                                key={index}
                                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors ${
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