#!/bin/sh
# Скачивает открытые страницы брендов поставщика в _src/raw/ (уже скачанные пропускает – можно перезапускать).
# Новые подключения к их серверу часто зависают, поэтому качаем пачками по 40 страниц через одно соединение,
# в 3 потока, каждый не чаще 1 страницы в секунду – так их сайт не перегружается.
# Запуск из папки сайта: sh tools/fetch_supplier.sh
cd "$(dirname "$0")/.." || exit 1
mkdir -p _src/raw
[ -s _src/brands.html ] || curl -s -A "Mozilla/5.0" --retry 5 --retry-all-errors --max-time 30 -o _src/brands.html https://parfumoteka-opt.ru/brands || exit 1
grep -o 'href="/brand/[^"]*"' _src/brands.html | sed 's|href="/brand/||; s|"$||' > _src/slugs.txt
total=$(wc -l < _src/slugs.txt)
for round in 1 2 3; do
  # пустые и обрезанные файлы удаляем – скачаются заново
  for f in _src/raw/*.html; do [ -f "$f" ] && ! grep -q '</html>' "$f" && rm -f "$f"; done
  : > _src/todo.txt
  while read -r slug; do [ -s "_src/raw/$slug.html" ] || echo "$slug" >> _src/todo.txt; done < _src/slugs.txt
  left=$(wc -l < _src/todo.txt)
  echo "проход $round: осталось $left из $total"
  [ "$left" -eq 0 ] && break
  rm -f _src/batch_*
  split -l 40 _src/todo.txt _src/batch_
  for b in _src/batch_*; do
    while read -r slug; do printf 'url = "https://parfumoteka-opt.ru/brand/%s"\noutput = "_src/raw/%s.html"\n' "$slug" "$slug"; done < "$b" > "$b.cfg"
  done
  ls _src/batch_*.cfg | xargs -P 3 -I{} curl -s -A "Mozilla/5.0" --rate 60/m --max-time 900 --connect-timeout 20 -K {}
  rm -f _src/batch_*
  echo "скачано: $(ls _src/raw | wc -l)"
done
echo "готово: $(ls _src/raw | wc -l) из $total"
