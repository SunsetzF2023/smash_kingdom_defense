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
        this.healthRing = this.scene.add.graphics();
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        if (!this.healthRing) return;
        
        this.healthRing.clear();
        
        // 计算血量百分比
        const healthPercent = Math.max(0, this.hp / this.maxHp);
        
        // 根据血量设置颜色
        const healthColor = this.hp > this.maxHp * 0.5 ? 0x00FF00 : 
                           this.hp > this.maxHp * 0.25 ? 0xFFFF00 : 0xFF0000;
        
        // 绘制环形血条
        const radius = Math.max(this.width, this.height) / 2 + 8;
        const thickness = 3;
        const startAngle = -Math.PI / 2; // 从顶部开始
        const endAngle = startAngle + (Math.PI * 2 * healthPercent);
        
        // 背景环（灰色）
        this.healthRing.lineStyle(thickness, 0x333333, 0.8);
        this.healthRing.beginPath();
        this.healthRing.arc(this.x, this.y, radius, 0, Math.PI * 2);
        this.healthRing.strokePath();
        
        // 血量环（彩色）
        if (healthPercent > 0) {
            this.healthRing.lineStyle(thickness, healthColor, 1);
            this.healthRing.beginPath();
            this.healthRing.arc(this.x, this.y, radius, startAngle, endAngle);
            this.healthRing.strokePath();
        }
        
        // 添加发光效果
        if (healthPercent > 0.5) {
            this.healthRing.lineStyle(1, healthColor, 0.3);
            this.healthRing.beginPath();
            this.healthRing.arc(this.x, this.y, radius + 2, startAngle, endAngle);
            this.healthRing.strokePath();
        }
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
        
        // 破碎特效
        this.createShatterEffect();
        
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
        if (this.healthRing) {
            this.healthRing.destroy();
        }
    }
    
    createShatterEffect() {
        // 创建破碎粒子效果
        const particleCount = 8;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 1.5 + Math.random() * 2;
            const size = 2 + Math.random() * 3;
            
            const particle = this.scene.add.graphics();
            particle.fillStyle(this.color, 0.8);
            particle.fillCircle(0, 0, size);
            
            particle.x = this.x;
            particle.y = this.y;
            
            particles.push(particle);
            
            // 粒子飞散动画
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * speed * 15,
                y: this.y + Math.sin(angle) * speed * 15,
                scaleX: 0.1,
                scaleY: 0.1,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        // 中心爆炸效果
        const explosion = this.scene.add.graphics();
        explosion.fillStyle(this.color, 0.6);
        explosion.fillCircle(this.x, this.y, Math.max(this.width, this.height));
        
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 350,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // 环形血条破碎效果
        if (this.healthRing) {
            const ringShatter = this.scene.add.graphics();
            const radius = Math.max(this.width, this.height) / 2 + 8;
            ringShatter.lineStyle(3, 0x333333, 0.8);
            ringShatter.beginPath();
            ringShatter.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ringShatter.strokePath();
            
            this.scene.tweens.add({
                targets: ringShatter,
                scaleX: 1.8,
                scaleY: 1.8,
                alpha: 0,
                duration: 250,
                ease: 'Power2',
                onComplete: () => {
                    ringShatter.destroy();
                }
            });
        }
    }
    
    destroy() {
        this.die();
    }
}
