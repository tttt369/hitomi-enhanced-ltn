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
        gallery: async function gallery(idsList) {
            const galleriesList = [];
            const count = Math.min(idsList.length, CONFIG.galleriesPerPage);

            const promises = [];
            for (let i = 0; i < count; ++i) {
                const galleryId = idsList[i];
                const url = `//ltn.${STATE.domain}/galleryblock/${galleryId}.html`;
                promises.push(FETCH.get(url, { responseType: "text" }));
            }

            const results = await Promise.all(promises);
            for (const r of results) {
                galleriesList.push(r);
            }

            ++STATE.fetchCount;
            return galleriesList;
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
        }
    }

    const LISTENER = {
        search: function search(searchButton, divSearchInput, divSuggestionC, actualInput, aResCount, divCardC) {
            let isFocust;
            searchButton.addEventListener('click', async function() {
                search_post_process(divSearchInput, actualInput)
                await load(aResCount, divCardC)
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
        setting_listener: function setting_listener() {
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
        },
    }

    const CREATE = {
        badge: function badge(query, divContainer, actualInput, isOr = false) {
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
                span.innerHTML = `${svg} ${field}:${space2ubar(term)}`;

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
        tags: function tags(tags, container) {
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
        atag_for_table: function atag_for_table(dict, options = {}) {
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
                return `<a${classAttr} href="${href}">${text}, </a>`;
            }).join('');
        },
        table_row: function table_row(table, label, contentHtml, containerClass = '') {
            const finalContent = containerClass 
                ? `<div class="${containerClass}">${contentHtml}<div style="width:100px></div></div>` 
                : contentHtml;

            table.insertAdjacentHTML(
                'beforeend',
                `<tr><td class="Label">${label}:</td><td>${finalContent}</td></tr>`
            );
        },
        card: function card(idJsList, divCardC) {
            idJsList.forEach(idJs => {
                const divCard = document.createElement("div")
                divCard.className = "Card"

                const divTableC = document.createElement("div")
                divTableC.className = "CardTableContainer"

                const aCardTitle = document.createElement("a")
                aCardTitle.className = "CardTitle"
                aCardTitle.textContent = idJs.title[0].text

                const table = document.createElement("table")
                CREATE.table_row(table, "language", CREATE.atag_for_table(idJs.language));
                CREATE.table_row(table, "type", CREATE.atag_for_table(idJs.type));
                CREATE.table_row(table, "artists", CREATE.atag_for_table(idJs.artists), "CardTagsContainer");
                CREATE.table_row(table, "series", CREATE.atag_for_table(idJs.parodys), "CardTagsContainer");

                const aPage = document.createElement("a")
                aPage.className = "page BadgeGrey"
                aPage.textContent = `${idJs.pictures.length}p`

                const divTagC = document.createElement("div")
                divTagC.className = "CardTagsContainer"
                CREATE.tags(idJs.tags, divTagC)

                const divbottomC = document.createElement("div")
                divbottomC.className = "BottomContainer"

                const pictureUrl = UTIL.decrypt_picture(idJs.pictures[0])
                pictureUrl.replace("hitomi.la", STATE.domain)
                const img = document.createElement("img")
                img.src = pictureUrl

                const aPic = document.createElement("a")
                aPic.href = idJs.title[0].url
                aPic.target = "_blank"

                aPic.appendChild(img)
                divCard.appendChild(aPic)
                divCardC.appendChild(divCard)
                divCard.appendChild(aCardTitle)
                divTableC.appendChild(table)
                divCard.appendChild(divTableC)
                divTableC.appendChild(table)
                divbottomC.appendChild(aPage)
                divbottomC.appendChild(divTagC)
                divCard.appendChild(divbottomC)
            })
        }
    }

    class Gallery {
        constructor() {
            document.open();
            document.write(HTML.gallery)
            document.close();

            self.menuBtnOpen = document.querySelector('#bi-list-open');
            self.menuBtnClose = document.querySelector('#bi-list-close');
            self.sidebar = document.querySelector('.Sidebar');
            self.overlay = document.querySelector('.SidebarOverlay');
            self.svgSearch = document.querySelector('.search-icon')
            self.searchWindow = document.querySelector(".SearchFloatingWindow")
            self.divSearchInput = document.querySelector("div.SearchInput#Search");
            self.divSetting= document.querySelector("div.Setting");
            self.divDefaultInput = document.querySelector("div.SearchInput#Default");
            self.actualInput = document.querySelector("input.ActualInput#Search")
            self.defaultActualInput = document.querySelector("input.ActualInput#Default")
            self.divInputC = document.querySelector("div.InputContainer#Search")
            self.divDefaultInputC = document.querySelector("div.InputContainer#Default");
            self.divSuggestionC = document.querySelector("div.SuggestionContainer#Search")
            self.divDefaultSuggestionC = document.querySelector("div.SuggestionContainer#Default")
            self.divCardC = document.querySelector("div.CardContainer")
            self.searchButton = document.querySelector("#SearchButton")
            self.defaultSaveButton = document.querySelector("#SaveDefQButton")
            self.saveSettingButton = document.querySelector("#SaveSettingButton")
            self.exportSettingButton = document.querySelector("#ExportSettingButton")
            self.importSettingButton = document.querySelector("#ImportSettingButton")
            self.aResCount = document.querySelector("a.ResultsCount")
            self.eyeContainer = document.querySelector("div.EyeContainer")
            self.svgEye = document.querySelector("div.EyeContainer .eye")
            self.eyeText = document.querySelector("div.EyeContainer a")
            self.buttonAdd = document.querySelector("button.BtnAdd")
            self.buttonEx = document.querySelector("button.BtnExclude")
            self.optionOrderByDropdown = document.querySelectorAll("#orderbydropdown option")
            self.pageContainers = document.querySelectorAll('.PageContainer');
        }

        async load() {
            let idsList = []
            idsList = await FETCH.nozomi({ fetchAll: false, getRange: true });
            const idJs = await Promise.all(idsList.map(id => FETCH.parsed_id_js(id)));
            if (!idJs.length) return

            const filteredIdJs = UTIL.filter_contents(idJs)
            CREATE.card(filteredIdJs, self.divCardC);
        }
    }

    async function main() {
        await UTIL.check_avif_support()
        await FETCH.gg()

        const hash = window.location.hash

        if (hash.includes("#/viewer")) {
            document.open();
            document.write(HTML.viewer)
            document.close();
        } else {
            const gallery = new Gallery();
            gallery.load();
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
            artist: true,
            tag: true,
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
        orderBy: "",
        term: "",
        indexObj: {},
        randomUsed: new Set(),
        gg: new Function()
    }

    const HTML = {
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
                table tr td a {
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                    word-break: break-all;
                    text-decoration: none;
                }
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

                .CardTableContainer table a {color: var(--dimWhite); scrollbar-width: thin;}
                .CardTableContainer table td {color: var(--dimWhite)}
                .CardTagsContainer a {margin-right: 5%; text-decoration: none;}
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
                .page {width: fit-content; margin-right: 3px;}
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

                .BadgeBlue, .BadgeGreen, .BadgeGrey, .BadgeRed {
                    border-radius: var(--radius);
                    padding: 0.35em 0.65em;
                    font-size: 0.75em;
                    font-weight: 700;
                    color: var(--white);
                    margin-left: 3px;
                }

                .BadgeGrey {background-color: var(--grey);}
                .BadgeBlue {background-color: var(--blue);}
                .page {width: fit-content;}
            </style>
        </head>
        <body>
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
        </body>
        </html>
        `,
    }

    await main()
})()
