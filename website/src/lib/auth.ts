// src/lib/auth.ts (or your auth config file)
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { db } from "./server/db";
import * as schema from "./server/db/schema";
import { generateUsername } from "./utils/random";
import { uploadProfilePicture } from "./server/s3";
import { apiKey } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { redis } from "./server/redis";
import { sendMail, isMailConfigured } from "./server/mail";

if (!publicEnv.PUBLIC_BETTER_AUTH_URL) throw new Error('PUBLIC_BETTER_AUTH_URL is not set');

const googleClientId = privateEnv.GOOGLE_CLIENT_ID;
const googleClientSecret = privateEnv.GOOGLE_CLIENT_SECRET;

const socialProviders = googleClientId && googleClientSecret
	? {
			google: {
				clientId: googleClientId,
				clientSecret: googleClientSecret,
				mapProfileToUser: async (profile: Record<string, any>) => {
					const newUsername = generateUsername();
					let s3ImageKey: string | null = null;

					if (profile.picture) {
						try {
							const response = await fetch(profile.picture);
							if (!response.ok) {
								console.error(`Failed to fetch profile picture: ${response.statusText}`);
							} else {
								const blob = await response.blob();
								const arrayBuffer = await blob.arrayBuffer();
								s3ImageKey = await uploadProfilePicture(
									profile.sub,
									new Uint8Array(arrayBuffer),
									blob.type || 'image/jpeg'
								);
							}
						} catch (error) {
							console.error('Failed to upload profile picture during social login:', error);
						}
					}

					return {
						name: profile.name,
						email: profile.email,
						image: s3ImageKey,
						username: newUsername,
					};
				},
			},
		}
	: {};

async function ensureUniqueUsername(candidate: string): Promise<string> {
	const existing = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(eq(schema.user.username, candidate))
		.limit(1);
	if (existing.length === 0) return candidate;

	for (let attempt = 0; attempt < 8; attempt++) {
		const next = generateUsername();
		const taken = await db
			.select({ id: schema.user.id })
			.from(schema.user)
			.where(eq(schema.user.username, next))
			.limit(1);
		if (taken.length === 0) return next;
	}
	return `${generateUsername()}${Math.floor(Math.random() * 900000) + 100000}`;
}

const MAX_FAILED_LOGINS = 10;
const LOCKOUT_SECONDS = 60 * 15;

async function failedLoginKey(email: string): Promise<string> {
	return `login_fail:${email.trim().toLowerCase()}`;
}

export const auth = betterAuth({
    baseURL: publicEnv.PUBLIC_BETTER_AUTH_URL,
    secret: privateEnv.PRIVATE_BETTER_AUTH_SECRET,
    appName: "Vellum",

    trustedOrigins: [
        publicEnv.PUBLIC_BETTER_AUTH_URL,
        "http://vellum.com",
        "https://vellum.chromitedev.xyz",
        "http://localhost:5173",
    ],

    plugins: [
        apiKey({
            defaultPrefix: 'vell_',
            rateLimit: {
                enabled: true,
                timeWindow: 1000 * 60 * 60 * 24, // 1 day
                maxRequests: 2000 // 2000 requests per day
            },
            permissions: {
                defaultPermissions: {
                    api: ['read']
                }
            }
        }),
    ],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        requireEmailVerification: false,
        resetPasswordTokenExpiresIn: 60 * 30,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url }) => {
            const sent = await sendMail({
                to: user.email,
                subject: 'Reset your Vellum password',
                text: `Someone requested a password reset for your Vellum account. Reset it here: ${url}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.`,
                html: `
                    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                        <h2 style="margin: 0 0 12px;">Reset your Vellum password</h2>
                        <p style="color: #555;">Someone requested a password reset for your account. Click below to choose a new password.</p>
                        <p style="margin: 24px 0;"><a href="${url}" style="background: #7c3aed; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Reset password</a></p>
                        <p style="color: #888; font-size: 12px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
                    </div>
                `
            });
            if (!sent && !isMailConfigured()) {
                console.warn('[Vellum] SMTP not configured. Password reset link:', url);
            }
        },
    },
    rateLimit: {
        enabled: true,
        window: 60,
        max: 300,
        storage: "memory",
        customRules: {
            "/sign-in/email": { window: 60, max: 5 },
            "/sign-up/email": { window: 60, max: 5 },
            "/request-password-reset": { window: 60, max: 3 },
        },
    },
    hooks: {
        before: async (ctx) => {
            const c = ctx as unknown as { path: string; body?: { email?: string } };
            if (c.path !== '/sign-in/email') return;
            const email = c.body?.email;
            if (!email) return;
            const key = await failedLoginKey(email);
            const fails = Number(await redis.get(key) || 0);
            if (fails >= MAX_FAILED_LOGINS) {
                return new Response(
                    JSON.stringify({
                        code: 'ACCOUNT_LOCKED',
                        message: 'Too many failed sign-in attempts. Try again in a few minutes.'
                    }),
                    { status: 429, headers: { 'Content-Type': 'application/json' } }
                );
            }
        },
        after: async (ctx) => {
            const c = ctx as unknown as {
                path: string;
                body?: { email?: string };
                context?: { returned?: unknown };
            };
            if (c.path !== '/sign-in/email') return {};
            const email = c.body?.email;
            if (!email) return {};
            const key = await failedLoginKey(email);
            const returned = c.context?.returned as { statusCode?: number } | undefined;
            if (returned && typeof returned === 'object' && returned.statusCode && returned.statusCode >= 400) {
                const fails = await redis.incr(key);
                if (fails === 1) await redis.expire(key, LOCKOUT_SECONDS);
            } else {
                await redis.del(key);
            }
            return {};
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const username = await ensureUniqueUsername(
                        (user.username as string) || generateUsername()
                    );
                    const name = user.name && user.name.trim().length > 0
                        ? user.name.trim()
                        : username;
                    return {
                        data: {
                            ...user,
                            username,
                            name,
                        },
                    };
                },
            },
        },
    },
    socialProviders,
    user: {
        additionalFields: {
            username: { type: "string", required: true, input: false, defaultValue: () => generateUsername() },
            isAdmin: { type: "boolean", required: true, input: false, defaultValue: false },
            isFounder: { type: "boolean", required: true, input: false, defaultValue: false },
            isBanned: { type: "boolean", required: false, input: false },
            banReason: { type: "string", required: false, input: false },
            baseCurrencyBalance: { type: "string", required: false, input: false },
            bio: { type: "string", required: false },
            volumeMaster: { type: "string", required: false, input: false },
            volumeMuted: { type: "boolean", required: false, input: false },
        }
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5,
        }
    },
    advanced: {
        database: {
            generateId: false,
        },
        ipAddress: {
            ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
        },
    }
});