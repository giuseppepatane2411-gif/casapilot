import { ImageResponse } from "next/og";

export function createSocialPreview() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #020617 0%, #0f2f78 58%, #0b63f6 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "74px 84px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 800 }}>
          <div style={{ alignItems: "center", display: "flex", fontSize: 48, fontWeight: 800 }}>
            <div
              style={{
                alignItems: "center",
                background: "#020617",
                border: "3px solid rgba(255,255,255,.2)",
                borderRadius: 24,
                display: "flex",
                height: 76,
                justifyContent: "center",
                marginRight: 22,
                width: 76,
              }}
            >
              <div
                style={{
                  border: "3px solid white",
                  borderRadius: 999,
                  display: "flex",
                  height: 38,
                  position: "relative",
                  width: 38,
                }}
              >
                <div
                  style={{
                    background: "#57a3ff",
                    borderRadius: 999,
                    height: 24,
                    left: 16,
                    position: "absolute",
                    top: 4,
                    transform: "rotate(35deg)",
                    width: 7,
                  }}
                />
              </div>
            </div>
            <span>Guimm</span><span style={{ color: "#57a3ff" }}>ia</span>
          </div>
          <div style={{ fontSize: 66, fontWeight: 900, letterSpacing: -3, lineHeight: 1.02, marginTop: 52 }}>
            L’agenzia immobiliare digitale.
          </div>
          <div style={{ color: "#dbeafe", fontSize: 29, lineHeight: 1.35, marginTop: 30 }}>
            Vendita e affitto, dalla preparazione dell’annuncio fino alla negoziazione e ai contratti.
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "rgba(255,255,255,.12)",
            border: "2px solid rgba(255,255,255,.2)",
            borderRadius: 999,
            display: "flex",
            fontSize: 70,
            height: 220,
            justifyContent: "center",
            width: 220,
          }}
        >
          <div
            style={{
              border: "8px solid white",
              borderRadius: 999,
              display: "flex",
              height: 104,
              position: "relative",
              width: 104,
            }}
          >
            <div
              style={{
                background: "#57a3ff",
                borderRadius: 999,
                height: 66,
                left: 44,
                position: "absolute",
                top: 11,
                transform: "rotate(35deg)",
                width: 18,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
