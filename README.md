# ZP Bedrock Music Player

Minecraft Bedrock Edition 1.26.60 personal music player add-on.

## Project layout

- `behavior_pack/`: command registration, player UI, and per-player playback state.
- `resource_pack/`: custom OGG sound assets and sound definitions.
- `docs/CUSTOM_SONGS.md`: how to add licensed OGG tracks.

## Install

1. Import both packs into Minecraft.
2. Enable the behavior pack and resource pack in the target world.
3. Ensure the target 1.26.60 runtime supports the declared stable Script API modules.
4. Run `/music` in chat. Minecraft automatically provides the short chat alias for the registered namespaced command; `/zp_music:music` is the fully qualified form.

The command is registered with the Script API custom command registry. It is not implemented by trying to intercept slash commands as chat messages.

## Add your own music

See [docs/CUSTOM_SONGS.md](docs/CUSTOM_SONGS.md). Bedrock scripts cannot browse arbitrary files on a player's phone or dynamically load MP3/OGG files. Tracks must be packaged in the resource pack and registered in `sound_definitions.json` and the behavior pack track catalogue.

## Design

Playback state is held per player. Playback commands affect only the player who invoked them. This repository does not include copyrighted music.
