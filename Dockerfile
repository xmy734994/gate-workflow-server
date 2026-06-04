# Node.js 基础镜像（使用 Debian 稳定版，兼容 crypto 模块）
FROM node:18-bullseye

# 设置环境变量，确保 crypto 模块正常工作
ENV NODE_OPTIONS="--openssl-legacy-provider"

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --registry=https://registry.npmmirror.com

# 复制配置文件
COPY tsconfig.json nest-cli.json ./

# 复制源代码到 server-src（与 nest-cli.json 的 sourceRoot 匹配）
COPY server-src ./server-src

# 构建 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/main"]
