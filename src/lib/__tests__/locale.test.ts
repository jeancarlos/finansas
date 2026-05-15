// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

function loadLocale(env: Record<string, string>) {
  vi.stubEnv('NEXT_PUBLIC_LOCALE', env.NEXT_PUBLIC_LOCALE ?? 'en')
  vi.stubEnv('NEXT_PUBLIC_CURRENCY', env.NEXT_PUBLIC_CURRENCY ?? 'USD')
  vi.stubEnv('NEXT_PUBLIC_DATE_FORMAT', env.NEXT_PUBLIC_DATE_FORMAT ?? 'mdy')
  vi.stubEnv('NEXT_PUBLIC_TIME_FORMAT', env.NEXT_PUBLIC_TIME_FORMAT ?? '12')
}

// Fixed date for deterministic output: 2026-05-15T14:30:00.000Z
const TEST_DATE = new Date('2026-05-15T14:30:00.000Z')

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
})

describe('t()', () => {
  it('returns English messages by default', async () => {
    loadLocale({})
    const { t } = await import('../locale')
    expect(t('login').title).toBe('Sign in')
    expect(t('nav').home).toBe('Home')
  })

  it('returns pt-BR messages when locale is pt-BR', async () => {
    loadLocale({ NEXT_PUBLIC_LOCALE: 'pt-BR' })
    const { t } = await import('../locale')
    expect(t('login').title).toBe('Entrar')
    expect(t('nav').home).toBe('Início')
  })

  it('falls back to English for unknown locale', async () => {
    loadLocale({ NEXT_PUBLIC_LOCALE: 'fr' })
    const { t } = await import('../locale')
    expect(t('login').title).toBe('Sign in')
  })
})

describe('formatCurrency()', () => {
  it('formats USD in English', async () => {
    loadLocale({ NEXT_PUBLIC_LOCALE: 'en', NEXT_PUBLIC_CURRENCY: 'USD' })
    const { formatCurrency } = await import('../locale')
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats BRL in pt-BR', async () => {
    loadLocale({ NEXT_PUBLIC_LOCALE: 'pt-BR', NEXT_PUBLIC_CURRENCY: 'BRL' })
    const { formatCurrency } = await import('../locale')
    // Intl formats BRL as R$ 1.234,56 in pt-BR
    const result = formatCurrency(1234.56)
    expect(result).toContain('1.234,56')
    expect(result).toContain('R$')
  })
})

describe('formatDateOnly()', () => {
  it('formats as MM/DD/YYYY with mdy', async () => {
    loadLocale({ NEXT_PUBLIC_LOCALE: 'en', NEXT_PUBLIC_DATE_FORMAT: 'mdy' })
    const { formatDateOnly } = await import('../locale')
    const result = formatDateOnly(TEST_DATE)
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    expect(result).toContain('2026')
  })

  it('formats as DD/MM/YYYY with dmy', async () => {
    loadLocale({ NEXT_PUBLIC_LOCALE: 'pt-BR', NEXT_PUBLIC_DATE_FORMAT: 'dmy' })
    const { formatDateOnly } = await import('../locale')
    const result = formatDateOnly(TEST_DATE)
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    expect(result).toContain('2026')
  })
})

describe('formatDate()', () => {
  it('includes AM/PM with 12h format', async () => {
    loadLocale({ NEXT_PUBLIC_LOCALE: 'en', NEXT_PUBLIC_TIME_FORMAT: '12' })
    const { formatDate } = await import('../locale')
    const result = formatDate(TEST_DATE)
    expect(result.toUpperCase()).toMatch(/AM|PM/)
  })

  it('uses 24h format', async () => {
    loadLocale({ NEXT_PUBLIC_LOCALE: 'en', NEXT_PUBLIC_TIME_FORMAT: '24' })
    const { formatDate } = await import('../locale')
    const result = formatDate(TEST_DATE)
    expect(result.toUpperCase()).not.toMatch(/AM|PM/)
  })
})
