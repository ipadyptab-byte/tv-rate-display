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
  { path: "/status", label: "Sale Status", icon: "fas fa-share-square" }
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <div className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <nav className="flex overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex-shrink-0 px-6 py-4 text-center border-b-2 transition-colors",
                  location === item.path
                    ? "border-gold-500 bg-gold-50 text-jewelry-primary font-semibold"
                    : "border-transparent hover:border-gold-300 text-gray-600 hover:text-jewelry-primary"
                )}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.label}
              </button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
