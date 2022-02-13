'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const auth = app.middleware.auth();

  router.prefix('/api/v1'); // 设置基础路径

  router.post('/users', controller.user.create); // 用户注册
  router.post('/users/login', controller.user.login); // 用户登录
  router.get('/user', auth, controller.user.getCurrentUser); // 获取当前登录用户
  router.patch('/user', auth, controller.user.update); // 更新当前登录用户
  router.get('/users/:userId', app.middleware.auth({ required: false }), controller.user.getUser); // 获取用户资料

  // 用户订阅
  router.post('/users/:userId/subscribe', auth, controller.user.subscribe); // 添加用户订阅
  router.delete('/users/:userId/subscribe', auth, controller.user.unSubscribe); // 取消用户订阅
  router.get('/users/:userId/subscriptions', controller.user.getSubscriptions); // 获取用户订阅列表

  // 阿里云 VOD
  router.get('/vod/CreateUploadVideo', auth, controller.vod.createUploadVideo); // 获取视频上传地址和凭证
  router.get('/vod/RefreshUploadVideo', auth, controller.vod.refreshUploadVideo); // 刷新视频上传凭证
  router.get('/vod/GetVideoPlayAuth', controller.vod.getVideoPlayAuth); // 获取视频播放凭证

  // 视频
  router.post('/videos', auth, controller.video.createVideo); // 创建视频
  router.get('/videos', controller.video.getVideos); // 获取视频列表
  router.get('/videos/:videoId', app.middleware.auth({ required: false }), controller.video.getVideo); // 获取视频详情
  router.get('/users/:userId/videos', controller.video.getUserVideos); // 获取用户发布的视频列表
  router.get('/users/videos/feed', auth, controller.video.getUserFeedVideos); // 获取用户关注的频道视频列表
  router.patch('/videos/:videoId', auth, controller.video.updateVideo); // 更新视频
  router.delete('/videos/:videoId', auth, controller.video.deleteVideo); // 删除视频
  router.post('/videos/:videoId/comments', auth, controller.video.createComment); // 添加视频评论
  router.get('/videos/:videoId/comments', controller.video.getVideoComments); // 获取视频评论列表
  router.delete('/videos/:videoId/comments/:commentId', auth, controller.video.deleteVideoComment); // 删除视频评论
  router.post('/videos/:videoId/like', auth, controller.video.likeVideo); // 喜欢视频
  router.post('/videos/:videoId/dislike', auth, controller.video.dislikeVideo); // 不喜欢视频
  router.get('/user/videos/liked', auth, controller.video.getUserLikedVideos); // 获取用户喜欢的视频列表
};
