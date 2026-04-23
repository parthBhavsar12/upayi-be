type BaseEmailTemplateParams = {
  title: string;
  previewText: string;
  heading: string;
  bodyHtml: string;
  ctaText: string;
  ctaUrl: string;
  supportText?: string;
};

const APP_NAME = 'UPayI';
const BRAND_COLOR = '#2563eb';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const renderBaseEmail = ({
  title,
  previewText,
  heading,
  bodyHtml,
  ctaText,
  ctaUrl,
  supportText,
}: BaseEmailTemplateParams) => {
  const safeTitle = escapeHtml(title);
  const safePreview = escapeHtml(previewText);
  const safeHeading = escapeHtml(heading);
  const safeCtaText = escapeHtml(ctaText);
  const safeCtaUrl = escapeHtml(ctaUrl);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light only" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f9fc;">
    <!-- Preheader (hidden) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
      ${safePreview}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f9fc;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;">
            <!-- Global header pattern -->
            <tr>
              <td style="padding:0 0 12px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0;background:#ffffff;border-radius:14px 14px 0 0;">
                  <tr>
                    <td style="padding:18px 22px;border-bottom:1px solid #e5e7eb;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';font-size:18px;line-height:24px;font-weight:700;color:#111827;">
                        ${APP_NAME}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0;background:#ffffff;border-radius:0 0 14px 14px;">
                  <tr>
                    <td style="padding:22px 22px 10px 22px;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';font-size:22px;line-height:30px;font-weight:700;color:#111827;">
                        ${safeHeading}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 22px 10px 22px;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';font-size:15px;line-height:24px;color:#374151;">
                        ${bodyHtml}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:14px 22px 8px 22px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td bgcolor="${BRAND_COLOR}" style="border-radius:10px;">
                            <a href="${safeCtaUrl}" style="display:inline-block;padding:12px 16px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                              ${safeCtaText}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 22px 18px 22px;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';font-size:12px;line-height:18px;color:#6b7280;">
                        If the button doesn’t work, copy and paste this link into your browser:<br />
                        <span style="word-break:break-all;">${safeCtaUrl}</span>
                      </div>
                    </td>
                  </tr>

                  ${
                    supportText
                      ? `<tr>
                    <td style="padding:0 22px 22px 22px;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';font-size:12px;line-height:18px;color:#6b7280;">
                        ${escapeHtml(supportText)}
                      </div>
                    </td>
                  </tr>`
                      : ''
                  }
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:14px 4px 0 4px;">
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';font-size:12px;line-height:18px;color:#6b7280;text-align:center;">
                  © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${APP_NAME}\n\n${heading}\n\n${previewText}\n\n${ctaText}: ${ctaUrl}\n\nIf you didn’t request this, you can ignore this email.`;

  return { html, text };
};

export const verificationEmailTemplate = (verifyUrl: string) => {
  return renderBaseEmail({
    title: 'Verify your email',
    previewText: 'Please verify your email to finish setting up your account.',
    heading: 'Verify your email',
    bodyHtml:
      '<p>Thanks for signing up. Please confirm your email address to activate your account.</p><p>This link will expire in 24 hours.</p>',
    ctaText: 'Verify email',
    ctaUrl: verifyUrl,
    supportText: 'If you didn’t create an account, you can safely ignore this email.',
  });
};

export const resetPasswordEmailTemplate = (resetUrl: string) => {
  return renderBaseEmail({
    title: 'Reset your password',
    previewText: 'A password reset was requested for your account.',
    heading: 'Reset your password',
    bodyHtml:
      '<p>We received a request to reset your password. You can reset it using the button below.</p><p>This link will expire in 1 hour.</p>',
    ctaText: 'Reset password',
    ctaUrl: resetUrl,
    supportText: 'If you didn’t request a password reset, you can ignore this email.',
  });
};

