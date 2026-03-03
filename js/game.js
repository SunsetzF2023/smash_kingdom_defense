// Smash Kingdom: Action Defense - Matter.js 版本
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
            marbleCount: 20,
            level: 1,
            isGameOver: false
        };
        
        // Matter.js 相关
        this.engine = null;
        this.render = null;
        this.world = null;
        
        // 游戏对象
        this.king = null;          // 国王（发射点）
        this.portal = null;        // 传送门
        this.castle = null;        // 城墙
        this.marbles = [];         // 弹珠数组
        this.enemies = [];         // 敌人数组
        
        // 弹弓状态
        this.slingshotState = {
            isDragging: false,
            startPos: { x: 200, y: 600 },
            currentPos: { x: 200, y: 600 },
            maxDistance: 100
        };
        
        // UI 元素
        this.uiElements = {};
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

        // 设置游戏画布尺寸
        this.cameras.main.setSize(400, 700);
        
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
        
        console.log('Game initialized with Matter.js!');
    }

    initMatterJS() {
        // 创建 Matter.js 引擎
        this.engine = Engine.create();
        this.world = this.engine.world;
        
        // 设置重力
        this.engine.world.gravity.y = 1;
        
        // 创建 Matter.js 渲染器（用于调试，可选）
        // this.createMatterRenderer();
    }

    createGameWorld() {
        // 创建边界墙壁
        this.createWalls();
        
        // 创建传送门（顶部）
        this.createPortal();
        
        // 创建城墙（底部）
        this.createCastle();
        
        // 创建国王（发射点）
        this.createKing();
        
        // 创建瞄准线
        this.createAimLine();
    }

    createWalls() {
        const wallThickness = 10;
        const walls = [
            // 左墙
            Bodies.rectangle(wallThickness/2, 350, wallThickness, 700, { 
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            }),
            // 右墙
            Bodies.rectangle(400 - wallThickness/2, 350, wallThickness, 700, { 
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            }),
            // 顶部墙（留出传送门位置）
            Bodies.rectangle(200, wallThickness/2, 400, wallThickness, { 
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            })
        ];
        
        World.add(this.world, walls);
        
        // 在 Phaser 中创建墙壁视觉效果
        this.add.graphics()
            .fillStyle(0x2c3e50)
            .fillRect(0, 0, 10, 700)                    // 左墙
            .fillRect(390, 0, 10, 700)                  // 右墙
            .fillRect(0, 0, 400, 10);                    // 顶部墙
    }

    createPortal() {
        // 传送门位置（顶部中央）
        const portalX = 200;
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
        const castleY = 650;
        
        // 创建城墙视觉效果
        const castleGraphics = this.add.graphics();
        
        // 城墙主体
        castleGraphics.fillStyle(0x8B4513);
        castleGraphics.fillRect(50, castleY, 300, 40);
        
        // 城墙装饰
        castleGraphics.fillStyle(0x654321);
        for (let i = 0; i < 6; i++) {
            castleGraphics.fillRect(60 + i * 50, castleY - 10, 30, 10);
        }
        
        // 城墙血量条背景
        castleGraphics.fillStyle(0x333333);
        castleGraphics.fillRect(100, castleY - 25, 200, 8);
        
        this.castle = { 
            x: 200, 
            y: castleY, 
            width: 300, 
            height: 40,
            graphics: castleGraphics 
        };
    }

    createKing() {
        // 国王位置（底部中央）
        const kingX = 200;
        const kingY = 600;
        
        // 创建国王视觉效果
        const kingGraphics = this.add.graphics();
        
        // 国王身体
        kingGraphics.fillStyle(0xFFD700);
        kingGraphics.fillCircle(kingX, kingY, 20);
        
        // 国王皇冠
        kingGraphics.fillStyle(0xFF6B6B);
        kingGraphics.fillTriangle(
            kingX - 15, kingY - 20,
            kingX, kingY - 35,
            kingX + 15, kingY - 20
        );
        
        // 国王眼睛
        kingGraphics.fillStyle(0x000000);
        kingGraphics.fillCircle(kingX - 8, kingY - 5, 3);
        kingGraphics.fillCircle(kingX + 8, kingY - 5, 3);
        
        this.king = { 
            x: kingX, 
            y: kingY, 
            radius: 20,
            graphics: kingGraphics 
        };
        
        this.slingshotState.startPos = { x: kingX, y: kingY };
    }

    createAimLine() {
        this.aimLine = this.add.graphics();
        this.aimLine.setDepth(100);
    }

    createPlaceholderGraphics() {
        // 弹珠图形
        this.add.graphics()
            .fillStyle(0xFF6B6B)
            .fillCircle(15, 15, 12)
            .generateTexture('marble', 30, 30);
        
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
        
        // 弹珠数量
        this.uiElements.marbleText = this.add.text(10, 70, `Marbles: ${this.gameState.marbleCount}`, {
            fontSize: '18px',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // 城墙血量
        this.uiElements.healthText = this.add.text(200, 20, `HP: ${this.gameState.castleHealth}/${this.gameState.maxCastleHealth}`, {
            fontSize: '18px',
            fill: '#00FF00',
            stroke: '#000000',
            strokeThickness: 2
        });
        
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
        
        if (distance < 50 && this.gameState.marbleCount > 0) {
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
        if (this.slingshotState.isDragging && this.gameState.marbleCount > 0) {
            this.fireMarble();
            this.gameState.marbleCount--;
            this.updateUI();
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
            
            if (y > 700) break;
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

    fireMarble() {
        const dx = this.king.x - this.slingshotState.currentPos.x;
        const dy = this.king.y - this.slingshotState.currentPos.y;
        
        // 创建 Matter.js 弹珠
        const marble = Bodies.circle(
            this.slingshotState.currentPos.x,
            this.slingshotState.currentPos.y,
            12,
            {
                restitution: 0.8,
                friction: 0.1,
                density: 0.001,
                render: { fillStyle: '#FF6B6B' }
            }
        );
        
        // 设置速度
        Body.setVelocity(marble, {
            x: dx * 0.3,
            y: dy * 0.3
        });
        
        World.add(this.world, marble);
        
        // 创建 Phaser 视觉效果
        const marbleSprite = this.add.sprite(
            this.slingshotState.currentPos.x,
            this.slingshotState.currentPos.y,
            'marble'
        );
        
        this.marbles.push({
            body: marble,
            sprite: marbleSprite,
            damage: 25
        });
        
        // 发射音效（如果有的话）
        this.createFireEffect(this.slingshotState.currentPos.x, this.slingshotState.currentPos.y);
    }

    spawnEnemy() {
        if (this.gameState.isGameOver) return;
        
        // 创建 Matter.js 敌人
        const enemy = Bodies.rectangle(
            this.portal.x + (Math.random() - 0.5) * 40,
            this.portal.y,
            25,
            25,
            {
                restitution: 0.2,
                friction: 0.3,
                density: 0.002,
                render: { fillStyle: '#FF0000' }
            }
        );
        
        // 设置向下移动的速度
        Body.setVelocity(enemy, {
            x: (Math.random() - 0.5) * 2,
            y: 1 + Math.random()
        });
        
        World.add(this.world, enemy);
        
        // 创建 Phaser 视觉效果
        const enemySprite = this.add.sprite(enemy.position.x, enemy.position.y, 'enemy');
        
        this.enemies.push({
            body: enemy,
            sprite: enemySprite,
            health: 50,
            damage: 10
        });
    }

    handleCollision(event) {
        const pairs = event.pairs;
        
        pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            
            // 检查弹珠与敌人的碰撞
            this.marbles.forEach((marble, marbleIndex) => {
                if (marble.body === bodyA || marble.body === bodyB) {
                    this.enemies.forEach((enemy, enemyIndex) => {
                        if (enemy.body === bodyA || enemy.body === bodyB) {
                            this.handleMarbleEnemyCollision(marble, enemy, marbleIndex, enemyIndex);
                        }
                    });
                }
            });
            
            // 检查敌人与城墙的碰撞
            this.enemies.forEach((enemy, index) => {
                if (enemy.body === bodyA || enemy.body === bodyB) {
                    if (enemy.body.position.y > this.castle.y - 20) {
                        this.handleEnemyCastleCollision(enemy, index);
                    }
                }
            });
        });
    }

    handleMarbleEnemyCollision(marble, enemy, marbleIndex, enemyIndex) {
        enemy.health -= marble.damage;
        
        // 创建碰撞特效
        this.createCollisionEffect(enemy.body.position.x, enemy.body.position.y);
        
        if (enemy.health <= 0) {
            // 移除敌人
            World.remove(this.world, enemy.body);
            enemy.sprite.destroy();
            this.enemies.splice(enemyIndex, 1);
            
            // 增加分数
            this.gameState.score += 100;
            this.updateUI();
        }
    }

    handleEnemyCastleCollision(enemy, index) {
        // 城墙受到伤害
        this.gameState.castleHealth -= enemy.damage;
        this.updateUI();
        this.updateHealthBar();
        
        // 移除敌人
        World.remove(this.world, enemy.body);
        enemy.sprite.destroy();
        this.enemies.splice(index, 1);
        
        // 创建城墙受击特效
        this.createCastleHitEffect();
        
        // 检查游戏结束
        if (this.gameState.castleHealth <= 0) {
            this.gameOver();
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

    createCollisionEffect(x, y) {
        const effect = this.add.graphics();
        effect.fillStyle(0xFF00FF, 0.8);
        effect.fillCircle(x, y, 15);
        
        this.tweens.add({
            targets: effect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    createCastleHitEffect() {
        const originalColor = this.castle.graphics.fillStyle;
        
        this.castle.graphics.fillStyle(0xFF0000, 0.5);
        this.castle.graphics.fillRect(50, this.castle.y, 300, 40);
        
        this.time.delayedCall(100, () => {
            this.castle.graphics.clear();
            // 重新绘制城墙
            this.castle.graphics.fillStyle(0x8B4513);
            this.castle.graphics.fillRect(50, this.castle.y, 300, 40);
            this.castle.graphics.fillStyle(0x654321);
            for (let i = 0; i < 6; i++) {
                this.castle.graphics.fillRect(60 + i * 50, this.castle.y - 10, 30, 10);
            }
        });
    }

    updateHealthBar() {
        // 清除旧的血量条
        this.castle.graphics.fillStyle(0x333333);
        this.castle.graphics.fillRect(100, this.castle.y - 25, 200, 8);
        
        // 绘制新的血量条
        const healthPercent = this.gameState.castleHealth / this.gameState.maxCastleHealth;
        const healthColor = healthPercent > 0.5 ? 0x00FF00 : 
                           healthPercent > 0.25 ? 0xFFFF00 : 0xFF0000;
        
        this.castle.graphics.fillStyle(healthColor);
        this.castle.graphics.fillRect(100, this.castle.y - 25, 200 * healthPercent, 8);
        
        // 更新血量文本颜色
        if (this.uiElements.healthText) {
            this.uiElements.healthText.setColor(`#${healthColor.toString(16).padStart(6, '0')}`);
        }
    }

    updateUI() {
        this.uiElements.scoreText.setText(`Score: ${this.gameState.score}`);
        this.uiElements.levelText.setText(`Level: ${this.gameState.level}`);
        this.uiElements.marbleText.setText(`Marbles: ${this.gameState.marbleCount}`);
        this.uiElements.healthText.setText(`HP: ${this.gameState.castleHealth}/${this.gameState.maxCastleHealth}`);
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
        
        // 同步 Phaser 精灵位置
        this.marbles.forEach(marble => {
            if (marble.body && marble.sprite) {
                marble.sprite.x = marble.body.position.x;
                marble.sprite.y = marble.body.position.y;
                marble.sprite.rotation = marble.body.angle;
            }
        });
        
        this.enemies.forEach(enemy => {
            if (enemy.body && enemy.sprite) {
                enemy.sprite.x = enemy.body.position.x;
                enemy.sprite.y = enemy.body.position.y;
                enemy.sprite.rotation = enemy.body.angle;
            }
        });
        
        // 清理超出边界的弹珠
        this.marbles = this.marbles.filter(marble => {
            if (marble.body.position.y > 750 || marble.body.position.x < -50 || marble.body.position.x > 450) {
                World.remove(this.world, marble.body);
                marble.sprite.destroy();
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
        const gameOverText = this.add.text(200, 350, 'GAME OVER', {
            fontSize: '48px',
            fill: '#FF0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        const finalScoreText = this.add.text(200, 420, `Final Score: ${this.gameState.score}`, {
            fontSize: '24px',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 重新开始按钮
        const restartButton = this.add.text(200, 480, 'TAP TO RESTART', {
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
            if (this.gameState.score >= this.gameState.level * 500) {
                this.levelUp();
            }
        }
    }

    levelUp() {
        this.gameState.level++;
        this.gameState.marbleCount += 10;
        this.updateUI();
        
        // 增加难度
        this.enemySpawnEvent.delay = Math.max(1000, 3000 - (this.gameState.level * 200));
        
        // 升级特效
        const levelUpText = this.add.text(200, 350, 'LEVEL UP!', {
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
    width: 400,
    height: 700,
    parent: 'game',
    backgroundColor: '#1e3c72',
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
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// 创建游戏实例
const game = new Phaser.Game(config);
