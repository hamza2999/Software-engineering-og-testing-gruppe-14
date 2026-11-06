import { expect, test } from '@playwright/test'
import { backendURL, fixtureData, frontendURL } from '../helpers/e2eManifest'

test('forsiden viser siste publiserte nyhet fra databasen', async ({ page }) => {
  const data = fixtureData()
  await page.goto(frontendURL())
  await expect(page).toHaveTitle('Husflidslaget')
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb')
  await expect(page.getByRole('heading', { name: data.latestNews.title })).toBeVisible()
  await page.getByRole('link', { name: 'Les nyheten' }).click()
  await expect(page).toHaveURL(frontendURL(`/nyheter/${data.latestNews.id}`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.latestNews.title)
  await expect(
    page.getByText(data.news.find((n) => n.id === data.latestNews.id)!.content, { exact: true }),
  ).toBeVisible()
  await expect(page.getByText(data.draftNews.title)).toHaveCount(0)
})

test('medlemsgruppesøk inkluderer data etter første API-side', async ({ page }) => {
  const data = fixtureData()
  await page.goto(frontendURL('/medlemsgrupper'))
  await expect(page.getByRole('heading', { name: data.groups.primary.name })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Sider med medlemsgrupper' })).toContainText(
    'Side 1 av 9',
  )
  await page.getByRole('searchbox', { name: 'Søk etter medlemsgruppe' }).fill(data.groups.last.name)
  await expect(page.locator('.group-card')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: data.groups.last.name })).toBeVisible()
  await page.getByRole('link', { name: 'Se medlemsgruppe', exact: true }).click()
  await expect(page).toHaveURL(frontendURL(`/medlemsgrupper/${data.groups.last.id}`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.groups.last.name)
})

test('lokallagsdetaljer viser kontakt og filtrerte nyheter og kurs', async ({ page }) => {
  const data = fixtureData()
  await page.goto(frontendURL(`/medlemsgrupper/${data.groups.primary.id}`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.groups.primary.name)
  await expect(page.getByRole('link', { name: data.groups.primary.contactEmail })).toHaveAttribute(
    'href',
    `mailto:${data.groups.primary.contactEmail}`,
  )
  await expect(page.getByRole('region', { name: 'Kontaktinformasjon' })).toContainText(
    data.groups.primary.address,
  )
  const news = page.getByRole('region', { name: 'Nyheter fra lokallaget' })
  const courses = page.getByRole('region', { name: 'Kommende kurs i lokallaget' })
  await expect(news.locator('.news-links li')).toHaveCount(6)
  await expect(courses.locator('.course-card')).toHaveCount(6)
  await expect(courses).not.toContainText(data.courses[7].title)
  await news.getByRole('button', { name: 'Neste', exact: true }).click()
  await expect(news.locator('.news-links li')).toHaveCount(1)
  await courses.getByRole('button', { name: 'Neste', exact: true }).click()
  await expect(courses.locator('.course-card')).toHaveCount(1)
  await expect(courses).toContainText(data.courses[6].title)
})

test('kurs har paginering, filter, detaljer og korrekt pris', async ({ page }) => {
  const data = fixtureData()
  await page.goto(frontendURL('/kurs'))
  await expect(page.locator('.course-card')).toHaveCount(6)
  await expect(page.getByRole('navigation', { name: 'Sider med kurs' })).toContainText(
    'Side 1 av 2',
  )
  await expect(page.locator('.course-card').first()).toContainText('Pris: Gratis')
  await expect(page.locator('.course-card').nth(1)).toContainText(/Pris:.*150/)
  await expect(page.getByText(data.pastCourse.title)).toHaveCount(0)
  await page.getByRole('button', { name: 'Neste', exact: true }).click()
  await expect(page.locator('.course-card')).toHaveCount(3)
  await expect(page).toHaveURL(/page=2/)
  await page.getByRole('combobox', { name: 'Lokallag' }).selectOption(data.groups.secondary.id)
  await expect(page.locator('.course-card')).toHaveCount(2)
  await expect(page).not.toHaveURL(/page=2/)
  await page.locator('.course-card').first().getByRole('link', { name: 'Se kurset' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.courses[7].title)
  await expect(page.locator('dl')).toContainText(data.courses[7].location)
  await expect(page.locator('time')).toHaveAttribute('datetime', data.courses[7].date)
  await expect(page.getByRole('link', { name: 'Se lokallaget' })).toHaveAttribute(
    'href',
    `/medlemsgrupper/${data.groups.secondary.id}`,
  )
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.courses[7].title)
  await page.goto(frontendURL(`/kurs/${data.pastCourse.id}`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.pastCourse.title)
  await expect(page.getByText('Dette kurset er avsluttet.')).toBeVisible()
})

test('nyheter kan filtreres og pagineres uten utkast', async ({ page }) => {
  const data = fixtureData()
  await page.goto(frontendURL('/nyheter'))
  await expect(page.locator('.news-links li')).toHaveCount(6)
  await page.getByRole('button', { name: 'Neste', exact: true }).click()
  await expect(page.locator('.news-links li')).toHaveCount(3)
  await page.getByRole('combobox', { name: 'Lokallag' }).selectOption(data.groups.secondary.id)
  await expect(page.locator('.news-links li')).toHaveCount(2)
  await expect(page.locator('.news-links')).not.toContainText(data.draftNews.title)
  await page.locator('.news-links a').first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(data.latestNews.title)
  await expect(page.locator('.article-content')).toContainText('Dette innholdet kommer fra SQLite.')
})

test('globalt søk finner faktiske kurs og lokallag utover første API-side', async ({ page }) => {
  const data = fixtureData()
  await page.goto(frontendURL())
  const search = page.getByRole('search')
  const results = page.getByRole('list', { name: 'Søkeresultater' })
  for (const [term, heading] of [
    [data.groups.last.name, data.groups.last.name],
    [data.courses[8].title, data.courses[8].title],
  ]) {
    await search.getByRole('searchbox').fill(term)
    await search.getByRole('button', { name: 'Søk', exact: true }).click()
    await expect(results.getByRole('link')).toHaveCount(1)
    await results.getByRole('link').click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
  }
})

test('tomme resultater gir forståelig tekst', async ({ page }) => {
  const data = fixtureData()
  await page.goto(frontendURL(`/kurs?lokallagId=${data.groups.empty.id}`))
  await expect(page.getByText('Ingen kommende kurs å vise.', { exact: true })).toBeVisible()
  await expect(page.locator('.course-card')).toHaveCount(0)
  await page.goto(frontendURL(`/nyheter?lokallagId=${data.groups.empty.id}`))
  await expect(page.getByText('Ingen publiserte nyheter å vise.', { exact: true })).toBeVisible()
  await page.goto(frontendURL('/medlemsgrupper'))
  await expect(page.locator('.group-card').first()).toBeVisible()
  await page.getByRole('searchbox', { name: 'Søk etter medlemsgruppe' }).fill('finnes-ikke-xyz')
  await expect(page.getByText('Ingen medlemsgrupper ble funnet.')).toBeVisible()
})

test('ukjente detaljer og upubliserte nyheter håndteres som 404', async ({ page }) => {
  const data = fixtureData()
  for (const [path, heading] of [
    ['/medlemsgrupper/999999999', 'Medlemsgruppen finnes ikke'],
    ['/kurs/999999999', 'Kurset finnes ikke'],
    ['/nyheter/999999999', 'Nyheten finnes ikke'],
    [`/nyheter/${data.draftNews.id}`, 'Nyheten finnes ikke'],
    ['/side-som-ikke-finnes', 'Siden finnes ikke'],
  ]) {
    await page.goto(frontendURL(path))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
  }
})

test('ventetilstand og nytt forsøk etter serverfeil', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(
    '**/api/kurs/oversikt?*',
    async (route) => {
      await gate
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Intern databasefeil skal ikke vises' }),
      })
    },
    { times: 1 },
  )
  await page.goto(frontendURL('/kurs'))
  await expect(page.getByText('Laster kurs …', { exact: true })).toBeVisible()
  release()
  const error = page.getByRole('alert')
  await expect(error).toContainText('Prøv igjen')
  await expect(error).not.toContainText('Intern databasefeil')
  await error.getByRole('button', { name: 'Prøv igjen' }).click()
  await expect(page.locator('.course-card')).toHaveCount(6)
  await expect(error).toHaveCount(0)
})

test('ugyldig JSON blir en synlig feil uten falsk tomliste', async ({ page }) => {
  await page.route(
    '**/api/nyheter/oversikt?*',
    (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Proxyfeil</html>' }),
    { times: 1 },
  )
  await page.goto(frontendURL('/nyheter'))
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText('Ingen publiserte nyheter å vise.', { exact: true })).toHaveCount(0)
  await page.getByRole('alert').getByRole('button', { name: 'Prøv igjen' }).click()
  await expect(page.locator('.news-links li')).toHaveCount(6)
})

test('langsomt svar fra tidligere filter overskriver ikke nytt resultat', async ({ page }) => {
  const data = fixtureData()
  let release!: () => void
  let intercepted!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const started = new Promise<void>((resolve) => {
    intercepted = resolve
  })
  await page.route('**/api/kurs/oversikt?*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('lokallagId') !== data.groups.secondary.id)
      return route.continue()
    const response = await route.fetch()
    intercepted()
    await gate
    await route.fulfill({ response })
  })
  await page.goto(frontendURL('/kurs'))
  await expect(page.locator('.course-card')).toHaveCount(6)
  await page.getByRole('combobox', { name: 'Lokallag' }).selectOption(data.groups.secondary.id)
  await started
  await page.getByRole('combobox', { name: 'Lokallag' }).selectOption(data.groups.empty.id)
  await expect(page.getByText('Ingen kommende kurs å vise.', { exact: true })).toBeVisible()
  release()
  await expect(page.locator('.course-card')).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Lokallag' })).toHaveValue(data.groups.empty.id)
})

test('innlogging og utlogging fungerer gjennom proxyen', async ({ page }) => {
  const data = fixtureData()
  await page.goto(frontendURL('/logg-inn'))
  await page.getByRole('textbox', { name: 'E-post' }).fill(data.user.email)
  await page.getByLabel('Passord', { exact: true }).fill(data.user.password)
  await page.getByRole('button', { name: 'Logg inn', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Min side')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Min side')
  await page.getByRole('button', { name: 'Logg ut', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Logg inn')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Logg inn', exact: true })).toBeVisible()
})

test('health og CORS svarer fra faktisk testserver', async ({ request }) => {
  const health = await request.get(frontendURL('/api/health'))
  expect(health.status()).toBe(200)
  expect(await health.json()).toEqual({ status: 'ok' })
  expect(health.headers()['cache-control']).toBe('no-store')
  const allowed = await request.get(backendURL('/api/lokallag/oversikt'), {
    headers: { Origin: frontendURL('') },
  })
  expect(allowed.headers()['access-control-allow-origin']).toBe(frontendURL(''))
  const denied = await request.get(backendURL('/api/lokallag/oversikt'), {
    headers: { Origin: 'https://ikke-tillatt.example.test' },
  })
  expect(denied.headers()['access-control-allow-origin']).not.toBe(
    'https://ikke-tillatt.example.test',
  )
})

test('hovedsidene passer skjermbredden', async ({ page }) => {
  const data = fixtureData()
  for (const path of [
    '/',
    '/kurs',
    '/nyheter',
    '/medlemsgrupper',
    `/kurs/${data.courses[0].id}`,
    `/medlemsgrupper/${data.groups.primary.id}`,
    '/logg-inn',
  ]) {
    await page.goto(frontendURL(path))
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('main .api-state[role="status"]')).toHaveCount(0)
    const sizes = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }))
    expect(sizes.content, path).toBeLessThanOrEqual(sizes.viewport + 1)
  }
})
