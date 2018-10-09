/**
 * 显示菜单
 */
export function showMenu() {
    const prompt = require("@system.prompt");
    const router = require("@system.router");
    const appInfo = require("@system.app").getInfo();
    prompt.showContextMenu({
        itemList: ["保存桌面", "关于", "取消"],
        success: function(ret) {
            switch (ret.index) {
                case 0:
                    // 保存桌面
                    createShortcut();
                    break;
                case 1:
                    // 关于
                    router.push({
                        uri: "/About",
                        params: {
                            name: appInfo.name,
                            icon: appInfo.icon
                        }
                    });
                    break;
                case 2:
                    // 取消
                    break;
                default:
                    prompt.showToast({
                        message: "error"
                    });
            }
        }
    });
}
export var shareObject = {};
export function toApp(config){
   shareObject.app = config
   console.log("进入toApp")
   return config;
}
export function getApp(){
    return shareObject.app;
}
/**
 * 创建桌面图标
 * 注意：使用加载器测试`创建桌面快捷方式`功能时，请先在`系统设置`中打开`应用加载器`的`桌面快捷方式`权限
 */
export function createShortcut() {
    const prompt = require("@system.prompt");
    const shortcut = require("@system.shortcut");
    shortcut.hasInstalled({
        success: function(ret) {
            if (ret) {
                prompt.showToast({
                    message: "已创建桌面图标"
                });
            } else {
                shortcut.install({
                    success: function() {
                        prompt.showToast({
                            message: "成功创建桌面图标"
                        });
                    },
                    fail: function(errmsg, errcode) {
                        prompt.showToast({
                            message: `${errcode}: ${errmsg}`
                        });
                    }
                });
            }
        }
    });
}

export function toPage(PageClass, path) {
    var proto = PageClass.prototype;
    var instance = new PageClass({}, {});
    var config = {
        private: {
            props: Object,
            context: Object,
            state: Object
        },
        onInit() {
            this.props = instance.props;
            this.state = instance.state;
            this.context = instance.context;
            var cc = proto.config || PageClass.config;
            shareObject.pageConfig = cc;
            shareObject.pagePath = path;
            shareObject.page = this;
            console.log("Page onInit");
        },
        onShow() {
            var cc = proto.config || PageClass.config;
            shareObject.pageConfig = cc;
            shareObject.pagePath = path;
            shareObject.page = this;
        },
        onReady() {
            console.log("Page onReady");
        }
    };
    for(var i in instance){
        if(typeof instance[i] == "function" && !config[i]){
            config[i] = instance[i].bind(instance)
        }
    }
    console.log(config)
    return config;
}

/** 
  小程序系列配置tabBar,只需要在config中配置
  
  "tabBar": {
    "list": [{
      "pagePath": "pages/index/index",
      "text": "首页"
    }, {
      "pagePath": "pages/logs/logs",
      "text": "日志"
    }]
  },
  https://developers.weixin.qq.com/miniprogram/dev/framework/config.html#%E5%85%A8%E5%B1%80%E9%85%8D%E7%BD%AE
  
  页面组件在快应用的模拟
  
  1. onShow onHide （大家都有）
  2. 切换卡的支持，
     快应用需要外包tabs组件 <tabs onchange="onChangeTabIndex"> 这样唤起onTabItemTap
     navigationBarBackgroundColor
     navigationBarTextStyle
     navigationBarTitleText
  3. 滚动下拉刷新相关的事件唤起  
      onPullDownRefresh onReachBottom onPageScroll
      enablePullDownRefresh disableScroll
      tab-content 里面包含list组件与refresh组件
      list.scroll--> onPageScroll  
      list.scrollbottom --> onReachBottom
      refresh.refresh --> onPullDownRefresh
    
  转发按钮事件的唤起  onShareAppMessage
     如果用户定义了onShareAppMessage，那么我们就添加onMenuPress，这样右上角就会出现分享按钮
     或在编译期扫描　<button open-type="share"/>对其onTap事件加上onShareAppMessage钩子
     详见 https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page.html#%E9%A1%B5%E9%9D%A2%E4%BA%8B%E4%BB%B6%E5%A4%84%E7%90%86%E5%87%BD%E6%95%B0
     与 https://doc.quickapp.cn/features/system/share.html
*/
