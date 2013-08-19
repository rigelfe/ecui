/**
 * 基于ecui实现的一个多功能复杂表格。实现的主要功能包括：
 *     * 左右列锁定, 当列长度溢出容器宽度时则自动出横向滚动条
 *     * 当列长度不足以撑满整个容器时，可以自动将剩余的宽度均匀分配到其它单元格
 *     * 当表格高度过大时可以配置表头和滚动条始终浮动在屏幕视窗上
 *     * 提供按照表头field的排序接口
 *     * 提供方便的事件绑定方法, 使用类似css选择器来选择需要绑定事件的元素
 *     * 可以通过初始化dom元素活使用render方法传入数据来初始化表格
 *     * 支持表头的跨行和跨列
 *
 * 使用方法
 *     * 方法一：
 *      <div ecui="type:custom-table; left-lock:1; right-lock:1">
 *          <table>
 *              <thead>
 *                  <tr>
 *                      <th>公司</th>
 *                      <th>地址</th>
 *                      <th>业务</th>
 *                  </tr>
 *              </thead>
 *              <tbody>
 *                  <tr>
 *                      <td>公司</td>
 *                      <td>地址</td>
 *                      <td>业务</td>
 *                  </tr>
 *              </thead>
 *          </table>
 *      </div>
 *     * 方法二：
 *      <div ecui="id:table;type:custom-table; left-lock:1; right-lock:1;"></div>
 *      
 *      <script>
 *      ecui.get('table').render({
 *          head: [
 *              {
 *                  field: 'XX',
 *                  name: 'XX',
 *              }
 *          ],
 *          datasource: [
 *              {
 *                  'a': 'XX',
 *                  'b': 'XX',
 *              }
 *          ],
 *          sortinfo: {},
 *          lockinfo: {}
 *      });
 *      </script>
 *
 * 表格将表头和表格体拆成两个表格来实现表头浮动，将锁定列绝对定位来实现左右锁定
 * 模拟滚动条并通过改变表格的margin-left来模拟滚动
 *
 * @author hades(denghongqi@baidu.com)
 */
(function() {
    var core = ecui;
    var ui = core.ui;
    var dom = core.dom;
    var string = core.string;
    var util = core.util;
    var array = core.array;

    var UI_CONTROL = ui.Control;
    var UI_CONTROL_CLASS = UI_CONTROL.prototype;

    var DOCUMENT = document;
    var WINDOW = window;
    var USER_AGENT = navigator.userAgent;
    var ieVersion = /msie (\d+\.\d)/i.test(USER_AGENT) 
        ? DOCUMENT.documentMode || (RegExp.$1 - 0) : undefined;
    var chromeVersion = /chrome\/(\d+\.\d+)/i.test(navigator.userAgent) 
        ? + RegExp['\x241'] : undefined;

    ui.FixedTable = core.inherits(
        UI_CONTROL,
        'ui-fixed-table',
        function(el, options) {
            if (!dom.children(el).length) {
                this._bNoTable = true;
                return ;
            }
            else {
                this._bNoTable = false;
            }
            _createWidthControlRow.call(this, el, options);
            this._nLeft = options.leftLock = options.leftLock || 0;
            this._nRight = options.rightLock = options.rightLock || 0;
            this._bFollowHead = options.followHead !== false;
            this._bFollowScroll = options.followScroll !== false;
            this._bNowrap = options.nowrap !== false;
            this._bCheckedHighlight = options.checkedHighlight !== false;
            _createTwoTable.call(this, el, options);

            var o = dom.create();
            el.appendChild(o);
            this._uScroll = core.$fastCreate(this.Scroll, o, this, {});
        },
        function(el, options) {
            if (this._bNoTable) {
                return ;
            }
            _setLockedSize.call(this, el, options);
            var me = this;
            setTimeout(
                function() {
                    var callbacks = me._aCallback || [];
                    while (callbacks.length) {
                        var o = callbacks.shift();
                        var e = o.func.call(null, o.item, o.index);
                        if (!e.nodeName) {
                            o.cell.innerHTML = e;
                        }
                        else {
                            o.cell.innerHTML = '';
                            o.cell.appendChild(e);
                        }
                    }

                    setTimeout(
                        function() {
                            ecui.init(el);
                            core.triggerEvent(me, 'renderFinish');
                            if (ieVersion === 7) {
                                me.$setSize();
                            }
                        },
                        10
                    )
                },
                50
            );
            this._bindCheckbox();
        }
    );
    var UI_FIXED_TABLE = ui.FixedTable;
    var UI_FIXED_TABLE_CLASS = UI_FIXED_TABLE.prototype;

    var DELEGATE_EVENTS = ['click', 'mouseup', 'mousedown'];
    var DEFAULT_EVENTS = {
        'click th.ui-fixed-table-hcell-sort': function (event, control) {
            var field = this.getAttribute('data-field');
            var orderby;
            if (this.className.indexOf('-sort-desc') >= 0) {
                orderby = 'asc';
            }
            else if (this.className.indexOf('-sort-asc') >= 0) {
                orderby = 'desc'
            }
            else {
                orderby = this.getAttribute('data-orderby') || 'desc';
            }
            core.triggerEvent(control, 'sort', null, [field, orderby]);
        },
        'click input.ui-fixed-table-checkbox-all': function (event, control) {
            control._refreshCheckbox(this.checked);
        },
        'click input.ui-fixed-table-checkbox': function (event, control) {
            control._refreshCheckbox();
        }
    };      

    /**
     * 根据header和datasource生成dom元素
     * 表头只支持跨两行
     *
     * @private
     */
    function _createDom(el, options, callback) {
        var table = dom.create('', '', 'table');
        var thead = dom.create('', '', 'thead');
        var tbody = dom.create('', '', 'tbody');
        table.appendChild(thead);
        table.appendChild(tbody);
        el.appendChild(table);
        this._aFields = _createHeadDom.call(this, thead, options);
        _createBodyDom.call(this, tbody, options, callback);
    }

    /**
     * 生成表头元素和fields
     *
     * @private
     * @param {HTML element} thead
     * @param {Object} options
     * @return {Array}
     */
    function _createHeadDom(thead, options) {
        var type = this.getType();
        options.fields = options.fields || [];
        var head;
        var fields = [];
        if (Object.prototype.toString.call(options.fields[0]) == '[object Object]') {
            head = [];
            head.push(options.fields);
        }
        else {
            head = options.fields;
        }
        for (var i = 0; i < head.length; i++) {
            var row = head[i];
            var tr = dom.create('', '', 'tr');
            thead.appendChild(tr);
            for (var j = 0; j < row.length; j++) {
                var o = row[j];
                var th = dom.create('', '', 'th');
                if (parseInt(o.rowspan, 10) >= 2 || i == 1) {
                    fields.push(o);
                }
                else {
                    var colspan = parseInt(o.colspan, 10);
                    colspan = isNaN(colspan) ? 1 : colspan;
                    fields.push(colspan);
                }
                if (parseInt(o.rowspan, 10) >= 2) {
                    th.setAttribute('rowSpan', o.rowspan);
                }
                if (parseInt(o.colspan, 10) >= 2) {
                    th.setAttribute('colSpan', o.colspan);
                }
                if (o.width) {
                    dom.setStyle(th, 'width', o.width + 'px');
                }
                if (o.field) {
                    th.setAttribute('data-field', o.field);
                }
                if (o.sortable) {
                    dom.addClass(th, type + '-hcell-sort');
                }
                if (o.field && o.field == options.sortby) {
                    dom.addClass(th, type + '-hcell-sort-' + options.orderby.toLowerCase());
                }
                if (o.order) {
                    th.setAttribute('data-orderby', o.order.toLowerCase());
                }

                if (o.checkbox) {
                    dom.setStyle(th, 'width', '16px');
                    th.innerHTML = '<input type="checkbox" class="'
                        + type + '-checkbox-all"'
                        + ' />';
                }
                else {
                    th.innerHTML = o.name;
                }
                if (o.tip && o.tip.length) {
                    var tipEl = dom.create('', 'margin-left:3px;', 'span');
                    tipEl.setAttribute(
                        'ecui', 
                        'type:tip;message:' + string.encodeHTML(o.tip)
                    );
                    th.appendChild(tipEl);
                    ecui.init(th);
                }
                tr.appendChild(th);
            }
        }
        var fieldsRes = [];
        for (var i = fields.length - 1; i >= 0; i--) {
            var field = fields[i];
            if (typeof field == 'object') {
                fieldsRes.unshift(field);
            }
            else if (typeof field == 'number') {
                for (var j = 0; j < field; j++) {
                    fieldsRes.unshift(fieldsRes.pop());
                }
            }
        }
        if (Object.prototype.toString.call(options.fields[0]) == '[object Object]') {
            fieldsRes = options.fields;
        }

        if (fieldsRes.length == options.leftLock + options.rightLock) {
            options.leftLock = options.rightLock = 0;
        }
        return fieldsRes;
    }

    /**
     * 生成tbody的dom结构
     *
     * @private
     * @param {HTML element} tbody
     * @param {Object} options
     * @param {Array} fields
     */
    function _createBodyDom(tbody, options, callback) {
        this._aCallback = [];
        var type = this.getType();
        var datasource = options.datasource || [];
        var fields = this._aFields;
        var len = datasource.length;
        var begin = 0;
        var me = this;
        timer();
        function timer() {
            var end = begin + 20;
            var end = len < end ? len : end;
            for (var i = begin; i < end; i++) {
                var tr = dom.create('', '', 'tr');
                var item = datasource[i];
                for (var j = 0; j < fields.length; j++) {
                    var o = fields[j];
                    var td = dom.create('', '', 'td');
                    if (o.align) {
                        td.setAttribute('align', o.align);
                    }
                    if (item.bgcolor) {
                        dom.setStyle(td, 'backgroundColor', item.bgcolor);
                    }
                    if (o.checkbox) {
                        td.innerHTML = '<input type="checkbox"'
                            + ' data-rownum="' + i + '"'
                            + ' class="' + type + '-checkbox"'
                            + ' />';
                    }
                    else if (o.content && typeof o.content == 'function') {
                        me._aCallback.push({
                            cell: td,
                            func: o.content,
                            item: item,
                            index: i
                        });
                        td.innerHTML = '-';
                    }
                    else {
                        td.innerHTML = string.encodeHTML(item[o.field]);
                    }
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            }
            begin = end;
            if (end < len) {
                setTimeout(timer, 10);
            }
            else {
                callback.call(me);
            }
        }
    }

    /**
     * 如果表格的首行有colspan，计算宽度会出现问题，需要做特殊处理
     * 暂时只解决表头跨两行的问题
     * todo:解决表头跨多行的问题
     * 
     * @private
     */
    function _createWidthControlRow(el, options) {
        var thead = el.getElementsByTagName('thead')[0];
        var headRows = dom.children(thead);

        var widthControlRow = dom.create('', '', 'tr');
        var cells = dom.children(headRows[0]);
        this._bDoubleHead = headRows.length == 2 ? true : false;
        var cursor = 0;
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var colspan = parseInt(dom.getAttribute(cell, 'colSpan'), 10);
            var rowspan = parseInt(dom.getAttribute(cell, 'rowSpan'), 10);

            colspan = isNaN(colspan) ? 1 : colspan;
            rowspan = isNaN(rowspan) ? 1 : rowspan;

            if (colspan >= 2) {
                for (var j = 0; j < colspan; j++) {
                    var cloneCell = dom.create('', 'border-bottom:none;', 'th');
                    var secondRowCells = dom.children(headRows[1]);
                    dom.setStyle(
                        cloneCell, 'width', secondRowCells[cursor].style.width
                    );
                    cursor++;
                    widthControlRow.appendChild(cloneCell);
                }
            }
            else if (this._bDoubleHead && rowspan == 1) {
                var cloneCell = dom.create('', 'border-bottom:none;', 'th');
                var secondRowCells = dom.children(headRows[1]);
                dom.setStyle(
                    cloneCell, 'width', secondRowCells[cursor].style.width
                );
                cursor++;
                widthControlRow.appendChild(cloneCell);
            }
            else {
                var cloneCell = dom.create('', 'border-bottom:none;', 'th');
                dom.setStyle(cloneCell, 'width', cell.style.width);
                widthControlRow.appendChild(cloneCell);

                if (rowspan <= 1) {
                    cursor++;
                }
            }
        }

        dom.insertBefore(widthControlRow, headRows[0]);
    }

    UI_FIXED_TABLE_CLASS._scroll = function(scrollLeft) {
        var headTable = dom.children(this._uHead._eInner)[0];
        var bodyTable = dom.children(this._uBody._eInner)[0];
        headTable.style.marginLeft = (0 - scrollLeft) + 'px';
        bodyTable.style.marginLeft = (0 - scrollLeft) + 'px';
    };

    /**
     * 页面滚动的时候执行,处理表头跟随和滚动条的浮动
     *
     * @override
     */
    function pagescroll() {
        if (!this._bFollowHead && !this._bFollowScroll) {
            return ;
        }
        if (!this._uHead) {
            return ;
        }
        var headEl = this._uHead.getOuter();
        var el = this.getOuter();
        var view = util.getView();
        var pos = dom.getPosition(el);
        if (pos.top < view.top) {
            dom.setStyle(headEl, 'position', 'fixed');
            dom.setStyle(headEl, 'left', pos.left + 'px');
        }
        else {
            dom.setStyle(headEl, 'position', 'absolute');
            dom.setStyle(headEl, 'left', 0);
        }
        if (!this._uScroll.isShow()) {
            return ;
        }
        var scrollEl = this._uScroll.getOuter();
        if (pos.top + this.getHeight() - 15 > view.bottom) {
            dom.setStyle(scrollEl, 'position', 'fixed');
            dom.setStyle(scrollEl, 'bottom', 0);
        }
        else {
            dom.setStyle(scrollEl, 'position', 'static');
        }
    };

    UI_FIXED_TABLE_CLASS.$pagescroll = pagescroll;

    /**
     * 将原先表格的head和body分别拆分到两个table中
     *
     * @private
     * @param {HTML element} el
     * @param {Object} options
     */
    function _createTwoTable(el, options) {
        var type = this.getTypes()[0];
        var bodyTable = dom.first(el);
        var headTable = dom.create('', '', 'table');
        headTable.appendChild(dom.create('', '', 'thead'));
        headTable.appendChild(dom.create('', '', 'tbody'));
        dom.moveElements(dom.first(bodyTable), dom.first(headTable), true);

        var bodyTableWrap = dom.create();
        var headTableWrap = dom.create();
        bodyTableWrap.appendChild(bodyTable);
        headTableWrap.appendChild(headTable);
        el.appendChild(bodyTableWrap);
        el.appendChild(headTableWrap);

        this._uHead = core.$fastCreate(this.Head, dom.last(el), this, options);
        this._uBody = core.$fastCreate(this.Body, dom.first(el), this, options);
    }

    /**
     * 初始化设定锁定的部分的宽度
     *
     * @private
     */
    function _setLockedSize(el, options) {
        var initFieldsWidth = this._uHead.getInitFieldsWidth();
        var headRows = this._uHead.getRows();
        var bodyRows = this._uBody.getRows();
        var rows = headRows.concat(bodyRows);
        var top = 0;
        if (ieVersion === 7) {
            top = 1;
        }
        for (var i = 0, len = rows.length; i < len; i++) {
            var cells = rows[i].getCells();
            var left = 0;
            var right = 0;
            for (var j = 0; j < this._nLeft; j++) {
                var cell = cells[j];
                if (this._bDoubleHead && i == 1) {
                    dom.setStyle(cell, 'height', '61px');
                    dom.setStyle(cell, 'lineHeight', '61px');
                }
                if (this._bDoubleHead && i == 2) {
                    continue ;
                }
                dom.setStyle(cell, 'position', 'absolute');
                dom.setStyle(cell, 'top', top + 'px');
                dom.setStyle(cell, 'left', left + 'px');
                left += initFieldsWidth[j];
            }
            for (var j = 0; j < this._nRight; j++) {
                var cell = cells[cells.length - j - 1];
                if (this._bDoubleHead && i == 1) {
                    dom.setStyle(cell, 'height', '61px');
                    dom.setStyle(cell, 'lineHeight', '61px');
                }
                if (this._bDoubleHead && i == 2) {
                    continue ;
                }
                dom.setStyle(cell, 'position', 'absolute');
                dom.setStyle(cell, 'top', top + 'px');
                dom.setStyle(cell, 'right', right + 'px');
                right += initFieldsWidth[initFieldsWidth.length - j - 1];
            } 

            if (i < headRows.length - 1) {
                top += cells[0].offsetHeight;
            }
            else if (i == headRows.length - 1) {
                top = 0;
            }
            else {
                top += 30;
            }
        }

        this._nLeftLockedWidth = 0;
        this._nRightLockedWidth = 0;

        for (var i = 0; i < this._nLeft; i++) {
            this._nLeftLockedWidth += initFieldsWidth[i];
        }
        var len = initFieldsWidth.length;
        for (var i = 0; i < this._nRight; i++) {
            this._nRightLockedWidth += initFieldsWidth[len - i - 1];
        }
        
        dom.setStyle(
            this._uHead._eInner, 'marginLeft', this._nLeftLockedWidth + 'px'
        );
        dom.setStyle(
            this._uHead._eInner, 'marginRight', this._nRightLockedWidth + 'px'
        );
        dom.setStyle(
            this._uBody._eInner, 'marginLeft', this._nLeftLockedWidth + 'px'
        );
        dom.setStyle(
            this._uBody._eInner, 'marginRight', this._nRightLockedWidth + 'px'
        );

        dom.setStyle(
            this._uScroll.getOuter(), 'marginLeft', this._nLeftLockedWidth + 'px'
        );
        dom.setStyle(
            this._uScroll.getOuter(), 'marginRight', this._nRightLockedWidth + 'px'
        );

        if (!ieVersion && this._bDoubleHead && (this._nLeft || this._nRight)) {
            var cells = rows[2].getCells();
            dom.insertBefore(dom.create('', '', 'th'), cells[0]);
            // this.$resize();
        }
    };

    /**
     * $setSize
     *
     * @override
     */
    UI_FIXED_TABLE_CLASS.$setSize = function() {
        if (this._bNoTable) {
            return ;
        }
        if (ieVersion < 8) {
            this.$pagescroll = util.blank;
        }
        var el = this.getOuter();
        var headEl = this._uHead.getOuter();
        var scrollEl = this._uScroll.getOuter();
        dom.setStyle(headEl, 'position', 'absolute');
        dom.setStyle(headEl, 'left', 0);
        dom.setStyle(scrollEl, 'position', 'static');

        this._uHead._autoResize();
        this._nContentWidth = this._uHead.getContentWidth();
        var paddingTop = this._uHead.getHeight() - 1;
        if (chromeVersion) {
            paddingTop += 2;
        }
        dom.setStyle(el, 'paddingTop', paddingTop + 'px');
        var widthControlCells = this.getWidthControlCells();
        var fieldsWidth = [];
        for (var i = 0; i < widthControlCells.length; i++) {
            var cell = widthControlCells[i];
            fieldsWidth.push(cell.getBodyWidth());
        }
        this._uHead._setSize(fieldsWidth);
        this._uBody._setSize(fieldsWidth);

        this._uScroll._setSize(this._nContentWidth);

        this._uScroll._scroll();
        if (ieVersion < 8) {
            this.$pagescroll = pagescroll;
        }
        core.triggerEvent(this, 'pagescroll');
    };

    UI_FIXED_TABLE_CLASS.getWidthControlCells = function() {
        return this._uHead.getWidthControlCells();
    };

    /**
     * 获取各列的初始宽度
     *
     * @public
     * @return {Array}
     */
    UI_FIXED_TABLE_CLASS.getInitFieldsWidth = function() {
        return this._uHead.getInitFieldsWidth();
    };

    /**
     * 根据数据绘制表格
     *
     * @public
     * @param {Object} options
     */
    UI_FIXED_TABLE_CLASS.render = function(options) {
        util.detachEvent(WINDOW, 'resize', core.repaint);
        if (this._uHead) {
            var rows = this._uHead.getRows();
            for (var i = 0; i < rows.length; i++) {
                var cellControls = rows[i].getCellControls();
                for (var j = 0; j < cellControls.length; j++) {
                    core.$dispose(cellControls[j], true);
                }
                core.$dispose(rows[i], true);
            }
        }
        if (this._uBody) {
            var rows = this._uBody.getRows();
            for (var i = 0; i < rows.length; i++) {
                core.$dispose(rows[i]);
            }
        }
        var el = this.getOuter();
        el.innerHTML = '';
        this.$resize();
        if (options.fields) {
            this._aData = options.datasource || [];
            _createDom.call(this, el, options, domReadyCallback);
        }
        function domReadyCallback() {
            UI_FIXED_TABLE.client.call(this, el, options);
            this._bCreated = false;
            this.cache(true, true);
            //this.init();
            UI_CONTROL_CLASS.init.call(this);
            this._bCreated = true;
            util.attachEvent(WINDOW, 'resize', core.repaint);
            // this.cache(true, true);
            //this.resize();
            // if (ieVersion === 7) {
            //     this.resize();
            // }
        }
    };

    /**
     * 获取表格数据
     *
     * @public
     * @return {Array}
     */
    UI_FIXED_TABLE_CLASS.getData = function() {
        return this._aData || [];
    };

    /**
     * 获取表格中被checkbox勾选中的数据
     *
     * @public
     * @return {Array}
     */
    UI_FIXED_TABLE_CLASS.getSelection = function() {
        if (!this._aCheckboxs || !this._aCheckboxs.length) {
            return [];
        }

        var res = [];
        for (var i = 0, o; o = this._aCheckboxs[i++]; ) {
            if (o.checked) {
                var index = dom.getAttribute(o, 'data-rownum') - 0;
                res.push(util.extend({}, this._aData[index]));
            }
        }
        return res;
    };

    /**
     * 根据行号选中行，行号从零开始
     *
     * @public
     * @param {Array} selection
     */
    UI_FIXED_TABLE_CLASS.setSelection = function(selection) {
        var selection = selection || [];
        for (var i = 0, len = this._aCheckboxs.length; i < len; i++) {
            if (array.indexOf(selection, i) >= 0) {
                this._aCheckboxs[i].checked = true;
            }
            else {
                this._aCheckboxs[i].checked = false;
            }
        }
        this._refreshCheckbox();
    };

    /**
     * @override
     */
    UI_FIXED_TABLE_CLASS.init = function () {
        var el = this.getOuter();
        var control = this;

        UI_CONTROL_CLASS.init.call(this);

        // 添加控件全局的事件监听
        // 只支持click mousedown mouseup
        var item;
        for (var i = 0; item = DELEGATE_EVENTS[i]; i++) {
            util.attachEvent(el, item, (function (name) {
                return function (event) {
                    var e = event || window.event;
                    e.targetElement = e.target || e.srcElement;
                    control._fireEventHandler(name, e);
                }
            })(item));
        }
    };

    /**
     * 表格渲染完成之后执行
     *
     * @override
     */
    UI_FIXED_TABLE_CLASS.$ready = function() {
        // core.triggerEvent(this, 'pagescroll');
        // core.triggerEvent(this, 'select');
    };

    /**
     * 触发表格events中定义的事件
     * @private
     *
     * @param {String} eventType 事件类型
     * @param {Event} nativeEvent 原生事件参数
     */
    UI_FIXED_TABLE_CLASS._fireEventHandler = function (eventType, nativeEvent) {
        var events = getHandlerByType(this.events, eventType);
        var target = nativeEvent.targetElement;

        var item;
        for (var i = 0; item = events[i]; i++) {
            if (checkElementBySelector(target, item.selector)) {
                item.handler.call(target, nativeEvent, this);
            }
        }
    };

    /**
     * 获取表格当前所有行单选框的引用
     * @private
     */
    UI_FIXED_TABLE_CLASS._bindCheckbox = function () {
        var inputs = this.getBody().getElementsByTagName('input');
        var type = this.getTypes()[0];

        this._aCheckboxs = [];
        this._eCheckboxAll = null;

        var item;
        for (var i = 0; item = inputs[i]; i++) {
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
    UI_FIXED_TABLE_CLASS._refreshCheckbox = function (checked) {
        var newChecked = true;
        var item;
        var tr;
        var type = this.getType();
        for (var i = 0; item = this._aCheckboxs[i]; i++) {
            tr = item.parentNode.parentNode;
            if (checked !== undefined) {
                item.checked = checked;
            }
            else {
                newChecked = item.checked && newChecked;
            }

            if (item.checked && this._bCheckedHighlight) {
                dom.addClass(tr, 'ui-fixed-table-row-highlight');
            }
            else if (this._bCheckedHighlight) {
                dom.removeClass(tr, 'ui-fixed-table-row-highlight');
            }
        }

        if (this._eCheckboxAll) {
            this._eCheckboxAll.checked = checked !== undefined ? checked : newChecked;
        }

        core.triggerEvent(this, 'select');
    };

    function getHandlerByType(events, type) {
        var handlers = [], item;

        events = util.extend({}, events);
        events = util.extend(events, DEFAULT_EVENTS);

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

    UI_FIXED_TABLE_CLASS.Head = core.inherits(
        UI_CONTROL,
        'ui-fixed-table', 
        function(el, options) {
            var type = this.getType();
            dom.addClass(el, type + '-head');
            dom.setStyle(el, 'position', 'absolute');
            dom.setStyle(el, 'top', 0);
            dom.setStyle(el, 'left', 0);
            preprocess.call(this, el, options);
            var rows = el.getElementsByTagName('tr');
            this._aRows = [];
            options.createCellControl = true;
            for (var i = 0; i < rows.length; i++) {
                this._aRows.push(core.$fastCreate(
                    UI_FIXED_TABLE_CLASS.Row, rows[i], this, options
                ));
            }
        },
        function(el, options) {
            var firstHeadRow = el.getElementsByTagName('tr')[0];
            var tempCell = dom.create('', '', 'th');
            firstHeadRow.appendChild(tempCell);
            this._aInitFieldsWidth = [];
            var widthControlCells = this.getWidthControlCells();
            for (var i = 0; i < widthControlCells.length; i++) {
                var cell = widthControlCells[i];
                cell.resize();
                this._aInitFieldsWidth.push(cell.getWidth());
            }
            firstHeadRow.removeChild(tempCell);
            //this._setSize();
            //dom.setStyle(dom.children(this._eMiddle)[0], 'width', '100%');
        }
    );
    var UI_FIXED_TABLE_HEAD_CLASS = UI_FIXED_TABLE_CLASS.Head.prototype;

    UI_FIXED_TABLE_HEAD_CLASS._setSize = function(fieldsWidth) {
        this.resize();
        // this._autoResize();
        // var par = this.getParent();
        // var parEl = par.getOuter();
        // var paddingTop = this.getHeight() - 1;
        // if (chromeVersion) {
        //     paddingTop += 1;
        // }
        // dom.setStyle(parEl, 'paddingTop', paddingTop + 'px');
        if (ieVersion === 7) {
            _unitTableSetSize.call(this, fieldsWidth);
        }
    };

    /**
     * 当单元格宽度不足时自适应撑满容器
     *
     * @private
     */
    UI_FIXED_TABLE_HEAD_CLASS._autoResize = function() {
        var initFieldsWidth = this._aInitFieldsWidth.slice();
        var widthControlCells = this.getWidthControlCells().slice();
        for (var i = 0; i < this._nLeft; i++) {
            initFieldsWidth.shift();
            widthControlCells.shift();
        }
        for (var i = 0; i < this._nRight; i++) {
            initFieldsWidth.pop();
            widthControlCells.pop();
        }
        this.resize();
        this._uInner.resize();
        var width = this._uInner.getBodyWidth();
        var cellWidthSum = 0;
        for (var i = 0; i < initFieldsWidth.length; i++) {
            cellWidthSum += initFieldsWidth[i];
        }
        if (cellWidthSum < width) {
            for (var i = 0, len = widthControlCells.length; i < len; i++) {
                var diff = width - cellWidthSum;
                var delta = parseInt(diff / (len - i));
                cellWidthSum += delta;

                var cell = widthControlCells[i];
                var height = cell.getHeight();
                cell.setSize(initFieldsWidth[i] + delta, height);
            }
        }
    };

    /**
     * 获取控制表头宽度的单元格
     */
    UI_FIXED_TABLE_HEAD_CLASS.getWidthControlCells = function() {
        var headRows = this.getRows();
        return headRows[0].getCellControls();
        //todo 支持双表头
    };

    UI_FIXED_TABLE_HEAD_CLASS.getContentWidth = function() {
        var table = dom.children(this._eInner)[0];
        return table.offsetWidth;
    };

    /**
     * 获取初始单元格宽度
     *
     * @public
     * @return {Array}
     */
    UI_FIXED_TABLE_HEAD_CLASS.getInitFieldsWidth = function() {
        return this._aInitFieldsWidth;
    };

    UI_FIXED_TABLE_CLASS.Body = core.inherits(
        UI_CONTROL, 
        'ui-fixed-table', 
        function(el, options) {
            this._bNowrap = options.nowrap !== false;
            options.createCellControl = false;
            preprocess.call(this, el, options);
        },
        function(el, options) {
            var tbody = el.getElementsByTagName('tbody')[0];
            if (dom.children(tbody).length) {
                return ;
            }
            var type = this.getType();
            var emptyEl = dom.create(type + '-empty');
            if (options.noData) {
                emptyEl.innerHTML = string.encodeHTML(options.noData);
            }
            else {
                emptyEl.innerHTML = '暂无数据，请稍后再试';
            }
            el.appendChild(emptyEl);
        }
    );
    var UI_FIXED_TABLE_BODY_CLASS = UI_FIXED_TABLE_CLASS.Body.prototype;

    UI_FIXED_TABLE_BODY_CLASS._setSize = function(fieldsWidth) {
        _unitTableSetSize.call(this, fieldsWidth);
        var rows = this.getRows();
        var top = 1;
        for (var i = 0, len = rows.length; i < len; i++) {
            var row = rows[i];
            var cells = row.getCells();
            var cellHeight;
            if (this._bNowrap) {
                cellHeight = i === 0 ? 29 : 30;
            }
            else {
                cellHeight = cells[this._nLeft].offsetHeight - 1;
            }
            if (cellHeight < 0) {
                continue ;
            }
            for (var j = 0; j < this._nLeft; j++) {
                dom.setStyle(cells[j], 'height', cellHeight + 'px');
                dom.setStyle(cells[j], 'top', top + 'px');
            }
            for (var j = 0; j < this._nRight; j++) {
                var cell = cells[cells.length - j - 1];
                dom.setStyle(cell, 'height', cellHeight + 'px');
                dom.setStyle(cell, 'top', top + 'px');
            }
            top += cellHeight + 1;
        }
    };

    UI_FIXED_TABLE_HEAD_CLASS.getRows =
    UI_FIXED_TABLE_BODY_CLASS.getRows = function() {
        return this._aRows || [];
    };

    /**
     * table setSize时调用
     *
     * @private
     */
    function _unitTableSetSize(fieldsWidth) {
        var fieldsWidth = fieldsWidth || [];
        var rows = this.getRows();
        if (!rows || !rows.length) {
            return ;
        }
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var cells = row.getCells();
            var len = cells.length;
            if (cells.length != fieldsWidth.length) {
                continue ;
            }
            for (var j = 0; j < this._nLeft; j++) {
                dom.setStyle(cells[j], 'width', fieldsWidth[j] + 'px');
            }
            if (i == 0) {
                for (var j = this._nLeft; j < len - this._nRight; j++) {
                    dom.setStyle(cells[j], 'width', fieldsWidth[j] + 'px');
                }
            }
            for (var j = len - this._nRight; j < len; j++) {
                dom.setStyle(cells[j], 'width', fieldsWidth[j] + 'px');
            }
        }
    }

    /**
     * @private
     */
    function preprocess(el, options) {
        var type = this.getTypes()[0];
        this._nLeft = options.leftLock;
        this._nRight = options.rightLock;
        dom.addClass(el, type + '-outer');
        this._eInner = dom.create(type + '-inner', '', 'div');
        dom.moveElements(el, this._eInner, true);
        el.appendChild(this._eInner);

        this._uInner = core.$fastCreate(
            UI_FIXED_TABLE_CLASS.Inner, this._eInner, this, {}
        );
        var rows = el.getElementsByTagName('tr');
        this._aRows = [];
        for (var i = 0; i < rows.length; i++) {
            this._aRows.push(core.$fastCreate(
                UI_FIXED_TABLE_CLASS.Row, rows[i], this, options
            ));
        }
    }

    UI_FIXED_TABLE_CLASS.Inner = core.inherits(UI_CONTROL);
    var UI_FIXED_TABLE_INNER_CLASS = UI_FIXED_TABLE_CLASS.Inner.prototype;

    UI_FIXED_TABLE_INNER_CLASS.resize = function() {
        UI_CONTROL_CLASS.resize.call(this);
        this.$setSize(this.getWidth(), this.getHeight() + 1);
    };

    UI_FIXED_TABLE_CLASS.Row = core.inherits(
        UI_CONTROL,
        'ui-fixed-table-row',
        function(el, options) {
            dom.addClass(el, 'ui-fixed-table-row');
            this._aCells = dom.children(el);

            if (options.createCellControl) {
                this._aCellControls = [];
                for (var i = 0; i < this._aCells.length; i++) {
                    this._aCellControls.push(core.$fastCreate(
                        UI_CONTROL, this._aCells[i], this, {}
                    ));
                }
            }
        }
    );
    var UI_FIXED_TABLE_ROW_CLASS = UI_FIXED_TABLE_CLASS.Row.prototype;

    /**
     * 获取行中的单元格
     *
     * @public
     * @return {Array}
     */
    UI_FIXED_TABLE_ROW_CLASS.getCells = function() {
        return this._aCells || [];
    };

    /**
     * 获取行中的单元格控件
     *
     * @public
     * @return {Array}
     */
    UI_FIXED_TABLE_ROW_CLASS.getCellControls = function() {
        return this._aCellControls || [];
    };

    UI_FIXED_TABLE_CLASS.Scroll = core.inherits(
        UI_CONTROL,
        'ui-fixed-table-scroll',
        function(el, options) {
            var type = this.getType();
            dom.addClass(el, type);
            this._eInner = dom.create(type + '-inner');
            el.appendChild(this._eInner);
        },
        function(el, options) {
            var me = this
            util.attachEvent(el, 'scroll', function() {
                me._scroll();
            });
        }
    );
    var UI_FIXED_TABLE_SCROLL_CLASS = UI_FIXED_TABLE_CLASS.Scroll.prototype;

    UI_FIXED_TABLE_SCROLL_CLASS._setSize = function(innerWidth) {
        this.show();
        this.resize();
        var innerWidth = innerWidth || 0;
        dom.setStyle(this._eInner, 'width', innerWidth + 'px');
        if (innerWidth <= this.getWidth()) {
            this.hide();
        }
        else {
            this.show();
        }
    };

    UI_FIXED_TABLE_SCROLL_CLASS._scroll = function() {
        var el = this.getOuter();
        this.getParent()._scroll(el.scrollLeft);
    };
})();
