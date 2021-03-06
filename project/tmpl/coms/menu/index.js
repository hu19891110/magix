/*
    author:xinglie.lkf@taobao.com
 */
var Magix = require('magix');
var $ = require('$');
var Vframe = Magix.Vframe;
Magix.applyStyle('@index.css');
var CSSNames = 'names@index.css[over,toleft,toright]';
var Instance;
var Menu = Magix.View.extend({
    tmpl: '@index.html',
    ctor: function() {
        var me = this;
        // me.data.on('changed', function(e) {
        //     if (e.keys.width) {
        //         var cnt = $('#' + me.id + '>div');
        //         cnt.css({
        //             width: this.get('width')
        //         });
        //     }
        // });
        me.on('destroy', function() {
            if (me.data.get('isChild'))
                $('#' + me.id).remove();
        });
    },
    inside: function(node) {
        var me = this;
        var inside = Magix.inside(node, me.id);
        if (!inside) {
            var children = me.owner.children();
            for (var i = children.length - 1; i >= 0; i--) {
                var child = Vframe.get(children[i]);
                if (child) {
                    inside = child.invoke('inside', node);
                    if (inside) break;
                }
            }
        }
        return inside;
    },
    update: function(ops) {
        var me = this;
        var info = ops;
        if (!ops.map) {
            info = me.listToTree(ops.list);
        }
        me.$map = info.map;
        me.$list = info.list;
        if (ops.picked)
            me.$picked = ops.picked;
        if (ops.root)
            me.$root = ops.root;
        me.$pId = ops.pId;
        me.$pNode = ops.pNode;
        me.data.set({
            viewId: me.id,
            isChild: ops.isChild || ops.pNode,
            list: info.list,
            width: ops.width || 200
        }).digest();

        if (!me.$pNode) {
            me.$shown = true;
            var hideWatch = function(e) {
                if (me.$shown) {
                    if (e.type == 'resize' || !me.inside(e.target)) {
                        Magix.toTry(me.hide, [], me);
                    }
                }
            };
            var doc = $(document);
            var win = $(window);
            win.on('resize', hideWatch);
            doc.on('mousedown', hideWatch);
            me.on('destroy', function() {
                win.off('resize', hideWatch);
                doc.off('mousedown', hideWatch);
            });
        }
    },
    render: function() {
        var me = this;
        me.endUpdate();
    },
    show: function(e, refNode) {
        var me = this;
        if (!me.$shown) {
            me.$shown = true;
            var node = $('#' + me.id + ' div');
            var doc = $(document);
            var left = -1,
                top = -1,
                dock = 'right';
            var width = node.outerWidth();
            var height = node.outerHeight(),
                refWidth = 0,
                refHeight = 0;
            if (refNode) {
                var offset = refNode.offset();
                refWidth = refNode.outerWidth();
                refHeight = refNode.outerHeight();
                left = offset.left + refWidth;
                top = offset.top;
            } else {
                left = e.pageX;
                top = e.pageY;
            }
            if ((left + width) > doc.width()) {
                left = left - width - refWidth;
                dock = 'left';
                if (left < 0) left = 0;
            }
            if ((top + height) > doc.height()) {
                top -= height;
                top += refHeight;
                if (top < 0) top = 0;
            }
            if (refNode) {
                if (dock == 'right') {
                    left -= 10;
                } else {
                    left += 10;
                }
            }
            var root = me.$root || me;
            if (Instance != root) Instance = root;
            if (me.$pNode) {
                node.css({
                    left: left,
                    top: top
                }).addClass(CSSNames['to' + dock]);
            } else {
                node.css({
                    left: left,
                    top: top
                });
            }
        }
    },
    hide: function() {
        var me = this;
        var children = me.owner.children();
        for (var i = children.length - 1; i >= 0; i--) {
            var child = Vframe.get(children[i]);
            if (child) child.invoke('hide');
        }
        if (me.$shown && me.$pNode) {
            me.$shown = false;
            var node = $('#' + me.id + ' div');
            node.removeClass(CSSNames.toleft).removeClass(CSSNames.toright);
            node.css({
                left: -100000
            });
            $(me.$pNode).removeClass(CSSNames.over);
        }
    },
    stopHideChild: function(id) {
        clearTimeout(this['timer_' + id]);
    },
    showChild: function(node, id, children) {
        var me = this;
        me['stimer_' + id] = setTimeout(me.wrapAsync(function() {
            var nid = me.id + '_menu_' + id;
            var vf = Magix.Vframe.get(nid);
            if (!vf) {
                $('body').append('<div id="' + nid + '" />');
                vf = me.owner.mountVframe(nid, '@moduleId');
            }
            vf.invoke('update', [{
                pNode: '#' + me.id + '_' + id,
                pId: id,
                map: me.$map,
                list: children,
                root: me.$root || me,
                width: me.data.get('width')
                }], true);
            vf.invoke('show', [null, node], true);
        }), 250);
    },
    hideChild: function(id) {
        var me = this;
        var nid = me.id + '_menu_' + id;
        var vf = Magix.Vframe.get(nid);
        if (vf) {
            me['timer_' + id] = setTimeout(me.wrapAsync(function() {
                vf.invoke('hide');
            }), 50);
        }
    },
    'hover<mouseout,mouseover>': function(e) {
        var me = this;
        var flag = !Magix.inside(e.relatedTarget, e.current);
        if (flag) {
            var node = $(e.current);
            node[e.type == 'mouseout' ? 'removeClass' : 'addClass'](CSSNames.over);
            var id = e.params.id;
            me.hideChild(me.$lastId);
            if (e.type == 'mouseover') {
                var map = me.$map;
                var children = map[id].children;
                if (children) {
                    me.stopHideChild(id);
                    me.showChild(node, id, children);
                    me.$lastId = id;
                }
            } else {
                clearTimeout(me['stimer_' + id]);
            }
        }
    },
    'over<mouseover>': function(e) {
        var me = this;
        var flag = !Magix.inside(e.relatedTarget, e.current);
        if (flag) {
            if (!me.$pNode && Instance != me) {
                if (Instance) Instance.hide();
                //Instance = me;
            }
            if (me.$pNode) {
                $(me.$pNode).addClass(CSSNames.over);
                me.owner.parent().invoke('stopHideChild', [me.$pId]);
            }
        }
    },
    'select<click>': function(e) {
        var me = this;
        var root = me.$root || me;
        if (root.$picked) {
            var info = me.$map[e.params.id];
            Magix.toTry(root.$picked, [info]);
        }
        root.hide();
    },
    'prevent<contextmenu>': function(e) {
        e.preventDefault();
    }
});
module.exports = Menu;