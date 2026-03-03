// 敌人类定义
class Enemy {
    constructor(scene, x, y, type = 'basic') {
        this.scene = scene;
        this.type = type;
        this.x = x;
        this.y = y;
        
        // 根据类型设置属性
        this.setupEnemyType();
        
        // 物理属性
        this.body = null;
        this.sprite = null;
        
        // 状态
        this.state = 'moving'; // moving, attacking, dead
        this.target = null;
        
        // 特殊效果
        this.poisonDamage = 0;
        this.poisonTimer = null;
        this.lavaStack = 0;
        
        this.create();
    }
    
    setupEnemyType() {
        const types = {
            basic: {
                name: '小怪',
                color: 0xFF0000,
                width: 25,
                height: 25,
                hp: 30,
                maxHp: 30,
                damage: 10,
                speed: 1,
                mass: 0.002,
                reward: 100
            },
            elite: {
                name: '精英怪',
                color: 0xFF4500,
                width: 35,
                height: 35,
                hp: 80,
                maxHp: 80,
                damage: 20,
                speed: 0.8,
                mass: 0.004,
                reward: 300
            },
            fast: {
                name: '快速怪',
                color: 0xFFFF00,
                width: 20,
                height: 20,
                hp: 20,
                maxHp: 20,
                damage: 5,
                speed: 2.5,
                mass: 0.001,
                reward: 150
            },
            tank: {
                name: '重装怪',
                color: 0x8B0000,
                width: 40,
                height: 40,
                hp: 150,
                maxHp: 150,
                damage: 15,
                speed: 0.5,
                mass: 0.008,
                reward: 500
            }
        };
        
        const config = types[this.type] || types.basic;
        Object.assign(this, config);
    }
    
    create() {
        // 创建 Matter.js 物理体
        this.body = Matter.Bodies.rectangle(this.x, this.y, this.width, this.height, {
            restitution: 0.2,
            friction: 0.3,
            density: this.mass,
            render: { fillStyle: `#${this.color.toString(16).padStart(6, '0')}` }
        });
        
        // 设置初始速度（向下移动）
        Matter.Body.setVelocity(this.body, {
            x: (Math.random() - 0.5) * 2,
            y: this.speed
        });
        
        // 创建 Phaser 精灵
        this.sprite = this.scene.add.sprite(this.x, this.y, 'enemy');
        this.sprite.setDisplaySize(this.width, this.height);
        this.sprite.setTint(this.color);
        
        // 添加到世界
        Matter.World.add(this.scene.world, this.body);
        
        // 创建血条
        this.createHealthBar();
        
        // 设置目标为城墙
        this.target = this.scene.castle;
    }
    
    createHealthBar() {
        this.healthBarBg = this.scene.add.graphics();
        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        if (!this.healthBar || !this.healthBarBg) return;
        
        const barWidth = 40;
        const barHeight = 4;
        const x = this.x - barWidth / 2;
        const y = this.y - this.height / 2 - 10;
        
        // 背景
        this.healthBarBg.clear();
        this.healthBarBg.fillStyle(0x333333);
        this.healthBarBg.fillRect(x, y, barWidth, barHeight);
        
        // 血量
        const healthPercent = Math.max(0, this.hp / this.maxHp);
        const healthColor = this.hp > this.maxHp * 0.5 ? 0x00FF00 : 
                           this.hp > this.maxHp * 0.25 ? 0xFFFF00 : 0xFF0000;
        
        this.healthBar.clear();
        this.healthBar.fillStyle(healthColor);
        this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
    }
    
    update(deltaTime) {
        // 同步位置
        if (this.body && this.sprite) {
            this.x = this.body.position.x;
            this.y = this.body.position.y;
            this.sprite.x = this.x;
            this.sprite.y = this.y;
            this.sprite.rotation = this.body.angle;
            
            // 更新血条位置
            if (this.healthBar && this.healthBarBg) {
                this.updateHealthBar();
            }
        }
        
        // 移动向目标
        if (this.state === 'moving' && this.target) {
            this.moveTowardsTarget();
        }
        
        // 检查是否到达城墙
        if (this.y > this.scene.castle.y - 30) {
            this.attackCastle();
        }
        
        // 检查死亡
        if (this.hp <= 0 && this.state !== 'dead') {
            this.die();
        }
    }
    
    moveTowardsTarget() {
        if (!this.body || !this.target) return;
        
        // 计算方向
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // 设置速度
            const vx = (dx / distance) * this.speed;
            const vy = (dy / distance) * this.speed;
            
            Matter.Body.setVelocity(this.body, { x: vx, y: vy });
        }
    }
    
    attackCastle() {
        this.state = 'attacking';
        
        // 对城墙造成伤害
        this.scene.gameState.castleHealth -= this.damage;
        this.scene.updateUI();
        this.scene.updateHealthBar();
        
        // 攻击特效
        this.createAttackEffect();
        
        // 死亡
        this.die();
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        this.updateHealthBar();
        
        // 受击特效
        this.createHitEffect();
    }
    
    applyPoison(damage, interval) {
        this.poisonDamage = damage;
        
        if (this.poisonTimer) {
            clearInterval(this.poisonTimer);
        }
        
        this.poisonTimer = setInterval(() => {
            if (this.state !== 'dead') {
                this.takeDamage(damage);
                this.createPoisonEffect();
            } else {
                clearInterval(this.poisonTimer);
            }
        }, interval);
        
        // 3秒后停止毒伤
        setTimeout(() => {
            if (this.poisonTimer) {
                clearInterval(this.poisonTimer);
                this.poisonTimer = null;
            }
        }, 3000);
    }
    
    createHitEffect() {
        this.sprite.setTint(0xFFFFFF);
        this.scene.time.delayedCall(100, () => {
            this.sprite.setTint(this.color);
        });
    }
    
    createAttackEffect() {
        const effect = this.scene.add.graphics();
        effect.fillStyle(0xFF0000, 0.8);
        effect.fillCircle(this.x, this.y, 30);
        
        this.scene.tweens.add({
            targets: effect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                effect.destroy();
            }
        });
    }
    
    createPoisonEffect() {
        const effect = this.scene.add.graphics();
        effect.fillStyle(0x00FF00, 0.4);
        effect.fillCircle(this.x, this.y, this.width);
        
        this.scene.tweens.add({
            targets: effect,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                effect.destroy();
            }
        });
    }
    
    die() {
        this.state = 'dead';
        
        // 清理毒伤计时器
        if (this.poisonTimer) {
            clearInterval(this.poisonTimer);
            this.poisonTimer = null;
        }
        
        // 死亡特效
        this.createDeathEffect();
        
        // 给玩家奖励
        this.scene.gameState.score += this.reward;
        this.scene.updateUI();
        
        // 清理
        if (this.body) {
            Matter.World.remove(this.scene.world, this.body);
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
        }
    }
    
    createDeathEffect() {
        const effect = this.scene.add.graphics();
        effect.fillStyle(this.color, 0.8);
        effect.fillCircle(this.x, this.y, Math.max(this.width, this.height));
        
        this.scene.tweens.add({
            targets: effect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 600,
            onComplete: () => {
                effect.destroy();
            }
        });
    }
    
    destroy() {
        this.die();
    }
}
