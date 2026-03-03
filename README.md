# Smash Kingdom: Action Defense

基于 Phaser 3 的弹珠策略防御游戏复现版本。

## 游戏特色

- 🎯 **物理弹珠机制**: 拖动弹弓发射弹珠，利用物理碰撞消灭敌人
- 🏰 **城堡防御**: 保护城墙免受敌人攻击
- 🎴 **卡牌系统**: 不同的佣兵卡具有独特技能和效果
- ⭐ **星级评分**: 根据城墙剩余血量获得星级评价
- 🎮 **渐进难度**: 随着等级提升，游戏难度逐渐增加

## 技术栈

- **前端框架**: Phaser 3.70.0
- **构建工具**: 无需构建，直接运行
- **部署平台**: GitHub Pages

## 项目结构

```
smash_kingdom_defense/
├── index.html          # 主页面
├── js/
│   └── game.js         # 游戏主逻辑
├── assets/             # 游戏资源（后续添加）
│   ├── images/         # 图片资源
│   ├── sounds/         # 音效资源
│   └── fonts/          # 字体资源
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions 部署配置
└── README.md           # 项目说明
```

## 本地开发

1. 克隆仓库到本地
2. 使用任何本地服务器运行项目（推荐 Live Server 扩展）
3. 在浏览器中打开 `index.html`

## 游戏操作

- **拖动弹弓**: 点击并拖动弹弓来瞄准
- **发射弹珠**: 松开鼠标发射弹珠
- **消灭敌人**: 弹珠碰撞敌人造成伤害
- **保护城墙**: 防止敌人到达城墙

## 开发计划

- [ ] 完善卡牌系统
- [ ] 添加音效和背景音乐
- [ ] 实现更多的佣兵类型
- [ ] 添加技能系统
- [ ] 实现关卡系统
- [ ] 添加PvP模式
- [ ] 优化移动端适配

## 部署

项目已配置 GitHub Actions，推送到 `main` 分支后会自动部署到 GitHub Pages。

部署地址: `https://sunsetzf2023.github.io/smash_kingdom_defense/`

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
