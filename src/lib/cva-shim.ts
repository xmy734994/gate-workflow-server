// Shim for class-variance-authority
// This provides a simple fallback for when the actual package fails to load

export type VariantProps<C extends (args: any) => string> = Parameters<C>[0];

export function cva(base: string, config?: any): (props?: any) => string {
  return (props: any = {}) => {
    let classes = base;
    if (props?.class) {
      classes += ' ' + props.class;
    }
    return classes;
  };
}

export default cva;
