import Image from 'next/image';
import CartoonButton from '@/components/CartoonButton';
import { ROUTES } from '@/lib/routes';

export default function NotFound() {
  return (
    <div className="planet-container">
      <div className="planet">
        <div className="planet-image-container">
          <Image
            className="planet-image"
            src="/bobby-404.webp"
            alt="Planet"
            width={800}
            height={575}
          />
        </div>
        <div className="crater crater1"></div>
        <div className="crater crater2"></div>
        <div className="crater crater3"></div>
        <div className="crater crater4"></div>
      </div>
      <CartoonButton containerClassName="button404" asLink href={ROUTES.HOME}>
        Go Home
      </CartoonButton>
    </div>
  );
}
