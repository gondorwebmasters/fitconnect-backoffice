import type { ComponentType } from 'react';

import { useRef, useEffect } from 'react';

// ----------------------------------------------------------------------

/**
 * Wraps a component factory that needs a live read of the latest props
 * inside a callback created once (e.g. `next/dynamic`'s `loading` option,
 * which captures props at mount time). `getComponent` receives a stable
 * `() => props` getter instead of `props` directly, so the callback always
 * reads the current value.
 */
export function withLoadingProps<P extends object>(
  getComponent: (getProps: () => P) => ComponentType<P>
) {
  return function WithLoadingProps(props: P) {
    const propsRef = useRef(props);
    propsRef.current = props;

    const ComponentRef = useRef<ComponentType<P> | null>(null);
    if (!ComponentRef.current) {
      ComponentRef.current = getComponent(() => propsRef.current);
    }

    useEffect(() => {
      propsRef.current = props;
    });

    const Component = ComponentRef.current;
    return <Component {...props} />;
  };
}
