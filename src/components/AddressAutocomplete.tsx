import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search function
  const searchAddresses = useCallback(async (query: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const { data, error } = await supabase.functions.invoke('address-autocomplete', {
        body: { query },
      });

      if (error) {
        console.error('Error fetching addresses:', error);
        setSuggestions([]);
      } else if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setIsOpen(data.suggestions.length > 0);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Address search error:', err);
      }
      setSuggestions([]);
    } finally {
      setIsLoading(false);
      setHighlightedIndex(-1);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddresses(value);
    }, 400); // 400ms debounce to respect Nominatim rate limits

    return () => clearTimeout(timer);
  }, [value, searchAddresses]);

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
        <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-[300px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.fullAddress}-${index}`}
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
                  {suggestion.street || suggestion.city}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[suggestion.city, suggestion.postcode, suggestion.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </li>
          ))}
          <li className="px-4 py-2 text-xs text-muted-foreground bg-secondary/50 border-t border-border">
            Powered by OpenStreetMap
          </li>
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
