const scoreEl = document.querySelector('#scoreEl')
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

const backgroundImage = new Image();
backgroundImage.src = 'img/EnchantedForest.jpg'; 


let player = new Player();
let projectiles = [];
let grids = [];
let invaderProjectiles = [];
let bombs = [];
let powerUps = [];


// Key Controls (A, D, and Spacebar)
let keys = {
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
  space: {
    pressed: false
  }
}

let frames = 0
let randomInterval = Math.floor(Math.random() * 500 + 500)
let game = {
  over: false,
  active: true
}
let score = 0

let spawnBuffer = 500
let fps = 60
let fpsInterval = 1000 / fps
let msPrev = window.performance.now()

function init() {
  player = new Player()
  projectiles = []
  grids = []
  invaderProjectiles = []
  particles = []
  bombs = []
  powerUps = []

  keys = {
    a: {
      pressed: false
    },
    d: {
      pressed: false
    },
    space: {
      pressed: false
    }
  }

  frames = 0
  randomInterval = Math.floor(Math.random() * 500 + 500)
  game = {
    over: false,
    active: true
  }
  score = 0
  document.querySelector('#finalScore').innerHTML = score
  document.querySelector('#scoreEl').innerHTML = score

  for (let i = 0; i < 100; i++) {
    particles.push(
      new Particle({
        position: {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height
        },
        velocity: {
          x: 0,
          y: 0.3
        },
        radius: Math.random() * 2,
        color: 'black'

        
      })
    )
  }
}


function winGame() {
  console.log('You Win');
  audio.gameOver.play();
  document.getElementById('gameOverText').style.display = 'none';
  document.getElementById('finalScore').style.display = 'none';
  document.getElementById('youWonText').style.display = 'block';
  document.getElementById('finalScoreWon').style.display = 'block';

  // Game over rule
  game.over = true; 

  // Makes player disappear if game over
  setTimeout(() => {
    player.opacity = 0;
  }, 0);

  // Stops the game
  setTimeout(() => {
    game.active = false;
    document.querySelector('#restartScreen').style.display = 'flex';
    document.getElementById('finalScoreWon').innerHTML = score;
  }, 2000);

  createParticles({
    object: player,
    color: 'white',
    fades: true
  });
}


function endGame() {
  if (score >= 2000) {
    winGame();
  } else {
    console.log('You Lose');
    
    setTimeout(() => {
      player.opacity = 0;
      game.over = true;
    }, 0);

    setTimeout(() => {
      game.active = false;
      document.querySelector('#restartScreen').style.display = 'flex';
      document.getElementById('finalScore').innerHTML = score;
    }, 2000);
  }

  createParticles({
    object: player,
    color: 'white',
    fades: true
  });
}



function animate() {
  if (!game.active) return
  requestAnimationFrame(animate)
  
  const msNow = window.performance.now()
  const elapsed = msNow - msPrev

  if (elapsed < fpsInterval) return

  msPrev = msNow - (elapsed % fpsInterval) // 3.34

  c.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  c.fillRect(0, 0, canvas.width, canvas.height)
  c.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i]

    if (powerUp.position.x - powerUp.radius >= canvas.width)
      powerUps.splice(i, 1)
    else powerUp.update()
  }

  
  // Random powerups
  if (frames % 500 === 0) {
    powerUps.push(
      new PowerUp({
        position: {
          x: 0,
          y: Math.random() * 300 + 15
        },
        velocity: {
          x: 5,
          y: 0
        }
      })
    )
  }

  // Spawn bombs randomly on canvas
  if (frames % 200 === 0 && bombs.length < 3) {
    bombs.push(
      new Bomb({
        position: {
          x: randomBetween(Bomb.radius, canvas.width - Bomb.radius),
          y: randomBetween(Bomb.radius, canvas.height - Bomb.radius)
        },
        velocity: {
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 6
        }
      })
    )
  }

  for (let i = bombs.length - 1; i >= 0; i--) {
    const bomb = bombs[i]

    if (bomb.opacity <= 0) {
      bombs.splice(i, 1)
    } else bomb.update()
  }

  player.update()

  for (let i = player.particles.length - 1; i >= 0; i--) {
    const particle = player.particles[i]
    particle.update()

    if (particle.opacity === 0) player.particles[i].splice(i, 1)
  }

  particles.forEach((particle, i) => {
    if (particle.position.y - particle.radius >= canvas.height) {
      particle.position.x = Math.random() * canvas.width
      particle.position.y = -particle.radius
    }

    if (particle.opacity <= 0) {
      setTimeout(() => {
        particles.splice(i, 1)
      }, 0)
    } else {
      particle.update()
    }
  })

  invaderProjectiles.forEach((invaderProjectile, index) => {
    if (
      invaderProjectile.position.y + invaderProjectile.height >=
      canvas.height
    ) {
      setTimeout(() => {
        invaderProjectiles.splice(index, 1)
      }, 0)
    } else invaderProjectile.update()

    // Spider projectile hits the player
    if (
      rectangularCollision({
        rectangle1: invaderProjectile,
        rectangle2: player
      })
    )
    {
      if (score >= 2000)
      {
        winGame()
      }
      invaderProjectiles.splice(index, 1)
      endGame()
    }
  })

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i]

    for (let j = bombs.length - 1; j >= 0; j--) {
      const bomb = bombs[j]

      // When bomb explodes, remove the projectile and bomb
      if (
        Math.hypot(
          projectile.position.x - bomb.position.x,
          projectile.position.y - bomb.position.y
        ) <
          projectile.radius + bomb.radius &&
        !bomb.active
      ) {
        projectiles.splice(i, 1)
        bomb.explode()
      }
    }

    for (let j = powerUps.length - 1; j >= 0; j--) {
      const powerUp = powerUps[j]

      // No projectile can go through the bombs
      if (
        Math.hypot(
          projectile.position.x - powerUp.position.x,
          projectile.position.y - powerUp.position.y
        ) <
        projectile.radius + powerUp.radius
      ) {
        projectiles.splice(i, 1)
        powerUps.splice(j, 1)
        player.powerUp = 'AutomaticProjectile'
        console.log('powerup started')
        

        setTimeout(() => {
          player.powerUp = null
          console.log('powerup ended')
        }, 5000)
      }
    }

    if (projectile.position.y + projectile.radius <= 0) {
      projectiles.splice(i, 1)
    } else {
      projectile.update()
    }
  }

  grids.forEach((grid, gridIndex) => {
    grid.update()

    // Firing projectiles
    if (frames % 100 === 0 && grid.invaders.length > 0) {
      grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(
        invaderProjectiles
      )
    }

    for (let i = grid.invaders.length - 1; i >= 0; i--) {
      const invader = grid.invaders[i]
      invader.update({ velocity: grid.velocity })

      for (let j = bombs.length - 1; j >= 0; j--) {
        const bomb = bombs[j]

        const invaderRadius = 15

        // Bomb & Spiders
        if (
          Math.hypot(
            invader.position.x - bomb.position.x,
            invader.position.y - bomb.position.y
          ) <
            invaderRadius + bomb.radius &&
          bomb.active
        ) {
          score += 50
          scoreEl.innerHTML = score

          grid.invaders.splice(i, 1)
          createScoreLabel({
            object: invader,
            score: 50
          })

          createParticles({
            object: invader,
            fades: true
          })
        }
      }

      // Hits the spider
      projectiles.forEach((projectile, j) => {
        if (
          projectile.position.y - projectile.radius <=
            invader.position.y + invader.height &&
          projectile.position.x + projectile.radius >= invader.position.x &&
          projectile.position.x - projectile.radius <=
            invader.position.x + invader.width &&
          projectile.position.y + projectile.radius >= invader.position.y
        ) {
          setTimeout(() => {
            const invaderFound = grid.invaders.find(
              (invader2) => invader2 === invader
            )
            const projectileFound = projectiles.find(
              (projectile2) => projectile2 === projectile
            )

            // Spider 
            if (invaderFound && projectileFound) {
              score += 100
              scoreEl.innerHTML = score
              if (score >= 2000)
                  {
                    console.log('You Win!');
                    winGame()
                  }
              createScoreLabel({
                object: invader
              })

              createParticles({
                object: invader,
                fades: true
              })

              // Kills the spider
              audio.explode.play()
              grid.invaders.splice(i, 1)
              projectiles.splice(j, 1)

              if (grid.invaders.length > 0) {
                const firstInvader = grid.invaders[0]
                const lastInvader = grid.invaders[grid.invaders.length - 1]

                grid.width =
                  lastInvader.position.x -
                  firstInvader.position.x +
                  lastInvader.width
                grid.position.x = firstInvader.position.x
              } else {
                grids.splice(gridIndex, 1)
              }
            }
          }, 0)
        }
      })

      // If spider touches the player, end the game
      if (
        rectangularCollision({
          rectangle1: invader,
          rectangle2: player
        }) &&
        !game.over
      )
        endGame()
    } // Continously send out spiders
  })

  if (keys.a.pressed && player.position.x >= 0) {
    player.velocity.x = -7
    player.rotation = -0.15
  } else if (
    keys.d.pressed &&
    player.position.x + player.width <= canvas.width
  ) {
    player.velocity.x = 7
    player.rotation = 0.15
  } else {
    player.velocity.x = 0
    player.rotation = 0
  }

  // Spider Spawning in x amounts
  if (frames % randomInterval === 0) {
    spawnBuffer = spawnBuffer < 0 ? 100 : spawnBuffer
    grids.push(new Grid())
    randomInterval = Math.floor(Math.random() * 500 + spawnBuffer)
    frames = 0
    spawnBuffer -= 100
  }

  if (
    keys.space.pressed &&
    player.powerUp === 'AutomaticProjectile' &&
    frames % 2 === 0 &&
    !game.over
  ) {
    if (frames % 6 === 0) audio.shoot.play()
    projectiles.push(
      new Projectile(
        {
        position: 
        {
          x: player.position.x + player.width / 2,
          y: player.position.y
        },
        velocity: {
          x: 0,
          y: -10
        },
        color: 'Blue'
      })
    )
  }

  frames++
}

document.querySelector('#startButton').addEventListener('click', () => {
  
  audio.start.play()
  score = 0;

  document.querySelector('#startScreen').style.display = 'none'
  document.querySelector('#scoreContainer').style.display = 'block'
  init()
  animate()
})

document.querySelector('#restartButton').addEventListener('click', () => {
 
  document.querySelector('#restartScreen').style.display = 'none'
  init()
  animate()
})

addEventListener('keydown', ({ key }) => {
  if (game.over) return

  switch (key) {
    case 'a':
      keys.a.pressed = true
      break
    case 'd':
      keys.d.pressed = true
      break
    case ' ':
      keys.space.pressed = true

      if (player.powerUp === 'AutomaticProjectile') return

      audio.shoot.play()
      projectiles.push(
        new Projectile({
          position: {
            x: player.position.x + player.width / 2,
            y: player.position.y
          },
          velocity: {
            x: 0,
            y: -10
          }
        })
      )

      break
  }
})

addEventListener('keyup', ({ key }) => {
  switch (key) {
    case 'a':
      keys.a.pressed = false
      break
    case 'd':
      keys.d.pressed = false
      break
    case ' ':
      keys.space.pressed = false

      break
  }
})
