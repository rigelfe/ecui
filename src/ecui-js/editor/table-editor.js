(function () {
    var core = ecui,
        dom = core.dom,
        ui = core.ui,
        string = core.string,
        ext = core.ext,
        util = core.util,

        $create = core.$create,
        $fastCreate = core.$fastCreate,
        children = dom.children,
        getPosition = dom.getPosition,
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
        UI_BUTTON_CLASS = UI_BUTTON.prototype,
        UI_INPUT = ui.Input,
        UI_INPUT_CLASS = UI_INPUT.prototype,
        UI_SELECT = ui.Select,
        UI_SELECT_CLASS = UI_SELECT.prototype,
        UI_ITEM = ui.Item,
        UI_ITEM_CLASS = UI_ITEM.prototype;


    var UI_TABLE_EDITOR = ui.TableEditor = 
        inheritsControl(
            UI_CONTROL,
            'ui-table-editor',
            function (el, options) {
                var html = null;
                if (options.type != 'url') {
                    html = '<div class="ui-' + options.type + '"></div>';
                }
                else {
                    html = [
                            '<div class="ui-select" style="width:62px">',
                            '</div>',
                            '<div class="ui-input" style="margin-left:1px"></div>',
                            '<div class="ui-input" style="width:60px;margin-left:1px"></div>'
                            ].join('');
                }
                el.innerHTML = html;
            },
            function (el, options) {
                var me = this;
                var childs = children(el);
                if (options.type == 'input') {
                    me._uInput = $fastCreate(UI_INPUT, childs[0], this, {});

                }
                else if (options.type == 'select') {
                    me._uSelect = $fastCreate(UI_SELECT, childs[0], this, {});

                }
                else if (options.type == 'url') {
                    me._uFront = $fastCreate(UI_SELECT, childs[0], this, {});
                    me._uFront.setSize(62, 22);
                    me._uRoot = $fastCreate(UI_INPUT, childs[1], this, {});
                    me._uRoot.setSize(100, 22);

                    me._uPath = $fastCreate(UI_INPUT, childs[2], this, {});
                    me._uPath.setSize(60, 22);

                }

                if (options.type == 'select' || options.type == 'input') {
                    
                    var control = me._uInput || me._uSelect;
                    function triggerConnectEvent(control, rowData) {
                        triggerEvent(control, 'change', null, [control.getInnerControl(), control.target && control.target.getInnerControl(), rowData]);
                        if(control.target) {
                            triggerConnectEvent(control.target);
                        }
                    }

                    control.onchange = function() {
                        var rowData = me.rowData;
                        triggerConnectEvent(me, rowData);
                    }
                }
                else {
                    me._uFront.onchange = me._uRoot.onchange = me._uPath.onchange = function () {
                        var rowData = me.rowData;
                        triggerEvent(me, 'change', null, [me._uFront, me._uRoot, me._uPath, rowData]);
                    }
                }
            }
        )
    
    UI_TABLE_EDITOR_CLASS = UI_TABLE_EDITOR.prototype;

    UI_TABLE_EDITOR_CLASS.setValue = function(value) {
        var control = this._uInput || this._uSelect;
        control.setValue(value);
    }

    UI_TABLE_EDITOR_CLASS.getValue = function() {
        var control = this._uInput || this._uSelect;
        var value = null;
        if (!control) {
            var fronts = {
                '1' : 'www',
                '2' : '无前缀'
            }
            var front =  this._uFront.getValue();  
            front = fronts[front];
            var root =  this._uRoot.getValue();  
            var path =  this._uPath.getValue();  
            value = front + root + path;
        }
        else {
            value = control.getValue();
        }
        return value;
    }

    UI_TABLE_EDITOR_CLASS.getInnerControl = function() {
        var me = this;
        var control = this._uInput || this._uSelect;
        if (!control) {
            control = [
                me._uFront,
                me._uRoot,
                me._uPath
            ];
        }
        return control;
    }

    UI_TABLE_EDITOR_CLASS.show = function (con) {
        var me = this;

        var con = con || me.showCell;
        var pos = getPosition(con),
            view = getView(),
            left = pos.left, top = pos.top;
        var ele = this.getOuter();
        var rowData = this.rowData;
        //this.setValue(value);
        UI_CONTROL_CLASS.show.call(this);
        this.resize();
        if (left + this.getWidth() > view.right) {
            left = view.right - this.getWidth();
        }
        if (top + this.getHeight() > view.bottom) {
            top = view.bottom - this.getHeight();
        }
        this.setPosition(0, 0);
        con.appendChild(this.getOuter());
        //set outer width and height
        ele.style.width = con.offsetWidth - 2 + 'px';
        ele.style.height =  con.offsetHeight - 5 + 'px';

        //select control
        if(this._uSelect) {
            this._uSelect.setSize(con.offsetWidth - 2, 22);
        }
        else if(this._uInput) {
            this._uInput.setValue('');
            this._uInput.getOuter().style.width = (con.offsetWidth - 2) + 'px';
        }
        else {
            me._uFront.setSelectedIndex(0);
            me._uRoot.setValue('');
            me._uPath.setValue('');
            var frontWidth = me._uFront.getOuter().offsetWidth;
            var rootWidth = me._uRoot.getOuter().offsetWidth;   
            me._uRoot.getOuter().style.width = (con.offsetWidth - 130) + 'px';
            
            var pathWidth = me._uPath.getOuter().offsetWidth;     
            ele.style.width = frontWidth + rootWidth + pathWidth + 9 + 'px';
        }

        //set focus
        this.focus();
        if (Object.prototype.toString.call(this.getInnerControl()) !== '[object Array]') {
            triggerEvent(this, 'beforeedit', null, [this.getInnerControl(), rowData]);
        }
        else {
            var args = this.getInnerControl();
            args.push(rowData);
            triggerEvent(this, 'beforeedit', null, args);
        }
    }


    var lazyCheck = function() {
        var focused = ecui.getFocused();
        var focusedEditor = null;

        if ((focused instanceof UI_ITEM) && (focused.getParent() instanceof UI_SELECT)) {
            focused = focused.getParent();
        }

        if ((focused instanceof UI_SELECT) && (focused.getParent() instanceof UI_TABLE_EDITOR)) {
            focused = focused.getParent();
        }

        if (focused instanceof UI_TABLE_EDITOR) {
            focusedEditor = focused;
        }


        var checkIsTagetFocus = function(control) {
            var flag = false;
            if (control == focusedEditor) {
                flag = true;
            }
            else if (control.target) {
                flag = checkIsTagetFocus(control.target);
            }
            return flag;
        }

        var checkIsParentFocus = function(control) {
            var flag = false;
            if (control == focusedEditor) {
                flag = true;
            }
            else if (control.parTarget) {
                flag = checkIsParentFocus(control.parTarget);
            }
            return flag;
        }
        var connectControls = [];
        var getParControls = function(control) {
            connectControls.push(control);
            if (control.target && baidu.array.indexOf(connectControls, control.target)) {
                getParControls(control.target);
            }
        }

        var getChildControls = function(control) {
            connectControls.push(control);
            if (control.parTarget && baidu.array.indexOf(connectControls, control.parTarget)) {
                getChildControls(control.parTarget);
            }
        }

        if (!focusedEditor || (!checkIsTagetFocus(this) && !checkIsParentFocus(this))) {
            
            getParControls(this);
            getChildControls(this);
            connectControls = baidu.array.unique(connectControls);
            baidu.each(connectControls, function(item) {
                item.hide();
            });
        }
    }

    UI_TABLE_EDITOR_CLASS.$blur = function (event) {
        var me = this;
        setTimeout(function(){
            lazyCheck.call(me, event)
        }, 1); 
    } 

    UI_TABLE_EDITOR_CLASS.onhide = function (e) {
        var me = this;
        
        var rowData = this.rowData;
        var table = this.getParent();
        var control = this._uInput || this._uSelect;
        var me = this;
        var editCell = this.editCell;
        document.body.appendChild(me.getOuter());
        var e = {
            'message' : ''
        }
        var o = null; 

        if (!control) {
            o = triggerEvent(this, 'editsubmit', e, [me._uFront, me._uRoot, me._uPath, rowData]);
        }
        else {
            o = triggerEvent(this, 'editsubmit', e, [control, rowData]);
        }
        
        if ('[object String]' == Object.prototype.toString.call(e.message) && e.message != '') {
            this.setError(e.message);
        }
        else {
            if (control && control ==  this._uInput) {
                e.value = (e.value !== undefined ? e.value : control.getValue());
                editCell.innerHTML = e.value;
            }
            else if (control && control ==  this._uSelect) {
                editCell.innerHTML = control.getSelected()._eBody.innerText;
            }
            else {
                e.value = (e.value !== undefined ? e.value : me.getValue());
                editCell.innerHTML = e.value;
            }
        }

    }

    UI_TABLE_EDITOR_CLASS.focus = function () {
        var control = this._uInput || this._uSelect;
        core.setFocused(this, control);
    }


    UI_TABLE_EDITOR_CLASS.setAttached = function(cell, data) {

        var container = baidu.dom.children(cell)[1];
        var table = this.getParent();

        var control = this._uSelect;
        var editCell = table._sEditCell;

        var nowText = container.innerHTML;
        control.clear();
        var nowValue = undefined;
        baidu.each(data, function(item) {
            if (nowText == item.text) {
                nowValue = item.value;
            }
            control.add(item.text, null, {'value' : item.value});
        });
        control.setValue(nowValue);
    }

    UI_TABLE_EDITOR_CLASS.setError = function (str) {
        str = trim(str);
        var table = this.getParent();
        var editCell = table._sEditCell;

        if(str) {
            ecui.alert(str, function() {});
        }
    }
})();
