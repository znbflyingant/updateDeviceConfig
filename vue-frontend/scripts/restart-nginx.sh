#!/usr/bin/env bash
set -euo pipefail

# 用法：
#   bash ./scripts/restart-nginx.sh reload   # 优先 reload（macOS 用 restart）
#   bash ./scripts/restart-nginx.sh restart  # 强制 restart

ACTION="${1:-reload}"

if command -v systemctl >/dev/null 2>&1; then
  # Linux（Debian/Ubuntu/CentOS）
  sudo nginx -t
  if [ "$ACTION" = "reload" ]; then
    sudo systemctl reload nginx
  else
    sudo systemctl restart nginx
  fi
elif command -v brew >/dev/null 2>&1; then
  # macOS（Homebrew）
  nginx -t
  # Homebrew 无 reload，统一使用 restart
  brew services restart nginx
else
  # 其他环境（尽力而为）
  sudo nginx -t
  if [ "$ACTION" = "reload" ]; then
    sudo nginx -s reload
  else
    sudo nginx -s stop || true
    sudo nginx
  fi
fi

echo "Nginx ${ACTION} done"


