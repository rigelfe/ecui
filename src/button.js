/**
 * @file
 * Button - 定义按钮的基本操作。
 * 按钮控件，继承自基础控件，屏蔽了激活状态的向上冒泡，
 * 并且在激活(active)状态下鼠标移出控件区域会失去激活样式，
 * 移入控件区域再次获得激活样式，按钮控件中的文字不可以被选中。
 *
 * 按钮控件直接HTML初始化的例子:
 * @example
 *  &lt;div ecui="type:button"&gt
 *    &lt;!-- 这里放按钮的文字 --&gt
 *    ...
 *  &lt;/div&gt
 *  或
 *  &lt;button ecui="type:button"&gt
 *    &lt;!-- 这里放按钮的文字 --&gt
 *    ...
 *  &lt;/button&gt
 *  或
 *  &lt;input ecui="type:button" value="按钮文字" type="button"&gt
 *
 * @author Ryan Asleson
 * @version 1.0
 */
(function () {

    var core = ecui,
        dom = core.dom,
        ui = core.ui,
        util = core.util,

        setText = dom.setText,
        setDefault = util.setDefault,

        inheritsControl = core.inherits,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype;

    var UI_BUTTON = ui.Button =
        inheritsControl(
            UI_CONTROL,
            'ui-button',
            function (el, options) {
                setDefault(options, 'userSelect', false);
                if (options.text) {
                    setText(el, options.text);
                }
            }
        ),

        /**
         * 初始化基础控件
         *
         * @extends module:UI_CONTROL_CLASS
         * @requires UI_CONTROL_CLASS
         * @exports UI_BUTTON_CLASS
         *
         * @property {Object} options 初始化选项
         * @property {string} options.text 按钮的文字
         */
        UI_BUTTON_CLASS = UI_BUTTON.prototype;

    /**
     * 按钮控件获得激活时需要阻止事件的冒泡。
     */
    UI_BUTTON_CLASS.$activate = function (event) {
        UI_CONTROL_CLASS.$activate.call(this, event);
        event.stopPropagation();
    };

    /**
     * 如果控件处于激活状态，移除状态样式 -active，移除状态样式不失去激活状态。
     */
    UI_BUTTON_CLASS.$mouseout = function (event) {
        UI_CONTROL_CLASS.$mouseout.call(this, event);
        if (this.isActived()) {
            this.alterClass('-active');
        }
    };

    /**
     * 如果控件处于激活状态，添加状态样式 -active。
     */
    UI_BUTTON_CLASS.$mouseover = function (event) {
        UI_CONTROL_CLASS.$mouseover.call(this, event);
        if (this.isActived()) {
            this.alterClass('+active');
        }
    };

    /**
     * 设置控件的文字。
     *
     * @public
     *
     * @param {string} text 控件的文字
     */
    UI_BUTTON_CLASS.setText = function (text) {
        setText(this.getBody(), text);
    };
})();
