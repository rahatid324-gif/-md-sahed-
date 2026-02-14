
export enum SignalAction {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD'
}

export interface MarketSignal {
  timestamp: string;
  asset: string;
  timeframe: string;
  action: SignalAction;
  confidence: number;
  reasoning: string;
  price: number;
}

export interface PricePoint {
  time: string;
  price: number;
}

export enum MarketType {
  CRYPTO = 'CRYPTO',
  FOREX = 'FOREX'
}
