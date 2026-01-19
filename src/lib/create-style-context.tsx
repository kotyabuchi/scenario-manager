'use client';

import {
  createContext,
  type ElementType,
  type ForwardRefExoticComponent,
  forwardRef,
  type PropsWithoutRef,
  type RefAttributes,
  useContext,
} from 'react';

type SlotRecipeFn = (props?: Record<string, unknown>) => Record<string, string>;

type StyleContextValue = Record<string, string>;

const StyleContext = createContext<StyleContextValue | null>(null);

/**
 * propsからバリアント用のプリミティブ値のみを抽出する
 * （children, onXxx等のReact特有のpropsを除外）
 */
const extractVariantProps = (
  props: Record<string, unknown>,
): Record<string, unknown> => {
  const variantProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    // プリミティブ値のみを抽出（string, number, boolean, undefined, null）
    // children, イベントハンドラ、オブジェクト等は除外
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === undefined ||
      value === null
    ) {
      variantProps[key] = value;
    }
  }
  return variantProps;
};

export const createStyleContext = <T extends SlotRecipeFn>(recipe: T) => {
  const useStyleContext = () => {
    const context = useContext(StyleContext);
    if (!context) {
      throw new Error(
        'useStyleContext must be used within a StyleContext.Provider',
      );
    }
    return context;
  };

  const withProvider = <
    TRef,
    TProps extends { className?: string | undefined },
  >(
    Component: ElementType,
    slot: string,
  ): ForwardRefExoticComponent<
    PropsWithoutRef<TProps> & RefAttributes<TRef>
  > => {
    const StyledComponent = forwardRef<TRef, TProps>((props, ref) => {
      const { className, ...rest } = props;
      const variantProps = extractVariantProps(rest as Record<string, unknown>);
      const styles = recipe(variantProps as Parameters<T>[0]);
      const slotClassName = styles[slot];

      return (
        <StyleContext.Provider value={styles}>
          <Component
            ref={ref}
            className={
              className ? `${slotClassName} ${className}` : slotClassName
            }
            {...rest}
          />
        </StyleContext.Provider>
      );
    });

    StyledComponent.displayName = `Styled${(Component as { displayName?: string; name?: string }).displayName || (Component as { name?: string }).name || 'Component'}`;
    return StyledComponent as ForwardRefExoticComponent<
      PropsWithoutRef<TProps> & RefAttributes<TRef>
    >;
  };

  const withContext = <TRef, TProps extends { className?: string | undefined }>(
    Component: ElementType,
    slot: string,
  ): ForwardRefExoticComponent<
    PropsWithoutRef<TProps> & RefAttributes<TRef>
  > => {
    const StyledComponent = forwardRef<TRef, TProps>((props, ref) => {
      const { className, ...rest } = props;
      const styles = useStyleContext();
      const slotClassName = styles[slot];

      return (
        <Component
          ref={ref}
          className={
            className ? `${slotClassName} ${className}` : slotClassName
          }
          {...rest}
        />
      );
    });

    StyledComponent.displayName = `Styled${(Component as { displayName?: string; name?: string }).displayName || (Component as { name?: string }).name || 'Component'}`;
    return StyledComponent as ForwardRefExoticComponent<
      PropsWithoutRef<TProps> & RefAttributes<TRef>
    >;
  };

  return {
    withProvider,
    withContext,
  };
};
