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
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

var $app_template$ = __webpack_require__(8)
var $app_style$ = __webpack_require__(9)
var $app_script$ = __webpack_require__(10)

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
/* 8 */
/***/ (function(module, exports) {

module.exports = {
  "type": "div",
  "attr": {},
  "classList": [
    "demo-page"
  ],
  "children": [
    {
      "type": "text",
      "attr": {
        "value": function () {return '欢迎打开' + (this.title)}
      },
      "classList": [
        "title"
      ]
    },
    {
      "type": "text",
      "attr": {
        "value": function () {return this.aaa}
      }
    },
    {
      "type": "div",
      "attr": {},
      "classList": [
        "tutorial-page"
      ],
      "children": [
        {
          "type": "div",
          "attr": {},
          "classList": [
            "div-tabs"
          ],
          "children": [
            {
              "type": "div",
              "attr": {},
              "classList": [
                "div-tabbar"
              ],
              "children": [
                {
                  "type": "text",
                  "attr": {
                    "value": "menu1"
                  },
                  "events": {
                    "click": function (evt) {this.switchTab(1,evt)}
                  }
                },
                {
                  "type": "text",
                  "attr": {
                    "value": "menu2"
                  },
                  "events": {
                    "click": function (evt) {this.switchTab(2,evt)}
                  }
                },
                {
                  "type": "text",
                  "attr": {
                    "value": "menu3"
                  },
                  "events": {
                    "click": function (evt) {this.switchTab(3,evt)}
                  }
                }
              ]
            },
            {
              "type": "div",
              "attr": {},
              "classList": [
                "div-tabcontent"
              ],
              "children": [
                {
                  "type": "div",
                  "attr": {
                    "show": function () {return this.pageIndex===1}
                  },
                  "classList": [
                    "div-tabcontent-section"
                  ],
                  "children": [
                    {
                      "type": "text",
                      "attr": {
                        "value": "content1"
                      }
                    },
                    {
                      "type": "input",
                      "attr": {
                        "type": "button",
                        "value": "跳转到详情页"
                      },
                      "classList": [
                        "btn"
                      ],
                      "events": {
                        "click": function (evt) {this.goPage(1,evt)}
                      }
                    }
                  ]
                },
                {
                  "type": "div",
                  "attr": {
                    "show": function () {return this.pageIndex===2}
                  },
                  "classList": [
                    "div-tabcontent-section"
                  ],
                  "children": [
                    {
                      "type": "text",
                      "attr": {
                        "value": "content2"
                      }
                    },
                    {
                      "type": "input",
                      "attr": {
                        "type": "button",
                        "value": "跳转到详情页"
                      },
                      "classList": [
                        "btn"
                      ],
                      "events": {
                        "click": function (evt) {this.goPage(2,evt)}
                      }
                    }
                  ]
                },
                {
                  "type": "div",
                  "attr": {
                    "show": function () {return this.pageIndex===3}
                  },
                  "classList": [
                    "div-tabcontent-section"
                  ],
                  "children": [
                    {
                      "type": "text",
                      "attr": {
                        "value": "content3"
                      }
                    },
                    {
                      "type": "input",
                      "attr": {
                        "type": "button",
                        "value": "跳转到详情页"
                      },
                      "classList": [
                        "btn"
                      ],
                      "events": {
                        "click": function (evt) {this.goPage(3,evt)}
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

/***/ }),
/* 9 */
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
  },
  ".btn": {
    "width": "550px",
    "height": "86px",
    "marginTop": "75px",
    "borderRadius": "43px",
    "backgroundColor": "#09ba07",
    "fontSize": "30px",
    "color": "#ffffff"
  },
  ".tutorial-page": {
    "flex": 1,
    "flexDirection": "column"
  },
  ".tutorial-page .div-tabs": {
    "flex": 1,
    "flexDirection": "column",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "tutorial-page"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "div-tabs"
        }
      ]
    }
  },
  ".tutorial-page .div-tabs .div-tabbar": {
    "height": "100px",
    "_meta": {
      "ruleDef": [
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "tutorial-page"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "div-tabs"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "div-tabbar"
        }
      ]
    }
  },
  ".tutorial-page .div-tabs .div-tabbar text": {
    "marginTop": "10px",
    "marginRight": "10px",
    "marginBottom": "10px",
    "marginLeft": "10px",
    "flexGrow": 1,
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
          "v": "tutorial-page"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "div-tabs"
        },
        {
          "t": "d"
        },
        {
          "t": "a",
          "n": "class",
          "i": false,
          "a": "element",
          "v": "div-tabbar"
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

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = function(module, exports, $app_require$){'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _system = $app_require$('@app-module/system.router');

var _system2 = _interopRequireDefault(_system);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  private: {
    title: '示例页面',
    pageIndex: 1,
    aaa: "其他内容"
  },
  goPage: function goPage(a) {
    _system2.default.push({
      uri: '/pages/page' + a
    });
  },
  switchTab: function switchTab(a) {
    this.pageIndex = a;
    _system2.default.push({
      uri: '/pages/page' + a
    });
  }
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

/***/ })
/******/ ]);
  };
  if (typeof window === "undefined") {
    return createPageHandler();
  }
  else {
    window.createPageHandler = createPageHandler
  }
})();
//# sourceMappingURL=index.js.map