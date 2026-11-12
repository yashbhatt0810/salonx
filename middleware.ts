import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher(["/sign-in(.*)", "/setup", "/api/health", "/terms", "/privacy", "/consent", "/book(.*)", "/api/slots"]);

const withClerk = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
});

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  // Until Clerk keys are configured, send everything to the setup screen instead of crashing.
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    const p = req.nextUrl.pathname;
    if (["/setup", "/terms", "/privacy", "/consent", "/book", "/api/slots"].includes(p) || p.startsWith("/api/health")) return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", req.url));
  }
  return withClerk(req, ev);
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
