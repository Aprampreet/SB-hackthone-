import { useState, useEffect } from "react";

const googleFontList = [
  "Roboto",
  "Open Sans",
  "Inter",
  "Poppins",
  "Lato"
];

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
    <div className="w-full px-8 py-6 space-y-10">
      <h2 className="text-3xl font-bold text-gray-800">✨ Style Your Subtitles</h2>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Font Family */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Font</label>
          <select
            className="w-full border-gray-300 rounded-md p-2 shadow-sm bg-white focus:ring-2 focus:ring-blue-400"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            {googleFontList.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Size: {fontSize}px
          </label>
          <input
            type="range"
            min="30"
            max="120"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full appearance-none bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 h-2 rounded-full"
          />
        </div>

        {/* Font Weight */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Weight: {fontWeight} ({fontWeightLabels[fontWeight] || "Custom"})
          </label>
          <input
            type="range"
            min="100"
            max="900"
            step="100"
            value={fontWeight}
            onChange={(e) => setFontWeight(Number(e.target.value))}
            className="w-full appearance-none bg-gradient-to-r from-pink-200 via-purple-300 to-indigo-500 h-2 rounded-full"
          />
        </div>

        {/* Color Picker + Hex */}
        <div className="col-span-full sm:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-12 rounded-full border border-gray-300 shadow-sm cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-32 text-sm focus:outline-none focus:ring focus:border-blue-400"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div
        className="relative border rounded-xl bg-gray-900 text-white py-12 px-6 text-center shadow-xl"
        style={{
          backgroundImage:
            "radial-gradient(#ffffff22 1px, transparent 1px), radial-gradient(#ffffff22 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0,10px 10px",
        }}
      >
        <p
          className="transition-all duration-300 ease-in-out"
          style={{
            fontFamily: `"${fontFamily}", sans-serif`,
            fontSize: `${fontSize}px`,
            fontWeight,
            color,
            textShadow: "0px 0px 5px rgba(0,0,0,0.3)",
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
