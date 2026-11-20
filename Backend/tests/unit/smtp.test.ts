import { describe, expect, it } from 'vitest'
import { smtpEmailOptions } from '../../src/email/smtp'

describe('E-postkonfigurasjon', () => {
  it('bruker konsoll uten eksplisitt SMTP-valg, også når SMTP-verdier finnes i miljøet', () => {
    expect(smtpEmailOptions({ SMTP_HOST: 'test.example' })).toBeUndefined()
    expect(smtpEmailOptions({ EMAIL_TRANSPORT: 'console' })).toBeUndefined()
  })

  it.each([
    { EMAIL_TRANSPORT: 'ukjent' },
    { EMAIL_TRANSPORT: 'smtp' },
    { EMAIL_TRANSPORT: 'smtp', SMTP_HOST: 'localhost', SMTP_USER: 'testbruker' },
    { EMAIL_TRANSPORT: 'smtp', SMTP_HOST: 'localhost', SMTP_PORT: '65536' },
    { EMAIL_TRANSPORT: 'smtp', SMTP_HOST: 'localhost', SMTP_PORT: '25.5' },
  ])('avviser ufullstendig eller ugyldig oppsett', (env) => {
    expect(() => smtpEmailOptions(env)).toThrow()
  })

  it('kan bruke lokal testpostkasse uten passord eller TLS', () => {
    const options = smtpEmailOptions({
      EMAIL_TRANSPORT: 'smtp',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: '1025',
    })
    expect(options?.transportOptions).toMatchObject({
      host: '127.0.0.1',
      port: 1025,
      secure: false,
      requireTLS: false,
    })
    expect(options?.transportOptions).not.toHaveProperty('auth')
  })

  it.each([
    ['587', false, true],
    ['465', true, false],
  ] as const)(
    'bruker kryptert SMTP til ekstern testpostkasse på port %s',
    (port, secure, requireTLS) => {
      const options = smtpEmailOptions({
        EMAIL_TRANSPORT: 'smtp',
        SMTP_HOST: 'test.example',
        SMTP_PORT: port,
        SMTP_USER: 'testbruker',
        SMTP_PASS: 'fiktiv-testverdi',
      })
      expect(options?.transportOptions).toMatchObject({
        secure,
        requireTLS,
        auth: { user: 'testbruker' },
      })
    },
  )
})
