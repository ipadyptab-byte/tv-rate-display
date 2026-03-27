import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ratesApi, settingsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function SaleStatus() {
  // Indian time
  const getIndianTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  };

  const [currentTime, setCurrentTime] = useState<Date>(getIndianTime());
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isWorking, setIsWorking] = useState<"idle" | "saving" | "sharing">("idle");

  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getIndianTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: currentRates } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    refetchInterval: 30000,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings/display"],
    queryFn: settingsApi.getDisplay,
    refetchInterval: 30000,
  });

  const theme = useMemo(() => {
    return {
      background: settings?.background_color || "#FFF8E1",
      text: settings?.text_color || "#212529",
    };
  }, [settings]);

  const CAPTURE_WIDTH = 900;
  const CAPTURE_HEIGHT = 1060;
  const FILENAME = `rates-status-${format(getIndianTime(), "yyyyMMdd-HHmm")}.png`;

  // Generate PNG safely using clone
  const generateImage = async (): Promise<{ blob: Blob; url: string } | null> => {
    if (!captureRef.current) return null;

    const node = captureRef.current.cloneNode(true) as HTMLElement;

    // Hidden container
    node.style.position = "fixed";
    node.style.left = "-9999px";
    node.style.top = "-9999px";
    node.style.width = `${CAPTURE_WIDTH}px`;
    node.style.height = `${CAPTURE_HEIGHT}px`;
    document.body.appendChild(node);

    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: theme.background,
      style: { transform: "none" },
    });

    document.body.removeChild(node);

    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    setImageBlob(blob);
    return { blob, url };
  };

  // Save as download (works on mobile)
  const saveBlobToGallery = async (blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    alert("✅ Image saved! Check your Downloads folder.");
  };

  const handleSaveImage = async () => {
    try {
      setIsWorking("saving");
      const generated = await generateImage();
      if (!generated) throw new Error("Failed to render image");
      await saveBlobToGallery(generated.blob, FILENAME);
    } catch (e) {
      console.error("Failed to save image", e);
      alert("Saving failed. Please try Chrome/Edge on Android or Safari on iOS.");
    } finally {
      setIsWorking("idle");
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsWorking("sharing");
      const generated = await generateImage();
      if (!generated) throw new Error("Failed to render image for sharing");
      const { blob } = generated;

      // Native share
      // @ts-expect-error
      if (navigator?.share) {
        const file = new File([blob], FILENAME, { type: "image/png" });
        // @ts-expect-error
        await navigator.share({ files: [file], title: "Today's Sale Rates" });
        return;
      } else {
        alert("Sharing not supported on this browser.");
      }
    } catch (e) {
      console.error("Share failed", e);
    } finally {
      setIsWorking("idle");
    }
  };

  if (!currentRates) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gold-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-jewelry-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-700">Loading current rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Header */}
      <div className="shrink-0 bg-gradient-to-r from-gold-600 to-gold-700 text-black px-3 py-2 flex justify-center items-center shadow-md">
        <img
          src="/logo.png"
          alt="Devi Jewellers Logo"
          className="h-16 md:h-20 w-[220px] md:w-[300px] object-contain"
        />
      </div>

      {/* Capture Area */}
      <div ref={captureRef} className="flex-1 flex flex-col w-full">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-white py-3 px-4 flex items-center justify-between shadow-md">
          <img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain" />
          <div className="text-right">
            <div className="text-sm md:text-lg font-semibold text-gold-200">
              {format(currentTime, "EEEE dd-MMM-yyyy")}
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-white">
              {format(currentTime, "HH:mm")}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white text-center py-2 shadow">
          <h2 className="font-display font-extrabold text-lg md:text-3xl drop-shadow">
            TODAY'S SALE RATES
          </h2>
        </div>

        {/* Rate Cards */}
        <div className="flex-1 flex flex-col gap-3 p-2">
          <RateCard title="24K GOLD (Per 10 gms)" value={currentRates.gold_24k_sale} />
          <RateCard title="22K GOLD (Per 10 gms)" value={currentRates.gold_22k_sale} />
          <RateCard title="18K GOLD (Per 10 gms)" value={currentRates.gold_18k_sale} />
          <RateCard title="SILVER (Per KG)" value={currentRates.silver_per_kg_sale} />
        </div>
      </div>

      {/* Footer */}
      <div
        className="shrink-0 w-full border-t shadow-inner"
        style={{ backgroundColor: theme.background, borderColor: "rgba(0,0,0,0.1)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
          <Button
            onClick={handleSaveImage}
            className="bg-jewelry-primary text-white px-5 py-2 md:py-3 text-sm md:text-base font-semibold rounded-lg shadow-md"
            disabled={isWorking !== "idle"}
          >
            <i className="fas fa-download mr-2"></i>
            {isWorking === "saving" ? "Saving..." : "Save Image (9:16)"}
          </Button>
          <Button
            onClick={handleShareWhatsApp}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 md:py-3 text-sm md:text-base font-semibold rounded-lg shadow-md"
            disabled={isWorking !== "idle"}
          >
            <i className="fab fa-whatsapp mr-2"></i>
            {isWorking === "sharing" ? "Opening Share..." : "Share on WhatsApp"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Rate Card Component
function RateCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="flex-1 bg-white w-full border border-gray-200 flex flex-col shadow-lg rounded-lg">
      <div className="flex items-center justify-between w-full px-3 py-2">
        <h4 className="text-sm md:text-xl font-semibold text-gray-900">{title}</h4>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center shadow-md">
          <i className="fas fa-rupee-sign text-white text-sm md:text-base"></i>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-3xl md:text-6xl font-extrabold text-blue-900 leading-tight drop-shadow-md">
          ₹{value}
        </p>
      </div>
    </div>
  );
}
