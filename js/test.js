// 最简单的测试
console.log('Test script loaded');

window.onload = function() {
    console.log('Window loaded');
    
    // 直接在canvas上画东西
    const canvas = document.getElementById('game');
    if (canvas) {
        console.log('Canvas found:', canvas);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            console.log('Context found');
            
            // 画红色矩形
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(100, 100, 200, 200);
            
            // 画蓝色圆形
            ctx.fillStyle = '#0000FF';
            ctx.beginPath();
            ctx.arc(400, 300, 50, 0, Math.PI * 2);
            ctx.fill();
            
            console.log('Drew test shapes');
        } else {
            console.log('No context');
        }
    } else {
        console.log('No canvas found');
    }
};
