export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

// Helper to join base and path safely
export function apiUrl(path: string) {
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanedPath}`;
}