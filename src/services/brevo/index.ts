import { envServer } from "@/data/env/server";
import nodemailer from "nodemailer";

type SendEmailOptions = {
  from?: string;
  fromName?: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

export const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: envServer.SMTP_USER,
    pass: envServer.SMTP_PASS,
  },
});

export const sendEmail = async ({
  from = envServer.SENDER_EMAIL,
  fromName = "Synapse",
  to,
  subject,
  html,
  text,
}: SendEmailOptions) => {
  const recipients = Array.isArray(to) ? to : [to];

  try {
    return await transporter.sendMail({
      from: {
        address: from,
        name: fromName,
      },
      to: recipients,
      subject,
      html,
      text,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Brevo SMTP error";
    throw new Error(`Failed to send email with Brevo SMTP: ${message}`);
  }
};
