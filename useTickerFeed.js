import { effectScope, onScopeDispose, ref, watch, computed } from 'vue'

type TickerMsg = { symbol: string; price: number }

export function useTickerFeed() {
  // 不要把 scope 直接建在模块顶层：每次调用都应独立
  let scope: ReturnType<typeof effectScope> | null = null

  // 暴露给外部的状态（注意：这些 ref 在 scope 外创建也可以，但副作用要进 scope）
  const connected = ref(false)
  const last = ref<TickerMsg | null>(null)
  const symbols = ref<string[]>(['AAPL', 'TSLA'])

  // 一些派生状态
  const latestPriceMap = computed(() => {
    const m = new Map<string, number>()
    if (last.value) m.set(last.value.symbol, last.value.price)
    return m
  })

  function start() {
    if (scope) return // 已经启动，防重复

    scope = effectScope(true) // detached：不依赖当前组件 scope（可在组件外使用）
    scope.run(() => {
      const ws = new WebSocket('wss://example.com/ticker')

      const onOpen = () => {
        connected.value = true
        ws.send(JSON.stringify({ type: 'sub', symbols: symbols.value }))
      }

      const onClose = () => {
        connected.value = false
      }

      const onMessage = (ev: MessageEvent) => {
        const msg = JSON.parse(ev.data) as TickerMsg
        last.value = msg
      }

      ws.addEventListener('open', onOpen)
      ws.addEventListener('close', onClose)
      ws.addEventListener('message', onMessage)

      // 当 symbols 改变时，自动更新订阅（watch 属于副作用，必须被 scope 托管）
      const stopWatch = watch(
        symbols,
        (next) => {
          if (connected.value) {
            ws.send(JSON.stringify({ type: 'sub', symbols: next }))
          }
        },
        { deep: true }
      )

      // 统一清理：stopWatch、ws 监听、ws 连接
      onScopeDispose(() => {
        stopWatch()
        ws.removeEventListener('open', onOpen)
        ws.removeEventListener('close', onClose)
        ws.removeEventListener('message', onMessage)

        // 断开连接（避免后台继续推数据）
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close()
        }

        connected.value = false
      })
    })
  }

  function stop() {
    scope?.stop()
    scope = null
  }

  return {
    // state
    connected,
    last,
    symbols,
    latestPriceMap,
    // controls
    start,
    stop,
  }
}