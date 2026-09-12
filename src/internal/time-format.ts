import type { TimeFormatContext } from '../types';

export function createTimeFormatter(context: TimeFormatContext): (value: number) => string {
  const span = context.domain[1] - context.domain[0];
  const options: Intl.DateTimeFormatOptions = { timeZone: context.timeZone, hourCycle: 'h23' };
  if (span < 60_000) Object.assign(options, { hour: '2-digit', minute: '2-digit', second: '2-digit', ...(span < 1000 ? { fractionalSecondDigits: 3 } : {}) });
  else if (span < 86_400_000) Object.assign(options, { hour: '2-digit', minute: '2-digit' });
  else if (span < 7 * 86_400_000) Object.assign(options, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  else if (span < 366 * 86_400_000) Object.assign(options, { month: 'short', day: 'numeric' });
  else Object.assign(options, { year: 'numeric', month: 'short' });
  return new Intl.DateTimeFormat(context.locale, options).format;
}

