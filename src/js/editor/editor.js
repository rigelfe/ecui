(function () {
    var core = ecui,
        dom = core.dom,
        ui = core.ui,
        string = core.string,
        ext = core.ext,
        util = core.util,

        $create = core.$create,
        $fastCreate = core.$fastCreate,
        getPosition = dom.getPosition,
        children = dom.children,
        createDom = dom.create,
        moveElements = dom.moveElements,
        trim = string.trim,
        encodeHTML = string.encodeHTML,
        decodeHTML = string.decodeHTML,
        getView = util.getView,

        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        setFocused = core.setFocused,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_BUTTON = ui.Button,
    
        EXT_UI_EDITOR = ui.Editor = 
        inheritsControl(
            UI_CONTROL,
            'ui-editor',
            null,
            function (el, options) {
                var editor = EXT_EDITOR_ITEMS[options.type];

                el.innerHTML = editor.innerHTML + 
                    '<div class="ui-button ui-button-g">确定</div><div class="ui-button">取消</div><div style="display:none" class="ui-editor-tip"></div>'
                for (var key in editor) {
                    if ('[object Function]' == Object.prototype.toString.call(editor[key])) {
                        if (key == 'process') {
                            editor[key].call(this);
                        }
                        else {
                            this[key] = editor[key];
                        }
                    }
                }
                el = el.lastChild;
                this._eTip = el;
                this._uCancelBtn = $fastCreate(this.Button, el = el.previousSibling, this, {command: 'cancel'});
                this._uSubmitBtn = $fastCreate(this.Button, el.previousSibling, this, {command: 'submit', primary:'ui-button-g'});
            }
        ),

        EXT_UI_EDITOR_CLASS = EXT_UI_EDITOR.prototype,

        EXT_UI_EDITOR_BUTTON_CLASS = (EXT_UI_EDITOR_CLASS.Button 
                = inheritsControl(UI_BUTTON, null, function (el, options){ this._sCommand = options.command; })).prototype,

        EXT_EDITOR_ITEMS = {},

        EXT_EDITORS = {};


    EXT_UI_EDITOR_CLASS.init = function () {
        this.$hide();
    }

    EXT_UI_EDITOR_CLASS.show = function (con) {
        var pos = getPosition(con),
            view = getView(),
            left = pos.left, top = pos.top;

        // if (options.target.onbeforeedit && !options.target.onbeforeedit(con, options)) {
        //     return;
        // }

        // this._oControl = con;
        // this._oOptions = options;

        // //动态设置值
        // if (this.setDatasource && options.target.ongetdatasource4editor) {
        //     this.setDatasource(options.target.ongetdatasource4editor.call(options.target, options));
        // }

        // this.setValue(value);
        // UI_CONTROL_CLASS.show.call(this);
        // this.resize();
        if (left + this.getWidth() > view.right) {
            left = view.right - this.getWidth();
        }
        if (top + this.getHeight() > view.bottom) {
            top = view.bottom - this.getHeight();
        }
        this.setPosition(left, top);
        this.focus();
    }

    EXT_UI_EDITOR_CLASS.$blur = function () {
        this.hide();
    } 

    EXT_UI_EDITOR_CLASS.onhide = function () {
        this.setError('');
    }

    EXT_UI_EDITOR_CLASS.setError = function (str) {
        str = trim(str);
        this._eTip.innerHTML = str;
        if (str == '') {
            this._eTip.style.display = 'none';
        }
        else {
            this._eTip.style.display = '';
        }
        this.resize();
    }

    EXT_UI_EDITOR_CLASS.$resize = function () {
         var el = this._eMain,
            currStyle = el.style;

        currStyle.width = this._sWidth;
        currStyle.height = this._sHeight;
        this.repaint();
    }

    EXT_UI_EDITOR_BUTTON_CLASS.$click = function () {
        var editor = this.getParent(); //editor
        var value = editor.getValue();
        var options = editor._oOptions;
        var table = editor.getParent();
        var editCell = table.editCell;
        var field = table.editField;
        var e = {};
        var o;
        var txt = editor.getText ? editor.getText() : editor.getValue();

        txt = encodeHTML(txt);

        if (this._sCommand == 'cancel') {
            editor.hide();
        }
        else {
            o = triggerEvent(table, 'editsubmit', e, [value, field]);
            if (o !== false) {
                if ('[object String]' == Object.prototype.toString.call(e.message) && e.message != '') {
                    editor.setError(e.message);
                }
                else {
                    e.value = (e.value !== undefined ? e.value : value);
                    editCell.innerHTML = e.value;
                    editor.setError('');
                    editor.hide();
                }
            }
        }
    }

    function EXT_EDITOR_GET(type) {
        var o;

        if (!EXT_EDITORS[type]) {
            o = document.body.appendChild(createDom(EXT_UI_EDITOR.TYPES));
            o = $create(EXT_UI_EDITOR, {main: o, type: type});
            o.cache();
            o.init();
            EXT_EDITORS[type] = o;
        }

        return EXT_EDITORS[type];
    }

    function ATTACH_CLICK_HANDLER(con, type, options) {
       return function () {
           if (type != 'custom') {
                EXT_EDITOR.edit(con, type, options)
            }
            else {
                (new Function('return ' + options.handle)).call(null).call(null, con, options);
            }
       }
    }

    EXT_EDITOR = ext.editor = function () {};    

    EXT_EDITOR.register = function (type, obj) {
        EXT_EDITOR_ITEMS[type] = obj;
    };

    EXT_EDITOR.init = function (con, type, options) {
        var o = createDom(),
            cssType = con.getTypes()[0],
            el = con.getBody();

        moveElements(el, o, true);
        el.innerHTML = '<div class="'+ cssType +'-editor"><div></div><div class="'+ cssType +'-editor-button"></div></div>';
        el.firstChild.lastChild.onclick = ATTACH_CLICK_HANDLER(con, type, options);
        moveElements(o, el.firstChild.firstChild, true);
        con.$setBody(el.firstChild.firstChild);
        o = null;
    };

    EXT_EDITOR.edit = function (con, type, options) {
        var value, editor;

        if (options.getValue) {
            if ('[object Function]' == Object.prototype.toString.call(options.getValue)) {
                value = options.getValue.call(null, con, options);
            }
            else {
                value = options.getValue;
            }
        }
        else {
            value = decodeHTML(trim(con.getContent()));
        }

        editor = EXT_EDITOR_GET(type);
        editor.show(con, value, options);
        setFocused(editor);
    };

    /*注册编辑器*/
    EXT_EDITOR.register('input', {

        innerHTML : '<input type="text" class="ui-editor-input" />',

        process : function () {
            this._eInput = this.getBody().firstChild;
        },

        focus : function () {
            this._eInput.focus();
        },

        getValue : function () {
            return trim(this._eInput.value);
        },

        setValue : function (value) {
            this._eInput.value = value;
        }
    });

    EXT_EDITOR.register('customSelect', {

        innerHTML : '<select class="ui-editor-select"></select>',

        process : function () {
            this._eSelect = this.getBody().firstChild;
        },

        focus : function () {
            this._eSelect.focus();
        },

        getValue : function () {
            return this._eSelect.options[this._eSelect.selectedIndex].value;
        },

        getText : function () {
            return this._eSelect.options[this._eSelect.selectedIndex].text;
        },

        setValue : function (value) {
            for (var i = 0, item; item = this._eSelect.options[i]; i++) {
                if (item.value == value || item.text == value) {
                    item.selected = true;
                    break;
                }
            }
        },

        setDatasource : function (datasource) {
            var sel = this._eSelect, i, item, o;

            while(sel.options[0]) {
                sel.remove(0);
            }

            for (i = 0; item = datasource[i]; i++) {
                o = createDom('', '', 'option');
                o.text = item.text;
                o.value = item.value;
                try {
                    sel.add(o, null);
                }
                catch(e) {
                    sel.add(o);
                }
            }
        }
    });
})();
