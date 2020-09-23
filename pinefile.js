const isDev = process.env.PINE_ENV === 'development';
const { shell, log } = require(isDev ? './packages/pine/src' : './');

const npm = (c) =>
  shell(`npm run ${c}`, {
    outputStream: process.stdout,
  });

module.exports = {
  build: () => {
    npm('build');
  },
  test: () => {
    npm('test');
  },
  hello: () => {
    log.info('hello');
  },
};
