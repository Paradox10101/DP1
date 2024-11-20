import { Logo } from '../panel/Logo';

export const Header = () => (
  <header className="bg-white shadow-sm w-full">
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center">
        <Logo className="h-10 w-auto" />
      </div>
    </div>
  </header>
);
