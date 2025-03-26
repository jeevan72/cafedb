import { useState } from 'react'
import axios from 'axios'

function Home() {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setShortUrl('')

    try {
      // Ensure URL has protocol
      let urlToShorten = url
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        urlToShorten = 'https://' + url
      }

      const response = await axios.post('http://localhost:8000/api/shorten', { url: urlToShorten })
      setShortUrl(`http://localhost:8000/${response.data.short_code}`)
    } catch (err) {
      console.error('Error details:', err)
      if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please make sure the backend server is running.')
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to shorten URL. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8">
        Shorten Your Links
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your URL here (e.g., example.com)"
            className="input"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            You can enter URLs with or without http:// or https://
          </p>
        </div>
        
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Shortening...' : 'Shorten URL'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {shortUrl && (
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Your Shortened URL:</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shortUrl}
              readOnly
              className="input flex-1"
            />
            <button
              onClick={copyToClipboard}
              className="btn btn-primary"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home 