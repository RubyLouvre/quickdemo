/**
 * 显示菜单
 */
export function showMenu() {
	const prompt = require('@system.prompt');
	const router = require('@system.router');
	const appInfo = require('@system.app').getInfo();
	prompt.showContextMenu({
		itemList: ['保存桌面', '关于', '取消'],
		success: function(ret) {
			switch (ret.index) {
				case 0:
					// 保存桌面
					createShortcut();
					break;
				case 1:
					// 关于
					router.push({
						uri: '/pages/About',
						params: {
							name: appInfo.name,
							icon: appInfo.icon,
						},
					});
					break;
				case 2:
					// 取消
					break;
				default:
					prompt.showToast({
						message: 'error',
					});
			}
		},
	});
}
export var shareObject = {};
export function getApp() {
	return shareObject.app;
}
/**
 * 创建桌面图标
 * 注意：使用加载器测试`创建桌面快捷方式`功能时，请先在`系统设置`中打开`应用加载器`的`桌面快捷方式`权限
 */
export function createShortcut() {
	const prompt = require('@system.prompt');
	const shortcut = require('@system.shortcut');
	shortcut.hasInstalled({
		success: function(ret) {
			if (ret) {
				prompt.showToast({
					message: '已创建桌面图标',
				});
			} else {
				shortcut.install({
					success: function() {
						prompt.showToast({
							message: '成功创建桌面图标',
						});
					},
					fail: function(errmsg, errcode) {
						prompt.showToast({
							message: `${errcode}: ${errmsg}`,
						});
					},
				});
			}
		},
	});
}

export function toPage(pageClass, pagePath) {
	var instance = new pageClass({}, {});
	var config = {
		private: {
			props: Object,
			context: Object,
			state: Object,
		},
		onInit() {
			this.props = instance.props;
			this.state = instance.state;
			this.context = instance.context;
			transmitData(pageClass, pagePath, instance, this);
		},
		onShow() {
			transmitData(pageClass, pagePath, instance, this);
		},
		onReady() {
			console.log('Page onReady');
		},
	};
	return config;
}
// shareObject的数据不是长久的，在页面跳转时，就会丢失
function transmitData(pageClass, pagePath, reactInstance, quickInstance) {
	var cc = reactInstance.config || pageClass.config;
	shareObject.pageConfig = cc;
	shareObject.pagePath = pagePath;
	shareObject.page = reactInstance; //React实例
	shareObject.app = quickInstance.$app.$def;//app
}
