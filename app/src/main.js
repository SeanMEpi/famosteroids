/* -------- famo.us setup -------- */
define(function(require, exports, module) {
  'use strict';
  // import dependencies
  var Engine = require('famous/core/Engine');
  var Modifier = require('famous/core/Modifier');
  var Transform = require('famous/core/Transform');
  var ImageSurface = require('famous/surfaces/ImageSurface');
  var Surface = require('famous/core/Surface');
  var StateModifier = require('famous/modifiers/StateModifier');
  var PhysicsEngine = require ('famous/physics/PhysicsEngine');
  var Collision = require('famous/physics/constraints/Collision');
  var Circle = require('famous/physics/bodies/Circle');
  var Body = require('famous/physics/bodies/Body');
  var Vector = require('famous/math/Vector');
  var Timer = require('famous/utilities/Timer');
  var Random = require('famous/math/Random');
  var EventHandler = require('famous/core/EventHandler');
  var CanvasSurface = require('famous/surfaces/CanvasSurface');

  var mainCon = Engine.createContext();
  var physicsEng = new PhysicsEngine();

  var background = new Surface({
    size: [(window.innerWidth), (window.innerHeight)],
    content: 'Source code at https://github.com/SeanMEpi<br>Controls: w-thrust, a-rotate left, d-rotate right, l-fire<br>PRESS R TO RESET',
    properties: {
      color: 'grey',
      backgroundColor: '#030303'
    }
  });
  var backgroundStateMod = new StateModifier({
    transform: Transform.translate(0,0,-10)
  });

  mainCon.add(backgroundStateMod).add(background);


  var scoreboard = new CanvasSurface({
      size:[200,100],
      properties : {
        backgroundColor: '#030303'
      }
  });
  scoreboard.score = 0;
  var scoreboardStateMod = new StateModifier({
    align: [0.5, 0],
    origin: [0.5, 0],
    transform: Transform.translate(0, 0, -5)
  });
  mainCon.add(scoreboardStateMod).add(scoreboard);



  var Thing = function Thing() {
    /* -------- Surfaces & movement -------- */
    this.defaultSurface = null;
    this.deadSurface = new Surface({
      size:[1,1],
      properties: {
        backgroundColor: '#030303'
      }
    });
    this.currentSurface = null;
    this.stateMod = null;
    this.particle = null;
    this.direction = null;
    this.dead = false;
    this.rotationModifier = function() {
      return new StateModifier({ transform: Transform.rotateZ(this.direction) });
    };
    this.addVector = function(amount) {
      var XToAdd = amount * Math.cos(this.direction);
      var YToAdd = amount * Math.sin(this.direction);
      var currentX = this.particle.getVelocity()[0];
      var currentY = this.particle.getVelocity()[1];
      var newX = currentX + XToAdd;
      var newY = currentY + YToAdd;
      this.particle.setVelocity([newX, newY, 0]);
    };
    this.getMagnitude = function() {
      return Math.sqrt((this.particle.getVelocity()[0] * this.particle.getVelocity()[0]) +
                       (this.particle.getVelocity()[1] * this.particle.getVelocity()[1]));
    };
    this.setRandomPositionAndDirection = function(magnitude) {
      var randomDirection = Random.range(0, 2 * Math.PI);
      this.direction = randomDirection;
      this.addVector(magnitude);
      var randomX = Random.integer(-window.innerWidth, window.innerWidth);
      var randomY = Random.integer(-window.innerHeight, window.innerHeight);
      this.particle.setPosition([ randomX, randomY, 0]);
    };
    this.wraparound = function() {
      if ( (this.particle.getPosition()[0]) >= (window.innerWidth / 2) ) {
        this.particle.setPosition([-window.innerWidth / 2, this.particle.getPosition()[1], 0]);
      } else if ( (this.particle.getPosition()[0]) <= (-window.innerWidth / 2) ) {
        this.particle.setPosition([window.innerWidth / 2, this.particle.getPosition()[1], 0]);
      } else if ( (this.particle.getPosition()[1]) >= (window.innerHeight / 2) ) {
        this.particle.setPosition([this.particle.getPosition()[0], (-window.innerHeight / 2), 0]);
      } else if ( (this.particle.getPosition()[1]) <= (-window.innerHeight / 2) ) {
        this.particle.setPosition([this.particle.getPosition()[0], window.innerHeight / 2, 0]);
      };
    };
    this.magnitudeLimit = function(maxMagnitude) {
      var magnitude = Math.sqrt( ((this.particle.getVelocity()[0]) * (this.particle.getVelocity()[0])) + ((this.particle.getVelocity()[1]) * (this.particle.getVelocity()[1])) );
      if (magnitude >= maxMagnitude) {
        var xComponant = maxMagnitude * Math.cos(this.direction);
        var yComponant = maxMagnitude * Math.sin(this.direction);
        this.particle.setVelocity([xComponant, yComponant, 0]);
      };
    };

    /* -------- shield -------- */
    this.allowShield = true;
    this.shieldCounter = 0;
    this.shieldTimer = function(value) {
      this.shieldCounter  += value;
      if (this.shieldCounter >= 1800) {
        this.shieldCounter = 1800;
        this.shieldOff();
        this.allowShield = false;
      };
    };
    this.shieldOn = function() {
      this.currentSurface = this.shipWithShield;
      mainCon.add(this.state).add(this.rotationModifier()).add(this.currentSurface);
      this.collision.shield = true;
    };
    this.shieldOff = function() {
      this.currentSurface = this.shipSurface;
      mainCon.add(this.state).add(this.rotationModifier()).add(this.currentSurface);
      this.collision.shield = false;
    };

    /* -------- add remove items -------- */

    this.reset = function() {
      this.particle.setPosition([0,0,0]);
      this.direction = 3 * Math.PI / 2;
      this.currentSurface = this.defaultSurface;
      mainCon.add(this.stateMod).add(this.rotationModifier()).add(this.currentSurface);
      this.collision.alive = true;
    };
  };

  /* -------- Ship object -------- */
  var Ship = function Ship() {
    //surface setup
    this.defaultSurface = new ImageSurface({
      size:[52,52],
      content: '/content/images/ship_4.png'
    });
    this.shipWithShield = new ImageSurface({
      size:[52,52],
      content: '/content/images/ship_3_shields.png'
    });
    this.currentSurface = this.defaultSurface;
    this.stateMod = new StateModifier({
      align: [0.5, 0.5],
      origin: [0.5, 0.5]
    });
    this.particle = new Circle({
      radius:20,
    });
    this.direction = 3 * Math.PI / 2;
    this.eventHandler = new EventHandler();
    this.eventHandler.currentSurface = this.currentSurface;
    this.eventHandler.stateMod = this.stateMod;
    this.eventHandler.particle = this.particle;
    this.eventHandler.explode = function(time) {
      this.explosionSurface = new ImageSurface({
        size:[100,100],
        content: '/content/images/graphics-explosions-210621.gif'
      });
      this.currentSurface = this.explosionSurface;
      mainCon.add(this.stateMod).add(this.currentSurface);
      this.explosionTimer = time;
    };
    this.torpTimer = 0;  // timer for spacing out Torpedos
  };
  Ship.prototype = new Thing();

  /* -------- Asteroid objects -------- */
  var Asteroid = function Asteroid() {
    this.defaultSurface = new ImageSurface({
      size:[100,100],
      content: '/content/images/asteroid_2.png'
    });
    this.currentSurface = this.defaultSurface;
    this.stateMod = new StateModifier({
      align: [0.5, 0.5],
      origin: [0.5, 0.5]
    });
    this.particle = new Circle({
      radius:20,
    });
    this.particle.setMass(32);  // default mass is 1; this sets asteroids to 32x ship mass
    this.eventHandler = new EventHandler();
    this.eventHandler.currentSurface = this.currentSurface;
    this.eventHandler.stateMod = this.stateMod;
    this.eventHandler.particle = this.particle;
    this.eventHandler.explodeAllow = true;
    this.eventHandler.explode = function(time) {
      scoreboard.score += 10;
      this.explodeAllow = false;
      this.particle.setVelocity([0,0,0]);
      this.explosionSurface = new ImageSurface({
        size:[100,100],
        content: '/content/images/graphics-explosions-210621.gif'
      });
      this.currentSurface = this.explosionSurface;
      mainCon.add(this.stateMod).add(this.currentSurface);
      this.explosionTimer = time;
      createOneAsteroid(MediumAsteroid);
      createOneCollision(asteroids[asteroids.length - 1], ships);
      addOneAsteroidToGame(asteroids[asteroids.length - 1]);
      var randomX = Random.integer(-10,10);
      var randomY = Random.integer(-10,10);
      var newX = this.particle.getPosition()[0] + randomX;
      var newY = this.particle.getPosition()[1] + randomY;
      asteroids[asteroids.length -1].particle.setPosition([newX, newY, 0]);
      createOneAsteroid(MediumAsteroid);
      createOneCollision(asteroids[asteroids.length - 1], ships);
      addOneAsteroidToGame(asteroids[asteroids.length - 1]);
      randomX = Random.integer(-10,10);
      randomY = Random.integer(-10,10);
      newX = this.particle.getPosition()[0] + randomX;
      newY = this.particle.getPosition()[1] + randomY;
      asteroids[asteroids.length -1].particle.setPosition([newX, newY, 0]);
    };
  };
  Asteroid.prototype = new Thing();

  var MediumAsteroid = function MediumAsteroid() {
    this.defaultSurface = new ImageSurface({
      size:[50,50],
      content: '/content/images/asteroid_medium.png'
    });
    this.currentSurface = this.defaultSurface;
    this.stateMod = new StateModifier({
      align: [0.5, 0.5],
      origin: [0.5, 0.5]
    });
    this.particle = new Circle({
      radius:20,
    });
    this.particle.setMass(16);  // default mass is 1; this sets asteroids to 16x ship mass
    this.eventHandler = new EventHandler();
    this.eventHandler.currentSurface = this.currentSurface;
    this.eventHandler.stateMod = this.stateMod;
    this.eventHandler.particle = this.particle;
    this.eventHandler.explodeAllow = true;
    this.eventHandler.explode = function(time) {
      scoreboard.score += 20;
      this.explodeAllow = false;
      this.particle.setVelocity([0,0,0]);
      var currentX = this.particle.getPosition()[0];
      var currentY = this.particle.getPosition()[1];
      this.explosionSurface = new ImageSurface({
        size:[100,100],
        content: '/content/images/graphics-explosions-210621.gif'
      });
      this.currentSurface = this.explosionSurface;
      mainCon.add(this.stateMod).add(this.currentSurface);
      this.explosionTimer = time;
    };
  };
  MediumAsteroid.prototype = new Thing();

  var SmallAsteroid = function SmallAsteroid() {
    this.defaultSurface = new ImageSurface({
      size:[25,25],
      content: '/content/images/asteroid_small.png'
    });
    this.currentSurface = this.defaultSurface;
    this.stateMod = new StateModifier({
      align: [0.5, 0.5],
      origin: [0.5, 0.5]
    });
    this.particle = new Circle({
      radius:20,
    });
    this.particle.setMass(8);  // default mass is 1; this sets asteroids to 32x ship mass
    this.eventHandler = new EventHandler();
    this.eventHandler.currentSurface = this.currentSurface;
    this.eventHandler.stateMod = this.stateMod;
    this.eventHandler.particle = this.particle;
    this.eventHandler.createDisallow = 0;
    this.eventHandler.explode = function(time) {
      this.particle.setVelocity([0,0,0]);
      this.explosionSurface = new ImageSurface({
        size:[100,100],
        content: '/content/images/graphics-explosions-210621.gif'
      });
      this.currentSurface = this.explosionSurface;
      mainCon.add(this.stateMod).add(this.currentSurface);
      this.explosionTimer = time;
    };
  };
  SmallAsteroid.prototype = new Thing();

  /* -------- Torpedo Objects -------- */

  var Torpedo = function Torpedo() {
    //surface setup
    this.defaultSurface = new Surface ({
      size: [10,10],
      properties: {
        backgroundColor: '#63C7DB',
        borderRadius: '200px'
      }
    });
    this.currentSurface = this.defaultSurface;
    this.stateMod = new StateModifier({
      align: [0.5, 0.5],
      origin: [0.5, 0.5]
    });
    this.particle = new Circle({
      radius:10,
    });
    this.direction = 0;
    this.existanceTimer = 60;
    this.eventHandler = new EventHandler();
    this.eventHandler.currentSurface = this.currentSurface;
    this.eventHandler.stateMod = this.stateMod;
    this.eventHandler.particle = this.particle;
    this.eventHandler.explode = function(time) {
      this.particle.setVelocity([0,0,0]);
      this.currentSurface = this.deadSurface;
      mainCon.add(this.stateMod).add(this.currentSurface);
      physicsEng.removeBody(this.particle);
      this.explosionTimer = time;
    };

  };
  Torpedo.prototype = new Thing();

  /* -------- Global Collision Handler -------- */

  var collision = new Collision();
  var createCollisions = function (array1, array2) {
    for (var i=0; i<array1.length; i++) {
      createOneCollision(array1[i], array2);
    };
  };
  var createOneCollision = function (item, array2) {
    for (var i=0; i<array2.length; i++) {
      physicsEng.attach(collision, item.particle, array2[i].particle);
    };
  };

  collision.broadcast = new EventHandler();
  collision.on('collision', function(data) {
    this.broadcast.emit(data.source.ID);
    this.broadcast.emit(data.target.ID);
  });

  /* --------- keystate register for player controls -------- */

  var keyState = {};
  Engine.on('keydown',function(e){
    keyState[e.keyCode || e.which] = true;
  },true);
  Engine.on('keyup',function(e){
    keyState[e.keyCode || e.which] = false;
  },true);

  /* -------- utility functions -------- */

  var removeItem = function(item) {
    physicsEng.removeBody(item.particle);
    item.currentSurface = item.deadSurface;
    mainCon.add(item.stateMod).add(item.currentSurface);
    item.dead = true;
  };

  /* -------- main event loop -------- */

  Timer.every( function() {
    for (var i=0; i < ships.length; i++) {
      ships[i].magnitudeLimit(1);
      ships[i].stateMod.setTransform(ships[i].particle.getTransform());
      ships[i].wraparound();
      // if (ships[i].collision.alive === false) {
      //   resetShip(ships[i]);
      // };
      if (keyState[65] /*&& ships[i].collision.alive*/) {
      ships[i].direction -= Math.PI / 32;
      mainCon.add(ships[i].stateMod).add(ships[i].rotationModifier()).add(ships[i].currentSurface);
      };
      if (keyState[68] /*&& ships[i].collision.alive*/) {
        ships[i].direction += Math.PI / 32;
        mainCon.add(ships[i].stateMod).add(ships[i].rotationModifier()).add(ships[i].currentSurface);
      };
      if (keyState[87] /*&& ships[i].collision.alive*/) {
        ships[i].addVector(0.02);
      };
      if (keyState[82]) {
        sessionStorage.score = scoreboard.score;
        location.reload();
      };
      if (ships[i].eventHandler.explosionTimer > 0) {
          ships[i].eventHandler.explosionTimer -= 1;
          if (ships[i].eventHandler.explosionTimer === 0) {
            removeItem(ships[i]);
          };
        };

      // allow torpedo fire every 5 frames if torpedos in play < 4
      if (ships[i].torpTimer > 0) {
        ships[i].torpTimer -= 1;
      };
      if ((keyState[76]) && (torpedos.length < 4) && (ships[i].torpTimer === 0)) {
        createTorpedo(ships[i]);
      };

    };

    for (var i=0; i < asteroids.length; i++) {
      asteroids[i].magnitudeLimit(1);
      asteroids[i].stateMod.setTransform(asteroids[i].particle.getTransform());
      asteroids[i].wraparound();
      if (asteroids[i].eventHandler.createDisallow > 0) {
        asteroids[i].eventHandler.createDisallow -= 1;
      };
      if (asteroids[i].eventHandler.explosionTimer > 0) {
        asteroids[i].eventHandler.explosionTimer -= 1;
        if (asteroids[i].eventHandler.explosionTimer === 0) {
          removeItem(asteroids[i]);
          asteroids.splice(i,1);
        };
      };
    };

    for (var i=0; i < torpedos.length; i++) {
      torpedos[i].stateMod.setTransform(torpedos[i].particle.getTransform());
      torpedos[i].wraparound();
      if (torpedos[i].eventHandler.explosionTimer > 0) {
        torpedos[i].eventHandler.explosionTimer -= 1;
        if (torpedos[i].eventHandler.explosionTimer === 0) {
          removeItem(torpedos[i]);
          torpedos.splice(i, 1);
        };
      };
      if (torpedos[i].existanceTimer > 0) {
        torpedos[i].existanceTimer -= 1;
        if (torpedos[i].existanceTimer === 0) {
          removeItem(torpedos[i]);
          torpedos.splice(i,1);
        };
      };
    };

    var ctx = scoreboard.getContext('2d');
    ctx.font = "30px Arial";
    ctx.fillStyle = 'white';
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillText("Score: " + scoreboard.score.toString(),10,50);
  }, 1);

  var ships = [];
  var createShips = function(number) {
    for (var i=0; i<number; i++) {
      ships[i] = new Ship();
      ships[i].particle.ID = i;
      ships[i].eventHandler.subscribe(collision.broadcast);
      ships[i].eventHandler.on(i, function() {
        this.explode(60);
      });
    };
  };
  var addShipsToGame = function() {
    for (var i=0; i<ships.length; i++) {
      physicsEng.addBody(ships[i].particle);
      ships[i].currentSurface.render = function render() { return this.id; };
      mainCon.add(ships[i].stateMod).add(ships[i].rotationModifier()).add(ships[i].currentSurface);
    };
  };

  var asteroids = [];
  var createAsteroids = function(number, type) {
    for (var i=0; i<number; i++) {
      createOneAsteroid(type);
    };
  };
  var createOneAsteroid = function(type) {
    var thisIndex = asteroids.length;
    asteroids[thisIndex] = new type();
    asteroids[thisIndex].particle.ID = thisIndex + 2000;
    asteroids[thisIndex].eventHandler.ID = thisIndex + 2000;
    asteroids[thisIndex].eventHandler.subscribe(collision.broadcast);
    asteroids[thisIndex].eventHandler.on((thisIndex+2000).toString(), function() {
      if (this.explodeAllow) {
        this.explode(20);
      };
    });
  };
  var addAsteroidsToGame = function() {
    for (var i=0; i<asteroids.length; i++) {
      addOneAsteroidToGame(asteroids[i]);
    };
  };
  var addOneAsteroidToGame = function(asteroid) {
    physicsEng.addBody(asteroid.particle);
    asteroid.currentSurface.render = function render() { return this.id; };
    asteroid.setRandomPositionAndDirection(.1);
    mainCon.add(asteroid.stateMod).add(asteroid.rotationModifier()).add(asteroid.currentSurface);
  };
  var torpedos = [];
  var createTorpedo = function(ship) {
    var thisIndex = torpedos.length;
    torpedos[thisIndex] = new Torpedo();
    torpedos[thisIndex].particle.ID = thisIndex + 1000;
    torpedos[thisIndex].eventHandler.ID = thisIndex + 1000;
    torpedos[thisIndex].eventHandler.subscribe(collision.broadcast);
    torpedos[thisIndex].eventHandler.on((thisIndex+1000).toString(), function() {
      this.explode(0);
    });
    createOneCollision(torpedos[thisIndex], asteroids);
    physicsEng.addBody(torpedos[thisIndex].particle);
    torpedos[thisIndex].currentSurface.render = function render() { return this.id; };
    torpedos[thisIndex].direction = ship.direction;
    torpedos[thisIndex].particle.setPosition(ship.particle.getPosition());
    torpedos[thisIndex].particle.setVelocity(ship.particle.getVelocity());
    torpedos[thisIndex].addVector(.5);
    mainCon.add(torpedos[thisIndex].stateMod).add(torpedos[thisIndex].rotationModifier()).add(torpedos[thisIndex].currentSurface);
    ship.torpTimer = 5;
  };

  var resetGame = function() {
    var savedScore = parseInt(sessionStorage.score);
    if (!savedScore) {
      scoreboard.score = 0;
    } else {
      scoreboard.score = savedScore;
    };
    createShips(1);
    createAsteroids(5, Asteroid);
    createCollisions(ships, asteroids);
    addShipsToGame();
    addAsteroidsToGame();
  };

  resetGame();

});
