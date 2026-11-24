const { buildSync } = require('esbuild');

buildSync({
  entryPoints: ['web/app.jsx'],
  outfile: 'public/app.js',
  bundle: true,
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
});
