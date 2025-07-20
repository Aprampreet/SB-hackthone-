"use client"

import { useEffect, useState } from "react"
import { fetchMyVideos } from "../components/api" // Your API function

export default function ListMyVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // For simple error display

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await fetchMyVideos()
        setVideos(data)
      } catch (err) {
        console.error("Failed to fetch videos:", err)
        setError("Unable to load your videos. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    loadVideos()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center p-4">
        <div className="flex flex-col items-center text-gray-700">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mb-4"
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
          <p className="text-xl font-medium">Loading your shorts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md text-center">
          <p className="text-lg font-semibold mb-2">Error Loading Videos</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center text-gray-600">
          <p className="text-2xl font-semibold mb-4">No videos found.</p>
          <p className="text-md">Start by creating your first short video!</p>
          {/* You might add a link/button to Create Short page here */}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900">Your YouTube Shorts</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <video
                src={video.short_video_file}
                controls
                // Removed 'aspect-video' and 'object-cover' to not alter dimensions
                className="w-full rounded-t-xl" // Video will take full width, height will be natural
                aria-label={`Video preview for ${video.title || "Untitled"}`}
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{video.title || "Untitled Video"}</h3>
                <p className="text-sm text-gray-600">Uploaded: {new Date(video.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
