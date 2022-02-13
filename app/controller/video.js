'use strict';

const Controller = require('egg').Controller;

class VideoController extends Controller {
  async createVideo() {
    const { ctx } = this;
    const body = ctx.request.body;
    const { Video } = this.app.model;

    ctx.validate({
      title: { type: 'string' },
      description: { type: 'string' },
      vodVideoId: { type: 'string' },
      cover: { type: 'string' },
    });

    body.user = ctx.user._id;
    const video = await new Video(body).save();
    ctx.status = 201;

    ctx.body = {
      video,
    };
  }

  async getVideo() {
    const { ctx } = this;
    const { Video, VideoLike, Subscription } = this.app.model;
    const { videoId } = ctx.params;
    let video = await Video.findById(videoId).populate('user', '_id username avatar subscribersCount');

    if (!video) {
      ctx.throw(404, 'Video Not Found');
    }

    video = video.toJSON();

    video.isLiked = false; // 是否喜欢
    video.isDisliked = false; // 是否不喜欢
    video.user.isSubscribed = false; // 是否已订阅视频作者

    if (ctx.user) {
      const userId = ctx.user._id;
      if (await VideoLike.findOne({ user: userId, video: videoId, like: 1 })) {
        video.isLiked = true;
      }
      if (await VideoLike.findOne({ user: userId, video: videoId, like: -1 })) {
        video.isDisliked = true;
      }
      if (await Subscription.findOne({ user: userId, channel: video.user._id })) {
        video.user.isSubscribed = true;
      }
    }

    ctx.body = { video };
  }

  async getVideos() {
    const { ctx } = this;
    const { Video } = this.app.model;
    let { pageNum = 1, pageSize = 10 } = ctx.query;
    pageNum = +pageNum;
    pageSize = +pageSize;
    const getVideos = Video.find().populate('user').sort({
      createdAt: -1, // 倒序
    })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);

    const getVideosCount = Video.countDocuments();

    const [ videos, videosCount ] = await Promise.all([ getVideos, getVideosCount ]);

    ctx.body = {
      videos,
      videosCount,
    };
  }

  async getUserVideos() {
    const { ctx } = this;
    const { Video } = this.app.model;
    let { pageNum = 1, pageSize = 10 } = ctx.query;
    const userId = ctx.params.userId;
    pageNum = +pageNum;
    pageSize = +pageSize;
    const getVideos = Video
      .find({
        user: userId,
      })
      .populate('user')
      .sort({
        createdAt: -1,
      })
      .skip((+pageNum - 1) * pageSize)
      .limit(pageSize);
    const getVideosCount = Video.countDocuments({
      user: userId,
    });
    const [ videos, videosCount ] = await Promise.all([
      getVideos,
      getVideosCount,
    ]);
    ctx.body = {
      videos,
      videosCount,
    };
  }

  async getUserFeedVideos() {
    const { ctx } = this;
    const { Video, Subscription } = this.app.model;
    let { pageNum = 1, pageSize = 10 } = ctx.query;
    const userId = ctx.user._id;
    pageNum = +pageNum;
    pageSize = +pageSize;

    const channels = await Subscription.find({ user: userId }).populate('channel');
    const getVideos = Video
      .find({
        user: {
          $in: channels.map(item => item.channel._id), // 关注用户的 id 用户列表
        },
      })
      .populate('user')
      .sort({
        createdAt: -1,
      })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);
    const getVideosCount = Video.countDocuments({
      user: {
        $in: channels.map(item => item.channel._id),
      },
    });
    const [ videos, videosCount ] = await Promise.all([
      getVideos,
      getVideosCount,
    ]);
    ctx.body = {
      videos,
      videosCount,
    };
  }

  async updateVideo() {
    const { ctx } = this;
    const { body } = ctx.request;
    const { Video } = this.app.model;
    const { videoId } = ctx.params;
    const userId = ctx.user._id;

    // 数据验证
    ctx.validate({
      title: { type: 'string', required: false },
      description: { type: 'string', required: false },
      vodVideoId: { type: 'string', required: false },
      cover: { type: 'string', required: false },
    });

    // 查询视频
    const video = await Video.findById(videoId);

    if (!video) {
      ctx.throw(404, 'Video Not Found');
    }

    // 视频作者必须是当前登录用户
    if (!video.user.equals(userId)) {
      ctx.throw(403);
    }

    Object.assign(video, ctx.helper._.pick(body, [ 'title', 'description', 'vodVideoId', 'cover' ]));

    // 把修改保存到数据库中
    await video.save();

    // 发送响应
    ctx.body = {
      video,
    };
  }

  async deleteVideo() {
    const { ctx } = this;
    const { Video } = this.app.model;
    const { videoId } = ctx.params;
    const video = await Video.findById(videoId);

    // 视频不存在
    if (!video) {
      ctx.throw(404);
    }

    // 视频作者不是当前登录用户
    if (!video.user.equals(ctx.user._id)) {
      ctx.throw(403);
    }

    await video.remove();

    ctx.status = 204;
  }


  async createComment() {
    const { ctx } = this;
    const body = ctx.request.body;
    const { Video, VideoComment } = this.app.model;
    const { videoId } = ctx.params;
    // 数据验证
    ctx.validate({
      content: 'string',
    }, body);

    // 获取评论所属的视频
    const video = await Video.findById(videoId);

    if (!video) {
      ctx.throw(404);
    }

    // 创建评论
    const comment = await new VideoComment({
      content: body.content,
      user: ctx.user._id,
      video: videoId,
    }).save();

    // 更新视频的评论数量
    video.commentsCount = await VideoComment.countDocuments({
      video: videoId,
    });
    await video.save();

    // 映射评论所属用户和视频字段数据
    await VideoComment.populate('user').populate('video').execPopulate();

    ctx.body = {
      comment,
    };
  }

  async getVideoComments() {
    const { ctx } = this;
    const { videoId } = ctx.params;
    const { VideoComment } = this.app.model;
    let { pageNum = 1, pageSize = 10 } = ctx.query;
    pageNum = +pageNum;
    pageSize = +pageSize;

    const getComments = VideoComment
      .find({
        video: videoId,
      })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .populate('user')
      .populate('video');

    const getCommentsCount = VideoComment.countDocuments({
      video: videoId,
    });

    const [ comments, commentsCount ] = await Promise.all([
      getComments,
      getCommentsCount,
    ]);

    ctx.body = {
      comments,
      commentsCount,
    };
  }

  async deleteVideoComment() {
    const { ctx } = this;
    const { Video, VideoComment } = this.app.model;
    const { videoId, commentId } = ctx.params;

    // 校验视频是否存在
    const video = await Video.findById(videoId);
    if (!video) {
      ctx.throw(404, 'Video Not Found');
    }

    const comment = await VideoComment.findById(commentId);

    // 校验评论是否存在
    if (!comment) {
      ctx.throw(404, 'Comment Not Found');
    }

    // 校验评论作者是否是当前登录用户
    if (!comment.user.equals(ctx.user._id)) {
      ctx.throw(403);
    }

    // 删除视频评论
    await comment.remove();

    // 更新视频评论数量
    video.commentsCount = await VideoComment.countDocuments({
      video: videoId,
    });
    await video.save();

    ctx.status = 204;
  }

  async likeVideo() {
    const { ctx } = this;
    const { Video, VideoLike } = this.app.model;
    const { videoId } = ctx.params;
    const userId = ctx.user._id;
    const video = await Video.findById(videoId);

    if (!video) {
      ctx.throw(404, 'Video Not Found');
    }

    const doc = await VideoLike.findOne({
      user: userId,
      video: videoId,
    });

    let isLiked = true;

    if (doc && doc.like === 1) {
      await doc.remove(); // 取消点赞
      isLiked = false;
    } else if (doc && doc.like === -1) {
      doc.like = 1;
      await doc.save();
    } else {
      await new VideoLike({
        user: userId,
        video: videoId,
        like: 1,
      }).save();
    }

    // 更新喜欢视频的数量
    video.likesCount = await VideoLike.countDocuments({
      video: videoId,
      like: 1,
    });

    // 更新不喜欢视频的数量
    video.dislikesCount = await VideoLike.countDocuments({
      video: videoId,
      like: -1,
    });

    // 将修改保存到数据库中
    await video.save();

    ctx.body = {
      video: {
        ...video.toJSON(),
        isLiked,
      },
    };
  }

  async dislikeVideo() {
    const { ctx } = this;
    const { Video, VideoLike } = this.app.model;
    const { videoId } = ctx.params;
    const userId = ctx.user._id;
    const video = await Video.findById(videoId);

    if (!video) {
      ctx.throw(404, `No video found for ID - ${videoId}`);
    }

    const doc = await VideoLike.findOne({
      user: userId,
      video: videoId,
    });

    let isDisliked = true;

    if (doc && doc.like === -1) {
      await doc.remove();
      isDisliked = false;
    } else if (doc && doc.like === 1) {
      doc.like = -1;
      await doc.save();
    } else {
      await new VideoLike({
        user: userId,
        video: videoId,
        like: -1,
      }).save();
    }

    // 更新视频喜欢和不喜欢的数量
    video.likesCount = await VideoLike.countDocuments({
      video: videoId,
      like: 1,
    });
    video.dislikesCount = await VideoLike.countDocuments({
      video: videoId,
      like: -1,
    });

    ctx.body = {
      video: {
        ...video.toJSON(),
        isDisliked,
      },
    };
  }

  async getUserLikedVideos() {
    const { ctx } = this;
    const { VideoLike, Video } = this.app.model;
    let { pageNum = 1, pageSize = 10 } = ctx.query;
    pageNum = +pageNum;
    pageSize = +pageSize;
    const filterDoc = {
      user: ctx.user._id,
      like: 1,
    };
    const likes = await VideoLike
      .find(filterDoc)
      .sort({
        createdAt: -1,
      })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);

    const getVideos = Video.find({
      _id: {
        $in: likes.map(item => item.video),
      },
    }).populate('user');

    const getVideosCount = VideoLike.countDocuments(filterDoc);
    const [ videos, videosCount ] = await Promise.all([
      getVideos,
      getVideosCount,
    ]);
    ctx.body = {
      videos,
      videosCount,
    };
  }
}

module.exports = VideoController;
