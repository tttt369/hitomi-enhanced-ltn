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
        </div>
    </body>
    </html>
    `;

    // async function fetch_index(url, address = 0, step = GALLERIES_PER_PAGE * 4, fetch_count = 0, isres = false) {
    //     fetching = true
    //     address = step * fetch_count
    //
    //     let nodedata = await xhr_get(url, 'arraybuffer', { 'Range': `bytes=${address}-${address + step - 1}` });
    //     if (!isnozomi) {
    //         nodedata = new Uint8Array(nodedata);
    //         if (!isres) return byte_array
    //     }
    //     if (isnozomi) view = new DataView(nodedata);
    //     if (!isnozomi) view = new DataView(nodedata.buffer);
    //     const totalBytes = view.byteLength;
    //
    //     const ids_obj = await filter_contents(totalBytes, view, !isnozomi)
    //     console.log('ids_obj IDs sample:', Object.entries(ids_obj));
    // }

    // async function fetch_nozomi(area = "index") {
    //     const start_bytes = (GALLERIES_PER_PAGE * 4) * fetch_count
    //     const end_bytes = start_bytes + 99
    //     const arrayBuffer = await xhr_get('index-all.nozomi', 'arraybuffer', { 'Range': `bytes=${start_bytes}-${end_bytes}` });
    //     const view = new DataView(arrayBuffer);
    //     const totalBytes = view.byteLength;
    //
    //     const ids_obj = await filter_contents(totalBytes, view)
    //     console.log('ids_obj IDs sample:', Object.entries(ids_obj));
    //     return ids_obj
    // }

    async function filter_contents(xbytes, view, search) {
        const ids_obj = {}
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

        for (let i = 0; i < xbytes; i += 4) {
            if (search && (i + fetch_count) === 0) continue
            const id = view.getUint32(i, false);
            promises.push(fetch_page_num(id));
        };
        const results_list = await Promise.allSettled(promises);
        results_list.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                const keys = Object.keys(r.value)
                const values = Object.values(r.value)
                if (!FETCH_PAGENUM) ids_obj[keys] = null
                if (values > MIN_PAGE) {
                    ids_obj[keys] = values;
                }
            }
        });
        console.log('ids_obj IDs sample:', Object.entries(ids_obj));
        return ids_obj
    };

    function xhr_get(url, responseType = 'arraybuffer', start = 0, step = GALLERIES_PER_PAGE * 4) {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = responseType;
            if (responseType === "arraybuffer") {
                start = step * fetch_count
                xhr.setRequestHeader("Range", `bytes=${start}-${start + step - 1}`);
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
            promises.push(xhr_get(url, "text"));
        }

        const results = await Promise.allSettled(promises);
        results.forEach(r => {
            if (r.status === 'fulfilled') gallery_list.push(r.value);
        });

        ++fetch_count
        return gallery_list.reverse();
    }

    function generate_card(gallery, ids_obj, div_CardC) {
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

    async function select_leaf(text) {
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

        function compare_key(node) {
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

        async function b_tree(node) {
            let [there, where, isleaf] = compare_key(node)
            if (there) {
                return node.datas[where];
            } else if (isleaf) {
                return Error
            }
            if (node.subnode_addresses[where] == 0) {
                return Error
            }
            const byte_array = await xhr_get(index_url, node.subnode_addresses[where])
            node = decode_node(byte_array)
            return await b_tree(node)
        }

        const leaf_obj = {}
        let area;
        let tag;
        if (/:/.test(text)) {
            const area_elements = text.split(/:/);
            const area = area_elements[0];
            const tag = area_elements[1];
            fetch_count = 0
            fetch_nozomi()
            return
        }
        const key = new Uint8Array(sha256.array(text).slice(0, 4))
        const version_url = `//${domain}/galleriesindex/version?_=${(new Date).getTime()}`
        const galleries_index_version = await xhr_get(version_url, "text")

        const index_url = make_url()
        const array_buf = await xhr_get(index_url, undefined, 0, 464)
        const byte_array = new Uint8Array(array_buf);
        const node = decode_node(byte_array)
        const leaf_value = await b_tree(node)
        const data_url = make_url(undefined, ".data")
        leaf_obj = {
            "text": text,
            "url": data_url,
            "start": leaf_value[0],
            "length": leaf_value[1],
            "field": "galleries",
            "giv": galleries_index_version
        }

        return leaf_obj;

        // let [offset, length] = leaf_value;
        // let pos = 0;
        // const end = fetch_count === 0 ? (GALLERIES_PER_PAGE * 4) + 4 : (GALLERIES_PER_PAGE * 4)
        // const start = offset + (end + 4) * fetch_count
        // const inbuf = await fetch_index(undefined, start, end, ".data")
        // // const inbuf = await fetch_index(undefined, offset, length, ".data")
        //
        // const view = new DataView(inbuf.buffer);
        // const totalBytes = view.byteLength;
        // // let number_of_galleryids = view.getInt32(pos, false /* big-endian */);
        // pos += 4;
        //
        // const ids_obj = await filter_contents(totalBytes, view, true)
        // console.log('ids_obj IDs sample:', Object.entries(ids_obj));
        // return ids_obj
    }

    async function get_search_suggestion(input, divSuggestionC) {
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
        const re = new RegExp(query, 'gi');
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

        const suggestions = await xhr_get(url, "json")
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
        const searchContainer = document.querySelector('.SearchContainer');
        const rect = searchContainer.getBoundingClientRect();
        divSuggestionC.style.left = rect.left + 'px';
        divSuggestionC.style.top = rect.height + rect.top + 'px';
        divSuggestionC.style.width = rect.width + 'px';
    }

    async function load(ids_obj, reset_container = false) {
        const div_CardC = document.querySelector("div.CardContainer")
        if (reset_container) div_CardC.innerHTML = "";

        const ids_list = Object.keys(ids_obj)
        const gallery_list = await fetch_gallery(ids_list);

        let promises = []
        gallery_list.forEach(gallery => {
            promises.push(generate_card(gallery, ids_obj, div_CardC))
        });

        await Promise.allSettled(promises);

    }

    const FETCH_PAGENUM = false
    const INF_SCROLL = true
    const SCROLL_THRESHOLD = 0.7
    const MIN_PAGE = 0
    const GALLERIES_PER_PAGE = 25;
    const domain = 'ltn.gold-usergeneratedcontent.net';
    let fetching = false
    let fetch_count = 0
    let leaf_obj = {}

    document.documentElement.innerHTML = html;

    fetching = true
    const bytesArray = await xhr_get(`//${domain}/index-all.nozomi`);
    const view = new DataView(bytesArray);
    const totalBytes = view.byteLength;
    const ids_obj = await filter_contents(totalBytes, view)
    await load(ids_obj)
    fetching = false

    const SearchInput = document.querySelector('div.SearchContainer input');
    let divSuggestionC = document.querySelector("div.SuggestionContainer")
    SearchInput.addEventListener('input', function() {
        if (!divSuggestionC) {
            const SearchC = document.querySelector('div.SearchContainer');
            divSuggestionC = document.createElement("div")
            divSuggestionC.className = "SuggestionContainer"
            SearchC.appendChild(divSuggestionC)
        }
        if (divSuggestionC.textContent) {
            divSuggestionC.textContent = ""
        }
        get_search_suggestion(SearchInput.value, divSuggestionC);
    });

    const SearchButton = document.querySelector("button.SearchButton")
    SearchButton.addEventListener('click', async function() {
        fetch_count = 0
        fetching = true
        leaf_obj = await select_leaf(SearchInput.value)

        const inbuf = await xhr_get(url)
        const view = new DataView(inbuf.buffer);
        const totalBytes = view.byteLength;

        const ids_obj = await filter_contents(totalBytes, view, true)
        await load(ids_obj, true)
        fetching = false
    });

    if (INF_SCROLL) {
        window.addEventListener('scroll', async function() {
            const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
            if (scrollPercentage >= SCROLL_THRESHOLD && !fetching) {
                if (leaf_obj["text"]) {
                    fetching = true
                    const inbuf = await xhr_get(leaf_obj["url"])
                    const view = new DataView(inbuf.buffer);
                    const totalBytes = view.byteLength;
                    const ids_obj = await filter_contents(totalBytes, view, true)
                    await load(ids_obj)
                    fetching = false
                } else {
                    fetching = true
                    const bytesArray = await xhr_get(`//${domain}/index-all.nozomi`);
                    const view = new DataView(bytesArray);
                    const totalBytes = view.byteLength;
                    const ids_obj = await filter_contents(totalBytes, view)
                    await load(ids_obj)
                    fetching = false
                }
            }
        });
    } else {
        const divPageC = document.createElement("div")
        divPageC.className = "PageContainer"
        document.body.appendChild(divPageC)
    }

})();
