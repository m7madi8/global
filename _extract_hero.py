import json

path = r"C:\Users\eslam\.cursor\projects\d-projects-global-company\agent-transcripts\7abbfe3d-555a-4830-8710-da1054d056b1\7abbfe3d-555a-4830-8710-da1054d056b1.jsonl"
out = r"d:\projects\global company\_hero_extract.txt"
wanted = {227, 232, 246, 301, 302, 303, 304, 305, 306}

with open(path, encoding="utf-8") as f, open(out, "w", encoding="utf-8") as w:
    for i, line in enumerate(f, 1):
        if i not in wanted:
            continue
        obj = json.loads(line)
        content = obj.get("message", {}).get("content", [])
        texts = []
        if isinstance(content, list):
            for c in content:
                if isinstance(c, dict) and c.get("type") == "text":
                    texts.append(c.get("text", ""))
        text = "\n".join(texts)
        idx = text.find("<user_query>")
        q = text[idx:] if idx >= 0 else text
        w.write(f"\n\n===== LINE {i} role={obj.get('role')} len={len(q)} =====\n")
        w.write(q[:20000])

print("ok")
