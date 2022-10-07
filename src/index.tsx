import { useRef, useCallback, useEffect, useState } from 'react'

export type IotaSelf<P, S, M, R> = IotaOwnArgs<P, S, M, R> & {
  setState: (state: Partial<S>) => void
  prevProps: P
  state: S
} & Omit<M, keyof IotaOwnArgs<P, S, M, R>>

export type IotaOwnArgs<P, S, M, R> = {
  props?: P
  didMount?: (self: IotaSelf<P, S, M, R>) => any
  willUnmount?: (self: IotaSelf<P, S, M, R>) => void
  init?: (self: IotaSelf<P, S, M, R>) => any
  shouldUpdate?: (self: IotaSelf<P, S, M, R>) => boolean
  render?: (self: IotaSelf<P, S, M, R>) => R
  didUpdate?: (self: IotaSelf<P, S, M, R>) => any
}

export type AddSelfParam<T, S> = {
  [P in keyof T]: AppendSelfArg<T[P], S>
};

type AppendSelfArg<F, S> = F extends (...args: infer P) => infer R ? (self: S, ...args: P) => R : never;

export type IotaArgs<P, S, M, R> = IotaOwnArgs<P, S, M, R> & AddSelfParam<Omit<M, keyof IotaOwnArgs<P, S, M, R>>, IotaSelf<P, S, M, R>>

function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


const shallowEqual = (newObj: object, prevObj: object): boolean => {
  for (const key in newObj) {
    if (newObj?.[key] !== prevObj?.[key]) return false;
  }
  return true;
}

export const useIota = <P, S, M = {}, R = any>(args: IotaArgs<P, S, M, R>) => {
  const {
    props = {},
    init,
    didMount,
    willUnmount,
    shouldUpdate,
    didUpdate,
    render,
    ...customMethods
  } = args

  const [mounted, setMounted] = useState<boolean>(false)

  const selfRef = useRef<any>({});

  if (!mounted) {
    selfRef.current = {
      props,
      state: {},
    }
    for (const methodName in customMethods) {
      selfRef.current[methodName] = (...args) => customMethods[methodName](selfRef.current, ...args)
    }
    init?.(selfRef.current)
  }

  const [_state, _setState] = useState<any>(selfRef.current.state)
  const prevProps = usePrevious(props)
  const _prevState = usePrevious(_state)


  const setState = useCallback((newState) => {
    _setState((state) => ({ ...state, ...newState }))
  }, [_setState])


  if (mounted) {
    selfRef.current.state = _state
    selfRef.current.props = props
    selfRef.current.setState = setState
  }


  useEffect(() => {
    setMounted(true)
    didMount?.(selfRef.current)
    return () => {
      willUnmount?.(selfRef.current)
    }
  }, [setMounted, didMount, selfRef, willUnmount])


  useEffect(() => {
    const isPropsEqual = shallowEqual(props, prevProps)
    if (mounted && !isPropsEqual) {
      didUpdate?.({ ...selfRef.current, props, prevProps, prevState: _prevState })
    }
  }, [props, prevProps, _state, _prevState, didUpdate, mounted])


  const shouldWeUpdate = shouldUpdate?.(selfRef.current) ?? true
  const renderRef = useRef<R>(null)


  if (shouldWeUpdate || !mounted) {
    renderRef.current = render?.(selfRef.current)
  }

  return renderRef.current
}


const createIota = <P, S, M = {}, R = any>(args: IotaArgs<P, S, M, R>): any => {
  return (props: P) => {
    return useIota<P, S, M, R>({ props, ...args })
  }
}

export default createIota