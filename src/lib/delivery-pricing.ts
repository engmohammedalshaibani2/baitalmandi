/**
 * Delivery pricing — SINGLE source of truth for all delivery fee calculations.
 * All calculations are server-side only.
 * Never trust delivery_fee, distance, duration from the client.
 *
 * Pricing formula:
 *   if distance <= includedDistanceKm:
 *     deliveryFee = baseDeliveryFee
 *   else:
 *     deliveryFee = baseDeliveryFee + (distance - includedDistanceKm) * extraFeePerKm
 *
 * Surcharges (applied on top):
 *   Weather fee: flat fee if enabled
 *   Peak hours: percentage increase if enabled and current time is within peak window
 */

export interface DeliveryPricingSettings {
  baseDeliveryFee: number;
  includedDistanceKm: number;
  extraFeePerKm: number;
  maxDeliveryDistanceKm: number;
  enableWeatherFee: boolean;
  weatherFee: number;
  enablePeakHours: boolean;
  peakStartTime: string;
  peakEndTime: string;
  peakPercentage: number;
  peakDays: string[];
}

export interface DeliveryFeeInput {
  distanceKm: number;
  settings: DeliveryPricingSettings;
  /** Override for testing a specific time (ISO string), otherwise uses server time */
  now?: Date;
}

export interface DeliveryFeeResult {
  fee: number;
  baseFee: number;
  distanceKm: number;
  exceedsMaxDistance: boolean;
  maxDistanceKm: number;
  weatherFeeApplied: number;
  peakFeeApplied: number;
  peakPercentageApplied: number;
}

const DAY_NAMES_MAP: Record<string, number> = {
  'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
  'thursday': 4, 'friday': 5, 'saturday': 6,
};

/**
 * Normalize day name to lowercase-English for comparison.
 */
function normalizeDayName(day: string): string {
  return day.trim().toLowerCase();
}

/**
 * Check if current time falls within peak hours AND on a peak day.
 */
function isPeakTime(startTime: string, endTime: string, peakDays: string[], now: Date): boolean {
  if (peakDays.length > 0) {
    const today = now.getDay();
    const hasMatchingDay = peakDays.some(day => {
      const normalized = normalizeDayName(day);
      const dayIndex = DAY_NAMES_MAP[normalized];
      if (dayIndex === undefined) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return dayNames.indexOf(normalized) === today;
      }
      return dayIndex === today;
    });
    if (!hasMatchingDay) return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

/**
 * Calculate delivery fee.
 * This is the ONLY function that computes delivery charges.
 * Never accept delivery_fee from client input — always recalculate here.
 */
export function calculateDeliveryFee(input: DeliveryFeeInput): DeliveryFeeResult {
  const { distanceKm, settings, now } = input;

  const exceedsMaxDistance = distanceKm > settings.maxDeliveryDistanceKm;

  let baseFee = 0;
  if (!exceedsMaxDistance) {
    if (distanceKm <= settings.includedDistanceKm) {
      baseFee = settings.baseDeliveryFee;
    } else {
      const extraKm = distanceKm - settings.includedDistanceKm;
      baseFee = Math.round(settings.baseDeliveryFee + extraKm * settings.extraFeePerKm);
    }
  }

  let totalFee = baseFee;
  let weatherFeeApplied = 0;
  let peakFeeApplied = 0;
  let peakPercentageApplied = 0;

  if (!exceedsMaxDistance) {
    if (settings.enableWeatherFee && settings.weatherFee > 0) {
      weatherFeeApplied = settings.weatherFee;
      totalFee += weatherFeeApplied;
    }

    if (settings.enablePeakHours && settings.peakStartTime && settings.peakEndTime) {
      const currentTime = now || new Date();
      if (isPeakTime(settings.peakStartTime, settings.peakEndTime, settings.peakDays, currentTime)) {
        peakPercentageApplied = settings.peakPercentage;
        peakFeeApplied = Math.round(baseFee * peakPercentageApplied / 100);
        totalFee += peakFeeApplied;
      }
    }
  }

  return {
    fee: totalFee,
    baseFee,
    distanceKm,
    exceedsMaxDistance,
    maxDistanceKm: settings.maxDeliveryDistanceKm,
    weatherFeeApplied,
    peakFeeApplied,
    peakPercentageApplied,
  };
}

/**
 * Parse delivery pricing settings from a key-value map (as stored in site_settings).
 */
export function parseDeliverySettings(settingsMap: Record<string, string>): DeliveryPricingSettings {
  let peakDays: string[] = [];
  try {
    const raw = settingsMap['peak_days'];
    if (raw) peakDays = JSON.parse(raw);
  } catch {}
  if (!Array.isArray(peakDays)) peakDays = [];

  return {
    baseDeliveryFee: parseFloat(settingsMap['base_delivery_fee']) || 400,
    includedDistanceKm: parseFloat(settingsMap['included_distance_km']) || 2,
    extraFeePerKm: parseFloat(settingsMap['extra_fee_per_km']) || 100,
    maxDeliveryDistanceKm: parseFloat(settingsMap['max_delivery_distance_km']) || 15,
    enableWeatherFee: settingsMap['enable_weather_fee'] === 'true',
    weatherFee: parseFloat(settingsMap['weather_fee']) || 200,
    enablePeakHours: settingsMap['enable_peak_hours'] === 'true',
    peakStartTime: settingsMap['peak_start_time'] || '12:00',
    peakEndTime: settingsMap['peak_end_time'] || '14:00',
    peakPercentage: parseFloat(settingsMap['peak_percentage']) || 20,
    peakDays,
  };
}
