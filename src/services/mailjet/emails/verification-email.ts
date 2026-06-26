import { envServer } from "@/data/env/server";
import { sendEmail } from "../index";

type sendVerificationOtpProps = {
  email: string;
  type: "sign-in" | "change-email" | "email-verification" | "forget-password";
  otp: string;
};

const EMAIL_THEME = {
  background: "#0f1714",
  surface: "#17231f",
  elevated: "#1d2b26",
  text: "#f5f3e8",
  mutedText: "#a8bbb3",
  border: "#2a433a",
  primary: "#50e28b",
  primaryForeground: "#0f1714",
  secondary: "#78c7f2",
  accent: "#e5f36c",
  codeBackground: "#101d18",
  codeText: "#e5f36c",
  badgeBackground: "#213a31",
  noteBackground: "#14211c",
  shadow: "0 28px 70px rgba(0, 0, 0, 0.38)",
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
    subject: "Your Synapse sign-in code",
    eyebrow: "Secure sign-in",
    heading: "Use this code to sign in",
    description:
      "Enter the verification code below to finish signing in to your Synapse account.",
    instruction: "Paste this code into the sign-in screen to continue.",
  },
  "change-email": {
    subject: "Confirm your new Synapse email",
    eyebrow: "Email change",
    heading: "Confirm your new email address",
    description:
      "Use the verification code below to confirm this email address for your Synapse account.",
    instruction: "Enter this code to complete your email change.",
  },
  "email-verification": {
    subject: "Verify your email for Synapse",
    eyebrow: "Email verification",
    heading: "Verify your email address",
    description:
      "Welcome to Synapse. Enter the verification code below to activate your account.",
    instruction: "Type this code into the verification form to finish setup.",
  },
  "forget-password": {
    subject: "Your Synapse password reset code",
    eyebrow: "Password reset",
    heading: "Reset your password",
    description:
      "Use the verification code below to continue resetting your Synapse password.",
    instruction: "Enter this code on the password reset screen to proceed.",
  },
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sendVerificationOtp = async ({
  email,
  type,
  otp,
}: sendVerificationOtpProps) => {
  const content = emailContentByType[type];
  const escapedEmail = escapeHtml(email);
  const escapedOtp = escapeHtml(otp);
  const escapedHeading = escapeHtml(content.heading);
  const escapedDescription = escapeHtml(content.description);
  const escapedEyebrow = escapeHtml(content.eyebrow);
  const escapedInstruction = escapeHtml(content.instruction);
  const text = [
    `${content.heading} - Synapse`,
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
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
          Your Synapse verification code is ${escapedOtp}.
        </div>
        <div style="margin:0;padding:36px 16px;background:${EMAIL_THEME.background};font-family:${EMAIL_FONT_FAMILY};color:${EMAIL_THEME.text};">
          <div style="max-width:560px;margin:0 auto;background:${EMAIL_THEME.surface};border:1px solid ${EMAIL_THEME.border};border-radius:24px;overflow:hidden;box-shadow:${EMAIL_THEME.shadow};">
            <div style="padding:28px 30px 26px;background:${EMAIL_THEME.elevated};border-bottom:1px solid ${EMAIL_THEME.border};">
              <div style="font-size:24px;line-height:1;font-weight:800;color:${EMAIL_THEME.text};">
                <span style="color:${EMAIL_THEME.primary};">Synapse</span>
              </div>
              <div style="display:inline-block;margin-top:22px;padding:7px 12px;border-radius:999px;background:${EMAIL_THEME.badgeBackground};border:1px solid ${EMAIL_THEME.border};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_THEME.accent};">
                ${escapedEyebrow}
              </div>
              <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.12;font-weight:800;color:${EMAIL_THEME.text};">
                ${escapedHeading}
              </h1>
              <p style="margin:0;max-width:430px;font-size:15px;line-height:1.7;color:${EMAIL_THEME.mutedText};">
                ${escapedDescription}
              </p>
            </div>

            <div style="padding:30px;">
              <div style="margin:0 0 20px;padding:20px;border:1px solid ${EMAIL_THEME.border};border-radius:20px;background:${EMAIL_THEME.noteBackground};">
                <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_THEME.secondary};">
                  Verification code
                </p>
                <div style="padding:22px 24px;border-radius:16px;background:${EMAIL_THEME.codeBackground};border:1px solid ${EMAIL_THEME.border};text-align:center;">
                  <span style="display:inline-block;font-family:${EMAIL_FONT_FAMILY};font-size:36px;line-height:1;font-weight:800;letter-spacing:0.22em;color:${EMAIL_THEME.codeText};text-transform:uppercase;white-space:nowrap;">${escapedOtp}</span>
                </div>
              </div>

              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${EMAIL_THEME.text};">
                ${escapedInstruction}
              </p>

              <div style="padding:16px 18px;border-radius:16px;background:${EMAIL_THEME.elevated};border:1px solid ${EMAIL_THEME.border};">
                <p style="margin:0;font-size:14px;line-height:1.7;color:${EMAIL_THEME.mutedText};">
                  This code was sent to <span style="font-weight:700;color:${EMAIL_THEME.text};">${escapedEmail}</span>. If you did not request this email, you can safely ignore it.
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
