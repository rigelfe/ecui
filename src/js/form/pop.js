(function () {
    var core = ecui,
        array = core.array,
        dom = core.dom,
        ui = core.ui,
        util = core.util,
        string = core.string,

        $fastCreate = core.$fastCreate,
        setFocused = core.setFocused,
        createDom = dom.create,
        children = dom.children,
        moveElements = dom.moveElements,
        getPosition  = dom.getPosition,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        getView = util.getView,
        blank = util.blan,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
        UI_BUTTON_CLASS = UI_BUTTON.prototype;

    var UI_POP = ui.Pop = 
        inheritsControl(
            UI_CONTROL,
            'ui-pop',
            null,
            function (el, options) {
                var type = this.getTypes()[0],
                    o = createDom(), els;

                el.style.position = 'absolute';

                if (options.noButton !== true) {
                    o.innerHTML = '<div class="'+ type +'-buttons"><div class="ui-button ui-button-g">确定</div><div class="ui-button">取消</div></div>';
                    els = children(o.firstChild);
                    this._uSubmitBtn = $fastCreate(this.Button, els[0], this, {command: 'submit', primary:'ui-button-g'});
                    this._uCancelBtn = $fastCreate(this.Button, els[1], this, {command: 'cancel'});
                    moveElements(o, el, true);
                }
            }
        ),

        UI_POP_CLASS = UI_POP.prototype;

        UI_POP_BTN = UI_POP_CLASS.Button = 
        inheritsControl(
            UI_BUTTON,
            null,
            function (el, options) {
                this._sCommand = options.command;
            }
        ),

        UI_POP_BTN_CLASS = UI_POP_BTN.prototype;

    UI_POP_CLASS.show = function (con, align) {
        var view = getView(),
            h, w,
            pos = getPosition(con.getOuter());

        UI_CONTROL_CLASS.show.call(this);
        this.resize();
        w = this.getWidth();
        h = con.getHeight() + pos.top;
        if (!align && align == 'left') {
            if (pos.left + w > view.right) {
                w = pos.left + con.getWidth() - w;
            }
            else {
                w = pos.left;
            }
        }
        else {
            if (pos.left + con.getWidth() - w < 0) {
                w = pos.left;
            }
            else {
                w = pos.left + con.getWidth() - w;
            }
        }

        if (h + this.getHeight() > view.bottom) {
            h = view.bottom - this.getHeight();
        }

        var o = this.getOuter().offsetParent;
        if (!o || (o.tagName !== 'BODY' && o.tagName !== 'HTML')) {
            var parPos = getPosition(this.getOuter().offsetParent);
            w = w - parPos.left;
            h = h - parPos.top;
        }
        this.setPosition(w, h);
        setFocused(this);
    };

    UI_POP_CLASS.$resize = function () {
         var el = this._eMain,
            currStyle = el.style;

        currStyle.width = this._sWidth;
        currStyle.height = this._sHeight;
        this.repaint();
    }

    UI_POP_CLASS.init = function () {
        UI_CONTROL_CLASS.init.call(this);
        this.$hide();
    };

    UI_POP_CLASS.$blur = function () {
        this.hide();
        triggerEvent(this, 'cancel');
    };

    UI_POP_BTN_CLASS.$click = function () {
        var par = this.getParent();
        UI_BUTTON_CLASS.$click.call(this);
        if (triggerEvent(par, this._sCommand)) {
            par.$blur = blank;
            par.hide();
            delete par.$blur;
        }
    };

    var UI_POP_BUTTON = ui.PopButton = 
        inheritsControl(
            UI_BUTTON,
            'ui-pop-button',
            function (el, options) {
                var type = this.getTypes()[0],
                    o = createDom(type + '-icon', 'position:absolute');

                this._sAlign = options.align;
                el.appendChild(o);
                this._sTargetId = options.target;
            },
            function (el, options) {
                var type = this.getTypes()[0];

                if (options.mode == 'text') {
                    this.setClass(type + '-text');
                }
            }
        ),

        UI_POP_BUTTON_CLASS = UI_POP_BUTTON.prototype;

    UI_POP_BUTTON_CLASS.$click = function () {
        var con;
        UI_BUTTON_CLASS.$click.call(this);
        if (this._sTargetId) {
            con = core.get(this._sTargetId);
            con.show(this, this._sAlign);
        }
    };
})();
