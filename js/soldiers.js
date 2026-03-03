// 佣兵类定义
class Soldier {
    constructor(scene, x, y, type = 'archer') {
        this.scene = scene;
        this.type = type;
        this.x = x;
        this.y = y;
        
        // 根据类型设置属性
        this.setupSoldierType();
        
        // 物理属性
        this.body = null;
        this.sprite = null;
        this.state = 'launching'; // launching, fighting, dead
        
        // 战斗属性
        this.bounces = 0;
        this.maxBounces = 3;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1秒攻击冷却
        
        // 特效
        this.attackLines = [];
        this.poisonTrail = [];
        
        this.create();
    }
    
    setupSoldierType() {
        const types = {
            archer: {
                name: '弓箭手',
                color: 0x00FF00,
                radius: 12,
                hp: 50,
                maxHp: 50,
                damage: 15,
                speed: 5,
                mass: 0.001,
                restitution: 0.7,
                attackRange: 100,
                attackType: 'ranged'
            },
            tank: {
                name: '重装兵',
                color: 0x0000FF,
                radius: 18,
                hp: 100,
                maxHp: 100,
                damage: 10,
                speed: 2,
                mass: 0.003,
                restitution: 0.3,
                attackRange: 30,
                attackType: 'melee'
            },
            assassin: {
                name: '刺客',
                color: 0xFF00FF,
                radius: 8,
                hp: 25,
                maxHp: 25,
                damage: 20,
                speed: 8,
                mass: 0.0005,
                restitution: 0.9,
                attackType: 'poison',
                poisonDamage: 5,
                poisonDuration: 3000
            },
            healer: {
                name: '治疗师',
                color: 0xFFFFFF,
                radius: 14,
                hp: 40,
                maxHp: 40,
                damage: 0,
                speed: 3,
                mass: 0.001,
                restitution: 0.5,
                healAmount: 10,
                healRange: 80
            },
            mage: {
                name: '法师',
                color: 0xFF4500,
                radius: 15,
                hp: 60,
                maxHp: 60,
                damage: 5,
                speed: 4,
                mass: 0.0015,
                restitution: 0.6,
                attackType: 'lava',
                lavaDamage: 2,
                maxLavaStack: 20
            }
        };
        
        const config = types[this.type] || types.archer;
        Object.assign(this, config);
    }
    
    create() {
        // 创建 Matter.js 物理体
        this.body = Matter.Bodies.circle(this.x, this.y, this.radius, {
            restitution: this.restitution,
            friction: 0.1,
            density: this.mass,
            render: { fillStyle: `#${this.color.toString(16).padStart(6, '0')}` }
        });
        
        // 创建 Phaser 精灵
        this.sprite = this.scene.add.sprite(this.x, this.y, 'soldier');
        this.sprite.setDisplaySize(this.radius * 2, this.radius * 2);
        this.updateColor();
        
        // 添加到世界
        Matter.World.add(this.scene.world, this.body);
        
        // 创建血条
        this.createHealthBar();
    }
    
    updateColor() {
        if (this.state === 'fighting') {
            // 战斗状态下颜色变深
            const darkerColor = Phaser.Display.Color.GetColor(
                Math.floor(this.color * 0.7 >> 16),
                Math.floor((this.color >> 8 & 0xFF) * 0.7),
                Math.floor((this.color & 0xFF) * 0.7)
            );
            this.sprite.setTint(darkerColor);
        } else {
            this.sprite.setTint(this.color);
        }
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
        const radius = this.radius + 8;
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
        
        // 检查状态转换
        if (this.state === 'launching') {
            this.checkLanding();
        } else if (this.state === 'fighting') {
            this.performCombat(deltaTime);
        }
        
        // 清理攻击线
        this.cleanupAttackLines();
        
        // 检查死亡
        if (this.hp <= 0 && this.state !== 'dead') {
            this.die();
        }
    }
    
    checkLanding() {
        if (!this.body) return;
        
        const speed = Math.sqrt(
            this.body.velocity.x ** 2 + this.body.velocity.y ** 2
        );
        
        if (speed < 10 || this.bounces >= this.maxBounces) {
            // 停止移动，转为战斗状态
            this.state = 'fighting';
            Matter.Body.setStatic(this.body, true);
            this.updateColor();
            
            // 停止特效
            this.createLandingEffect();
        }
    }
    
    performCombat(deltaTime) {
        const now = Date.now();
        
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        switch (this.attackType) {
            case 'ranged':
                this.performRangedAttack();
                break;
            case 'melee':
                this.performMeleeAttack();
                break;
            case 'poison':
                this.performPoisonAttack();
                break;
            case 'heal':
                this.performHeal();
                break;
            case 'lava':
                this.performLavaAttack();
                break;
        }
        
        this.lastAttackTime = now;
    }
    
    performRangedAttack() {
        const enemies = this.findEnemiesInRange(this.attackRange);
        if (enemies.length > 0) {
            const target = enemies[0];
            this.createAttackLine(target, 0x00FF00);
            target.takeDamage(this.damage);
        }
    }
    
    performMeleeAttack() {
        const enemies = this.findEnemiesInRange(this.attackRange);
        enemies.forEach(enemy => {
            enemy.takeDamage(this.damage);
            this.createAttackEffect(enemy.x, enemy.y, 0x0000FF);
        });
    }
    
    performPoisonAttack() {
        // 留下毒迹
        this.poisonTrail.push({
            x: this.x,
            y: this.y,
            time: Date.now(),
            duration: this.poisonDuration
        });
        
        // 创建毒迹特效
        this.createPoisonEffect(this.x, this.y);
        
        // 对范围内的敌人造成毒伤
        const enemies = this.findEnemiesInRange(50);
        enemies.forEach(enemy => {
            enemy.takeDamage(this.poisonDamage);
            enemy.applyPoison(this.poisonDamage, 1000); // 每秒毒伤
        });
    }
    
    performHeal() {
        const allies = this.findAlliesInRange(this.healRange);
        allies.forEach(ally => {
            if (ally.hp < ally.maxHp) {
                ally.hp = Math.min(ally.maxHp, ally.hp + this.healAmount);
                this.createHealEffect(ally.x, ally.y);
            }
        });
    }
    
    performLavaAttack() {
        const enemies = this.findEnemiesInRange(this.attackRange);
        enemies.forEach(enemy => {
            if (!enemy.lavaStack) enemy.lavaStack = 0;
            
            enemy.lavaStack = Math.min(enemy.lavaStack + 1, this.maxLavaStack);
            const damage = this.damage + (enemy.lavaStack * this.lavaDamage);
            
            enemy.takeDamage(damage);
            this.createLavaEffect(enemy.x, enemy.y, enemy.lavaStack);
        });
    }
    
    findEnemiesInRange(range) {
        const enemies = [];
        this.scene.enemies.forEach(enemy => {
            const distance = Math.sqrt(
                (enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2
            );
            if (distance <= range) {
                enemies.push(enemy);
            }
        });
        return enemies;
    }
    
    findAlliesInRange(range) {
        const allies = [];
        this.scene.soldiers.forEach(soldier => {
            if (soldier === this || soldier.state === 'dead') return;
            
            const distance = Math.sqrt(
                (soldier.x - this.x) ** 2 + (soldier.y - this.y) ** 2
            );
            if (distance <= range) {
                allies.push(soldier);
            }
        });
        return allies;
    }
    
    createAttackLine(target, color) {
        const line = this.scene.add.graphics();
        line.lineStyle(2, color, 0.8);
        line.beginPath();
        line.moveTo(this.x, this.y);
        line.lineTo(target.x, target.y);
        line.strokePath();
        
        this.attackLines.push(line);
        
        // 动画效果
        this.scene.tweens.add({
            targets: line,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                line.destroy();
            }
        });
    }
    
    createAttackEffect(x, y, color) {
        const effect = this.scene.add.graphics();
        effect.fillStyle(color, 0.6);
        effect.fillCircle(x, y, 20);
        
        this.scene.tweens.add({
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
    
    createPoisonEffect(x, y) {
        const effect = this.scene.add.graphics();
        effect.fillStyle(0x00FF00, 0.3);
        effect.fillCircle(x, y, 15);
        
        this.scene.tweens.add({
            targets: effect,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                effect.destroy();
            }
        });
    }
    
    createHealEffect(x, y) {
        const effect = this.scene.add.graphics();
        effect.fillStyle(0xFFFFFF, 0.8);
        effect.fillCircle(x, y, 25);
        
        this.scene.tweens.add({
            targets: effect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                effect.destroy();
            }
        });
    }
    
    createLavaEffect(x, y, stack) {
        const effect = this.scene.add.graphics();
        const intensity = Math.min(stack / this.maxLavaStack, 1);
        const color = Phaser.Display.Color.InterpolateColorWithColor(
            { r: 255, g: 69, b: 0 },
            { r: 255, g: 0, b: 0 },
            100,
            intensity * 100
        );
        
        effect.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.7);
        effect.fillCircle(x, y, 10 + stack * 2);
        
        this.scene.tweens.add({
            targets: effect,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                effect.destroy();
            }
        });
    }
    
    createLandingEffect() {
        const effect = this.scene.add.graphics();
        effect.fillStyle(this.color, 0.5);
        effect.fillCircle(this.x, this.y, this.radius * 2);
        
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
    
    cleanupAttackLines() {
        this.attackLines = this.attackLines.filter(line => {
            if (line.alpha <= 0) {
                line.destroy();
                return false;
            }
            return true;
        });
        
        // 清理过期毒迹
        const now = Date.now();
        this.poisonTrail = this.poisonTrail.filter(trail => {
            return now - trail.time < trail.duration;
        });
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        this.updateHealthBar();
        
        // 受击特效
        this.createHitEffect();
    }
    
    createHitEffect() {
        this.sprite.setTint(0xFF0000);
        this.scene.time.delayedCall(100, () => {
            this.updateColor();
        });
    }
    
    onCollision() {
        if (this.state === 'launching') {
            this.bounces++;
            
            // 刺客类型特殊处理：碰撞3次后自行销毁
            if (this.type === 'assassin' && this.bounces >= 3) {
                this.die();
            }
        }
    }
    
    die() {
        this.state = 'dead';
        
        // 破碎特效
        this.createShatterEffect();
        
        // 清理毒伤计时器
        if (this.poisonTimer) {
            clearInterval(this.poisonTimer);
            this.poisonTimer = null;
        }
        
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
        
        // 清理攻击线
        this.attackLines.forEach(line => line.destroy());
        this.attackLines = [];
    }
    
    createShatterEffect() {
        // 创建破碎粒子效果
        const particleCount = 12;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;
            const size = 3 + Math.random() * 4;
            
            const particle = this.scene.add.graphics();
            particle.fillStyle(this.color, 0.8);
            particle.fillCircle(0, 0, size);
            
            particle.x = this.x;
            particle.y = this.y;
            
            particles.push(particle);
            
            // 粒子飞散动画
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * speed * 20,
                y: this.y + Math.sin(angle) * speed * 20,
                scaleX: 0.1,
                scaleY: 0.1,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        // 中心爆炸效果
        const explosion = this.scene.add.graphics();
        explosion.fillStyle(this.color, 0.6);
        explosion.fillCircle(this.x, this.y, this.radius * 2);
        
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // 环形血条破碎效果
        if (this.healthRing) {
            const ringShatter = this.scene.add.graphics();
            ringShatter.lineStyle(3, 0x333333, 0.8);
            ringShatter.beginPath();
            ringShatter.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ringShatter.strokePath();
            
            this.scene.tweens.add({
                targets: ringShatter,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 300,
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
