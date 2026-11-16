// ==UserScript==
// @name         hdchina清爽主题
// @namespace    https://hdwing.org/
// @version      2.40.0
// @description  hdchina清爽主题：全站白底、蓝色导航条、置顶淡蓝行、清晰网格。候选区/求种区/字幕页同样生效。
// @author       WorkBuddy
// @homepageURL   https://github.com/ljp801005-tech/hdwing-clean-theme
// @supportURL    https://github.com/ljp801005-tech/hdwing-clean-theme/issues
// @updateURL     https://raw.githubusercontent.com/ljp801005-tech/hdwing-clean-theme/main/hdwing-ssd-theme.user.js
// @downloadURL   https://raw.githubusercontent.com/ljp801005-tech/hdwing-clean-theme/main/hdwing-ssd-theme.user.js
// @match        https://hdwing.org/*
// @match        http://hdwing.org/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_info
// @connect      raw.githubusercontent.com
// @connect      githubusercontent.com
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
        /* 原主题的底色多数写在行内样式 / bgcolor 属性上，CSS 压不住，
         * 只能等 JS 的"清白处理"跑完才变白——那已经是第一帧之后了，
         * 所以会先闪一下旧底色。这里先给 html 打标记把 body 藏起来，
         * 等首次清白完成后再整页显示：用户看到的是"白 → 完整主题页"。 */
        if (enabled) de.classList.add('ssd-boot');
    } catch (e) {}

    /* 兜底放行：无论后续哪一步出错，最多 1.2s 后一定显示页面 */
    var __revealed = false;
    function revealPage() {
        if (__revealed) return;
        __revealed = true;
        try { document.documentElement.classList.remove('ssd-boot'); } catch (e) {}
    }
    setTimeout(revealPage, 1200);

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

/* 首帧防闪：首次"清白处理"完成前先不显示 body。
 * 原主题底色写在行内样式/bgcolor 上，CSS 压不住，只能靠 JS 抹掉；
 * 不藏的话会先画一帧旧底色再被刷白，就是"闪一下原主题颜色"。
 * 该 class 在 boot 结束时移除，另有 1.2s 兜底定时器放行。 */
html.ssd-boot body { visibility: hidden !important; }
html.ssd-boot { background: #ffffff !important; }

${fadeIn ? `
/* 渐进渲染淡入（与扩展版一致的安全写法）：表格始终可见，只用一次短促的
 * CSS 动画做淡入，不依赖任何 JS 加类。
 * 旧写法是 opacity:0 + 等 JS 判断稳定后加类显示——那会让页面先塌成很矮、
 * 再突然长高，刷新/翻页时整页"抽动"。动画即使不生效，表格也保持原生可见。 */
@keyframes ssdReveal { from { opacity: .35; } to { opacity: 1; } }
.torrent_list { animation: ssdReveal .35s ease both !important; }
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
/* 普通链接用主题蓝；但"用户资料链接"排除在外——HDWinG 原生用内联
 * <font color> 按用户等级给用户名上色（红/蓝/金等），不能被主题蓝覆盖 */
a:link:not([href*="userdetails.php"]),
a:visited:not([href*="userdetails.php"]),
a:active:not([href*="userdetails.php"]) { color: ${C.link} !important; text-decoration: none !important; }
a:hover:not([href*="userdetails.php"]) { color: ${C.link} !important; text-decoration: underline !important; }

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
/* 账号名保留原生 <font color>（按用户等级着色）：b 标签若属于 userdetails 链接，
 * 不能被下面的 #444 覆盖，否则会吃掉原生字体色 */
.userinfo b:not(a[href*="userdetails.php"] *),
.userinfort b:not(a[href*="userdetails.php"] *) { color: #444 !important; }
/* 用户名链接一律保留 HDWinG 原生颜色（内联 <font color> 按等级着色），
 * 全局链接规则已用 :not([href*="userdetails.php"]) 排除，这里不再强制染色。 */
.user_box {
    background: #f2f2f2 !important;
    border: 1px #d0d0d0 solid !important;
    border-radius: 3px !important;
    color: #333 !important;
}
/* user_box 内的账号链接保留原生字体色，不染主题蓝 */
.user_box a:not([href*="userdetails.php"]) { color: ${C.link} !important; }
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
/* 发布者列账号名：本主题所有规则都不命中 userdetails 链接及其内部 font/b，
 * 让 HDWinG 原生 <font color>（按用户等级着色）自然生效。
 * "匿名"等非账号文字无 font color，走 td 的 #444 继承。 */

/* 进度条保留但瘦身 */
.progressfont { font-size: 10px !important; }

/* ---------- 分页：所有按钮强制统一定高，确保同一水平线 ----------
 * 用固定 height + border-box + 统一 line-height，彻底消除深蓝块与白色按钮的高度差。
 * 不再依赖基线/原生盒模型——此前深蓝块被 JS 内联样式撑高、上下溢出格子。 */
.page_number, .page_prev, .page_next { font-size: 13px !important; line-height: 1 !important; }
.page_number a, .page_prev a, .page_next a,
.page_number b, .page_number strong, .page_number font,
.page_number span, .page_number td {
    display: inline-block !important;
    box-sizing: border-box !important;
    height: 26px !important;
    line-height: 24px !important;
    padding: 0 9px !important;
    margin: 0 1px !important;
    vertical-align: middle !important;
    font-size: 13px !important;
    font-weight: bold !important;
    border: 1px solid #d0d7de !important;
    border-radius: 3px !important;
    text-decoration: none !important;
}
.page_number a, .page_prev a, .page_next a {
    color: ${C.link} !important;
    background: transparent !important;
}
.page_number a:hover, .page_prev a:hover, .page_next a:hover {
    background: ${C.stripe} !important;
}
/* 当前页码：只认 JS 精确识别后打的 .ssd-pager-current 标记，
 * 不再无条件染所有 b/strong/span/font（那会把其他页也染蓝）。
 * 盒模型与上面完全相同，仅覆盖颜色。 */
.page_number .ssd-pager-current, .page_prev .ssd-pager-current, .page_next .ssd-pager-current {
    background: ${C.navBg} !important;
    color: #ffffff !important;
    border-color: ${C.navBg} !important;
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

    var lastCSS = '';
    function apply() {
        var st = document.getElementById('ssd-theme-style');
        if (!enabled) { if (st && st.parentNode) st.parentNode.removeChild(st); lastCSS = ''; return; }
        var css = buildCSS();
        /* CSS 与上次完全相同就什么都不做：重复写 textContent 会让浏览器重新解析
         * 整张样式表、并重启淡入动画（刷新时页面二次闪一下），是抽动的来源之一 */
        if (st) {
            if (css !== lastCSS) { st.textContent = css; lastCSS = css; }
            return;
        }
        addStyle(css);
        lastCSS = css;
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

        /* 3) 分页当前页：只染当前页一个，其他页保持白底蓝字 */
        var pagerFixed = 0;
        function isPagerContext(el) {
            var ctx = el.closest('tr, p, div, td, center') || el.parentElement;
            return !!ctx && (ctx.textContent || '').indexOf('上一页') !== -1;
        }
        function applyPill(el) {
            /* 打当前页标记（CSS 靠 .ssd-pager-current 上色），内联颜色作双保险。
             * 盒模型交给样式表统一处理，内联不碰尺寸。 */
            try { el.classList.add('ssd-pager-current'); } catch (e) {}
            el.style.setProperty('background-color', C.navBg, 'important');
            el.style.setProperty('color', '#ffffff', 'important');
            el.style.setProperty('border-color', C.navBg, 'important');
            pagerFixed++;
        }
        function normRangeText(s) {
            return (s || '').replace(/\s|\u00a0/g, '')
                            .replace(/[–—―−]/g, '-')
                            .replace(/[\[\]【】［］]/g, '');
        }
        /* 收集分页区"叶子"按钮：文本为数字段，或是上一页/下一页链接。
         * 链接内层的 <b>/<font> 一律上提到 <a> 层级，避免内外层重复命中。 */
        var rawBtns = [];
        var seenEls = [];
        var allEls = content.querySelectorAll('a, b, strong, font, span, td');
        for (var i = 0; i < allEls.length; i++) {
            var bel = allEls[i];
            if (!isPagerContext(bel)) continue;
            var bt = normRangeText(bel.textContent);
            var isRange = /^\d+-\d+$/.test(bt);
            var isNav = bel.tagName === 'A' && /(上一页|下一页)/.test(bel.textContent || '');
            if (!isRange && !isNav) continue;
            var host = bel;
            if (bel.closest) { var pa = bel.closest('a'); if (pa && isPagerContext(pa)) host = pa; }
            var dup = false;
            for (var j = 0; j < seenEls.length; j++) { if (seenEls[j] === host) { dup = true; break; } }
            if (dup) continue;
            seenEls.push(host);
            rawBtns.push({ el: host, text: normRangeText(host.textContent), isRange: isRange });
        }
        /* 剔除容器（如包着按钮的 td），只留最内层按钮 */
        var pagerBtns = [];
        for (var k = 0; k < rawBtns.length; k++) {
            var containerHit = false;
            for (var k2 = 0; k2 < rawBtns.length; k2++) {
                if (k2 !== k && rawBtns[k].el.contains(rawBtns[k2].el)) { containerHit = true; break; }
            }
            if (!containerHit) pagerBtns.push(rawBtns[k]);
        }
        /* 统一所有分页按钮字体（字号/粗细/字族一致），消除 <a>/<b>/<font> 原生差异 */
        for (var f = 0; f < pagerBtns.length; f++) {
            pagerBtns[f].el.style.setProperty('font-size', '13px', 'important');
            pagerBtns[f].el.style.setProperty('font-weight', 'normal', 'important');
            pagerBtns[f].el.style.setProperty('font-family', 'inherit', 'important');
        }
        /* 用 URL 的 page 参数精确推导当前页码段：起始基数(0/1)与每页条数
         * 由分页链接自身样本投票校准，不依赖任何类名或标签猜测 */
        var pageParam = null;
        var mp = location.search.match(/[?&]page=(\d+)/);
        if (mp) pageParam = parseInt(mp[1], 10);
        var totalItems = 0;
        var qpairs = [];
        for (var p1 = 0; p1 < pagerBtns.length; p1++) {
            var b1 = pagerBtns[p1];
            if (!b1.isRange) continue;
            var seg = b1.text.split('-');
            var endNum = parseInt(seg[1], 10);
            if (endNum > totalItems) totalItems = endNum;
            if (b1.el.tagName === 'A') {
                var mh = (b1.el.getAttribute('href') || '').match(/[?&]page=(\d+)/);
                if (mh) qpairs.push({ q: parseInt(mh[1], 10), start: parseInt(seg[0], 10) });
            }
        }
        var step = 100;
        if (qpairs.length >= 2) {
            qpairs.sort(function (x, y) { return x.q - y.q; });
            for (var p2 = 1; p2 < qpairs.length; p2++) {
                if (qpairs[p2].q === qpairs[p2 - 1].q + 1) {
                    step = qpairs[p2].start - qpairs[p2 - 1].start;
                    break;
                }
            }
            if (!(step > 0)) step = 100;
        }
        var votes0 = 0, votes1 = 0;
        for (var p3 = 0; p3 < qpairs.length; p3++) {
            if (qpairs[p3].start === qpairs[p3].q * step + 1) votes0++;
            if (qpairs[p3].start === (qpairs[p3].q - 1) * step + 1) votes1++;
        }
        var cur = pageParam === null ? 0 : (votes1 > votes0 ? pageParam - 1 : pageParam);
        if (!(cur > 0)) cur = 0;
        var expEnd = Math.min(cur * step + step, totalItems || cur * step + step);
        var expected = (cur * step + 1) + '-' + expEnd;
        /* 只给文本等于当前页码段的按钮上色：非链接标记优先，链接次之 */
        var currentEl = null, linkHit = null;
        for (var p4 = 0; p4 < pagerBtns.length; p4++) {
            var b4 = pagerBtns[p4];
            if (!b4.isRange || b4.text !== expected) continue;
            if (b4.el.tagName !== 'A') { currentEl = b4.el; break; }
            if (!linkHit) linkHit = b4.el;
        }
        if (!currentEl) currentEl = linkHit;
        /* 兜底 1：带 current/active/selected class 的元素 */
        if (!currentEl) {
            var cls = content.querySelectorAll(
                'a.current, a.active, a.selected, .current, .active, .selected, .pager-current-link');
            for (var m = 0; m < cls.length; m++) {
                var cst = normRangeText(cls[m].textContent);
                if (/^\d+-\d+$/.test(cst) && isPagerContext(cls[m])) { currentEl = cls[m]; break; }
            }
        }
        /* 兜底 2：非链接页码标记中起点最接近当前页的一个（page 参数映射异常时兜住） */
        if (!currentEl) {
            var bestDiff = Infinity;
            for (var p5 = 0; p5 < pagerBtns.length; p5++) {
                var b5 = pagerBtns[p5];
                if (!b5.isRange || b5.el.tagName === 'A') continue;
                var d5 = Math.abs(parseInt(b5.text.split('-')[0], 10) - (cur * step + 1));
                if (d5 < bestDiff) { bestDiff = d5; currentEl = b5.el; }
            }
        }
        if (currentEl) {
            /* 去掉原生方括号（如 [1-100] → 1-100），只改文本不碰样式 */
            if (/[\[\]【】［］]/.test(currentEl.textContent || '')) {
                currentEl.textContent = normRangeText(currentEl.textContent);
            }
            applyPill(currentEl);
        }

        /* 诊断日志：不出效果时按 F12 看 Console */
        try {
            console.log('[hdchina清爽主题 v2.40] 投票列修复:', voteFixed,
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

    /* 原 watchLayout 布局观察器已删除：它每 100ms 读一次 offsetHeight（强制重排），
     * 加载期本身就会让页面抖动，属于开发期诊断代码，不该常驻运行。 */

    /* 淡入改由 CSS 动画完成（见 buildCSS），不再需要 JS 轮询表格高度加类。
     * 旧的 waitTableStable 会每 80ms 读一次 offsetHeight（强制重排），
     * 且它配合 opacity:0 会让页面先塌再长高——正是"整页抽动"的来源，已删除。 */

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
        /* 每日首次检测更新：延迟执行，不与首帧渲染抢资源 */
        setTimeout(checkUpdateDaily, 1500);
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
                console.log('[hdchina清爽主题 v2.40] 首帧 ' + since() + 'ms，样式位置：' + pos);
            } catch (e) {}
        });
        /* 页面已解析完（DOMContentLoaded 那次 boot）：清白处理已跑过，
         * 等一帧让样式落定后整页显示，用户看不到旧底色 */
        if (document.readyState !== 'loading') {
            (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(revealPage);
        }
    }

    boot();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    }

    /* ============================================================
     * 分页对齐诊断：按 Shift+D 在 Console 打印分页区真实 DOM 结构
     * 与每个按钮的计算样式，用于精确定位"蓝块与白按钮不齐"的根因。
     * 只读，不改任何样式。
     * ========================================================== */
    function dumpPagerInfo() {
        var cands = document.querySelectorAll('div, td, p, span, table, nav, center');
        var row = null;
        for (var i = 0; i < cands.length; i++) {
            var t = (cands[i].textContent || '').replace(/\s/g, '');
            if (t.indexOf('上一页') !== -1 && t.indexOf('下一页') !== -1 && /\d+[-–]\d+/.test(t) && t.length < 120) {
                if (!row || cands[i].textContent.length < row.textContent.length) row = cands[i];
            }
        }
        console.groupCollapsed('[分页诊断] 容器候选');
        if (!row) {
            console.log('未找到分页行容器');
        } else {
            console.log('容器:', row.tagName, 'class=', row.className, 'id=', row.id);
            console.log('outerHTML:', row.outerHTML.slice(0, 3000));
            var kids = row.querySelectorAll('*');
            var data = [];
            for (var k = 0; k < kids.length; k++) {
                var el = kids[k];
                if (!el.children.length) {
                    var cs = getComputedStyle(el);
                    var txt = (el.textContent || '').trim().slice(0, 20);
                    if (!txt) continue;
                    data.push({
                        tag: el.tagName,
                        class: el.className,
                        text: txt,
                        display: cs.display,
                        height: cs.height,
                        lineHeight: cs.lineHeight,
                        padding: cs.padding,
                        verticalAlign: cs.verticalAlign,
                        boxSizing: cs.boxSizing,
                        bgColor: cs.backgroundColor,
                        fontSize: cs.fontSize
                    });
                }
            }
            console.table(data);
        }
        console.groupEnd();
    }
    try {
        document.addEventListener('keydown', function (e) {
            if (e.shiftKey && e.key === 'D') dumpPagerInfo();
        });
    } catch (e) {}

    /* ============================================================
     * 自动更新检测（双保险）
     * 说明：油猴脚本无法自己覆盖安装自己，真正的自动更新由 Tampermonkey
     * 依据 @updateURL/@downloadURL + 扩展设置里的"检查频率"完成。
     * 这里额外做一件事：每天第一次打开站点时，主动拉取 raw 脚本头部的
     * @version，若发现新版本就弹桌面通知并给出"立即更新"菜单，避免
     * 在没配好静默更新时完全无感知。检测结果按日期缓存，一天只查一次。
     * ========================================================== */
    var UPDATE_URL = 'https://raw.githubusercontent.com/ljp801005-tech/hdwing-clean-theme/main/hdwing-ssd-theme.user.js';
    var LOCAL_VERSION = '2.40.0';

    function cmpVer(a, b) {
        var x = String(a).split('.'), y = String(b).split('.');
        var n = Math.max(x.length, y.length);
        for (var i = 0; i < n; i++) {
            var xi = parseInt(x[i], 10) || 0, yi = parseInt(y[i], 10) || 0;
            if (xi > yi) return 1;
            if (xi < yi) return -1;
        }
        return 0;
    }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }

    function openInstallPage() {
        var u = 'https://raw.githubusercontent.com/ljp801005-tech/hdwing-clean-theme/main/hdwing-ssd-theme.user.js';
        try { window.open(u, '_blank'); } catch (e) { location.href = u; }
    }

    function checkUpdateDaily() {
        if (typeof GM_xmlhttpRequest !== 'function') return;
        var today = todayStr();
        if (get('lastUpdateCheck', '') === today) return;   /* 今天已查过 */
        set('lastUpdateCheck', today);                       /* 先标记，避免并发重复 */
        try {
            GM_xmlhttpRequest({
                method: 'GET',
                url: UPDATE_URL + '?nocache=' + Date.now(),
                timeout: 8000,
                headers: { 'Cache-Control': 'no-cache' },
                onload: function (res) {
                    try {
                        if (!res || res.status !== 200 || !res.responseText) return;
                        var m = res.responseText.match(/@version\s+([\d.]+)/);
                        if (!m) return;
                        var remote = m[1];
                        if (cmpVer(remote, LOCAL_VERSION) > 0) {
                            set('updateAvailable', remote);
                            var msg = 'hdchina清爽主题有新版本 ' + remote +
                                      '（当前 ' + LOCAL_VERSION + '）。点此打开更新页。';
                            try {
                                if (typeof GM_notification === 'function') {
                                    GM_notification({
                                        title: 'hdchina清爽主题 · 发现新版本',
                                        text: msg,
                                        timeout: 15000,
                                        onclick: openInstallPage
                                    });
                                } else {
                                    console.log('[hdchina清爽主题] ' + msg);
                                }
                            } catch (e) {
                                console.log('[hdchina清爽主题] ' + msg);
                            }
                        } else {
                            set('updateAvailable', '');
                        }
                    } catch (e) {}
                },
                onerror: function () {},
                ontimeout: function () {}
            });
        } catch (e) {}
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
        GM_registerMenuCommand('🔄 检查脚本更新（立即）', function () {
            set('lastUpdateCheck', '');   /* 清掉今日缓存，强制检查 */
            checkUpdateDaily();
        });
        var avail = get('updateAvailable', '');
        if (avail) {
            GM_registerMenuCommand('⬆ 有新版本 ' + avail + ' · 点击更新', function () {
                openInstallPage();
            });
        }
    }
    registerMenu();
})();
