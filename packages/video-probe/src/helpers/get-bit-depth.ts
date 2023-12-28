export const getBitDepth = (stream: any) => {
  if (stream.bits_per_raw_sample) return stream.bits_per_raw_sample;
  if (stream.pix_fmt) {
    switch (stream.pix_fmt) {
      case "yuv420p10le":
      case "yuv422p10le":
      case "yuv444p10le":
        return 10;
      case "yuv420p12le":
      case "yuv422p12le":
      case "yuv444p12le":
        return 12;
      case "yuv420p":
      case "yuv422p":
      case "yuv444p": {
        if (stream.profile === "High 10") return 10;
        if (stream.profile === "High 4:4:4 Predictive") return 12;
        return null;
      }
      default:
        return null;
    }
  }

  return null;
};

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("should parse bit depth", () => {
    expect(getBitDepth({ bits_per_raw_sample: 8 })).toBe(8);
    expect(
      getBitDepth({
        pix_fmt: "yuv420p",
        profile: "High 10",
      })
    ).toBe(10);
    expect(getBitDepth({})).toBe(null);
  });
}
