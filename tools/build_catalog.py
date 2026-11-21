# Собирает весь ассортимент поставщика из скачанных страниц (_src/raw) в data/all.json для сайта.
# Запуск: python tools/build_catalog.py
# Формат (коротко, чтобы файл был лёгким):
#   {"brands": [[название бренда, число ароматов], ...],
#    "items":  [[номер бренда, название аромата, тип, объёмы через «|», файл фото, тестер 0/1], ...]}
import html, json, os, re

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "_src")
brands_html = open(os.path.join(SRC, "brands.html"), encoding="utf-8").read()
brand_list = re.findall(r'<a href="/brand/([^"]+)">([^<]+)<span class="muted">(\d+)', brands_html)

LI = re.compile(r"<li>(.*?)</li>", re.S)
IMG = re.compile(r'<img src="/media/photos/([^"/]+)"')
NAME = re.compile(r"<b>([^<]+)</b>")
INFO = re.compile(r'<div class="small muted">([^<]*)</div>')

def strip_brand(name, brand):
    # «Chanel Chance» → «Chance»; если бренд в названии написан иначе – оставляем как есть
    if name.lower().startswith(brand.lower() + " "):
        return name[len(brand) + 1:].strip()
    return name

def ml(v):
    m = re.match(r"([\d.,]+)", v)
    return float(m.group(1).replace(",", ".")) if m else 0

brands, items, missing = [], [], 0
for slug, bname, count in brand_list:
    path = os.path.join(SRC, "raw", slug + ".html")
    if not os.path.exists(path):
        missing += 1
        continue
    bname = html.unescape(bname).strip()
    page = open(path, encoding="utf-8").read()
    ul = page.split('class="frag-list"', 1)
    if len(ul) < 2:
        continue
    seen, n = set(), 0
    for li in LI.findall(ul[1].split("</ul>", 1)[0]):
        nm = NAME.search(li)
        if not nm:
            continue
        name = html.unescape(nm.group(1)).strip()
        info = html.unescape((INFO.search(li) or [None, ""])[1]).split(" · ")
        typ = info[0].strip() if info else ""
        vols = sorted({v.strip() for v in (info[1].split(",") if len(info) > 1 else []) if v.strip()}, key=ml)
        tester = 1 if "тестер" in " ".join(info[2:]) else 0
        img = IMG.search(li)
        title = strip_brand(name, bname)
        key = (title.lower(), typ.lower())
        if key in seen:  # один аромат с одинаковым типом встречается дважды (разные склады) – объединяем
            continue
        seen.add(key)
        items.append([len(brands), title, typ, "|".join(vols), img.group(1) if img else "", tester])
        n += 1
    if n:
        brands.append([bname, n])

os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
out = os.path.join(ROOT, "data", "all.json")
json.dump({"brands": brands, "items": items}, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# самопроверка: каждый аромат ссылается на существующий бренд, у бренда верное число ароматов
assert all(0 <= it[0] < len(brands) for it in items)
assert sum(b[1] for b in brands) == len(items)
print("брендов:", len(brands), "ароматов:", len(items), "без страницы:", missing, "размер:", os.path.getsize(out) // 1024, "КБ")
