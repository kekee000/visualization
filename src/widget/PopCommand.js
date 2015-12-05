/**
 * @file 命令栏浮动层
 * @author mengke01(kekee000@gmail.com)
 */


define(
    function (require) {
        var dom = require('./dom');

        var LAYER_HIDE_DELAY = 150; // 浮层隐藏延迟

        function showLayer(relativeElement) {
            var the = $(relativeElement);
            var pos = the.offset();
            pos.top += the.height();

            // 超出右侧则向左移动
            if (pos.left + 200 > document.body.scrollLeft + document.body.offsetWidth) {
                pos.left += the.width() - this.layer.width();
            }

            this.onSelectCommand && this.onSelectCommand({
                target: this,
                relativeTarget: relativeElement,
                args: this.layer.data('args')
            });

            this.layer.data('args', this.getCommandArgs(relativeElement)).css({
                left: pos.left,
                top: pos.top
            }).show();

            this.onShow && this.onShow({
                target: this,
                relativeTarget: relativeElement,
                args: this.layer.data('args')
            });
        }

        function hideLayer() {
            this.layer.data('args', null).hide();
        }

        function init() {

            this.layer = $('<div class="pop-command-layer"></div>').appendTo(document.body);

            var me = this;

            var timerHandler = function () {
                hideLayer.call(me);
            };

            this.main.on('mouseover', this._mouseover = function (e) {
                var target = null;
                if (target = dom.isMatchItem(e.target, this, me.itemSelector)) {
                    clearTimeout(me.hideTimer);
                    showLayer.call(me, target);
                }
            }).on('mouseout',  this._mouseout = function (e) {
                if (dom.isMatchItem(e.target, this, me.itemSelector)) {
                    me.hideTimer = setTimeout(timerHandler, LAYER_HIDE_DELAY);
                }
            });

            this.layer.hover(function () {
                clearTimeout(me.hideTimer);
            }, function () {
                me.hideTimer = setTimeout(timerHandler, LAYER_HIDE_DELAY);
            }).on('click', '[data-command]', function (e) {
                e.stopPropagation();

                var commandName = this.getAttribute('data-command');
                var commandArgs = me.layer.data('args');
                hideLayer.call(me);

                me.onCommand && me.onCommand({
                    command: commandName,
                    args: commandArgs
                });
            });

            this.refresh();
        }

        function getCommandHTML() {
            if (!this.datasource) {
                return '';
            }

            var datasource = this.datasource;
            var html = '<ul>';
            for (var i = 0, item; item = datasource[i]; i++) {
                if (true !== item.disabled) {
                    html += '<li data-command="' + item.name + '">' + item.title;
                    if (item.items) {
                        html += '<ul>';
                        for (var j = 0, item2; item2 = item.items[j]; j++) {
                            html += '<li data-command="' + item2.name + '">' + item2.title + '</li>';
                        }
                        html += '</ul>';
                    }
                    html += '</li>';
                }
            }
            html += '</ul>';
            return html;
        }


        /**
         * 命令栏浮动菜单
         * @param {HTMLElement} main    主元素
         * @param {Object} options 参数
         * @param {HTMLElement} options.main  主元素
         * @param {string} options.datasource 数据源
         * options.datasource = [
         *     {
         *         "title": "删除",
         *         "name": "delete",
         *         "disabled": false
         *     }
         * ]
         * @param {string} options.itemSelector 子元素选择器
         * @param {number} options.showDelay 显示的延迟时间
         * @param {Function} options.onShow 当显示菜单时候的事件
         * @param {Function} options.onCommand 当触发命令时候的事件
         */
        function PopCommand(options) {
            $.extend(this, options);
            this.main = $(this.main);
            init.call(this);
        }

        PopCommand.prototype.refresh = function () {
            this.layer.html(getCommandHTML.call(this));
        };

        PopCommand.prototype.getCommandArgs = function (relativeElement) {
            return {
                id: relativeElement.getAttribute('data-id')
            };
        };

        PopCommand.prototype.dispose = function () {
            this.main.off('mouseover', this._mouseover);
            this.main.off('mouseout', this._mouseout);
            this.layer.remove();
        };

        return PopCommand;
    }
);
