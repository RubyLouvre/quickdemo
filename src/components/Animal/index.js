import React from '../../ReactQuick.js';

function Animal(props) {
    this.state = {
        name: props.name,
        age: props.age || 1
    };
}
// 
Animal = React.toClass(Animal, React.Component, {
    changeAge: function () {
        this.setState({
            age: ~~(Math.random() * 10)
        });
    },
    componentDidMount: function () {
        // eslint-disable-next-line
        console.log('Animal componentDidMount');
    },
    componentWillReceiveProps: function (props) {
        this.setState({
            name: props.name
        });
    },
    render: function () {
        var h = React.createElement;

        return h('div', null,
            h("text", {
                style: React.toStyle({
                    color: '#d7131c'
                }, this.props, 'style1362')
            }, '名字：', this.state.name, ' 年龄：', this.state.age, ' 岁'),
            h('div', {
                catchClick: this.changeAge.bind(this),
                'data-tap-uid': 'e1602',
                'data-class-uid': 'c901'
            }, '换一个年龄')

        );
    },
    classUid: 'c901'
}, {
        defaultProps: {
            age: 1,
            name: 'animal'
        }
    });
    // Animal 是一个函数
export { React }
export default  Animal ;//这是给你们用的组件定义 Animal =｛props, onReady, onInit, ｝