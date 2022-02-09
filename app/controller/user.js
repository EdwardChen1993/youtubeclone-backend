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
        username: user.usernamem,
        channelDescription: user.channelDescription,
        avatar: user.avatar,
      },
    };
  }
}

module.exports = UserController;
