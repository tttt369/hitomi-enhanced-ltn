// ==UserScript==
// @name         hitomi-enhanced-ltn
// @namespace    Violentmonkey Scripts
// @match        https://ltn.gold-usergeneratedcontent.net/favicon-192x192.png
// @grant        GM_xmlhttpRequest
// @require      https://raw.github.com/emn178/js-sha256/master/build/sha256.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js
// @version      0.0
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
            :root {--radius: 0.375rem; --white: rgb(211, 211, 211); --dimWhite: rgb(140, 140, 140); --grey: #6c757d; --blue: #0d6efd; --green: #28a745; --red: #dc3545; --btnGreen: #198754; --btnRed: #a13643;}

            body {margin: 0; background-color: hsl(0, 0%, 13%);}
            table tr td a {display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; word-break: break-all; color: var(--dimWhite); text-decoration: none;}
            strong {color: cyan;}
            span svg {color: var(--white); margin-right: 8px; cursor: pointer;}

            input, svg {color: var(--white);}
            .BtnGreen, .BtnGreenOut, .BtnRed {border-radius: var(--radius);}
            .BtnGreen, .BtnGreenOut:hover, .BtnRed {color: var(--white);}
            .BadgeBlue, .BadgeGreen, .BadgeGrey, .BadgeRed {border-radius: var(--radius); padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700;}
            .BadgeBlue, .BadgeGreen, .BadgeRed {display: flex; align-items: center; white-space: nowrap;}
            .InputContainer, .NavbarContainer {display: flex; justify-content: space-between}
            .DefaultQueryContainer, .PickerContainer, .SearchContainer {display: flex; justify-content: space-between; width: 100%;}
            .DefaultInput, .SearchInput {width: 240px; overflow: auto; display: flex; background-color: hsl(0, 0%, 16%); border: 1px solid hsl(0, 0%, 25%); border-radius: var(--radius); color: var(--white);}

            .NavbarContainer a {margin: auto auto auto 10px;}
            .InputContainer button {margin-right: 5px; white-space: nowrap; overflow: hidden;}
            .CardTableContainer table {color: var(--dimWhite);}
            .CardTagsContainer a {margin-right: 5%; text-decoration: none; color: var(--white);}
            .Card img {width: 100%; height: 220px; object-fit: cover; border-radius: var(--radius);}
            .EyeContainer a {white-space: nowrap; display: none;}

            input:focus {background-color: transparent; border: none; outline: none;}
            .Suggestion:hover {background-color: hsl(0, 0%, 10%); cursor: pointer;}
            .BtnGreenOut:hover {background-color: var(--btnGreen);}

            .BtnGreenOut {color: var(--btnGreen); background-color: transparent; border: 1px solid var(--btnGreen);}
            .BtnGreen {background-color: var(--btnGreen); border: 1px solid var(--btnGreen);}
            .BtnRed {background-color: var(--btnRed); border: 1px solid var(--btnRed);}

            .BadgeGrey {background-color: var(--grey);}
            .BadgeBlue {background-color: var(--blue);}
            .BadgeGreen {background-color: var(--green);}
            .BadgeRed {background-color: var(--red);}

            .Container {display: flex; flex-direction: column; justify-content: center;}
            .NavbarContainer {flex-direction: row; width: 100%; height: 100px; background-color: hsl(0, 0%, 19%);}
            .InputContainer {flex-direction: column;}
            .SearchContainer {flex: 1; flex-direction: row; margin-top: 7px;}
            .DefaultQueryContainer {flex: 1; flex-direction: row; margin: 3px 0 7px 0;}
            .PickerContainer {align-items: center; height: 35px; background-color: hsl(0, 0%, 16%); position: sticky; top: 0;}
            .BtnContainer {display: flex; height: 100%;}
            .BtnContainer button{width: 40px;}
            .CardContainer {display: flex; flex-wrap: wrap; justify-content: space-around; color: var(--white); background-color: hsl(0, 0%, 10%); border-radius: var(--radius); gap: 20px; margin: 10px;}
            .CardTableContainer {display: flex; flex-direction: column; align-items: center; overflow-x: auto; align-self: start;}
            .CardTagsContainer {scrollbar-width: thin; display: flex; overflow-x: auto; white-space: nowrap; background-color: hsl(0, 0%, 10%); width: 100%; scrollbar-color: darkgray transparent; margin-left: 10px; padding-right: 40px; box-sizing: border-box;}
            .PageContainer {height: 100px; background-color: var(--white);}
            .SuggestionContainer {display: none; margin: 0; position: absolute; z-index: 1; background-color: hsl(0, 0%, 13%); color: var(--white); border: 1px solid hsl(0, 0%, 18%); border-radius: var(--radius);}
            .EyeContainer {display: flex; background-color: transparent; border-radius: var(--radius); padding: 5px; gap: 5px;}
            .InfoContainer {display: flex; justify-content: space-between; flex-direction: row-reverse; padding: 20px; align-items: center;}
            .TagContainer {display: flex; align-items: center;}
            .ContentContainer {background-color: hsl(0, 0%, 10%); margin: 3% 3% auto 3%; border-radius: var(--radius); overflow: hidden;}
            .BottomContainer {display: -webkit-box;}

            .eye {margin-left: 1%;}
            .CardTitle {font-weight: bold; text-decoration: none; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; word-break: break-all; color: var(--white);}
            .page {width: fit-content;}
            .Card {display: flex; flex-direction: column; flex: 1 1 190px; max-width: 220px; background-color: hsl(0, 0%, 14%); overflow: hidden; justify-content: space-between; border-radius: var(--radius); border:1px solid hsl(0, 0%, 19%); padding: 5px; gap: 10px;}
            .Suggestion {display: flex; white-space: nowrap; padding: 3%; border-bottom: 1px solid hsl(0, 0%, 18%);}
            .SuggestionText {flex: 1; overflow: hidden; text-overflow: ellipsis;}
            .SuggestionArea {color: var(--dimWhite);}

            .ActualInput {color: var(--white); background-color: transparent; border: none; font-weight: bold; overflow: visible;}
            .BetweenInput {background-color: transparent; border: none; width: 1px;}

            .ResultsCount {color: var(--dimWhite);}
            #scrollSentinel {height: 1px}
        </style>
    </head>
    <body>
        <div class="Container">
            <div class="NavbarContainer">
                <a href="https://ltn.gold-usergeneratedcontent.net/favicon-192x192.png">
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
                        <div class="SuggestionContainer"></div>
                    </div>
                </div>
            </div>
            <div class="PickerContainer">
                <div class="EyeContainer">
                    <a>select tag or type</a>
                    <svg class="eye" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eyedropper" viewBox="0 0 16 16">
                        <path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708zM2 12.707l7-7L10.293 7l-7 7H2z"/>
                    </svg>
                </div>
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
            <div class="ContentContainer">
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
            </div>
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

    async function filter_contents(idsList, options = {}) {
        const {
            fetchPageNum = CONFIG.fetchPageNum,
            picPreview = (CONFIG.picPreviewPerPage >= 1) ? true : false,
        } = options;

        async function fetch_id_js(id, fetchPageNum, picPreview) {
            const result = { num: 0, previewFiles: [] }
            if (!fetchPageNum && !picPreview) return { id, data: result }

            const url = `https://ltn.${STATE.domain}/galleries/${id}.js`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            
            const startIdx = text.indexOf('{');
            const endIdx = text.lastIndexOf('}');
            if (startIdx === -1 || endIdx === -1) return null;
            
            const jsonStr = text.substring(startIdx, endIdx + 1);
            const galleryinfo = JSON.parse(jsonStr);
            if (!galleryinfo || !galleryinfo.files) return null;

            const files = galleryinfo.files;

            if (fetchPageNum) {
                result.num = files.length;
            }

            if (picPreview) {
                const step = Math.round(files.length / CONFIG.picPreviewPerPage) || 1;
                const previewFiles = [];
                for (let i = 0; i < files.length; i += step) {
                    previewFiles.push(files[i]);
                }
                result.previewFiles = previewFiles;
            }

            return { id, data: result };
        }

        const idsObj = {}
        const promises = []

        idsList.forEach(id => {
            promises.push(fetch_id_js(id, fetchPageNum, picPreview));
        })

        const promisesList = await Promise.all(promises);

        for (const item of promisesList) {
            if (!item || !item.data) continue;

            if (fetchPageNum && CONFIG.minPage >= 1 && item.data.num < CONFIG.minPage) {
                continue;
            }
            if (fetchPageNum && CONFIG.maxPage >= 1 && CONFIG.maxPage < item.data.num) {
                continue;
            }

            idsObj[item.id] = item.data;
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
            const url = `//ltn.${STATE.domain}/galleryblock/${galleryId}.html`;
            promises.push(xhr_get(url, { responseType: "text" }));
        }

        const results = await Promise.all(promises);
        for (const r of results) {
            galleriesList.push(r);
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
                const href = list.length ? list[0].href.replace(`https://ltn.${STATE.domain}`, "") : "/index-japanese.html";

                container.insertAdjacentHTML(
                  'beforeend',
                  `<tr><td>${type}</td><td>:</td><td><a href="${href}">${text}</a></td></tr>`
                );

            };

            function generate_tags(tags, container) {
                if (tags.length === 0) {
                    const aTag = document.createElement('a');
                    aTag.className = 'BadgeBlue';
                    aTag.textContent = 'N/A';
                    container.appendChild(aTag);
                } else {
                    Array.from(tags).forEach(tag => {
                        const clone = tag.cloneNode(true);
                        if (clone.textContent === '...') return;

                        clone.className = 'BadgeBlue';
                        container.appendChild(clone);
                    });
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
            aCardTitle.href = url.replace("ltn.gold-usergeneratedcontent.net", "hitomi.la")

            const table = document.createElement("table")

            const aPage = document.createElement("a")
            aPage.className = "page BadgeGrey"

            const divTagC = document.createElement("div")
            divTagC.className = "CardTagsContainer"

            const divbottomC = document.createElement("div")
            divbottomC.className = "BottomContainer"

            const aPic = document.createElement("a")
            aPic.href = url.replace("ltn.gold-usergeneratedcontent.net", "hitomi.la")
            aPic.target = "_blank"

            pic_preview_listener(aPic, id, idsObj)

            aPic.appendChild(pic)
            divCard.appendChild(aPic)
            divCardC.appendChild(divCard)
            divCard.appendChild(aCardTitle)
            divCard.appendChild(divTableC)
            divTableC.appendChild(table)
            divbottomC.appendChild(aPage)
            divbottomC.appendChild(divTagC)
            divCard.appendChild(divbottomC)

            aCardTitle.textContent = title
            create_table("language", language, table)
            create_table("type", type, table)
            create_table("artist", artistList, table)
            create_table('series', seriesList, table)
            aPage.textContent = idsObj[id].num ? `${idsObj[id].num}p` : "N/A"
            generate_tags(tags, divTagC)
            resolve()
        })
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

        async function fetch_term_data(term) {
            let ids = [];
            if (term.includes(':')) {
                let language = 'all'
                let [area, tag] = term.split(':');
                
                if (area === 'language') { language = tag; tag = 'index'; }
                else if (area === 'female' || area === 'male') { tag = term; area = 'tag'; }
                
                const url = get_nozomi_url(area, tag, language);
                ids = await nozomi_load({ url }); // STATE.indexObj
            } else {
                ids = await get_galleryids_for_keyword(term); // STATE.indexObj
            }
            return ids;
        }

        function get_nozomi_url(area, tag, language) {
            const orderby = STATE.orderBy || 'date';
            const prefix = 'n'; 
            
            if (area === 'language') {
                return `//ltn.${STATE.domain}/${prefix}/${tag}-${language}.nozomi`;
            }
            if (orderby === 'random') {
                return `//ltn.${STATE.domain}/${prefix}/${area}/${tag}-${language}.nozomi`;
            }
            if (orderby.includes(':')) { // popular:year など
                const [sort, key] = orderby.split(':');
                return `//ltn.${STATE.domain}/${prefix}/${area}/${sort}/${key}/${tag}-${language}.nozomi`;
            }
            return `//ltn.${STATE.domain}/${prefix}/${area}/${tag}-${language}.nozomi`; 
        }

        async function get_galleryids_for_keyword(term) {
            const key = new Uint8Array(sha256.array(term).slice(0, 4));
            const versionUrl = `//ltn.${STATE.domain}/galleriesindex/version?_=${Date.now()}.index`;

            if (!STATE.indexObj[versionUrl]) {
                STATE.indexObj[versionUrl] = await xhr_get(versionUrl, { responseType: "text" });
            }
            const indexUrl = `//ltn.${STATE.domain}/galleriesindex/galleries.${STATE.indexObj[versionUrl]}.index`;
            const dataUrl = `//ltn.${STATE.domain}/galleriesindex/galleries.${STATE.indexObj[versionUrl]}.data`;
            
            const arrayBuf = await xhr_get(indexUrl, { step: 464 });
            const node = decode_node(new Uint8Array(arrayBuf));
            const bytesList = await b_tree(node, key, indexUrl);
            
            const data = await index_load({ url: dataUrl, start: bytesList[0], step: bytesList[1] });
            return data
        }

        const terms = decodeURIComponent(text).replace(/^\?/, '').split(/\s+/);
        const posTerms = [], negTerms = []

        terms.forEach(term => {
            term = ubar2space(term);
            if (term.startsWith('-')) negTerms.push(term.slice(1));
            else posTerms.push(term);
        });

        let results = null
        if (posTerms.length === 0) {
            results = await nozomi_load({ url: `//ltn.${STATE.domain}/n/index-all.nozomi` }); // STATE.indexObj
        } else {
            for (let i = 0; i < posTerms.length; i++) {
                const ids = await fetch_term_data(posTerms[i]);
                if (i === 0) {
                    results = ids;
                } else {
                    const idSet = new Set(ids);
                    results = results.filter(id => idSet.has(id));
                }
            }
        }

        for (const term of negTerms) {
            const ids = await fetch_term_data(term);
            const idSet = new Set(ids);
            results = results.filter(id => !idSet.has(id));
        }

        STATE.resultsCount = results.length;
        const isRandom = STATE.orderBy === "random";
        
        if (isRandom) {
            return random_access(results);
        }

        const start = STATE.fetchCount * CONFIG.galleriesPerPage;
        return results.slice(start, start + CONFIG.galleriesPerPage);
    }

    function tag_to_badge(field, term, divContainer, actualInput, isNegative) {
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

        divContainer.insertBefore(divTagC, actualInput);
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

    function get_search_input_text(divSearchInput, actualInput, shouldDefQuery = false) {
        function clean_text(text) {
            text = replace_smart_quotes(text)
            text = text.toLowerCase().trim()
            text = wrap2space(text)
            return text
        }
        function merge_text(text) {
            const set = new Set()
            text.split(/\s+/).forEach(query => {
                if (!query.length) return
                set.add(query)
            })
            const res = Array.from(set).join(' ')
            return res
        }
        let tagQuery = "", inputQuery = "", res = ""
        const badges = divSearchInput.querySelectorAll('span');
        badges.forEach(badge => {
            tagQuery += clean_text(badge.textContent) + " ";
        });
        inputQuery = clean_text(actualInput.value)

        if (shouldDefQuery) res = merge_text(`${tagQuery} ${inputQuery} ${clean_text(CONFIG.defaultQuery)}`)
        else res = merge_text(`${tagQuery} ${inputQuery}`)

        return res
    }

    function search_post_process(divSearchInput, actualInput) {
        STATE.fetchCount = 0
        STATE.randomUsed = new Set()
        STATE.term = get_search_input_text(divSearchInput, actualInput, true)
    }

    async function load(aResCount, divCardC, text = STATE.term) {
        STATE.fetching = true;
        if (STATE.fetchCount === 0) divCardC.innerHTML = "";

        let galleriesList = [], idsObj = {}, trial = 0;
        while (trial < CONFIG.trialLimit) {
            let idsList = [];
            if (!text.length) {
                idsList = await nozomi_load({ fetchAll: false });
                STATE.resultsCount = 0;
                aResCount.textContent = '';
            } else {
                idsList = await select_leaf(text);
            }

            idsObj = await filter_contents(idsList);
            galleriesList = await fetch_gallery(Object.keys(idsObj).reverse());

            if (galleriesList.length > 0) break;

            trial++; STATE.indexObj = {};
            console.warn(`Retry attempt: ${trial}`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.debounceTime));
        }

        if (galleriesList.length === 0) {
            alert("error: data not found");
            return;
        }

        const fragment = document.createDocumentFragment();
        const promises = galleriesList.map(gallery => generate_card(gallery, idsObj, fragment));
        
        if (STATE.resultsCount) {
            aResCount.textContent = `${String(STATE.resultsCount)} Results`;
        }

        await Promise.all(promises);
        divCardC.appendChild(fragment);

        STATE.fetching = false
        STATE.trial = 0
    }

    function search_tag_listener(divSearchInput, actualInput, divSearchC, divSuggestionC, saveButton, isDefaultQuery = false) {
        divSearchInput.addEventListener('click', function(event) {
            if (event.target.closest('.bi-x-circle-fill')) {
                event.target.closest('.TagContainer').remove();
                if (isDefaultQuery) {
                    const text = get_search_input_text(divSearchInput, actualInput)
                    save_to_localstorage(saveButton, text) // CONFIG.defaultQuery
                }
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

                if (currentInput.classList.contains('.ActualInput')) {
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

    function replace_smart_quotes(query) {
        const replaceChars = {
            '“': '"',
            '”': '"',
            '‘': "'",
            '’': "'",
            '–': '-',
            '—': '-',
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

    function search_listener(searchButton, divSearchInput, divSuggestionC, actualInput, aResCount, divCardC) {
        let isFocust;
        searchButton.addEventListener('click', async function() {
            search_post_process(divSearchInput, actualInput) // STATE.fetchCount, STATE.randomUsed
            await load(aResCount, divCardC) // STATE.fetching, STATE.resultsCount
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
                searchButton.click()
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

    function save_to_localstorage(saveButton, text = "") {
        function temp_ui_update(saveButton) {
            saveButton.innerText = "saved!";
            setTimeout(() => {
                saveButton.innerText = "Save";
            }, 1000);
        }
        CONFIG.defaultQuery = `${text} `
        localStorage.setItem(STORAGE.defaultQueryValue, `${text} `)
        temp_ui_update(saveButton)
    }

    function picker_listener(eye, add, ex, divDefaultInput, defaultActualInput, divSearchInput, actualInput, aResCount, divCardC, eyeText, eyeContainer, saveButton) {
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

        defaultActualInput.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter') return
            saveButton.click()
        })

        saveButton.addEventListener('click', () => {
            const text = get_search_input_text(divDefaultInput, defaultActualInput)
            save_to_localstorage(saveButton, text) // CONFIG.defaultQuery
        })

        eyeContainer.addEventListener('click', () => {
            isPickerActive = !isPickerActive;
            if (isPickerActive) {
                eyeContainer.style.backgroundColor = 'yellow';
                eyeText.style.display = 'block';
                eyeText.style.color = 'black';
                eye.style.fill = 'black';
            } else {
                eyeContainer.style.backgroundColor = 'transparent';
                eyeText.style.display = 'none';
                eye.style.fill = 'white';
            }

            add.disabled = !isPickerActive;
            ex.disabled = !isPickerActive;

            // if (!isPickerActive && (selectedTag || selectedType)) {
            //     if (selectedTag) selectedTag.style.border = ""
            //     if (selectedType) selectedType.style.border = ""
            //     selectedTag = null;
            //     selectedType = null;
            // }
        })
        document.addEventListener('click', async (e) => {
            const tag = e.target.closest('.BadgeBlue');
            if (tag) {
                e.preventDefault();
                if (!isPickerActive) {
                    const tagText = extract_tag(tag.href);
                    const tagList = tagText.split(/:/)
                    tag_to_badge(tagList[0], tagList[1], divSearchInput, actualInput, false)
                    if (!CONFIG.incrementTag) {
                        search_post_process(divSearchInput, actualInput) // STATE.fetchCount, STATE.randomUsed
                        await load(aResCount, divCardC) // STATE.fetching, STATE.resultsCount
                    }
                    return;
                }
                const color = tag.style.border
                if (color === "") {
                    tag.style.border = "solid yellow"
                    selectedTag.push(tag)
                }
                else tag.style.border = ""
            }
        });
        document.addEventListener('click', async (e) => {
            const type = e.target.closest('table tr td a');
            if (type) {
                e.preventDefault();
                if (!isPickerActive) {
                    const typeText = extract_table(type);
                    const typeList = typeText.split(/:/)
                    tag_to_badge(typeList[0], typeList[1], divSearchInput, actualInput, false)
                    if (!CONFIG.incrementTag) {
                        search_post_process(divSearchInput, actualInput) // STATE.fetchCount, STATE.randomUsed
                        await load(aResCount, divCardC) // STATE.fetching, STATE.resultsCount
                    }
                    return;
                }
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
                        tag_to_badge(tagList[0], tagList[1], divDefaultInput, defaultActualInput, false)
                        // localStorage.setItem('hitomiDefaultQuery', CONFIG.defaultQuery);
                        // updateDefaultQueryUI();
                    }
                    tag.style.border = ""
                })
                save_to_localstorage(saveButton, CONFIG.defaultQuery) // CONFIG.defaultQuery
            } 
            if (selectedType) {
                selectedType.forEach(type => {
                    const typeText = extract_table(type);
                    if (!CONFIG.defaultQuery.includes(typeText)) {
                        CONFIG.defaultQuery += CONFIG.defaultQuery ? ` ${typeText}` : typeText;
                        const typeList = typeText.split(/:/)
                        tag_to_badge(typeList[0], typeList[1], divDefaultInput, defaultActualInput, false)
                    }
                    type.style.border = ""
                })
                save_to_localstorage(saveButton, CONFIG.defaultQuery) // CONFIG.defaultQuery
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
                        tag_to_badge(tagList[0], tagList[1], divDefaultInput, defaultActualInput, true)
                        // localStorage.setItem('hitomiDefaultQuery', CONFIG.defaultQuery);
                        // updateDefaultQueryUI();
                    }
                    tag.style.border = ""
                })
                save_to_localstorage(saveButton, CONFIG.defaultQuery) // CONFIG.defaultQuery
            } 
            if (selectedType) {
                selectedType.forEach(type => {
                    const typeText = extract_table(type);
                    const excludeText = `-${typeText}`;
                    if (!CONFIG.defaultQuery.includes(excludeText)) {
                        CONFIG.defaultQuery += CONFIG.defaultQuery ? ` ${excludeText}` : excludeText;
                        const typeList = typeText.split(/:/)
                        tag_to_badge(typeList[0], typeList[1], divDefaultInput, defaultActualInput, true)
                    }
                    type.style.border = ""
                })
                save_to_localstorage(saveButton, CONFIG.defaultQuery) // CONFIG.defaultQuery
            }
        });
    }

    function suggestion_listener(actualInput, divSuggestionC, divSearchC, divSearchInput) {
        let requestCounter = 0;

        actualInput.addEventListener('input', debounce(async function() {
            divSuggestionC.textContent = "";
            const text = actualInput.value;

            const currentRequestId = ++requestCounter;

            await get_search_suggestion(text, divSuggestionC, divSearchC, divSearchInput, actualInput);

            if (currentRequestId !== requestCounter) return;

            if (divSuggestionC.children.length > 0) {
                divSuggestionC.style.display = 'block';
            } else {
                divSuggestionC.style.display = 'none';
            }

        }, CONFIG.debounceTime));
    }



    function pic_preview_listener(pic, id, idsObj) {
        function get_hitomi_url(galleryid, image, dir, ext, base = "tn") {
            ext = ext || dir || image.name.split('.').pop();
            
            let pathDir = '', fullPath = '', subdomain = '', url = '';

            if (dir !== 'webp' && dir !== 'avif') {
                pathDir = dir + '/';
            }

            if (base === 'tn') {
                // if thumbnail use real_full_path_from_hash
                fullPath = image.hash.replace(/^.*(..)(.)$/, '$2/$1/' + image.hash);
            } else {
                // full_path_from_hash
                fullPath = STATE.gg.b + STATE.gg.s(image.hash) + '/' + image.hash;
            }

            url = `https://a.${STATE.domain}/${base === 'tn' ? `${dir}/` : pathDir}${fullPath}.${ext}`;

            if (!base) {
                if (dir === 'webp') subdomain = 'w';
                else if (dir === 'avif') subdomain = 'a';
            }

            const r = /\/[0-9a-f]{61}([0-9a-f]{2})([0-9a-f])/;
            const m = r.exec(url);
            if (m) {
                const g = parseInt(m[2] + m[1], 16);
                if (!isNaN(g)) {
                    if (base) {
                        subdomain = String.fromCharCode(97 + STATE.gg.m(g)) + base;
                    } else {
                        subdomain = subdomain + (1 + STATE.gg.m(g));
                    }
                }
            }

            return url.replace(/\/\/..?\.(?:gold-usergeneratedcontent\.net|hitomi\.la)\//, '//' + subdomain + '.' + STATE.domain + '/');
        }

        async function fetch_image(file, dir, ext) {
            const url = get_hitomi_url(id, file, dir, ext);
            const cacheKey = `${file.hash}_${dir}`;

            if (CACHE.imageCache.has(cacheKey)) {
                return CACHE.imageCache.get(cacheKey);
            }

            const fetchPromise = new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    responseType: "blob",
                    headers: { "Referer": "https://hitomi.la" },
                    onload: function (res) {
                        const blobUrl = URL.createObjectURL(res.response);
                        resolve(blobUrl);
                    },
                    onerror: reject
                });
            });

            CACHE.imageCache.set(cacheKey, fetchPromise);

            return fetchPromise;
        }

        async function updateDisplay(index) {
            const file = files[index];
            const srcImg = pic.querySelector('img');
            const source = pic.querySelector('source');

            const [webpUrl, avifUrl] = await Promise.all([
                fetch_image(file, "webpsmallsmalltn", "webp"),
                fetch_image(file, "avifsmalltn", "avif")
            ]);

            if (webpUrl) {
                srcImg.src = webpUrl;
            }
            if (avifUrl) {
                source.srcset = `${avifUrl} 1x, ${avifUrl} 2x`;
            }

            [1, -1].forEach(offset => {
                const nextIdx = (index + offset + files.length) % files.length;
                const nextFile = files[nextIdx];
                fetch_image(nextFile, "webpsmallsmalltn", "webp");
                fetch_image(nextFile, "avifsmalltn", "avif");
            });
        }

        if (!idsObj[id].previewFiles) return;

        let currentIndex = 0;
        const files = idsObj[id].previewFiles;

        pic.addEventListener('click', (e) => {
            e.preventDefault();
            const rect = pic.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            if (x < rect.width / 2) {
                currentIndex = (currentIndex - 1 + files.length) % files.length;
            } else {
                currentIndex = (currentIndex + 1) % files.length;
            }
            
            updateDisplay(currentIndex);
        });
    }

    async function nozomi_load(options = {}) {
        const {
            url = `//ltn.${STATE.domain}/index-all.nozomi`,
            step = CONFIG.galleriesPerPage * 4,
            fetchAll = true,
        } = options;
        if (STATE.indexObj[url] && fetchAll) {
            return STATE.indexObj[url]
        } else {
            const bytesArray = await xhr_get(url, { step: step, fetchAll: fetchAll });
            const view = new DataView(bytesArray);
            const totalBytes = view.byteLength;
            STATE.indexObj[url] = get_ids(totalBytes, view)
            return STATE.indexObj[url]
        }
    }

    async function fetch_gg() {
        const url = 'https://ltn.gold-usergeneratedcontent.net/gg.js';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const rawText = await response.text();

        const scriptBody = `
            let gg; 
            ${rawText.replace("'use strict';", "")} 
            return gg;
        `;

        const extractGG = new Function(scriptBody);
        STATE.gg = extractGG();
    }

    const CACHE = {
        imageCache: new Map()
    }

    const STORAGE = {
        defaultQueryValue: 'defaultQueryValue'
    }

    const CONFIG = {
        infScroll: true,
        incrementTag: false,
        fetchPageNum: false,
        minPage: 0,
        maxPage: 0,
        trialLimit: 5,
        galleriesPerPage: 25,
        debounceTime: 300,
        picPreviewPerPage: 5,
        defaultQuery: localStorage.getItem(STORAGE.defaultQueryValue) || ""
    };

    const STATE = {
        fetching: false,
        fetchCount: 0,
        resultsCount: 0,
        trial: 0,
        domain: "gold-usergeneratedcontent.net",
        orderBy: "",
        term: "",
        indexObj: {},
        randomUsed: new Set(),
        gg: new Function()
    };

    document.documentElement.innerHTML = html;

    const divSearchInput = document.querySelector('div.SearchInput');
    const divDefaultInput = document.querySelector('div.DefaultInput');
    const actualInput = document.querySelector('input.ActualInput')
    const defaultActualInput = document.querySelector('div.DefaultInput .ActualInput')
    const divSearchC = document.querySelector("div.SearchContainer")
    const divDefaultSearchC = document.querySelector('div.DefaultQueryContainer');
    const divSuggestionC = document.querySelector("div.SearchContainer .SuggestionContainer")
    const divDefaultSuggestionC = document.querySelector("div.DefaultQueryContainer .SuggestionContainer")
    const divCardC = document.querySelector("div.CardContainer")
    const searchButton = document.querySelector(".SearchContainer button")
    const DefaultSaveButton = document.querySelector(".DefaultQueryContainer button")
    const aResCount = document.querySelector("a.ResultsCount")
    const eyeContainer = document.querySelector("div.EyeContainer")
    const svgEye = document.querySelector("div.EyeContainer .eye")
    const eyeText = document.querySelector("div.EyeContainer a")
    const buttonAdd = document.querySelector("button.BtnAdd")
    const buttonEx = document.querySelector("button.BtnExclude")
    const optionOrderByDropdown = document.querySelectorAll("#orderbydropdown option")

    if (CONFIG.picPreviewPerPage >= 1) await fetch_gg()

    // const text = search_post_process(divSearchInput, actualInput) // STATE.fetchCount, STATE.randomUsed
    await load(aResCount, divCardC) // STATE.fetching, STATE.resultsCount

    search_tag_listener(divSearchInput, actualInput, divSearchC, divSuggestionC, DefaultSaveButton)
    search_tag_listener(divDefaultInput, defaultActualInput, divDefaultSearchC, divDefaultSuggestionC, DefaultSaveButton, true)
    suggestion_listener(actualInput, divSuggestionC, divSearchC, divSearchInput)
    suggestion_listener(defaultActualInput, divDefaultSuggestionC, divDefaultSearchC, divDefaultInput)
    order_listener(optionOrderByDropdown) // STATE.orderBy
    search_listener(searchButton, divSearchInput, divSuggestionC, actualInput, aResCount, divCardC)
    picker_listener(svgEye, buttonAdd, buttonEx, divDefaultInput, defaultActualInput, divSearchInput, actualInput, aResCount, divCardC, eyeText, eyeContainer, DefaultSaveButton)

    CONFIG.defaultQuery.split(/\s+/).forEach(query => {
        if (!query.length) return

        if (query.includes(':')) {
            const typeList = query.split(/:/)
            if (query.startsWith('-')) {
                tag_to_badge(typeList[0], typeList[1], divDefaultInput, defaultActualInput, true)
            } else {
                tag_to_badge(typeList[0], typeList[1], divDefaultInput, defaultActualInput, false)
            }
        }
        else defaultActualInput.value = query
    })

    if (CONFIG.infScroll) {
        const observer = new IntersectionObserver(async (entries) => {
            const entry = entries[0];

            if (entry.isIntersecting && !STATE.fetching) {
                observer.unobserve(entry.target);

                await load(aResCount, divCardC);

                observer.observe(entry.target);
            }

        }, {
            root: null,
            rootMargin: "0px 0px 300px 0px",
            threshold: 0
        });

        observer.observe(document.querySelector("#scrollSentinel"));
    }
})();
