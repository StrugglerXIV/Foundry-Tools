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
        { src: 'public/module.json', dest: 'dist' },
        { src: 'public/icons', dest: 'dist' }  // Optional
      ],
      hook: 'writeBundle'
    })
  ]
};
