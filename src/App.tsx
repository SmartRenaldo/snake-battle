// src/App.tsx

import { useState } from "react";
import Game from "./Game";
import { SkinType, skins } from "./config/gameConfig";

function App() {
  // State for selected skin
  const [selectedSkin, setSelectedSkin] = useState<SkinType>("default");

  return (
    <div className="app">
      <header className="app-header">
        <h1
          style={{
            textAlign: "center",
            color: "#88FF88",
            marginBottom: "0.5rem",
            fontFamily: "Arial, sans-serif",
            fontSize: "2.5rem",
          }}
        >
          Snake Battle
        </h1>

        {/* Skin selector */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          {Object.entries(skins).map(([skinId, skin]) => (
            <button
              key={skinId}
              onClick={() => setSelectedSkin(skinId as SkinType)}
              style={{
                backgroundColor:
                  selectedSkin === skinId ? "#00AA00" : "#333333",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                margin: "0 0.5rem",
                borderRadius: "5px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              {skin.name}
            </button>
          ))}
        </div>
      </header>

      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
        }}
      >
        <Game selectedSkin={selectedSkin} />
      </main>

      <footer
        style={{
          textAlign: "center",
          color: "#AAAAAA",
          fontSize: "0.8rem",
          marginTop: "1rem",
          padding: "1rem",
        }}
      >
        © 2025 Snake Battle Game - Use mouse to control, hold left button to
        boost.
      </footer>
    </div>
  );
}

export default App;
