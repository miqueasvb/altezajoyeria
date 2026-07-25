import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'miqueasvb/altezajoyeria', // Tu repositorio exacto
  },
  collections: {
    destacados: collection({
      label: 'Productos Destacados',
      slugField: 'nombre',
      path: 'content/destacados/*',
      format: { data: 'json' },
      schema: {
        nombre: fields.slug({ name: { label: 'Nombre del Producto' } }),
        precioActual: fields.text({ label: 'Precio Actual (ej: $175.000)' }),
        precioAnterior: fields.text({ label: 'Precio Anterior / Tachado (opcional)' }),
        imagen: fields.image({
          label: 'Imagen del Producto',
          directory: 'images',
          publicPath: '/images/',
        }),
      },
    }),
  },
});
