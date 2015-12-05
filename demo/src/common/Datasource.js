/**
 * @file 数据源组件
 * @author mengke01(kekee000@gmail.com)
 */

define(function (require) {

    /**
     * 数据源操作类
     *
     * @constructor
     * @param {Object} options 参数选项
     * @param {Array} options.resources 资源数组列表
     */
    function DataSource(options) {
        $.extend(this, options);

        // 将资源转换成hash，存储
        var resList = {};
        $(this.resources).each(function (index, item) {
            resList[item.name] = item;
        });
        this.resources = resList;
    }

    $.extend(DataSource.prototype, {

        /**
         * 获取相关的数据
         *
         * @param {string} name 资源名称
         * @param {Object} params 相关参数
         * @param {Function} onsuccess 成功回调
         * @param {Function} onerror 错误回调
         * @return {Promise} jquery的Promise对象
         */
        get: function (name, params, onsuccess, onerror) {
            var res = this.resources[name];
            var me = this;
            var promise = $.getJSON(
                res.url,
                $.extend(
                    {},
                    res.params,
                    window.PARAM_DATA,
                    params
                )
            )
            .done(function (data) {
                if (data.status === 0) {
                    onsuccess && onsuccess(data ? data.data : null, data);
                }
                else {
                    me.onError && me.onError(data);
                    onerror && onerror(data);
                }

            }).fail(function (reason) {
                me.onError && me.onError(reason);
                onerror && onerror(reason);
            });

            return promise;
        },

        /**
         * 根据参数和数据类型设置数据
         *
         * @param {string} name 资源名称
         * @param {?Object} params 参数HASH对象
         * @param {Function=} onsuccess 成功回调
         * @param {Function=} onerror 失败回调
         *
         * @return {Promise} jquery的Promise对象
         */
        put: function (name, params, onsuccess, onerror) {
            var me = this;
            var res = this.resources[name];

            // 使用FormData提交form表单
            if (params instanceof window.FormData) {
                return $.ajax({
                    url: res.url,
                    data: params,
                    type: 'post',
                    processData: false,  // 告诉jQuery不要去处理发送的数据
                    contentType: false   // 告诉jQuery不要去设置Content-Type请求头
                }).done(function (xhrText) {
                    var data = {};

                    try {
                        data = JSON.parse(xhrText);
                    }
                    catch (e) {
                        onerror && onerror(e);
                    }

                    if (data.status === 0) {
                        onsuccess && onsuccess(data ? data.data : null, data);
                    }
                    // 未登录
                    else if (data.status === 302) {
                        me.onJump && me.onJump(data);
                    }
                    else {
                        me.onPutError && me.onPutError(data);
                        onerror && onerror(data);
                    }

                }).fail(function (reason) {
                    me.onPutError && me.onPutError(reason);
                    onerror && onerror(reason);
                });
            }

            return $.ajax({
                url: res.url,
                data: $.extend(
                    {
                        t: Date.now ? Date.now() : (new Date()).getTime()
                    },
                    res.params,
                    window.PARAM_DATA,
                    params
                ),
                dataType: 'json',
                type: 'post'
            }).done(function (data) {

                if (data.status === 0) {
                    onsuccess && onsuccess(data ? data.data : null, data);
                }
                else {
                    me.onPutError && me.onPutError(data);
                    onerror && onerror(data);
                }

            }).fail(function (reason) {
                me.onPutError && me.onPutError(reason);
                onerror && onerror(reason);
            });
        },

        /**
         * 根据参数名字获取资源地址
         *
         * @param {string} name 资源名称
         * @return {string|false} 资源地址
         */
        getUrl: function (name) {
            return this.resources[name] ? this.resources[name].url : false;
        },

        /**
         * 注销
         */
        dispose: function () {
            this.resources = null;
        }
    });

    return DataSource;
});
