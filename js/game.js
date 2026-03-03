// Smash Kingdom: Action Defense - Main Game File
// 基于 Phaser 3 的弹珠策略防御游戏

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.castleHealth = 100;
        this.maxCastleHealth = 100;
        this.score = 0;
        this.currentLevel = 1;
    }

    preload() {
        // 创建简单的占位符图形
        this.createPlaceholderGraphics();
        
        // 加载游戏资源（后续会替换为真实资源）
        console.log('Loading game assets...');
    }

    create() {
        // 隐藏加载提示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // 设置世界边界
        this.physics.world.setBounds(0, 0, 800, 600);
        
        // 创建游戏背景
        this.createBackground();
        
        // 创建城墙
        this.createCastle();
        
        // 创建传送门
        this.createPortal();
        
        // 创建弹弓
        this.createSlingshot();
        
        // 创建UI
        this.createUI();
        
        // 设置物理系统
        this.setupPhysics();
        
        // 开始生成敌人
        this.startEnemySpawning();
        
        console.log('Game initialized successfully!');
    }

    createPlaceholderGraphics() {
        // 城墙图形
        this.add.graphics()
            .fillStyle(0x8B4513)
            .fillRect(0, 0, 800, 50)
            .generateTexture('castle', 800, 50);
        
        // 传送门图形
        this.add.graphics()
            .fillStyle(0x9400D3)
            .fillCircle(50, 50, 30)
            .generateTexture('portal', 100, 100);
        
        // 弹弓图形
        this.add.graphics()
            .strokeStyle(4, 0x654321)
            .lineBetween(0, 0, 0, 80)
            .lineBetween(20, 0, 20, 80)
            .generateTexture('slingshot', 20, 80);
        
        // 弹珠图形
        this.add.graphics()
            .fillStyle(0xFF6B6B)
            .fillCircle(20, 20, 15)
            .generateTexture('marble', 40, 40);
        
        // 敌人图形
        this.add.graphics()
            .fillStyle(0xFF0000)
            .fillRect(0, 0, 30, 30)
            .generateTexture('enemy', 30, 30);
    }

    createBackground() {
        // 创建渐变背景
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483);
        bg.fillRect(0, 0, 800, 600);
        bg.setDepth(-1);
    }

    createCastle() {
        // 创建城墙
        this.castle = this.physics.add.sprite(400, 550, 'castle');
        this.castle.setImmovable(true);
        this.castle.body.allowGravity = false;
        
        // 城墙碰撞检测
        this.physics.add.overlap(
            this.castle,
            this.enemies || [],
            this.handleCastleCollision,
            null,
            this
        );
    }

    createPortal() {
        // 创建敌人传送门
        this.portal = this.add.sprite(100, 100, 'portal');
        
        // 添加传送门动画效果
        this.tweens.add({
            targets: this.portal,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createSlingshot() {
        // 创建弹弓
        this.slingshot = this.add.sprite(400, 500, 'slingshot');
        this.slingshot.setInteractive();
        
        // 弹弓拖拽状态
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // 设置拖拽事件
        this.slingshot.on('pointerdown', this.startDrag, this);
        this.input.on('pointermove', this.drag, this);
        this.input.on('pointerup', this.endDrag, this);
        
        // 创建瞄准线
        this.aimLine = this.add.graphics();
        this.aimLine.setDepth(10);
    }

    createUI() {
        // 创建血量条
        this.healthBar = this.add.graphics();
        this.updateHealthBar();
        
        // 创建分数文本
        this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, {
            fontSize: '20px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // 创建等级文本
        this.levelText = this.add.text(10, 40, `Level: ${this.currentLevel}`, {
            fontSize: '20px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // 创建弹珠计数
        this.marbleCount = 10;
        this.marbleText = this.add.text(10, 70, `Marbles: ${this.marbleCount}`, {
            fontSize: '20px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
    }

    setupPhysics() {
        // 创建物理组
        this.marbles = this.physics.add.group({
            defaultKey: 'marble',
            maxSize: 20
        });
        
        this.enemies = this.physics.add.group({
            defaultKey: 'enemy',
            maxSize: 50
        });
        
        // 设置弹珠与敌人的碰撞
        this.physics.add.overlap(
            this.marbles,
            this.enemies,
            this.handleMarbleEnemyCollision,
            null,
            this
        );
        
        // 设置重力
        this.physics.world.gravity.y = 500;
    }

    startDrag(pointer) {
        const bounds = this.slingshot.getBounds();
        if (pointer.x >= bounds.x && pointer.x <= bounds.x + bounds.width &&
            pointer.y >= bounds.y && pointer.y <= bounds.y + bounds.height) {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
        }
    }

    drag(pointer) {
        if (this.isDragging) {
            // 绘制瞄准线
            this.aimLine.clear();
            this.aimLine.lineStyle(3, 0xffffff, 0.8);
            this.aimLine.beginPath();
            this.aimLine.moveTo(this.slingshot.x, this.slingshot.y);
            this.aimLine.lineTo(pointer.x, pointer.y);
            this.aimLine.strokePath();
            
            // 显示力度指示
            const distance = Phaser.Math.Distance.Between(
                this.slingshot.x, this.slingshot.y,
                pointer.x, pointer.y
            );
            const power = Math.min(distance / 100, 1);
            
            // 力度颜色变化
            const color = Phaser.Display.Color.InterpolateColorWithColor(
                { r: 0, g: 255, b: 0 },
                { r: 255, g: 0, b: 0 },
                100,
                power * 100
            );
            this.aimLine.lineStyle(5, Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.6);
            this.aimLine.beginPath();
            this.aimLine.arc(pointer.x, pointer.y, 10, 0, Math.PI * 2);
            this.aimLine.strokePath();
        }
    }

    endDrag(pointer) {
        if (this.isDragging && this.marbleCount > 0) {
            // 计算发射角度和力度
            const angle = Phaser.Math.Angle.Between(
                pointer.x, pointer.y,
                this.slingshot.x, this.slingshot.y
            );
            
            const distance = Phaser.Math.Distance.Between(
                this.slingshot.x, this.slingshot.y,
                pointer.x, pointer.y
            );
            
            const power = Math.min(distance / 10, 30);
            
            // 发射弹珠
            this.fireMarble(angle, power);
            
            // 减少弹珠数量
            this.marbleCount--;
            this.updateMarbleText();
        }
        
        this.isDragging = false;
        this.aimLine.clear();
    }

    fireMarble(angle, power) {
        const marble = this.marbles.get(this.slingshot.x, this.slingshot.y);
        
        if (marble) {
            marble.setActive(true);
            marble.setVisible(true);
            marble.body.enable = true;
            
            // 设置速度
            marble.body.velocity.x = Math.cos(angle) * power;
            marble.body.velocity.y = Math.sin(angle) * power;
            
            // 设置弹珠属性
            marble.damage = 25;
            marble.bounces = 3;
            
            // 添加弹珠生命周期
            this.time.delayedCall(5000, () => {
                this.destroyMarble(marble);
            });
        }
    }

    startEnemySpawning() {
        // 定期生成敌人
        this.enemySpawnEvent = this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    spawnEnemy() {
        const enemy = this.enemies.get(this.portal.x, this.portal.y);
        
        if (enemy) {
            enemy.setActive(true);
            enemy.setVisible(true);
            enemy.body.enable = true;
            
            // 设置敌人属性
            enemy.health = 50;
            enemy.speed = 50;
            enemy.damage = 10;
            
            // 向城墙移动
            enemy.body.velocity.x = 50;
            enemy.body.velocity.y = 100;
        }
    }

    handleMarbleEnemyCollision(marble, enemy) {
        // 造成伤害
        enemy.health -= marble.damage || 25;
        
        // 弹珠反弹
        marble.bounces--;
        if (marble.bounces <= 0) {
            this.destroyMarble(marble);
        } else {
            // 简单的反弹逻辑
            marble.body.velocity.x *= -0.8;
            marble.body.velocity.y *= -0.8;
        }
        
        // 检查敌人是否死亡
        if (enemy.health <= 0) {
            this.destroyEnemy(enemy);
            this.addScore(100);
        }
        
        // 创建碰撞效果
        this.createCollisionEffect(enemy.x, enemy.y);
    }

    handleCastleCollision(castle, enemy) {
        // 城墙受到伤害
        this.castleHealth -= enemy.damage || 10;
        this.updateHealthBar();
        
        // 销毁敌人
        this.destroyEnemy(enemy);
        
        // 检查游戏结束
        if (this.castleHealth <= 0) {
            this.gameOver();
        }
    }

    destroyMarble(marble) {
        if (marble && marble.active) {
            marble.setActive(false);
            marble.setVisible(false);
            marble.body.enable = false;
            this.marbles.killAndHide(marble);
        }
    }

    destroyEnemy(enemy) {
        if (enemy && enemy.active) {
            enemy.setActive(false);
            enemy.setVisible(false);
            enemy.body.enable = false;
            this.enemies.killAndHide(enemy);
        }
    }

    createCollisionEffect(x, y) {
        // 创建简单的碰撞特效
        const effect = this.add.graphics();
        effect.fillStyle(0xffff00, 0.8);
        effect.fillCircle(x, y, 20);
        
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

    updateHealthBar() {
        this.healthBar.clear();
        
        // 背景
        this.healthBar.fillStyle(0x333333);
        this.healthBar.fillRect(300, 20, 200, 20);
        
        // 血量条
        const healthPercent = this.castleHealth / this.maxCastleHealth;
        const healthColor = healthPercent > 0.5 ? 0x00ff00 : 
                           healthPercent > 0.25 ? 0xffff00 : 0xff0000;
        
        this.healthBar.fillStyle(healthColor);
        this.healthBar.fillRect(300, 20, 200 * healthPercent, 20);
        
        // 边框
        this.healthBar.lineStyle(2, 0xffffff);
        this.healthBar.strokeRect(300, 20, 200, 20);
    }

    updateMarbleText() {
        this.marbleText.setText(`Marbles: ${this.marbleCount}`);
    }

    addScore(points) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // 检查升级
        if (this.score >= this.currentLevel * 1000) {
            this.levelUp();
        }
    }

    levelUp() {
        this.currentLevel++;
        this.levelText.setText(`Level: ${this.currentLevel}`);
        
        // 增加难度
        this.enemySpawnEvent.delay = Math.max(500, 2000 - (this.currentLevel * 100));
        
        // 奖励弹珠
        this.marbleCount += 5;
        this.updateMarbleText();
        
        // 升级特效
        this.createLevelUpEffect();
    }

    createLevelUpEffect() {
        const effect = this.add.text(400, 300, 'LEVEL UP!', {
            fontSize: '48px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: effect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    gameOver() {
        // 停止生成敌人
        this.enemySpawnEvent.remove();
        
        // 显示游戏结束画面
        const gameOverText = this.add.text(400, 300, 'GAME OVER', {
            fontSize: '64px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        const finalScoreText = this.add.text(400, 380, `Final Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 重新开始按钮
        const restartButton = this.add.text(400, 450, 'Click to Restart', {
            fontSize: '24px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive();
        
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    update() {
        // 更新游戏逻辑
        // 这里可以添加更多的游戏逻辑更新
    }
}

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    backgroundColor: '#2a2a3e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: GameScene
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 窗口大小调整
window.addEventListener('resize', () => {
    const canvas = document.querySelector('#game');
    if (canvas) {
        const container = document.getElementById('game-container');
        const aspectRatio = config.width / config.height;
        
        let newWidth = window.innerWidth * 0.9;
        let newHeight = newWidth / aspectRatio;
        
        if (newHeight > window.innerHeight * 0.9) {
            newHeight = window.innerHeight * 0.9;
            newWidth = newHeight * aspectRatio;
        }
        
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
    }
});

// 初始化窗口大小
window.dispatchEvent(new Event('resize'));
