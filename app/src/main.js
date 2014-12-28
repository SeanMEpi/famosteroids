/* -------- famo.us setup -------- */
define(function(require, exports, module) {
    // 'use strict';
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

    /* -------- global setup -------- */

    var mainCon = Engine.createContext();
    var physicsEng = new PhysicsEngine();

    var background = new Surface({
      size: [(window.innerWidth), (window.innerHeight)],
      properties: {
        backgroundColor: '#030303'
      }
    });
    var backgroundStateMod = new StateModifier({
      transform: Transform.translate(0,0,-2)
    });

    mainCon.add(backgroundStateMod).add(background);

    /* ------- ship setup -------- */

    var shipArray = [];

    var Ship = function Ship() {
      this.surface = new ImageSurface({
        size:[52,52],
        content: '/content/images/ship_2.png'
      });
      this.shipWithShield = new ImageSurface({
        size:[52,52],
        content: '/content/images/ship_3_shields.png'
      });
      this.currentSurface = this.surface;
      this.state = new StateModifier({
        align: [0.5,0.5],
        origin: [0.5,0.5]
      });
      this.particle = new Circle({radius:20});
      this.direction = 3 * Math.PI / 2; //radians
      this.rotationModifier = function() {
        return new StateModifier({ transform: Transform.rotateZ(this.direction) });
      };
      this.addVector = function() {
        var XToAdd = 0.02 * Math.cos(this.direction);
        var YToAdd = 0.02 * Math.sin(this.direction);
        var currentX = this.particle.getVelocity()[0];
        var currentY = this.particle.getVelocity()[1];
        var newX = currentX + XToAdd;
        var newY = currentY + YToAdd;
        this.particle.setVelocity([newX, newY, 0]);
      };
      this.collision = new Collision();
      this.collision.alive = true;
      this.collision.shield = false;
      this.resetCounter = 0;
      this.collision.explosion = function() {
        return new ImageSurface({
          size:[100,100],
          content: 'content/images/graphics-explosions-210621.gif'
        });
      };
      this.collision.explosionStateMod = new StateModifier({
         transform: Transform.translate(0, 0, -1)
      });
      this.collision.agentIDs = [];
      this.attach = function(arrayToAttach) {
        for (var i=0; i < arrayToAttach.length; i++) {
          this.collision.agentIDs.push(physicsEng.attach(this.collision, arrayToAttach[i].particle, this.particle));
        };
      };
      // these next 3 are duplicates passed to collision handler
      this.collision.particle = this.particle;
      this.collision.state = this.state;
      this.collision.surface = this.surface;
      this.collision.on('postCollision', function() {
        if (this.shield === false) {
          this.particle.setVelocity([0,0,0]);
          this.alive = false;
          explosionDisplay = this.explosion();
          mainCon.add(this.state).add(this.explosionStateMod).add(explosionDisplay);
        };
      });
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
        this.currentSurface = this.surface;
        mainCon.add(this.state).add(this.rotationModifier()).add(this.currentSurface);
        this.collision.shield = false;
      };
      physicsEng.addBody(this.particle);
      shipArray.push(this);
      mainCon.add(this.state).add(this.rotationModifier()).add(this.surface);
    };

    /* -------- Asteroid Setup -------- */

    var asteroidArray = [];
    var Asteroid = function Asteroid() {
      this.surface = new ImageSurface({
        size:[100,101],
        content: '/content/images/asteroid_2.png'
      });
      this.state = new StateModifier({
        align: [0.5, 0.5],
        origin: [0.5, 0.5]
      });
      this.particle = new Circle({radius:35});
      this.particle.setMass(8);
      this.direction = 0.0; //radians
      this.rotationModifier = function() {
        return new StateModifier({ transform: Transform.rotateZ(this.direction) });
      };
      this.addVector = function() {
        var XToAdd = 0.1 * Math.cos(this.direction);
        var YToAdd = 0.1 * Math.sin(this.direction);
        var currentX = this.particle.getVelocity()[0];
        var currentY = this.particle.getVelocity()[1];
        var newX = currentX + XToAdd;
        var newY = currentY + YToAdd;
        this.particle.setVelocity([newX, newY, 0]);
      };
      physicsEng.addBody(this.particle);
      asteroidArray.push(this);
      mainCon.add(this.state).add(this.rotationModifier()).add(this.surface);
      var randomDirection = Random.range(0, 2 * Math.PI);
      this.direction = randomDirection;
      this.addVector();
      var randomX = Random.integer(-window.innerWidth, window.innerWidth);
      var randomY = Random.integer(-window.innerHeight, window.innerHeight);
      this.particle.setPosition([ randomX, randomY, 0]);
    };

    /* --------- keystate register for player controls -------- */

    var keyState = {};
    Engine.on('keydown',function(e){
      keyState[e.keyCode || e.which] = true;
    },true);
    Engine.on('keyup',function(e){
      keyState[e.keyCode || e.which] = false;
    },true);

    /* -------- utility functions -------- */

    var wraparound = function(thing) {
      if ( (thing.particle.getPosition()[0]) >= (window.innerWidth / 2) ) {
        thing.particle.setPosition([-window.innerWidth / 2, thing.particle.getPosition()[1], 0]);
      } else if ( (thing.particle.getPosition()[0]) <= (-window.innerWidth / 2) ) {
        thing.particle.setPosition([window.innerWidth / 2, thing.particle.getPosition()[1], 0]);
      } else if ( (thing.particle.getPosition()[1]) >= (window.innerHeight / 2) ) {
        thing.particle.setPosition([thing.particle.getPosition()[0], (-window.innerHeight / 2), 0]);
      } else if ( (thing.particle.getPosition()[1]) <= (-window.innerHeight / 2) ) {
        thing.particle.setPosition([thing.particle.getPosition()[0], window.innerHeight / 2, 0]);
      };
    };

    var magnitudeLimit = function(thing, maxMagnitude) {
      var magnitude = Math.sqrt( ((thing.particle.getVelocity()[0]) * (thing.particle.getVelocity()[0])) + ((thing.particle.getVelocity()[1]) * (thing.particle.getVelocity()[1])) );
      if (magnitude >= maxMagnitude) {
        var xComponant = maxMagnitude * Math.cos(thing.direction);
        var yComponant = maxMagnitude * Math.sin(thing.direction);
        thing.particle.setVelocity([xComponant, yComponant, 0]);
      }
    };

    var resetShip = function(ship) {
      ship.resetCounter += 1;
      if (ship.resetCounter >= 180) {
        ship.collision.alive = true;
        ship.direction = 3 * Math.PI / 2;
        mainCon.add(ship.state).add(ship.rotationModifier()).add(ship.surface);
        ship.particle.setPosition([ 0, 0, 0]);
        ship.resetCounter = 0;
        ship.shieldCounter = 0;
        ship.allowShield = true;
        return
      };
    };

    /* -------- main event loop -------- */

    Timer.every( function() {
      for (var i=0; i < shipArray.length; i++) {
        magnitudeLimit(shipArray[i], 1);
        shipArray[i].state.setTransform(shipArray[i].particle.getTransform());
        wraparound(shipArray[i]);
        if (shipArray[i].collision.alive === false) {
          resetShip(shipArray[i]);
        };
        if (keyState[65] && shipArray[i].collision.alive) {
        shipArray[i].direction -= Math.PI / 32;
        mainCon.add(shipArray[i].state).add(shipArray[i].rotationModifier()).add(shipArray[i].currentSurface);
        };
        if (keyState[68] && shipArray[i].collision.alive) {
          shipArray[i].direction += Math.PI / 32;
          mainCon.add(shipArray[i].state).add(shipArray[i].rotationModifier()).add(shipArray[i].currentSurface);
        };
        if (keyState[87] && shipArray[i].collision.alive) {
          shipArray[i].addVector();
        };
        // if shield is not on, shield time remains and button is pressed, enable it
        if (keyState[79] && shipArray[i].collision.alive && !shipArray[i].collision.shield && shipArray[i].allowShield) {
          shipArray[i].shieldOn();
        };
        //if shield is on and button is released, disable it
        if (!keyState[79] && shipArray[i].collision.shield) {
          shipArray[i].shieldOff();
        };
        //if shield is on, increment shield disable timer
        if (shipArray[i].collision.shield) {
          shipArray[i].shieldTimer(10);
        };

      };

      for (var i=0; i < asteroidArray.length; i++) {
        magnitudeLimit(asteroidArray[i], 1);
        asteroidArray[i].state.setTransform(asteroidArray[i].particle.getTransform());
        wraparound(asteroidArray[i]);
      };

    }, 1);

    /* -------- add objects to play screen -------- */

    var ship0 = new Ship();

    var ast0 = new Asteroid();
    var ast1 = new Asteroid();
    var ast2 = new Asteroid();
    var ast3 = new Asteroid();
    var ast4 = new Asteroid();

    ship0.attach(asteroidArray);

});
