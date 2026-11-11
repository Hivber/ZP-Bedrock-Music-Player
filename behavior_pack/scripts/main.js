import { system, CommandPermissionLevel } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

/**
 * ZP Bedrock Music Player
 * Bedrock 1.26.60
 *
 * Add tracks to TRACKS after registering their sound IDs in the resource pack.
 * Playback state is local to each player; no player receives another player's
 * play/stop commands.
 */
const TRACKS = [
  // Example:
  // { id: "my_track", title: "My Track", artist: "Artist", sound: "zp.music.my_track", duration: 185 }
];

const DEFAULT_VOLUME = 0.7;
const playerStates = new Map();

function stateFor(player) {
  let state = playerStates.get(player.id);
  if (!state) {
    state = {
      index: 0,
      volume: DEFAULT_VOLUME,
      loop: false,
      shuffle: false,
      playing: false,
      timerId: undefined
    };
    playerStates.set(player.id, state);
  }
  return state;
}

function stopPlayback(player, state = stateFor(player)) {
  if (state.timerId !== undefined) {
    system.clearRun(state.timerId);
    state.timerId = undefined;
  }

  const track = TRACKS[state.index];
  if (track?.sound) {
    try {
      player.stopSound(track.sound);
    } catch {
      // A stop request may fail if the sound has already ended or unloaded.
    }
  }
  state.playing = false;
}

function showEmptyLibrary(player) {
  new ActionFormData()
    .title("ZP MUSIC")
    .body(
      "§7你的音乐库目前为空。\n\n" +
      "§f请将授权使用的 OGG 音频加入资源包 §esounds/music/§f，" +
      "在 §esound_definitions.json§f 注册音效，并在行为包 §eTRACKS§f 数组中登记歌曲。\n\n" +
      "§8详细步骤：docs/CUSTOM_SONGS.md"
    )
    .button("§c关闭")
    .show(player)
    .catch(() => {});
}

function showNowPlaying(player) {
  if (TRACKS.length === 0) {
    showEmptyLibrary(player);
    return;
  }

  const state = stateFor(player);
  const track = TRACKS[state.index];
  const form = new ActionFormData()
    .title("ZP MUSIC")
    .body(
      `§f${track.title}\n§7${track.artist || "Unknown artist"}\n\n` +
      `§a${state.playing ? "PLAYING" : "STOPPED"}  §8|  §bVolume ${Math.round(state.volume * 100)}%\n` +
      `§dRepeat ${state.loop ? "ON" : "OFF"}  §8|  §eShuffle ${state.shuffle ? "ON" : "OFF"}`
    )
    .button(state.playing ? "§e■ Stop" : "§a▶ Play")
    .button("§bNext track")
    .button("§bPrevious track")
    .button("§dPlaylist")
    .button("§6Settings")
    .button("§cClose");

  form.show(player).then(result => {
    if (result.canceled || result.selection === undefined) return;

    switch (result.selection) {
      case 0:
        if (state.playing) {
          stopPlayback(player, state);
          showNowPlaying(player);
        } else {
          playTrack(player, state.index);
        }
        break;
      case 1:
        playTrack(player, state.index + 1);
        break;
      case 2:
        playTrack(player, state.index - 1);
        break;
      case 3:
        showPlaylist(player);
        break;
      case 4:
        showSettings(player);
        break;
      default:
        break;
    }
  }).catch(() => {});
}

function playTrack(player, requestedIndex) {
  if (TRACKS.length === 0) {
    showEmptyLibrary(player);
    return;
  }

  const state = stateFor(player);
  stopPlayback(player, state);

  state.index = (requestedIndex + TRACKS.length) % TRACKS.length;
  const track = TRACKS[state.index];

  try {
    player.playSound(track.sound, { volume: state.volume, pitch: 1.0 });
    state.playing = true;

    // The catalogue duration drives track changes; set it to the real duration.
    const durationTicks = Math.max(20, Math.floor((Number(track.duration) || 180) * 20));
    state.timerId = system.runTimeout(() => {
      state.timerId = undefined;
      if (!state.playing) return;

      if (state.loop) {
        playTrack(player, state.index);
      } else if (state.shuffle && TRACKS.length > 1) {
        let nextIndex = state.index;
        while (nextIndex === state.index) {
          nextIndex = Math.floor(Math.random() * TRACKS.length);
        }
        playTrack(player, nextIndex);
      } else if (state.index < TRACKS.length - 1) {
        playTrack(player, state.index + 1);
      } else {
        state.playing = false;
      }
    }, durationTicks);

    player.sendMessage(`§a♫ Now playing: §f${track.title}`);
  } catch (error) {
    state.playing = false;
    player.sendMessage(`§cCould not play ${track.title}. Check the resource-pack sound registration.`);
  }

  showNowPlaying(player);
}

function showPlaylist(player) {
  if (TRACKS.length === 0) {
    showEmptyLibrary(player);
    return;
  }

  const form = new ActionFormData()
    .title("ZP MUSIC - PLAYLIST")
    .body("Select a track:");

  for (const track of TRACKS) {
    form.button(`§f${track.title}\n§7${track.artist || "Unknown artist"}`);
  }
  form.button("§cBack");

  form.show(player).then(result => {
    if (result.canceled || result.selection === undefined) return;
    if (result.selection >= TRACKS.length) {
      showNowPlaying(player);
      return;
    }
    playTrack(player, result.selection);
  }).catch(() => {});
}

function showSettings(player) {
  const state = stateFor(player);

  new ModalFormData()
    .title("ZP MUSIC - SETTINGS")
    .slider("Volume", 0, 100, { valueStep: 5, defaultValue: Math.round(state.volume * 100) })
    .toggle("Repeat current track", { defaultValue: state.loop })
    .toggle("Shuffle playlist", { defaultValue: state.shuffle })
    .show(player)
    .then(result => {
      if (result.canceled || !result.formValues) return;

      const [volume, loop, shuffle] = result.formValues;
      const wasPlaying = state.playing;
      const currentIndex = state.index;

      state.volume = Number(volume) / 100;
      state.loop = Boolean(loop);
      state.shuffle = Boolean(shuffle);

      if (wasPlaying) playTrack(player, currentIndex);
      else showNowPlaying(player);
    })
    .catch(() => {});
}

function openMusicPlayer(player) {
  if (TRACKS.length === 0) {
    showEmptyLibrary(player);
    return;
  }

  const state = stateFor(player);
  new ActionFormData()
    .title("ZP MUSIC")
    .body("§7Personal music player\n§8Playback controls affect only you.")
    .button("§a▶ Play / Resume")
    .button("§b♫ Choose a track")
    .button("§dPlayback settings")
    .button("§cStop playback")
    .show(player)
    .then(result => {
      if (result.canceled || result.selection === undefined) return;
      switch (result.selection) {
        case 0:
          playTrack(player, state.index);
          break;
        case 1:
          showPlaylist(player);
          break;
        case 2:
          showSettings(player);
          break;
        case 3:
          stopPlayback(player, state);
          break;
      }
    })
    .catch(() => {});
}

/*
 * Slash commands are parsed by Minecraft's command dispatcher, not emitted
 * as ordinary chat messages. Register the namespaced custom command at startup.
 */
system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
  customCommandRegistry.registerCommand(
    {
      name: "zp_music:music",
      description: "Open your personal music player",
      permissionLevel: CommandPermissionLevel.Any,
      cheatsRequired: false
    },
    (origin) => {
      const player = origin.sourceEntity ?? origin.initiator;
      if (!player || player.typeId !== "minecraft:player") return;

      // UI operations must be deferred out of the custom-command execution.
      system.run(() => openMusicPlayer(player));
    }
  );
});

// Optional chat alias. Do not attempt to catch '/music' in chatSend.
import { world } from "@minecraft/server";
world.beforeEvents.chatSend.subscribe(event => {
  if (event.message.trim().toLowerCase() !== "!music") return;
  event.cancel = true;
  const player = event.sender;
  system.run(() => openMusicPlayer(player));
});

world.afterEvents.playerLeave.subscribe(event => {
  const state = playerStates.get(event.playerId);
  if (state?.timerId !== undefined) system.clearRun(state.timerId);
  playerStates.delete(event.playerId);
});
