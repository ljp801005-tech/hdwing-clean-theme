// ==UserScript==
// @name         hdchina清爽主题
// @namespace    https://hdwing.org/
// @version      2.32.0
// @description  hdchina清爽主题：全站白底、蓝色导航条、置顶淡蓝行、清晰网格。候选区/求种区/字幕页同样生效。
// @author       WorkBuddy
// @match        https://hdwing.org/*
// @match        http://hdwing.org/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    /* ============================================================
     * 配色区（按 SSD 真实界面取色，可自行微调）
     * ========================================================== */
    var C = {
        pageBg:      '#ffffff',  // 页面背景（SSD 纯白）
        border:      '#a8adb3',  // 表格外框（SSD 细灰框）
        innerBorder: '#a5b0bc',  // 行分隔线（加深，更清晰）
        headerBg:    '#e9e9e9',  // 表头浅灰
        headerText:  '#333333',
        navBg:       '#4a7ab8',  // SSD 蓝色导航条
        navBgHover:  '#2f5e96',
        navActive:   '#2f5e96',
        link:        '#1a5eab',  // 普通链接蓝
        titleLink:   '#164a84',  // 种子标题深蓝
        subText:     '#8b8b8b',  // 副标题灰
        stripe:      '#d6e6f8',  // SSD 标志性淡蓝斑马纹
        rowHover:    '#c3d9f2',  // 悬停稍深蓝
        stickyMark:  '#fffdf0',  // 总置顶行（极淡黄）
        freeColor:   '#008000',  // Free 绿字（SSD 式）
        usernameRed: '#e00000',  // 顶部欢迎行用户名红（HDWinG 原生）
        textMain:    '#000000',
    };

    /* ============================================================
     * 开关状态（GM 存储，退化到 localStorage）
     * ========================================================== */
    function get(key, def) {
        try { if (typeof GM_getValue === 'function') return GM_getValue(key, def); } catch (e) {}
        var v = localStorage.getItem('ssdtheme_' + key);
        return v === null ? def : v;
    }
    function set(key, val) {
        try { if (typeof GM_setValue === 'function') return GM_setValue(key, val); } catch (e) {}
        localStorage.setItem('ssdtheme_' + key, val);
    }

    var enabled    = get('enabled', '1') === '1';
    var stickyHead = get('stickyHead', '0') === '1';
    var compact    = get('compact', '1') === '1';
    var fadeIn     = get('fadeIn', '1') === '1';

    /* ============================================================
     * 首帧防闪：脚本一执行就把画布刷白，
     * 这样无论样式表何时就位，都不会先露出原生灰蓝底
     * ========================================================== */
    try {
        var de = document.documentElement;
        de.style.setProperty('background-color', '#ffffff', 'important');
        de.style.setProperty('color-scheme', 'light', 'important');
    } catch (e) {}

    /* 时间戳（诊断首帧用） */
    var T0 = (window.performance && performance.now) ? performance.now() : Date.now();
    function since() {
        return Math.round(((window.performance && performance.now) ? performance.now() : Date.now()) - T0);
    }

    /* ============================================================
     * 样式表落位：始终放在"文档里最后的可用容器"末尾
     * 原生 CSS 也带 !important 时（同特异性），后出现的胜出；
     * 每次落位都重新判断容器，因此不依赖执行时机
     * ========================================================== */
    function placeStyle() {
        var st = document.getElementById('ssd-theme-style');
        if (!st) return false;
        var target = document.body || document.head;
        if (!target) return false;
        if (st.parentNode !== target) target.appendChild(st);
        return true;
    }

    function addStyle(css) {
        var old = document.getElementById('ssd-theme-style');
        if (old) old.remove();
        var s = document.createElement('style');
        s.id = 'ssd-theme-style';
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
        placeStyle();
    }

    function buildCSS() {
        return `
/* ===== HDWinG SSD主题 v2.0（按SSD真实界面重写） ===== */

${fadeIn ? `
/* 渐进渲染淡入：种子行分批到达时先隐藏整个表格，等稳定后一次性淡入，
 * 避免"表格从2697px长到6776px、下方内容被一次次顶下去"的生长抖动 */
.torrent_list { opacity: 0 !important; }
body.ssd-table-ready .torrent_list { opacity: 1 !important; transition: opacity .28s ease !important; }
` : ''}

/* ---------- 全局：白底 ---------- */
html, body {
    background: ${C.pageBg} !important;
    font-family: "Microsoft YaHei", "微软雅黑", "PingFang SC", Verdana, Arial, sans-serif !important;
    font-size: 12px !important;
    color: ${C.textMain} !important;
}
#all_box {
    background: ${C.pageBg} !important;
    box-shadow: none !important;
    margin: 0 !important; /* 去掉原生四周10px白边，导航蓝条贴边融合 */
}
/* 内容区尺寸沿用站点原始设定，避免错位 */
#site_content { padding: 0 30px !important; }

/* ---------- 链接 ---------- */
a:link, a:visited, a:active { color: ${C.link} !important; text-decoration: none !important; }
a:hover { color: ${C.link} !important; text-decoration: underline !important; }

/* ---------- 顶部用户信息区：只改颜色，不动尺寸定位 ---------- */
.headerbox { background: ${C.pageBg} !important; }
#site_header {
    background: #f5f5f5 url(/styles/images/logo_back.png) !important;
    background-image: url(/styles/images/logo_back.png) !important;
    border-bottom: 4px solid #ffffff !important;
    box-shadow: none !important;
}
.site_logo { filter: none !important; }
.userinfo, .userinfo p, .userinforb, .userinfort, .userinfort p { color: #444 !important; }
.userinfo b, .userinfort b { color: #444 !important; }
/* 用户名链接：HDWinG 原生所有指向 userdetails.php 的链接都是红色——
 * 欢迎行、种子列表"发布者"列、详情页上传者、TOP10 等一并恢复，
 * 不被全局链接蓝染色。"匿名"是非链接文字，保持灰色不受影响。 */
a[href*="userdetails.php"]:link,
a[href*="userdetails.php"]:visited,
a[href*="userdetails.php"]:active,
a[href*="userdetails.php"] b,
a[href*="userdetails.php"] font {
    color: ${C.usernameRed} !important;
}
.user_box {
    background: #f2f2f2 !important;
    border: 1px #d0d0d0 solid !important;
    border-radius: 3px !important;
    color: #333 !important;
}
.user_box a { color: ${C.link} !important; }
.user_info { border-color: #d0d0d0 !important; }

/* ---------- 顶部功能按钮（捐赠/签到/21点/菠萝）：白底圆角胶囊 ---------- */
.label {
    color: #4a4a4a !important;
    border-radius: .25em !important;
    padding: .2em .6em .3em !important;
    font-weight: bold !important;
    line-height: 1 !important;
}
.label-default, .label-info, .label-success, .label-warning,
.label-primary, .label-danger {
    background-color: #ffffff !important;
    border: 1px #ccd2da solid !important;
    color: #4a4a4a !important;
}
.label[href]:hover, a.label:hover {
    background: #eef4fb !important;
    border-color: ${C.navBg} !important;
    color: ${C.navBg} !important;
    text-decoration: none !important;
}
/* 顶部区域小图标圆化（邮件/道具等），避免方块感 */
#site_header img,
.userinfo img, .userinforb img, .userinfort img, .user_box img {
    border-radius: 50% !important;
}

/* ---------- 消除页头与蓝条之间的缝隙（只清边距，不动定位） ---------- */
.headerbox { padding: 0 !important; }
#site_header { padding-bottom: 0 !important; margin-bottom: 0 !important; }
.nav_center { margin-top: 0 !important; margin-bottom: 0 !important; }
/* ---------- 断层根因：页头内所有容器先统一清为白底 ---------- */
/*（灰蓝横带就是页头里某个容器的原生底色，这里全部压掉） */
.headerbox div:not(.site_logo):not(#site_header), .headerbox span:not(.loadbarbg), .headerbox p,
.headerbox table, .headerbox tbody, .headerbox tr,
.headerbox td, .headerbox th, .headerbox ul, .headerbox li {
    background-color: transparent !important;
    background-image: none !important;
}
.headerbox { background-color: #ffffff !important; }
#site_header { background-color: #f5f5f5 !important; }
/* logo 保持站点原图，不受上面清除影响 */
.site_logo {
    background-image: url(/styles/images/logo_hdchina.png) !important;
    background-repeat: no-repeat !important;
    background-position: left center !important;
    background-color: transparent !important;
}
/* 被上面清掉的元素，这里恢复 */
.user_box { background-color: #f2f2f2 !important; }

/* ---------- 主导航：SSD 蓝（在上面的清白之后执行，确保生效） ---------- */
/* 只改颜色、保留原版尺寸：#site_nav 原生 padding:10px 0 0 0，整个容器铺成 SSD 蓝后，
 * 那 10px padding 露出的是蓝色而非灰蓝底，横带自然消失，同时和原版布局完全一致。
 * （v2.27：不再动 padding/height，避免把页头"拉升"变形） */
#site_nav {
    background-color: ${C.navBg} !important;
    background-image: none !important;
    padding: 10px 0 0 0 !important;
    border-bottom: none !important;
}
/* 清掉导航区残留背景图（渐变条/分隔线图） */
.nav_center, .nav_center *,
.nav_first, .nav_left, .nav_right { background-image: none !important; }
/* 导航底色改成 SSD 蓝，菜单项透明融入，形成连续蓝条 */
.nav_center, .nav_first, .nav_left, .nav_right {
    background-color: ${C.navBg} !important;
}
.nav_center a, .nav_center a:link, .nav_center a:visited {
    background: transparent !important;
    color: #ffffff !important;
    font-weight: bold !important;
    border-radius: 0 !important;
}
.nav_center a:hover { background: rgba(255, 255, 255, .14) !important; color: #fff !important; text-decoration: none !important; }
/* 当前页菜单项：不再用深蓝方块（会破坏连续蓝条），改为透明融入 + 底部白线标记 */
a.nav_item_active, a.nav_item_active:link, a.nav_item_active:visited, a.nav_item_active:hover {
    background: transparent !important;
    color: #ffffff !important;
    text-decoration: none !important;
    box-shadow: inset 0 -3px 0 rgba(255, 255, 255, .95) !important;
}

/* ---------- 搜索箱：白底灰框（SSD 式） ---------- */
.searchbox td { border: 1px #b8b8b8 solid !important; background: #fff !important; }
.searchbox td.sbox_name { background: #ececec !important; color: #333 !important; font-weight: bold !important; }
.searchbox input, .select_table input, .stool_box input {
    border: 1px #b0b0b0 solid !important;
    border-radius: 3px !important;
    padding: 4px 8px !important;
    background: #fff !important;
    font-size: 12px !important;
}
.searchbox input:focus, .stool_box input:focus {
    border-color: ${C.navBg} !important;
    outline: none !important;
}
.select_table select, .stool_box select, .searchbox select {
    border: 1px #b0b0b0 solid !important; border-radius: 3px !important;
    padding: 3px 4px !important; background: #fff !important; font-size: 12px !important;
}
input.btns {
    background: #ececec !important;
    color: #333 !important;
    border: 1px #a0a0a0 solid !important;
    border-radius: 3px !important;
    font-weight: bold !important;
    cursor: pointer;
}
input.btns:hover { background: #dcdcdc !important; color: #000 !important; }

/* ---------- 种子主表：SSD 紧凑表格 + 淡蓝斑马纹 ---------- */
table.torrent_list, .torrent_list {
    border: 1px ${C.border} solid !important;
    border-radius: 0 !important;
    background: #fff !important;
    border-collapse: collapse !important;
    border-spacing: 0 !important;
    margin: 8px 0 !important;
    width: 100% !important;
}
.torrent_list td, .torrent_list th {
    border-bottom: 1px ${C.innerBorder} solid !important;
    border-right: 1px ${C.innerBorder} solid !important; /* 竖线同步加深 */
    background-image: none !important;
}
/* 嵌套表格不参与边框 */
.torrent_list td.t_name table.tbname td { border: none !important; }
${compact ? `
.torrent_list td { font-size: 12px !important; padding: 3px 6px !important; line-height: 1.5 !important; }
.torrent_list th { font-size: 12px !important; padding: 4px 4px !important; height: auto !important; line-height: 1.6 !important; }
` : `
.torrent_list td { font-size: 12.5px !important; padding: 6px 8px !important; }
`}

/* 表格自适应（已取消固定表格）：宽标题列 + 数值列自然排布，
 * 窗口缩放时表格跟随容器，不会出现标题被挤成竖排的变形。
 * 标题列给 420px 下限，保证长标题有基本阅读空间，窄屏时整表横向滚动由站点处理 */
.torrent_list { table-layout: auto !important; width: 100% !important; }
.torrent_list td.t_name { min-width: 420px !important; }

/* 关键：压掉 HDWinG 原生促销底，行底色只由"是否置顶"决定 */
.torrent_list tr.free_bg,
.torrent_list tr.twoup_bg,
.torrent_list tr.twoupfree_bg,
.torrent_list tr.halfdown_bg,
.torrent_list tr.twouphalfdown_bg,
.torrent_list tr.thirtypercent_bg { background-color: transparent !important; }

/* 行底色：非置顶 = 纯白；置顶 = 固定淡蓝 #D6E6F8（不做隔行变色） */
.torrent_list tbody tr { background-color: #ffffff !important; }
.torrent_list tbody tr.sticky_bg,
.torrent_list tbody tr.stickz_bg,
.torrent_list tbody tr.topsticky_bg,
.torrent_list tbody tr.toped { background-color: #d6e6f8 !important; }

/* 悬停：白色行变极淡蓝，置顶行加深一档 */
.torrent_list tbody tr:hover { background-color: #f0f6fd !important; }
.torrent_list tbody tr.sticky_bg:hover,
.torrent_list tbody tr.stickz_bg:hover,
.torrent_list tbody tr.topsticky_bg:hover,
.torrent_list tbody tr.toped:hover { background-color: #c3d9f2 !important; }

/* 嵌套的种子名表格：完全透明，不参与斑马纹 */
.torrent_list td.t_name table.tbname,
.torrent_list td.t_name table.tbname tr,
.torrent_list td.t_name table.tbname td {
    background: transparent !important;
    border: none !important;
}
.torrent_list td.t_name table.tbname tr:hover { background: transparent !important; }

/* 勾选列：去掉灰色底 */
.torrent_list td.check { background: transparent !important; }

/* 类目图标列 */
.torrent_list td.t_cat {
    background: transparent !important;
    border-right: 1px ${C.innerBorder} solid !important;
    text-align: center !important;
}

/* 种子名列：SSD 深蓝标题 + 灰色副标题 */
.torrent_list td.t_name { color: ${C.textMain} !important; }
.torrent_list td.t_name table.tbname h3 {
    font-size: 12px !important;
    font-weight: bold !important;
    margin: 0 0 2px 0 !important;
    padding: 0 !important;
}
.torrent_list td.t_name table.tbname h3 a {
    color: ${C.titleLink} !important;
}
.torrent_list td.t_name table.tbname h3 a:hover { color: ${C.navBgHover} !important; text-decoration: underline !important; }
.torrent_list td.t_name table.tbname h4 { color: ${C.subText} !important; font-size: 11px !important; }
.torrent_list td.t_name font[color="#8b8b8b"], .torrent_list td.t_name .small { color: ${C.subText} !important; }

/* 促销文字：SSD 式绿字 Free */
.free        { color: ${C.freeColor} !important; font-weight: bold !important; }
.twoupfree   { color: ${C.freeColor} !important; font-weight: bold !important; }
.twoup       { color: #b07070 !important; }
.halfdown    { color: #5566cc !important; font-weight: bold !important; }
.twouphalfdown { color: #3399bb !important; }
.thirtypercent { color: #8844bb !important; font-weight: bold !important; }
.hot         { color: #e08000 !important; font-weight: bold !important; }
.classic     { color: #669900 !important; font-weight: bold !important; }
.recommended { color: #8800aa !important; font-weight: bold !important; }
.new, .striking { color: #cc0000 !important; font-weight: bold !important; }

/* 数值列统一：白底、普通化，靠颜色区分 */
.torrent_list td.t_comment, .torrent_list td.t_file,
.torrent_list td.t_size, .torrent_list td.t_uploader,
.torrent_list td.t_time, .torrent_list td.t_completed,
.torrent_list td.t_manage {
    background: transparent !important;
    color: #444 !important;
    text-align: center !important;
    font-weight: normal !important;
}
.torrent_list td.t_size, .torrent_list td.t_time, .torrent_list td.t_completed { color: ${C.subText} !important; }
/* 做种/下载列：SSD 式深色数字（不再大红大绿），并去掉原生 #f8f8f8 白底，避免切断斑马纹 */
.torrent_list td.t_torrents, .torrent_list td.t_torrents a,
.torrent_list td.t_leech, .torrent_list td.t_leech a {
    color: #333333 !important;
    font-weight: bold !important;
    text-align: center !important;
    background: transparent !important;
    background-color: transparent !important;
}
.torrent_list td.t_comment a, .torrent_list td.t_file a { color: ${C.link} !important; }
/* 发布者列用户名：红色（覆盖 td 的 #444 继承）。"匿名"非链接，保持 td 灰 */
.torrent_list td.t_uploader a[href*="userdetails.php"],
.torrent_list td.t_uploader a[href*="userdetails.php"]:link,
.torrent_list td.t_uploader a[href*="userdetails.php"]:visited {
    color: ${C.usernameRed} !important;
}

/* 进度条保留但瘦身 */
.progressfont { font-size: 10px !important; }

/* ---------- 分页：当前页码做成蓝底白字醒目块 ---------- */
.page_number, .page_prev, .page_next { font-size: 13px !important; }
.page_number a, .page_prev a, .page_next a {
    display: inline-block;
    padding: 2px 7px;
    margin: 0 1px;
    color: ${C.link} !important;
    background: transparent !important;
    border: none !important;
    font-weight: bold !important;
}
.page_number a:hover, .page_prev a:hover, .page_next a:hover {
    background: ${C.stripe} !important;
    text-decoration: none !important;
}
/* 当前页码（NexusPHP 通常为 b/strong/font 加粗文本） */
.page_number b, .page_number strong,
.page_number span:not(:has(a)), .page_number font {
    display: inline-block !important;
    padding: 2px 9px !important;
    background: ${C.navBg} !important;
    color: #ffffff !important;
    border-radius: 3px !important;
    font-weight: bold !important;
    font-size: 13px !important;
}

/* ---------- 回顶按钮：圆角蓝底，替换原生丑图 ---------- */
#back_to_top {
    background: rgba(74, 122, 184, .85) !important;
    background-image: none !important;
    width: 42px !important;
    height: 42px !important;
    border-radius: 50% !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .25);
    text-align: center !important;
    transition: background .15s;
}
#back_to_top::before {
    content: "\\25B2";
    display: block !important;
    font-size: 10px !important;
    line-height: 16px !important;
    margin-top: 5px !important;
    color: #fff !important;
}
#back_to_top::after {
    content: "TOP";
    display: block !important;
    font-size: 10px !important;
    line-height: 12px !important;
    color: #fff !important;
    font-weight: bold !important;
}
#back_to_top:hover { background: rgb(47, 94, 150) !important; }

/* ---------- 全站通用：NexusPHP 标准列表表格（候选区/求种区等） ---------- */
table.torrents { width: 100% !important; border-collapse: collapse !important; }
table.torrents th, td.colhead, th.colhead {
    background: ${C.headerBg} !important;
    color: ${C.headerText} !important;
    font-weight: bold !important;
    border: 1px ${C.innerBorder} solid !important;
    padding: 4px 6px !important;
    text-align: center !important;
}
table.torrents td, td.rowfollow {
    border: 1px ${C.innerBorder} solid !important;
    padding: 3px 6px !important;
    font-size: 12px !important;
    background-color: #ffffff !important;
}
table.torrents tr:hover td, table.torrents tr:hover td.rowfollow { background-color: #f0f6fd !important; }

/* ---------- 全站灰蓝家族清理（按 HDWinG 原生 CSS 逐条对位） ---------- */
/* 论坛/控制面板等 table_forums：去斑马纹、白底、清晰网格、浅灰表头 */
table.table_forums tr, table.table_forums tr:nth-child(odd), table.table_forums tr:nth-child(even) {
    background-color: #ffffff !important;
    background-image: none !important;
}
#site_content table.table_forums tr:nth-child(odd) { background-color: #ffffff !important; }
table.table_forums tr:hover td { background-color: #f0f6fd !important; }
table.table_forums th {
    background: ${C.headerBg} !important;
    color: ${C.headerText} !important;
    font-weight: bold !important;
    border: 1px ${C.innerBorder} solid !important;
    padding: 4px 6px !important;
}
table.table_forums td {
    background-color: #ffffff !important;
    border: 1px ${C.innerBorder} solid !important;
    padding: 4px 6px !important;
}
/* 帖子内嵌结构不画格子 */
table.table_forums table.forumhead td,
table.table_forums table.forumhead tr,
table.table_forums table.topic_control td {
    background-color: transparent !important;
    border: none !important;
}
/* 首页/控制面板"最近消息、最近种子"等列表：去斑马纹 + 分割线 */
.index_left .index_new tr, .index_left .index_new tr:nth-child(odd) {
    background-color: #ffffff !important;
}
.index_left .index_new tr:hover { background-color: #f0f6fd !important; }
.index_left .index_new td { border-bottom: 1px ${C.innerBorder} solid !important; }
.index_left td.color, .index_left .index_new td.color { background-color: #ffffff !important; }
/* 详情页大灰板、字幕上传框、帖子视图：白底 */
.details_box, .subtitle_upload_box, #site_content table.forums_viewtopic {
    background-color: #ffffff !important;
}
#site_content table.forums_viewtopic td { border: 1px ${C.innerBorder} solid !important; }
/* 论坛帖子正文 / 公告详情区：链接恢复 HDWinG 原版深蓝灰，不被全局 SSD 蓝染色。
 * 只作用于正文里的链接，不影响种子列表/导航/菜单等其他蓝色链接 */
#site_content table.forums_viewtopic td.body_box a,
#site_content table.forums_viewtopic td.body_box div.forumtext a,
#site_content div.forumtext a,
.announcebox a {
    color: #3b4256 !important;
}
#site_content table.forums_viewtopic td.body_box a:hover,
#site_content table.forums_viewtopic td.body_box div.forumtext a:hover,
#site_content div.forumtext a:hover,
.announcebox a:hover {
    color: #2b3547 !important;
}
/* 控制面板左侧菜单：浅底蓝字，选中项灰底+蓝左条（SSD 式） */
ul.menu li a {
    background-color: #f2f4f7 !important;
    color: ${C.link} !important;
    border-bottom: 1px ${C.innerBorder} solid !important;
    border-right: none !important;
}
ul.menu li a:hover { background-color: #f0f6fd !important; color: ${C.link} !important; }
ul.menu li.selected a {
    background-color: #e9e9e9 !important;
    border-left: 3px ${C.navBg} solid !important;
    color: #333333 !important;
}
/* 控制面板信息表：去斑马纹（原生 .w1k table tr:odd #b9c5d3）、虚线边改实线 */
.w1k table tr:nth-child(odd) { background-color: #ffffff !important; }
.w1k table tr:hover { background-color: #f0f6fd !important; }
.w1k td { border: 1px #d5d5d5 solid !important; }

/* ---------- 字幕页 subtitles.php：CSS 常驻压白 ----------
 * 关键：用 CSS 规则而非 JS 逐行设 inline——规则注入后对所有"现在和未来插入"的行
 * 自动生效，彻底消除"刷新有插色、再刷又没有"的加载时序竞速。
 * 悬停淡蓝、表头浅灰一并常驻，不依赖执行次数。 */
${location.pathname.indexOf('subtitles.php') !== -1 ? `
html body table tr,
html body table tr:nth-child(odd),
html body table tr:nth-child(even),
html body table td,
html body table tbody {
    background-color: #ffffff !important;
    background-image: none !important;
}
html body table tr:hover td { background-color: #f0f6fd !important; }
html body table td.colhead,
html body table th { background-color: ${C.headerBg} !important; }
` : ''}

/* ---------- 公告/杂项 ---------- */
.cbox, table.torrent_advice, table.torrent_adviceb {
    border: 1px #b8b8b8 solid !important;
    background: #fff !important;
}
#site_footer { color: #999 !important; padding: 6px 0 16px; }
#site_footer a { color: #999 !important; text-decoration: underline; }
input[type=text], input[type=password], textarea, select { font-family: inherit !important; }
button, input[type=submit], input[type=button] { cursor: pointer; }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: #f5f5f5; }
::-webkit-scrollbar-thumb { background: #c0c0c0; border-radius: 5px; }
::-webkit-scrollbar-thumb:hover { background: #a0a0a0; }
`;
    }

    function apply() {
        var st = document.getElementById('ssd-theme-style');
        if (!enabled) { if (st && st.parentNode) st.parentNode.removeChild(st); return; }
        /* 已存在则只更新内容，不重新插入——保持它在文档末尾的优先级 */
        if (st) { st.textContent = buildCSS(); return; }
        addStyle(buildCSS());
    }

    /* ============================================================
     * 运行时清除 HDWinG 原主题的灰蓝底色家族：
     * #738ba8 / #b9c5d3 / #b1bdcb / #cdd7e3 / #738bb0 / #c1cddc 等
     * 不再穷举精确值，改用"灰蓝区间判定"：蓝>=绿>=红且亮度中等，
     * 新页面出现近似色也能命中（页头灰带/详情页大灰板/论坛斑马纹等）
     * ========================================================== */
    function isGrayBg(el) {
        try {
            var c = getComputedStyle(el).backgroundColor;
            var m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!m) return false;
            if (m[4] !== undefined && parseFloat(m[4]) < 0.4) return false;
            var r = +m[1], g = +m[2], b = +m[3];
            if (b < g || g < r) return false;   /* 必须偏蓝（灰蓝家族特征） */
            if (b - r < 8 || b - r > 90) return false;
            if (r < 100) return false;          /* 排除深蓝按钮/导航 */
            if (r > 236) return false;          /* 排除近白背景 */
            return true;
        } catch (e) { return false; }
    }

    /* 单个元素：灰蓝底 → 白底（跳过导航、logo、进度条、种子表置顶行） */
    function whiten(el, nav) {
        if (!el || el.nodeType !== 1) return;
        if (el.classList && (el.classList.contains('site_logo') ||
            el.classList.contains('loadbar') || el.classList.contains('loadbarbg'))) return;
        if (nav && (el === nav || nav.contains(el))) return;
        /* #site_nav 是导航条容器，必须保持蓝色，不能被清白 */
        if (el.id === 'site_nav' || (el.closest && el.closest('#site_nav'))) return;
        /* #site_header 的 logo_back 浅灰纹理是要保留的背景，不能被清白 */
        if (el.id === 'site_header') return;
        if (el.closest && el.closest('.torrent_list')) return;
        if (isGrayBg(el)) {
            el.style.setProperty('background-color', '#ffffff', 'important');
            el.style.setProperty('background-image', 'none', 'important');
        }
    }

    function purgeGrayBands(root) {
        if (!enabled) return;
        var nav = document.querySelector('.nav_center');
        var scope = (root && root.nodeType === 1) ? root : document;
        whiten(scope, nav);
        var els = scope.querySelectorAll('div, td, tr, th, table, tbody, p, a, li, span, ul');
        for (var i = 0; i < els.length; i++) whiten(els[i], nav);
        if (scope === document) whiten(document.body, nav);
    }

    /* 监听后续插入的节点（分页、展开、AJAX 内容），即时清白，
     * 不再等 400ms 定时器，切换页面/翻页都不闪灰蓝 */
    function watchDom() {
        if (!window.MutationObserver) return;
        var queue = [], scheduled = false;
        function flush() {
            scheduled = false;
            var batch = queue; queue = [];
            for (var i = 0; i < batch.length; i++) {
                try { purgeGrayBands(batch[i]); } catch (e) {}
            }
            try { fixSubtitles(); } catch (e) {}
        }
        var mo = new MutationObserver(function (records) {
            for (var i = 0; i < records.length; i++) {
                var added = records[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    if (added[j].nodeType === 1) queue.push(added[j]);
                }
            }
            /* body 刚被解析出来时立刻移位（早于首帧绘制） */
            placeStyle();
            if (!scheduled && queue.length) {
                scheduled = true;
                (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(flush);
            }
        });
        try { mo.observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
    }

    /* ============================================================
     * 候选区/求种区杂项修复（按文字锚点定位，不依赖类名）：
     * 1) 投票列 "1 - 0 = 1" 红字 → 普通深色
     * 2) 灰色信息盒（规则/候选区/马上添加候选）向上清灰
     * 3) 分页当前页 "[1 - 4]" 去括号 + 蓝底白字
     * ========================================================== */
    function fixOffersAndPager() {
        if (!enabled) return;
        /* 实测 offers.php 的内容不在 #site_content 里，直接全页面扫描 */
        var content = document.body;
        /* 种子列表页是超大 DOM（百行×十几列），逐格遍历 textContent 会拖慢首帧，
         * 该页无需投票列/锚点修复，跳过（分页修复仍保留） */
        var isListPage = !!document.querySelector('.torrent_list');

        /* 1) 投票列：全站 td 文本匹配，各种横线/等号变体统一归一化 */
        var voteFixed = 0;
        var voteSamples = [];
        var tds = isListPage ? [] : content.querySelectorAll('td');
        for (var i = 0; i < tds.length; i++) {
            var raw = tds[i].textContent || '';
            var t = raw.replace(/\s|\u00a0|\u200b/g, '')
                       .replace(/[\u2010-\u2015\u2212\uFF0D\u2013]/g, '-')
                       .replace(/\uFF1D/g, '=');
            if (/^\d+-\d+=\d+$/.test(t) && t.length <= 12) {
                voteFixed++;
                tds[i].style.setProperty('color', '#333333', 'important');
                var inners = tds[i].querySelectorAll('font, span, b, strong');
                for (var j = 0; j < inners.length; j++) {
                    inners[j].style.setProperty('color', '#333333', 'important');
                }
            } else if (raw.length < 30 && raw.indexOf('-') !== -1 && raw.indexOf('=') !== -1 && voteSamples.length < 3) {
                voteSamples.push(JSON.stringify(raw));
            }
        }

        /* 2) 灰色信息盒：找到锚点文字，向上把所有非白底容器压白（含背景图） */
        var grayCleared = 0;
        var anchors = isListPage ? [] : content.querySelectorAll(
            'td, div, font, b, span, strong, em, p, h1, h2, h3, center, li, a');
        for (var a = 0; a < anchors.length; a++) {
            var at = (anchors[a].textContent || '').trim();
            if (at.length > 40) continue;
            var isAnchor = at.indexOf('候选区') !== -1 || at.indexOf('规则') === 0 || at.indexOf('马上添加候选') === 0;
            if (!isAnchor) continue;
            var up = anchors[a], guard = 0;
            while (up && up !== document.body && guard < 12) {
                /* 表头格子（colhead/th）不压白，保留表头样式 */
                if (up.tagName === 'TH' || /colhead/.test(up.className || '')) {
                    up = up.parentElement; guard++; continue;
                }
                try {
                    var cs = getComputedStyle(up);
                    var bg = cs.backgroundColor;
                    var bimg = cs.backgroundImage;
                    var hasColor = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)';
                    var hasImage = bimg && bimg !== 'none';
                    if (hasColor || hasImage) {
                        up.style.setProperty('background-color', '#ffffff', 'important');
                        up.style.setProperty('background-image', 'none', 'important');
                        grayCleared++;
                        if (up.tagName === 'TABLE' || up.tagName === 'TD') {
                            up.style.setProperty('border', '1px #b8c2cc solid', 'important');
                        }
                    }
                } catch (e) {}
                up = up.parentElement;
                guard++;
            }
        }

        /* 2b) 恢复"规则：/马上添加候选"标题框：SSD 式浅灰表头格子 */
        var headersFixed = 0;
        for (var h = 0; h < anchors.length; h++) {
            var ht = (anchors[h].textContent || '').trim();
            if (ht.length > 40) continue;
            if (!(ht.indexOf('规则') === 0 || ht.indexOf('马上添加候选') === 0)) continue;
            var hcell = anchors[h].closest ? anchors[h].closest('td, th') : null;
            if (!hcell) continue;
            headersFixed++;
            hcell.style.setProperty('background-color', '#eef1f4', 'important');
            hcell.style.setProperty('border', '1px #b8c2cc solid', 'important');
            hcell.style.setProperty('padding', '4px 10px', 'important');
            hcell.style.setProperty('text-align', 'center', 'important');
            hcell.style.setProperty('font-weight', 'bold', 'important');
            var hks = hcell.querySelectorAll('a, font, span, b, strong');
            for (var hk = 0; hk < hks.length; hk++) {
                hks[hk].style.setProperty('color', '#333333', 'important');
            }
        }

        /* 3) 分页当前页：带括号优先，选中"最深"的匹配元素上色 */
        var pagerFixed = 0;
        var pagerEls = content.querySelectorAll('b, strong, font, span, a, td');
        var withBr = null, noBr = [];
        for (var n = 0; n < pagerEls.length; n++) {
            var pel = pagerEls[n];
            var st = (pel.textContent || '').replace(/\s|\u00a0/g, '');
            if (!/^\[?\d+[-–]\d+\]?$/.test(st) || st.length > 10) continue;
            /* 必须在"上一页/下一页"附近，避免误伤正文数字 */
            var ctx = pel.closest('tr, p, div, td') || pel.parentElement;
            if (!ctx || (ctx.textContent || '').indexOf('上一页') === -1) continue;
            if (st.indexOf('[') !== -1 || st.indexOf('［') !== -1 || st.indexOf('【') !== -1) {
                if (!withBr || st.length < withBr._len) { withBr = pel; withBr._len = st.length; }
            } else {
                noBr.push(pel);
            }
        }
        function applyPill(el) {
            el.style.setProperty('background-color', C.navBg, 'important');
            el.style.setProperty('color', '#ffffff', 'important');
            el.style.setProperty('border-radius', '3px', 'important');
            el.style.setProperty('padding', '2px 9px', 'important');
            el.style.setProperty('font-weight', 'bold', 'important');
            el.style.setProperty('display', 'inline-block', 'important');
            el.style.setProperty('font-size', '13px', 'important');
            pagerFixed++;
        }
        if (withBr) {
            /* 带括号的元素：整体重写文本（去括号），样式上它自己 */
            withBr.textContent = withBr.textContent.replace(/\s|\u00a0/g, '').replace(/[\[\]【】［］]/g, '');
            applyPill(withBr);
        } else {
            for (var q = 0; q < noBr.length; q++) {
                /* 无括号版本：只取最深层的（没有匹配后代） */
                var hasDeeper = false;
                for (var r = 0; r < noBr.length; r++) {
                    if (r !== q && noBr[q].contains(noBr[r])) { hasDeeper = true; break; }
                }
                if (!hasDeeper) applyPill(noBr[q]);
            }
        }

        /* 诊断日志：不出效果时按 F12 看 Console */
        try {
            console.log('[hdchina清爽主题 v2.32] 投票列修复:', voteFixed,
                '| 灰底清除:', grayCleared, '| 标题框恢复:', headersFixed, '| 分页修复:', pagerFixed,
                voteFixed === 0 ? '| 投票列实际文本样本: ' + (voteSamples.join(' / ') || '无') : '');
        } catch (e) {}
    }

    /* ============================================================
     * 字幕页 subtitles.php：隔行插色已改由 CSS 常驻规则处理（见 buildCSS），
     * 不再用 JS 逐行设 inline !important——否则 inline 优先级会盖过 CSS 的
     * hover 淡蓝，且分批渲染时逐行扫描会漏网（刷新有时有色有时无色）。
     * 这里只做一件事：把原生加在行/单元格上的"非白 inline 背景"清掉，
     * 让 CSS 规则能接管；不主动设白色。
     * ========================================================== */
    function fixSubtitles() {
        if (!enabled || location.pathname.indexOf('subtitles.php') === -1) return;
        var tables = document.querySelectorAll('table');
        for (var i = 0; i < tables.length; i++) {
            var rows = tables[i].querySelectorAll('tr');
            for (var r = 0; r < rows.length; r++) {
                var tr = rows[r];
                var head = /colhead/i.test(tr.className || '') || !!tr.querySelector('td.colhead, th');
                /* 只清除会干扰压白的原生 inline 背景，不主动上色 */
                if (tr.style.backgroundColor) {
                    tr.style.removeProperty('background-color');
                }
                if (tr.style.backgroundImage) {
                    tr.style.removeProperty('background-image');
                }
                var cells = tr.querySelectorAll('td');
                for (var c = 0; c < cells.length; c++) {
                    if (cells[c].style.backgroundColor) cells[c].style.removeProperty('background-color');
                    if (cells[c].style.backgroundImage) cells[c].style.removeProperty('background-image');
                }
            }
        }
    }

    /* ============================================================
     * 布局观察器（自动诊断"收缩又展开"）：
     * 页头/搜索箱/表格容器的高度在加载中发生变化时，Console 直接打印
     * 是哪个元素从多少 px 变到多少 px，一锤定音找出塌陷元凶
     * ========================================================== */
    function watchLayout() {
        try {
            var targets = [];
            var hb = document.querySelector('.headerbox');
            if (hb) targets.push(['页头.headerbox', hb]);
            var sb = document.querySelector('.searchbox');
            if (sb) targets.push(['搜索箱.searchbox', sb]);
            var tl = document.querySelector('.torrent_list');
            if (tl) targets.push(['种子表.torrent_list', tl]);
            if (!targets.length) return;
            var last = targets.map(function (t) { return t[1].offsetHeight; });
            var iv = setInterval(function () {
                var changed = false;
                var msg = '[hdchina清爽主题] 高度变化:';
                for (var i = 0; i < targets.length; i++) {
                    var h = targets[i][1].offsetHeight;
                    if (h !== last[i]) {
                        msg += ' [' + targets[i][0] + ' ' + last[i] + '→' + h + 'px]';
                        last[i] = h;
                        changed = true;
                    }
                }
                if (changed) console.log(msg, 'T+' + since() + 'ms');
                if (document.readyState === 'complete' && since() > 4000) clearInterval(iv);
            }, 100);
        } catch (e) {}
    }

    /* 渐进渲染淡入：等种子表行数连续多轮不再增长，且表格高度稳定后，
     * 才给 body 加 class 让表格淡入。用户看到的是一次性出现的完整表格，
     * 而不是分批生长、下方内容被顶下去的抖动。
     * 仅在种子列表页启用；有超时兜底，绝不无限隐藏。 */
    function waitTableStable() {
        if (location.pathname.indexOf('torrents.php') === -1) {
            document.body && document.body.classList.add('ssd-table-ready');
            return;
        }
        var stableCount = 0;
        var lastRows = -1;
        var lastH = -1;
        var startAt = Date.now();
        var iv = setInterval(function () {
            var tbl = document.querySelector('.torrent_list');
            var done = false;
            if (!tbl) {
                /* 表格还没出现：等，但 1.5s 后无论如何放行 */
                if (Date.now() - startAt > 1500) done = true;
            } else {
                var rows = tbl.querySelectorAll('tbody tr').length;
                var h = tbl.offsetHeight;
                if (rows === lastRows && h === lastH && rows > 0) stableCount++;
                else stableCount = 0;
                lastRows = rows;
                lastH = h;
                /* 连续 3 轮（约 240ms）稳定，或页面 complete 后行稳定 2 轮，或硬超时 3s */
                if (stableCount >= 3 ||
                    (document.readyState === 'complete' && stableCount >= 2) ||
                    Date.now() - startAt > 3000) done = true;
            }
            if (done) {
                clearInterval(iv);
                document.body && document.body.classList.add('ssd-table-ready');
            }
        }, 80);
    }

    function boot() {
        apply();
        placeStyle();
        purgeGrayBands();
        fixOffersAndPager();
        fixSubtitles();
        /* 早期多轮补扫：首帧后立刻把残留灰蓝压掉，避免闪一下 */
        var delays = [16, 60, 150, 320, 700, 1200];
        for (var d = 0; d < delays.length; d++) {
            (function (t) {
                setTimeout(function () {
                    purgeGrayBands();
                    if (t <= 320) { fixOffersAndPager(); fixSubtitles(); }
                    if (t <= 700) placeStyle();
                }, t);
            })(delays[d]);
        }
        watchDom();
        watchLayout();
        if (fadeIn) waitTableStable();
        /* 解析期间每 8ms 重新落位一次样式（同容器时是空操作，开销可忽略）。
         * 不依赖 DOM 监听回调时机——单页 HTML 可能一次性解析完，回调要到结束才触发 */
        var pt = setInterval(function () {
            placeStyle();
            if (document.readyState === 'complete') clearInterval(pt);
        }, 8);
        /* 首帧诊断 */
        (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(function () {
            try {
                var st = document.getElementById('ssd-theme-style');
                var pos = st && st.parentNode === document.body ? 'body末尾'
                        : st && st.parentNode === document.head ? 'head末尾' : 'html开头';
                console.log('[hdchina清爽主题 v2.32] 首帧 ' + since() + 'ms，样式位置：' + pos);
            } catch (e) {}
        });
    }

    boot();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    }

    /* ============================================================
     * 菜单开关
     * ========================================================== */
    function registerMenu() {
        if (typeof GM_registerMenuCommand !== 'function') return;
        GM_registerMenuCommand(enabled ? '✔ SSD主题：已启用（点击关闭）' : '✘ SSD主题：已关闭（点击开启）', function () {
            enabled = !enabled;
            set('enabled', enabled ? '1' : '0');
            location.reload();
        });
        GM_registerMenuCommand(compact ? '📦 紧凑行距：开（点击关闭）' : '📦 紧凑行距：关（点击开启）', function () {
            compact = !compact;
            set('compact', compact ? '1' : '0');
            location.reload();
        });
        GM_registerMenuCommand(stickyHead ? '📌 表头吸顶：开（点击关闭）' : '📌 表头吸顶：关（点击开启）', function () {
            stickyHead = !stickyHead;
            set('stickyHead', stickyHead ? '1' : '0');
            location.reload();
        });
        GM_registerMenuCommand(fadeIn ? '✨ 淡入防抖：开（点击关闭）' : '✨ 淡入防抖：关（点击开启）', function () {
            fadeIn = !fadeIn;
            set('fadeIn', fadeIn ? '1' : '0');
            location.reload();
        });
    }
    registerMenu();
})();
