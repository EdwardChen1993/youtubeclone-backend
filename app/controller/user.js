'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  async create() {
    const { ctx } = this;
    const body = ctx.request.body;
    // 数据校验
    ctx.validate({
      username: { type: 'string' },
      email: { type: 'email' },
      password: { type: 'string' },
    });

    const userService = ctx.service.user;

    if (await userService.findByUsername(body.username)) {
      ctx.throw(422, '用户已存在');
    }

    if (await userService.findByEmail(body.email)) {
      ctx.throw(422, '邮箱已存在');
    }

    // 保存用户
    const user = await userService.createUser(body);

    // 生成 token
    const token = userService.createToken({
      userId: user._id,
    });

    // 发送响应
    ctx.body = {
      user: {
        email: user.email,
        token,
        username: user.username,
        channelDescription: user.channelDescription,
        avatar: user.avatar,
      },
    };
  }

  async login() {
    const { ctx } = this;
    const body = ctx.request.body;
    ctx.validate({
      email: { type: 'email' },
      password: { type: 'string' },
    });

    const userService = ctx.service.user;
    const user = await userService.findByEmail(body.email);
    if (!user) {
      ctx.throw(422, '用户不存在');
    }

    if (ctx.helper.md5(body.password) !== user.password) {
      ctx.throw(422, '密码不正确');
    }

    const token = userService.createToken({
      userId: user._id,
    });

    ctx.body = {
      email: user.email,
      token,
      username: user.username,
      channelDescription: user.channelDescription,
      avatar: user.avatar,
    };
  }

  async getCurrentUser() {
    const { ctx } = this;
    const user = ctx.user;
    ctx.body = {
      email: user.email,
      token: ctx.headers.authorization,
      username: user.username,
      channelDescription: user.channelDescription,
      avatar: user.avatar,
    };
  }

  async update() {
    const { ctx } = this;
    const body = ctx.request.body;
    ctx.validate({
      email: { type: 'email', required: false }, // 可选的参数
      password: { type: 'string', required: false },
      username: { type: 'string', required: false },
      channelDescription: { type: 'string', required: false },
      avatar: { type: 'string', required: false },
    });

    const userService = ctx.service.user;
    if (body.username) {
      if (body.username !== ctx.user.username && await userService.findByUsername(body.username)) {
        ctx.throw(422, 'username 已存在');
      }
    }

    if (body.email) {
      if (body.email !== ctx.user.email && await userService.findByEmail(body.email)) {
        ctx.throw(422, 'email 已存在');
      }
    }

    if (body.password) {
      body.password = ctx.helper.md5(body.password);
    }

    // 更新用户信息
    const user = await userService.updateUser(body);

    // 返回更新之后的用户信息
    ctx.body = {
      email: user.email,
      password: user.password,
      username: user.username,
      channelDescription: user.channelDescription,
      avatar: user.avatar,
    };
  }

  async subscribe() {
    const { ctx } = this;
    const userId = ctx.user._id;
    const channelId = ctx.params.userId;
    // equals 内部将 ObjectId 转换成字符串
    if (userId.equals(channelId)) {
      ctx.throw(422, '用户不能订阅自己');
    }

    const user = await this.service.user.subscribe(userId, channelId);

    ctx.body = {
      user: {
        ...ctx.helper._.pick(user, [ 'username', 'email', 'avatar', 'cover', 'channelDescription', 'subscribersCount' ]),
        isSubscribed: true,
      },
    };
  }

  async unSubscribe() {
    const { ctx } = this;
    const userId = ctx.user._id;
    const channelId = ctx.params.userId;
    // equals 内部将 ObjectId 转换成字符串
    if (userId.equals(channelId)) {
      ctx.throw(422, '用户不能订阅自己');
    }

    // 取消订阅
    const user = await this.service.user.unSubscribe(userId, channelId);

    ctx.body = {
      user: {
        ...ctx.helper._.pick(user, [ 'username', 'email', 'avatar', 'cover', 'channelDescription', 'subscribersCount' ]),
        isSubscribed: false,
      },
    };
  }

  async getUser() {
    const { ctx } = this;
    // 获取订阅状态
    let isSubscribed = false;

    if (ctx.user) {
      const record = await this.app.model.Subscription.findOne({
        user: ctx.user._id,
        channel: ctx.params.userId,
      });

      if (record) {
        isSubscribed = true;
      }
    }

    // 获取用户信息
    const user = await this.app.model.User.findById(ctx.params.userId);

    ctx.body = {
      user: {
        ...ctx.helper._.pick(user, [ 'username', 'email', 'avatar', 'cover', 'channelDescription', 'subscribersCount' ]),
        isSubscribed,
      },
    };
  }

  async getSubscriptions() {
    const { ctx } = this;
    const Subscription = this.app.model.Subscription;
    let subscriptions = await Subscription.find({
      user: ctx.params.userId,
    }).populate('channel');

    subscriptions = subscriptions.map(item => {
      return ctx.helper._.pick(item.channel, [ '_id', 'username', 'avatar' ]);
    });

    ctx.body = {
      subscriptions,
    };
  }
}

module.exports = UserController;
