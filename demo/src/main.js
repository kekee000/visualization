/**
 * @file demo入口
 * @author mengke01(kekee000@gmail.com)
 */


define(
    function (require) {

        // 页面映射，$符用于分隔目录
        var actionMap = {
            index: 'widget$FlowView',
        };

        function bindEvent() {
            // 代理push state
            $(document.body).on('click', 'a', function (e) {
                e.preventDefault();
                var href = this.getAttribute('href');
                // 内部链接走代理
                if (href.startsWith('?') && this.href !== location.href) {
                    history.pushState({}, document.title, this.href);
                    forward();
                }
            });

            window.addEventListener("popstate", function() {
                forward();
            });
        }

        function getAction() {
            var action = 'index';
            if (location.search) {
                var match = location.search.match(/\?([\w-$]+)(?:&|$)/);
                action = match ? match[1] : 'index';
            }
            return actionMap[action] || action;
        }

        function forward() {
            var action = getAction();
            $.get(action.replace(/\$/g, '/') + '.html').then(function (html) {
                $('.container').html(html);
            }, function () {
                $('.container').html('没有相关组件介绍。');
            });
        }

        function showCode(fn, container) {
            container = container || '#code-container';
            $(container).html(
                fn.toString().slice(13).slice(0, -1)
                .replace(/^\s{4}/gm, '')
                .replace(/^\s+/, '')
                // 去除最后一行
                .replace(/require\(\'main\'[^;]+;/, '')
            );
            window.Prism.highlightAll();
        }

        // bindEvent();
        forward();
        return {
            showCode: showCode
        };
    }
);
