const React from  "@react";
const noop = function(){}
class Navigtor extends React.Component{
    static defaultProps = {
        target: "self",
        url: "",
        "open-type": "navigate",
       "hover-class": "navigator-hover"
    }
    goPage(){
      var method = this.props['open-type'];
      var hook = methodMap[method] || "navigateTo";
      React.api[hook]({
          uri: this.props.url,
          success:   this.props.bindsuccess || noop,
          fail:this.props.bindfail || noop,
          complete: this.props.bindcomplete || noop
      })
    }
    render(){
        return <div onTap={this.goPage.bind(this)}>{this.props.children}</div>
    }

}
const methodMap = {
    navigate: "navigateTo",
    redirect: "redirectTo",
    switchTab: "switchTab",
    reLaunch: "reLaunch",
    "navigateBack": "navigateBack"
}
/*
target	String	self	在哪个目标上发生跳转，默认当前小程序，可选值self/miniProgram	2.0.7
url	String		当前小程序内的跳转链接	
open-type	String	navigate	跳转方式	
delta	Number		当 open-type 为 'navigateBack' 时有效，表示回退的层数	
app-id	String		当target="miniProgram"时有效，要打开的小程序 appId	2.0.7
path	String		当target="miniProgram"时有效，打开的页面路径，如果为空则打开首页	2.0.7
extra-data	Object		当target="miniProgram"时有效，需要传递给目标小程序的数据，目标小程序可在 App.onLaunch()，App.onShow() 中获取到这份数据。详情	2.0.7
version	version	release	当target="miniProgram"时有效，要打开的小程序版本，有效值 develop（开发版），trial（体验版），release（正式版），仅在当前小程序为开发版或体验版时此参数有效；如果当前小程序是正式版，则打开的小程序必定是正式版。	2.0.7
hover-class	String	navigator-hover	指定点击时的样式类，当hover-class="none"时，没有点击态效果	
hover-stop-propagation	Boolean	false	指定是否阻止本节点的祖先节点出现点击态	1.5.0
hover-start-time	Number	50	按住后多久出现点击态，单位毫秒	
hover-stay-time	Number	600	手指松开后点击态保留时间，单位毫秒	
bindsuccess	String		当target="miniProgram"时有效，跳转小程序成功	2.0.7
bindfail	String		当target="miniProgram"时有效，跳转小程序失败	2.0.7
bindcomplete	String	当target="miniProgram"时有效，跳转小程序完成
*/