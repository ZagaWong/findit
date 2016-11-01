'use strict';

const path = require('path');
const koa = require('koa');
const router = require('koa-router')();
const Pug = require('koa-pug');
const fetch = require('node-fetch');
const config = require('../../config');
const error = require('../../lib/error');
const logger = require('../../lib/logger');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

describe('error测试', function () {

  before(function () {
    const app = koa();

    logger.register(app);
    app.use(logger.useGlobalLogger());

    app.on('error', function () {
      // 测试过程中, 不向控制台输入预期的错误信息
    });
    app.use(error);

    new Pug({
      viewPath: path.join(__dirname, '../../sites'),
      basedir: path.join(__dirname, '../../sites'),
      app: app,
      locals: {
        production: app.env === 'production',
        testing: app.env === 'testing',
        toaweb: app.env === 'toaweb',
        timestamp: config.timestamp,
        cdn: config.cdn
      }
    });

    router.get('/success', function *() {
      this.body = 'success';
    });
    router.get('/error', function *() {
      throw new Error('error');
    });

    app.use(router.routes());

    this.server = app.listen(8888);
  });

  after(function () {
    this.server.close();
  });

  it('200', function () {
    return fetch('http://localhost:8888/success')
      .then(response => response.text())
      .should
      .eventually
      .equal('success');
  });

  it('500', function () {
    return fetch('http://localhost:8888/error')
      .then(response => response.text())
      .should
      .eventually
      .include('请稍后再试');
  });

  it('404', function () {
    return fetch('http://localhost:8888/404')
      .then(response => response.text())
      .should
      .eventually
      .include('页面不存在');
  });

});