export class InvalidKursCapacityError extends Error {}

/**
 * Beregner ledige plasser for en endelig plassgrense.
 * Kalleren leverer antall aktive påmeldinger og utelater avmeldte.
 * Validering av kursfelt og regler for kapasitetsendringer håndteres separat.
 */
export function calculateAvailablePlaces(
  capacity: number,
  activeRegistrationCount: number,
): number {
  if (!Number.isSafeInteger(capacity) || capacity < 0) {
    throw new InvalidKursCapacityError('capacity må være et ikke-negativt, sikkert heltall.')
  }
  if (!Number.isSafeInteger(activeRegistrationCount) || activeRegistrationCount < 0) {
    throw new InvalidKursCapacityError(
      'activeRegistrationCount må være et ikke-negativt, sikkert heltall.',
    )
  }

  return Math.max(0, capacity - activeRegistrationCount)
}
