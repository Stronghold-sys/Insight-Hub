/**
 * Date/Time Utilities — Asia/Jakarta (WIB) formatting and timezone calculations.
 */

/**
 * Konversi Date (UTC) ke string berformat WIB atau tanggal Indonesia.
 * Contoh: 
 * - 'full': 28 Juni 2026 • 14:35 WIB
 * - 'date-only': 28 Juni 2026
 * - 'day-date': Minggu, 28 Juni 2026
 * - 'short-date': 28/06/2026
 * - 'time-only': 14:35 WIB
 */
export function formatToWIB(
  dateInput: Date | string | null,
  formatType: 'full' | 'date-only' | 'day-date' | 'time-only' | 'short-date' = 'full'
): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
  };

  const formatter = new Intl.DateTimeFormat('id-ID', {
    ...options,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const partsMap = new Map(parts.map(p => [p.type, p.value]));

  const day = partsMap.get('day') || '';
  const month = partsMap.get('month') || '';
  const year = partsMap.get('year') || '';
  const hour = partsMap.get('hour') || '';
  const minute = partsMap.get('minute') || '';

  if (formatType === 'date-only') {
    return `${day} ${month} ${year}`;
  }

  if (formatType === 'time-only') {
    return `${hour}:${minute} WIB`;
  }

  if (formatType === 'short-date') {
    const numericFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return numericFormatter.format(date);
  }

  if (formatType === 'day-date') {
    const dayFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long'
    });
    const weekday = dayFormatter.format(date);
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}, ${day} ${month} ${year}`;
  }

  return `${day} ${month} ${year} • ${hour}:${minute} WIB`;
}

/**
 * Hitung expired_at berdasarkan startsAt (dalam UTC) dan durasi hari.
 * Mengikuti aturan: berakhir pada jam 23:59 WIB di hari terakhir.
 */
export function calculateExpirationDate(startDate: Date, durationDays: number): Date {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const parts = formatter.formatToParts(startDate);
  const partsMap = new Map(parts.map(p => [p.type, p.value]));

  const year = parseInt(partsMap.get('year')!);
  const month = parseInt(partsMap.get('month')!) - 1; // 0-indexed
  const day = parseInt(partsMap.get('day')!);

  const targetYear = year;
  const targetMonth = month;
  const targetDay = day + durationDays;

  // Jam 23:59:59.999 WIB = 16:59:59.999 UTC
  return new Date(Date.UTC(targetYear, targetMonth, targetDay, 16, 59, 59, 999));
}

/**
 * Hitung sisa waktu dalam bahasa Indonesia.
 * Contoh: "5 Hari Lagi", "6 Hari 12 Jam 32 Menit", "Berakhir Besok", "Berakhir Hari Ini", "Berakhir Kemarin"
 */
export function getRemainingTimeText(expiredAt: Date | string | null): string {
  if (!expiredAt) return '';
  const expiry = new Date(expiredAt);
  if (isNaN(expiry.getTime())) return '';

  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 'Sudah Berakhir';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  const nowStr = formatter.format(now);
  const expiryStr = formatter.format(expiry);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatter.format(tomorrow);

  if (nowStr === expiryStr) {
    return 'Berakhir Hari Ini';
  }
  if (tomorrowStr === expiryStr) {
    return 'Berakhir Besok';
  }

  if (diffDays >= 7) {
    return `${diffDays} Hari Lagi`;
  }

  const remainingHours = diffHours % 24;
  const remainingMinutes = diffMinutes % 60;

  if (diffDays > 0) {
    return `${diffDays} Hari ${remainingHours} Jam ${remainingMinutes} Menit`;
  }
  if (diffHours > 0) {
    return `${diffHours} Jam ${remainingMinutes} Menit`;
  }
  return `${diffMinutes} Menit`;
}
