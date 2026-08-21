import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const role = token?.role;

        // Redirect TRAVEL_AGENT trying to access /dashboard to /agent
        if (path.startsWith("/dashboard") && role === "TRAVEL_AGENT") {
            return NextResponse.redirect(new URL("/agent", req.url));
        }

        // Redirect Non-TRAVEL_AGENT trying to access /agent to /dashboard (unless Admin)
        if (path.startsWith("/agent") && role !== "TRAVEL_AGENT" && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/agent/:path*",
        "/api/applicants/:path*",
        "/api/agent/:path*",
    ],
};
