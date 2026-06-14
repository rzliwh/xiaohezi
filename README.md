# 小盒子 · Xiaohezi

> 每天领一个盲袋，开出一只小东西，放在你的架子上，它会在你来看它的时候动一动。

## 快速开始

三个文件，零依赖，直接打开就能跑：

```
xiaohezi/
├── index.html    # 双击打开即可
├── style.css     # 所有样式和动画
├── script.js     # 游戏逻辑
└── README.md
```

## 部署到 GitHub Pages

```bash
# 1. 创建仓库
gh repo create xiaohezi --public

# 2. 推送代码
git init
git add .
git commit -m "🎁 小盒子 MVP"
git branch -M main
git remote add origin git@github.com:YOUR_USER/xiaohezi.git
git push -u origin main

# 3. 开启 GitHub Pages
# Settings → Pages → Source: Deploy from a branch → main → / (root) → Save
```

## 技术栈

- **Vanilla JS** — 零框架、零构建
- **localStorage** — 收集进度、每日状态、陪伴角色
- **CSS Animation + requestAnimationFrame** — 所有动画
- **Inline SVG** — 6+1 个角色全部内联绘制
- **Web Audio API** — oscillator 合成音效，无音频文件
- **Canvas** — 日签卡片生成与保存

## 角色

| # | 名字 | 类型 |
|---|------|------|
| 1 | 圆圆 | 基础 |
| 2 | 豆豆 | 基础 |
| 3 | 泡泡 | 基础 |
| 4 | 团团 | 基础 |
| 5 | 绵绵 | 基础 |
| 6 | 咕噜 | 基础 |
| ✦ | 星尘 | 隐藏 (5%) |

## 调试

在浏览器控制台可用：

```js
__xiaohezi.resetToday()  // 重置今日状态
__xiaohezi.resetAll()    // 清除全部数据
__xiaohezi.state         // 查看当前游戏状态
```

## 设计原则

- 每天30秒，不绑架时间
- 不来不损失，明天还有新的等你
- 没有惩罚性设计
- 隐藏款保底30天（不显示在UI上）
