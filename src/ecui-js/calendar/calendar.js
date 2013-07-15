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
        UI_MONTH_VIEW = ui.MonthView,
        UI_MONTH_VIEW_CELL = UI_MONTH_VIEW.Cell;

    /**
     * 初始化日历控件。
     * options 对象支持的属性如下：
     * year    日历控件的年份
     * month   日历控件的月份(1-12)
     * @public
     *
     * @param {Object} options 初始化选项
     */
    var UI_CALENDAR = ui.Calendar =
        inheritsControl(
            UI_INPUT_CONTROL,
            'ui-calendar',
            function (el, options) {
                var type = this.getTypes()[0];

                options.hidden = true;
                el.innerHTML = '<span class="'+ type +'-text"></span><span class="'+ type +'-cancel"></span><span class="'+ type +'-button"></span>';
            },
            function (el, options) {
                var child = children(el),
                    type = this.getTypes()[0],
                    o = createDom(type + '-panel', 'position:absolute;display:none');

                this._bTip = options.tip !== false;

                if (options.date) {
                    var date = options.date.split('-');
                    this._oDate = new DATE(parseInt(date[0], 10), parseInt(date[1], 10) - 1, parseInt(date[2], 10));
                }
                else if (options.date === false) {
                    this._oDate = null
                }
                else {
                    this._oDate = new DATE();
                }
                var range = UI_CALENDAR_PARSE_RANGE(options.start, options.end);

                this._eText = child[0];

                this._uCancel = $fastCreate(this.Cancel, child[1], this);
                this._uButton = $fastCreate(UI_CONTROL, child[2], this);

                this._bCancelButton = options.cancelButton !== false;
                if (!this._bCancelButton) {
                    this._uCancel.$hide();
                }

                DOCUMENT.body.appendChild(o);
                this._uPanel = $fastCreate(this.Panel, o, this, {date: this._oDate, range: range});
            }
        ),

        UI_CALENDAR_CLASS = UI_CALENDAR.prototype,
        UI_CALENDAR_CANCEL_CLASS = (UI_CALENDAR_CLASS.Cancel = inheritsControl(UI_CONTROL)).prototype,

        UI_CALENDAR_PANEL = UI_CALENDAR_CLASS.Panel = 
        inheritsControl(
            UI_CONTROL,
            'ui-calendar-panel',
            function (el, options) {
                var html = [],
                    year = (new DATE()).getFullYear(),
                    type = this.getTypes()[0];
                var today = new Date();
                var startYear = today.getFullYear() - 5;
                var endYear = today.getFullYear() + 5;
                var startDate = options.range.begin;
                var endDate = options.range.end;
                if (startDate) {
                    startYear = startDate.getFullYear();
                }
                if (endDate) {
                    endYear = endDate.getFullYear();
                }
                html.push('<div class="'+ type +'-buttons"><div class="'+ type +'-btn-prv'+ UI_BUTTON.TYPES +
                    '"></div><select class="'+ type +'-slt-year'+ UI_SELECT.TYPES +'">');

                for (var  i = startYear; i <= endYear; i ++) {
                    html.push('<option value="'+ i +'">'+ i +'</option>');
                }

                html.push('</select><select class="'+ type +'-slt-month'+ UI_SELECT.TYPES +'">');

                for (var i = 1; i <= 12; i++) {
                    html.push('<option value="'+ i +'">'+ (i < 10 ? '0' : '') + i +'</option>');
                }

                html.push('</select><div class="'+ type +'-btn-nxt'+ UI_BUTTON.TYPES +'"></div></div>');
                html.push('<div class="'+ type +'-month-view'+ UI_MONTH_VIEW.TYPES +'"></div>');
                el.innerHTML = html.join('');
            },
            function (el, options) {
                var html = [], o, i,
                    type = this.getTypes()[0],
                    buttonClass = this.Button,
                    selectClass = this.Select,
                    monthViewClass = this.MonthView,
                    date = options.date;
                
                el = children(el);
                o = children(el[0]);

                this._uPrvBtn = $fastCreate(buttonClass, o[0], this);
                this._uPrvBtn._nStep = -1;
                this._uYearSlt = $fastCreate(selectClass, o[1], this);
                this._uMonthSlt = $fastCreate(selectClass, o[2], this);
                this._uNxtBtn = $fastCreate(buttonClass, o[3], this);
                this._uNxtBtn._nStep = 1;

                el = el[1];
                this._uMonthView = $fastCreate(monthViewClass, el, this,
                    {
                        begin: options.range.begin,
                        end: options.range.end
                    }
                );
            }
        ),

        UI_CALENDAR_PANEL_CLASS = UI_CALENDAR_PANEL.prototype,
        UI_CALENDAR_PANEL_BUTTON_CLASS = (UI_CALENDAR_PANEL_CLASS.Button = inheritsControl(UI_BUTTON, null)).prototype,
        UI_CALENDAR_PANEL_SELECT_CLASS = (UI_CALENDAR_PANEL_CLASS.Select = inheritsControl(UI_SELECT, null)).prototype,
        UI_CALENDAR_PANEL_MONTHVIEW_CLASS = (UI_CALENDAR_PANEL_CLASS.MonthView = inheritsControl(UI_MONTH_VIEW, null)).prototype,

        UI_CALENDAR_STR_DEFAULT = '<span class="ui-calendar-default">请选择一个日期</span>',
        UI_CALENDAR_STR_PATTERN = 'yyyy-MM-dd';


    function UI_CALENDAR_PARSE_RANGE(begin, end) {
        var now = new Date(), res = null,
            o = [now.getFullYear(), now.getMonth(), now.getDate()], t,
            p = {y:0, M:1, d:2};
        if (begin instanceof Date) {
            res = res || {};
            res.begin = begin;
        }
        else if (/^([-+]?)(\d+)([yMd])$/.test(begin)) {
            res = res || {};
            t = o.slice();
            if (!REGEXP.$1 || REGEXP.$1 == '+') {
                t[p[REGEXP.$3]] -= parseInt(REGEXP.$2, 10);
            }
            else {
                t[p[REGEXP.$3]] += parseInt(REGEXP.$2, 10);
            }
            res.begin = new Date(t[0], t[1], t[2]);
        }
        else if ('[object String]' == Object.prototype.toString.call(begin)) {
            res = res || {};
            begin = begin.split('-');
            res.begin = new Date(parseInt(begin[0], 10), parseInt(begin[1], 10) - 1, parseInt(begin[2], 10));
        }

        if (end instanceof Date) {
            res = res || {};
            res.end = end;
        }
        else if (/^([-+]?)(\d+)([yMd])$/.test(end)) {
            res = res || {};
            t = o.slice();
            if (!REGEXP.$1 || REGEXP.$1 == '+') {
                t[p[REGEXP.$3]] += parseInt(REGEXP.$2, 10);
            }
            else {
                t[p[REGEXP.$3]] -= parseInt(REGEXP.$2, 10);
            }
            res.end = new Date(t[0], t[1], t[2]);
        }
        else if ('[object String]' == Object.prototype.toString.call(end)) {
            res = res || {};
            end = end.split('-');
            res.end = new Date(parseInt(end[0], 10), parseInt(end[1], 10) - 1, parseInt(end[2], 10));
        }

        return res ? res : {};
    }

    function UI_CALENDAR_TEXT_FLUSH(con) {
        var el = con._eText;
        if (el.innerHTML == '') {
            con._uCancel.$hide();
            if (con._bTip) {
                el.innerHTML = UI_CALENDAR_STR_DEFAULT;
            }
        }
        else if (con._bCancelButton){
            con._uCancel.show();
        }
    }

    /**
     * 获得单日历控件的日期
     */
    UI_CALENDAR_CLASS.getDate = function () {
        return this._oDate;
    };

    UI_CALENDAR_CLASS.setDate = function (date) {
        var panel = this._uPanel,
            ntxt = date != null ? formatDate(date, UI_CALENDAR_STR_PATTERN) : '';

        if (this._uPanel.isShow()) {
            this._uPanel.hide();
        }

        this._eText.innerHTML = ntxt;
        UI_INPUT_CONTROL_CLASS.setValue.call(this, ntxt);
        this._oDate = date;
        UI_CALENDAR_TEXT_FLUSH(this);
    };

    UI_CALENDAR_CLASS.setValue = function (str) {
        if (!str) {
            this.setDate(null);
        }
        else {
            str = str.split('-');
            this.setDate(new Date(parseInt(str[0], 10), parseInt(str[1], 10) - 1, parseInt(str[2], 10)));
        }
    };

    UI_CALENDAR_CLASS.$activate = function (event) {
        var panel = this._uPanel, con,
            pos = getPosition(this.getOuter()),
            posTop = pos.top + this.getHeight();

        UI_INPUT_CONTROL_CLASS.$activate.call(this, event);
        if (!panel.isShow()) {
            panel.setDate(this.getDate());
            con = getView();
            panel.show();
            panel.setPosition(
                pos.left + panel.getWidth() <= con.right ? pos.left : con.right - panel.getWidth() > 0 ? con.right - panel.getWidth() : 0,
                posTop + panel.getHeight() <= con.bottom ? posTop : pos.top - panel.getHeight() > 0 ? pos.top - panel.getHeight() : 0
            );
            setFocused(panel);
        }
    };

    UI_CALENDAR_CLASS.$cache = function (style, cacheSize) {
        UI_INPUT_CONTROL_CLASS.$cache.call(this, style, cacheSize);
        this._uButton.cache(false, true);
        this._uPanel.cache(true, true);
    };

    UI_CALENDAR_CLASS.init = function () {
        UI_INPUT_CONTROL_CLASS.init.call(this);
        this.setDate(this._oDate);
        this._uPanel.init();
    };

    UI_CALENDAR_CLASS.clear = function () {
        this.setDate(null);
    };

    UI_CALENDAR_CLASS.setRange = function (begin, end) {
        this._uPanel._uMonthView.setRange(begin, end);
    };

    UI_CALENDAR_CANCEL_CLASS.$click = function () {
        var par = this.getParent(),
            panel = par._uPanel;

        UI_CONTROL_CLASS.$click.call(this);
        par.setDate(null);
    };

    UI_CALENDAR_CANCEL_CLASS.$activate = UI_BUTTON_CLASS.$activate;

    /**
     * Panel
     */
    UI_CALENDAR_PANEL_CLASS.$blur = function () {
        this.hide();
    };

    /**
     * 设置日历面板的日期
     */
    UI_CALENDAR_PANEL_CLASS.setDate = function (date) {
        var year = date != null ? date.getFullYear() : (new Date()).getFullYear(),
            month = date != null ? date.getMonth() + 1 : (new Date()).getMonth() + 1;

        this._uMonthView.$setDate(date);
        this.setView(year, month);
    };

    /**
     * 设置日历面板的展现年月 
     */
    UI_CALENDAR_PANEL_CLASS.setView = function (year, month) {
        var monthSlt = this._uMonthSlt,
            yearSlt = this._uYearSlt,
            monthView = this._uMonthView;

        yearSlt.setValue(year);
        monthSlt.setValue(month);
        monthView.setView(year, month);
    };

    /**
     * 获取当前日历面板视图的年
     */
    UI_CALENDAR_PANEL_CLASS.getViewYear = function () {
        return this._uMonthView.getYear();
    };

    /**
     * 获取当前日历面板视图的月
     */
    UI_CALENDAR_PANEL_CLASS.getViewMonth = function () {
        return this._uMonthView.getMonth();
    };

    UI_CALENDAR_PANEL_CLASS.$cache = function (style, cacheSize) {
        this._uPrvBtn.cache(true, true);
        this._uNxtBtn.cache(true, true);
        this._uMonthSlt.cache(true, true);
        this._uYearSlt.cache(true, true);
        this._uMonthView.cache(true, true);
        UI_CONTROL_CLASS.$cache.call(this, style, cacheSize);
    };

    UI_CALENDAR_PANEL_CLASS.init = function () {
        UI_CONTROL_CLASS.init.call(this);
        this._uMonthSlt.init();
        this._uYearSlt.init();
        this._uMonthView.init();
    };

    UI_CALENDAR_PANEL_CLASS.$change = function (event, date) {
        var par = this.getParent();
        if (triggerEvent(par, 'change', event, [date])) {
            par.setDate(date);
        }
        this.hide();
    };

    UI_CALENDAR_PANEL_SELECT_CLASS.$change = function () {
        var panel = this.getParent(),
            yearSlt = panel._uYearSlt,
            monthSlt = panel._uMonthSlt;

        panel.setView(yearSlt.getValue(), monthSlt.getValue());
    };

    UI_CALENDAR_PANEL_BUTTON_CLASS.$click = function () {
        var step = this._nStep,
            panel = this.getParent(),
            date;

        date = new DATE(panel.getViewYear(), panel.getViewMonth() - 1 + step, 1);
        panel.setView(date.getFullYear(), date.getMonth() + 1);
    };

    UI_CALENDAR_PANEL_MONTHVIEW_CLASS.$change = function (event, date) {
        triggerEvent(this.getParent(), 'change', event, [date]);
    };

})();
