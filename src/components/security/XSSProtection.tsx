import React from 'react';
import DOMPurify from 'dompurify';

interface XSSProtectionProps {
  htmlContent: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

const XSSProtection: React.FC<XSSProtectionProps> = ({
  htmlContent,
  className = '',
  allowedTags = ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li'],
  allowedAttributes = ['class', 'id']
}) => {
  const sanitizeHTML = (html: string): string => {
    const config = {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      KEEP_CONTENT: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false
    };

    return DOMPurify.sanitize(html, config);
  };

  const cleanHTML = sanitizeHTML(htmlContent);

  return (
    <div 
      className={`xss-protected ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
    />
  );
};

export default XSSProtection;