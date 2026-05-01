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

    const FETCH = {
        id_js: async function id_js(id) {
            const url = `//ltn.${STATE.domain}/galleries/${id}.js`;
            const response = await FETCH.get(url, { responseType: "text" });
            
            const startIdx = response.indexOf('{');
            const endIdx = response.lastIndexOf('}');
            if (startIdx === -1 || endIdx === -1) return
            
            const jsonStr = response.substring(startIdx, endIdx + 1);
            const galleryinfo = JSON.parse(jsonStr);
            if (!galleryinfo || !galleryinfo.files) return

            return galleryinfo
        },
        parsed_id_js: async function parsed_id_js(id) {
            const res = {
                title: [],
                language: [],
                type: [],
                artists: [],
                characters: [],
                parodys: [],
                tags: [],
                pictures: [],
                id: "",
            }
            const info = await FETCH.id_js(id)
            const isJapanese = navigator.language && navigator.language.startsWith('ja');

            const title = {text: "", url: ""}
            title.text = (info.japanese_title && isJapanese) ? info.japanese_title : info.title
            title.url = info.galleryurl
            res.title.push(title)

            const language = {text: "", url: ""}
            language.text = (info.language_localname && isJapanese) ? info.language_localname : info.language
            language.url = info.language_url
            res.language.push(language)

            const type = {text: "", url: ""}
            type.text = info.type
            type.url = `/type/${info.type}-all.html`
            res.type.push(type)

            if (info.artists) {
                info.artists.forEach(artist => {
                    res.artists.push({ text: artist.artist, url: artist.url })
                })
            }
            if (info.characters) {
                info.characters.forEach(character => {
                    res.characters.push({ text: character.character, url: character.url })
                })
            }
            if (info.parodys) {
                info.parodys.forEach(parody => {
                    res.parodys.push({ text: parody.parody, url: parody.url })
                })
            }
            if (info.tags) {
                info.tags.forEach(tag => {
                    res.tags.push({ text: tag.tag, url: tag.url })
                })
            }
            if (info.files) {
                res.pictures = [...info.files]
            }

            res.id = info.id

            return res
        },
        get: async function get(url, options = {}) {
            const {
                responseType = 'arraybuffer',
                start = 0,
                step = CONFIG.galleriesPerPage * 4,
                fetchAll = false,
                returnStatus = false,
                getRange = false,
            } = options;

            const headers = {};

            if (responseType === "arraybuffer" && !fetchAll) {
                const actualStart = start + step * STATE.fetchCount;
                headers["Range"] = `bytes=${actualStart}-${actualStart + step - 1}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers
            });

            if (response.ok || response.status === 206) {
                if (getRange) {
                    const contentRange = response.headers.get("Content-Range");
                    if (contentRange) {
                        STATE.defaultRange = Number(contentRange.split('/').pop());
                    }
                }

                let data;
                switch (responseType) {
                    case 'arraybuffer':
                        data = await response.arrayBuffer();
                        break;
                    case 'json':
                        data = await response.json();
                        break;
                    case 'text':
                        data = await response.text();
                        break;
                    case 'blob':
                        data = await response.blob();
                        break;
                    default:
                        data = await response.arrayBuffer();
                }

                if (returnStatus) return [data, response.status];
                return data;
            }
        },
        nozomi: async function nozomi(options = {}) {
            const {
                url = `//ltn.${STATE.domain}/index-all.nozomi`,
                step = CONFIG.galleriesPerPage * 4,
                fetchAll = true,
                getRange = false,
            } = options;

            if (STATE.indexObj[url] && fetchAll) {
                return STATE.indexObj[url]
            } else {
                const bytesArray = await FETCH.get(url, { step: step, fetchAll: fetchAll, getRange: getRange });
                const view = new DataView(bytesArray);
                const totalBytes = view.byteLength;
                STATE.indexObj[url] = UTIL.byte_to_id(totalBytes, view)
                return STATE.indexObj[url]
            }
        },
        gg: async function gg() {
            return new Promise(async (resolve) => {
                const url = 'https://ltn.gold-usergeneratedcontent.net/gg.js';
                const response = await FETCH.get(url, {responseType: "text"});
                
                const scriptBody = `
                    let gg; 
                    ${response.replace("'use strict';", "")} 
                    return gg;
                `;

                const extractGG = new Function(scriptBody);
                STATE.gg = extractGG();
                resolve()
            })
        },
        suggestion: async function (query, checkValid = false) {
            let field = 'global', term = query.replace(/_/g, " "), istag = false, jsonSuggestions = []

            if (query.includes(':')) {
                const sides = query.split(/:/);
                field = sides[0];
                term = sides[1];
                istag = true
            }
            const chars = term.split('').map(i => UTIL.encode_query(i))
            let url = `//tagindex.hitomi.la/${field}`;
            if (chars.length) {
                url += `/${chars.join('/')}`;
            }
            url += '.json';

            jsonSuggestions = await this.get(url, { responseType: "json" })
            if (checkValid) {
                let isValid = false;
                if (!istag) return [jsonSuggestions[0], isValid];
                
                for (let i = 0; i < jsonSuggestions.length; i++) {
                    const suggest = jsonSuggestions[i];
                    if (suggest[0] === term.replace(/_/g, " ") && suggest[2] === field) {
                        isValid = true;
                        break;
                    }
                }
                return [jsonSuggestions[0], isValid];
            }
            return jsonSuggestions
        },
    }

    const UTIL = {
        debounce: function debounce(func, delay) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), delay);
            };
        },
        replace_smart_quotes: function replace_smart_quotes(query) {
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
        },
        encode_query: function encode_query(query) {
            const replaceChars = {
                ' ': '_',
                '/': 'slash',
                '.': 'dot'
            };

            for (const [key, value] of Object.entries(replaceChars)) {
                query = query.split(key).join(value);
            }
            return query;
        },
        save_to_localstorage: function save_to_localstorage(SaveDefQButton, key, text = "") {
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
        },
        extract_tag: function extract_tag(href) {
            const match = href.match(/\/tag\/(.*)-all.html/) || href.match(/.*%20(.*)/);
            if (!match) return ""

            const res = this.encode_query(decodeURIComponent(match[1]));
            if (!(res.includes(":"))) return `tag:${res}`
            else return res
        },
        extract_table: function extract_table(a) {
            let match;
            const hrefValue = a.getAttribute('href');

            match = hrefValue.match(/.*\/index-(.*)\.html$/); // eg, language:japanese
            if (match) {
                return 'language:' + match[1];
            }

            match = hrefValue.match(/.*\/(.*)\/(.*)-all\.html$/); // eg, doujinshi:blue_archive
            if (match) {
                return match[1] + ':' + this.encode_query(decodeURIComponent(match[2]));
            }
            console.log('No match found for href:', hrefValue);
            return null;
        },
        check_avif_support: function check_avif_support() {
            return new Promise(async (resolve) => {
                try {
                    const img = new Image();
                    img.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAFwAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAH21kYXQSAAoFGAAGBCAyDBQAAwwwxAAAeUut9g==";
                    await img.decode();
                    STATE.avif = true;
                } catch {
                    STATE.avif = false;
                }
                resolve()
            })
        },
        byte_to_id: function byte_to_id(totalBytes, view) {
            const idsList = []
            for (let i = 0; i < totalBytes; i += 4) {
                const id = view.getUint32(i, false);
                idsList.push(id)
            };

            return idsList
        },
        filter_contents: function filter_contents(idJsList) {
            return idJsList.filter(idJs => {
                const num = idJs.pictures.length;

                if (CONFIG.minPage >= 1 && num < CONFIG.minPage) {
                    return false;
                }
                if (CONFIG.maxPage >= 1 && CONFIG.maxPage < num) {
                    return false;
                }
                if (CONFIG.filterNA.artist && !idJs.artists.length) {
                    return false;
                }
                if (CONFIG.filterNA.tag && !idJs.tags.length) {
                    return false;
                }
                return true;
            });
        },
        decrypt_picture: function decrypt_picture(image, dir = undefined, ext = undefined, base = "tn") {
            if (!(dir && ext)) {
                dir = STATE.avif ? "avifsmalltn" : "webpsmalltn";
                ext = STATE.avif ? "avif" : "webp";
            }

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
        },
        observer: function observer(xclass) {
            const observer = new IntersectionObserver(async (entries) => {
                const entry = entries[0];

                if (entry.isIntersecting && !STATE.fetching) {
                    const page = this.get_hash('page')
                    if (page) window.location.hash = `/?page=${page + 1}`;
                    else window.location.hash = `/?page=${2}`;

                    observer.unobserve(entry.target);

                    xclass.load();

                    observer.observe(entry.target);
                }

            }, {
                root: null,
                rootMargin: "0px 0px 300px 0px",
                threshold: 0
            });

            observer.observe(document.querySelector("#scrollSentinel"));
        },
        get_hash: function(param) {
            const hash = window.location.hash; 
            const paramsString = hash.split('?')[1]; 
            const searchParams = new URLSearchParams(paramsString);
            const page = searchParams.get(param);

            return Number(page)
        },
        get_query: function() {
            const hash = window.location.hash; 
            const paramsString = hash.split('?')[1]; 
            const searchParams = new URLSearchParams(paramsString);
            const query = searchParams.get('search');

            return query
        },
        load_default_query: function (divContainer, actualInput) {
            CONFIG.defaultQuery.split(/\s+/).forEach(query => {
                CREATE.badge(query, divContainer, actualInput)
            })
        },
    }

    const LISTENER = {
        search: function() {
            divSearchWindow.addEventListener('click', (e) => {
                if (e.target.closest(searchButtonName)) {
                    xclass.init()
                    window.location.hash = `/?search=${STATE.term}`
                }
                else if (e.target.closest('.bi-x-circle-fill')){
                    const container = e.target.closest(searchInputName)
                    e.target.closest('.TagContainer').remove();

                    if (container.id === "Default") {
                        const text = SEARCH.get_search_input_text(divDefaultSearchInput, defaultActualInput)
                        UTIL.save_to_localstorage(defaultSaveButton, STORAGE.defaultQueryKey, text)
                    }
                }
                else if (e.target.closest(saveButtonName)) {
                    const text = SEARCH.get_search_input_text(divDefaultSearchInput, defaultActualInput)
                    UTIL.save_to_localstorage(defaultSaveButton, STORAGE.defaultQueryKey, text)
                }
                else if (e.target.closest(eyeContainerName)) {
                    if (STATE.isPickerActive) {
                        eyeContainer.style.backgroundColor = 'transparent';

                        STATE.selectedTag.forEach(tag => {
                            tag.style.border = ""
                        })
                        STATE.selectedType.forEach(type => {
                            type.style.border = ""
                        })
                        STATE.selectedTag = []; STATE.selectedType = [];
                    } else {
                        eyeContainer.style.backgroundColor = 'yellow';
                        eyeText.style.color = 'black'
                    }
                    STATE.isPickerActive = !STATE.isPickerActive;
                }
                else if (e.target.closest(btnAddName)) {
                    if (STATE.selectedTag.length) {
                        STATE.selectedTag.forEach(tag => {
                            const tagText = UTIL.extract_tag(tag.href);
                            if (!CONFIG.defaultQuery.includes(tagText)) {
                                CREATE.badge(tagText, divDefaultSearchInput, defaultActualInput)
                            }
                        })
                        defaultSaveButton.click()
                    } 
                    if (STATE.selectedType.length) {
                        STATE.selectedType.forEach(type => {
                            const typeText = UTIL.extract_table(type);
                            if (!CONFIG.defaultQuery.includes(typeText)) {
                                CREATE.badge(typeText, divDefaultSearchInput, defaultActualInput)
                            }
                        })
                        defaultSaveButton.click()
                    }
                }
                else if (e.target.closest(BtnExcludeName)) {
                    if (STATE.selectedTag) {
                        STATE.selectedTag.forEach(tag => {
                            const tagText = UTIL.extract_tag(tag.href);
                            const excludeText = `-${tagText}`;
                            if (!CONFIG.defaultQuery.includes(excludeText)) {
                                CREATE.badge(excludeText, divDefaultSearchInput, defaultActualInput)
                            }
                        })
                        defaultSaveButton.click()
                    } 
                    if (STATE.selectedType) {
                        STATE.selectedType.forEach(type => {
                            const typeText = UTIL.extract_table(type);
                            const excludeText = `-${typeText}`;
                            if (!CONFIG.defaultQuery.includes(excludeText)) {
                                CREATE.badge(excludeText, divDefaultSearchInput, defaultActualInput)
                            }
                        })
                        defaultSaveButton.click()
                    }
                }
                else {
                    document.querySelectorAll(suggestionCName).forEach(elem => {
                        elem.style.display = 'none';
                    })
                }
            })
        },
        setting_listener: function() {
            function update_card_style() {
                document.documentElement.style.setProperty('--cardWidth', `${CONFIG.cardWidth}px`);
                document.documentElement.style.setProperty('--cardWrapWidth', `${CONFIG.cardWrapWidth}px`);
            };
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
            UTIL.load_default_query(divDefaultSearchInput, defaultActualInput);

            [STORAGE.cardWidthKey, STORAGE.cardWrapWidthKey].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', (e) => {
                        CONFIG[id] = e.target.value;
                        update_card_style();
                    });
                }
            });
            divSideBar.addEventListener('click', (e) => {
                if (e.target.closest("#SaveSettingButton")) {
                    divDefaultSearchInput.querySelectorAll('.TagContainer').forEach(el => el.remove());
                    divSetting.querySelectorAll('input').forEach(input => {
                        let value;
                        if (input.type === "checkbox") {
                            value = input.checked;
                        } else if (input.type === "range" || input.classList.contains('numeric')) {
                            value = input.value.length ? Number(input.value) : default_config[input.id];
                        } else {
                            value = input.value.length ? input.value : default_config[input.id];
                        }
                        
                        UTIL.save_to_localstorage(saveSettingButton, input.id, value);
                        CONFIG[input.id] = value;
                    });
                    update_card_style();
                    UTIL.load_default_query(divDefaultSearchInput, defaultActualInput);
                }
                else if (e.target.closest("#ExportSettingButton")) {
                    export_setting()
                }
                else if (e.target.closest("#ImportSettingButton")) {
                    import_setting()
                }
            })
        },
        hash: function(xclass) {
            window.addEventListener('hashchange', function() {
                xclass.load()
            }, false);
        },
        nav_bar: function() {
            if (!divNavBarC) return;

            divNavBarC.addEventListener('click', function(e) {
                if (e.target.closest('#bi-list-open')) {
                    divSideBar.classList.add('active');
                    divSidebarOverlay.classList.add('active');

                }
                else if (e.target.closest('.search-icon')) {
                    divSearchWindow.classList.toggle('active');
                }
                else {
                    divSearchWindow.classList.remove('active');
                }
            });
            divSidebarOverlay.addEventListener('click', () => {
                divSideBar.classList.remove('active');
                divSidebarOverlay.classList.remove('active');
            });
            svgBiClose.addEventListener('click', () => {
                divSideBar.classList.remove('active');
                divSidebarOverlay.classList.remove('active');
            })
        },
        suggestion: function (searchInput, actualInput, suggestionC,) {
            let negList = [], isOr = false, suggestionIndex = -1;

            searchInput.addEventListener('keydown', (e) => {
                function apply_focus_class () {
                    suggestionsArray.forEach(a => a.classList.remove('SuggestionFocus'));
                    if (suggestionIndex >= 0 && suggestionsArray[suggestionIndex]) {
                        suggestionsArray[suggestionIndex].classList.add('SuggestionFocus');
                    }
                };

                const currentInput = e.target;
                if (currentInput.tagName !== 'INPUT') return;

                const inputsArray = Array.from(searchInput.querySelectorAll('input'));
                const currentIndex = inputsArray.indexOf(currentInput);
                const isSelectionEmpty = currentInput.selectionStart === currentInput.selectionEnd;
                const suggestionsArray = Array.from(suggestionC.querySelectorAll('a'));
                const max = suggestionsArray.length - 1;

                if (e.key === 'Backspace' && isSelectionEmpty && currentInput.selectionStart === 0) {
                    let tagToRemove = null;
                    if (currentInput.closest(actualInputName)) {
                        const tags = searchInput.querySelectorAll('.TagContainer');
                        if (tags.length > 0) tagToRemove = tags[tags.length - 1];
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
                        
                        actualInput.value = extractedText + actualInput.value;
                        actualInput.focus();
                        actualInput.setSelectionRange(extractedText.length, extractedText.length);
                        return;
                    }
                }
                if (e.key === 'ArrowLeft' && isSelectionEmpty && currentInput.selectionStart === 0) {
                    e.preventDefault();
                    let nextIndex = (currentIndex - 1 + inputsArray.length) % inputsArray.length;
                    const targetInput = inputsArray[nextIndex];
                    targetInput.focus();
                    targetInput.setSelectionRange(targetInput.value.length, targetInput.value.length);
                    return;
                }
                if (e.key === 'ArrowRight' && isSelectionEmpty && currentInput.selectionStart === currentInput.value.length) {
                    e.preventDefault();
                    let nextIndex = (currentIndex + 1) % inputsArray.length;
                    const targetInput = inputsArray[nextIndex];
                    targetInput.focus();
                    targetInput.setSelectionRange(targetInput.value.length, targetInput.value.length);
                    return;
                }
                if ((e.key === 'Tab' && e.shiftKey) || e.key === 'ArrowUp') {
                    if (suggestionsArray.length === 0) return;
                    e.preventDefault();
                    suggestionIndex = (suggestionIndex <= 0) ? max : suggestionIndex - 1;
                    apply_focus_class();
                }
                else if (e.key === 'Tab' || e.key === 'ArrowDown') {
                    if (suggestionsArray.length === 0) return;
                    e.preventDefault();
                    suggestionIndex = (suggestionIndex >= max) ? 0 : suggestionIndex + 1;
                    apply_focus_class();
                }
                else if (e.key === 'Enter') {
                    if (suggestionIndex >= 0 && suggestionIndex < suggestionsArray.length) {
                        e.preventDefault();
                        suggestionsArray[suggestionIndex].click();
                        suggestionIndex = -1;
                    } 
                    else {
                        searchButton.click();
                    }
                }
                else {
                    suggestionIndex = -1;
                    suggestionsArray.forEach(a => a.classList.remove('SuggestionFocus'));
                }
            })

            searchInput.addEventListener('input', UTIL.debounce(async () => {
                negList, isOr = await CREATE.suggestion(suggestionC, actualInput, searchInput)
            }, CONFIG.debounceTime))

            suggestionC.addEventListener('click', async (e) => {
                const suggestion = e.target.closest('.Suggestion')
                if (!suggestion) return

                let query = suggestion.dataset.href
                query = negList.includes(query) ? `-${query}` : query

                suggestionC.textContent = "";

                if (!(query.includes(":"))) {
                    actualInput.value = `${query}:`
                    negList, isOr = await CREATE.suggestion(suggestionC, actualInput, searchInput)
                } else {
                    suggestionC.style.display = 'none';
                    if (isOr) {
                        CREATE.badge("|", searchInput, actualInput, true)
                    }
                    CREATE.badge(query, searchInput, actualInput)
                    actualInput.value = ''
                }

                actualInput.focus();
                searchInput.scrollLeft = searchInput.scrollWidth;
            })
        },
        order: function() {
            selectOrder.addEventListener('click', (e) => {
                const currentOption = e.target;
                if (currentOption.tagName !== 'OPTION') return;

                const list = currentOption.text.toLowerCase().replace(/:/g, "").split(/\s+/)
                STATE.orderBy = `${list[0]}:${list[1]}`
                if (list[1] == "added") STATE.orderBy = ""
                else if (list[0] == "random") STATE.orderBy = "random"
            })
        },
        preview: function(index, pic, files) {
            function prefetch(url) {
                if (!url) return;
                const img = new Image();
                img.decoding = "async";
                img.loading = "eager";
                img.src = url;
            }

            if (index < 0 || index >= files.length) return;

            const file = files[index];

            const img = document.createElement("img")
            pic.innerHTML = ""
            pic.appendChild(img)

            const url = UTIL.decrypt_picture(file);
            if (url) img.src = url;

            [1, -1].forEach(offset => {
                const nextIdx = (index + offset + files.length) % files.length;
                const nextFile = files[nextIdx];
                const nextUrl = UTIL.decrypt_picture(nextFile);
                prefetch(nextUrl);
            });
        }
    }

    const CREATE = {
        badge: function (query, divContainer, actualInput, isOr = false) {
            if (!query.length) return

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
                span.innerHTML = `${svg} ${field}:${term.replace(/\s/g, "_")}`;

                divTagC.appendChild(span)

                divContainer.insertBefore(divTagC, actualInput);
            } else if (isOr) {
                const input = `<input class="BetweenInput" type="text" maxlength="0">`

                const divTagC = document.createElement("div")
                divTagC.className = "TagContainer"
                divTagC.innerHTML = input

                const span = document.createElement("span");
                span.textContent = "|"
                span.style.color = "cyan"

                divTagC.appendChild(span)

                divContainer.insertBefore(divTagC, actualInput);
            }
            else {
                actualInput.value += (actualInput.value ? " " : "") + query
            }
        },
        tags: function (tags, container) {
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
                    aTag.href = tag.url

                    container.appendChild(aTag);
                });
            };
        },
        atag_for_table: function (dict, options = {}) {
            const { 
                onlyOne = false,
                className = '',
            } = options;

            const res = []

            if (!dict || dict.length === 0) {
                return '<a>N/A</a>';
            }

            for (const item of dict) {
                const classAttr = className ? ` class="${className}"` : '';
                res.push(`<a${classAttr} href="${item.url}">${item.text}</a>`)
                if (onlyOne) return res[0]
            }

            return res.join(', ')
        },
        table_row: function (table, label, contentHtml, containerClass = '') {
            const finalContent = containerClass 
                ? `<div class="${containerClass}">${contentHtml}<div style="width:100px></div></div>` 
                : contentHtml;

            table.insertAdjacentHTML(
                'beforeend',
                `<tr><td class="Label">${label}:</td><td>${finalContent}</td></tr>`
            );
        },
        card: function (idJsList, divCardC) {
            const template = document.querySelector('#card-template');

            idJsList.forEach(idJs => {
                const clone = template.content.cloneNode(true);

                const divCard = clone.querySelector("div.Card")
                divCard.dataset.id = idJs.id

                const aCardTitle = clone.querySelector('.CardTitle');
                aCardTitle.textContent = idJs.title[0].text;
                aCardTitle.href = idJs.title[0].url;

                const aCardImg = clone.querySelector('.CardImageUrl');
                aCardImg.href = idJs.title[0].url;
                const img = aCardImg.querySelector('img');
                img.src = UTIL.decrypt_picture(idJs.pictures[0]).replace("hitomi.la", STATE.domain);

                const table = clone.querySelector('table');
                this.table_row(table, "language", this.atag_for_table(idJs.language, {onlyOne: true}));
                this.table_row(table, "type", this.atag_for_table(idJs.type, {onlyOne: true}));
                this.table_row(table, "artists", this.atag_for_table(idJs.artists, {onlyOne: true}));
                this.table_row(table, "series", this.atag_for_table(idJs.parodys, {onlyOne: true}));

                clone.querySelector('.page').textContent = `${idJs.pictures.length}p`;
                const tagContainer = clone.querySelector('.CardTagsContainer');
                this.tags(idJs.tags, tagContainer);

                divCardC.appendChild(clone);
            })
        },
        suggestion: async function(suggestionC, actualInput, searchInput) {
            document.querySelectorAll(suggestionCName).forEach(elem => {
                if (elem !== suggestionC) {
                    elem.style.display = 'none';
                }
            });
            suggestionC.textContent = "";
            const text = actualInput.value;

            const inputList = text.split(/\s+/)
            let newInputList = [], negList = [], posList = [], isNegative = false, isOr = false
            inputList.forEach(term => {
                if (term.startsWith("-")) {
                    term = term.replace(/^-/, "")
                    negList.push(term)
                    isNegative = true
                } else {
                    posList.push(term)
                }
                newInputList.push(term)
            })

            if (newInputList.length >= 2) {
                const rmLastList = newInputList.slice(0, newInputList.length - 1)
                for (let value of rmLastList) {
                    let [suggestions, boolSuccess] = await FETCH.suggestion(value, true)
                    if (!boolSuccess) return

                    let query = `${suggestions[2]}:${suggestions[0]}`
                    query = negList.includes(query) ? `-${query}` : query
                    CREATE.badge(query, searchInput, actualInput)
                    actualInput.value = (actualInput.value).replace(`${value} `, "")
                    if (query.startsWith("-")) actualInput.value = actualInput.value.replace("-", "")
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
            const suggestions = await FETCH.suggestion(lastInput)

            Array.from(validNS).forEach(ns => {
                suggestions.unshift([ns, 0, "type", true])
            })

            const re = new RegExp(lastInput.replace(/_/g, " "), 'gi');

            const template = document.querySelector('#suggestion-template');
            suggestions.forEach(suggestion => {
                const clone = template.content.cloneNode(true);
                const aS = clone.querySelector('.Suggestion');
                const spanStext = clone.querySelector('.SuggestionText');
                const spanSarea = clone.querySelector('.SuggestionArea');

                spanStext.innerHTML = suggestion[0].replace(re, str => `<strong>${str}</strong>`);
                spanSarea.textContent = suggestion[2];
                if (suggestion[3]) {
                    aS.dataset.href = `${suggestion[0]}`
                } else {
                    aS.dataset.href = `${suggestion[2]}:${suggestion[0]}`
                }

                suggestionC.appendChild(clone);
            });

            const rect = searchInput.getBoundingClientRect();
            suggestionC.style.top = rect.top - 7 + 'px';
            suggestionC.style.width = rect.width + 'px';

            if (suggestionC.children.length > 0) {
                suggestionC.style.display = 'block';
            } else {
                suggestionC.style.display = 'none';
            }
            return negList, isOr
        },
        page_navigation: function(pageContainer) {
            let maxPage = 0, pages = [], range = 3;

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
                if (p === STATE.fetchCount + 1) a.style.color = 'var(--dimWhite)';
                pageContainer.appendChild(a);
            })
        },
        viewer: function(viewer, idJs) {
            function update_active_button_state(containers, activeText) {
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
            function render(container, pictures) {
                const fragment = document.createDocumentFragment();
                pictures.forEach((picture, idx) => {
                    const a = document.createElement("a")
                    a.href = `reader/${id}.html#${idx + 1}`

                    const img = document.createElement("img");
                    img.className = "lazy";
                    img.src = UTIL.decrypt_picture(picture)

                    a.appendChild(img)
                    fragment.appendChild(a);
                    container.appendChild(fragment);
                })
            }

            const id = UTIL.get_hash('id')

            viewer.aTitle.textContent = idJs.title[0].text

            const artists = this.atag_for_table(idJs.artists)
            viewer.aArtist.insertAdjacentHTML(
                'beforeend',
                artists
            );

            viewer.imgThumbnail.src = UTIL.decrypt_picture(idJs.pictures[0])

            this.table_row(viewer.table, "language", this.atag_for_table(idJs.language));
            this.table_row(viewer.table, "type", this.atag_for_table(idJs.type));
            this.table_row(viewer.table, "series", this.atag_for_table(idJs.parodys));
            if (idJs.tags && idJs.tags.length) {
                this.table_row(
                    viewer.table,
                    "tags",
                    this.atag_for_table(idJs.type, { className: "BadgeBlue" }),
                    "CardTagsContainer"
                );
            }
            if (idJs.characters && idJs.characters.length) {
                this.table_row(
                    viewer.table,
                    "characters",
                    this.atag_for_table(idJs.characters, { className: "BadgeBlue" }),
                    "CardTagsContainer"
                );
            }

            const pictures = idJs.pictures
            const step = CONFIG.viewerImagePerPage;
            for (let i = 0; i < pictures.length; i += step) {
                const pageNum = Math.floor(i / step) + 1;
                const batch = pictures.slice(i, i + step);

                xclass.divPages.forEach((divPage, idx) => {
                    const btn = document.createElement("button");
                    btn.textContent = pageNum;
                    btn.type = "button";

                    if (!idx) render(xclass.divImageContainer, batch);
                    btn.addEventListener("click", () => {
                        update_active_button_state(xclass.divPages, pageNum);
                        render(xclass.divImageContainer, batch);
                    });

                    divPage.appendChild(btn);
                });
            }
        }
    }

    const SEARCH = {
        run: async function (text) {
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
                const bytesArray = await FETCH.get(indexUrl, { start: NODE.subNodeAddresses[where], step: 464 })
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
                const inbuf = await FETCH.get(url, { start: start + 4, step: step })
                const eightArray = new Uint8Array(inbuf);
                const view = new DataView(eightArray.buffer);
                const totalBytes = view.byteLength;
                const idsList = UTIL.byte_to_id(totalBytes - 4, view)
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
                    ids = await FETCH.nozomi({ url }); // STATE.indexObj
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
                    STATE.indexObj[versionUrl] = await FETCH.get(versionUrl, { responseType: "text" });
                }
                const indexUrl = `//ltn.${STATE.domain}/galleriesindex/galleries.${STATE.indexObj[versionUrl]}.index`;
                const dataUrl = `//ltn.${STATE.domain}/galleriesindex/galleries.${STATE.indexObj[versionUrl]}.data`;
                
                const arrayBuf = await FETCH.get(indexUrl, { step: 464 });
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
                let term = terms[idx].replace(/_/g, " ");

                if (term === '|') {
                    if (idx > 0 && idx + 1 < terms.length) {
                        const prev = terms[idx - 1].replace(/_/g, " ");
                        const next = terms[idx + 1].replace(/_/g, " ");
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
                results = await FETCH.nozomi({ url: `//ltn.${STATE.domain}/n/index-all.nozomi` });
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
            } else if (!STATE.orderBy || STATE.orderBy === 'date') {
                results.sort((a, b) => b - a);
            }

            STATE.indexObj[text] = results

            const start = STATE.fetchCount * CONFIG.galleriesPerPage;
            return results.slice(start, start + CONFIG.galleriesPerPage);
        },
        search_post_process: function(divSearchInput, actualInput) {
            STATE.fetchCount = 0
            STATE.randomUsed = new Set()
            STATE.term = this.get_search_input_text(divSearchInput, actualInput, true, true)
        },
        get_search_input_text: function(divSearchInput, actualInput, shouldDefQuery = false, shouldQuery = false) {
            function clean_text(text) {
                if (!text) return ""

                text = UTIL.replace_smart_quotes(text)
                text = text.toLowerCase().trim()
                text = text.replace(/\n/g, " ")
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

            let tagQuery = "", inputQuery = "", res = "", temp = ""
            const badges = divSearchInput.querySelectorAll('span');
            badges.forEach(badge => {
                tagQuery += clean_text(badge.textContent) + " ";
            });
            inputQuery = clean_text(actualInput.value)

            temp += `${tagQuery} ${inputQuery}`

            if (shouldDefQuery) temp += ` ${clean_text(CONFIG.defaultQuery)}`
            if (shouldQuery) temp += ` ${clean_text(UTIL.get_query())}`

            res = merge_text(temp)

            return res
        }
    }

    class Gallery {
        constructor() {
            this.cardName = "div.Card"
            this.cardImgUrlName = "a.CardImageUrl"
            this.cardTitleName = "a.CardTitle"

            this.divCardC = document.querySelector("div.CardContainer")
            this.aResCount = document.querySelector("a.ResultsCount")
            this.pageContainers = document.querySelectorAll('.PageContainer');
            this.acardImgUrl = document.querySelector(this.cardImgUrlName)
        }

        listener() {
            let currentIndex = 0;

            this.divCardC.addEventListener('click', (e) => {
                const tag = e.target.closest('.BadgeBlue');
                const type = e.target.closest('table tr td a');
                const img = e.target.closest(this.cardImgUrlName)
                const title = e.target.closest(this.cardTitleName)

                if (tag) {
                    e.preventDefault();

                    if (!STATE.isPickerActive) {
                        const tagText = UTIL.extract_tag(tag.href);
                        CREATE.badge(tagText, divSearchInput, actualInput);

                        if (!CONFIG.incrementTag) {
                            searchButton.click();
                        }
                        return
                    }

                    if (tag.style.border === "") {
                        tag.style.border = "solid yellow";
                        STATE.selectedTag.push(tag);
                    } else {
                        tag.style.border = "";
                        STATE.selectedTag = STATE.selectedTag.filter(item => item !== tag);
                    }
                } else if (type) {
                    e.preventDefault();

                    if (!STATE.isPickerActive) {
                        if (e.target.matches('a')) {
                            const typeText = UTIL.extract_table(type);
                            CREATE.badge(typeText, divSearchInput, actualInput)
                            if (!CONFIG.incrementTag) {
                                searchButton.click()
                            }
                        }
                    }

                    if (type.style.border === "") {
                        type.style.border = "solid yellow"
                        STATE.selectedType.push(type)
                    }
                    else if (type.style.border === "solid yellow") {
                        type.style.border = ""
                        STATE.selectedType = STATE.selectedType.filter(item => item !== type);
                    }
                } else if (img) {
                    e.preventDefault();

                    const card = e.target.closest(this.cardName)
                    const id = Number(card.dataset.id) 

                    const files = []
                    const idJs = STATE.idJsObj[id]
                    const step = Math.round(idJs.pictures.length / CONFIG.picPreviewPerPage)
                    for (let i = 0; i < idJs.pictures.length; i += step) {
                        files.push(idJs.pictures[i])
                    }

                    if (!files.length) return;

                    const rect = img.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    
                    if (x < rect.width / 2) {
                        currentIndex = (currentIndex - 1 + files.length) % files.length;
                    } else {
                        currentIndex = (currentIndex + 1) % files.length;
                    }
                    
                    LISTENER.preview(currentIndex, img, files);
                } else if (title) {
                    e.preventDefault();

                    divMain.innerHTML = HTML.viewer
                    styleMain.textContent = CSS.viewer
                    xclass = new Viewer();
                }
            })

            this.pageContainers.forEach(pageContainer => {
                pageContainer.addEventListener('click', async (e) => {
                    const anchor = e.target.closest('a');
                    if (!anchor) return 

                    e.preventDefault();
                    const p = Number(anchor.textContent.trim());
                    if (p === STATE.fetchCount + 1 || STATE.fetching) return;
                    
                    this.divCardC.innerHTML = "";
                    window.location.hash = `/?page=${p}`;
                });
            })
        }

        init() {
            STATE.fetching = true
            SEARCH.search_post_process(divSearchInput, actualInput)
            this.divCardC.innerHTML = ""
        }

        async load() {
            STATE.fetching = true

            const page = UTIL.get_hash('page')

            if (page) STATE.fetchCount = Number(page) - 1

            let idsList = []
            if (STATE.term) {
                idsList = await SEARCH.run(STATE.term);
            } else {
                idsList = await FETCH.nozomi({ fetchAll: false, getRange: true });
            }

            const idJsList = await Promise.all(idsList.map(id => FETCH.parsed_id_js(id)));
            if (!idJsList.length) return

            idJsList.forEach(idJs => {STATE.idJsObj[idJs.id] = idJs})

            const filteredIdJs = UTIL.filter_contents(idJsList)

            CREATE.card(filteredIdJs, this.divCardC);

            this.pageContainers.forEach(pageContainer => {
                CREATE.page_navigation(pageContainer)
            })

            STATE.fetching = false
        }
    }

    class Viewer {
        constructor() {
            this.divImageContainer = document.querySelector("div.ImageContainer");
            this.divHeaderInfoContainer = document.querySelector("div.HeaderInfoContainer");
            this.divInfo = document.querySelector("div.Info");
            this.aArtist = document.querySelector("a.Artist");
            this.aTitle = document.querySelector("a.Title");
            this.divHeaderContainer = document.querySelector("div.HeaderContainer");
            this.divRelatedContainer = document.querySelector("div.RelatedContainer");
            this.divPages = document.querySelectorAll("div.Page");
            this.table = document.querySelector("table");
            this.imgThumbnail = document.querySelector("img.Thumbnail")
        }

        init() {}
        listener() {}
        async load() {
            const id = UTIL.get_hash('id')

            let idJs = {}
            if (id in STATE.idJsObj) idJs = STATE.idJsObj[id]
            else idJs = await FETCH.parsed_id_js(id)

            if (!(idJs || Object.keys(idJs).length)) return

            CREATE.viewer(this, idJs)
        }
    }

    const STORAGE = {
        defaultQueryKey: "defaultQuery",
        infScrollKey: "infScroll",
        incrementTagKey: "incrementTag",
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
        defaultQuery: "",
        filterNA: {
            artist: false,
            tag: false,
        }
    }

    const STATE = {
        fetching: false,
        avif: false,
        isPickerActive: false,
        fetchCount: 0,
        resultsCount: 0,
        defaultRange: 0,
        trial: 0,
        domain: "gold-usergeneratedcontent.net",
        match: "https://hitomi.la/robots.txt",
        orderBy: "",
        term: "",
        selectedTag: [],
        selectedType: [],
        idJsObj: {},
        indexObj: {},
        randomUsed: new Set(),
        gg: new Function()
    }

    const CSS = {
        common: `
:root {
    --radius: 0.375rem;
    --white: rgb(211, 211, 211);
    --dimWhite: rgb(140, 140, 140);
    --grey: #6c757d;
    --blue: #0d6efd;
    --green: #28a745;
    --red: #dc3545;
    --btnGreen: #198754;
    --btnRed: #a13643;
    --cardWidth: 220px;
    --cardWrapWidth: 190px;
}


input, svg {
    color: var(--white);
    cursor: pointer;
}

input:focus {
    outline: none;
}

.BtnGreenOut:hover {
    background-color: var(--btnGreen);
}

.BtnGreen, .BtnGreenOut:hover, .BtnRed {
    color: var(--white);
}

.BtnGreen, .BtnGreenOut, .BtnRed {
    border-radius: var(--radius);
}

.BtnGreenOut {
    color: var(--btnGreen);
    background-color: transparent;
    border: 1px solid var(--btnGreen);
}

.BtnGreen {
    background-color: var(--btnGreen);
    border: 1px solid var(--btnGreen);
}

.BtnRed {
    background-color: var(--btnRed);
    border: 1px solid var(--btnRed);
}

.NavbarContainer {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 50px;
    background-color: hsl(0, 0%, 19%);
    align-items: center;
    justify-content: space-between;
    padding: 0 15px 0 10px;
    box-sizing: border-box;
    gap: 20px;
    position: sticky;
    top: 0;
    z-index: 1;
}

.InputContainer {
    display: flex;
    justify-content: space-between;
    flex: 1;
    flex-direction: row;
}

.PickerContainer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 35px;
}

.BtnContainer {
    display: flex;
    height: 100%;
}

.BtnContainer button {
    width: 40px;
}

.MastheadContainer {
    display: flex;
    align-items: center;
    gap: 10px;
}

.MastheadContainer a img {
    width: 80%;
}

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

.SuggestionContainer {
    display: none;
    margin: 0;
    position: absolute;
    z-index: 1;
    background-color: hsl(0, 0%, 13%);
    color: var(--white);
    border: 1px solid hsl(0, 0%, 18%);
    border-radius: var(--radius);
}

.Sidebar {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: -260px;
    width: 240px;
    height: 100%;
    background-color: hsl(0, 0%, 10%);
    z-index: 2;
    transition: left 0.3s ease;
    border-right: 1px solid hsl(0, 0%, 15%);
    padding: 10px;
    gap: 15px;
}

.Sidebar.active {
    left: 0;
    box-shadow: 5px 0 15px rgba(0, 0, 0, 0.5);
}

.SidebarOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: none;
    z-index: 1;
}

.SidebarOverlay.active {
    display: block;
}

.Setting {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 30px;
}

.Setting label {
    color: var(--white);
}

.SearchFloatingWindow {
    position: fixed;
    top: 50px;
    right: 10px;
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
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.SearchFloatingWindow.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.EyeContainer {
    display: flex;
    align-items: center;
    background-color: transparent;
    border-radius: var(--radius);
    padding: 5px;
    gap: 5px;
    cursor: pointer;
}

.EyeContainer a {
    color: var(--dimWhite);
    white-space: nowrap;
    font-size: 0.8rem;
}

.eye {
    margin-left: 1%;
}

.bi-list {
    color: var(--dimWhite);
    width: 32px;
    height: 32px;
    cursor: pointer;
}

.search-icon {
    width: 32px;
    cursor: pointer;
    fill: hsl(0, 0%, 25%);
}

.BadgeBlue, .BadgeGreen, .BadgeGrey, .BadgeRed {
    border-radius: var(--radius);
    padding: 0.35em 0.65em;
    font-size: 0.75em;
    font-weight: 700;
    color: var(--white);
}

.BadgeBlue, .BadgeGreen, .BadgeRed {
    display: flex;
    align-items: center;
    white-space: nowrap;
}

.Suggestion:hover, .SuggestionFocus {
    background-color: hsl(0, 0%, 10%);
    cursor: pointer;
}

.BadgeGrey {
    background-color: var(--grey);
}

.BadgeBlue {
    background-color: var(--blue);
}

.BadgeGreen {
    background-color: var(--green);
}

.BadgeRed {
    background-color: var(--red);
}

.Suggestion {
    display: flex;
    white-space: nowrap;
    padding: 3%;
    border-bottom: 1px solid hsl(0, 0%, 18%);
}

.SuggestionText {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.SuggestionArea {
    color: var(--dimWhite);
}

.ActualInput {
    color: var(--white);
    background-color: transparent;
    border: none;
    font-weight: bold;
    overflow: visible;
}

.BetweenInput {
    background-color: transparent;
    border: none;
    width: 1px;
}

#SearchButton {
    height: 40px;
}

#SaveDefQButton {
    margin-left: 5px;
    white-space: nowrap;
}

#SaveSettingButton, #ExportSettingButton, #ImportSettingButton {
    height: 45px;
    white-space: nowrap;
}

#ExportSettingButton, #ImportSettingButton {
    width: 48%;
}`,
        gallery: `
body {
    margin: 0;
    background-color: hsl(0, 0%, 16%);
}

table tr td a {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    word-break: break-all;
    text-decoration: none;
}

strong {
    color: cyan;
}

span svg {
    color: var(--white);
    margin-right: 8px;
    cursor: pointer;
}

.CardTableContainer table a {
    color: var(--dimWhite);
    scrollbar-width: thin;
    overflow: hidden;
}

.CardTableContainer table td {
    color: var(--dimWhite);
}

.CardTagsContainer a {
    margin-right: 5%;
    text-decoration: none;
    color: var(--white);
}

.Card img {
    width: 100%;
    height: 220px;
    object-fit: cover;
    border-radius: var(--radius);
    /* filter: brightness(0); */
}

.PageContainer a {
    padding: 5px;
    cursor: pointer;
}

.Container {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.CardContainer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    color: var(--white);
    background-color: hsl(0, 0%, 10%);
    border-radius: var(--radius);
    gap: 20px;
    margin: 10px;
}

.CardTableContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: auto;
    align-self: start;
}

.CardTagsContainer {
    scrollbar-width: thin;
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
    background-color: hsl(0, 0%, 16%);
    width: 100%;
    scrollbar-color: darkgray transparent;
    padding-right: 40px;
    box-sizing: border-box;
    border-radius: var(--radius);
}

.PageContainer {
    display: flex;
    justify-content: center;
    color: var(--white);
    margin: 10px;
}

.InfoContainer {
    margin: 0 0 20px 10px;
}

.TagContainer {
    display: flex;
    align-items: center;
}

.ContentContainer {
    background-color: hsl(0, 0%, 13%);
    margin: 3% 3% auto 3%;
    border-radius: var(--radius);
    overflow: hidden;
}

.BottomContainer {
    display: -webkit-box;
}

.CardTitle {
    font-weight: bold;
    text-decoration: none;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    word-break: break-all;
    color: var(--white);
}

.page {
    width: fit-content;
    margin-right: 3px;
}

.Card {
    display: flex;
    flex-direction: column;
    flex: 1 1 var(--cardWrapWidth);
    max-width: var(--cardWidth);
    background-color: hsl(0, 0%, 14%);
    overflow: hidden;
    justify-content: space-between;
    border-radius: var(--radius);
    border: 1px solid hsl(0, 0%, 19%);
    padding: 5px;
    gap: 10px;
}

.ResultsCount {
    color: var(--dimWhite);
}

#scrollSentinel {
    height: 1px;
}
`,
        viewer: `
body {
    display: flex;
    flex-direction: column;
    gap: 5px;
    background-color: hsl(0, 0%, 10%);
    margin: 0;
}
table {
    width: 100%;
}
tr td {
    color: var(--white);
}
tr td a {
    color: var(--dimWhite);
}
a {
    text-decoration: none;
    color: var(--white);
}
.HeaderContainer {
    display: flex;
    background-color: hsl(0, 0%, 13%);
    gap: 10px;
    padding: 5px;
    border-radius: var(--radius);
    overflow: hidden;
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
    flex-direction: column;
    overflow: hidden;
}
.HeaderInfoContainer {
    display: flex;
    flex-direction: column;
    width: 100%;
}
.CardTagsContainer {scrollbar-width: thin; display: flex; overflow-x: auto; white-space: nowrap; background-color: hsl(0, 0%, 19%); width: 100%; scrollbar-color: darkgray transparent; padding-right: 40px; box-sizing: border-box;}
.CardTableContainer {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin: 5px;
    justify-content: space-around;
}


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
    border-radius: 0 0 var(--radius) var(--radius);
    padding: 3px;
    box-sizing: border-box;
}
.Artist a {
    color: var(--dimWhite);
}
.Info {
    padding: 3px;
}
.Label {
    width: 100px;
    font-weight: bold;
    color: var(--white);
}
.Thumbnail img {
    border-radius: var(--radius);
}
.Image {
    max-width: 130px;
    flex: 1 1;
    border-radius: var(--radius);
}
.Card {
    display: flex;
    background-color: hsl(0, 0%, 16%);
    padding: 5px;
    border-radius: var(--radius);
    flex: 1 1;
    overflow: hidden;
}
.CardTitle {
    color: var(--white);
    font-weight: bold;
    font-size: large;
}
.CardImage {
    max-width: 200px;
    border-radius: var(--radius);
    object-fit: cover;
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

.page {width: fit-content;}
`
    }

    const HTML = {
        common: `
<!DOCTYPE html>
<html>
<head>
    <title>hitomi-enchanced</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style id="main"></style>
</head>
<body>
    <div class="SidebarOverlay"></div>
    <div class="Sidebar">
        <div class="MastheadContainer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" id="bi-list-close" class="bi bi-list" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
            </svg>
            <a href="${STATE.match}">
                <img src="//ltn.${STATE.domain}/logo.png"></img>
            </a>
        </div>

        <div class="Setting">
            <label><input type="checkbox" id="${STORAGE.infScrollKey}"> infScroll</label>
            <label><input type="checkbox" id="${STORAGE.incrementTagKey}"> incrementTag</label>

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
            <div id="Default" class="SuggestionContainer"></div>
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
    <div class="NavbarContainer">
        <div class="MastheadContainer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" id="bi-list-open" class="bi bi-list" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
            </svg>
            <a href="${STATE.match}">
                <img src="//ltn.${STATE.domain}/logo.png"></img>
            </a>
        </div>
        <svg class="search-icon" viewBox="-2.4 -2.4 28.80 28.80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="14" class="search-bg" />
            <g fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z"></path>
            </g>
        </svg>
    </div>
    <template id="suggestion-template">
        <a class="Suggestion">
            <span class="SuggestionText"></span>
            <span class="SuggestionArea"></span>
        </a>
    </template>
    <div id="main"></div>
</body>
</html>`,
        gallery: `
<div class="ContentContainer">
    <div class="PageContainer"></div>
    <div class="InfoContainer">
        <a class="ResultsCount"></a>
    </div>
    <div class="CardContainer"></div>
    <div class="PageContainer"></div>
</div>
<div id="scrollSentinel"></div>

<template id="card-template">
    <div class="Card" data-id="">
        <a class="CardImageUrl" target="_blank">
            <img src="" alt="">
        </a>
        <a class="CardTitle"></a>
        <div class="CardTableContainer">
            <table></table>
        </div>
        <div class="BottomContainer">
            <a class="page BadgeGrey"></a>
            <div class="CardTagsContainer"></div>
        </div>
    </div>
</template>

<template id="badge-template">
    <div class="TagContainer">
        <input class="BetweenInput" type="text" maxlength="0">
        <span class="Badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
            </svg>
            <span class="badge-text"></span>
        </span>
    </div>
</template>
`,
        viewer: `
<div class="HeaderContainer">
    <img class="Thumbnail"></img>
    <div class="HeaderInfoContainer">
        <a class="Title"></a>
        <a class="Artist"></a>
        <div class="Info">
            <table></table>
        </div>
    </div>
</div>
<div class="Page"></div>
<div class="ImageContainer"></div>
<div class="Page"></div>
<a class="Header">Related Contents</a>
<div class="RelatedContainer"></div>
        `,
    }

    await UTIL.check_avif_support()
    await FETCH.gg()

    document.open();
    document.write(HTML.common)
    document.close();

    const style = document.createElement('style');
    style.textContent = CSS.common 
    document.head.appendChild(style);

    const searchButtonName = "#SearchButton"
    const searchInputName = "div.SearchInput"
    const actualInputName = "input.ActualInput"
    const suggestionCName = "div.SuggestionContainer"
    const mainName = "div#main"
    const cssMainName = "style#main"
    const saveButtonName = "#SaveDefQButton"
    const eyeContainerName = "div.EyeContainer"
    const btnAddName = "button.BtnAdd"
    const BtnExcludeName = "button.BtnExclude"

    const searchButton = document.querySelector(searchButtonName);
    const divNavBarC = document.querySelector("div.NavbarContainer");
    const divSideBar = document.querySelector("div.Sidebar")
    const divSearchInput = document.querySelector(`${searchInputName}#Search`)
    const divDefaultSearchInput = document.querySelector(`${searchInputName}#Default`);
    const divSidebarOverlay = document.querySelector("div.SidebarOverlay") 
    const svgBiClose = document.querySelector("svg#bi-list-close") 
    const divSearchWindow = document.querySelector("div.SearchFloatingWindow")
    const divSetting= document.querySelector("div.Setting");
    const saveSettingButton = document.querySelector("#SaveSettingButton")
    const exportSettingButton = document.querySelector("#ExportSettingButton")
    const importSettingButton = document.querySelector("#ImportSettingButton")
    const divDefaultInputC = document.querySelector("div.InputContainer#Default");
    const defaultActualInput = document.querySelector(`${actualInputName}#Default`)
    const actualInput = document.querySelector(`${actualInputName}#Search`)
    const divSuggestionC = document.querySelector(`${suggestionCName}#Search`)
    const divDefaultSuggestionC = document.querySelector(`${suggestionCName}#Default`)
    const divMain = document.querySelector(mainName)
    const styleMain = document.querySelector(cssMainName)
    const defaultSaveButton = document.querySelector("#SaveDefQButton")
    const eyeContainer = document.querySelector(eyeContainerName)
    const buttonAdd = document.querySelector(btnAddName)
    const buttonEx = document.querySelector(BtnExcludeName)
    const eyeText = document.querySelector(`${eyeContainerName} a`)
    const selectOrder = document.querySelector("select#orderbydropdown")

    LISTENER.nav_bar()
    LISTENER.setting_listener()
    LISTENER.search(divSuggestionC, actualInput, divSearchInput)
    LISTENER.suggestion(divSearchInput, actualInput, divSuggestionC)
    LISTENER.suggestion(divDefaultSearchInput, defaultActualInput, divDefaultSuggestionC)
    LISTENER.order()

    let xclass
    const hash = window.location.hash

    if (hash.includes("/?id=")) {
        divMain.innerHTML = HTML.viewer
        styleMain.textContent = CSS.viewer
        xclass = new Viewer();
    } else {
        divMain.innerHTML = HTML.gallery
        styleMain.textContent = CSS.gallery
        xclass = new Gallery();
    }

    xclass.init()
    xclass.load();
    xclass.listener(STATE.selectedTag, STATE.selectedType)
    UTIL.observer(xclass)
    LISTENER.hash(xclass)
})()
