import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ratesApi, promoApi, mediaApi, bannerApi, settingsApi } from "@/lib/api";

export default function TVDisplay() {
  const queryClient = useQueryClient();
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
  const { data: currentRates, isLoading: ratesLoading, error: ratesError } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    refetchInterval: 30000
  });

  const syncRatesMutation = useMutation({
    mutationFn: ratesApi.sync,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/rates/current"] });
    },
  });

  useEffect(() => {
    if (currentRates === null && !syncRatesMutation.isPending && !syncRatesMutation.isSuccess) {
      syncRatesMutation.mutate();
    }
  }, [currentRates]);

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

  

  // Enhanced responsive font sizing
  const getRateFontSize = () => {
    if (screenSize === 'mobile') return "text-xl";
    if (screenSize === 'tablet') return "text-3xl";
    if (screenSize === 'tv') return "text-4xl";
    return settings?.rate_number_font_size || "text-4xl";
  };
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
    duration_seconds: 0.8,
    ease: currentPromo?.transition_effect === 'bounce' ? [0.34, 1.56, 0.64, 1] : "easeInOut" as const,
  };

  if (ratesLoading || syncRatesMutation.isPending) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-jewelry-primary to-jewelry-secondary">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-semibold">Loading Rates...</p>
        </div>
      </div>
    );
  }

  if (ratesError) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-jewelry-primary to-jewelry-secondary">
        <div className="text-center text-white max-w-xl px-6">
          <p className="text-2xl font-semibold mb-2">Unable to load rates</p>
          <p className="text-sm opacity-90 break-words">{(ratesError as Error).message}</p>
          <p className="text-sm opacity-90 mt-4">Check that /api is working and DATABASE_URL is set in Vercel.</p>
        </div>
      </div>
    );
  }

  if (!currentRates) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-jewelry-primary to-jewelry-secondary">
        <div className="text-center text-white max-w-xl px-6">
          <p className="text-2xl font-semibold mb-2">No rates yet</p>
          <p className="text-sm opacity-90">Open <span className="font-semibold">/rates-sync</span> to sync, or configure a cron job to call <span className="font-semibold">/api/rates/sync</span>.</p>
        </div>
      </div>
    );
  }

  const currentMedia = mediaItems[currentMediaIndex];

  return (
    <div 
      className={`w-full h-screen ${screenSize === 'mobile' ? 'overflow-y-auto' : 'overflow-hidden'} flex flex-col ${screenSize === 'mobile' ? 'p-2' : ''}`}
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
            transition={{ duration_seconds: 0.5, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {/* Header - transparent with centered logo and right-aligned date/time */}
            <div className={`relative bg-transparent flex-shrink-0 ${screenSize === 'tv' ? 'py-1' : 'py-1 md:py-2'}`}>
              <div className="w-full grid grid-cols-3 items-center px-2 md:px-4">
                {/* Left spacer to ensure true visual center for logo */}
                <div />
                {/* Center: Logo */}
                <div className="flex justify-center">
                  <img
                    src="/logo.png"
                    alt="Devi Jewellers Logo"
                    className="h-20 md:h-24 w-auto object-contain"
                  />
                </div>
                {/* Right: Date/Time */}
                <div className="justify-self-end text-right bg-black/20 rounded px-2 py-1">
                  <div className="leading-tight text-lg md:text-xl font-bold text-black">
                    {format(currentTime, "EEE dd-MMM-yyyy")}
                  </div>
                  <div className="font-extrabold text-white leading-tight text-base md:text-3xl">
                    {format(currentTime, "HH:mm:ss")}
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Rate Header - Running text */}
            <div className={`bg-gradient-to-r from-gold-600 to-gold-700 text-white flex-shrink-0 ${screenSize === 'tv' ? 'py-0' : 'py-2 md:py-2'}`}>
              <div className="overflow-hidden">
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: '-100%' }}
                  transition={{ repeat: Infinity, repeatType: 'loop', duration: 36, ease: 'linear' }}
                  className={`font-display font-bold ${screenSize === 'tv' ? 'text-4xl' : screenSize === 'tablet' ? 'text-2xl' : 'text-xl md:text-3xl'} flex items-center w-full gap-24`}
                >
                  <span className="flex-none text-center">TODAYS RATE</span>
                  <span className="flex-none text-center">JOIN OUR VARIOUS SAVINGS SCHEME</span>

                  <span className="flex-none text-center">TODAYS RATE</span>
                  <span className="flex-none text-center">JOIN OUR VARIOUS SAVINGS SCHEME</span>

                  <span className="flex-none text-center">TODAYS RATE</span>
                  <span className="flex-none text-center">JOIN OUR VARIOUS SAVINGS SCHEME</span>

                  <span className="flex-none text-center">TODAYS RATE</span>
                  <span className="flex-none text-center">JOIN OUR VARIOUS SAVINGS SCHEME</span>

                  {/* Spacer to add a short blank gap after the four labels */}
                  <span className="flex-none w-64"></span>
                </motion.div>
              </div>
            </div>
            {/* Rates Display - Main Content */}
            <div className={`flex-1 w-full ${screenSize === 'tv' ? 'px-2 py-2' : screenSize === 'tablet' ? 'px-4 py-6' : 'px-2 md:px-6 py-4 md:py-8'}`}>
              <div
                className={`grid h-full ${screenSize === 'tv' ? 'gap-2' : screenSize === 'tablet' ? 'gap-4' : 'gap-3 md:gap-4'} ${screenSize === 'mobile' || isVertical ? 'grid-cols-1' : 'grid-cols-2'}`}
                style={screenSize !== 'mobile' && !isVertical ? { gridTemplateColumns: '1.6fr 1fr' } : undefined}
              >
                {/* Left column: 24K, 22K, 18K stacked */}
                <div className="flex flex-col gap-2">
                  {/* 24K GOLD */}
                  <div className="rate-card bg-white rounded-lg shadow-md p-2 md:p-3 border-l-4 md:border-l-6 border-jewelry-primary">
                    <div className="flex justify-between items-center mb-1 md:mb-2">
                      <h4 className={`font-bold text-gray-800 ${screenSize === 'tv' ? 'text-4xl' : 'text-sm md:text-4xl'}`}>24K GOLD (Per 10 GMS)</h4>
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-star text-white text-[10px]"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                        <p className={`${screenSize === 'tv' ? 'text-2xl font-extrabold' : 'text-xs md:text-2xl font-bold'} text-blue-700 mb-0.5 uppercase tracking-wide`}>SALE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800 leading-tight`}>₹{currentRates.gold_24k_sale}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                        <p className={`${screenSize === 'tv' ? 'text-2xl font-extrabold' : 'text-xs md:text-2xl font-bold'} text-blue-700 mb-0.5 uppercase tracking-wide`}>PURCHASE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800 leading-tight`}>₹{currentRates.gold_24k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 22K GOLD */}
                  <div className="rate-card bg-white rounded-lg shadow-md p-2 md:p-3 border-l-4 md:border-l-6 border-jewelry-primary">
                    <div className="flex justify-between items-center mb-1 md:mb-2">
                      <h4 className={`font-bold text-gray-800 ${screenSize === 'tv' ? 'text-4xl' : 'text-sm md:text-4xl'}`}>22K GOLD (Per 10 GMS)</h4>
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-medal text-white text-[10px]"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                        <p className={`${screenSize === 'tv' ? 'text-2xl font-extrabold' : 'text-xs md:text-2xl font-bold'} text-blue-700 mb-0.5 uppercase tracking-wide`}>SALE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800 leading-tight`}>₹{currentRates.gold_22k_sale}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                        <p className={`${screenSize === 'tv' ? 'text-2xl font-extrabold' : 'text-xs md:text-2xl font-bold'} text-blue-700 mb-0.5 uppercase tracking-wide`}>PURCHASE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800 leading-tight`}>₹{currentRates.gold_22k_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {/* 18K GOLD */}
                  <div className="rate-card bg-white rounded-lg shadow-md p-2 md:p-3 border-l-4 md:border-l-6 border-jewelry-primary">
                    <div className="flex justify-between items-center mb-1 md:mb-2">
                      <h4 className={`font-bold text-gray-800 ${screenSize === 'tv' ? 'text-4xl' : 'text-sm md:text-4xl'}`}>18K GOLD (Per 10 GMS)</h4>
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center">
                        <i className="fas fa-crown text-white text-[10px]"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                        <p className={`${screenSize === 'tv' ? 'text-2xl font-extrabold' : 'text-xs md:text-2xl font-bold'} text-blue-700 mb-0.5 uppercase tracking-wide`}>SALE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800 leading-tight`}>₹{currentRates.gold_18k_sale}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                        <p className={`${screenSize === 'tv' ? 'text-2xl font-extrabold' : 'text-xs md:text-2xl font-bold'} text-blue-700 mb-0.5 uppercase tracking-wide`}>PURCHASE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800 leading-tight`}>₹{currentRates.gold_18k_purchase}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column: SILVER on top, PROMO underneath */}
                <div className="flex flex-col gap-3 h-full">
                  <div className="rate-card bg-white rounded-lg shadow-md p-3 md:p-4 border-l-4 md:border-l-6 border-jewelry-primary">
                    <div className="flex justify-between items-center mb-2 md:mb-3">
                      <h4 className={`font-bold text-gray-800 ${screenSize === 'tv' ? 'text-4xl' : 'text-base md:text-4xl'}`}>SILVER (Per KG)</h4>
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-jewelry-primary rounded-full shadow-lg flex items-center justify-center">
                        <i className="fas fa-circle text-white text-[10px] md:text-xs"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                        <p className={`${screenSize === 'tv' ? 'text-2xl font-extrabold' : 'text-xs md:text-2xl font-bold'} text-blue-700 mb-0.5 uppercase tracking-wide`}>SALE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.silver_per_kg_sale}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                        <p className={`${screenSize === 'tv' ? 'text-2xl font-extrabold' : 'text-xs md:text-2xl font-bold'} text-blue-700 mb-0.5 uppercase tracking-wide`}>PURCHASE</p>
                        <p className={`${rateFontSize} font-bold text-blue-800`}>₹{currentRates.silver_per_kg_purchase}</p>
                      </div>
                    </div>
                  </div>

                  {promoImages.length > 0 && (
                    <div className="bg-gradient--lg shadow-md overflow-hidden fade-in self-start">
                      <div
                        className={`relative w-full ${screenSize === 'tv' ? 'aspect-[12/12]' : 'aspect-video'} bg-transparent flex items-center justify-center p-0 pb-0`}
                      >
                        <AnimatePresence mode="wait">
                          {currentPromo && (
                            <motion.img
                              key={currentPromo.id}
                              src={currentPromo.image_url || ""}
                              alt={currentPromo.name || "Promotional Image"}
                              className="max-w-full max-h-full w-auto h-auto object-contain"
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              variants={animationVariants}
                              transition={transitionProps}
                            />
                          )}
                        </AnimatePresence>

                        {promoImages.length > 1 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-2">
                            {promoImages.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${index === currentPromoIndex ? 'bg-gradient' : 'bg-gradient'}`}
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

            {/* Footer Banner - keep visible on all except TV if you prefer; current behavior: hidden on TV */}
            {screenSize !== 'tv' && bannerSettings?.banner_image_url && (
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
              transition={{ duration_seconds: 0.5 }}
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
