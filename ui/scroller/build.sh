#!/bin/bash

# 构建 ui/scroller 项目
cd "$(dirname "$0")"
npx vite build --config vite.config.ts --outDir ../../dist/ui/scroller

echo "✅ ui/scroller 构建完成！"
echo "📁 输出目录: ../../dist/ui/scroller"
echo "📦 生成的文件:"
echo "   - react-native.esm.js (React Native 版本)"
echo "   - web.esm.js (Web 版本)"
echo "   - *.d.ts (类型定义文件)" 