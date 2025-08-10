#!/bin/bash

# Vercel 部署脚本
echo "🚀 开始部署到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm install -g vercel
fi

# 检查是否已登录 Vercel
echo "🔐 检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "📝 请登录 Vercel..."
    vercel login
fi

# 部署到生产环境
echo "🌐 部署到生产环境..."
vercel --prod

echo "✅ 部署完成！"
echo "📋 下一步："
echo "   1. 在 Vercel Dashboard 配置环境变量"
echo "   2. 更新 FRONTEND_URL 环境变量为实际域名"
echo "   3. 测试所有 API 端点"
