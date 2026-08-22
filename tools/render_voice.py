"""Render voice lines to MP3 with edge-tts, idempotently.

Only lines whose text or voice changed are re-rendered, so topping up the
corpus with a handful of new lines costs a handful of requests, not 290.
"""

import hashlib
from dataclasses import dataclass, field

VOICE = "en-US-GuyNeural"  # changing this re-renders every clip


def line_hash(text, voice):
    return hashlib.sha256((voice + "\x00" + text).encode("utf-8")).hexdigest()[:16]


@dataclass
class RenderPlan:
    to_render: list = field(default_factory=list)
    to_delete: list = field(default_factory=list)
    manifest: dict = field(default_factory=dict)


def plan_render(lines, manifest, voice):
    """Decide what to render and what to delete. Pure: no IO, no network."""
    seen = set()
    for line in lines:
        if line["id"] in seen:
            raise ValueError("duplicate line id: " + line["id"])
        seen.add(line["id"])

    known = {entry["id"]: entry for entry in manifest.get("lines", [])}

    plan = RenderPlan()
    entries = []

    for line in lines:
        digest = line_hash(line["text"], voice)
        entry = {"id": line["id"], "file": line["id"] + ".mp3",
                 "category": line["category"], "hash": digest}
        # Trigger and hours are data the page needs; text is not, so it stays
        # out of the manifest the phone downloads.
        if "trigger" in line:
            entry["trigger"] = line["trigger"]
        if "hours" in line:
            entry["hours"] = line["hours"]
        entries.append(entry)

        previous = known.get(line["id"])
        if previous is None or previous.get("hash") != digest:
            plan.to_render.append(line)

    plan.to_delete = [known[i]["file"] for i in known if i not in seen]
    plan.manifest = {"voice": voice, "lines": entries}
    return plan


import asyncio
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE_DIR = os.path.join(ROOT, "voice")
LINES_PATH = os.path.join(VOICE_DIR, "lines.json")
MANIFEST_PATH = os.path.join(VOICE_DIR, "manifest.json")


def read_json(path, fallback):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        return fallback


async def render_one(line, voice):
    import edge_tts
    target = os.path.join(VOICE_DIR, line["id"] + ".mp3")
    await edge_tts.Communicate(line["text"], voice).save(target)
    return target


async def render_all(lines, voice):
    # Serial on purpose: the endpoint is unofficial, and a burst of 290
    # concurrent requests is the fastest way to get rate-limited.
    for i, line in enumerate(lines, 1):
        await render_one(line, voice)
        print("  [%d/%d] %s" % (i, len(lines), line["id"]))


def main():
    os.makedirs(VOICE_DIR, exist_ok=True)
    lines = read_json(LINES_PATH, [])
    manifest = read_json(MANIFEST_PATH, {"voice": VOICE, "lines": []})

    plan = plan_render(lines, manifest, VOICE)

    print("%d line(s); %d to render, %d to delete"
          % (len(lines), len(plan.to_render), len(plan.to_delete)))

    if plan.to_render:
        asyncio.run(render_all(plan.to_render, VOICE))

    for filename in plan.to_delete:
        path = os.path.join(VOICE_DIR, filename)
        if os.path.exists(path):
            os.remove(path)
            print("  removed %s" % filename)

    # Manifest is written last: if rendering dies partway, the old manifest
    # still matches the clips on disk and a re-run resumes cleanly.
    with open(MANIFEST_PATH, "w", encoding="utf-8") as fh:
        json.dump(plan.manifest, fh, indent=1, ensure_ascii=False)
        fh.write("\n")
    print("wrote %s" % os.path.relpath(MANIFEST_PATH, ROOT))


if __name__ == "__main__":
    sys.exit(main())
