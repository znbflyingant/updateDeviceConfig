# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY server/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制服务器代码
COPY server/ .

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["npm", "start"]
