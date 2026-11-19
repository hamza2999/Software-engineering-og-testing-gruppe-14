import { test, expect } from '@playwright/test'
import { login } from '../helpers/login'
import { backendURL, fixtureData } from '../helpers/e2eManifest'

test('innlogget redaktør kan åpne admin og kursfeltene', async ({ page }) => {
  const data = fixtureData()
  await login({ page, serverURL: backendURL(''), user: data.user })
  await page.goto(backendURL('/admin/collections/kurs'))
  await expect(page.getByRole('heading', { name: 'Kurs', exact: true })).toBeVisible()
  await page.goto(backendURL(`/admin/collections/kurs/${data.courses[0].id}`))
  await expect(page.locator('#field-title')).toHaveValue(data.courses[0].title)
  await expect(page.locator('#field-location')).toHaveValue(data.courses[0].location)
  await expect(page.locator('#field-price')).toHaveValue('0')
})
