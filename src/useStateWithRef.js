import { useState, useRef, useEffect } from "react";

/**
 * Like useState but also returns a ref that stays in sync.
 * Eliminates the `const xRef = useRef(x); useEffect(()=>{xRef.current=x},[x])` boilerplate.
 *
 * Returns [value, setValue, ref]
 */
export default function useStateWithRef(initial) {
  const [value, setValue] = useState(initial);
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return [value, setValue, ref];
}
