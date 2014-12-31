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
  var EventHandler = require('famous/core/EventHandler');

  var mainCon = Engine.createContext();
  var physicsEng = new PhysicsEngine();
  var collision = new Collision();

  var background = new Surface({
    size: [(window.innerWidth), (window.innerHeight)],
    properties: {
      backgroundColor: '#030303'
    }
  });
  var backgroundStateMod = new StateModifier({
    transform: Transform.translate(0,0,-10)
  });

  mainCon.add(backgroundStateMod).add(background);

  var SpaceThing = function SpaceThing() {

    /* -------- Surfaces & movement -------- */
    this.defaultSurface = null;
    this.currentSurface = null;
    this.stateMod = null;
    this.particle = null;
    this.direction = null;
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

    /* -------- collision -------- */
    this.collisions = [];
    this.createCollision = function(itemToCollideWith) {
      this.collision = new Collision();
      this.collision.alive = true;
      this.collision.shield = false;
      this.resetCounter = 0; // used if SpaceThing should regenerate after a period of time, e.g. a player ship
      this.collision.explosionSurface = new ImageSurface({
        size:[100,100],
        content: 'content/images/graphics-explosions-210621.gif'
      });
      this.collision.explosionStateMod = new StateModifier({
        transform: Transform.translate(0, 0, -1)
      });
      this.collision.itemToCollideWith = itemToCollideWith;
      this.collision.agent = physicsEng.attach(this.collision, itemToCollideWith.particle, this.particle);
      this.collision.hostItem = this;
      this.collision.surface = this.surface;
      this.collision.on('postCollision', this.collisionCallback());
      this.collisions.push(this.collision);
    };
    this.createCollisions = function(arrayOfItems) {
      for (var i=0; i<arrayOfItems.length; i++) {
        this.createCollision(arrayOfItems[i]);
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
    this.addToGame = function(itemArray) {
      this.currentSurface.render = function render() { return this.id; };
      physicsEng.addBody(this.particle);
      itemArray.push(this);
      mainCon.add(this.stateMod).add(this.rotationModifier()).add(this.currentSurface);
    };
    this.removeFromGame = function(itemArray, itemIndex) {
      physicsEng.removeBody(this.particle);
      this.currentSurface.render = function(){ return null; };
      itemArray.slice(itemArray[itemIndex],1);
    };
  };

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
    this.direction = 3 * Math.PI / 2; //face top of screen
    this.collisionCallback = function() {

    };
  };
  Ship.prototype = new SpaceThing();

  var shipArray = [];
  var ship0 = new Ship();
  ship0.addToGame(shipArray);

});
