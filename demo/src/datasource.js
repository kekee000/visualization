/**
 * @file 数据源
 * @author mengke01(kekee000@gmail.com)
 */
define(
    function (require) {
        var Datasource = require('./common/Datasource');

        /**
         * 数据源组件
         *
         * @type {Object}
         */
        var datasource = new Datasource({
            resources: [
                // 列表接口
                {
                    name: 'flow-view',
                    url: './mock/data/flow-view.json'
                },
                {
                    name: 'tree-view',
                    url: './mock/data/tree-view.json'
                }
            ]
        });

        return datasource;
    }
);
