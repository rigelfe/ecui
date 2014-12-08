/**
 * cascade-select.js
 *
 * desc: 级联下拉菜单
 * author: hades(denghongqi@gmail.com)
 */

 (function () {
    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        string = core.string,
        util = core.util,

        $fastcreate = core.$fastcreate,
        $connect = core.$connect,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        encodeHTML = string.encodeHTML,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_SELECT = ui.Select,
        UI_SELECT_CLASS = UI_SELECT.prototype,

        UI_CASCADE_SELECT = ui.CascadeSelect = inheritsControl(
            UI_SELECT,
            null,
            function (el, options) {},
            function (el, options) {
                this._bTarget = options.target;
                $connect(this, function (target) {
                    this._cTarget = target;
                }, this._bTarget);
            }
        ),
        UI_CASCADE_SELECT_CLASS = UI_CASCADE_SELECT.prototype;

    UI_CASCADE_SELECT_CLASS.$change = function () {
        UI_SELECT_CLASS.$click.call(this);
        var target = this._cTarget;
        var nowValue = this.getValue();
        triggerEvent(target, 'loaddata', function (options, value) {
            var control = target;
            control.clear();
            for (var i = 0, o; o = options[i]; i++) {
                control.add(o.text, null, {value : o.value});
            } 
            if(value) {
                control.setValue(value);
            }
            else {
                control.setSelectedIndex(0);
            }
        }, [nowValue]);
    };

 }) ();
