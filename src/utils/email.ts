import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #0f172a; margin-bottom: 4px;">VIBES</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        We received a request to reset your password.
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        If this was you, click the button below to choose a new password. This link expires in 1 hour.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}"
           style="background: #f97316; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
        If you didn't request this, you can safely ignore this email — your password won't be changed.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"VIBES" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your VIBES password",
    html,
  });
}