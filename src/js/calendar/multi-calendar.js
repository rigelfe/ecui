(function () {

    var core = ecui,
        dom = core.dom,
        ui = core.ui,
        string = core.string,

        DATE = Date,
        REGEXP = RegExp,
        DOCUMENT = document,

        children = dom.children,
        createDom = dom.create,
        getParent = dom.getParent,
        moveElements = dom.moveElements,
        formatDate = string.formatDate,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
        UI_BUTTON_CLASS = UI_BUTTON.prototype,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,
        UI_CALENDAR = ui.Calendar,
        UI_CALENDAR_CLASS = UI_CALENDAR.prototype,
        UI_CALENDAR_CANCEL_CLASS = UI_CALENDAR_CLASS.Cancel.prototype,
        UI_CALENDAR_PANEL = UI_CALENDAR_CLASS.Panel,

        UI_CALENDAR_STR_DEFAULT = '<span class="ui-calendar-default">请选择一个日期</span>',
        UI_MULTI_CALENDAR_STR_DEFAULT = '<span class="ui-multi-calendar-default">请选择时间范围</span>',
        UI_CALENDAR_STR_PATTERN = 'yyyy-MM-dd';

    /**
     * 初始化日历控件。
     * options 对象支持的属性如下：
     * year    日历控件的年份
     * month   日历控件的月份(1-12)
     * @public
     *
     * @param {Object} options 初始化选项
     */

    var UI_MULTI_CALENDAR = ui.MultiCalendar = 
        inheritsControl(
            UI_CALENDAR,
            'ui-multi-calendar',
            function (el, options) {
                options.hidden = true;
                options.yearRange && (this._nYearRange = options.yearRange - 0);
                if (options.remind) {
                    UI_MULTI_CALENDAR_STR_DEFAULT = '<span class="ui-calendar-default">'
                        + options.remind
                        + '</span>';
                }
            },
            function (el, options) {
                var o = createDom(), els;

                o.innerHTML = '<input type="hidden" name="'+ (options.beginname ? options.beginname : 'beginDate') +'" />'
                    + '<input type="hidden" name="'+ (options.endname ? options.endname : 'endDate') +'" />';
                
                if (options.bdate) {
                    els = options.bdate.split('-');
                    this._oBegin = new Date (els[0], parseInt(els[1], 10) - 1, els[2]);
                }
                if (options.edate) {
                    els = options.edate.split('-');
                    this._oEnd = new Date (els[0], parseInt(els[1], 10) - 1, els[2]);
                }
                els = children(o);    
                this._eBeginInput = els[0];
                this._eEndInput = els[1];

                moveElements(o, el, true);
            }
        );

    var UI_MULTI_CALENDAR_CLASS = UI_MULTI_CALENDAR.prototype;

    var UI_MULTI_CALENDAR_PANEL = UI_MULTI_CALENDAR_CLASS.Panel = 
        inheritsControl(
            UI_CONTROL,
            'ui-multi-calendar-panel',
            function () {},
            function (el, options) {
                var type = this.getTypes()[0],
                    html = [], range = options.range || {};

                this._oRange = range;
                html.push('<div class="'+ type +'-cal-area"><div class="'+ type +'-text"><strong>起始时间：</strong><span></span></div><div class="'+ UI_CALENDAR_PANEL.TYPES +'"></div></div>');
                html.push('<div class="'+ type +'-cal-area"><div class="'+ type +'-text"><strong>结束时间：</strong><span></span></div><div class="'+ UI_CALENDAR_PANEL.TYPES +'"></div></div>');
                html.push('<div class="'+ type +'-buttons"><div class="ui-button-g'+ UI_BUTTON.TYPES +'">确定</div><div class="'+ UI_BUTTON.TYPES +'">取消</div></div>');

                el.innerHTML = html.join('');
                el = children(el);

                this._eBeginText = el[0].firstChild.lastChild;
                this._eEndText = el[1].firstChild.lastChild;
                this._uBeginCal = $fastCreate(this.Cal, el[0].lastChild, this, {range: range});
                this._uBeginCal._sType = 'begin';
                this._uEndCal = $fastCreate(this.Cal, el[1].lastChild, this, {range: range});
                this._uEndCal._sType = 'end';
                this._uSubmitBtn = $fastCreate(this.Button, el[2].firstChild, this);
                this._uSubmitBtn._sType = 'submit';
                this._uCancelBtn = $fastCreate(this.Button, el[2].lastChild, this);
                this._uCancelBtn._sType = 'cancel';
            }
        );

    var UI_MULTI_CALENDAR_CANCEL_CLASS = 
        (UI_MULTI_CALENDAR_CLASS.Cancel = 
            inheritsControl(UI_CALENDAR_CLASS.Cancel)
        ).prototype;

    var UI_MULTI_CALENDAR_PANEL_CLASS = UI_MULTI_CALENDAR_PANEL.prototype;

    var UI_MULTI_CALENDAR_PANEL_CAL_CLASS = (
        UI_MULTI_CALENDAR_PANEL_CLASS.Cal = 
            inheritsControl(UI_CALENDAR_PANEL)
        ).prototype;

    var UI_MULTI_CALENDAR_PANEL_BUTTON_CLASS = 
        (UI_MULTI_CALENDAR_PANEL_CLASS.Button = 
            inheritsControl(UI_BUTTON)
        ).prototype;
    
    function UI_MULTI_CALENDAR_TEXT_FLUSH(con) {
        var el = con._eText;
        if (el.innerHTML == '') {
            con._uCancel.hide();
            if (con._bTip) {
                el.innerHTML = UI_MULTI_CALENDAR_STR_DEFAULT;
            }
        }
        else {
            con._uCancel.show();
        }
    };

    UI_MULTI_CALENDAR_CLASS.init = function () {
        UI_INPUT_CONTROL_CLASS.init.call(this);
        this.setDate({begin: this._oBegin, end: this._oEnd});
        this._uPanel.init();
    };

    UI_MULTI_CALENDAR_CLASS.setDate = function (date) {
        var str = [], beginTxt, endTxt;

        if (date == null) {
            date = {begin: null, end: null};
        }

        beginTxt = date.begin ? formatDate(date.begin, UI_CALENDAR_STR_PATTERN) : '';
        endTxt = date.end ? formatDate(date.end, UI_CALENDAR_STR_PATTERN) : '';

        this._oBegin = date.begin;    
        this._oEnd = date.end;
        this._eBeginInput.value = beginTxt;
        this._eEndInput.value = endTxt;
        this._eInput.value = beginTxt + ',' + endTxt;
        if (this._oBegin) {
            str.push(beginTxt);
        }
        if (this._oEnd) {
            str.push(endTxt);
        }
        if (str.length == 1) {
            str.push(this._oEnd ? '之前' : '之后');
            str = str.join('');
        }
        else if (str.length == 2) {
            str = str.join('至');
        }
        else {
            str = '';
        }
        this._eText.innerHTML = str;
        UI_MULTI_CALENDAR_TEXT_FLUSH(this);
    };

    UI_MULTI_CALENDAR_CLASS.getDate = function () {
        return {begin: this._oBegin, end: this._oEnd};
    };

    /**
     * @event
     * 点击输入框右侧的取消按钮时触发
     */
    UI_MULTI_CALENDAR_CANCEL_CLASS.$click = function() {
        var par = this.getParent();
        UI_CALENDAR_CANCEL_CLASS.$click.call(this);
        par.clearRange();
    };

    /**
     * 清除日历面板的range限制
     * @public
     */
    UI_MULTI_CALENDAR_CLASS.clearRange = function() {
        this._uPanel._oRange.begin = null;
        this._uPanel._oRange.end = null;
        this._uPanel._uBeginCal.setRange(null, null);
        this._uPanel._uEndCal.setRange(null, null);
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.setDate = function (date) {
        var range = this._oRange, 
            begin, end;

        this._oBeginDate = date.begin;
        this._oEndDate = date.end;

        if (date.begin) {
            this._eBeginText.innerHTML = formatDate(date.begin, UI_CALENDAR_STR_PATTERN);
        }
        else {
            this._eBeginText.innerHTML = '';
        }

        if (date.end) {
            this._eEndText.innerHTML = formatDate(date.end, UI_CALENDAR_STR_PATTERN);
        }
        else {
            this._eEndText.innerHTML = '';
        }

        end = range.end ? range.end : date.end;
        if (range.end && date.end && date.end.getTime() < range.end.getTime()) {
                end =  date.end;
        }
        this._uBeginCal.setRange(range.begin, end, true);
        this._uBeginCal.setDate(date.begin);

        begin = range.begin ? range.begin : date.begin;
        if (range.begin && date.begin && date.begin.getTime() > range.begin.getTime()) {
                begin =  date.begin;
        }
        this._uEndCal.setRange(begin, range.end, true);
        this._uEndCal.setDate(date.end);
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.$blur = function () {
        UI_CONTROL_CLASS.$blur.call(this);
        this.hide();
    };

    /**
     * 隐藏日历面板，隐藏时需要调整range
     * @override
     */
    UI_MULTI_CALENDAR_PANEL_CLASS.hide = function (){
        UI_CONTROL_CLASS.hide.call(this);
        var par = this.getParent();
        var date = par.getDate();

        if (par._nYearRange) {
            if (date.end) {
                this._oRange.begin = new Date(date.end);
                this._oRange.begin.setFullYear(
                    this._oRange.begin.getFullYear() - par._nYearRange
                );
            }
            if (date.begin) {
                this._oRange.end = new Date(date.begin);
                this._oRange.end.setFullYear(
                    this._oRange.end.getFullYear() + par._nYearRange
                );
            }
        }
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.init = function () {
        UI_CONTROL_CLASS.init.call(this);
        this._uBeginCal.init();
        this._uEndCal.init();
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.$change = function () {
        var par = this.getParent(),
            beginDate = this._oBeginDate,
            endDate = this._oEndDate;

        if (triggerEvent(par, 'change', [beginDate, endDate])) {
            par.setDate({begin: beginDate, end: endDate});
        }
        this.hide();
    };

    UI_MULTI_CALENDAR_PANEL_CLASS.$setDate = function (date, type) {
        var key = type.charAt(0).toUpperCase() 
                + type.substring(1);

        var par = this.getParent();

        this['_e' + key + 'Text'].innerHTML = formatDate(date, UI_CALENDAR_STR_PATTERN);
        this['_o' + key + 'Date'] = date;
        if (type == 'begin') {
            if (par._nYearRange) {
                this._oRange.end = new Date(date);
                this._oRange.end.setFullYear(this._oRange.end.getFullYear() + par._nYearRange);
            }
            this._uEndCal.setRange(date, this._oRange.end);
        }
        else {
            if (par._nYearRange) {
                this._oRange.begin = new Date(date);
                this._oRange.begin.setFullYear(this._oRange.begin.getFullYear() - par._nYearRange);
            }
            this._uBeginCal.setRange(this._oRange.begin, date);
        }
    };

    UI_MULTI_CALENDAR_PANEL_CAL_CLASS.$blur = function () {
        UI_CONTROL_CLASS.$blur.call(this);
    };

    UI_MULTI_CALENDAR_PANEL_CAL_CLASS.$change = function (event, date) {
        var par = this.getParent();

        this._oDateSel = date;
        par.$setDate(date, this._sType);
    };

    UI_MULTI_CALENDAR_PANEL_CAL_CLASS.setRange = function (begin, end, isSilent) {
        this._uMonthView.setRange(begin, end, isSilent);
    };

    UI_MULTI_CALENDAR_PANEL_BUTTON_CLASS.$click = function () {
        var par = this.getParent();
        UI_BUTTON_CLASS.$click.call(this);
        if (this._sType == 'submit') {
            triggerEvent(par, 'change');
        }
        else {
            par.hide();
        }
    };
})();
