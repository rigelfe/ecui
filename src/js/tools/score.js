/**
 * score
 * 
 * path:    score.js
 * desc:    评分控件
 * author:  treelite(treelite@gmail.com)
 * date:    2012/03/22
 *
 * params:
 *      {Number} max 最大的分值，默认5
 *      {Number} value 初始化分值, 默认0
        {Boolean} static 是否是静态的
 */
(function () {

    var core = ecui,
        ui = core.ui,
        util = core.util,

        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        blank = util.blank,
        extend = util.extend,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_ITEMS = ui.Items,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype;

    var UI_SCORE = ui.Score = 
            inheritsControl(
                UI_INPUT_CONTROL,
                'ui-score',
                function (el, options) {
                    var max = options.max = options.max || 5,
                        html = [], i;

                    options.hidden = true;
                    options.value = options.value || 0;
                    for (i = 1; i <= max; i++) {
                        html.push('<span ecui="score:'+ i +'"></span>');
                    }
                    el.innerHTML = html.join('');
                },
                function (el, options) {
                    this._bStatic = (options['static'] === true);
                    this.$initItems(); 
                }
            ),
        UI_SCORE_CLASS = UI_SCORE.prototype,

        UI_SCORE_ITEM = UI_SCORE_CLASS.Item = inheritsControl(
            UI_CONTROL, 
            'ui-score-item',
            function (el, options) {
                options.resizable = false;
            },
            function (el, options) {
                this._nScore = options.score;
            }
        ),
        UI_SCORE_ITEM_CLASS = UI_SCORE_ITEM.prototype;

    extend(UI_SCORE_CLASS, UI_ITEMS);

    /**
     * @override
     */
    UI_SCORE_CLASS.init = function () {
        UI_INPUT_CONTROL_CLASS.init.call(this);
        this.$score(this.getValue());
    }

    /**
     * 标记评分
     * @private
     * 
     * @param <Number> score 需要标记的分值
     */
    UI_SCORE_CLASS.$score = function(score) {
        var items = this.getItems(),
            i, item;

        score = score || this.getValue(); 
        for (i = 0; item = items[i]; i++) {
            item.alterClass(i < score ? '+marked' : '-marked');
        }
    };

    /**
     * @override
     */
    UI_SCORE_CLASS.setValue = function (value) {
        UI_INPUT_CONTROL_CLASS.setValue.call(this, value);
        this.$score(value);
    };

    /**
     * @override
     */
    UI_SCORE_CLASS.$alterItems = blank;

    /**
     * 得到图标对应的分值
     * @public
     *
     * @return {Number} 分值
     */
    UI_SCORE_ITEM_CLASS.getScore = function () {
        return this._nScore;
    };

    /*
     * @override
     */
    UI_SCORE_ITEM_CLASS.$click = function (event) {
        if (!this.getParent()._bStatic) {
            this.getParent().setValue(this.getScore());
            UI_INPUT_CONTROL_CLASS.$click.call(this);
        }
    };

    /**
     * @override
     */
    UI_SCORE_ITEM_CLASS.$mouseout = function () {
        if (!this.getParent()._bStatic) {
            this.getParent().$score();
            UI_CONTROL_CLASS.$mouseout.call(this);
        }
    };

    /**
     * @override
     */
    UI_SCORE_ITEM_CLASS.$mouseover = function () {
        if (!this.getParent()._bStatic) {
            this.getParent().$score(this.getScore());
            UI_CONTROL_CLASS.$mouseover.call(this);
        }
    };

    /**
     * @override
     */
    UI_SCORE_ITEM_CLASS.$setSize = blank;
})();
