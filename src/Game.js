(function ($) {
    'use strict';

    function buildHFrameArray(startX, y, frameWidth, totalFrames) {
        var arr = [];
        for (var f = 0; f < totalFrames; f++) {
            arr.push({ X: startX, Y: y });
            startX += frameWidth;
        }
        return arr;
    }

    function buildVFrameArray(startY, x, frameHeight, totalFrames) {
        var arr = [];
        for (var f = 0; f < totalFrames; f++) {
            arr.push({ X: x, Y: startY });
            startY += frameHeight;
        }
        return arr;
    }

    //Classe para auxiliar na criação aleatória de componentes de jogo
    function ObjectFactory(minSeconds, maxSeconds, createCallback) {
        var timeLastObjectCreate = 0;
        var timeToWait = 0;

        this.random = function (start, end) {
            return Math.floor(Math.random() * end) + start;
        };

        this.create = function (gameTime) {
            if (timeToWait == 0) {
                timeToWait = this.random(minSeconds, maxSeconds) * 1000;
            }

            if (gameTime - timeLastObjectCreate >= timeToWait) {
                timeLastObjectCreate = gameTime;
                timeToWait = 0;

                return createCallback.call(this);
            }

            return null;
        };
    };
    //

    //Classe para representação de um retângulo
    function Rectangle(x, y, width, height) {
        this.X = x;
        this.Y = y;
        this.Width = width;
        this.Height = height;

        this.initRect = function (x, y, width, height) {
            this.X = x;
            this.Y = y;
            this.Width = width;
            this.Height = height;
        };

        this.hasCollision = function (rect) {
            return (this.X <= rect.X + rect.Width &&
                   this.X + this.Width >= rect.X &&
                   this.Y <= rect.Y + rect.Height &&
                   this.Height + this.Y >= rect.Y);
        };
    };
    //

    //Classe base para todos os componentes do jogo (Personagens, Inimigos, etc...)
    function Component(x, y, width, height) {
        this.initRect(x, y, width, height);

        this.VelocityX = 0;
        this.VelocityY = 0;
        this.CurrentState = null;

        this.update = function (delta) { };

        this.draw = function (ctx) {
            ctx.drawImage(
                this.CurrentState.Animation.SpriteSheet,
                this.CurrentState.Animation.X,
                this.CurrentState.Animation.Y,
                this.Width,
                this.Height,
                this.X,
                this.Y,
                this.Width,
                this.Height
            );

            /*
            ctx.lineWidth = "2";
            for (var h = 0; h < this.CurrentState.Hitboxes.length; h++) {
                ctx.beginPath();
                ctx.strokeStyle = h % 2 == 0 ? "purple" : "lime";
                ctx.rect(
                    this.X + this.CurrentState.Hitboxes[h].X,
                    this.Y + this.CurrentState.Hitboxes[h].Y,
                    this.CurrentState.Hitboxes[h].Width,
                    this.CurrentState.Hitboxes[h].Height
                );
                ctx.stroke();
            }
            */
        };
    };
    Component.prototype = new Rectangle();
    Component.prototype.constructor = Component;
    //

    //Classe para o personagem principal do jogo
    function Boy(x, y) {
        var WIDTH = 44;
        var HEIGHT = 74;

        this.VelocityX = 0;
        this.VelocityY = 0;

        this.Life = 100;

        this.initRect(x, y, WIDTH, HEIGHT);

        var leftHitboxes = [
            new Rectangle(14, 2, 19, 26),
            new Rectangle(2, 18, 11, 15),
            new Rectangle(10, 33, 15, 10),
            new Rectangle(25, 28, 11, 46)
        ];

        var rightHitboxes = [
            new Rectangle(11, 2, 19, 26),
            new Rectangle(31, 18, 11, 15),
            new Rectangle(19, 33, 15, 10),
            new Rectangle(8, 28, 11, 46)
        ];

        var states = {
            StandingLeft: {
                Animation: new SpriteAnimation(buildHFrameArray(0, 0, WIDTH, 6), 0.3, images.boy, true),
                Hitboxes: leftHitboxes
            },
            StandingRight: {
                Animation: new SpriteAnimation(buildHFrameArray(WIDTH * 8, HEIGHT * 5, WIDTH * -1, 6), 0.3, images.boy, true),
                Hitboxes: rightHitboxes
            },
            WalkingLeft: {
                Animation: new SpriteAnimation(buildHFrameArray(0, HEIGHT, WIDTH, 6), 0.07, images.boy, true),
                Hitboxes: leftHitboxes
            },
            WalkingRight: {
                Animation: new SpriteAnimation(buildHFrameArray(WIDTH * 8, HEIGHT * 6, WIDTH * -1, 6), 0.07, images.boy, true),
                Hitboxes: rightHitboxes
            },
            JumpingLeft: {
                Animation: new SpriteAnimation(buildHFrameArray(0, HEIGHT * 2, WIDTH, 6), 0.025, images.boy, false),
                Hitboxes: leftHitboxes
            },
            JumpingRight: {
                Animation: new SpriteAnimation(buildHFrameArray(WIDTH * 8, HEIGHT * 7, WIDTH * -1, 6), 0.025, images.boy, false),
                Hitboxes: rightHitboxes
            },
            HurtLeft: {
                Animation: new SpriteAnimation(buildHFrameArray(0, HEIGHT * 4, WIDTH, 5), 0.1, images.boy, true),
                Hitboxes: leftHitboxes
            },
            HurtRight: {
                Animation: new SpriteAnimation(buildHFrameArray(WIDTH * 8, HEIGHT * 9, WIDTH * -1, 5), 0.1, images.boy, true),
                Hitboxes: rightHitboxes
            }
        };

        this.setCurrentState = function (newState, startFrame) {
            if (this.CurrentState == newState)
                return;

            this.CurrentState = newState;
            this.CurrentState.Animation.start(startFrame || 0);
        }

        var lastDirection = 'R';
        var isWalking = false;
        var isHurting = false;
        var hurtTime = 0;
        this.IsJumping = false;

        this.startJump = function () {
            if (!this.IsJumping) {
                this.VelocityY = -240;
                this.IsJumping = true;
            }
        };

        this.stopJump = function () {
            if (this.IsJumping && this.VelocityY < -80)
                this.VelocityY = -80;
        };

        this.upgradeLife = function (value) {
            this.Life = Math.min(100, mainCharacter.Life + value);
        };

        this.decreaseLife = function (value) {
            if (!isHurting) {
                this.Life = Math.max(0, mainCharacter.Life - value);
                isHurting = true;
            }
        };

        this.update = function (delta) {
            var oldX = this.X;
            var gravity = 300;

            //Aplica a gravidade no eixo Y
            this.VelocityY += gravity * delta;

            //Atualiza posição
            this.X += (this.VelocityX * delta);
            this.Y += (this.VelocityY * delta);

            if (this.Y > y) {
                this.Y = y;
                this.IsJumping = false;
            }

            if (oldX < this.X) {
                isWalking = true;
                lastDirection = 'R';
            }
            else if (oldX > this.X) {
                isWalking = true;
                lastDirection = 'L';
            } else {
                isWalking = false;
            }

            if (isHurting) {
                hurtTime += delta;
                if (hurtTime >= 1.25) {
                    isHurting = false;
                    hurtTime = 0;
                }
            }

            //Atualiza animação
            if (isHurting) {
                this.setCurrentState(lastDirection == 'L' ? states.HurtLeft : states.HurtRight);
            } else if (this.IsJumping) {
                this.setCurrentState(lastDirection == 'L' ? states.JumpingLeft : states.JumpingRight);
            } else if (isWalking) {
                this.setCurrentState(lastDirection == 'L' ? states.WalkingLeft : states.WalkingRight);
            } else {
                this.setCurrentState(lastDirection == 'L' ? states.StandingLeft : states.StandingRight);
            }

            this.CurrentState.Animation.update(delta);
        };
    };
    Boy.prototype = new Component();
    Boy.prototype.constructor = Boy;
    //

    //Classe para representar os carros do jogo
    function Car(x, y, velocityX) {
        var WIDTH = 180;
        var HEIGHT = 58;

        this.initRect(x, y, WIDTH, HEIGHT);

        var states = {
            RunningLeft: {
                Animation: new SpriteAnimation([{ X: 0, Y: 0 }], 0, images.leftCar, false),
                Hitboxes: [
                    new Rectangle(5, 21, 171, 24),
                    new Rectangle(16, 16, 137, 5),
                    new Rectangle(20, 14, 129, 2),
                    new Rectangle(64, 9, 76, 5),
                    new Rectangle(69, 5, 61, 4),
                    new Rectangle(75, 1, 37, 4)
                ]
            },
            RunningRight: {
                Animation: new SpriteAnimation([{ X: 0, Y: 0 }], 0, images.rightCar, false),
                Hitboxes: [
                    new Rectangle(4, 21, 171, 24),
                    new Rectangle(27, 16, 137, 5),
                    new Rectangle(31, 14, 129, 2),
                    new Rectangle(40, 9, 76, 5),
                    new Rectangle(50, 5, 61, 4),
                    new Rectangle(68, 1, 37, 4)
                ]
            }
        };

        this.CurrentState = velocityX > 0 ? states.RunningRight : states.RunningLeft;

        this.update = function (delta) {
            this.X += (velocityX * delta);
        };
    };
    Car.prototype = new Component();
    Car.prototype.constructor = Car;
    //

    //Classe para representar as garrafas
    function Bottle(x, y, type, velocityY) {
        var isCoke = Bottle.prototype.Types.Coke == type;

        var WIDTH = 30;
        var HEIGHT = isCoke ? 13.35 : 14.59459459;

        this.initRect(x, y, WIDTH, HEIGHT);

        this.Type = type;

        var animation = isCoke ?
            new SpriteAnimation(buildVFrameArray(0, 0, HEIGHT, 4), 0.2, images.coke, true) :
            new SpriteAnimation(buildVFrameArray(0, 0, HEIGHT, 6), 0.2, images.water, true);

        this.CurrentState = {
            Animation: animation,
            Hitboxes: [new Rectangle(0, 0, WIDTH, HEIGHT)]
        };

        this.update = function (delta) {
            this.Y += (velocityY * delta);

            this.CurrentState.Animation.update(delta);
        };
    };
    Bottle.prototype = new Component();
    Bottle.prototype.constructor = Bottle;
    Bottle.prototype.Types = {
        Coke: 1,
        Water: 2
    };
    //

    var context, images, carFactory, bottleFactory, mainCharacter, cars, bottles, score;

    //var fpsMeter;
    var WIDTH = 1000;
    var HEIGHT = 500;
    var lastTime = 0;

    function init() {
        LoadImages(["background", "boy", "leftCar", "rightCar", "coke", "water"], function (result) {

            context = createCanvas();
            //fpsMeter = new FPSMeter();
            images = result;

            carFactory = new ObjectFactory(1, 6, function () {
                var direction = this.random(1, 2);
                var speed = this.random(120, 310);
                if (direction == 1) //Left to right
                    return new Car(0 - 180, 420, speed);
                else
                    return new Car(WIDTH, 420, speed * -1);
            });

            bottleFactory = new ObjectFactory(1, 2, function () {
                var x = this.random(50, WIDTH - 50);
                var speed = this.random(60, 250);
                var type = this.random(1, 10);

                return new Bottle(x, 0, type % 2 == 0 ? Bottle.prototype.Types.Coke : Bottle.prototype.Types.Water, speed);
            });

            mainCharacter = new Boy(500, 400, 100);
            cars = [];
            bottles = [];
            score = 0;

            //Inicia o game loop
            requestAnimationFrame(frame);
        });
    };

    function createCanvas() {
        var canvas = document.createElement("canvas");
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        $("body").append(canvas);
        return canvas.getContext("2d");
    }

    function frame(totalTime) {
        var delta = Math.min(1, (totalTime - lastTime) / 1000.0);

        handleInput();
        update(totalTime, delta);
        draw();

        lastTime = totalTime;

        //fpsMeter.tick();

        if (mainCharacter.Life == 0)
            alert('Fim de jogo!\nSua pontuação foi: ' + score + '.');
        else
            requestAnimationFrame(frame);
    };

    function update(gameTime, delta) {
        //1. Cria novos componentes pelo cenário
        var car = carFactory.create(gameTime);
        if (car != null)
            cars.push(car);

        var bottle = bottleFactory.create(gameTime);
        if (bottle != null)
            bottles.push(bottle);

        //2. Move os componentes pelo cenário
        mainCharacter.update(delta);
        mainCharacter.X = Math.min(Math.max(0, mainCharacter.X), WIDTH - mainCharacter.Width); //Evita q o personagem saia da tela

        for (var b = 0; b < bottles.length; b++) {
            bottles[b].update(delta);

            //Detecta colisões
            if (checkHitboxesCollision(mainCharacter, bottles[b])) {
                if (bottles[b].Type == Bottle.prototype.Types.Coke) {
                    score += 10;
                    mainCharacter.upgradeLife(5);
                }
                else {
                    mainCharacter.decreaseLife(15);
                }

                bottles.splice(b--, 1);

            } else if (isOutOfY(bottles[b])) {
                bottles.splice(b--, 1);
            }
        }

        for (var c = 0; c < cars.length; c++) {
            cars[c].update(delta); //Atualiza posição do carro

            //Detecta colisões
            if (checkHitboxesCollision(mainCharacter, cars[c])) {
                mainCharacter.decreaseLife(40);
            } else if (isOutOfX(cars[c])) {
                cars.splice(c--, 1);
            }
        }
    };

    function draw() {
        //Desenha o background
        context.drawImage(images.background, 0, 0);

        for (var b = 0; b < bottles.length; b++)
            bottles[b].draw(context);

        for (var c = 0; c < cars.length; c++)
            cars[c].draw(context);

        mainCharacter.draw(context);

        //Escreve a pontuação e vida na tela
        context.font = "16px Consolas";
        context.textAlign = "right";
        context.fillStyle = "black";
        context.fillText("Score: " + score, WIDTH - 10, 20);
        context.fillText("Life: " + mainCharacter.Life, WIDTH - 10, 40);
    };

    function handleInput() {
        mainCharacter.VelocityX = 0;
        mainCharacter.VelocityX -= PressedKeys.Left ? 120 : 0;
        mainCharacter.VelocityX += PressedKeys.Right ? 120 : 0;

        if (PressedKeys.Up && !mainCharacter.IsJumping)
            mainCharacter.startJump();
        else if (!PressedKeys.Up && mainCharacter.IsJumping)
            mainCharacter.stopJump();
    };

    function checkHitboxesCollision(objA, objB) {
        var hasCollision = false;
        for (var h = 0; h < objA.CurrentState.Hitboxes.length; h++) {
            var hitBoxA = objA.CurrentState.Hitboxes[h];

            for (var i = 0; i < objB.CurrentState.Hitboxes.length; i++) {
                var hitBoxB = objB.CurrentState.Hitboxes[i];

                hitBoxA.X += objA.X;
                hitBoxA.Y += objA.Y;

                hitBoxB.X += objB.X;
                hitBoxB.Y += objB.Y;

                hasCollision = hitBoxA.hasCollision(hitBoxB);

                hitBoxA.X -= objA.X;
                hitBoxA.Y -= objA.Y;

                hitBoxB.X -= objB.X;
                hitBoxB.Y -= objB.Y;

                if (hasCollision) {
                    return true;
                }
            }
        }

        return hasCollision;
    };

    function isOutOfX(component) {
        return component.X > WIDTH || component.X < (component.Width * -1);
    };

    function isOutOfY(component) {
        return component.Y > HEIGHT || component.Y < (component.Height * -1);
    };

    window.Game = {
        Init: init
    };

})(jQuery);