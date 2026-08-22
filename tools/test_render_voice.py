import unittest
from render_voice import plan_render, line_hash

VOICE = "en-US-GuyNeural"


def manifest_for(lines, voice=VOICE):
    return {
        "voice": voice,
        "lines": [
            {"id": l["id"], "file": l["id"] + ".mp3",
             "category": l["category"], "hash": line_hash(l["text"], voice)}
            for l in lines
        ],
    }


class PlanRenderTest(unittest.TestCase):
    def test_all_lines_render_when_manifest_is_empty(self):
        lines = [{"id": "a", "category": "wry", "text": "one"}]
        plan = plan_render(lines, {"voice": VOICE, "lines": []}, VOICE)
        self.assertEqual([l["id"] for l in plan.to_render], ["a"])

    def test_unchanged_lines_are_skipped(self):
        lines = [{"id": "a", "category": "wry", "text": "one"}]
        plan = plan_render(lines, manifest_for(lines), VOICE)
        self.assertEqual(plan.to_render, [])

    def test_changed_text_re_renders(self):
        old = [{"id": "a", "category": "wry", "text": "one"}]
        new = [{"id": "a", "category": "wry", "text": "one, revised"}]
        plan = plan_render(new, manifest_for(old), VOICE)
        self.assertEqual([l["id"] for l in plan.to_render], ["a"])

    def test_changing_voice_re_renders_everything(self):
        lines = [{"id": "a", "category": "wry", "text": "one"}]
        plan = plan_render(lines, manifest_for(lines, "en-GB-RyanNeural"), VOICE)
        self.assertEqual([l["id"] for l in plan.to_render], ["a"])

    def test_removed_lines_are_deleted(self):
        old = [{"id": "a", "category": "wry", "text": "one"},
               {"id": "b", "category": "fact", "text": "two"}]
        plan = plan_render(old[:1], manifest_for(old), VOICE)
        self.assertEqual(plan.to_delete, ["b.mp3"])

    def test_manifest_carries_trigger_and_hours_through(self):
        lines = [
            {"id": "r1", "category": "rank", "text": "x",
             "trigger": {"kind": "rank", "over": "Ethiopia", "under": "Mexico"}},
            {"id": "t1", "category": "timeofday", "text": "y", "hours": [0, 5]},
        ]
        plan = plan_render(lines, {"voice": VOICE, "lines": []}, VOICE)
        out = {l["id"]: l for l in plan.manifest["lines"]}
        self.assertEqual(out["r1"]["trigger"]["over"], "Ethiopia")
        self.assertEqual(out["t1"]["hours"], [0, 5])

    def test_manifest_omits_text(self):
        lines = [{"id": "a", "category": "wry", "text": "one"}]
        plan = plan_render(lines, {"voice": VOICE, "lines": []}, VOICE)
        self.assertNotIn("text", plan.manifest["lines"][0])

    def test_duplicate_ids_are_rejected(self):
        lines = [{"id": "a", "category": "wry", "text": "one"},
                 {"id": "a", "category": "fact", "text": "two"}]
        with self.assertRaises(ValueError):
            plan_render(lines, {"voice": VOICE, "lines": []}, VOICE)


if __name__ == "__main__":
    unittest.main()
