define('app/views/demos/drag-rotate',['magix'],function(require){
/*Magix */
/*
    author:xinglie.lkf@taobao.com
 */
var Magix = require('magix');
Magix.applyStyle('mp-324',".mp-324-item{width:200px;height:200px;background:#666;margin:40px}");
var ToDegree = function(angle) {
    var degree = angle * 180 / Math.PI;
    degree = Math.round(degree * 100) / 100;
    return degree;
};
return Magix.View.extend({
    tmpl: "<div class=\"mp-324-item\" mx-mousedown=\"startDrag()\">ROTEAE</div>",
    render: function() {
        var me = this;
        me.data.digest();
    },
    'startDrag<mousedown>': function(e) {
        var me = this;
        var cx = 329,
            cy = 187;
        var node = e.current;
        var start = Math.atan2(e.pageY - cy, e.pageX - cx);
        console.log(start, ToDegree(start));
        start = ToDegree(start);
        me.beginDrag(node, function(e) {
            var ox = e.pageX - cx,
                oy = e.pageY - cy;
            var angle = Math.atan2(oy, ox);
            var degree = ToDegree(angle) - start;
             //var angle1 = Math.atan(ox / oy) / (2 * Math.PI) * 360;
            node.style.transform = 'rotate(' + degree + 'deg)';

             //console.log(angle, degree, angle1);
        });
    }
});
});