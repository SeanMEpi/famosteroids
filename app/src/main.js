/* globals define */
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

    // create global items
    var mainCon = Engine.createContext();
    var physicsEng = new PhysicsEngine();

    var background = new Surface({
      size: [(window.innerWidth), (window.innerHeight)],
      properties: {
        backgroundColor: '#FFFFFF'
      }
    });
    mainCon.add(background);

    /* ------- ship setup -------- */

    var shipArray = [];

    var Ship = function Ship(shipAlign, shipOrigin) {
      this.surface = new ImageSurface({
        size:[52,52],
        content: '/content/images/AsteroidsShip_color.gif'
      });
      this.alignment = shipAlign;
      this.state = new StateModifier({
        align: shipAlign,
        origin: shipOrigin
      });
      this.particle = new Circle({radius:20});
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
      this.collision = new Collision();
      this.onCollision = function() {
        this.particle.setVelocity([0,0,0]);
      };
      physicsEng.addBody(this.particle);
      shipArray.push(this);
      mainCon.add(this.state).add(this.rotationModifier()).add(this.surface);
    };

    var ship0 = new Ship([0.5,0.5],[0.5,0.5]);
    ship0.collision.on('postCollision', function() {
        ship0.onCollision();                          // if this line is in ship object & this.onCollison()
    });                                               // it fails. So the decleration is left here.

    /* -------- Asteroid Setup -------- */

    var asteroidArray = [];
    var Asteroid = function Asteroid() {
      this.surface = new ImageSurface({
        size:[100,101],
        content: '/content/images/asteroid_100px.png'
      });
      this.state = new StateModifier({
        align: [0.5, 0.5],
        origin: [0.5, 0.5]
      });
      this.particle = new Circle({radius:45});
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
      for (var i=0; i< shipArray.length; i++) {
        physicsEng.attach(shipArray[i].collision, shipArray[i].particle, this.particle);
      };
      asteroidArray.push(this);
      mainCon.add(this.state).add(this.rotationModifier()).add(this.surface);
      var randomDirection = Random.range(0, 2 * Math.PI);
      this.direction = randomDirection;
      this.addVector();
      var randomX = Random.integer(-window.innerWidth, window.innerWidth);
      var randomY = Random.integer(-window.innerHeight, window.innerHeight);
      this.particle.setPosition([ randomX, randomY, 0]);
    };

    var ast0 = new Asteroid();
    var ast1 = new Asteroid();
    var ast2 = new Asteroid();
    var ast3 = new Asteroid();
    var ast4 = new Asteroid();

    /* --------- player controls -------- */

    Engine.on('keydown', function(e) {
      if (e.which === 65) {
        ship0.direction -= Math.PI / 20;
        mainCon.add(ship0.state).add(ship0.rotationModifier()).add(ship0.surface);
      } else if (e.which === 68) {
        ship0.direction += Math.PI / 20;
        mainCon.add(ship0.state).add(ship0.rotationModifier()).add(ship0.surface);
      } else if (e.which === 87) {
        ship0.addVector();
      };
    });

    /* -------- utility functions -------- */

    var wraparound = function(thing) {
      if ( (thing.particle.getPosition()[0]) >= (window.innerWidth / 2) ) {
        thing.particle.setPosition([- window.innerWidth / 2, thing.particle.getPosition()[1], 0]);
      } else if ( (thing.particle.getPosition()[0]) <= (- window.innerWidth / 2) ) {
        thing.particle.setPosition([window.innerWidth / 2, thing.particle.getPosition()[1], 0]);
      } else if ( (thing.particle.getPosition()[1]) >= (window.innerHeight / 2) ) {
        thing.particle.setPosition([thing.particle.getPosition()[0], (-window.innerHeight / 2), 0]);
      } else if ( (thing.particle.getPosition()[1]) <= (- window.innerHeight / 2) ) {
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

    /* -------- main event loop -------- */

    Timer.every( function() {
      for (var i=0; i < shipArray.length; i++) {
        magnitudeLimit(shipArray[i], 1);
        shipArray[i].state.setTransform(shipArray[i].particle.getTransform());
        wraparound(shipArray[i]);
      };
      for (var i=0; i < asteroidArray.length; i++) {
        magnitudeLimit(asteroidArray[i], 1);
        asteroidArray[i].state.setTransform(asteroidArray[i].particle.getTransform());
        wraparound(asteroidArray[i]);
      };
    }, 1);

});
