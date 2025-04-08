import React, { useEffect, useState } from 'react';
import MoviePlayer from './components/MoviePlayer';

interface Video {
  id: number;
  url: string;
  title: string;
}

const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstVisit] = useState(() => {
    const visited = localStorage.getItem('visited');
    if (!visited) {
      localStorage.setItem('visited', 'true');
      return true;
    }
    return false;
  });

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          'https://movieme.rf.gd/assets/get_random_movies.php',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ exclude_ids: [] }),
          }
        );

        const data = await response.json();

        if (data.no_more_new_videos) {
          alert('No more new videos available.');
          setVideos([]);
        } else {
          const transformed = data.map((item: any) => ({
            id: item.id,
            url: item.video_url,
            title: item.title,
          }));
          setVideos(transformed);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) return <p style={{ textAlign: 'center' }}>Loading videos...</p>;

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {videos.length > 0 ? (
        <MoviePlayer videos={videos} isFirstVisit={isFirstVisit} />
      ) : (
        <p style={{ textAlign: 'center' }}>No videos to display.</p>
      )}
    </div>
  );
};

export default App;
