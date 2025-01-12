import { useState, useEffect } from "react";

function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [progress, setProgress] = useState("");
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  useEffect(() => {
    const videoId = extractVideoId(videoUrl);
    if (videoId) {
      setThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    } else {
      setThumbnail("");
    }
  }, [videoUrl]);

  const extractVideoId = (url) => {
    const regex =
      /(?:https?:)?(?:\/\/)?(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const checkStatus = async (videoId, retries = 0) => {
    if (retries > 30) {
      setError("Conversion is taking too long. Please try again.");
      setLoading(false);
      setProgress("");
      return;
    }

    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_RAPIDAPI_KEY,
        "x-rapidapi-host": "youtube-mp36.p.rapidapi.com",
      },
    };

    try {
      const response = await fetch(
        `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
        options
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      switch (result.status) {
        case "ok":
          setTitle(result.title || "");
          setConvertedUrl(result.link);
          setLoading(false);
          setProgress("");
          break;

        case "processing":
        case "in_queue":
          const progressMsg =
            result.msg || `Converting${".".repeat(retries % 4)}`;
          setProgress(progressMsg);
          setTimeout(() => checkStatus(videoId, retries + 1), 1000);
          break;

        case "fail":
          setError(result.msg || "Conversion failed. Please try again.");
          setLoading(false);
          setProgress("");
          break;

        default:
          setError("Unknown status received. Please try again.");
          setLoading(false);
          setProgress("");
      }
    } catch (error) {
      if (error.message.includes("404")) {
        setError("MP3 link not accessible. Please try again.");
      } else if (error.message.includes("429")) {
        setError("Too many requests. Please try again later.");
      } else {
        setError("An error occurred. Please try again later.");
      }
      console.error("Conversion error:", error);
      setLoading(false);
      setProgress("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConvertedUrl(null);
    setProgress("");

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError("Please enter a valid YouTube URL");
      setLoading(false);
      return;
    }

    checkStatus(videoId);
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-2 sm:p-6'>
      <div className='w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 space-y-8'>
        {/* Logo/Icon Section */}
        <div className='flex justify-center'>
          <div className='bg-blue-600 p-4 rounded-full shadow-lg'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8 text-white'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
              />
            </svg>
          </div>
        </div>

        <div className='text-center'>
          <h1 className='text-2xl sm:text-3xl font-bold text-white mb-2'>
            YouTube to MP3 Converter
          </h1>
          <p className='text-gray-400 text-sm sm:text-base'>
            Convert your favorite YouTube videos to MP3
          </p>
        </div>

        {thumbnail && !convertedUrl && !error && (
          <div className='relative group'>
            <img
              src={thumbnail}
              alt='Video thumbnail'
              className='w-full h-48 object-cover rounded-lg'
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${extractVideoId(
                  videoUrl
                )}/mqdefault.jpg`;
              }}
            />
            <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-12 w-12 text-white'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                />
              </svg>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='relative'>
            <input
              type='text'
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder='Paste YouTube URL here'
              className='w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200'
            />
          </div>
          <button
            type='submit'
            disabled={loading}
            className='w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 font-medium'
          >
            {loading ? (
              <div className='flex items-center justify-center gap-2'>
                <svg
                  className='animate-spin h-5 w-5 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                {progress || "Converting..."}
              </div>
            ) : (
              "Convert to MP3"
            )}
          </button>
        </form>

        {error && (
          <div className='p-4 bg-red-500/10 border border-red-500/50 rounded-lg'>
            <p className='text-red-500 text-center text-sm'>{error}</p>
          </div>
        )}

        {convertedUrl && (
          <div className='p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-center space-y-3'>
            <p className='text-green-400'>Conversion successful!</p>
            {thumbnail && (
              <img
                src={thumbnail}
                alt='Video thumbnail'
                className='w-full h-32 object-cover rounded-lg'
              />
            )}
            {title && <p className='text-sm text-gray-300'>{title}</p>}
            <a
              href={convertedUrl}
              download
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors duration-200'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                />
              </svg>
              Download MP3
            </a>
          </div>
        )}

        {(convertedUrl || error) && (
          <button
            onClick={() => {
              setVideoUrl("");
              setError(null);
              setConvertedUrl(null);
              setTitle("");
              setProgress("");
            }}
            className='w-full px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200'
          >
            Clear & Convert Another
          </button>
        )}
      </div>

      {/* Footer */}
      <div className='mt-8 text-center text-gray-500 text-sm'>
        <p>Made with ❤️ by Rith for Music Lover</p>
      </div>
    </div>
  );
}

export default App;
