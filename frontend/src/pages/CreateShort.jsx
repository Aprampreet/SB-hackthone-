import { useState, useEffect } from "react";
import { convertYouTubeToShort, applyFilter, applySubtitles } from "../components/api";
import SubtitleStyler from "../components/SubtitleStyler";

export default function CreateShort() {
  const [videoURL, setVideoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [shortData, setShortData] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [subtitlesLoading, setSubtitlesLoading] = useState(false);

  const availableFilters = [
    "grayscale", "sepia", "vignette", "vintage", "sharpen", "warm", "grain",
    "my filter", "rainbowglow", "weddingfilm", "lightning", "y2k_camcorder_look", "dreamy_bloom"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShortData(null);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await convertYouTubeToShort(videoURL);
      setShortData(data);
      setSuccessMessage("Short video created successfully!");
      setVideoURL("");
    } catch (err) {
      console.error("Short creation failed:", err);
      setError(err.message || "Failed to create short. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = async (filterName) => {
    if (!shortData) return;
    setFilterLoading(true);
    setError(null);
    try {
      const updatedVideoData = await applyFilter(shortData.id, filterName);
      setShortData(updatedVideoData);
    } catch (err) {
      console.error("Filter application failed:", err);
      setError(err.message || "Failed to apply filter.");
    } finally {
      setFilterLoading(false);
    }
  };

  const handleApplySubtitles = async () => {
    if (!shortData) return;
    setSubtitlesLoading(true);
    setError(null);
    try {
      const updatedVideoData = await applySubtitles(shortData.id);
      setShortData(updatedVideoData);
    } catch (err) {
      console.error("Subtitles failed:", err);
      setError(err.message || "Failed to apply subtitles.");
    } finally {
      setSubtitlesLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-200 p-8">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-12">YouTube Short Generator</h1>

      <div className="flex flex-col-reverse lg:flex-row gap-12">
        {/* Left: Video Preview */}
        {shortData && (
          <div className="flex-1 space-y-6">
            <div className="w-full shadow-xl rounded-3xl overflow-hidden border border-gray-300">
              <video
                src={shortData.short_video_file}
                controls
                className="w-full h-auto max-h-[600px] rounded-xl"
              />
            </div>
            <div className="text-center">
              <a
                href={shortData.short_video_file}
                download="short-video.mp4"
                className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Download Video
                <svg
                  className="ml-2 w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm7-3l4-4H9V3a1 1 0 10-2 0v7H5l4 4z" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Right: Form + Filters + SubtitleStyler */}
        <div className="flex-1 space-y-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-lg font-semibold text-gray-700">YouTube Video URL</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={videoURL}
              onChange={(e) => setVideoURL(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5 0 0 5 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                "Create Short"
              )}
            </button>
          </form>

          {successMessage && (
            <div className="text-green-700 bg-green-100 border border-green-300 rounded-lg p-4">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="text-red-700 bg-red-100 border border-red-300 rounded-lg p-4">
              {error}
            </div>
          )}

          {/* Filters */}
          {shortData && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Apply Filters</h2>
              <div className="flex flex-wrap gap-3">
                {availableFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleApplyFilter(filter)}
                    disabled={filterLoading || loading}
                    className="bg-gradient-to-tr from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-sm text-gray-800 font-medium py-2 px-4 rounded-full transition border border-gray-300 shadow-sm"
                  >
                    {filter}
                  </button>
                ))}
              </div>
              {filterLoading && (
                <p className="text-gray-500 text-sm mt-2">Applying filter...</p>
              )}

              {/* Subtitle Styling */}
              <SubtitleStyler onSubmit={(style) => console.log("Subtitle style:", style)} />

              {/* Apply Subtitle Button */}
              <div className="pt-4">
                <button
                  onClick={handleApplySubtitles}
                  disabled={subtitlesLoading || loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50"
                >
                  {subtitlesLoading ? "Applying Subtitles..." : "Add Subtitles"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
