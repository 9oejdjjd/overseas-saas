import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            requirePasswordChange: boolean;
            permissions: any;
            agentId?: string | null;
            companyName?: string | null;
            isAgentOwner?: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: string;
        requirePasswordChange: boolean;
        permissions: any;
        agentId?: string | null;
        companyName?: string | null;
        isAgentOwner?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        requirePasswordChange: boolean;
        permissions: any;
        agentId?: string | null;
        companyName?: string | null;
        isAgentOwner?: boolean;
    }
}
