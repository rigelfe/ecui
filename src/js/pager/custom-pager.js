/*
Pager - 分页控件。
分页控件，配合表格控件使用，翻页时触发change事件，可在其中进行表格数据的更新。

分页控件直接HTML初始化的例子:
<div type="type:pager;pageSize:10;maxNum:40" class="ui-pager"></div>

属性
nPage:      当前的页码(从1开始记数)
nPageSize:  每页的记录数
nTotal:     总记录数

事件
change:     切换了分页

*/
(function () {

    var core = ecui,
        dom = core.dom,
        string = core.string,
        array = core.array,
        ui = core.ui,
        util = core.util,

        undefined,
        MATH = Math,

        createDom = dom.create,
        children = dom.children,
        extend = util.extend,
        blank = util.blank,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,

        UI_CONTROL = ui.Control,
        UI_PAGER = ui.Pager,
        UI_SELECT = ui.Select,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_PAGER_CLASS = UI_PAGER.prototype;
    /**
     * 初始化分页控件。
     * options 对象支持的属性如下：
     *      {Number} pageSize   每页的最大记录数
     *      {Number} total      记录总数 
     *      {Number} page      当前页码
     *
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_CUSTOM_PAGER = ui.CustomPager =
        inheritsControl(
            UI_CONTROL,
            'ui-custom-pager',
            function (el, options) {
                var type = this.getTypes()[0],
                    i, len, html = [];

                if (options.pageOptions) {
                    this.PAGE_SIZE = options.pageOptions.split(',');
                }
                else {
                    this.PAGE_SIZE = [10, 20, 50, 100];
                }

                var hideTotal = ' style="display:' + (options.hideTotal ? 'none' : '') + '"';
                var hideSize = ' style="display:' + (options.hideSize ? 'none' : '') + '"';

                html.push('<div class="' + type + '-page" ' + hideTotal + '>共<em></em>页</div>');
                html.push('<span style="float:left; margin-right:10px;' + 'display:' + (options.hideTotal ? 'none' : '') + '">，</span>');
                html.push('<div class="'+ type +'-sum" ' + hideTotal + '>共<em></em>条记录</div>');

                html.push('<div class="ui-pager"></div>');

                html.push('<div class="'+ type +'-pagesize" ' + hideSize + '>每页显示<select class="ui-select" style="width:45px">');
                for (i = 0, len = this.PAGE_SIZE.length; i < len; i++) {
                    html.push('<option value="'+ this.PAGE_SIZE[i] +'">' + this.PAGE_SIZE[i] + '</option>');
                }
                html.push('</select>条</div>')
                el.innerHTML = html.join('');

                //处理pageSize
                options.pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
                for (i = 0, len = this.PAGE_SIZE.length; i < len; i++) {
                    if (this.PAGE_SIZE[i] == options.pageSize) {
                        break;
                    }
                }
                
            },
            function (el, options) {
                var el = children(el),
                    me = this;

                this._bResizable = false;
                this._eTotalPage = el[0].getElementsByTagName('em')[0];
                this._eTotalNum = el[2].getElementsByTagName('em')[0];
                this._uPager = $fastCreate(UI_PAGER, el[3], this, extend({}, options));
                this._uPager.$change = function (value) {
                    triggerEvent(me, 'change', null, [value, me._uPager._nPageSize]);
                }
                this._uSelect = $fastCreate(UI_SELECT, el[4].getElementsByTagName('select')[0], this);
                this._uSelect.$change = function () {
                    triggerEvent(me, 'pagesizechange', null, [this.getValue()]);
                }
            }
        ),

        UI_CUSTOM_PAGER_CLASS = UI_CUSTOM_PAGER.prototype,

        DEFAULT_PAGE_SIZE = 50;
        

    UI_CUSTOM_PAGER.PAGE_SIZE = [10, 20, 50, 100];

    UI_CUSTOM_PAGER_CLASS.init = function () {
        this._uPager.init();
        this._uSelect.init();
        this._eTotalPage.innerHTML = this._nTotalPage || 1;
        this._eTotalNum.innerHTML = this._uPager._nTotal || 0;
        this._uSelect.setValue(this._uPager._nPageSize);
    }

    UI_CUSTOM_PAGER_CLASS.render = function (page, total, pageSize) {
        var item = this._uPager;

        this._uSelect.setValue(pageSize);
        if (total || total == 0) {
            this._eTotalNum.innerHTML = total;
            item._nTotal = total
        }
        else {
            this._eTotalPage.innerHTML = item._nPage || 0;
            this._eTotalNum.innerHTML = item._nTotal || 0;
            item._nTotal = item._nTotal || 0;
        }
        item._nPageSize = pageSize || item._nPageSize;

        //by hades
        this._nTotalPage = MATH.ceil(total / pageSize);
        this._eTotalPage.innerHTML = this._nTotalPage;

        item.go(page);
    };

    UI_CUSTOM_PAGER_CLASS.getPageSize = function () {
        return this._uPager._nPageSize;
    };

    UI_CUSTOM_PAGER_CLASS.getPage = function () {
        return this._uPager._nPage;
    };

    UI_CUSTOM_PAGER_CLASS.getTotal = function () {
        return this._uPager._nTotal;
    };
    
    /**
     * override
     */
    UI_CUSTOM_PAGER_CLASS.$setSize = blank;

})();
