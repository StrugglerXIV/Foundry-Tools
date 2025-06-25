import copy from 'rollup-plugin-copy';

export default {
  input: 'src/main.js',
  output: {
    file: 'public/scripts/main.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    copy({
      targets: [
        { src: 'module.json', dest: 'dist' },
        { src: 'public/scripts', dest: 'dist' }
      ],
      hook: 'writeBundle'
    })
  ]
};
