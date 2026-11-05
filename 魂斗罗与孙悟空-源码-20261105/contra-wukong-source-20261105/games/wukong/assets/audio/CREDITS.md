# Enemy death cries

Source: [Male Grunt/Yelling sounds](https://opengameart.org/content/male-gruntyelling-sounds)

Author: HaelDB. Original page offers CC0 and OGA-BY 3.0; these files use the CC0 option.

License: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

Original archive: https://opengameart.org/sites/default/files/yelling%20sounds.zip

`enemy-death-1.ogg`, `enemy-death-2.ogg`, `enemy-death-3.ogg` derive from `1yell8.wav`, `2yell1.wav`, `3yell7.wav` respectively. Edits: remove initial silence; trim to 0.78 seconds; high/low-pass filtering; short fades; loudness normalization; mono 24 kHz Vorbis compression. Playback adds slight pitch variation and lowers the voice for the giant boss.

Source archive and untouched selected WAVs are kept in `.playwright-mcp/wukong-voices/` for reproduction; the game loads only the three small Ogg files.

# Wukong attack efforts and staff sounds (legacy v1)

`wukong-effort-1.ogg`, `wukong-effort-2.ogg`, `wukong-effort-3.ogg` and `wukong-battle-shout.ogg` use `3grunt3.wav`, `3grunt4.wav`, `3grunt5.wav`, `3grunt6.wav` from the same [HaelDB recording pack](https://opengameart.org/content/male-gruntyelling-sounds), under its CC0 1.0 option. These are nonverbal male effort recordings, distinct from the enemy death clips; no actor or television character voice is imitated. Edits: trim leading silence, high/low-pass filtering, a modest tempo increase, short fades, loudness normalization, mono 24 kHz Vorbis compression.

The seven `staff-{swing,heavy,spin,qi,ultimate,charge,land}.ogg` effects are original procedural audio built with seeded noise, resonant tones and amplitude envelopes. They contain no third-party recordings.

Rebuild with `python games/wukong/tools/build-hero-audio.py`; unmodified selected WAVs and intermediate SFX stay in `.playwright-mcp/wukong-hero-audio/`. Filter settings, file hashes and byte sizes are in `hero-audio-build.json`. Eleven new runtime clips total 70,035 bytes. Runtime playback uses the game's SFX channel and its existing volume controls.

# Recorded staff sources: natural-v2 (2026-10-26, still used)

The hero's normal swing, heavy swing and flower-staff sounds now use field recordings of actual sticks moving through air, not the legacy synthesized white-noise/tone sounds. Public CC0 preview sources:

- [Dalesome — Woosh (stick swung in the air)](https://freesound.org/people/Dalesome/sounds/352719/): thin-stick recording, used in `staff-air-1-v2.ogg` and `staff-air-spin-v2.ogg`.
- [HoloDOOMy — Woosh](https://freesound.org/people/HoloDOOMy/sounds/810065/): broom-stick recording, used in `staff-air-2-v2.ogg`.
- [Sadiquecat — Stick - Whoosh 16](https://freesound.org/people/Sadiquecat/sounds/802458/): short stick recording, used in `staff-air-3-v2.ogg`.
- [Sadiquecat — Whoosh - Big stick - OS ST 1](https://freesound.org/people/Sadiquecat/sounds/855704/): larger-stick/bamboo recording, used in `staff-air-heavy-v2.ogg`.

Edits: mono mixdown, high/low-pass filtering, modest tempo changes, trimming, fades and loudness normalization. No metallic clash recordings are mixed into these swing sounds.

The former `wukong-call-{1,2,3,4}-v2.ogg` contain the Mandarin lines “看棒！”, “哪里跑！”, “嘿！” and “吃俺老孙一棒！”, synthesized locally with Microsoft Kangkang. These synthetic callouts and the earlier nonverbal grunts are historical assets; the hero no longer loads them.

The four magic/landing effects (`staff-qi.ogg`, `staff-ultimate.ogg`, `staff-charge.ogg`, `staff-land.ogg`) remain procedural project audio and play at reduced runtime levels. The staff sources can be rebuilt with `python games/wukong/tools/build-natural-hero-audio.py --offline` when the raw sources are cached. That older builder also reproduces the historical synthetic callouts, without overwriting the current user clips. Its sources and processing are in `natural-hero-audio-build.json`.

# Original supplied hero voice: user-voice-v3 (2026-10-26, retained)

Source: the user's supplied `合集.mp3` (6.48 seconds), provided for replacing the game's four hero callouts. The submitted recording is preserved in `tools/sources/wukong-calls-user-20261026.mp3`; no separate public license is asserted for this user-provided audio.

`wukong-call-{1,2,3,4}-user-v3.ogg` replace all four synthetic callouts. Cuts correspond to “看棒！” (1.08–1.86s), “哪里跑！” (2.74–3.81s), the short effort “嘿！” (0–0.32s), and “吃俺老孙一棒！” (4.55–6.32s). Processing preserves pitch and playback speed: short edge fades, two-pass loudness normalization, mono 24 kHz Vorbis compression. These four clips total 38,924 bytes; the full thirteen-clip runtime bank totals 92,675 bytes.

Rebuild offline with `python games/wukong/tools/build-user-hero-calls.py`; supply `--source PATH` to cache a new original. Exact cut bounds, filters, source hash and clip hashes are in `user-hero-voice-build.json`. Runtime uses the existing occasional callout cadence, voice priority, SFX volume and mute controls.

# Current dialogue expansion: dialogue-v4 (2026-10-26)

The four original user clips remain unchanged. Twelve additional Mandarin lines were synthesized locally, conditioned on the user's same supplied recording and transcript. These are synthetic extensions of the supplied voice reference, not new original recordings or the historical Microsoft SAPI voice. No recording was sent to an external synthesis service.

Generator: [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS), using the official [Qwen3-TTS-12Hz-0.6B-Base](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-Base) model (Apache-2.0), revision `5d83992436eae1d760afd27aff78a71d676296fc`. Model weights and the Python tool environment are local build caches, excluded from Git and never loaded by the webpage.

Text and gameplay categories are in `tools/dialogue-lines.json`; reproducible synthesis/compression is in `tools/build-dialogue-voices.py`. The source hash, model revision, generation settings, individual file hashes, durations and filters are recorded in `dialogue-voice-build.json`. The reference's original pitch and tempo are retained; generated WAVs receive silence trimming, edge fade, two-pass loudness normalization and mono 24 kHz Vorbis compression. New clips total 133,789 bytes; the complete 25-clip attack bank totals 226,464 bytes.

Playback rotates ordinary, heavy, qi and ultimate pools, excludes the last four lines, and requires at least 24 seconds before reusing a line. The iconic long shout is excluded from ordinary/heavy/qi pools and uses a shared 60-second cooldown. A finisher retains dialogue history rather than resetting it. Sound effects remain independent of dialogue choices and the combat RNG.

### Weapon contact sounds · 2026-10-29

The six `staff-impact-*.ogg` files are original procedural audio generated by project code: seeded noise, a short crack, low body resonance and damped armor overtones. They contain no external recordings. Reproduce with `tools/build-impact-audio.py`; file hashes and durations are in `impact-audio-build.json`. Confirmed contacts use a separate three-voice channel from air swings and dialogue.
