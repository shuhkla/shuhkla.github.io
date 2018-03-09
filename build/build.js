/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	window.PEWVR = {};

	// Assets managment
	__webpack_require__(1)

	__webpack_require__(2);

	// Systems.
	__webpack_require__(3);
	__webpack_require__(5);
	__webpack_require__(6);

	// Bullets.
	__webpack_require__(7);

	// Enemies.
	__webpack_require__(8);
	__webpack_require__(9);

	// Components
	__webpack_require__(10);
	__webpack_require__(11);
	__webpack_require__(12);
	__webpack_require__(13);
	__webpack_require__(14);
	__webpack_require__(15);
	__webpack_require__(16);
	__webpack_require__(17);
	__webpack_require__(18);
	__webpack_require__(19);
	__webpack_require__(21);
	__webpack_require__(22);
	__webpack_require__(23);
	__webpack_require__(24);
	__webpack_require__(25);
	__webpack_require__(26);
	__webpack_require__(27);
	__webpack_require__(28);
	__webpack_require__(29);
	__webpack_require__(30);
	__webpack_require__(31);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	AFRAME.registerElement('a-asset-image', {
	  prototype: Object.create(AFRAME.ANode.prototype, {
	    createdCallback: {
	      value: function () {
	        this.isAssetItem = true;
	      }
	    },

	    attachedCallback: {
	      value: function () {
	        var src = this.getAttribute('src');
	        var textureLoader = new THREE.ImageLoader();
	        textureLoader.load(src, this.onImageLoaded.bind(this));
	      }
	    },

	    onImageLoaded: {
	      value : function () {
	        AFRAME.ANode.prototype.load.call(this);
	      }
	    }
	  })
	});


/***/ }),
/* 2 */
/***/ (function(module, exports) {

	/* globals AFRAME */
	function createMixin (id, obj, scene) {
	  var mixinEl = document.createElement('a-mixin');
	  mixinEl.setAttribute('id', id);
	  Object.keys(obj).forEach(function (componentName) {
	    var value = obj[componentName];
	    if (typeof value === 'object') {
	      value = AFRAME.utils.styleParser.stringify(value);
	    }
	    mixinEl.setAttribute(componentName, value);
	  });

	  var assetsEl = scene ? scene.querySelector('a-assets') : document.querySelector('a-assets');
	  if (!assetsEl) {
	    assetsEl = document.createElement('a-assets');
	    scene.appendChild(assetsEl);
	  }
	  assetsEl.appendChild(mixinEl);

	  return mixinEl;
	}

	Number.prototype.padLeft = function (n,str) {
	  return Array(n-String(this).length+1).join(str||'0')+this;
	}

	String.prototype.pad = function (n,left, str) {
	  var string = String(this).substr(0,n);
	  var empty = Array(n-string.length+1).join(str||' ');
	  return left ? empty + this : this + empty;
	}

	module.exports = {
	  createMixin: createMixin
	};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	/* global AFRAME PEWVR */
	var PoolHelper = __webpack_require__(4);

	PEWVR.BULLETS = {};

	PEWVR.registerBullet = function (name, data, definition) {
	  if (PEWVR.BULLETS[name]) {
	    throw new Error('The bullet `' + name + '` has been already registered. ' +
	                    'Check that you are not loading two versions of the same bullet ' +
	                    'or two different bullets of the same name.');
	  }

	  PEWVR.BULLETS[name] = {
	    poolSize: data.poolSize,
	    components: data.components,
	    definition: definition
	  };

	  console.info('Bullet registered ', name);
	};

	AFRAME.registerSystem('bullet', {
	  init: function () {
	    var self = this;
	    this.poolHelper = new PoolHelper('bullet', PEWVR.BULLETS, this.sceneEl);
	    this.activeBullets = [];

	    this.sceneEl.addEventListener('gamestate-changed', function (evt) {
	      if ('state' in evt.detail.diff) {
	        if (evt.detail.state.state === 'STATE_GAME_OVER' || evt.detail.state.state === 'STATE_GAME_WIN') {
	          self.reset();
	        }
	      }
	    });
	  },

	  reset: function (entity) {
	    var self = this;
	    this.activeBullets.forEach(function (bullet) {
	      self.returnBullet(bullet.getAttribute('bullet').name, bullet);
	    });
	  },

	  returnBullet: function (name, entity) {
	    this.activeBullets.splice(this.activeBullets.indexOf(entity), 1);
	    this.poolHelper.returnEntity(name, entity);
	  },

	  getBullet: function (name) {
	    var self = this;
	    var bullet = this.poolHelper.requestEntity(name);
	    this.activeBullets.push(bullet);
	    return bullet;
	  }
	});


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	var createMixin = __webpack_require__(2).createMixin;

	var PoolHelper = function (groupName, data, sceneEl) {
	  this.groupName = groupName;
	  this.sceneEl = sceneEl || document.querySelector('a-scene');
	  this.initializePools(groupName, data);
	};

	PoolHelper.prototype = {
	  initializePools: function (groupName, data) {
	    var self = this;
	    Object.keys(data).forEach(function (name) {
	      var item = data[name];
	      var components = item.components;
	      var mixinName = groupName + name;
	      createMixin(mixinName, components, self.sceneEl);

	      self.sceneEl.setAttribute('pool__' + mixinName,
	        {
	          size: item.poolSize,
	          mixin: mixinName,
	          dynamic: true
	        });
	    });
	  },

	  returnEntity: function (name, entity) {
	    var mixinName = this.groupName + name;
	    var poolName = 'pool__' + mixinName;
	    this.sceneEl.components[poolName].returnEntity(entity);
	  },

	  requestEntity: function (name) {
	    var mixinName = this.groupName + name;
	    var poolName = 'pool__' + mixinName;
	    var entity = this.sceneEl.components[poolName].requestEntity();
	    // entity.id= this.groupName + Math.floor(Math.random() * 1000);
	    return entity;
	  }
	};

	module.exports = PoolHelper;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	/* globals PEWVR AFRAME */
	var PoolHelper = __webpack_require__(4);

	PEWVR.ENEMIES = {};

	PEWVR.registerEnemy = function (name, data, definition) {
	  if (PEWVR.ENEMIES[name]) {
	    throw new Error('The enemy `' + name + '` has been already registered. ' +
	                    'Check that you are not loading two versions of the same enemy ' +
	                    'or two different enemies of the same name.');
	  }

	  PEWVR.ENEMIES[name] = {
	    poolSize: data.poolSize,
	    components: data.components,
	    definition: definition,
	    name: name
	  };

	  console.info('Enemy registered ', name);
	};

	AFRAME.registerSystem('enemy', {
	  schema: {
	    wave: {default: 0}
	  },

	  init: function () {
	    var self = this;
	    var sceneEl = this.sceneEl;

	    if (!sceneEl.hasLoaded) {
	      sceneEl.addEventListener('loaded', this.init.bind(this));
	      return;
	    }

	    this.poolHelper = new PoolHelper('enemy', PEWVR.ENEMIES, this.sceneEl);

	    this.activeEnemies = [];

	    // TODO: Enable A-Frame `System.update()` to decouple from gamestate.
	    sceneEl.addEventListener('gamestate-changed', function (evt) {
	      if ('state' in evt.detail.diff) {
	        if (evt.detail.state.state === 'STATE_PLAYING') {
	          setTimeout(function(){
	            self.createWave(0);
	          }, 1000);
	        }
	        else if (evt.detail.state.state === 'STATE_GAME_OVER'
	          || evt.detail.state.state === 'STATE_GAME_WIN'
	          ||evt.detail.state.state === 'STATE_MAIN_MENU') {
	          self.reset();
	          return;
	        }
	      }

	      if ('waveSequence' in evt.detail.diff) {
	        self.createSequence(evt.detail.state.waveSequence);
	      }

	      if ('wave' in evt.detail.diff) {
	        self.createWave(evt.detail.state.wave);
	      }
	    });
	  },

	  getEnemy: function (name) {
	    return this.poolHelper.requestEntity(name);
	  },

	  onEnemyDeath: function (name, entity) {
	    if (this.sceneEl.getAttribute('gamestate').state === 'STATE_MAIN_MENU') {
	      this.sceneEl.emit('start-game');
	    } else {
	      this.poolHelper.returnEntity(name, entity);
	      this.sceneEl.emit('enemy-death');
	    }
	  },

	  createSequence: function (sequenceNumber) {
	    var self = this;
	    var startOffset = this.currentWave.sequences[sequenceNumber].start || 0;
	    setTimeout(function initFirstSequence() {
	      self.currentSequence = sequenceNumber;
	      var sequence = self.currentWave.sequences[sequenceNumber];
	      sequence.enemies.forEach(function createEnemyFromDef (enemyDef) {
	        self.createEnemies(enemyDef);
	      });
	    }, startOffset);
	  },

	  createWave: function (waveNumber) {
	    this.currentWave = WAVES[waveNumber % WAVES.length];
	    // console.log('Creating wave', waveNumber);
	    this.createSequence(0);
	    this.sceneEl.emit('wave-created', {wave: this.currentWave});
	  },

	  createEnemy: function (enemyType, enemyDefinition, timeOffset) {
	    var self = this;
	    var entity = this.getEnemy(enemyType);

	    entity.setAttribute('enemy', {shootingDelay: 3000});
	    entity.setAttribute('curve-movement', {
	      type: enemyDefinition.movement,
	      loopStart: enemyDefinition.loopStart || 1,
	      timeOffset: timeOffset || 0
	    });

	    function activateEnemy(entity) {
	      entity.setAttribute('visible', true);
	      entity.components['curve-movement'].addPoints(enemyDefinition.points);
	      entity.play();
	      self.activeEnemies.push(entity);
	      self.sceneEl.emit('enemy-spawn', {enemy: entity});
	    }

	    if (timeOffset) {
	      if (timeOffset < 0) {
	        entity.setAttribute('visible', false);
	        setTimeout(function() {
	          activateEnemy(entity);
	        }, -timeOffset);
	      } else {

	      }
	    } else {
	      activateEnemy(entity);
	    }
	  },

	  createEnemies: function (enemyDefinition) {
	    if (Array.isArray(enemyDefinition.type)) {
	      for (var i = 0; i < enemyDefinition.type.length; i++) {
	        var type = enemyDefinition.type[i];
	        var timeOffset = (enemyDefinition.enemyTimeOffset || 0) * i;
	        this.createEnemy(type, enemyDefinition, timeOffset);
	      }
	    } else {
	      this.createEnemy(enemyDefinition.type, enemyDefinition);
	    }
	  },

	  reset: function (entity) {
	    var self = this;
	    this.activeEnemies.forEach(function (enemy) {
	      self.poolHelper.returnEntity(enemy.getAttribute('enemy').name, enemy);
	    });
	  }
	});


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	/* globals PEWVR AFRAME */
	var PoolHelper = __webpack_require__(4);

	PEWVR.EXPLOSIONS = {};

	PEWVR.registerExplosion = function (name, data, definition) {
	  if (PEWVR.EXPLOSIONS[name]) {
	    throw new Error('The explosion `' + name + '` has been already registered. ' +
	                    'Check that you are not loading two versions of the same explosion ' +
	                    'or two different enemies of the same name.');
	  }

	  PEWVR.EXPLOSIONS[name] = {
	    poolSize: data.poolSize,
	    components: data.components,
	    definition: definition,
	    name: name
	  };

	  console.info('Explosion registered ', name);
	};

	AFRAME.registerSystem('explosion', {
	  schema: {
	    wave: {default: 0}
	  },

	  init: function () {
	    this.poolHelper = new PoolHelper('explosion', PEWVR.EXPLOSIONS, this.sceneEl);
	    this.activeExplosions = [];
	  },

	  reset: function (entity) {
	    var self = this;
	    this.activeExplosions.forEach(function (entity) {
	      self.returnToPool(entity.getAttribute('explosion').name, entity);
	    });
	  },

	  returnToPool: function (name, entity) {
	    this.activeExplosions.splice(this.activeExplosions.indexOf(entity), 1);
	    this.poolHelper.returnEntity(name, entity);
	  },

	  getFromPool: function (name) {
	    var entity = this.poolHelper.requestEntity(name);
	    this.activeExplosions.push(entity);
	    return entity;
	  },

	  createExplosion: function (type, position, color, scale, direction, enemyName) {
	    var explosionEntity = this.getFromPool(type);
	    explosionEntity.setAttribute('position', position || this.el.getAttribute('position'));
	    explosionEntity.setAttribute('explosion', {
	        type: type,
	        lookAt: direction.clone(),
	        color: color || '#FFF',
	        scale: scale || 1.0
	    });

	    explosionEntity.setAttribute('visible', true);

	    explosionEntity.play();
	  }
	});


	/* globals PEWVR */
	PEWVR.registerExplosion(
	  // name
	  'enemy',
	  // data
	  {
	    components: {
	      explosion: {
	        type: 'enemy',
	      },
	    },
	    poolSize: 10
	  },
	  // implementation
	  {
	  }
	);

	/* globals PEWVR */
	PEWVR.registerExplosion(
	  // name
	  'enemygun',
	  // data
	  {
	    components: {
	      explosion: {
	        type: 'enemygun',
	      },
	    },
	    poolSize: 10
	  },
	  // implementation
	  {
	  }
	);


	/* globals PEWVR */
	PEWVR.registerExplosion(
	  // name
	  'bullet',
	  // data
	  {
	    components: {
	      explosion: {
	        type: 'bullet',
	      },
	    },
	    poolSize: 10
	  },
	  // implementation
	  {
	  }
	);

	/* globals PEWVR */
	PEWVR.registerExplosion(
	  // name
	  'background',
	  // data
	  {
	    components: {
	      explosion: {
	        type: 'background',
	      },
	    },
	    poolSize: 10
	  },
	  // implementation
	  {
	  }
	);


/***/ }),
/* 7 */
/***/ (function(module, exports) {

	/* globals PEWVR */
	PEWVR.registerBullet(
	  // name
	  'default',
	  // data
	  {
	    components: {
	      bullet: {
	        name: 'default',
	        maxSpeed: 1,
	        initialSpeed: 0.1,
	        acceleration: 0.4,
	        color: '#ffc724'
	      },
	      'collision-helper': {
	        debug: false,
	        radius: 0.2
	      },
	      'json-model': {
	        src: '#playerBullet',
	      }
	    },
	    poolSize: 10
	  },
	  // implementation
	  {
	    init: function () {
	      var el = this.el;
	      var color = this.bullet.components.bullet.color;
	      el.setAttribute('material', 'color', color);
	      el.setAttribute('scale', {x: 0.2, y: 0.2, z: 0.2});
	      this.trail = null;
	      var self = this;
	      el.addEventListener('model-loaded', function(event) {
	        // @todo Do it outside
	        //event.detail.model.children[0].material.color.setRGB(1,0,0);
	        self.trail = self.el.getObject3D('mesh').getObjectByName('trail');
	        self.trail.scale.setY(0.001);
	      });
	    },
	    reset: function () {
	      var el = this.el;
	      el.setAttribute('scale', {x: 0.2, y: 0.2, z: 0.2});
	      if (this.trail) {
	        this.trail.scale.setY(0.001);
	      }
	    },
	    tick: function (time, delta) {
	      //stretch trail
	      if (this.trail && this.trail.scale.y < 1) {
	        var trailScale;
	        if (this.trail.scale.y < 0.005) {
	          trailScale = this.trail.scale.y + 0.001;
	        }
	        else {
	          trailScale = this.trail.scale.y + delta/50;
	        }
	        if (trailScale > 1) { trailScale = 1; }
	        this.trail.scale.setY(trailScale);
	      }
	    },
	    onHit: function (type) {
	      this.el.setAttribute('material', 'color', '#FFF');
	    }
	  }
	);


/***/ }),
/* 8 */
/***/ (function(module, exports) {

	/* globals PEWVR */

	PEWVR.registerEnemy(
	  // name
	  'enemy_start',
	  // data
	  {
	    components: {
	      enemy: {
	        name: 'enemy_start',
	        color: '#FFB911',
	        scale: 0.1,
	        health: 1
	      },
	      'collision-helper': {
	        debug: false,
	        radius: 0.4
	      },
	      'json-model': {
	        // src: 'url(assets/models/enemy0.json)',
	        src: 'url(assets/models/target.json)',
	        texturePath: 'url(assets/images/)',
	        singleModel: true
	      }
	    },
	    poolSize: 1
	  },
	  // implementation
	  {
	    init: function () {
	      this.shootingDelay = 3000;
	      this.warmUpTime = 1000;
	      this.reset();
	    },
	    reset: function () {
	      var el = this.el;
	      var sc = this.data.scale;
	      el.addEventListener('model-loaded', function(event) {
	        el.getObject3D('mesh').scale.set(sc, sc, sc);
	      });
	      this.lastShoot = undefined;
	      this.willShootEmited = false;
	    },
	    tick: function (time, delta) {
	    //   this.el.components.enemy.willShoot(time, delta, this.warmUpTime);
	    },
	    onHit: function (type) {}
	  }
	);


/***/ }),
/* 9 */
/***/ (function(module, exports) {

	/* globals PEWVR */
	PEWVR.registerEnemy(
	  // name
	  'enemy0',
	  // data
	  {
	    components: {
	      enemy: {
	        name: 'enemy0',
	        bulletName: 'enemy-slow',
	        color: '#FFB911',
	        scale: 0.9,
	        health: 1
	      },
	      'collision-helper': {
	        debug: false,
	        radius: 0.4
	      },
	      'json-model': {
	        src: '#enemy0',
	        texturePath: 'url(assets/images/)',
	        singleModel: true
	      }
	    },
	    poolSize: 10
	  },
	  // implementation
	  {
	    init: function () {
	      this.shootingDelay = 3000;
	      this.warmUpTime = 1000;
	      this.reset();
	    },
	    reset: function () {
	      var el = this.el;
	      var sc = this.data.scale;
	      this.actualShootingDelay = this.shootingDelay + Math.floor(this.shootingDelay * Math.random());

	      el.addEventListener('model-loaded', function(event) {
	        el.getObject3D('mesh').scale.set(sc, sc, sc);
	      });
	      this.lastShoot = undefined;
	      this.willShootEmited = false;
	    },
	    tick: function (time, delta) {
	      if (this.lastShoot == undefined ) {
	        this.lastShoot = time;
	      }
	    },
	    onHit: function (type) {}
	  }
	);


/***/ }),
/* 10 */
/***/ (function(module, exports) {

	AFRAME.registerComponent('proxy_event', {
	  schema: {
	    event: { default: '' },
	    dst: { type: 'selector' },
	    bubbles: { default: false }
	  },

	  init: function () {
	    this.el.sceneEl.addEventListener(this.data.event, function (event) {
	      this.data.dst.emit(this.data.event, event, this.data.bubbles);
	    }.bind(this));
	  }
	});


/***/ }),
/* 11 */
/***/ (function(module, exports) {

	AFRAME.registerComponent('countdown', {
	  schema: {
	    start: {default: '01:00'},
	    value: {default: '00:00'},
	    autostart: {default: false}
	  },

	  init: function () {
	    this.timeinterval = null;
	    if (this.data.autostart) {
	      this.restart();
	    }

	    var self = this;
	    this.el.sceneEl.addEventListener('gamestate-changed', function (evt) {
	      if ('state' in evt.detail.diff) {
	        switch (evt.detail.state.state) {
	          case 'STATE_PLAYING':
	            self.restart();
	            break;
	          case 'STATE_GAME_OVER':
	          case 'STATE_GAME_WIN':
	          case 'STATE_MAIN_MENU':
	            self.stop();
	        }
	      }
	    });
	  },

	  initializeClock: function (endtime) {
	    var self = this;

	    this.el.sceneEl.emit('countdown-start', endtime);
	    function updateTimer() {
	      var total = Date.parse(endtime) - Date.parse(new Date());
	      var seconds = Math.floor( (total/1000) % 60 );
	      var minutes = Math.floor( (total/1000/60) % 60 );
	      var t = {
	        'total': total,
	        'minutes': minutes,
	        'seconds': seconds
	      };
	      self.el.sceneEl.emit('countdown-update', t);
	      if (t.total <= 0) {
	        clearInterval(self.timeinterval);
	        self.el.sceneEl.emit('countdown-end');
	      }
	    }

	    this.timeinterval = setInterval(updateTimer, 1000);
	    updateTimer();
	  },

	  stop: function () {
	    clearInterval(this.timeinterval);
	    this.el.sceneEl.emit('countdown-update', {
	      'total': 0,
	      'minutes': 0,
	      'seconds': 0
	    });
	  },

	  restart: function () {
	    this.stop();

	    var values = this.data.start.split(':').map(function(value) { return parseInt(value); });
	    var deadline = new Date(Date.parse(new Date()) + (values[0] * 60 + values[1]) * 1000);
	    this.initializeClock(deadline);
	  }
	});


/***/ }),
/* 12 */
/***/ (function(module, exports) {

	/* globals AFRAME THREE */
	AFRAME.registerSystem('decals', {
	  schema: {
	    size: {default: 0.1},
	    src: {default: '', type: 'asset'},
	    maxDecals: {default: 30} // 0 for infinite
	  },

	  init: function () {
	    this.numDecals = 0;
	    this.decals = [];
	    this.oldestDecalIdx = 0;
	    this.textureSrc = null;

	    this.geometry = new THREE.PlaneGeometry(1, 1);
	    this.material = new THREE.MeshBasicMaterial({
	      transparent: true,
	      color: '#ffc724',
	      depthTest: true,
	      depthWrite: false,
	      polygonOffset: true,
	      polygonOffsetFactor: -20
	    });

	    this.updateMap();
	  },

	  updateMap: function () {
	    var src = this.data.src;

	    if (src) {
	      if (src === this.textureSrc) { return; }
	      // Texture added or changed.
	      this.textureSrc = src;
	      this.sceneEl.systems.material.loadTexture(src, {src: src}, setMap.bind(this));
	      return;
	    }

	    // Texture removed.
	    if (!this.material.map) { return; }
	    setMap(null);

	    function setMap (texture) {
	      this.material.map = texture;
	      this.material.needsUpdate = true;
	    }
	  },

	  update: function (oldData) {
	    this.updateMap();
	  },

	  getDecal: function () {
	    var maxDecals = this.data.maxDecals;
	    var size = this.data.size;
	    var decal = null;

	    if (maxDecals === 0 || this.numDecals < maxDecals) {
	      decal = new THREE.Mesh(this.geometry, this.material);
	      this.numDecals++;
	      this.decals.push(decal);
	    } else {
	      decal = this.decals[this.oldestDecalIdx];
	      this.oldestDecalIdx = (this.oldestDecalIdx + 1) % this.data.maxDecals;
	    }
	    decal.scale.set(size, size, size);

	    return decal;
	  },

	  addDecal: function (point, normal) {
	    var decal = this.getDecal();
	    if (decal) {
	      decal.position.set(0, 0, 0);
	      decal.position.copy(point);
	      decal.lookAt(normal);
	      decal.rotation.z += Math.random() * Math.PI * 2;
	      this.sceneEl.object3D.add(decal);
	    }
	  }
	});


/***/ }),
/* 13 */
/***/ (function(module, exports) {

	/* global AFRAME, THREE */

	THREE.Spline = function ( points ) {

		this.points = points;

		var c = [], v3 = { x: 0, y: 0, z: 0 },
		point, intPoint, weight, w2, w3,
		pa, pb, pc, pd;

		this.initFromArray = function ( a ) {

			this.points = [];

			for ( var i = 0; i < a.length; i ++ ) {

				this.points[ i ] = { x: a[ i ][ 0 ], y: a[ i ][ 1 ], z: a[ i ][ 2 ] };

			}

		};

		this.getPoint = function ( k ) {

			point = ( this.points.length - 1 ) * k;
			intPoint = Math.floor( point );
			weight = point - intPoint;

			c[ 0 ] = intPoint === 0 ? intPoint : intPoint - 1;
			c[ 1 ] = intPoint;
			c[ 2 ] = intPoint  > this.points.length - 2 ? this.points.length - 1 : intPoint + 1;
			c[ 3 ] = intPoint  > this.points.length - 3 ? this.points.length - 1 : intPoint + 2;

			pa = this.points[ c[ 0 ] ];
			pb = this.points[ c[ 1 ] ];
			pc = this.points[ c[ 2 ] ];
			pd = this.points[ c[ 3 ] ];

			w2 = weight * weight;
			w3 = weight * w2;

			v3.x = interpolate( pa.x, pb.x, pc.x, pd.x, weight, w2, w3 );
			v3.y = interpolate( pa.y, pb.y, pc.y, pd.y, weight, w2, w3 );
			v3.z = interpolate( pa.z, pb.z, pc.z, pd.z, weight, w2, w3 );

			return v3;

		};

		this.getControlPointsArray = function () {

			var i, p, l = this.points.length,
				coords = [];

			for ( i = 0; i < l; i ++ ) {

				p = this.points[ i ];
				coords[ i ] = [ p.x, p.y, p.z ];

			}

			return coords;

		};

		// approximate length by summing linear segments

		this.getLength = function ( nSubDivisions ) {

			var i, index, nSamples, position,
				point = 0, intPoint = 0, oldIntPoint = 0,
				oldPosition = new THREE.Vector3(),
				tmpVec = new THREE.Vector3(),
				chunkLengths = [],
				totalLength = 0;

			// first point has 0 length

			chunkLengths[ 0 ] = 0;

			if ( ! nSubDivisions ) nSubDivisions = 100;

			nSamples = this.points.length * nSubDivisions;

			oldPosition.copy( this.points[ 0 ] );

			for ( i = 1; i < nSamples; i ++ ) {

				index = i / nSamples;

				position = this.getPoint( index );
				tmpVec.copy( position );

				totalLength += tmpVec.distanceTo( oldPosition );

				oldPosition.copy( position );

				point = ( this.points.length - 1 ) * index;
				intPoint = Math.floor( point );

				if ( intPoint !== oldIntPoint ) {

					chunkLengths[ intPoint ] = totalLength;
					oldIntPoint = intPoint;

				}

			}

			// last point ends with total length

			chunkLengths[ chunkLengths.length ] = totalLength;

			return { chunks: chunkLengths, total: totalLength };

		};

		this.reparametrizeByArcLength = function ( samplingCoef ) {

			var i, j,
				index, indexCurrent, indexNext,
				realDistance,
				sampling, position,
				newpoints = [],
				tmpVec = new Vector3(),
				sl = this.getLength();

			newpoints.push( tmpVec.copy( this.points[ 0 ] ).clone() );

			for ( i = 1; i < this.points.length; i ++ ) {

				//tmpVec.copy( this.points[ i - 1 ] );
				//linearDistance = tmpVec.distanceTo( this.points[ i ] );

				realDistance = sl.chunks[ i ] - sl.chunks[ i - 1 ];

				sampling = Math.ceil( samplingCoef * realDistance / sl.total );

				indexCurrent = ( i - 1 ) / ( this.points.length - 1 );
				indexNext = i / ( this.points.length - 1 );

				for ( j = 1; j < sampling - 1; j ++ ) {

					index = indexCurrent + j * ( 1 / sampling ) * ( indexNext - indexCurrent );

					position = this.getPoint( index );
					newpoints.push( tmpVec.copy( position ).clone() );

				}

				newpoints.push( tmpVec.copy( this.points[ i ] ).clone() );

			}

			this.points = newpoints;

		};

		// Catmull-Rom

		function interpolate( p0, p1, p2, p3, t, t2, t3 ) {

			var v0 = ( p2 - p0 ) * 0.5,
				v1 = ( p3 - p1 ) * 0.5;

			return ( 2 * ( p1 - p2 ) + v0 + v1 ) * t3 + ( - 3 * ( p1 - p2 ) - 2 * v0 - v1 ) * t2 + v0 * t + p1;

		}

	}

	 /**
	  * Spline interpolation with waypoints.
	  */
	 AFRAME.registerComponent('curve-movement', {
	   schema: {
	     debug: {default: false},
	     type: {default: 'single'},
	     restTime: {default: 150},  // ms.
	     speed: {default: 3},  // meters per second.
	     loopStart: {default: 1},
	     timeOffset: {default: 0}
	   },

	   init: function () {
	     this.direction = 1;
	   },

	   isClosed: function () {
	     return this.data.type === 'loop';
	   },

	   addPoints: function (points) {
	     var data = this.data;
	     var spline;
	     var chunkLengths;

	     // Set waypoints.
	     if (data.type === 'loop') {
	       points = points.slice(0); // clone array as we'll need to modify it
	       points.push(points[this.data.loopStart]);
	     }

	     // Build spline.
	     spline = this.spline = ASpline();
	     spline.initFromArray(points);

	     // Keep track of current point to get to the next point.
	     this.currentPointIndex = 0;

	     // Compute how long to get from each point to the next for each chunk using speed.
	     chunkLengths = spline.getLength().chunks;
	     this.cycleTimes = chunkLengths.map(function (chunkLength, i) {
	       if (i === 0) { return null; }
	       return (chunkLength - chunkLengths[i - 1]) / data.speed * 1000;
	     }).filter(function (length) { return length !== null; });

	     // Keep a local time to reset at each point, for separate easing from point to point.
	     this.time = this.data.timeOffset;
	     this.initTime = null;
	     this.restTime = 0;
	     this.direction = 1;
	     this.end = false;
	   },

	   update: function () {
	     var data = this.data;
	     var el = this.el;

	     // Visual debug stuff.
	     if (data.debug) {
	       el.setAttribute('spline-line', {pointer: 'movement-pattern.movementPattern.spline'});
	     } else {
	       el.removeAttribute('spline-line');
	     }
	   },
	   play: function () {
	     this.time = this.data.timeOffset;
	     this.initTime = null;
	   },
	   tick: function (time, delta) {
	     var cycleTime;
	     var data = this.data;
	     var el = this.el;
	     var percent;
	     var point;
	     var spline = this.spline;

	     if (!this.initTime) {
	       this.initTime = time;
	     }

	     // If not closed and reached the end, just stop (for now).
	     if (this.end) {return;}
	     if (!this.isClosed() && this.currentPointIndex === spline.points.length - 1) { return; }

	     // Mod the current time to get the current cycle time and divide by total time.
	     cycleTime = this.cycleTimes[this.currentPointIndex];

	     var t = 0;
	     var jump = false;
	     if (this.time > cycleTime) {
	       t = 1;
	       jump = true;
	     } else {
	       t = this.time / cycleTime;
	     }

	     if (this.direction === -1) {
	       t = 1 - t;
	     }

	     if (data.type === 'single') {
	       percent = inOutSine(t);
	     }
	     else {
	       percent = t;
	     }

	     this.time = time - this.initTime;

	     if (this.time < 0) { console.log(percent); return; }

	     point = spline.getPointFrom(percent, this.currentPointIndex);
	     el.setAttribute('position', {x: point.x, y: point.y, z: point.z});
	     this.lastPercent = percent;

	     if (jump) {
	       if (this.direction === 1) {
	         if (this.currentPointIndex === spline.points.length - 2) {
	           if (data.type === 'single') {
	             this.end = true;
	           } else if (data.type === 'loop') {
	             this.currentPointIndex = this.data.loopStart;
	           } else {
	             this.direction = -1;
	           }
	         } else {
	           this.currentPointIndex ++;
	         }
	       } else {
	         this.currentPointIndex --;
	         if (this.currentPointIndex < this.data.loopStart) {
	           this.currentPointIndex = this.data.loopStart;
	           this.direction = 1;
	         }
	       }
	       this.initTime = time;
	       this.time = 0;
	     }
	   }
	 });

	 function inOutSine (k) {
	   return .5 * (1 - Math.cos(Math.PI * k));
	 }

	 /**
	  * Spline with point to point interpolation.
	  */
	 function ASpline (points) {
	   var spline = new THREE.Spline(points);

	   /**
	    * Interpolate between pointIndex and the next index.
	    *
	    * k {number} - From 0 to 1.
	    * pointIndex {number} - Starting point index to interpolate from.
	    */
	   spline.getPointFrom = function (k, pointIndex) {
	     var c, pa, pb, pc, pd, points, midpoint, w2, w3, v3, weight;
	     points = this.points;

	     midpoint = pointIndex + k;

	     c = [];
	     c[0] = pointIndex === 0 ? pointIndex : pointIndex - 1;
	     c[1] = pointIndex;
	     c[2] = pointIndex > points.length - 2 ? points.length - 1 : pointIndex + 1;
	     c[3] = pointIndex > points.length - 3 ? points.length - 1 : pointIndex + 2;

	     pa = points[c[0]];
	     pb = points[c[1]];
	     pc = points[c[2]];
	     pd = points[c[3]];

	     weight = midpoint - pointIndex;
	     w2 = weight * weight;
	     w3 = weight * w2;

	     v3 = {};
	     v3.x = interpolate(pa.x, pb.x, pc.x, pd.x, weight, w2, w3);
	     v3.y = interpolate(pa.y, pb.y, pc.y, pd.y, weight, w2, w3);
	     v3.z = interpolate(pa.z, pb.z, pc.z, pd.z, weight, w2, w3);
	     return v3;
	   };
	   spline.getPointFrom = spline.getPointFrom.bind(spline);

	   /**
	    * Catmull-Rom
	    */
	   function interpolate (p0, p1, p2, p3, t, t2, t3) {
	     var v0 = (p2 - p0) * 0.5;
	     var v1 = (p3 - p1) * 0.5;
	     return (2 * (p1 - p2) + v0 + v1) * t3 + (-3 * (p1 - p2) - 2 * v0 - v1) * t2 + v0 * t + p1;
	   }

	   return spline;
	 }


/***/ }),
/* 14 */
/***/ (function(module, exports) {

	/* globals AFRAME THREE */
	AFRAME.registerComponent('collision-helper', {
	  schema: {
	    type: {default: 'sphere', oneOf: ['sphere', 'box']},
	    radius: {default: 1, if: {type: ['sphere']}},
	    debug: {default: false},
	    color: {type: 'color', default: 0x888888}
	  },

	  init: function () {
	    var data = this.data;

	    this.geometry = new THREE.IcosahedronGeometry(1, 1);
	    this.material = new THREE.MeshBasicMaterial({color: data.color, wireframe: true});
	    this.helperMesh = null;

	    if (data.debug) {
	      this.createHelperMesh();
	    }
	  },

	  createHelperMesh: function () {
	    var radius = this.data.radius;
	    this.helperMesh = new THREE.Mesh(this.geometry, this.material);
	    this.helperMesh.visible = true;
	    this.helperMesh.scale.set(radius, radius, radius);
	    this.el.setObject3D('collision-helper-mesh', this.helperMesh);
	  },

	  update: function (oldData) {
	    var data = this.data;
	    if (!data.debug) { return; }

	    if (!this.helperMesh) {
	      this.createHelperMesh();
	    } else {
	      this.material.color.set(data.color);
	      this.helperMesh.scale.set(data.radius, data.radius, data.radius);
	      this.helperMesh.visible = data.debug;
	    }
	  }
	});


/***/ }),
/* 15 */
/***/ (function(module, exports) {

	/* global AFRAME */
	PEWVR.currentScore = {
	  name: '',
	  points: 0,
	  time: 0,
	  shoots: 0,
	  validShoot: 0
	};

	AFRAME.registerComponent('gamestate', {
	  schema: {
	    health: {default: 5},
	    numEnemies: {default: 0},
	    numSequences: {default: 0},
	    points: {default: 0},
	    numEnemiesToWin: {default: 100},
	    isGameOver: {default: false},
	    isGameWin: {default: false},
	    state: {default: 'STATE_MAIN_MENU', oneOf: ['STATE_MAIN_MENU', 'STATE_PLAYING', 'STATE_GAME_OVER', 'STATE_GAME_WIN']},
	    wave: {default: 0},
	    waveSequence: {default: 0}
	  },

	  gameEnd: function (newState, win) {
	    newState.state = 'STATE_GAME_WIN';
	    newState.isGameWin = true;
	  },
	  init: function () {
	    var self = this;
	    var el = this.el;
	    var initialState = this.initialState;
	    var state = this.data;

	    // Initial state.
	    if (!initialState) { initialState = state; }

	    el.emit('gamestate-initialized', {state: initialState});
	    registerHandler('enemy-death', function (newState) {
	      newState.points++;
	      PEWVR.currentScore.points++;
	      if (newState.points >= self.data.numEnemiesToWin) {
	        self.gameEnd(newState, true);
	     }

	      newState.numEnemies--;
	      // All enemies killed, advance wave.
	      if (newState.numEnemies === 0) {
	        newState.numSequences--;
	        newState.waveSequence++;
	        if (newState.numSequences === 0) {
	          newState.waveSequence = 0;
	          newState.wave++;
	          if (newState.wave >= WAVES.length) {
	            self.gameEnd(newState, true);
	          }
	        }
	      }
	      return newState;
	    });

	    registerHandler('wave-created', function (newState, params) {
	      var wave = params.detail.wave;
	      newState.numSequences = wave.sequences.length;
	      newState.waveSequence = 0;
	      return newState;
	    });

	    registerHandler('enemy-spawn', function (newState) {
	      newState.numEnemies++;
	      return newState;
	    });

	    registerHandler('start-game', function (newState) {
	      newState.isGameOver = false;
	      newState.isGameWin = false;
	      newState.state = 'STATE_PLAYING';
	      return newState;
	    });

	    registerHandler('player-hit', function (newState) {
	      if (newState.state === 'STATE_PLAYING') {
	        newState.health -= 1;
	        if (newState.health <= 0) {
	          newState.isGameOver = true;
	          newState.numEnemies = 0;
	          newState.state = 'STATE_GAME_OVER';
	        }
	      }
	      return newState;
	    });

	    registerHandler('reset', function () {
	      PEWVR.currentScore = {
	        name: '',
	        points: 0,
	        time: 0,
	        shoots: 0,
	        validShoot: 0
	      };

	      return initialState;
	    });

	    function registerHandler (event, handler) {
	      el.addEventListener(event, function (param) {
	        var newState = handler(AFRAME.utils.extend({}, state), param);
	        publishState(event, newState);
	      });
	    }

	    function publishState (event, newState) {
	      var oldState = AFRAME.utils.extend({}, state);
	      el.setAttribute('gamestate', newState);
	      state = newState;
	      el.emit('gamestate-changed', {
	        event: event,
	        diff: AFRAME.utils.diff(oldState, newState),
	        state: newState
	      });
	    }
	  }
	});

	/**
	 * Bind game state to a component property.
	 */
	AFRAME.registerComponent('gamestate-bind', {
	  schema: {
	    default: {},
	    parse: AFRAME.utils.styleParser.parse
	  },

	  update: function () {
	    var sceneEl = this.el.closestScene();
	    if (sceneEl.hasLoaded) {
	      this.updateBinders();
	    }
	    sceneEl.addEventListener('loaded', this.updateBinders.bind(this));
	  },

	  updateBinders: function () {
	    var data = this.data;
	    var el = this.el;
	    var subscribed = Object.keys(this.data);

	    el.sceneEl.addEventListener('gamestate-changed', function (evt) {
	      syncState(evt.detail.diff);
	    });

	    el.sceneEl.addEventListener('gamestate-initialized', function (evt) {
	      syncState(evt.detail.state);
	    });

	    function syncState (state) {
	      Object.keys(state).forEach(function updateIfNecessary (stateProperty) {
	        var targetProperty = data[stateProperty];
	        var value = state[stateProperty];
	        if (subscribed.indexOf(stateProperty) === -1) { return; }
	        AFRAME.utils.entity.setComponentProperty(el, targetProperty, value);
	      });
	    }
	  }
	});


/***/ }),
/* 16 */
/***/ (function(module, exports) {

	/* globals AFRAME */
	/**
	 * Display entire game state as text.
	 */
	AFRAME.registerComponent('gamestate-debug', {
	  init: function () {
	    var el = this.el;
	    var sceneEl = this.el.sceneEl;

	    sceneEl.addEventListener('gamestate-initialized', setText);
	    sceneEl.addEventListener('gamestate-changed', setText);

	    function setText (evt) {
	      el.setAttribute('bmfont-text', {text: buildText(evt.detail.state), color: '#DADADA'});
	    }
	  }
	});

	function buildText (state) {
	  var text = 'DEBUG\n';
	  Object.keys(state).sort().forEach(function appendText (property) {
	    text += property + ': ' + state[property] + '\n';
	  });
	  return text;
	}


/***/ }),
/* 17 */
/***/ (function(module, exports) {

	/* global AFRAME */
	AFRAME.registerComponent('shoot-controls', {
	  // dependencies: ['tracked-controls'],
	  schema: {
	    hand: { default: 'left' }
	  },

	  init: function () {
	    var self = this;

	    this.onButtonChanged = this.onButtonChanged.bind(this);
	    this.onButtonDown = function (evt) { self.onButtonEvent(evt.detail.id, 'down'); };
	    this.onButtonUp = function (evt) { self.onButtonEvent(evt.detail.id, 'up'); };
	  },

	  play: function () {
	    var el = this.el;
	    el.addEventListener('buttonchanged', this.onButtonChanged);
	    el.addEventListener('buttondown', this.onButtonDown);
	    el.addEventListener('buttonup', this.onButtonUp);
	  },

	  pause: function () {
	    var el = this.el;
	    el.removeEventListener('buttonchanged', this.onButtonChanged);
	    el.removeEventListener('buttondown', this.onButtonDown);
	    el.removeEventListener('buttonup', this.onButtonUp);
	  },

	  // buttonId
	  // 0 - trackpad
	  // 1 - trigger ( intensity value from 0.5 to 1 )
	  // 2 - grip
	  // 3 - menu ( dispatch but better for menu options )
	  // 4 - system ( never dispatched on this layer )
	  mapping: {
	    axis0: 'trackpad',
	    axis1: 'trackpad',
	    button0: 'trackpad',
	    button1: 'trigger',
	    button2: 'grip',
	    button3: 'menu',
	    button4: 'system'
	  },

	  onButtonChanged: function (evt) {
	    var buttonName = this.mapping['button' + evt.detail.id];
	    if (buttonName !== 'trigger') { return; }
	    var value = evt.detail.state.value;
	    this.el.components['weapon'].setTriggerPressure(value);
	  },

	  onButtonEvent: function (id, evtName) {
	    var buttonName = this.mapping['button' + id];
	    this.el.emit(buttonName + evtName);
	  },

	  update: function () {
	    var data = this.data;
	    var el = this.el;
	    el.setAttribute('vive-controls', {hand: data.hand, model: false});
	    el.setAttribute('oculus-touch-controls', {hand: data.hand, model: false});
	    el.setAttribute('windows-motion-controls', {hand: data.hand, model: false});
	    if (data.hand === 'right') {
	      el.setAttribute('daydream-controls', {hand: data.hand, model: false});
	      el.setAttribute('gearvr-controls', {hand: data.hand, model: false});
	    }
	  }
	});


/***/ }),
/* 18 */
/***/ (function(module, exports) {

	/* globals AFRAME PEWVR THREE */
	AFRAME.registerComponent('bullet', {
	    schema: {
	        name: { default: '' },
	        direction: { type: 'vec3' },
	        maxSpeed: { default: 5.0 },
	        initialSpeed: { default: 5.0 },
	        position: { type: 'vec3' },
	        acceleration: { default: 0.5 },
	        destroyable: { default: false },
	        owner: { default: 'player', oneOf: ['enemy', 'player'] },
	        color: { default: '#fff' }
	    },

	    init: function () {
	        this.startEnemy = document.getElementById('start_enemy');
	        this.backgroundEl = document.getElementById('border');
	        this.bullet = PEWVR.BULLETS[this.data.name];
	        this.bullet.definition.init.call(this);
	        this.hit = false;
	        this.direction = new THREE.Vector3();
	        this.temps = {
	            direction: new THREE.Vector3(),
	            position: new THREE.Vector3()
	        }
	    },

	    update: function (oldData) {
	        var data = this.data;
	        this.owner = this.data.owner;
	        this.direction.set(data.direction.x, data.direction.y, data.direction.z);
	        this.currentAcceleration = data.acceleration;
	        this.speed = data.initialSpeed;
	        this.startPosition = data.position;
	    },

	    play: function () {
	        this.initTime = null;
	    },

	    hitObject: function (type, data) {
	        this.bullet.definition.onHit.call(this);
	        this.hit = true;
	        if (this.data.owner === 'enemy') {
	            this.el.emit('player-hit');
	        }
	        else {
	            if (type === 'bullet') {
	                // data is the bullet entity collided with
	                data.components.bullet.resetBullet();
	                this.el.sceneEl.systems.explosion.createExplosion(type, data.object3D.position, data.getAttribute('bullet').color, 1, this.direction);
	                PEWVR.currentScore.validShoot++;
	            }
	            else if (type === 'background') {
	                this.el.sceneEl.systems.decals.addDecal(data.point, data.face.normal);
	                var posOffset = data.point.clone().sub(this.direction.clone().multiplyScalar(0.2));
	                this.el.sceneEl.systems.explosion.createExplosion(type, posOffset, '#fff', 1, this.direction);
	            }
	            else if (type === 'enemy') {
	                var enemy = data.getAttribute('enemy');
	                if (data.components['enemy'].health <= 0) {
	                    this.el.sceneEl.systems.explosion.createExplosion('enemy', data.object3D.position, enemy.color, enemy.scale, this.direction, enemy.name);
	                }
	                else {
	                    this.el.sceneEl.systems.explosion.createExplosion('bullet', this.el.object3D.position, enemy.color, enemy.scale, this.direction);
	                }
	                PEWVR.currentScore.validShoot++;
	            }
	        }
	        this.resetBullet();
	    },

	    resetBullet: function () {
	        this.hit = false;
	        this.bullet.definition.reset.call(this);
	        this.initTime = null;

	        this.direction.set(this.data.direction.x, this.data.direction.y, this.data.direction.z);

	        this.currentAcceleration = this.data.acceleration;
	        this.speed = this.data.initialSpeed;
	        this.startPosition = this.data.position;

	        this.system.returnBullet(this.data.name, this.el);
	    },

	    tick: (function () {
	        //var position = new THREE.Vector3();
	        //var direction = new THREE.Vector3();
	        return function tick(time, delta) {

	            if (!this.initTime) { this.initTime = time; }

	            this.bullet.definition.tick.call(this, time, delta);

	            // Align the bullet to its direction
	            this.el.object3D.lookAt(this.direction.clone().multiplyScalar(1000));

	            // Update acceleration based on the friction
	            this.temps.position.copy(this.el.getAttribute('position'));

	            // Update speed based on acceleration
	            this.speed = this.currentAcceleration * .1 * delta;
	            if (this.speed > this.data.maxSpeed) { this.speed = this.data.maxSpeed; }

	            // Set new position
	            this.temps.direction.copy(this.direction);
	            var newBulletPosition = this.temps.position.add(this.temps.direction.multiplyScalar(this.speed));
	            this.el.setAttribute('position', newBulletPosition);

	            // Check if the bullet is lost in the sky
	            if (this.temps.position.length() >= 50) {
	                this.resetBullet();
	                return;
	            }

	            var collisionHelper = this.el.getAttribute('collision-helper');
	            if (!collisionHelper) { return; }

	            var bulletRadius = collisionHelper.radius;

	            // Detect collision depending on the owner
	            if (this.data.owner === 'player') {
	                // megahack

	                // Detect collision against enemies
	                if (this.data.owner === 'player') {
	                    // Detect collision with the start game enemy
	                    var state = this.el.sceneEl.getAttribute('gamestate').state;
	                    if (state === 'STATE_MAIN_MENU') {
	                        var enemy = this.startEnemy;
	                        var helper = enemy.getAttribute('collision-helper');
	                        var radius = helper.radius;
	                        if (newBulletPosition.distanceTo(enemy.object3D.position) < radius + bulletRadius) {
	                            this.el.sceneEl.systems.explosion.createExplosion('enemy', this.el.getAttribute('position'), '#ffb911', 0.5, this.direction, 'enemy_start');
	                            enemy.emit('hit');
	                            return;
	                        }
	                    } else if (state === 'STATE_GAME_WIN' || state === 'STATE_GAME_OVER') {
	                        var enemy = document.getElementById('reset');
	                        var helper = enemy.getAttribute('collision-helper');
	                        var radius = helper.radius;
	                        if (newBulletPosition.distanceTo(enemy.object3D.position) < radius * 2 + bulletRadius * 2) {
	                            this.el.sceneEl.systems.explosion.createExplosion('enemy', this.el.getAttribute('position'), '#f00', 0.5, this.direction, 'enemy_start');
	                            this.el.sceneEl.emit('reset');
	                            return;
	                        }
	                    } else {
	                        // Detect collisions with all the active enemies
	                        var enemies = this.el.sceneEl.systems.enemy.activeEnemies;
	                        for (var i = 0; i < enemies.length; i++) {
	                            var enemy = enemies[i];
	                            var helper = enemy.getAttribute('collision-helper');
	                            if (!helper) continue;
	                            var radius = helper.radius;
	                            if (newBulletPosition.distanceTo(enemy.object3D.position) < radius + bulletRadius) {
	                                enemy.emit('hit');
	                                this.hitObject('enemy', enemy);
	                                return;
	                            }
	                        }
	                    }

	                }
	            } else {
	                // @hack Any better way to get the head position ?
	                var head = this.el.sceneEl.camera.el.components['look-controls'].dolly.position;
	                if (newBulletPosition.distanceTo(head) < 0.10 + bulletRadius) {
	                    this.hitObject('player');
	                    return;
	                }
	            }
	        };
	    })()
	});


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	var LetterPanel = __webpack_require__(20);

	/* global THREE AFRAME */
	AFRAME.registerComponent('timer-counter', {
	  schema: {
	    width: {default: 0.9},
	    value: {default: ''},
	    numSegments: {default: 5},
	    height: {default: 0.35},
	    color: {default: 0x024caff}
	  },

	  init: function () {
	    this.letterPanel = new LetterPanel(this.el.sceneEl.systems.material, this.data);
	    this.el.setObject3D('mesh', this.letterPanel.group);
	    var self = this;
	    this.el.sceneEl.addEventListener('countdown-update', function(event) {
	      var t = event.detail;
	      var value = t.minutes.padLeft(2) + ':' + t.seconds.padLeft(2);
	      self.letterPanel.material.color.set(t.total <= 10000 ? 0xff0000 : 0x24caff);
	      self.el.setAttribute('timer-counter', {value: value});
	    });
	  },

	  update: function () {
	    this.letterPanel.update(this.data.value);
	  },
	});


/***/ }),
/* 20 */
/***/ (function(module, exports) {

	var fontText = '0123456789:* ';

	function LetterPanel (materialSystem, data) {

	  this.width = data.width;
	  this.height = data.height;
	  this.numSegments = data.numSegments;

	  var src = 'assets/images/font.png';

	  materialSystem.loadTexture(src, {src: src}, setMap.bind(this));
	  this.material = new THREE.MeshBasicMaterial({
	    side: THREE.DoubleSide,
	    color: data.color,
	    transparent: true
	  });

	  function setMap (texture) {
	    this.material.map = texture;
	    this.material.needsUpdate = true;
	  }

	  this.group = new THREE.Group();
	  var segmentWidth = this.width / this.numSegments;
	  this.numLetters = fontText.length;
	  for (var i = 0; i < this.numSegments; i++) {
	    plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(segmentWidth, this.height), this.material);
	    plane.position.x = i * segmentWidth;
	    this.group.add(plane);
	  }
	}

	LetterPanel.prototype = {
	  update: function (string) {
	    string = string.split('').map(function(char){
	      return fontText.indexOf(char);
	    });

	    var inc = 1 / this.numLetters;
	    for (var i = 0; i < this.numSegments; i++) {
	      var uv = this.group.children[i].geometry.attributes.uv;
	      var array = uv.array;
	      var x1 = string[i] * inc;
	      var x2 = (string[i] + 1) * inc;
	      array[0] = x1;
	      array[4] = x1;
	      array[2] = x2;
	      array[6] = x2;
	      uv.needsUpdate = true;
	    }
	  }
	}

	module.exports = LetterPanel;


/***/ }),
/* 21 */
/***/ (function(module, exports) {

	/* globals AFRAME PEWVR THREE */
	AFRAME.registerComponent('enemy', {
	  schema: {
	    name: {default: 'enemy0'},
	    bulletName: {default: 'enemy-slow'},
	    shootingDelay: {default: 200}, // ms
	    health: {default: 1},
	    color: {default: '#fff'},
	    scale: {default: 1},
	    canShoot: {default: true}
	  },
	  init: function () {
	    this.alive = true;
	    this.hipBone = null;
	    this.definition = PEWVR.ENEMIES[this.data.name].definition;
	    this.definition.init.call(this);
	    var comp = PEWVR.ENEMIES[this.data.name].components.enemy;
	    this.maxhealth = this.health = comp.health;
	    this.color = comp.color;
	    this.scale = comp.scale;
	    this.gunOffset = new THREE.Vector3(0.0, 0.44, 0.5).multiplyScalar(this.scale);
	    this.lastShootTime = undefined;
	    this.shootAt = 0;
	    this.warmUpTime = 1000;
	    this.paused = false;

	    var self = this;
	    this.el.addEventListener('model-loaded', function(event) {
	        // self.el.components['json-model'].playAnimation('fly', true);
	        // self.hipBone = self.el.object3D.children[3].children[0];
	    });

	    // gun glow
	    this.gunGlowMaterial = new THREE.MeshBasicMaterial({
	      color: this.color,
	      side: THREE.DoubleSide,
	      transparent: true,
	      blending: THREE.AdditiveBlending,
	      depthTest: true,
	      depthWrite: false,
	      visible: false
	    });
	    var src = document.querySelector('#fx3').getAttribute('src');
	    this.el.sceneEl.systems.material.loadTexture(src, {src: src}, setMap.bind(this));

	    function setMap (texture) {
	      this.gunGlowMaterial.alphaMap = texture;
	      this.gunGlowMaterial.needsUpdate = true;
	      this.gunGlowMaterial.visible = true;
	    }
	    this.gunGlow = new THREE.Mesh(new THREE.PlaneGeometry(this.scale, this.scale), this.gunGlowMaterial);
	    this.gunGlow.position.copy(this.gunOffset);
	    this.el.setObject3D('glow', this.gunGlow);

	    this.exploding = false;
	    this.explodingDuration = 500 + Math.floor(Math.random()*300);
	    this.el.addEventListener('hit', this.collided.bind(this));
	    // @todo Maybe we could send the time in init?
	  },
	  update: function (oldData) {
	  },
	  play: function () {
	    this.paused = false;
	  },
	  pause: function () {
	    this.paused = true;
	  },
	  collided: function () {
	    if (this.exploding) {
	      return;
	    }

	    this.health--;

	    if (this.health <= 0) {
	      this.el.emit('enemy-hit');
	      this.exploding = true;

	      var mesh = this.el.getObject3D('mesh');
	      this.whiteMaterial = new THREE.MeshBasicMaterial({color: this.color, transparent: true });
	      mesh.normalMaterial = mesh.material;
	      mesh.material = this.whiteMaterial;

	      this.gunGlow.visible = false;

	      this.system.activeEnemies.splice(this.system.activeEnemies.indexOf(this.el), 1);
	    }
	  },

	  die: function () {
	    this.alive = false;
	    this.reset();
	    this.system.onEnemyDeath(this.data.name, this.el);
	  },

	  reset: function () {
	    var mesh = this.el.getObject3D('mesh');
	    if (mesh) {
	      mesh.material.opacity = 1;
	      mesh.scale.set(this.scale, this.scale, this.scale);
	      mesh.material = mesh.normalMaterial;
	      this.gunGlow.visible = true;
	      this.gunGlow.scale.set(1, 1, 1);
	      this.gunGlowMaterial.opacity = 0.3;
	    }

	    this.el.setAttribute('scale', '0.05 0.05 0.05');
	    this.explodingTime = undefined;
	    this.lastShootTime = undefined;
	    this.shootAt = 0;
	    this.warmUpTime = 1000;

	    this.health = this.maxhealth;
	    this.alive = true;
	    this.exploding = false;
	    this.definition.reset.call(this);
	  },

	  shoot: function (time, delta) {
	    var el = this.el;
	    if (!el) return;
	    var data = this.data;
	    var mesh = el.object3D;
	    var gunPosition = mesh.localToWorld(this.gunGlow.position.clone());
	    var head = el.sceneEl.camera.el.components['look-controls'].dolly.position.clone();
	    var direction = head.sub(mesh.position).normalize();

	    this.lastShootTime = time;

	    this.gunGlow.scale.set(3, 3, 3);
	    this.gunGlowMaterial.opacity = 1;

	/*
	    var explosion = document.createElement('a-entity');
	    explosion.setAttribute('position', gunPosition);
	    explosion.setAttribute('explosion', {
	      type: 'enemygun',
	      color: this.color,
	      scale: this.scale,
	      lookAt: direction
	    });
	    explosion.setAttribute('sound', {
	      src: document.getElementById(this.data.name + 'shoot').src,
	      volume: 0.5,
	      poolSize: 8,
	      autoplay: true
	    });
	    this.el.sceneEl.appendChild(explosion);
	*/
	    this.el.sceneEl.systems.explosion.createExplosion('enemygun', gunPosition, this.color, this.scale, direction, this.data.name);

	    // Ask system for bullet and set bullet position to starting point.
	    var bulletEntity = el.sceneEl.systems.bullet.getBullet(data.bulletName);
	    bulletEntity.setAttribute('bullet', {
	      position: gunPosition,
	      direction: direction,
	      owner: 'enemy'
	    });
	    bulletEntity.setAttribute('position', gunPosition);
	    bulletEntity.setAttribute('visible', true);
	    bulletEntity.play();
	  },

	  willShoot: function (time, delta, warmUpTime) {
	    this.shootAt = time + warmUpTime;
	    this.warmUpTime = warmUpTime;
	  },

	  tick: function (time, delta) {
	    if (!this.alive || this.paused) {
	      return;
	    }
	    if (!this.exploding) {
	      //gun glow
	      var glowFadeOutTime = 700;
	      if (this.lastShootTime === undefined) {
	        this.lastShootTime = time;
	      }
	      else {
	        if (this.shootAt - time < this.warmUpTime) {
	          this.gunGlowMaterial.opacity = (this.shootAt - time) / this.warmUpTime;
	          var glowScale = 1.0 + Math.abs(Math.sin(time / 50));
	          this.gunGlow.scale.set(glowScale, glowScale, glowScale);
	        }
	        else if (time - this.lastShootTime < glowFadeOutTime) {
	          this.gunGlowMaterial.opacity = 1 - (time - this.lastShootTime) / glowFadeOutTime;
	        }
	      }
	      this.gunGlow.position.copy(this.gunOffset);
	      if (this.hipBone) {
	        this.gunGlow.position.y += this.hipBone.position.y;
	      }
	      // Make the droid to look the headset
	      var head = this.el.sceneEl.camera.el.components['look-controls'].dolly.position.clone();
	      this.el.object3D.lookAt(head);

	      this.definition.tick.call(this, time, delta);
	    } else {
	      if (!this.explodingTime) {
	        this.explodingTime = time;
	      }
	      var t0 = (time - this.explodingTime) / this.explodingDuration;

	      var scale = this.scale + t0 * ( 2 - t0 ); //out easing

	      var mesh = this.el.getObject3D('mesh');
	      mesh.scale.set(scale, scale, scale);
	      mesh.material.opacity = Math.max(0, 1 - t0 * 2.5);
	      if (t0 >= 1) {
	        this.die();
	      }
	    }

	  }
	});


/***/ }),
/* 22 */
/***/ (function(module, exports) {

	// Weapon definitions.
	var WEAPONS = {
	  default: {
	    model: {
	      url: 'url(assets/models/gun.json)',
	      positionOffset: [0, 0, 0],
	      rotationOffset: [0, 0, 0]
	    },
	    shootSound: 'url(assets/sounds/gunshot.wav)',
	    shootingDelay: 100, // In ms
	    bullet: 'default'
	  }
	};


	/**
	 * Tracked controls, gun model, firing animation, shooting effects.
	 */
	AFRAME.registerComponent('weapon', {
	  dependencies: ['shoot-controls'],

	  schema: {
	    enabled: { default: true },
	    type: { default: 'default' }
	  },

	  updateWeapon: function () {
	    console.log(this.controllerModel);
	    if (this.controllerModel === 'oculus-touch-controller') {
	      this.model.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), 0.8));
	      this.el.setAttribute('shoot', {direction: '0 -0.3 -1'});
	    } else if (this.controllerModel === 'daydream-controls') {
	      document.getElementById('rightHandPivot').setAttribute('position', '-0.2 0 -0.5');
	      this.el.setAttribute('shoot', {on: 'trackpaddown'});
	    }
	  },
	  init: function () {
	    var el = this.el;
	    var self = this;

	    this.model = null;
	    this.isGamepadConnected = false;
	    this.controllerModel = null;
	    this.weapon = WEAPONS[ this.data.type ];

	    el.setAttribute('json-model', {src: this.weapon.model.url});

	    el.setAttribute('sound', {
	      src: this.weapon.shootSound,
	      on: 'shoot',
	      volume: 0.5,
	      poolSize: 10
	    });

	    this.fires = [];
	    this.trigger = null;

	    el.addEventListener('controllerconnected', function (evt) {
	      console.log(evt);
	      self.controllerModel = evt.detail.name;
	      if (self.model == null) {
	        self.isGamepadConnected = true;
	      } else {
	        self.updateWeapon();
	      }
	    });

	    el.addEventListener('model-loaded', function (evt) {
	      this.model = evt.detail.model;
	      var modelWithPivot = new THREE.Group();
	      modelWithPivot.add(this.model);
	      el.setObject3D('mesh', modelWithPivot);

	      for (var i = 0; i < 3; i++){
	        var fire = this.model.getObjectByName('fire'+i);
	        if (fire) {
	          fire.material.depthWrite = false;
	          fire.visible = false;
	          this.fires.push(fire);
	        }
	      }

	      if (this.isGamepadConnected) {
	        this.updateWeapon();
	      }

	      this.trigger = this.model.getObjectByName('trigger');

	    }.bind(this));

	    var self = this;
	    el.addEventListener('shoot', function (evt) {
	      el.components['json-model'].playAnimation('default');
	      self.light.components.light.light.intensity = self.lightIntensity;
	      for (var i in self.fires){
	        self.fires[i].visible = true;
	        self.fires[i].life = 50 + Math.random() * 100;
	      }
	    });

	    this.lightIntensity = 3.0;
	    this.life = this.data.lifespan;
	    this.canShoot = true;

	    this.light = document.createElement('a-entity');
	    el.appendChild(this.light);

	    this.light.setAttribute('light', {color: '#ffc724', intensity: 0.0, type: 'point'});
	    this.light.setAttribute('position', {x: 0, y: -0.22, z: -0.14});
	    var self = this;
	    this.light.addEventListener('loaded', function () {
	      self.lightObj = self.light.components.light.light; // threejs light
	    })
	  },

	  tick: function (time, delta) {
	    if (this.lightObj && this.lightObj.intensity > 0.0) {
	      this.light.visible = true;
	      this.lightObj.intensity -= delta / 1000 * 10;
	      if (this.lightObj.intensity < 0.0) {
	        this.lightObj.intensity = 0.0;
	        this.light.visible = false;
	      }
	      for (var i in this.fires) {
	        if (!this.fires[i].visible) continue;
	        this.fires[i].life -= delta;
	        if (i == 0) {
	          this.fires[i].rotation.set(0, Math.random() * Math.PI * 2, 0);
	        }
	        else {
	          this.fires[i].rotation.set(0, Math.random() * 1 - 0.5 + (Math.random() > 0.5 ? Math.PI: 0) , 0);
	        }
	        if (this.fires[i].life < 0){
	          this.fires[i].visible = false;
	        }
	      }
	    }
	  },

	  update: function () {
	    var data = this.data;
	    this.weapon = WEAPONS[ data.type ];
	  },

	  setTriggerPressure: function (pressure) {
	    if (this.trigger) {
	      this.trigger.position.setY(pressure * 0.01814);
	    }
	  }
	});

	module.exports = WEAPONS;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	var WEAPONS = __webpack_require__(22);

	/**
	 * Spawn bullets on an event.
	 * Default schema optimized for Vive controllers.
	 */
	AFRAME.registerComponent('shoot', {
	  schema: {
	    direction: {type: 'vec3', default: {x: 0, y: -2, z: -1}},  // Event to fire bullet.
	    on: {default: 'triggerdown'},  // Event to fire bullet.
	    spaceKeyEnabled: {default: false},  // Keyboard support.
	    weapon: {default: 'default'}  // Weapon definition.
	  },

	  init: function () {
	    var data = this.data;
	    var el = this.el;
	    var self = this;
	    var sensor;
	    var lastSensorX;

	    lastSensorX = 0;

	    try {
	        sensor = new Magnetometer();
	        if (sensor!==undefined) {
	            sensor.start();
	        }
	    } catch(err) {
	        console.log("Magnetometer not supported. Make sure you configure chrome://flags/#enable-generic-sensor-extra-classes and deliver via HTTPS.");
	    }

	    // Check major differences on Magnetometer and identify as a button-click

	    if (sensor !== undefined) {
	        sensor.onreading = () => {
	            var delta = sensor.x-lastSensorX;
	            console.log(sensor.x);
	            
	            if (delta > 100 ) {
	                self.shoot();
	                alert("test");
	            }
	            lastSensorX = sensor.x;
	        }
	        
	        sensor.onerror = event => console.log(event.error.name + " (Magnetometer): ", event.error.message);
	    }

	    this.coolingDown = false;  // Limit fire rate.
	    this.shoot = this.shoot.bind(this);
	    this.weapon = null;

	    // Add event listener.
	    if (data.on) { el.addEventListener(data.on, this.shoot); }

	    // Add keyboard listener.
	    if (data.spaceKeyEnabled) {
	      window.addEventListener('keydown', function (evt) {
	        if (evt.code === 'Space' || evt.keyCode === '32') { self.shoot(); }
	      });
	    }
	    if (AFRAME.utils.device.isMobile())
	    {
	      window.addEventListener('click', function (evt) {
	        self.shoot();
	      });
	    }
	  },

	  update: function (oldData) {
	    // Update weapon.
	    this.weapon = WEAPONS[this.data.weapon];

	    if (oldData.on !== this.data.on) {
	      this.el.removeEventListener(oldData.on, this.shoot);
	      this.el.addEventListener(this.data.on, this.shoot);
	    }
	  },

	  shoot: (function () {
	    var direction = new THREE.Vector3();
	    var position = new THREE.Vector3();
	    var quaternion = new THREE.Quaternion();
	    var scale = new THREE.Vector3();
	    var translation = new THREE.Vector3();
	    var incVive = new THREE.Vector3(0.0, -0.23, -0.15);
	    var incOculus = new THREE.Vector3(0, -0.23, -0.8);
	    var inc = new THREE.Vector3();

	    return function () {
	      var bulletEntity;
	      var el = this.el;
	      var data = this.data;
	      var matrixWorld;
	      var self = this;
	      var weapon = this.weapon;

	      if (this.coolingDown) { return; }

	      PEWVR.currentScore.shoots++;

	      // Get firing entity's transformations.
	      el.object3D.updateMatrixWorld();
	      matrixWorld = el.object3D.matrixWorld;
	      position.setFromMatrixPosition(matrixWorld);
	      matrixWorld.decompose(translation, quaternion, scale);

	      // Set projectile direction.
	      direction.set(data.direction.x, data.direction.y, data.direction.z);
	      direction.applyQuaternion(quaternion);
	      direction.normalize();

	      if (el.components['weapon']) {
	        inc.copy(el.components.weapon.controllerModel === 'oculus-touch-controller' ? incOculus : incVive);
	      }
	      inc.applyQuaternion(quaternion);
	      position.add(inc);

	      // Ask system for bullet and set bullet position to starting point.
	      bulletEntity = el.sceneEl.systems.bullet.getBullet(weapon.bullet);
	      bulletEntity.setAttribute('position', position);
	      bulletEntity.setAttribute('bullet', {
	        direction: direction.clone(),
	        position: position.clone(),
	        owner: 'player'
	      });
	      bulletEntity.setAttribute('visible', true);
	      bulletEntity.setAttribute('position', position);
	      bulletEntity.play();

	      // Communicate the shoot.
	      el.emit('shoot', bulletEntity);

	      // Set cooldown period.
	      this.coolingDown = true;
	      setTimeout(function () {
	        self.coolingDown = false;
	      }, weapon.shootingDelay);
	    };
	  })()
	});


/***/ }),
/* 24 */
/***/ (function(module, exports) {

	/* global AFRAME THREE */
	AFRAME.registerComponent('headset', {
	  schema: {
	    on: { default: 'click' }
	  },

	  init: function () {
	  },

	  tick: function (time, delta) {
	    var mesh = this.el.getObject3D('mesh');
	    if (mesh) {
	      mesh.update(delta / 1000);
	    }
	    this.updatePose();
	    this.updateButtons();
	  },

	  updatePose: (function () {
	    var controllerEuler = new THREE.Euler();
	    var controllerPosition = new THREE.Vector3();
	    var controllerQuaternion = new THREE.Quaternion();
	    var dolly = new THREE.Object3D();
	    var standingMatrix = new THREE.Matrix4();
	    controllerEuler.order = 'YXZ';
	    return function () {
	      var controller;
	      var pose;
	      var orientation;
	      var position;
	      var el = this.el;
	      var vrDisplay = this.system.vrDisplay;
	      this.update();
	      controller = this.controller;
	      if (!controller) { return; }
	      pose = controller.pose;
	      orientation = pose.orientation || [0, 0, 0, 1];
	      position = pose.position || [0, 0, 0];
	      controllerQuaternion.fromArray(orientation);
	      dolly.quaternion.fromArray(orientation);
	      dolly.position.fromArray(position);
	      dolly.updateMatrix();
	      if (vrDisplay && vrDisplay.stageParameters) {
	        standingMatrix.fromArray(vrDisplay.stageParameters.sittingToStandingTransform);
	        dolly.applyMatrix(standingMatrix);
	      }
	      controllerEuler.setFromRotationMatrix(dolly.matrix);
	      controllerPosition.setFromMatrixPosition(dolly.matrix);
	      el.setAttribute('rotation', {
	        x: THREE.Math.radToDeg(controllerEuler.x),
	        y: THREE.Math.radToDeg(controllerEuler.y),
	        z: THREE.Math.radToDeg(controllerEuler.z)
	      });
	      el.setAttribute('position', {
	        x: controllerPosition.x,
	        y: controllerPosition.y,
	        z: controllerPosition.z
	      });
	    };
	  })()
	});


/***/ }),
/* 25 */
/***/ (function(module, exports) {

	/* globals AFRAME THREE */
	AFRAME.registerComponent('json-model', {
	  schema: {
	    src: {type: 'asset'},
	    singleModel: {default: false},
	    texturePath: {type: 'asset', default: ''},
	    debugNormals: {default: false},
	    debugNormalsLength: {default: 0.2},
	    debugBones: {default: false}
	  },

	  init: function () {
	  },

	  fixNormal: function (vector) {
	    var t = vector.y;
	    vector.y = -vector.z;
	    vector.z = t;
	  },

	  update: function (oldData) {
	    this.loader = null;
	    this.helpers = new THREE.Group();
	    this.mixers = [];
	    this.animationNames = [];
	    this.skeletonHelper = null;

	    var src = this.data.src;
	    if (!src || src === oldData.src) { return; }

	    if (this.data.singleModel) {
	      this.loader = new THREE.JSONLoader();
	      this.loader.setTexturePath(this.data.texturePath);
	      this.loader.load(src, this.onModelLoaded.bind(this));
	    }
	    else {
	      this.loader = new THREE.ObjectLoader();
	      this.loader.setCrossOrigin('');
	      this.loader.load(src, this.onSceneLoaded.bind(this));
	    }
	  },

	  onModelLoaded: function(geometry, materials) {
	    this.helpers = new THREE.Group();

	    var mesh = new THREE.SkinnedMesh(geometry, materials[0]);
	    var self = this;
	    mesh.geometry.faces.forEach(function(face) {
	      face.vertexNormals.forEach(function(vertex) {
	        if (!vertex.hasOwnProperty('fixed')) {
	          self.fixNormal(vertex);
	          vertex.fixed = true;
	        }
	      });
	    });

	    if (mesh.geometry['animations'] !== undefined && mesh.geometry.animations.length > 0){
	      mesh.material.skinning = true;
	      var mixer = {mixer: new THREE.AnimationMixer(mesh), clips: {}};
	      for (var i in mesh.geometry.animations) {
	        var anim = mesh.geometry.animations[i];
	        var clip = mixer.mixer.clipAction(anim).stop();
	        clip.setEffectiveWeight(1);
	        mixer.clips[anim.name] = clip;
	      }
	      this.mixers.push(mixer);
	    }

	    self.addNormalHelpers(mesh);

	    this.helpers.visible = this.data.debugNormals;
	    this.el.setObject3D('helpers', this.helpers);

	    this.skeletonHelper = new THREE.SkeletonHelper( mesh );
	    this.skeletonHelper.material.linewidth = 2;
	    this.el.setObject3D('skelhelper', this.skeletonHelper );
	    this.skeletonHelper.visible = this.data.debugBones;

	    this.el.setObject3D('mesh', mesh);
	    this.el.emit('model-loaded', {format: 'json', model: mesh, src: this.data.src});
	  },

	  onSceneLoaded: function(group) {
	    this.helpers = new THREE.Group();

	    if (group['animations'] !== undefined) {
	      var mixer = {mixer: new THREE.AnimationMixer(group), clips: {}};
	      for (var i in group.animations) {
	        var anim = group.animations[i];
	        var clip = mixer.mixer.clipAction(anim).stop();
	        mixer.clips[anim.name] = clip;
	      }
	      this.mixers.push(mixer);
	    }
	    var self = this;
	    group.traverse(function (child) {
	      if (!(child instanceof THREE.Mesh)) { return; }

	      child.geometry.faces.forEach(function(face) {
	        face.vertexNormals.forEach(function(vertex) {
	          if (!vertex.hasOwnProperty('fixed')) {
	            self.fixNormal(vertex);
	            vertex.fixed = true;
	          }
	        });
	      });

	      self.addNormalHelpers(child);
	    });

	    this.helpers.visible = this.data.debugNormals;
	    this.el.setObject3D('helpers', this.helpers);
	    this.el.setObject3D('mesh', group);
	    this.el.emit('model-loaded', {format: 'json', model: group, src: this.data.src});
	  },

	  addNormalHelpers: function (mesh) {
	    var fnh = new THREE.FaceNormalsHelper(mesh, this.data.debugNormalsLength);
	    this.helpers.add(fnh);
	    var vnh = new THREE.VertexNormalsHelper(mesh, this.data.debugNormalsLength);
	    this.helpers.add(vnh);

	    mesh.geometry.normalsNeedUpdate = true;
	    mesh.geometry.verticesNeedUpdate = true;
	  },

	  playAnimation: function (animationName, repeat) {
	    for (var i in this.mixers) {
	      var clip = this.mixers[i].clips[animationName];
	      if (clip === undefined) continue;
	      clip.stop().play();
	      var repetitions = 0;
	      if (repeat === true) repetitions = Infinity;
	      else if (repeat == undefined) repeat = false;
	      else if (typeof(repeat) == 'number') {
	        if (repeat === 0) repeat = false;
	        repetitions = repeat;
	      }
	      else repeat = false;
	      clip.setLoop( repeat ? THREE.LoopRepeat : THREE.LoopOnce, repetitions );
	    }
	  },

	  stopAnimation: function () {
	    for (var i in this.mixers) {
	      for (var j in this.mixers[i].clips) {
	        this.mixers[i].clips[j].stop();
	      }
	    }
	  },

	  tick: function(time, timeDelta) {
	    for (var i in this.mixers) {
	      this.mixers[i].mixer.update( timeDelta / 1000 );
	    }
	  }
	});


/***/ }),
/* 26 */
/***/ (function(module, exports) {

	/* global AFRAME, THREE */

	/**
	 * Draw spline.
	 * Grab the spline object using `pointer`, which reaches into a component for the spline.
	 * Some extra code done to generalize + decouple the component.
	 */
	AFRAME.registerComponent('spline-line', {
	  schema: {
	    pointer: {default: ''},  // `[componentName].[member]`.
	    numPoints: {default: 250}
	  },

	  init: function () {
	    var componentName;
	    var data = this.data;
	    var el = this.el;
	    var self = this;
	    var spline;

	    this.pointMeshes = [];

	    // TODO: Get `component-initialized` event.
	    spline = getSpline();
	    if (spline) {
	      this.drawLine(spline);
	    } else {
	      componentName = data.pointer.split('.')[0];
	      el.addEventListener('componentchanged', function (evt) {
	        if (evt.detail.name !== componentName) { return; }
	        self.drawLine(getSpline());
	      });
	    }

	    function getSpline () {
	      var split = data.pointer.split('.');
	      var componentName = split.shift();
	      var member = el.components[componentName];
	      while (split.length) {
	        if (!member) { return; }
	        member = member[split.shift()];
	      }
	      return member;
	    }
	  },

	  drawLine: function (spline) {
	    var data = this.data;
	    var el = this.el;
	    var geometry;
	    var i;
	    var pointMeshes = this.pointMeshes;
	    var material;

	    // Create line.
	    geometry = new THREE.Geometry();
	    material = new THREE.LineBasicMaterial({
	      color: new THREE.Color(Math.random(), Math.random(), Math.random())
	    });
	    for (i = 0; i < data.numPoints; i++) {
	      var point = spline.getPoint(i / data.numPoints);
	      geometry.vertices.push(new THREE.Vector3(point.x, point.y, point.z));
	    }
	    geometry.verticesNeedsUpdate = true;

	    // Draw points.
	    spline.points.forEach(function addWaypoint (point) {
	      var geometry = new THREE.SphereGeometry(0.2, 16, 16);
	      var material = new THREE.MeshBasicMaterial({color: '#111'});
	      var mesh = new THREE.Mesh(geometry, material);
	      mesh.position.set(point.x, point.y, point.z);
	      pointMeshes.push(mesh);
	      el.sceneEl.object3D.add(mesh);
	    });

	    // Append line to scene.
	    this.line = new THREE.Line(geometry, material);
	    el.sceneEl.object3D.add(this.line);
	  },

	  remove: function () {
	    var scene = this.el.sceneEl.object3D;
	    if (!this.line) { return; }
	    scene.remove(this.line);
	    this.pointMeshes.forEach(function (point) {
	      scene.remove(point);
	    });
	  }
	});


/***/ }),
/* 27 */
/***/ (function(module, exports) {

	/* globals AFRAME PEWVR THREE */

	AFRAME.registerComponent('explosion', {
	  schema: {
	    type: { default: 'enemy', oneOf: ['enemy', 'bullet', 'background', 'enemygun'] },
	    duration: { default: 500 },
	    color: { type: 'color', default: '#FFFFFF' },
	    lookAt: { type: 'vec3', default: null},
	    scale: { default: 1 }
	  },

	  update: function (oldData) {
	    if (this.data.type === 'enemy') {
	      this.materials[2].color.set(this.data.color);
	      this.materials[4].color.set(this.data.color);
	    } else if (this.data.type === 'bullet') {
	      this.data.scale *= 0.5; // HACK! remove!
	      this.materials[0].color.set(this.data.color);
	      this.materials[2].color.set(this.data.color);
	    } else if (this.data.type === 'enemygun') {
	      this.materials[0].color.set(this.data.color);
	      this.data.duration = 300;
	    } else if (this.data.type === 'background') {
	      this.data.duration = 300;
	    }

	    for (var i = 0; i < this.meshes.children.length; i++){
	      var mesh = this.meshes.children[i];
	      if (mesh.part.billboard && this.data.lookAt) {
	        mesh.lookAt(this.data.lookAt);
	      }
	    }

	    this.el.setAttribute('scale', {x: this.data.scale, y: this.data.scale, z: this.data.scale });
	  },

	  init: function () {
	    this.life = 0;
	    this.starttime = null;
	    this.meshes = new THREE.Group();

	    this.materials = [];
	    var textureSrcs = new Array('#fx1', '#fx2', '#fx3', '#fx4', '#fx8');

	    this.el.setAttribute('scale', {x: this.data.scale, y: this.data.scale, z: this.data.scale });

	    switch(this.data.type) {
	      case 'enemy':
	        this.parts = [
	          {textureIdx: 2, billboard: true,  color: 16777215, scale: 1.5, grow: 4, dispersion: 0, copies: 1, speed: 0 },
	          {textureIdx: 0, billboard: true,  color: 16777215, scale: 0.4, grow: 2, dispersion: 2.5, copies: 1, speed: 1 },
	          {textureIdx: 3, billboard: false, color: this.data.color, scale: 1, grow: 6, dispersion: 0, copies: 1, speed: 0 },
	          {textureIdx: 1, billboard: true,  color: 16577633, scale: 0.04, grow: 2, dispersion: 3, copies: 20, speed: 2},
	          {textureIdx: 3, billboard: true,  color: this.data.color, scale: 0.2, grow: 2, dispersion: 2, copies: 5, speed: 1}
	        ];
	      break;
	      case 'bullet':
	        //this.data.scale = this.data.scale * 0.5;
	        this.parts = [
	          {textureIdx: 2, billboard: true,  color: this.data.color, scale: .5, grow: 3, dispersion: 0, copies: 1, speed: 0 },
	          {textureIdx: 4, billboard: true,  color: '#24CAFF', scale: .3, grow: 4, dispersion: 0, copies: 1, speed: 0 },
	          {textureIdx: 0, billboard: true,  color: this.data.color, scale: 0.04, grow: 2, dispersion: 1.5, copies: 8, speed: 1 }
	        ];
	      break;
	      case 'background':
	        this.parts = [
	          {textureIdx: 4, billboard: true,  color: '#24CAFF', scale: .3, grow: 3, dispersion: 0, copies: 1, speed: 0 },
	          {textureIdx: 0, billboard: true,  color: '#24CAFF', scale: 0.03, grow: 1, dispersion: 0.3, copies: 8, speed: 1.6, noFade: true }
	        ];
	      break;
	      case 'enemygun':
	        this.parts = [
	          {textureIdx: 3, billboard: true,  color: this.data.color, scale: .5, grow: 3, dispersion: 0, copies: 1, speed: 0 },
	        ];
	      break;
	    }


	    for (var i in this.parts) {
	      var part = this.parts[i];
	      part.meshes = [];
	      var planeGeometry = new THREE.PlaneGeometry(part.scale, part.scale);
	      var material = new THREE.MeshBasicMaterial({
	        color: part.color,
	        side: THREE.DoubleSide,
	        transparent: true,
	        blending: THREE.AdditiveBlending,
	        depthTest: true,
	        depthWrite: false,
	        visible: false
	      });
	      material['noFade'] = part['noFade'] === true;

	      this.materials.push(material);
	      var src = document.querySelector(textureSrcs[part.textureIdx]).getAttribute('src');
	      this.el.sceneEl.systems.material.loadTexture(src, {src: src}, setMap.bind(this, i));

	      function setMap (idx, texture) {
	        this.materials[idx].alphaMap = texture;
	        this.materials[idx].needsUpdate = true;
	        this.materials[idx].visible = true;
	      }

	      var dispersionCenter =  part.dispersion / 2;

	      for (var n = 0; n < part.copies; n++) {
	        var mesh = new THREE.Mesh(planeGeometry, material);
	        if (!part.billboard) {
	          mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
	        }
	        else if (this.data.lookAt) {
	          mesh.lookAt(this.data.lookAt);
	        }
	        if (part.dispersion > 0) {
	          mesh.position.set(
	            Math.random() * part.dispersion - dispersionCenter,
	            Math.random() * part.dispersion - dispersionCenter,
	            Math.random() * part.dispersion - dispersionCenter
	          );
	          mesh.speed = part.speed + Math.random() / part.dispersion;
	        }
	        mesh.part = part;
	        this.meshes.add(mesh);
	        part.meshes.push(mesh);
	      }
	    }

	    this.el.setObject3D('explosion', this.meshes);
	  },

	  reset: function () {
	    this.life = 0;
	    this.starttime = null;

	    for (var i in this.parts) {
	      var part = this.parts[i];

	      var dispersionCenter =  part.dispersion / 2;

	      for (var n = 0; n < part.copies; n++) {
	        var mesh = part.meshes[n];

	        if (!part.billboard) {
	          mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
	        }
	        else if (this.data.lookAt) {
	          mesh.lookAt(this.data.lookAt);
	        }
	        if (part.dispersion > 0) {
	          mesh.position.set(
	            Math.random() * part.dispersion - dispersionCenter,
	            Math.random() * part.dispersion - dispersionCenter,
	            Math.random() * part.dispersion - dispersionCenter
	          );
	          mesh.speed = part.speed + Math.random() / part.dispersion;
	        }
	      }
	    }
	    this.starttime = null;


	    this.system.returnToPool(this.data.type, this.el);
	  },

	  tick: function (time, delta) {
	    if (this.starttime === null) {
	      this.starttime = time;
	    }
	    this.life = (time - this.starttime) / this.data.duration;

	    if (this.life > 1) {
	      this.reset();
	      return;
	    }

	    var t =  this.life * ( 2 - this.life ); //out easing

	    for (var i = 0; i < this.meshes.children.length; i++){
	      var mesh = this.meshes.children[i];
	      var s = 1 + t * mesh.part.grow;
	      mesh.scale.set(s, s, s);
	      if (mesh.part.speed > 0) {
	        mesh.position.multiplyScalar(1 + delta / 1000 * mesh.speed);
	      }
	    }
	    for (var i in this.materials) {
	      if (this.materials[i].noFade) {
	        continue;
	      }
	      this.materials[i].opacity = 1 - t;
	    }
	  }
	});


/***/ }),
/* 28 */
/***/ (function(module, exports) {

	AFRAME.registerComponent('animate-message', {
	  init: function () {
	    var self = this;
	  	this.startMsg = null;
	    this.el.addEventListener('model-loaded', function(event) {
	      self.startMsg = self.el.getObject3D('mesh').getObjectByName('start');
	    });
	  },
	  tick: function (time, delta) {
	  	if (this.startMsg) {
	      this.startMsg.rotation.z = -Math.PI + Math.abs(Math.sin(time / 200) * 0.03);
	  	}
	  }
	});


/***/ }),
/* 29 */
/***/ (function(module, exports) {

	/* globals AFRAME PEWVR THREE */
	AFRAME.registerComponent('gamestate-visuals', {
	  schema: {
	  },
	  init: function () {
	    this.logo = document.getElementById('logo');
	    this.startEnemy = document.getElementById('start_enemy');
	    this.mainMenuGroup = document.getElementById('mainmenu');
	    this.messageGroup = document.getElementById('message-group');
	    this.gameover = document.getElementById('gameover-model');
	    this.welldone = document.getElementById('welldone-model');
	    this.reset = document.getElementById('reset');

	    var self = this;
	    this.el.sceneEl.addEventListener('gamestate-changed', function (evt) {
	      if ('state' in evt.detail.diff) {
	        if (evt.detail.state.state === 'STATE_PLAYING') {
	          self.startPlaying();
	        } else if (evt.detail.state.state === 'STATE_GAME_OVER') {
	          self.finishPlaying('GAME_OVER');
	        } else if (evt.detail.state.state === 'STATE_GAME_WIN') {
	          self.finishPlaying('GAME_WIN');
	        } else if (evt.detail.state.state === 'STATE_MAIN_MENU') {
	          self.mainMenu();
	        }
	      }
	    }.bind(this));
	  },

	  startPlaying: function () {
	    var self = this;
	    var rotation = { x: 0.0 };
	    var tween = new AFRAME.TWEEN.Tween(rotation)
	      .to({x: Math.PI * 0.6}, 1000)
	      .onComplete(function () {
	        self.mainMenuGroup.setAttribute('visible', false);
	      })
	      .easing(AFRAME.TWEEN.Easing.Back.InOut)
	      .onUpdate(function () {
	        // self.logo.object3D.rotation.x = rotation.x
	      });
	    tween.start();
	    this.startEnemy.setAttribute('visible', false);
	  },

	  finishPlaying: function (type) {
	    var self = this;
	    var gameover = type === 'GAME_OVER';

	    // Move the reset buttom
	    this.reset.object3D.position.y = -5;
	    var resetPosition = { y: -5 };
	    var tweenReset = new AFRAME.TWEEN.Tween(resetPosition)
	      .to({y: 0}, 1000)
	      .delay(3000)
	      .easing(AFRAME.TWEEN.Easing.Elastic.Out)
	      .onUpdate(function () {
	        self.reset.object3D.position.y = resetPosition.y;
	      });
	    tweenReset.start();
	},

	  mainMenu: function () {
	    var self = this;
	    this.startEnemy.setAttribute('position', '0 -5 -4');
	    this.startEnemy.setAttribute('visible', true);
	    this.mainMenuGroup.setAttribute('visible', true);

	    // Move the enemy up
	    var enemyPosition = { positionY: -5 };
	    var tweenEnemy = new AFRAME.TWEEN.Tween(enemyPosition)
	      .to({positionY: 1.4}, 1000)
	      .delay(1000)
	      .easing(AFRAME.TWEEN.Easing.Back.InOut)
	      .onUpdate(function () {
	        self.startEnemy.setAttribute('position', {x: 0, y: enemyPosition.positionY, z: -4})
	      });
	    tweenEnemy.start();

	    // Move the gameover & well done down
	    var group = document.getElementById('finished');

	    group.object3D.position.y = 1;

	    var textsPosition = { y: 1 };
	    var tween = new AFRAME.TWEEN.Tween(textsPosition)
	      .to({y: -5}, 1000)
	      .easing(AFRAME.TWEEN.Easing.Elastic.In)
	      .onComplete(function () {
	        group.setAttribute('visible', false);
	      })
	      .onUpdate(function () {
	        group.object3D.position.y = textsPosition.y;
	      });
	    tween.start();

	    // A-Blast logo will appears after a 1s delay
	    this.logo.object3D.rotation.x = Math.PI * 0.6;

	    var logoRotation = { x: 0 };
	    var tween = new AFRAME.TWEEN.Tween(logoRotation)
	      .to({x: Math.PI * 0.6}, 1000)
	      .easing(AFRAME.TWEEN.Easing.Elastic.Out)
	      .delay(1000)
	      .onUpdate(function () {
	        // self.logo.object3D.rotation.x = Math.PI * 0.6 - logoRotation.x;
	      });
	    tween.start();
	  }
	});


/***/ }),
/* 30 */
/***/ (function(module, exports) {

	/* globals AFRAME PEWVR */

	AFRAME.registerComponent('sound-fade', {
	  schema: {
	    from: {default: 0.0},
	    to: {default: 1.0},
	    duration: {default: 1000},
	  },

	  init: function () {
	  	if (this.el.getAttribute('sound')) {
	      this.el.setAttribute('sound', 'volume', this.data.from);
	      this.fadeEnded = false;
	      this.diff = this.data.to - this.data.from;
	    }
	    else {
	      this.fadeEnded = true;
	    }
	  },

	  update: function (oldData) {
	      this.endTime = undefined; 
	      this.fadeEnded = false;
	      this.diff = this.data.to - this.data.from;
	  },

	  tick: function (time, delta) {
	    if (this.fadeEnded) {
	      return;
	    }
	    if (this.endTime === undefined) {
	      this.endTime = time + this.data.duration;
	      return;
	    }

	    var ease = 1 - (this.endTime - time) / this.data.duration;
	    ease = Math.max(0, Math.min(1, ease * ease)); //easeQuadIn
	    var vol = this.data.from + this.diff * ease;
	    this.el.setAttribute('sound', 'volume', vol);
	    if (ease === 1) {
	      this.fadeEnded = true;
	    }
	  }
	});

/***/ }),
/* 31 */
/***/ (function(module, exports) {

	AFRAME.registerComponent('restrict-position', {
	  schema: {
	  },

	  init: function () {
	    this.active = !AFRAME.utils.device.checkHeadsetConnected();
	    this.radius = 2;
	  },

	  tick: function (time, delta) {
	    if (!this.active) { return; }
	    var fromCircleToObject = new THREE.Vector3();
	    var y = this.el.object3D.position.y;
	    fromCircleToObject.copy(this.el.object3D.position);
	    var len = this.radius / fromCircleToObject.length();
	    if (len < 0.98) {
	      fromCircleToObject.multiplyScalar(this.radius / fromCircleToObject.length());
	      this.el.setAttribute('position', {
	        x: fromCircleToObject.x,
	        y: y,
	        z: fromCircleToObject.z
	      });
	    }
	  }
	});


/***/ })
/******/ ]);