'use client'

import React from 'react'

// URL regex pattern - matches http(s)://, www., and common TLDs
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|co|edu|gov|app|dev|me|info|biz|us|uk|ca|au|de|fr|jp|cn|in|br|ru|nl|se|no|fi|dk|it|es|ch|at|be|pl|pt|cz|hu|gr|ie|nz|za|mx|ar|cl|kr|sg|hk|tw|my|ph|th|vn|id|ae|sa|il|eg|ng|ke|gh|tz|ug|rw|et|ma|dz|tn)(?:\/[^\s<]*)?/gi

interface LinkifyProps {
  text: string
  className?: string
}

/**
 * Renders text with URLs converted to clickable links
 * Opens links in new tab with security attributes
 */
export function Linkify({ text, className }: LinkifyProps) {
  if (!text) return null

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Reset regex state
  URL_REGEX.lastIndex = 0

  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const url = match[0]
    // Ensure URL has protocol for href
    const href = url.startsWith('http') ? url : `https://${url}`

    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    )

    lastIndex = match.index + url.length
  }

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  // If no URLs found, just return the text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>
  }

  return <span className={className}>{parts}</span>
}
