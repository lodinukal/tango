import io
import json

i = io.open("input.txt", mode="r", encoding="utf-8").read()
out = []

l = i.splitlines()
for x in range (0, len(l), 3):
    word = l[x]
    kana = l[x + 1]
    audio = l[x + 2]
    examples = []

    out.append({"id": int(x/3), "word": word, "kana": kana, "audio": audio, "examples": examples})

o = io.open("output.json", mode="w", encoding="utf-8")
o.write(json.dumps({"info": {}, "items": out}, ensure_ascii=False, indent=4))
