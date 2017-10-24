(function ($) {

    function spriteAnimation(frames, speed, spriteSheet, repeat) {

        var elapsedTime = 0;
        var currentFrame = 0;
        var stopped = false;

        this.X = frames[0].X;
        this.Y = frames[0].Y;
        this.Speed = speed;
        this.SpriteSheet = spriteSheet;

        this.start = function (startFrame) {
            elapsedTime = 0;
            currentFrame = startFrame || 0;
            stopped = false;
            return this;
        };

        this.stop = function () {
            elapsedTime = 0;
            currentFrame = 0;
            stopped = true;
            return this;
        };

        this.update = function (delta) {
            if (stopped)
                return;

            elapsedTime += delta;
            if (elapsedTime > this.Speed) {
                elapsedTime = 0;
                if (++currentFrame >= frames.length) {

                    if (!repeat) {
                        currentFrame--;
                        return this.stop();
                    }

                    currentFrame = 0;
                }
                this.X = frames[currentFrame].X;
                this.Y = frames[currentFrame].Y;
            }

            return this;
        };
    };

    window.SpriteAnimation = spriteAnimation;

})(jQuery);
