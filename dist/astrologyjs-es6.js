import https from 'https';
import http from 'http';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};



function unwrapExports (x) {
	return x && x.__esModule ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var classCallCheck = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
});

var _classCallCheck = unwrapExports(classCallCheck);

var _global = createCommonjsModule(function (module) {
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
});

var _core = createCommonjsModule(function (module) {
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
});

var _aFunction = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};

// optional / simple context binding
var aFunction = _aFunction;
var _ctx = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};

var _isObject = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

var isObject = _isObject;
var _anObject = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};

var _fails = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var _descriptors = !_fails(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});

var isObject$1 = _isObject;
var document$1 = _global.document;
var is = isObject$1(document$1) && isObject$1(document$1.createElement);
var _domCreate = function(it){
  return is ? document$1.createElement(it) : {};
};

var _ie8DomDefine = !_descriptors && !_fails(function(){
  return Object.defineProperty(_domCreate('div'), 'a', {get: function(){ return 7; }}).a != 7;
});

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject$2 = _isObject;
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var _toPrimitive = function(it, S){
  if(!isObject$2(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject$2(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject$2(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject$2(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};

var anObject       = _anObject;
var IE8_DOM_DEFINE = _ie8DomDefine;
var toPrimitive    = _toPrimitive;
var dP$1             = Object.defineProperty;

var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP$1(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};

var _objectDp = {
	f: f
};

var _propertyDesc = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};

var dP         = _objectDp;
var createDesc = _propertyDesc;
var _hide = _descriptors ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};

var global$1    = _global;
var core      = _core;
var ctx       = _ctx;
var hide      = _hide;
var PROTOTYPE = 'prototype';

var $export$1 = function(type, name, source){
  var IS_FORCED = type & $export$1.F
    , IS_GLOBAL = type & $export$1.G
    , IS_STATIC = type & $export$1.S
    , IS_PROTO  = type & $export$1.P
    , IS_BIND   = type & $export$1.B
    , IS_WRAP   = type & $export$1.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE]
    , target    = IS_GLOBAL ? global$1 : IS_STATIC ? global$1[name] : (global$1[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global$1)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(a, b, c){
        if(this instanceof C){
          switch(arguments.length){
            case 0: return new C;
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if(IS_PROTO){
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if(type & $export$1.R && expProto && !expProto[key])hide(expProto, key, out);
    }
  }
};
// type bitmap
$export$1.F = 1;   // forced
$export$1.G = 2;   // global
$export$1.S = 4;   // static
$export$1.P = 8;   // proto
$export$1.B = 16;  // bind
$export$1.W = 32;  // wrap
$export$1.U = 64;  // safe
$export$1.R = 128; // real proto method for `library` 
var _export = $export$1;

var $export = _export;
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !_descriptors, 'Object', {defineProperty: _objectDp.f});

var $Object = _core.Object;
var defineProperty$3 = function defineProperty$3(it, key, desc){
  return $Object.defineProperty(it, key, desc);
};

var defineProperty$1 = createCommonjsModule(function (module) {
module.exports = { "default": defineProperty$3, __esModule: true };
});

var createClass = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _defineProperty = defineProperty$1;

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
});

var _createClass = unwrapExports(createClass);

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
    _classCallCheck(this, Planet);

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


  _createClass(Planet, [{
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

var runtime = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function(arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value instanceof AwaitArgument) {
          return Promise.resolve(value.arg).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" ||
              (method === "throw" && delegate.iterator[method] === undefined)) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(
            delegate.iterator[method],
            delegate.iterator,
            arg
          );

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = arg;

        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }

        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp[toStringTagSymbol] = "Generator";

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof commonjsGlobal === "object" ? commonjsGlobal :
  typeof window === "object" ? window :
  typeof self === "object" ? self : commonjsGlobal
);
});

// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g =
  typeof commonjsGlobal === "object" ? commonjsGlobal :
  typeof window === "object" ? window :
  typeof self === "object" ? self : commonjsGlobal;

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

var runtimeModule = runtime;

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}

var index = runtimeModule;

// 7.1.4 ToInteger
var ceil  = Math.ceil;
var floor = Math.floor;
var _toInteger = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

// 7.2.1 RequireObjectCoercible(argument)
var _defined = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};

var toInteger = _toInteger;
var defined   = _defined;
// true  -> String#at
// false -> String#codePointAt
var _stringAt = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

var _library = true;

var _redefine = _hide;

var hasOwnProperty = {}.hasOwnProperty;
var _has = function(it, key){
  return hasOwnProperty.call(it, key);
};

var _iterators = {};

var toString = {}.toString;

var _cof = function(it){
  return toString.call(it).slice(8, -1);
};

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = _cof;
var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = _iobject;
var defined$1 = _defined;
var _toIobject = function(it){
  return IObject(defined$1(it));
};

// 7.1.15 ToLength
var toInteger$1 = _toInteger;
var min       = Math.min;
var _toLength = function(it){
  return it > 0 ? min(toInteger$1(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

var toInteger$2 = _toInteger;
var max       = Math.max;
var min$1       = Math.min;
var _toIndex = function(index, length){
  index = toInteger$2(index);
  return index < 0 ? max(index + length, 0) : min$1(index, length);
};

// false -> Array#indexOf
// true  -> Array#includes
var toIObject$1 = _toIobject;
var toLength  = _toLength;
var toIndex   = _toIndex;
var _arrayIncludes = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject$1($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var global$2 = _global;
var SHARED = '__core-js_shared__';
var store  = global$2[SHARED] || (global$2[SHARED] = {});
var _shared = function(key){
  return store[key] || (store[key] = {});
};

var id = 0;
var px = Math.random();
var _uid = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

var shared = _shared('keys');
var uid    = _uid;
var _sharedKey = function(key){
  return shared[key] || (shared[key] = uid(key));
};

var has$1          = _has;
var toIObject    = _toIobject;
var arrayIndexOf = _arrayIncludes(false);
var IE_PROTO$1     = _sharedKey('IE_PROTO');

var _objectKeysInternal = function(object, names){
  var O      = toIObject(object)
    , i      = 0
    , result = []
    , key;
  for(key in O)if(key != IE_PROTO$1)has$1(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while(names.length > i)if(has$1(O, key = names[i++])){
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

// IE 8- don't enum bug keys
var _enumBugKeys = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = _objectKeysInternal;
var enumBugKeys$1 = _enumBugKeys;

var _objectKeys = Object.keys || function keys(O){
  return $keys(O, enumBugKeys$1);
};

var dP$2       = _objectDp;
var anObject$2 = _anObject;
var getKeys  = _objectKeys;

var _objectDps = _descriptors ? Object.defineProperties : function defineProperties(O, Properties){
  anObject$2(O);
  var keys   = getKeys(Properties)
    , length = keys.length
    , i = 0
    , P;
  while(length > i)dP$2.f(O, P = keys[i++], Properties[P]);
  return O;
};

var _html = _global.document && document.documentElement;

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject$1    = _anObject;
var dPs         = _objectDps;
var enumBugKeys = _enumBugKeys;
var IE_PROTO    = _sharedKey('IE_PROTO');
var Empty       = function(){ /* empty */ };
var PROTOTYPE$1   = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = _domCreate('iframe')
    , i      = enumBugKeys.length
    , lt     = '<'
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  _html.appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict[PROTOTYPE$1][enumBugKeys[i]];
  return createDict();
};

var _objectCreate = Object.create || function create(O, Properties){
  var result;
  if(O !== null){
    Empty[PROTOTYPE$1] = anObject$1(O);
    result = new Empty;
    Empty[PROTOTYPE$1] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

var _wks = createCommonjsModule(function (module) {
var store      = _shared('wks')
  , uid        = _uid
  , Symbol     = _global.Symbol
  , USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function(name){
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;
});

var def = _objectDp.f;
var has$2 = _has;
var TAG = _wks('toStringTag');

var _setToStringTag = function(it, tag, stat){
  if(it && !has$2(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};

var create$1         = _objectCreate;
var descriptor     = _propertyDesc;
var setToStringTag$1 = _setToStringTag;
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
_hide(IteratorPrototype, _wks('iterator'), function(){ return this; });

var _iterCreate = function(Constructor, NAME, next){
  Constructor.prototype = create$1(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag$1(Constructor, NAME + ' Iterator');
};

// 7.1.13 ToObject(argument)
var defined$2 = _defined;
var _toObject = function(it){
  return Object(defined$2(it));
};

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has$3         = _has;
var toObject    = _toObject;
var IE_PROTO$2    = _sharedKey('IE_PROTO');
var ObjectProto = Object.prototype;

var _objectGpo = Object.getPrototypeOf || function(O){
  O = toObject(O);
  if(has$3(O, IE_PROTO$2))return O[IE_PROTO$2];
  if(typeof O.constructor == 'function' && O instanceof O.constructor){
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

var LIBRARY        = _library;
var $export$2        = _export;
var redefine       = _redefine;
var hide$1           = _hide;
var has            = _has;
var Iterators      = _iterators;
var $iterCreate    = _iterCreate;
var setToStringTag = _setToStringTag;
var getPrototypeOf = _objectGpo;
var ITERATOR       = _wks('iterator');
var BUGGY          = !([].keys && 'next' in [].keys());
var FF_ITERATOR    = '@@iterator';
var KEYS           = 'keys';
var VALUES         = 'values';

var returnThis = function(){ return this; };

var _iterDefine = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
    , methods, key, IteratorPrototype;
  // Fix native
  if($anyNative){
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
    if(IteratorPrototype !== Object.prototype){
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide$1(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if(DEF_VALUES && $native && $native.name !== VALUES){
    VALUES_BUG = true;
    $default = function values(){ return $native.call(this); };
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide$1(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES ? $default : getMethod(VALUES),
      keys:    IS_SET     ? $default : getMethod(KEYS),
      entries: $entries
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export$2($export$2.P + $export$2.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

var $at  = _stringAt(true);

// 21.1.3.27 String.prototype[@@iterator]()
_iterDefine(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});

var _addToUnscopables = function(){ /* empty */ };

var _iterStep = function(done, value){
  return {value: value, done: !!done};
};

var addToUnscopables = _addToUnscopables;
var step             = _iterStep;
var Iterators$2        = _iterators;
var toIObject$2        = _toIobject;

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
var es6_array_iterator = _iterDefine(Array, 'Array', function(iterated, kind){
  this._t = toIObject$2(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators$2.Arguments = Iterators$2.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

var global$3        = _global;
var hide$2          = _hide;
var Iterators$1     = _iterators;
var TO_STRING_TAG = _wks('toStringTag');

for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
  var NAME       = collections[i]
    , Collection = global$3[NAME]
    , proto      = Collection && Collection.prototype;
  if(proto && !proto[TO_STRING_TAG])hide$2(proto, TO_STRING_TAG, NAME);
  Iterators$1[NAME] = Iterators$1.Array;
}

// getting tag from 19.1.3.6 Object.prototype.toString()
var cof$1 = _cof;
var TAG$1 = _wks('toStringTag');
var ARG = cof$1(function(){ return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function(it, key){
  try {
    return it[key];
  } catch(e){ /* empty */ }
};

var _classof = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG$1)) == 'string' ? T
    // builtinTag case
    : ARG ? cof$1(O)
    // ES3 arguments fallback
    : (B = cof$1(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

var _anInstance = function(it, Constructor, name, forbiddenField){
  if(!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)){
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};

// call something on iterator step with safe closing on error
var anObject$3 = _anObject;
var _iterCall = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject$3(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject$3(ret.call(iterator));
    throw e;
  }
};

// check on default Array iterator
var Iterators$3  = _iterators;
var ITERATOR$1   = _wks('iterator');
var ArrayProto = Array.prototype;

var _isArrayIter = function(it){
  return it !== undefined && (Iterators$3.Array === it || ArrayProto[ITERATOR$1] === it);
};

var classof$1   = _classof;
var ITERATOR$2  = _wks('iterator');
var Iterators$4 = _iterators;
var core_getIteratorMethod = _core.getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR$2]
    || it['@@iterator']
    || Iterators$4[classof$1(it)];
};

var _forOf = createCommonjsModule(function (module) {
var ctx         = _ctx
  , call        = _iterCall
  , isArrayIter = _isArrayIter
  , anObject    = _anObject
  , toLength    = _toLength
  , getIterFn   = core_getIteratorMethod
  , BREAK       = {}
  , RETURN      = {};
var exports = module.exports = function(iterable, entries, fn, that, ITERATOR){
  var iterFn = ITERATOR ? function(){ return iterable; } : getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator, result;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if(result === BREAK || result === RETURN)return result;
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    result = call(iterator, f, step.value, entries);
    if(result === BREAK || result === RETURN)return result;
  }
};
exports.BREAK  = BREAK;
exports.RETURN = RETURN;
});

// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject$4  = _anObject;
var aFunction$2 = _aFunction;
var SPECIES   = _wks('species');
var _speciesConstructor = function(O, D){
  var C = anObject$4(O).constructor, S;
  return C === undefined || (S = anObject$4(C)[SPECIES]) == undefined ? D : aFunction$2(S);
};

// fast apply, http://jsperf.lnkit.com/fast-apply/5
var _invoke = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};

var ctx$2                = _ctx;
var invoke$1             = _invoke;
var html               = _html;
var cel                = _domCreate;
var global$5             = _global;
var process$2            = global$5.process;
var setTask            = global$5.setImmediate;
var clearTask          = global$5.clearImmediate;
var MessageChannel     = global$5.MessageChannel;
var counter            = 0;
var queue              = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer;
var channel;
var port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke$1(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(_cof(process$2) == 'process'){
    defer = function(id){
      process$2.nextTick(ctx$2(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx$2(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global$5.addEventListener && typeof postMessage == 'function' && !global$5.importScripts){
    defer = function(id){
      global$5.postMessage(id + '', '*');
    };
    global$5.addEventListener('message', listener, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx$2(run, id, 1), 0);
    };
  }
}
var _task = {
  set:   setTask,
  clear: clearTask
};

var global$6    = _global;
var macrotask = _task.set;
var Observer  = global$6.MutationObserver || global$6.WebKitMutationObserver;
var process$3   = global$6.process;
var Promise$1   = global$6.Promise;
var isNode$1    = _cof(process$3) == 'process';

var _microtask = function(){
  var head, last, notify;

  var flush = function(){
    var parent, fn;
    if(isNode$1 && (parent = process$3.domain))parent.exit();
    while(head){
      fn   = head.fn;
      head = head.next;
      try {
        fn();
      } catch(e){
        if(head)notify();
        else last = undefined;
        throw e;
      }
    } last = undefined;
    if(parent)parent.enter();
  };

  // Node.js
  if(isNode$1){
    notify = function(){
      process$3.nextTick(flush);
    };
  // browsers with MutationObserver
  } else if(Observer){
    var toggle = true
      , node   = document.createTextNode('');
    new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
    notify = function(){
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if(Promise$1 && Promise$1.resolve){
    var promise = Promise$1.resolve();
    notify = function(){
      promise.then(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function(){
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global$6, flush);
    };
  }

  return function(fn){
    var task = {fn: fn, next: undefined};
    if(last)last.next = task;
    if(!head){
      head = task;
      notify();
    } last = task;
  };
};

var hide$3 = _hide;
var _redefineAll = function(target, src, safe){
  for(var key in src){
    if(safe && target[key])target[key] = src[key];
    else hide$3(target, key, src[key]);
  } return target;
};

var global$7      = _global;
var core$1        = _core;
var dP$3          = _objectDp;
var DESCRIPTORS = _descriptors;
var SPECIES$1     = _wks('species');

var _setSpecies = function(KEY){
  var C = typeof core$1[KEY] == 'function' ? core$1[KEY] : global$7[KEY];
  if(DESCRIPTORS && C && !C[SPECIES$1])dP$3.f(C, SPECIES$1, {
    configurable: true,
    get: function(){ return this; }
  });
};

var ITERATOR$3     = _wks('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR$3]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }

var _iterDetect = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[ITERATOR$3]();
    iter.next = function(){ return {done: safe = true}; };
    arr[ITERATOR$3] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};

var LIBRARY$1            = _library;
var global$4             = _global;
var ctx$1                = _ctx;
var classof            = _classof;
var $export$3            = _export;
var isObject$3           = _isObject;
var aFunction$1          = _aFunction;
var anInstance         = _anInstance;
var forOf              = _forOf;
var speciesConstructor = _speciesConstructor;
var task               = _task.set;
var microtask          = _microtask();
var PROMISE            = 'Promise';
var TypeError$1          = global$4.TypeError;
var process$1            = global$4.process;
var $Promise           = global$4[PROMISE];
var process$1            = global$4.process;
var isNode             = classof(process$1) == 'process';
var empty              = function(){ /* empty */ };
var Internal;
var GenericPromiseCapability;
var Wrapper;

var USE_NATIVE = !!function(){
  try {
    // correct subclassing with @@species support
    var promise     = $Promise.resolve(1)
      , FakePromise = (promise.constructor = {})[_wks('species')] = function(exec){ exec(empty, empty); };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
  } catch(e){ /* empty */ }
}();

// helpers
var sameConstructor = function(a, b){
  // with library wrapper special case
  return a === b || a === $Promise && b === Wrapper;
};
var isThenable = function(it){
  var then;
  return isObject$3(it) && typeof (then = it.then) == 'function' ? then : false;
};
var newPromiseCapability = function(C){
  return sameConstructor($Promise, C)
    ? new PromiseCapability(C)
    : new GenericPromiseCapability(C);
};
var PromiseCapability = GenericPromiseCapability = function(C){
  var resolve, reject;
  this.promise = new C(function($$resolve, $$reject){
    if(resolve !== undefined || reject !== undefined)throw TypeError$1('Bad Promise constructor');
    resolve = $$resolve;
    reject  = $$reject;
  });
  this.resolve = aFunction$1(resolve);
  this.reject  = aFunction$1(reject);
};
var perform = function(exec){
  try {
    exec();
  } catch(e){
    return {error: e};
  }
};
var notify = function(promise, isReject){
  if(promise._n)return;
  promise._n = true;
  var chain = promise._c;
  microtask(function(){
    var value = promise._v
      , ok    = promise._s == 1
      , i     = 0;
    var run = function(reaction){
      var handler = ok ? reaction.ok : reaction.fail
        , resolve = reaction.resolve
        , reject  = reaction.reject
        , domain  = reaction.domain
        , result, then;
      try {
        if(handler){
          if(!ok){
            if(promise._h == 2)onHandleUnhandled(promise);
            promise._h = 1;
          }
          if(handler === true)result = value;
          else {
            if(domain)domain.enter();
            result = handler(value);
            if(domain)domain.exit();
          }
          if(result === reaction.promise){
            reject(TypeError$1('Promise-chain cycle'));
          } else if(then = isThenable(result)){
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch(e){
        reject(e);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if(isReject && !promise._h)onUnhandled(promise);
  });
};
var onUnhandled = function(promise){
  task.call(global$4, function(){
    var value = promise._v
      , abrupt, handler, console;
    if(isUnhandled(promise)){
      abrupt = perform(function(){
        if(isNode){
          process$1.emit('unhandledRejection', value, promise);
        } else if(handler = global$4.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global$4.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if(abrupt)throw abrupt.error;
  });
};
var isUnhandled = function(promise){
  if(promise._h == 1)return false;
  var chain = promise._a || promise._c
    , i     = 0
    , reaction;
  while(chain.length > i){
    reaction = chain[i++];
    if(reaction.fail || !isUnhandled(reaction.promise))return false;
  } return true;
};
var onHandleUnhandled = function(promise){
  task.call(global$4, function(){
    var handler;
    if(isNode){
      process$1.emit('rejectionHandled', promise);
    } else if(handler = global$4.onrejectionhandled){
      handler({promise: promise, reason: promise._v});
    }
  });
};
var $reject = function(value){
  var promise = this;
  if(promise._d)return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if(!promise._a)promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function(value){
  var promise = this
    , then;
  if(promise._d)return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if(promise === value)throw TypeError$1("Promise can't be resolved itself");
    if(then = isThenable(value)){
      microtask(function(){
        var wrapper = {_w: promise, _d: false}; // wrap
        try {
          then.call(value, ctx$1($resolve, wrapper, 1), ctx$1($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch(e){
    $reject.call({_w: promise, _d: false}, e); // wrap
  }
};

// constructor polyfill
if(!USE_NATIVE){
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor){
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction$1(executor);
    Internal.call(this);
    try {
      executor(ctx$1($resolve, this, 1), ctx$1($reject, this, 1));
    } catch(err){
      $reject.call(this, err);
    }
  };
  Internal = function Promise(executor){
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = _redefineAll($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var reaction    = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok     = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail   = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process$1.domain : undefined;
      this._c.push(reaction);
      if(this._a)this._a.push(reaction);
      if(this._s)notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
  PromiseCapability = function(){
    var promise  = new Internal;
    this.promise = promise;
    this.resolve = ctx$1($resolve, promise, 1);
    this.reject  = ctx$1($reject, promise, 1);
  };
}

$export$3($export$3.G + $export$3.W + $export$3.F * !USE_NATIVE, {Promise: $Promise});
_setToStringTag($Promise, PROMISE);
_setSpecies(PROMISE);
Wrapper = _core[PROMISE];

// statics
$export$3($export$3.S + $export$3.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    var capability = newPromiseCapability(this)
      , $$reject   = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export$3($export$3.S + $export$3.F * (LIBRARY$1 || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
    if(x instanceof $Promise && sameConstructor(x.constructor, this))return x;
    var capability = newPromiseCapability(this)
      , $$resolve  = capability.resolve;
    $$resolve(x);
    return capability.promise;
  }
});
$export$3($export$3.S + $export$3.F * !(USE_NATIVE && _iterDetect(function(iter){
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C          = this
      , capability = newPromiseCapability(C)
      , resolve    = capability.resolve
      , reject     = capability.reject;
    var abrupt = perform(function(){
      var values    = []
        , index     = 0
        , remaining = 1;
      forOf(iterable, false, function(promise){
        var $index        = index++
          , alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function(value){
          if(alreadyCalled)return;
          alreadyCalled  = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C          = this
      , capability = newPromiseCapability(C)
      , reject     = capability.reject;
    var abrupt = perform(function(){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  }
});

var promise$1 = _core.Promise;

var promise = createCommonjsModule(function (module) {
module.exports = { "default": promise$1, __esModule: true };
});

var _Promise = unwrapExports(promise);

// most Object methods by ES6 should accept primitives
var $export$4 = _export;
var core$2    = _core;
var fails   = _fails;
var _objectSap = function(KEY, exec){
  var fn  = (core$2.Object || {})[KEY] || Object[KEY]
    , exp = {};
  exp[KEY] = exec(fn);
  $export$4($export$4.S + $export$4.F * fails(function(){ fn(1); }), 'Object', exp);
};

// 19.1.2.14 Object.keys(O)
var toObject$1 = _toObject;
var $keys$1    = _objectKeys;

_objectSap('keys', function(){
  return function keys(it){
    return $keys$1(toObject$1(it));
  };
});

var keys$2 = _core.Object.keys;

var keys$1 = createCommonjsModule(function (module) {
module.exports = { "default": keys$2, __esModule: true };
});

var _Object$keys = unwrapExports(keys$1);

var rp_1$1 = createCommonjsModule(function (module, exports) {
    "use strict";

    var https$$1 = https;
    var uri = function uri(options) {
        var url = options.uri,
            qs = _Object$keys(options.qs).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(options.qs[key].toString());
        }).join("&");
        return url + '?' + qs;
    };
    var rp = function rp(options) {
        return new _Promise(function (resolve, reject) {
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
    return new (P || (P = _Promise))(function (resolve, reject) {
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
        _classCallCheck(this, Person);

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


    _createClass(Person, null, [{
        key: 'create',
        value: function create(name, date, location) {
            return __awaiter(this, void 0, void 0, index.mark(function _callee() {
                var dt, loc;
                return index.wrap(function _callee$(_context) {
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
            return __awaiter(this, void 0, void 0, index.mark(function _callee2() {
                return index.wrap(function _callee2$(_context2) {
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
            return __awaiter(this, void 0, void 0, index.mark(function _callee3() {
                return index.wrap(function _callee3$(_context3) {
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
        _classCallCheck(this, Aspect);

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


    _createClass(Aspect, [{
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

var chart = createCommonjsModule(function (module, exports) {
    "use strict";

    var __awaiter = commonjsGlobal && commonjsGlobal.__awaiter || function (thisArg, _arguments, P, generator) {
        return new (P || (P = _Promise))(function (resolve, reject) {
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
    var rp_1 = rp_1$1;
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

            _classCallCheck(this, Chart);

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


        _createClass(Chart, [{
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
             * Gets chart data from the online ephemeris
             * @param {string} date A UTC datetime string in ISO 8601 format
             * @param {Point}  p    An object with numeric lat and lng properties
             * @return {Promise<ChartData>}  A JSON object with the data needed to implement a chart
             */

        }, {
            key: 'refreshTransits',

            /**
             * Refresh or set the transits to a new time
             * @param {string} date (Optional) Target datetime for transits in ISO 8601 format; defaults to now()
             */
            value: function refreshTransits() {
                var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                return __awaiter(this, void 0, void 0, index.mark(function _callee() {
                    var cdata;
                    return index.wrap(function _callee$(_context) {
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
                                    return Chart.getChartData(date, this.p1.location);

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
        }], [{
            key: 'getChartData',
            value: function getChartData(date, p) {
                return __awaiter(this, void 0, void 0, index.mark(function _callee2() {
                    return index.wrap(function _callee2$(_context2) {
                        while (1) {
                            switch (_context2.prev = _context2.next) {
                                case 0:
                                    _context2.next = 2;
                                    return rp_1.default({
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

        return Chart;
    }();

    exports.Chart = Chart;
});

var __awaiter$1 = commonjsGlobal && commonjsGlobal.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = _Promise))(function (resolve, reject) {
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
/**
 * Usage: let chart: Chart = ChartFactory.create("my chart", person);
 */

var ChartFactory$1 = function () {
    function ChartFactory() {
        _classCallCheck(this, ChartFactory);
    }

    _createClass(ChartFactory, null, [{
        key: 'create',
        value: function create(name, p1) {
            var p2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var type = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : chart_1$1.ChartType.Basic;

            return __awaiter$1(this, void 0, void 0, index.mark(function _callee() {
                var cdata, date, p;
                return index.wrap(function _callee$(_context) {
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
                                return _Promise.all([chart_1$1.Chart.getChartData(p1.date, p1.location), chart_1$1.Chart.getChartData(new Date().toISOString(), p1.location)]);

                            case 15:
                                cdata = _context.sent;
                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata, null, type));

                            case 17:
                                _context.next = 19;
                                return _Promise.all([chart_1$1.Chart.getChartData(p1.date, p1.location), chart_1$1.Chart.getChartData(p2.date, p2.location)]);

                            case 19:
                                cdata = _context.sent;
                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata, null, type));

                            case 21:
                                _context.next = 23;
                                return _Promise.all([chart_1$1.Chart.getChartData(p1.date, p1.location), chart_1$1.Chart.getChartData(p2.date, p2.location), chart_1$1.Chart.getChartData(new Date().toISOString(), p1.location)]);

                            case 23:
                                cdata = _context.sent;
                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata, null, type));

                            case 25:
                                date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                                p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                                _context.t2 = cdata;
                                _context.next = 30;
                                return chart_1$1.Chart.getChartData(date, p);

                            case 30:
                                _context.t3 = _context.sent;

                                _context.t2.push.call(_context.t2, _context.t3);

                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata));

                            case 33:
                                date = ChartFactory.getDatetimeMidpoint(p1.date, p2.date);
                                p = ChartFactory.getGeoMidpoint(p1.location, p2.location);
                                _context.next = 37;
                                return _Promise.all([chart_1$1.Chart.getChartData(date, p), chart_1$1.Chart.getChartData(new Date().toISOString(), p)]);

                            case 37:
                                cdata = _context.sent;
                                return _context.abrupt('return', new chart_1$1.Chart(name, p1, cdata, null, type));

                            case 39:
                                _context.t4 = cdata;
                                _context.next = 42;
                                return chart_1$1.Chart.getChartData(p1.date, p1.location);

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
