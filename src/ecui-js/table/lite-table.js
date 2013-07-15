/**
 * liteTable - 简单表格
 *
 */

(function () {

    var core = ecui,
        string = core.string,
        ui = core.ui,
        util = core.util,
        string = core.string,

        undefined,

        extend = util.extend,
        blank = util.blank,
        attachEvent = util.attachEvent,
        encodeHTML = string.encodeHTML,

        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype;

    var UI_LITE_TABLE = ui.LiteTable =
        inheritsControl(
            UI_CONTROL,
            'ui-lite-table',
            function (el, options) {
                options.resizable = false;
            },
            function (el, options) {
                this._aData = [];
                this._aFields = [];
                this._eCheckboxAll = null;
                this._aCheckboxs = [];
                this._sEmptyText = options.emptyText || '暂无数据';
                this._bCheckedHighlight = options.checkedHighlight === true;
            }
        ),

        UI_LITE_TABLE_CLASS = UI_LITE_TABLE.prototype,

        DELEGATE_EVENTS = ['click', 'mouseup', 'mousedown'],

        // 默认处理函数
        DEFAULT_EVENTS = {
            'click th.ui-lite-table-hcell-sort': function (event, control) {
                var field = this.getAttribute('data-field'),
                    orderby;

                if (this.className.indexOf('-sort-desc') >= 0) {
                    orderby = 'asc';
                }
                else if (this.className.indexOf('-sort-asc') >= 0) {
                    orderby = 'desc'
                }
                else {
                    orderby = this.getAttribute('data-orderby') || 'desc';
                }

                triggerEvent(control, 'sort', null, [field, orderby]);
            },
            'click input.ui-lite-table-checkbox-all': function (event, control) {
                control.$refreshCheckbox(this.checked);
            },
            'click input.ui-lite-table-checkbox': function (event, control) {
                control.$refreshCheckbox();
            }
        };

    function copyArray(data) {
        var res = [], i, item;

        for (i = 0; item = data[i]; i++) {
            res.push(extend({}, item));
        }

        return res;
    }

    function getHanlderByType(events, type) {
        var handlers = [], item;

        events = extend({}, events);
        events = extend(events, DEFAULT_EVENTS);

        for (var key in events) {
            item = {handler: events[key]};
            key = key.split(/\s+/);
            if (key[0] == type) {
                item.selector = key[1];
                handlers.push(item);
            }
        }

        return handlers;
    }

    function checkElementBySelector(ele, selector) {
        var tagName, value, type, res = true;

        if (!ele && !selector) {
            return false;
        }

        selector.replace(/^([^.#]*)([.#]?)(.*)$/, function ($0, $1, $2, $3) {
            tagName = $1;
            type = $2;
            value = $3;
        });

        if (tagName && ele.tagName.toLowerCase() != tagName) {
            res = false;
        }

        if (type == '.' && !new RegExp('(^|\\s+)' + value + '(\\s+|$)').test(ele.className)) {
            res = false;
        }

        if (type == '#' && ele.id != value) {
            res = false;
        }

        return res;
    }

    function buildTabeBody(fields, datasource, type) {
        var i, item, j, field, html = [], str,
            className;

        for (i = 0; item = datasource[i]; i++) {
            html.push('<tr class="'+ type +'-row">')
            for (j = 0; field = fields[j]; j++) {
                className = type + '-cell';
                if (field.align) {
                    className += ' ' + type + '-cell-align-' + field.align;
                }
                else if (field.checkbox) {
                    className += ' ' + type + '-cell-align-center';
                }
                html.push('<td class="'+ className +'">');
                if (field.checkbox) {
                    html.push('<input type="checkbox" value="'+ item[field.content] + '" class="'+ type +'-checkbox"');
                    if (field.checkedField && item[field.checkedField] == true) {
                        html.push(' checked="checked"');
                    }
                    html.push(' />');
                }
                else {
                    if (typeof field.content == 'function') {
                        html.push(field.content.call(null, item, i));
                    }
                    else {
                        str = item[field.content];
                        if (!str && str != 0) {
                            str = '&nbsp;';
                        }
                        else {
                            str = encodeHTML(str + '');
                        }
                        html.push(str);
                    }
                }
                html.push('</td>')
            }
            html.push('</tr>')
        }

        return html.join('');
    };

    /**
     * @override
     */
    UI_LITE_TABLE_CLASS.$setSize = blank;

    /**
     * @override
     */
    UI_LITE_TABLE_CLASS.init = function () {
        var i, item, ele = this.getOuter(),
            control = this;

        UI_CONTROL_CLASS.init.call(this);

        // 添加控件全局的事件监听
        // 只支持click mousedown mouseup
        for (i = 0; item = DELEGATE_EVENTS[i]; i++) {
            attachEvent(ele, item, (function (name) {
                return function (event) {
                    var e = event || window.event;
                    e.targetElement = e.target || e.srcElement;
                    control.$fireEventHanlder(name, e);
                }
            })(item));
        }
    }

    /**
     * 设置表格的数据
     * @public
     * 
     * @param {Array} datasource 表格数据
     * @param {Object} sortInfo 排序信息
     *          {String} sortby 排序字段
     *          {String} orderby 排序方式
     * @param {Boolean} isSilent 静默模式 如果true的话 不会立刻重绘表格 需要手动调用render
     */
    UI_LITE_TABLE_CLASS.setData = function (datasource, sortInfo, isSilent) {
        this._aData = copyArray(datasource);
        if (sortInfo) {
            this._sSortby = sortInfo.sortby || '';
            this._sOrderby = sortInfo.orderby || '';
        }

        !isSilent && this.render();
    };

    UI_LITE_TABLE_CLASS.getData = function () {
        return copyArray(this._aData);
    };

    UI_LITE_TABLE_CLASS.getDataByField = function (o, field) {
        var i, item;

        field = field || 'id';
        for (i = 0; item = this._aData[i]; i++) {
            if (item[field] == o) {
                return extend({}, item);
            }
        }

        return null;
    };

    /**
     * 设置表格的列信息
     * @public
     * 
     * @param {Array} fields 列信息
     * @param {Boolean} isSilent 静默模式 如果true的话 不会立刻重绘表格 需要手动调用render
     */
    UI_LITE_TABLE_CLASS.setFields = function (fields, isSilent) {
        this._aFields = copyArray(fields);

        !isSilent && this.render();
    };

    /**
     * 获取当前选择的行单选框value
     * @public
     */
    UI_LITE_TABLE_CLASS.getSelection = function () {
        var ids = [], i, item;

        for (i = 0; item = this._aCheckboxs[i]; i++) {
            item.checked && ids.push(item.value);
        }

        return ids;
    };

    /**
     * 重新绘制表格
     * @public
     */
    UI_LITE_TABLE_CLASS.render = function () {
        var type = this.getTypes()[0],
            html = ['<table cellpadding="0" cellspacing="0" width="100%" class="'+ type +'-table">'],
            i, item, className,
            fields = this._aFields, datasource = this._aData;

        if (!fields || fields.length <= 0) {
            return;
        }

        html.push('<tr class="'+ type +'-head">');
        // 渲染表头
        for (i = 0; item = fields[i]; i++ ) {
            className = type + '-hcell';
            if (item.checkbox) {
                className += ' ' + type + '-hcell-checkbox';
                html.push('<th class="'+ className +'"><input type="checkbox" class="'+ type +'-checkbox-all" /></th>');
                continue;
            }
            html.push('<th');
            if (item.width) {
                html.push(' width="' + item.width + '"');
            }
            if (item.sortable) {
                className += ' ' + type + '-hcell-sort';
                if (item.field && item.field == this._sSortby) {
                    className += ' ' + type + '-hcell-sort-' + this._sOrderby;
                }
                html.push(' data-field="'+ item.field +'"');
                if (item.orderby) {
                    html.push(' data-orderby="' + item.orderby + '"');
                }
            }
            html.push(' class="' + className + '">' + item.title + '</th>');
        }
        html.push('</tr>');

        // 渲染无数据表格
        if (!datasource || datasource.length <= 0) {
            html.push('<tr class="'+ type +'-row"><td colspan="'
                    + fields.length +'" class="'+ type +'-cell-empty">'+ this._sEmptyText +'</td></tr>');
        }
        else {
           html.push(buildTabeBody(fields, datasource, type));
        }

        html.push('</table>');

        this.setContent(html.join(''));
        // 重新捕获所有的行当选框
        this.$bindCheckbox();
        if (this._eCheckboxAll) {
            this.$refreshCheckbox();
        }
    };

    /**
     * 获取表格当前所有行单选框的引用
     * @private
     */
    UI_LITE_TABLE_CLASS.$bindCheckbox = function () {
        var inputs = this.getBody().getElementsByTagName('input'),
            i, item, type = this.getTypes()[0];

        this._aCheckboxs = [];
        this._eCheckboxAll = null;

        for (i = 0; item = inputs[i]; i++) {
            if (item.type == 'checkbox' && item.className.indexOf(type + '-checkbox-all') >= 0) {
                this._eCheckboxAll = item;
            }
            else if (item.type == 'checkbox' && item.className.indexOf(type + '-checkbox') >= 0) {
                this._aCheckboxs.push(item);
            }
        }
    };

    /**
     * 刷新表格的行单选框
     * @private
     *
     * @param {Boolean} checked 全选/全不选 如果忽略此参数则根据当前表格的实际选择情况来设置“全选”的勾选状态
     */
    UI_LITE_TABLE_CLASS.$refreshCheckbox = function (checked) {
        var i, item, newChecked = true, tr;

        for (i = 0; item = this._aCheckboxs[i]; i++) {
            tr = item.parentNode.parentNode;
            if (checked !== undefined) {
                item.checked = checked;
            }
            else {
                newChecked = item.checked && newChecked;
            }

            if (item.checked && this._bCheckedHighlight) {
                tr.className += ' highlight';
            }
            else if (this._bCheckedHighlight) {
                tr.className = tr.className.replace(/\s+highlight/g, '');
            }
        }

        this._eCheckboxAll.checked = checked !== undefined ? checked : newChecked;
    };

    /**
     * 触发表格events中定义的事件
     * @private
     *
     * @param {String} eventType 事件类型
     * @param {Event} nativeEvent 原生事件参数
     */
    UI_LITE_TABLE_CLASS.$fireEventHanlder = function (eventType, nativeEvent) {
        var events = getHanlderByType(this.events, eventType),
            i, item, target = nativeEvent.targetElement, selector;

        for (i = 0; item = events[i]; i++) {
            if (checkElementBySelector(target, item.selector)) {
                item.handler.call(target, nativeEvent, this);
            }
        }
    };

    /**
     * @override
     */
    UI_LITE_TABLE_CLASS.$dispose = function () {
        this._aCheckboxs = [];
        this._eCheckboxAll = null;
        UI_CONTROL_CLASS.$dispose.call(this);
    };
})();
