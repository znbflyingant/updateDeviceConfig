#!/bin/bash

echo "🚂 Railway部署状态检查"
echo "=================================="

# 检查Railway CLI是否安装
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI未安装"
    echo "💡 安装命令: npm install -g @railway/cli"
    echo "📖 或访问: https://docs.railway.app/develop/cli"
    exit 1
fi

echo "✅ Railway CLI已安装"

# 检查是否已登录
if ! railway whoami &> /dev/null; then
    echo "🔐 请先登录Railway:"
    echo "railway login"
    exit 1
fi

echo "✅ 已登录Railway"

# 显示项目状态
echo ""
echo "📊 项目状态:"
railway status

echo ""
echo "🌐 获取部署URL:"
railway domain

echo ""
echo "📋 环境变量:"
railway variables

echo ""
echo "📝 部署日志:"
railway logs --tail
