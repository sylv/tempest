# @ryanke/video-probe

Extract information from video files using ffprobe.
The output is a clean subset of the ffprobe output with some additional information inferred.

## example

```ts
import { probeFile, AudioCodec, LanguageType, Resolution, VideoCodec } from "@ryanke/video-probe";

const result = await probeFile("path/to/file.mkv");
const result = {
  video_stream: {
    index: 0,
    codec: VideoCodec.HEVC,
    height: 816,
    width: 1920,
    resolution: Resolution.HD_1080,
    duration_s: 5945.981708,
    fps: 23.976023976023978,
    profile: "Main 10",
    bitrate: 2698208,
    bit_depth: 10,
  },
  image_streams: [],
  audio_streams: [
    {
      index: 1,
      codec: AudioCodec.AAC,
      channels: 6,
      bitrate: 321134,
      sample_rate: 48000,
      profile: "LC",
      is_default: true,
      language_iso639: "en",
      language_type: null,
    },
    {
      index: 2,
      codec: AudioCodec.AAC,
      channels: 2,
      bitrate: 79999,
      sample_rate: 48000,
      profile: "HE-AAC",
      is_default: false,
      language_iso639: "en",
      language_type: null,
    },
  ],
  subtitle_streams: [
    {
      index: 3,
      codec: "dvd_subtitle",
      is_default: true,
      language_iso639: "en",
      language_type: null,
    },
    {
      index: 4,
      codec: "dvd_subtitle",
      is_default: true,
      language_iso639: "en",
      language_type: LanguageType.Forced,
    },
    {
      index: 5,
      codec: "dvd_subtitle",
      is_default: false,
      language_iso639: "es",
      language_type: null,
    },
  ],
};
```

## zstd

This package comes with a zstd dictionary that you can use to compress the output in either messagepack or json format.
It's unused by the library itself, and is only there for convenience. You can import it from `@ryanke/video-probe/probe.dict` or `dist/probe.dict`.
