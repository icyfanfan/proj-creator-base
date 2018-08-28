# 通用项目结构

### 环境准备

-   [Node.js](https://nodejs.org/en/) ，推荐`v8.9.4`
-   [Yarn](https://yarnpkg.com/zh-Hans/docs/install)，安装最新版即可

进入项目，安装依赖，执行：

```shell
➜  nop-fe git:(dev) yarn
```

执行完毕，通过命令，启动项目：

```shell
➜  nop-fe git:(dev) yarn dev
```

### 可在应用根目录下新建配置文件.env.development.local

```
# 启动的模块
project=idc,demo
# 启动的端口
PORT=8080
# 接口代理地址
proxy=http://localhost:8080
# 代理cookie，将附带在每个请求上
proxyCookie = demo=1
# 自定义环境变量,APP_*，可以在js文件中通过process.env.APP_*访问
# example
APP_NAME=nopApp
```

执行`yarn dev`

默认会读取配置文件`.env.development.local`配置的 project 条目，如果被设置了，则启动对应的项目模块；亦可在配置文件中设置端口号和接口代理地址

-   若执行`yarn dev -p idc`，则 cli 的参数会覆盖配置文件的设置。
-   自定义环境变量，必须以`APP_`开头

.env 环境变量设置，比如`.env`,`.env.local`优先级等，具体功能可参考：[dotenv](https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use)
