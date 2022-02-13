'use strict';

module.exports = (options = { required: true }) => {
  return async (ctx, next) => {
    // 获取请求头中的 token 数据
    let token = ctx.headers.authorization; // Bearer TOKEN
    token = token ? token.split('Bearer ')[1] : null;

    if (token) {
      try {
        // token 有效，根据 userId 获取用户数据挂载到 ctx 对象中给后续中间件使用
        const data = ctx.service.user.verifyToken(token);

        ctx.user = await ctx.model.User.findById(data.userId);
      } catch (error) {
        ctx.throw(401);
      }
    } else if (options.required) {
    // 验证 token，无效则返回 401
      ctx.throw(401);
    }

    // next 执行后续中间件
    await next();
  };
};
