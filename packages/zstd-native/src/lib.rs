use std::io::Cursor;

use napi::bindgen_prelude::*;
use napi::Result;
use napi_derive::napi;
use zstd::stream::copy_encode;

const DEFAULT_LEVEL: i32 = 3;

#[napi]
pub async fn compress(data: Buffer, level: Option<i32>) -> Result<Buffer> {
    let level = level.unwrap_or(DEFAULT_LEVEL);
    let mut dest = Vec::new();
    copy_encode(&data[..], &mut dest, level)?;
    Ok(dest.into())
}

#[napi]
pub fn compress_sync(data: Buffer, level: Option<i32>) -> Result<Buffer> {
    let level = level.unwrap_or(DEFAULT_LEVEL);
    let mut dest = Vec::new();
    copy_encode(&data[..], &mut dest, level)?;
    Ok(dest.into())
}

#[napi]
pub async fn compress_with_dictionary(
    data: Buffer,
    dictionary: Buffer,
    level: Option<i32>,
) -> Result<Buffer> {
    let level = level.unwrap_or(DEFAULT_LEVEL);

    let mut dest = Vec::new();
    let mut encoder = zstd::stream::Encoder::with_dictionary(&mut dest, level, &dictionary)?;

    let mut data = Cursor::new(data.to_vec());
    std::io::copy(&mut data, &mut encoder)?;
    encoder.finish()?;

    Ok(dest.into())
}

#[napi]
pub async fn decompress(data: Buffer) -> Result<Buffer> {
    let data = Cursor::new(data.to_vec());
    let mut dest = Vec::new();
    zstd::stream::copy_decode(data, &mut dest)?;
    Ok(dest.into())
}

#[napi]
pub fn decompress_sync(data: Buffer) -> Result<Buffer> {
    let data = Cursor::new(data.to_vec());
    let mut dest = Vec::new();
    zstd::stream::copy_decode(data, &mut dest)?;
    Ok(dest.into())
}

#[napi]
pub async fn decompress_with_dictionary(data: Buffer, dictionary: Buffer) -> Result<Buffer> {
    let mut dest = Vec::new();
    let mut decoder = zstd::stream::Decoder::with_dictionary(&data[..], &dictionary[..])?;
    std::io::copy(&mut decoder, &mut dest)?;
    Ok(dest.into())
}
