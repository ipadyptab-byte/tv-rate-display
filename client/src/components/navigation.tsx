import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "TV Display", icon: "fas fa-tv" },
  { path: "/mobile", label: "Mobile Control", icon: "fas fa-mobile-alt" },
  { path: "/admin", label: "Admin Dashboard", icon: "fas fa-cog" },
  { path: "/media", label: "Media Manager", icon: "fas fa-images" },
  { path: "/promo", label: "Promo Manager", icon: "fas fa-bullhorn" },
  { path: "/sale-status", label: "Sale Status", icon: "fas fa-tags" },
  { path: "/rates-sync", label: "Rate Sync", icon: "fas fa-percentage" },
];

export function Navigation() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const inactivityTimer = useRef<number | null>(null);

  // Close drawer on route change
  useEffect(() => {
    if (open) setOpen(false);
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manage inactivity auto-close when open
  useEffect(() => {
    function clearTimer() {
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    }

    function startTimer() {
      clearTimer();
      inactivityTimer.current = window.setTimeout(() => {
        setOpen(false);
      }, 3000);
    }

    function resetTimer() {
      if (!open) return;
      startTimer();
    }

    if (open) {
      startTimer();
      const events: Array<keyof DocumentEventMap> = [
        "mousemove",
        "touchstart",
        "keydown",
        "click",
      ];
      events.forEach((evt) =>
        document.addEventListener(evt, resetTimer, { passive: true })
      );
      return () => {
        clearTimer();
        events.forEach((evt) =>
          document.removeEventListener(evt, resetTimer as EventListener)
        );
      };
    } else {
      clearTimer();
    }
  }, [open]);

  return (
    <>
      {/* Floating hamburger button */}
      <div className="fixed top-2 left-2 z-50">
        <button
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex items-center justify-center rounded-md",
            "text-jewelry-primary hover:text-jewelry-primary/80",
            "focus:outline-none focus:ring-2 focus:ring-gold-400",
            "h-10 w-10"
          )}
        >
          <i className="fas fa-bars text-xl" />
        </button>
      </div>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-transparent transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw]",
          open ? "bg-white shadow-2xl" : "bg-transparent shadow-none",
          "transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-jewelry-primary font-semibold">
            <i className="fas fa-gem text-gold-600" />
            Navigation
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <nav className="py-2">
          {navItems.map((item) => {
            const active = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <a
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    active
                      ? "text-jewelry-primary font-semibold"
                      : "text-gray-700 hover:text-jewelry-primary"
                  )}
                >
                  <i className={cn(item.icon, "w-5 text-base")} />
                  <span>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
