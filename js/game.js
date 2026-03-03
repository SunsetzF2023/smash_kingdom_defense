// Smash Kingdom: Action Defense - 佣兵系统版本
// 手机竖屏弹珠策略防御游戏

// Matter.js 引擎模块
const Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Events = Matter.Events,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint;

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // 游戏状态
        this.gameState = {
            score: 0,
            castleHealth: 100,
            maxCastleHealth: 100,
            level: 1,
            isGameOver: false,
            selectedSoldierType: 'archer',
            soldierCosts: {
                archer: 10,
                tank: 20,
                assassin: 15,
                healer: 25,
                mage: 30
            }
        };
        
        // Matter.js 相关
        this.engine = null;
        this.world = null;
        
        // 游戏对象
        this.king = null;          // 国王（发射点）
        this.portal = null;        // 传送门
        this.castle = null;        // 城墙
        this.soldiers = [];        // 佣兵数组
        this.enemies = [];         // 敌人数组
        
        // 弹弓状态
        this.slingshotState = {
            isDragging: false,
            startPos: { x: 0, y: 0 },
            currentPos: { x: 0, y: 0 },
            maxDistance: 100
        };
        
        // UI 元素
        this.uiElements = {};
        
        // 游戏配置
        this.gameWidth = 0;
        this.gameHeight = 0;
    }

    preload() {
        console.log('Loading game assets...');
        this.createPlaceholderGraphics();
    }

    create() {
        // 隐藏加载提示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // 使用固定尺寸
        this.gameWidth = 500;
        this.gameHeight = 800;
        
        console.log(`Game dimensions: ${this.gameWidth}x${this.gameHeight}`);
        
        // 初始化 Matter.js
        this.initMatterJS();
        
        // 创建游戏场景
        this.createGameWorld();
        
        // 创建 UI
        this.createUI();
        
        // 设置事件监听
        this.setupEventListeners();
        
        // 开始游戏循环
        this.startGameLoops();
        
        console.log('Game initialized with soldier system!');
    }

    initMatterJS() {
        // 创建 Matter.js 引擎
        this.engine = Engine.create();
        this.world = this.engine.world;
        
        // 设置重力
        this.engine.world.gravity.y = 1;
    }

    createGameWorld() {
        console.log('Creating game world...');
        
        // 创建边界墙壁
        this.createWalls();
        console.log('Walls created');
        
        // 创建传送门（顶部）
        this.createPortal();
        console.log('Portal created');
        
        // 创建城墙（底部）
        this.createCastle();
        console.log('Castle created');
        
        // 创建国王（发射点）
        this.createKing();
        console.log('King created');
        
        // 创建瞄准线
        this.createAimLine();
        console.log('Aim line created');
        
        // 创建佣兵选择面板
        this.createSoldierPanel();
        console.log('Soldier panel created');
        
        console.log('Game world creation complete!');
    }

    createWalls() {
        const wallThickness = 10;
        const walls = [
            // 左墙
            Bodies.rectangle(wallThickness/2, this.gameHeight/2, wallThickness, this.gameHeight, { 
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            }),
            // 右墙
            Bodies.rectangle(this.gameWidth - wallThickness/2, this.gameHeight/2, wallThickness, this.gameHeight, { 
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            }),
            // 顶部墙（留出传送门位置）
            Bodies.rectangle(this.gameWidth/2, wallThickness/2, this.gameWidth, wallThickness, { 
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            })
        ];
        
        World.add(this.world, walls);
        
        // 在 Phaser 中创建墙壁视觉效果
        this.add.graphics()
            .fillStyle(0x2c3e50)
            .fillRect(0, 0, 10, this.gameHeight)                    // 左墙
            .fillRect(this.gameWidth - 10, 0, 10, this.gameHeight)  // 右墙
            .fillRect(0, 0, this.gameWidth, 10);                    // 顶部墙
    }

    createPortal() {
        // 传送门位置（顶部中央）
        const portalX = this.gameWidth / 2;
        const portalY = 80;
        
        // 创建传送门视觉效果
        const portalGraphics = this.add.graphics();
        
        // 外圈
        portalGraphics.fillStyle(0x9400D3, 0.8);
        portalGraphics.fillCircle(portalX, portalY, 35);
        
        // 内圈
        portalGraphics.fillStyle(0xFF00FF, 0.6);
        portalGraphics.fillCircle(portalX, portalY, 25);
        
        // 中心
        portalGraphics.fillStyle(0xFFFFFF, 0.8);
        portalGraphics.fillCircle(portalX, portalY, 15);
        
        // 添加旋转动画
        this.tweens.add({
            targets: portalGraphics,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
        
        this.portal = { x: portalX, y: portalY, graphics: portalGraphics };
    }

    createCastle() {
        // 城墙位置（底部）
        const castleY = this.gameHeight - 50;
        const castleWidth = this.gameWidth * 0.8;
        const castleX = (this.gameWidth - castleWidth) / 2;
        
        // 创建城墙视觉效果
        const castleGraphics = this.add.graphics();
        
        // 城墙主体
        castleGraphics.fillStyle(0x8B4513);
        castleGraphics.fillRect(castleX, castleY, castleWidth, 40);
        
        // 城墙装饰
        castleGraphics.fillStyle(0x654321);
        for (let i = 0; i < Math.floor(castleWidth / 50); i++) {
            castleGraphics.fillRect(castleX + 10 + i * 50, castleY - 10, 30, 10);
        }
        
        // 城墙血量条背景
        castleGraphics.fillStyle(0x333333);
        castleGraphics.fillRect(castleX + 50, castleY - 25, castleWidth - 100, 8);
        
        this.castle = { 
            x: this.gameWidth / 2, 
            y: castleY, 
            width: castleWidth, 
            height: 40,
            graphics: castleGraphics 
        };
    }

    createKing() {
        // 国王位置（底部中央）
        const kingX = this.gameWidth / 2;
        const kingY = this.gameHeight - 120;
        
        // 创建国王视觉效果（蓝色方块作为占位符）
        const kingGraphics = this.add.graphics();
        kingGraphics.fillStyle(0x0000FF);
        kingGraphics.fillRect(kingX - 20, kingY - 20, 40, 40);
        
        // 国王皇冠
        kingGraphics.fillStyle(0xFFD700);
        kingGraphics.fillTriangle(
            kingX - 15, kingY - 25,
            kingX, kingY - 40,
            kingX + 15, kingY - 25
        );
        
        this.king = { 
            x: kingX, 
            y: kingY, 
            radius: 20,
            graphics: kingGraphics 
        };
        
        this.slingshotState.startPos = { x: kingX, y: kingY };
    }

    createSoldierPanel() {
        const panelY = this.gameHeight - 180;
        const buttonWidth = 60;
        const buttonHeight = 60;
        const spacing = 10;
        const totalWidth = 5 * buttonWidth + 4 * spacing;
        const startX = (this.gameWidth - totalWidth) / 2;
        
        const soldierTypes = [
            { type: 'archer', color: 0x00FF00, name: '弓' },
            { type: 'tank', color: 0x0000FF, name: '重' },
            { type: 'assassin', color: 0xFF00FF, name: '刺' },
            { type: 'healer', color: 0xFFFFFF, name: '疗' },
            { type: 'mage', color: 0xFF4500, name: '法' }
        ];
        
        soldierTypes.forEach((soldier, index) => {
            const x = startX + index * (buttonWidth + spacing);
            
            // 按钮背景
            const button = this.add.graphics();
            button.fillStyle(soldier.color, 0.8);
            button.fillRoundedRect(x, panelY, buttonWidth, buttonHeight, 10);
            button.setInteractive(new Phaser.Geom.Rectangle(x, panelY, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
            
            // 按钮文字
            const text = this.add.text(x + buttonWidth/2, panelY + buttonHeight/2, soldier.name, {
                fontSize: '16px',
                fill: '#000000',
                stroke: '#FFFFFF',
                strokeThickness: 1
            }).setOrigin(0.5);
            
            // 成本文字
            const cost = this.gameState.soldierCosts[soldier.type];
            const costText = this.add.text(x + buttonWidth/2, panelY + buttonHeight - 8, `${cost}`, {
                fontSize: '10px',
                fill: '#FFFF00',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5);
            
            // 点击事件
            button.on('pointerdown', () => {
                this.selectSoldierType(soldier.type);
            });
            
            // 保存按钮引用
            if (!this.soldierButtons) this.soldierButtons = [];
            this.soldierButtons.push({
                type: soldier.type,
                button: button,
                text: text,
                costText: costText,
                graphics: button
            });
        });
        
        // 默认选中弓箭手
        this.selectSoldierType('archer');
    }

    selectSoldierType(type) {
        this.gameState.selectedSoldierType = type;
        
        // 更新按钮视觉效果
        this.soldierButtons.forEach(btn => {
            if (btn.type === type) {
                btn.graphics.setAlpha(1);
                btn.graphics.lineStyle(3, 0xFFFF00);
                btn.graphics.strokeRoundedRect(
                    btn.button.x, 
                    btn.button.y, 
                    60, 60, 10
                );
            } else {
                btn.graphics.setAlpha(0.8);
                btn.graphics.lineStyle(0);
            }
        });
    }

    createAimLine() {
        this.aimLine = this.add.graphics();
        this.aimLine.setDepth(100);
    }

    createPlaceholderGraphics() {
        // 弹珠图形（佣兵）
        this.add.graphics()
            .fillStyle(0x00FF00)
            .fillCircle(15, 15, 12)
            .generateTexture('soldier', 30, 30);
        
        // 敌人图形
        this.add.graphics()
            .fillStyle(0xFF0000)
            .fillRect(0, 0, 25, 25)
            .generateTexture('enemy', 25, 25);
    }

    createUI() {
        // 分数
        this.uiElements.scoreText = this.add.text(10, 20, `Score: ${this.gameState.score}`, {
            fontSize: '18px',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // 等级
        this.uiElements.levelText = this.add.text(10, 45, `Level: ${this.gameState.level}`, {
            fontSize: '18px',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // 城墙血量
        this.uiElements.healthText = this.add.text(this.gameWidth - 150, 20, `HP: ${this.gameState.castleHealth}/${this.gameState.maxCastleHealth}`, {
            fontSize: '18px',
            fill: '#00FF00',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // 当前选中的佣兵类型
        this.uiElements.selectedText = this.add.text(this.gameWidth/2, 20, `选中: 弓箭手`, {
            fontSize: '16px',
            fill: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.updateHealthBar();
    }

    setupEventListeners() {
        // 鼠标/触摸事件
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.on('pointerup', this.handlePointerUp, this);
        
        // Matter.js 碰撞事件
        Events.on(this.engine, 'collisionStart', this.handleCollision.bind(this));
    }

    handlePointerDown(pointer) {
        const distance = Phaser.Math.Distance.Between(
            pointer.x, pointer.y,
            this.king.x, this.king.y
        );
        
        if (distance < 50) {
            this.slingshotState.isDragging = true;
            this.slingshotState.currentPos = { x: pointer.x, y: pointer.y };
        }
    }

    handlePointerMove(pointer) {
        if (this.slingshotState.isDragging) {
            // 限制拖拽距离
            const distance = Phaser.Math.Distance.Between(
                this.king.x, this.king.y,
                pointer.x, pointer.y
            );
            
            if (distance <= this.slingshotState.maxDistance) {
                this.slingshotState.currentPos = { x: pointer.x, y: pointer.y };
            } else {
                const angle = Phaser.Math.Angle.Between(
                    this.king.x, this.king.y,
                    pointer.x, pointer.y
                );
                this.slingshotState.currentPos = {
                    x: this.king.x + Math.cos(angle) * this.slingshotState.maxDistance,
                    y: this.king.y + Math.sin(angle) * this.slingshotState.maxDistance
                };
            }
            
            this.updateAimLine();
        }
    }

    handlePointerUp(pointer) {
        if (this.slingshotState.isDragging) {
            this.fireSoldier();
        }
        
        this.slingshotState.isDragging = false;
        this.aimLine.clear();
    }

    updateAimLine() {
        this.aimLine.clear();
        
        // 绘制弹弓线
        this.aimLine.lineStyle(3, 0x8B4513);
        this.aimLine.beginPath();
        this.aimLine.moveTo(this.king.x - 10, this.king.y - 10);
        this.aimLine.lineTo(this.slingshotState.currentPos.x, this.slingshotState.currentPos.y);
        this.aimLine.moveTo(this.king.x + 10, this.king.y - 10);
        this.aimLine.lineTo(this.slingshotState.currentPos.x, this.slingshotState.currentPos.y);
        this.aimLine.strokePath();
        
        // 绘制瞄准线
        const dx = this.king.x - this.slingshotState.currentPos.x;
        const dy = this.king.y - this.slingshotState.currentPos.y;
        const power = Math.sqrt(dx * dx + dy * dy) / this.slingshotState.maxDistance;
        
        this.aimLine.lineStyle(2, 0xFFFFFF, 0.8);
        this.aimLine.setAlpha(0.6);
        this.aimLine.beginPath();
        this.aimLine.moveTo(this.slingshotState.currentPos.x, this.slingshotState.currentPos.y);
        
        // 预测轨迹
        const steps = 20;
        const velocityX = dx * 0.3;
        const velocityY = dy * 0.3;
        
        for (let i = 1; i <= steps; i++) {
            const t = i * 0.1;
            const x = this.slingshotState.currentPos.x + velocityX * t;
            const y = this.slingshotState.currentPos.y + velocityY * t + 0.5 * 9.8 * t * t;
            
            if (i === 1) {
                this.aimLine.moveTo(x, y);
            } else {
                this.aimLine.lineTo(x, y);
            }
            
            if (y > this.gameHeight) break;
        }
        
        this.aimLine.strokePath();
        
        // 力度指示器
        const color = Phaser.Display.Color.InterpolateColorWithColor(
            { r: 0, g: 255, b: 0 },
            { r: 255, g: 0, b: 0 },
            100,
            power * 100
        );
        
        this.aimLine.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
        this.aimLine.fillCircle(this.slingshotState.currentPos.x, this.slingshotState.currentPos.y, 8);
    }

    fireSoldier() {
        const soldierType = this.gameState.selectedSoldierType;
        const cost = this.gameState.soldierCosts[soldierType];
        
        // 检查资源（这里简化为无限资源）
        // if (this.gameState.resources < cost) return;
        
        const dx = this.king.x - this.slingshotState.currentPos.x;
        const dy = this.king.y - this.slingshotState.currentPos.y;
        
        // 创建佣兵
        const soldier = new Soldier(
            this,
            this.slingshotState.currentPos.x,
            this.slingshotState.currentPos.y,
            soldierType
        );
        
        // 设置速度
        Body.setVelocity(soldier.body, {
            x: dx * 0.3,
            y: dy * 0.3
        });
        
        this.soldiers.push(soldier);
        
        // 发射特效
        this.createFireEffect(this.slingshotState.currentPos.x, this.slingshotState.currentPos.y);
    }

    spawnEnemy() {
        if (this.gameState.isGameOver) return;
        
        // 随机选择敌人类型
        const enemyTypes = ['basic', 'elite', 'fast', 'tank'];
        const weights = [60, 20, 15, 5]; // 权重
        const type = this.weightedRandom(enemyTypes, weights);
        
        // 创建敌人
        const enemy = new Enemy(
            this,
            this.portal.x + (Math.random() - 0.5) * 60,
            this.portal.y,
            type
        );
        
        this.enemies.push(enemy);
    }
    
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        return items[0];
    }

    handleCollision(event) {
        const pairs = event.pairs;
        
        pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            
            // 检查佣兵与敌人的碰撞
            this.soldiers.forEach((soldier, soldierIndex) => {
                if (soldier.body === bodyA || soldier.body === bodyB) {
                    this.enemies.forEach((enemy, enemyIndex) => {
                        if (enemy.body === bodyA || enemy.body === bodyB) {
                            this.handleSoldierEnemyCollision(soldier, enemy);
                        }
                    });
                    
                    // 佣兵碰撞反弹
                    soldier.onCollision();
                }
            });
            
            // 检查敌人与城墙的碰撞
            this.enemies.forEach((enemy, index) => {
                if (enemy.body === bodyA || enemy.body === bodyB) {
                    if (enemy.y > this.castle.y - 20) {
                        enemy.attackCastle();
                    }
                }
            });
        });
    }

    handleSoldierEnemyCollision(soldier, enemy) {
        // 发射状态下的碰撞伤害
        if (soldier.state === 'launching') {
            enemy.takeDamage(soldier.damage);
        }
    }

    createFireEffect(x, y) {
        const effect = this.add.graphics();
        effect.fillStyle(0xFFFF00, 0.8);
        effect.fillCircle(x, y, 20);
        
        this.tweens.add({
            targets: effect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    updateHealthBar() {
        // 清除旧的血量条
        this.castle.graphics.fillStyle(0x333333);
        this.castle.graphics.fillRect(
            (this.gameWidth - this.castle.width) / 2 + 50, 
            this.castle.y - 25, 
            this.castle.width - 100, 8
        );
        
        // 绘制新的血量条
        const healthPercent = this.gameState.castleHealth / this.gameState.maxCastleHealth;
        const healthColor = healthPercent > 0.5 ? 0x00FF00 : 
                           healthPercent > 0.25 ? 0xFFFF00 : 0xFF0000;
        
        this.castle.graphics.fillStyle(healthColor);
        this.castle.graphics.fillRect(
            (this.gameWidth - this.castle.width) / 2 + 50, 
            this.castle.y - 25, 
            (this.castle.width - 100) * healthPercent, 8
        );
        
        // 更新血量文本颜色
        if (this.uiElements.healthText) {
            this.uiElements.healthText.setColor(`#${healthColor.toString(16).padStart(6, '0')}`);
        }
    }

    updateUI() {
        this.uiElements.scoreText.setText(`Score: ${this.gameState.score}`);
        this.uiElements.levelText.setText(`Level: ${this.gameState.level}`);
        this.uiElements.healthText.setText(`HP: ${this.gameState.castleHealth}/${this.gameState.maxCastleHealth}`);
        
        // 更新选中的佣兵类型显示
        const typeNames = {
            archer: '弓箭手',
            tank: '重装兵',
            assassin: '刺客',
            healer: '治疗师',
            mage: '法师'
        };
        this.uiElements.selectedText.setText(`选中: ${typeNames[this.gameState.selectedSoldierType]}`);
    }

    startGameLoops() {
        // 敌人生成循环
        this.enemySpawnEvent = this.time.addEvent({
            delay: 3000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // Matter.js 物理更新循环
        this.physicsUpdateEvent = this.time.addEvent({
            delay: 16, // 约60fps
            callback: this.updatePhysics,
            callbackScope: this,
            loop: true
        });
    }

    updatePhysics() {
        if (this.gameState.isGameOver) return;
        
        // 更新 Matter.js 物理
        Engine.update(this.engine, 1000 / 60);
        
        // 更新佣兵
        this.soldiers = this.soldiers.filter(soldier => {
            soldier.update(16);
            return soldier.state !== 'dead';
        });
        
        // 更新敌人
        this.enemies = this.enemies.filter(enemy => {
            enemy.update(16);
            return enemy.state !== 'dead';
        });
        
        // 清理超出边界的对象
        this.cleanupOutOfBounds();
    }

    cleanupOutOfBounds() {
        // 清理超出边界的佣兵
        this.soldiers = this.soldiers.filter(soldier => {
            if (soldier.y > this.gameHeight + 50 || 
                soldier.x < -50 || 
                soldier.x > this.gameWidth + 50) {
                soldier.destroy();
                return false;
            }
            return true;
        });
    }

    gameOver() {
        this.gameState.isGameOver = true;
        
        // 停止生成敌人
        this.enemySpawnEvent.remove();
        this.physicsUpdateEvent.remove();
        
        // 显示游戏结束画面
        const gameOverText = this.add.text(this.gameWidth/2, this.gameHeight/2, 'GAME OVER', {
            fontSize: '48px',
            fill: '#FF0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        const finalScoreText = this.add.text(this.gameWidth/2, this.gameHeight/2 + 70, `Final Score: ${this.gameState.score}`, {
            fontSize: '24px',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 重新开始按钮
        const restartButton = this.add.text(this.gameWidth/2, this.gameHeight/2 + 140, 'TAP TO RESTART', {
            fontSize: '20px',
            fill: '#00FF00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive();
        
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    update() {
        // 游戏主循环更新
        if (!this.gameState.isGameOver) {
            // 检查升级
            if (this.gameState.score >= this.gameState.level * 1000) {
                this.levelUp();
            }
        }
    }

    levelUp() {
        this.gameState.level++;
        this.updateUI();
        
        // 增加难度
        this.enemySpawnEvent.delay = Math.max(1000, 3000 - (this.gameState.level * 200));
        
        // 升级特效
        const levelUpText = this.add.text(this.gameWidth/2, this.gameHeight/2, 'LEVEL UP!', {
            fontSize: '36px',
            fill: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: levelUpText,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                levelUpText.destroy();
            }
        });
    }
}

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 800,
    parent: 'game',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: GameScene,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 500,
        height: 800,
        min: {
            width: 300,
            height: 600
        },
        max: {
            width: 500,
            height: 800
        }
    }
};

// 创建游戏实例
const game = new Phaser.Game(config);
