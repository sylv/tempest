import * as skhaz from "@skhaz/zstd";
import { bench, describe } from "vitest";
import { ZSTDDecoder } from "zstddec";
import * as ours from "../dist/index";
import { compress } from "../dist/index";

// @ts-expect-error missing types
import * as cppzst from "cppzst";

const level = 3;
const decompressed = Buffer.from(
  "Hello world, this is a test string that will be compressed and decompressed. How are you doing today?",
  "utf8",
);

const compressed = await compress(decompressed, level);

describe("compress", async () => {
  bench("@ryanke/zstd-native async", async () => void (await ours.compress(decompressed, level)));
  bench("@ryanke/zstd-native sync", () => void ours.compressSync(decompressed, level));
  bench("@skhaz/zstd async", async () => void (await skhaz.compress(decompressed, { level })));
  bench("@skhaz/zstd sync", () => void skhaz.compressSync(decompressed, { level }));
  bench("cppzst async", () => cppzst.compress(decompressed, { level }));
  bench("cppzst sync", () => cppzst.compressSync(decompressed, { level }));
});

describe("decompress", async () => {
  bench("@ryanke/zstd-native async", async () => void (await ours.decompress(compressed)));
  bench("@ryanke/zstd-native sync", () => void ours.decompressSync(compressed));
  bench("@skhaz/zstd async", async () => void (await skhaz.decompress(compressed)));
  bench("@skhaz/zstd sync", () => void skhaz.decompressSync(compressed));
  bench("cppzst async", () => cppzst.decompress(compressed));
  bench("cppzst sync", () => cppzst.decompressSync(compressed));

  // for some reason this errors without being passed the length, which... ??
  const decoder = new ZSTDDecoder();
  await decoder.init();
  bench("zstddec", () => void decoder.decode(compressed, decompressed.length));
});
