import swiftDeliveryLogo from "@/assets/swift-delivery-logo.png";

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground py-6 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <img 
            src={swiftDeliveryLogo} 
            alt="Swift Delivery" 
            className="h-10 object-contain brightness-0 invert"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
