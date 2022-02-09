'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const User = this.app.model.User;
    await new User({
      userName: 'edwardchen',
      password: '123',
    }).save();
    ctx.body = {
      userName: 'edwardchen',
      password: '123',
    };
  }
}

module.exports = HomeController;
