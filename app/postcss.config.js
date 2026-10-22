import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Point Tailwind at this project's config explicitly so PostCSS resolves it
// even when the dev server is launched from a different working directory.
const here = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: join(here, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
