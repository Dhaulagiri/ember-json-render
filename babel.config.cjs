module.exports = {
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/plugin-transform-typescript',
    '@embroider/addon-dev/template-colocation-plugin',
    ['babel-plugin-ember-template-compilation', { targetFormat: 'hbs' }],
  ],
};
