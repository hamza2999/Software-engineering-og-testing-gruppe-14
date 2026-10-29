import type { RequiredDataFromCollectionSlug } from 'payload'

type LokallagSeed = RequiredDataFromCollectionSlug<'lokallag'>

type KursSeed = Omit<RequiredDataFromCollectionSlug<'kurs'>, 'lokallag'> & {
    lokallagName: string
}

type NyhetSeed = Omit<RequiredDataFromCollectionSlug<'nyheter'>, 'lokallag'> & {
    lokallagName: string
}

export const lokallagData: LokallagSeed[] = [
    {
        name: 'Testlag Nord',
        region: 'Nord',
        description: 'Et lokallag',
        address: 'Storgata 1'

    },

    {
        name: 'Testlag Øst',
        region: 'Øst',
        description: 'Et lokallag',
        address: 'Storgata 2'

    },

    {
        name: 'Testlag Sør',
        region: 'Sør',
        description: 'Et lokallag',
        address: 'Storgata 3'

    },

    {
        name: 'Testlag Vest',
        region: 'Vest',
        description: 'Et lokallag',
        address: 'Storgata 4'

    }
]

export const kursData: KursSeed[] = [
    {
        title: 'Strikke',
        date: '2026-11-15T12:00:00Z',
        description: 'Strikke kurs',
        lokallagName: 'Testlag Nord'
    },

    {
        title: 'Sy',
        date: '2026-10-01T12:00:00Z',
        description: 'Sy kurs',
        lokallagName: 'Testlag Sør'
    },

    {
        title: 'Fekle',
        date: '2026-11-15T12:00:00Z',
        description: 'Fekle kurs',
        lokallagName: 'Testlag Vest'
    },

    {
        title: 'Synge',
        date: '2026-11-15T12:00:00Z',
        description: 'Synge kurs',
        lokallagName: 'Testlag Øst'
    }
]

export const nyheterData: NyhetSeed[] = [
    {
        title: 'Nyheter 1',
        content: 'Noen nyheter',
        lokallagName: 'Testlag Nord'
    },

    {
        title: 'Nyheter 2',
        content: 'Noen nyheter',
        lokallagName: 'Testlag Vest'
    },

    {
        title: 'Nyheter 3',
        content: 'Noen nyheter',
        lokallagName: 'Testlag Sør'
    },

    {
        title: 'Nyheter 4',
        content: 'Noen nyheter',
        lokallagName: 'Testlag Øst'
    }
]