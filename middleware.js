import nextAuthMiddleware from "next-auth/middleware";

// Wrap next-auth's middleware in an explicit function so Next.js 16
// clearly sees a function export for the middleware file.
export default function middleware(req) {
  return nextAuthMiddleware(req);
}

// Protect the dashboard and all nested routes
export const config = {
  matcher: ["/dashboard/:path*"],
};
