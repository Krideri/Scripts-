// ==UserScript==
// @name         Grepolis God Tools
// @version      1.0.1
// @description  God Counter and God Switcher
// @author       The Invincble & Krideri
// @match        *://*.grepolis.com/game/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    if (window.__grepolisGodTools) return;
    window.__grepolisGodTools = true;

    /* ------------------------------------------------------------------ *
     * Shared constants & helpers
     * ------------------------------------------------------------------ */
    const GOD_NAMES = {
        zeus: "Zeus", poseidon: "Poseidon", hera: "Hera", athena: "Athena",
        hades: "Hades", artemis: "Artemis", aphrodite: "Aphrodite", ares: "Ares",
        none: "No god"
    };
    const COUNTER_ORDER = ["zeus", "poseidon", "hera", "athena", "hades", "artemis", "aphrodite", "ares", "none"];
    const SWITCHER_ORDER = ["zeus", "poseidon", "hera", "athena", "hades", "artemis", "aphrodite", "ares"];

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    };

    /* ------------------------------------------------------------------ *
     * Styles (single <style> element for both features)
     * ------------------------------------------------------------------ */
    function addStyles() {
        if ($("#god-tools-styles")) return;
        const style = el("style");
        style.id = "god-tools-styles";
        style.textContent = `
.god-city-counter{clear:both;margin:8px 18px 12px;padding:0 0 9px;color:#4b2f12;font:11px Arial,Helvetica,sans-serif;border-bottom:1px solid rgba(90,59,18,.38)}
.god-city-counter .counter-title{margin:0 0 9px;padding:0 2px 5px;color:#5a3b12;font:bold 16px/20px Georgia,"Times New Roman",serif;text-shadow:0 1px rgba(255,244,198,.8);border-bottom:1px solid rgba(90,59,18,.35)}
.god-city-counter .counter-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:5px 12px;padding:0 2px}
.god-city-counter .counter-item{display:flex;align-items:center;min-width:0;height:32px;padding:2px 5px 2px 2px;box-sizing:border-box;color:#3b240e;cursor:pointer;user-select:none;border:1px solid transparent}
.god-city-counter .counter-item:hover{border-color:rgba(102,68,29,.45);background:rgba(255,240,184,.3)}
.god-city-counter .counter-item.active{border-color:#657f35;background:rgba(181,205,116,.48);box-shadow:inset 0 0 3px rgba(63,91,31,.3)}
.god-city-counter .counter-item.inactive{opacity:.48}
.god-city-counter .counter-icon{display:flex;align-items:center;justify-content:center;width:32px;min-width:32px;height:30px;margin-right:5px;overflow:hidden}
.god-city-counter .counter-icon .god_micro{margin:0}
.god-city-counter .counter-no-god{color:#a31c1c;font:24px/28px Georgia,serif;text-shadow:1px 1px rgba(255,240,190,.7)}
.god-city-counter .counter-name{flex:1;min-width:0;overflow:hidden;color:#3c250f;font-weight:bold;text-overflow:ellipsis;white-space:nowrap}
.god-city-counter .counter-value{display:inline-block;min-width:25px;margin-left:5px;padding:1px 4px;box-sizing:border-box;color:#fff2c6;font:bold 11px/16px Arial,sans-serif;text-align:center;text-shadow:1px 1px #2a1606;border:1px solid #60401e;background:linear-gradient(#805b31,#533416);box-shadow:inset 0 1px rgba(255,255,255,.22)}
.god-city-counter .counter-footer{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 16px;min-height:28px;margin-top:9px;padding:7px 2px 0;color:#3d260f;border-top:1px solid rgba(90,59,18,.28)}
.god-city-counter .counter-stat{font-weight:bold;white-space:nowrap}
.god-city-counter .counter-stat-label{font-weight:normal}
.god-city-counter .gc-show-all{display:inline-block;height:20px;min-width:78px;padding:0 8px;box-sizing:border-box;border:1px solid #8a672c;border-radius:2px;background:#0F213A;color:wheat;font:bold 10px/18px Arial,sans-serif;text-align:center;text-decoration:none;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
.god-city-counter .gc-show-all:hover{background:linear-gradient(#fff9dc,#e6c985);color:#0F213A}
.god-city-counter .gc-show-all.disabled{opacity:.55;cursor:default;pointer-events:none}

#gsw-btn.btn_wrapper{position:absolute!important;z-index:20;width:var(--gsw-size,26px);height:var(--gsw-size,26px);margin:0!important;user-select:none}
#gsw-btn .gsw_toggle{position:relative;width:var(--gsw-size,26px);height:var(--gsw-size,26px);cursor:pointer;background-repeat:no-repeat!important}
#gsw-btn .gsw-bolt{position:absolute;inset:0;width:var(--gsw-size,26px);height:var(--gsw-size,26px);background:none!important}
#gsw-btn .gsw-bolt::before{content:"ϟ";position:absolute;left:0;top:-1px;width:var(--gsw-size,26px);height:var(--gsw-size,26px);color:#f3d17b;font:bold calc(var(--gsw-size,26px)*.85)/var(--gsw-size,26px) Georgia,serif;text-align:center;text-shadow:0 1px 1px #2b1807,1px 0 #6c4515,-1px 0 #6c4515}
#gsw-btn:hover .gsw-bolt::before,#gsw-btn.active .gsw-bolt::before{color:#fff0a4}
#gsw-btn.active .gsw_toggle{filter:brightness(1.18)}
.gsw-list{display:flex;flex-direction:column;gap:2px;margin-top:6px;max-height:calc(100vh - 340px);min-height:160px;overflow-y:auto;overflow-x:hidden}
.gsw-row{display:flex;align-items:center;gap:10px;padding:1px 8px 1px 4px;border:1px solid transparent;cursor:pointer;user-select:none}
.gsw-row:hover{border-color:rgba(102,68,29,.45);background:rgba(255,240,184,.3)}
.gsw-row.active{border-color:#657f35;background:rgba(181,205,116,.48);box-shadow:inset 0 0 3px rgba(63,91,31,.3)}
.gsw-name{flex:1;min-width:0;text-align:left;font:bold 13px Georgia,"Times New Roman",serif;color:#3c250f;text-shadow:0 1px rgba(255,244,198,.8)}
.gsw-iconbox{position:relative;flex:none;overflow:hidden}
.gsw-iconbox .god_overview_god_favor{position:absolute!important;left:0!important;top:0!important;float:none!important;margin:0!important;transform-origin:top left}
.gsw-iconbox a.favor{display:block!important;position:relative!important;text-decoration:none}
.gsw-iconbox .gods_overview_icon{position:relative!important;left:auto!important;top:auto!important;margin:0!important;float:none!important}
.gsw-iconbox.loading{opacity:.55}
#gswRoot.gsw-compact .gsw-list{position:absolute;left:-9999px;top:0;width:280px;visibility:hidden;pointer-events:none}
#gswCompactGrid{display:none}
#gswRoot.gsw-compact #gswCompactGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px 0;margin-top:6px}
.gsw-cell{display:block;padding:2px 0;border:1px solid transparent;cursor:pointer;user-select:none;text-align:center;min-width:0}
.gsw-cell:hover{background:rgba(255,240,184,.3);border-color:rgba(102,68,29,.45)}
.gsw-cell.active{background:rgba(181,205,116,.48);border-color:#657f35}
.gsw-cell.unused{filter:grayscale(1);opacity:.5}
.gsw-cbox{position:relative;margin:0 auto;overflow:hidden}
.gsw-cbox .god_overview_god_favor{position:absolute!important;left:0!important;top:0!important;float:none!important;margin:0!important;transform-origin:top left}
.gsw-cbox a.favor{display:block!important;position:relative!important;text-decoration:none}
.gsw-cbox .gods_overview_icon{position:relative!important;left:auto!important;top:auto!important;margin:0!important;float:none!important}
.gsw-cfavor{position:absolute;left:0;right:0;top:86%;transform:translateY(-50%);text-align:center;font:bold 12px/1 Arial,Helvetica,sans-serif;font-variant-numeric:lining-nums;color:#f6b73c;text-shadow:0 0 2px #000,0 1px 1px #000,1px 0 #000,-1px 0 #000;pointer-events:none}
.gsw-cfavor.plain{position:static;transform:none;margin-top:2px;color:#3c250f;text-shadow:none}
.gsw-cell.loading .gsw-cbox{opacity:.55}
.gsw-list .gsw-row.nearcap:not(.active){box-shadow:inset 3px 0 0 #e0a92b}
.gsw-cell.nearcap .gsw-cbox{filter:drop-shadow(0 0 4px rgba(240,190,60,.95))}
#gswRoot.gsw-compact .gsw-banner{display:none}
.gsw-banner{display:block;width:100%;max-width:286px;height:auto;margin:0 auto 4px;pointer-events:none;user-select:none}
.gsw-row.unused .gsw-iconbox,.gsw-row.unused .gsw-portrait,.gsw-row.unused .gsw-favor-wrap{filter:grayscale(1);opacity:.5}
.gsw-row.unused .gsw-name{color:#8a7e68;text-shadow:none}
.gsw-portrait{position:relative;width:40px;height:40px;min-width:40px;border-radius:50%;overflow:hidden;box-sizing:border-box;border:2px solid #8a672c;background:#1c1a16;box-shadow:inset 0 2px 5px rgba(0,0,0,.65),0 1px 2px rgba(0,0,0,.45);transition:box-shadow .12s}
.gsw-row:hover .gsw-portrait{box-shadow:inset 0 2px 5px rgba(0,0,0,.5),0 0 8px rgba(217,169,58,.8)}
.gsw-portrait-img{position:absolute;top:0;left:0;transform-origin:top left}
.gsw-portrait.loading{animation:gswPulse .7s ease-in-out infinite alternate}
@keyframes gswPulse{from{box-shadow:inset 0 2px 5px rgba(0,0,0,.65),0 0 3px rgba(217,169,58,.3)}to{box-shadow:inset 0 2px 5px rgba(0,0,0,.65),0 0 13px rgba(217,169,58,.95)}}
.gsw-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font:bold 18px Georgia,serif;color:#f3e6a6;text-shadow:0 1px 2px #000}
/* Favor: native .gods_favor_amount / .favor_amount markup, taken out of the game's absolute layout */
.gsw-favor-wrap{position:relative;flex:none;font-family:Arial,Helvetica,sans-serif;font-style:normal;font-weight:normal;letter-spacing:normal;text-align:left;text-shadow:none}
.gsw-favor-wrap .btn_gods_spells{position:absolute!important;left:21px!important;top:calc(50% - 2px)!important;right:auto!important;bottom:auto!important;margin:0!important;transform:translate(-50%,-50%);pointer-events:none;z-index:2}
.gsw-favor-wrap.plain .btn_gods_spells{display:none}
.gsw-favor-wrap .gods_favor_amount{position:relative!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;margin:0!important;float:none!important}
.gsw-favor-wrap.plain .gods_favor_amount{all:unset;display:block}
.gsw-favor-wrap.plain .favor_amount{all:unset;display:inline-block;min-width:64px;padding:1px 8px;box-sizing:border-box;text-align:center;font:bold 12px/16px Arial,Helvetica,sans-serif;color:#aee0ff;text-shadow:1px 1px #2a1606;border:1px solid #60401e;background:linear-gradient(#805b31,#533416);box-shadow:inset 0 1px rgba(255,255,255,.22)}
`;
        document.head.appendChild(style);
    }

    /* ------------------------------------------------------------------ *
     * God Counter
     * ------------------------------------------------------------------ */
    const counterDone = new WeakSet();

    function initCounter(wrapper) {
        if (counterDone.has(wrapper)) return;

        // Another copy of the counter (e.g. the old standalone script) already added a panel.
        if ($(".god-city-counter", wrapper)) { counterDone.add(wrapper); return; }

        const townList = $("#gods_overview_towns", wrapper);
        if (!townList) return;

        // Read each town's god once; the list is static after Grepolis finished loading it.
        const towns = $$(".town_item[data-god_id]", townList).map(node => ({
            node,
            god: (node.dataset.god_id || "").trim().toLowerCase() || "none"
        }));
        if (!towns.length) return;

        counterDone.add(wrapper);

        const counts = Object.fromEntries(COUNTER_ORDER.map(id => [id, 0]));
        towns.forEach(t => { counts[t.god] = (counts[t.god] || 0) + 1; });
        overviewUsage = Object.assign({}, counts);

        const order = COUNTER_ORDER.concat(
            Object.keys(counts).filter(id => !COUNTER_ORDER.includes(id)).sort()
        );

        const nativeIcons = $$(".god_icons_container .gods_overview_icon[data-god_id]", wrapper);

        const panel = el("div", "god-city-counter");
        panel.appendChild(el("div", "counter-title", "God Counter"));

        const list = el("div", "counter-list");
        const frag = document.createDocumentFragment();
        const items = new Map();

        order.forEach(godId => {
            const item = el("div", "counter-item");
            item.dataset.godId = godId;
            item.title = godId === "none"
                ? "Show cities without a god"
                : `Show cities worshipping ${GOD_NAMES[godId] || godId}`;

            const icon = el("div", "counter-icon");
            icon.appendChild(godId === "none"
                ? el("span", "counter-no-god", "×")
                : el("div", `god_micro town_god ${godId}`));

            item.append(
                icon,
                el("span", "counter-name", GOD_NAMES[godId] || godId),
                el("span", "counter-value", String(counts[godId] || 0))
            );
            items.set(godId, item);
            frag.appendChild(item);
        });
        list.appendChild(frag);

        const makeStat = (label, value, cls) => {
            const stat = el("span", "counter-stat");
            const strong = el("strong", cls, String(value));
            stat.append(el("span", "counter-stat-label", `${label}: `), strong);
            return { stat, strong };
        };
        const total = makeStat("Total cities", towns.length, "counter-total-value");
        const visible = makeStat("Visible cities", towns.length, "counter-visible-value");

        const showAll = el("a", "gc-show-all disabled", "Show all");
        showAll.href = "#";

        const footer = el("div", "counter-footer");
        footer.append(total.stat, visible.stat, showAll);
        panel.append(list, footer);
        townList.insertAdjacentElement("beforebegin", panel);

        let active = "all";

        function apply(godId) {
            if (godId === active) return;
            active = godId;

            let shown = 0;
            for (const t of towns) {
                const show = active === "all" || t.god === active;
                t.node.style.display = show ? "" : "none";
                if (show) shown++;
            }

            nativeIcons.forEach(icon => {
                const selected = active === "all" || icon.dataset.god_id === active;
                icon.classList.toggle("selected", selected);
            });

            items.forEach((item, id) => {
                item.classList.toggle("active", active !== "all" && id === active);
                item.classList.toggle("inactive", active !== "all" && id !== active);
            });

            showAll.classList.toggle("disabled", active === "all");
            visible.strong.textContent = String(shown);
        }

        const toggle = godId => apply(active === godId ? "all" : godId);

        list.addEventListener("click", e => {
            const item = e.target.closest(".counter-item");
            if (!item) return;
            e.preventDefault();
            e.stopPropagation();
            toggle(item.dataset.godId);
        });

        showAll.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            apply("all");
        });

        // Make the native god icons act as single-select filters (capture phase)
        wrapper.addEventListener("click", e => {
            const icon = e.target.closest(".god_icons_container .gods_overview_icon[data-god_id]");
            if (icon && wrapper.contains(icon) && icon.dataset.god_id) {
                e.preventDefault();
                e.stopImmediatePropagation();
                toggle(icon.dataset.god_id);
                return;
            }
            const btn = e.target.closest(".god_icons_container .filter_buttons a");
            if (btn && wrapper.contains(btn) &&
                (btn.classList.contains("cancel") || btn.classList.contains("confirm"))) {
                e.preventDefault();
                e.stopImmediatePropagation();
                apply("all");
            }
        }, true);

        nativeIcons.forEach(icon => icon.classList.add("selected"));
    }

    /* ------------------------------------------------------------------ *
     * God Switcher (opens as a native Grepolis dialog window)
     * ------------------------------------------------------------------ */
    const DEFAULT_BTN_POS = { left: 57, top: 19 };
    const portraitCache = new Map();

    let btnEl = null;
    let godObserver = null;
    let areaObserver = null;
    let favorTimer = null;
    let gswWin = null;


    const isTyping = t => {
        if (!t) return false;
        const tag = (t.tagName || "").toLowerCase();
        return tag === "input" || tag === "textarea" || tag === "select" || t.isContentEditable === true;
    };

    function getCurrentGod() {
        const node = $(".gods_container.god");
        if (!node) return null;
        return Array.from(node.classList).find(c => c !== "gods_container" && c !== "god") || null;
    }

    function changeGod(godId) {
        const { gpAjax, Game } = window;
        if (!gpAjax || !Game || Game.townId == null) return false;
        gpAjax.ajaxPost("building_temple", "change_god", { god_id: godId, town_id: Game.townId });
        return true;
    }

    // Reads the god's portrait sprite via a hidden probe element (cached per god).
    function resolveGodPortrait(godId) {
        if (portraitCache.has(godId)) return portraitCache.get(godId);
        const area = $(".gods_area");
        if (!area) return null;

        const probe = el("div", `gods_container god ${godId}`);
        probe.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;";
        area.appendChild(probe);
        const cs = getComputedStyle(probe);
        const data = {
            width: probe.offsetWidth || 90,
            height: probe.offsetHeight || 90,
            image: cs.backgroundImage,
            position: cs.backgroundPosition,
            size: cs.backgroundSize,
            repeat: cs.backgroundRepeat
        };
        probe.remove();

        if (data.image && data.image !== "none") portraitCache.set(godId, data);
        return data;
    }

    function makePortrait(godId) {
        const portrait = el("div", "gsw-portrait");
        portrait.dataset.god = godId;
        portrait.title = GOD_NAMES[godId];

        const data = resolveGodPortrait(godId);
        if (data && data.image && data.image !== "none") {
            const img = el("div", "gsw-portrait-img");
            Object.assign(img.style, {
                width: `${data.width}px`,
                height: `${data.height}px`,
                backgroundImage: data.image,
                backgroundPosition: data.position,
                backgroundSize: data.size,
                backgroundRepeat: data.repeat,
                transform: `scale(${36 / data.width})`
            });
            portrait.appendChild(img);
        } else {
            portrait.appendChild(el("div", "gsw-fallback", GOD_NAMES[godId].charAt(0)));
        }
        return portrait;
    }

    function makeRow(godId) {
        const row = el("div", "gsw-row");
        row.dataset.god = godId;
        row.title = `Switch to ${GOD_NAMES[godId]}`;

        const iconBox = el("div", "gsw-iconbox");
        const outer = el("div", "god_overview_god_favor");
        const link = el("a", "favor");
        link.href = "javascript:";
        const icon = el("div", `gods_overview_icon ${godId} selected`);
        icon.dataset.god_id = godId;
        link.appendChild(icon);
        outer.appendChild(link);
        iconBox.appendChild(outer);

        const wrap = el("div", "gsw-favor-wrap");
        const box = el("div", "gods_favor_amount ui-game-selectable");
        const amount = el("div", "favor_amount", "–");
        amount.dataset.god = godId;
        box.appendChild(amount);
        const bolt = el("div", "btn_gods_spells circle_button spells");
        bolt.appendChild(el("div", "icon js-caption"));
        wrap.append(box, bolt);

        row.append(iconBox, el("span", "gsw-name", GOD_NAMES[godId]), wrap);
        return row;
    }

    // Ares uses its own pre-cropped art (ring + laurels + a sliver of the bar, like the other icons), because the game's Ares icon carries the stored-fury bar.
    const ARES_ICON = "data:image/webp;base64,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";
    const ARES_ICON_ASPECT = 1.1538; // width / height of ARES_ICON

    // Ares' full icon (ring, laurels, empty bar) for the compact grid; the game's Ares icon carries the stored-fury bar.
    const ARES_FULL_ICON = "data:image/webp;base64,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";
    const ARES_FULL_ASPECT = 0.9286;
    const ARES_SCALE = 0.85; // Ares art size relative to the other icons in the compact grid
    const CELL_ICON_W = 80; // px width of each icon in the compact grid (4 columns must fit the window)
    let iconRef = null;     // natural size of a normal game icon, measured while building the list

    // Compact grid cell: the game's icon scaled to CELL_ICON_W with the favor number centred on its bar.
    function makeCell(godId) {
        const cell = el("div", "gsw-cell gsw-row");
        cell.dataset.god = godId;
        cell.title = `Switch to ${GOD_NAMES[godId]}`;
        const box = el("div", "gsw-cbox");
        const text = el("div", "gsw-cfavor", "–");
        text.dataset.god = godId;

        if (godId === "ares") {
            // The Ares art is cropped tight to the ring, so it is drawn smaller than the full game icons to look the same size.
            const boxH = iconRef ? Math.round(iconRef.h * CELL_ICON_W / iconRef.w) : Math.round(CELL_ICON_W * ARES_SCALE / ARES_FULL_ASPECT);
            const artH = Math.min(Math.round(CELL_ICON_W * ARES_SCALE / ARES_FULL_ASPECT), boxH); // never taller than the box, or the top gets cut
            const artW = Math.round(artH * ARES_FULL_ASPECT);
            box.style.cssText = `width:${CELL_ICON_W}px;height:${boxH}px;background:url(${ARES_FULL_ICON}) center bottom/${artW}px ${artH}px no-repeat`;
            text.style.top = `${boxH - Math.round(artH * 0.14)}px`;
        } else if (iconRef) {
            const k = CELL_ICON_W / iconRef.w;
            box.style.width = `${CELL_ICON_W}px`;
            box.style.height = `${Math.round(iconRef.h * k)}px`;
            const outer = el("div", "god_overview_god_favor");
            outer.style.transform = `scale(${k})`;
            const link = el("a", "favor");
            link.href = "javascript:";
            const icon = el("div", `gods_overview_icon ${godId} selected`);
            icon.dataset.god_id = godId;
            link.appendChild(icon);
            outer.appendChild(link);
            box.appendChild(outer);
        } else {
            box.style.width = box.style.height = "56px";
            box.appendChild(makePortrait(godId));
            text.classList.add("plain");
            cell.append(box, text);
            return cell;
        }
        box.appendChild(text);
        cell.appendChild(box);
        return cell;
    }

    const BANNER_IMG = "data:image/webp;base64,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"; // "God Switcher" ribbon
    const ICON_RING_H = 58;       // px height of the visible round icon
    const ICON_RING_RATIO = 0.77; // share of a normal icon's height that is the round part; lower = crop more

    // Every icon gets the SAME crop, measured on one normal god, so Ares (whose sprite is taller
    // because of its fury bar) is cut exactly like the others. Falls back to a portrait if no sprite renders.
    function applyIconFallback(grid) {
        const rows = $$(".gsw-row", grid);
        const sized = rows.map(r => $(".gods_overview_icon", r)).filter(i => i && i.offsetWidth >= 20 && i.offsetHeight >= 20);
        const ref = sized.find(i => !i.classList.contains("ares")) || sized[0];
        if (ref) iconRef = { w: ref.offsetWidth, h: ref.offsetHeight };
        rows.forEach(row => {
            const box = $(".gsw-iconbox", row);
            const icon = $(".gods_overview_icon", row);
            if (!box || !icon) return;
            if (row.dataset.god === "ares") {
                // Same box size as the other icons; the art is centred and may overhang slightly.
                const w = ref ? Math.round(ref.offsetWidth * ICON_RING_H / (ref.offsetHeight * ICON_RING_RATIO)) : Math.round(ICON_RING_H * ARES_ICON_ASPECT);
                box.textContent = "";
                box.style.cssText = `width:${w}px;height:${ICON_RING_H}px;overflow:visible`;
                const art = el("div");
                art.style.cssText = `position:absolute;left:50%;top:0;transform:translateX(-50%);height:${ICON_RING_H}px;width:${Math.round(ICON_RING_H * ARES_ICON_ASPECT)}px;background:url(${ARES_ICON}) center top/100% 100% no-repeat`;
                box.appendChild(art);
                return;
            }
            if (!ref || getComputedStyle(icon).backgroundImage === "none") {
                box.replaceWith(makePortrait(row.dataset.god));
                return;
            }
            const k = ICON_RING_H / (ref.offsetHeight * ICON_RING_RATIO);
            $(".god_overview_god_favor", box).style.transform = `scale(${k})`;
            box.style.width = `${Math.round(ref.offsetWidth * k)}px`;
            box.style.height = `${ICON_RING_H}px`;
        });
    }

    // The game's own favor readout for the active god (ignores our copies of the same markup).
    function nativeFavorNode() {
        return $$(".gods_favor_amount .favor_amount").find(n => !n.closest("#gswRoot")) || null;
    }

    function nativeFavor() {
        const node = nativeFavorNode();
        const n = node && parseInt(node.textContent.replace(/\D/g, ""), 10);
        return Number.isFinite(n) ? n : null;
    }

    // Current favor per god: native readout for the active god, PlayerGods model for the others.
    function getFavor(godId) {
        if (getCurrentGod() === godId) {
            const n = nativeFavor();
            if (n != null) return n;
        }
        try {
            const models = window.MM && window.MM.getModels && window.MM.getModels().PlayerGods;
            const model = models && (models[window.Game && window.Game.player_id] || Object.values(models)[0]);
            if (model) {
                for (const key of [`${godId}_favor`, `favor_${godId}`]) {
                    const v = model.get ? model.get(key) : model.attributes && model.attributes[key];
                    if (v != null && Number.isFinite(+v)) return Math.floor(+v);
                }
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    // Which gods are worshipped in at least one city. null = unknown (then nothing is greyed out).
    let overviewUsage = null; // cached from the Gods overview when it was opened

    function readUsageFromModels() {
        try {
            const towns = [];
            if (window.ITowns && typeof window.ITowns.getTowns === "function") {
                Object.values(window.ITowns.getTowns() || {}).forEach(t => towns.push(t));
            }
            if (!towns.length && window.MM && window.MM.getModels) {
                const m = window.MM.getModels().Town;
                if (m) Object.values(m).forEach(t => towns.push(t));
            }
            const readers = [
                t => t.god, t => t.get && t.get("god"), t => t.attributes && t.attributes.god,
                t => t.getGod && t.getGod(), t => t.attributes && t.attributes.god_id
            ];
            const counts = {};
            let known = 0;
            for (const t of towns) {
                for (const read of readers) {
                    try {
                        let v = read(t);
                        if (typeof v === "function") v = v.call(t);
                        if (typeof v === "string" && GOD_NAMES[v.toLowerCase()] && v.toLowerCase() !== "none") {
                            const g = v.toLowerCase();
                            counts[g] = (counts[g] || 0) + 1;
                            known++;
                            break;
                        }
                    } catch (e) { /* try next reader */ }
                }
            }
            return known ? counts : null;
        } catch (e) { return null; }
    }

    function readUsageFromOverviewDom() {
        const nodes = $$("#gods_overview_towns .town_item[data-god_id]");
        if (!nodes.length) return null;
        const counts = {};
        nodes.forEach(n => {
            const g = (n.dataset.god_id || "").trim().toLowerCase();
            if (g && g !== "none") counts[g] = (counts[g] || 0) + 1;
        });
        return counts;
    }

    function getGodUsage() {
        return readUsageFromModels() || readUsageFromOverviewDom() || overviewUsage;
    }

    const isMenuOpen = () => Boolean($("#gswRoot"));

    const FAVOR_COLOR = "#f6b73c", FAVOR_COLOR_MAX = "#e5362b";

    // Favor cap from the PlayerGods model; null when the game does not expose it (then nothing is marked red).
    function getFavorCap() {
        try {
            const models = window.MM && window.MM.getModels && window.MM.getModels().PlayerGods;
            const model = models && (models[window.Game && window.Game.player_id] || Object.values(models)[0]);
            if (model) {
                for (const key of ["max_favor", "favor_max", "max_god_favor"]) {
                    const v = model.get ? model.get(key) : model.attributes && model.attributes[key];
                    if (v != null && Number.isFinite(+v) && +v > 0) return +v;
                }
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function updateFavor() {
        const root = $("#gswRoot");
        if (!root) return;
        const cap = getFavorCap();
        $$(".favor_amount[data-god], .gsw-cfavor[data-god]", root).forEach(node => {
            const v = getFavor(node.dataset.god);
            const text = v == null ? "–" : String(v);
            if (node.textContent !== text) node.textContent = text;
            if ((node.classList.contains("favor_amount") && !node.closest(".plain")) || node.classList.contains("gsw-cfavor")) {
                node.style.color = cap != null && v != null && v >= cap ? FAVOR_COLOR_MAX : FAVOR_COLOR;
            }
        });
    }

    // Favor production per hour: read from the game's god icon tooltips (e.g. "Zeus (… per hour: 35.5)") whenever they
    // are on the page (Gods overview open), and remembered between sessions.
    const RATES_KEY = "godTools.godRates";
    const NEAR_CAP = 0.9; // share of the favor cap from which a god is highlighted
    let godRates = null;

    function loadRates() {
        if (godRates) return godRates;
        try { godRates = JSON.parse(localStorage.getItem(RATES_KEY)) || {}; } catch (e) { godRates = {}; }
        return godRates;
    }

    function updateRates() {
        const rates = loadRates();
        let changed = false;
        $$(".gods_overview_icon[data-god_id][title]").forEach(icon => {
            if (icon.closest("#gswRoot")) return;
            const m = icon.title.match(/:\s*([\d.,]+)\s*\)?\s*$/);
            const rate = m && parseFloat(m[1].replace(",", "."));
            const id = icon.dataset.god_id;
            if (GOD_NAMES[id] && Number.isFinite(rate) && rates[id] !== rate) { rates[id] = rate; changed = true; }
        });
        if (changed) {
            try { localStorage.setItem(RATES_KEY, JSON.stringify(rates)); } catch (e) { /* storage unavailable */ }
        }
    }

    function formatDuration(hours) {
        const min = Math.max(1, Math.round(hours * 60));
        const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
        if (d) return `${d}d ${h}h`;
        return h ? `${h}h ${m}m` : `${m}m`;
    }

    function godTooltip(id, favor, cap) {
        const rate = loadRates()[id];
        const lines = [`Switch to ${GOD_NAMES[id]}`];
        if (favor != null) {
            let info = cap ? `${favor}/${cap}` : String(favor);
            if (cap && favor >= cap) info += " (full)";
            else if (cap && rate > 0) info += ` (full in ${formatDuration((cap - favor) / rate)})`;
            if (rate > 0) info += `, +${rate}/h`;
            lines.push(info);
        }
        return lines.join("\n");
    }

    function refreshActive() {
        const root = $("#gswRoot");
        if (!root) return;
        const current = getCurrentGod();
        $$(".gsw-row", root).forEach(r => r.classList.toggle("active", r.dataset.god === current));
        const usage = getGodUsage();
        const cap = getFavorCap();
        updateRates();
        $$(".gsw-row", root).forEach(r => {
            const id = r.dataset.god;
            const favor = getFavor(id);
            const unused = Boolean(usage) && !usage[id] && id !== current;
            r.classList.toggle("unused", unused);
            r.classList.toggle("nearcap", cap != null && favor != null && favor >= cap * NEAR_CAP);
            r.title = godTooltip(id, favor, cap) + (unused ? "\n(not worshipped in any city)" : "");
        });
        const label = $("#gswCurrent", root);
        if (label) label.textContent = `Active god: ${current ? GOD_NAMES[current] || current : "–"}`;
        updateFavor();
    }

    function fillWindow() {
        const grid = $("#gswGrid");
        if (!grid) return;
        grid.textContent = "";
        SWITCHER_ORDER.forEach(id => grid.appendChild(makeRow(id)));
        applyIconFallback(grid);

        const compactGrid = $("#gswCompactGrid");
        if (compactGrid) {
            compactGrid.textContent = "";
            SWITCHER_ORDER.forEach(id => compactGrid.appendChild(makeCell(id)));
        }

        // Copy the typography of the game's own favor number so digits render identically.
        const ref = nativeFavorNode();
        if (ref) {
            const cs = getComputedStyle(ref);
            $$(".favor_amount[data-god]", grid).forEach(node => {
                Object.assign(node.style, {
                    fontFamily: cs.fontFamily,
                    fontSize: cs.fontSize,
                    fontWeight: cs.fontWeight,
                    fontStyle: cs.fontStyle,
                    lineHeight: cs.lineHeight,
                    letterSpacing: cs.letterSpacing,
                    textAlign: cs.textAlign,
                    textShadow: cs.textShadow
                });
            });
        }

        const probe = $(".gods_favor_amount", grid);
        if (probe) {
            const cs = getComputedStyle(probe);
            if (cs.backgroundImage === "none" || probe.offsetWidth < 30) {
                $$(".gsw-favor-wrap", grid).forEach(w => w.classList.add("plain"));
                $$(".favor_amount[data-god]", grid).forEach(n => n.removeAttribute("style"));
            }
        }
        const footer = $("#gswFooter");
        if (footer && !$("#gswGods")) {
            const btn = createGPButton("Gods", "gswGods");
            btn.title = "Open the Gods overview (God Counter)";
            btn.addEventListener("click", openGodsOverview);
            footer.appendChild(btn);
        }
        if (footer && !$("#gswCompact")) {
            const toggle = createGPButton(isCompact() ? "Expand" : "Compact", "gswCompact");
            toggle.title = "Switch between the list and the compact grid layout";
            toggle.addEventListener("click", toggleCompact);
            footer.appendChild(toggle);
        }
        refreshActive();
        if (isCompact()) setTimeout(fitCompactHeight, 100);
        clearInterval(favorTimer);
        favorTimer = setInterval(() => (isMenuOpen() ? (refreshActive(), savePos()) : closeMenu()), 2000);
    }

    function createGPButton(text, id) {
        const btn = el("div", "button_new");
        btn.id = id;
        const caption = el("div", "caption js-caption");
        caption.append(el("span", "", text), el("div", "effect js-effect"));
        btn.append(el("div", "left"), el("div", "right"), caption);
        return btn;
    }

    function openGodsOverview() {
        const f = window.TownOverviewWindowFactory;
        for (const name of ["openGodsOverview", "openGodOverview"]) {
            try {
                if (f && typeof f[name] === "function") { f[name](); return; }
            } catch (e) { /* try next */ }
        }
        console.warn("God Tools: could not find the Gods overview opener.");
    }

    const POS_KEY = "godTools.switcherPos2";
    let posReady = false; // true once the saved position was applied, so the default spot is never saved over it

    function loadPos() {
        try {
            const p = JSON.parse(localStorage.getItem(POS_KEY));
            if (p && Number.isFinite(p.left) && Number.isFinite(p.top)) {
                return {
                    left: Math.min(Math.max(0, p.left), Math.max(0, window.innerWidth - 120)),
                    top: Math.min(Math.max(0, p.top), Math.max(0, window.innerHeight - 60))
                };
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    // The draggable outer frame of the dialog: among the positioned ancestors of our content, the one jQuery UI made
    // draggable, else the outermost one that is not as wide as the whole screen (so a full-screen container is never picked).
    function findFrame() {
        const root = $("#gswRoot");
        if (!root) return null;
        const candidates = [];
        for (let n = root.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
            const pos = getComputedStyle(n).position;
            if (pos !== "absolute" && pos !== "fixed") continue;
            const r = n.getBoundingClientRect();
            if (r.width < 150 || r.width > window.innerWidth * 0.9) continue;
            candidates.push(n);
        }
        return candidates.find(n => n.classList.contains("ui-draggable") || n.classList.contains("ui-dialog"))
            || candidates[candidates.length - 1] || null;
    }

    // Moves the frame so its top-left corner sits at the saved viewport position (works whatever its offset parent is).
    function applyPos(saved) {
        const frame = findFrame();
        if (!frame || !saved) return false;
        const r = frame.getBoundingClientRect();
        const cs = getComputedStyle(frame);
        const l = parseFloat(cs.left) || 0, t = parseFloat(cs.top) || 0;
        frame.style.left = `${l + saved.left - r.left}px`;
        frame.style.top = `${t + saved.top - r.top}px`;
        return true;
    }

    function savePos() {
        if (!posReady) return;
        const frame = findFrame();
        if (!frame) return;
        const r = frame.getBoundingClientRect();
        if (!r.width || !Number.isFinite(r.left) || !Number.isFinite(r.top)) return;
        try {
            localStorage.setItem(POS_KEY, JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top) }));
        } catch (e) { /* storage unavailable */ }
    }

    const WINDOW_W = 310, WINDOW_W_COMPACT = 372, WINDOW_H_FULL = 720, WINDOW_H_COMPACT = 330;
    const COMPACT_BOTTOM_GAP = 26; // px left between the Gods/Expand buttons and the window edge once the height is fitted
    const COMPACT_KEY = "godTools.switcherCompact";
    let fittedCompactH = 0;

    function isCompact() {
        try { return localStorage.getItem(COMPACT_KEY) === "1"; } catch (e) { return false; }
    }

    // Trims the empty space under the buttons: measures what is left and shrinks (or grows) the window by that amount.
    function fitCompactHeight() {
        if (!isCompact() || !gswWin) return;
        const frame = findFrame(), footer = $("#gswFooter");
        if (!frame || !footer) return;
        const left = frame.getBoundingClientRect().bottom - footer.getBoundingClientRect().bottom;
        const delta = Math.round(left - COMPACT_BOTTOM_GAP);
        if (Math.abs(delta) > 3) {
            fittedCompactH = (fittedCompactH || WINDOW_H_COMPACT) - delta;
            gswWin.setSize(WINDOW_W_COMPACT, fittedCompactH);
        }
    }

    function applyLayout() {
        const root = $("#gswRoot");
        if (!root || !gswWin) return;
        const compact = isCompact();
        root.classList.toggle("gsw-compact", compact);
        fittedCompactH = 0;
        gswWin.setSize(compact ? WINDOW_W_COMPACT : WINDOW_W, compact ? WINDOW_H_COMPACT : WINDOW_H_FULL);
        if (compact) {
            setTimeout(fitCompactHeight, 150);
            setTimeout(fitCompactHeight, 500);
        }
        const label = $("#gswCompact .caption span");
        if (label) label.textContent = compact ? "Expand" : "Compact";
    }

    function toggleCompact() {
        try { localStorage.setItem(COMPACT_KEY, isCompact() ? "0" : "1"); } catch (e) { /* storage unavailable */ }
        applyLayout();
    }

    function openMenu() {
        if (isMenuOpen()) return;
        fittedCompactH = 0;
        const mgr = window.GPWindowMgr;
        if (!mgr) return;

        let w = mgr.Create(mgr.TYPE_DIALOG, "God Switcher");
        if (!w || !w.setContent2) w = mgr.getOpenFirst(mgr.TYPE_DIALOG);
        if (!w) return;
        gswWin = w;

        posReady = false;
        const saved = loadPos();
        if (!saved) setTimeout(() => w.setPosition(["center", 40]), 50);
        if (saved) {
            // Applied after the default centring (and once more in case the game re-centres on content changes).
            setTimeout(() => applyPos(saved), 80);
            setTimeout(() => applyPos(saved), 250);
            setTimeout(() => applyPos(saved), 600);
            setTimeout(() => applyPos(saved), 1200);
        }
        setTimeout(() => { posReady = true; }, saved ? 1400 : 400);
        w.setContent2(`
            <div id="gswRoot" style="padding:8px 12px 10px;font-family:Georgia,serif;color:#3a2a12;text-align:center;">
                <img class="gsw-banner" alt="God Switcher" src="${BANNER_IMG}">
                <div id="gswGrid" class="gsw-list"></div>
                <div id="gswCompactGrid"></div>
                <div id="gswCurrent" style="margin-top:8px;font-size:13px;"></div>
                <div id="gswFooter" style="margin-top:8px;display:flex;justify-content:center;gap:8px;"></div>
            </div>
        `);
        applyLayout();
        if (saved) applyPos(saved); // placed synchronously, before the first paint, so nothing jumps or waits
        if (btnEl) btnEl.classList.add("active");
        setTimeout(fillWindow, 50);
    }

    function closeMenu() {
        savePos();
        posReady = false;
        clearInterval(favorTimer);
        if (btnEl) btnEl.classList.remove("active");
        if (isMenuOpen() && gswWin) {
            try { gswWin.close(); } catch (e) { /* ignore */ }
        }
        gswWin = null;
    }

    function onPortraitClick(e) {
        const row = e.target.closest && e.target.closest("#gswRoot .gsw-row");
        if (!row) return;
        const portrait = $(".gsw-iconbox, .gsw-portrait", row) || row;
        const godId = row.dataset.god;
        if (getCurrentGod() === godId) return;
        portrait.classList.add("loading");
        if (changeGod(godId)) {
            let tries = 0;
            const poll = setInterval(() => {
                refreshActive();
                if (getCurrentGod() === godId || ++tries > 24) {
                    clearInterval(poll);
                    portrait.classList.remove("loading");
                    setTimeout(refreshActive, 800);
                }
            }, 250);
        } else {
            portrait.classList.remove("loading");
        }
    }

    function buildButton() {
        const wrapper = el("div", "btn_god_switcher btn_wrapper");
        wrapper.id = "gsw-btn";
        wrapper.title = "God Switcher";
        wrapper.innerHTML = '<div class="circle_button_small gsw_toggle"><div class="icon js-caption gsw-bolt"></div></div>';
        wrapper.addEventListener("click", e => {
            e.stopPropagation();
            isMenuOpen() ? closeMenu() : openMenu();
        });
        return wrapper;
    }

    function placeButton(button) {
        // Match the size of the game's own round buttons. Forcing a bigger box than the button art lets the
        // next frame of its sprite show at the bottom edge (the stray light line).
        const native = $$(".gods_area_buttons .circle_button_small").find(n => !button.contains(n) && n.offsetWidth > 8);
        if (native) {
            const size = Math.min(native.offsetWidth, native.offsetHeight);
            button.style.setProperty("--gsw-size", `${size}px`);
        }
        button.style.left = `${DEFAULT_BTN_POS.left}px`;
        button.style.top = `${DEFAULT_BTN_POS.top}px`;
    }

    function watchArea(button) {
        const area = button.parentElement;
        if (!area || area.dataset.gswObserved) return;
        area.dataset.gswObserved = "1";
        areaObserver?.disconnect();
        // Another script may inject buttons here; re-slot ours when that happens.
        areaObserver = new MutationObserver(() => requestAnimationFrame(() => placeButton(button)));
        areaObserver.observe(area, { childList: true });
    }

    function watchCurrentGod() {
        const godEl = $(".gods_container.god");
        if (!godEl || godEl.dataset.gswObserved) return;
        godEl.dataset.gswObserved = "1";
        godObserver?.disconnect();
        godObserver = new MutationObserver(refreshActive);
        godObserver.observe(godEl, { attributes: true, attributeFilter: ["class"] });
    }

    function attachSwitcher() {
        const area = $(".gods_area_buttons");
        if (!area) return;

        const existing = $("#gsw-btn");
        if (existing && existing.parentElement === area) {
            btnEl = existing;
            return;
        }
        existing?.remove();

        const button = buildButton();
        area.insertBefore(button, $(".btn_logout", area) || null);
        btnEl = button;
        requestAnimationFrame(() => placeButton(button));
        setTimeout(() => placeButton(button), 400);
        watchArea(button);
        watchCurrentGod();
    }

    /* ------------------------------------------------------------------ *
     * Wiring: one observer, work coalesced per animation frame
     * ------------------------------------------------------------------ */
    let rafPending = false;
    let counterTimer = null;

    function check() {
        rafPending = false;

        const area = $(".gods_area_buttons");
        if (area && (!btnEl || !area.contains(btnEl))) attachSwitcher();
        if (area) watchCurrentGod(); // re-attach if the game replaced the god element

        // Counter: wait until Grepolis stops adding cities (350 ms quiet), then build.
        const wrappers = $$("#gods_overview_wrapper");
        // Remove duplicate counter panels (e.g. from an older standalone God Counter script).
        wrappers.forEach(w => $$(".god-city-counter", w).slice(1).forEach(extra => extra.remove()));
        const pending = wrappers.filter(w => !counterDone.has(w));
        if (pending.length) {
            clearTimeout(counterTimer);
            counterTimer = setTimeout(() => pending.forEach(initCounter), 350);
        }
    }

    function scheduleCheck() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(check);
    }

    function init() {
        addStyles();
        document.addEventListener("click", onPortraitClick);
        document.addEventListener("mouseup", () => { if (isMenuOpen()) savePos(); }, true);

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                closeMenu();
            } else if (
                e.key && e.key.toLowerCase() === "g" &&
                !isTyping(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey && btnEl
            ) {
                e.preventDefault();
                isMenuOpen() ? closeMenu() : openMenu();
            }
        });

        window.addEventListener("resize", () => {
            if (btnEl) placeButton(btnEl);
        });

        new MutationObserver(mutations => {
            for (const m of mutations) {
                if (m.addedNodes.length) { scheduleCheck(); return; }
            }
        }).observe(document.body, { childList: true, subtree: true });

        check();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
