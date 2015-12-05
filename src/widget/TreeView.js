/**
 * @file 树形布局组件
 * @author mengke01(kekee000@gmail.com)
 */


define(
    function (require) {

        var MouseCapture = require('./MouseCapture');
        var observable = require('./observable');
        var guid = 0;


        /**
         * 计算树节点布局
         * @param  {Object} treeData 数据
         * @param  {Object} options  布局参数
         */
        function layoutTree(treeData, options) {
            var nodeWidth = options.nodeWidth;
            var nodeHeight = options.nodeHeight;
            var spanX = options.spanX;
            var spanY = options.spanY;

            function layoutNode(node, offsetX, offsetY) {
                var layout = node.layout = node.layout || {
                    id: 'tree-view' + (guid++)
                };

                layout.x  = offsetX;

                var newOffsetY = offsetY;

                if (node.children && false !== node.expand) {

                    for (var i = 0, item; item = node.children[i]; i++) {
                        newOffsetY = layoutNode(item, layout.x + nodeWidth + spanX, newOffsetY);
                    }

                    layout.y = node.children[0].layout.y;

                    return newOffsetY + 2 * spanY;
                }

                layout.y = offsetY;
                return layout.y + nodeHeight + spanY;
            }

            layoutNode(treeData, 0, 0);
        }

        /**
         * 渲染树节点
         *
         * @param  {Object} treeData 数据
         * @param  {Object} options  布局参数
         * @return {string}          html片段
         */
        function renderTree(treeData, options) {
            var htmlBuilder = '<tree>';

            function renderNode(node) {
                htmlBuilder += '<treenode '
                    + options.renderNodeAttributes(node)
                    + (node.selected ? 'class="cur" ' : '')
                    + 'id="' + node.layout.id + '" '
                    + 'style="left:' + node.layout.x + 'px;top:' + node.layout.y + 'px">'
                    +   options.renderNode(node)
                    + '</treenode>';

                if (node.children && false !== node.expand) {
                    for (var i = 0, item; item = node.children[i]; i++) {
                        renderNode(item);
                    }
                }
            }

            renderNode(treeData);
            htmlBuilder += '</tree>';
            return htmlBuilder;
        }

        /**
         * 渲染树连接线
         *
         * @param  {Object} treeData 数据
         * @param  {Object} options  布局参数
         * @return {string}          html片段
         */
        function renderArrow(treeData, options) {

            var nodeWidth = options.nodeWidth;
            var nodeHeight2 = options.nodeHeight / 2;
            var arrowBuilder = '';
            var lineBuilder = '';

            var maxWidth = 0;
            var maxHeight = 0;

            function walk(node) {
                maxWidth = Math.max(maxWidth, node.layout.x);
                maxHeight = Math.max(maxHeight, node.layout.y);


                // 非根节点后面都会有箭头
                if (node !== treeData) {
                    arrowBuilder += [
                        'M', node.layout.x - 12, ' ', node.layout.y + nodeHeight2 - 4,
                        'l 10 4 l -10 4 z'
                    ].join('');
                }

                if (node.children && false !== node.expand) {
                    var startX = node.layout.x + nodeWidth + 7;
                    for (var i = 0, item; item = node.children[i]; i++) {
                        lineBuilder += [
                            'M', startX, ' ', item.layout.y + nodeHeight2,
                            'L', item.layout.x - 4, ' ', item.layout.y + nodeHeight2
                        ].join('');

                        walk(item);
                    }

                    if (node.children.length > 1) {
                        // 竖线
                        lineBuilder += [
                            'M', startX, ' ', node.layout.y + nodeHeight2,
                            'L', startX, ' ', node.children[node.children.length - 1].layout.y + nodeHeight2 + 1
                        ].join('');
                    }
                }
            }

            walk(treeData);

            return '<svg  '
                + 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
                + ' version="1.1" width="'
                +   (maxWidth + options.nodeWidth) + '" height="'
                +   (maxHeight + options.nodeHeight) + '"><g class="svg-view">'
                + '<path class="line-view" d="' + lineBuilder + '"></path>'
                + '<path class="arrow-view" d="' + arrowBuilder + '"></path>'
                + '</g></svg>';
        }


        /**
         * 根据条件查找指定的node
         *
         * @param  {Object} treeData 树节点
         * @param  {Function} handler  处理函数
         * @return {Object|null} 返回符合条件的节点
         */
        function walkTree(treeData, handler) {
            var result = [];

            function walk(node, parent, level) {
                var ret = handler(node, parent, level);
                if (false === ret) {
                    return;
                }

                if (true === ret) {
                    result.push(node);
                }

                if (node.children) {
                    for (var i = 0, item; item = node.children[i]; i++) {
                        walk(item, node, level + 1);
                    }
                }
            }

            walk(treeData, null, 0);
            return result;
        }


        /**
         * 获取布局代码
         *
         * @param  {Object} treeData 树数据
         * @param  {Object} options  参数选项
         * @return {string}          html片段
         */
        function render(treeData, options) {
            layoutTree(treeData, options);
            return renderTree(treeData, options) + renderArrow(treeData, options);
        }


        /**
         * 绑定事件
         */
        function bindEvent() {
            var me = this;
            me.camera = {};

            this.capture.on('dragstart', function (e) {
                me.camera.x = me.main.get(0).scrollLeft;
                me.camera.y = me.main.get(0).scrollTop;
            });

            this.capture.on('drag', function (e) {
                me.main.get(0).scrollLeft = me.camera.x - e.deltaX;
                me.main.get(0).scrollTop = me.camera.y - e.deltaY;
            });

            this.main.on('click', 'treenode', function (e) {
                // 防止链接点击之后又执行动作
                if (e.target.href) {
                    return;
                }
                var event = {
                    node: this.getAttribute('data-id')
                };
                me.fire('click', event);
                if (false !== event.returnValue) {
                    me.toggleNode(event.node);
                }
            });

            // 展开/收起
            this.main.on('dblclick', function (e) {
                if (me.datasource) {
                    var isExpandAll = true;
                    walkTree(me.datasource, function (node) {
                        if (node.children && !node.expand) {
                            isExpandAll = false;
                            return false;
                        }
                    });

                    if (isExpandAll) {
                        me.expandNode(me.expandLevel);
                    }
                    else {
                        me.expandAll();
                    }
                    me.render();
                }
            });
        }


        /**
         * 树形控件
         *
         * @param {Object} options 参数选项
         * @param {HTMLElement} options.main    主元素
         * @param {Object} options.datasource 树结构,数据源
         * datasource = {
         *     id: 'id',
         *     name: 'name',
         *     children: [
         *         {
         *             id: 'id',
         *             name: 'name',
         *             children: [ ... ]
         *         }
         *     ]
         * }
         * @param {number} options.nodeWidth 节点宽度
         * @param {number} options.nodeHeight 节点高度
         * @param {number} options.spanX 节点x间距
         * @param {number} options.spanY 节点y间距
         * @param {number} options.expandLevel 打开节点的层级
         */
        function TreeView(options) {
            options = options || {};
            options.nodeWidth = options.nodeWidth || 120;
            options.nodeHeight = options.nodeHeight || 60;
            options.spanX = options.spanX || 60;
            options.spanY = options.spanY || 10;
            $.extend(this, options);
            this.main = $(this.main);

            this.capture = new MouseCapture(this.main.get(0), {
                events: {
                    mousewheel: false
                }
            });
            bindEvent.call(this);

            if (this.expandLevel) {
                this.expandNode(this.expandLevel);
            }
        }

        /**
         * 渲染单个树节点
         * @param  {Object} node 节点数据
         * @return {string}      html片段
         */
        TreeView.prototype.renderNode = function (node) {
            return '<h4>' + node.name + '</h4>';
        };

        /**
         * 获取单个树节点属性
         * @param  {Object} node 节点数据
         * @return {string}      html片段
         */
        TreeView.prototype.renderNodeAttributes = function (node) {
            return 'data-type="' + (node.children ? 'branch' : 'leaf') + '" '
                + 'data-id="' + node.id + '" ';
        };

        /**
         * 渲染组件
         */
        TreeView.prototype.render = function () {
            var html = '';
            if (this.datasource) {
                html = render(this.datasource, this);
            }
            this.main.html(html);
        };

        /**
         * 展开/关闭节点
         *
         * @param  {string} id 节点编号
         * @return {this}
         */
        TreeView.prototype.toggleNode = function (id) {
            var node = this.getNode(id);

            // 叶子节点不需要重新渲染
            if (!node.children || !node.children.length) {
                return;
            }

            if (false !== node.expand) {
                node.expand = false;
            }
            else {
                node.expand = true;
            }

            this.render();
            return this;
        };


        /**
         * 展开指定层级， 从0级开始
         *
         * @param  {number} level 层级
         * @return {this}
         */
        TreeView.prototype.expandNode = function (level) {
            if (this.datasource) {
                walkTree(this.datasource, function (node, parent, l) {
                    if (node.children) {
                        node.expand = l <= level;
                    }
                });
            }
            return this;
        };


        /**
         * 添加节点
         * @param  {string} parentId 节点编号
         * @param  {Object} node 新节点
         * @return {this}
         */
        TreeView.prototype.addNode = function (parentId, node) {
            if (!this.datasource) {
                return this;
            }

            var parent = this.getNode(parentId);
            if (parent) {
                var children = parent.children || [];
                children.push(node);
                parent.children = children;
                parent.expand = true;
            }

            return this;
        };

        /**
         * 根据id删除节点
         * @param  {string} id 节点编号
         * @return {this}
         */
        TreeView.prototype.removeNode = function (id) {
            if (!this.datasource) {
                return this;
            }

            var node = null;
            var parent = null;
            walkTree(this.datasource, function (curNode, curParent) {
                if (curNode.id === id) {
                    node = curNode;
                    parent = curParent;
                    return false;
                }
            });

            if (node) {
                // 根节点
                if (!parent) {
                    this.datasource = 0;
                }
                else {
                    parent.children.splice(parent.children.indexOf(node), 1);
                    if (!parent.children[0]) {
                        delete parent.children;
                    }
                }
            }
            return this;
        };

        /**
         * 根据id获取节点
         * @param  {string|object} id 节点编号
         * @return {Object|null}    节点对象
         */
        TreeView.prototype.getNode = function (id) {
            if (!this.datasource) {
                return null;
            }

            if (typeof id === 'object') {
                return id;
            }

            var result = walkTree(this.datasource, function (node) {
                if (node.id === id) {
                    return true;
                }
            });

            return result[0];
        };

        /**
         * 展开全部
         * @return {this}
         */
        TreeView.prototype.expandAll = function () {
            this.expandNode(100);
            return this;
        };


        /**
         * 收起全部
         * @return {this}
         */
        TreeView.prototype.shrinkAll = function () {
            this.expandNode(-1);
            return this;
        };

        /**
         * 注销
         */
        TreeView.prototype.dispose = function () {
            this.capture.dispose();
            this.un();
            this.main.off('click').off('dblclick');
            this.main.html('');
            this.datasource = null;
        };

        TreeView.walkTree = walkTree;

        observable.mixin(TreeView.prototype);
        return TreeView;
    }
);
