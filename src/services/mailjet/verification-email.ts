import { envServer } from "@/data/env/server";
import { sendEmail } from "./index";

type sendVerificationOtpProps = {
  email: string;
  type: "sign-in" | "change-email" | "email-verification" | "forget-password";
  otp: string;
};

const EMAIL_THEME = {
  background: "#f6f8fc",
  surface: "#ffffff",
  text: "#28344d",
  mutedText: "#5f6d86",
  border: "#d8e1f0",
  primary: "#5a50f3",
  primaryForeground: "#FFFFFF",
  secondary: "#23b28a",
  accent: "#5bb7e8",
  codeBackground: "#eef2ff",
  codeText: "#4338ca",
  badgeBackground: "#ecfdf7",
  noteBackground: "#f8faff",
  shadow: "0 24px 60px rgba(53, 70, 106, 0.12)",
};

const EMAIL_FONT_FAMILY =
  "'Outfit', Inter, 'Segoe UI', Helvetica, Arial, sans-serif";

const emailContentByType: Record<
  sendVerificationOtpProps["type"],
  {
    subject: string;
    eyebrow: string;
    heading: string;
    description: string;
    instruction: string;
  }
> = {
  "sign-in": {
    subject: "Your DaoTeam sign-in code",
    eyebrow: "Secure sign-in",
    heading: "Use this code to sign in",
    description:
      "Enter the verification code below to finish signing in to your DaoTeam account.",
    instruction: "Paste this code into the sign-in screen to continue.",
  },
  "change-email": {
    subject: "Confirm your new email for DaoTeam",
    eyebrow: "Email change",
    heading: "Confirm your new email address",
    description:
      "Use the verification code below to confirm this email address for your DaoTeam account.",
    instruction: "Enter this code to complete your email change.",
  },
  "email-verification": {
    subject: "Verify your email for DaoTeam",
    eyebrow: "Email verification",
    heading: "Verify your email address",
    description:
      "Welcome to DaoTeam. Enter the verification code below to activate your account.",
    instruction: "Type this code into the verification form to finish setup.",
  },
  "forget-password": {
    subject: "Your DaoTeam password reset code",
    eyebrow: "Password reset",
    heading: "Reset your password",
    description:
      "Use the verification code below to continue resetting your DaoTeam password.",
    instruction: "Enter this code on the password reset screen to proceed.",
  },
};

export const sendVerificationOtp = async ({
  email,
  type,
  otp,
}: sendVerificationOtpProps) => {
  const content = emailContentByType[type];
  const text = [
    `${content.heading} - DaoTeam`,
    "",
    content.description,
    "",
    `Verification code: ${otp}`,
    content.instruction,
    "",
    "If you did not request this email, you can safely ignore it.",
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        </style>
      </head>
      <body style="margin:0;padding:0;background:${EMAIL_THEME.background};font-family:${EMAIL_FONT_FAMILY};color:${EMAIL_THEME.text};">
        <div style="margin:0;padding:32px 16px;background:${EMAIL_THEME.background};font-family:${EMAIL_FONT_FAMILY};color:${EMAIL_THEME.text};">
          <div style="max-width:560px;margin:0 auto;background:${EMAIL_THEME.surface};border:1px solid ${EMAIL_THEME.border};border-radius:28px;overflow:hidden;box-shadow:${EMAIL_THEME.shadow};">
            <div style="padding:32px 32px 28px;background:linear-gradient(145deg, ${EMAIL_THEME.primary} 0%, ${EMAIL_THEME.accent} 100%);color:${EMAIL_THEME.primaryForeground};">
              <div style="display:inline-block;padding:7px 14px;border-radius:999px;background:${EMAIL_THEME.badgeBackground};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_THEME.secondary};">
                ${content.eyebrow}
              </div>
              <h1 style="margin:18px 0 10px;font-size:32px;line-height:1.08;font-weight:800;color:${EMAIL_THEME.primaryForeground};">
                ${content.heading}
              </h1>
              <p style="margin:0;max-width:420px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.92);">
                ${content.description}
              </p>
            </div>

            <div style="padding:32px;">
              <div style="margin:0 0 20px;padding:20px;border:1px solid ${EMAIL_THEME.border};border-radius:24px;background:${EMAIL_THEME.noteBackground};">
                <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_THEME.secondary};">
                  Verification code
                </p>
                <div style="padding:22px 24px;border-radius:18px;background:${EMAIL_THEME.codeBackground};border:1px solid rgba(90, 80, 243, 0.14);text-align:center;">
                  <span style="display:inline-block;font-family:${EMAIL_FONT_FAMILY};font-size:36px;line-height:1;font-weight:800;letter-spacing:0.22em;color:${EMAIL_THEME.codeText};text-transform:uppercase;white-space:nowrap;">${otp}</span>
                </div>
              </div>

              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${EMAIL_THEME.text};">
                ${content.instruction}
              </p>

              <div style="padding:16px 18px;border-radius:18px;background:${EMAIL_THEME.surface};border:1px solid ${EMAIL_THEME.border};">
                <p style="margin:0;font-size:14px;line-height:1.7;color:${EMAIL_THEME.mutedText};">
                  This code was sent to <span style="font-weight:700;color:${EMAIL_THEME.text};">${email}</span>. If you did not request this email, you can safely ignore it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    from: envServer.SENDER_EMAIL,
    to: email,
    subject: content.subject,
    html,
    text,
  });
};
