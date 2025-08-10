#!/bin/bash

echo "🔍 部署前检查清单"
echo "=================================="

# 检查Git状态
echo "📋 检查Git状态..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  有未提交的更改"
    git status --short
    echo ""
    read -p "是否继续？(y/N): " continue_deploy
    if [[ ! $continue_deploy =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
else
    echo "✅ Git工作区干净"
fi

# 检查环境变量配置文件
echo ""
echo "📋 检查环境变量配置..."

if [ -f "server/.env" ]; then
    echo "✅ 发现本地 .env 文件"
else
    echo "⚠️  未发现本地 .env 文件"
    echo "💡 建议：复制 server/env.example 为 server/.env 并配置"
fi

if [ -f "railway-env-vars.txt" ]; then
    echo "✅ Railway环境变量配置文件存在"
else
    echo "❌ 缺少Railway环境变量配置文件"
fi

# 检查后端依赖
echo ""
echo "📋 检查后端依赖..."
cd server
if [ -f "package.json" ]; then
    echo "✅ package.json 存在"
    if [ -d "node_modules" ]; then
        echo "✅ node_modules 存在"
    else
        echo "⚠️  node_modules 不存在，建议运行 npm install"
    fi
else
    echo "❌ package.json 不存在"
fi

# 运行环境变量验证（如果可能）
echo ""
echo "📋 验证环境变量..."
if command -v node &> /dev/null; then
    if node validate-env.js 2>/dev/null; then
        echo "✅ 环境变量验证通过"
    else
        echo "⚠️  环境变量验证失败（部署时需要配置）"
    fi
else
    echo "⚠️  Node.js 未安装，跳过环境变量验证"
fi

cd ..

# 检查前端构建
echo ""
echo "📋 检查前端配置..."
if [ -f "vue-frontend/package.json" ]; then
    echo "✅ 前端 package.json 存在"
    if [ -d "vue-frontend/dist" ]; then
        echo "✅ 前端构建文件存在"
    else
        echo "⚠️  前端构建文件不存在（Vercel会自动构建）"
    fi
else
    echo "❌ 前端 package.json 不存在"
fi

# 检查部署配置文件
echo ""
echo "📋 检查部署配置文件..."

configs=(
    "vercel.json:Vercel配置"
    "railway.json:Railway配置"
    "nixpacks.toml:Nixpacks配置"
    "Dockerfile:Docker配置"
    "docker-compose.yml:Docker Compose配置"
)

for config in "${configs[@]}"; do
    file=$(echo $config | cut -d: -f1)
    desc=$(echo $config | cut -d: -f2)
    
    if [ -f "$file" ]; then
        echo "✅ $desc ($file)"
    else
        echo "❌ $desc ($file) 不存在"
    fi
done

# 总结
echo ""
echo "🎯 部署建议："
echo "1. 确保所有代码已提交到Git"
echo "2. 在Railway中配置环境变量（参考 railway-env-vars.txt）"
echo "3. 确保OSS和华为云配置正确"
echo "4. 部署后测试 /api/health 端点"
echo ""
echo "🚀 准备好部署了！"
