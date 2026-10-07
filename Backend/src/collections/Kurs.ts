import type { CollectionConfig } from "payload";

export const Kurs: CollectionConfig = {
    slug: 'kurs',
    admin: {
        useAsTitle: 'navn',
    },
    
    fields: [
        {
            name: 'navn',
            label: 'Kurs navn',
            type: 'text',
            required: true,
        },
    ],
}