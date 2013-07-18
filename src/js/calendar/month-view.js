/*
MonthView - 定义日历显示的基本操作。
日历视图控件，继承自基础控件，不包含年/月/日的快速选择与切换，如果需要实现这些功能，请将下拉框(选择月份)、输入框(输入年份)等组合使用建立新的控件或直接在页面上布局并调用接口。

日历视图控件直接HTML初始化的例子:
<div ecui="type:month-view;year:2009;month:11"></div>

属性
_nYear      - 年份
_nMonth     - 月份(0-11)
_aCells     - 日历控件内的所有单元格，其中第0-6项是日历的头部星期名称
_oBegin     - 起始日期 小于这个日期的日历单元格会被disabled
_oEnd       - 结束日期 大于这个日期的日历单元格会被disabled
_oDate      - 当前选择日期
_uSelected  - 当前选择的日历单元格

子控件属性
_nDay       - 从本月1号开始计算的天数，如果是上个月，是负数，如果是下个月，会大于当月最大的天数
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
     * year    日历控件的年份
     * month   日历控件的月份(1-12)
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_MONTH_VIEW = ui.MonthView =
        inheritsControl(
            UI_CONTROL,
            'ui-monthview',
            function (el, options) {
                var i = 0,
                    type = this.getType(),
                    list = [];

                el.style.overflow = 'auto';

                for (; i < 7; ) {
                    list[i] =
                        '<td class="' + type + '-title' + this.Cell.TYPES + '">' +
                            UI_MONTH_VIEW.WEEKNAMES[i++] + '</td>';
                }
                list[i] = '</tr></thead><tbody><tr>';
                for (; ++i < 50; ) {
                    list[i] =
                        '<td class="' + type + '-item' + this.Cell.TYPES + '"></td>' +
                            (i % 7 ? '' : '</tr><tr>');
                }

                el.innerHTML =
                    '<table cellspacing="0"><thead><tr>' + list.join('') + '</tr></tbody></table>';
            },
            function (el, options) {
                this._aCells = [];
                for (var i = 0, list = el.getElementsByTagName('TD'), o; o = list[i]; ) {
                    // 日历视图单元格禁止改变大小
                    this._aCells[i++] = $fastCreate(this.Cell, o, this, {resizable: false});
                }

                this._oBegin = new Date(options.begin);
                this._oEnd = new Date(options.end);

                this.setView(options.year, options.month);
            }
        ),
        UI_MONTH_VIEW_CLASS = UI_MONTH_VIEW.prototype,

        /**
         * 初始化日历控件的单元格部件。
         * @public
         *
         * @param {Object} options 初始化选项
         */
        UI_MONTH_VIEW_CELL_CLASS = (UI_MONTH_VIEW_CLASS.Cell = inheritsControl(UI_CONTROL)).prototype;
//{else}//
    UI_MONTH_VIEW.WEEKNAMES = ['一', '二', '三', '四', '五', '六', '日'];

    /**
     * 选中某个日期单元格
     * @private
     *
     * @param {Object} 日期单元格对象
     */
    function UI_MONTH_VIEW_CLASS_SETSELECTED(control, o) {
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
    };

    /**
     * 点击时，根据单元格类型触发相应的事件。
     * @override
     */
    UI_MONTH_VIEW_CELL_CLASS.$click = function (event) {
        var parent = this.getParent(),
            index = indexOf(parent._aCells, this),
            curDate = parent._oDate;

        if (index < 7) {
            triggerEvent(parent, 'titleclick', event, [index]);
        }
        else {
            index = new DATE(parent._nYear, parent._nMonth, this._nDay);
            //change事件可以取消，返回false会阻止选中
            if ((!curDate || index.getTime() != curDate.getTime()) && triggerEvent(parent, 'change', event, [index])) {
                parent._oDate = new DATE(parent._nYear, parent._nMonth, this._nDay);
                UI_MONTH_VIEW_CLASS_SETSELECTED(parent, this);
            }
        }
    };

    /**
     * 获取日历控件当前显示的月份。
     * @public
     *
     * @return {number} 月份(1-12)
     */
    UI_MONTH_VIEW_CLASS.getMonth = function () {
        return this._nMonth + 1;
    };

    /**
     * 获取日历控件当前显示的年份。
     * @public
     *
     * @return {number} 年份(19xx-20xx)
     */
    UI_MONTH_VIEW_CLASS.getYear = function () {
        return this._nYear;
    };

    /**
     * 日历显示移动指定的月份数。
     * 参数为正整数则表示向当前月份之后的月份移动，负数则表示向当前月份之前的月份移动，设置后日历控件会刷新以显示新的日期。
     * @public
     *
     * @param {number} offsetMonth 日历移动的月份数
     */
    UI_MONTH_VIEW_CLASS.move = function (offsetMonth) {
        var time = new DATE(this._nYear, this._nMonth + offsetMonth, 1);
        this.setView(time.getFullYear(), time.getMonth() + 1);
    };

    /**
     * 设置日历的显示范围
     * 只有在两参数的闭区间外的日期单元格会被disabled
     * @public
     *
     * @param {Date} begin 起始日期，如果为null则表示不设置起始日期
     * @param {Date} end 结束日期，如果为null则表示不设置结束日期
     * @param {Boolean} isSilent 如果为true则只设置不刷新页面
     */
    UI_MONTH_VIEW_CLASS.setRange = function (begin, end, isSilent) {
        this._oBegin = begin;
        this._oEnd = end;
        if (!isSilent) {
            this.setView(this.getYear(), this.getMonth());
        }
    };

    /**
     * 设置日历当前选择日期，并切换到对应的月份
     * @public
     *
     * @param {Date} date 日期
     */
    UI_MONTH_VIEW_CLASS.setDate = function (date) {
        this.$setDate(date);
        this.setView(date.getFullYear(), date.getMonth() + 1);
    };

    /**
     * 获取当前日历选择的日期
     * @public
     *
     * @return {Date} 日期
     */
    UI_MONTH_VIEW_CLASS.getDate = function () {
        return this._oDate;
    };

    /*
     * 设置日历的当前选择日历
     * @private
     *
     * @param {Date} date 日期
     */
    UI_MONTH_VIEW_CLASS.$setDate = function (date) {
        this._oDate = date ? new DATE(date.getFullYear(), date.getMonth(), date.getDate()) : null;
    };

    /**
     * 设置日历控件当前显示的月份。
     * @public
     *
     * @param {number} year 年份(19xx-20xx)，如果省略使用浏览器的当前年份
     * @param {number} month 月份(1-12)，如果省略使用浏览器的当前月份
     */
    UI_MONTH_VIEW_CLASS.setView = function (year, month) {
        //__gzip_original__date
        var i = 7,
            today = new DATE(),
            year = year || today.getFullYear(),
            month = month ? month - 1 : today.getMonth(),
            // 得到上个月的最后几天的信息，用于补齐当前月日历的上月信息位置
            o = new DATE(year, month, 0),
            day = 1 - o.getDay(),
            lastDayOfLastMonth = o.getDate(),
            // 得到当前月的天数
            lastDayOfCurrMonth = new DATE(year, month + 1, 0).getDate(),
            begin = this._oBegin, end = this._oEnd, selected = this._oDate,
            curDate;

        this._nYear = year;
        this._nMonth = month;

        //设置日期范围
        //begin = begin && begin.getFullYear() == year && begin.getMonth() == month ? begin.getDate() : 0 ;
        //end = end && end.getFullYear() == year && end.getMonth() == month ? end.getDate() : 31;
        begin = begin ? new Date(begin.getFullYear(), begin.getMonth(), begin.getDate()).getTime() : 0
        end = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() : Number.MAX_VALUE;

        selected = selected && selected.getFullYear() == year && selected.getMonth() == month ? selected.getDate() : 0;

        UI_MONTH_VIEW_CLASS_SETSELECTED(this, null);

        for (; o = this._aCells[i++]; ) {
            if (month = day > 0 && day <= lastDayOfCurrMonth) {
                curDate = new Date(this._nYear, this._nMonth, day).getTime();
                if (begin > curDate || end < curDate) {
                    o.disable();
                }
                else {
                    o.enable();
                    //恢复选择的日期
                    if (day == selected) {
                        UI_MONTH_VIEW_CLASS_SETSELECTED(this, o);
                    }
                }
            }
            else {
                o.disable();
            }

            if (i == 36 || i == 43) {
                (o.isDisabled() ? addClass : removeClass)(getParent(o.getOuter()), this.getType() + '-extra');
            }

            setText(
                o.getBody(),
                month ? day : day > lastDayOfCurrMonth ? day - lastDayOfCurrMonth : lastDayOfLastMonth + day
            );
            o._nDay = day++;
        }
    };
//{/if}//
//{if 0}//
})();
//{/if}//
