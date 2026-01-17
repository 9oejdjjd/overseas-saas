
import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/",
        "/applicants/:path*",
        "/api/applicants/:path*",
        // Exclude public API routes if needed, but for now protect everything by default except login/static
    ],
};
