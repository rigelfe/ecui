/**
 * input
 * Copyright 2012 Baidu Inc. All rights reserved.
 * 
 * path:    input.js
 * desc:    文本输入框(input与textarea)
 * author:  cxl(chenxinle@baidu.com)
 * date:    2012/03/12
 */
(function () {

    var core = ecui,
        dom = core.dom,
        string = core.string,
        ui = core.ui,
        util = core.util,

        attachEvent = util.attachEvent,
        createDom = dom.create,
        trim = string.trim,
        setFocused = core.setFocused,
        blank = util.blank,

        inheritsControl = core.inherits,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_INPUT_CONTROL = ui.InputControl,
        UI_INPUT_CONTROL_CLASS = UI_INPUT_CONTROL.prototype,


        UI_INPUT = ui.Input = inheritsControl(
            UI_INPUT_CONTROL,
            'ui-input',
            function (el, options) {
                options.resizable = false;
            },
            function (el, options) {
                var o, type = this.getType();
                
                this.getInput().style.border = '';

				if(options.maxLength){
					this._sMaxLength = options.maxLength;
				}


                if (options.tip) {
                    o = createDom(type + '-tip', 'display:none');
                    o.innerHTML = options.tip;
                    this.getBody().appendChild(o);
                    this._eTip = o;
                    attachEvent(this._eTip, 'mousedown', UI_INPUT_TIP_HANDLER);
                }
            }
        ),
        UI_INPUT_CLASS = UI_INPUT.prototype,

        UI_TEXTAREA = ui.Textarea = inheritsControl(
            UI_INPUT,
            'ui-textarea',
            function (el, options) {
                options.inputType = 'textarea';
            }
        );

    function UI_INPUT_TIP_HANDLER(event) {
        var e = event || window.event,
            con;

        if (e.preventDefault) {
            e.preventDefault();
        }
        else {
            e.cancelBuble = true;
        }
        e = e.target || e.srcElement;
        con = e.parentNode.getControl();
        con.getInput().focus();
    }

    function UI_INPUT_TIP_DISPLAY(con, show) {
        if (con._eTip) {
            con._eTip.style.display = show ? '' : 'none';
        }
    }

    UI_INPUT_CLASS.$keydown = function () {
    	
        UI_INPUT_TIP_DISPLAY(this, false);
    };

    UI_INPUT_CLASS.$keyup = function () {
        var value = this.getValue();
        
        if(this._sMaxLength){
        	if(baidu.string.getByteLength(value) > this._sMaxLength){
        		this.setValue(baidu.string.subByte(value, this._sMaxLength));
        	}
        }
        
        if (!value) {
            UI_INPUT_TIP_DISPLAY(this, true);
        }
    };

    UI_INPUT_CLASS.$blur = function () {
        UI_CONTROL_CLASS.$blur.call(this);
        if (!this.getValue()) {
            UI_INPUT_TIP_DISPLAY(this, true);
        }
    };

    UI_INPUT_CLASS.$setSize = blank;

    UI_INPUT_CLASS.setValue = function (value) {
        UI_INPUT_CONTROL_CLASS.setValue.call(this, value);
        UI_INPUT_TIP_DISPLAY(this, value ? false : true);
    };

    UI_INPUT_CLASS.init = function () {
        if (!this.getValue()) {
            UI_INPUT_TIP_DISPLAY(this, true);
        }
        UI_INPUT_CONTROL_CLASS.init.call(this);
    };
})();
