import type { CollectionConfig } from "payload";

export const Nyheter: CollectionConfig = {
    slug: 'nyheter',

    admin: {
        useAsTitle: 'title',
    },

    access: {
        read: () => true,
    },

    fields: [
        {
            name: 'title',
            label: 'Tittel',
            type: 'text',
            required: true,
        },
        
        {
            name: 'content',
            label: 'Innhold',
            type: 'textarea',
            required: true,
        },

        {
        name: 'lokallag',
        label: 'Lokallag',
        type: 'relationship',
        relationTo: 'lokallag',
        }, 
    ],
}