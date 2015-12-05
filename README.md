前端可视化组件
===

demo演示方法：

   ```
   edp webserver start
   ```

访问地址：http://127.0.0.1:8848/demo/index.html

## FlowView.js 工作流组件

使用方法：

```javascript
    var FlowView = require('visualization/widget/FlowView');
    var view = new FlowView({
        main: '#flow-view',
        datasource: data,
        offsetY: 40
    });
    view.on('click', function (e) {
        var node = view.getNode(e.node);
        console.log(node);
    });
    view.render();
```


## TreeView.js 树组件

使用方法：

```javascript
    var TreeView = require('visualization/widget/TreeView');
    var view = new TreeView({
        main: '#tree-view',
        datasource: data,
        expandLevel: 2,
        renderNode: function (node) {
            return '<h4 ' + (!node.conceptCount ? 'class="only-property"' : '') + '>' + node.name + '</h4>'
                + (node.conceptCount ? '<a href="#id=' + node.id + '">'
                +   '概念(' + node.conceptCount + ')</a>' : '')
                + (node.children && node.children.length
                    ? '<i class="arrow' + (false !== node.expand ? ' arrow-expand' : '') + '"></i>'
                    : '');
        },
        renderNodeAttributes: function (node) {
            return 'data-type="' + (+node.type === 2 ? 'property' : 'category') + '" '
                + 'data-id="' + node.id + '" ';
        }
    });
    view.on('click', function (e) {
        console.log(e);
    });
    view.render();
```
