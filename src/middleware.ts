import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_PATHS = ["/auth/login", "/auth/signup"];

export function middleware(request: NextRequest) {
	const { nextUrl, cookies } = request;
	const { pathname } = nextUrl;

	// Allow public paths
	if (PUBLIC_PATHS.includes(pathname)) {
		// If already logged in, redirect away from login/signup
		if (cookies.has("UserData")) {
			return NextResponse.redirect(new URL("/dashboard", nextUrl));
		}
		return NextResponse.next();
	}

	// For any other path, require login
	if (!cookies.has("UserData")) {
		// Redirect unauthorized users to login
		return NextResponse.redirect(new URL("/auth/login", nextUrl));
	}

	return NextResponse.next();
}

// Apply middleware to all routes except static, _next, and API
export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
