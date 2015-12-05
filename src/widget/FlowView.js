/**
 * @file 流程图视图
 * @author mengke01(kekee000@gmail.com)
 */


define(
    function (require) {

        var MouseCapture = require('./MouseCapture');
        var observable = require('./observable');
        var dom = require('./dom');


        /**
         * 对节点进行动态布局计算
         *
         * @param  {Array} levelNodes 节点数组
         * @param  {Object} options    布局参数
         */
        function layout(levelNodes, options) {
            var nodeWidth = options.nodeWidth;
            var nodeHeight = options.nodeHeight;
            var offsetX = options.offsetX;
            var offsetY = options.offsetY;
            var spanX = options.spanX;
            var spanY = options.spanY;

            var maxSize = Math.max.apply(null, levelNodes.map(function (nodes) {
                return nodes.length;
            }));

            function layoutLevel(level, xPos) {
                var yPos = offsetY + (maxSize - levelNodes[level].length) / 2 * (nodeHeight + spanY);
                levelNodes[level].forEach(function (node, i) {
                    node.layout = {
                        x: xPos,
                        y: yPos + (nodeHeight + spanY) * i
                    };
                });
                if (level < levelNodes.length - 1) {
                    layoutLevel(level + 1, xPos + nodeWidth + spanX);
                }
            }

            layoutLevel(0, offsetX);
        }

        /**
         * 渲染分层节点
         *
         * @param  {Object} levelNodes 数据
         * @param  {Object} options  布局参数
         * @return {string}          html片段
         */
        function renderLevel(levelNodes, options) {
            var htmlBuilder = '<flow>';
            for (var i = 0, parent; parent = levelNodes[i]; i++) {
                for (var j = 0, node; node = parent[j]; j++) {
                    htmlBuilder += '<flownode '
                        + 'data-id="' + node.id + '" '
                        +  options.renderNodeAttributes(node)
                        + 'style="left:' + node.layout.x + 'px;top:' + node.layout.y + 'px">'
                        +  options.renderNode(node)
                        + '</flownode>';
                }
            }
            htmlBuilder += '</flow>';
            return htmlBuilder;
        }


        /**
         * 获取连接线
         *
         * @param  {Object} options  布局参数
         * @return {string}          html片段
         */
        function getConnectionSegment(options) {
            var nodeWidth = options.nodeWidth;
            var nodeHeight2 = options.nodeHeight / 2;
            var nodeHeight4 = nodeHeight2 / 2;
            var nodeHeight6 = Math.ceil(nodeHeight2 / 3);
            var spanX2 = options.spanX / 2;

            return function (node, toNode) {
                var lineBuilder = '';
                var arrowBuilder = '';
                var type = 'forward';

                if (node.level < toNode.level) {
                    lineBuilder += [
                        'M', node.layout.x + nodeWidth, ' ', node.layout.y + nodeHeight2,
                        'C', (node.layout.x + nodeWidth + toNode.layout.x) / 2, ' ', node.layout.y + nodeHeight2, ' ',
                        (node.layout.x + nodeWidth + toNode.layout.x) / 2, ' ', toNode.layout.y + nodeHeight2, ' ',
                        toNode.layout.x - 10, ' ', toNode.layout.y + nodeHeight2
                    ].join('');

                    arrowBuilder += [
                        'M', toNode.layout.x - 12, ' ', toNode.layout.y + nodeHeight2 - 4,
                        'l 10 4 l -10 4 z'
                    ].join('');
                }
                else if (node.level > toNode.level) {
                    type = 'back';

                    lineBuilder += [
                        'M', node.layout.x, ' ', node.layout.y + nodeHeight2 + nodeHeight4,
                        'C', (node.layout.x + toNode.layout.x + nodeWidth) / 2, ' ',
                        node.layout.y + nodeHeight2 + nodeHeight4, ' ',
                        (node.layout.x + toNode.layout.x + nodeWidth) / 2, ' ',
                        toNode.layout.y + nodeHeight2 + nodeHeight4, ' ',
                        toNode.layout.x + nodeWidth + 10, ' ', toNode.layout.y + nodeHeight2 + nodeHeight4
                    ].join('');

                    arrowBuilder += [
                        'M', toNode.layout.x + nodeWidth + 2, ' ', toNode.layout.y + nodeHeight2 + nodeHeight4,
                        'l 10 -4 l 0 8 z'
                    ].join('');
                }
                else if (node.level === toNode.level) {
                    type = 'same';

                    lineBuilder += [
                        'M', node.layout.x + nodeWidth, ' ', node.layout.y + nodeHeight2 - nodeHeight6,
                        'C', node.layout.x + nodeWidth + spanX2, ' ',
                        node.layout.y + nodeHeight2 - nodeHeight6, ' ',
                        toNode.layout.x + nodeWidth + spanX2, ' ',
                        toNode.layout.y + nodeHeight2 - nodeHeight6, ' ',
                        toNode.layout.x + nodeWidth + 10, ' ', toNode.layout.y + nodeHeight2 - nodeHeight6
                    ].join('');

                    arrowBuilder += [
                        'M', toNode.layout.x + nodeWidth + 2, ' ', toNode.layout.y + nodeHeight2 - nodeHeight6,
                        'l 10 -4 l 0 8 z'
                    ].join('');
                }

                return ''
                    + '<g class="svg-view" data-type="'
                    +      type + '" data-from="' + node.id + '" data-to="' + toNode.id + '">'
                    +   '<path class="line-view" d="' + lineBuilder + '"></path>'
                    + '<path class="arrow-view" d="' + arrowBuilder + '"></path>'
                    + '</g>';
            };
        }


        /**
         * 渲染树连接线
         *
         * @param  {Object} levelNodes 数据
         * @param  {Object} options  布局参数
         * @return {string}          html片段
         */
        function renderArrow(levelNodes, options) {
            var maxWidth = 0;
            var maxHeight = 0;
            var segmentBuilder = getConnectionSegment(options);
            var gSegment = '';

            for (var i = 0, parent; parent = levelNodes[i]; i++) {
                for (var j = 0, node; node = parent[j]; j++) {
                    maxWidth = Math.max(maxWidth, node.layout.x);
                    maxHeight = Math.max(maxHeight, node.layout.y);
                    if (node.children) {
                        for (var k = 0, toNode; toNode = node.children[k]; k++) {
                            gSegment += segmentBuilder(node, toNode);
                        }
                    }
                }
            }

            return '<svg  '
                + 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
                + ' version="1.1" width="'
                +   (maxWidth + options.nodeWidth + options.spanX) + '" height="'
                +   (maxHeight + options.nodeHeight) + '">'
                +    gSegment
                + '</svg>';
        }

        /**
         * 处理数据为成层级数据
         *
         * @param  {Object} data 原始数据
         * @return {Array}      层级数据
         */
        function prepare(data) {
            var nodeMap = {};
            data.nodes.forEach(function (node) {
                node.inDeg = 0;
                node.outDeg = 0;
                node.children = [];
                nodeMap[node.id] = node;
            });

            data.connection.forEach(function (rel) {
                nodeMap[rel.from] && nodeMap[rel.from].outDeg++;
                nodeMap[rel.to] && nodeMap[rel.to].inDeg++;
                if (nodeMap[rel.from] && nodeMap[rel.to]) {
                    if (!nodeMap[rel.from].children) {
                        nodeMap[rel.from].children = [];
                    }
                    nodeMap[rel.from].children.push(nodeMap[rel.to]);
                }
            });

            var levelNodes = [[]];
            var startNodes = [];
            data.nodes.forEach(function (node) {
                if (node.inDeg === 0) {
                    node.level = 0;
                    levelNodes[0].push(node);
                    if (node.children) {
                        startNodes.push(node);
                    }
                }
            });

            var level = 1;
            while (startNodes.length) {
                var tmpLevelNodes = [];
                var tmpStartNodes = [];
                for (var i = 0, parent; parent = startNodes[i]; i++) {
                    for (var j = 0, node; node = parent.children[j]; j++) {
                        if (typeof node.level === 'undefined') {
                            node.level = level;
                            tmpLevelNodes.push(node);
                            if (node.children) {
                                tmpStartNodes.push(node);
                            }
                        }
                    }
                }
                startNodes = tmpStartNodes;
                if (tmpLevelNodes.length) {
                    levelNodes[level] = tmpLevelNodes;
                }
                level++;
            }
            return levelNodes;
        }

        function getNodeHash(levelNodes) {
            var nodeHash = {};
            for (var i = 0, parent; parent = levelNodes[i]; i++) {
                for (var j = 0, node; node = parent[j]; j++) {
                    nodeHash[node.id] = node;
                }
            }
            return nodeHash;
        }

        function showConnection(target, emphase) {
            var node = this.getNode(target.getAttribute('data-id'));
            if (node.children) {
                $(target)[emphase ? 'addClass' : 'removeClass']('emphase');

                for (var i = 0, n; n = node.children[i]; i++) {
                    this.main.find('flownode[data-id="' + n.id + '"]')[emphase ? 'addClass' : 'removeClass']('emphase');
                }

                this.main.find(
                    '.svg-view[data-from="' + node.id + '"]'
                ).attr('data-status', emphase ? 'emphase' : '');
            }
        }

        /**
         * 流程图视图
         * @constructor
         * @param {Object} options 参数
         * @param {HTMLElement} options.main 主节点
         */
        function FlowView(options) {
            options = options || {};
            options.nodeWidth = options.nodeWidth || 160;
            options.nodeHeight = options.nodeHeight || 50;
            options.spanX = options.spanX || 80;
            options.spanY = options.spanY || 30;
            options.offsetX = options.offsetX || 0;
            options.offsetY = options.offsetY || 0;
            $.extend(this, options);
            this.main = $(this.main);

            this.datasource = prepare(options.datasource);
            this.capture = new MouseCapture(this.main.get(0), {
                events: {
                    mousewheel: false
                }
            });

            var me = this;
            this.main.on('click', 'flownode', function (e) {
                me.fire('click', {
                    node: $(this).attr('data-id')
                });
            });

            this.main.on('mouseover', this._mouseover = function (e) {
                var target = null;
                if (target = dom.isMatchItem(e.target, this, 'flownode')) {
                    showConnection.call(me, target, true);
                }
            }).on('mouseout',  this._mouseout = function (e) {
                var target = null;
                if (target = dom.isMatchItem(e.target, this, 'flownode')) {
                    showConnection.call(me, target);
                }
            });

            me.camera = {};
            this.capture.on('dragstart', function (e) {
                me.camera.x = me.main.get(0).scrollLeft;
                me.camera.y = me.main.get(0).scrollTop;
            });

            this.capture.on('drag', function (e) {
                me.main.get(0).scrollLeft = me.camera.x - e.deltaX;
                me.main.get(0).scrollTop = me.camera.y - e.deltaY;
            });
        }


        /**
         * 获取指定节点
         *
         * @param {string} id  指定节点
         * @return {Object}
         */
        FlowView.prototype.getNode = function (id) {
            for (var i = 0, parent; parent = this.datasource[i]; i++) {
                for (var j = 0, node; node = parent[j]; j++) {
                    if (node.id === id) {
                        return node;
                    }
                }
            }
            return null;
        };

        /**
         * 渲染组件
         */
        FlowView.prototype.render = function () {
            var html = '';
            if (this.datasource) {
                layout(this.datasource, this);
                html = renderLevel(this.datasource, this) + renderArrow(this.datasource, this);
            }
            this.main.html(html);
        };

        /**
         * 获取单个树节点属性
         * @param  {Object} node 节点数据
         * @return {string}      html片段
         */
        FlowView.prototype.renderNodeAttributes = function (node) {
            return 'data-status="' + node.status + '" ';
        };

        /**
         * 渲染组件内容
         *
         * @param {Object} node 节点对象
         * @return {string} 节点html片段
         */
        FlowView.prototype.renderNode = function (node) {
            return '<div title="' + node.id + '">' + node.title + '</div>';
        };

        /**
         * 设置节点状态
         * @param {string} nodeId 节点id
         * @param {string} status 节点状态
         */
        FlowView.prototype.setStatus = function (nodeId, status) {
            var node = this.getNode(nodeId);
            if (node) {
                node.status = status;
                $('flownode[data-id="' + nodeId + '"]').attr('data-status', status);
            }
        };


        /**
         * 刷新节点状态
         * @param {Object} nodes 节点集合
         */
        FlowView.prototype.refreshStatus = function (nodes) {
            var nodeHash = getNodeHash(this.datasource);
            // 查找状态改变的节点
            var changedNodes = [];
            for (var i = 0, node; node = nodes[i]; i++) {
                if (nodeHash[node.id] && nodeHash[node.id].status !== node.status) {
                    nodeHash[node.id].status = node.status;
                    changedNodes.push(nodeHash[node.id]);
                }
            }

            // 更新状态
            changedNodes.forEach(function (node) {
                $('flownode[data-id="' + node.id + '"]').attr('data-status', node.status);
            });
        };

        /**
         * 注销
         */
        FlowView.prototype.dispose = function () {
            this.capture.dispose();
            this.un();
            this.main.off('click');
            this.main.off('mouseover', this._mouseover);
            this.main.off('mouseout', this._mouseout);
            this.main.html('');
            this.datasource = null;
        };

        observable.mixin(FlowView.prototype);
        return FlowView;
    }
);
