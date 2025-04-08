import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from '@emotion/styled';
import type { Theme } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

interface Video {
  id: number;
  url: string;
  title: string;
}

interface MoviePlayerProps {
  videos: Video[];
  isFirstVisit: boolean;
}

const PlayerContainer = styled.div<{ theme?: Theme }>`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const VideoWrapper = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
`;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NavigationButton = styled(motion.button)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  z-index: 10;
  transition: background-color 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const LeftButton = styled(NavigationButton)`
  left: 20px;
`;

const RightButton = styled(NavigationButton)`
  right: 20px;
`;

const WelcomeMessage = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 10px;
  color: white;
  text-align: center;
  z-index: 20;
`;

const UnmuteButton = styled(motion.button)`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  color: white;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const MoviePlayer: React.FC<MoviePlayerProps> = ({ videos, isFirstVisit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showWelcome, setShowWelcome] = useState(isFirstVisit);
  const [playCount, setPlayCount] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [shouldUnmute] = useState(() => {
    const savedMutePreference = localStorage.getItem('videoMuted');
    return savedMutePreference === 'false';
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const tryPlayVideo = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        if (shouldUnmute) {
          setIsMuted(false);
        }
      } catch (error) {
        console.log('Autoplay failed, retrying in muted state');
        if (videoRef.current) {
          videoRef.current.muted = true;
          try {
            await videoRef.current.play();
          } catch (retryError) {
            console.log('Muted autoplay also failed');
          }
        }
      }
    }
  }, [shouldUnmute]);

  const handleVideoEnd = useCallback(() => {
    setPlayCount(prev => prev + 1);
    if (playCount >= 1) {
      setIsPlaying(false);
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        tryPlayVideo();
      }
    }
  }, [playCount, tryPlayVideo]);

  const handleNavigation = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex(prevIndex => {
      if (direction === 'prev') {
        return prevIndex === 0 ? videos.length - 1 : prevIndex - 1;
      } else {
        return prevIndex === videos.length - 1 ? 0 : prevIndex + 1;
      }
    });
    setPlayCount(0);
    setIsPlaying(true);
  }, [videos.length]);

  const handlers = useSwipeable({
    onSwipedLeft: () => handleNavigation('next'),
    onSwipedRight: () => handleNavigation('prev'),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') {
        handleNavigation('prev');
      } else if (e.code === 'ArrowRight') {
        handleNavigation('next');
      } else if (e.code === 'Space') {
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNavigation]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        tryPlayVideo();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex, tryPlayVideo]);

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        tryPlayVideo();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, tryPlayVideo]);

  const handleVideoClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'BUTTON') {
      setIsPlaying(prev => !prev);
    }
  };

  return (
    <PlayerContainer onClick={handleVideoClick} {...handlers}>
      <AnimatePresence mode='wait'>
        {showWelcome && (
          <WelcomeMessage
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h2>Welcome to MovieMe!</h2>
            <p>Swipe or use arrow keys to navigate between videos</p>
          </WelcomeMessage>
        )}
      </AnimatePresence>

      <VideoWrapper
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StyledVideo
          ref={videoRef}
          src={videos[currentIndex].url}
          autoPlay
          playsInline
          muted={isMuted}
          onEnded={handleVideoEnd}
        />
        {isMuted && shouldUnmute && (
          <UnmuteButton
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(false);
              localStorage.setItem('videoMuted', 'false');
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Unmute
          </UnmuteButton>
        )}
      </VideoWrapper>

      <LeftButton
        onClick={() => handleNavigation('prev')}
        whileTap={{ scale: 0.9 }}
      >
        ←
      </LeftButton>
      <RightButton
        onClick={() => handleNavigation('next')}
        whileTap={{ scale: 0.9 }}
      >
        →
      </RightButton>
    </PlayerContainer>
  );
};

export default MoviePlayer;