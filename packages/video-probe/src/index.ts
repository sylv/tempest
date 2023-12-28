import { AudioCodec, VideoCodec, parseAudioCodec, parseVideoCodec } from "@ryanke/parsers/codecs";
import { LanguageType } from "@ryanke/parsers/language";
import { Resolution, findResolution } from "@ryanke/parsers/resolution";
import { execa } from "execa";
import { array, boolean, coerce, nativeEnum, strictObject, string, z } from "zod";
import { getBitDepth } from "./helpers/get-bit-depth";
import { getBitrate } from "./helpers/get-bitrate";
import { getDuration } from "./helpers/get-duration";
import { getLanguage, getLanguageTypeFromDisposition } from "./helpers/get-language";

export { AudioCodec, LanguageType, Resolution, VideoCodec };

export type ProbeResult = z.infer<typeof schema>;
export type AudioStream = ProbeResult["audio_streams"][number];
export type SubtitleStream = ProbeResult["subtitle_streams"][number];
export type ImageStream = ProbeResult["image_streams"][number];
export type VideoStream = ProbeResult["video_stream"];
export type Stream = AudioStream | SubtitleStream | ImageStream | VideoStream;

export interface ProbeFileOptions {
  ffprobePath?: string;
}

const schema = strictObject({
  video_stream: strictObject({
    index: coerce.number(),
    codec: nativeEnum(VideoCodec).nullable(),
    height: coerce.number(),
    width: coerce.number(),
    resolution: nativeEnum(Resolution).nullable(),
    duration_s: coerce.number().nullable(),
    fps: coerce.number(),
    profile: string(),
    bitrate: coerce.number().nullable(),
    bit_depth: coerce.number().nullable(),
  }).optional(),
  image_streams: array(
    strictObject({
      index: coerce.number(),
      width: coerce.number(),
      height: coerce.number(),
      resolution: nativeEnum(Resolution).nullable(),
      filename: string().optional(),
      mime_type: string(),
    })
  ),
  audio_streams: array(
    strictObject({
      index: coerce.number(),
      codec: nativeEnum(AudioCodec).nullable(),
      channels: coerce.number(),
      bitrate: coerce.number().nullable(),
      sample_rate: coerce.number(),
      profile: string().nullable().optional(),
      is_default: boolean().nullable().optional(),
      language_iso639: string().nullable().optional(),
      language_type: nativeEnum(LanguageType).nullable().optional(),
    })
  ),
  subtitle_streams: array(
    strictObject({
      index: coerce.number(),
      codec: string(),
      is_default: boolean(),
      language_iso639: string().nullable().optional(),
      language_type: nativeEnum(LanguageType).nullable().optional(),
    })
  ),
});

export const probeFile = async (filePath: string, options?: ProbeFileOptions): Promise<ProbeResult> => {
  const ffprobePath = options?.ffprobePath || "ffprobe";
  const probeResult = await execa(ffprobePath, [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);

  const json: Record<string, any> = JSON.parse(probeResult.stdout);
  const result: ProbeResult = {
    video_stream: undefined,
    audio_streams: [],
    subtitle_streams: [],
    image_streams: [],
  };

  for (const stream of json.streams) {
    if (stream.codec_type === "video") {
      if (stream.codec_name === "mjpeg") {
        if (!stream.tags.mimetype) continue;
        const resolution = findResolution({ height: stream.height, width: stream.width });
        if (!resolution) continue;
        result.image_streams.push({
          index: stream.index,
          width: stream.width,
          height: stream.height,
          resolution: resolution,
          filename: stream.tags.filename,
          mime_type: stream.tags.mimetype,
        });

        continue;
      }

      const codec = parseVideoCodec(stream.codec_name);
      const fpsParts = stream.r_frame_rate.split("/");
      const fps = Number(fpsParts[0]) / Number(fpsParts[1]);
      const duration = getDuration(stream, json.streams) || json.format.duration;

      if (
        result.video_stream &&
        result.video_stream.duration_s &&
        duration &&
        result.video_stream.duration_s > duration
      ) {
        // skip this stream if its shorter than the current one
        // this is unlikely, but hopefully means we get the "primary" stream.
        continue;
      }

      const bitrate = await getBitrate(stream);
      result.video_stream = {
        index: stream.index,
        codec: codec,
        height: stream.height,
        width: stream.width,
        resolution: findResolution({ height: stream.height, width: stream.width }),
        duration_s: duration,
        fps: fps,
        profile: stream.profile,
        bitrate: bitrate,
        bit_depth: getBitDepth(stream),
      };
    } else if (stream.codec_type === "audio") {
      const codec = parseAudioCodec(stream.codec_name);
      const bitrate = getBitrate(stream);
      const parsed: AudioStream = {
        index: stream.index,
        codec: codec,
        channels: stream.channels,
        bitrate: bitrate,
        sample_rate: stream.sample_rate,
        profile: stream.profile,
        is_default: stream.disposition?.default === 1,
        language_type: getLanguageTypeFromDisposition(stream.disposition),
      };

      const language = getLanguage(stream);
      if (language) {
        parsed.language_type = language.type;
        parsed.language_iso639 = language.language;
      }

      result.audio_streams.push(parsed);
    } else if (stream.codec_type === "subtitle") {
      const parsed: SubtitleStream = {
        index: stream.index,
        codec: stream.codec_name,
        is_default: stream.disposition?.default === 1,
      };

      const language = getLanguage(stream);
      if (language) {
        parsed.language_type = language.type;
        parsed.language_iso639 = language.language;
      }

      result.subtitle_streams.push(parsed);
    }
  }

  if (result.video_stream?.bitrate === null && json.format.size && result.video_stream.duration_s) {
    // we can set the video stream bitrate to the file bitrate and subtract other streams bitrates, if any
    let fileBitRate = (+json.format.size / result.video_stream.duration_s) * 8;
    for (const stream of result.audio_streams) {
      if (!stream.bitrate) continue;
      fileBitRate -= +stream.bitrate;
    }

    result.video_stream.bitrate = fileBitRate;
  }

  return schema.parse(result);
};
