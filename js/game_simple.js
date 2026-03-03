// 简化版游戏 - 只用基础图形
class SimpleGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SimpleGame' });
    }
    
    preload() {
        console.log('Simple game loading...');
    }
    
    create() {
        console.log('Creating simple game...');
        
        // 游戏尺寸
        this.width = 800;
        this.height = 900;
        
        // 背景
        this.add.rectangle(400, 450, 800, 900, 0x252526);
        
        // 深蓝色边框
        this.add.rectangle(400, 450, 796, 896, 0x000000).setStrokeStyle(3, 0x1e3c72);
        
        // 传送门 (紫色)
        this.portal = this.add.circle(400, 80, 30, 0x9400D3);
        
        // 城墙 (棕色)
        this.castle = this.add.rectangle(400, 850, 600, 40, 0x8B4513);
        this.castleHealth = 100;
        
        // 国王 (蓝色)
        this.king = this.add.rectangle(400, 780, 40, 40, 0x0000FF);
        
        // 佣兵选择按钮
        this.createSoldierButtons();
        
        // 测试文字
        this.add.text(400, 200, 'SIMPLE GAME', {
            fontSize: '48px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        
        // 鼠标控制
        this.input.on('pointerdown', this.handleClick, this);
        
        console.log('Simple game created!');
    }
    
    createSoldierButtons() {
        const buttonY = 700;
        const buttonSize = 50;
        const spacing = 70;
        const startX = 400 - (spacing * 2);
        
        // 5个佣兵按钮
        const colors = [0x00FF00, 0x0000FF, 0xFF00FF, 0xFFFFFF, 0xFFA500];
        const names = ['弓箭手', '重装兵', '刺客', '治疗师', '法师'];
        
        this.soldierButtons = [];
        
        for (let i = 0; i < 5; i++) {
            const x = startX + i * spacing;
            const button = this.add.rectangle(x, buttonY, buttonSize, buttonSize, colors[i]);
            button.setInteractive();
            button.on('pointerdown', () => this.selectSoldier(i));
            
            const text = this.add.text(x, buttonY + 35, names[i], {
                fontSize: '12px',
                color: '#FFFFFF'
            }).setOrigin(0.5);
            
            this.soldierButtons.push({ button, text, type: i });
        }
        
        this.selectedSoldier = 0;
    }
    
    selectSoldier(type) {
        this.selectedSoldier = type;
        console.log('Selected soldier type:', type);
    }
    
    handleClick(pointer) {
        const x = pointer.x;
        const y = pointer.y;
        
        // 检查是否点击了国王附近
        const distToKing = Phaser.Math.Distance.Between(x, y, 400, 780);
        if (distToKing < 100) {
            this.fireSoldier(x, y);
        }
    }
    
    fireSoldier(targetX, targetY) {
        console.log('Firing soldier to:', targetX, targetY);
        
        // 创建佣兵
        const colors = [0x00FF00, 0x0000FF, 0xFF00FF, 0xFFFFFF, 0xFFA500];
        const soldier = this.add.circle(400, 780, 15, colors[this.selectedSoldier]);
        
        // 计算速度
        const angle = Phaser.Math.Angle.Between(400, 780, targetX, targetY);
        const speed = 10;
        
        soldier.vx = Math.cos(angle) * speed;
        soldier.vy = Math.sin(angle) * speed;
        soldier.health = 50;
        
        // 更新循环
        this.physics.add.existing(soldier);
        soldier.body.setVelocity(soldier.vx, soldier.vy);
        
        console.log('Soldier fired!');
    }
    
    update() {
        // 简单的物理更新
        // 这里可以添加碰撞检测等
    }
}

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 900,
    parent: 'game',
    backgroundColor: '#252526',
    scene: SimpleGame
};

// 创建游戏
const game = new Phaser.Game(config);
