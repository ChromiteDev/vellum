import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '$env/dynamic/private';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
	if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
	if (!transporter) {
		transporter = nodemailer.createTransport({
			host: env.SMTP_HOST,
			port: Number(env.SMTP_PORT || 587),
			secure: env.SMTP_SECURE === 'true',
			auth: {
				user: env.SMTP_USER,
				pass: env.SMTP_PASS
			}
		});
	}
	return transporter;
}

export function isMailConfigured(): boolean {
	return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM);
}

export async function sendMail(opts: {
	to: string;
	subject: string;
	text: string;
	html: string;
}): Promise<boolean> {
	const t = getTransporter();
	if (!t || !env.EMAIL_FROM) return false;
	try {
		await t.sendMail({
			from: `Vellum <${env.EMAIL_FROM}>`,
			to: opts.to,
			subject: opts.subject,
			text: opts.text,
			html: opts.html
		});
		return true;
	} catch (error) {
		console.error('Failed to send email:', error);
		return false;
	}
}
