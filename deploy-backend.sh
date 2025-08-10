#!/bin/bash

echo "🚀 后端部署脚本"
echo "请选择部署平台："
echo "1) Railway"
echo "2) Render"  
echo "3) Heroku"
echo "4) Docker (本地/云服务器)"

read -p "请输入选项 (1-4): " choice

case $choice in
  1)
    echo "📡 部署到Railway..."
    echo "1. 访问 https://railway.app/"
    echo "2. 连接GitHub仓库"
    echo "3. 选择 updatebin 项目"
    echo "4. Railway会自动检测并部署"
    echo "5. 配置环境变量"
    ;;
  2)
    echo "🎨 部署到Render..."
    echo "1. 访问 https://render.com/"
    echo "2. 创建新的Web Service"
    echo "3. 连接GitHub仓库"
    echo "4. 使用以下配置："
    echo "   - Build Command: cd server && npm install"
    echo "   - Start Command: cd server && npm start"
    echo "   - Environment: Node"
    echo "5. 配置环境变量"
    ;;
  3)
    echo "🟣 部署到Heroku..."
    if ! command -v heroku &> /dev/null; then
        echo "请先安装Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    echo "执行以下命令："
    echo "heroku create your-app-name"
    echo "heroku config:set NODE_ENV=production"
    echo "# 设置其他环境变量..."
    echo "git push heroku main"
    ;;
  4)
    echo "🐳 Docker部署..."
    echo "本地测试："
    echo "docker-compose up --build"
    echo ""
    echo "云服务器部署："
    echo "1. 将代码上传到服务器"
    echo "2. 安装Docker和Docker Compose"
    echo "3. 创建.env文件配置环境变量"
    echo "4. 运行: docker-compose up -d"
    ;;
  *)
    echo "❌ 无效选项"
    exit 1
    ;;
esac

echo ""
echo "📋 部署后需要配置的环境变量："
echo "OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET"
echo "OSS_BUCKET, OSS_UPLOAD_PATH, OSS_CDN_DOMAIN"
echo "STS_ROLE_ARN, STS_ROLE_SESSION_NAME"
echo "HUAWEI_APP_ID, HUAWEI_CLIENT_ID, HUAWEI_CLIENT_SECRET, HUAWEI_PROJECT_ID"
echo "FRONTEND_URL"
