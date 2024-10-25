const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'content.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'module'
  },
  experiments: {
    outputModule: true, // Enable output module experiment
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    fallback: {
      "fs": false,
      "path": false
    }
  },
  mode: 'production',
  devtool: 'source-map'  // Add this line to generate source maps
};
