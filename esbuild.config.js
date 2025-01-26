import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outdir: 'dist',
  plugins: [
    nodeExternalsPlugin({
      allowList: ['node-fetch', 'lodash'],
    }),
  ],
  tsconfig: 'tsconfig.json',
  sourcemap: true,
  format: 'esm',
  outExtension: { '.js': '.js' },
  banner: {
    js: `
      import { createRequire } from 'module';
      import { fileURLToPath } from 'url';
      import { dirname } from 'path';
      const require = createRequire(import.meta.url);
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
    `,
  },
  alias: {
    '@': './src',
  },
}).catch(() => process.exit(1));
