# ZP Bedrock Music Player

Minecraft Bedrock Edition 1.26.60 personal music player add-on.

## Project layout

- `behavior_pack/`: command registration, player UI, and per-player playback state.
- `resource_pack/`: custom OGG sound assets and sound definitions.
- `docs/CUSTOM_SONGS.md`: how to add licensed OGG tracks.

## Install

1. Import both packs into Minecraft.
2. Enable the behavior pack and resource pack in the target world.
3. Ensure Script API is enabled and supported by the target 1.26.60 runtime.
4. Run `/music`. The fully qualified command is `/zp_music:music`.

The command is registered with the Script API custom command registry. It is not implemented by trying to intercept slash commands as chat messages.

## Add your own music

See [docs/CUSTOM_SONGS.md](docs/CUSTOM_SONGS.md). Bedrock scripts cannot browse arbitrary files on a player's phone or dynamically load MP3/OGG files. Tracks must be packaged in the resource pack and registered in `sound_definitions.json` and the behavior pack track catalogue.

## Design

Playback state is held per player. Playback commands affect only the player who invoked them. This repository does not include copyrighted music.
