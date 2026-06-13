import Link, { type LinkProps } from 'next/link';
import { styled } from 'styled-system/jsx';

import { button } from '@/styled-system/recipes';

import type { ComponentProps } from 'styled-system/types';

const StyledLink = styled(Link, button);

type StyledLinkProps = ComponentProps<typeof StyledLink>;
type Href<T extends string = string> = LinkProps<T>['href'];

type LinkButtonProps<T extends string> = Omit<StyledLinkProps, 'href'> & {
  href: Href<T>;
};

/**
 * Next.js Link にボタンレシピのスタイルを適用したコンポーネント。
 * Button と同じ variant / status / size バリアントが使える。
 */
export const LinkButton = <T extends string>({
  href,
  ...rest
}: LinkButtonProps<T>) => {
  return <StyledLink href={href as StyledLinkProps['href']} {...rest} />;
};
