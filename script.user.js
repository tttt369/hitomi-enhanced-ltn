// ==UserScript==
// @author       -
// @name         hitomi-enhanced-ltn
// @version      0.0
// @grant        GM_registerMenuCommand
// @match        https://hitomi.la/robots.txt
// @require      https://raw.github.com/emn178/js-sha256/master/build/sha256.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js
// ==/UserScript==

(async function() {
    'use strict';

    function get_ids(totalBytes, view) {
        const idsList = []
        for (let i = 0; i < totalBytes; i += 4) {
            const id = view.getUint32(i, false);
            idsList.push(id)
        };
        return idsList
    }

    async function fetch_id_js(id) {
        const url = `//ltn.${STATE.domain}/galleries/${id}.js`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx === -1 || endIdx === -1) return
        
        const jsonStr = text.substring(startIdx, endIdx + 1);
        const galleryinfo = JSON.parse(jsonStr);
        if (!galleryinfo || !galleryinfo.files) return

        return galleryinfo
    }

    async function filter_contents(idsList, options = {}) {
        const {
            fetchPageNum = CONFIG.fetchPageNum,
        } = options;

        let num = 0, previewFiles = [], files = [];

        const idsObj = {}, promises = []

        idsList.forEach(id => {
            idsObj[id] = { num: num, previewFiles: previewFiles }
            if (fetchPageNum) {
                promises.push(fetch_id_js(id));
            }
        })

        if (!fetchPageNum) return idsObj

        const promisesList = await Promise.all(promises);

        for (const item of promisesList) {

            if (fetchPageNum) {
                num = files.length;
            }

            if (fetchPageNum && CONFIG.minPage >= 1 && num < CONFIG.minPage) {
                continue;
            }
            if (fetchPageNum && CONFIG.maxPage >= 1 && CONFIG.maxPage < num) {
                continue;
            }

            idsObj[item.id] = { num: num, previewFiles: previewFiles }
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
            returnStatus = false,
            getRange = false,
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
                    if (getRange) {
                        const contentRange = xhr.getResponseHeader("Content-Range");
                        if (contentRange) {
                            STATE.defaultRange = Number(contentRange.split('/').pop());
                        }
                    }
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
                const href = list.length ? list[0].href : "";

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

                        tag_listener(clone)

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
            const picture = doc.querySelector('div[class$="-img1"] picture')
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

            // const img = document.createElement("img")
            // const dpr = window.devicePixelRatio
            // if (STATE.avif) {
            //     let urls = picture.querySelector("source").getAttribute("data-srcset").split(",")
            //     urls = urls.filter(x => x.endsWith(`${dpr}x`))
            //     img.src = urls[0].replace(` ${dpr}x`, "")
            // } else {
            //     const urls = picture.querySelector("source").getAttribute("data-src").split(",")
            //     urls = urls.filter(x => x.endsWith(`${dpr}x`))
            //     img.src = urls[0].replace(` ${dpr}x`, "")
            // }
            // img.loading = "lazy"

            picture.querySelectorAll("source").forEach(source => {
                if (source.srcset) {
                    source.srcset = source.srcset.replaceAll(
                        "tn.hitomi.la",
                        "tn.gold-usergeneratedcontent.net"
                    );
                }
                if (source.dataset.srcset) {
                    source.dataset.srcset = source.dataset.srcset.replaceAll(
                        "tn.hitomi.la",
                        "tn.gold-usergeneratedcontent.net"
                    );
                }
            });

            const img = picture.querySelector("img");
            if (img) {
                if (img.src) {
                    img.src = img.src.replaceAll(
                        "tn.hitomi.la",
                        "tn.gold-usergeneratedcontent.net"
                    );
                }
                if (img.dataset.src) {
                    img.dataset.src = img.dataset.src.replaceAll(
                        "tn.hitomi.la",
                        "tn.gold-usergeneratedcontent.net"
                    );
                }
            }

            const aPic = document.createElement("a")
            aPic.href = url
            aPic.target = "_blank"

            pic_preview_listener(aPic, id, idsObj)
            custom_viewer_listener(aCardTitle, id)

            aPic.appendChild(picture)
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
            create_table("series", seriesList, table)
            type_listener(table)

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

    function tag_to_badge(query, divContainer, actualInput) {
        if (!query.length) return

        const existingInput = actualInput.value.split(/\s+/)
        if (existingInput.includes(query)) return

        const spanExists = [...divContainer.querySelectorAll("span")]
            .some(span => span.textContent.trim() === query)

        if (spanExists) return

        if (query.includes(':')) {
            const queryList = query.split(/:/)
            let field = queryList[0], term = queryList[1], isNegative = query.startsWith('-')

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
        } else {
            actualInput.value += (actualInput.value ? " " : "") + query
        }
    }

    async function get_search_suggestion(text, divSuggestionC, divSearchInput, actualInput) {
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

        function arrow_process(e) {
            function apply_focus_class() {
                suggestionsArray.forEach(a => a.classList.remove('SuggestionFocus'));
                suggestionsArray[suggestionIndex].classList.add('SuggestionFocus');
            };

            const suggestionsArray = Array.from(divSuggestionC.querySelectorAll('a'));
            const max = suggestionsArray.length - 1;
            if (suggestionsArray.length === 0) return;

            if ((e.key === 'Tab' && e.shiftKey) || e.key === 'ArrowUp') {
                e.preventDefault();
                if (suggestionIndex <= 0) suggestionIndex = max;
                else suggestionIndex--;
                apply_focus_class();
            }

            else if (e.key === 'Tab' || e.key === 'ArrowDown') {
                e.preventDefault();
                if (suggestionIndex >= max) suggestionIndex = 0;
                else suggestionIndex++;
                apply_focus_class();
            }

            else if (e.key === 'Enter') {
                // suggestionIndexが初期値（-1など）で何も選択されていない場合の考慮
                if (suggestionIndex >= 0 && suggestionIndex < suggestionsArray.length) {
                    e.preventDefault();
                    suggestionsArray[suggestionIndex].click();
                    suggestionIndex = -1;
                }
            }
        };

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

                let query = `${suggestions[2]}:${suggestions[0]}`
                query = negList.includes(query) ? `-${query}` : query
                tag_to_badge(query, divSearchInput, actualInput)
                actualInput.value = (actualInput.value).replace(`${value} `, "")
                if (query.startsWith("-")) actualInput.value = (actualInput.value).replace("-", "")
            }
        }

        const namespaces = ['artist', 'group', 'type', 'character', 'series', 'tag', 'female', 'male', 'language'];

        const validNS = new Set()
        namespaces.forEach(ns => {
            const isHalfLonger = (ns.length / 2) <= text.length
            if (isHalfLonger && ns.includes(text)) validNS.add(ns)
        })

        const lastInput = newInputList.at(-1);
        const suggestions = await return_json(lastInput)

        Array.from(validNS).forEach(ns => {
            suggestions.unshift([ns, 0, "type", true])
        })

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

            aS.addEventListener('click', async function() {
                let query = `${suggestion[2]}:${suggestion[0]}`;
                query = negList.includes(query) ? `-${query}` : query

                divSuggestionC.textContent = "";

                if (suggestion[3]) {
                    actualInput.value = `${suggestion[0]}:`
                    await get_search_suggestion(`${suggestion[0]}:`, divSuggestionC, divSearchInput, actualInput)
                } else {
                    divSuggestionC.style.display = 'none';
                    tag_to_badge(query, divSearchInput, actualInput)
                    actualInput.value = ''
                }

                actualInput.focus();
                divSearchInput.scrollLeft = divSearchInput.scrollWidth;
                divSearchInput.removeEventListener('keydown', arrow_process)
                suggestionIndex = -1
            });
        })
        const rect = divSearchInput.getBoundingClientRect();
        divSuggestionC.style.top = rect.top - 7 + 'px';
        divSuggestionC.style.width = rect.width + 'px';

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
        function create_page_navigation() {
            pageContainers.forEach(pageContainer => {
                let maxPage = 0
                const pages = [], range = 3;

                if (STATE.resultsCount) {
                    maxPage = Math.ceil(STATE.resultsCount / CONFIG.galleriesPerPage);
                } else if (STATE.defaultRange) {
                    const res = STATE.defaultRange / 4
                    maxPage = Math.ceil(res / CONFIG.galleriesPerPage);
                }

                pageContainer.innerHTML = '';

                if (!(STATE.fetchCount + range >= maxPage)) {
                    if (STATE.fetchCount >= 2) {
                        pages.push(1)
                        pages.push('...')
                        for (let i = -1; i <= range - 1; i++) {
                            if (STATE.fetchCount + i >= maxPage) break
                            pages.push(STATE.fetchCount + i);
                        }
                    } else {
                        for (let i = 0; i <= range; i++) {
                            if (STATE.fetchCount + i >= maxPage) break
                            pages.push(STATE.fetchCount + i);
                        }
                    }

                    pages.push('...')
                    pages.push(maxPage)
                } else {
                    pages.push(1)
                    pages.push('...')
                    for (let i = -range; i <= 0; i++) {
                        pages.push(STATE.fetchCount + i);
                    }
                }

                pages.forEach(p => {
                    const a = document.createElement('a');
                    a.textContent = p;
                    if (p === STATE.fetchCount) a.style.color = 'var(--dimWhite)';
                    a.onclick = async (e) => {
                        e.preventDefault();
                        if (p === STATE.fetchCount || STATE.fetching) return;

                        STATE.fetchCount = p - 1;
                        divCardC.innerHTML = "";
                        
                        await load(aResCount, divCardC);
                    };
                    pageContainer.appendChild(a);
                })
            })
        }

        STATE.fetching = true;
        if (STATE.fetchCount === 0) divCardC.innerHTML = "";

        let galleriesList = [], idsObj = {}, trial = 0;
        while (trial < CONFIG.trialLimit) {
            let idsList = [];
            if (!text.length) {
                idsList = await nozomi_load({ fetchAll: false, getRange: true });
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

        create_page_navigation()

        await Promise.all(promises);
        divCardC.appendChild(fragment);

        STATE.fetching = false
        STATE.trial = 0
    }

    function search_tag_listener(divSearchInput, actualInput, divInputC, divSuggestionC, SaveDefQButton, isDefaultQuery = false) {
        divSearchInput.addEventListener('click', function(event) {
            if (event.target.closest('.bi-x-circle-fill')) {
                event.target.closest('.TagContainer').remove();
                if (isDefaultQuery) {
                    const text = get_search_input_text(divSearchInput, actualInput)
                    save_to_localstorage(SaveDefQButton, STORAGE.defaultQueryKey, text) // CONFIG.defaultQuery
                }
            }
            divSuggestionC.textContent = "";
            divSuggestionC.style.display = 'none';
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

    function save_to_localstorage(SaveDefQButton, key, text = "") {
        function temp_ui_update(SaveDefQButton) {
            SaveDefQButton.innerText = "saved!";
            setTimeout(() => {
                SaveDefQButton.innerText = "Save";
            }, 1000);
        }
        if (key === STORAGE.defaultQueryKey) {
            if (text.length) {
                CONFIG.defaultQuery = `${text} `
                localStorage.setItem(key, JSON.stringify(`${text} `))
                document.querySelector(`#${STORAGE.defaultQueryKey}`).value = `${text} ` 
            } else {
                CONFIG.defaultQuery = text
                localStorage.setItem(key, JSON.stringify(text))
            }
        } else {
            localStorage.setItem(key, JSON.stringify(text))
        }
        temp_ui_update(SaveDefQButton)
    }

    function extract_tag(href) {
        const match = href.match(/\/tag\/(.*)-all.html/) || href.match(/.*%20(.*)/);
        return encode_query(decodeURIComponent(match[1]));
    }

    function extract_table(a) {
        let match;
        const hrefValue = a.getAttribute('href');

        match = hrefValue.match(/.*\/index-(.*)\.html$/); // eg, language:japanese
        if (match) {
            return 'language:' + match[1];
        }

        match = hrefValue.match(/.*\/(.*)\/(.*)-all\.html$/); // eg, doujinshi:blue_archive
        if (match) {
            return match[1] + ':' + encode_query(decodeURIComponent(match[2]));
        }
        console.log('No match found for href:', hrefValue);
        return null;
    }

    function picker_listener(eye, add, ex, divDefaultInput, defaultActualInput, eyeText, eyeContainer, SaveDefQButton) {
        STATE.isPickerActive = false;
        let selectedTag = [];
        let selectedType = [];

        defaultActualInput.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter') return
            SaveDefQButton.click()
        })

        SaveDefQButton.addEventListener('click', () => {
            const text = get_search_input_text(divDefaultInput, defaultActualInput)
            save_to_localstorage(SaveDefQButton, STORAGE.defaultQueryKey, text) // CONFIG.defaultQuery
        })

        eyeContainer.addEventListener('click', () => {
            if (STATE.isPickerActive) {
                eyeContainer.style.backgroundColor = 'transparent';
                eyeText.style.display = 'none';
                eye.style.fill = 'white';
            } else {
                eyeContainer.style.backgroundColor = 'yellow';
                eyeText.style.display = 'block';
                eyeText.style.color = 'black';
                eye.style.fill = 'black';
            }

            if (STATE.isPickerActive) {
                selectedTag.forEach(tag => {
                    tag.style.border = ""
                })
                selectedType.forEach(type => {
                    type.style.border = ""
                })
                selectedTag = []; selectedType = [];
            }
            STATE.isPickerActive = !STATE.isPickerActive;
        })

        document.addEventListener('click', async (e) => {
            if (!STATE.isPickerActive) return

            const tag = e.target.closest('.BadgeBlue');
            if (tag) {
                e.preventDefault();
                if (tag.style.border === "") {
                    tag.style.border = "solid yellow"
                    selectedTag.push(tag)
                }
                else if (tag.style.border === "solid yellow") {
                    tag.style.border = ""
                    selectedTag = selectedTag.filter(item => item !== tag);
                }
            }
        });
        document.addEventListener('click', async (e) => {
            if (!STATE.isPickerActive) return

            const type = e.target.closest('table tr td a');
            if (type) {
                e.preventDefault();
                if (type.style.border === "") {
                    type.style.border = "solid yellow"
                    selectedType.push(type)
                }
                else if (type.style.border === "solid yellow") {
                    type.style.border = ""
                    selectedType = selectedType.filter(item => item !== type);
                }
            }
        });

        add.addEventListener('click', () => {
            if (selectedTag.length) {
                selectedTag.forEach(tag => {
                    const tagText = extract_tag(tag.href);
                    if (!CONFIG.defaultQuery.includes(tagText)) {
                        tag_to_badge(tagText, divDefaultInput, defaultActualInput)
                    }
                })
                SaveDefQButton.click()
            } 
            if (selectedType.length) {
                selectedType.forEach(type => {
                    const typeText = extract_table(type);
                    if (!CONFIG.defaultQuery.includes(typeText)) {
                        tag_to_badge(typeText, divDefaultInput, defaultActualInput)
                    }
                })
                SaveDefQButton.click()
            }
        });
        ex.addEventListener('click', () => {
            if (selectedTag) {
                selectedTag.forEach(tag => {
                    const tagText = extract_tag(tag.href);
                    const excludeText = `-${tagText}`;
                    if (!CONFIG.defaultQuery.includes(excludeText)) {
                        tag_to_badge(excludeText, divDefaultInput, defaultActualInput)
                    }
                })
                SaveDefQButton.click()
            } 
            if (selectedType) {
                selectedType.forEach(type => {
                    const typeText = extract_table(type);
                    const excludeText = `-${typeText}`;
                    if (!CONFIG.defaultQuery.includes(excludeText)) {
                        tag_to_badge(excludeText, divDefaultInput, defaultActualInput)
                    }
                })
                SaveDefQButton.click()
            }
        });
    }

    function suggestion_listener(actualInput, divSuggestionC, divSearchInput) {
        let requestCounter = 0;

        actualInput.addEventListener('input', debounce(async function() {
            document.querySelectorAll("div.SuggestionContainer").forEach(elem => {
                if (elem !== divSuggestionC) {
                    elem.style.display = 'none';
                }
            });
            divSuggestionC.textContent = "";
            const text = actualInput.value;

            const currentRequestId = ++requestCounter;

            await get_search_suggestion(text, divSuggestionC, divSearchInput, actualInput);

            if (currentRequestId !== requestCounter) return;

            if (divSuggestionC.children.length > 0) {
                divSuggestionC.style.display = 'block';
            } else {
                divSuggestionC.style.display = 'none';
            }

        }, CONFIG.debounceTime));
    }

    function get_preview_image(fileDict = {}) {
        function get_hitomi_url(image, dir, ext, base = "tn") {
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
        if (!Object.keys(fileDict).length) return

        const format = STATE.avif ? "avif" : "webp";
        const dir = STATE.avif ? "avifsmalltn" : "webpsmalltn";
        const url = get_hitomi_url(fileDict, dir, format);
        return url
    }

    function pic_preview_listener(pic, id, idsObj) {
        async function updateDisplay(index, pic, files) {
            function prefetchImage(url) {
                if (!url) return;
                const img = new Image();
                img.decoding = "async";
                img.loading = "eager";
                img.src = url;
            }

            if (index < 0 || index >= files.length) return;

            const file = files[index];
            const picture = pic.querySelector("picture")
            const img = document.createElement("img")

            picture.innerHTML = ""
            picture.appendChild(img)

            const url = get_preview_image(file);
            if (url) img.src = url;

            [1, -1].forEach(offset => {
                const nextIdx = (index + offset + files.length) % files.length;
                const nextFile = files[nextIdx];
                const nextUrl = get_preview_image(nextFile);
                prefetchImage(nextUrl);
            });
        }

        let currentIndex = 0;
        pic.addEventListener('click', async (e) => {
            e.preventDefault();

            const files = idsObj[id].previewFiles;
            const info = await fetch_id_js(id)
            const step = Math.round(info.files.length / CONFIG.picPreviewPerPage)
            for (let i = 0; i < info.files.length; i += step) {
                files.push(info.files[i])
            }

            if (!files.length) return;

            const rect = pic.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            if (x < rect.width / 2) {
                currentIndex = (currentIndex - 1 + files.length) % files.length;
            } else {
                currentIndex = (currentIndex + 1) % files.length;
            }
            
            updateDisplay(currentIndex, pic, files);
        });
    }

    function custom_viewer_listener(aTitle, id) {
        if (!CONFIG.useCustomViewer) return;

        aTitle.addEventListener('click', async (e) => {
            e.preventDefault();

            const info = await fetch_id_js(id);
            setupViewer(info);
        });
    }

    function setupViewer(info) {
        document.documentElement.innerHTML = html.viewer;

        const divImageContainer = document.querySelector("div.ImageContainer");
        const divPages = document.querySelectorAll("div.Page");
        
        const { files } = info;
        const step = CONFIG.viewerImagePerPage;

        for (let i = 0; i < files.length; i += step) {
            const pageNum = Math.floor(i / step) + 1;
            const batch = files.slice(i, i + step);

            divPages.forEach(divPage => {
                const btn = document.createElement("button");
                btn.textContent = pageNum;
                btn.type = "button";

                btn.addEventListener("click", () => {
                    updateActiveButtonState(divPages, pageNum);
                    renderImages(divImageContainer, batch);
                });

                divPage.appendChild(btn);
            });
        }

        if (files.length > 0) {
            divPages.forEach(dp => dp.querySelector("button")?.click());
        }
    }

    function renderImages(container, files) {
        container.innerHTML = "";
        
        const fragment = document.createDocumentFragment();
        files.forEach(fileDict => {
            const img = document.createElement("img");
            img.className = "Image lazyload";
            img.dataset.src = get_preview_image(fileDict);
            fragment.appendChild(img);
        });
        container.appendChild(fragment);
    }

    function updateActiveButtonState(containers, activeText) {
        containers.forEach(container => {
            const buttons = container.querySelectorAll("button");
            buttons.forEach(btn => {
                if (btn.textContent === String(activeText)) {
                    btn.style.color = "var(--dimWhite)";
                    btn.style.fontWeight = 'bold';
                } else {
                    btn.style.color = "";
                    btn.style.fontWeight = '';
                }
            });
        });
    }

    function menu_and_search_listener(menuBtnOpen, sidebar, overlay, menuBtnClose, svgSearch, searchWindow) {
        menuBtnOpen.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });

        menuBtnClose.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        svgSearch.onclick = (e) => {
            e.stopPropagation();
            searchWindow.classList.toggle('active');
        };

        searchWindow.onclick = (e) => {
            e.stopPropagation();
        };


        window.onclick = (e) => {
            if (!searchWindow.contains(e.target) && !svgSearch.contains(e.target) && !STATE.isPickerActive) {
                searchWindow.classList.remove('active');
            }
        };
    }

    function type_listener(table) {
        table.addEventListener('click', (e) => {
            if (e.target.matches('a')) {
                e.preventDefault();
                const type = e.target.closest('a');
                const typeText = extract_table(type);
                tag_to_badge(typeText, divSearchInput, actualInput)
                if (!CONFIG.incrementTag) {
                    searchButton.click()
                }
            }
        });
    }

    function tag_listener(tag) {
        tag.addEventListener('click', async (e) => {
            e.preventDefault()
            const tagText = extract_tag(tag.href);
            tag_to_badge(tagText, divSearchInput, actualInput)
            if (!CONFIG.incrementTag) {
                searchButton.click()
            }
        })
    }

    function setting_listener() {
        function update_card_style() {
            document.documentElement.style.setProperty('--cardWidth', `${CONFIG.cardWidth}px`);
            document.documentElement.style.setProperty('--cardWrapWidth', `${CONFIG.cardWrapWidth}px`);
        };

        const default_config = {...CONFIG};
        divSetting.querySelectorAll('input').forEach(input => {
            const strValue = localStorage.getItem(input.id);
            if (strValue) {
                const value = JSON.parse(strValue);
                if (typeof value === 'boolean') {
                    input.checked = value;
                } else {
                    input.value = value;
                }
                CONFIG[input.id] = value;
            }
        });

        update_card_style();
        load_default_query();

        [STORAGE.cardWidthKey, STORAGE.cardWrapWidthKey].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    CONFIG[id] = e.target.value;
                    update_card_style();
                });
            }
        });

        saveSettingButton.addEventListener('click', () => {
            divDefaultInput.querySelectorAll('.TagContainer').forEach(el => el.remove());
            divSetting.querySelectorAll('input').forEach(input => {
                let value;
                if (input.type === "checkbox") {
                    value = input.checked;
                } else if (input.type === "range" || input.classList.contains('numeric')) {
                    value = input.value.length ? Number(input.value) : default_config[input.id];
                } else {
                    value = input.value.length ? input.value : default_config[input.id];
                }
                
                save_to_localstorage(saveSettingButton, input.id, value);
                CONFIG[input.id] = value;
            });
            update_card_style();
            load_default_query();
        });

        exportSettingButton.addEventListener('click', export_setting);
        importSettingButton.addEventListener('click', import_setting);
    }


    async function nozomi_load(options = {}) {
        const {
            url = `//ltn.${STATE.domain}/index-all.nozomi`,
            step = CONFIG.galleriesPerPage * 4,
            fetchAll = true,
            getRange = false,
        } = options;

        if (STATE.indexObj[url] && fetchAll) {
            return STATE.indexObj[url]
        } else {
            const bytesArray = await xhr_get(url, { step: step, fetchAll: fetchAll, getRange: getRange });
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

    function load_default_query() {
        CONFIG.defaultQuery.split(/\s+/).forEach(query => {
            tag_to_badge(query, divDefaultInput, defaultActualInput)
        })
    }

    async function check_avif_support() {
        try {
            const img = new Image();
            img.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAFwAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAH21kYXQSAAoFGAAGBCAyDBQAAwwwxAAAeUut9g==";
            await img.decode();
            STATE.avif = true;
        } catch {
            STATE.avif = false;
        }
    }

    function export_setting() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!Object.values(STORAGE).includes(key)) continue

            const value = localStorage.getItem(key);
            data[key] = JSON.parse(value);
        }
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "setting.json";
        a.click();

        URL.revokeObjectURL(a.href);
    }

    async function import_setting() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
       
        input.onchange = async () => {
            const file = input.files[0];
            const data = JSON.parse(await file.text());
         
            for (const key in data) {
                localStorage.setItem(key, JSON.stringify(data[key]));
            }
         
            location.reload()
        };
       
        input.click();
    }

    const STORAGE = {
        defaultQueryKey: "defaultQuery",
        infScrollKey: "infScroll",
        incrementTagKey: "incrementTag",
        fetchPageNumKey: "fetchPageNum",
        minPageKey: "minPage",
        maxPageKey: "maxPage",
        trialLimitKey: "trialLimit",
        galleriesPerPageKey: "galleriesPerPage",
        debounceTimeKey: "debounceTime",
        picPreviewPerPageKey: "picPreviewPerPage",
        cardWidthKey: "cardWidth",
        cardWrapWidthKey: "cardWrapWidth",
    }

    const CONFIG = {
        infScroll: true,
        incrementTag: false,
        fetchPageNum: false,
        useCustomViewer: true,
        minPage: 0,
        maxPage: 0,
        trialLimit: 5,
        galleriesPerPage: 25,
        viewerImagePerPage: 50,
        debounceTime: 300,
        picPreviewPerPage: 5,
        cardWidth: 220,
        cardWrapWidth: 190,
        defaultQuery: ""
    };

    const STATE = {
        fetching: false,
        avif: false,
        isPickerActive: false,
        fetchCount: 0,
        resultsCount: 0,
        defaultRange: 0,
        trial: 0,
        domain: "gold-usergeneratedcontent.net",
        orderBy: "",
        term: "",
        indexObj: {},
        randomUsed: new Set(),
        gg: new Function()
    };

    const html = {
        gallery: `
        <!DOCTYPE html>
        <html>
        <head>
            <title>hitomi</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <style>
                :root {--radius: 0.375rem; --white: rgb(211, 211, 211); --dimWhite: rgb(140, 140, 140); --grey: #6c757d; --blue: #0d6efd; --green: #28a745; --red: #dc3545; --btnGreen: #198754; --btnRed: #a13643; --cardWidth: 220px; --cardWrapWidth: 190px;}

                body {margin: 0; background-color: hsl(0, 0%, 16%);}
                table tr td a {display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; word-break: break-all; color: var(--dimWhite); text-decoration: none;}
                strong {color: cyan;}
                span svg {color: var(--white); margin-right: 8px; cursor: pointer;}

                input, svg {color: var(--white); cursor: pointer;}
                .BtnGreen, .BtnGreenOut, .BtnRed {border-radius: var(--radius);}
                .BtnGreen, .BtnGreenOut:hover, .BtnRed {color: var(--white);}
                .BadgeBlue, .BadgeGreen, .BadgeGrey, .BadgeRed {border-radius: var(--radius); padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700;}
                .BadgeBlue, .BadgeGreen, .BadgeRed {display: flex; align-items: center; white-space: nowrap;}
                .InputContainer, .NavbarContainer {display: flex; justify-content: space-between}
                .PickerContainer, .InputContainer {display: flex; justify-content: space-between; width: 100%;}
                .SearchInput {
                    display: flex;
                    width: 100%;
                    height: 40px;
                    overflow: auto;
                    background-color: hsl(0, 0%, 16%);
                    border: 1px solid hsl(0, 0%, 25%);
                    border-radius: var(--radius);
                    color: var(--white);
                    scrollbar-width: thin;
                }

                .CardTableContainer table {color: var(--dimWhite);}
                .CardTagsContainer a {margin-right: 5%; text-decoration: none; color: var(--white);}
                .Card img {width: 100%; height: 220px; object-fit: cover; border-radius: var(--radius);}
                .EyeContainer a {white-space: nowrap; display: none;}
                .NavbarContainer a img {width: 80%;}
                .Setting label {color: var(--white);}
                .PageContainer a {padding: 5px; cursor: pointer;}

                .Suggestion:hover, .SuggestionFocus {background-color: hsl(0, 0%, 10%); cursor: pointer;}
                input:focus {outline: none;}
                .BtnGreenOut:hover {background-color: var(--btnGreen);}

                .BtnGreenOut {color: var(--btnGreen); background-color: transparent; border: 1px solid var(--btnGreen);}
                .BtnGreen {background-color: var(--btnGreen); border: 1px solid var(--btnGreen);}
                .BtnRed {background-color: var(--btnRed); border: 1px solid var(--btnRed);}

                .BadgeGrey {background-color: var(--grey);}
                .BadgeBlue {background-color: var(--blue);}
                .BadgeGreen {background-color: var(--green);}
                .BadgeRed {background-color: var(--red);}

                .Container {display: flex; flex-direction: column; justify-content: center;}
                .NavbarContainer {
                  display: flex;
                  flex-direction: row;
                  width: 100%;
                  height: 50px;
                  background-color: hsl(0, 0%, 19%);
                  align-items: center;
                  justify-content: space-between;
                  padding: 0px 15px 0px 10px;
                  box-sizing: border-box;
                  gap: 20px;
                  position: sticky;
                  top: 0;
                  z-index: 1;
                }

                .InputContainer {flex: 1; flex-direction: row;}
                .PickerContainer {align-items: center; height: 35px;}
                .BtnContainer {display: flex; height: 100%;}
                .BtnContainer button{width: 40px;}
                .CardContainer {display: flex; flex-wrap: wrap; justify-content: space-around; color: var(--white); background-color: hsl(0, 0%, 10%); border-radius: var(--radius); gap: 20px; margin: 10px;}
                .CardTableContainer {display: flex; flex-direction: column; align-items: center; overflow-x: auto; align-self: start;}
                .CardTagsContainer {scrollbar-width: thin; display: flex; overflow-x: auto; white-space: nowrap; background-color: hsl(0, 0%, 10%); width: 100%; scrollbar-color: darkgray transparent; margin-left: 10px; padding-right: 40px; box-sizing: border-box;}
                .PageContainer {display: flex; justify-content: center; color: var(--white); margin: 10px;}
                .SuggestionContainer {display: none; margin: 0; position: absolute; z-index: 1; background-color: hsl(0, 0%, 13%); color: var(--white); border: 1px solid hsl(0, 0%, 18%); border-radius: var(--radius);}
                .EyeContainer {display: flex; background-color: transparent; border-radius: var(--radius); padding: 5px; gap: 5px;}
                .InfoContainer {margin: 0 0 20px 10px}
                .TagContainer {display: flex; align-items: center;}
                .ContentContainer {background-color: hsl(0, 0%, 13%); margin: 3% 3% auto 3%; border-radius: var(--radius); overflow: hidden;}
                .BottomContainer {display: -webkit-box;}
                .MastheadContainer {display: flex; align-items: center; gap: 10px;}

                .Sidebar {display: flex; flex-direction: column; position: fixed; top: 0; left: -260px; width: 240px; height: 100%; background-color: hsl(0, 0%, 10%); z-index: 2; transition: left 0.3s ease; border-right: 1px solid hsl(0, 0%, 15%); padding: 10px; gap: 15px;}
                .Sidebar.active {left: 0; box-shadow: 5px 0 15px rgba(0,0,0,0.5);}
                .SidebarOverlay {position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); display: none; z-index: 1;}
                .SidebarOverlay.active {display: block;}

                .SearchFloatingWindow {
                    position: fixed;
                    top: 50px;
                    width: 310px;
                    background-color: hsl(0, 0%, 19%);
                    border: 1px solid hsl(0, 0%, 25%);
                    border-radius: var(--radius);
                    padding: 5px;
                    z-index: 1;
                    visibility: hidden;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), visibility 0.3s;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                    right: 10px;
                }

                .SearchFloatingWindow.active {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .eye {margin-left: 1%;}
                .CardTitle {font-weight: bold; text-decoration: none; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; word-break: break-all; color: var(--white);}
                .page {width: fit-content;}
                .Card {display: flex; flex-direction: column; flex: 1 1 var(--cardWrapWidth); max-width: var(--cardWidth); background-color: hsl(0, 0%, 14%); overflow: hidden; justify-content: space-between; border-radius: var(--radius); border:1px solid hsl(0, 0%, 19%); padding: 5px; gap: 10px;}
                .Suggestion {display: flex; white-space: nowrap; padding: 3%; border-bottom: 1px solid hsl(0, 0%, 18%);}
                .bi-list {color: var(--dimWhite); width: 32px; height: 32px; cursor: pointer;}
                .search-icon {width: 32px; cursor: pointer; fill: hsl(0, 0%, 25%);}
                .Setting {display: flex; flex-direction: column; gap: 10px; margin-top: 30px;}

                #SearchButton {height: 40px;}
                #SaveDefQButton {margin-left: 5px; white-space: nowrap;}
                #SaveSettingButton, #ExportSettingButton, #ImportSettingButton {height:45px; white-space: nowrap;}
                #ExportSettingButton, #ImportSettingButton {width: 48%;}
                
                .SuggestionText {flex: 1; overflow: hidden; text-overflow: ellipsis;}
                .SuggestionArea {color: var(--dimWhite);}

                .ActualInput {color: var(--white); background-color: transparent; border: none; font-weight: bold; overflow: visible;}
                .BetweenInput {background-color: transparent; border: none; width: 1px;}

                .ResultsCount {color: var(--dimWhite);}
                #scrollSentinel {height: 1px}
            </style>
        </head>
        <body>
            <div class="SidebarOverlay"></div>
            <div class="Sidebar">
                <div class="MastheadContainer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" id="bi-list-close" class="bi bi-list" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
                    </svg>
                    <a href="//hitomi.la/robots.txt">
                        <img src="//ltn.gold-usergeneratedcontent.net/logo.png"></img>
                    </a>
                </div>

                <div class="Setting">
                    <label><input type="checkbox" id="${STORAGE.infScrollKey}"> infScroll</label>
                    <label><input type="checkbox" id="${STORAGE.incrementTagKey}"> incrementTag</label>
                    <label><input type="checkbox" id="${STORAGE.fetchPageNumKey}"> fetchPageNum</label>

                    <input class="SearchInput numeric" type="text" inputmode="numeric" id="${STORAGE.cardWidthKey}" placeholder="cardWidth: ${CONFIG.cardWidth}">
                    <input class="SearchInput numeric" type="text" inputmode="numeric" id="${STORAGE.cardWrapWidthKey}" placeholder="cardWrapWidth: ${CONFIG.cardWrapWidth}">
                    <input class="SearchInput numeric" type="text" inputmode="numeric" id="${STORAGE.minPageKey}" placeholder="minPage: ${CONFIG.minPage}">
                    <input class="SearchInput numeric" type="text" inputmode="numeric" id="${STORAGE.maxPageKey}" placeholder="maxPage: ${CONFIG.maxPage}">
                    <input class="SearchInput numeric" type="text" inputmode="numeric" id="${STORAGE.trialLimitKey}" placeholder="trialLimit: ${CONFIG.trialLimit}">
                    <input class="SearchInput numeric" type="text" inputmode="numeric" id="${STORAGE.galleriesPerPageKey}" placeholder="galleriesPerPage: ${CONFIG.galleriesPerPage}">
                    <input class="SearchInput numeric" type="text" inputmode="numeric" id="${STORAGE.debounceTimeKey}" placeholder="debounceTime: ${CONFIG.debounceTime}">
                    <input class="SearchInput numeric" type="text" inputmode="numeric" id="${STORAGE.picPreviewPerPageKey}" placeholder="picPreviewPerPage: ${CONFIG.picPreviewPerPage}">
                    <input class="SearchInput" type="text" id="${STORAGE.defaultQueryKey}" placeholder="defaultQuery: ${CONFIG.defaultQuery}">
                </div>
                <button class="BtnGreenOut" id="SaveSettingButton" type="button">Save</button>
                <div>
                    <button class="BtnGreenOut" id="ExportSettingButton" type="button">export</button>
                    <button class="BtnGreenOut" id="ImportSettingButton" type="button">import</button>
                </div>
            </div>
            <div class="SearchFloatingWindow">
                <div id="Search" class="InputContainer">
                    <div id="Search" class="SearchInput">
                        <input id="Search"class="ActualInput" type="text">
                    </div>
                    <div id="Search" class="SuggestionContainer"></div>
                </div>
                <div id="Default"class="InputContainer">
                    <div id="Default" class="SearchInput">
                        <input id="Default" class="ActualInput" type="text">
                    </div>
                    <button class="BtnGreenOut" id="SaveDefQButton" type="button">Save</button>
                    <div id="Default"class="SuggestionContainer"></div>
                </div>
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
                <button class="BtnGreenOut" id="SearchButton" type="button">Search</button>
            </div>
            <div class="Container">
                <div class="NavbarContainer">
                    <div class="MastheadContainer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" id="bi-list-open" class="bi bi-list" viewBox="0 0 16 16">
                          <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
                        </svg>
                        <a href="//hitomi.la/robots.txt">
                            <img src="//ltn.gold-usergeneratedcontent.net/logo.png"></img>
                        </a>
                    </div>
                    <svg class="search-icon" viewBox="-2.4 -2.4 28.80 28.80" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="14" class="search-bg" />
                        <g fill="currentColor">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z"></path>
                        </g>
                    </svg>
                </div>
                <div class="ContentContainer">
                    <div class="PageContainer"></div>
                    <div class="InfoContainer">
                        <a class="ResultsCount"></a>
                    </div>
                    <div class="CardContainer"></div>
                    <div class="PageContainer"></div>
                </div>
                <div id="scrollSentinel"></div>
            </div>
        </body>
        </html>
        `,
        viewer: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>viewer</title>
            <style>
                :root {--radius: 0.375rem; --white: rgb(211, 211, 211); --dimWhite: rgb(140, 140, 140); --grey: #6c757d; --blue: #0d6efd; --green: #28a745; --red: #dc3545; --btnGreen: #198754; --btnRed: #a13643;}

                body {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    background-color: hsl(0, 0%, 10%);
                }
                tr td {
                    color: var(--dimWhite);
                }
                a {
                    text-decoration: none;
                    color: var(--white);
                }
                .HeaderContainer {
                    display: flex;
                    background-color: hsl(0, 0%, 13%);
                    gap: 5px;
                    padding: 5px;
                    border-radius: var(--radius);
                }
                .ImageContainer {
                    display: flex;
                    flex-wrap: wrap;
                    background-color: hsl(0, 0%, 13%);
                    gap: 10px;
                    justify-content: space-around;
                    padding: 20px 5px 5px 5px;
                    border-radius: var(--radius);
                }
                .RelatedContainer {
                    display: flex;
                    flex-wrap: wrap;
                    background-color: hsl(0, 0%, 13%);
                    gap: 10px;
                    justify-content: space-around;
                    padding: 20px 5px 5px 5px;
                    border-radius: var(--radius);
                }
                .HeaderInfoContainer {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }
                .CardTagsContainer {scrollbar-width: thin; display: flex; overflow-x: auto; white-space: nowrap; background-color: hsl(0, 0%, 19%); width: 100%; scrollbar-color: darkgray transparent; padding-right: 40px; box-sizing: border-box;}

                .Title {
                    background-color: hsl(0, 0%, 16%);
                    width: 100%;
                    color: var(--white);
                    font-size: x-large;
                    border-radius: var(--radius) var(--radius) 0 0 ;
                    padding: 5px;
                    box-sizing: border-box;
                    font-weight: bold;
                }
                .Artist {
                    background-color: hsl(0, 0%, 19%);
                    width: 100%;
                    color: var(--dimWhite);
                    border-radius: 0 0 var(--radius) var(--radius);
                    padding: 3px;
                    box-sizing: border-box;
                }
                .Info {
                    padding: 3px;
                }
                .Label {
                    width: 100px;
                    font-weight: bold;
                    color: var(--white);
                }
                .Thumbnail {
                    border-radius: var(--radius);
                }
                .Image {
                    width: 100px;
                    max-width: 130px;
                    height: 150px;
                    flex: 1 1;
                    border-radius: var(--radius);
                }
                .Card {
                    display: flex;
                    background-color: hsl(0, 0%, 16%);
                    padding: 5px;
                    border-radius: var(--radius);
                    flex: 1 1;
                }
                .CardTitle {
                    color: var(--white);
                    font-weight: bold;
                    font-size: large;
                }
                .CardImage {
                    width: 140px;
                    border-radius: var(--radius);
                }
                .CardContents {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    padding: 5px;
                    justify-content: space-around;
                    width: 100%;
                }
                .Header {
                    font-size: x-large;
                    font-weight: bold;
                    margin: 40px 0 10px 0;
                }

                .BadgeBlue, .BadgeGreen, .BadgeGrey, .BadgeRed {border-radius: var(--radius); padding: 0.35em 0.65em; font-size: 0.75em; font-weight: 700;}
                .BadgeGrey {background-color: var(--grey);}
                .BadgeBlue {background-color: var(--blue);}
                .page {width: fit-content;}
            </style>
        </head>
        <body>
            <div class="HeaderContainer">
                <img class="Thumbnail" src="https://picsum.photos/id/12/200/300" loading="lazy">

                <div class="HeaderInfoContainer">
                    <a class="Title">test</a>
                    <a class="Artist">jhon Doe</a>
                    <div class="Info">
                        <table>
                            <tr><td class="Label">Group:</td><td>xyz</td></tr>
                            <tr><td class="Label">Type:</td><td>Doujinshi</td></tr>
                            <tr><td class="Label">Language:</td><td>日本語</td></tr>
                            <tr><td class="Label">Series:</td><td>something</td></tr>
                        </table>
                    </div>
                </div>
            </div>
            <div class="Page"></div>
            <div class="ImageContainer"></div>
            <a class="Header">Related Contents</a>
            <div class="RelatedContainer">
                <div class="Card">
                    <img class="CardImage" src="https://picsum.photos/id/1/200/300" loading="lazy">
                    <div class="CardContents">
                        <a class="CardTitle">HaneRu</a>
                        <div class="CardTableContainer">
                            <table>
                                <tr><td>language</td><td>:</td><td>日本語</td></tr>
                                <tr><td>type</td><td>:</td><td>doujinshi</td></tr>
                                <tr><td>artist</td><td>:</td><td>N/A</td></tr>
                                <tr><td>series</td><td>:</td><td>N/A</td></tr>
                            </table>
                        </div>
                        <a class="page BadgeGrey">N/A</a>
                        <div class="CardTagsContainer">
                            <a class="BadgeBlue">rewrite</a>
                        </div>
                    </div>
                </div>
                <div class="Card">
                    <img class="CardImage" src="https://picsum.photos/id/1/200/300" loading="lazy">
                    <div class="CardContents">
                        <a class="CardTitle">HaneRu</a>
                        <div class="CardTableContainer">
                            <table>
                                <tr><td>language</td><td>:</td><td>日本語</td></tr>
                                <tr><td>type</td><td>:</td><td>doujinshi</td></tr>
                                <tr><td>artist</td><td>:</td><td>N/A</td></tr>
                                <tr><td>series</td><td>:</td><td>N/A</td></tr>
                            </table>
                        </div>
                        <a class="page BadgeGrey">N/A</a>
                        <div class="CardTagsContainer">
                            <a class="BadgeBlue">rewrite</a>
                        </div>
                    </div>
                </div>
                <div class="Card">
                    <img class="CardImage" src="https://picsum.photos/id/1/200/300" loading="lazy">
                    <div class="CardContents">
                        <a class="CardTitle">HaneRu</a>
                        <div class="CardTableContainer">
                            <table>
                                <tr><td>language</td><td>:</td><td>日本語</td></tr>
                                <tr><td>type</td><td>:</td><td>doujinshi</td></tr>
                                <tr><td>artist</td><td>:</td><td>N/A</td></tr>
                                <tr><td>series</td><td>:</td><td>N/A</td></tr>
                            </table>
                        </div>
                        <a class="page BadgeGrey">N/A</a>
                        <div class="CardTagsContainer">
                            <a class="BadgeBlue">rewrite</a>
                        </div>
                    </div>
                </div>
                <div class="Card">
                    <img class="CardImage" src="https://picsum.photos/id/1/200/300" loading="lazy">
                    <div class="CardContents">
                        <a class="CardTitle">HaneRu</a>
                        <div class="CardTableContainer">
                            <table>
                                <tr><td>language</td><td>:</td><td>日本語</td></tr>
                                <tr><td>type</td><td>:</td><td>doujinshi</td></tr>
                                <tr><td>artist</td><td>:</td><td>N/A</td></tr>
                                <tr><td>series</td><td>:</td><td>N/A</td></tr>
                            </table>
                        </div>
                        <a class="page BadgeGrey">N/A</a>
                        <div class="CardTagsContainer">
                            <a class="BadgeBlue">rewrite</a>
                        </div>
                    </div>
                </div>
                <div class="Card">
                    <img class="CardImage" src="https://picsum.photos/id/1/200/300" loading="lazy">
                    <div class="CardContents">
                        <a class="CardTitle">HaneRu</a>
                        <div class="CardTableContainer">
                            <table>
                                <tr><td>language</td><td>:</td><td>日本語</td></tr>
                                <tr><td>type</td><td>:</td><td>doujinshi</td></tr>
                                <tr><td>artist</td><td>:</td><td>N/A</td></tr>
                                <tr><td>series</td><td>:</td><td>N/A</td></tr>
                            </table>
                        </div>
                        <a class="page BadgeGrey">N/A</a>
                        <div class="CardTagsContainer">
                            <a class="BadgeBlue">rewrite</a>
                        </div>
                    </div>
                </div>
                <div class="Card">
                    <img class="CardImage" src="https://picsum.photos/id/1/200/300" loading="lazy">
                    <div class="CardContents">
                        <a class="CardTitle">HaneRu</a>
                        <div class="CardTableContainer">
                            <table>
                                <tr><td>language</td><td>:</td><td>日本語</td></tr>
                                <tr><td>type</td><td>:</td><td>doujinshi</td></tr>
                                <tr><td>artist</td><td>:</td><td>N/A</td></tr>
                                <tr><td>series</td><td>:</td><td>N/A</td></tr>
                            </table>
                        </div>
                        <a class="page BadgeGrey">N/A</a>
                        <div class="CardTagsContainer">
                            <a class="BadgeBlue">rewrite</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="Page"></div>
        </body>
        </html>
        `,
    }

    document.documentElement.innerHTML = html.gallery;

    const menuBtnOpen = document.querySelector('#bi-list-open');
    const menuBtnClose = document.querySelector('#bi-list-close');
    const sidebar = document.querySelector('.Sidebar');
    const overlay = document.querySelector('.SidebarOverlay');
    const svgSearch = document.querySelector('.search-icon')
    const searchWindow = document.querySelector(".SearchFloatingWindow")
    const divSearchInput = document.querySelector("div.SearchInput#Search");
    const divSetting= document.querySelector("div.Setting");
    const divDefaultInput = document.querySelector("div.SearchInput#Default");
    const actualInput = document.querySelector("input.ActualInput#Search")
    const defaultActualInput = document.querySelector("input.ActualInput#Default")
    const divInputC = document.querySelector("div.InputContainer#Search")
    const divDefaultInputC = document.querySelector("div.InputContainer#Default");
    const divSuggestionC = document.querySelector("div.SuggestionContainer#Search")
    const divDefaultSuggestionC = document.querySelector("div.SuggestionContainer#Default")
    const divCardC = document.querySelector("div.CardContainer")
    const searchButton = document.querySelector("#SearchButton")
    const defaultSaveButton = document.querySelector("#SaveDefQButton")
    const saveSettingButton = document.querySelector("#SaveSettingButton")
    const exportSettingButton = document.querySelector("#ExportSettingButton")
    const importSettingButton = document.querySelector("#ImportSettingButton")
    const aResCount = document.querySelector("a.ResultsCount")
    const eyeContainer = document.querySelector("div.EyeContainer")
    const svgEye = document.querySelector("div.EyeContainer .eye")
    const eyeText = document.querySelector("div.EyeContainer a")
    const buttonAdd = document.querySelector("button.BtnAdd")
    const buttonEx = document.querySelector("button.BtnExclude")
    const optionOrderByDropdown = document.querySelectorAll("#orderbydropdown option")
    const pageContainers = document.querySelectorAll('.PageContainer');

    if (CONFIG.picPreviewPerPage >= 1) await fetch_gg()

    await check_avif_support()
    setting_listener()
    search_post_process(divSearchInput, actualInput)
    await load(aResCount, divCardC) // STATE.fetching, STATE.resultsCount

    menu_and_search_listener(menuBtnOpen, sidebar, overlay, menuBtnClose, svgSearch, searchWindow)
    search_tag_listener(divSearchInput, actualInput, divInputC, divSuggestionC, defaultSaveButton)
    search_tag_listener(divDefaultInput, defaultActualInput, divDefaultInputC, divDefaultSuggestionC, defaultSaveButton, true)
    suggestion_listener(actualInput, divSuggestionC, divSearchInput)
    suggestion_listener(defaultActualInput, divDefaultSuggestionC, divDefaultInput)
    order_listener(optionOrderByDropdown) // STATE.orderBy
    search_listener(searchButton, divSearchInput, divSuggestionC, actualInput, aResCount, divCardC)
    picker_listener(svgEye, buttonAdd, buttonEx, divDefaultInput, defaultActualInput, eyeText, eyeContainer, defaultSaveButton)

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
    document.querySelectorAll(".numeric").forEach(input => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "");
        });
    });
})();
