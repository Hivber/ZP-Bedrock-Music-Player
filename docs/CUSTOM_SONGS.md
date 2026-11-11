# Adding custom OGG tracks

Bedrock add-on scripts cannot browse arbitrary files on a player's device, read local MP3 files, or register new sound assets dynamically at runtime. Custom tracks must be packaged in the resource pack.

## 1. Add the audio file

Copy a licensed or original OGG/Vorbis file to:

`resource_pack/sounds/music/my_track.ogg`

Use simple lowercase filenames.

## 2. Register the sound

Add an entry to `resource_pack/sound_definitions.json`:

```json
{
  "zp.music.my_track": {
    "category": "music",
    "sounds": [
      {
        "name": "sounds/music/my_track",
        "stream": true
      }
    ]
  }
}
```

If the file already contains other entries, preserve them and add another property to the same JSON object.

## 3. Add the track to the catalogue

Edit `behavior_pack/scripts/main.js` and add an object to the `TRACKS` array:

```js
{
  id: "my_track",
  title: "Track title",
  artist: "Artist name",
  sound: "zp.music.my_track",
  duration: 185
}
```

Set `duration` to the actual track length in seconds. The current player uses this value to schedule the next track.

## 4. Repackage and import

Rebuild/re-import both packs after changing the audio or catalogue. Enable both packs in the same world.

## Notes

- Use OGG/Vorbis audio and test file size and playback on the target device.
- `stream: true` is appropriate for longer tracks.
- Only include music you created or are licensed to distribute.
- Each player has separate playback state and volume.
