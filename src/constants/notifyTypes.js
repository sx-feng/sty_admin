// Shared notification type definitions for consistent Chinese labels and metadata.

const audioSources = {
  USER_RECHARGE: new URL('../assets/audio/notify-recharge.mp3', import.meta.url).href,
  USER_WITHDRAWAL: new URL('../assets/audio/notify-withdrawal.mp3', import.meta.url).href,
  USER_PURCHASE: new URL('../assets/audio/notify-purchase.mp3', import.meta.url).href,
  USER_CONNECTED: new URL('../assets/audio/user-online.mp3', import.meta.url).href,
  USER_DISCONNECTED: new URL('../assets/audio/user-offline.mp3', import.meta.url).href,
  FINANCIAL_TRANSFER_OUT: new URL('../assets/audio/financial-transfer-out.mp3', import.meta.url).href,
  CONTACT_SUPPORT: new URL('../assets/audio/contact-support.mp3', import.meta.url).href,
}

const definitions = [
  {
    value: 'USER_RECHARGE',
    label: '充值通知',
    shortLabel: '充值',
    speech: '您有新的充值通知，请注意确认。',
    audio: audioSources.USER_RECHARGE
  },
  {
    value: 'USER_WITHDRAWAL',
    label: '提现通知',
    shortLabel: '提现',
    speech: '收到提现提醒，请及时处理。',
    audio: audioSources.USER_WITHDRAWAL
  },
  {
    value: 'USER_PURCHASE',
    label: '下单通知',
    shortLabel: '下单',
    speech: '用户下单通知，请及时跟进订单。',
    audio: audioSources.USER_PURCHASE
  },
  {
    value: 'USER_CONNECTED',
    label: '用户上线',
    shortLabel: '上线',
    speech: '有用户刚刚上线。',
    audio: audioSources.USER_CONNECTED
  },
  {
    value: 'USER_DISCONNECTED',
    label: '用户下线',
    shortLabel: '下线',
    speech: '有用户刚刚下线。',
    audio: audioSources.USER_DISCONNECTED
  },
  {
    value: 'FINANCIAL_TRANSFER_IN',
    label: '理财转入',
    shortLabel: '转入',
    speech: '用户发起理财转入，请尽快审核。'
  },
  {
    value: 'FINANCIAL_TRANSFER_OUT',
    label: '理财转出',
    shortLabel: '转出',
    speech: '用户发起理财转出，请及时关注。',
    audio: audioSources.FINANCIAL_TRANSFER_OUT
  },
  {
    value: 'CONTACT_SUPPORT',
    label: '客服请求',
    shortLabel: '客服',
    speech: '有用户请求人工客服支援。',
    audio: audioSources.CONTACT_SUPPORT
  }
]

export const notifyTypeDefs = definitions

export const notifyTypeMap = Object.fromEntries(definitions.map(item => [item.value, item]))

export const DEFAULT_NOTIFY_LABEL = '事件通知'
export const DEFAULT_NOTIFY_SHORT_LABEL = '事件'
export const DEFAULT_NOTIFY_SPEECH = '您有新的通知，请注意查看。'

export function getNotifyLabel(type) {
  return notifyTypeMap[type]?.label || DEFAULT_NOTIFY_LABEL
}

export function getNotifyShortLabel(type) {
  return notifyTypeMap[type]?.shortLabel || DEFAULT_NOTIFY_SHORT_LABEL
}

export function getNotifySpeech(type, fallback) {
  if (notifyTypeMap[type]?.speech) return notifyTypeMap[type].speech
  if (fallback) return fallback
  return DEFAULT_NOTIFY_SPEECH
}

export function getNotifyAudio(type) {
  return notifyTypeMap[type]?.audio || null
}

const notifyMessageBuilders = {
  USER_RECHARGE: (payload) => {
    const source = payload?.data || payload || {}
    const user = source.user || source.nickName || source.phone || payload?.user || payload?.nickName || payload?.phone || '未知用户'
    const amount = source.amount ?? payload?.amount
    const currency = source.currency || 'USDT'
    if (amount !== undefined) return `${user} 充值 ${amount} ${currency}`
    return `${user} 发起充值`
  },
  USER_WITHDRAWAL: (payload) => {
    const source = payload?.data || payload || {}
    const user = source.user || source.nickName || source.phone || payload?.user || payload?.nickName || payload?.phone || '未知用户'
    const amount = source.amount ?? payload?.amount
    const currency = source.currency || 'USDT'
    if (amount !== undefined) return `${user} 提现 ${amount} ${currency}`
    return `${user} 发起提现`
  },
  USER_PURCHASE: (payload) => {
    const source = payload?.data || payload || {}
    const user = source.user || source.nickName || source.phone || payload?.user || payload?.nickName || payload?.phone || '未知用户'
    const product = source.productName || source.product || payload?.productName || '未知产品'
    const amount = source.amount ?? payload?.amount
    const currency = source.currency || 'USDT'
    if (amount !== undefined) return `${user} 购买了 ${product}（金额：${amount} ${currency}）`
    return `${user} 购买了 ${product}`
  },
  USER_CONNECTED: (payload) => {
    const source = payload?.data || payload || {}
    const user = source.user || source.nickName || source.userId || source.uid || payload?.user || payload?.userId || '未知用户'
    return `用户 ${user} 已上线`
  },
  USER_DISCONNECTED: (payload) => {
    const source = payload?.data || payload || {}
    const user = source.user || source.nickName || source.userId || source.uid || payload?.user || payload?.userId || '未知用户'
    return `用户 ${user} 已下线`
  },
  FINANCIAL_TRANSFER_IN: (payload) => {
    const source = payload?.data || payload || {}
    const user = source.user || source.nickName || source.userId || payload?.user || payload?.userId || '未知用户'
    const amount = source.amount ?? payload?.amount
    const currency = source.currency || 'USDT'
    if (amount !== undefined) return `${user} 理财转入 ${amount} ${currency}`
    return `${user} 发起理财转入`
  },
  FINANCIAL_TRANSFER_OUT: (payload) => {
    const source = payload?.data || payload || {}
    const user = source.user || source.nickName || source.userId || payload?.user || payload?.userId || '未知用户'
    const amount = source.amount ?? payload?.amount
    const currency = source.currency || 'USDT'
    if (amount !== undefined) return `${user} 理财转出 ${amount} ${currency}`
    return `${user} 发起理财转出`
  },
  CONTACT_SUPPORT: (payload) => {
    const source = payload?.data || payload || {}
    const user = source.nickName || source.user || source.phone || source.uid || payload?.user || payload?.userId || '未知用户'
    return `${user} 请求人工客服支援`
  }
}

export function formatNotifyMessage(type, payload, fallbackMessage) {
  const builder = notifyMessageBuilders[type]
  if (builder) {
    const built = builder(payload)
    if (built) return built
  }
  if (fallbackMessage) return fallbackMessage
  if (payload && typeof payload.message === 'string' && payload.message.trim()) return payload.message
  if (typeof payload === 'string') return payload
  return getNotifyLabel(type || '')
}
