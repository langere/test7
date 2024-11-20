// 创建一个Phaser游戏实例，参数依次为：游戏宽度、游戏高度、渲染模式（这里使用自动适配）、
// 父容器（这里为null，表示没有父容器）以及包含预加载、创建、更新等阶段函数的对象
var game = new Phaser.Game(480, 320, Phaser.AUTO, null, {preload: preload, create: create, update: update});

// 以下是定义的一些全局变量，用于存储游戏中的各种元素和游戏状态相关的数据

// 代表游戏中的球对象
var ball;
// 代表游戏中的球拍对象
var paddle;
// 用于存储所有砖块的组（Phaser中的Group类型，方便对多个砖块进行统一管理）
var bricks;
// 临时用于创建砖块时存储单个砖块的变量
var newBrick;
// 用于存储砖块相关信息的对象，比如宽度、高度、行列数量、偏移量、间距等
var brickInfo;
// 用于显示得分的文本对象
var scoreText;
// 记录当前得分的变量，初始化为0
var score = 0;
// 记录玩家剩余生命数的变量，初始化为3
var lives = 3;
// 用于显示剩余生命数的文本对象
var livesText;
// 当玩家失去一条生命时显示提示信息的文本对象，提示玩家点击屏幕继续
var lifeLostText;
// 用于表示游戏是否正在进行的布尔变量，初始化为false
var playing = false;
// 游戏开始按钮对象
var startButton;

// 预加载函数，在游戏开始前加载所需的资源，如图像、精灵表等
function preload() {
    // 设置游戏的缩放模式为显示全部，保证游戏内容在不同屏幕尺寸下能完整显示，可能会有黑边
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    // 水平方向上页面（游戏画面）自动对齐，一般用于让游戏在水平方向上居中显示
    game.scale.pageAlignHorizontally = true;
    // 垂直方向上页面（游戏画面）自动对齐，一般用于让游戏在垂直方向上居中显示
    game.scale.pageAlignVertically = true;
    // 设置游戏舞台（整个游戏画面区域）的背景颜色为浅灰色（#eee是十六进制颜色代码）
    game.stage.backgroundColor = '#eee';
    // 加载名为'paddle.png'的图像资源，并将其命名为'paddle'，后续可通过这个名称来使用该图像创建游戏对象
    game.load.image('paddle', 'paddle.png');
    // 加载名为'brick.png'的图像资源，并将其命名为'brick'，用于创建砖块对象
    game.load.image('brick', 'brick.png');
    // 加载名为'wobble.png'的精灵表（包含多个帧的图像），每个帧的大小为20x20像素，将其命名为'ball'，
    // 用于创建游戏中的球对象，并实现动画效果
    game.load.spritesheet('ball', 'wobble.png', 20, 20);
    // 加载名为'button.png'的精灵表，每个帧大小为120x40像素，将其命名为'button'，用于创建游戏开始按钮
    game.load.spritesheet('button', 'button.png', 120, 40);
}

// 创建函数，在这里初始化游戏中的各种对象、设置物理属性、添加文本显示等
function create() {
    // 启动Phaser的物理系统，这里使用的是Arcade物理引擎（Phaser内置的一种简单物理引擎）
    game.physics.startSystem(Phaser.Physics.ARCADE);
    // 设置物理引擎在检测碰撞时忽略向下方向的碰撞（可能根据游戏具体逻辑需求设置）
    game.physics.arcade.checkCollision.down = false;
    // 在游戏世界的水平中间位置、垂直方向靠下（距离底部25像素）的位置创建一个球对象，使用之前加载的名为'ball'的精灵表
    ball = game.add.sprite(game.world.width * 0.5, game.world.height - 25, 'ball');
    // 为球对象添加名为'wobble'的动画，指定动画的帧序列以及播放速度（这里每秒播放24帧）
    ball.animations.add('wobble', [0, 1, 0, 2, 0, 1, 0, 2, 0], 24);
    // 设置球对象的锚点为中心（0.5表示水平和垂直方向上都是中心位置），这样旋转、缩放等操作会以中心进行
    ball.anchor.set(0.5);
    // 启用球对象的物理属性，使其能参与物理模拟，使用Arcade物理引擎
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    // 设置球碰到游戏世界边界时会反弹
    ball.body.collideWorldBounds = true;
    // 设置球的反弹系数为1，表示完全弹性碰撞（碰撞后速度不损失）
    ball.body.bounce.set(1);
    // 设置检查球是否超出游戏世界边界
    ball.checkWorldBounds = true;
    // 为球对象添加一个超出边界的事件监听器，当球超出边界时调用ballLeaveScreen函数，并传入当前的this上下文
    ball.events.onOutOfBounds.add(ballLeaveScreen, this);

    // 在游戏世界的水平中间位置、垂直方向靠下（距离底部5像素）的位置创建一个球拍对象，使用之前加载的名为'paddle'的图像
    paddle = game.add.sprite(game.world.width * 0.5, game.world.height - 5, 'paddle');
    // 设置球拍对象的锚点，水平方向为中心（0.5），垂直方向为底部（1），方便后续操作以合适的位置为基准
    paddle.anchor.set(0.5, 1);
    // 启用球拍对象的物理属性，使其能参与物理模拟，使用Arcade物理引擎
    game.physics.enable(paddle, Phaser.Physics.ARCADE);
    // 设置球拍对象为不可移动（在物理碰撞中不会被其他物体推动）
    paddle.body.immovable = true;

    // 调用函数初始化砖块，创建游戏中的砖块布局
    initBricks();

    // 定义文本样式对象，设置字体为18像素的Arial字体，颜色为蓝色（十六进制颜色代码#0095DD）
    textStyle = { font: '18px Arial', fill: '#0095DD' };
    // 在游戏画面的左上角（坐标为(5, 5)）创建一个用于显示得分的文本对象，初始内容为'Points: 0'，应用之前定义的文本样式
    scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
    // 在游戏画面的右上角（坐标为(game.world.width - 5, 5)）创建一个用于显示剩余生命数的文本对象，
    // 初始内容根据lives变量设置，应用文本样式，并设置锚点为右上角（水平方向靠右，垂直方向靠上）
    livesText = game.add.text(game.world.width - 5, 5, 'Lives: '+lives, textStyle);
    livesText.anchor.set(1, 0);
    // 在游戏画面的中心位置创建一个当玩家失去生命时显示提示信息的文本对象，初始内容为'Life lost, tap to continue'，
    // 应用文本样式，设置锚点为中心，并初始设置为不可见（游戏开始时不显示）
    lifeLostText = game.add.text(game.world.width * 0.5, game.world.height * 0.5, 'Life lost, tap to continue', textStyle);
    lifeLostText.anchor.set(0.5);
    lifeLostText.visible = false;

    // 在游戏画面的中心位置创建一个游戏开始按钮，使用之前加载的名为'button'的精灵表，
    // 点击按钮时调用startGame函数，传入当前this上下文，并指定按钮不同状态下显示的帧索引（这里1表示正常状态，0表示鼠标按下状态，2表示禁用等其他状态）
    startButton = game.add.button(game.world.width * 0.5, game.world.height * 0.5, 'button', startGame, this, 1, 0, 2);
    startButton.anchor.set(0.5);
}

// 更新函数，每帧都会调用，用于处理游戏中的逻辑更新，比如物体的移动、碰撞检测等
function update() {
    // 检测球和球拍之间的碰撞，当碰撞发生时调用ballHitPaddle函数来处理碰撞后的逻辑
    game.physics.arcade.collide(ball, paddle, ballHitPaddle);
    // 检测球和砖块组之间的碰撞，当碰撞发生时调用ballHitBrick函数来处理碰撞后的逻辑，比如砖块消失、得分增加等
    game.physics.arcade.collide(ball, bricks, ballHitBrick);
    // 如果游戏正在进行（playing为true）
    if(playing) {
        // 根据鼠标的水平位置或者将球拍保持在游戏世界宽度的中间位置来更新球拍的水平位置，
        // 这样玩家可以通过鼠标移动球拍（如果有鼠标输入），或者在没有鼠标输入时让球拍保持居中
        paddle.x = game.input.x || game.world.width * 0.5;
    }
}

// 初始化砖块的函数，用于创建并布局游戏中的所有砖块
function initBricks() {
    // 定义一个包含砖块各种信息的对象
    brickInfo = {
        // 单个砖块的宽度为50像素
        width: 50,
        // 单个砖块的高度为20像素
        height: 20,
        // 包含行列数量信息的对象
        count: {
            // 砖块的行数为7行
            row: 7,
            // 砖块的列数为3列
            col: 3
        },
        // 包含砖块布局偏移量信息的对象，用于确定砖块在游戏世界中的起始位置
        offset: {
            // 距离游戏世界顶部的偏移量为50像素
            top: 50,
            // 距离游戏世界左侧的偏移量为60像素
            left: 60
        },
        // 砖块之间的水平和垂直间距为10像素
        padding: 10
    }
    // 创建一个空的组用于存储所有的砖块，方便统一管理和操作
    bricks = game.add.group();
    // 外层循环遍历列数
    for(c = 0; c < brickInfo.count.col; c++) {
        // 内层循环遍历行数
        for(r = 0; r < brickInfo.count.row; r++) {
            // 计算当前砖块在水平方向上的位置，根据行列索引、砖块宽度、间距以及偏移量来确定
            var brickX = (r * (brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;
            // 计算当前砖块在垂直方向上的位置，根据行列索引、砖块高度、间距以及偏移量来确定
            var brickY = (c * (brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;
            // 在计算好的位置创建一个砖块对象，使用之前加载的名为'brick'的图像
            newBrick = game.add.sprite(brickX, brickY, 'brick');
            // 启用新创建的砖块的物理属性，使其能参与物理模拟，使用Arcade物理引擎
            game.physics.enable(newBrick, Phaser.Physics.ARCADE);
            // 设置砖块为不可移动（在物理碰撞中不会被其他物体推动）
            newBrick.body.immovable = true;
            // 设置砖块的锚点为中心（方便后续操作以中心为基准）
            newBrick.anchor.set(0.5);
            // 将新创建的砖块添加到砖块组中，以便统一管理
            bricks.add(newBrick);
        }
    }
}

// 球与砖块碰撞后的处理函数
function ballHitBrick(ball, brick) {
    // 创建一个补间动画（Tween）对象，用于改变砖块的缩放比例，让砖块看起来像是被消除的效果
    var killTween = game.add.tween(brick.scale);
    // 设置补间动画的目标缩放比例为(0, 0)，也就是缩放到消失，动画持续时间为200毫秒，使用线性缓动效果（没有加速或减速）
    killTween.to({x: 0, y: 0}, 200, Phaser.Easing.Linear.None);
    // 为补间动画添加一个完成时的回调函数，当动画播放完成后调用，在回调函数中移除（销毁）该砖块对象
    killTween.onComplete.addOnce(function(){
        brick.kill();
    }, this);
    // 启动补间动画，开始执行砖块消失的动画效果
    killTween.start();
    // 玩家得分增加10分
    score += 10;
    // 更新得分文本的内容，显示最新的得分情况
    scoreText.setText('Points: '+score);
    // 如果玩家的得分等于所有砖块的总分（通过砖块的行列数和每个砖块对应的分值计算得出）
    if(score === brickInfo.count.row * brickInfo.count.col * 10) {
        // 弹出一个提示框显示玩家获胜的信息
        alert('You won the game, congratulations!');
        // 重新加载页面，重置游戏
        location.reload();
    }
}

// 球超出游戏屏幕边界后的处理函数
function ballLeaveScreen() {
    // 玩家剩余生命数减1
    lives--;
    // 如果玩家还有剩余生命（lives大于0）
    if(lives) {
        // 更新剩余生命数文本的内容，显示最新的剩余生命数
        livesText.setText('Lives: '+lives);
        // 显示提示玩家失去一条生命、点击继续的文本信息
        lifeLostText.visible = true;
        // 将球的位置重置到游戏世界的水平中间位置、垂直方向靠下（距离底部25像素）的位置
        ball.reset(game.world.width * 0.5, game.world.height - 25);
        // 将球拍的位置重置到游戏世界的水平中间位置、垂直方向靠下（距离底部5像素）的位置
        paddle.reset(game.world.width * 0.5, game.world.height - 5);
        // 为游戏输入添加一个鼠标按下（或触摸屏幕）的事件监听器，当玩家点击时调用回调函数，
        // 在回调函数中隐藏提示失去生命的文本信息，并设置球的初始速度，让球重新开始运动
        game.input.onDown.addOnce(function(){
            lifeLostText.visible = false;
            ball.body.velocity.set(150, -150);
        }, this);
    }
    // 如果玩家没有剩余生命了（lives等于0）
    else {
        // 弹出一个提示框显示玩家游戏失败的信息
        alert('You lost, game over!');
        // 重新加载页面，重置游戏
        location.reload();
    }
}

// 球与球拍碰撞后的处理函数
function ballHitPaddle(ball, paddle) {
    // 播放球的'wobble'动画，让球看起来有晃动的效果
    ball.animations.play('wobble');
    // 根据球与球拍碰撞的位置来改变球在水平方向上的速度，实现不同角度反弹的效果，
    // 这里通过计算球和球拍的水平位置差值来调整速度大小和方向
    ball.body.velocity.x = -1 * 5 * (paddle.x - ball.x);
}

// 游戏开始按钮点击后的处理函数
function startGame() {
    // 销毁游戏开始按钮，让其从游戏画面中消失
    startButton.destroy();
    // 设置球的初始速度，让球开始运动
    ball.body.velocity.set(150, -150);
    // 将游戏正在进行的标志设置为true，表示游戏正式开始
    playing = true;
}