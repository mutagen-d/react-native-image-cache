# React Native Image Cache
Caching images to disk

## Installation
This package depends on [`rn-fetch-blob`](https://github.com/joltup/rn-fetch-blob). First [install](https://github.com/joltup/rn-fetch-blob#user-content-installation) it

```bash
npm i @mutagen-d/react-native-image-cache
// or
yarn add @mutagen-d/react-native-image-cache
```

## Usage

`ImageCache` inherits all methods of `RNFileCache` from [`@mutagen-d/react-native-file-cache`](https://github.com/mutagen-d/react-native-file-cache)

```typescript
import React, { useEffect } from 'react'
import ImageCache from '@mutagen-d/react-native-image-cache'

const App = () => {
  useEffect(() => {
    const load = async () => {
      await ImageCache.load()
    }
    load()
  }, [])
  return <ImageCache
    source={{
      uri: 'https://example.com/image.png',
      headers: { Authorization: 'Bearer <token>' },
    }}
  />
}
```