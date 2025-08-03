import axios from "axios";

const BASE_URL = "http://localhost:8000/api/";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const registerUser = async (username, password) => {
  const res = await axiosInstance.post("auth/register", { username, password });
  return res.data;
};


export const loginUser = async (username, password) => {
  const res = await axiosInstance.post("auth/login", { username, password });
  return res.data;
};


export const logoutUser = () => {
  localStorage.clear();
};


export const convertYouTubeToShort = async (youtube_url) => {
  const res = await axiosInstance.post("core/convert-video", { youtube_url });
  return res.data;
};

export const fetchMyVideos = async () => {
  const res = await axiosInstance.get("core/my-videos");
  return res.data;
};

export const applyFilter = async (videoId, filterName) => {
  const res = await axiosInstance.post(`core/videos/${videoId}/apply-filter`, {
    filter_name: filterName,
  });
  return res.data;
}

export const applySubtitles = async (videoId, style = {}) =>{
  const res = await axiosInstance.post(`core/videos/${videoId}/apply-subtitles`, style);
  return res.data;
}

export default axiosInstance


