import type { NodemailerAdapterArgs } from '@payloadcms/email-nodemailer'

/** Local development and tests use Payload's console adapter unless SMTP is explicitly selected. */
export function smtpEmailOptions(
  env: Record<string, string | undefined>,
): NodemailerAdapterArgs | undefined {
  const mode = env.EMAIL_TRANSPORT || 'console'
  if (mode === 'console') return undefined
  if (mode !== 'smtp') throw new Error('EMAIL_TRANSPORT må være console eller smtp.')

  const host = env.SMTP_HOST?.trim()
  if (!host) throw new Error('SMTP_HOST er påkrevd når EMAIL_TRANSPORT=smtp.')

  const portValue = env.SMTP_PORT ?? '587'
  const port = Number(portValue)
  if (!/^\d+$/.test(portValue) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT må være et heltall mellom 1 og 65535.')
  }

  const user = env.SMTP_USER
  const pass = env.SMTP_PASS
  if (Boolean(user) !== Boolean(pass)) {
    throw new Error('Sett både SMTP_USER og SMTP_PASS, eller utelat begge.')
  }

  const local = ['localhost', '127.0.0.1', '::1'].includes(host.toLowerCase())
  return {
    defaultFromAddress: env.SMTP_FROM_ADDRESS?.trim() || 'noreply@example.test',
    defaultFromName: 'Østfold Husflidslag',
    // Build, migrations and seeding should not open an SMTP connection.
    skipVerify: true,
    transportOptions: {
      host,
      port,
      secure: port === 465,
      requireTLS: !local && port !== 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    },
  }
}
