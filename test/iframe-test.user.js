// ==UserScript==
// @name         hitomi.la image fetch
// @namespace    example
// @version      1.0
// @match        https://ltn.gold-usergeneratedcontent.net/favicon-192x192.png
// @grant        GM_xmlhttpRequest
// @connect      a2.gold-usergeneratedcontent.net
// ==/UserScript==

(function () {
    const url = "https://a2.gold-usergeneratedcontent.net/1770717601/1022/83014c8a189243ad3b0ad531f76d3d91378bbc4dd2fe78c73e1d31906f05dfe3.avif";

    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        responseType: "blob",
        headers: {
            "Referer": "https://hitomi.la/"
        },
        onload: function (res) {
            if (res.status !== 200) {
                console.error("取得失敗", res.status);
                return;
            }

            const blobUrl = URL.createObjectURL(res.response);

            // 表示テスト
            const img = document.createElement("img");
            img.src = blobUrl;
            img.style.maxWidth = "400px";
            document.body.appendChild(img);
        },
        onerror: function (err) {
            console.error("通信エラー", err);
        }
    });
})();

