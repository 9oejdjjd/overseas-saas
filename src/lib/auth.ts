
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    requirePasswordChange: user.requirePasswordChange,
                    permissions: user.permissions || null,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.requirePasswordChange = token.requirePasswordChange as boolean;
                session.user.permissions = token.permissions;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.requirePasswordChange = user.requirePasswordChange;
                token.permissions = user.permissions;
            } else if (token?.id && token.requirePasswordChange) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id },
                        select: { requirePasswordChange: true }
                    });
                    if (dbUser) {
                        token.requirePasswordChange = dbUser.requirePasswordChange;
                    }
                } catch (e) {
                    console.error("Error fetching requirePasswordChange in jwt callback:", e);
                }
            }
            return token;
        },
    },
};
