/**
 * 基础webpack构建配置生成函数
 * @UPDATE 升级webpack4
 * @TODO 优化_config.js配置
 */

const path = require('path');
const webpack = require('webpack');
// html插件
const HtmlWebpackPlugin = require('html-webpack-plugin');
// @DEPRECATED extract-text-plugin不再适用于抽取css文件
// @UPDATED css抽取插件更换成mini-css
// 升级到https://github.com/webpack-contrib/mini-css-extract-plugin
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// @UPDATED 自定义插件需要更新到webpack4支持的写法 hooks
const InterpolateHtmlPlugin = require('./InterpolateHtmlPlugin');

// @UPDATED vue-loader更新至v15+版本后的 BREAKING CHANGE
// 需要引入插件 注意require括号内写法
const VueLoaderPlugin = require('vue-loader/lib/plugin');

// 工具函数
const util = require('./util');
const getClientEnvironment = require('./_env');
const argv = require('yargs')
    .alias('p', 'project')
    .describe('p', '需要启动的模块')
    .help('h')
    .alias('h', 'help')
    .example('yarn dev2 -p demo', '只启动demo模块').argv;

// 返回根据配置生成webpack.config的function
module.exports = function({ mode, tplPath }) {
    // 获取当前构建环境 以及.env配置合并
    const env = getClientEnvironment(mode),
        isDev = mode === 'development',
        isProd = mode === 'production',
        // 获取需要构建的项目
        getTargetProject = () => {
            let { project } = argv;
            let envProject = process.env.project; // undefined或者'idc',or ''
            let finalProject = project ? project : envProject;
            if (finalProject === true || finalProject === undefined) {
                return undefined;
            } else {
                return finalProject.trim() === ''
                    ? undefined
                    : finalProject.split(',');
            }
        };
    targetProjects = getTargetProject();

    // 获取页面入口  指定为src/module目录下所有.html
    // 忽略config目录下通用模板和_开头的目录
    const entryFiles = util.getEntry(
            path.resolve(__dirname, '../src/module/**/*.html')
        ),
        tpldir = isProd ? tplPath : '',
        cssFilename = isProd
            ? 'css/[name].[contenthash:8].css'
            : 'css/[name].css';

    // 插件数组
    const plugins = [new VueLoaderPlugin()];

    plugins.push(
        // @UPDATED
        new MiniCssExtractPlugin({
            filename: cssFilename
        })
    );

    const entry = {};

    // 多html入口项目，需要自动生成多个html-web-plugin插件对象
    // @NOTE 约定每个html对应entry为同名.js文件，根据html生成entry
    for (chunk in entryFiles) {
        let tplFile = entryFiles[chunk][0], // 入口文件路径
            fileObj = path.parse(tplFile),
            name = fileObj.name, // 文件名
            suffix = fileObj.ext, // 模板文件后缀
            jsFile = tplFile.split(suffix)[0]; // 约定的JS文件路径
        // 是否在构建目标中
        if (targetProjects !== undefined && !targetProjects.includes(name)) {
            continue;
        }
        // 加入到entry
        entry[chunk] = [jsFile];

        // htmlwebpackplugin中引用的chunck
        // 即script标签
        // 加载顺序从右到左
        let chunksConf = [chunk, 'vendor'];
        // 发布模式需要manifest
        if (isProd) {
            chunksConf.push(`manifest~${chunk}`);
        }
        // 每个html入口一个插件
        plugins.push(
            new HtmlWebpackPlugin({
                alwaysWriteToDisk: true,
                filename: tpldir + chunk + '.html',
                template: tplFile, //模板文件
                chunks: chunksConf // 依赖顺序从右到左
            })
        );
    }
    if (targetProjects !== undefined) {
        let mode = isDev ? '启动' : '打包';
        console.log(`指定${mode}的模块：${targetProjects}`);
    }
    plugins.push(
        // 注入环境变量 可在js代码中如下使用：if (process.env.NODE_ENV === 'development') { ... }. 查阅 `./_env.js`.
        new webpack.DefinePlugin(env.stringified)
    );
    plugins.push(
        // 注入环境变量到html中
        // @UPDATED
        // 更换hook方式注册event后
        // InterpolateHtmlPlugin插件使用位置必须在HTML-WEBPACK-PLUGIN之后
        new InterpolateHtmlPlugin(env.raw)
    );
    // @NOTE 抽取公共vendor代码
    // @DEPERECATED CommonsChunkPlugin已经不适用

    return {
        // 入口
        entry: entry,
        resolveLoader: {
            modules: ['node_modules', path.resolve(__dirname)]
        },
        //插件项
        plugins: plugins,
        // @UPDATED 替换commonchunckpulgin
        optimization: {
            // https://webpack.js.org/plugins/split-chunks-plugin/#optimization-splitchunks
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        name: 'vendor',
                        // @NOTE 配置成all 会把async的也打进来
                        // echarts相关是异步加载
                        chunks: 'initial',
                        priority: -10,
                        test: /[\\/]node_modules[\\/]/
                    }
                }
            }
        },
        resolve: {
            // 指定几种默认后缀，即import引入时不需要写后缀
            extensions: ['.js', '.vue', '.json'],
            alias: {
                // https://stackoverflow.com/questions/41431167/webpack-compiling-vue-with-node-env-production-still-results-in-dev-warning?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
                vue$: 'vue/dist/vue.runtime.esm.js',
                '@': path.resolve(__dirname, '../src')
            }
        },

        // 使用loader模块
        module: {
            rules: [
                // @UPDATED
                // vue-loader v15+版本 .vue文件中的样式将被抽取出来并认为和独立引入的css文件相同
                // 故需要配置单独loader处理
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        isProd ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        {
                            loader: 'sass-loader',
                            options: {
                                includePaths: ['src']
                            }
                        }
                    ]
                },
                // 静态html模板
                {
                    test: /\.html$/,
                    loader: 'html-withimg-loader'
                },
                // .vue文件
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    options: {}
                },
                // .js文件
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: file =>
                        // @UPDATED
                        // vue-loader v15+版本
                        // /node_modules/中的.vue文件需要经过babel-loader转译
                        /node_modules/.test(file) && !/\.vue\.js/.test(file)
                },
                // 图片资源
                {
                    test: /\.(jpeg|jpg|png|gif)$/,
                    use: {
                        loader: 'url-loader',
                        options: {
                            limit: 10240,
                            name: 'images/[name]-[hash:8].[ext]'
                        }
                    }
                },
                // 字体资源等
                {
                    test: /\.(ttf|woff|woff|eot|svg)$/,
                    use: {
                        loader: 'url-loader',
                        options: {
                            limit: 10240,
                            name: 'font/[name]-[hash:8].[ext]'
                        }
                    }
                }
            ]
        }
    };
};
