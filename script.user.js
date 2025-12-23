// ==UserScript==
// @name         hitomi-enhanced-ltn
// @namespace    Violentmonkey Scripts
// @match        https://ltn.gold-usergeneratedcontent.net/page.css
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
            input {color: white}
            .ActualInput {color: white; background-color: transparent; border: none; font-weight: 700; overflow: visable;}
            input:focus { background-color: transparent; border: none; outline: none;}
            svg {color: white;}
            tr th {width: 100%;}
            strong {color: cyan;}
            .BtnGreenOut {color: #198754; background-color: transparent; border: 1px solid #198754; border-radius: 0.375rem;}
            .BtnGreenOut:hover {color: white; background-color: #198754;}
            .BtnGreen {color: white; background-color: #198754; border: 1px solid #198754; border-radius: 0.375rem;}
            .BtnRed {color: white; background-color: #a13643; border: 1px solid #a13643; border-radius: 0.375rem;}
            .BadgeGrey {background-color: #6c757d; border-radius: 0.375rem; padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700;}
            .BadgeBlue {display: flex; align-items: center; background-color: #0d6efd; border-radius: 0.375rem; padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700; white-space: nowrap;}
            .BadgeGreen {display: flex; align-items: center; background-color: #28a745; border-radius: 0.375rem; padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700; white-space: nowrap;}
            .Container {display: flex; flex-direction: column; justify-content: center;}
            .NavbarContainer {display: flex; flex-direction: row; justify-content: space-between; width: 100%; height: 100px; background-color: #2b3035;}
            .NavbarContainer a {margin: auto auto auto 0;}
            .InputContainer {display: flex; flex-direction: column; justify-content: space-between;}
            .InputContainer button {margin-right: 5px;}
            .SearchContainer {display: flex; flex: 1; flex-direction: row; justify-content: space-between; margin-top: 7px; width: 100%;}
            .DefaultQueryContainer {display: flex; flex: 1; flex-direction: row; justify-content: space-between; margin: 7px 0 7px 0; width: 100%;}
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
            .SuggestionContainer {display: none; margin: 0; position: absolute; z-index: 1; background-color: #212529; color: white; border: 1px solid dimgrey; border-radius: 0.375rem;}
            .Suggestion { display: flex; white-space: nowrap; padding: 3%; border-bottom: 1px solid dimgrey;}
            .Suggestion:hover { background-color: #2c2f33; display: flex; white-space: nowrap; padding: 3%; border-bottom: 1px solid dimgrey;}
            .SuggestionFocus { background-color: #2c2f33; display: flex; white-space: nowrap; padding: 3%; border-bottom: 1px solid dimgrey;}
            .SuggestionText {flex: 1; overflow: hidden; text-overflow: ellipsis; }
            .SuggestionArea {color: darkgrey}
            #scrollSentinel {height: 1px}

            .SearchInput {width: 240px; overflow: auto; display: flex; background-color: #212529;border: 1px solid #495057;border-radius: 0.375rem; color: white;}
            .DefaultInput { display: flex; background-color: #212529;border: 1px solid #495057;border-radius: 0.375rem; color: white; flex: 1}
            .TagContainer {display: flex; align-items: center;}
            span svg {color: lightgrey; margin-right: 8px; cursor: pointer;}
            .BetweenInput {background-color: transparent; border: none; width: 1px;}

        </style>
    </head>
    <body>
        <div class="Container">
            <div class="NavbarContainer">
                <a href="https://ltn.gold-usergeneratedcontent.net/page.css">
                    <img src="//ltn.gold-usergeneratedcontent.net/logo.png"></img>
                </a>
                <div class="InputContainer">
                    <div class="SearchContainer">
                        <div class="SearchInput">
                            <input class="ActualInput" type="text">
                        </div>
                        <button class="BtnGreenOut" type="button">Search</button>
                        <div class="SuggestionContainer"></div>
                    </div>
                    <div class="DefaultQueryContainer">
                        <div class="DefaultInput">
                            <input class="ActualInput" type="text">
                        </div>
                        <button class="BtnGreenOut" type="button">Save</button>
                    </div>
                </div>
            </div>
            <div class="PickerContainer">
                <svg class="eye" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eyedropper" viewBox="0 0 16 16">
                <path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708zM2 12.707l7-7L10.293 7l-7 7H2z"/>
                </svg>
                <div class="BtnContainer">
                    <button class="BtnGreen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
                        </svg>
                    </button>
                    <button class="BtnRed">
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


    function get_ids(totalBytes, view) {
        const idsList = []
        for (let i = 0; i < totalBytes; i += 4) {
            const id = view.getUint32(i, false);
            idsList.push(id)
        };
        return idsList
    }

    async function filter_contents(idsList, fetchIdjs = CONFIG.fetchIdjs) {
        function fetch_page_num(id, fetchIdjs) {
            const res = {};
            return new Promise((resolve) => {
                if (!fetchIdjs) {
                    res[id] = null;
                    resolve(res);
                    return;
                }
                const script = document.createElement('script');
                script.src = `//${STATE.domain}/galleries/${id}.js`;
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

        const idsObj = {}
        const promises = []

        idsList.forEach(id => {
            promises.push(fetch_page_num(id, fetchIdjs));
        })

        const promisesList = await Promise.allSettled(promises);

        promisesList.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                const keys = Object.keys(r.value)[0]
                const values = Object.values(r.value)[0]
                idsObj[keys] = values
            }
        });

        console.log('idsObj IDs sample:', idsObj);
        if (!fetchIdjs) return idsObj

        for (const [key, value] of Object.entries(idsObj)) {
            if (value < CONFIG.minPage) {
                delete idsObj[key]
            }
        }
        console.log('idsObj IDs sample:', idsObj);
        return idsObj
    };

    function xhr_get(url, options = {}) {
        const {
            responseType = 'arraybuffer',
            start = 0,
            step = CONFIG.galleriesPerPage * 4,
            fetchAll = false,
            returnStatus = false
        } = options;

        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = responseType;

            if (responseType === "arraybuffer" && !fetchAll) {
                const actualStart = start + step * STATE.fetchCount;
                xhr.setRequestHeader("Range", `bytes=${actualStart}-${actualStart + step - 1}`);
            }

            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 206) {
                    if (returnStatus) resolve([xhr.response, xhr.status])
                    resolve(xhr.response);
                }
            };
            xhr.send();
        });
    }

    async function fetch_gallery(idsList) {
        const galleriesList = [];
        const end = Math.min(idsList.length, CONFIG.galleriesPerPage);

        const promises = [];
        for (let i = 0; i < end; ++i) {
            const galleryId = idsList[i];
            const url = `//${STATE.domain}/galleryblock/${galleryId}.html`;
            promises.push(xhr_get(url, { responseType: "text" }));
        }

        const results = await Promise.allSettled(promises);
        results.forEach(r => {
            if (r.status === 'fulfilled') galleriesList.push(r.value);
        });

        ++STATE.fetchCount
        return galleriesList;
    }

    function generate_card(gallery, idsObj, divCardC) {
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
                    const aTag = document.createElement('a');
                    aTag.className = 'BadgeBlue';
                    container.appendChild(aTag);
                } else {
                    Array.from(tags).forEach(tag => {
                        const clone = tag.cloneNode(true);
                        if (clone.textContent === '...') return;

                        clone.className = 'BadgeBlue';
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

            const divCard = document.createElement("div")
            divCard.className = "Card"

            const divTableC = document.createElement("div")
            divTableC.className = "CardTableContainer"

            const aCardTitle = document.createElement("a")
            aCardTitle.className = "CardTitle"

            const table = document.createElement("table")

            const aPage = document.createElement("a")
            aPage.className = "page BadgeGrey"

            const divTagC = document.createElement("div")
            divTagC.className = "CardTagsContainer"

            const aPic = document.createElement("a")
            aPic.href = url.replace("ltn.gold-usergeneratedcontent.net", "hitomi.la")
            aPic.target = "_blank"

            aPic.appendChild(pic)
            divCard.appendChild(aPic)
            divCardC.appendChild(divCard)
            divCard.appendChild(divTableC)
            divTableC.appendChild(aCardTitle)
            divTableC.appendChild(table)
            divCard.appendChild(aPage)
            divCard.appendChild(divTagC)

            aCardTitle.textContent = title
            create_table("language", language, table)
            create_table("type", type, table)
            create_table("artist", artistList, table)
            create_table('series', seriesList, table)
            aPage.textContent = idsObj[id] ? `${idsObj[id]}p` : "N/A"
            generate_tags(tags, divTagC)
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

        function decode_node(eightArray) {
            let pos = 0;
            let NODE = {
                keys: [],
                datas: [],
                subNodeAddresses: [],
            };

            const view = new DataView(eightArray.buffer);
            const numberOfKeys = view.getInt32(pos, false);
            pos += 4;

            let keys = [];
            for (let i = 0; i < numberOfKeys; i++) {
                const keySize = view.getInt32(pos, false);
                if (!keySize || keySize > 32) {
                    console.error("fatal: !keySize || keySize > 32");
                    return;
                }
                pos += 4;
                keys.push(eightArray.slice(pos, pos + keySize));
                pos += keySize;
            }

            const numberOfDates = view.getInt32(pos, false);
            pos += 4;

            let datas = [];
            for (let i = 0; i < numberOfDates; i++) {
                const offset = view.getUint64(pos, false);
                pos += 8;

                const length = view.getInt32(pos, false);
                pos += 4;

                datas.push([offset, length]);
            }

            const B = 16;
            const numberOfSubnodeAddresses = B + 1;

            let subNodeAddresses = [];
            for (let i = 0; i < numberOfSubnodeAddresses; i++) {
                let subnodeAddress = view.getUint64(pos, false);
                pos += 8;

                subNodeAddresses.push(subnodeAddress);
            }

            NODE.keys = keys;
            NODE.datas = datas;
            NODE.subNodeAddresses = subNodeAddresses;
            return NODE;
        }

        function compare_key(NODE, key) {
            let i;
            let cmpResult = -1;

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
                for (let i = 0; i < NODE.subNodeAddresses.length; i++) {
                    if (NODE.subNodeAddresses[i]) {
                        return 0;
                    }
                }
                return 1;
            };

            for (i = 0; i < NODE.keys.length; i++) {
                cmpResult = compare_arraybuffers(key, NODE.keys[i]);
                if (cmpResult <= 0) {
                    break;
                }
            }
            return [!cmpResult, i, is_leaf()];
        };

        async function b_tree(NODE, key, indexUrl) {
            let [there, where, isLeaf] = compare_key(NODE, key)
            if (there) {
                return NODE.datas[where];
            } else if (isLeaf) {
                return Error
            }
            if (NODE.subNodeAddresses[where] == 0) {
                return Error
            }
            const bytesArray = await xhr_get(indexUrl, { start: NODE.subNodeAddresses[where], step: 464 })
            const eightArray = new Uint8Array(bytesArray);
            NODE = decode_node(eightArray)
            return await b_tree(NODE, key, indexUrl)
        }

        async function nozomi_load(options = {}) {
            const {
                url = `//${STATE.domain}/index-all.nozomi`,
                step = CONFIG.galleriesPerPage * 4,
                fetchAll = true
            } = options;
            const bytesArray = await xhr_get(url, { step: step, fetchAll: fetchAll });
            const view = new DataView(bytesArray);
            const totalBytes = view.byteLength;
            const idsList = get_ids(totalBytes, view)
            return idsList
        }

        async function index_load(options = {}) {
            const {
                url = undefined,
                start = 0,
                step = CONFIG.galleriesPerPage * 4,
            } = options;
            const inbuf = await xhr_get(url, { start: start + 4, step: step })
            const eightArray = new Uint8Array(inbuf);
            const view = new DataView(eightArray.buffer);
            const totalBytes = view.byteLength;
            const idsList = get_ids(totalBytes - 4, view)
            return idsList
        }

        let idsList
        if (!text) {
            idsList = await nozomi_load({ fetchAll: false })
            return idsList
        }

        let queryString = decodeURIComponent(text).replace(/^\?/, '');
        let terms = queryString.toLowerCase().trim().split(/\s+/);
        terms = terms.map(i => decode_query(i));
        const termsLength = terms.length

        for (let term of terms) {
            // term = term.replace(/_/g, ' ');

            let nozimiAddress, dataAddress, start, length
            if (STATE.indexObj[term]) {
                continue
            }

            if (term.includes(':')) {
                STATE.indexObj[term] = {}

                let area, tag = 'index', language = 'all'
                let temp = term.split(/:/);
                if (temp[0] === 'language') area = temp[0], language = temp[1]
                else area = temp[0], tag = temp[1]

                if (area === 'language') {
                    nozimiAddress = `//${STATE.domain}/${tag}-${language}.nozomi`;
                    if (termsLength !== 1) nozimiAddress = `//${STATE.domain}/n/${tag}-${language}.nozomi`;
                    STATE.indexObj[term]["url"] = nozimiAddress
                    STATE.indexObj[term]["data"] = await nozomi_load({ url: nozimiAddress });
                } else {
                    nozimiAddress = `//${STATE.domain}/${area}/${tag}-${language}.nozomi`;
                    if (termsLength !== 1) nozimiAddress = `//${STATE.domain}/n/${area}/${tag}-${language}.nozomi`;
                    STATE.indexObj[term]["url"] = nozimiAddress
                    STATE.indexObj[term]["data"] = await nozomi_load({ url: nozimiAddress });
                }
            } else {
                STATE.indexObj[term] = {}
                const key = new Uint8Array(sha256.array(term).slice(0, 4))
                const versionUrl = `//${STATE.domain}/galleriesindex/version?_=${(new Date).getTime()}.index`
                const galleriesIndexVersion = await xhr_get(versionUrl, { responseType: "text" })

                const indexUrl = `//${STATE.domain}/galleriesindex/galleries.${galleriesIndexVersion}.index`
                const arrayBuf = await xhr_get(indexUrl, { step: 464 })
                const eightArray = new Uint8Array(arrayBuf);
                const NODE = decode_node(eightArray)
                const bytesList = await b_tree(NODE, key, indexUrl)

                start = bytesList[0]
                length = bytesList[1]
                dataAddress = `//${STATE.domain}/galleriesindex/galleries.${galleriesIndexVersion}.data`
                STATE.indexObj[term]["data_url"] = dataAddress
                STATE.indexObj[term]["start"] = start
                STATE.indexObj[term]["length"] = length
                STATE.indexObj[term]["data"] = await index_load({ url: dataAddress, start: start, step: length })
            }
        }

        const start = STATE.fetchCount * CONFIG.galleriesPerPage

        if (termsLength === 1) {
            return STATE.indexObj[terms[0]]["data"].slice(start, start + CONFIG.galleriesPerPage)
        }

        const tempRes = [];
        for (let i = 0; i < terms.length; i++) {
          const arr = STATE.indexObj[terms[i]].data;
          if (!Array.isArray(arr)) continue;
          for (let j = 0; j < arr.length; j++) tempRes.push(arr[j]);
        }

        const seen = {};
        const results = new Set();

        for (const v of tempRes) {
            if (seen[v]) {
                seen[v] += 1
                if (seen[v] >= terms.length) results.add(v);
            } else {
                seen[v] = 1;
            }
        }

        idsList = Array.from(results).slice(start, start + CONFIG.galleriesPerPage)
        return idsList
    }

    async function get_search_suggestion(text, divSuggestionC, divSearchC, divSearchInput, actualInput) {
        function tag_to_badge(field, term, divSearchInput, actualInput) {
            const input = `<input class="BetweenInput" type="text" maxlength="0">`
            const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
                </svg>
            `;

            const divTagC = document.createElement("div")
            divTagC.className = "TagContainer"
            divTagC.innerHTML = input

            const span = document.createElement("span");
            span.className = "BadgeGreen";
            span.innerHTML = `${svg} ${field}:${term}`;

            divTagC.appendChild(span)

            divSearchInput.insertBefore(divTagC, actualInput);
        }

        async function return_json(query, checkValid = false) {

            let field = 'global', term = query, istag = false
            if (query.includes(':')) {
                const sides = query.split(/:/);
                field = sides[0];
                term = sides[1];
                istag = true
            }
            const chars = term.split('')
            let url = `//tagindex.hitomi.la/${field}`;
            if (chars.length) {
                url += `/${chars.join('/')}`;
            }
            url += '.json';

            const suggestions = await xhr_get(url, { responseType: "json" })
            if (checkValid) {
                let isvalid = false;
                if (!istag) return [suggestions[0], isvalid];
                
                for (let i = 0; i < suggestions.length; i++) {
                    const suggest = suggestions[i];
                    if (suggest[0] === decode_query(term) && suggest[2] === field) {
                        isvalid = true;
                        break;
                    }
                }
                return [suggestions[0], isvalid];
            }
            return suggestions
        }

        const inputList = text.split(/\s+/)

        if (inputList.length >= 2) {
            const editedList = inputList.slice(0, inputList.length - 1)
            for (let value of editedList) {
                let [suggestions, boolSuccess] = await return_json(value, true)
                if (!boolSuccess) return
                tag_to_badge(suggestions[2], suggestions[0], divSearchInput, actualInput)
                actualInput.value = (actualInput.value).replace(`${value} `, "")
            }
        }

        const lastInput = inputList.slice(-1)[0];
        const suggestions = await return_json(lastInput)

        const re = new RegExp((decode_query(lastInput)), 'gi');

        let suggestionIndex = -1;
        suggestions.forEach(suggestion => {
            const aS = document.createElement("a")
            const spanStext = document.createElement("span")
            const spanSarea = document.createElement("span")

            aS.className = "Suggestion"
            spanStext.className = "SuggestionText"
            spanSarea.className = "SuggestionArea"

            const finalStr = suggestion[0].replace(re, function(str) { return '<strong>' + str + '</strong>' });

            spanStext.innerHTML = finalStr;
            spanSarea.textContent = suggestion[2]

            aS.appendChild(spanStext)
            aS.appendChild(spanSarea)
            divSuggestionC.appendChild(aS)

            aS.addEventListener('click', function() {
                const field = suggestion[2];
                const term = suggestion[0];

                divSuggestionC.style.display = 'none';
                divSuggestionC.textContent = "";

                tag_to_badge(field, term, divSearchInput, actualInput)
                actualInput.value = ''

                actualInput.focus();
                divSearchInput.scrollLeft = divSearchInput.scrollWidth;
                divSearchInput.removeEventListener('keydown', arrow_process)
                suggestionIndex = -1
            });
        })
        const rect = divSearchC.getBoundingClientRect();
        divSuggestionC.style.left = rect.left + 'px';
        divSuggestionC.style.top = rect.height + rect.top + 'px';
        divSuggestionC.style.width = rect.width + 'px';

        function arrow_process(e) {
            function apply_focus_class() {
                suggestionsArray.forEach(a => a.classList.remove('SuggestionFocus'));
                suggestionsArray[suggestionIndex].classList.add('SuggestionFocus');
            };

            const suggestionsArray = Array.from(divSuggestionC.querySelectorAll('a'));
            const max = suggestionsArray.length - 1;
            if (suggestionsArray.length === 0) return;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (suggestionIndex <= 0) suggestionIndex = max;
                else suggestionIndex--;
                apply_focus_class();
            }

            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (suggestionIndex >= max) suggestionIndex = 0;
                else suggestionIndex++;
                apply_focus_class();
            }

            else if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestionIndex >= 0 && suggestionIndex < suggestionsArray.length) {
                    suggestionsArray[suggestionIndex].click();
                    suggestionIndex = -1
                }
            }
        };
        divSearchInput.removeEventListener('keydown', arrow_process)
        divSearchInput.addEventListener('keydown', arrow_process)
    }

    async function load(text) {
        STATE.fetching = true
        const divCardC = document.querySelector("div.CardContainer")

        if (STATE.fetchCount === 0) divCardC.innerHTML = ""
        const idsList = await select_leaf(text, STATE.fetchCount) // STATE.indexObj

        const galleriesList = await fetch_gallery(idsList); // STATE.fetchCount

        const idsObj = await filter_contents(idsList)

        const promises = []
        const fragment = document.createDocumentFragment();
        galleriesList.forEach(gallery => {
            promises.push(generate_card(gallery, idsObj, fragment))
        });

        await Promise.allSettled(promises);
        divCardC.appendChild(fragment);
        STATE.fetching = false
    }

    function suggestion_listener(divSearchInput, actualInput, divSearchC, divSuggestionC) {
        divSearchInput.addEventListener('click', function(event) {
            if (event.target.closest('.bi-x-circle-fill')) {
                event.target.closest('.TagContainer').remove();
            }
        });

        document.addEventListener('click', function(event) {
            const isClickInsideSearch = divSearchC.contains(event.target);
            const isClickInsideSuggestions = divSuggestionC.contains(event.target);

            if (!isClickInsideSearch && !isClickInsideSuggestions) {
                divSuggestionC.textContent = "";
                divSuggestionC.style.display = 'none';
            }
        });


        divSearchInput.addEventListener('keydown', function(e) {
            const currentInput = e.target;

            if (currentInput.tagName !== 'INPUT') return;

            const inputsArray = Array.from(divSearchInput.querySelectorAll('input'));
            const currentIndex = inputsArray.indexOf(currentInput);

            const isSelectionEmpty = currentInput.selectionStart === currentInput.selectionEnd;

            if (e.key === 'Backspace' && isSelectionEmpty && currentInput.selectionStart === 0) {
                let tagToRemove = null;

                if (currentInput.classList.contains('ActualInput')) {
                    const tags = divSearchInput.querySelectorAll('.TagContainer');
                    if (tags.length > 0) {
                        tagToRemove = tags[tags.length - 1];
                    }
                } else {
                    const currentContainer = currentInput.closest('.TagContainer');
                    if (currentContainer && currentContainer.previousElementSibling) {
                        tagToRemove = currentContainer.previousElementSibling;
                    }
                }

                if (tagToRemove && tagToRemove.classList.contains('TagContainer')) {
                    e.preventDefault();

                    const badge = tagToRemove.querySelector('span');
                    let extractedText = badge.outerText;

                    tagToRemove.remove();

                    const originalValue = actualInput.value;

                    actualInput.value = extractedText + originalValue;

                    actualInput.focus();
                    actualInput.setSelectionRange(extractedText.length, extractedText.length);
                }
            }

            else if (e.key === 'ArrowLeft' && isSelectionEmpty && currentInput.selectionStart === 0) {
                e.preventDefault();
                let nextIndex = currentIndex - 1;
                if (nextIndex < 0) nextIndex = inputsArray.length - 1;

                const targetInput = inputsArray[nextIndex];
                targetInput.focus();
                const len = targetInput.value.length;
                targetInput.setSelectionRange(len, len);
            }

            else if (e.key === 'ArrowRight' && isSelectionEmpty && currentInput.selectionStart === currentInput.value.length) {
                e.preventDefault();
                let nextIndex = currentIndex + 1;
                if (nextIndex >= inputsArray.length) nextIndex = 0;

                const targetInput = inputsArray[nextIndex];
                targetInput.focus();
                const len = targetInput.value.length;
                targetInput.setSelectionRange(len, len);
            }
        });
    }

    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }

    function decode_query(query) {
        const replaceChars = {
            '\n': ' ',
            '_': ' ',
            'slash': '/',
            'dot': '.'
        };

        for (const [key, value] of Object.entries(replaceChars)) {
            query = query.split(key).join(value);
        }
        return query;
    }

    function encode_query(query) {
        const replaceChars = {
            ' ': '_',
            '/': 'slash',
            '.': 'dot'
        };

        for (const [key, value] of Object.entries(replaceChars)) {
            query = query.split(key).join(value);
        }
        return query;
    }

    function search_listener(searchButton, divSearchInput, divSuggestionC) {
        searchButton.addEventListener('click', async function() {
            STATE.fetchCount = 0
            const text = encode_query(divSearchInput.outerText)
            await load(text.replace(/\n/g, " ")) // STATE.fetching
        });
        divSearchInput.addEventListener('keydown', async function(e) {
            if (e.key === 'Enter' && getComputedStyle(divSuggestionC).display == 'none') {
                STATE.fetchCount = 0
                const text = encode_query(divSearchInput.outerText)
                await load(text.replace(/\n/g, " ")) // STATE.fetching
            }
        })
    }

    const CONFIG = {
        fetchIdjs: false,
        infScroll: true,
        minPage: 0,
        galleriesPerPage: 25,
        debounceTime: 300
    };

    const STATE = {
        domain: 'ltn.gold-usergeneratedcontent.net',
        fetching: false,
        fetchCount: 0,
        indexObj: {}
    };

    document.documentElement.innerHTML = html;

    const inputSearchInput = document.querySelector('div.SearchInput input');
    const divSearchInput = document.querySelector('div.SearchInput');
    const divSearchC = document.querySelector("div.SearchContainer")
    const divSuggestionC = document.querySelector("div.SuggestionContainer")
    const actualInput = document.querySelector('.ActualInput')
    const searchButton = document.querySelector(".SearchContainer button")

    await load('') // STATE.fetching

    actualInput.addEventListener('input', debounce(async function() {
        divSuggestionC.textContent = "";
        const text = actualInput.value
        await get_search_suggestion(text, divSuggestionC, divSearchC, divSearchInput, actualInput);
        if (divSuggestionC.children.length > 0) {
            divSuggestionC.style.display = 'block';
        } else {
            divSuggestionC.style.display = 'none';
        }
    }, CONFIG.debounceTime));

    suggestion_listener(divSearchInput, actualInput, divSearchC, divSuggestionC)
    search_listener(searchButton, divSearchInput, divSuggestionC) // STATE.fetchCount

    if (CONFIG.infScroll) {
        const observer = new IntersectionObserver(async (entries) => {
            const entry = entries[0];

            if (entry.isIntersecting && !STATE.fetching) {
                const text = encode_query(divSearchInput.outerText)
                await load(text.replace(/\n/g, " ")) // STATE.fetching
            }
        }, {
            root: null,
            rootMargin: "0px 0px 300px 0px",
            threshold: 0
        });

        observer.observe(document.querySelector("#scrollSentinel"));
    }

})();
