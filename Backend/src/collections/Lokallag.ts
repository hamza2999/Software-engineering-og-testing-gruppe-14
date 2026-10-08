import type { CollectionConfig } from "payload";

export const Lokallag: CollectionConfig = {
    slug: 'lokallag',

    admin: {
        useAsTitle: 'name',
    },
    
    access: {
        read: () => true,
    },

    fields: [
        {
            name: 'name',
            label: 'Navn',
            type: 'text',
            required: true,
        },

        {
            name: 'region',
            label: 'Fylke eller region',
            type: 'text',
            required: true,
        },

        {
            name: 'description',
            label: 'Beskrivelse',
            type: 'textarea',
            required: true,
        },

        {
            name: 'address',
            label: 'Adresse',
            type: 'text',
            required: true,
        },

        {
            name: 'contactEmail',
            label: 'Kontakt',
            type: 'email',
        },

        {
            name: 'contactPhone',
            label: 'Telefonnummer',
            type: 'text',
        },
    ],
}