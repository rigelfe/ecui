/**
 * message-bar
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * path:    message-bar.js
 * desc:    系统消息控件
 * author:  treelite(c.xinle@gmail.com)
 * date:    2012/03/20
 */
(function () {

    var core = ecui,
        ui = core.ui,
        dom = core.dom,
        util = core.util,
        string = core.string,

        DOCUMENT = document,
        
        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        moveElements = dom.moveElements,
        getPosition = dom.getPosition,
        createDom = dom.create,
        children = dom.children,
        extend = util.extend,
        blank = util.blank,
        getByteLength = function (str) {
            return string.getByteLength(str, 'gbk');
        },
        sliceByte = function (str, length) {
            return string.sliceByte(str, length, 'gbk');
        },

        UI_CONTORL = ui.Control,
        UI_CONTORL_CLASS = UI_CONTORL.prototype,
        UI_ITEMS = ui.Items,

        UI_MESSAGE_BAR = ui.MessageBar = inheritsControl(
            UI_CONTORL,
            'ui-message-bar',
            function (el, options) {
                var o = createDom('', '', 'ul'),
                    type = this.getTypes()[0];

                moveElements(el, o, true);
                el.innerHTML = '<div class="'+ type +'-title"><span class="'+ type +'-title-icon"></span>系统消息</div><div class="'+ type +'-scroll-msg" style="display:none"><div class="'+ type +'-scroll-msg-inner" style="top:0px;left:0px">&nbsp;</div></div>';
                el.appendChild(o);
            },
            function (el, options) {
                BODY = DOCUMENT.body;

                var o = createDom('', 'display:none;position:absolute');

                this._nPIndex = 0;
                this._nSec = options.sec || 5000;
                this._nMaxLen = options.maxlength || 70;

                o.appendChild(el.lastChild);
                o.className = 'ui-message-bar-layer';
                BODY.appendChild(o);
                el = children(el);
                this.$setBody(o.firstChild);
                this._eScollMsg = el[1].firstChild;
                this._uLayer = $fastCreate(this.Layer, o, this);
                this.$initItems();
            }
        ),

        UI_MESSAGE_BAR_CLASS = UI_MESSAGE_BAR.prototype,
        UI_MESSAGE_BAR_LAYER = UI_MESSAGE_BAR_CLASS.Layer = inheritsControl(UI_CONTORL, 'ui-message-bar-layer'),
        UI_MESSAGE_BAR_LAYER_CLASS = UI_MESSAGE_BAR_LAYER.prototype;

    extend(UI_MESSAGE_BAR_CLASS, UI_ITEMS);

    /**
     * 切换消息动画
     * @private
     */
    function UI_MESSAGE_BAR_ANIMATE(con, height, nextText) {
        var el = con._eScollMsg;
        if (parseInt(el.style.top, 10) <= -height) {
            el.innerHTML = nextText;
            el.style.top = '0px';
            if (con._oTimer !== null) {
                con._oTimer = setTimeout(function () {
                    con.$play();
                }, con._nSec);
            }
        }
        else {
            el.style.top = (parseInt(el.style.top, 10) - 3) + 'px';
            setTimeout(function () {
                UI_MESSAGE_BAR_ANIMATE(con, height, nextText);
            }, 100);
        }
    }

    /**
     * 按长度截断文字并添加...
     * @private
     */
    function UI_MESSAGE_BAR_MSG(str, maxlen) {
        if (getByteLength(str) > maxlen) {
            str = sliceByte(str, maxlen - 2) + '...';
        }
        return str;
    }

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.init = function () {
        var items = this.getItems();

        UI_CONTORL_CLASS.init.call(this);
        UI_CONTORL_CLASS.init.call(this._uLayer);
        this.$alterItems();
        this.play();
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.$mouseover = function () {
        var layer = this._uLayer,
            pos;

        if (this.getItems().length > 0) {
            pos = getPosition(this.getOuter());
            layer.show();
            layer.setPosition(pos.left, pos.top + this.getHeight());
            UI_CONTORL_CLASS.$activate.call(this);
            this.alterClass('+expend');
        }
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.$mouseout = function () {
        this._uLayer.hide();
        this.alterClass('-expend');
    };

    /**
     * 开始消息循环轮换
     * 多次调用不会造成重入
     * @public
     */
    UI_MESSAGE_BAR_CLASS.play = function () {
        var me = this;
        if (this._oTimer) {
            return;
        }
        else {
            this._oTimer = setTimeout(function () {
                me.$play();
            }, this._nSec);
        }
    };

    /**
     * 消息循环轮换
     * 会判断如果只有一条消息则不会进行轮换
     * @private
     */
    UI_MESSAGE_BAR_CLASS.$play = function () {
        var items = this.getItems(), item,
            height = this._eScollMsg.offsetHeight,
            me = this, str;

        if (items.length > 1) {
            this._nPIndex = (this._nPIndex + 1) % items.length;
            item = items[this._nPIndex];
            str = UI_MESSAGE_BAR_MSG(item.getContent(), this._nMaxLen);
            this._eScollMsg.innerHTML += '<br />' + str;
            UI_MESSAGE_BAR_ANIMATE(this, height, str);
        }
        else if (items.length == 1) {
            this._eScollMsg.innerHTML = UI_MESSAGE_BAR_MSG(items[0].getContent(), this._nMaxLen);
            this._oTimer = null;
        }
    };

    /**
     * 停止消息循环轮换
     * @public
     */
    UI_MESSAGE_BAR_CLASS.stop = function () {
        clearTimeout(this._oTimer);
        this._oTimer = null;
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_LAYER_CLASS.$setSize = function () {
        var par = this.getParent();
        UI_CONTORL_CLASS.$setSize.call(this, par.getWidth());
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.add = function (item, index, options) {
        var str, o;

        if ('string' == typeof item) {
            o = createDom('', '', 'li');
            o.innerHTML = item;
            this.getBody().appendChild(o);
        }
        else {
            o = item;
        }
        item = UI_ITEMS.add.call(this, o, index, options);
        item.getOuter().style.overflow = '';
        return item;
    };

    /**
     * @override
     */
    UI_MESSAGE_BAR_CLASS.$alterItems = function () {
        var items = this.getItems(),
            el = this._eScollMsg;

        if (items.length > 0) {
            el.parentNode.style.display = '';
            if (el.innerHTML == '&nbsp;') {
                el.innerHTML = UI_MESSAGE_BAR_MSG(this.getItems()[0].getContent(), this._nMaxLen);
                this._nPIndex = 0;
            }
            this.play();
        }
        else {
            el.parentNode.style.display = 'none';
            el.innerHTML = '&nbsp';
            this.stop();
        }
    };
})();
