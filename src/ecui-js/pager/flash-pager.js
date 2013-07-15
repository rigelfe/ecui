/**
 * @file 工作台首页订制的分页控件,只满足简单分页需求
 * @author hades(denghongqi@gmail.com)
 */

(function() {
    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        util = core.util,

        $fastcreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        createDom = dom.create,
        children = dom.children,
        setStyle = dom.setStyle,
        addClass = dom.addClass,
        removeClass = dom.removeClass,
        extend = util.extend,
        blank = util.blank,

        MATH = Math,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_ITEM = ui.Item,
        UI_ITEM_CLASS = UI_ITEM.prototype,
        UI_ITEMS = ui.Items;

    var UI_FLASH_PAGER = ui.FlashPager =
        inheritsControl(
            UI_CONTROL,
            'ui-flash-pager',
            function(el, options) {
                var type = this.getTypes()[0];
                setStyle(el, 'display', 'inline-block');
                el.innerHTML = '<span class="' + type + '-pre" style="'
                    + 'display:inline-block">&lt;</span>'
                    + '<span class="' + type + '-items" style="'
                    + 'display:inline-block">'
                    + '<span ecui="value:1">1</span>'
                    + '<span ecui="value:2">2</span>'
                    + '<span ecui="value:3">3</span>'
                    + '</span>'
                    + '<span class="' + type + '-next" style="'
                    + 'display:inline-block">&gt;</span>';
            },
            function(el, options) {
                this._nPage = options.page - 0 || 1;
                this._nTotal = options.total - 0 || 100;
                this._nPagesize = options.pagesize - 0 || 10;
                this._nMaxShow = options.maxShow - 0 || 3;
                el = children(el);

                this._uPre = $fastcreate(
                    this.Pre, 
                    el[0], 
                    this, 
                    {userSelect:false}
                );
                this._uNext = $fastcreate(
                    this.Next, 
                    el[2], 
                    this, 
                    {userSelect:false}
                );
                this.$setBody(el[1]);
                this.$initItems();
                flushPager(this, this._nPage);
                //this.render();
            }
        );

    var UI_FLASH_PAGER_CLASS = UI_FLASH_PAGER.prototype;

    /**
     * @public
     */
    UI_FLASH_PAGER_CLASS.getValue = function() {
        if (this._cSelected) {
            return this._cSelected.$getValue();
        }
        else {
            return null;
        }
    };

    /**
     * 渲染分页控件
     * @public
     * @param {number} page 当前页
     * @param {number} total 总数
     * @param {number} pagesize 每页条数
     */
    UI_FLASH_PAGER_CLASS.render = function(page, total, pagesize) {
        this._nPage = page || 1;
        this._nTotal = total || 0;
        this._nPagesize = pagesize || 10;
        flushPager(this, this._nPage);
    }

    UI_FLASH_PAGER_CLASS.Pre = inheritsControl(UI_CONTROL);
    var UI_FLASH_PAGER_PRE_CLASS = UI_FLASH_PAGER_CLASS.Pre.prototype;

    UI_FLASH_PAGER_CLASS.Next = inheritsControl(UI_CONTROL);
    var UI_FLASH_PAGER_NEXT_CLASS = UI_FLASH_PAGER_CLASS.Next.prototype;

    /**
     * @event
     */
    UI_FLASH_PAGER_PRE_CLASS.$click = function() {
        var par = this.getParent();
        var value = par.getValue() - 1;
        flushPager(par, value);
    };

    /**
     * @event
     */
    UI_FLASH_PAGER_NEXT_CLASS.$click = function() {
        var par = this.getParent();
        var value = par.getValue() + 1;
        flushPager(par, value);
    };

    /**
     * 刷新分页页码items
     * @param {ecui.ui.FlashPager} control
     */
    function flushPager(control, value) {
        control._nTotalPage = MATH.ceil(control._nTotal / control._nPagesize);

        if (control._nTotalPage < control.getItems().length) {
            for (var i = 0; i < control._nMaxShow - control._nTotalPage; i++) {
                var items = control.getItems();
                control.remove(items[items.length - 1]);
            }
        }

        if (control._nTotalPage <= 1) {
            control.hide();
            return ;
        }

        var items = control.getItems();
        var start = items[0].$getValue();
        var end = items[items.length - 1].$getValue();

        if (value <= 1) {
            value = 1;
            control._uPre.disable();
        }
        else {
            control._uPre.enable();
        }

        if (value >= control._nTotalPage) {
            value = control._nTotalPage;
            control._uNext.disable();
        }
        else {
            control._uNext.enable();
        }

        if (value < start) {
            start = value;
            end = value + items.length;
        }
        else if (value > end) {
            end = value;
            start = end - items.length + 1;
        }

        for (var i = 0; i < items.length; i++) {
            var o = items[i];
            o.$setValue(i + start);
            if (value == o.$getValue()) {
                o.$setSelected();
            }
        }
    };

    UI_FLASH_PAGER_CLASS.Item = inheritsControl(
        UI_CONTROL,
        null,
        function(el, options) {
            options.userSelect = false;
        },
        function(el, options) {
            this._nValue = options.value;
        }
    );
    var UI_FLASH_PAGER_ITEM_CLASS = UI_FLASH_PAGER_CLASS.Item.prototype;
    extend(UI_FLASH_PAGER_CLASS, UI_ITEMS);

    UI_FLASH_PAGER_CLASS.$alterItems = blank;

    /**
     * @event
     */
    UI_FLASH_PAGER_ITEM_CLASS.$click = function() {
        var par = this.getParent();
        var value = this.$getValue();
        flushPager(par, value);
    };

    /**
     * 页码item被选中时触发
     * @private
     */
    UI_FLASH_PAGER_ITEM_CLASS.$setSelected = function() {
        var par = this.getParent();
        if (par._nValue == this.$getValue()) {
            return ;
        }
        else {
            if (par._cSelected) {
                removeClass(
                    par._cSelected.getOuter(), 
                    'ui-flash-pager-item-selected'
                );
            }
            addClass(this.getOuter(), 'ui-flash-pager-item-selected');
            par._cSelected = this;
            par._nValue = this.$getValue();
            triggerEvent(par, 'change', null, [par.getValue()]);
        }
    };

    /**
     * @private
     * @param {number} value
     */
    UI_FLASH_PAGER_ITEM_CLASS.$setValue = function(value) {
        this._nValue = value;
        this._sName = value;
        this.setContent(this._sName);
    };

    /**
     * @private
     */
    UI_FLASH_PAGER_ITEM_CLASS.$getValue = function() {
        return this._nValue;
    };
}) ();