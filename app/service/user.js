'use strict';

const Service = require('egg').Service;
const jwt = require('jsonwebtoken');

class UserService extends Service {
  get User() {
    return this.app.model.User;
  }

  findByUsername(userName) {
    return this.User.findOne({
      userName,
    });
  }

  findByEmail(email) {
    return this.User.findOne({
      email,
    }).select('+password');
  }

  async createUser(data) {
    data.password = this.ctx.helper.md5(data.password);
    const user = new this.User(data);
    await user.save(); // 保存到数据库中
    return user;
  }

  // 创建 token
  createToken(data) {
    return jwt.sign(data, this.app.config.jwt.secret, {
      expiresIn: this.app.config.jwt.expiresIn,
    });
  }

  // 验证 token
  verifyToken(token) {
    return jwt.verify(token, this.app.config.jwt.secret);
  }

  updateUser(data) {
    return this.User.findByIdAndUpdate(this.ctx.user._id, data, {
      new: true, // 返回更新之后的数据
    });
  }

  async subscribe(userId, channelId) {
    const { Subscription, User } = this.app.model;

    // 检查是否已经订阅
    const record = await Subscription.findOne({
      user: userId,
      channel: channelId,
    });

    const user = await User.findById(channelId);

    // 没有订阅，添加订阅
    if (!record) {
      await new Subscription({
        user: userId,
        channel: channelId,
      }).save();

      // 更新用户的订阅数量
      user.subscribersCount++;
      await user.save();
    }

    return user;
  }

  async unSubscribe(userId, channelId) {
    const { Subscription, User } = this.app.model;

    // 检查是否已经订阅
    const record = await Subscription.findOne({
      user: userId,
      channel: channelId,
    });

    const user = await User.findById(channelId);

    if (record) {
      await record.remove(); // 删除订阅记录
      // 更新用户的订阅数量
      user.subscribersCount--;
      await user.save();
    }

    return user;
  }
}

module.exports = UserService;
