const canvas = document.getElementById('canvasStatic');
const canvasAnimated = document.getElementById('canvasAnimated');
const ctx = canvas.getContext('2d');
const ctxAnimated = canvasAnimated.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;
canvasAnimated.width = innerWidth;
canvasAnimated.height = innerHeight;

const cols = Math.floor(canvas.width/150);
const rows = (canvas.height / (canvas.width / cols)) - 1;
const tileSize = canvas.width / cols;
let isPaused = false;
let sysHealth = 5000;
let score = 0;

function towerArc(px, py, radius, angle) {
    this.x = px;
    this.y = py;
    this.radius = radius;
    this.angle = angle;

    this.draw = function() {
        ctxAnimated.beginPath();
        ctxAnimated.moveTo(this.x + tileSize / 2 , this.y + tileSize / 2);
        ctxAnimated.arc(this.x + tileSize / 2, this.y + tileSize / 2, this.radius, this.angle - Math.PI/6, this.angle + Math.PI/6);
        ctxAnimated.closePath();
        ctxAnimated.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctxAnimated.fill();
    }

    this.update = function() {
        if (isPaused) return;
        this.angle += 0.02; 
        if (this.angle >= 2 * Math.PI) {
            this.angle = 0; 
        }
        this.draw();
    }

}

function bullet(px, py, player, tower) {
    this.x = px;
    this.y = py;
    this.player = player;
    this.tower = tower;
    this.radius = 2;
    let bulletSpeed = 2.05;

    this.draw = function() {
        ctxAnimated.beginPath();
        ctxAnimated.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctxAnimated.fillStyle = 'red';
        ctxAnimated.fill();
    }

    this.update = function() {
        if (isPaused) return;
        let denominator = getDistance(this.player.x, this.player.y, this.x, this.y);
        this.dx = (bulletSpeed * (this.player.x - this.x)) / denominator; 
        this.dy = (bulletSpeed * (this.player.y - this.y)) / denominator;
        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    }
}

function player(px, py, dx, dy) {
    this.x = px;
    this.y = py;
    this.dx = dx;
    this.dy = dy;
    this.radius = 5;
    this.keys = 0;
    this.decryptedKeys = 0;
    this.health = 100;

    this.draw = function() {
        ctxAnimated.beginPath();
        ctxAnimated.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctxAnimated.fillStyle = 'white';
        ctxAnimated.fill();
    }

    this.update = function() {
        if (isPaused) return;
        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    }
}

function buildingBlock(px, py, bw, bh, isBlue) {
    this.x = px;
    this.y = py;
    this.width = bw;
    this.height = bh;
    this.isBlueBuilding = isBlue;
}

function shard(px, py, radius) {
    this.x = px;
    this.y = py;
    this.radius = radius;

    this.draw = function() {
        ctxAnimated.beginPath();
        ctxAnimated.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctxAnimated.fillStyle = 'deepPink';
        ctxAnimated.fill();
    }

    this.update = function() {
        if (isPaused) return;
        this.draw();
    }
}

function checkBuildingCollision() {
    for (let i = 0; i < buildingBlockArray.length; i++) {
        let block = buildingBlockArray[i];
        if (player1.x + player1.radius > block.x && player1.x - player1.radius < block.x + block.width &&
            player1.y + player1.radius > block.y && player1.y - player1.radius < block.y + block.height) {
                if (player1.x < block.x) player1.dx = Math.min(player1.dx, 0);
                if (player1.x > block.x + block.width) player1.dx = Math.max(player1.dx, 0); 
                if (player1.y < block.y) player1.dy = Math.min(player1.dy, 0);
                if (player1.y > block.y + block.height) player1.dy = Math.max(player1.dy, 0);
                if (block.isBlueBuilding) {
                    player1.decryptedKeys += player1.keys;
                    player1.keys = 0;
                    console.log("Keys decrypted: " + player1.decryptedKeys);
                    if (player1.decryptedKeys >= 5) {
                        sysHealth = 5000;
                        player1.decryptedKeys -= 5;
                    }
                }
        }
    }
    if (player1.x < player1.radius) player1.x = player1.radius;
    if (player1.x > canvasAnimated.width - player1.radius) player1.x = canvasAnimated.width - player1.radius;
    if (player1.y < player1.radius) player1.y = player1.radius;
    if (player1.y > canvasAnimated.height - player1.radius) player1.y = canvasAnimated.height - player1.radius;
}
let counter = 0;
function checkTowerDetection() {
    for (let i = 0; i < towerArray.length; i++) {
        let tower = towerArray[i];
        if (getDistance(player1.x, player1.y, tower.x + tileSize / 2, tower.y + tileSize / 2) < tower.radius + player1.radius && tower.angle - Math.PI / 6 < getAngle(player1, tower) + Math.PI && getAngle(player1, tower) + Math.PI < tower.angle + Math.PI / 6) {
            console.log("Player is in tower detection range");
            if (counter % 10 === 0) {
                console.log("Bullet fired");
                let bulletInstance = new bullet(tower.x + tileSize/2, tower.y + tileSize/2, player1, tower);
                bulletArray.push(bulletInstance);
                bulletInstance.draw();
            };
            counter++;
        }
    }
}

let bulletDamage = 10;

function checkBulletCollision(){
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        if (getDistance(bullet.x, bullet.y, player1.x, player1.y) < bullet.radius + player1.radius) {
            player1.health -= bulletDamage; // Decrease health by 10
            bulletArray.splice(i, 1);
            i--;
        }
    }
}

function generateShard(px, py) {
    var shardPlaced = false;
    while (!shardPlaced) {
        let validPlacement = true;
        var xAttempt = Math.random() * tileSize + px;
        var yAttempt = Math.random() * tileSize + py;
        for (let i = 0; i < buildingBlockArray.length; i++) {
            let block = buildingBlockArray[i];
            if (xAttempt + shardRadius > block.x && xAttempt - shardRadius < block.x + block.width &&
                yAttempt + shardRadius > block.y && yAttempt - shardRadius < block.y + block.height) {
                    validPlacement = false;
                    break;
            }
        }
        if (validPlacement) {
            let shardInstance = new shard(xAttempt, yAttempt, shardRadius);
            shardArray.push(shardInstance);
            shardInstance.draw();
            shardPlaced = true;
        }
    }
}

function checkShardCollision(){
    for (let i = 0; i < shardArray.length; i++) {
        let shard = shardArray[i];
        if (getDistance(shard.x, shard.y, player1.x, player1.y) < shard.radius + player1.radius) {
            player1.keys++;
            shardArray.splice(i, 1);
            i--;
        }
    }
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function getAngle(player, tower) {
    return Math.atan2(tower.y + tileSize / 2 - player.y, tower.x + tileSize / 2 - player.x);
}

let bluex = Math.floor(Math.random() * cols);
let bluey = Math.floor(Math.random() * rows); 

function drawTile(x, y) {
    const px = x * tileSize;
    const py = y * tileSize;
    console.log(bluex, bluey);
    let isBlueZone = ((x == bluex) && (y == bluey));
    ctx.fillStyle = isBlueZone ? 'deepskyblue' : 'lime';
    ctx.lineWidth = tileSize / 5;
    ctx.strokeStyle = 'black';
    ctx.fillRect(px, py, tileSize, tileSize);
    ctx.strokeRect(px, py, tileSize, tileSize);
    ctx.lineWidth = tileSize / 50;
    ctx.strokeStyle = 'lime';
    ctx.strokeRect(px, py, tileSize, tileSize);

    if (!isBlueZone) {
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = 'black';
            let bw = rand(tileSize/5, tileSize/3);
            let bh = rand(tileSize/5, tileSize/3);
            let bx = px + rand(tileSize / 10 + 1, tileSize / 10 * 9 - bw - 1);
            let by = py + rand(tileSize / 10 + 1, tileSize / 10 * 9 - bh - 1);
            ctx.fillRect(bx, by, bw, bh);
            buildingBlockArray.push(new buildingBlock(bx, by, bw, bh, false));
        }
        towerArray.push(new towerArc(px, py, tileSize / 2, Math.random() * 2 * Math.PI));
        if (Math.random() < 0.2) {
            generateShard(px, py);
        } 
    }

    else {        
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = 'black';
            let bw = rand(tileSize/5, tileSize/3);
            let bh = rand(tileSize/5, tileSize/3);
            let bx = px + rand(tileSize / 10 + 1, tileSize / 10 * 9 - bw - 1);
            let by = py + rand(tileSize / 10 + 1, tileSize / 10 * 9 - bh - 1);
            ctx.fillRect(bx, by, bw, bh);
            buildingBlockArray.push(new buildingBlock(bx, by, bw, bh, true));
        }
        ctx.beginPath();
        ctx.arc(px + tileSize / 2, py + tileSize / 2, 10, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
        baseStation = 1;
    }
}

let w = 0;
let a = 0;
let s = 0;
let d = 0;
let speed = 2;

addEventListener('keydown', function(event) {
    if (event.key === 'd') {
        d = 1;        
    }
    if (event.key === 'a') {
        a = 1;        
    }
    if (event.key === 'w') {
        w = 1;               
    }
    if (event.key === 's') {
        s = 1;                       
    }    
});

addEventListener('keyup', function(event) {
    if (event.key === 'd') {
        d = 0;        
    }
    if (event.key === 'a') {
        a = 0;        
    }
    if (event.key === 'w') {
        w = 0;               
    }
    if (event.key === 's') {
        s = 0;                       
    }    
});

let timer = 0;

function animate() {
    if (isPaused) return;
    
    ctxAnimated.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < towerArray.length; i++) {
        towerArray[i].update();
    }
    if (w && !s) {
        player1.dy = -1*speed;
    }
    if (a && !d) {
        player1.dx = -1*speed;
    }
    if (s && !w) {
        player1.dy = 1*speed;
    } 
    if (d && !a) {
        player1.dx = 1*speed;
    } 
    if ((!a && !d) || (a && d)) {
        player1.dx = 0;
    } 
    if ((!w && !s) || (w && s)) {
        player1.dy = 0;
    }


    checkBuildingCollision();
    checkTowerDetection();

    if (timer % 300 == 0) bulletArray.shift(); // Remove the first bullet every second
    if (timer % 600 == 0 && shardArray.length < 10) {
        px = Math.floor(Math.random() * cols) * tileSize;
        py = Math.floor(Math.random() * rows) * tileSize;
        generateShard(px, py);
        console.log("Shard generated");
    }

    for (let i = 0; i < bulletArray.length; i++) {
        bulletArray[i].update();
    }

    for (let i = 0; i < shardArray.length; i++) {
        shardArray[i].update();
    }

    checkBulletCollision();
    checkShardCollision();
    if (player1.health <= 0 || sysHealth <= 0) {
        isPaused = true;
        document.getElementById('finalScore').innerText = `${score}`;
        document.getElementById('highScore').innerText = `${localStorage.getItem('highScore')}`;
        if (score > localStorage.getItem('highScore')) {
            localStorage.setItem('highScore', score);
        }
        document.getElementById('gameOverBox').style.display = 'block';
        return;
    }
    player1.update();
    sysHealth -= 0.5;
    score += 1;
    timer++;

    if (timer % 20 == 0){
        document.getElementById('score').innerText = `${score}`;
        document.getElementById('playerHealth').innerText = `${player1.health}`;
        document.getElementById('sysHealth').innerText = `${sysHealth}`;
        document.getElementById('playerKeys').innerText = `${player1.keys}`;
        document.getElementById('decryptedKeys').innerText = `${player1.decryptedKeys}`;
    }
    requestAnimationFrame(animate);
}

var towerArray = [];
var buildingBlockArray = [];
var bulletArray = [];
var shardArray = [];
const shardRadius = 4;
let player1 = new player(canvasAnimated.width / 2, canvasAnimated.height/ 2, 0, 0);

function generateMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      drawTile(x, y);
    }
  }
  player1.draw();
}

function pause() {
  isPaused = true;
}

function resume() {
  isPaused = false;
  animate(); 
}

generateMap();
animate();