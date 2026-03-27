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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Optional directory handle if user selects a folder (File System Access API)
  const [dirHandle, setDirHandle] = useState<any>(null);

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  // Try modern file picker (lets user choose exact save location and filename)
  const saveWithPicker = async (blob: Blob, suggestedName: string) => {
    try {
      // @ts-expect-error
      if (window?.showSaveFilePicker) {
        // @ts-expect-error
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }],
        });
        // @ts-expect-error
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Let user choose a folder and remember it (for capable browsers)
  const chooseFolder = async () => {
    try {
      // @ts-expect-error
      if (window?.showDirectoryPicker) {
        // @ts-expect-error
        const handle = await window.showDirectoryPicker();
        setDirHandle(handle);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Save directly into a chosen folder (File System Access API)
  const saveToChosenFolder = async (blob: Blob, filename: string) => {
    try {
      if (!dirHandle) return false;
      // @ts-expect-error
      const hasPerm = (await dirHandle.queryPermission?.({ mode: "readwrite" })) === "granted"
        // @ts-expect-error
        || (await dirHandle.requestPermission?.({ mode: "readwrite" })) === "granted";
      if (!hasPerm) return false;
      // @ts-expect-error
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      // @ts-expect-error
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  };

  // Download from preview overlay (picker/folder if possible, else anchor/dataUrl)
  const handleDownloadFromPreview = async () => {
    try {
      if (!imageBlob && !previewUrl) return;
      const blob = imageBlob || (await (await fetch(previewUrl as string)).blob());
      // Prefer picker, then chosen folder, then anchor/dataUrl via saveBlobToGallery fallbacks
      if (await saveWithPicker(blob, FILENAME)) {
        setPreviewUrl(null);
        return;
      }
      if (await saveToChosenFolder(blob, FILENAME)) {
        setPreviewUrl(null);
        return;
      }
      await saveBlobToGallery(blob, FILENAME, previewUrl || undefined);
      setPreviewUrl(null);
    } catch {
      // ignore; overlay remains
    }
  };

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

  const FILENAME = `dj_daily_rate-${format(getIndianTime(), "yyyyMMdd")}.png`;

  // Generate PNG from the on-screen node to preserve computed layout
  const generateImage = async (): Promise<{ blob: Blob; url: string; dataUrl: string } | null> => {
    if (!captureRef.current) return null;

    const node = captureRef.current;

    const { toPng } = await import("html-to-image");

    // Use actual rendered size to avoid blank outputs on some Android browsers
    const rect = node.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(rect.width));
    const height = Math.max(1, Math.ceil(rect.height));

    const options: any = {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: theme.background,
      width,
      height,
      style: {
        transform: "none",
      },
      // Exclude footer (buttons) and preview overlay from the captured image
      filter: (n: HTMLElement) =>
        !n.closest?.("#action-footer") && !n.closest?.("#preview-overlay"),
    };
    // Explicitly specify canvas dimensions for some WebViews
    options.canvasWidth = width * 2;
    options.canvasHeight = height * 2;

    const dataUrl = await toPng(node, options);

    // Convert data URL to Blob for saving/sharing
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setImageBlob(blob);
    setPreviewUrl(dataUrl);
    return { blob, url, dataUrl };
  };

  // Save/share image across Android/iOS browsers and in-app WebViews
  const saveBlobToGallery = async (blob: Blob, filename: string, dataUrl?: string) => {
    try {
      const file = new File([blob], filename, { type: "image/png" });

      // 1) Prefer native share with files where supported
      // @ts-expect-error
      if (navigator?.canShare && navigator.canShare({ files: [file] })) {
        // @ts-expect-error
        await navigator.share({ files: [file], title: "Today's Sale Rates" });
        return;
      }

      // 2) iOS Safari: download attribute is ignored; navigate to data URL so user can save
      if (isIOS && dataUrl) {
        try {
          window.location.href = dataUrl;
          return;
        } catch {}
      }

      // 3) Anchor download for full browsers (mostly Android)
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      if ("download" in a && !isIOS) {
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        return;
      }

      // 4) New tab with image (long-press to save)
      const newTab = window.open();
      if (newTab) {
        newTab.document.title = filename;
        const img = newTab.document.createElement("img");
        img.src = dataUrl || blobUrl;
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        newTab.document.body.style.margin = "0";
        newTab.document.body.appendChild(img);
        return;
      }

      // 5) Last resort: force navigation to data URL derived from blob
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          window.location.href = reader.result as string;
        } catch {
          // show inline preview overlay
          setPreviewUrl((reader.result as string) || dataUrl || blobUrl);
        }
      };
      reader.readAsDataURL(blob);

      // Also show inline preview overlay as a UX fallback
      setPreviewUrl(dataUrl || blobUrl);
    } catch (err) {
      console.error("Save image failed", err);
      // Inline preview overlay so users can long-press save in restrictive envs
      try {
        const blobUrl = URL.createObjectURL(blob);
        setPreviewUrl(dataUrl || blobUrl);
      } catch {
        // ignore
      }
    }
  };

  const handleSaveImage = async () => {
    try {
      setIsWorking("saving");
      const generated = await generateImage();
      if (!generated) throw new Error("Failed to render image");
      await saveBlobToGallery(generated.blob, FILENAME, generated.dataUrl);
    } catch (e) {
      console.error("Failed to save image", e);
      // No alert; a preview overlay will appear in restrictive WebViews to allow long-press save
    } finally {
      setIsWorking("idle");
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsWorking("sharing");
      const generated = await generateImage();
      if (!generated) throw new Error("Failed to render image for sharing");
      const { blob, dataUrl } = generated;

      const file = new File([blob], FILENAME, { type: "image/png" });
      // 1) Try full Web Share with files (Android Chrome/Edge/Samsung, modern iOS)
      // @ts-expect-error
      if (navigator?.canShare && navigator.canShare({ files: [file] })) {
        // @ts-expect-error
        await navigator.share({ files: [file], title: "Today's Sale Rates" });
        return;
      }

      // 2) Try basic Web Share with text/url (older Safari/Android)
      // @ts-expect-error
      if (navigator?.share) {
        // Some browsers cannot share files but can share text/url
        // We include a short caption and instruct to save from preview if needed
        await navigator.share({
          title: "Today's Sale Rates",
          text: "Today's sale rates from Devi Jewellers. If the image didn't attach, long-press the preview to save first.",
        });
        // Also show preview to allow user to save image if file-sharing wasn't supported
        setPreviewUrl(dataUrl);
        return;
      }

      // 3) WhatsApp web deep-link fallback (cannot attach image programmatically)
      const message = "Today's sale rates from Devi Jewellers. Please see the attached image.";
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");

      // Show preview so user can long-press/save and attach in WhatsApp
      setPreviewUrl(dataUrl);
    } catch (e) {
      console.error("Share failed", e);
      // Show preview so user can save manually
      try {
        setPreviewUrl((await generateImage())?.dataUrl || null);
      } catch {
        // ignore
      }
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
      ref={captureRef}
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
      <div className="flex-1 flex flex-col w-full">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-white py-3 px-4 flex items-center justify-center shadow-md">
          <div className="text-center">
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
        id="action-footer"
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
            {isWorking === "saving" ? "Saving..." : "Save Image"}
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
    {previewUrl && (
        <div
          id="preview-overlay"
          className="fixed inset-0 z-50 bg-black/80 p-0"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-full max-w-full w-full h-auto object-contain"
              onClick={(e) => e.stopPropagation()} /* allow long-press without closing */
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="pointer-events-auto bg-white/90 rounded-lg px-4 py-3 text-gray-800 shadow-lg text-center"
                onClick={() => setPreviewUrl(null)}
              >
                <div className="text-sm font-semibold">Long press the image to Save/Download</div>
                <div className="text-[10px] mt-1 text-gray-600">Tap anywhere to go back</div>
              </div>
            </div>
          </div>
        </div>
      )}
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