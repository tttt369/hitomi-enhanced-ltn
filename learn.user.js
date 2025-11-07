// ==UserScript==
// @name         learn
// @namespace    Violentmonkey Scripts
// @match        https://ltn.gold-usergeneratedcontent.net/*
// @grant        none
// @version      1.1
// @author       -
// ==/UserScript==

(function() {
    'use strict';

    const head = `
    <head>
        <title>hitomi</title>
        <script src="lazysizes.min.js" async=""></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

        <style>
            body {margin: 0; background-color: #212529;}
            input {background-color: #212529; border: 1px solid #495057; border-radius: 0.375rem;}
            i {color: white;}
            tr th {width: 100%;}
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
            #eye {margin-left: 1%;}
            .CardContainer {display: flex; flex-wrap: wrap; justify-content: space-around; height: 1000px; color: white; background-color: #242528; margin: 5% 3% auto 3%;}
            .CardTableContainer {display: flex; flex-direction: column; align-items: center; overflow-x: auto;}
            .CardTitle {font-weight: bold; text-decoration: none; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; word-break: break-all; margin: 2% auto 7% auto;}
            .CardTagsContainer {scrollbar-width: none; display: flex; overflow-x: auto; white-space: nowrap; background-color: #00000038; margin: 3%; width: 100%;}
            .CardTagsContainer a {margin-right: 5%; text-decoration: none;}
            #page {margin-left: 5%; width: fit-content;}
            .Card {display: flex; flex-direction: column; flex: 1 1 194px; max-width: 220px; height: 475px; margin: 1%; background-color: #212529; overflow: hidden; justify-content: space-around;}
            .Card img {height: 220px;}
        </style>
    </head>
    `

    const html = `
    <body>
        <div class="Container">
            <div class="NavbarContainer">
                <img src="//ltn.gold-usergeneratedcontent.net/logo.png"></img>
                <div class="InputContainer">
                    <div class="SearchContainer">
                        <input type="text">
                        <button class="btn_gren_out" type="button">Search</button>
                    </div>
                    <div class="DefaultQueryContainer">
                        <input type="text">
                        <button class="btn_gren_out" type="button">Save</button>
                    </div>
                </div>
            </div>
            <div class="PickerContainer">
                <i id="eye" class="bi bi-eyedropper"></i>
                <div class="BtnContainer">
                    <button class="btn_gren">
                        <i class="bi bi-plus-circle-fill"></i>
                    </button>
                    <button class="btn_red">
                        <i class="bi bi-dash-circle-fill"></i>
                    </button>
                </div>
            </div>
            <div class="CardContainer">
            </div>
        </div>
    </body>
    `
    const galleries_per_page = 25;
    const domain = 'ltn.gold-usergeneratedcontent.net';
    const nozomi = [];
    let number_of_outstanding_requests = 0;

    function fetchNozomi() {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'index-all.nozomi', true);
        xhr.responseType = 'arraybuffer';
        xhr.setRequestHeader('Range', 'bytes=0-99');

        xhr.onload = function() {
            if (xhr.status === 200 || xhr.status === 206) {
                const arrayBuffer = xhr.response;
                const view = new DataView(arrayBuffer);
                const totalBytes = view.byteLength;
                for (let i = 0; i < totalBytes; i += 4) {
                    nozomi.push(view.getUint32(i, false));
                }

                console.log(nozomi.slice(0, 10));
                const result = put_results_on_page();
                return result
            }
        };

        xhr.onerror = () => console.error('nozomi 取得失敗');
        xhr.send();
    }

    function put_results_on_page() {
        const results_obj = {};
        const results_list = [];
        const end = Math.min(nozomi.length, galleries_per_page);

        for (let i = 0; i < end; ++i) {
            const galleryId = nozomi[i];
            const url = `//${domain}/galleryblock/${galleryId}.html`;
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onload = function() {
                ++number_of_outstanding_requests;
                if (xhr.status === 200) {
                    // results_obj[url] = rewrite_tn_paths(xhr.responseText);
                    results_obj[url] = (xhr.responseText);
                    --number_of_outstanding_requests;
                };
                if (number_of_outstanding_requests === 0) {
                    results_list.push(results_obj[url])
                };
            }
            xhr.send();
        }
        return results_list

    }

    function get_block(url) {

    }

    function rewrite_tn_paths(html) {
        let retval = '';
        let base = '';
        let dir = '';
        const r_url = html.replace(/\/\/tn\.hitomi\.la\/[^\/]+\/[0-9a-f]\/[0-9a-f]{2}\/[0-9a-f]{64}/g);
        if (!base) {
            if (dir === 'webp') retval = 'w';
            else if (dir === 'avif') retval = 'a';
        }

        const match = r_url.match(/\/[0-9a-f]{61}([0-9a-f]{2})([0-9a-f])/);
        if (!match) return retval;

        const g = parseInt(match[2] + match[1], 16);
        const channel = g % 3; // 0,1,2 → a,b,c
        const sub = String.fromCharCode(97 + channel);

        base ? sub + base : retval + (1 + channel);
        return r_url.replace(/\/\/..?\.(?:hitomi\.la|gold-usergeneratedcontent\.net)\//, `//${base}.${domain2}/`);
    }

    document.documentElement.innerHTML = html;
    document.head.insertAdjacentHTML('beforeend', head);
    const results_list = fetchNozomi()
    if (results_list.length > 0) {
        console.log(results_list);
    };

})();
