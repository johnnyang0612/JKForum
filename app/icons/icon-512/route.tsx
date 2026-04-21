import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 320,
          background: "linear-gradient(135deg, #6366f1, #ec4899)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 900,
          letterSpacing: "-10px",
        }}
      >
        JK
      </div>
    ),
    { width: 512, height: 512 }
  );
}
