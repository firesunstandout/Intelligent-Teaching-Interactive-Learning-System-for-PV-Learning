// State Management
const timelineSteps = (typeof siteData !== 'undefined' && siteData.animations && siteData.animations.steps)
    ? siteData.animations.steps
    : [];

const state = {
    currentSection: 'home',
    animationPhase: 0,
    isAnimating: false,
    animationFrameId: null,
    particles: [],
    timelineSteps,
    elapsed: 0,
    prevTime: null,
    loopCount: 0,
    fieldPulse: 0,
    userProgress: {
        cardsViewed: new Set(),
        questionsAnswered: 0,
        score: 0,
        wrongAnswers: []
    },
    qaHistory: JSON.parse(localStorage.getItem('pv_qa_history') || '[]'),
    quizHistory: JSON.parse(localStorage.getItem('pv_quiz_history') || '[]')
};

// DOM Elements
const navLinks = document.querySelectorAll('nav a');
const sections = document.querySelectorAll('section');
const canvas = document.getElementById('pv-canvas');
const ctx = canvas.getContext('2d');
const animationInfo = document.getElementById('animation-info');
const stepIndicators = document.getElementById('step-indicators');
const CANVAS_BASE = { width: 800, height: 560 };

// ============ 明亮风格布局设计 ============
// 太阳位置 - 左上角
const sunConfig = {
    x: 90,
    y: 70,
    radius: 45,
    rayCount: 12
};

// PN结几何 - 增大10%，长度更长，N/P层高度一致
const pnGeometry = {
    left: 160,              // 更靠左，增加长度
    right: 540,             // 更靠右，增加长度
    glassTop: 175,
    glassHeight: 14,
    nLayerTop: 193,
    nLayerHeight: 50,       // N-layer height
    depletionTop: 251,
    depletionHeight: 40,
    pLayerTop: 299,
    pLayerHeight: 50        // P-layer height matches N-layer
};
pnGeometry.nLayerY = pnGeometry.nLayerTop + pnGeometry.nLayerHeight / 2;
pnGeometry.pLayerY = pnGeometry.pLayerTop + pnGeometry.pLayerHeight / 2;
pnGeometry.centerX = (pnGeometry.left + pnGeometry.right) / 2;

// 电路几何 - 匹配新PN结尺寸
const circuitGeometry = {
    topBusX: 620,
    bulbX: 660,
    bulbTopY: 260,
    bulbMidY: 330,
    bulbBottomY: 400,
    bottomWireY: 490,
    leftBottomX: 100,
    leftRiseY: 390
};

// 电场强度追踪 - 动态变化
const fieldStrength = {
    current: 0,
    target: 0,
    max: 100,
    activeElectrons: 0,
    smoothFactor: 0.08  // Smoothing factor
};

// 明亮配色方案 - 与网站整体风格一致
const colorScheme = {
    // 背景 - 明亮渐变
    bgTop: '#e8f4fc',
    bgBottom: '#f5faff',
    skyBlue: '#87ceeb',
    
    // PN结 - 清新科技色
    nType: '#64b5f6',           // Fresh blue
    nTypeLight: '#90caf9',
    nTypeDark: '#1976d2',
    pType: '#ce93d8',           // Light purple
    pTypeLight: '#e1bee7',
    pTypeDark: '#7b1fa2',
    depletion: 'rgba(200, 220, 240, 0.6)',
    depletionActive: 'rgba(33, 150, 243, 0.3)',
    
    // 模块边框
    frameDark: '#1565c0',
    frameLight: '#42a5f5',
    
    // 电路
    wire: '#78909c',
    wireActive: '#29b6f6',
    wireGlow: '#4fc3f7',
    
    // 粒子
    photon: '#ffc107',
    photonGlow: '#ffecb3',
    electron: '#1e88e5',
    electronGlow: '#64b5f6',
    hole: '#ef5350',
    holeGlow: '#ef9a9a',
    
    // 灯泡
    bulbOff: 'rgba(200, 200, 200, 0.4)',
    bulbOn: '#ffca28',
    bulbGlow: '#fff8e1',
    
    // 文字
    textPrimary: '#1a237e',
    textSecondary: '#5c6bc0',
    textLight: '#9fa8da'
};

let timelineStepEls = [];

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initKnowledgeCards();
    initQA();
    initPractice();
    initExperiment();
    initExperiment2(); // Second experiment
    initKnowledgeGraph(); // Knowledge Graph
    initRanking();
    updateProgress();
    initAnimationDecor();
    setupCanvas();
    updateAnimationUI();
    window.addEventListener('resize', () => {
        setupCanvas();
        drawScene();
    });

    // Setup animation controls
    document.getElementById('play-btn').addEventListener('click', toggleAnimation);
    document.getElementById('reset-btn').addEventListener('click', resetAnimation);

    // Initial draw
    drawScene();
});

// --- Navigation ---
function initNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            navigateTo(targetId);
        });
    });
}

function navigateTo(targetId) {
    state.currentSection = targetId;
    sections.forEach(sec => sec.classList.remove('active-section'));
    document.getElementById(targetId).classList.add('active-section');

    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-target') === targetId);
    });

    if (targetId === 'animation') {
        // 延迟执行确保 DOM 已更新，容器已经有正确尺寸
        requestAnimationFrame(() => {
            setupCanvas();
            resetAnimation();
            drawScene();
        });
    } else {
        stopAnimation();
    }
}

function toggleAnimation() {
    if (state.isAnimating) {
        stopAnimation();
    } else {
        startAnimation();
    }
}

function startAnimation() {
    if (state.isAnimating) return;
    state.isAnimating = true;
    state.animationPhase = 0;
    state.particles = [];
    state.loopCount = 0;
    state.fieldPulse = 0;
    state.elapsed = 0;
    state.prevTime = null;
    updateAnimationUI();
    drawScene();
    state.animationFrameId = requestAnimationFrame(loop);
}

function stopAnimation() {
    state.isAnimating = false;
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
    state.prevTime = null;
}

function setupCanvas() {
    const container = canvas.parentElement;
    if (!container) {
        console.warn('Canvas container not found');
        return;
    }
    
    // 获取容器实际尺寸
    const rect = container.getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;
    
    // 如果容器尺寸为0，使用备用尺寸
    if (width <= 0 || height <= 0) {
        width = container.offsetWidth || 800;
        height = container.offsetHeight || 560;
    }
    
    // 如果仍然为0，延迟重试
    if (width <= 0 || height <= 0) {
        console.warn('Canvas container has no size, retrying...');
        requestAnimationFrame(() => {
            setupCanvas();
            drawScene();
        });
        return;
    }
    
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas display size
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Set canvas internal resolution
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    
    // 重置变换矩阵
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // 计算缩放比例，将 800x560 逻辑坐标映射到实际像素
    const scaleX = (width * dpr) / CANVAS_BASE.width;
    const scaleY = (height * dpr) / CANVAS_BASE.height;
    
    // 应用缩放
    ctx.scale(scaleX, scaleY);
    
    console.log(`Canvas setup: ${width}x${height} @ ${dpr}x DPR, scale: ${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`);
}

function resetAnimation() {
    stopAnimation();
    state.animationPhase = 0;
    state.particles = [];
    state.loopCount = 0;
    state.fieldPulse = 0;
    state.elapsed = 0;
    state.prevTime = null;
    drawScene();
    updateAnimationUI();
}

function initAnimationDecor() {
    buildTimeline();
    highlightTimeline(state.animationPhase);
}

function buildTimeline() {
    if (!stepIndicators) return;
    stepIndicators.innerHTML = '';
    state.timelineSteps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'timeline-step';
        stepEl.innerHTML = `
            <span class="step-index">0${index + 1}</span>
            <strong>${step.label}</strong>
            <p>${step.info}</p>
        `;
        stepIndicators.appendChild(stepEl);
    });

    timelineStepEls = Array.from(stepIndicators.children);
    highlightTimeline(0);
}

function highlightTimeline(activeIndex) {
    timelineStepEls.forEach((el, idx) => {
        el.classList.toggle('active', idx === activeIndex);
        el.classList.toggle('completed', idx < activeIndex);
    });
}

function updateAnimationUI() {
    const steps = state.timelineSteps;
    const infoObj = steps[state.animationPhase] || steps[0] || {
        label: "Ready",
        info: "Click play to start..."
    };
    if (state.isAnimating) {
        animationInfo.innerHTML = `<strong>Playing:</strong> ${infoObj.info}`;
    } else {
        animationInfo.textContent = infoObj.info;
    }
    highlightTimeline(state.animationPhase);
}

function updatePhaseByElapsed() {
    const steps = state.timelineSteps;
    if (!steps.length) return;
    for (let i = steps.length - 1; i >= 0; i--) {
        if (state.elapsed >= steps[i].time) {
            if (state.animationPhase !== i) {
                state.animationPhase = i;
                updateAnimationUI();
            }
            return;
        }
    }
}

// High-Fidelity Particle System
class Particle {
    constructor(type, x, y, targetX, targetY) {
        this.type = type; // 'photon', 'electron', 'hole', 'flash'
        this.x = x;
        this.y = y;
        this.tx = targetX;
        this.ty = targetY;
        this.speed = type === 'photon' ? 6 : 3;
        this.life = type === 'electron' ? 800 : type === 'hole' ? 160 : 100;
        this.trail = []; // For motion blur effect (photons only)

        if (type === 'photon') {
            const dx = targetX - x;
            const dy = targetY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        } else if (type === 'flash') {
            this.radius = 1;
            this.alpha = 1.0;
            this.life = 20; // Short life for flash
        } else if (type === 'electron') {
            this.startX = x;
            this.startY = y;
            this.path = buildElectronPath(x, y);
            this.pathIndex = 0;
        }
    }

    update() {
        this.life -= 0.5;

        if (this.type === 'photon') {
            // Update trail only for photons
            if (this.trail.length > 5) this.trail.shift();
            this.trail.push({ x: this.x, y: this.y });

            this.x += this.vx;
            this.y += this.vy;

            // Check collision
            if (this.y >= this.ty) {
                spawnPair(this.x, this.y);
                this.life = 0; // Remove photon immediately
            }
        } else if (this.type === 'flash') {
            this.radius += 1.5;
            this.alpha -= 0.05;
            if (this.alpha <= 0) this.life = 0;
        } else if (this.type === 'electron') {
            const target = this.path[this.pathIndex];
            if (!target) {
                this.life = 0;
                state.loopCount++;
                return;
            }

            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = target.speed || 3;

            if (dist <= speed) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
                if (this.pathIndex >= this.path.length) {
                    this.life = 0;
                    state.loopCount++;
                }
            } else {
                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;
            }
        } else if (this.type === 'hole') {
            // Holes move downward to P-contact
            this.y += 1.2;
            if (this.y > pnGeometry.pLayerTop + pnGeometry.pLayerHeight) {
                this.life = 0;
            }
        }
    }

    draw(ctx) {
        // 光子拖尾效果
        if (this.type === 'photon') {
            if (this.trail.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                this.trail.forEach((p, i) => {
                    if (i === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                });
                ctx.stroke();
            }
        }

        ctx.beginPath();
        if (this.type === 'photon') {
            // 光子 - 金黄色发光粒子
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = colorScheme.photonGlow;
            ctx.fillStyle = colorScheme.photon;
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (this.type === 'flash') {
            // 吸收闪光 - 青色
            ctx.fillStyle = `rgba(0, 230, 255, ${this.alpha * 0.8})`;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'electron') {
            // 电子 - 蓝色发光粒子
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = colorScheme.electronGlow;
            ctx.fillStyle = colorScheme.electron;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
            // 负电荷标记
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x - 2.5, this.y - 0.5, 5, 1);
            ctx.restore();
        } else if (this.type === 'hole') {
            // 空穴 - 橙色空心圆
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = colorScheme.holeGlow;
            // 空穴 - 只画空心圆，不是正电子
            ctx.strokeStyle = colorScheme.hole;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.stroke();
            // 空穴内部浅色填充
            ctx.fillStyle = 'rgba(239, 83, 80, 0.2)';
            ctx.fill();
            ctx.restore();
        }
    }
}

function spawnPair(x, y) {
    state.particles.push(new Particle('electron', x, y));
    state.particles.push(new Particle('hole', x, y));
    state.particles.push(new Particle('flash', x, y)); // Add absorption flash
    state.fieldPulse = 1;
}

function buildElectronPath(startX, startY) {
    // 使用恒定速度确保匀速运动
    const WIRE_SPEED = 3;      // Speed along the wire
    const BULB_SPEED = 1.8;    // Slow down through the bulb
    
    const path = [
        // 从碰撞点上升到 N 层
        { x: startX, y: pnGeometry.nLayerY, speed: WIRE_SPEED },
        // 沿 N 层向右到金属接触
        { x: pnGeometry.right + 4, y: pnGeometry.nLayerY, speed: WIRE_SPEED },
        // 向右到顶部汇流条
        { x: circuitGeometry.topBusX, y: pnGeometry.nLayerY, speed: WIRE_SPEED },
        // 向下到灯泡入口
        { x: circuitGeometry.topBusX, y: circuitGeometry.bulbTopY, speed: WIRE_SPEED },
        // 进入灯泡
        { x: circuitGeometry.bulbX, y: circuitGeometry.bulbTopY, speed: WIRE_SPEED },
        // 通过灯泡（减速）
        { x: circuitGeometry.bulbX, y: circuitGeometry.bulbMidY, speed: BULB_SPEED },
        { x: circuitGeometry.bulbX, y: circuitGeometry.bulbBottomY, speed: BULB_SPEED },
        // 向下到底部导线
        { x: circuitGeometry.bulbX, y: circuitGeometry.bottomWireY, speed: WIRE_SPEED },
        // 沿底部向左
        { x: circuitGeometry.leftBottomX, y: circuitGeometry.bottomWireY, speed: WIRE_SPEED },
        // 向上
        { x: circuitGeometry.leftBottomX, y: circuitGeometry.leftRiseY, speed: WIRE_SPEED },
        // 向右到 PN 结左侧
        { x: pnGeometry.left - 4, y: circuitGeometry.leftRiseY, speed: WIRE_SPEED },
        // 向下进入 P 层
        { x: pnGeometry.left - 4, y: pnGeometry.pLayerY, speed: WIRE_SPEED }
    ];
    return path;
}

function loop(timestamp) {
    if (!state.isAnimating) return;
    if (!state.prevTime) state.prevTime = timestamp;
    const delta = Math.min(0.05, (timestamp - state.prevTime) / 1000 || 0.016);
    state.prevTime = timestamp;
    state.elapsed += delta;

    // 光子生成（从太阳位置发出）
    const spawnChance = 0.38 * (delta / 0.016);
    if (Math.random() < spawnChance) {
        // 目标位置在 PN 结的 N 层到耗尽层区域
        const targetX = pnGeometry.left + 15 + Math.random() * ((pnGeometry.right - pnGeometry.left) - 30);
        const targetY = pnGeometry.nLayerTop + 3 + Math.random() * (pnGeometry.depletionTop - pnGeometry.nLayerTop - 6);
        
        // 光子从太阳位置发出（左上角）
        const startX = sunConfig.x + (Math.random() - 0.3) * sunConfig.radius * 0.8;
        const startY = sunConfig.y + (Math.random() - 0.3) * sunConfig.radius * 0.8;
        
        state.particles.push(new Particle('photon', startX, startY, targetX, targetY));
    }

    state.fieldPulse = Math.max(0, state.fieldPulse - delta * 0.5);

    state.particles.forEach(p => p.update());
    state.particles = state.particles.filter(p => p.life > 0 && p.x > -50 && p.x < 850 && p.y < 620);

    updatePhaseByElapsed();
    drawScene();
    state.animationFrameId = requestAnimationFrame(loop);
}

function drawScene() {
    // Clear with transform reset
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 更新电场强度（基于活跃电子数量，动态波动）
    fieldStrength.activeElectrons = state.particles.filter(p => p.type === 'electron').length;
    
    // 目标值基于电子数量，但有随机波动
    const baseStrength = Math.min(95, fieldStrength.activeElectrons * 6);
    const fluctuation = Math.sin(state.elapsed * 2) * 8 + Math.sin(state.elapsed * 5) * 4;
    fieldStrength.target = Math.max(0, Math.min(fieldStrength.max, baseStrength + fluctuation));
    
    // 平滑过渡到目标值
    fieldStrength.current += (fieldStrength.target - fieldStrength.current) * fieldStrength.smoothFactor;

    // ============ 1. 明亮背景 ============
    // 天空渐变
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_BASE.height);
    bgGrad.addColorStop(0, '#b3e5fc');
    bgGrad.addColorStop(0.4, '#e1f5fe');
    bgGrad.addColorStop(0.7, '#f5faff');
    bgGrad.addColorStop(1, '#e8f5e9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_BASE.width, CANVAS_BASE.height);
    
    // 淡色装饰云朵
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    drawCloud(ctx, 550, 50, 40);
    drawCloud(ctx, 650, 90, 30);
    drawCloud(ctx, 300, 70, 25);

    // ============ 2. 太阳（左上角）============
    const sunX = sunConfig.x;
    const sunY = sunConfig.y;
    const sunRadius = sunConfig.radius;
    
    // 外层光晕
    const outerGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.5);
    outerGlow.addColorStop(0, 'rgba(255, 236, 179, 0.8)');
    outerGlow.addColorStop(0.4, 'rgba(255, 224, 130, 0.4)');
    outerGlow.addColorStop(0.7, 'rgba(255, 213, 79, 0.15)');
    outerGlow.addColorStop(1, 'rgba(255, 193, 7, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 太阳主体
    const sunGrad = ctx.createRadialGradient(sunX - 5, sunY - 5, 0, sunX, sunY, sunRadius);
    sunGrad.addColorStop(0, '#fffde7');
    sunGrad.addColorStop(0.3, '#fff59d');
    sunGrad.addColorStop(0.6, '#ffee58');
    sunGrad.addColorStop(0.85, '#ffc107');
    sunGrad.addColorStop(1, '#ff9800');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 动态光芒
    ctx.save();
    for (let i = 0; i < sunConfig.rayCount; i++) {
        const angle = (i / sunConfig.rayCount) * Math.PI * 2 + state.elapsed * 0.12;
        const pulseOffset = Math.sin(state.elapsed * 2.5 + i * 0.6) * 6;
        const innerR = sunRadius + 2;
        const outerR = sunRadius + 18 + pulseOffset;
        
        ctx.strokeStyle = `rgba(255, 193, 7, ${0.6 - i * 0.03})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(angle) * innerR, sunY + Math.sin(angle) * innerR);
        ctx.lineTo(sunX + Math.cos(angle) * outerR, sunY + Math.sin(angle) * outerR);
        ctx.stroke();
    }
    ctx.restore();

    // ============ 3. PN 结模块（明亮精致风格）============
    const cellWidth = pnGeometry.right - pnGeometry.left;
    const moduleTop = pnGeometry.glassTop - 12;
    const moduleBottom = pnGeometry.pLayerTop + pnGeometry.pLayerHeight + 12;
    const moduleHeight = moduleBottom - moduleTop;

    // 外框阴影
    ctx.save();
    ctx.shadowColor = 'rgba(21, 101, 192, 0.25)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 5;
    
    // 边框（蓝色渐变）
    const frameGrad = ctx.createLinearGradient(pnGeometry.left - 15, moduleTop, pnGeometry.right + 15, moduleBottom);
    frameGrad.addColorStop(0, colorScheme.frameDark);
    frameGrad.addColorStop(0.5, colorScheme.frameLight);
    frameGrad.addColorStop(1, colorScheme.frameDark);
    ctx.fillStyle = frameGrad;
    
    const frameRadius = 10;
    ctx.beginPath();
    ctx.roundRect(pnGeometry.left - 15, moduleTop - 8, cellWidth + 30, moduleHeight + 16, frameRadius);
    ctx.fill();
    ctx.restore();
    
    // 内部白色背景
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(pnGeometry.left - 6, moduleTop + 2, cellWidth + 12, moduleHeight - 4, 6);
    ctx.fill();

    // 玻璃盖板
    const glassGrad = ctx.createLinearGradient(pnGeometry.left, pnGeometry.glassTop, pnGeometry.right, pnGeometry.glassTop + pnGeometry.glassHeight);
    glassGrad.addColorStop(0, 'rgba(227, 242, 253, 0.9)');
    glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
    glassGrad.addColorStop(1, 'rgba(227, 242, 253, 0.9)');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(pnGeometry.left, pnGeometry.glassTop, cellWidth, pnGeometry.glassHeight);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pnGeometry.left, pnGeometry.glassTop, cellWidth, pnGeometry.glassHeight);

    // N-Type layer
    const nGrad = ctx.createLinearGradient(0, pnGeometry.nLayerTop, 0, pnGeometry.nLayerTop + pnGeometry.nLayerHeight);
    nGrad.addColorStop(0, colorScheme.nTypeLight);
    nGrad.addColorStop(1, colorScheme.nType);
    ctx.fillStyle = nGrad;
    ctx.fillRect(pnGeometry.left, pnGeometry.nLayerTop, cellWidth, pnGeometry.nLayerHeight);
    
    drawLatticePattern(ctx, pnGeometry.left, pnGeometry.nLayerTop, cellWidth, pnGeometry.nLayerHeight, 'rgba(255,255,255,0.35)', 18, 10);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
    ctx.fillText("N-type Semiconductor", pnGeometry.left + 8, pnGeometry.nLayerTop + pnGeometry.nLayerHeight / 2 + 3);

    // Depletion zone with electric-field visualization
    const depletionAlpha = 0.3 + (fieldStrength.current / fieldStrength.max) * 0.4;
    const depGrad = ctx.createLinearGradient(0, pnGeometry.depletionTop, 0, pnGeometry.depletionTop + pnGeometry.depletionHeight);
    depGrad.addColorStop(0, `rgba(179, 229, 252, ${depletionAlpha})`);
    depGrad.addColorStop(0.5, `rgba(129, 212, 250, ${depletionAlpha + 0.1})`);
    depGrad.addColorStop(1, `rgba(179, 229, 252, ${depletionAlpha})`);
    ctx.fillStyle = depGrad;
    ctx.fillRect(pnGeometry.left, pnGeometry.depletionTop, cellWidth, pnGeometry.depletionHeight);
    
    // 电场强度脉冲效果
    if (fieldStrength.current > 10 || state.fieldPulse > 0.05) {
        ctx.save();
        const pulseIntensity = Math.max(state.fieldPulse * 0.5, fieldStrength.current / fieldStrength.max * 0.3);
        const shimmer = ctx.createLinearGradient(pnGeometry.left, 0, pnGeometry.right, 0);
        const shimmerPos = (Math.sin(state.elapsed * 4) + 1) / 2;
        shimmer.addColorStop(0, `rgba(33, 150, 243, 0)`);
        shimmer.addColorStop(Math.max(0, shimmerPos - 0.2), `rgba(33, 150, 243, 0)`);
        shimmer.addColorStop(shimmerPos, `rgba(33, 150, 243, ${pulseIntensity})`);
        shimmer.addColorStop(Math.min(1, shimmerPos + 0.2), `rgba(33, 150, 243, 0)`);
        shimmer.addColorStop(1, `rgba(33, 150, 243, 0)`);
        ctx.fillStyle = shimmer;
        ctx.fillRect(pnGeometry.left, pnGeometry.depletionTop, cellWidth, pnGeometry.depletionHeight);
        ctx.restore();
    }

    // 电场箭头（强度随电子数量变化）
    const arrowAlpha = 0.3 + (fieldStrength.current / fieldStrength.max) * 0.5;
    ctx.strokeStyle = `rgba(25, 118, 210, ${arrowAlpha})`;
    ctx.lineWidth = 1 + (fieldStrength.current / fieldStrength.max) * 0.5;
    const arrowSpacing = 30;
    for (let x = pnGeometry.left + 25; x < pnGeometry.right - 15; x += arrowSpacing) {
        drawArrow(ctx, x, pnGeometry.depletionTop + 6, x, pnGeometry.depletionTop + pnGeometry.depletionHeight - 6, ctx.lineWidth);
    }

    // P-Type layer
    const pGrad = ctx.createLinearGradient(0, pnGeometry.pLayerTop, 0, pnGeometry.pLayerTop + pnGeometry.pLayerHeight);
    pGrad.addColorStop(0, colorScheme.pType);
    pGrad.addColorStop(1, colorScheme.pTypeLight);
    ctx.fillStyle = pGrad;
    ctx.fillRect(pnGeometry.left, pnGeometry.pLayerTop, cellWidth, pnGeometry.pLayerHeight);
    
    drawLatticePattern(ctx, pnGeometry.left, pnGeometry.pLayerTop, cellWidth, pnGeometry.pLayerHeight, 'rgba(255,255,255,0.25)', 20, 12);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
    ctx.fillText("P-type Semiconductor", pnGeometry.left + 8, pnGeometry.pLayerTop + 16);

    // 金属接触
    ctx.fillStyle = '#78909c';
    ctx.fillRect(pnGeometry.right - 2, pnGeometry.nLayerTop - 3, 8, pnGeometry.nLayerHeight + 15);
    ctx.fillRect(pnGeometry.left - 8, pnGeometry.pLayerTop - 3, 8, pnGeometry.pLayerHeight + 10);
    
    // ============ 电场强度指示器 ============
    const indicatorX = pnGeometry.right + 30;
    const indicatorY = pnGeometry.depletionTop - 20;
    const indicatorWidth = 60;
    const indicatorHeight = pnGeometry.depletionHeight + 40;
    
    // 指示器背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 标题
    ctx.fillStyle = colorScheme.textPrimary;
    ctx.font = 'bold 9px "Noto Sans SC", sans-serif';
    ctx.fillText("Field Strength", indicatorX + 8, indicatorY + 14);
    
    // 电场强度条
    const barX = indicatorX + 10;
    const barY = indicatorY + 22;
    const barWidth = 12;
    const barHeight = indicatorHeight - 35;
    
    // 条形背景
    ctx.fillStyle = '#e3f2fd';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 3);
    ctx.fill();
    
    // 填充部分（根据电场强度）
    const fillHeight = (fieldStrength.current / fieldStrength.max) * barHeight;
    if (fillHeight > 0) {
        const fillGrad = ctx.createLinearGradient(0, barY + barHeight, 0, barY + barHeight - fillHeight);
        fillGrad.addColorStop(0, '#4caf50');
        fillGrad.addColorStop(0.5, '#8bc34a');
        fillGrad.addColorStop(1, '#cddc39');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight, 3);
        ctx.fill();
    }
    
    // 数值显示
    ctx.fillStyle = colorScheme.textPrimary;
    ctx.font = 'bold 10px "Noto Sans SC", sans-serif';
    ctx.fillText(`${Math.round(fieldStrength.current)}%`, barX + 18, barY + barHeight / 2 + 3);
    
    // 电子计数
    ctx.fillStyle = colorScheme.textSecondary;
    ctx.font = '8px "Noto Sans SC", sans-serif';
    ctx.fillText(`e⁻: ${fieldStrength.activeElectrons}`, indicatorX + 8, indicatorY + indicatorHeight - 8);

    // ============ 4. 电路（加宽导线）============
    const rightContactX = pnGeometry.right + 4;
    const leftContactX = pnGeometry.left - 4;
    
    // 电路主线 - 宽度加倍
    ctx.beginPath();
    ctx.strokeStyle = colorScheme.wire;
    ctx.lineWidth = 6;  // Increased from 3 to 6
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.moveTo(rightContactX, pnGeometry.nLayerY);
    ctx.lineTo(circuitGeometry.topBusX, pnGeometry.nLayerY);
    ctx.lineTo(circuitGeometry.topBusX, circuitGeometry.bulbTopY);
    ctx.lineTo(circuitGeometry.bulbX, circuitGeometry.bulbTopY);
    ctx.lineTo(circuitGeometry.bulbX, circuitGeometry.bottomWireY);
    ctx.lineTo(circuitGeometry.leftBottomX, circuitGeometry.bottomWireY);
    ctx.lineTo(circuitGeometry.leftBottomX, circuitGeometry.leftRiseY);
    ctx.lineTo(leftContactX, circuitGeometry.leftRiseY);
    ctx.lineTo(leftContactX, pnGeometry.pLayerY);
    ctx.stroke();

    // 电流流动效果 - 宽度加倍
    if (state.loopCount > 0 || fieldStrength.current > 10) {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 5;  // Increased from 2.5 to 5
        ctx.lineCap = 'round';
        ctx.strokeStyle = colorScheme.wireActive;
        ctx.setLineDash([18, 14]);
        ctx.lineDashOffset = -(state.elapsed * 100);
        
        ctx.moveTo(rightContactX, pnGeometry.nLayerY);
        ctx.lineTo(circuitGeometry.topBusX, pnGeometry.nLayerY);
        ctx.lineTo(circuitGeometry.topBusX, circuitGeometry.bulbTopY);
        ctx.lineTo(circuitGeometry.bulbX, circuitGeometry.bulbTopY);
        ctx.lineTo(circuitGeometry.bulbX, circuitGeometry.bottomWireY);
        ctx.lineTo(circuitGeometry.leftBottomX, circuitGeometry.bottomWireY);
        ctx.lineTo(circuitGeometry.leftBottomX, circuitGeometry.leftRiseY);
        ctx.lineTo(leftContactX, circuitGeometry.leftRiseY);
        ctx.lineTo(leftContactX, pnGeometry.pLayerY);
        ctx.stroke();
        ctx.restore();
    }

    // ============ 5. 灯泡（高级设计）============
    const bulbX = circuitGeometry.bulbX;
    const bulbY = circuitGeometry.bulbMidY;

    // 检测是否有电流通过灯泡
    const hasCurrent = state.particles.some(p =>
        p.type === 'electron' &&
        p.x >= circuitGeometry.bulbX - 20 && p.x <= circuitGeometry.bulbX + 20 &&
        p.y >= circuitGeometry.bulbTopY && p.y <= circuitGeometry.bulbBottomY + 30
    );

    const bulbRadius = 22;
    
    // 外部光晕（发光时）
    if (hasCurrent) {
        ctx.save();
        const glowGrad = ctx.createRadialGradient(bulbX, bulbY, 0, bulbX, bulbY, bulbRadius * 2.2);
        glowGrad.addColorStop(0, 'rgba(255, 236, 179, 0.7)');
        glowGrad.addColorStop(0.4, 'rgba(255, 213, 79, 0.35)');
        glowGrad.addColorStop(0.7, 'rgba(255, 193, 7, 0.1)');
        glowGrad.addColorStop(1, 'rgba(255, 193, 7, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, bulbRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 灯泡玻璃罩
    ctx.beginPath();
    ctx.arc(bulbX, bulbY, bulbRadius, 0, Math.PI * 2);
    
    if (hasCurrent) {
        const bulbGrad = ctx.createRadialGradient(bulbX, bulbY - 3, 0, bulbX, bulbY, bulbRadius);
        bulbGrad.addColorStop(0, '#ffffff');
        bulbGrad.addColorStop(0.25, '#fffde7');
        bulbGrad.addColorStop(0.5, '#fff9c4');
        bulbGrad.addColorStop(0.8, '#ffee58');
        bulbGrad.addColorStop(1, '#ffc107');
        ctx.fillStyle = bulbGrad;
    } else {
        ctx.fillStyle = 'rgba(236, 239, 241, 0.8)';
    }
    ctx.fill();
    
    // 灯泡边框
    ctx.strokeStyle = hasCurrent ? '#ffc107' : '#b0bec5';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 灯丝
    ctx.beginPath();
    ctx.strokeStyle = hasCurrent ? '#ff9800' : '#90a4ae';
    ctx.lineWidth = hasCurrent ? 2 : 1.5;
    ctx.lineCap = 'round';
    
    ctx.moveTo(bulbX - 6, bulbY + 6);
    ctx.quadraticCurveTo(bulbX - 3, bulbY - 4, bulbX, bulbY + 2);
    ctx.quadraticCurveTo(bulbX + 3, bulbY + 8, bulbX + 6, bulbY - 2);
    ctx.stroke();

    // 灯泡底座
    ctx.fillStyle = '#607d8b';
    ctx.beginPath();
    ctx.roundRect(bulbX - 7, bulbY + bulbRadius - 2, 14, 10, 2);
    ctx.fill();
    
    // 底座条纹
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(bulbX - 5, bulbY + bulbRadius + 1 + i * 3);
        ctx.lineTo(bulbX + 5, bulbY + bulbRadius + 1 + i * 3);
        ctx.stroke();
    }

    // ============ 6. 绘制粒子 ============
    state.particles.forEach(p => p.draw(ctx));
    
    // ============ 7. 标题 ============
    // 标题背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.roundRect(15, 500, 180, 45, 8);
    ctx.fill();
    
    ctx.fillStyle = colorScheme.textPrimary;
    ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
    ctx.fillText("PV Principle Demo", 25, 520);
    
    ctx.fillStyle = colorScheme.textSecondary;
    ctx.font = '10px "Noto Sans SC", sans-serif';
    ctx.fillText("Photovoltaic Effect", 25, 535);
}

// 云朵绘制函数
function drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
}

function drawArrow(ctx, fromX, fromY, toX, toY, width) {
    const headlen = 6;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function drawLatticePattern(ctx, x, y, width, height, color, spacingX, spacingY) {
    ctx.save();
    ctx.fillStyle = color;
    for (let px = x + 8; px < x + width - 8; px += spacingX) {
        for (let py = y + 6; py < y + height - 6; py += spacingY) {
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}


// --- Knowledge Cards ---
function initKnowledgeCards() {
    const container = document.getElementById('cards-container');

    siteData.knowledgeCards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'k-card';
        cardEl.innerHTML = `
            <div class="k-card-header">
                <span>${card.title}</span>
                <span>+</span>
            </div>
            <div class="k-card-body">
                <div class="k-card-img-container">
                    <img src="${card.image}" alt="${card.title}" class="k-card-img-real">
                </div>
                <p><strong>Definition:</strong> ${card.definition}</p>
                <ul>
                    ${card.keyPoints.map(p => `<li>${p}</li>`).join('')}
                </ul>
            </div>
        `;

        cardEl.querySelector('.k-card-header').addEventListener('click', () => {
            cardEl.classList.toggle('expanded');
            if (!state.userProgress.cardsViewed.has(card.id)) {
                state.userProgress.cardsViewed.add(card.id);
                updateProgress();
            }
        });
        container.appendChild(cardEl);
    });
}

// --- Q&A ---
function initQA() {
    const recContainer = document.getElementById('recommended-questions');
    recContainer.innerHTML = '';
    siteData.qna.forEach(q => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = q.question;
        tag.onclick = () => handleUserQuestion(q.question);
        recContainer.appendChild(tag);
    });

    const sendBtn = document.getElementById('send-btn');
    // Remove old listener to prevent duplicates if re-run
    const newBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newBtn, sendBtn);

    newBtn.addEventListener('click', sendMessage);

    const input = document.getElementById('user-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        if (input.value.trim()) {
            handleUserQuestion(input.value.trim());
            input.value = '';
        }
    }
}

// --- Practice ---
function initPractice() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';
    siteData.practice.forEach((q, index) => {
        const qEl = document.createElement('div');
        qEl.className = 'question-block';
        qEl.innerHTML = `
            <h4>${index + 1}. ${q.question}</h4>
            <ul class="options" id="q-${index}">
                ${q.options.map((opt, i) => `<li onclick="checkAnswer(${index}, ${i}, this)">${opt}</li>`).join('')}
            </ul>
            <div class="explanation" id="exp-${index}">${q.explanation}</div>
        `;
        container.appendChild(qEl);
    });
}

window.checkAnswer = function (qIndex, optIndex, el) {
    const qData = siteData.practice[qIndex];
    const parent = document.getElementById(`q-${qIndex}`);
    const explanation = document.getElementById(`exp-${qIndex}`);

    if (parent.classList.contains('answered')) return;
    parent.classList.add('answered');

    if (optIndex === qData.correctAnswer) {
        el.classList.add('correct');
        state.userProgress.score += 20; // Changed from 10 to 20 points
    } else {
        el.classList.add('wrong');
        parent.children[qData.correctAnswer].classList.add('correct');
        // Record wrong answer
        state.userProgress.wrongAnswers.push({
            questionId: qIndex,
            question: qData.question,
            studentAnswer: siteData.practice[qIndex].options[optIndex],
            correctAnswer: siteData.practice[qIndex].options[qData.correctAnswer],
            timestamp: new Date().toISOString()
        });
    }

    explanation.style.display = 'block';
    state.userProgress.questionsAnswered++;
    updateProgress();

    // Check if all answered
    if (state.userProgress.questionsAnswered === siteData.practice.length) {
        showResult();
    }
}

function showResult() {
    const resultDiv = document.getElementById('quiz-result');
    const scoreDisplay = document.getElementById('score-display');
    scoreDisplay.textContent = state.userProgress.score;
    resultDiv.classList.remove('hidden');

    // Save quiz result
    saveQuizResult(state.userProgress.score, state.userProgress.wrongAnswers);
}

window.resetQuiz = function () {
    state.userProgress.questionsAnswered = 0;
    state.userProgress.questionsAnswered = 0;
    state.userProgress.score = 0;
    state.userProgress.wrongAnswers = [];
    document.getElementById('quiz-result').classList.add('hidden');
    initPractice();
    updateProgress();
}

// --- Progress ---
function updateProgress() {
    const totalItems = siteData.knowledgeCards.length + siteData.practice.length;
    const completed = state.userProgress.cardsViewed.size + state.userProgress.questionsAnswered;
    const percent = Math.round((completed / totalItems) * 100);
    document.getElementById('progress-percent').textContent = `${percent}%`;
}

// --- Experiment Module ---
function initExperiment() {
    const sliderG = document.getElementById('slider-g');
    const sliderT = document.getElementById('slider-t');
    const valG = document.getElementById('val-g');
    const valT = document.getElementById('val-t');

    function update() {
        const G = parseInt(sliderG.value);
        const T = parseInt(sliderT.value);
        valG.textContent = G;
        valT.textContent = T;
        updateExperiment(G, T);
    }

    sliderG.addEventListener('input', update);
    sliderT.addEventListener('input', update);

    // Initial call
    update();
}

function updateExperiment(G, T) {
    // Simplified PV Model
    // Isc is proportional to G
    // Voc decreases with T
    const Isc_ref = 5; // Amps at 1000 W/m2
    const Voc_ref = 20; // Volts at 25 C
    const G_ref = 1000;
    const T_ref = 25;

    const Isc = Isc_ref * (G / G_ref);
    const Voc = Voc_ref * (1 - 0.003 * (T - T_ref)); // -0.3%/C coeff

    // Calculate Pmax (approximate fill factor)
    const FF = 0.75;
    const Pmax = Isc * Voc * FF;

    // Update Stats
    document.getElementById('res-isc').textContent = Isc.toFixed(2);
    document.getElementById('res-voc').textContent = Voc.toFixed(2);
    document.getElementById('res-pmax').textContent = Pmax.toFixed(2);

    drawIVCurve(Isc, Voc, Pmax);
}

function drawIVCurve(Isc, Voc, Pmax) {
    const canvas = document.getElementById('iv-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, w, h);

    // Axes
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(w - padding, h - padding); // X-axis (Voltage)
    ctx.moveTo(padding, h - padding);
    ctx.lineTo(padding, padding); // Y-axis (Current)
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText('Voltage (V)', w - 80, h - 20);
    ctx.fillText('Current (A)', 10, 30);

    // Plot I-V Curve using Single Diode Model Approximation
    // I = Isc * (1 - (V/Voc)^m) where m is a shape factor (e.g., m ~ 10 for good fill factor)

    const xScale = (w - 2 * padding) / 25; // Max 25V
    const yScale = (h - 2 * padding) / 8; // Max 8A

    ctx.beginPath();
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 3;

    const points = [];
    const steps = 100;
    // Use a simpler power law for visualization: I = Isc * (1 - (V/Voc)^15)
    const powerExp = 15;

    for (let i = 0; i <= steps; i++) {
        const v = (i / steps) * Voc;
        const i_val = Isc * (1 - Math.pow(v / Voc, powerExp));

        const x = padding + v * xScale;
        const y = h - padding - i_val * yScale;
        points.push({ x, y, v, i: i_val });

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Find MPP on this exact curve
    let maxP = 0;
    let mppPoint = points[0];

    points.forEach(p => {
        const power = p.v * p.i;
        if (power > maxP) {
            maxP = power;
            mppPoint = p;
        }
    });

    // Draw MPP Point
    ctx.beginPath();
    ctx.fillStyle = '#FFD700';
    ctx.arc(mppPoint.x, mppPoint.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Add ring around MPP
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.arc(mppPoint.x, mppPoint.y, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`MPP(${maxP.toFixed(1)}W)`, mppPoint.x + 15, mppPoint.y - 15);

    // Update the displayed Pmax to match the curve exactly
    document.getElementById('res-pmax').textContent = maxP.toFixed(2);
}

// --- Ranking Module ---
function initRanking() {
    const tbody = document.getElementById('ranking-body');
    tbody.innerHTML = '';

    // Sort by score desc
    const sortedData = [...siteData.rankingData].sort((a, b) => b.score - a.score);

    sortedData.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.name}</td>
            <td>${student.score}</td>
            <td>${student.badge}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Experiment 2: Angle of Incidence ---
function initExperiment2() {
    const sliderAngle = document.getElementById('slider-angle');
    const sliderG2 = document.getElementById('slider-g2');
    const valAngle = document.getElementById('val-angle');
    const valG2 = document.getElementById('val-g2');

    function update() {
        const angle = parseInt(sliderAngle.value);
        const G = parseInt(sliderG2.value);
        valAngle.textContent = angle;
        valG2.textContent = G;
        updateAngleExperiment(angle, G);
    }

    sliderAngle.addEventListener('input', update);
    sliderG2.addEventListener('input', update);

    // Initial call
    update();
}

function updateAngleExperiment(angle, G) {
    // Calculate effective irradiance based on angle
    // Effective = G * cos(θ)
    const angleRad = (angle * Math.PI) / 180;
    const effectiveIrr = G * Math.cos(angleRad);

    // Calculate relative efficiency (as percentage)
    const efficiency = Math.cos(angleRad) * 100;

    // Calculate output power (assuming 100W at optimal conditions)
    const maxPower = 100; // Watts at 1000 W/m² and 0°
    const outputPower = (effectiveIrr / 1000) * maxPower;

    // Update stats
    document.getElementById('res-eff-irr').textContent = effectiveIrr.toFixed(1);
    document.getElementById('res-efficiency').textContent = efficiency.toFixed(1);
    document.getElementById('res-power').textContent = outputPower.toFixed(1);

    drawAngleDiagram(angle, efficiency, G);
}

function drawAngleDiagram(angle, efficiency, G) {
    const canvas = document.getElementById('angle-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Fixed PV panel position (tilted 30° for optimal)
    const panelCenterX = w / 2;
    const panelCenterY = h - 150;
    const panelTilt = 30 * Math.PI / 180; // Fixed 30° tilt
    const panelLength = 180;
    const panelWidth = 100;

    // Calculate sun position based on angle
    // angle=0° means sun directly overhead (zenith)
    // angle=90° means sun at horizon
    const angleRad = (angle * Math.PI) / 180;
    const sunDistance = 200;
    const sunX = panelCenterX + sunDistance * Math.sin(angleRad);
    const sunY = 80 + sunDistance * (1 - Math.cos(angleRad)) * 0.3;

    // Draw ground
    ctx.fillStyle = '#E8F5E9';
    ctx.fillRect(0, h - 100, w, 100);
    ctx.strokeStyle = '#81C784';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h - 100);
    ctx.lineTo(w, h - 100);
    ctx.stroke();

    // Draw PV panel (fixed position, tilted 30°)
    const p1X = panelCenterX - panelLength / 2 * Math.cos(panelTilt);
    const p1Y = panelCenterY + panelLength / 2 * Math.sin(panelTilt);
    const p2X = panelCenterX + panelLength / 2 * Math.cos(panelTilt);
    const p2Y = panelCenterY - panelLength / 2 * Math.sin(panelTilt);

    const perpX = -Math.sin(panelTilt) * panelWidth / 2;
    const perpY = -Math.cos(panelTilt) * panelWidth / 2;

    // Panel surface
    ctx.beginPath();
    ctx.fillStyle = '#1976D2';
    ctx.moveTo(p1X + perpX, p1Y + perpY);
    ctx.lineTo(p2X + perpX, p2Y + perpY);
    ctx.lineTo(p2X - perpX, p2Y - perpY);
    ctx.lineTo(p1X - perpX, p1Y - perpY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0D47A1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Panel grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        const t = i / 4;
        const x1 = p1X + (p2X - p1X) * t;
        const y1 = p1Y + (p2Y - p1Y) * t;
        ctx.beginPath();
        ctx.moveTo(x1 + perpX, y1 + perpY);
        ctx.lineTo(x1 - perpX, y1 - perpY);
        ctx.stroke();
    }

    // Panel support
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(panelCenterX, panelCenterY);
    ctx.lineTo(panelCenterX, h - 100);
    ctx.stroke();

    // Draw sun (moves with angle)
    // Adjust brightness based on G (200-1200)
    const brightness = 0.4 + (G / 1200) * 0.6;
    ctx.globalAlpha = brightness;

    const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 35);
    sunGrad.addColorStop(0, '#FFF59D');
    sunGrad.addColorStop(0.5, '#FFD54F');
    sunGrad.addColorStop(1, '#FFA726');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Sun rays
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
        const rayAngle = (i / 12) * Math.PI * 2;
        const x1 = sunX + Math.cos(rayAngle) * 35;
        const y1 = sunY + Math.sin(rayAngle) * 35;
        const x2 = sunX + Math.cos(rayAngle) * 45;
        const y2 = sunY + Math.sin(rayAngle) * 45;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // Draw light rays from sun to panel
    const numRays = 5;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    for (let i = 0; i < numRays; i++) {
        const t = (i + 0.5) / numRays;
        const targetX = p1X + (p2X - p1X) * t;
        const targetY = p1Y + (p2Y - p1Y) * t;

        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Arrow head
        const dx = targetX - sunX;
        const dy = targetY - sunY;
        const rayAngle = Math.atan2(dy, dx);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - 10 * Math.cos(rayAngle - 0.3), targetY - 10 * Math.sin(rayAngle - 0.3));
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - 10 * Math.cos(rayAngle + 0.3), targetY - 10 * Math.sin(rayAngle + 0.3));
        ctx.stroke();
        ctx.setLineDash([5, 5]);
    }
    ctx.setLineDash([]);

    // Draw angle indicator
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const arcCenterX = panelCenterX + 60 * Math.cos(panelTilt);
    const arcCenterY = panelCenterY - 60 * Math.sin(panelTilt);
    const perpAngle = Math.atan2(sunY - arcCenterY, sunX - arcCenterX);
    const panelNormalAngle = panelTilt - Math.PI / 2;
    ctx.arc(arcCenterX, arcCenterY, 40, panelNormalAngle, perpAngle, false);
    ctx.stroke();

    // Angle label
    ctx.fillStyle = '#D32F2F';
    ctx.font = 'bold 16px Arial';
    const midAngle = (panelNormalAngle + perpAngle) / 2;
    const labelX = arcCenterX + 55 * Math.cos(midAngle);
    const labelY = arcCenterY + 55 * Math.sin(midAngle);
    ctx.fillText(`θ = ${angle}°`, labelX - 20, labelY);

    // Efficiency indicator
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`Relative Efficiency: ${efficiency.toFixed(1)}%`, 50, h - 50);

    // Efficiency bar
    const barWidth = 200;
    const barHeight = 20;
    const barX = 50;
    const barY = h - 30;

    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const fillWidth = barWidth * (efficiency / 100);
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(0.5, '#FFC107');
    gradient.addColorStop(1, '#F44336');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// --- COZE API Configuration and Q&A Functions ---

// COZE API Configuration
const COZE_CONFIG = {
    apiToken: 'pat_ZWO0ld3uMqV1MCPtpmpxCpwyX5OJ3jhRbzUaWl1WfB6XYnA2c3rKt6TVFDupkHH4',
    botId: '7576201422639939647',
    apiEndpoint: 'https://api.coze.cn/open_api/v2/chat', // Updated to CN endpoint
    conversationId: null
};

// Add message to chat window
function addMessage(text, type) {
    const win = document.getElementById('chat-window');
    const msg = document.createElement('div');
    msg.className = `message ${type}-message`;

    // Support markdown-style formatting for AI messages
    if (type === 'ai') {
        msg.innerHTML = formatMessage(text);
    } else {
        msg.textContent = text;
    }

    win.appendChild(msg);
    win.scrollTop = win.scrollHeight;
}

// Simple message formatting (bold, lists, etc.)
// Simple message formatting (bold, lists, images)
function formatMessage(text) {
    // Convert images ![alt](url) to <img src="url" alt="alt">
    text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin-top: 10px; display: block;">');

    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');

    return text;
}

// Add streaming message placeholder
function addStreamingMessage() {
    const win = document.getElementById('chat-window');
    const container = document.createElement('div');
    container.className = 'message ai-message-container';

    // Reasoning section (hidden by default until content arrives)
    const reasoning = document.createElement('div');
    reasoning.className = 'ai-reasoning';
    reasoning.id = 'streaming-reasoning';
    reasoning.style.display = 'none'; // Hide initially
    reasoning.innerHTML = '<div class="reasoning-header">Thinking Process...</div><div class="reasoning-content"></div>';

    // Answer section
    const msg = document.createElement('div');
    msg.className = 'message ai-message streaming';
    msg.id = 'streaming-message';
    msg.innerHTML = '<span class="typing-indicator">AI is thinking...</span>';

    container.appendChild(reasoning);
    container.appendChild(msg);
    win.appendChild(container);
    win.scrollTop = win.scrollHeight;
    return container;
}

// Update streaming message
function updateStreamingMessage(text) {
    const msg = document.getElementById('streaming-message');
    if (msg) {
        msg.innerHTML = formatMessage(text);
        // Auto-scroll
        const win = document.getElementById('chat-window');
        win.scrollTop = win.scrollHeight;
    }
}

// Update streaming reasoning
function updateStreamingReasoning(text) {
    const reasoning = document.getElementById('streaming-reasoning');
    if (reasoning) {
        reasoning.style.display = 'block';
        const content = reasoning.querySelector('.reasoning-content');
        if (content) {
            content.innerHTML = formatMessage(text);
        }
        // Auto-scroll
        const win = document.getElementById('chat-window');
        win.scrollTop = win.scrollHeight;
    }
}

// Finalize streaming message
function finalizeStreamingMessage() {
    const msg = document.getElementById('streaming-message');
    if (msg) {
        msg.classList.remove('streaming');
        msg.removeAttribute('id');
    }
    const reasoning = document.getElementById('streaming-reasoning');
    if (reasoning) {
        reasoning.removeAttribute('id');
        // Collapse reasoning by default after done? Or keep open? 
        // Let's keep it as is.
    }
}

async function handleUserQuestion(text) {
    // Add user message
    addMessage(text, 'user');

    // Create streaming message placeholder
    const streamingContainer = addStreamingMessage();
    let fullResponse = '';
    let fullReasoning = '';

    try {
        console.log('Sending request to Coze API:', COZE_CONFIG.apiEndpoint);
        const response = await fetch(COZE_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_CONFIG.apiToken}`,
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            body: JSON.stringify({
                conversation_id: COZE_CONFIG.conversationId || undefined,
                bot_id: COZE_CONFIG.botId,
                user: 'pv_student_001',
                query: text,
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', response.status, errorText);
            throw new Error(`API call failed (${response.status}): ${errorText || response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    try {
                        const jsonStr = line.substring(5).trim();
                        if (!jsonStr) continue;

                        const data = JSON.parse(jsonStr);

                        // Save conversation ID for multi-turn conversations
                        if (data.conversation_id && !COZE_CONFIG.conversationId) {
                            COZE_CONFIG.conversationId = data.conversation_id;
                            console.log('Conversation ID saved:', data.conversation_id);
                        }

                        // Handle message content
                        if (data.event === 'message' && data.message) {
                            // Handle Reasoning
                            if (data.message.reasoning_content) {
                                fullReasoning += data.message.reasoning_content;
                                updateStreamingReasoning(fullReasoning);
                            }

                            // Handle Answer
                            if (data.message.type === 'answer' && data.message.content) {
                                fullResponse += data.message.content;
                                updateStreamingMessage(fullResponse);
                            }
                        } else if (data.event === 'conversation.message.delta' && data.data) {
                            // V3 style delta
                            if (data.data.reasoning_content) {
                                fullReasoning += data.data.reasoning_content;
                                updateStreamingReasoning(fullReasoning);
                            }
                            if (data.data.content) {
                                fullResponse += data.data.content;
                                updateStreamingMessage(fullResponse);
                            }
                        }

                        // Handle conversation completed
                        if (data.event === 'conversation.message.completed') {
                            console.log('Conversation completed');
                        }

                        // Handle done event
                        if (data.event === 'done') {
                            console.log('Streaming completed');
                            finalizeStreamingMessage();
                        }

                        // Handle errors
                        if (data.event === 'error') {
                            const errorMsg = data.error_information?.msg || 'API returned an unknown error';
                            throw new Error(errorMsg);
                        }
                    } catch (parseError) {
                        // Only log parse errors if they're not just empty lines
                        if (line.trim() && line !== 'data:') {
                            console.warn('Failed to parse data chunk:', line.substring(0, 100), parseError.message);
                        }
                    }
                }
            }
        }

        // Ensure streaming message is finalized
        finalizeStreamingMessage();

        // Save Q&A Data
        if (fullResponse || fullReasoning) {
            saveQAData(text, fullResponse, fullReasoning);
        }

        // If no response received, show a default message
        if (!fullResponse && !fullReasoning) {
            fullResponse = "Sorry, I didn't catch that. Could you rephrase your question?";
            updateStreamingMessage(fullResponse);
            finalizeStreamingMessage();
        }

    } catch (error) {
        console.error('COZE API error:', error);

        // Remove streaming placeholder and show error
        if (streamingContainer && streamingContainer.parentNode) {
            streamingContainer.remove();
        }

        // Show friendly error message
        let errorMsg = 'Sorry, something went wrong. ';
        if (error.message.includes('Failed to fetch')) {
            errorMsg += 'Unable to reach the AI service. This may be network restrictions or CORS; please try refreshing.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMsg += 'API authentication failed—please verify the configuration.';
        } else {
            errorMsg += `Error details: ${error.message}`;
        }

        addMessage(errorMsg, 'ai');
    }
}

// --- Knowledge Graph Module ---
function initKnowledgeGraph() {
    const btn = document.getElementById('generate-graph-btn');
    if (btn) {
        btn.addEventListener('click', generateGraph);
    }
}

function generateGraph() {
    const intro = document.getElementById('graph-intro');
    const containerWrapper = document.getElementById('graph-container-wrapper');
    const loading = document.getElementById('graph-loading');
    const loadingText = loading.querySelector('.loading-text');

    // Switch view
    intro.style.display = 'none';
    containerWrapper.style.display = 'block';

    // Simulate generation steps
    const steps = [
        { text: "Scanning knowledge base...", delay: 800 },
        { text: "Identifying core entities...", delay: 1600 },
        { text: "Linking relationships...", delay: 2400 },
        { text: "Optimizing layout...", delay: 3000 },
        { text: "Rendering graph...", delay: 3500 }
    ];

    let currentStep = 0;

    function nextStep() {
        if (currentStep < steps.length) {
            loadingText.textContent = steps[currentStep].text;
            setTimeout(() => {
                currentStep++;
                nextStep();
            }, steps[currentStep].delay - (currentStep > 0 ? steps[currentStep - 1].delay : 0));
        } else {
            // Done loading
            setTimeout(() => {
                loading.style.display = 'none';
                renderGraph();
            }, 500);
        }
    }

    nextStep();
}

function renderGraph() {
    const chartDom = document.getElementById('main-graph');
    const myChart = echarts.init(chartDom);

    // --- 1. Define node categories ---
    const categories = [
        { name: 'Core Principles', itemStyle: { color: '#ff4d4f' } },
        { name: 'Hardware', itemStyle: { color: '#faad14' } },
        { name: 'Control Algorithms', itemStyle: { color: '#1890ff' } },
        { name: 'Key Characteristics', itemStyle: { color: '#722ed1' } },
        { name: 'System Applications', itemStyle: { color: '#52c41a' } }
    ];

    // --- 2. Define node data (Nodes) ---
    const nodes = [
        // Core principles
        { name: 'Photovoltaic Power', category: 0, symbolSize: 60, label: { fontSize: 20, fontWeight: 'bold' } },
        { name: 'Photovoltaic Effect', category: 0, symbolSize: 40 },
        { name: 'PN Junction', category: 0, symbolSize: 35 },
        { name: 'Carrier Transport', category: 0, symbolSize: 25 },

        // Hardware
        { name: 'PV Cell', category: 1, symbolSize: 45 },
        { name: 'Monocrystalline Silicon', category: 1, symbolSize: 30 },
        { name: 'Polycrystalline Silicon', category: 1, symbolSize: 30 },
        { name: 'PV Module', category: 1, symbolSize: 40 },
        { name: 'Grid-Tied Inverter', category: 1, symbolSize: 45 },
        { name: 'DC/DC Converter', category: 1, symbolSize: 35 },
        { name: 'Battery', category: 1, symbolSize: 30 },

        // Key characteristics (bridge between physics and control)
        { name: 'I-V Curve', category: 3, symbolSize: 40 },
        { name: 'P-V Curve', category: 3, symbolSize: 40 },
        { name: 'Maximum Power Point (MPP)', category: 3, symbolSize: 45 },
        { name: 'Open-Circuit Voltage', category: 3, symbolSize: 25 },
        { name: 'Short-Circuit Current', category: 3, symbolSize: 25 },
        { name: 'Fill Factor', category: 3, symbolSize: 25 },
        { name: 'Ambient Temperature', category: 3, symbolSize: 30 },
        { name: 'Irradiance', category: 3, symbolSize: 30 },

        // Control algorithms
        { name: 'MPPT Control', category: 2, symbolSize: 50 },
        { name: 'Constant Voltage Method', category: 2, symbolSize: 30 },
        { name: 'Perturb & Observe', category: 2, symbolSize: 35 },
        { name: 'Incremental Conductance', category: 2, symbolSize: 35 },
        { name: 'SPWM Control', category: 2, symbolSize: 30 },

        // System applications
        { name: 'PV System', category: 4, symbolSize: 50 },
        { name: 'Off-Grid System', category: 4, symbolSize: 35 },
        { name: 'Grid-Tied System', category: 4, symbolSize: 40 },
        { name: 'Distributed Plant', category: 4, symbolSize: 30 },
        { name: 'Utility-Scale Plant', category: 4, symbolSize: 30 },
        { name: 'Islanding Effect', category: 4, symbolSize: 30 }
    ];

    // --- 3. Define relationship data (Links) ---
    const links = [
        // Core principle flow
        { source: 'Photovoltaic Power', target: 'Photovoltaic Effect', value: 'based on' },
        { source: 'Photovoltaic Effect', target: 'PN Junction', value: 'core structure' },
        { source: 'PN Junction', target: 'Carrier Transport', value: 'microscopic mechanism' },
        { source: 'Photovoltaic Effect', target: 'PV Cell', value: 'application' },

        // Materials & hardware
        { source: 'PV Cell', target: 'Monocrystalline Silicon', value: 'category' },
        { source: 'PV Cell', target: 'Polycrystalline Silicon', value: 'category' },
        { source: 'PV Cell', target: 'PV Module', value: 'encapsulation' },
        { source: 'PV Module', target: 'I-V Curve', value: 'expressed as' },

        // Characteristics & environment
        { source: 'I-V Curve', target: 'Open-Circuit Voltage', value: 'parameter' },
        { source: 'I-V Curve', target: 'Short-Circuit Current', value: 'parameter' },
        { source: 'I-V Curve', target: 'P-V Curve', value: 'derived to' },
        { source: 'P-V Curve', target: 'Maximum Power Point (MPP)', value: 'contains' },

        // Environmental influence
        { source: 'Ambient Temperature', target: 'Open-Circuit Voltage', value: 'negatively affects' },
        { source: 'Irradiance', target: 'Short-Circuit Current', value: 'positively affects' },
        { source: 'Ambient Temperature', target: 'Maximum Power Point (MPP)', value: 'shifts position' },
        { source: 'Irradiance', target: 'Maximum Power Point (MPP)', value: 'changes magnitude' },

        // Control flow
        { source: 'MPPT Control', target: 'Maximum Power Point (MPP)', value: 'tracks' },
        { source: 'MPPT Control', target: 'DC/DC Converter', value: 'adjusts duty cycle' },
        { source: 'MPPT Control', target: 'Perturb & Observe', value: 'algorithm' },
        { source: 'MPPT Control', target: 'Incremental Conductance', value: 'algorithm' },
        { source: 'MPPT Control', target: 'Constant Voltage Method', value: 'algorithm' },

        // System integration
        { source: 'Photovoltaic Power', target: 'PV System', value: 'builds' },
        { source: 'PV System', target: 'Grid-Tied Inverter', value: 'core device' },
        { source: 'Grid-Tied Inverter', target: 'SPWM Control', value: 'modulation' },
        { source: 'Grid-Tied Inverter', target: 'Islanding Effect', value: 'requires protection' },
        { source: 'PV System', target: 'Off-Grid System', value: 'type' },
        { source: 'PV System', target: 'Grid-Tied System', value: 'type' },
        { source: 'Off-Grid System', target: 'Battery', value: 'required' },
        { source: 'Grid-Tied System', target: 'Distributed Plant', value: 'form' },
        { source: 'Grid-Tied System', target: 'Utility-Scale Plant', value: 'form' }
    ];

    // --- 4. 配置选项 ---
    const option = {
        backgroundColor: '#0b0f19',
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                if (params.dataType === 'edge') {
                    return `${params.data.source} <span style="color:#aaa">--[${params.data.value}]--></span> ${params.data.target}`;
                }
                return `<div style="font-weight:bold">${params.name}</div>Type: ${params.marker} ${params.data.category < categories.length ? categories[params.data.category].name : 'Unknown'}`;
            },
            backgroundColor: 'rgba(50,50,50,0.9)',
            borderColor: '#333',
            textStyle: { color: '#fff' }
        },
        legend: {
            data: categories.map(a => a.name),
            textStyle: { color: '#ccc' },
            bottom: 20,
            icon: 'circle'
        },
        series: [{
            type: 'graph',
            layout: 'force',
            data: nodes,
            links: links,
            categories: categories,
            roam: true,
            draggable: true,
            focusNodeAdjacency: true,
            emphasis: {
                focus: 'adjacency',
                lineStyle: { width: 4 }
            },
            symbol: 'circle',
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1,
                shadowBlur: 10,
                shadowColor: 'rgba(0,0,0,0.5)'
            },
            label: {
                show: true,
                position: 'right',
                formatter: '{b}',
                color: '#fff',
                fontSize: 12
            },
            lineStyle: {
                color: 'source',
                curveness: 0.3,
                width: 1.5,
                opacity: 0.7
            },
            edgeLabel: {
                show: true,
                formatter: function (x) { return x.data.value; },
                fontSize: 12,
                color: '#cccccc', // Muted grey
                fontFamily: 'KaiTi, serif',
                backgroundColor: 'transparent' // Ensure no background
            },
            edgeSymbol: ['none', 'arrow'],
            edgeSymbolSize: [0, 8],
            force: {
                repulsion: 400,
                gravity: 0.05,
                edgeLength: [80, 200],
                layoutAnimation: true
            }
        }]
    };

    myChart.setOption(option);

}

// --- Data Collection & Export ---

function saveQAData(question, answer, reasoning) {
    const record = {
        type: 'qa',
        question: question,
        answer: answer,
        reasoning: reasoning,
        timestamp: new Date().toISOString()
    };
    state.qaHistory.push(record);
    localStorage.setItem('pv_qa_history', JSON.stringify(state.qaHistory));
}

function saveQuizResult(score, wrongAnswers) {
    const record = {
        type: 'quiz',
        score: score,
        wrongAnswers: wrongAnswers,
        timestamp: new Date().toISOString()
    };
    state.quizHistory.push(record);
    localStorage.setItem('pv_quiz_history', JSON.stringify(state.quizHistory));
}

// Hidden Download Mechanism
function initHiddenExport() {
    const footer = document.querySelector('footer');
    if (!footer) {
        console.warn('Footer not found for hidden export');
        return;
    }

    // Prevent text selection to make clicking easier
    footer.style.userSelect = 'none';
    footer.style.webkitUserSelect = 'none';

    let clickCount = 0;
    let clickTimer = null;

    footer.addEventListener('click', (e) => {
        clickCount++;
        console.log(`Magic Click: ${clickCount}/5`);

        if (clickTimer) clearTimeout(clickTimer);

        clickTimer = setTimeout(() => {
            if (clickCount > 0 && clickCount < 5) {
                console.log('Magic Click reset');
            }
            clickCount = 0;
        }, 3000); // Relaxed to 3 seconds

        if (clickCount >= 5) {
            console.log('Magic Click triggered!');
            showDownloadButton();
            clickCount = 0;
            if (clickTimer) clearTimeout(clickTimer);
        }
    });
}

function showDownloadButton() {
    // Check if button already exists
    if (document.getElementById('teacher-download-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'teacher-download-btn';
    btn.textContent = '📥 Export Teaching Data';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '9999';
    btn.style.padding = '12px 24px';
    btn.style.backgroundColor = '#007AFF';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '25px';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.fontFamily = '"Noto Sans SC", sans-serif';
    btn.style.transition = 'all 0.3s ease';

    btn.onmouseover = () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
    };
    btn.onmouseout = () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    };

    btn.onclick = downloadData;

    document.body.appendChild(btn);
}

function downloadData() {
    const qaData = JSON.parse(localStorage.getItem('pv_qa_history') || '[]');
    const quizData = JSON.parse(localStorage.getItem('pv_quiz_history') || '[]');

    const exportData = {
        exportTime: new Date().toISOString(),
        qaLogs: qaData,
        quizLogs: quizData
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `pv_learning_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize when DOM is ready
// Initialize when DOM is ready
console.log('Script.js loaded: Initializing hidden export logic...');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded: Calling initHiddenExport');
        initHiddenExport();
    });
} else {
    console.log('Document ready: Calling initHiddenExport immediately');
    initHiddenExport();
}

// Fallback: Try again on window load just in case
window.addEventListener('load', () => {
    console.log('Window Load: Checking hidden export initialization');
    initHiddenExport();
});

