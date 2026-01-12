import { logger } from '@/lib/logger';

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { canceled } = await searchParams;

  if (canceled) {
    logger.log(
      'Order canceled -- continue to shop around and checkout when you’re ready.'
    );
  }
  return (
    <form action="/api/checkout_sessions" method="POST">
      <section>
        <button type="submit" role="link">
          Checkout
        </button>
      </section>
    </form>
  );
}
