/**
 * 开发环境构建配置：
 * 使用webpack-dev-server
 */
// 重要
// @DEPRECATED
// process.env.NODE_ENV = 'development' ;
// @NOTE
const mode = 'development';

const webpack = require('webpack');
const webpackDevServer = require('webpack-dev-server/lib/Server');
const merge = require('webpack-merge');
const generateBase = require('./_base.js');
const path = require('path');
const rm = require('rimraf');

const util = require('./util');

// 获取基础配置
const config = require('./_config.js');

// webpack配置
let webpackConfig = {
    output: {
        filename: 'js/[name].js',
        chunkFilename: 'js/[name].[chunkhash:8].js',
        publicPath: '/'
    },
    // @NEW
    // 指定webpack构建环境，使用对应的内建优化策略
    // Provides process.env.NODE_ENV with value development. Enables NamedChunksPlugin and NamedModulesPlugin.
    // https://webpack.js.org/concepts/mode/
    mode,
    watch: true,
    plugins: [new webpack.HotModuleReplacementPlugin()]
};

let baseConfig = generateBase({ mode });

// @UPDATE调整位置
// 调用generaeBase后才会在process.env上挂参数
const port = parseInt(process.env.PORT, 10) || 8092,
    host = process.env.HOST || '0.0.0.0',
    app_homepage = process.env.APP_HOMEPAGE,
    homepage =
        app_homepage && app_homepage !== ''
            ? `/${app_homepage}.html`
            : '/index.html';

const mergedConfig = merge(baseConfig, webpackConfig);

// 请求代理地址
// @NOTE 需要时可以打开配置
const proxy = {
    // "/api/*":{
    //     target: process.env.proxy ? process.env.proxy : "http://127.0.0.1:8002" ,
    //     changeOrigin: true,
    //     secure: false ,
    //     onProxyReq: function( proxyReq , req , res ) {
    //         let { proxyCookie } = process.env ;
    //         if ( proxyCookie ) {
    //             proxyReq.setHeader( 'Cookie' , proxyCookie ) ;
    //         }
    //     } ,
    // }
};
// dev-server配置
// If you're having trouble, navigating to the /webpack-dev-server route will show where files are served
const devServerOptions = {
    inline: true,
    disableHostCheck: true,
    hot: true,
    // open: true ,
    // @NOTE 开启HMR 必须在配置中指定host
    // 否则会报错
    host,
    disableHostCheck: true,
    proxy,
    stats: {
        colors: true
    },
    historyApiFallback: {
        rewrites: [
            {
                from: /^\/$/,
                to: homepage
            }
        ]
    }
};

// @NOTE 使用node api启动 webpack-dev-server
// 需要支持HMR 必须手动加这句addDevServerEntrypoints
// 参考https://blog.csdn.net/liangklfang/article/details/56848925
webpackDevServer.addDevServerEntrypoints(mergedConfig, devServerOptions);
const compiler = webpack(mergedConfig);
const server = new webpackDevServer(compiler, devServerOptions);
// @UPDATED listen前两个参数 port host必须传
server.listen(port, host, () => {
    console.log(`Project is running at http://${host}:${port}/`);
});
