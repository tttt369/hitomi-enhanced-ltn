// ==UserScript==
// @name         learn (async version)
// @namespace    Violentmonkey Scripts
// @match        https://ltn.gold-usergeneratedcontent.net/*
// @grant        none
// @require      https://raw.github.com/emn178/js-sha256/master/build/sha256.min.js
// @version      1.2
// @author       -
// ==/UserScript==
// @require      https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js

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
            strong {color: cyan;}
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
            .PageContainer {height: 100px; background-color: white;}
            .SuggestionContainer {margin: 0; position: absolute; z-index: 1; background-color: #212529; color: darkgray; border: 1px solid grey; border-radius: 0.375rem;}
            .Suggestion { display: flex; white-space: nowrap; padding: 3%; border-bottom: 1px solid; font-weight: 700;}
            .SuggestionText {flex: 1; text-overflow: ellipsis; overflow: hidden; text-overflow: ellipsis; }
            #scrollSentinel {height: 1px}

        </style>
    </head>
    <body>
        <div class="Container">
            <div class="NavbarContainer">
                <img src="//ltn.gold-usergeneratedcontent.net/logo.png"></img>
                <div class="InputContainer">
                    <div class="SearchContainer">
                        <input type="text">
                        <button class="btn_gren_out SearchButton" type="button">Search</button>
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
            <div id="scrollSentinel"></div>
        </div>
    </body>
    </html>
    `;


    function get_ids(total_bytes, view) {
        const ids_list = []
        for (let i = 0; i < total_bytes; i += 4) {
            const id = view.getUint32(i, false);
            ids_list.push(id)
        };
        return ids_list
    }

    async function filter_contents(ids_list, fetch_idjs = FETCH_IDJS) {
        function fetch_page_num(id) {
            const res = {};
            return new Promise((resolve) => {
                if (!fetch_idjs) {
                    res[id] = null;
                    resolve(res);
                    return;
                }
                const script = document.createElement('script');
                script.src = `//${domain}/galleries/${id}.js`;
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

        const ids_obj = {}
        const promises = []

        ids_list.forEach(id => {
            promises.push(fetch_page_num(id, fetch_idjs));
        })

        const promises_list = await Promise.allSettled(promises);

        promises_list.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                const keys = Object.keys(r.value)[0]
                const values = Object.values(r.value)[0]
                ids_obj[keys] = values
            }
        });

        console.log('ids_obj IDs sample:', ids_obj);
        if (!fetch_idjs) return ids_obj

        for (const [key, value] of Object.entries(ids_obj)) {
            if (value < MIN_PAGE) {
                delete ids_obj[key]
            }
        }
        console.log('ids_obj IDs sample:', ids_obj);
        return ids_obj
    };

    function xhr_get(url, options = {}) {
        const {
            responseType = 'arraybuffer',
            start = 0,
            step = GALLERIES_PER_PAGE * 4,
            fetch_count = 0,
            fetch_all = false
        } = options;

        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = responseType;

            if (responseType === "arraybuffer" && !fetch_all) {
                const actualStart = start + step * fetch_count;
                xhr.setRequestHeader("Range", `bytes=${actualStart}-${actualStart + step - 1}`);
            }

            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 206) {
                    resolve(xhr.response);
                }
            };
            xhr.send();
        });
    }

    async function fetch_gallery(ids_list) {
        const gallery_list = [];
        const end = Math.min(ids_list.length, GALLERIES_PER_PAGE);

        const promises = [];
        for (let i = 0; i < end; ++i) {
            const galleryId = ids_list[i];
            const url = `//${domain}/galleryblock/${galleryId}.html`;
            promises.push(xhr_get(url, { responseType: "text" }));
        }

        const results = await Promise.allSettled(promises);
        results.forEach(r => {
            if (r.status === 'fulfilled') gallery_list.push(r.value);
        });

        ++fetch_count
        return gallery_list;
    }

    function generate_card(gallery, ids_obj, div_CardC) {
        return new Promise((resolve) => {
            function create_table(type, listOrItem, container, defaultText = 'N/A') {
                const isList = Array.isArray(listOrItem) || listOrItem instanceof NodeList;
                const list = isList ? Array.from(listOrItem) : [listOrItem];
                const text = list.length ? list[0].textContent : defaultText;

                container.insertAdjacentHTML(
                    "beforeend",
                    `<tr><td>${type}</td><td>:</td><td>${text}</td></tr>`
                );
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
            a_page.textContent = ids_obj[id] ? `${ids_obj[id]}p` : "N/A"
            generate_tags(tags, div_tagC)
            resolve()
        }
        )
    };

    async function select_leaf(text, fetch_count) {
        DataView.prototype.getUint64 = function(byteOffset, littleEndian) {
            // split 64-bit number into two 32-bit (4-byte) parts
            const left = this.getUint32(byteOffset, littleEndian);
            const right = this.getUint32(byteOffset + 4, littleEndian);

            // combine the two 32-bit values
            const combined = littleEndian ? left + 2 ** 32 * right : 2 ** 32 * left + right;

            if (!Number.isSafeInteger(combined))
                console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');

            return combined;
        }

        function make_url(field = "galleries", ext = '.index') {
            let url = '';
            if (field === 'galleries') {
                url = `//${domain}/galleriesindex/galleries.${galleries_index_version}${ext}`
            } //else if (field === 'languages') {
            //     url = '//' + domain + '/' + languages_index_dir + '/languages.' + languages_index_version + '.index';
            // } else if (field === 'nozomiurl') {
            //     url = '//' + domain + '/' + nozomiurl_index_dir + '/nozomiurl.' + nozomiurl_index_version + '.index';
            // }
            return url
        }

        function decode_node(byte_array) {
            let pos = 0;
            let node = {
                keys: [],
                datas: [],
                subnode_addresses: [],
            };

            const view = new DataView(byte_array.buffer);
            const number_of_keys = view.getInt32(pos, false /* big-endian */);
            pos += 4;

            let keys = [];
            for (let i = 0; i < number_of_keys; i++) {
                const key_size = view.getInt32(pos, false /* big-endian */);
                if (!key_size || key_size > 32) {
                    console.error("fatal: !key_size || key_size > 32");
                    return;
                }
                pos += 4;
                keys.push(byte_array.slice(pos, pos + key_size));
                pos += key_size;
            }

            const number_of_datas = view.getInt32(pos, false /* big-endian */);
            pos += 4;

            let datas = [];
            for (let i = 0; i < number_of_datas; i++) {
                const offset = view.getUint64(pos, false /* big-endian */);
                pos += 8;

                const length = view.getInt32(pos, false /* big-endian */);
                pos += 4;

                datas.push([offset, length]);
            }

            const B = 16;
            const number_of_subnode_addresses = B + 1;

            let subnode_addresses = [];
            for (let i = 0; i < number_of_subnode_addresses; i++) {
                let subnode_address = view.getUint64(pos, false /* big-endian */);
                pos += 8;

                subnode_addresses.push(subnode_address);
            }

            node.keys = keys;
            node.datas = datas;
            node.subnode_addresses = subnode_addresses;
            return node;
        }

        function compare_key(node, key) {
            let i;
            let cmp_result = -1;

            function compare_arraybuffers(dv1, dv2) {
                const top = Math.min(dv1.byteLength, dv2.byteLength);
                for (let i = 0; i < top; i++) {
                    if (dv1[i] < dv2[i]) {
                        return -1;
                    } else if (dv1[i] > dv2[i]) {
                        return 1;
                    }
                }
                return 0;
            };
            function is_leaf() {
                for (let i = 0; i < node.subnode_addresses.length; i++) {
                    if (node.subnode_addresses[i]) {
                        return 0;
                    }
                }
                return 1;
            };

            for (i = 0; i < node.keys.length; i++) {
                cmp_result = compare_arraybuffers(key, node.keys[i]);
                if (cmp_result <= 0) {
                    break;
                }
            }
            return [!cmp_result, i, is_leaf()];
        };

        async function b_tree(node, key, index_url) {
            let [there, where, isleaf] = compare_key(node, key)
            if (there) {
                return node.datas[where];
            } else if (isleaf) {
                return Error
            }
            if (node.subnode_addresses[where] == 0) {
                return Error
            }
            const byte_array = await xhr_get(index_url, { start: node.subnode_addresses[where], step: 464 })
            const eight_array = new Uint8Array(byte_array);
            node = decode_node(eight_array)
            return await b_tree(node, key, index_url)
        }

        async function nozomi_load(options = {}) {
            const {
                url = `//${domain}/index-all.nozomi`,
                fetch_count = 0,
                step = GALLERIES_PER_PAGE * 4,
                list = false,
                fetch_all = false
            } = options;
            const bytesArray = await xhr_get(url, { fetch_count: fetch_count, step: step, fetch_all: fetch_all });
            const view = new DataView(bytesArray);
            const totalBytes = view.byteLength;
            const ids_list = get_ids(totalBytes, view)
            if (list) return ids_list
            const ids_obj = await filter_contents(ids_list)
            return ids_obj
        }

        async function index_load(options = {}) {
            const {
                url = undefined,
                start = 0,
                fetch_count = 0,
                step = GALLERIES_PER_PAGE * 4,
                list = false,
                fetch_all = false
            } = options;
            const inbuf = await xhr_get(url, { fetch_count: fetch_count, start: start + 4, step: step, fetch_all: fetch_all })
            const eight_array = new Uint8Array(inbuf);
            const view = new DataView(eight_array.buffer);
            const totalBytes = view.byteLength;
            const ids_list = get_ids(totalBytes - 4, view)
            if (list) return ids_list
            const ids_obj = await filter_contents(ids_list)
            return ids_obj
        }

        let ids_obj
        if (!text) {
            ids_obj = await nozomi_load({ fetch_count: fetch_count })
            return ids_obj
        }

        let query_string = decodeURIComponent(text).replace(/^\?/, '');
        let terms = query_string.toLowerCase().trim().split(/\s+/);
        const terms_length = terms.length
        for (let term of terms) {
            term = term.replace(/_/g, ' ');

            let nozomi_address, data_address, start, length
            if (index_obj[term]) {
                if (terms_length !== 1) break
                const data = index_obj[term]
                nozomi_address = data["url"]
                data_address = data["data_url"]
                start = data["start"]
                length = data["length"]
            }

            if (/:/.test(term)) {
                if (!nozomi_address) {
                    index_obj[term] = {}
                    let [area, tag] = term.split(/:/);
                    nozomi_address = `//${domain}/${area}/${tag}-all.nozomi`;
                    if (terms_length !== 1) nozomi_address = `//${domain}/n/${area}/${tag}-all.nozomi`;
                    index_obj[term]["url"] = nozomi_address
                }
                if (terms_length === 1) {
                    ids_obj = await nozomi_load({ url: nozomi_address, fetch_count: fetch_count });
                    return ids_obj
                } else {
                    // index_obj[term]["data"] = await index_load({ url: nozomi_address, fetch_count: fetch_count, fetch_idjs: false });
                    index_obj[term]["data"] = await nozomi_load({ url: nozomi_address, fetch_count: fetch_count, list: true, fetch_all: true });
                }
            } else {
                if (!data_address) {
                    index_obj[term] = {}
                    const key = new Uint8Array(sha256.array(term).slice(0, 4))
                    const version_url = `//${domain}/galleriesindex/version?_=${(new Date).getTime()}.index`
                    const galleries_index_version = await xhr_get(version_url, { responseType: "text" })

                    const index_url = `//${domain}/galleriesindex/galleries.${galleries_index_version}.index`
                    const array_buf = await xhr_get(index_url, { step: 464 })
                    const eight_array = new Uint8Array(array_buf);
                    const node = decode_node(eight_array)
                    const array_bytes = await b_tree(node, key, index_url)

                    start = array_bytes[0]
                    length = array_bytes[1]
                    data_address = `//${domain}/galleriesindex/galleries.${galleries_index_version}.data`
                    index_obj[term]["data_url"] = data_address
                    index_obj[term]["start"] = start
                    index_obj[term]["length"] = length
                }

                if (terms_length === 1) {
                    ids_obj = await index_load({ url: data_address, start: start, fetch_count: fetch_count })
                    return ids_obj
                } else {
                    index_obj[term]["data"] = await index_load({ url: data_address, start: start, step: length, fetch_count: fetch_count, list: true })
                }
            }
        }

        let results = []
        const obj_keys = Object.keys(index_obj);
        let intersection = new Set(index_obj[obj_keys[0]]["data"]);

        for (let i = 1; i < obj_keys.length; i++) {
            const currentData = index_obj[obj_keys[i]]["data"];
            const temp_results = currentData.filter(x => intersection.has(x));
            Array.prototype.push.apply(results, temp_results);

            if (intersection.size === 0) break;
        }
        const start = fetch_count * GALLERIES_PER_PAGE
        results = results.slice(start, start + GALLERIES_PER_PAGE)
        ids_obj = await filter_contents(results)
        return ids_obj
    }

    async function get_search_suggestion(input, divSuggestionC, divSearchC, only_fetch = false) {
        function encode_search_query_for_url(s) {
            return s.replace(/[ \/\.]/g, function(m) {
                return {
                    ' ': '_',
                    '/': 'slash',
                    '.': 'dot',
                }[m];
            });
        }

        const query = input.replace(/_/g, ' ');
        let field = 'global', term = query
        if (query.indexOf(':') > -1) {
            const sides = query.split(/:/);
            field = sides[0];
            term = sides[1];
        }

        const chars = term.split('').map(encode_search_query_for_url);
        let url = `//tagindex.hitomi.la/${field}`;
        if (chars.length) {
            url += `/${chars.join('/')}`;
        }
        url += '.json';

        const suggestions = await xhr_get(url, { responseType: "json" })
        if (only_fetch) return suggestions

        const re = new RegExp(query, 'gi');
        suggestions.forEach(suggestion => {
            const aS = document.createElement("a")
            const spanStext = document.createElement("span")
            const spanScount = document.createElement("span")

            aS.className = "Suggestion"
            spanStext.className = "SuggestionText"
            spanScount.className = "SuggestionCount"

            const final_str = suggestion[0].replace(re, function(str) { return '<strong>' + str + '</strong>' });

            spanStext.innerHTML = `${final_str} (${suggestion[2]})`;
            spanScount.textContent = suggestion[1]

            aS.appendChild(spanStext)
            aS.appendChild(spanScount)
            divSuggestionC.appendChild(aS)
        })
        const rect = divSearchC.getBoundingClientRect();
        divSuggestionC.style.left = rect.left + 'px';
        divSuggestionC.style.top = rect.height + rect.top + 'px';
        divSuggestionC.style.width = rect.width + 'px';
    }

    async function load(fetch_count, text) {
        fetching = true
        const div_CardC = document.querySelector("div.CardContainer")

        if (fetch_count === 0) div_CardC.innerHTML = ""
        const ids_obj = await select_leaf(text, fetch_count)

        const ids_list = Object.keys(ids_obj)
        const gallery_list = await fetch_gallery(ids_list.reverse());

        const promises = []
        const fragment = document.createDocumentFragment();
        gallery_list.forEach(gallery => {
            promises.push(generate_card(gallery, ids_obj, fragment))
        });

        await Promise.allSettled(promises);
        div_CardC.appendChild(fragment);
        fetching = false
    }

    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }

    const FETCH_IDJS = false
    const INF_SCROLL = true
    const MIN_PAGE = 0
    const GALLERIES_PER_PAGE = 25;
    const DEBOUNCE_TIME = 300
    const domain = 'ltn.gold-usergeneratedcontent.net';
    let fetching = false
    let fetch_count = 0
    let index_obj = {}

    document.documentElement.innerHTML = html;

    const SearchInput = document.querySelector('div.SearchContainer input');
    await load(fetch_count, SearchInput.value)

    let divSuggestionC = document.querySelector("div.SuggestionContainer")
    const divSearchC = document.querySelector("div.SearchContainer")
    SearchInput.addEventListener('input', debounce(function() {
        if (!divSuggestionC) {
            const SearchC = document.querySelector('div.SearchContainer');
            divSuggestionC = document.createElement("div")
            divSuggestionC.className = "SuggestionContainer"
            SearchC.appendChild(divSuggestionC)
        }
        if (divSuggestionC.textContent) {
            divSuggestionC.textContent = ""
        }
        get_search_suggestion(SearchInput.value, divSuggestionC, divSearchC);
    }, DEBOUNCE_TIME));

    const SearchButton = document.querySelector("button.SearchButton")
    SearchButton.addEventListener('click', async function() {
        fetch_count = 0
        await load(fetch_count, SearchInput.value)
    });

    if (INF_SCROLL) {
        const observer = new IntersectionObserver(async (entries) => {
            const entry = entries[0];

            if (entry.isIntersecting && !fetching) {
                await load(fetch_count, SearchInput.value);
            }
        }, {
            root: null,
            rootMargin: "0px 0px 300px 0px",
            threshold: 0
        });

        observer.observe(document.querySelector("#scrollSentinel"));
    }

})();
