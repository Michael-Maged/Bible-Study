import nodemailer from 'nodemailer'

export async function sendRejectionEmail(to: string, name: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Bible Kids" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your registration was not approved',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a1a">Hi ${name},</h2>
        <p style="color:#555">We're sorry to inform you that your registration was not approved at this time.</p>
        <p style="color:#555">Please re-register using the registration form with the correct information.</p>
        <p style="color:#555">If you believe this was a mistake, please contact your church administrator.</p>
        <p style="color:#555;margin-top:32px">— The Bible Kids Team</p>
      </div>
    `,
  })
}
