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
        }
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
            return encode_query(decodeURIComponent(match[1]));
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
                return match[1] + ':' + encode_query(decodeURIComponent(match[2]));
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
                    const page = this.get_hash()
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
        get_hash: function() {
            const hash = window.location.hash; 
            const paramsString = hash.split('?')[1]; 
            const searchParams = new URLSearchParams(paramsString);
            const page = searchParams.get('page');

            return Number(page)
        },
        load_default_query: function (divContainer, actualInput) {
            CONFIG.defaultQuery.split(/\s+/).forEach(query => {
                CREATE.badge(query, divContainer, actualInput)
            })
        },
    }

    const LISTENER = {
        search: function() {
            let isFocust;

            divSearchWindow.addEventListener('click', (e) => {
                if (e.target.closest(searchButtonName)) {
                    SEARCH.search_post_process(divSearchInput, actualInput)
                    window.location.hash = `/?search=${STATE.term}`
                }
            })
            divSearchWindow.addEventListener('keydown', (e) => {
                if (e.target.closest(searchInputName)) {
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
                }
            })
        },
        order: function order(optionOrderByDropdown) {
            optionOrderByDropdown.forEach(option => {
                option.addEventListener('click', function() {
                    const list = option.text.toLowerCase().replace(/:/g, "").split(/\s+/)
                    STATE.orderBy = `${list[0]}:${list[1]}`
                    if (list[1] == "added") STATE.orderBy = ""
                    else if (list[0] == "random") STATE.orderBy = "random"
                })
            })
        },
        picker: function picker(eye, add, ex, divDefaultInput, defaultActualInput, eyeText, eyeContainer, SaveDefQButton) {
            STATE.isPickerActive = false;
            let selectedTag = [];
            let selectedType = [];

            defaultActualInput.addEventListener('keydown', function(e) {
                if (e.key !== 'Enter') return
                SaveDefQButton.click()
            })

            SaveDefQButton.addEventListener('click', () => {
                const text = get_search_input_text(divDefaultInput, defaultActualInput)
                save_to_localstorage(SaveDefQButton, STORAGE.defaultQueryKey, text)
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
                const tag = e.target.closest('.BadgeBlue');
                const type = e.target.closest('table tr td a');
                if (tag) {
                    if (!STATE.isPickerActive) {
                        const tagText = extract_tag(tag.href);
                        tag_to_badge(tagText, divSearchInput, actualInput);

                        if (!CONFIG.incrementTag) {
                            searchButton.click();
                        }
                        return
                    }


                    e.preventDefault();

                    if (tag.style.border === "") {
                        tag.style.border = "solid yellow";
                        selectedTag.push(tag);
                    } else {
                        tag.style.border = "";
                        selectedTag = selectedTag.filter(item => item !== tag);
                    }
                } else if (type) {
                    if (!STATE.isPickerActive) {
                        if (e.target.matches('a')) {
                            const typeText = extract_table(type);
                            tag_to_badge(typeText, divSearchInput, actualInput)
                            if (!CONFIG.incrementTag) {
                                searchButton.click()
                            }
                        }
                    }

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
        },
        suggestion: function suggestion(actualInput, divSuggestionC, divSearchInput) {
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
        },
        pic_preview: function pic_preview_listener(pic, id, idsObj) {
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
        },
        menu_and_search: function menu_and_search_listener(menuBtnOpen, sidebar, overlay, menuBtnClose, svgSearch, searchWindow) {
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
            UTIL.load_default_query(divDefaultInput, defaultActualInput);

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
                        
                        UTIL.save_to_localstorage(saveSettingButton, input.id, value);
                        CONFIG[input.id] = value;
                    });
                    update_card_style();
                    UTIL.load_default_query(divDefaultInput, defaultActualInput);
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
        }
    }

    const CREATE = {
        badge: function (query, divContainer, actualInput, isOr = false) {
            if (!query.length) return

            let existingInput = actualInput.value.split(/\s+/)
            if (!isOr && existingInput.includes(query)) return

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

                    container.appendChild(aTag);
                });
            };
        },
        atag_for_table: function (dict, options = {}) {
            const { 
                onlyOne = false,
                className = '',
            } = options;

            let res = ""

            if (!dict || dict.length === 0) {
                return '<a>N/A</a>';
            }

            for (const item of dict) {
                const text = onlyOne ? item.text : `${item.text}, `
                const href = item.url
                const classAttr = className ? ` class="${className}"` : '';
                res += `<a${classAttr} href="${href}">${text}</a>`;
                if (onlyOne) break 
            }

            return res
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
            } else {
                results.sort((a, b) => b - a);
            }

            STATE.indexObj[text] = results

            const start = STATE.fetchCount * CONFIG.galleriesPerPage;
            return results.slice(start, start + CONFIG.galleriesPerPage);
        },
        search_post_process: function(divSearchInput, actualInput) {
            STATE.fetchCount = 0
            STATE.randomUsed = new Set()
            STATE.term = this.get_search_input_text(divSearchInput, actualInput, true)
        },
        get_search_input_text: function(divSearchInput, actualInput, shouldDefQuery = false) {
            function clean_text(text) {
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
    }

    class Gallery {
        constructor() {
            this.menuBtnOpen = document.querySelector('#bi-list-open');
            this.menuBtnClose = document.querySelector('#bi-list-close');
            this.sidebar = document.querySelector('.Sidebar');
            this.overlay = document.querySelector('.SidebarOverlay');
            this.svgSearch = document.querySelector('.search-icon')
            this.divInputC = document.querySelector("div.InputContainer#Search")
            this.divDefaultSuggestionC = document.querySelector("div.SuggestionContainer#Default")
            this.divCardC = document.querySelector("div.CardContainer")
            this.defaultSaveButton = document.querySelector("#SaveDefQButton")
            this.aResCount = document.querySelector("a.ResultsCount")
            this.eyeContainer = document.querySelector("div.EyeContainer")
            this.svgEye = document.querySelector("div.EyeContainer .eye")
            this.eyeText = document.querySelector("div.EyeContainer a")
            this.buttonAdd = document.querySelector("button.BtnAdd")
            this.buttonEx = document.querySelector("button.BtnExclude")
            this.optionOrderByDropdown = document.querySelectorAll("#orderbydropdown option")
            this.pageContainers = document.querySelectorAll('.PageContainer');
        }

        listener() {
            const page_listener = async (e) => {
                const anchor = e.target.closest('a');
                if (!anchor) return 

                e.preventDefault();
                const p = Number(anchor.textContent.trim());
                if (p === STATE.fetchCount + 1 || STATE.fetching) return;
                
                this.divCardC.innerHTML = "";
                window.location.hash = `/?page=${p}`;
            }
            const pageWrapper = (e) => page_listener(e);

            this.pageContainers.forEach(pageContainer => {
                pageContainer.addEventListener('click', pageWrapper);
            })
        }

        create_page_navigation() {
            this.pageContainers.forEach(pageContainer => {
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
            })
        }

        async load() {
            STATE.fetching = true

            SEARCH.search_post_process(divSearchInput, actualInput)
            const page = UTIL.get_hash()

            if (page) STATE.fetchCount = Number(page) - 1

            let idsList = []
            if (STATE.term) {
                idsList = await SEARCH.run(STATE.term);
            } else {
                idsList = await FETCH.nozomi({ fetchAll: false, getRange: true });
            }

            const idJs = await Promise.all(idsList.map(id => FETCH.parsed_id_js(id)));
            if (!idJs.length) return

            const filteredIdJs = UTIL.filter_contents(idJs)

            CREATE.card(filteredIdJs, this.divCardC);

            this.create_page_navigation()

            STATE.fetching = false
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
}

.Card img {
    width: 100%;
    height: 220px;
    object-fit: cover;
    border-radius: var(--radius);
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
    <div class="Card">
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
    <div class="HeaderInfoContainer">
        <a class="Title"></a>
        <a class="Artist"></a>
        <div class="Info"></div>
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
    const searchInputName = "div.SearchInput#Search"
    const actualInputName = "input.ActualInput#Search"
    const suggestionCName = "div.SuggestionContainer#Search"
    const mainName = "div#main"
    const cssMainName = "style#main"

    const searchButton = document.querySelector(searchButtonName);
    const divNavBarC = document.querySelector("div.NavbarContainer");
    const divSideBar = document.querySelector("div.Sidebar")
    const divSearchInput = document.querySelector(searchInputName);
    const divSidebarOverlay = document.querySelector("div.SidebarOverlay") 
    const svgBiClose = document.querySelector("svg#bi-list-close") 
    const divSearchWindow = document.querySelector("div.SearchFloatingWindow")
    const divSetting= document.querySelector("div.Setting");
    const divDefaultInput = document.querySelector("div.SearchInput#Default");
    const saveSettingButton = document.querySelector("#SaveSettingButton")
    const exportSettingButton = document.querySelector("#ExportSettingButton")
    const importSettingButton = document.querySelector("#ImportSettingButton")
    const divDefaultInputC = document.querySelector("div.InputContainer#Default");
    const defaultActualInput = document.querySelector("input.ActualInput#Default")
    const actualInput = document.querySelector(actualInputName)
    const divSuggestionC = document.querySelector(suggestionCName)
    const divMain = document.querySelector(mainName)
    const styleMain = document.querySelector(cssMainName)

    LISTENER.nav_bar()
    LISTENER.setting_listener()
    LISTENER.search()

    let xclass
    const hash = window.location.hash

    if (hash.includes("#/viewer")) {
        divMain.innerHTML = HTML.viewer
        styleMain.textContent = CSS.viewer
        // xclass = new Viewer();
    } else {
        divMain.innerHTML = HTML.gallery
        styleMain.textContent = CSS.gallery
        xclass = new Gallery();
    }

    xclass.load();
    xclass.listener()
    UTIL.observer(xclass)
    LISTENER.hash(xclass)
})()
