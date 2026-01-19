import { Package } from "lucide-react";

const Header = () => {
  return (
    <header className="gradient-dpd text-white py-6 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            Swift Delivery
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
