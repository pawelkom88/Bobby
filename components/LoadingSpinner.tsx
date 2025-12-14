import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function LoadingSpinner({
  text,
  heading,
}: {
  text?: string;
  heading?: string;
}) {
  const t = useTranslations('loadingSpinner');
  
  // Use provided text/heading or fallback to translations
  const displayText = text || t('defaultText');
  const displayHeading = heading || t('defaultHeading');
  return (
    <div className="bobby-loading-spinner">
      <h1 className="conversation-subtitle">{displayHeading}</h1>
      <p className="conversation-subtitle-text">{displayText}</p>
      <br />
      <Image
        src="/bobby-connecting.png"
        alt={t('alt')}
        className="floating-bobby"
        width={200}
        height={250}
      />
    </div>
  );
}
