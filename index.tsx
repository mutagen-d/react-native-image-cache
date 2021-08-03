import React from 'react'
import { ActivityIndicator, Image, ImageProps } from 'react-native'
import { RNFileCache, ImageURISource } from '@mutagen-d/react-native-file-cache'

export * from '@mutagen-d/react-native-file-cache'

export type ImageCacheProps = Omit<ImageProps, 'source' | 'onProgress'> & {
  source: ImageURISource
  onProgress?: (loaded: number, total: number) => any
  onLoad?: (file?: any) => void
  onError?: (error: any) => void
  onLoadEnd?: () => void
  onCancel?: () => void
  placeholder?: () => JSX.Element
  children?: (source?: ImageURISource) => JSX.Element
  dirName?: string
}

export type ImageCacheState = {
  loading?: boolean
  source?: ImageURISource
  ready?: boolean
}

class ImageCache extends React.Component<ImageCacheProps, ImageCacheState> {
  private static defaultProps: Partial<ImageCacheProps> = {
    onProgress: (loaded: number, total: number) => null,
    onLoad: () => null,
    onError: (error: any) => null,
    onLoadEnd: () => null,
    onCancel: () => null,
    placeholder: () => <ActivityIndicator />,
    dirName: 'rn-file-cache',
  }

  private componentId: string

  static exists = RNFileCache.exists
  static set maxSize(maxSize: number) { RNFileCache.maxSize = maxSize; }
  static get maxSize() { return RNFileCache.maxSize }
  static setClearingRatio = RNFileCache.getClearingRatio
  static getClearingRatio = RNFileCache.setClearingRatio
  static load = RNFileCache.load
  static isReady = RNFileCache.isReady
  static onReady = RNFileCache.onReady
  static get totalSize() { return RNFileCache.totalSize };
  static lock = RNFileCache.lock
  static unlock = RNFileCache.unlock
  static isRemoving = RNFileCache.isRemoving
  static onRemoved = RNFileCache.onRemoved
  static getPath = RNFileCache.getPath
  static getSource = RNFileCache.getSource
  static remove = RNFileCache.remove
  static removeFile = RNFileCache.removeFile
  static pruneCache = RNFileCache.pruneCache
  static removeAll = RNFileCache.removeAll
  static isInternetURL = RNFileCache.isInternetURL
  static isEqual = RNFileCache.isEqual
  static download = RNFileCache.download
  static cancelDownload = RNFileCache.cancelDownload

  constructor(props: ImageCacheProps) {
    super(props)
    this.state = {
      ready: RNFileCache.isReady(),
    }
    this.componentId = `${Math.floor(Math.random() * 1e10)}-${Date.now()}`
  }

  componentDidMount() {
    if (RNFileCache.isReady()) {
      this.setState({ ready: true })
      this.setSource()
    } else {
      RNFileCache.onReady(() => {
        this.setState({ ready: true })
        this.setSource()
      })
    }
  }

  componentDidUpdate(prevProps: ImageCacheProps) {
    const { ready } = this.state
    if (!ready) {
      return
    }
    const { source, dirName } = this.props
    if (RNFileCache.isReady()
      && (
        !RNFileCache.isEqual(source, prevProps.source)
        || dirName != prevProps.dirName
      )
    ) {
      this.setSource()
    }
  }

  componentWillUnmount() {
    RNFileCache.unlock(this.componentId)
  }

  private setSource() {
    const { source, dirName } = this.props
    if (!RNFileCache.isInternetURL(source && source.uri)) {
      if (this.state.source !== source) {
        this.setState({ source, loading: false })
      }
      RNFileCache.unlock(this.componentId)
      return
    }
    const { uri: url } = source
    const path = RNFileCache.getPath(url, dirName)
    if (RNFileCache.isRemoving(path)) {
      // wait file deletion
      RNFileCache.onRemoved(path, this.onRemove)
      return
    } else if (RNFileCache.exists(url)) {
      // set local source
      RNFileCache.lock(this.componentId, path)
      this.setState({ source: RNFileCache.getSource(path), loading: false })
      return
    }
    // download file
    const { method = 'GET', headers = {}, body = null } = source
    RNFileCache.download({
      url,
      method,
      headers,
      body,
      dirName,
      onProgress: this.onProgress,
      onLoad: this.onLoad,
      onError: this.onError,
      onCancel: this.onCancel,
      onLoadEnd: this.onLoadEnd,
    }).catch(e => {
      this.onError(e)
      this.setState({ loading: false })
    })
    this.setState({ loading: true })
  }

  private onRemove = (error?: any) => {
    this.setSource()
  }

  public cancelDownload = () => {
    const { source } = this.props
    if (RNFileCache.isInternetURL(source && source.uri)) {
      RNFileCache.cancelDownload(source.uri).catch(e => {
        this.onError(e)
      })
    }
  }

  private onLoad = (file: any) => {
    RNFileCache.lock(this.componentId, file.path)
    this.setState({ source: RNFileCache.getSource(file.path) })

    const { onLoad } = this.props
    onLoad && onLoad(file)
  }
  private onError = (error: any) => {
    const { onError } = this.props
    onError && onError(error)
  }
  private onProgress = (loaded: number, total: number) => {
    const { onProgress } = this.props
    onProgress && onProgress(loaded, total)
  }
  private onLoadEnd = () => {
    this.setState({ loading: false })

    const { onLoadEnd } = this.props
    onLoadEnd && onLoadEnd()
  }
  private onCancel = () => {
    this.setState({ loading: false })

    const { onCancel } = this.props
    onCancel && onCancel()
  }

  private renderPlaceholder() {
    const { placeholder } = this.props
    if (typeof placeholder == 'function') {
      return placeholder()
    }
    return <ActivityIndicator />
  }

  private renderImage() {
    const { children } = this.props
    if (typeof children == 'function') {
      return children(this.state.source)
    }
    return <Image {...this.getImageProps()} />
  }
  private getImageProps() {
    const {
      children,
      onLoad,
      onError,
      onProgress,
      onLoadEnd,
      onCancel,
      placeholder,
      source,
      dirName,
      ...imageProps
    } = this.props
    return {
      ...imageProps,
      source: this.state.source,
    } as Readonly<ImageProps>
  }

  render() {
    const { loading, ready } = this.state
    if (loading || !ready) {
      return this.renderPlaceholder()
    }
    return this.renderImage()
  }
}

export default ImageCache
