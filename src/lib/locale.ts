import en from './messages/en'
import ptBR from './messages/pt-BR'
import type { Messages } from './messages/en'

const messageMap: Record<string, Messages> = {
  en,
  'pt-BR': ptBR,
}

export type DateFormat = 'mdy' | 'dmy'
export type TimeFormat = '12' | '24'

export const locale = {
  lang: process.env.NEXT_PUBLIC_LOCALE ?? 'en',
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? 'USD',
  dateFormat: (process.env.NEXT_PUBLIC_DATE_FORMAT ?? 'mdy') as DateFormat,
  timeFormat: (process.env.NEXT_PUBLIC_TIME_FORMAT ?? '12') as TimeFormat,
}

const messages: Messages = messageMap[locale.lang] ?? en

export function t<S extends keyof Messages>(section: S): Messages[S] {
  return messages[section]
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(locale.lang, {
    style: 'currency',
    currency: locale.currency,
  }).format(amount)
}

function toDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date
}

function dateFormatOptions(): Intl.DateTimeFormatOptions {
  return locale.dateFormat === 'dmy'
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { month: '2-digit', day: '2-digit', year: 'numeric' }
}

function timeFormatOptions(): Intl.DateTimeFormatOptions {
  return locale.timeFormat === '24'
    ? { hour: '2-digit', minute: '2-digit', hour12: false }
    : { hour: '2-digit', minute: '2-digit', hour12: true }
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(locale.lang, {
    ...dateFormatOptions(),
    ...timeFormatOptions(),
  }).format(toDate(date))
}

export function formatDateOnly(date: Date | string): string {
  return new Intl.DateTimeFormat(locale.lang, dateFormatOptions()).format(toDate(date))
}
