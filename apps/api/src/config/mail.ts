import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";
import { logger } from "./logger";

let transporter: Transporter | null = null;

function createTransporter(): Transporter | null {
  if (!env.SMTP_ENABLED) return null;
  if (!env.SMTP_HOST) {
    logger.warn("SMTP is enabled but SMTP_HOST is missing");
    return null;
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });
}

export function getMailer(): Transporter | null {
  if (!transporter) transporter = createTransporter();
  return transporter;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(input: SendMailInput): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) {
    logger.warn({ to: input.to, subject: input.subject }, "Email not sent (SMTP disabled)");
    return false;
  }
  try {
    await mailer.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return true;
  } catch (error) {
    logger.error({ err: error, to: input.to }, "Failed to send email");
    return false;
  }
}