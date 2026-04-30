import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
  Platform,
} from 'react-native';
import ShinyWrapper from './ShinyWrapper';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

interface SearchResult {
  id: string;
  name: string;
  fullAddress: string;
  coordinates: [number, number]; // [lng, lat]
}

interface SearchBarProps {
  onSelectResult: (coordinates: [number, number], name: string) => void;
  onClear: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

export default function SearchBar({ onSelectResult, onClear, userLocation }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const searchPlaces = useCallback(
    async (text: string) => {
      if (text.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);

      try {
        let url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
          text
        )}&access_token=${MAPBOX_TOKEN}&limit=5`;

        // Bias results toward user's location
        if (userLocation) {
          url += `&proximity=${userLocation.longitude},${userLocation.latitude}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.features) {
          const mapped: SearchResult[] = data.features.map((feature: any) => ({
            id: feature.id || feature.properties?.mapbox_id || Math.random().toString(),
            name: feature.properties?.name || feature.properties?.full_address || 'Unknown',
            fullAddress:
              feature.properties?.full_address ||
              feature.properties?.place_formatted ||
              '',
            coordinates: feature.geometry.coordinates as [number, number],
          }));
          setResults(mapped);
          setShowResults(mapped.length > 0);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [userLocation]
  );

  const handleChangeText = (text: string) => {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  };

  const handleSelectResult = (result: SearchResult) => {
    setQuery(result.name);
    setShowResults(false);
    setResults([]);
    Keyboard.dismiss();
    onSelectResult(result.coordinates, result.name);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    Keyboard.dismiss();
    onClear();
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <ShinyWrapper borderRadius={16} borderWidth={1.5} backgroundColor="rgba(26, 27, 46, 0.92)" style={styles.inputContainerOuter}>
        <View style={styles.inputContainerInner}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search places..."
            placeholderTextColor="#5A5E6D"
            value={query}
            onChangeText={handleChangeText}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isSearching && <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />}
          {query.length > 0 && !isSearching && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </ShinyWrapper>

      {/* Results Dropdown */}
      {showResults && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.resultItem,
                  index === results.length - 1 && styles.resultItemLast,
                ]}
                onPress={() => handleSelectResult(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.resultIcon}>📍</Text>
                <View style={styles.resultText}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.resultAddress} numberOfLines={1}>
                    {item.fullAddress}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  inputContainerOuter: {
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    flex: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    paddingVertical: 0,
  },
  spinner: {
    marginLeft: 8,
  },
  clearBtn: {
    marginLeft: 8,
    padding: 4,
  },
  clearText: {
    color: '#8E99A4',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 6,
    backgroundColor: 'rgba(26, 27, 46, 0.95)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    overflow: 'hidden',
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 45, 58, 0.6)',
  },
  resultItemLast: {
    borderBottomWidth: 0,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 12,
    color: '#8E99A4',
  },
});
