import { useState, useEffect } from 'react'
import axios from 'axios'

function Dashboard() {
  const [urls, setUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUrls()
  }, [])

  const fetchUrls = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/urls')
      setUrls(response.data)
    } catch (err) {
      console.error('Error details:', err)
      if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please make sure the backend server is running.')
      } else {
        setError('Failed to fetch URLs. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Your Shortened URLs</h1>
      
      {urls.length === 0 ? (
        <div className="text-center text-gray-500">
          No shortened URLs yet. Go to the home page to create one!
        </div>
      ) : (
        <div className="space-y-4">
          {urls.map((url) => (
            <div key={url.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Original URL:</div>
                  <div className="truncate">{url.original_url}</div>
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500">Short URL:</div>
                  <div className="text-primary-600">
                    {`http://localhost:8000/${url.short_code}`}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Created: {new Date(url.created_at).toLocaleDateString()}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Clicks: {url.clicks}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard 