import { createFileRoute, Link } from '@tanstack/solid-router';
import { createSignal } from 'solid-js';
import { Button } from "~/components/ui/button"

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount((prev) => prev + 1);

  return (
    <div class="p-4">
      <h1 class="text-4xl text-green-700 text-center py-10">Home</h1>
      <p class="text-center text-xl">Count: {count()}</p>
      <div class="text-center mt-4">
        <Button onclick={increment}>
          Increment
        </Button>
      </div>
      <div class="text-center mt-8">
        <Link to="/about" class="text-blue-500 hover:underline">
          Go to About
        </Link>
      </div>
    </div>
  );
}
