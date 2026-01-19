import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: AddressSuggestion) => void;
  placeholder?: string;
}

export interface AddressSuggestion {
  fullAddress: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
}

// Simulated UK addresses for prototype
const sampleAddresses: AddressSuggestion[] = [
  { fullAddress: "10 Downing Street, London, SW1A 2AA", street: "10 Downing Street", city: "London", postcode: "SW1A 2AA", country: "UK" },
  { fullAddress: "123 Oxford Street, London, W1D 2LG", street: "123 Oxford Street", city: "London", postcode: "W1D 2LG", country: "UK" },
  { fullAddress: "45 Baker Street, London, NW1 5LA", street: "45 Baker Street", city: "London", postcode: "NW1 5LA", country: "UK" },
  { fullAddress: "78 Piccadilly, London, W1J 8HP", street: "78 Piccadilly", city: "London", postcode: "W1J 8HP", country: "UK" },
  { fullAddress: "221B Baker Street, London, NW1 6XE", street: "221B Baker Street", city: "London", postcode: "NW1 6XE", country: "UK" },
  { fullAddress: "1 Market Street, Manchester, M1 1PT", street: "1 Market Street", city: "Manchester", postcode: "M1 1PT", country: "UK" },
  { fullAddress: "25 Corporation Street, Birmingham, B2 4LP", street: "25 Corporation Street", city: "Birmingham", postcode: "B2 4LP", country: "UK" },
  { fullAddress: "50 Queen Street, Glasgow, G1 3DN", street: "50 Queen Street", city: "Glasgow", postcode: "G1 3DN", country: "UK" },
  { fullAddress: "15 High Street, Edinburgh, EH1 1SR", street: "15 High Street", city: "Edinburgh", postcode: "EH1 1SR", country: "UK" },
  { fullAddress: "8 Castle Street, Liverpool, L2 0NE", street: "8 Castle Street", city: "Liverpool", postcode: "L2 0NE", country: "UK" },
  { fullAddress: "33 Park Lane, Leeds, LS1 5DL", street: "33 Park Lane", city: "Leeds", postcode: "LS1 5DL", country: "UK" },
  { fullAddress: "12 Bridge Street, Bristol, BS1 2AA", street: "12 Bridge Street", city: "Bristol", postcode: "BS1 2AA", country: "UK" },
];

const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing your address...",
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulate API delay and filtering
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const filtered = sampleAddresses.filter((addr) =>
        addr.fullAddress.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setIsOpen(filtered.length > 0);
      setIsLoading(false);
      setHighlightedIndex(-1);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.street);
    onSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="input-field pr-10"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.fullAddress}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? "bg-primary/10"
                  : "hover:bg-secondary"
              }`}
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {suggestion.street}
                </p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.city}, {suggestion.postcode}
                </p>
              </div>
            </li>
          ))}
          <li className="px-4 py-2 text-xs text-muted-foreground bg-secondary/50 border-t border-border">
            Start typing to search for your address
          </li>
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
