import React, { useEffect, useMemo, useRef, useState } from "react";
    import { useQuery } from "@tanstack/react-query";
    import { format } from "date-fns";
    import { ratesApi, settingsApi } from "@/lib/api";
    import { Button } from "@/components/ui/button";

    export default function SaleStatus() {
    // Keep time in India timezone
    const getIndianTime = () => {
        const now = new Date();
        return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    };

    const [currentTime, setCurrentTime] = useState<Date>(getIndianTime());
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [isWorking, setIsWorking] = useState<"idle" | "saving" | "sharing">("idle");

    // Layout refs/state to avoid page scrolling
    const viewportRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const captureRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.5);

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
        rateSize: settings?.rate_number_font_size || "text-4xl",
        };
    }, [settings]);

    // Adjusted canvas width to reduce visible side margins when scaled on mobile.
  const CAPTURE_WIDTH = 900; // px
  const CAPTURE_HEIGHT = 1060; // px
  const FILENAME = `rates-status-${format(getIndianTime(), "yyyyMMdd-HHmm")}.png`;

    // Recompute scale to fit available space without scrolling
    const recomputeScale = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      // Use full available width so height can be the limiting factor, removing blank space below
      const availableW = rect.width;
      const availableH = rect.height;
      const s = Math.min(availableW / CAPTURE_WIDTH, availableH / CAPTURE_HEIGHT);
      setScale(Math.max(0.2, Math.min(s, 1)));
    };

    useEffect(() => {
        recomputeScale();
        window.addEventListener("resize", recomputeScale);
        return () => window.removeEventListener("resize", recomputeScale);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Generate PNG and keep it for reuse (improves sharing reliability on Android)
    const generateImage = async (): Promise<{ blob: Blob; url: string } | null> => {
        if (!captureRef.current) return null;
        const node = captureRef.current;

        // Ensure capture node has explicit size
        node.style.width = `${CAPTURE_WIDTH}px`;
        node.style.height = `${CAPTURE_HEIGHT}px`;

        const { toBlob } = await import("html-to-image");
        const blob = await toBlob(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: theme.background,
        style: {
            transform: "none",
        },
        });

        if (!blob) return null;
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        setImageBlob(blob);
        return { blob, url };
    };

    // Try File System Access API if available, else download anchor, else open in new tab
    const saveBlobToGallery = async (blob: Blob, filename: string, blobUrl: string) => {
        // File System Access API (not widely on mobile, but try)
        // @ts-expect-error
        if (window.showSaveFilePicker) {
        try {
            // @ts-expect-error
            const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch {
            // fall through
        }
        }

        // Anchor download (most browsers)
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // As a fallback for Android: open image in new tab; user can Save Image to gallery
        try {
        window.open(blobUrl, "_blank");
        } catch {}
    };

    const handleSaveImage = async () => {
        try {
        setIsWorking("saving");
        const generated = await generateImage();
        if (!generated) throw new Error("Failed to render image");
        await saveBlobToGallery(generated.blob, FILENAME, generated.url);
        } catch (e) {
        console.error("Failed to export image", e);
        alert("Failed to save image. On Android, open the image and use Save Image to save to gallery.");
        } finally {
        setIsWorking("idle");
        }
    };

    // Share to WhatsApp: always generate snapshot first, then use native share with image file
    const handleShareWhatsApp = async () => {
        try {
        setIsWorking("sharing");
        const generated = await generateImage();
        if (!generated) throw new Error("Failed to render image for sharing");
        const { blob } = generated;

        // Native share with image file only
        // @ts-expect-error
        if (navigator?.share) {
            const file = new File([blob], FILENAME, { type: "image/png" });
            // @ts-expect-error
            await navigator.share({ files: [file], title: "Today's Sale Rates" });
            return;
        } else {
            throw new Error("Native share not supported on this browser.");
        }
        } catch (e) {
        console.error("Share failed", e);
        alert("Native image sharing is not supported on this browser. Please use Chrome on Android or Safari 16.4+ on iOS.");
        } finally {
        setIsWorking("idle");
        }
    };

    const buildTextSummary = (rates: any, time: Date) => {
        if (!rates) {
        return `Today's Gold & Silver sale rates.\n${format(
            time,
            "EEEE, dd MMM yyyy • HH:mm"
        )} (IST)`;
        }
        return [
        "TODAY'S SALE RATES",
        `${format(time, "EEEE, dd MMM yyyy • HH:mm")} (IST)`,
        "",
        `24K GOLD (10g): ₹${rates.gold_24k_sale}`,
        `22K GOLD (10g): ₹${rates.gold_22k_sale}`,
        `18K GOLD (10g): ₹${rates.gold_18k_sale}`,
        `SILVER (1kg): ₹${rates.silver_per_kg_sale}`,
        ].join("\n");
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
        ref={viewportRef}
        className="h-screen flex flex-col overflow-hidden"
        style={{ backgroundColor: theme.background, color: theme.text }}
        >
        {/* Mobile Control-like header (full-width banner with logo) */}
        <div className="shrink-0 bg-gradient-to-r from-gold-600 to-gold-700 text-black px-3 py-2 md:px-4 md:py-3 flex justify-center items-center">
            <img
            src="/logo.png"
            alt="Devi Jewellers Logo"
            className="h-16 md:h-24 w-[220px] md:w-[320px] object-contain"
            />
        </div>

        {/* Center stage - no scrolling; capture scaled to fit */}
        <div ref={stageRef} className="flex-1 flex items-center justify-center overflow-hidden px-2">
            <div
            ref={captureRef}
            className="rounded-xl shadow-lg overflow-hidden flex flex-col border border-black/10"
            style={{
                backgroundColor: theme.background,
                color: theme.text,
                width: `${CAPTURE_WIDTH}px`,
                height: `${CAPTURE_HEIGHT}px`,
                transformOrigin: "center center",
                transform: `scale(${scale})`,
            }}
            >
            {/* Branded header inside the image (logo only, no round bg or tagline) */}
            <div className="bg-gradient-to-r from-jewelry-primary to-jewelry-secondary text-white py-4 px-5 flex items-center justify-between">
                <div className="flex items-center">
                <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
                </div>
                <div className="text-right">
                <div className="text-lg font-semibold text-gold-200">
                    {format(currentTime, "EEEE dd-MMM-yyyy")}
                </div>
                <div className="text-2xl font-extrabold text-white">{format(currentTime, "HH:mm")}</div>
                </div>
            </div>

            {/* Title */}
            <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white text-center py-3">
                <h2 className="font-display font-extrabold text-3xl">TODAY'S SALE RATES</h2>
            </div>

            {/* Rates only (sale) */}
          <div className="flex-1 px-0 py-5 space-y-5">
            <RateCard title="24K GOLD (Per 10 gms)" value={currentRates.gold_24k_sale} rateSize={"text-6xl"} />
            <RateCard title="22K GOLD (Per 10 gms)" value={currentRates.gold_22k_sale} rateSize={"text-6xl"} />
            <RateCard title="18K GOLD (Per 10 gms)" value={currentRates.gold_18k_sale} rateSize={"text-6xl"} />
            <RateCard title="SILVER (Per KG)" value={currentRates.silver_per_kg_sale} rateSize={"text-6xl"} />
          </div>
            </div>
        </div>

        {/* Bottom action bar - fixed height, no page scroll */}
        <div
            className="shrink-0 w-full border-t"
            style={{ backgroundColor: theme.background, borderColor: "rgba(0,0,0,0.1)" }}
        >
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
            <Button onClick={handleSaveImage} className="bg-jewelry-primary text-white px-5 py-3 text-base font-semibold rounded-lg" disabled={isWorking !== "idle"}>
                <i className="fas fa-download mr-2"></i>
                {isWorking === "saving" ? "Saving..." : "Save Image (9:16)"}
            </Button>
            <Button onClick={handleShareWhatsApp} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-base font-semibold rounded-lg" disabled={isWorking !== "idle"}>
                <i className="fab fa-whatsapp mr-2"></i>
                {isWorking === "sharing" ? "Opening Share..." : "Share on WhatsApp"}
            </Button>
            </div>
        </div>
        </div>
    );
    }

    function RateCard({
      title,
      value,
      rateSize,
    }: {
      title: string;
      value: number | string;
      rateSize: string;
    }) {
      return (
        <div className="bg-white rounded-none shadow-none border-l-8 border-jewelry-primary p-0 w-full min-h-28">
          <div className="flex items-center justify-between px-3 py-3">
            <h4 className="text-2xl font-semibold text-gray-900">{title}</h4>
            <div className="w-12 h-12 bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center">
              <i className="fas fa-rupee-sign text-white text-base"></i>
            </div>
          </div>
          <div className="text-center py-2">
            <p className={`${rateSize} font-extrabold text-blue-900 leading-tight`}>₹{value}</p>
          </div>
        </div>
      );
    }