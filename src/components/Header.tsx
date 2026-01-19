import { Package } from "lucide-react";

const Header = () => {
  return (
    <header className="gradient-navy text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">
            Express Logistics
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
