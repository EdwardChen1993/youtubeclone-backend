/*
 * 生成环境的配置文件，会和 config.default.js 合并
 */

'use strict';

exports.vod = {
  accessKeyId: process.env.accessKeyId,
  accessKeySecret: process.env.accessKeySecret,
};
