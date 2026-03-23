// js/flyingBird.js
// complete
class FlyingBird {
    constructor(game, startX, startY, direction) { // direction is 1 for right, -1 for left
        this.game = game;
        this.config = CONFIG.AMBIENT_EFFECTS.FLYING_BIRD;
        this.image = this.game.preloadedImages[this.config.TILE_SHEET_PATH];

        this.x = startX;
        this.y = startY;
        this.direction = direction; // 1 for flying right, -1 for flying left

        this.frameWidth = this.config.FRAME_WIDTH;
        this.frameHeight = this.config.FRAME_HEIGHT;
        this.numFrames = this.config.NUM_FRAMES;
        this.currentFrame = Math.floor(Math.random() * this.numFrames); // Start on a random frame
        this.animationTimer = 0;
        this.animationSpeed = this.config.ANIMATION_SPEED;

        this.speed = (this.config.FLIGHT_SPEED_MIN || 50) + Math.random() * ((this.config.FLIGHT_SPEED_MAX || 100) - (this.config.FLIGHT_SPEED_MIN || 50));
        this.scale = this.config.SCALE || 1.0;

        this.width = this.frameWidth * this.scale;
        this.height = this.frameHeight * this.scale;

        this.isMarkedForDeletion = false;

        if (!this.image) {
            console.warn("Flying bird tilesheet not loaded!");
            this.isMarkedForDeletion = true; // Cannot render without image
        }
    }

    update(deltaTime) {
        if (!this.image) return;

        // Animate bird
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.numFrames;
        }

        // Move bird
        this.x += this.speed * this.direction * deltaTime;

        // Mark for deletion if off-screen
        const despawnBuffer = this.width * 2; // How far off screen before despawning
        if (this.direction === 1 && this.x > CONFIG.WORLD_WIDTH + despawnBuffer) {
            this.isMarkedForDeletion = true;
        } else if (this.direction === -1 && this.x < -despawnBuffer - this.width) {
            this.isMarkedForDeletion = true;
        }
    }

    render(ctx) {
        if (!this.image || this.isMarkedForDeletion) return;

        ctx.save();
        // Flip image if flying left
        if (this.direction === -1) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        }

        const framesPerRow = 3; // Assuming your image is 3 frames wide
        const rowIndex = Math.floor(this.currentFrame / framesPerRow); // 0 for top row, 1 for bottom row
        const colIndex = this.currentFrame % framesPerRow;       // 0, 1, or 2 for column in that row

        const sourceX = colIndex * this.frameWidth;
        const sourceY = rowIndex * this.frameHeight;
        if (sourceX + this.frameWidth > this.image.naturalWidth ||
            sourceY + this.frameHeight > this.image.naturalHeight) {
            // This can happen if NUM_FRAMES is wrong or FRAME_WIDTH/HEIGHT doesn't match the sheet dimensions
            // console.warn(`Bird sprite clipping out of bounds. Frame: ${this.currentFrame}, sX: ${sourceX}, sY: ${sourceY}`);
            // Optionally, you could clamp currentFrame or not draw, but ideally config fixes this.
            // For now, let it try to draw; browser will handle clipping.
        }

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
        ctx.restore();
    }
}