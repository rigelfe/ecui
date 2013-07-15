/*
 MonthViewOnly - 定义月日历显示的基本操作。

 */
//{if 0}//
(function () {

    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,

        DATE = Date,

        indexOf = array.indexOf,
        addClass = dom.addClass,
        getParent = dom.getParent,
        removeClass = dom.removeClass,
        setText = dom.setText,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,

        UI_CONTROL = ui.Control;
//{/if}//
//{if $phase == "define"}//
    ///__gzip_original__UI_MONTH_VIEW
    ///__gzip_original__UI_MONTH_VIEW_CLASS
    /**
     * 初始化日历控件。
     * options 对象支持的属性如下：
     * year    控件的年份
     * month   控件的月份(1-12)
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_MONTH_VIEW_ONLY = ui.MonthViewOnly =
            inheritsControl(
                UI_CONTROL,
                'ui-monthviewonly',
                function (el, options) {
                    var type = this.getType(),
                        list = [];
                    el.style.overflow = 'auto';

                    for (var i = 0; i < 12; i++) {
                        list.push('<td class="' + type + '-item'
                            +   this.Cell.TYPES + '">'
                            +   UI_MONTH_VIEW_ONLY.MONTH[i] + "月"
                            +   '</td>'
                            +   ((i + 1) % 3 ? '' : '</tr><tr>'));
                    }

                    el.innerHTML =
                        '<table cellspacing="0"><tbody><tr>'
                            +       list.join('')
                            +   '</tr></tbody></table>';
                },
                function (el, options) {
                    this._aCells = [];
                    for (var i = 0, list = el.getElementsByTagName('TD'), o;
                         o = list[i]; )
                    {
                        // 日历视图单元格禁止改变大小
                        var cell = $fastCreate(
                            this.Cell, o, this,
                            {resizable: false}
                        );
                        cell._nMonth = i + 1;
                        this._aCells[i++] = cell;
                    }
                    this._nMonth = options.month || 1;
                    this._nYear = options.year || (new Date()).getFullYear();
                    this.setView(this._nYear, this._nMonth);
                }
            ),
        UI_MONTH_VIEW_ONLY_CLASS = UI_MONTH_VIEW_ONLY.prototype,

        /**
         * 初始化日历控件的单元格部件。
         * @public
         *
         * @param {Object} options 初始化选项
         */
            UI_MONTH_VIEW_ONLY_CELL_CLASS = (UI_MONTH_VIEW_ONLY_CLASS.Cell =
            inheritsControl(UI_CONTROL)).prototype;
//{else}//
    UI_MONTH_VIEW_ONLY.MONTH = ['一', '二', '三', '四', '五', '六', '七',"八","九","十","十一","十二"];

    /**
     * 选中某个日期单元格
     * @private
     *
     * @param {Object} 日期单元格对象
     */
    function UI_MONTH_VIEW_ONLY_CLASS_SETSELECTED(control, o) {
        if (control._uSelected == o) {
            return;
        }

        if (control._uSelected) {
            control._uSelected.alterClass('-selected');
        }

        if (o) {
            o.alterClass('+selected');
        }
        control._uSelected = o;
    }

    /**
     * 点击时，根据单元格类型触发相应的事件。
     * @override
     */
    UI_MONTH_VIEW_ONLY_CELL_CLASS.$click = function (event) {
        var parent = this.getParent();
        var curMonth = parent._nMonth;

        //change事件可以取消，返回false会阻止选中
        if (curMonth != this._nMonth) {
            parent._nMonth = this._nMonth;
            triggerEvent(parent, 'change', event, [this._nMonth]);
            UI_MONTH_VIEW_ONLY_CLASS_SETSELECTED(parent, this);
        }
    };

    /**
     * 获取日历控件当前显示的月份。
     * @public
     *
     * @return {number} 月份(1-12)
     */
    UI_MONTH_VIEW_ONLY_CLASS.getMonth = function () {
        return this._nMonth;
    };

    /**
     * 获取日历控件当前显示的年份。
     * @public
     *
     * @return {number} 年份(19xx-20xx)
     */
    UI_MONTH_VIEW_ONLY_CLASS.getYear = function () {
        return this._nYear;
    };

    /**
     * 日历显示移动指定的月份数。
     * 参数为正整数则表示向当前月份之后的月份移动，
     * 负数则表示向当前月份之前的月份移动，设置后日历控件会刷新以显示新的日期。
     * @public
     *
     * @param {number} offsetMonth 日历移动的月份数
     */
    UI_MONTH_VIEW_ONLY_CLASS.move = function (offsetMonth) {
        this.setView(this._nYear, this._nMonth + offsetMonth);
    };

    UI_MONTH_VIEW_ONLY_CLASS.clear = function () {
        this._uSelected = null;
        for (var i = 0, item;  item = this._aCells[i++];) {
            item.alterClass('-selected');
        }
    };

    /**
     * 设置日历控件当前显示的月份。
     * @public
     *
     * @param {number} year 年份(19xx-20xx)，如果省略使用浏览器的当前年份
     * @param {number} month 月份(1-12)，如果省略使用浏览器的当前月份
     */
    UI_MONTH_VIEW_ONLY_CLASS.setView = function (year, month) {
        this._nYear = year;
        this._nMonth = month;
        UI_MONTH_VIEW_ONLY_CLASS_SETSELECTED(this, this._aCells[month-1]);
    };
})();


(function () {

    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,
        string = core.string,
        util = core.util,

        DATE = Date,
        REGEXP = RegExp,
        DOCUMENT = document,

        pushArray = array.push,
        children = dom.children,
        createDom = dom.create,
        getParent = dom.getParent,
        getPosition = dom.getPosition,
        moveElements = dom.moveElements,
        setText = dom.setText,
        formatDate = string.formatDate,
        getView = util.getView,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        setFocused = core.setFocused,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
        UI_BUTTON_CLASS = UI_BUTTON.prototype,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,
        UI_SELECT = ui.Select,
        BEGIN_YEAR = 2002,
        END_YEAR = (new Date()).getFullYear(),
        UI_MONTH_VIEW_ONLY = ui.MonthViewOnly,
        UI_MONTH_VIEW_CELL = UI_MONTH_VIEW_ONLY.Cell;

    /**
     * 初始化日历控件。
     * options 对象支持的属性如下：
     * year    日历控件的年份
     * month   日历控件的月份(1-12)
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_MONTH_CALENDAR = ui.MonthCalendar =
            inheritsControl(
                UI_INPUT_CONTROL,
                'ui-month-calendar',
                function(el, options) {
                    var type = this.getTypes()[0];

                    options.hidden = true;
                    el.innerHTML = '<span class="'+ type +'-text"></span>' +
                        '<span class="'+ type +'-cancel"></span>' +
                        '<span class="'+ type +'-button"></span>';
                },
                function(el, options) {
                    var child = children(el),
                        type = this.getTypes()[0],
                        o = createDom(type + '-panel',
                            'position:absolute;display:none');

                    this._bTip = options.tip !== false;
                    this._nYear = options.year;
                    this._nMonth = options.month;

                    this._eText = child[0];

                    this._uCancel = $fastCreate(this.Cancel, child[1], this);
                    this._uButton = $fastCreate(UI_CONTROL, child[2], this);

                    DOCUMENT.body.appendChild(o);
                    this._uPanel = $fastCreate(this.Panel, o, this, options);

                    if (options.hideCancel == true) {
                        this._bHideCancel = true;
                        this._uCancel.$hide();
                    }
                }
            ),

        UI_MONTH_CALENDAR_CLASS = UI_MONTH_CALENDAR.prototype,
        UI_MONTH_CALENDAR_CANCEL_CLASS = (UI_MONTH_CALENDAR_CLASS.Cancel = inheritsControl(UI_CONTROL)).prototype,

        UI_MONTH_CALENDAR_PANEL = UI_MONTH_CALENDAR_CLASS.Panel =
            inheritsControl(
                UI_CONTROL,
                'ui-month-calendar-panel',
                function(el, options) {
                    var html = [],
                        year = (new DATE()).getFullYear(),
                        beginYear = options.beginYear || BEGIN_YEAR,
                        endYear = options.endYear || END_YEAR,
                        type = this.getTypes()[0];

                    html.push('<div class="'+ type +'-buttons"><div class="'+ type +'-btn-prv'+ UI_BUTTON.TYPES +'"></div>' +
                        '<select class="'+ type +'-slt-year'+ UI_SELECT.TYPES +'">');
                    for(var i = beginYear; i < endYear + 1; i ++) {
                        html.push('<option value="'+ i +'">'+ i +'</option>');
                    }
                    html.push('</select>');
                    html.push('<div class="'+ type +'-btn-nxt'+ UI_BUTTON.TYPES +'"></div></div>');
                    html.push('<div class="'+ type +'-month-view'+ UI_MONTH_VIEW_ONLY.TYPES +'"></div>');
                    el.innerHTML = html.join('');
                },
                function (el, options) {
                    var html = [], o, i,
                        type = this.getTypes()[0],
                        buttonClass = this.Button,
                        selectClass = this.Select,
                        beginYear = options.beginYear || BEGIN_YEAR,
                        endYear = options.endYear || END_YEAR,
                        monthViewClass = this.MonthViewOnly;

                    el = children(el);
                    o = children(el[0]);
                    this._beginYear = beginYear;
                    this._endYear = endYear;
                    this._uPrvBtn = $fastCreate(buttonClass, o[0], this);
                    this._uPrvBtn._nStep = -1;
                    this._uYearSlt = $fastCreate(selectClass, o[1], this);
                    this._uNxtBtn = $fastCreate(buttonClass, o[2], this);
                    this._uNxtBtn._nStep = 1;

                    el = el[1];
                    this._uMonthView = $fastCreate(monthViewClass, el, this);
                    this._uYearSlt.setValue((new Date()).getFullYear());
                }
            ),

        UI_MONTH_CALENDAR_PANEL_CLASS = UI_MONTH_CALENDAR_PANEL.prototype,
        UI_MONTH_CALENDAR_PANEL_BUTTON_CLASS = (UI_MONTH_CALENDAR_PANEL_CLASS.Button = inheritsControl(UI_BUTTON, null)).prototype,
        UI_MONTH_CALENDAR_PANEL_SELECT_CLASS = (UI_MONTH_CALENDAR_PANEL_CLASS.Select = inheritsControl(UI_SELECT, null)).prototype,
        UI_MONTH_CALENDAR_PANEL_MONTHVIEW_CLASS = (UI_MONTH_CALENDAR_PANEL_CLASS.MonthViewOnly = inheritsControl(UI_MONTH_VIEW_ONLY, null)).prototype,

        UI_MONTH_CALENDAR_STR_DEFAULT = '<span class="ui-calendar-default">请选择一个日期</span>';

    // 是否显示取消按钮
    function UI_CALENDAR_TEXT_FLUSH(con) {
        var el = con._eText;
        if (el.innerHTML == '') {
            con._uCancel.hide();
            if (con._bTip) {
                el.innerHTML = UI_MONTH_CALENDAR_STR_DEFAULT;
            }
        }
        else if (!con._bHideCancel) {
            con._uCancel.show();
        }
    }

    /**
     * 获得单日历控件的年份
     */
    UI_MONTH_CALENDAR_CLASS.getYear = function () {
        return this._nYear;
    };
    /**
     * 获得单日历控件的月份
     */
    UI_MONTH_CALENDAR_CLASS.getMonth = function () {
        return this._nMonth;
    };

    /**
     * @func 设置日期
     * @param date
     */
    UI_MONTH_CALENDAR_CLASS.setDate = function (year, month) {
        var ntxt = year && month ?
            year + "年" + (month > 9 ? month : "0" + month) + "月" :
            "";

        // 隐藏面板
        if (this._uPanel.isShow()) {
            this._uPanel.hide();
        }
        // 设置输入框的值
        this._eText.innerHTML = ntxt;
        // 设置日期控件的值为选中的值
        this.setValue(ntxt);
        this._nYear = year ;
        this._nMonth = month;
        // 是否显示 清除按钮
        UI_CALENDAR_TEXT_FLUSH(this);
    };

    // 激活日期控件，显示面板
    UI_MONTH_CALENDAR_CLASS.$activate = function (event) {
        var panel = this._uPanel, con,
            pos = getPosition(this.getOuter()),
            posTop = pos.top + this.getHeight();

        UI_INPUT_CONTROL_CLASS.$activate.call(this, event);
        if (!panel.isShow()) {
            panel.setDate(this._nYear, this._nMonth);
            con = getView();
            panel.show();
            panel.setPosition(
                pos.left + panel.getWidth() <= con.right ? pos.left : con.right - panel.getWidth() > 0 ? con.right - panel.getWidth() : 0,
                posTop + panel.getHeight() <= con.bottom ? posTop : pos.top - panel.getHeight() > 0 ? pos.top - panel.getHeight() : 0
            );
            setFocused(panel);
        }
    };

    UI_MONTH_CALENDAR_CLASS.$cache = function (style, cacheSize) {
        UI_INPUT_CONTROL_CLASS.$cache.call(this, style, cacheSize);
        this._uButton.cache(false, true);
        this._uPanel.cache(true, true);
    };

    // month-calendar 的初始化函数，每次初始化这个控件时都会调用
    UI_MONTH_CALENDAR_CLASS.init = function () {
        UI_INPUT_CONTROL_CLASS.init.call(this);
        this.setDate(this._nYear, this._nMonth);
        this._uPanel.init();
    };

    // calendar清空函数，回到原始状态
    UI_MONTH_CALENDAR_CLASS.clear = function () {
        this.setDate();
    };

    // 删除按钮的点击事件
    UI_MONTH_CALENDAR_CANCEL_CLASS.$click = function () {
        var par = this.getParent();

        UI_CONTROL_CLASS.$click.call(this);
        par.clear();
    };

    UI_MONTH_CALENDAR_CANCEL_CLASS.$activate = UI_BUTTON_CLASS.$activate;

    /**
     * Panel
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.$blur = function () {
        this.hide();
    };

    /**
     * 设置日历面板的日期
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.setDate = function (year, month) {
        var today = new Date();
        year = year || today.getFullYear();

        this._uYearSlt.setValue(year);
        this._uMonthView.setView(year, month);
        this.setView(year, month);
    };

    /**
     * 设置日历面板的展现年月
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.setView = function (year, month) {
        var yearSlt = this._uYearSlt,
            monthView = this._uMonthView;

        year = year || (new Date()).getFullYear();
        yearSlt.setValue(year);
        year && monthView.setView(year, month);
    };

    /**
     * 获取当前日历面板视图的年
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.getViewYear = function () {
        return this._uMonthView.getYear();
    };

    /**
     * 获取当前日历面板视图的月
     */
    UI_MONTH_CALENDAR_PANEL_CLASS.getViewMonth = function () {
        return this._uMonthView.getMonth();
    };

    UI_MONTH_CALENDAR_PANEL_CLASS.$cache = function (style, cacheSize) {
        this._uPrvBtn.cache(true, true);
        this._uNxtBtn.cache(true, true);
        this._uYearSlt.cache(true, true);
        this._uMonthView.cache(true, true);
        UI_CONTROL_CLASS.$cache.call(this, style, cacheSize);
    };

    UI_MONTH_CALENDAR_PANEL_CLASS.init = function () {
        UI_CONTROL_CLASS.init.call(this);
        this._uYearSlt.init();
        this._uMonthView.init();
    };

    //面板的change事件
    UI_MONTH_CALENDAR_PANEL_CLASS.$change = function (event, month) {
        var par = this.getParent();
        var year = this._uYearSlt.getValue();
        if (triggerEvent(par, 'change', event, [year,month])) {
            par.setDate(year, month);
        }
        this.hide();
    };

    // 年选择框的change事件
    UI_MONTH_CALENDAR_PANEL_SELECT_CLASS.$change = function () {
        var panel = this.getParent(),
            view = panel.getParent(),
            yearSlt = panel._uYearSlt;
        var month = view._nYear == yearSlt.getValue() ? view._nMonth : null;
        panel.setView(yearSlt.getValue(), month);
    };
    /*UI_MONTH_CALENDAR_PANEL_BUTTON_CLASS.$click = function () {
     var step = this._nStep,
     panel = this.getParent(),
     date;

     date = new DATE(panel.getViewYear(), panel.getViewMonth() - 1 + step, 1);
     panel.setView(date.getFullYear(), date.getMonth() + 1);
     };*/

    // 点击 向前， 向后两个按钮的事件
    UI_MONTH_CALENDAR_PANEL_BUTTON_CLASS.$click = function () {
        var step = this._nStep,
            panel = this.getParent(),
            view = panel.getParent(),
            date;
        var curYear = panel._uYearSlt.getValue();
        var nextYear = curYear-0 + step;
        if (nextYear < panel._beginYear) {
            nextYear = panel._endYear;
        }
        if (nextYear > panel._endYear) {
            nextYear = panel._beginYear;
        }
        panel._uMonthView.clear();
        if (nextYear == view._nYear) {
            panel._uMonthView.setView(nextYear, panel.getViewMonth());
        }
        panel._uYearSlt.setValue(nextYear);
    };

    // 重写moth-view-only的change方法
    UI_MONTH_CALENDAR_PANEL_MONTHVIEW_CLASS.$change = function (event, month) {
        triggerEvent(this.getParent(), 'change', event, [month]);
    };
})();
