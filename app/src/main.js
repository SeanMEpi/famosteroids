/* globals define */
define(function(require, exports, module) {
    'use strict';
    // import dependencies
    var Engine = require('famous/core/Engine');
    var Modifier = require('famous/core/Modifier');
    var Transform = require('famous/core/Transform');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var StateModifier = require('famous/modifiers/StateModifier');
    var PhysicsEngine = require ('famous/physics/PhysicsEngine');
    var Circle = require('famous/physics/bodies/Circle');
    var Body = require('famous/physics/bodies/Body');
    // create the main context
    var mainCon = Engine.createContext();

    // your app here
    var physicsEng = new PhysicsEngine();

    mainCon.setPerspective(1000);

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
      this.direction = 0.0;
      this.rotationModifier = function() {
        return new StateModifier({ transform: Transform.rotateZ(this.direction) });
      };

      this.getMagnitude = function() {
        return Math.sqrt( ((this.particle.getVelocity()[0]) * (this.particle.getVelocity()[0])) + ((this.particle.getVelocity()[1]) * (this.particle.getVelocity()[1])) );
      };
      this.getDirection = function() {
        var direction = Math.atan2((-1 * this.particle.getVelocity()[1]), this.particle.getVelocity()[0]);
        direction = direction * (180 / Math.PI);
        if (this.particle.getVelocity()[1] > 0) {
          direction = direction + 360;
        }
        return direction;
      };
      this.setMagnitudeAndDirection = function(magnitude, direction) {
        direction = direction * (Math.PI / 180);
        var xComp = magnitude * Math.cos(direction);
        var yComp = -1 * magnitude * Math.sin(direction);
        this.particle.setVelocity([xComp,yComp,0]);
        this.direction = direction;
      };
    };

    var ship0 = new Ship([0.5,0.5],[0.5,0.5]);
    physicsEng.addBody(ship0.particle);
    shipArray.push(ship0);

    console.log(ship0.direction);
    ship0.setMagnitudeAndDirection(0.0, 0);
    console.log(ship0.direction);

    Engine.on('keydown', function(e) {
      if (e.which === 65) {
        ship0.setMagnitudeAndDirection(0.0, 180);
        mainCon.add(ship0.state).add(ship0.rotationModifier()).add(ship0.surface);
        console.log(ship0.direction);
      }
    });

    mainCon.add(ship0.state).add(ship0.rotationModifier()).add(ship0.surface);

    // var logo = new ImageSurface({
    //     size: [200, 200],
    //     content: '/content/images/famous_logo.png',
    //     classes: ['backfaceVisibility']
    // });

    // var initialTime = Date.now();
    // var centerSpinModifier = new Modifier({
    //     align: [0.5, 0.5],
    //     origin: [0.5, 0.5],
    //     transform: function() {
    //         return Transform.rotateY(.002 * (Date.now() - initialTime));
    //     }
    // });

    // mainCon.add(centerSpinModifier).add(logo);
});
