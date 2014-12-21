/* globals define */
define(function(require, exports, module) {
    'use strict';
    // import dependencies
    var Engine = require('famous/core/Engine');
    var Modifier = require('famous/core/Modifier');
    var Transform = require('famous/core/Transform');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var StateModifier = require('famous/modifiers/StateModifier');
    // create the main context
    var mainCon = Engine.createContext();

    // your app here


    mainCon.setPerspective(1000);

    var Ship = function Ship() {
      this.surface = new ImageSurface({
        size:[52,52],
        content: '/content/images/AsteroidsShip_color.gif'
      });
    };
    var ship0 = new Ship;
    var initShipPlacement = new StateModifier({
      align: [0.5, 0.5],
      origin: [0.5,0.5]
    });
    mainCon.add(initShipPlacement).add(ship0.surface);

    var logo = new ImageSurface({
        size: [200, 200],
        content: '/content/images/famous_logo.png',
        classes: ['backfaceVisibility']
    });

    var initialTime = Date.now();
    var centerSpinModifier = new Modifier({
        align: [0.5, 0.5],
        origin: [0.5, 0.5],
        transform: function() {
            return Transform.rotateY(.002 * (Date.now() - initialTime));
        }
    });

    // mainCon.add(centerSpinModifier).add(logo);
});
