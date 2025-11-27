import Image from 'next/image';

export default function LoadingSpinner({
  text = 'Bobby is getting ready to chat!',
  heading = 'Just a moment ...',
}) {
  return (
    <div className="bobby-loading-spinner">
      <h1 className="conversation-subtitle">{heading}</h1>
      <p className="conversation-subtitle-text">{text}</p>
      <br />
      <Image
        src="/bobby-connecting.png"
        alt="Bobby is getting ready to chat"
        className="floating-bobby"
        width={200}
        height={250}
      />
    </div>
  );
}
