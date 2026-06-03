import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c))
}

export async function sendApprovalEmail(to: string, name: string): Promise<void> {
  const safeName = escapeHtml(name)

  await resend.emails.send({
    from: 'Bible Kids <onboarding@resend.dev>',
    to,
    subject: 'Your registration has been approved!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a1a">Welcome, ${safeName}!</h2>
        <p style="color:#555">Great news — your registration has been approved.</p>
        <p style="color:#555">You can now sign in to the app and start your daily Bible reading.</p>
        <p style="color:#555;margin-top:32px">— The Bible Kids Team</p>
      </div>
    `,
  })
}

export async function sendRejectionEmail(to: string, name: string): Promise<void> {
  const safeName = escapeHtml(name)

  await resend.emails.send({
    from: 'Bible Kids <onboarding@resend.dev>',
    to,
    subject: 'Your registration was not approved',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a1a">Hi ${safeName},</h2>
        <p style="color:#555">We're sorry to inform you that your registration was not approved at this time.</p>
        <p style="color:#555">Please re-register using the registration form with the correct information.</p>
        <p style="color:#555">If you believe this was a mistake, please contact your church administrator.</p>
        <p style="color:#555;margin-top:32px">— The Bible Kids Team</p>
      </div>
    `,
  })
}
