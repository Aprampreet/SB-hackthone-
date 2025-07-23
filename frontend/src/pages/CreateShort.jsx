
import { useState } from "react" 
import { convertYouTubeToShort ,applyFilter } from "../components/api" 

export default function CreateShort() {
  const [videoURL, setVideoURL] = useState("")
  const [loading, setLoading] = useState(false)
  const [shortData, setShortData] = useState(null) 
  const [error, setError] = useState(null) 
  const [successMessage, setSuccessMessage] = useState(null)
  const [filterLoading, setFilterLoading] = useState(false);
  const availableFilters = ["grayscale", "sepia", "vignette",'vintage','sharpen','warm','grain','my filter','rainbowglow','weddingfilm','lightning','y2k_camcorder_look','dreamy_bloom'];
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setShortData(null)
    setError(null)
    setSuccessMessage(null)

    try {
      const data = await convertYouTubeToShort(videoURL)
      setShortData(data)
      setSuccessMessage("Short video created successfully!")
      setVideoURL("")
    } catch (err) {
      console.error("Short creation failed:", err)
      setError(err.message || "Failed to create short. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-gray-900">Create Your Short Video</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Video URL
            </label>
            <input
              id="youtube-url"
              type="url"
              placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              className="border border-gray-300 rounded-lg p-3 w-full text-gray-800 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         transition-all duration-200 text-base"
              value={videoURL}
              onChange={(e) => setVideoURL(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg w-full
                       transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 text-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              "Create Short"
            )}
          </button>
        </form>

        {successMessage && (
          <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md text-center font-medium">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md text-center font-medium">
            {error}
          </div>
        )}

        {shortData && (
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold mb-5 text-center text-gray-900">Short Preview</h2>
            
            <video
                src={shortData.short_video_file}
                controls
                className="w-full rounded-t-xl" 
                
              />
              <div className="mt-6">
              <h3 className="text-lg font-semibold text-center text-gray-800 mb-3">
                Apply a Filter
              </h3>
              <div className="flex justify-center flex-wrap gap-3">
                {availableFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleApplyFilter(filter)}
                    disabled={filterLoading || loading}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
              {filterLoading && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  Applying filter...
                </p>
              )}
            </div>

            {shortData.short_video_file && (
              <div className="mt-6 text-center">
                <a
                  href={shortData.short_video_file}
                  download="short-video.mp4"
                  className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg
                             transition-colors duration-200 text-lg shadow-md"
                >
                  Download Video
                  <svg
                    className="ml-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
