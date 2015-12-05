/**
 * @file dom相关操作
 * @author mengke01(kekee000@gmail.com)
 */


define(
    function (require) {

        var matchesSelector = document.body.webkitMatchesSelector
            || document.body.msMatchesSelector
            || document.body.mozMatchesSelector;

        var dom = {

            /**
             * 当前元素是否与selector匹配
             *
             * @param  {HTMLElement}  target       目标元素
             * @param  {HTMLElement}  main         主元素
             * @param  {string}  itemSelector 子元素选择器
             * @return {boolean}
             */
            isMatchItem: function (target, main, itemSelector) {
                while (target && target !== main) {
                    if (matchesSelector.call(target, itemSelector) && main.contains(target)) {
                        return target;
                    }
                    target = target.parentNode;
                }
                return false;
            }
        };

        return dom;
    }
);
