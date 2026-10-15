// Static reference scaffold: no staff sessions or application endpoints.
export const config = { matcher: ["/staff/:path*", "/admin/:path*", "/workbench/:path*"] }
export default function middleware() {
  return new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } })
}
