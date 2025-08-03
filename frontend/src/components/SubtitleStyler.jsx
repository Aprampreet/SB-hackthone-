import { useState, useEffect } from "react";

const googleFontList = ["Roboto", "Open Sans", "Inter", "Poppins", "Lato"];

const fontWeightLabels = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi-Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

const SubtitleStyler = ({ onSubmit }) => {
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [fontSize, setFontSize] = useState(80);
  const [fontWeight, setFontWeight] = useState(400);
  const [color, setColor] = useState("#FF0000");

  useEffect(() => {
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
      " ",
      "+"
    )}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, [fontFamily]);

  const handleSubmit = () => {
    onSubmit({
      font: fontFamily,
      fontsize: fontSize,
      bold: fontWeight,
      color,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-10 space-y-12">
      <h2 className="text-4xl font-bold text-gray-800">🎨 Style Your Subtitles</h2>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">Font</label>
          <select
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            {googleFontList.map((font) => (
              <option
                key={font}
                value={font}
                style={{ fontFamily: `"${font}", sans-serif` }}
              >
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Size: <span className="font-semibold">{fontSize}px</span>
          </label>
          <input
            type="range"
            min="30"
            max="120"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full appearance-none h-2 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 rounded-full outline-none"
            style={{ WebkitAppearance: "none" }}
          />
        </div>

        {/* Font Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Weight: <span className="font-semibold">{fontWeight}</span> ({fontWeightLabels[fontWeight] || "Custom"})
          </label>
          <input
            type="range"
            min="100"
            max="900"
            step="1"
            value={fontWeight}
            onChange={(e) => setFontWeight(Number(e.target.value))}
            className="w-full appearance-none h-2 bg-gradient-to-r from-pink-200 via-purple-300 to-indigo-500 rounded-full outline-none"
            style={{ WebkitAppearance: "none" }}
          />
        </div>

        {/* Color Picker */}
        <div className="col-span-full sm:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-12 rounded-full border border-gray-300 shadow-inner cursor-pointer transition hover:scale-105"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-32 px-3 py-2 text-sm rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>

      {/* Range Thumb Styles */}
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #6366f1;
          cursor: pointer;
          margin-top: -8px;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s ease;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        input[type='range']::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #6366f1;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      {/* Live Preview */}
      <div
        className="relative text-white text-center py-16 px-6 rounded-2xl shadow-2xl overflow-hidden bg-gray-900"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.03) 25%, transparent 25%),
            linear-gradient(225deg, rgba(255,255,255,0.03) 25%, transparent 25%),
            linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
            linear-gradient(315deg, rgba(255,255,255,0.03) 25%, transparent 25%)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, rgba(233, 233, 233, 0), transparent 60%)`,
            zIndex: 0,
          }}
        />
        <p
          className="relative z-10 transition-all duration-300 ease-in-out"
          style={{
            fontFamily: `"${fontFamily}", sans-serif`,
            fontSize: `${fontSize}px`,
            fontWeight,
            color,
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
          }}
        >
          This is a live subtitle preview
        </p>
      </div>

      <div className="text-right">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-lg"
        >
          Generate Styled Subtitles
        </button>
      </div>
    </div>
  );
};

export default SubtitleStyler;
