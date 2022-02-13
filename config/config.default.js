/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1644376579263_3260';

  // add your middleware config here
  config.middleware = [ 'errorHandler' ];

  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1:27017/youtube-clone',
      options: { useUnifiedTopology: true },
      // mongoose global plugins, expected a function or an array of function and options
      // plugins: [ createdPlugin, [ updatedPlugin, pluginOptions ]],
    },
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.jwt = {
    secret: 'b3ae5bf2-8ec6-428a-887c-b8aa8e76ddbf',
    expiresIn: '1d',
  };

  config.cors = {
    origin: '*',
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };


  return {
    ...config,
    ...userConfig,
  };
};
