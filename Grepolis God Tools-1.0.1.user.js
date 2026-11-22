// ==UserScript==
// @name         Grepolis God Tools
// @version      1.0.8
// @description  God Counter and God Switcher (requires the active Administrator advisor)
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
     * Administrator (curator) gate
     *
     * Every feature of this script is only available while the premium
     * Administrator advisor is active. The check fails closed: if the game
     * API cannot be read, the features do not run. It is re-evaluated at
     * each entry point (counter init, button attach, opening the dialog,
     * every refresh tick, and before a god change is sent).
     * ------------------------------------------------------------------ */
    function curatorActive() {
        try {
            const premium = window.GameDataPremium;
            if (premium && typeof premium.isAdvisorActivated === "function") {
                return !!premium.isAdvisorActivated("curator");
            }
            const features = window.PremiumFeatures;
            if (features && typeof features.hasCurator === "function") {
                return !!features.hasCurator();
            }
        } catch (e) { /* fail closed */ }
        return false;
    }

    /* ------------------------------------------------------------------ *
     * Styles (single <style> element for both features)
     * ------------------------------------------------------------------ */
    function addStyles() {
        if ($("#god-tools-styles")) return;
        const style = el("style");
        style.id = "god-tools-styles";
        style.textContent = `
/* ---------- God Counter ---------- */
.god-city-counter {
    clear: both;
    margin: 8px 18px 12px;
    padding: 0 0 9px;
    color: #4b2f12;
    font: 11px Arial, Helvetica, sans-serif;
    border-bottom: 1px solid rgba(90, 59, 18, .38);
}
.god-city-counter .counter-title {
    margin: 0 0 9px;
    padding: 0 2px 5px;
    color: #5a3b12;
    font: bold 16px/20px Georgia, "Times New Roman", serif;
    text-shadow: 0 1px rgba(255, 244, 198, .8);
    border-bottom: 1px solid rgba(90, 59, 18, .35);
}
.god-city-counter .counter-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(122px, 1fr));
    gap: 5px 12px;
    padding: 0 2px;
}
.god-city-counter .counter-item {
    display: flex;
    align-items: center;
    min-width: 0;
    height: 32px;
    padding: 2px 5px 2px 2px;
    box-sizing: border-box;
    color: #3b240e;
    cursor: pointer;
    user-select: none;
    border: 1px solid transparent;
}
.god-city-counter .counter-item:hover {
    border-color: rgba(102, 68, 29, .45);
    background: rgba(255, 240, 184, .3);
}
.god-city-counter .counter-item.active {
    border-color: #657f35;
    background: rgba(181, 205, 116, .48);
    box-shadow: inset 0 0 3px rgba(63, 91, 31, .3);
}
.god-city-counter .counter-item.inactive {
    opacity: .48;
}
.god-city-counter .counter-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    min-width: 32px;
    height: 30px;
    margin-right: 5px;
    overflow: hidden;
}
.god-city-counter .counter-icon .god_micro {
    margin: 0;
}
.god-city-counter .counter-no-god {
    color: #a31c1c;
    font: 24px/28px Georgia, serif;
    text-shadow: 1px 1px rgba(255, 240, 190, .7);
}
.god-city-counter .counter-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: #3c250f;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.god-city-counter .counter-value {
    display: inline-block;
    min-width: 25px;
    margin-left: 5px;
    padding: 1px 4px;
    box-sizing: border-box;
    color: #fff2c6;
    font: bold 11px/16px Arial, sans-serif;
    text-align: center;
    text-shadow: 1px 1px #2a1606;
    border: 1px solid #60401e;
    background: linear-gradient(#805b31, #533416);
    box-shadow: inset 0 1px rgba(255, 255, 255, .22);
}
.god-city-counter .counter-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px 16px;
    min-height: 28px;
    margin-top: 9px;
    padding: 7px 2px 0;
    color: #3d260f;
    border-top: 1px solid rgba(90, 59, 18, .28);
}
.god-city-counter .counter-stat {
    font-weight: bold;
    white-space: nowrap;
}
.god-city-counter .counter-stat-label {
    font-weight: normal;
}
.god-city-counter .gc-show-all {
    display: inline-block;
    height: 20px;
    min-width: 78px;
    padding: 0 8px;
    box-sizing: border-box;
    border: 1px solid #8a672c;
    border-radius: 2px;
    background: #0F213A;
    color: wheat;
    font: bold 10px/18px Arial, sans-serif;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .6);
}
.god-city-counter .gc-show-all:hover {
    background: linear-gradient(#fff9dc, #e6c985);
    color: #0F213A;
}
.god-city-counter .gc-show-all.disabled {
    opacity: .55;
    cursor: default;
    pointer-events: none;
}

/* ---------- God Switcher: toolbar button ---------- */
#gsw-btn.btn_wrapper {
    position: absolute !important;
    z-index: 20;
    width: var(--gsw-size, 26px);
    height: var(--gsw-size, 26px);
    margin: 0 !important;
    user-select: none;
}
#gsw-btn .gsw_toggle {
    position: relative;
    width: var(--gsw-size, 26px);
    height: var(--gsw-size, 26px);
    cursor: pointer;
    background-repeat: no-repeat !important;
}
#gsw-btn .gsw-bolt {
    position: absolute;
    inset: 0;
    width: var(--gsw-size, 26px);
    height: var(--gsw-size, 26px);
    background: none !important;
}
#gsw-btn .gsw-bolt::before {
    content: "\\03DF";
    position: absolute;
    left: 0;
    top: -1px;
    width: var(--gsw-size, 26px);
    height: var(--gsw-size, 26px);
    color: #f3d17b;
    font: bold calc(var(--gsw-size, 26px) * .85) / var(--gsw-size, 26px) Georgia, serif;
    text-align: center;
    text-shadow: 0 1px 1px #2b1807, 1px 0 #6c4515, -1px 0 #6c4515;
}
#gsw-btn:hover .gsw-bolt::before,
#gsw-btn.active .gsw-bolt::before {
    color: #fff0a4;
}
#gsw-btn.active .gsw_toggle {
    filter: brightness(1.18);
}

/* ---------- God Switcher: dialog ---------- */
.gsw-title {
    margin: 0 0 6px;
    padding: 0 2px 4px;
    color: #5a3b12;
    font: bold 18px/22px Georgia, "Times New Roman", serif;
    text-shadow: 0 1px rgba(255, 244, 198, .8);
    border-bottom: 1px solid rgba(90, 59, 18, .35);
}
#gswRoot.gsw-compact .gsw-title {
    display: none;
}
.gsw-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 6px;
    max-height: calc(100vh - 340px);
    min-height: 160px;
    overflow-y: auto;
    overflow-x: hidden;
}
.gsw-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 1px 8px 1px 4px;
    border: 1px solid transparent;
    cursor: pointer;
    user-select: none;
}
.gsw-row:hover {
    border-color: rgba(102, 68, 29, .45);
    background: rgba(255, 240, 184, .3);
}
.gsw-row.active {
    border-color: #657f35;
    background: rgba(181, 205, 116, .48);
    box-shadow: inset 0 0 3px rgba(63, 91, 31, .3);
}
.gsw-list .gsw-row.nearcap:not(.active) {
    box-shadow: inset 3px 0 0 #e0a92b;
}
.gsw-name {
    flex: 1;
    min-width: 0;
    text-align: left;
    font: bold 13px Georgia, "Times New Roman", serif;
    color: #3c250f;
    text-shadow: 0 1px rgba(255, 244, 198, .8);
}
/* ---------- God Switcher: compact grid ---------- */
#gswRoot.gsw-compact .gsw-list {
    position: absolute;
    left: -9999px;
    top: 0;
    width: 280px;
    visibility: hidden;
    pointer-events: none;
}
#gswCompactGrid {
    display: none;
}
#gswRoot.gsw-compact #gswCompactGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px 0;
    margin-top: 6px;
}
.gsw-cell {
    display: block;
    padding: 2px 0;
    border: 1px solid transparent;
    cursor: pointer;
    user-select: none;
    text-align: center;
    min-width: 0;
}
.gsw-cell:hover {
    background: rgba(255, 240, 184, .3);
    border-color: rgba(102, 68, 29, .45);
}
.gsw-cell.active {
    background: rgba(181, 205, 116, .48);
    border-color: #657f35;
}
.gsw-cell .gsw-portrait {
    margin: 0 auto;
}
.gsw-cell.nearcap .gsw-portrait {
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, .65), 0 0 7px 2px rgba(240, 190, 60, .95);
}
.gsw-cfavor {
    font: bold 12px/16px Arial, Helvetica, sans-serif;
    text-align: center;
}
.gsw-cfavor.plain {
    position: static;
    transform: none;
    margin-top: 2px;
    color: #3c250f;
    text-shadow: none;
}

/* ---------- God Switcher: round portrait fallback ---------- */
.gsw-portrait {
    position: relative;
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 50%;
    overflow: hidden;
    box-sizing: border-box;
    border: 2px solid #8a672c;
    background: #1c1a16;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, .65), 0 1px 2px rgba(0, 0, 0, .45);
    transition: box-shadow .12s;
}
.gsw-row:hover .gsw-portrait {
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, .5), 0 0 8px rgba(217, 169, 58, .8);
}
.gsw-portrait-img {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
}
.gsw-portrait.loading {
    animation: gswPulse .7s ease-in-out infinite alternate;
}
@keyframes gswPulse {
    from { box-shadow: inset 0 2px 5px rgba(0, 0, 0, .65), 0 0 3px rgba(217, 169, 58, .3); }
    to   { box-shadow: inset 0 2px 5px rgba(0, 0, 0, .65), 0 0 13px rgba(217, 169, 58, .95); }
}
.gsw-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font: bold 18px Georgia, serif;
    color: #f3e6a6;
    text-shadow: 0 1px 2px #000;
}

/* ---------- God Switcher: favor readout (native markup, taken out of the game's absolute layout) ---------- */
.gsw-favor-wrap {
    position: relative;
    flex: none;
    font-family: Arial, Helvetica, sans-serif;
    font-style: normal;
    font-weight: normal;
    letter-spacing: normal;
    text-align: left;
    text-shadow: none;
}
.gsw-favor-wrap .btn_gods_spells {
    position: absolute !important;
    left: 21px !important;
    top: calc(50% - 2px) !important;
    right: auto !important;
    bottom: auto !important;
    margin: 0 !important;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 2;
}
.gsw-favor-wrap.plain .btn_gods_spells {
    display: none;
}
.gsw-favor-wrap .gods_favor_amount {
    position: relative !important;
    left: auto !important;
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
    margin: 0 !important;
    float: none !important;
}
.gsw-favor-wrap.plain .gods_favor_amount {
    all: unset;
    display: block;
}
.gsw-favor-wrap.plain .favor_amount {
    all: unset;
    display: inline-block;
    min-width: 64px;
    padding: 1px 8px;
    box-sizing: border-box;
    text-align: center;
    font: bold 12px/16px Arial, Helvetica, sans-serif;
    color: #aee0ff;
    text-shadow: 1px 1px #2a1606;
    border: 1px solid #60401e;
    background: linear-gradient(#805b31, #533416);
    box-shadow: inset 0 1px rgba(255, 255, 255, .22);
}
`;
        document.head.appendChild(style);
    }

    /* ------------------------------------------------------------------ *
     * God Counter
     *
     * Only works on the rows of the Gods overview window that the player
     * has opened themselves (#gods_overview_wrapper). It never opens that
     * window and never reads town data from the game models.
     * ------------------------------------------------------------------ */
    const counterDone = new WeakSet();

    function initCounter(wrapper) {
        if (counterDone.has(wrapper)) return;
        if (!curatorActive()) return;

        // Another copy of the counter (e.g. the old standalone script) already added a panel.
        if ($(".god-city-counter", wrapper)) { counterDone.add(wrapper); return; }

        const townList = $("#gods_overview_towns", wrapper);
        if (!townList) return;

        // Read each town's god once from the rows the overview already rendered.
        const towns = $$(".town_item[data-god_id]", townList).map(node => ({
            node,
            god: (node.dataset.god_id || "").trim().toLowerCase() || "none"
        }));
        if (!towns.length) return;

        counterDone.add(wrapper);

        const counts = Object.fromEntries(COUNTER_ORDER.map(id => [id, 0]));
        towns.forEach(t => { counts[t.god] = (counts[t.god] || 0) + 1; });

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
                ? el("span", "counter-no-god", "\u00d7")
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

        const toggle = godId => {
            // If the advisor ran out while the overview was open, only reset the filter.
            if (!curatorActive()) { apply("all"); return; }
            apply(active === godId ? "all" : godId);
        };

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
            if (!curatorActive()) return; // leave the native behaviour alone
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

    // Sends the god change for the current city. Only ever called from the
    // confirmation dialog below, never directly from a row click.
    function changeGod(godId) {
        if (!curatorActive()) return false;
        const { gpAjax, Game } = window;
        if (!gpAjax || !Game || Game.townId == null) return false;
        gpAjax.ajaxPost("building_temple", "change_god", { god_id: godId, town_id: Game.townId });
        return true;
    }

    // Portraits: the temple's big round god portraits (235x236 frames in the game's own sprite). Each god's sprite
    // position is read at runtime from the game's stylesheet through a hidden probe, so nothing is embedded here.
    function resolveGodPortrait(godId) {
        if (portraitCache.has(godId)) return portraitCache.get(godId);

        const holder = el("div", "temple_gods_large");
        holder.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;";
        const probe = el("div", godId);
        probe.id = "temple_god_static";
        holder.appendChild(probe);
        document.body.appendChild(holder);
        const cs = getComputedStyle(probe);
        const data = {
            width: probe.offsetWidth || 235,
            height: probe.offsetHeight || 236,
            image: cs.backgroundImage,
            position: cs.backgroundPosition,
            size: cs.backgroundSize,
            repeat: cs.backgroundRepeat
        };
        holder.remove();

        if (data.image && data.image !== "none") portraitCache.set(godId, data);
        return data;
    }

    // The round artwork inside each 235x236 frame: diameter and centre, so it can be centred in our gold ring.
    const ART_D = 230, ART_CX = 117, ART_CY = 115.5, ART_ZOOM = 1.03;
    const ROW_PORTRAIT = 48;  // px, list layout
    const CELL_PORTRAIT = 64; // px, compact grid (4 columns must fit the window)

    function makePortrait(godId, size) {
        const portrait = el("div", "gsw-portrait");
        portrait.dataset.god = godId;
        portrait.style.width = portrait.style.minWidth = portrait.style.height = `${size}px`;

        const data = resolveGodPortrait(godId);
        if (data && data.image && data.image !== "none") {
            const inner = size - 4; // inside the 2px ring
            const k = (inner * ART_ZOOM) / ART_D;
            const img = el("div", "gsw-portrait-img");
            Object.assign(img.style, {
                width: `${data.width}px`,
                height: `${data.height}px`,
                backgroundImage: data.image,
                backgroundPosition: data.position,
                backgroundSize: data.size,
                backgroundRepeat: data.repeat,
                left: `${inner / 2 - ART_CX * k}px`,
                top: `${inner / 2 - ART_CY * k}px`,
                transform: `scale(${k})`
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

        const wrap = el("div", "gsw-favor-wrap");
        const box = el("div", "gods_favor_amount ui-game-selectable");
        const amount = el("div", "favor_amount", "\u2013");
        amount.dataset.god = godId;
        box.appendChild(amount);
        const bolt = el("div", "btn_gods_spells circle_button spells");
        bolt.appendChild(el("div", "icon js-caption"));
        wrap.append(box, bolt);

        row.append(makePortrait(godId, ROW_PORTRAIT), el("span", "gsw-name", GOD_NAMES[godId]), wrap);
        return row;
    }

    // Compact grid cell: round portrait with the favor number underneath.
    function makeCell(godId) {
        const cell = el("div", "gsw-cell gsw-row");
        cell.dataset.god = godId;
        cell.title = `Switch to ${GOD_NAMES[godId]}`;
        const text = el("div", "gsw-cfavor plain", "\u2013");
        text.dataset.god = godId;
        cell.append(makePortrait(godId, CELL_PORTRAIT), text);
        return cell;
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
            const text = v == null ? "\u2013" : String(v);
            if (node.textContent !== text) node.textContent = text;
            const coloured = (node.classList.contains("favor_amount") && !node.closest(".plain")) ||
                (node.classList.contains("gsw-cfavor") && !node.classList.contains("plain"));
            if (coloured) {
                node.style.color = cap != null && v != null && v >= cap ? FAVOR_COLOR_MAX : FAVOR_COLOR;
            }
        });
    }

    // Favor production per hour: read from the game's god icon tooltips (e.g. "Zeus (... per hour: 35.5)")
    // only while the player has the Gods overview open, and remembered between sessions.
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
        if (!curatorActive()) { closeMenu(); return; }

        const current = getCurrentGod();
        $$(".gsw-row", root).forEach(r => r.classList.toggle("active", r.dataset.god === current));
        const cap = getFavorCap();
        updateRates();
        $$(".gsw-row", root).forEach(r => {
            const id = r.dataset.god;
            const favor = getFavor(id);
            r.classList.toggle("nearcap", cap != null && favor != null && favor >= cap * NEAR_CAP);
            r.title = godTooltip(id, favor, cap);
        });
        const label = $("#gswCurrent", root);
        if (label) label.textContent = `Active god: ${current ? GOD_NAMES[current] || current : "\u2013"}`;
        updateFavor();
    }

    function fillWindow() {
        const grid = $("#gswGrid");
        if (!grid) return;
        grid.textContent = "";
        SWITCHER_ORDER.forEach(id => grid.appendChild(makeRow(id)));

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
    function findFrame(rootSel = "#gswRoot") {
        const root = $(rootSel);
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
    function applyPos(saved, frame = findFrame()) {
        if (!frame || !saved) return false;
        const r = frame.getBoundingClientRect();
        const cs = getComputedStyle(frame);
        const l = parseFloat(cs.left) || 0, t = parseFloat(cs.top) || 0;
        frame.style.left = `${l + saved.left - r.left}px`;
        frame.style.top = `${t + saved.top - r.top}px`;
        return true;
    }

    // Moves the confirm dialog so its Confirm button sits under the mouse pointer (clamped to the viewport).
    function placeConfirmAtPointer(pointer) {
        const frame = findFrame("#gswConfirmRoot");
        const yes = $("#gswConfirmYes");
        if (!frame || !pointer) return;
        const r = frame.getBoundingClientRect();
        const y = yes && yes.getBoundingClientRect();
        const anchorX = y && y.width ? y.left + y.width / 2 - r.left : r.width / 2;
        const anchorY = y && y.height ? y.top + y.height / 2 - r.top : r.height / 2;
        const left = Math.min(Math.max(0, pointer.x - anchorX), Math.max(0, window.innerWidth - r.width));
        const top = Math.min(Math.max(0, pointer.y - anchorY), Math.max(0, window.innerHeight - r.height));
        if (Math.abs(left - r.left) < 2 && Math.abs(top - r.top) < 2) return;
        applyPos({ left, top }, frame);
    }

    function setConfirmVisible(visible) {
        const frame = findFrame("#gswConfirmRoot");
        if (frame) frame.style.visibility = visible ? "" : "hidden";
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

    const WINDOW_W = 310, WINDOW_W_COMPACT = 372, WINDOW_H_FULL = 594, WINDOW_H_COMPACT = 330;
    const COMPACT_BOTTOM_GAP = 26; // px left between the Expand button and the window edge once the height is fitted
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
        if (!curatorActive()) return;
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
                <div class="gsw-title">God Switcher</div>
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

    /* ------------------------------------------------------------------ *
     * Changing the god: a click on a row only opens a confirmation dialog
     * (a native Grepolis dialog window). Nothing is sent to the server
     * until the player presses "Confirm" in that dialog.
     * ------------------------------------------------------------------ */
    function confirmSwitch(godId, portrait, pointer) {
        const mgr = window.GPWindowMgr;
        if (!mgr || !curatorActive()) return;

        const dlg = mgr.Create(mgr.TYPE_DIALOG, "Confirm god change");
        if (!dlg || typeof dlg.setContent2 !== "function") return;

        dlg.setContent2(`
            <div id="gswConfirmRoot" style="padding:14px 16px;font-family:Georgia,serif;color:#3a2a12;text-align:center;">
                <p id="gswConfirmText" style="margin:0 0 14px;font-size:13px;"></p>
                <div id="gswConfirmButtons" style="display:flex;justify-content:center;gap:10px;"></div>
            </div>
        `);
        if (typeof dlg.setSize === "function") dlg.setSize(320, 150);
        if (typeof dlg.setPosition === "function") dlg.setPosition(["center", "center"]);
        setConfirmVisible(false); // stays hidden until it is under the pointer, so it never flashes at the centre
        setTimeout(() => setConfirmVisible(true), 600); // safety net

        setTimeout(() => {
            const text = $("#gswConfirmText");
            const buttons = $("#gswConfirmButtons");
            if (!text || !buttons) return;
            text.textContent = `Change the god of the current city to ${GOD_NAMES[godId]}?`;

            const yes = createGPButton("Confirm", "gswConfirmYes");
            const no = createGPButton("Cancel", "gswConfirmNo");
            buttons.append(yes, no);
            placeConfirmAtPointer(pointer);
            setConfirmVisible(true);

            const close = () => { try { dlg.close(); } catch (e) { /* ignore */ } };
            no.addEventListener("click", close);
            yes.addEventListener("click", () => {
                close();
                performSwitch(godId, portrait);
            });
        }, 50);
    }

    function performSwitch(godId, portrait) {
        if (portrait) portrait.classList.add("loading");
        if (changeGod(godId)) {
            let tries = 0;
            const poll = setInterval(() => {
                refreshActive();
                if (getCurrentGod() === godId || ++tries > 24) {
                    clearInterval(poll);
                    if (portrait) portrait.classList.remove("loading");
                    setTimeout(refreshActive, 800);
                }
            }, 250);
        } else if (portrait) {
            portrait.classList.remove("loading");
        }
    }

    function onPortraitClick(e) {
        const row = e.target.closest && e.target.closest("#gswRoot .gsw-row");
        if (!row) return;
        if (!curatorActive()) return;
        const godId = row.dataset.god;
        if (getCurrentGod() === godId) return;
        const portrait = $(".gsw-portrait", row) || row;
        confirmSwitch(godId, portrait, { x: e.clientX, y: e.clientY });
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
        if (!area) return;
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

    // Removes the button and closes the dialog (used when the Administrator advisor is not active).
    function removeSwitcher() {
        if (isMenuOpen()) closeMenu();
        areaObserver?.disconnect();
        $("#gsw-btn")?.remove();
        btnEl = null;
    }

    /* ------------------------------------------------------------------ *
     * Wiring: one observer, work coalesced per animation frame
     * ------------------------------------------------------------------ */
    let rafPending = false;
    let counterTimer = null;

    function check() {
        rafPending = false;

        if (!curatorActive()) {
            // Gate is closed: nothing of this script may run.
            if (btnEl || $("#gsw-btn")) removeSwitcher();
            return;
        }

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
                !isTyping(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey && btnEl && curatorActive()
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

        // Re-evaluate the Administrator gate now and then, so an expired advisor switches the features off.
        setInterval(scheduleCheck, 10000);

        check();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
