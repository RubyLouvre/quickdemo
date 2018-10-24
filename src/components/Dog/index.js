// eslint-disable-next-line
import React from '../../ReactWX.js';
import Animal from '../Animal/index';

function Dog() {}

Dog = React.toClass(Dog, Animal, {
    componentWillMount: function() {
        // eslint-disable-next-line
        console.log('Dog componentWillMount');
    },
    render: function() {
        var h = React.createElement;

        return h('view', {
            style: React.toStyle({
                border: '1px solid #333'
            }, this.props, 'style608')
        }, '名字：', this.state.name, ' 年龄：', this.state.age, ' 岁', h('button', {
            catchTap: this.changeAge.bind(this),
            'data-tap-uid': 'e848',
            'data-class-uid': 'c590'
        }, '换一个年龄'));
    },
    classUid: 'c590'
}, {});
Component(React.registerComponent(Dog, 'Dog'));

export default Dog;