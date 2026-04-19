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
                return list
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

            const tableDict = {}
            tableDict.language = create_table("language", language, table)
            tableDict.type = create_table("type", type, table)
            tableDict.artist = create_table("artist", artistList, table)
            tableDict.series = create_table("series", seriesList, table)

            pic_preview_listener(aPic, id, idsObj)
            custom_viewer_listener(aCardTitle, picture, tableDict, id)

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
            if (orderby.includes(':')) {
                const [sort, key] = orderby.split(':');
                return `//ltn.${STATE.domain}/${prefix}/${area}/${sort}/${key}/${tag}-${language}.nozomi`;
            }
            return `//ltn.${STATE.domain}/${prefix}/${area}/${tag}-${language}.nozomi`; 
        }

        async function get_galleryids_for_keyword(term) {
            const key = new Uint8Array(sha256.array(term).slice(0, 4));
            const versionUrl = `//ltn.${STATE.domain}/galleriesindex/version?_=${Date.now()}.index`;

            if (!(STATE.indexObj[versionUrl] && STATE.indexObj[versionUrl].length)) {
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

        async function fetch_unit_ids(term) {
            if (term.includes('|')) {
                const subTerms = term.split('|').filter(t => t.length > 0);
                const idSets = await Promise.all(subTerms.map(t => fetch_term_data(t)));
                const union = new Set();
                for (const ids of idSets) {
                    for (const id of ids) union.add(id);
                }
                return Array.from(union);
            } else {
                return await fetch_term_data(term);
            }
        }

        if (STATE.indexObj[text] && STATE.indexObj[text].length) {
            const res = STATE.indexObj[text]
            const start = STATE.fetchCount * CONFIG.galleriesPerPage;
            return res.slice(start, start + CONFIG.galleriesPerPage);
        }

        const terms = decodeURIComponent(text).replace(/^\?/, '').split(/\s+/);
        const posTerms = [], negTerms = []
        for (let idx = 0; idx < terms.length; idx++) {
            let term = ubar2space(terms[idx]);

            if (term === '|') {
                if (idx > 0 && idx + 1 < terms.length) {
                    const prev = ubar2space(terms[idx - 1]);
                    const next = ubar2space(terms[idx + 1]);
                    const combined = `${prev}|${next}`;
                 
                    if (posTerms.length && posTerms[posTerms.length - 1] === prev) posTerms.pop();
                    if (negTerms.length && negTerms[negTerms.length - 1] === prev) negTerms.pop();
                 
                    posTerms.push(combined);
                    idx++;
                }
                continue;
            }

            if (term.startsWith('-')) negTerms.push(term.slice(1));
            else posTerms.push(term);
        }

        let results = null
        if (posTerms.length === 0) {
            results = await nozomi_load({ url: `//ltn.${STATE.domain}/n/index-all.nozomi` });
        } else {
            for (let i = 0; i < posTerms.length; i++) {
                const ids = await fetch_unit_ids(posTerms[i]);
                if (i === 0) {
                    results = ids;
                } else {
                    const idSet = new Set(ids);
                    results = results.filter(id => idSet.has(id));
                }
                if (results.length === 0) break;
            }
        }

        for (const term of negTerms) {
            if (results.length === 0) break;
            const ids = await fetch_unit_ids(term);
            const idSet = new Set(ids);
            results = results.filter(id => !idSet.has(id));
        }

        STATE.resultsCount = results.length;
        const isRandom = STATE.orderBy === "random";
        
        if (isRandom) {
            return random_access(results);
        } else {
            results.sort((a, b) => b - a);
        }

        STATE.indexObj[text] = results

        const start = STATE.fetchCount * CONFIG.galleriesPerPage;
        return results.slice(start, start + CONFIG.galleriesPerPage);
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
        let newInputList = [], negList = [], posList = [], isNegative = false, isOr = false
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

        let lastInput = newInputList.at(-1);
        if (lastInput.includes("|")) isOr = true; lastInput = lastInput.replace("|", "")
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
                    if (isOr) {
                        tag_to_badge("|", divSearchInput, actualInput, true)
                    }
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
                            if (STATE.fetchCount + i >= 1 && STATE.fetchCount + i <= maxPage) {
                                pages.push(STATE.fetchCount + i);
                            }
                        }
                    } else {
                        for (let i = 0; i <= range; i++) {
                            if (STATE.fetchCount + i >= maxPage) break
                            if (STATE.fetchCount + i >= 1 && STATE.fetchCount + i <= maxPage) {
                                pages.push(STATE.fetchCount + i);
                            }
                        }
                    }

                    pages.push('...')
                    pages.push(maxPage)
                } else {
                    pages.push(1)
                    pages.push('...')
                    for (let i = -range; i <= 0; i++) {
                        if (STATE.fetchCount + i >= 1 && STATE.fetchCount + i <= maxPage) {
                            pages.push(STATE.fetchCount + i);
                        }
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

    function get_preview_image(fileDict = {}) {
        if (!Object.keys(fileDict).length) return

        const format = STATE.avif ? "avif" : "webp";
        const dir = STATE.avif ? "avifsmalltn" : "webpsmalltn";
        const url = get_hitomi_url(fileDict, dir, format);
        return url
    }

    function createLinksHtml(dict, options = {}) {
        const { 
            className = '', 
        } = options;

        if (!dict || dict.length === 0) {
            return '<a>N/A</a>';
        }

        return dict.map(item => {
            const text = item.text
            const href = item.url
            const classAttr = className ? ` class="${className}"` : '';
            return `<a${classAttr} href="${href}">${text}</a>`;
        }).join(', ');
    }

    function appendTableRow(table, label, contentHtml, containerClass = '') {
        const finalContent = containerClass 
            ? `<div class="${containerClass}">${contentHtml}</div>` 
            : contentHtml;

        table.insertAdjacentHTML(
            'beforeend',
            `<tr><td class="Label">${label}:</td><td>${finalContent}</td></tr>`
        );
    }

    function generate_tags(tags, container) {
        if (tags.length === 0) {
            const aTag = document.createElement('a');
            aTag.className = 'BadgeBlue';
            aTag.textContent = 'N/A';
            container.appendChild(aTag);
        } else {
            tags.forEach(tag => {
                if (tag.textContent === '...') return;

                const aTag = document.createElement('a');
                aTag.className = 'BadgeBlue';
                aTag.textContent = tag.text

                container.appendChild(aTag);
            });
        };
    };

    function custom_viewer_listener(aTitle, picture, tableDict, id) {
        async function setupViewer(info) {
            document.documentElement.innerHTML = html.viewer;

            const divImageContainer = document.querySelector("div.ImageContainer");
            const divHeaderInfoContainer = document.querySelector("div.HeaderInfoContainer");
            const divInfo = document.querySelector("div.Info");
            const aArtist = document.querySelector("a.Artist");
            const _aTitle = document.querySelector("a.Title");
            const divHeaderContainer = document.querySelector("div.HeaderContainer");
            const divRelatedContainer = document.querySelector("div.RelatedContainer");
            const divPages = document.querySelectorAll("div.Page");

            picture.className = "Thumbnail"
            divHeaderContainer.insertBefore(picture, divHeaderInfoContainer)

            _aTitle.textContent = aTitle.textContent

            const artistLinks = tableDict.artist.map(a => `<a href="${a.href}">${a.textContent}</a>`);
            if (!artistLinks.length) artistLinks.push("<a>N/A</a>")
            aArtist.insertAdjacentHTML(
                'beforeend',
                artistLinks.join(', ')
            );

            const table = document.createElement("table")

            const langLinks = tableDict.language.map(a => `<a href="${a.href}">${a.textContent}</a>`);
            if (!langLinks.length) langLinks.push("<a>N/A</a>")
            table.insertAdjacentHTML(
                'beforeend',
                `<tr><td class="Label">language:</td><td>${langLinks.join(', ')}</td></tr>`
            );
            const typeLinks = tableDict.type.map(a => `<a href="${a.href}">${a.textContent}</a>`);
            if (!typeLinks.length) typeLinks.push("<a>N/A</a>")
            table.insertAdjacentHTML(
                'beforeend',
                `<tr><td class="Label">type:</td><td>${typeLinks.join(', ')}</td></tr>`
            );
            const seriesList = tableDict.series.map(a => `<a href="${a.href}">${a.textContent}</a>`);
            if (!seriesList.length) seriesList.push("<a>N/A</a>")
            table.insertAdjacentHTML(
                'beforeend',
                `<tr><td class="Label">series:</td><td>${seriesList.join(', ')}</td></tr>`
            );

            if (info.tags) {
                const tagList = info.tags.map(tagDict => 
                    `<a class="BadgeBlue" href="${tagDict.url}">${tagDict.tag}</a>`);
                if (!tagList.length) tagList.push("<a>N/A</a>")
                table.insertAdjacentHTML(
                    'beforeend',
                    `<tr><td class="Label">tags:</td><td>
                        <div class="CardTagsContainer">
                            ${tagList.join(', ')}
                        </div>
                    </td></tr>`
                );
            }

            if (info.characters) {
                const charList = info.characters.map(charDict => 
                    `<a class="Badgegrey" href="${charDict.url}">${charDict.character}</a>`);
                if (!charList.length) charList.push("<a>N/A</a>")
                table.insertAdjacentHTML(
                    'beforeend',
                    `<tr><td class="Label">characters:</td><td>
                        <div class="CardTagsContainer">
                            ${charList.join(', ')}
                        </div>
                    </td></tr>`
                );
            }

            divInfo.appendChild(table)

            for (const x of info.related) {
                const rInfo = await fetch_id_js(x)
                const parsedInfo = await parse_id_js(parseInt(rInfo.id))

                const divCard = document.createElement("div")
                divCard.className = "Card"

                const imgCardImage = document.createElement("img") 
                imgCardImage.className = "CardImage"
                imgCardImage.dataset.src = get_preview_image(rInfo.files[0])
                imgCardImage.className = "CardImage lazyload"

                const divCardContents = document.createElement("div")
                divCardContents.className = "CardContents"

                const aCardTitle = document.createElement("a")
                aCardTitle.className = "CardTitle"
                aCardTitle.href = rInfo.galleryurl
                aCardTitle.textContent = parsedInfo.title[0].text

                const divCardTableContainer = document.createElement("div")
                divCardContents.className = "CardTableContainer"

                const rTable = document.createElement("table")
                appendTableRow(rTable, "language", createLinksHtml(parsedInfo.language));
                appendTableRow(rTable, "type", createLinksHtml(parsedInfo.type));
                appendTableRow(rTable, "artists", createLinksHtml(parsedInfo.artists));
                appendTableRow(rTable, "series", createLinksHtml(parsedInfo.parodys));

                const aPageNum = document.createElement("a")
                aPageNum.className = "page BadgeGrey"
                aPageNum.textContent = `${rInfo.files.length}p`

                const divCardTagsContainer = document.createElement("div")
                divCardTagsContainer.className = "CardTagsContainer"

                generate_tags(parsedInfo.tags, divCardTagsContainer)

                divRelatedContainer.appendChild(divCard)

                divCard.appendChild(imgCardImage)
                divCard.appendChild(divCardContents)

                divCardContents.appendChild(aCardTitle)
                divCardContents.appendChild(divCardTableContainer)
                divCardContents.appendChild(aPageNum)
                divCardContents.appendChild(divCardTagsContainer)

                divCardTableContainer.appendChild(rTable)
            }
            
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
            files.forEach((fileDict, idx) => {
                const a = document.createElement("a")
                a.href = `reader/${id}.html#${idx + 1}`

                const img = document.createElement("img");
                img.className = "Image lazyload";
                img.dataset.src = get_preview_image(fileDict);

                a.appendChild(img)
                fragment.appendChild(a);
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

        if (!CONFIG.useCustomViewer) return;

        aTitle.addEventListener('click', async (e) => {
            e.preventDefault();

            const info = await fetch_id_js(id);
            setupViewer(info);
        });
    }

    function load_default_query() {
        CONFIG.defaultQuery.split(/\s+/).forEach(query => {
            tag_to_badge(query, divDefaultInput, defaultActualInput)
        })
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
    document.querySelectorAll(".numeric").forEach(input => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "");
        });
    });
})();
