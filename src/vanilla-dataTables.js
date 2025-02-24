(function (root, factory) {
    var plugin = "DataTable";
    if (typeof exports === "object") {
        module.exports = factory(plugin);
    }
    else if (typeof define === "function" && define.amd) {
        define([], factory(plugin));
    }
    else {
        root[plugin] = factory(plugin);
    }
})(typeof global !== 'undefined' ? global : this.window || this.global, function (plugin) {
    "use strict";
    var win = window, doc = document, body = doc.body;
    var defaultConfig = {
        perPage: 10,
        perPageSelect: [5, 10, 15, 20, 25],
        sortable: true,
        searchable: true,
        nextPrev: true,
        firstLast: false,
        prevText: "&lsaquo;",
        nextText: "&rsaquo;",
        firstText: "&laquo;",
        lastText: "&raquo;",
        ellipsisText: "&hellip;",
        ascText: "▴",
        descText: "▾",
        truncatePager: true,
        pagerDelta: 2,
        fixedColumns: true,
        fixedHeight: false,
        header: true,
        footer: false,
        labels: {
            placeholder: "Search...",
            perPage: "{select} entries per page",
            noRows: "No entries found",
            info: "Showing {start} to {end} of {rows} entries"
        },
        layout: {
            top: "{select}{search}",
            bottom: "{info}{pager}"
        }
    };
    var isObject = function (val) {
        return Object.prototype.toString.call(val) === "[object Object]";
    };
    var isArray = function (val) {
        return Array.isArray(val);
    };
    var isJson = function (str) {
        var t = !1;
        try {
            t = JSON.parse(str);
        }
        catch (e) {
            return !1;
        }
        return !(null === t || (!isArray(t) && !isObject(t))) && t;
    };
    var extend = function (src, props) {
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                var val = props[prop];
                if (val && isObject(val)) {
                    src[prop] = src[prop] || {};
                    extend(src[prop], val);
                }
                else {
                    src[prop] = val;
                }
            }
        }
        return src;
    };
    var each = function (arr, fn, scope) {
        var n;
        if (isObject(arr)) {
            for (n in arr) {
                if (Object.prototype.hasOwnProperty.call(arr, n)) {
                    fn.call(scope, arr[n], n);
                }
            }
        }
        else {
            for (n = 0; n < arr.length; n++) {
                fn.call(scope, arr[n], n);
            }
        }
    };
    var on = function (el, e, fn) {
        el.addEventListener(e, fn, false);
    };
    var createElement = function (a, b) {
        var d = doc.createElement(a);
        if (b && "object" == typeof b) {
            var e;
            for (e in b) {
                if ("html" === e) {
                    d.innerHTML = b[e];
                }
                else {
                    d.setAttribute(e, b[e]);
                }
            }
        }
        return d;
    };
    var flush = function (el, ie) {
        if (el instanceof NodeList) {
            each(el, function (e) {
                flush(e, ie);
            });
        }
        else {
            if (ie) {
                while (el.hasChildNodes()) {
                    el.removeChild(el.firstChild);
                }
            }
            else {
                el.innerHTML = "";
            }
        }
    };
    var button = function (c, p, t) {
        return createElement("li", {
            class: c,
            html: '<a href="#" data-page="' + p + '">' + t + "</a>"
        });
    };
    var classList = {
        add: function (s, a) {
            if (s.classList) {
                s.classList.add(a);
            }
            else {
                if (!classList.contains(s, a)) {
                    s.className = s.className.trim() + " " + a;
                }
            }
        },
        remove: function (s, a) {
            if (s.classList) {
                s.classList.remove(a);
            }
            else {
                if (classList.contains(s, a)) {
                    s.className = s.className.replace(new RegExp("(^|\\s)" + a.split(" ").join("|") + "(\\s|$)", "gi"), " ");
                }
            }
        },
        contains: function (s, a) {
            if (s)
                return s.classList ?
                    s.classList.contains(a) :
                    !!s.className &&
                        !!s.className.match(new RegExp("(\\s|^)" + a + "(\\s|$)"));
        }
    };
    var sortItems = function (a, b) {
        var c, d;
        if (1 === b) {
            c = 0;
            d = a.length;
        }
        else {
            if (b === -1) {
                c = a.length - 1;
                d = -1;
            }
        }
        for (var e = !0; e;) {
            e = !1;
            for (var f = c; f != d; f += b) {
                if (a[f + b] && a[f].value > a[f + b].value) {
                    var g = a[f], h = a[f + b], i = g;
                    a[f] = h;
                    a[f + b] = i;
                    e = !0;
                }
            }
        }
        return a;
    };
    var truncate = function (a, b, c, d, ellipsis) {
        d = d || 2;
        var j, e = 2 * d, f = b - d, g = b + d, h = [], i = [];
        if (b < 4 - d + e) {
            g = 3 + e;
        }
        else if (b > c - (3 - d + e)) {
            f = c - (2 + e);
        }
        for (var k = 1; k <= c; k++) {
            if (1 == k || k == c || (k >= f && k <= g)) {
                var l = a[k - 1];
                classList.remove(l, "active");
                h.push(l);
            }
        }
        each(h, function (c) {
            var d = c.children[0].getAttribute("data-page");
            if (j) {
                var e = j.children[0].getAttribute("data-page");
                if (d - e == 2)
                    i.push(a[e]);
                else if (d - e != 1) {
                    var f = createElement("li", {
                        class: "ellipsis",
                        html: '<a href="#">' + ellipsis + "</a>"
                    });
                    i.push(f);
                }
            }
            i.push(c);
            j = c;
        });
        return i;
    };
    var dataToTable = function (data) {
        var thead = false, tbody = false;
        data = data || this.options.data;
        if (data.headings) {
            thead = createElement("thead");
            var tr = createElement("tr");
            each(data.headings, function (col) {
                var td = createElement("th", {
                    html: col
                });
                tr.appendChild(td);
            });
            thead.appendChild(tr);
        }
        if (data.data && data.data.length) {
            tbody = createElement("tbody");
            each(data.data, function (rows) {
                if (data.headings) {
                    if (data.headings.length !== rows.length) {
                        throw new Error("The number of rows do not match the number of headings.");
                    }
                }
                var tr = createElement("tr");
                each(rows, function (value) {
                    var td = createElement("td", {
                        html: value
                    });
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }
        if (thead) {
            if (this.table.tHead !== null) {
                this.table.removeChild(this.table.tHead);
            }
            this.table.appendChild(thead);
        }
        if (tbody) {
            if (this.table.tBodies.length) {
                this.table.removeChild(this.table.tBodies[0]);
            }
            this.table.appendChild(tbody);
        }
    };
    var parseDate = function (content, format) {
        var date = false;
        if (format) {
            switch (format) {
                case "ISO_8601":
                    date = moment(content, moment.ISO_8601).format("YYYYMMDD");
                    break;
                case "RFC_2822":
                    date = moment(content, "ddd, MM MMM YYYY HH:mm:ss ZZ").format("YYYYMMDD");
                    break;
                case "MYSQL":
                    date = moment(content, "YYYY-MM-DD hh:mm:ss").format("YYYYMMDD");
                    break;
                case "UNIX":
                    date = moment(content).unix();
                    break;
                default:
                    date = moment(content, format).format("YYYYMMDD");
                    break;
            }
        }
        return date;
    };
    var Columns = (function () {
        function Columns(dt, columuns) {
            this.dt = dt;
            return this;
        }
        ;
        Columns.prototype.swap = function (columns) {
            if (columns.length && columns.length === 2) {
                var cols = [];
                each(this.dt.headings, function (h, i) {
                    cols.push(i);
                });
                var x = columns[0];
                var y = columns[1];
                var b = cols[y];
                cols[y] = cols[x];
                cols[x] = b;
                this.order(cols);
            }
        };
        ;
        Columns.prototype.order = function (columns) {
            var a, b, c, d, h, s, cell, temp = [
                [],
                [],
                [],
                []
            ], dt = this.dt;
            each(columns, function (column, x) {
                h = dt.headings[column];
                s = h.getAttribute("data-sortable") !== "false";
                a = h.cloneNode(true);
                a.originalCellIndex = x;
                a.sortable = s;
                temp[0].push(a);
                if (dt.hiddenColumns.indexOf(column) < 0) {
                    b = h.cloneNode(true);
                    b.originalCellIndex = x;
                    b.sortable = s;
                    temp[1].push(b);
                }
            });
            each(dt.data, function (row, i) {
                c = row.cloneNode();
                d = row.cloneNode();
                c.dataIndex = d.dataIndex = i;
                if (row.searchIndex !== null && row.searchIndex !== undefined) {
                    c.searchIndex = d.searchIndex = row.searchIndex;
                }
                each(columns, function (column, x) {
                    cell = row.cells[column].cloneNode(true);
                    cell.data = row.cells[column].data;
                    c.appendChild(cell);
                    if (dt.hiddenColumns.indexOf(column) < 0) {
                        cell = row.cells[column].cloneNode(true);
                        cell.data = row.cells[column].data;
                        d.appendChild(cell);
                    }
                });
                temp[2].push(c);
                temp[3].push(d);
            });
            dt.headings = temp[0];
            dt.activeHeadings = temp[1];
            dt.data = temp[2];
            dt.activeRows = temp[3];
            dt.update();
        };
        ;
        Columns.prototype.hide = function (columns) {
            if (columns.length) {
                var dt = this.dt;
                each(columns, function (column) {
                    if (dt.hiddenColumns.indexOf(column) < 0) {
                        dt.hiddenColumns.push(column);
                    }
                });
                this.rebuild();
            }
        };
        ;
        Columns.prototype.show = function (columns) {
            if (columns.length) {
                var index, dt = this.dt;
                each(columns, function (column) {
                    index = dt.hiddenColumns.indexOf(column);
                    if (index > -1) {
                        dt.hiddenColumns.splice(index, 1);
                    }
                });
                this.rebuild();
            }
        };
        ;
        Columns.prototype.visible = function (columns) {
            var cols, dt = this.dt;
            columns = columns || dt.headings.map(function (th) {
                return th.originalCellIndex;
            });
            if (!isNaN(columns)) {
                cols = dt.hiddenColumns.indexOf(columns) < 0;
            }
            else if (isArray(columns)) {
                cols = [];
                each(columns, function (column) {
                    cols.push(dt.hiddenColumns.indexOf(column) < 0);
                });
            }
            return cols;
        };
        ;
        Columns.prototype.add = function (data) {
            var that = this, td, th = document.createElement("th");
            if (!this.dt.headings.length) {
                this.dt.insert({
                    headings: [data.heading],
                    data: data.data.map(function (i) {
                        return [i];
                    })
                });
                this.rebuild();
                return;
            }
            if (!this.dt.hiddenHeader) {
                if (data.heading.nodeName) {
                    th.appendChild(data.heading);
                }
                else {
                    th.innerHTML = data.heading;
                }
            }
            else {
                th.innerHTML = "";
            }
            this.dt.headings.push(th);
            each(this.dt.data, function (row, i) {
                if (data.data[i]) {
                    td = document.createElement("td");
                    if (data.data[i].nodeName) {
                        td.appendChild(data.data[i]);
                    }
                    else {
                        td.innerHTML = data.data[i];
                    }
                    td.data = td.innerHTML;
                    if (data.render) {
                        td.innerHTML = data.render.call(that, td.data, td, row);
                    }
                    row.appendChild(td);
                }
            });
            if (data.type) {
                th.setAttribute("data-type", data.type);
            }
            if (data.format) {
                th.setAttribute("data-format", data.format);
            }
            if (data.hasOwnProperty("sortable")) {
                th.sortable = data.sortable;
                th.setAttribute("data-sortable", data.sortable === true ? "true" : "false");
            }
            this.rebuild();
            this.dt.renderHeader();
        };
        ;
        Columns.prototype.remove = function (select) {
            if (isArray(select)) {
                select.sort(function (a, b) {
                    return b - a;
                });
                each(select, function (column) {
                    this.remove(column);
                }, this);
            }
            else {
                this.dt.headings.splice(select, 1);
                each(this.dt.data, function (row) {
                    row.removeChild(row.cells[select]);
                });
            }
            this.rebuild();
        };
        ;
        Columns.prototype.sort = function (column, direction, init) {
            var dt = this.dt;
            if (dt.hasHeadings && (column < 1 || column > dt.activeHeadings.length)) {
                return false;
            }
            dt.sorting = true;
            column = column - 1;
            var dir, rows = dt.data, alpha = [], numeric = [], a = 0, n = 0, th = dt.activeHeadings[column];
            column = th.originalCellIndex;
            each(rows, function (tr) {
                var cell = tr.cells[column];
                var content = cell.hasAttribute('data-content') ? cell.getAttribute('data-content') : cell.data;
                var num = content.replace(/(\$|\,|\s|%)/g, "");
                if (th.getAttribute("data-type") === "date" && win.moment) {
                    var format = false, formatted = th.hasAttribute("data-format");
                    if (formatted) {
                        format = th.getAttribute("data-format");
                    }
                    num = parseDate(content, format);
                }
                if (parseFloat(num) == num) {
                    numeric[n++] = {
                        value: Number(num),
                        row: tr
                    };
                }
                else {
                    alpha[a++] = {
                        value: content,
                        row: tr
                    };
                }
            });
            var top, btm;
            if (classList.contains(th, "asc") || direction == "asc") {
                top = sortItems(alpha, -1);
                btm = sortItems(numeric, -1);
                dir = "descending";
                classList.remove(th, "asc");
                classList.add(th, "desc");
            }
            else {
                top = sortItems(numeric, 1);
                btm = sortItems(alpha, 1);
                dir = "ascending";
                classList.remove(th, "desc");
                classList.add(th, "asc");
            }
            if (dt.lastTh && th != dt.lastTh) {
                classList.remove(dt.lastTh, "desc");
                classList.remove(dt.lastTh, "asc");
            }
            dt.lastTh = th;
            rows = top.concat(btm);
            dt.data = [];
            var indexes = [];
            each(rows, function (v, i) {
                dt.data.push(v.row);
                if (v.row.searchIndex !== null && v.row.searchIndex !== undefined) {
                    indexes.push(i);
                }
            }, dt);
            dt.searchData = indexes;
            this.rebuild();
            dt.update();
            if (!init) {
                dt.emit("datatable.sort", column, dir);
            }
        };
        ;
        Columns.prototype.rebuild = function () {
            var a, b, c, d, dt = this.dt, temp = [];
            dt.activeRows = [];
            dt.activeHeadings = [];
            each(dt.headings, function (th, i) {
                th.originalCellIndex = i;
                th.sortable = th.getAttribute("data-sortable") !== "false";
                if (dt.hiddenColumns.indexOf(i) < 0) {
                    dt.activeHeadings.push(th);
                }
            }, this);
            each(dt.data, function (row, i) {
                a = row.cloneNode();
                b = row.cloneNode();
                a.dataIndex = b.dataIndex = i;
                if (row.searchIndex !== null && row.searchIndex !== undefined) {
                    a.searchIndex = b.searchIndex = row.searchIndex;
                }
                each(row.cells, function (cell) {
                    c = cell.cloneNode(true);
                    c.data = cell.data;
                    a.appendChild(c);
                    if (dt.hiddenColumns.indexOf(cell.cellIndex) < 0) {
                        d = cell.cloneNode(true);
                        d.data = cell.data;
                        b.appendChild(d);
                    }
                });
                temp.push(a);
                dt.activeRows.push(b);
            });
            dt.data = temp;
            dt.update();
        };
        ;
        return Columns;
    }());
    var Rows = (function () {
        function Rows(dt, rows) {
            this.dt = dt;
            this.rows = rows;
            return this;
        }
        Rows.prototype.build = function (row) {
            var td, tr = createElement("tr");
            var headings = this.dt.headings;
            if (!headings.length) {
                headings = row.map(function () {
                    return "";
                });
            }
            each(headings, function (h, i) {
                td = createElement("td");
                if (!row[i] && !row[i].length) {
                    row[i] = "";
                }
                td.innerHTML = row[i];
                td.data = row[i];
                tr.appendChild(td);
            });
            return tr;
        };
        ;
        Rows.prototype.render = function (row) {
            return row;
        };
        ;
        Rows.prototype.add = function (data) {
            if (isArray(data)) {
                var dt = this.dt;
                if (isArray(data[0])) {
                    each(data, function (row, i) {
                        dt.data.push(this.build(row));
                    }, this);
                }
                else {
                    dt.data.push(this.build(data));
                }
                if (dt.data.length) {
                    dt.hasRows = true;
                }
                this.update();
                dt.columns().rebuild();
            }
        };
        ;
        Rows.prototype.remove = function (select) {
            var dt = this.dt;
            if (isArray(select)) {
                select.sort(function (a, b) {
                    return b - a;
                });
                each(select, function (row, i) {
                    dt.data.splice(row, 1);
                });
            }
            else {
                dt.data.splice(select, 1);
            }
            this.update();
            dt.columns().rebuild();
        };
        ;
        Rows.prototype.update = function () {
            each(this.dt.data, function (row, i) {
                row.dataIndex = i;
            });
        };
        ;
        return Rows;
    }());
    var DataTable = function (table, options) {
        this.initialized = false;
        this.options = extend(defaultConfig, options);
        if (typeof table === "string") {
            table = document.querySelector(table);
        }
        this.initialLayout = table.innerHTML;
        this.initialSortable = this.options.sortable;
        if (!this.options.header) {
            this.options.sortable = false;
        }
        if (table.tHead === null) {
            if (!this.options.data ||
                (this.options.data && !this.options.data.headings)) {
                this.options.sortable = false;
            }
        }
        console.log(table);
        if (table.tBodies.length && !table.tBodies[0].rows.length) {
            if (this.options.data) {
                if (!this.options.data.data) {
                    throw new Error("You seem to be using the data option, but you've not defined any rows.");
                }
            }
        }
        this.table = table;
        this.init();
    };
    DataTable.extend = function (prop, val) {
        if (typeof val === "function") {
            DataTable.prototype[prop] = val;
        }
        else {
            DataTable[prop] = val;
        }
    };
    var proto = DataTable.prototype;
    proto.init = function (options) {
        if (this.initialized || classList.contains(this.table, "dataTable-table")) {
            return false;
        }
        var that = this;
        this.options = extend(this.options, options || {});
        this.isIE = !!/(msie|trident)/i.test(navigator.userAgent);
        this.currentPage = 1;
        this.onFirstPage = true;
        this.hiddenColumns = [];
        this.columnRenderers = [];
        this.selectedColumns = [];
        this.render();
        setTimeout(function () {
            that.emit("datatable.init");
            that.initialized = true;
            if (that.options.plugins) {
                each(that.options.plugins, function (options, plugin) {
                    if (that[plugin] && typeof that[plugin] === "function") {
                        that[plugin] = that[plugin](options, {
                            each: each,
                            extend: extend,
                            classList: classList,
                            createElement: createElement
                        });
                        if (options.enabled && that[plugin].init && typeof that[plugin].init === "function") {
                            that[plugin].init();
                        }
                    }
                });
            }
        }, 10);
    };
    proto.render = function (type) {
        if (type) {
            switch (type) {
                case "page":
                    this.renderPage();
                    break;
                case "pager":
                    this.renderPager();
                    break;
                case "header":
                    this.renderHeader();
                    break;
            }
            return false;
        }
        var that = this, o = that.options, template = "";
        if (o.data) {
            dataToTable.call(that);
        }
        if (o.ajax) {
            var ajax = o.ajax;
            var xhr = new XMLHttpRequest();
            var xhrProgress = function (e) {
                that.emit("datatable.ajax.progress", e, xhr);
            };
            var xhrLoad = function (e) {
                if (xhr.readyState === 4) {
                    that.emit("datatable.ajax.loaded", e, xhr);
                    if (xhr.status === 200) {
                        var obj = {};
                        obj.data = ajax.load ? ajax.load.call(that, xhr) : xhr.responseText;
                        obj.type = "json";
                        if (ajax.content && ajax.content.type) {
                            obj.type = ajax.content.type;
                            obj = extend(obj, ajax.content);
                        }
                        that.import(obj);
                        that.setColumns(true);
                        that.emit("datatable.ajax.success", e, xhr);
                    }
                    else {
                        that.emit("datatable.ajax.error", e, xhr);
                    }
                }
            };
            var xhrFailed = function (e) {
                that.emit("datatable.ajax.error", e, xhr);
            };
            var xhrCancelled = function (e) {
                that.emit("datatable.ajax.abort", e, xhr);
            };
            on(xhr, "progress", xhrProgress);
            on(xhr, "load", xhrLoad);
            on(xhr, "error", xhrFailed);
            on(xhr, "abort", xhrCancelled);
            that.emit("datatable.ajax.loading", xhr);
            xhr.open("GET", typeof ajax === "string" ? o.ajax : o.ajax.url);
            xhr.send();
        }
        that.body = that.table.tBodies[0];
        that.head = that.table.tHead;
        that.foot = that.table.tFoot;
        if (!that.body) {
            that.body = createElement("tbody");
            that.table.appendChild(that.body);
        }
        that.hasRows = that.body.rows.length > 0;
        if (!that.head) {
            var h = createElement("thead");
            var t = createElement("tr");
            if (that.hasRows) {
                each(that.body.rows[0].cells, function () {
                    t.appendChild(createElement("th"));
                });
                h.appendChild(t);
            }
            that.head = h;
            that.table.insertBefore(that.head, that.body);
            that.hiddenHeader = !o.ajax;
        }
        that.headings = [];
        that.hasHeadings = that.head.rows.length > 0;
        if (that.hasHeadings) {
            that.header = that.head.rows[0];
            that.headings = [].slice.call(that.header.cells);
        }
        if (!o.header) {
            if (that.head) {
                that.table.removeChild(that.table.tHead);
            }
        }
        if (o.footer) {
            if (that.head && !that.foot) {
                that.foot = createElement("tfoot", {
                    html: that.head.innerHTML
                });
                that.table.appendChild(that.foot);
            }
        }
        else {
            if (that.foot) {
                that.table.removeChild(that.table.tFoot);
            }
        }
        that.wrapper = createElement("div", {
            class: "dataTable-wrapper dataTable-loading"
        });
        template += "<div class='dataTable-top'>";
        template += o.layout.top;
        template += "</div>";
        template += "<div class='dataTable-container'></div>";
        template += "<div class='dataTable-bottom'>";
        template += o.layout.bottom;
        template += "</div>";
        template = template.replace("{info}", "<div class='dataTable-info'></div>");
        if (o.perPageSelect) {
            var wrap = "<div class='dataTable-dropdown'><label>";
            wrap += o.labels.perPage;
            wrap += "</label></div>";
            var select = createElement("select", {
                class: "dataTable-selector"
            });
            each(o.perPageSelect, function (val) {
                var selected = val === o.perPage;
                var option = new Option(val, val, selected, selected);
                select.add(option);
            });
            wrap = wrap.replace("{select}", select.outerHTML);
            template = template.replace("{select}", wrap);
        }
        else {
            template = template.replace("{select}", "");
        }
        if (o.searchable) {
            var form = "<div class='dataTable-search'><input class='dataTable-input' placeholder='" +
                o.labels.placeholder +
                "' type='text'></div>";
            template = template.replace("{search}", form);
        }
        else {
            template = template.replace("{search}", "");
        }
        if (that.hasHeadings) {
            this.render("header");
        }
        classList.add(that.table, "dataTable-table");
        var w = createElement("div", {
            class: "dataTable-pagination"
        });
        var paginator = createElement("ul");
        w.appendChild(paginator);
        template = template.replace(/\{pager\}/g, w.outerHTML);
        that.wrapper.innerHTML = template;
        that.container = that.wrapper.querySelector(".dataTable-container");
        that.pagers = that.wrapper.querySelectorAll(".dataTable-pagination");
        that.label = that.wrapper.querySelector(".dataTable-info");
        that.table.parentNode.replaceChild(that.wrapper, that.table);
        that.container.appendChild(that.table);
        that.rect = that.table.getBoundingClientRect();
        that.data = [].slice.call(that.body.rows);
        that.activeRows = that.data.slice();
        that.activeHeadings = that.headings.slice();
        that.update();
        if (!o.ajax) {
            that.setColumns();
        }
        this.fixHeight();
        that.fixColumns();
        if (!o.header) {
            classList.add(that.wrapper, "no-header");
        }
        if (!o.footer) {
            classList.add(that.wrapper, "no-footer");
        }
        if (o.sortable) {
            classList.add(that.wrapper, "sortable");
        }
        if (o.searchable) {
            classList.add(that.wrapper, "searchable");
        }
        if (o.fixedHeight) {
            classList.add(that.wrapper, "fixed-height");
        }
        if (o.fixedColumns) {
            classList.add(that.wrapper, "fixed-columns");
        }
        that.bindEvents();
    };
    proto.renderPage = function () {
        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1;
            }
            var index = this.currentPage - 1, frag = doc.createDocumentFragment();
            if (this.hasHeadings) {
                flush(this.header, this.isIE);
                each(this.activeHeadings, function (th) {
                    this.header.appendChild(th);
                }, this);
            }
            each(this.pages[index], function (row) {
                frag.appendChild(this.rows().render(row));
            }, this);
            this.clear(frag);
            this.onFirstPage = this.currentPage === 1;
            this.onLastPage = this.currentPage === this.lastPage;
        }
        else {
            this.clear();
        }
        var current = 0, f = 0, t = 0, items;
        if (this.totalPages) {
            current = this.currentPage - 1;
            f = current * this.options.perPage;
            t = f + this.pages[current].length;
            f = f + 1;
            items = !!this.searching ? this.searchData.length : this.data.length;
        }
        if (this.label && this.options.labels.info.length) {
            var string = this.options.labels.info
                .replace("{start}", f)
                .replace("{end}", t)
                .replace("{page}", this.currentPage)
                .replace("{pages}", this.totalPages)
                .replace("{rows}", items);
            this.label.innerHTML = items ? string : "";
        }
        if (this.currentPage == 1) {
            this.fixHeight();
        }
    };
    proto.renderPager = function () {
        flush(this.pagers, this.isIE);
        if (this.totalPages > 1) {
            var c = "pager", frag = doc.createDocumentFragment(), prev = this.onFirstPage ? 1 : this.currentPage - 1, next = this.onlastPage ? this.totalPages : this.currentPage + 1;
            if (this.options.firstLast) {
                frag.appendChild(button(c, 1, this.options.firstText));
            }
            if (this.options.nextPrev) {
                frag.appendChild(button(c, prev, this.options.prevText));
            }
            var pager = this.links;
            if (this.options.truncatePager) {
                pager = truncate(this.links, this.currentPage, this.pages.length, this.options.pagerDelta, this.options.ellipsisText);
            }
            classList.add(this.links[this.currentPage - 1], "active");
            each(pager, function (p) {
                classList.remove(p, "active");
                frag.appendChild(p);
            });
            classList.add(this.links[this.currentPage - 1], "active");
            if (this.options.nextPrev) {
                frag.appendChild(button(c, next, this.options.nextText));
            }
            if (this.options.firstLast) {
                frag.appendChild(button(c, this.totalPages, this.options.lastText));
            }
            each(this.pagers, function (pager) {
                pager.appendChild(frag.cloneNode(true));
            });
        }
    };
    proto.renderHeader = function () {
        var that = this;
        that.labels = [];
        if (that.headings && that.headings.length) {
            each(that.headings, function (th, i) {
                that.labels[i] = th.textContent;
                if (classList.contains(th.firstElementChild, "dataTable-sorter")) {
                    th.innerHTML = th.firstElementChild.innerHTML;
                }
                th.sortable = th.getAttribute("data-sortable") !== "false";
                th.originalCellIndex = i;
                if (that.options.sortable && th.sortable) {
                    var link = createElement("a", {
                        href: "#",
                        class: "dataTable-sorter",
                        html: th.innerHTML
                    });
                    th.innerHTML = "";
                    th.setAttribute("data-sortable", "");
                    th.appendChild(link);
                }
            });
        }
        that.fixColumns();
    };
    proto.bindEvents = function () {
        var that = this, o = that.options;
        if (o.perPageSelect) {
            var selector = that.wrapper.querySelector(".dataTable-selector");
            if (selector) {
                on(selector, "change", function (e) {
                    o.perPage = parseInt(this.value, 10);
                    that.update();
                    that.fixHeight();
                    that.emit("datatable.perpage", o.perPage);
                });
            }
        }
        if (o.searchable) {
            that.input = that.wrapper.querySelector(".dataTable-input");
            if (that.input) {
                on(that.input, "keyup", function (e) {
                    that.search(this.value);
                });
            }
        }
        on(that.wrapper, "click", function (e) {
            var t = e.target;
            if (t.nodeName.toLowerCase() === "a") {
                if (t.hasAttribute("data-page")) {
                    that.page(t.getAttribute("data-page"));
                    e.preventDefault();
                }
                else if (o.sortable &&
                    classList.contains(t, "dataTable-sorter") &&
                    t.parentNode.getAttribute("data-sortable") != "false") {
                    that.columns().sort(that.activeHeadings.indexOf(t.parentNode) + 1);
                    e.preventDefault();
                }
            }
        });
    };
    proto.setColumns = function (ajax) {
        var that = this;
        if (!ajax) {
            each(that.data, function (row) {
                each(row.cells, function (cell) {
                    cell.data = cell.innerHTML;
                });
            });
        }
        if (that.options.columns && that.headings.length) {
            each(that.options.columns, function (data) {
                if (!isArray(data.select)) {
                    data.select = [data.select];
                }
                if (data.hasOwnProperty("render") && typeof data.render === "function") {
                    that.selectedColumns = that.selectedColumns.concat(data.select);
                    that.columnRenderers.push({
                        columns: data.select,
                        renderer: data.render
                    });
                }
                each(data.select, function (column) {
                    var th = that.headings[column];
                    if (data.type) {
                        th.setAttribute("data-type", data.type);
                    }
                    if (data.format) {
                        th.setAttribute("data-format", data.format);
                    }
                    if (data.hasOwnProperty("sortable")) {
                        th.setAttribute("data-sortable", data.sortable);
                    }
                    if (data.hasOwnProperty("hidden")) {
                        if (data.hidden !== false) {
                            that.columns().hide(column);
                        }
                    }
                    if (data.hasOwnProperty("sort") && data.select.length === 1) {
                        that.columns().sort(data.select[0] + 1, data.sort, true);
                    }
                });
            });
        }
        if (that.hasRows) {
            each(that.data, function (row, i) {
                row.dataIndex = i;
                each(row.cells, function (cell) {
                    cell.data = cell.innerHTML;
                });
            });
            if (that.selectedColumns.length) {
                each(that.data, function (row) {
                    each(row.cells, function (cell, i) {
                        if (that.selectedColumns.indexOf(i) > -1) {
                            each(that.columnRenderers, function (o) {
                                if (o.columns.indexOf(i) > -1) {
                                    cell.innerHTML = o.renderer.call(that, cell.data, cell, row);
                                }
                            });
                        }
                    });
                });
            }
            that.columns().rebuild();
        }
        that.render("header");
    };
    proto.destroy = function () {
        this.table.innerHTML = this.initialLayout;
        classList.remove(this.table, "dataTable-table");
        this.wrapper.parentNode.replaceChild(this.table, this.wrapper);
        this.initialized = false;
    };
    proto.update = function () {
        classList.remove(this.wrapper, "dataTable-empty");
        this.paginate(this);
        this.render("page");
        this.links = [];
        var i = this.pages.length;
        while (i--) {
            var num = i + 1;
            this.links[i] = button(i === 0 ? "active" : "", num, num);
        }
        this.sorting = false;
        this.render("pager");
        this.rows().update();
        this.emit("datatable.update");
    };
    proto.paginate = function () {
        var perPage = this.options.perPage, rows = this.activeRows;
        if (this.searching) {
            rows = [];
            each(this.searchData, function (index) {
                rows.push(this.activeRows[index]);
            }, this);
        }
        this.pages = rows
            .map(function (tr, i) {
            return i % perPage === 0 ? rows.slice(i, i + perPage) : null;
        })
            .filter(function (page) {
            return page;
        });
        this.totalPages = this.lastPage = this.pages.length;
        return this.totalPages;
    };
    proto.fixColumns = function () {
        if (this.options.fixedColumns && this.activeHeadings && this.activeHeadings.length) {
            var cells, hd = false;
            this.columnWidths = [];
            if (this.table.tHead) {
                each(this.activeHeadings, function (cell) {
                    cell.style.width = "";
                }, this);
                each(this.activeHeadings, function (cell, i) {
                    var ow = cell.offsetWidth;
                    var w = ow / this.rect.width * 100;
                    cell.style.width = w + "%";
                    this.columnWidths[i] = ow;
                }, this);
            }
            else {
                cells = [];
                hd = createElement("thead");
                var r = createElement("tr");
                var c = this.table.tBodies[0].rows[0].cells;
                each(c, function () {
                    var th = createElement("th");
                    r.appendChild(th);
                    cells.push(th);
                });
                hd.appendChild(r);
                this.table.insertBefore(hd, this.body);
                var widths = [];
                each(cells, function (cell, i) {
                    var ow = cell.offsetWidth;
                    var w = ow / this.rect.width * 100;
                    widths.push(w);
                    this.columnWidths[i] = ow;
                }, this);
                each(this.data, function (row) {
                    each(row.cells, function (cell, i) {
                        if (this.columns(cell.cellIndex).visible())
                            cell.style.width = widths[i] + "%";
                    }, this);
                }, this);
                this.table.removeChild(hd);
            }
        }
    };
    proto.fixHeight = function () {
        if (this.options.fixedHeight) {
            this.container.style.height = null;
            this.rect = this.container.getBoundingClientRect();
            this.container.style.height = this.rect.height + "px";
        }
    };
    proto.search = function (query) {
        if (!this.hasRows)
            return false;
        var that = this;
        query = query.toLowerCase();
        this.currentPage = 1;
        this.searching = true;
        this.searchData = [];
        if (!query.length) {
            this.searching = false;
            this.update();
            this.emit("datatable.search", query, this.searchData);
            classList.remove(this.wrapper, "search-results");
            return false;
        }
        this.clear();
        each(this.data, function (row, idx) {
            var inArray = this.searchData.indexOf(row) > -1;
            var doesQueryMatch = query.split(" ").reduce(function (bool, word) {
                var includes = false, cell = null, content = null;
                for (var x = 0; x < row.cells.length; x++) {
                    cell = row.cells[x];
                    content = cell.hasAttribute('data-content') ? cell.getAttribute('data-content') : cell.textContent;
                    if (content.toLowerCase().indexOf(word) > -1 &&
                        that.columns(cell.cellIndex).visible()) {
                        includes = true;
                        break;
                    }
                }
                return bool && includes;
            }, true);
            if (doesQueryMatch && !inArray) {
                row.searchIndex = idx;
                this.searchData.push(idx);
            }
            else {
                row.searchIndex = null;
            }
        }, this);
        classList.add(this.wrapper, "search-results");
        if (!that.searchData.length) {
            classList.remove(that.wrapper, "search-results");
            that.setMessage(that.options.labels.noRows);
        }
        else {
            that.update();
        }
        this.emit("datatable.search", query, this.searchData);
    };
    proto.page = function (page) {
        if (page == this.currentPage) {
            return false;
        }
        if (!isNaN(page)) {
            this.currentPage = parseInt(page, 10);
        }
        if (page > this.pages.length || page < 0) {
            return false;
        }
        this.render("page");
        this.render("pager");
        this.emit("datatable.page", page);
    };
    proto.sortColumn = function (column, direction) {
        this.columns().sort(column, direction);
    };
    proto.insert = function (data) {
        var that = this, rows = [];
        if (isObject(data)) {
            if (data.headings) {
                if (!that.hasHeadings && !that.hasRows) {
                    var tr = createElement("tr"), th;
                    each(data.headings, function (heading) {
                        th = createElement("th", {
                            html: heading
                        });
                        tr.appendChild(th);
                    });
                    that.head.appendChild(tr);
                    that.header = tr;
                    that.headings = [].slice.call(tr.cells);
                    that.hasHeadings = true;
                    that.options.sortable = that.initialSortable;
                    that.render("header");
                }
            }
            if (data.data && isArray(data.data)) {
                rows = data.data;
            }
        }
        else if (isArray(data)) {
            each(data, function (row) {
                var r = [];
                each(row, function (cell, heading) {
                    var index = that.labels.indexOf(heading);
                    if (index > -1) {
                        r[index] = cell;
                    }
                });
                rows.push(r);
            });
        }
        if (rows.length) {
            that.rows().add(rows);
            that.hasRows = true;
        }
        that.update();
        that.fixColumns();
    };
    proto.refresh = function () {
        if (this.options.searchable) {
            this.input.value = "";
            this.searching = false;
        }
        this.currentPage = 1;
        this.onFirstPage = true;
        this.update();
        this.emit("datatable.refresh");
    };
    proto.clear = function (html) {
        if (this.body) {
            flush(this.body, this.isIE);
        }
        var parent = this.body;
        if (!this.body) {
            parent = this.table;
        }
        if (html) {
            if (typeof html === "string") {
                var frag = doc.createDocumentFragment();
                frag.innerHTML = html;
            }
            parent.appendChild(html);
        }
    };
    proto.export = function (options) {
        if (!this.hasHeadings && !this.hasRows)
            return false;
        var headers = this.activeHeadings, rows = [], arr = [], i, x, str, link;
        var defaults = {
            download: true,
            skipColumn: [],
            lineDelimiter: "\n",
            columnDelimiter: ",",
            tableName: "myTable",
            replacer: null,
            space: 4
        };
        if (!isObject(options)) {
            return false;
        }
        var o = extend(defaults, options);
        if (o.type) {
            if (o.type === "txt" || o.type === "csv") {
                rows[0] = this.header;
            }
            if (o.selection) {
                if (!isNaN(o.selection)) {
                    rows = rows.concat(this.pages[o.selection - 1]);
                }
                else if (isArray(o.selection)) {
                    for (i = 0; i < o.selection.length; i++) {
                        rows = rows.concat(this.pages[o.selection[i] - 1]);
                    }
                }
            }
            else {
                rows = rows.concat(this.activeRows);
            }
            if (rows.length) {
                if (o.type === "txt" || o.type === "csv") {
                    str = "";
                    for (i = 0; i < rows.length; i++) {
                        for (x = 0; x < rows[i].cells.length; x++) {
                            if (o.skipColumn.indexOf(headers[x].originalCellIndex) < 0 &&
                                this.columns(headers[x].originalCellIndex).visible()) {
                                var text = rows[i].cells[x].textContent;
                                text = text.trim();
                                text = text.replace(/\s{2,}/g, ' ');
                                text = text.replace(/\n/g, '  ');
                                text = text.replace(/"/g, '""');
                                if (text.indexOf(",") > -1)
                                    text = '"' + text + '"';
                                str += text + o.columnDelimiter;
                            }
                        }
                        str = str.trim().substring(0, str.length - 1);
                        str += o.lineDelimiter;
                    }
                    str = str.trim().substring(0, str.length - 1);
                    if (o.download) {
                        str = "data:text/csv;charset=utf-8," + str;
                    }
                }
                else if (o.type === "sql") {
                    str = "INSERT INTO `" + o.tableName + "` (";
                    for (i = 0; i < headers.length; i++) {
                        if (o.skipColumn.indexOf(headers[i].originalCellIndex) < 0 &&
                            this.columns(headers[i].originalCellIndex).visible()) {
                            str += "`" + headers[i].textContent + "`,";
                        }
                    }
                    str = str.trim().substring(0, str.length - 1);
                    str += ") VALUES ";
                    for (i = 0; i < rows.length; i++) {
                        str += "(";
                        for (x = 0; x < rows[i].cells.length; x++) {
                            if (o.skipColumn.indexOf(headers[x].originalCellIndex) < 0 &&
                                this.columns(headers[x].originalCellIndex).visible()) {
                                str += '"' + rows[i].cells[x].textContent + '",';
                            }
                        }
                        str = str.trim().substring(0, str.length - 1);
                        str += "),";
                    }
                    str = str.trim().substring(0, str.length - 1);
                    str += ";";
                    if (o.download) {
                        str = "data:application/sql;charset=utf-8," + str;
                    }
                }
                else if (o.type === "json") {
                    for (x = 0; x < rows.length; x++) {
                        arr[x] = arr[x] || {};
                        for (i = 0; i < headers.length; i++) {
                            if (o.skipColumn.indexOf(headers[i].originalCellIndex) < 0 &&
                                this.columns(headers[i].originalCellIndex).visible()) {
                                arr[x][headers[i].textContent] = rows[x].cells[i].textContent;
                            }
                        }
                    }
                    str = JSON.stringify(arr, o.replacer, o.space);
                    if (o.download) {
                        str = "data:application/json;charset=utf-8," + str;
                    }
                }
                if (o.download) {
                    o.filename = o.filename || "datatable_export";
                    o.filename += "." + o.type;
                    str = encodeURI(str);
                    link = document.createElement("a");
                    link.href = str;
                    link.download = o.filename;
                    body.appendChild(link);
                    link.click();
                    body.removeChild(link);
                }
                return str;
            }
        }
        return false;
    };
    proto.import = function (options) {
        var obj = false;
        var defaults = {
            lineDelimiter: "\n",
            columnDelimiter: ","
        };
        if (!isObject(options)) {
            return false;
        }
        options = extend(defaults, options);
        if (options.data.length || isObject(options.data)) {
            if (options.type === "csv") {
                obj = {
                    data: []
                };
                var rows = options.data.split(options.lineDelimiter);
                if (rows.length) {
                    if (options.headings) {
                        obj.headings = rows[0].split(options.columnDelimiter);
                        rows.shift();
                    }
                    each(rows, function (row, i) {
                        obj.data[i] = [];
                        var values = row.split(options.columnDelimiter);
                        if (values.length) {
                            each(values, function (value) {
                                obj.data[i].push(value);
                            });
                        }
                    });
                }
            }
            else if (options.type === "json") {
                var json = isJson(options.data);
                if (json) {
                    obj = {
                        headings: [],
                        data: []
                    };
                    each(json, function (data, i) {
                        obj.data[i] = [];
                        each(data, function (value, column) {
                            if (obj.headings.indexOf(column) < 0) {
                                obj.headings.push(column);
                            }
                            obj.data[i].push(value);
                        });
                    });
                }
                else {
                    console.warn("That's not valid JSON!");
                }
            }
            if (isObject(options.data)) {
                obj = options.data;
            }
            if (obj) {
                this.insert(obj);
            }
        }
        return false;
    };
    proto.print = function () {
        var headings = this.activeHeadings;
        var rows = this.activeRows;
        var table = createElement("table");
        var thead = createElement("thead");
        var tbody = createElement("tbody");
        var tr = createElement("tr");
        each(headings, function (th) {
            tr.appendChild(createElement("th", {
                html: th.textContent
            }));
        });
        thead.appendChild(tr);
        each(rows, function (row) {
            var tr = createElement("tr");
            each(row.cells, function (cell) {
                tr.appendChild(createElement("td", {
                    html: cell.textContent
                }));
            });
            tbody.appendChild(tr);
        });
        table.appendChild(thead);
        table.appendChild(tbody);
        var w = win.open();
        w.document.body.appendChild(table);
        w.print();
    };
    proto.setMessage = function (message) {
        var colspan = 1;
        if (this.hasRows) {
            colspan = this.data[0].cells.length;
        }
        classList.add(this.wrapper, "dataTable-empty");
        this.clear(createElement("tr", {
            html: '<td class="dataTables-empty" colspan="' +
                colspan +
                '">' +
                message +
                "</td>"
        }));
    };
    proto.columns = function (columns) {
        return new Columns(this, columns);
    };
    proto.rows = function (rows) {
        return new Rows(this, rows);
    };
    proto.on = function (event, callback) {
        this.events = this.events || {};
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    };
    proto.off = function (event, callback) {
        this.events = this.events || {};
        if (event in this.events === false)
            return;
        this.events[event].splice(this.events[event].indexOf(callback), 1);
    };
    proto.emit = function (event) {
        this.events = this.events || {};
        if (event in this.events === false)
            return;
        for (var i = 0; i < this.events[event].length; i++) {
            this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    };
    return DataTable;
});
