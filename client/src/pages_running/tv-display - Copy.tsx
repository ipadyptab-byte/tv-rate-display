import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ratesApi, promoApi, mediaApi, bannerApi, settingsApi } from "@/lib/api";

export default function TVDisplay() {
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showingRates, setShowingRates] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Effect for rotating between rates and media
  useEffect(() => {
    if (!settings?.show_media || mediaItems.length === 0) return;

    const ratesDisplayTime = (settings?.rates_display_duration || 15) * 1000;
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
    const duration = (currentPromo?.duration_seconds || 5) * 1000;

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoImages.length);
    }, duration);

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
  const rateFontSize = settings?.rate_number_font_size || "text-4xl";

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
    className="w-screen h-screen overflow-hidden box-border"
    style={{
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
      paddingLeft: "env(safe-area-inset-left)",
      paddingRight: "env(safe-area-inset-right)",
      backgroundColor: settings?.background_color || "#FFF8E1",
      color: settings?.text_color || "#212529",
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
            {/* Header with Company Logo */}
            <div className="relative bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-redtoday py-1 flex-shrink-0">
             <div className="container mx-auto px-10 flex items-center justify-between">
              <div className="w-full flex items-center justify-center py-2">
                {/* Replace text with logo */}
                 <img 
                   src="/logo.png" 
                   alt="Devi Jewellers Logo" 
                   className="h-40 object-contain"
                                                    />
                   </div>
    
                {/* Date and Time */}
                <div className="absolute top-4 right-6 bg-black bg-opacity-10 px-3 py-2 rounded-lg backdrop-blur-sm text-right">
                  <div className="text-3xl font-bold text-black">
                    {format(currentTime, "EEEE dd-MMM-yyyy")}
                  </div>
                  <div className="text-5xl font-bold text-black">
                    {format(currentTime, "HH:mm:ss")}
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Rate Header */}
            <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-red py-1 text-center flex-shrink-0">
              <h2 className="text-5xl font-display font-bold">TODAY'S RATES</h2>
            </div>

            {/* Rates Display - Main Content */}
            <div className="flex-1 container mx-auto px-1 py--1 min-h-0">
              <div className={`grid gap-8 h-full ${isVertical ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {/* Gold Rates */}
                <div className="space-y-2">
                  <h3 className="text-4xl font-display font-bold text-mid left text-jewelry-primary mb-6">GOLD RATES (Per 10 GMS)</h3>
                  
                  {/* 24K Gold */}
                  <div className="rate-card bg-white rounded-xl shadow-xl p-2 border-l-8 border-gold-500 fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-3xl font-bold text-gray-800">24K GOLD</h4>
                      <div className="w-4 h-4 bg-gold-500 rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-star text-white"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-2xl text-blue-600 font-semibold mb-1">SALE RATE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.gold_24k_sale}</p>
                      </div>
                      <div className="text-center p-4 bg-jewelry-accent bg-opacity-10 rounded-lg border border-blue-800 border-opacity-30">
                        <p className="text-2xl text-blue-600 font-semibold mb-1">PURCHASE RATE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.gold_24k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 22K Gold */}
                  <div className="rate-card bg-white rounded-xl shadow-xl p-2 border-l-8 border-gold-500 fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-3xl font-bold text-gray-800">22K GOLD</h4>
                      <div className="w-4 h-4 bg-gold-600 rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-medal text-white"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-2xl text-blue-600 font-semibold mb-1">SALE RATE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.gold_22k_sale}</p>
                      </div>
                      <div className="text-center p-4 bg-jewelry-accent bg-opacity-10 rounded-lg border border-blue-800 border-opacity-30">
                        <p className="text-2xl text-blue-600 font-semibold mb-1">PURCHASE RATE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.gold_22k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 18K Gold */}
                  <div className="rate-card bg-white rounded-xl shadow-xl p-2 border-l-8 border-gold-500 fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-3xl font-bold text-gray-800">18K GOLD</h4>
                      <div className="w-4 h-4 bg-gold-700 rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-crown text-white"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-2xl text-blue-600 font-semibold mb-1">SALE RATE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.gold_18k_sale}</p>
                      </div>
                      <div className="text-center p-4 bg-jewelry-accent bg-opacity-10 rounded-lg border border-blue-800 border-opacity-30">
                        <p className="text-2xl text-blue-600 font-semibold mb-1">PURCHASE RATE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.gold_18k_purchase}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Silver Rates & Promo Column */}
                <div className="space-y-6">
                  {/* Silver Rates */}
                  <div>
                    <h3 className="text-4xl font-display font-bold text-center text-jewelry-primary mb-6">SILVER RATES (Per KG)</h3>
                    
                    <div className="rate-card bg-white rounded-xl shadow-xl p-2 border-l-8 border-gray-400 fade-in">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-3xl font-bold text-gray-800">SILVER</h4>
                        <div className="w-4 h-4 bg-gray-400 rounded-full shadow-lg flex items-center justify-center">
                          <i className="fas fa-circle text-white"></i>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-2xl text-blue-600 font-semibold mb-1">SALE RATE</p>
                          <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.silver_per_kg_sale}</p>
                        </div>
                        <div className="text-center p-4 bg-jewelry-accent bg-opacity-10 rounded-lg border border-blue-800 border-opacity-30">
                          <p className="text-2xl text-blue-600 font-semibold mb-1">PURCHASE RATE</p>
                          <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.silver_per_kg_purchase}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promotional Slideshow */}
                  {promoImages.length > 0 && (
                    <div className="bg-gradient rounded-xl shadow-xs overflow-hidden fade-in flex-1">
                      <div className="relative aspect-video bg-gradient-to-br from-gold-100 to-gold-200 h-full">
                        <AnimatePresence mode="wait">
                          {currentPromo && (
                            <motion.img
                              key={currentPromo.id}
                              src={currentPromo.image_url}
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
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {promoImages.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentPromoIndex ? 'bg-gradient' : 'bg-gradient'
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
                className="flex-shrink-0 bg-white border-t-4 border-jewelry-primary shadow-lg"
                style={{ 
                  height: `${bannerSettings.banner_height || 120}px`
                }}
              >
                <div className="h-full flex items-center justify-center p-2">
                  <img 
                    src={bannerSettings.banner_image_url} 
                    alt="Banner" 
                    className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
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
                  src={currentMedia.file_url} 
                  alt={currentMedia.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video 
                  src={currentMedia.file_url} 
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
