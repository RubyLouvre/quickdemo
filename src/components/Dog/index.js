// eslint-disable-next-line
import React from '../../ReactQuick.js';
import Animal from '../Animal/index';
function Dog() {
}
Dog = React.toClass(Dog, Animal, {
    componentWillMount: function() {
        // eslint-disable-next-line
        console.log('Dog componentWillMount');
    },
    render: function() {
        var h = React.createElement;

        return h('div', {
            style: React.toStyle({
                color: '#ffff00'
            }, this.props, 'style608')
        }, '名字：', this.state.name, ' 年龄：', this.state.age, ' 岁', h('div', {
            catchClick: this.changeAge.bind(this),
            'data-tap-uid': 'e848',
            'data-class-uid': 'c590'
        }, '换一个年龄'));
    },
    classUid: 'c590'
}, {});
export { React }

export default Dog;