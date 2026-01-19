import { Package } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground py-6 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Swift Delivery
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
