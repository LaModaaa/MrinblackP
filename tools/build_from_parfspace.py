# Собирает каталог сайта (data/all.json) из витрины поставщика parfumoteka.parfspace.ru.
# Вход: JSON-словарь {ключ: [бренд, название, тип, пол W/M/U, семейство, ноты, фото, "вариант~цена|…"]}
# (выгружается из браузера – их сервер не пускает прямые запросы с этого компьютера).
# Запуск: python tools/build_from_parfspace.py _src/parfspace.json
# Выход (коротко, чтобы файл был лёгким):
#   {"brands": [[бренд, число ароматов], ...],
#    "items":  [[номер бренда, название, тип, варианты через «|», фото, тестер 0/1, пол, ноты], ...]}
import json, os, sys

ROOT = os.path.join(os.path.dirname(__file__), "..")
src = json.load(open(sys.argv[1], encoding="utf-8"))

def photo(p):  # «/media/opt/fr_1.jpg?n=1» → «fr_1.jpg?n=1»: префикс один на всех, хранить его 28 тысяч раз незачем
    return p.split("/media/opt/", 1)[1] if "/media/opt/" in p else p

rows = sorted(src.values(), key=lambda r: (r[0].lower(), r[1].lower()))
brands, items, index = [], [], {}
for b, title, typ, gender, family, notes, ph, variants in rows:
    b = b.strip() or "Без бренда"
    if b.lower() not in index:
        index[b.lower()] = len(brands)
        brands.append([b, 0])
    bi = index[b.lower()]
    names = [v.rsplit("~", 1)[0].strip() for v in variants.split("|") if v.strip()]
    tester = 1 if any("тестер" in n.lower() for n in names) else 0
    items.append([bi, title.strip(), typ.strip(), "|".join(names), photo(ph), tester, gender or "", notes])
    brands[bi][1] += 1

out = os.path.join(ROOT, "data", "all.json")
json.dump({"brands": brands, "items": items}, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# самопроверка: ссылки на бренды верные, числа сходятся
assert all(0 <= it[0] < len(brands) for it in items)
assert sum(b[1] for b in brands) == len(items)
print("брендов:", len(brands), "ароматов:", len(items), "с фото:", sum(1 for i in items if i[4]), "размер:", os.path.getsize(out) // 1024, "КБ")
