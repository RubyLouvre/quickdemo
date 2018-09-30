(function(){
  
  var createPageHandler = function() {
    return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 18);
/******/ })
/************************************************************************/
/******/ ({

/***/ 18:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(19)
var $app_template$ = __webpack_require__(22)
var $app_style$ = __webpack_require__(23)
var $app_script$ = __webpack_require__(24)

$app_define$('@app-component/index', [], function($app_require$, $app_exports$, $app_module$){
     $app_script$($app_module$, $app_exports$, $app_require$)
     if ($app_exports$.__esModule && $app_exports$.default) {
            $app_module$.exports = $app_exports$.default
        }
     $app_module$.exports.template = $app_template$
     $app_module$.exports.style = $app_style$
})

$app_bootstrap$('@app-component/index',{ packagerVersion: '0.0.5'})


/***/ }),

/***/ 19:
/***/ (function(module, exports, __webpack_require__) {

var $app_template$ = __webpack_require__(20)
var $app_style$ = __webpack_require__(32)
var $app_script$ = __webpack_require__(21)

$app_define$('@app-component/pagewrapper', [], function($app_require$, $app_exports$, $app_module$){
     $app_script$($app_module$, $app_exports$, $app_require$)
     if ($app_exports$.__esModule && $app_exports$.default) {
            $app_module$.exports = $app_exports$.default
        }
     $app_module$.exports.template = $app_template$
     $app_module$.exports.style = $app_style$
})


/***/ }),

/***/ 20:
/***/ (function(module, exports) {

module.exports = {
  "type": "div",
  "attr": {},
  "classList": [
    "pagewrap"
  ],
  "children": [
    {
      "type": "refresh",
      "attr": {
        "refreshing": function () {return this.refreshing}
      },
      "events": {
        "refresh": "onPullDownRefresh"
      },
      "children": [
        {
          "type": "list",
          "attr": {},
          "events": {
            "scroll": "onPageScroll",
            "scrollbottom": "onReachBottom"
          },
          "children": [
            {
              "type": "list-item",
              "attr": {
                "type": "foo"
              },
              "style": {
                "flexDirection": "column"
              },
              "children": [
                {
                  "type": "slot",
                  "attr": {}
                },
                {
                  "type": "div",
                  "attr": {},
                  "repeat": function () {return this.list},
                  "children": [
                    {
                      "type": "text",
                      "attr": {
                        "value": function () {return this.$item}
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "div",
      "attr": {},
      "shown": function () {return this.tabBar&&this.tabBar.list&&this.tabBar.list.length},
      "style": {
        "height": "100px",
        "backgroundColor": function () {return this.tabBar.backgroundColor}
      },
      "children": [
        {
          "type": "div",
          "attr": {},
          "classList": [
            "tab"
          ],
          "repeat": {
            "exp": function () {return this.tabBar.list},
            "key": "index",
            "value": "item"
          },
          "events": {
            "click": function (evt) {this.onSelected(this.index,evt)}
          },
          "children": [
            {
              "type": "text",
              "attr": {
                "value": function () {return this.item.text}
              },
              "style": {
                "color": function () {return this.selectedIndex===this.index?this.tabBar.selectedColor:this.tabBar.color}
              }
            }
          ]
        }
      ]
    }
  ]
}

/***/ }),

/***/ 21:
/***/ (function(module, exports) {

module.exports = function(module, exports, $app_require$){"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _system = $app_require$("@app-module/system.prompt");

var _system2 = _interopRequireDefault(_system);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  props: {
    list: Array,
    tabBar: Object,
    selectedIndex: Number,
    refreshing: Boolean
  },
  private: {
    refreshing: false,
    tabBar: {
      list: [{ text: "aaa" }, { text: "cccc" }, { text: "dddd" }],
      color: "#000",
      backgroundColor: "#f9faf5",
      selectedColor: "blue"
    },
    list: [111, 222, 333] },
  onReachBottom: function onReachBottom() {
    _system2.default.showToast({ message: 'reach bottom' });
  },
  onPageScroll: function onPageScroll(e) {},
  onInit: function onInit() {
    console.log(this);
    this.tabBar = {
      backgroundColor: "#f9faf5",
      color: "#000",
      selectedColor: "blue",

      list: [{ text: "aaa" }, { text: "cccc" }, { text: "dddd" }]
    };
    this.selectedIndex = 0, this.list = Array.apply(null, { length: 100 }).map(Math.random);
  },
  onSelected: function onSelected(index) {
    this.selectedIndex = index;
  },
  onPullDownRefresh: function onPullDownRefresh() {
    var _this = this;

    this.list = Array.apply(null, { length: 100 }).map(Math.random);
    _system2.default.showToast({ message: 'refreshed' });
    this.refreshing = true;
    setTimeout(function () {

      _this.refreshing = false;
    });
  }
};}

/***/ }),

/***/ 22:
/***/ (function(module, exports) {

module.exports = {
  "type": "div",
  "attr": {},
  "classList": [
    "demo-page"
  ],
  "children": [
    {
      "type": "pagewrapper",
      "attr": {},
      "children": [
        {
          "type": "text",
          "attr": {
            "value": function () {return this.text}
          },
          "classList": [
            "title"
          ]
        }
      ]
    }
  ]
}

/***/ }),

/***/ 23:
/***/ (function(module, exports) {

module.exports = {
  ".demo-page": {
    "flexDirection": "column",
    "justifyContent": "center",
    "alignItems": "center"
  },
  ".title": {
    "fontSize": "40px",
    "textAlign": "center"
  }
}

/***/ }),

/***/ 24:
/***/ (function(module, exports) {

module.exports = function(module, exports, $app_require$){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = {
  private: {
    text: '欢迎打开page2'
  },
  onMenuPress: function onMenuPress() {}
};


var moduleOwn = exports.default || module.exports;
var accessors = ['public', 'protected', 'private'];

if (moduleOwn.data && accessors.some(function (acc) {
  return moduleOwn[acc];
})) {
  throw new Error('页面VM对象中的属性data不可与"' + accessors.join(',') + '"同时存在，请使用private替换data名称');
} else if (!moduleOwn.data) {
  moduleOwn.data = {};
  moduleOwn._descriptor = {};
  accessors.forEach(function (acc) {
    var accType = _typeof(moduleOwn[acc]);
    if (accType === 'object') {
      moduleOwn.data = Object.assign(moduleOwn.data, moduleOwn[acc]);
      for (var name in moduleOwn[acc]) {
        moduleOwn._descriptor[name] = { access: acc };
      }
    } else if (accType === 'function') {
      console.warn('页面VM对象中的属性' + acc + '的值不能是函数，请使用对象');
    }
  });
}}

/***/ }),

/***/ 32:
/***/ (function(module, exports) {

module.exports = {
  ".pagewrap": {
    "flex": 1,
    "flexDirection": "column",
    "width": "100%"
  },
  ".tabBar .tab text": {
    "marginTop": "10px",
    "marginRight": "10px",
    "marginBottom": "10px",
    "marginLeft": "10px",
    "width": "300px",
    "textAlign": "center",
    "borderTopWidth": "1px",
    "borderRightWidth": "1px",
    "borderBottomWidth": "1px",
    "borderLeftWidth": "1px",
    "borderStyle": "solid",
    "borderTopColor": "#eeeeee",
    "borderRightColor": "#eeeeee",
    "borderBottomColor": "#eeeeee",
    "borderLeftColor": "#eeeeee",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "tabBar"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "tab"
        },
        {
          "t": "d"
        },
        {
          "t": "t",
          "n": "text"
        }
      ]
    }
  }
}

/***/ })

/******/ });
  };
  if (typeof window === "undefined") {
    return createPageHandler();
  }
  else {
    window.createPageHandler = createPageHandler
  }
})();
//# sourceMappingURL=index.js.map