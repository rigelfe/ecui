/**
 * query-tab
 * 
 * path:    query-tab.js
 * desc:    查询类型tab
 * author:  treelite(treelite@gmail.com)
 * date:    2012/03/12
 */
(function () {
    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        string = core.string,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        getOptions = core.getOptions,
        children = dom.children,
        createDom = dom.create,
        trim = string.trim,

        UI_CONTROL = ui.Control,
        UI_TIP = ui.PsTip,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_RADIO = ui.Radio,
        UI_RADIO_CLASS = UI_RADIO.prototype;

    var UI_QUERY_TAB = ui.QueryTab = 
        inheritsControl(
            UI_CONTROL,
            'ui-query-tab',
            null,
            function (el, options) {
                var childs = children(el),
                    type = this.getTypes()[0],
                    i, item, value = options.value;

                this._aItems = [];
                
                for (i = 0; item = childs[i]; i++) {
                    item.className = trim(item.className) + ' ' + type + '-item' + UI_RADIO.TYPES;
                    this._aItems[i] = $fastCreate(this.Item, item, this, getOptions(item));
                    if (value && value == this._aItems[i].getValue()) {
                        this._aItems[i].setChecked(true);
                        this._oCurChecked = this._aItems[i];
                    }
                }
            }
        ),

        UI_QUERY_TAB_CLASS = UI_QUERY_TAB.prototype,
        UI_QUERY_TAB_ITEM = UI_QUERY_TAB_CLASS.Item =
        inheritsControl(
            UI_RADIO, 
            'ui-query-tab-item', 
            null,
            function (el, options) {
                var o;
                if (options.tip) {
                    o = createDom('ui-tip', '', 'span');
                    el.appendChild(o);
                    this._uTip = $fastCreate(UI_TIP, o, this, {target: options.tip});
                }
            }
        ),
        UI_QUERY_TAB_ITEM_CLASS = UI_QUERY_TAB_ITEM.prototype;

    UI_QUERY_TAB_ITEM_CLASS.$click = function () {
        var par = this.getParent(),
            curChecked = par._oCurChecked;
        UI_RADIO_CLASS.$click.call(this);
        if (curChecked && curChecked != this) {
            par._oCurChecked = this;
            triggerEvent(this.getParent(), 'change', null, [this.getValue()]);
        }
    };

    /* override */
    UI_QUERY_TAB_ITEM_CLASS.getItems = function () {
        return this.getParent().getItems();
    };

    UI_QUERY_TAB_CLASS.getItems = function () {
        return this._aItems.slice();
    };

    UI_QUERY_TAB_CLASS.getValue = function () {
        return this._oCurChecked ? this._oCurChecked.getValue() : null;
    };

    UI_QUERY_TAB_CLASS.setValue = function (value) {
        for (var i = 0, item; item = this._aItems[i]; i++) {
            if (item.getValue() == value) {
                item.setChecked(true);
                this._oCurChecked = item;
            }
        }
    };
})();
