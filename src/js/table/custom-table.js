/**
 * custom-table.js
 * Copyright 2012 Baidu Inc. All rights reserved *
 * desc: 工作台项目定制的table控件，提供的功能包括表头锁定和列锁定、行选中、排序、使用render方法填充和刷新表格；表格支持跨行跨列,最多跨两行
 * author: hades(denghongqi@baidu.com)
 */

 (function () {
    var core = ecui,
        dom = core.dom,
        array = core.array,
        ui = core.ui,
        string = core.string,
        util = core.util,

        $fastCreate = core.$fastCreate,
        inheritsControl = core.inherits,
        triggerEvent = core.triggerEvent,
        disposeControl = core.dispose,
        $disposeControl = core.$dispose,
        createDom = dom.create,
        first = dom.first,
        last = dom.last,
        children = dom.children,
        addClass = dom.addClass,
        setStyle = dom.setStyle,
        setText = dom.setText,
        getText = dom.getText,
        removeClass = dom.removeClass,
        getParent = dom.getParent,
        moveElements = dom.moveElements,
        getAttribute = dom.getAttribute,
        getPosition = dom.getPosition,
        encodeHTML = baidu.string.encodeHTML,
        remove = array.remove,
        getView = util.getView,
        extend = util.extend,
        repaint = core.repaint,
        attachEvent = util.attachEvent,
        detachEvent = util.detachEvent,

        chromeVersion = /chrome\/(\d+\.\d+)/i.test(navigator.userAgent) ? + RegExp['\x241'] : undefined,
        MATH = Math,
        MIN = MATH.min,
        WINDOW = window,

        UI_CONTROL = ui.Control,
        UI_CONTROL_CLASS = UI_CONTROL.prototype,
        UI_TABLE = ui.Table,
        UI_TABLE_CLASS = UI_TABLE.prototype,
        UI_LOCKED_TABLE = ui.LockedTable,
        UI_LOCKED_TABLE_CLASS = UI_LOCKED_TABLE.prototype,
        UI_TABLE_EDITOR = ui.TableEditor,
        UI_TABLE_EDITOR_CLASS = UI_TABLE_EDITOR.prototype;

    var UI_CUSTOM_TABLE = ui.CustomTable =
        inheritsControl(
            UI_LOCKED_TABLE,
            'ui-table',
            function(el, options) {
                this._oOptions = options;
                this._aHeader = options.header;
                this._sSortby = options.sortby;
                this._sOrderby = options.orderby;
                this.editors = {};

                if (!options.datasource) {
                    this._nLeftLock = options.leftLock || 0;
                    this._nRightLock = options.rightLock || 0;
                }

                var type = this.getTypes()[0];

                var html = [];
                html.push('<table><thead>');

                options.leftLock = options.leftLock || 0;
                options.rightLock = options.rightLock || 0;
                var lockedTotal = options.leftLock + options.rightLock;

                if (!options.datasource) {
                    setStyle(el, 'width', '100%');
                }
                else {
                    setStyle(el, 'width', 'auto');
                    setStyle(el, 'display', 'block');
                }

                if (!options.datasource) {
                    html.push('<tr>');
                    var i;
                    for (var i = 0; i <= lockedTotal; i++) {
                        html.push('<th></th>');
                    }
                    html.push('</tr>');
                }
                else {
                    //表头目前只支持跨两行
                    if ('[object Array]' == Object.prototype.toString.call(options.fields[0])) {
                        var flag = 0;    
                        var i;
                        for (i = 0; i < options.fields.length; i++) {
                            var o = options.fields[i];
                            html.push(createHeadRow(o, this, options.fields));
                        }
                        this._aColumns = [];
                        for (var i = 0, o; o = options.fields[0][i]; i++) {
                            if (o.colspan) {
                                for (var j = 0; j < o.colspan; j++) {
                                    this._aColumns.push(extend({}, options.fields[1][flag++]));
                                }
                            }
                            else {
                                this._aColumns.push(extend({}, o));
                            }
                        }
                    }
                    else {
                        html.push(createHeadRow(options.fields, this));
                        this._aColumns = copyArray(options.fields);
                    }
                }

                html.push('</thead><tbody>');

                if(!options.datasource)  {
                    html.push('<tr>');
                    var i;
                    html.push('<td></td>');
                    html.push('</tr>');
                    options.leftLock = 0;
                    options.rightLock = 0;
                }
                else {
                    this._aData = options.datasource;

                    if (!this._aData.length) {
                        html.push('<tr>');
                        html.push(
                            '<td class="' + type + '-empty-cell'
                            + '" align="left" colspan="'
                            + this._aColumns.length
                            + '">'
                        );
                        html.push(
                            options.noData 
                            ? options.noData
                            : '暂无数据，请稍后再试'
                        );
                        html.push('</td>');
                        html.push('</tr>');
                    }
                    else {
                        var i;
                        for (i = 0; i < options.datasource.length; i++) {
                            var item = options.datasource[i];
                            html.push('<tr>');
                            var j;
                            for (j = 0; j < this._aColumns.length; j++) {
                                var o = this._aColumns[j];
                                html.push('<td');

                                if (o.checkbox) {
                                    o.width = 16;
                                }

                                html.push(' width="' + o.width + '"');
                                html.push(
                                    ' style="width:' 
                                    + o.width 
                                    + 'px;'
                                    + 'min-width:'
                                    + o.width
                                    + 'px;'
                                    + 'max-width:'
                                    + o.width
                                    + 'px;"'
                                );
                                html.push(' class="');

                                if (options.autoEllipsis) {
                                    html.push(type + '-cell-ellipsis ');
                                }

                                if (o.editable) {
                                    html.push(type + '-cell-editable ');
                                }

                                if(o.align) {
                                    html.push(type + '-cell-align-' + o.align + ' ');
                                }

                                html.push('"');

                                o.editable && o.field && html.push(
                                    ' edit-field="' + o.field + '"'
                                ) 
                                && html.push(
                                    ' edit-type="' + o.editType + '"'
                                ) && o.target && html.push(
                                    ' edit-target="' + o.target + '"'
                                );

                                o.align && html.push(
                                    ' align="' + o.align + '"'
                                );

                                html.push('>');

                                if (o.editable) {
                                    html.push('<div class="' + type + '-cell-editor-container">');
                                    html.push('<span class="' + type + '-cell-editor-button"></span>');
                                }   
                                
                                var content = o.content || o.field;

                                if (typeof content == 'function') {
                                    if (o.checkbox) {
                                        html.push('<input type="checkbox"');
                                        html.push(
                                            ' class="' + type + '-checkbox"'
                                        );
                                        html.push(
                                            ' data-rownum="' + i + '"'
                                        );
                                        html.push(' />');
                                    }
                                    else {
                                        var e = content.call(null, item, i);
                                        if (Object.prototype.toString.call(e) == '[object String]') {
                                            if (options.autoEllipsis) {
                                                html.push(
                                                    '<div style="overflow:hidden; text-overflow:ellipsis;'
                                                    + 'width:' + o.width + 'px;'
                                                    + 'max-width:' + o.width + 'px;'
                                                    + 'min-width:' + o.width + 'px;'
                                                    + '" title="'
                                                    + e
                                                    + '">'
                                                    + e
                                                    + '</div>'
                                                );
                                            }
                                            else if (o.maxlength 
                                                && e
                                                && e.length > o.maxlength
                                            ) {
                                                html.push('<span class="');
                                                html.push(type + '-cell-limited"');
                                                html.push(' title="' + e + '">');
                                                html.push(encodeHTML(e.substring(0, o.maxlength)));
                                                html.push('...');
                                                html.push('</span>');
                                            }
                                            else if (o.editable) {
                                                html.push('<div>' + e + '</div>');
                                                html.push('</div>');
                                            }
                                            else {
                                                html.push(e);
                                            }
                                        }
                                        else {
                                            var div = createDom();
                                            div.appendChild(e);
                                            html.push(div.innerHTML);
                                        }
                                    }
 
                                }
                                else {
                                    if (o.detail) {
                                        html.push(
                                            '<span style="margin-left:3px;margin-top:7px;float:right"'
                                            + ' ecui="type:tip;asyn:true;id:'
                                        );
                                        html.push('tip-' + item[o.idField] + '"');
                                        html.push('></span>');
                                    }

                                    if (o.checkbox) {
                                        html.push('<input type="checkbox"');
                                        html.push(
                                            ' class="' + type + '-checkbox"'
                                        );
                                        html.push(
                                            ' data-rownum="' + i + '"'
                                        );
                                        html.push(' />');
                                    }
                                    else if (o.score) {
                                        html.push('<span ecui="type:score; static:true; max:');
                                        html.push(
                                            o.max + '; value:' + item[content]
                                        );
                                        html.push('"></span>');
                                    }
                                    else {
                                        if (options.autoEllipsis) {
                                            html.push(
                                                '<div style="overflow:hidden; text-overflow:ellipsis;'
                                                + 'width:' + o.width + 'px;'
                                                + 'max-width:' + o.width + 'px;'
                                                + 'min-width:' + o.width + 'px;'
                                                + '" title="'
                                                + encodeHTML(item[content])
                                                + '">'
                                                + encodeHTML(item[content])
                                                + '</div>'
                                            );
                                        }
                                        else if (o.maxlength 
                                            && item[content] 
                                            && item[content].length > o.maxlength
                                        ) {
                                            html.push('<span class="');
                                            html.push(type + '-cell-limited"');
                                            html.push(' title="' + encodeHTML(item[content]) + '">');
                                            html.push(encodeHTML(item[content].substring(0, o.maxlength)));
                                            html.push('...');
                                            html.push('</span>');
                                        }
                                        else if (o.editable) {
                                            item[content] = item[content] || '';
                                            html.push('<div>' + encodeHTML(item[content]) + '</div>');
                                            html.push('</div>');
                                        }
                                        else {
                                            item[content] = item[content] || '';
                                            html.push(encodeHTML(item[content]));
                                        }
                                    }
                                }

                                html.push('</td>');
                            }
                            html.push('</tr>');
                        }
                    }
                }

                html.push('</tbody></table>');

                el.innerHTML = html.join('');

                return el;
            },
            function(el, options) {
                ecui.init(el);
                if (options.fields && options.datasource) {
                    initEmbedControlEvent(options.fields, options.datasource);
                }

                this.$bindCheckbox();
                return el;
            }
        ),
        UI_CUSTOM_TABLE_CLASS = UI_CUSTOM_TABLE.prototype,

        DELEGATE_EVENTS = ['click', 'mouseup', 'mousedown'],

        // 默认处理函数
        DEFAULT_EVENTS = {
            
            'click th.ui-table-hcell-sort': function (event, control) {
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
            'click input.ui-table-checkbox-all': function (event, control) {
                control.$refreshCheckbox(this.checked);
            },
            'click input.ui-table-checkbox': function (event, control) {
                control.$refreshCheckbox();
            },
            'click span.ui-table-cell-editor-button': function (event, table) {
                var evt = event || window.event;
                var icon = baidu.event.getTarget(evt);
                var cellCon = baidu.dom.next(icon);
                var content = cellCon.innerHTML;
                var cellCon = baidu.dom.getParent(icon);
                var cell = baidu.dom.getParent(cellCon);

                var editField = baidu.dom.getAttr(cell, 'edit-field');
                var editType = baidu.dom.getAttr(cell, 'edit-type');
                

                var datasource = table._oOptions.datasource;
                var rows = table._aRows;
                var nowRow = ecui.findControl(cell).getParent();
                var rowIndex = baidu.array.indexOf(rows, nowRow);
                var rowData = datasource[rowIndex];

                var fieldCells = {};
                baidu.each(nowRow._aElements, function(ele) {
                    var o = baidu.dom.getAttr(ele, 'edit-field');
                    if(o) {
                        fieldCells[o] = ele;
                    }
                });

                table._sEditors = table._sEditors || [];

                /**
                 * 创建Editor
                 * @param  {[type]} editField [description]
                 * @return {[type]}           [description]
                 */
                function createEditor (editField) {
                    var editor = table._sEditors[editField];
                    var editTarget = baidu.dom.getAttr(fieldCells[editField], 'edit-target');
                    if(!editor) {
                        var editorCon = baidu.dom.create('div', {
                            'class' : 'ui-table-editor'
                        });
                        document.body.appendChild(editorCon);
                        editor = $fastCreate(UI_TABLE_EDITOR, editorCon, table, {'type' : editType, 'target' : null});
                        table._sEditors[editField] = editor;

                        //创建的时候就创建事件
                        var editorHandles = table.editors[editField];
                        for (var handle in editorHandles) {
                            editor[handle] = editorHandles[handle];
                        }
                    }
                    editor.rowData = rowData;
                    //如果关联控件 创建关联控件
                    if(editTarget) {
                        var tarEditor = createEditor(editTarget);

                        editor.target = tarEditor;
                        editor.targetField = editTarget;
                        
                        tarEditor.parTarget = editor;
                    }

                    return editor;
                }

                var editor = createEditor(editField);

                table._showEditors = [];
                function showControl(editor, editField) {

                    var cell = fieldCells[editField];

                    editor.show(children(cell)[0]);
                    editor.editCell = children(cellCon)[1];
                    editor.showCell =  children(cell)[0];
                    table._showEditors.push(editor);
                    if(editor.target) {
                        showControl(editor.target, editor.targetField);
                    }
                }

                showControl(editor, editField);


            }
        };

    /** 
     * 生成表头的一行
     * 
     * @param {Array} headrow 一行表头的数据
     * @param {ecui.ui.CustomTable} con
     * @param {Array} opt_head 所有的表头数据
     * @return {string} html片段
     */
    function createHeadRow(headrow, con, opt_head) {
        var type = con.getTypes()[0];

        var html = [];
        html.push('<tr>');

        var flag = 0;
        var i = 0;
        for (i = 0; i < headrow.length; i++) {
            var o = headrow[i];
            html.push('<th ');
            html.push('data-field="');

            if (Object.prototype.toString.call(o.field) == '[object String]') {
                html.push(o.field);
            }

            if (o.width) {
                html.push(
                    '" style="width:' + o.width + 'px;'
                    + 'min-width:' + o.width + 'px;'
                    + 'max-width:' + o.width + 'px;'
                );
            }

            if (o.editable && o.field) {
                con.editors[o.field] = con.editors[o.field] || {};
            }
            
            if (o.rowspan) {
                html.push(
                    '" rowspan="' + o.rowspan
                );
            }
            if (o.colspan) {
                html.push(
                    '" colspan="' + o.colspan
                );

                var j;
                var width = 0;
                for (j = flag; j < flag + o.colspan; j++) {
                    width += opt_head[1][j].width;
                }

                html.push(
                    '" width="' + width
                );

                flag += o.colspan;
            }
            if (o.sortable) {
                html.push(
                    '" class="' + type + '-hcell-sort'
                );
                if (o.field && o.field == con._sSortby) {
                    html.push(
                        ' ' + type + '-hcell-sort-' + con._sOrderby
                    );
                }

                if (o.order) {
                    html.push(
                        '" data-orderby="' + o.order.toLowerCase()
                    );
                }
            }

            html.push('">');
            
            if (o.title) {
                html.push(o.title);
            }

            if (o.checkbox) {
                html.push(
                    '<input type="checkbox" class="'
                    + type + '-checkbox-all"'
                    + ' />'
                );
            }

            if (o.tip && o.tip.length) {
                html.push('<span ecui="type:tip; id:tip-');
                html.push(o.field);
                html.push('; message:');
                html.push(o.tip);
                html.push('"></span>');
            }

            html.push('</th>');
        }
        html.push('</tr>');

        return html.join('');
    }

    /**
     * 帮顶表格内部子控件的事件
     *
     * @param {Array} header 表头数据
     * @param {Array} datasource 表格数据
     */
    function initEmbedControlEvent(header, datasource) {
        var i = 0;
        for (i = 0; i < datasource.length; i++) {
            var item = datasource[i];
            for (var j = 0; j < header.length; j++) {
                var o = header[j];
                if (o.detail) {
                    var controlId = 'tip-' + item[o.idField];
                    if (ecui.get(controlId)) {
                        ecui.get(controlId).onloadData = (function (item, o) {
                            return function (handler) {
                                o.loadData(item, handler);
                            }
                        }) (item, o);
                    }
                }
            }
        }
    }

    UI_CUSTOM_TABLE_CLASS.getData = function () {
        return this._aData;
    };

    /**
     * 根据数据绘制表格
     *
     * @public
     * @param {Object} options
     * @param {Array.<Object>=} options.fields 表头配置
     * @param {Array.<Object>=} options.datasource 表格数据
     * @param {number=} options.leftLock 左锁定列的列数
     * @param {number=} options.rightLock 右锁定列的列数
     * @param {string=} options.sortby 排序字段
     * @param {string=} options.orderby 排序方式
     * @param {string=} options.noData 数据为空时显示的内容
     */
    UI_CUSTOM_TABLE_CLASS.render = function(options) {
        var options = options || {};
        extend(options, this._oOptions);
        if (Object.prototype.toString.call(options.leftLock) != '[object Number]') {
            options.leftLock = this._nLeftLock;
        }
        if (Object.prototype.toString.call(options.rightLock) != '[object Number]') {
            options.rightLock = this._nRightLock;
        }

        /*
        var options = extend({}, options);
        options = extend(options, this._oOptions);
        options.leftLock = this._nLeftLock;
        options.rightLock = this._nRightLock;
        options.fields = fields;
        options.datasource = datasource || [];
        var sortinfo = sortinfo || {};
        options.sortby = sortinfo.sortby;
        options.orderby = sortinfo.orderby;
        options.errorMsg = errorMsg;
        */

        if (!options.datasource.length) {
            options.leftLock = 0;
            options.rightLock = 0;
        }

        detachEvent(WINDOW, 'resize', repaint);

        if (!options.complex) {
            var key;

            //卸载行
            var rows;
            var i;
            rows = this._aHeadRows.concat(
                this._aRows, 
                this._aLockedRow, 
                this._aLockedHeadRow
            );

            var row;
            for (i = 0; row = rows[i]; i++) {
                var j;
                if (row._aElements) {
                    var cells = row.getCells();
                    for (j = 0; cell = cells[j]; j++) {
                        $disposeControl(cell);
                    }
                    $disposeControl(row, true);
                }
            }
        }

        for (i = 0; key = this._aHCells[i]; i++) {
            $disposeControl(key, true);
        }

        //卸载内部子控件
        for (key in this) {
            if (/_u\w+/.test(key)) {
                disposeControl(this[key]);
            }
        }

        var el = this.getOuter();
        el.innerHTML = '';
        this.$setBody(el);

        this.$resize();
        UI_CUSTOM_TABLE.client.call(this, el, options);
        this._bCreated = false;
        this.cache(true, true);
        //this.init();
        UI_LOCKED_TABLE_CLASS.init.call(this);

        //恢复
        attachEvent(WINDOW, 'resize', repaint);
        this.resize();
    };

    UI_CUSTOM_TABLE_CLASS.disposeUnit = function(callback) {
        detachEvent(WINDOW, 'resize', repaint);

        var key;

        //卸载行
        var rows;
        rows = this._aHeadRows.concat(
            this._aRows, 
            this._aLockedRow, 
            this._aLockedHeadRow
        );

        var i = 0;
        var timer = function() {
            var row = rows[i];
            if (row) {
                var j;
                if (row._aElements) {
                    var cells = row.getCells();
                    for (j = 0; cell = cells[j]; j++) {
                        $disposeControl(cell);
                    }
                    $disposeControl(row, true);
                }
                i++;
                setTimeout(timer, 0);
            }
            else {
                callback();
            }
        };
        timer();

        //恢复
        attachEvent(WINDOW, 'resize', repaint);
    };

    /**
     * 获取表格当前所有行单选框的引用
     * @private
     */
    UI_CUSTOM_TABLE_CLASS.$bindCheckbox = function () {
        var inputs = this.getBody().getElementsByTagName('input'),
            i, item, type = this.getTypes()[0];

        this._aCheckboxs = [];
        this._eCheckboxAll = null;

        for (i = 0; item = inputs[i]; i++) {
            if (item.type == 'checkbox' 
                    && item.className.indexOf(type + '-checkbox-all') >= 0
            ) {
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
    UI_CUSTOM_TABLE_CLASS.$refreshCheckbox = function (checked) {
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

        if (this._eCheckboxAll) {
            this._eCheckboxAll.checked = checked !== undefined ? checked : newChecked;
        }

        triggerEvent(this, 'checkboxChange');
    };

    /**
     * table生产完毕以后执行，触发sizechange事件
     *
     */
    UI_CUSTOM_TABLE_CLASS.$ready = function() {
        triggerEvent(this, 'sizechange');
    };


    /**
     * 浏览器resize时调整横滚的位置
     *
     * @override
     */
    UI_CUSTOM_TABLE_CLASS.$resize = function() {
        var me = this;
        UI_LOCKED_TABLE_CLASS.$resize.call(this);
        setTimeout(
            function() {
                triggerEvent(me, 'sizechange');
                me.$pagescroll();
            },
            100
        );
    };

    /**
     * 页面滚动时保持表头和横滚浮在视窗上
     *
     * @override
     */
    UI_CUSTOM_TABLE_CLASS.$pagescroll = function() {
        UI_LOCKED_TABLE_CLASS.$pagescroll.call(this);

        if (this._uHScrollbar) {
            setFloatHScroll(this);
        }
    };

    UI_CUSTOM_TABLE_CLASS.getSelection = function () {
        if (!this._aCheckboxs || !this._aCheckboxs.length) {
            return [];
        }

        var res = [];

        for (var i = 0, o; o = this._aCheckboxs[i++]; ) {
            if (o.checked) {
                var index = getAttribute(o, 'data-rownum') - 0;
                res.push(extend({}, this._aData[index]));
            }
        }
        return res;
    };

    /**
     * 根据行号选中行,行号从零开始
     *
     * @public
     * @param {Array} selection
     */
    UI_CUSTOM_TABLE_CLASS.setSelection = function(selection) {
        var selection = selection || [];
        for (var i = 0, len = this._aCheckboxs.length; i < len; i++) {
            if (array.indexOf(selection, i) >= 0) {
                this._aCheckboxs[i].checked = true;
            }
            else {
                this._aCheckboxs[i].checked = false;
            }
        }
        this.$refreshCheckbox();
    };

    /**
     * @override
     */
    UI_CUSTOM_TABLE_CLASS.init = function () {
        var i, item, ele = this.getOuter(),
            control = this;

        UI_LOCKED_TABLE_CLASS.init.call(this);

        // 添加控件全局的事件监听
        // 只支持click mousedown mouseup
        for (i = 0; item = DELEGATE_EVENTS[i]; i++) {
            attachEvent(ele, item, (function (name) {
                return function (event) {
                    var e = event || window.event;
                    e.targetElement = e.target || e.srcElement;
                    control.$fireEventHandler(name, e);
                }
            })(item));
        }
    };

    /**
     * 触发表格events中定义的事件
     * @private
     *
     * @param {String} eventType 事件类型
     * @param {Event} nativeEvent 原生事件参数
     */
    UI_CUSTOM_TABLE_CLASS.$fireEventHandler = function (eventType, nativeEvent) {
        var events = getHandlerByType(this.events, eventType),
            i, item, target = nativeEvent.targetElement, selector;

        for (i = 0; item = events[i]; i++) {
            if (checkElementBySelector(target, item.selector)) {
                item.handler.call(target, nativeEvent, this);
            }
        }
    }

    UI_CUSTOM_TABLE_CLASS.$refresh = function (el, options) {
        var cells = [],
            rows = [];

        addClass(el, this.getTypes()[0]);

        cells = this._aHCells;
        rows = this._aRows.concat(this._aHeadRows, this._aLockedRow, this._aLockedHeadRow);

        for (var i = 0, o; o = cells[i++]; ) {
            disposeControl(o);
        }

        for (var i = 0, o; o = rows[i++]; ) {
            disposeControl(o);
        }

        //释放原表格中的部分引用
        //this._eCheckboxAll && delete this._eCheckboxAll;
        //this._aCheckboxs && delete this._aCheckboxs;

        UI_LOCKED_TABLE_CLASS.$refresh.call(this, el, options);

    };

    /**
     * 让表格的横滚始终悬浮在页面视窗低端
     * 
     * @param {ecui.ui.CustomTable} con
     */
    function setFloatHScroll(con) {
        var el;

        el = con._eBrowser ? con._eBrowser : con._uHScrollbar.getOuter();
        el.style.top = MIN(
            getView().bottom - getPosition(con.getOuter()).top - el.offsetHeight,
            con.getHeight() - el.offsetHeight
        ) + 'px';

        setStyle(el, 'zIndex', 1);
    }

    function getHandlerByType(events, type) {
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
    
    function copyArray(data) {
        var res = [];
        for (var i = 0, o; o = data[i++]; ) {
            res.push(extend({}, o));
        }
        return res;
    }

 }) ();
