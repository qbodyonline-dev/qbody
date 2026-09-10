import React from 'react'

/**
 * Resolve a Vimeo / YouTube / direct video URL into an embeddable element.
 * Single source of truth — used by the classic course page and the course
 * landing template (previously two diverging copies).
 */
export function getVideoEmbed(url: string, className = 'w-full h-full'): React.ReactNode {
  if (!url) return null
  try {
    // Vimeo: https://vimeo.com/123456789
    if (url.includes('vimeo.com')) {
      const id = url.replace(/https?:\/\/(www\.)?vimeo\.com\//, '').split('?')[0].split('/')[0]
      if (id) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${id}`}
            className={className}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Video"
          />
        )
      }
    }
    // YouTube: watch?v=, youtu.be/, /embed/, /shorts/ — параметры в любом порядке
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = ''
      if (url.includes('youtube.com/watch')) {
        videoId = new URL(url).searchParams.get('v') || ''
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/').pop()?.split('?')[0] || ''
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/').pop()?.split('?')[0] || ''
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('/shorts/').pop()?.split('?')[0] || ''
      }
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className={className}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video"
          />
        )
      }
    }
    // Direct video file
    return <video src={url} controls playsInline className={`${className} object-contain`} />
  } catch {
    return <video src={url} controls playsInline className={`${className} object-contain`} />
  }
}
