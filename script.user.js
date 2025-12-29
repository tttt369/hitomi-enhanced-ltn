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
            table tr td a {color: #fff9; text-decoration: none;}
            strong {color: cyan;}
            .BtnGreenOut {color: #198754; background-color: transparent; border: 1px solid #198754; border-radius: 0.375rem;}
            .BtnGreenOut:hover {color: white; background-color: #198754;}
            .BtnGreen {color: white; background-color: #198754; border: 1px solid #198754; border-radius: 0.375rem;}
            .BtnRed {color: white; background-color: #a13643; border: 1px solid #a13643; border-radius: 0.375rem;}
            .BadgeGrey {background-color: #6c757d; border-radius: 0.375rem; padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700;}
            .BadgeBlue {display: flex; align-items: center; background-color: #0d6efd; border-radius: 0.375rem; padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700; white-space: nowrap;}
            .BadgeGreen {display: flex; align-items: center; background-color: #28a745; border-radius: 0.375rem; padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700; white-space: nowrap;}
            .BadgeRed {display: flex; align-items: center; background-color: #dc3545; border-radius: 0.375rem; padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700; white-space: nowrap;}
            .Container {display: flex; flex-direction: column; justify-content: center;}
            .NavbarContainer {display: flex; flex-direction: row; justify-content: space-between; width: 100%; height: 100px; background-color: #2b3035;}
            .NavbarContainer a {margin: auto auto auto 0;}
            .InputContainer {display: flex; flex-direction: column; justify-content: space-between;}
            .InputContainer button {margin-right: 5px;}
            .SearchContainer {display: flex; flex: 1; flex-direction: row; justify-content: space-between; margin-top: 7px; width: 100%;}
            .DefaultQueryContainer {display: flex; flex: 1; flex-direction: row; justify-content: space-between; margin: 3px 0 7px 0; width: 100%;}
            .PickerContainer {display: flex; justify-content: space-between; align-items: center; height: 35px; width: 100%; background-color: #343a40; position: sticky; top: 0;}
            .BtnContainer {display: flex; height: 100%;}
            .BtnContainer button{width: 40px;}
            .eye {margin-left: 1%;}
            .CardContainer {display: flex; flex-wrap: wrap; justify-content: space-around; color: white; background-color: #1e1f20; margin: 2% 3% auto 3%; border-radius: 0.375rem}
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
            .DefaultInput {width: 240px; overflow: auto; display: flex; background-color: #212529;border: 1px solid #495057;border-radius: 0.375rem; color: white;}
            .TagContainer {display: flex; align-items: center;}
            span svg {color: lightgrey; margin-right: 8px; cursor: pointer;}
            .BetweenInput {background-color: transparent; border: none; width: 1px;}
            .InfoContainer {display: flex; justify-content: space-between; flex-direction: row-reverse; margin: 5% 3% 0 3%;}
            .ResultsCount {color: white;}
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
                    <button class="BtnGreen BtnAdd">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
                        </svg>
                    </button>
                    <button class="BtnRed BtnExclude">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="InfoContainer">
                <select id="orderbydropdown">
                    <option value="">Order by:</option>
                    <option value="date_added">Date Added</option>
                    <option value="published">Date Published</option>
                    <option value="today">Popular: Today</option>
                    <option value="week">Popular: Week</option>
                    <option value="month">Popular: Month</option>
                    <option value="year">Popular: Year</option>
                    <option value="random">Random</option>
                </select>
                <a class="ResultsCount"></a>
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
        const count = Math.min(idsList.length, CONFIG.galleriesPerPage);

        const promises = [];
        for (let i = 0; i < count; ++i) {
            const galleryId = idsList[i];
            const url = `//${STATE.domain}/galleryblock/${galleryId}.html`;
            promises.push(xhr_get(url, { responseType: "text" }));
        }

        const results = await Promise.allSettled(promises);
        for (const r of results) {
            if (r.status === "fulfilled") galleriesList.push(r.value);
        }

        ++STATE.fetchCount;
        return galleriesList;
    }

    function generate_card(gallery, idsObj, divCardC) {
        return new Promise((resolve) => {
            function create_table(type, listOrItem, container, defaultText = 'N/A') {
                const isList = Array.isArray(listOrItem) || listOrItem instanceof NodeList;
                const list = isList ? Array.from(listOrItem) : [listOrItem];

                const text = list.length ? list[0].textContent : defaultText;
                const href = list.length ? list[0].href.replace(`https://${STATE.domain}`, "") : "/index-japanese.html";

                container.insertAdjacentHTML(
                  'beforeend',
                  `<tr><td>${type}</td><td>:</td><td><a href="${href}">${text}</a></td></tr>`
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
                fetchAll = true,
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

        function random_access(idsList) {
            const results = []
            const count = Math.min(idsList.length, CONFIG.galleriesPerPage * (STATE.fetchCount + 1));

            for (;STATE.randomUsed.size < count;) {
                const idx = (Math.random() * idsList.length) | 0;
                if (STATE.randomUsed.has(idx)) continue;
                STATE.randomUsed.add(idx);

                const galleryId = idsList[idx];
                results.push(galleryId);
            }
            return results
        }

        let idsList, isRandom = false

        if (STATE.orderBy === "random") {
            isRandom = true
        } else {
            if (text) text = `${text} ${STATE.orderBy}`
            if (!text) text = `${STATE.orderBy}`
        }

        if (!text) {
            if (isRandom) {
                idsList = await nozomi_load({ url: `//${STATE.domain}/n/index-all.nozomi` })
                idsList = random_access(idsList) // STATE.randomUsed
            }
            else {
                idsList = await nozomi_load({ fetchAll: false }) 
            }
            return idsList
        }

        let queryString = decodeURIComponent(text).replace(/^\?/, '');
        let terms = queryString.toLowerCase().trim().split(/\s+/);

        const newTerms = []
        const posTerms = []
        const negTerms = []
        terms.forEach(term => {
            let isNegative = false

            term = ubar2space(term) //index url need to be exclude ubars
            if (/^-/.test(term)) {
                term = term.replace(/^-/, "")
                negTerms.push(term)
                isNegative = true
            } else {
                posTerms.push(term)
            }
            STATE.indexObj[term] = {}
            STATE.indexObj[term]["isNegative"] = isNegative

            newTerms.push(term)
        })
        const termsLength = newTerms.length

        for (let term of newTerms) {
            let nozimiAddress, dataAddress, start, length
            if (STATE.indexObj[term]["data"]) {
                continue
            }

            if (term.includes(':')) {
                let area, tag = 'index', language = 'all'
                let temp = term.split(/:/);
                if (temp[0] === 'language') area = temp[0], language = temp[1]
                else if (temp[0] === 'female' || temp[0] === 'male') area = 'tag', tag = term
                else area = temp[0], tag = temp[1]

                if (area === 'language') {
                    nozimiAddress = `//${STATE.domain}/${tag}-${language}.nozomi`;
                    if (termsLength !== 1 || isRandom) nozimiAddress = `//${STATE.domain}/n/${tag}-${language}.nozomi`;
                    STATE.indexObj[term]["url"] = nozimiAddress
                    STATE.indexObj[term]["data"] = await nozomi_load({ url: nozimiAddress });
                } else {
                    nozimiAddress = `//${STATE.domain}/${area}/${tag}-${language}.nozomi`;
                    if (termsLength !== 1 || isRandom) nozimiAddress = `//${STATE.domain}/n/${area}/${tag}-${language}.nozomi`;
                    STATE.indexObj[term]["url"] = nozimiAddress
                    STATE.indexObj[term]["data"] = await nozomi_load({ url: nozimiAddress });
                }
            } else {
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

        const seen = {};
        let posTempRes = new Set();
        for (let i = 0; i < posTerms.length; i++) {
            const termObj = STATE.indexObj[posTerms[i]];
            if (termObj["isNegative"]) continue

            const data = termObj["data"]
            if (!Array.isArray(data)) continue;
            for (const id of data) {
                if (posTerms.length >= 2) {
                    if (seen[id]) {
                        seen[id] += 1
                        if (seen[id] >= posTerms.length) posTempRes.add(id);
                    } else {
                        seen[id] = 1;
                    }
                } else if (posTerms.length === 1) {
                    posTempRes.add(id);
                }
            }
        }
        if (!posTempRes.size) {
            posTempRes = await nozomi_load({ url: `//${STATE.domain}/n/index-all.nozomi` })
        }

        const negTempRes = new Set();
        for (let i = 0; i < negTerms.length; i++) {
            const termObj = STATE.indexObj[negTerms[i]];
            if (!termObj["isNegative"]) continue

            const data = termObj["data"]
            if (!Array.isArray(data)) continue;
            for (const id of data) negTempRes.add(id);
        }

        const results = new Set();
        for (const id of posTempRes) {
            if (negTempRes.has(id)) continue
            results.add(id)
        }

        STATE.resultsCount = results.size
        if (isRandom) return random_access(results)
        return Array.from(results).slice(start, start + CONFIG.galleriesPerPage)
    }

    function tag_to_badge(field, term, xdiv, actualInput, isNegative) {
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
        if (isNegative) span.className = "BadgeRed";
        span.innerHTML = `${svg} ${field}:${space2ubar(term)}`;

        divTagC.appendChild(span)

        xdiv.insertBefore(divTagC, actualInput);
    }

    async function get_search_suggestion(text, divSuggestionC, divSearchC, divSearchInput, actualInput) {
        async function return_json(query, checkValid = false) {
            let field = 'global', term = ubar2space(query), istag = false, jsonSuggestions = []
            if (query.includes(':')) {
                const sides = query.split(/:/);
                field = sides[0];
                term = sides[1];
                istag = true
            }
            const chars = term.split('').map(i => encode_query(i))
            let url = `//tagindex.hitomi.la/${field}`;
            if (chars.length) {
                url += `/${chars.join('/')}`;
            }
            url += '.json';

            jsonSuggestions = await xhr_get(url, { responseType: "json" })
            if (checkValid) {
                let isValid = false;
                if (!istag) return [jsonSuggestions[0], isValid];
                
                for (let i = 0; i < jsonSuggestions.length; i++) {
                    const suggest = jsonSuggestions[i];
                    if (suggest[0] === ubar2space(term) && suggest[2] === field) {
                        isValid = true;
                        break;
                    }
                }
                return [jsonSuggestions[0], isValid];
            }
            return jsonSuggestions
        }

        const inputList = text.split(/\s+/)
        let newInputList = [], negList = [], posList = [], isNegative = false
        inputList.forEach(term => {
            if (/^-/.test(term)) {
                term = term.replace(/^-/, "")
                negList.push(term)
                isNegative = true
            } else {
                posList.push(term)
            }
            newInputList.push(term)
        })

        if (newInputList.length >= 2) {
            const editedList = newInputList.slice(0, newInputList.length - 1)
            for (let value of editedList) {
                let [suggestions, boolSuccess] = await return_json(value, true)
                if (!boolSuccess) return
                const isNegative = negList.includes(`${suggestions[2]}:${suggestions[0]}`)
                tag_to_badge(suggestions[2], suggestions[0], divSearchInput, actualInput, isNegative)
                actualInput.value = (actualInput.value).replace(`${value} `, "")
                if (isNegative)actualInput.value = (actualInput.value).replace("-", "")
            }
        }

        const lastInput = newInputList.at(-1);
        const suggestions = await return_json(lastInput)

        const re = new RegExp(ubar2space(lastInput), 'gi');

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

                const isNegative = negList.includes(`${field}:${term}`)
                tag_to_badge(field, term, divSearchInput, actualInput, isNegative)
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

    async function load(text, aResCount, divCardC) {
        STATE.fetching = true

        if (STATE.fetchCount === 0) divCardC.innerHTML = ""
        const idsList = await select_leaf(CONFIG.defaultQuery + text, STATE.fetchCount) // STATE.indexObj

        const galleriesList = await fetch_gallery(idsList); // STATE.fetchCount

        const idsObj = await filter_contents(idsList)

        const promises = []
        const fragment = document.createDocumentFragment();
        galleriesList.forEach(gallery => {
            promises.push(generate_card(gallery, idsObj, fragment))
        });
        if (STATE.resultsCount) aResCount.textContent = `${String(STATE.resultsCount)} Results`

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

    function ubar2space(query) {
        query = query.replace(/_/g, " ")
        return query;
    }

    function wrap2space(query) {
        query = query.replace(/\n/g, " ")
        return query;
    }

    function space2ubar(query) {
        query = query.replace(/\s/g, "_")
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

    function search_listener(searchButton, divSearchInput, divSuggestionC, actualInput) {
        let isFocust;
        searchButton.addEventListener('click', async function() {
            STATE.fetchCount = 0
            STATE.randomUsed = new Set()
            let text = (wrap2space(divSearchInput.outerText)) // eg, series:blue_archive\ntype:doujinshi
            if (actualInput.value && text) text = `${text} ${actualInput.value}`
            else if (actualInput.value) text = actualInput.value
            await load(text, aResCount, divCardC) // STATE.fetching
        });
        divSearchInput.addEventListener('keydown', async function(e) {
            if (e.key !== 'Enter') return
            for (const suggest of Array.from(divSuggestionC.children)) {
                if (suggest.classList.contains('SuggestionFocus')) {
                    isFocust = true;
                    break;
                }
            }

            if (!isFocust) {
                STATE.fetchCount = 0
                STATE.randomUsed = new Set()
                let text = (wrap2space(divSearchInput.outerText)) // eg, series:blue_archive\ntype:doujinshi
                if (actualInput.value && text) text = `${text} ${actualInput.value}`
                else if (actualInput.value) text = actualInput.value
                await load(text, aResCount, divCardC) // STATE.fetching
            }
            isFocust = false;
        })
    }

    function order_listener(optionOrderByDropdown) {
        optionOrderByDropdown.forEach(option => {
            option.addEventListener('click', function() {
                const list = option.text.toLowerCase().replace(/:/g, "").split(/\s+/)
                STATE.orderBy = `${list[0]}:${list[1]}`
                if (list[1] == "added") STATE.orderBy = ""
                else if (list[0] == "random") STATE.orderBy = "random"
            })
        })
    }

    function picker_listener(eye, add, ex, divCardC, divDefaultInput, DefaultActualInput) {
        function extract_tag(href) {
            const match = href.match(/\/tag\/(.*)-all.html/) || href.match(/.*%20(.*)/);
            return encode_query(decodeURIComponent(match[1]));
        }

        function extract_table(a) {
            let match;
            const hrefValue = a.getAttribute('href');

            match = hrefValue.match(/^\/index-(.*)\.html$/);
            if (match) {
                return 'language:' + match[1];
            }

            match = hrefValue.match(/^\/(.*)\/(.*)-all\.html$/);
            if (match) {
                return match[1] + ':' + encode_query(decodeURIComponent(match[2]));
            }
            //
            // match = hrefValue.match(/.* (.*)/);
            // if (match) {
            //     return match[1];
            // }

            console.log('No match found for href:', hrefValue);
            return null;
        }

        let isPickerActive = false;
        let selectedTag = [];
        let selectedType = [];

        eye.addEventListener('click', () => {
            isPickerActive = !isPickerActive;
            if (isPickerActive) eye.setAttribute('fill', 'yellow')  
            else eye.setAttribute('fill', 'currentColor')

            add.disabled = !isPickerActive;
            ex.disabled = !isPickerActive;

            // if (!isPickerActive && (selectedTag || selectedType)) {
            //     if (selectedTag) selectedTag.style.border = ""
            //     if (selectedType) selectedType.style.border = ""
            //     selectedTag = null;
            //     selectedType = null;
            // }
        })
        document.addEventListener('click', (e) => {
            if (!isPickerActive) return;
            const tag = e.target.closest('.BadgeBlue');
            if (tag) {
                e.preventDefault();
                const color = tag.style.border
                if (color === "") {
                    tag.style.border = "solid yellow"
                    selectedTag.push(tag)
                }
                else tag.style.border = ""
            }
        });
        document.addEventListener('click', (e) => {
            if (!isPickerActive) return;
            const type = e.target.closest('table tr td a');
            if (type) {
                e.preventDefault();
                const color = type.style.border
                if (color === "") {
                    type.style.border = "solid yellow"
                    selectedType.push(type)
                }
                else type.style.border = ""
            }
        });
        add.addEventListener('click', () => {
            if (selectedTag) {
                selectedTag.forEach(tag => {
                    const tagText = extract_tag(tag.href);
                    if (!CONFIG.defaultQuery.includes(tagText)) {
                        CONFIG.defaultQuery += CONFIG.defaultQuery ? ` ${tagText}` : tagText;
                        const tagList = tagText.split(/:/)
                        tag_to_badge(tagList[0], tagList[1], divDefaultInput, DefaultActualInput, false)
                        // localStorage.setItem('hitomiDefaultQuery', CONFIG.defaultQuery);
                        // updateDefaultQueryUI();
                    }
                    tag.style.border = ""
                })
            } 
            if (selectedType) {
                selectedType.forEach(type => {
                    const typeText = extract_table(type);
                    if (!CONFIG.defaultQuery.includes(typeText)) {
                        CONFIG.defaultQuery += CONFIG.defaultQuery ? ` ${typeText}` : typeText;
                        const typeList = typeText.split(/:/)
                        tag_to_badge(typeList[0], typeList[1], divDefaultInput, DefaultActualInput, false)
                    }
                    type.style.border = ""
                })
            }
        });

        ex.addEventListener('click', () => {
            if (selectedTag) {
                selectedTag.forEach(tag => {
                    const tagText = extract_tag(tag.href);
                    const excludeText = `-${tagText}`;
                    if (!CONFIG.defaultQuery.includes(excludeText)) {
                        CONFIG.defaultQuery += CONFIG.defaultQuery ? ` ${excludeText}` : excludeText;
                        const tagList = tagText.split(/:/)
                        tag_to_badge(tagList[0], tagList[1], divDefaultInput, DefaultActualInput, true)
                        // localStorage.setItem('hitomiDefaultQuery', CONFIG.defaultQuery);
                        // updateDefaultQueryUI();
                    }
                    tag.style.border = ""
                })
            } 
            if (selectedType) {
                selectedType.forEach(type => {
                    const typeText = extract_table(type);
                    const excludeText = `-${typeText}`;
                    if (!CONFIG.defaultQuery.includes(excludeText)) {
                        CONFIG.defaultQuery += CONFIG.defaultQuery ? ` ${excludeText}` : excludeText;
                        const typeList = typeText.split(/:/)
                        tag_to_badge(typeList[0], typeList[1], divDefaultInput, DefaultActualInput, true)
                    }
                    type.style.border = ""
                })
            }
        });
    }

    const CONFIG = {
        fetchIdjs: false,
        infScroll: true,
        minPage: 0,
        galleriesPerPage: 25,
        debounceTime: 300,
        defaultQuery: ""
    };

    const STATE = {
        domain: 'ltn.gold-usergeneratedcontent.net',
        fetching: false,
        fetchCount: 0,
        indexObj: {},
        orderBy: "",
        randomUsed: new Set(),
        resultsCount: 0
    };

    document.documentElement.innerHTML = html;

    const inputSearchInput = document.querySelector('div.SearchInput input');
    const divSearchInput = document.querySelector('div.SearchInput');
    const actualInput = document.querySelector('.ActualInput')
    const divDefaultInput = document.querySelector('div.DefaultInput');
    const DefaultActualInput = document.querySelector('div.DefaultInput .ActualInput')
    const divSearchC = document.querySelector("div.SearchContainer")
    const divSuggestionC = document.querySelector("div.SuggestionContainer")
    const divCardC = document.querySelector("div.CardContainer")
    const searchButton = document.querySelector(".SearchContainer button")
    const aResCount = document.querySelector("a.ResultsCount")
    const svgEye = document.querySelector("svg.eye")
    const buttonAdd = document.querySelector("button.BtnAdd")
    const buttonEx = document.querySelector("button.BtnExclude")

    const optionOrderByDropdown = document.querySelectorAll("#orderbydropdown option")

    await load('', aResCount, divCardC) // STATE.fetching

    actualInput.addEventListener('input', debounce(async function() {
        divSuggestionC.textContent = "";
        const text = actualInput.value;

        await get_search_suggestion(text, divSuggestionC, divSearchC, divSearchInput, actualInput);
        if (divSuggestionC.children.length > 0) {
            divSuggestionC.style.display = 'block';
        } else {
            divSuggestionC.style.display = 'none';
        }
    }, CONFIG.debounceTime));

    suggestion_listener(divSearchInput, actualInput, divSearchC, divSuggestionC)
    order_listener(optionOrderByDropdown) // STATE.orderBy
    search_listener(searchButton, divSearchInput, divSuggestionC, actualInput) // STATE.fetchCount, STATE.randomUsed
    picker_listener(svgEye, buttonAdd, buttonEx, divCardC, divDefaultInput, DefaultActualInput)

    if (CONFIG.infScroll) {
        const observer = new IntersectionObserver(async (entries) => {
            const entry = entries[0];

            if (entry.isIntersecting && !STATE.fetching) {
                let text = (wrap2space(divSearchInput.outerText)) // eg, series:blue_archive\ntype:doujinshi
                if (actualInput.value && text) text = `${text} ${actualInput.value}`
                else if (actualInput.value) text = actualInput.value
                await load(text, aResCount, divCardC) // STATE.fetching
            }
        }, {
            root: null,
            rootMargin: "0px 0px 300px 0px",
            threshold: 0
        });

        observer.observe(document.querySelector("#scrollSentinel"));
    }
})();
