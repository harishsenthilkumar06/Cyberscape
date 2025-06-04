const canvas = document.getElementById('canvasStatic');
const canvasAnimated = document.getElementById('canvasAnimated');
const ctx = canvas.getContext('2d');
const ctxAnimated = canvasAnimated.getContext('2d');


const cols = 8;
const rows = 6;
const tileSize = 100;
let isPaused = false;

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
    bulletSpeed = 2;

    this.draw = function() {
        ctxAnimated.beginPath();
        ctxAnimated.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctxAnimated.fillStyle = 'red';
        ctxAnimated.fill();
    }

    this.update = function() {
        if (isPaused) return;
        dx = bulletSpeed
        dy = bulletSpeed * (this.tower.y + tileSize / 2 - this.player.y) / (this.tower.x + tileSize / 2 - this.player.x);
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

    this.draw = function() {
        ctxAnimated.beginPath();
        ctxAnimated.arc(this.x, this.y, 5, 0, 2 * Math.PI);
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

function buildingBlock(px, py, bw, bh) {
    this.x = px;
    this.y = py;
    this.width = bw;
    this.height = bh;
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
        }
    }
}

function checkTowerDetection() {
    for (let i = 0; i < towerArray.length; i++) {
        let tower = towerArray[i];
        if (getDistance(player1.x, player1.y, tower.x + tileSize / 2, tower.y + tileSize / 2) < tower.radius + player1.radius && tower.angle - Math.PI / 6 < getAngle(player1, tower) + Math.PI && getAngle(player1, tower) + Math.PI < tower.angle + Math.PI / 6) {
            console.log("Player detected by tower");
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
    return Math.atan2(player.y - (tower.y + tileSize / 2), player.x - (tower.x + tileSize / 2)) + Math.PI;
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
        buildingBlockArray.push(new buildingBlock(bx, by, bw, bh)); 
    }
    
    towerArray.push(new towerArc(px, py, 40, Math.random() * 2 * Math.PI));
  }

  else {        
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'black';
        let bw = rand(tileSize/5, tileSize/3);
        let bh = rand(tileSize/5, tileSize/3);
        let bx = px + rand(tileSize / 10 + 1, tileSize / 10 * 9 - bw - 1);
        let by = py + rand(tileSize / 10 + 1, tileSize / 10 * 9 - bh - 1);
        ctx.fillRect(bx, by, bw, bh);
        buildingBlockArray.push(new buildingBlock(bx, by, bw, bh));
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

    player1.update();

    requestAnimationFrame(animate);
}

var towerArray = [];
var buildingBlockArray = [];
var bulletArray = [];
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
  generateMap(); // or start animation loop if you add movement later
}

generateMap();
animate();