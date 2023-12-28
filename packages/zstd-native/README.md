# @ryanke/zstd-native

Do YOU need fast zstd wrapper with

- decompression _and_ compression
- typescript support
- dictionary support
- async and sync apis
- bun support

Well, you're in luck.

Uses [napi-rs](https://github.com/napi-rs/napi-rs) and [zstd-rs](https://github.com/gyscos/zstd-rs) to generate a native node module that works with node and bun.

```ts
export function compress(data: Buffer, level?: number | undefined | null): Promise<Buffer>;
export function compressSync(data: Buffer, level?: number | undefined | null): Buffer;
export function compressWithDictionary(
  data: Buffer,
  dictionary: Buffer,
  level?: number | undefined | null,
): Promise<Buffer>;

export function decompress(data: Buffer): Promise<Buffer>;
export function decompressSync(data: Buffer): Buffer;
export function decompressWithDictionary(data: Buffer, dictionary: Buffer): Promise<Buffer>;
```
