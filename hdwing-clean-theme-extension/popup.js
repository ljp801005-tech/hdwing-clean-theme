(function () {
    'use strict';

    var DEFAULTS = { enabled: '1', compact: '1', stickyHead: '0', fadeIn: '1' };
    var state = {};
    var hdwingTab = null;

    /* 找到当前窗口里的 HDWinG 标签页（优先当前激活的） */
    function findTab(cb) {
        chrome.tabs.query({ currentWindow: true }, function (tabs) {
            var hit = null;
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i].active && /hdwing\.org/.test(tabs[i].url || '')) { hit = tabs[i]; break; }
            }
            if (!hit) {
                for (var j = 0; j < tabs.length; j++) {
                    if (/hdwing\.org/.test(tabs[j].url || '')) { hit = tabs[j]; break; }
                }
            }
            cb(hit || null);
        });
    }

    /* 在目标页主世界读写 localStorage（content script 隔离世界也能读到同名 key） */
    function pageGet(key, cb) {
        if (!hdwingTab) { cb(DEFAULTS[key]); return; }
        chrome.scripting.executeScript({
            target: { tabId: hdwingTab.id },
            world: 'MAIN',
            func: function (k) { return localStorage.getItem('ssdtheme_' + k); },
            args: [key]
        }, function (res) {
            var v = res && res[0] && res[0].result;
            cb(v === null || v === undefined ? DEFAULTS[key] : String(v));
        });
    }

    function pageSet(key, val, done) {
        if (!hdwingTab) { done && done(); return; }
        chrome.scripting.executeScript({
            target: { tabId: hdwingTab.id },
            world: 'MAIN',
            func: function (k, v) { localStorage.setItem('ssdtheme_' + k, v); },
            args: [key, val]
        }, function () { done && done(); });
    }

    function render() {
        var rows = document.querySelectorAll('.row');
        for (var i = 0; i < rows.length; i++) {
            var key = rows[i].getAttribute('data-key');
            var on = state[key] === '1';
            rows[i].querySelector('.sw').classList.toggle('on', on);
        }
    }

    function toggle(key) {
        var next = state[key] === '1' ? '0' : '1';
        state[key] = next;
        render();
        pageSet(key, next, function () {
            if (hdwingTab) chrome.tabs.reload(hdwingTab.id);
        });
    }

    findTab(function (tab) {
        hdwingTab = tab;
        if (!tab) document.getElementById('tip').style.display = 'block';
        var keys = Object.keys(DEFAULTS);
        var left = keys.length;
        keys.forEach(function (k) {
            pageGet(k, function (v) {
                state[k] = v;
                if (--left === 0) render();
            });
        });
    });

    document.querySelectorAll('.row').forEach(function (row) {
        row.addEventListener('click', function () { toggle(row.getAttribute('data-key')); });
    });

    document.getElementById('openSite').addEventListener('click', function (e) {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://hdwing.org/torrents.php' });
    });
    document.getElementById('openRepo').addEventListener('click', function (e) {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/ljp801005-tech/hdwing-clean-theme' });
    });
})();
