module.exports = {
  devServer: {
    proxy: {
      '/php': {
        target: 'http://localhost:80',
        pathRewrite: {'^/php' : ''}
      }
    }
  }
};