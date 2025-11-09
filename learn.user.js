// ==UserScript==
// @name         learn (async version)
// @namespace    Violentmonkey Scripts
// @match        https://ltn.gold-usergeneratedcontent.net/*
// @grant        none
// @version      1.2
// @author       -
// ==/UserScript==

(async function() {
    'use strict';


    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>hitomi</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <style>
            body {margin: 0; background-color: #212529;}
            input {background-color: #212529; border: 1px solid #495057; border-radius: 0.375rem;}
            svg {color: white;}
            tr th {width: 100%;}
            .btn_gren_out {color: #198754; background-color: transparent; border: 1px solid #198754; border-radius: 0.375rem;}
            .btn_gren_out:hover {color: white; background-color: #198754;}
            .btn_gren {color: white; background-color: #198754; border: 1px solid #198754; border-radius: 0.375rem;}
            .btn_red {color: white; background-color: #a13643; border: 1px solid #a13643; border-radius: 0.375rem;}
            .badge_grey {background-color: #6c757d; border-radius: 0.375rem; padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700;}
            .badge_blue {background-color: #0d6efd; border-radius: 0.375rem; padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700;}
            .Container {display: flex; flex-direction: column; justify-content: center;}
            .NavbarContainer {display: flex; flex-direction: row; justify-content: space-between; width: 100%; height: 100px; background-color: #2b3035;}
            .NavbarContainer img {margin: auto auto auto 0;}
            .InputContainer {display: flex; flex-direction: column; justify-content: space-between;}
            .InputContainer button {margin-right: 5px;}
            .SearchContainer {display: flex; flex: 1; flex-direction: row; justify-content: space-between; margin: 3% 3% 3% 0; width: 100%;}
            .DefaultQueryContainer {display: flex; flex: 1; flex-direction: row; justify-content: space-between; margin: 3% 3% 3% 0; width: 100%;}
            .PickerContainer {display: flex; justify-content: space-between; align-items: center; height: 35px; width: 100%; background-color: #343a40;}
            .BtnContainer {display: flex; height: 100%;}
            .BtnContainer button{width: 40px;}
            .eye {margin-left: 1%;}
            .CardContainer {display: flex; flex-wrap: wrap; justify-content: space-around; color: white; background-color: #1e1f20; margin: 5% 3% auto 3%; border-radium: 0.375rem}
            .CardTableContainer {display: flex; flex-direction: column; align-items: center; overflow-x: auto;}
            .CardTableContainer table {color: #fff9;}
            .CardTitle {font-weight: bold; text-decoration: none; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; word-break: break-all; margin: 2% auto 7% auto;}
            .CardTagsContainer {scrollbar-width: none; display: flex; overflow-x: auto; white-space: nowrap; background-color: #00000038; margin: 3%; width: 100%;}
            .CardTagsContainer a {margin-right: 5%; text-decoration: none; color: white;}
            .page {margin-left: 5%; width: fit-content;}
            .Card {display: flex; flex-direction: column; flex: 1 1 194px; max-width: 220px; height: 475px; margin: 1%; background-color: #212529; overflow: hidden; justify-content: space-between; border-radius:0.375rem; border:1px solid #343a40}
            .Card img {height: 220px; object-fit: cover; width: 100%;}
        </style>
    </head>
    <body>
        <div class="Container">
            <div class="NavbarContainer">
                <img src="//ltn.gold-usergeneratedcontent.net/logo.png"></img>
                <div class="InputContainer">
                    <div class="SearchContainer">
                        <input type="text">
                        <button class="btn_gren_out" type="button">Search</button>
                    </div>
                    <div class="DefaultQueryContainer">
                        <input type="text">
                        <button class="btn_gren_out" type="button">Save</button>
                    </div>
                </div>
            </div>
            <div class="PickerContainer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eyedropper" viewBox="0 0 16 16">
                <path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708zM2 12.707l7-7L10.293 7l-7 7H2z"/>
                </svg>
                <div class="BtnContainer">
                    <button class="btn_gren">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
                        </svg>
                    </button>
                    <button class="btn_red">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="CardContainer"></div>
        </div>
    </body>
    </html>
    `;

    const FETCH_PAGENUM = false
    const SCROLL_THRESHOLD = 0.7
    const galleries_per_page = 25;
    const domain = 'ltn.gold-usergeneratedcontent.net';
    const nozomi = {};
    let fetching = false
    let fetch_cout = 0

    async function fetch_nozomi() {
        const start_bytes = 100 * fetch_cout
        const end_bytes = start_bytes + 99
        const arrayBuffer = await xhr_get('index-all.nozomi', 'arraybuffer', { 'Range': `bytes=${start_bytes}-${end_bytes}` });
        const view = new DataView(arrayBuffer);
        const totalBytes = view.byteLength;

        await filter_contents(totalBytes, view)

        console.log('nozomi IDs sample:', Object.entries(nozomi).slice(0, 10));
    }

    function xhr_get(url, responseType = 'text', headers = {}) {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = responseType;
            for (const [key, value] of Object.entries(headers)) {
                xhr.setRequestHeader(key, value);
            }
            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 206) {
                    resolve(xhr.response);
                }
            };
            xhr.send();
        });
    }

    async function filter_contents(xbytes, view) {
        const promises = []

        function fetch_page_num(id) {
            const res = {};
            return new Promise((resolve) => {
                if (!FETCH_PAGENUM) {
                    res[id] = null;
                    resolve(res);
                    return;
                }

                const script = document.createElement('script');
                script.src = `https://ltn.gold-usergeneratedcontent.net/galleries/${id}.js`;
                script.onload = () => {
                    if (typeof galleryinfo !== 'undefined' && galleryinfo.files) {
                        const pageCount = galleryinfo.files.length;
                        res[id] = pageCount;
                    }
                    resolve(res);
                    document.head.removeChild(script);
                };
                document.head.appendChild(script);
            });
        }

        for (let i = 0; i < xbytes; i += 4) {
            const id = view.getUint32(i, false);
            promises.push(fetch_page_num(id));
        };
        const results_list = await Promise.allSettled(promises);
        results_list.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                const keys = Object.keys(r.value)
                const values = Object.values(r.value)
                if (!FETCH_PAGENUM) nozomi[keys] = null
                if (values > 20) {
                    nozomi[keys] = values;
                }
            }
        });
    };

    async function fetch_gallery() {
        const gallery_list = [];
        const nozomi_keys_list = Object.keys(nozomi)
        const sliced_list = fetch_cout === 0 ? nozomi_keys_list : nozomi_keys_list.slice(0, galleries_per_page)
        const end = Math.min(sliced_list.length, galleries_per_page);

        const promises = [];
        for (let i = 0; i < end; ++i) {
            const galleryId = sliced_list[i];
            const url = `//${domain}/galleryblock/${galleryId}.html`;
            promises.push(xhr_get(url));
        }

        const results = await Promise.allSettled(promises);
        results.forEach(r => {
            if (r.status === 'fulfilled') gallery_list.push(r.value);
        });

        ++fetch_cout
        return gallery_list;
    }

    function generate_card(gallery) {
        return new Promise((resolve) => {
            function create_table(type, listOrItem, container, defaultText = 'N/A') {
                const isList = Array.isArray(listOrItem) || listOrItem instanceof NodeList;
                const list = isList ? Array.from(listOrItem) : [listOrItem];
                const text = list.length ? list[0].textContent : defaultText;

                const tr = document.createElement('tr');
                container.appendChild(tr)

                const td_type = document.createElement("td")
                const td_Colon = document.createElement("td")
                const td_value = document.createElement("td")

                tr.appendChild(td_type)
                tr.appendChild(td_Colon)
                tr.appendChild(td_value)

                td_type.textContent = type
                td_Colon.textContent = ":"
                td_value.textContent = text
            };

            function generate_tags(tags, container) {
                if (tags.length === 0) {
                    const a_tag = document.createElement('a');
                    a_tag.className = 'badge_blue';
                    container.appendChild(a_tag);
                } else {
                    Array.from(tags).forEach(tag => {
                        const clone = tag.cloneNode(true);
                        if (clone.textContent === '...') return;

                        clone.className = 'badge_blue';
                        container.appendChild(clone);
                    }
                    );
                };
            };

            const htmlString = gallery;
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');

            const h1Element = doc.querySelector('h1.lillie a');
            const url = h1Element?.href || '#'
            const title = h1Element?.textContent || 'Unknown'
            const pic = doc.querySelector('div[class$="-img1"] picture')
            const tags = doc.querySelectorAll('td.relatedtags ul li a')
            const seriesList = doc.querySelectorAll('td.series-list ul li a')
            const language = doc.querySelector('table.dj-desc tbody tr:nth-child(3) td a') || { textContent: 'Unknown', href: '#' }
            const type = doc.querySelector('table.dj-desc tbody tr:nth-child(2) td a') || { textContent: 'Unknown', href: '#' }
            const artistList = doc.querySelectorAll('div.artist-list ul li a') || { textContent: 'Unknown', href: '#' }
            const reNum = url.match(/.*-(\d+)\.html/);
            const id = reNum?.[1];

            const div_CardC = document.querySelector("div.CardContainer")
            const div_Card = document.createElement("div")
            div_Card.className = "Card"

            const div_tableC = document.createElement("div")
            div_tableC.className = "CardTableContainer"

            const a_CardTitle = document.createElement("a")
            a_CardTitle.className = "CardTitle"

            const table = document.createElement("table")

            const a_page = document.createElement("a")
            a_page.className = "page badge_grey"

            const div_tagC = document.createElement("div")
            div_tagC.className = "CardTagsContainer"

            div_Card.appendChild(pic)
            div_CardC.appendChild(div_Card)
            div_Card.appendChild(div_tableC)
            div_tableC.appendChild(a_CardTitle)
            div_tableC.appendChild(table)
            div_Card.appendChild(a_page)
            div_Card.appendChild(div_tagC)

            a_CardTitle.textContent = title
            create_table("language", language, table)
            create_table("type", type, table)
            create_table("artist", artistList, table)
            create_table('series', seriesList, table)
            a_page.textContent = nozomi[id] ? `${nozomi[id]}p` : "N/A"
            generate_tags(tags, div_tagC)
            resolve()
        }
        )
    };

    async function inf_scroll() {
        const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        if (scrollPercentage >= SCROLL_THRESHOLD && !fetching) {
            await load()
        }
    }

    document.documentElement.innerHTML = html;
    await new Promise((resolve,) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        script.async = true;
        script.onload = resolve;
        document.head.appendChild(script);
    });

    async function load() {
        fetching = true
        await fetch_nozomi();
        const gallery_list = await fetch_gallery();

        let promises = []
        gallery_list.forEach(gallery => {
            promises.push(generate_card(gallery))
        });
        await Promise.allSettled(promises);
        fetching = false
    }

    await load()

    window.addEventListener('scroll', inf_scroll);
})();
