// js/ufo.js
class UFO {
    constructor(game, startX, startY, direction) {
        this.game = game;
        this.config = CONFIG.AMBIENT_EFFECTS.UFO;
        this.image = this.game.preloadedImages[this.config.TILE_SHEET_PATH];

        this.x = startX;
        this.y = startY;
        this.direction = direction;

        this.frameWidth = this.config.FRAME_WIDTH;
        this.frameHeight = this.config.FRAME_HEIGHT;
        this.numFrames = this.config.NUM_FRAMES;
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = this.config.ANIMATION_SPEED;

        this.speed = (this.config.SPEED_MIN || 400) + Math.random() * ((this.config.SPEED_MAX || 600) - (this.config.SPEED_MIN || 400));
        this.scale = this.config.SCALE || 0.25;

        this.width = this.frameWidth * this.scale;
        this.height = this.frameHeight * this.scale;

        this.isMarkedForDeletion = false;

        if (!this.image) {
            this.isMarkedForDeletion = true;
        }
    }

    update(deltaTime) {
        if (!this.image) return;

        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.numFrames;
        }

        this.x += this.speed * this.direction * deltaTime;

        const despawnBuffer = this.width * 2;
        if (this.direction === 1 && this.x > CONFIG.WORLD_WIDTH + despawnBuffer) {
            this.isMarkedForDeletion = true;
        } else if (this.direction === -1 && this.x < -despawnBuffer - this.width) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        if (!this.image || this.isMarkedForDeletion) return;

        const sourceX = this.currentFrame * this.frameWidth;
        const sourceY = 0;

        ctx.drawImage(
            this.image,
            sourceX,
            sourceY,
            this.frameWidth,
            this.frameHeight,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
}
