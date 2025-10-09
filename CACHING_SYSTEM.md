# Food Rush Delivery App - Caching System Documentation

## Overview

The Food Rush Delivery Driver app implements a comprehensive caching system to improve performance, reduce network requests, and provide offline capabilities. The caching system uses multiple storage mechanisms and strategies.

## Caching Mechanisms

### 1. AsyncStorage (Persistent Storage)

**Location**: Used throughout the app for persistent data storage

**What's Cached**:
- **Authentication Tokens** (`auth_token`)
- **User Preferences** (theme, language)
- **Location Data** (`@location_cache`)
- **Push Notification Tokens** (`expo_push_token`)

**Files**:
- `src/contexts/AuthContext.tsx`
- `src/contexts/ThemeContext.tsx`
- `src/contexts/LanguageContext.tsx`
- `src/services/locationService.ts`
- `src/services/notificationService.ts`

### 2. In-Memory API Cache

**Location**: `src/services/api.ts`

**Implementation**: Custom `CacheManager` class with Map-based storage

**Features**:
- Configurable cache duration (default: 5 minutes)
- Automatic cache invalidation
- Pattern-based cache clearing
- Request deduplication
- Cache hit/miss logging

**Cached Endpoints**:
```typescript
// User profile (10 minutes)
/auth/me - { cache: true, cacheDuration: 10 * 60 * 1000 }

// Rider account (default 5 minutes)
/riders/my/account - { cache: true }

// Rider status (30 seconds)
/riders/status - { cache: true, cacheDuration: 30 * 1000 }

// Current deliveries (30 seconds)
/riders/deliveries/current - { cache: true, cacheDuration: 30 * 1000 }

// Delivery history (default 5 minutes)
/riders/deliveries/history - { cache: true }

// Earnings (default 5 minutes)
/riders/earnings - { cache: true }

// Nearby restaurants (default 5 minutes)
/restaurants/nearby - { cache: true }
```

### 3. Location Service Cache

**Location**: `src/services/locationService.ts`

**Features**:
- Caches last known location for 30 minutes
- Reduces GPS requests on app startup
- Provides fallback location when GPS is unavailable
- Automatic cache invalidation based on age

**Cache Key**: `@location_cache`

**Cache Structure**:
```typescript
{
  latitude: number,
  longitude: number,
  accuracy?: number,
  timestamp: number,
  altitude?: number,
  heading?: number,
  speed?: number,
  cachedAt: number
}
```

## Cache Management

### Automatic Cache Clearing

**Authentication Changes**:
- Login/logout clears auth-related cache
- Token expiration triggers cache cleanup
- Failed authentication removes cached tokens

**Pattern-Based Clearing**:
```typescript
// Clear all auth-related cache
apiService.clearCache('auth');

// Clear rider-specific cache
apiService.clearCache('rider');

// Clear delivery-related cache
apiService.clearCache('delivery');
```

### Cache Configuration

**Per-Request Configuration**:
```typescript
// Enable caching with custom duration
const response = await apiService.get('/endpoint', {
  cache: true,
  cacheDuration: 60 * 1000 // 1 minute
});

// Disable caching for specific request
const response = await apiService.get('/endpoint', {
  cache: false
});
```

### Request Deduplication

The cache system prevents duplicate requests by maintaining a request queue:
- Multiple simultaneous requests to the same endpoint return the same promise
- Reduces server load and improves performance
- Automatic cleanup after request completion

## Cache Performance Benefits

### 1. Reduced Network Requests
- API responses cached for appropriate durations
- Location data cached to reduce GPS usage
- User preferences stored locally

### 2. Improved App Startup
- Cached location provides immediate map positioning
- Stored auth tokens enable automatic login
- Cached user preferences applied instantly

### 3. Offline Capabilities
- Last known location available offline
- User preferences persist without network
- Auth tokens stored for session restoration

### 4. Battery Optimization
- Reduced GPS polling through location caching
- Fewer network requests save battery
- Efficient data storage mechanisms

## Cache Invalidation Strategies

### Time-Based Invalidation
- Default 5-minute cache for most API responses
- 30-second cache for real-time data (deliveries, status)
- 10-minute cache for user profile data
- 30-minute cache for location data

### Event-Based Invalidation
- Authentication changes clear auth cache
- Status updates clear rider cache
- Delivery actions clear delivery cache
- Location updates refresh location cache

### Manual Cache Control
```typescript
// Clear all cache
apiService.clearCache();

// Clear specific pattern
apiService.clearCache('auth');

// Clear location cache
locationService.clearLocationCache();
```

## Best Practices

### 1. Cache Duration Guidelines
- **Real-time data**: 30 seconds or less
- **User data**: 5-10 minutes
- **Static data**: 30+ minutes
- **Location data**: 30 minutes max

### 2. Cache Key Strategy
- Include relevant parameters in cache keys
- Use consistent naming patterns
- Consider user-specific cache separation

### 3. Error Handling
- Graceful fallback when cache fails
- Automatic retry on cache miss
- Clear invalid cache entries

### 4. Memory Management
- Automatic cache size limits
- Periodic cleanup of expired entries
- Pattern-based bulk clearing

## Monitoring and Debugging

### Cache Status Logging
```typescript
// Enable cache debugging
Logger.debug(`Cache hit: ${url}`);
Logger.debug(`Cache miss: ${url}`);
```

### Cache Statistics
- Hit/miss ratios tracked
- Cache size monitoring
- Performance impact measurement

## Future Improvements

### Potential Enhancements
1. **Cache Size Limits**: Implement LRU eviction
2. **Compression**: Compress large cached responses
3. **Encryption**: Encrypt sensitive cached data
4. **Background Sync**: Sync cache with server in background
5. **Cache Warming**: Pre-load frequently accessed data

### Performance Monitoring
1. **Cache Metrics**: Track hit rates and performance
2. **Storage Usage**: Monitor AsyncStorage usage
3. **Network Savings**: Measure reduced requests
4. **Battery Impact**: Track power consumption improvements

## Conclusion

The caching system provides significant performance benefits while maintaining data freshness and reliability. The multi-layered approach ensures optimal user experience across different network conditions and device capabilities.