import https from 'https';
import http from 'http';

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get$1 = function get$1(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get$1(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

/**
 * One of the planets, asteroids, the sun or moon
 */

var Planet$1 = function () {
  /**
   * Instantiate a new planet object.
   * @param {string} name The planet's name
   * @param {number} lon  The planet's longitude
   * @param {number} lat  The planet's latitude
   * @param {number} spd  The planet's speed relative to earth
   */
  function Planet(name, lon, lat, spd) {
    classCallCheck(this, Planet);

    /**
     * Dictionary of symbols for the planets for
     * use with the Kairon Semiserif font
     * @type {Object}
     */
    this.symbols = {
      "sun": "a",
      "moon": "s",
      "mercury": "d",
      "venus": "f",
      "earth": "g",
      "mars": "h",
      "jupiter": "j",
      "saturn": "k",
      "uranus": "ö",
      "neptune": "ä",
      "pluto": "#",
      "south node": "?",
      "north node": "ß",
      "ceres": "A",
      "pallas": "S",
      "juno": "D",
      "vesta": "F",
      "lilith": "ç",
      "cupido": "L",
      "chiron": "l",
      "nessus": "ò",
      "pholus": "ñ",
      "chariklo": "î",
      "eris": "È",
      "chaos": "Ê",
      "fortuna": "%"
    };
    this.name = name;
    this.longitude = lon;
    this.latitude = lat;
    this.speed = spd;
    this.symbol = this.symbols[name.toLowerCase()];
  }
  /**
   * A planet is retrograde when it's speed relative
   * to earth is less than zero
   * @return {boolean} Whether or not the planet is retrograde
   */


  createClass(Planet, [{
    key: "isRetrograde",
    value: function isRetrograde() {
      return this.speed < 0;
    }
    /**
     * Is this one of the major planets typically included in a chart?
     * @return {boolean} Returns true if it is a major planet
     */

  }, {
    key: "isMajor",
    value: function isMajor() {
      return ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "north node", "south node"].indexOf(this.name.toLowerCase()) > -1;
    }
  }]);
  return Planet;
}();

var Planet_1 = Planet$1;

var planet = {
  Planet: Planet_1
};

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var rp_1$1 = createCommonjsModule(function (module, exports) {
    "use strict";

    var https$$1 = https;
    var uri = function uri(options) {
        var url = options.uri,
            qs = Object.keys(options.qs).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(options.qs[key].toString());
        }).join("&");
        return url + '?' + qs;
    };
    var rp = function rp(options) {
        return new Promise(function (resolve, reject) {
            var http$$1 = http;
            var lib = options.uri.startsWith("https") ? https$$1 : http$$1;
            var url = uri(options);
            var req = lib.get(url, function (response) {
                if (response.statusCode < 200 || response.statusCode > 299) {
                    reject(new Error("HTTP Error: " + response.statusCode));
                }
                var body = [];
                response.on("data", function (chunk) {
                    return body.push(chunk);
                });
                response.on("end", function () {
                    return resolve(JSON.parse(body.join("")));
                });
            });
            req.on("error", function (err) {
                return reject(err);
            });
        });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = rp;
});

var __awaiter = commonjsGlobal && commonjsGlobal.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator.throw(value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var rp_1 = rp_1$1;
/**
 * Represents a person or event for whom a chart will be created
 */

var Person$1 = function () {
    /**
     * Creates a Person object
     * @param {string} public name Name of the person or event
     * @param {string} public date UTC date in ISO 8601 format, i.e. YYYY-MM-DDTHH:mmZ (caller must convert to UTC)
     * @param {Point} location The [lat: number, lon: number] of the event or person's birthplace
     */
    function Person(name, date, location) {
        classCallCheck(this, Person);

        this.name = name;
        this.date = date;
        this.location = location;
    }
    /**
     * Asynchronous factory function for creating people or events
     * @param  {string}          name     Name of the person or event
     * @param  {Date | string}   date     Exact datetime for the chart, preferably UTC date in ISO 8601 format, i.e. YYYY-MM-DDTHH:mmZ (caller must convert to UTC)
     * @param  {Point | string}  location Either an address or a lat/lng combination
     * @return {Promise<Person>}          The Person object that was created
     */


    createClass(Person, null, [{
        key: 'create',
        value: function create(name, date, location) {
            return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function _callee() {
                var dt, loc;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                dt = void 0, loc = void 0;
                                // make sure a name was submitted

                                if (name) {
                                    _context.next = 3;
                                    break;
                                }

                                throw new Error("No name was submitted for the person");

                            case 3:
                                if (!(typeof date === "string")) {
                                    _context.next = 9;
                                    break;
                                }

                                if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}\.\d{3})?Z/.test(date)) {
                                    _context.next = 6;
                                    break;
                                }

                                throw new TypeError("Date not formatted according to ISO 8601 (YYYY-MM-DDTHH:mmZ)");

                            case 6:
                                dt = date;
                                _context.next = 10;
                                break;

                            case 9:
                                if (date instanceof Date) {
                                    dt = date.toISOString();
                                } else {
                                    // defaults to "now"
                                    dt = new Date().toISOString();
                                }

                            case 10:
                                if (!(typeof location === "string")) {
                                    _context.next = 16;
                                    break;
                                }

                                _context.next = 13;
                                return this.getLatLon(location);

                            case 13:
                                loc = _context.sent;
                                _context.next = 21;
                                break;

                            case 16:
                                if (!(location.lat < -90 || location.lat > 90)) {
                                    _context.next = 18;
                                    break;
                                }

                                throw new RangeError("Latitude must be between -90 and 90");

                            case 18:
                                if (!(location.lng < -180 || location.lng > 180)) {
                                    _context.next = 20;
                                    break;
                                }

                                throw new RangeError("Longitude must be between -180 and 180");

                            case 20:
                                loc = location;

                            case 21:
                                return _context.abrupt('return', new Person(name, dt, loc));

                            case 22:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
        /**
         * Gets a timezone given a latitude and longitude
         * @param {Point} p  Contains the latitude and longitude in decimal format
         */

    }, {
        key: 'getTimezone',
        value: function getTimezone(p) {
            return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function _callee2() {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return rp_1.default({
                                    uri: "https://maps.googleapis.com/maps/api/timezone/json",
                                    qs: {
                                        key: this._key,
                                        location: p.lat + ',' + p.lng,
                                        timestamp: Math.floor(Date.now() / 1000)
                                    }
                                }).then(function (tzinfo) {
                                    return tzinfo.timeZoneId;
                                }, function (error) {
                                    throw Error(error.errorMessage);
                                });

                            case 2:
                                return _context2.abrupt('return', _context2.sent);

                            case 3:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
        /**
         * Get a latitude and longitude given an address
         * @param {string} address The address of the desired lat/lon
         */

    }, {
        key: 'getLatLon',
        value: function getLatLon(address) {
            return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function _callee3() {
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                _context3.next = 2;
                                return rp_1.default({
                                    uri: "https://maps.googleapis.com/maps/api/geocode/json",
                                    qs: {
                                        key: this._key,
                                        address: address
                                    }
                                }).then(function (latlng) {
                                    return latlng.results[0].geometry.location;
                                }, function (error) {
                                    throw Error(error.error_message);
                                });

                            case 2:
                                return _context3.abrupt('return', _context3.sent);

                            case 3:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        }
    }]);
    return Person;
}();
/**
 * Google API key
 * @type {string}
 */


Person$1._key = "AIzaSyAXnIdQxap1WQuzG0XxHfYlCA5O9GQyvuY";
var Person_1 = Person$1;

var person = {
    Person: Person_1
};

/**
 * Represents an aspect between two planets
 */

var Aspect$1 = function () {
    /**
     * Creates a new Aspect or throws an error if no aspect exists
     * between the planets
     * @param {Planet} public p1 First planet in the relationship
     * @param {Planet} public p2 Second planet in the relationship
     */
    function Aspect(p1, p2) {
        classCallCheck(this, Aspect);

        this.p1 = p1;
        this.p2 = p2;
        /**
         * Catalog of all of the aspect types available in our system
         * @type {AspectTypeArray}
         */
        this._types = {
            "conjunct": { major: true, angle: 0, orb: 6, symbol: "<" },
            "semisextile": { major: false, angle: 30, orb: 3, symbol: "y" },
            "decile": { major: false, angle: 36, orb: 1.5, symbol: ">" },
            "novile": { major: false, angle: 40, orb: 1.9, symbol: "M" },
            "semisquare": { major: false, angle: 45, orb: 3, symbol: "=" },
            "septile": { major: false, angle: 51.417, orb: 2, symbol: "V" },
            "sextile": { major: true, angle: 60, orb: 6, symbol: "x" },
            "quintile": { major: false, angle: 72, orb: 2, symbol: "Y" },
            "bilin": { major: false, angle: 75, orb: 0.9, symbol: "-" },
            "binovile": { major: false, angle: 80, orb: 2, symbol: ";" },
            "square": { major: true, angle: 90, orb: 6, symbol: "c" },
            "biseptile": { major: false, angle: 102.851, orb: 2, symbol: "N" },
            "tredecile": { major: false, angle: 108, orb: 2, symbol: "X" },
            "trine": { major: true, angle: 120, orb: 6, symbol: "Q" },
            "sesquiquadrate": { major: false, angle: 135, orb: 3, symbol: "b" },
            "biquintile": { major: false, angle: 144, orb: 2, symbol: "C" },
            "inconjunct": { major: false, angle: 150, orb: 3, symbol: "n" },
            "treseptile": { major: false, angle: 154.284, orb: 1.1, symbol: "B" },
            "tetranovile": { major: false, angle: 160, orb: 3, symbol: ":" },
            "tao": { major: false, angle: 165, orb: 1.5, symbol: "—" },
            "opposition": { major: true, angle: 180, orb: 6, symbol: "m" }
        };
        // get key properties of the planets
        var l1 = p1.longitude,
            l2 = p2.longitude,
            ng = Math.abs(l1 - l2),
            r1 = p1.isRetrograde(),
            r2 = p2.isRetrograde(),
            s1 = Math.abs(p1.speed),
            s2 = Math.abs(p2.speed),
            ct = false; // corrected?
        // correct for cases where the angle > 180 + the orb of opposition
        if (ng > 180 + this._types["opposition"].orb) {
            ng = l1 > l2 ? 360 - l1 + l2 : 360 - l2 + l1;
            ct = true;
        }
        // determine the aspect type
        for (var type in this._types) {
            var t = this._types[type];
            if (ng >= t.angle - t.orb && ng <= t.angle + t.orb) {
                this._type = type;
            }
        }
        // bail out if there is no in-orb aspect between these two planets
        if (typeof this._type === "undefined") {
            throw new Error("There is no aspect between these two planets.");
        }
        // determine the orb
        this._orb = Number((ng % 1).toFixed(6));
        // determine if it is applying or not; use speed magnitude (i.e. absolute value)
        var orb = ng - this._types[this._type].angle;
        // planets are in aspect across 0° Aries
        if ((orb < 0 && !ct && l2 > l1 || orb > 0 && !ct && l1 > l2 || orb < 0 && ct && l1 > l2 || orb > 0 && ct && l2 > l1) && (!r1 && !r2 && s2 > s1 || r1 && r2 && s1 > s2 || r1 && !r2) || (orb > 0 && !ct && l2 > l1 || orb < 0 && !ct && l1 > l2 || orb > 0 && ct && l1 > l2 || orb < 0 && ct && l2 > l1) && (!r1 && !r2 && s1 > s2 || r1 && r2 && s2 > s1 || !r1 && r2)) {
            this._applying = true;
        } else {
            this._applying = false;
        }
    }
    /**
     * Get the type assigned to this aspect
     * @return {string} One of the aspect type names
     */


    createClass(Aspect, [{
        key: "isApplying",

        /**
         * Is the aspect applying or separating?
         * @return {boolean} True if the aspect is applying
         */
        value: function isApplying() {
            return this._applying;
        }
        /**
         * Is this a "major" aspect? i.e. one of those you usually
         * hear about in astrological forecasts
         * @return {boolean} True if this is a "major" aspect
         */

    }, {
        key: "isMajor",
        value: function isMajor() {
            return this._types[this._type].major;
        }
    }, {
        key: "type",
        get: function get() {
            return this._type;
        }
        /**
         * Get the number of degrees away from being in perfect aspect
         * @return {number} The number of degrees (absolute value)
         */

    }, {
        key: "orb",
        get: function get() {
            return this._orb;
        }
        /**
         * Get the character that will produce the correct symbol for
         * this aspect in the Kairon Semiserif font
         * @return {string} A character representing a symbol
         */

    }, {
        key: "symbol",
        get: function get() {
            return this._types[this._type].symbol;
        }
    }]);
    return Aspect;
}();

var Aspect_1 = Aspect$1;

var aspect = {
    Aspect: Aspect_1
};

var __awaiter$1 = commonjsGlobal && commonjsGlobal.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator.throw(value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var chart_1$1 = chart;
var rp_1$2 = rp_1$1;
/**
 * Usage: let chart: Chart = ChartFactory.create("my cart", person);
 */

var ChartFactory$1 = function () {
    function ChartFactory() {
        classCallCheck(this, ChartFactory);
    }

    createClass(ChartFactory, null, [{
        key: 'create',
        value: function create(name, p1) {
            var p2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var type = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : chart_1$1.ChartType.Basic;

            return __awaiter$1(this, void 0, void 0, regeneratorRuntime.mark(function _callee() {
                var cdata, date, p;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!(null === name || "undefined" === typeof name || 0 === name.length)) {
                                    _context.next = 2;
                                    break;
                                }

                                throw Error("Chart must have a name (ChartFactory)");

                            case 2:
                                if (!(null === p1 || typeof p1 === "undefined")) {
                                    _context.next = 4;
                                    break;
                                }

                                throw Error("Person cannot be null or undefined (ChartFactory)");

                            case 4:
                                _context.t0 = type;
                                _context.next = _context.t0 === chart_1$1.ChartType.Synastry ? 7 : _context.t0 === chart_1$1.ChartType.Combined ? 7 : _context.t0 === chart_1$1.ChartType.CombinedTransits ? 7 : _context.t0 === chart_1$1.ChartType.Davison ? 7 : 9;
                                break;

                            case 7:
                                if (!(null === p2)) {
                                    _context.next = 9;
                                    break;
                                }

                                throw Error("2nd Person cannot be null for this chart type (ChartFactory)");

                            case 9:
                                cdata = [], date = void 0, p = void 0;
                                _context.t1 = type;
                                _context.next = _context.t1 === chart_1$1.ChartType.Transits ? 13 : _context.t1 === chart_1$1.ChartType.Synastry ? 17 : _context.t1 === chart_1$1.ChartType.Combined ? 17 : _context.t1 === chart_1$1.ChartType.CombinedTransits ? 21 : _context.t1 === chart_1$1.ChartType.Davison ? 25 : _context.t1 === chart_1$1.ChartType.DavisonTransits ? 33 : 39;
                                break;

                            case 13:
                                _context.next = 15;
                                return Promise.all([ChartFactory.getChartData(p1.date, p1.location), ChartFactory.getChartData(new Date().toISOString(), p1.location)]);

                            case 15:
                                cdata = _context.sent;
                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata, null, type));

                            case 17:
                                _context.next = 19;
                                return Promise.all([ChartFactory.getChartData(p1.date, p1.location), ChartFactory.getChartData(p2.date, p2.location)]);

                            case 19:
                                cdata = _context.sent;
                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata, null, type));

                            case 21:
                                _context.next = 23;
                                return Promise.all([ChartFactory.getChartData(p1.date, p1.location), ChartFactory.getChartData(p2.date, p2.location), ChartFactory.getChartData(new Date().toISOString(), p1.location)]);

                            case 23:
                                cdata = _context.sent;
                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata, null, type));

                            case 25:
                                date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                                p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                                _context.t2 = cdata;
                                _context.next = 30;
                                return ChartFactory.getChartData(date, p);

                            case 30:
                                _context.t3 = _context.sent;

                                _context.t2.push.call(_context.t2, _context.t3);

                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata));

                            case 33:
                                date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                                p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                                _context.next = 37;
                                return Promise.all([ChartFactory.getChartData(date, p), ChartFactory.getChartData(new Date().toISOString(), p)]);

                            case 37:
                                cdata = _context.sent;
                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata, null, type));

                            case 39:
                                _context.t4 = cdata;
                                _context.next = 42;
                                return ChartFactory.getChartData(p1.date, p1.location);

                            case 42:
                                _context.t5 = _context.sent;

                                _context.t4.push.call(_context.t4, _context.t5);

                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata));

                            case 45:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
        /**
         * Calculates the lat/lon of the geographic midpoint between two lat/lon pairs
         * @param  {Point} p1 Latitude/longitude of first location
         * @param  {Point} p2 Latitude/longitude of second location
         * @return {Point} The latitude/longitude of the geographic midpoint
         */

    }, {
        key: 'getGeoMidpoint',
        value: function getGeoMidpoint(p1, p2) {
            var lat1 = ChartFactory.toRadians(p1.lat),
                lng1 = ChartFactory.toRadians(p1.lng),
                lat2 = ChartFactory.toRadians(p2.lat),
                lng2 = ChartFactory.toRadians(p2.lng),
                bx = Math.cos(lat2) * Math.cos(lng2 - lng1),
                by = Math.cos(lat2) * Math.sin(lng2 - lng1),
                lng3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx),
                lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt(Math.pow(Math.cos(lat1) + bx, 2) + Math.pow(by, 2)));
            return {
                lat: ChartFactory.toDegrees(lat3),
                lng: ChartFactory.toDegrees(lng3)
            };
        }
        /**
         * Finds the exact midpoint between two dates
         * @param  {string} date1 The first date
         * @param  {string} date2 The second date
         * @return {string}       The midpoint date as an ISO 8601 string
         */

    }, {
        key: 'getDatetimeMidpoint',
        value: function getDatetimeMidpoint(date1, date2) {
            var d1 = new Date(date1).getTime(),
                d2 = new Date(date2).getTime(),
                ts = void 0;
            // if two dates are the same, midpoint is just that date
            if (d1 === d2) {
                return date1;
            }
            ts = d1 < d2 ? d1 + (d2 - d1) / 2 : d2 + (d1 - d2) / 2;
            return new Date(ts).toISOString();
        }
        /**
         * Gets chart data from the online ephemeris
         * @param {string} date A UTC datetime string in ISO 8601 format
         * @param {Point}  p    An object with numeric lat and lng properties
         * @return {Promise<ChartData>}  A JSON object with the data needed to implement a chart
         */

    }, {
        key: 'getChartData',
        value: function getChartData(date, p) {
            return __awaiter$1(this, void 0, void 0, regeneratorRuntime.mark(function _callee2() {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return rp_1$2.default({
                                    uri: "http://www.morphemeris.com/ephemeris.php",
                                    qs: {
                                        date: date,
                                        lat: p.lat,
                                        lon: p.lng
                                    }
                                }).then(function (cdata) {
                                    return cdata;
                                });

                            case 2:
                                return _context2.abrupt('return', _context2.sent);

                            case 3:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }]);
    return ChartFactory;
}();
/**
 * Converts decimal degrees to radians
 * @param  {number} degrees Decimal representation of degrees to be converted
 * @return {number}         Returns radians
 */


ChartFactory$1.toRadians = function (degrees) {
    return degrees * Math.PI / 180;
};
/**
 * Converts radians to decimal degrees
 * @param  {number} radians Radians to be converted
 * @return {number}         Returns decimal degrees
 */
ChartFactory$1.toDegrees = function (radians) {
    return radians * 180 / Math.PI;
};
var ChartFactory_1 = ChartFactory$1;

var chartFactory = {
    ChartFactory: ChartFactory_1
};

var chart = createCommonjsModule(function (module, exports) {
    "use strict";

    var __awaiter = commonjsGlobal && commonjsGlobal.__awaiter || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator.throw(value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : new P(function (resolve) {
                    resolve(result.value);
                }).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments)).next());
        });
    };
    var planet_1 = planet;
    var aspect_1 = aspect;
    var chart_factory_1 = chartFactory;
    (function (ChartType) {
        ChartType[ChartType["Basic"] = 0] = "Basic";
        ChartType[ChartType["Transits"] = 1] = "Transits";
        ChartType[ChartType["Synastry"] = 2] = "Synastry";
        ChartType[ChartType["Combined"] = 3] = "Combined";
        ChartType[ChartType["Davison"] = 4] = "Davison";
        ChartType[ChartType["CombinedTransits"] = 5] = "CombinedTransits";
        ChartType[ChartType["DavisonTransits"] = 6] = "DavisonTransits";
    })(exports.ChartType || (exports.ChartType = {}));
    var ChartType = exports.ChartType;

    var Chart = function () {
        function Chart(name, p1, cdata, p2) {
            var type = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : ChartType.Basic;
            classCallCheck(this, Chart);

            this.name = name;
            this.p1 = p1;
            this.p2 = p2;
            this.type = type;
            this._debug = false;
            this._signs = [{ name: "aries", symbol: "q", v: 1 }, { name: "taurus", symbol: "w", v: 1 }, { name: "gemini", symbol: "e", v: 1 }, { name: "cancer", symbol: "r", v: 1 }, { name: "leo", symbol: "t", v: 1 }, { name: "virgo", symbol: "z", v: 1 }, { name: "libra", symbol: "u", v: 1 }, { name: "scorpio", symbol: "i", v: 1 }, { name: "sagittarius", symbol: "o", v: 1 }, { name: "capricorn", symbol: "p", v: 1 }, { name: "aquarius", symbol: "ü", v: 1 }, { name: "pisces", symbol: "+", v: 1 }];
            var pdata = void 0;
            switch (type) {
                case ChartType.Combined:
                    pdata = this.calculateCombinedPlanets(cdata);
                    this._planets1 = this.getPlanets(pdata);
                    this._ascendant = pdata.ascendant;
                    this._houses = pdata.houses;
                    break;
                case ChartType.CombinedTransits:
                    pdata = this.calculateCombinedPlanets(cdata);
                    this._planets1 = this.getPlanets(pdata);
                    this._planets2 = this.getPlanets(cdata[2]);
                    this._ascendant = pdata.ascendant;
                    this._houses = pdata.houses;
                    break;
                default:
                    this._planets1 = this.getPlanets(cdata[0]);
                    if (cdata[1]) {
                        this._planets2 = this.getPlanets(cdata[1]);
                    }
                    this._ascendant = cdata[0].ascendant;
                    this._houses = cdata[0].houses;
                    break;
            }
            this.calculateAspects();
        }
        /**
         * Extracts planet data from ChartData and creates Planet objects for each one
         * @param  {ChartData}     cdata JSON data returned from morphemeris REST API
         * @return {Array<Planet>}       An array of Planet objects
         */


        createClass(Chart, [{
            key: 'getPlanets',
            value: function getPlanets(cdata) {
                var planets = [];
                for (var p in cdata.planets) {
                    var pd = cdata.planets[p];
                    planets.push(new planet_1.Planet(pd.name, pd.lon, pd.lat, pd.spd));
                }
                return planets;
            }
            /**
             * Calculates the aspects between planets in the chart
             */

        }, {
            key: 'calculateAspects',
            value: function calculateAspects() {
                this._aspects = [];
                if (!this._planets2) {
                    // calculate aspects within the _planets1 array
                    for (var i in this._planets1) {
                        for (var j in this._planets1) {
                            if (i !== j && j > i) {
                                try {
                                    this._aspects.push(new aspect_1.Aspect(this._planets1[i], this._planets1[j]));
                                } catch (err) {
                                    if (this._debug) console.error(err);
                                }
                            }
                        }
                    }
                } else {
                    // calculate aspects between the _planets1 and _planets2 arrays
                    for (var _i in this._planets1) {
                        for (var _j in this._planets2) {
                            try {
                                this._aspects.push(new aspect_1.Aspect(this._planets1[_i], this._planets2[_j]));
                            } catch (err) {
                                if (this._debug) console.error(err);
                            }
                        }
                    }
                }
            }
            /**
             * Calculates longitudes for a combined chart
             * @param {ChartData} p1 Planet data from person one
             * @param {ChartData} p2 Planet data from person two
             */

        }, {
            key: 'calculateCombinedPlanets',
            value: function calculateCombinedPlanets(cdata) {
                var cd = { "planets": { "sun": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "moon": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "mercury": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "venus": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "mars": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "jupiter": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "saturn": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "uranus": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "neptune": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "pluto": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "north node": { "name": "north node", "lon": null, "lat": null, "spd": null, "r": null }, "south node": { "name": "south node", "lon": null, "lat": null, "spd": null, "r": null }, "chiron": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "pholus": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "ceres": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "pallas": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "juno": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "vesta": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "cupido": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "chariklo": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "chaos": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "eris": { "name": null, "lon": null, "lat": null, "spd": null, "r": null }, "nessus": { "name": null, "lon": null, "lat": null, "spd": null, "r": null } }, "houses": [null, null, null, null, null, null, null, null, null, null, null, null], "ascendant": null, "mc": null };
                for (var p in cdata[0].planets) {
                    cd.planets[p].name = p;
                    cd.planets[p].lon = this.getLonMidpoint(cdata[0].planets[p].lon, cdata[1].planets[p].lon);
                    cd.planets[p].lat = (cdata[0].planets[p].lat + cdata[1].planets[p].lat) / 2;
                    cd.planets[p].spd = (cdata[0].planets[p].spd + cdata[1].planets[p].spd) / 2;
                }
                for (var h in cdata[0].houses) {
                    cd.houses[h] = this.getLonMidpoint(cdata[0].houses[h], cdata[1].houses[h]);
                }
                cd.ascendant = this.getLonMidpoint(cdata[0].ascendant, cdata[1].ascendant);
                cd.mc = this.getLonMidpoint(cdata[0].mc, cdata[1].mc);
                return cd;
            }
            /**
             * Finds the midpoint between two planets on the "short" side
             * @param  {number} l1 Longitude of planet one
             * @param  {number} l2 Longitude of planet two
             * @return {number}    Longitude of the midpoint
             */

        }, {
            key: 'getLonMidpoint',
            value: function getLonMidpoint(l1, l2) {
                var mp = void 0,
                    high = void 0,
                    low = void 0;
                // if they are exactly the same, return either one
                if (l1 === l2) {
                    return l1;
                }
                // figure out which has a higher/lower longitude
                high = l1 > l2 ? l1 : l2;
                low = l1 < l2 ? l1 : l2;
                if (high - low <= 180) {
                    mp = (high + low) / 2;
                } else {
                    mp = ((low + 360 - high) / 2 + high) % 360;
                }
                return mp;
            }
            /**
             * Refresh or set the transits to a new time
             * @param {string} date (Optional) Target datetime for transits in ISO 8601 format; defaults to now()
             */

        }, {
            key: 'refreshTransits',
            value: function refreshTransits() {
                var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function _callee() {
                    var cdata;
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    if (!(ChartType.Synastry === this.type)) {
                                        _context.next = 2;
                                        break;
                                    }

                                    throw new Error("You cannot refresh transits on a synastry chart");

                                case 2:
                                    if (null === date) {
                                        date = new Date().toISOString();
                                    }
                                    _context.next = 5;
                                    return chart_factory_1.ChartFactory.getChartData(date, this.p1.location);

                                case 5:
                                    cdata = _context.sent;

                                    this._planets2 = this.getPlanets(cdata);
                                    this.calculateAspects();

                                case 8:
                                case 'end':
                                    return _context.stop();
                            }
                        }
                    }, _callee, this);
                }));
            }
        }, {
            key: 'houses',
            get: function get() {
                return this._houses;
            }
        }, {
            key: 'aspects',
            get: function get() {
                return this._aspects;
            }
        }, {
            key: 'ascendant',
            get: function get() {
                return this._ascendant;
            }
        }, {
            key: 'innerPlanets',
            get: function get() {
                return this._planets2 ? this._planets1 : [];
            }
        }, {
            key: 'outerPlanets',
            get: function get() {
                return this._planets2 ? this._planets2 : this._planets1;
            }
        }]);
        return Chart;
    }();

    exports.Chart = Chart;
});

var planet_1 = planet;
var Planet = planet_1.Planet;
var person_1 = person;
var Person = person_1.Person;
var aspect_1 = aspect;
var Aspect = aspect_1.Aspect;
var chart_1 = chart;
var Chart = chart_1.Chart;
var ChartType = chart_1.ChartType;
var chart_factory_1 = chartFactory;
var ChartFactory = chart_factory_1.ChartFactory;

var astrologyjs = {
	Planet: Planet,
	Person: Person,
	Aspect: Aspect,
	Chart: Chart,
	ChartType: ChartType,
	ChartFactory: ChartFactory
};

export { Planet, Person, Aspect, Chart, ChartType, ChartFactory };export default astrologyjs;
