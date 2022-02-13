/*
 * 本地开发的配置文件，会和 config.default.js 合并
 */

'use strict';

const secret = require('./secret');

exports.vod = {
  ...secret.vod,
};
