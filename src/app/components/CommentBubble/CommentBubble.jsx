import { useEffect, useState } from 'react';
import styles from './styles.module.css';

const DEFAULT_COMMENT = '❤️ ❤️ ❤️';

const CommentBubble = ({ comment }) => {
  const [displayedComment, setDisplayedComment] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setDisplayedComment(comment || DEFAULT_COMMENT);
      setIsTransitioning(false);
    }, 300);
  }, [comment]);

  useEffect(() => {
    const glowInterval = setInterval(() => {
      setIsGlowing(true);
      setTimeout(() => setIsGlowing(false), 1000);
    }, Math.random() * 5000 + 3000); // Entre 3 y 8 segundos

    return () => clearInterval(glowInterval);
  }, []);

  return (
    <div className={`
      ${styles.commentBubble} 
      ${styles.floating}
    `}>
      <div className={`
        ${styles.bubbleContent}
        ${isGlowing ? styles.glow : ''}
      `}>
        <div className={styles.glowEffect} />
        
        <p className={`
          ${styles.commentText} 
          ${isTransitioning ? styles.fadeOut : styles.fadeIn}
        `}>
        {displayedComment || '❤️ ❤️ ❤️'}
        </p>

        <div className={styles.decorationTop} />
        <div className={styles.decorationBottom} />
      </div>
    </div>
  );
};

export default CommentBubble;