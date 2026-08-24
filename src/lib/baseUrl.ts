import { NextRequest } from "next/server";

/**
 * Known invalid or deprecated domains that should never be used as base URL.
 */
const INVALID_DOMAINS = [
    "agents-management-dashboard.etemad-pro",
    "undefined",
    "null"
];

/**
 * Centralized, bulletproof Base URL resolver for the entire application.
 * Dynamically resolves the origin from the incoming request whenever available,
 * with reliable fallback to production domain.
 * 
 * @param req Optional incoming Request, NextRequest, or Headers object
 * @returns Fully qualified base URL (e.g. "https://etemad-pro.vercel.app" or "http://localhost:3000")
 */
export function getBaseUrl(req?: Request | NextRequest | Headers | null): string {
    // 1. If a request or NextRequest is provided, extract directly from request headers
    if (req) {
        let headers: Headers | null = null;

        if (req instanceof Headers) {
            headers = req;
        } else if ("headers" in req && req.headers instanceof Headers) {
            headers = req.headers;
        }

        if (headers) {
            const forwardedHost = headers.get("x-forwarded-host");
            const host = forwardedHost || headers.get("host");

            if (host && !INVALID_DOMAINS.some(inv => host.includes(inv))) {
                const forwardedProto = headers.get("x-forwarded-proto");
                const proto = forwardedProto || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
                return `${proto}://${host}`.replace(/\/+$/, "");
            }
        }

        // Fallback for NextRequest nextUrl.origin
        if ("nextUrl" in req && req.nextUrl && req.nextUrl.origin) {
            const origin = req.nextUrl.origin;
            if (!INVALID_DOMAINS.some(inv => origin.includes(inv)) && !origin.includes("undefined")) {
                return origin.replace(/\/+$/, "");
            }
        }
    }

    // 2. Server-side environment variables fallback
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl && !INVALID_DOMAINS.some(inv => envUrl.includes(inv)) && envUrl.startsWith("http")) {
        return envUrl.replace(/\/+$/, "");
    }

    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (nextAuthUrl && !INVALID_DOMAINS.some(inv => nextAuthUrl.includes(inv)) && nextAuthUrl.startsWith("http") && !nextAuthUrl.includes("localhost")) {
        return nextAuthUrl.replace(/\/+$/, "");
    }

    const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (vercelProdUrl && !INVALID_DOMAINS.some(inv => vercelProdUrl.includes(inv))) {
        return `https://${vercelProdUrl}`.replace(/\/+$/, "");
    }

    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl && !INVALID_DOMAINS.some(inv => vercelUrl.includes(inv))) {
        return `https://${vercelUrl}`.replace(/\/+$/, "");
    }

    // 3. Development local fallback
    if (process.env.NODE_ENV === "development") {
        return "http://localhost:3000";
    }

    // 4. Default Production Domain
    return "https://etemad-pro.vercel.app";
}

export default getBaseUrl;
