前端可视化组件
===

demo演示方法：

   ```
   edp webserver start
   ```

访问地址：http://127.0.0.1:8848/demo/index.html

## FlowView.js 工作流组件

使用方法：

![](https://camo.githubusercontent.com/20782605fac87228abe2bb2692a0f7b63ca5a213/687474703a2f2f6d6b77697365722e73696e616170702e636f6d2f65787465726e616c2f666c6f772e706e67)

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

![](https://camo.githubusercontent.com/71522a742666f0e4dc4fb91c77fb8ea3c15dcf42/687474703a2f2f6d6b77697365722e73696e616170702e636f6d2f65787465726e616c2f74726565766965772e706e67)

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
