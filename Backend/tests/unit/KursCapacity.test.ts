import { describe, expect, it } from 'vitest'

import {
  calculateAvailablePlaces,
  InvalidKursCapacityError,
} from '../../src/modules/kurs/domain/KursCapacity'

describe('S4-07: ledige kursplasser uten Payload eller database', () => {
  it.each([
    { capacity: 10, activeRegistrationCount: 0, availablePlaces: 10 },
    { capacity: 10, activeRegistrationCount: 3, availablePlaces: 7 },
    { capacity: 10, activeRegistrationCount: 10, availablePlaces: 0 },
  ])(
    'gir $availablePlaces ledige plasser ved kapasitet $capacity og $activeRegistrationCount aktive',
    ({ capacity, activeRegistrationCount, availablePlaces }) => {
      expect(calculateAvailablePlaces(capacity, activeRegistrationCount)).toBe(availablePlaces)
    },
  )

  it('gir null ledige plasser når en endelig plassgrense er null', () => {
    expect(calculateAvailablePlaces(0, 0)).toBe(0)
  })

  it('viser ingen ledige plasser når antall aktive overstiger plassgrensen', () => {
    expect(calculateAvailablePlaces(10, 11)).toBe(0)
  })

  it('bevarer nøyaktigheten ved største sikre heltall', () => {
    expect(calculateAvailablePlaces(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1)).toBe(1)
  })

  it('beregner en ledig plass mer når kalleren leverer et lavere aktivt antall', () => {
    expect(calculateAvailablePlaces(10, 3)).toBe(7)
    expect(calculateAvailablePlaces(10, 2)).toBe(8)
  })

  const invalidCounts = [-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]

  it.each(invalidCounts)('avviser ugyldig plassgrense: %s', (capacity) => {
    expect(() => calculateAvailablePlaces(capacity, 0)).toThrow(InvalidKursCapacityError)
  })

  it.each(invalidCounts)('avviser ugyldig antall aktive påmeldinger: %s', (count) => {
    expect(() => calculateAvailablePlaces(10, count)).toThrow(InvalidKursCapacityError)
  })
})
