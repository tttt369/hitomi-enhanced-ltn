import os
import re
import sys
import json
import asyncio
import aiohttp
import aiofiles
from lxml import etree, html
from aiohttp import ClientResponseError
from typing import Optional, Dict, Any

CONFIG = {
    "download_sitemap": True,
    "read_local_sitemap": True,
    "download_js": True,
    "read_local_js": True,
    "sitemap_batch_size": 10,
    "js_batch_size": 500,
}
PATH = {
    "dir": {
        "sitemap": "../data/sitemap",
        "idjs": "../data/id_js",
    },
    "dmm_json": "../data/dmm.json",
}
STATE = {
    "search_string": "%65E5%672C%8A9E",  # 日本語
    "id_regex": re.compile(r"%2D(\d+)\.html$"),
    "json_regex": re.compile(r"^var galleryinfo = ({.*})$", re.MULTILINE),
}
HITOMI_STATE = {
    "sitemap_index_url": "https://ltn.gold-usergeneratedcontent.net/sitemap.xml",
    "loc": ".//sitemap:loc",
    "ns": {
        "sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9",
        "urlset": "http://www.sitemaps.org/schemas/sitemap/0.9",
    },
}
DMM_STATE = {
    "sitemap_index_url": "https://www.dmm.co.jp/dc/doujin/sitemap_image.xml",
    "loc": ".//default:loc",
    "url_loc": ".//default:url",
    "ns": {
        "default": "http://www.sitemaps.org/schemas/sitemap/0.9",
        "image": "http://www.google.com/schemas/sitemap-image/1.1",
    },
}
for path in PATH["dir"].values(): os.makedirs(path, exist_ok=True)

class Sitemap:
    @staticmethod
    async def get_content(session, url: str) -> bytes:
        filename = os.path.basename(url)
        if CONFIG["read_local_sitemap"]:
            local_path = os.path.join(PATH["dir"]["sitemap"], filename)
            if os.path.exists(local_path):
                async with aiofiles.open(local_path, "rb") as f:
                    return await f.read()

        async with session.get(url) as response:
            content = await response.read()

            if CONFIG["download_sitemap"]:
                local_path = os.path.join(PATH["dir"]["sitemap"], filename)
                if not os.path.exists(local_path):
                    async with aiofiles.open(local_path, "wb") as f:
                        print("download to local", local_path)
                        await f.write(content)
        return content

    @staticmethod
    async def process_index(session, state: dict) -> list[str]:
        sitemap_index_content = await Sitemap.get_content(session, state["sitemap_index_url"])
        root = etree.fromstring(sitemap_index_content)
        sitemap_urls = [loc.text for loc in root.findall(state["loc"], state["ns"])]
        print("Found", len(sitemap_urls), "sitemaps.")
        return sitemap_urls

    @staticmethod
    async def process(session, sitemap_urls: list[str], state: dict):
        count = 0
        for i in range(0, len(sitemap_urls), CONFIG["sitemap_batch_size"]):
            batch = sitemap_urls[i:(i + CONFIG["sitemap_batch_size"])]
            print(f"{i} // {len(sitemap_urls)}")
            tasks = [Sitemap.get_content(session, url) for url in batch]
            results = await asyncio.gather(*tasks)

            for content, sitemap_url in zip(results, batch):
                content = Util.clean_xml_bytes(content)
                root = etree.fromstring(content)
                for url_elem in root.findall(state["url_loc"], state["ns"]):
                    count += 1
                    yield url_elem
                print(sitemap_url)
        print("found", count)

class Dmm:
    @staticmethod
    async def make_json(found_urls) -> Dict[str, Any]:
        dmm_dict = {}
        async for url_elem in found_urls:
            image_title_elem = url_elem.find('.//image:title', DMM_STATE["ns"])
            loc_elem = url_elem.find('.//default:loc', DMM_STATE["ns"])

            first_image_title = image_title_elem.text
            loc_url = loc_elem.text
            dmm_dict[first_image_title] = {
                "url": loc_url
            }
        await Util.write_json(PATH["dmm_json"], dmm_dict)
        return dmm_dict

class Util:
    @staticmethod
    def clean_xml_bytes(content: bytes) -> bytes:
        return re.sub(b'[\x00-\x08\x0b\x0c\x0e-\x1f]', b'', content)

    @staticmethod
    async def write_json(path: str, content: Dict) -> None:
        async with aiofiles.open(path, "w", encoding="utf-8") as f:
            await f.write(json.dumps(content, ensure_ascii=False, indent=4))
        print("Saved data to", path)

async def update_id_js():
    sitemap_urls = []; found_urls = []

    async with aiohttp.ClientSession() as session:
        sitemap_urls = await Sitemap.process_index(session, HITOMI_STATE)
    print(sitemap_urls)

async def make_dmm_index():
    async with aiohttp.ClientSession() as session:
        sitemap_urls = await Sitemap.process_index(session, DMM_STATE)
        dmm_dict = await Dmm.make_json(Sitemap.process(session, sitemap_urls, DMM_STATE))
    print(sitemap_urls)

async def main():
    args = sys.argv[1:]
    if not (len(args) >= 1):
        print("args must be <function name>")
        return

    function = args[0]

    match function:
        case "update":
            await update_id_js()
        case "make_dmm_index":
            await make_dmm_index()
        case _:
            print("function not found")
            return

if __name__ == "__main__":
    asyncio.run(main())
